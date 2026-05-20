/* ─────────────────────────────────────────────
   Forró dos Namorados 2026 — script.js
   Fluxo: seleção → dados → WhatsApp + banco
   ───────────────────────────────────────────── */

const API    = '';
const PRECOS = { ingresso: 30, mesa: 100 };
const NOMES  = { ingresso: 'Passe Individual', mesa: 'Mesa (4 cadeiras)' };
const EMOJIS = { ingresso: '🎟️', mesa: '🪑' };
const MAX_INGRESSO = 6;
const MAX_MESA     = 3;

// Número do WhatsApp de pagamentos (formato internacional sem +)
const WA_NUMERO = '5581999999999';

let st = {
  itens: {},      // { ingresso: 2, mesa: 1 }
  mesa: null,
  pedidoId: null,
};

/* ── BANDEIRINHAS ─────────────────────────────── */
function initFlags() {
  const fl     = document.getElementById('fl');
  const colors = ['#F5D020','#1a5c2a','#E87820','#F5D020','#1a5c2a','#0a1628'];
  for (let x = 30, i = 0; x < 1180; x += 26, i++) {
    const poly = document.createElementNS('http://www.w3.org/2000/svg','polygon');
    poly.setAttribute('points',`${x},8 ${x+20},8 ${x+10},32`);
    poly.setAttribute('fill', colors[i % colors.length]);
    poly.setAttribute('opacity','.75');
    fl.appendChild(poly);
  }
}

/* ── COUNTDOWN ────────────────────────────────── */
function initCountdown() {
  const ev  = new Date('2026-06-13T18:00:00');
  const pad = n => String(Math.floor(n)).padStart(2,'0');
  function tick() {
    const d = ev - new Date();
    if (d <= 0) return;
    document.getElementById('cd-d').textContent = pad(d / 86400000);
    document.getElementById('cd-h').textContent = pad((d % 86400000) / 3600000);
    document.getElementById('cd-m').textContent = pad((d % 3600000) / 60000);
    document.getElementById('cd-s').textContent = pad((d % 60000) / 1000);
  }
  tick(); setInterval(tick, 1000);
}

/* ── FAQ ──────────────────────────────────────── */
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const open = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!open) item.classList.add('open');
}

/* ── SCROLL REVEAL ────────────────────────────── */
function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: .1 });
  document.querySelectorAll('.reveal').forEach(r => io.observe(r));
}

/* ── TOAST ────────────────────────────────────── */
function toast(msg, dur = 3200) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

/* ── MÁSCARAS ─────────────────────────────────── */
function maskCpf(el) {
  let v = el.value.replace(/\D/g,'').slice(0,11);
  if (v.length > 9)      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d+)/,'$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/,'$1.$2');
  el.value = v;
}
function maskTel(el) {
  let v = el.value.replace(/\D/g,'').slice(0,11);
  if (v.length > 10)     v = v.replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3');
  else if (v.length > 6) v = v.replace(/(\d{2})(\d{4,5})(\d*)/,'($1) $2-$3');
  else if (v.length > 2) v = v.replace(/(\d{2})(\d+)/,'($1) $2');
  el.value = v;
}
function fmt(v) { return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }

/* ── CALCULAR TOTAL ───────────────────────────── */
function calcTotal() {
  return Object.entries(st.itens).reduce((acc,[prod,qty]) => acc + PRECOS[prod] * qty, 0);
}

/* ── RENDERIZAR SELETOR (step 1) ──────────────── */
function renderItens() {
  const container = document.getElementById('itens-selector');
  if (!container) return;
  container.innerHTML = '';

  const produtos = ['ingresso', 'mesa'];
  produtos.forEach(prod => {
    const qty    = st.itens[prod] || 0;
    const max    = prod === 'ingresso' ? MAX_INGRESSO : MAX_MESA;
    const isMax  = qty >= max;
    const div    = document.createElement('div');
    div.className = 'item-row' + (qty > 0 ? ' item-row--sel' : '');
    div.innerHTML = `
      <div class="item-info">
        <span class="item-emoji">${EMOJIS[prod]}</span>
        <div>
          <div class="item-nome">${NOMES[prod]}</div>
          <div class="item-preco">${fmt(PRECOS[prod])} cada · máx. ${max}</div>
        </div>
      </div>
      <div class="item-qty">
        <button class="qty-btn" onclick="changeItem('${prod}',-1)" ${qty === 0 ? 'disabled' : ''}>−</button>
        <span class="qty-num">${qty}</span>
        <button class="qty-btn" onclick="changeItem('${prod}',1)" ${isMax ? 'disabled' : ''}>+</button>
      </div>`;
    container.appendChild(div);
  });

  atualizarTotalStep1();
}

function changeItem(prod, d) {
  const max    = prod === 'ingresso' ? MAX_INGRESSO : MAX_MESA;
  let novaQty  = Math.min(Math.max(0, (st.itens[prod] || 0) + d), max);

  if (novaQty === 0) delete st.itens[prod];
  else st.itens[prod] = novaQty;

  renderItens();

  // Mostrar/esconder info de mesa
  const mesaSec = document.getElementById('mesa-sec');
  if (mesaSec) mesaSec.style.display = st.itens['mesa'] ? 'block' : 'none';
}

function atualizarTotalStep1() {
  const total = calcTotal();
  const el    = document.getElementById('total-step1');
  if (el) el.textContent = total > 0 ? 'Total: ' + fmt(total) : '';
}

/* ── STEPS ────────────────────────────────────── */
function setStep(n) {
  ['1','2','3','4'].forEach(s => {
    const el = document.getElementById('s' + s);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById('s' + n);
  if (target) target.style.display = 'block';

  [1,2,3,4].forEach(i => {
    const el = document.getElementById('ms' + i);
    if (!el) return;
    el.className = 'mstep' + (i === parseInt(n) ? ' active' : i < parseInt(n) ? ' done' : '');
  });
}

/* ── RESUMO ───────────────────────────────────── */
function atualizaResumo(id) {
  const linhas = Object.entries(st.itens)
    .map(([prod, qty]) => `
      <div class="resumo-row">
        <span>${EMOJIS[prod]} ${NOMES[prod]} × ${qty}</span>
        <span>${fmt(PRECOS[prod] * qty)}</span>
      </div>`)
    .join('');

  document.getElementById(id).innerHTML = `
    ${linhas}
    <div class="resumo-total"><span>Total</span><span>${fmt(calcTotal())}</span></div>`;
}

/* ── ABRIR MODAL ──────────────────────────────── */
async function abrirModal(produtoInicial) {
  st = { itens: {}, mesa: null, pedidoId: null };

  if (produtoInicial) st.itens[produtoInicial] = 1;

  document.getElementById('modal-title').textContent = 'Comprar';
  renderItens();

  const mesaSec = document.getElementById('mesa-sec');
  if (mesaSec) mesaSec.style.display = st.itens['mesa'] ? 'block' : 'none';

  setStep(1);
  document.getElementById('modal-overlay').classList.add('active');
}

/* ── FECHAR MODAL ─────────────────────────────── */
function fecharModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}

/* ── STEP 1 → 2 ───────────────────────────────── */
function irS2() {
  if (!Object.keys(st.itens).length) return toast('Selecione ao menos um item.');
  setStep(2);
}

/* ── STEP 2 → 3 ───────────────────────────────── */
function irS3() {
  const nome = document.getElementById('f-nome').value.trim();
  const cpf  = document.getElementById('f-cpf').value.replace(/\D/g,'');
  const tel  = document.getElementById('f-tel').value.trim();

  if (!nome)             return toast('Informe seu nome.');
  if (cpf.length !== 11) return toast('CPF inválido.');
  if (tel.length < 10)   return toast('Telefone inválido.');

  atualizaResumo('res3');
  setStep(3);
}

/* ── PAGAR ────────────────────────────────────── */
async function pagar() {
  const btn = document.getElementById('btn-pagar');
  btn.disabled = true;
  btn.textContent = 'Registrando…';

  const nome     = document.getElementById('f-nome').value.trim();
  const cpf      = document.getElementById('f-cpf').value.replace(/\D/g,'');
  const telefone = document.getElementById('f-tel').value.trim();
  const itens    = Object.entries(st.itens).map(([produto, quantidade]) => ({ produto, quantidade }));

  try {
    const r = await fetch(API + '/api/pedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, cpf, telefone, itens }),
    });
    const d = await r.json();

    if (!r.ok) {
      toast(d.erro || 'Erro ao registrar.');
      btn.disabled = false; btn.textContent = 'Confirmar e enviar Pix';
      return;
    }

    st.pedidoId = d.id;

    const msg = montarMensagemWA({ nome, cpf, telefone, itens, total: d.valorTotal, id: d.id });
    window.open(`https://wa.me/${WA_NUMERO}?text=${encodeURIComponent(msg)}`, '_blank');

    document.getElementById('confirm-id').textContent    = d.id;
    document.getElementById('confirm-total').textContent = fmt(d.valorTotal);
    setStep(4);

  } catch {
    toast('Erro de conexão.');
    btn.disabled = false; btn.textContent = 'Confirmar e enviar Pix';
  }
}

/* ── MENSAGEM WHATSAPP ────────────────────────── */
function montarMensagemWA({ nome, cpf, telefone, itens, total, id }) {
  const linhasItens = itens
    .map(i => `  ${EMOJIS[i.produto]} ${NOMES[i.produto]} × ${i.quantidade} = ${fmt(PRECOS[i.produto] * i.quantidade)}`)
    .join('\n');

  const cpfFmt = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  return (
`🎉 *Forró dos Namorados 2026 — Pedido ${id}*

👤 *Nome:* ${nome}
📱 *Telefone:* ${telefone}
🪪 *CPF:* ${cpfFmt}

*Itens:*
${linhasItens}

💰 *Total: ${fmt(total)}*

---
Após enviar o Pix, aguarde a confirmação da organização.
Chave Pix: [sua chave aqui]`
  );
}

/* ── INICIALIZAÇÃO ────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initFlags();
  initCountdown();
  initReveal();
  document.getElementById('modal-overlay')
    .addEventListener('click', e => { if (e.target.id === 'modal-overlay') fecharModal(); });
});
