# LANCE! MANUAL — "A MANUAL paga a sua festa"
### Pacote de implementação da Landing Page (campanha de indicação)

---

## O que é
Landing page **estática**: um `index.html` único + assets locais. **Sem build, sem framework, sem back-end pra subir.** É só hospedar a pasta.

## O que precisa ser feito (implementação)
1. Hospedar esta pasta (`index.html` + `/assets`) numa URL oficial da MANUAL (ex.: `manual.com.br/...`), **mantendo a estrutura de pastas**.
2. Servir por **HTTPS** (necessário pro autoplay do vídeo e pro envio do formulário).
3. Testar **1 envio do formulário** e confirmar que a linha cai na planilha.

> Para visualizar antes: o `index.html` abre direto no navegador (duplo clique).

## Back-end — JÁ ESTÁ NO AR (não precisa fazer nada)
- O formulário já está conectado a um **Google Apps Script → Google Sheets** na conta `alexandre@manual.co`.
- A URL do Web App **já está plugada** no `index.html` (`APPS_SCRIPT_URL`). **Não alterar.**
- Cada amigo indicado vira 1 linha na planilha (deduplicado por telefone). O time da MANUAL opera os pagamentos direto na planilha.
- O código do robô está em `backend-referencia/apps-script.gs` — **apenas referência**, já implantado.

## Como o formulário envia
- **POST** (`mode:no-cors`): os dados sensíveis (CPF, Pix, telefones) vão no **corpo** da requisição, nunca na URL.
- Como a resposta é opaca, o site mostra "sucesso otimista" — **recomendado monitorar a planilha** durante os 3 dias da promo.
- Validações no front: CPF, telefone (celular BR), dedup de telefone entre amigos, campos obrigatórios e consentimento (LGPD).
- No estado de sucesso, aparecem **botões de convite no WhatsApp** (1 por amigo), já pré-preenchidos com o número do amigo + mensagem + link com UTM.

## Links / UTMs (já configurados)
- **Convite WhatsApp** (botões do sucesso): `manual.com.br/queda-de-cabelo?utm_source=flashsale&utm_medium=whatsappindicado&utm_campaign=bancasuafesta` — UTM `whatsappindicado` p/ o time de dados rastrear o convite separado da LP.
- **Link MANUAL** (rodapé): `manual.com.br`.

## Config (único lugar pra editar — topo do `<script>` no `index.html`)
| Const | O que é |
|---|---|
| `APPS_SCRIPT_URL` | Back-end (Apps Script da MANUAL). **Não mexer.** |
| `UTM_LINK` | Link do convite no WhatsApp (com UTM). |
| `GAME_TIME` | Fim da promo: **24/06/2026 18h59** (alimenta o contador regressivo). |
| `REGULAMENTO_URL` | PDF do regulamento (`assets/regulamento.pdf`, abre no modal in-page). |
| `TOKEN` | Opcional (anti-spam). Vazio por padrão. |

## Dependências externas (carregadas em runtime via CDN)
- **Lenis + GSAP + ScrollTrigger** (unpkg/cdnjs) — efeitos de scroll. O **formulário funciona mesmo se o CDN cair** (é JS puro). Se preferir, dá pra auto-hospedar essas libs.
- **Google Fonts: Anton + Archivo** — são **PLACEHOLDERS**. Se a MANUAL quiser as fontes oficiais (TT Norms / NB International Pro), é só trocar o `<link>` das fontes e as variáveis `--font-d` / `--font-b` no CSS.

## ⚠️ Pendências de aval do jurídico (podem mudar antes do go-live)
1. **Cena de futebol** no vídeo do hero — confirmar que não há escudo/CBF nem camisa oficial da seleção.
2. **Nome oficial único** da campanha (o regulamento traz mais de um nome; o marketing usa "A MANUAL paga a sua festa").
3. **Campo "Banco/instituição"** — o §5.1 do regulamento diz que a LP coleta esse dado, mas o formulário só pede a Chave Pix (adicionar campo OU ajustar o regulamento).

## Datas da promo
- Indicações: **22/06 a 24/06 às 18h59**.
- Pix dos ganhadores: **até 30/06**.

## Preview (versão atual, referência visual)
https://lance-manual-paga-festa.netlify.app

---
Dúvidas técnicas: **Alexandre** (alexandre@manual.co).
