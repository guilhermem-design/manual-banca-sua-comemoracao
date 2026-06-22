/**
 * ============================================================
 * LANCE! MANUAL  Flash Sale "A Manual paga sua conta do bar"
 * Backend de INDICACAO (referral)  Google Sheets
 * ============================================================
 * Mecanica: quem indica preenche os proprios dados + chave Pix +
 * o(s) telefone(s) do(s) amigo(s) indicado(s). Cada amigo que virar
 * cliente novo = R$200 no Pix de quem indicou (ate 30/06).
 *
 * Este Web App grava UMA LINHA POR AMIGO INDICADO e deduplica pelo
 * telefone do amigo (1 telefone por indicacao; se o mesmo telefone
 * for indicado 2x, vale quem indicou primeiro).
 *
 * ---- PUBLICAR (tem que estar logado como alexandre@manual.co) ----
 * 1. Em https://sheets.new (logado em alexandre@manual.co) crie a planilha.
 * 2. Extensoes > Apps Script. Cole este arquivo inteiro.
 * 3. Em CFG.SHEET_ID, cole o ID da planilha (na URL: /d/<ID>/edit).
 * 4. Implantar > Nova implantacao > Tipo "App da Web":
 *      - Executar como: Eu (alexandre@manual.co)
 *      - Quem pode acessar: Qualquer pessoa
 *        (NAO torna a planilha publica  so libera o ENVIO anonimo do form;
 *         a planilha continua privada, e este codigo nunca devolve os dados gravados)
 *    Autorize com a conta alexandre@manual.co.
 * O front envia por POST (no-cors): os dados vao no corpo, nunca na URL.
 * 5. Copie a URL .../exec e cole em APPS_SCRIPT_URL no index.html.
 * (O passo a passo detalhado esta no SETUP-E-STRIKER.md)
 * ============================================================
 */

const CFG = {
  SHEET_ID: 'COLE_AQUI_O_ID_DA_PLANILHA',
  ABA: 'Indicacoes',
  TOKEN: '' // opcional: senha simples; se usar, replique em TOKEN no index.html
};

const COLS = ['Data/Hora','No.','Quem indicou','CPF','Telefone','E-mail','Chave Pix',
  'Nome do amigo','Telefone do amigo','Status','Consentimento','Origem'];

function doGet(e)  { return handle(e, (e.parameter && e.parameter.callback) || ''); }
function doPost(e) {
  var d = {}; try { d = JSON.parse(e.postData.contents); } catch (_) {}
  e.parameter = Object.assign({}, e.parameter, d);
  return handle(e, e.parameter.callback || '');
}

function handle(e, cb) {
  var p = e.parameter || {}, res;
  if (p.ping) res = { ok: true, status: 'pong' };
  else if (CFG.TOKEN && p.token !== CFG.TOKEN) res = { ok: false, status: 'nao_autorizado' };
  else if (p.website) res = { ok: true, status: 'ok', count: 0 }; // honeypot anti-bot
  else res = processar(p);
  return out(res, cb);
}

function out(o, cb) {
  var j = JSON.stringify(o);
  if (cb) return ContentService.createTextOutput(cb + '(' + j + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(j).setMimeType(ContentService.MimeType.JSON);
}

function processar(p) {
  var nome = (p.nome || '').toString().trim();
  var cpf = digits(p.cpf || '');
  var consent = (p.consent === 'true' || p.consent === '1' || p.consent === 'on');
  if (!nome || !cpf) return { ok: false, status: 'campos_faltando' };
  if (!validarCPF(cpf)) return { ok: false, status: 'cpf_invalido' };
  if (!consent) return { ok: false, status: 'sem_consentimento' };

  var amigos = [];
  try { amigos = JSON.parse(p.amigos || '[]'); } catch (_) {}
  if (!amigos.length) return { ok: false, status: 'sem_amigo' };

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.openById(CFG.SHEET_ID);
    var sh = ss.getSheetByName(CFG.ABA);
    if (!sh) { sh = ss.insertSheet(CFG.ABA); sh.appendRow(COLS); sh.setFrozenRows(1); }

    var last = sh.getLastRow();
    var jaIndicado = {}; // dedup global pelo telefone do amigo (coluna 9)
    if (last > 1) {
      var col = sh.getRange(2, 9, last - 1, 1).getValues();
      for (var i = 0; i < col.length; i++) jaIndicado[digits(col[i][0])] = true;
    }

    var ticket = last - 1, registrados = 0, duplicados = 0;
    var ts = new Date(), consentStr = 'Sim - ' + ts.toISOString();

    for (var a = 0; a < amigos.length; a++) {
      var tel = digits(amigos[a].tel || '');
      if (tel.length < 10) continue;
      if (jaIndicado[tel]) { duplicados++; continue; } // vale quem indicou primeiro
      jaIndicado[tel] = true; ticket++; registrados++;
      sh.appendRow([
        ts, ticket, nome, fmtCPF(cpf),
        (p.whatsapp || '').toString(), (p.email || '').toString().trim(),
        (p.pix || '').toString().trim(),
        (amigos[a].nome || '').toString().trim(), fmtTel(tel),
        'Pendente', consentStr, (p.origem || 'LP').toString()
      ]);
    }
    return { ok: true, status: 'ok', count: registrados, duplicados: duplicados };
  } catch (err) {
    return { ok: false, status: 'erro', detalhe: String(err) };
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function digits(s) { return (s || '').toString().replace(/\D/g, ''); }
function fmtCPF(c) { c = digits(c); return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'); }
function fmtTel(t) { t = digits(t); return t.length > 10 ? t.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : t.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3'); }
function validarCPF(cpf) {
  cpf = digits(cpf);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  var s = 0, r;
  for (var i = 1; i <= 9; i++) s += parseInt(cpf[i - 1]) * (11 - i);
  r = (s * 10) % 11; if (r === 10) r = 0; if (r !== parseInt(cpf[9])) return false;
  s = 0; for (var j = 1; j <= 10; j++) s += parseInt(cpf[j - 1]) * (12 - j);
  r = (s * 10) % 11; if (r === 10) r = 0; return r === parseInt(cpf[10]);
}

// Teste manual no editor do Apps Script
function _teste() {
  Logger.log(processar({
    nome: 'Fulano Calvo', cpf: '52998224725', whatsapp: '(11) 90000-0000',
    email: 'fulano@x.com', pix: 'fulano@x.com',
    amigos: JSON.stringify([{ tel: '(11) 98888-7777', nome: 'Amigo 1' }, { tel: '(11) 97777-6666', nome: '' }]),
    consent: 'true', origem: 'teste'
  }));
}
