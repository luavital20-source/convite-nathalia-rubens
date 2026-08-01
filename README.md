# Convite — Nathalia & Rubens

Convite de casamento em página única, com lista de presentes e pagamento
**no cartão via PagBank (checkout transparente)** — o convidado paga sem sair
da página. O **Pix** continua funcionando 100% no navegador (BR Code).

```
index.html              → o convite (inclui a lista de presentes e os modais)
api/_presentes.js       → tabela OFICIAL de preços (usada pelo servidor)
api/_pagbank.js         → utilidades (URL base + token do PagBank)
api/chave-publica.js    → entrega a chave pública p/ criptografar o cartão
api/criar-pagamento.js  → cria e paga o pedido no PagBank
api/webhook.js          → recebe notificações de pagamento (Logs da Vercel)
```

---

## Colocar no ar (Vercel)

### 1. Importar o repositório

Em [vercel.com/new](https://vercel.com/new), importe este repositório.
Não há build: é site estático + funções em `api/` (Framework Preset: **Other**).

### 2. Configurar a credencial — **único passo obrigatório**

No painel do PagBank, em **Aplicações → sua aplicação → Chaves de API**,
copie o **Token** (a chave secreta) de produção.

Na Vercel, vá em **Settings → Environment Variables** e adicione **só isto**:

| Nome | Valor | Ambientes |
|---|---|---|
| `PAGBANK_TOKEN` | o token (chave secreta) do PagBank | Production, Preview, Development |

Depois **Deployments → Redeploy**, para as funções enxergarem a variável.

> **`PAGBANK_ENV` é opcional.** Sem ela, o sistema já usa **produção**.
> Só adicione `PAGBANK_ENV = sandbox` se quiser testar com token de teste
> (ver seção "Testar antes de divulgar"). Não é uma credencial — é apenas
> um interruptor produção/sandbox.

> Pronto. A partir daqui os botões **Cartão** já funcionam.

### 3. (Opcional) Notificações de pagamento

No painel do PagBank → **Webhooks / Notificações**, cadastre a URL:
`https://SEU-DOMINIO.vercel.app/api/webhook`

Os pagamentos e mudanças de status aparecem em **Vercel → Logs**. O webhook
não é necessário para cobrar — a aprovação já vem na resposta do pagamento.

---

## Como o pagamento no cartão funciona

1. O convidado toca em **Cartão** numa cota e preenche nome, CPF, e-mail e
   os dados do cartão.
2. O **navegador criptografa** o cartão (RSA) com a chave pública do PagBank
   (SDK oficial). Número e CVV **nunca passam pelo nosso servidor**.
3. O front envia ao `POST /api/criar-pagamento` apenas o **id da cota**, o
   cartão criptografado e os dados do pagador.
4. O servidor busca o preço em `api/_presentes.js`, cria o pedido no PagBank
   e devolve o resultado (aprovado / recusado) — tudo sem sair da página.

**Por que o preço não vai pelo navegador:** se o valor fosse enviado pelo
front, daria para trocá-lo pelo DevTools e pagar R$ 1 numa cota de R$ 5.000.
O valor cobrado vem sempre de `api/_presentes.js`.

### Parcelamento

O cartão é parcelável em até **6x** (constante `MAX_PARCELAS` em
`api/criar-pagamento.js` e no bloco `CARTÃO` do `index.html`). Eventuais juros
seguem as regras da sua conta PagBank.

### Ao mudar um preço

Altere nos **dois** lugares (a ordem precisa continuar batendo):

- `api/_presentes.js` → valor realmente cobrado (fonte de verdade)
- `index.html` → o `data-valor` do botão **Pix** daquela cota (exibição)

---

## Testar antes de divulgar

1. Gere um **token de sandbox** no PagBank e coloque em `PAGBANK_TOKEN`,
   com `PAGBANK_ENV = sandbox`.
2. Pague com um [cartão de teste do PagBank](https://developer.pagbank.com.br/docs/simulador-de-cartoes)
   (ex.: Visa `4111 1111 1111 1111`, validade futura, CVV `123`).
3. Confirme a aprovação na tela e o registro em **Vercel → Logs**.

Depois troque para o token de produção e `PAGBANK_ENV = production`, e faça redeploy.

---

## Pix

O botão **Pix** abre um modal com o código **"copia e cola"** (BR Code do
Banco Central) já com a chave e o **valor da cota embutidos**. É gerado no
próprio navegador, sem servidor e sem taxa de gateway. Os dados ficam no
`CONFIG` do `index.html` (`pixChave`, `pixTitular`, `pixCidade`).

## Confirmação de presença

O botão do RSVP abre o WhatsApp com a mensagem já escrita. Para trocar o
número, edite `whatsapp` no `CONFIG` do `index.html`.
