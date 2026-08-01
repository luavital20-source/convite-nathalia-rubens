/**
 * POST /api/criar-pagamento
 *
 * Cobra no cartão de crédito via PagBank (checkout transparente).
 * O cartão chega JÁ CRIPTOGRAFADO do navegador — este servidor nunca
 * vê número/CVV. O valor é buscado na tabela oficial do servidor, então
 * não dá para adulterar o preço pelo navegador.
 *
 * Entrada: {
 *   "id": 12,                 // id da cota
 *   "encrypted": "...",       // cartão criptografado (SDK do PagBank)
 *   "titular": "Jose da Silva",
 *   "cpf": "12345678909",
 *   "email": "jose@email.com",
 *   "telefone": "11999999999",  // opcional
 *   "parcelas": 1
 * }
 * Saída (ok):   { "status": "PAGO", "pedido_id": "ORDE_...", "cota": "Nome" }
 * Saída (erro): { "erro": "mensagem amigável" }
 *
 * Docs: https://developer.pagbank.com.br/reference/criar-pagar-pedido-com-cartao
 */

const { baseUrl, token, lerCorpo } = require('./_pagbank.js');
const { buscarPresente } = require('./_presentes.js');

const MAX_PARCELAS = 6; // parcelamento máximo oferecido no cartão

/** Mantém só dígitos (CPF, telefone). */
const digitos = (s) => String(s || '').replace(/\D/g, '');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  if (!token()) {
    console.error('[pagamento] PAGBANK_TOKEN ausente.');
    return res.status(500).json({ erro: 'Pagamento ainda não configurado.' });
  }

  const corpo = lerCorpo(req);

  // 1) Valida a cota e pega o preço OFICIAL (do servidor).
  const presente = buscarPresente(corpo.id);
  if (!presente) {
    return res.status(400).json({ erro: 'Presente não encontrado.' });
  }

  // 2) Valida os dados do pagador.
  const encrypted = String(corpo.encrypted || '');
  const titular = String(corpo.titular || '').trim();
  const cpf = digitos(corpo.cpf);
  const email = String(corpo.email || '').trim();
  const telefone = digitos(corpo.telefone);

  if (!encrypted) return res.status(400).json({ erro: 'Dados do cartão ausentes.' });
  if (titular.length < 3) return res.status(400).json({ erro: 'Informe o nome do titular.' });
  if (cpf.length !== 11) return res.status(400).json({ erro: 'CPF inválido.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ erro: 'E-mail inválido.' });

  let parcelas = Number(corpo.parcelas) || 1;
  if (!Number.isInteger(parcelas) || parcelas < 1) parcelas = 1;
  if (parcelas > MAX_PARCELAS) parcelas = MAX_PARCELAS;

  // 3) Monta o pedido. amount.value é em CENTAVOS.
  const valorCentavos = Math.round(presente.valor * 100);
  const refCurta = `cota-${presente.id}-${Date.now()}`;

  const pedido = {
    reference_id: refCurta,
    customer: {
      name: titular,
      email,
      tax_id: cpf,
    },
    items: [
      {
        reference_id: String(presente.id),
        name: presente.nome.slice(0, 100),
        quantity: 1,
        unit_amount: valorCentavos,
      },
    ],
    charges: [
      {
        reference_id: refCurta,
        description: `Presente — Nathalia & Rubens`.slice(0, 63),
        amount: { value: valorCentavos, currency: 'BRL' },
        payment_method: {
          type: 'CREDIT_CARD',
          installments: parcelas,
          capture: true,
          card: { encrypted, store: false },
          holder: { name: titular, tax_id: cpf },
        },
      },
    ],
  };

  if (telefone.length >= 10) {
    pedido.customer.phones = [
      {
        country: '55',
        area: telefone.slice(0, 2),
        number: telefone.slice(2),
        type: telefone.length > 10 ? 'MOBILE' : 'HOME',
      },
    ];
  }

  // Notifica nosso webhook (aparece nos Logs da Vercel).
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (host) {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    pedido.notification_urls = [`${proto}://${host}/api/webhook`];
  }

  // 4) Cria e paga o pedido no PagBank.
  try {
    const resposta = await fetch(`${baseUrl()}/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token()}`,
        'Content-Type': 'application/json',
        'x-idempotency-key': refCurta,
      },
      body: JSON.stringify(pedido),
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      // Erros de validação do PagBank (ex.: cartão recusado na criação).
      const msg =
        (dados.error_messages && dados.error_messages[0] && dados.error_messages[0].description) ||
        'Não foi possível processar o pagamento.';
      console.error('[pagamento] PagBank recusou:', resposta.status, JSON.stringify(dados));
      return res.status(400).json({ erro: msg });
    }

    const charge = (dados.charges && dados.charges[0]) || {};
    const status = charge.status; // PAID, DECLINED, IN_ANALYSIS, ...

    if (status === 'PAID') {
      return res.status(200).json({
        status: 'PAGO',
        pedido_id: dados.id,
        cota: presente.nome,
      });
    }

    // Recusado ou em análise: devolve a mensagem do PagBank.
    const resp = charge.payment_response || {};
    console.warn('[pagamento] Cobrança não aprovada:', status, JSON.stringify(resp));
    const amigavel =
      status === 'IN_ANALYSIS'
        ? 'Pagamento em análise. Você será avisado pelo banco.'
        : (resp.message || 'Cartão recusado. Confira os dados ou tente outro cartão.');
    return res.status(402).json({ erro: amigavel, status: status || 'RECUSADO' });
  } catch (err) {
    console.error('[pagamento] Falha ao chamar o PagBank:', err);
    return res.status(502).json({ erro: 'Não foi possível processar o pagamento agora.' });
  }
};
