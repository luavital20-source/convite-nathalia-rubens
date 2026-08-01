/**
 * GET /api/chave-publica
 *
 * Devolve a chave pública do PagBank para o navegador criptografar o
 * cartão (RSA) antes de enviá-lo. Assim os dados sensíveis do cartão
 * nunca passam pelo nosso servidor — reduz o escopo de PCI.
 *
 * Saída: { "public_key": "MIIBIjANBgkq..." }
 *
 * Docs: https://developer.pagbank.com.br/reference/criar-chave-publica
 */

const { baseUrl, token } = require('./_pagbank.js');

// Cache em memória enquanto a função estiver "quente" (a chave é estável).
let cache = null;

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  if (!token()) {
    console.error('[chave-publica] PAGBANK_TOKEN ausente.');
    return res.status(500).json({ erro: 'Pagamento ainda não configurado.' });
  }

  if (cache) return res.status(200).json({ public_key: cache });

  try {
    const resposta = await fetch(`${baseUrl()}/public-keys`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'card' }),
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok || !dados.public_key) {
      console.error('[chave-publica] PagBank recusou:', resposta.status, dados);
      return res.status(502).json({ erro: 'Não foi possível preparar o pagamento.' });
    }

    cache = dados.public_key;
    return res.status(200).json({ public_key: cache });
  } catch (err) {
    console.error('[chave-publica] Falha ao chamar o PagBank:', err);
    return res.status(502).json({ erro: 'Não foi possível preparar o pagamento.' });
  }
};
