/**
 * POST /api/webhook
 *
 * Recebe as notificações de pagamento do PagBank e registra nos Logs
 * da Vercel. Não é obrigatório para cobrar — a cobrança já é confirmada
 * na resposta de /api/criar-pagamento — mas ajuda a acompanhar cada
 * pagamento (e mudanças de status posteriores) em Vercel → Logs.
 *
 * Docs: https://developer.pagbank.com.br/docs/webhooks
 */

const { lerCorpo } = require('./_pagbank.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const corpo = lerCorpo(req);
  const charge = (corpo.charges && corpo.charges[0]) || {};

  console.log('[webhook] Notificação PagBank:', JSON.stringify({
    pedido_id: corpo.id,
    reference_id: corpo.reference_id,
    status: charge.status,
    valor: charge.amount && charge.amount.value,
  }));

  // Responde 200 rápido para o PagBank não reenviar.
  return res.status(200).json({ recebido: true });
};
