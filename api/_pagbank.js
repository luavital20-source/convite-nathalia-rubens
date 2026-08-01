/**
 * Utilidades compartilhadas da integração PagBank.
 *
 * Variáveis de ambiente (configurar na Vercel):
 *   PAGBANK_TOKEN  → token da API (Bearer). Obrigatório.
 *   PAGBANK_ENV    → 'production' (padrão) ou 'sandbox'.
 */

function baseUrl() {
  const env = (process.env.PAGBANK_ENV || 'production').toLowerCase();
  return env === 'sandbox'
    ? 'https://sandbox.api.pagseguro.com'
    : 'https://api.pagseguro.com';
}

function token() {
  return process.env.PAGBANK_TOKEN || '';
}

/** Lê o corpo da requisição, aceitando objeto (Vercel já parseia) ou string. */
function lerCorpo(req) {
  let corpo = req.body;
  if (typeof corpo === 'string') {
    try { corpo = JSON.parse(corpo); } catch { corpo = {}; }
  }
  return corpo || {};
}

module.exports = { baseUrl, token, lerCorpo };
