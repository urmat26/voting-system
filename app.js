/* ─────────────────────────────────────────────
   app.js — Логика страницы голосования
   ───────────────────────────────────────────── */

// ══════════════════════════════
//  JSONBin API helpers
// ══════════════════════════════

async function fetchData() {
  const res = await fetch(CONFIG.API_URL + '/latest', {
    headers: { 'X-Master-Key': CONFIG.API_KEY }
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.record;
}

async function updateData(data) {
  const res = await fetch(CONFIG.API_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': CONFIG.API_KEY,
      'X-Bin-Versioning': 'false'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `HTTP ${res.status}`);
  }
  return (await res.json()).record;
}

// ══════════════════════════════
//  State
// ══════════════════════════════

let selectedOptionId = null;
let isSubmitting     = false;
let currentData      = null;

// ══════════════════════════════
//  DOM helpers
// ══════════════════════════════

const $ = id => document.getElementById(id);

function showEl(el, show = true) {
  el.style.display = show ? '' : 'none';
}

// ══════════════════════════════
//  Build vote UI
// ══════════════════════════════

function buildOptions(data) {
  const grid = $('options-grid');
  grid.innerHTML = '';

  data.options.forEach((opt, i) => {
    const color = CONFIG.OPTION_COLORS[i] || CONFIG.OPTION_COLORS[0];
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.id = `option-${opt.id}`;
    btn.dataset.id = opt.id;
    btn.style.setProperty('--option-gradient', color.gradient);
    btn.innerHTML = `
      <span class="option-num">${i + 1}</span>
      <span class="option-text">${opt.text}</span>
      <span class="option-emoji">${opt.emoji || ''}</span>
    `;
    btn.addEventListener('click', () => selectOption(opt.id, btn));
    grid.appendChild(btn);
  });

  $('question-title').textContent = data.question;
}

function selectOption(id, btn) {
  if (isSubmitting) return;

  // Убираем предыдущее выделение
  document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));

  selectedOptionId = id;
  btn.classList.add('selected');
  $('submit-btn').disabled = false;
  $('submit-btn').textContent = 'Проголосовать →';
}

// ══════════════════════════════
//  Mini results (after vote)
// ══════════════════════════════

function renderMiniResults(data) {
  const container = $('mini-results');
  container.innerHTML = '';
  const total = data.total_votes || 1; // избежать деления на 0

  data.options.forEach((opt, i) => {
    const pct  = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
    const color = CONFIG.OPTION_COLORS[i]?.bar || '#6c63ff';

    const row = document.createElement('div');
    row.className = `mini-bar-row delay-${i + 1}`;
    row.innerHTML = `
      <span class="mini-bar-label">${opt.emoji || ''} ${opt.text}</span>
      <div class="mini-bar-track">
        <div class="mini-bar-fill" style="width:0%; background:${color};" data-pct="${pct}"></div>
      </div>
      <span class="mini-bar-pct">${pct}%</span>
    `;
    container.appendChild(row);

    // Анимируем ширину после вставки в DOM
    setTimeout(() => {
      row.querySelector('.mini-bar-fill').style.width = pct + '%';
    }, 50 + i * 80);
  });
}

// ══════════════════════════════
//  Submit vote
// ══════════════════════════════

async function submitVote() {
  if (!selectedOptionId || isSubmitting) return;

  // Проверка — уже голосовал?
  if (localStorage.getItem('voted_graduation')) {
    showAlreadyVoted();
    return;
  }

  isSubmitting = true;
  const btn = $('submit-btn');
  btn.disabled = true;
  btn.textContent = 'Отправляем...';

  try {
    // 1. Читаем свежие данные
    const data = await fetchData();

    // 2. Находим выбранный вариант и увеличиваем счётчик
    const option = data.options.find(o => o.id === selectedOptionId);
    if (!option) throw new Error('Вариант не найден');
    option.votes += 1;
    data.total_votes = (data.total_votes || 0) + 1;

    // 3. Сохраняем
    const saved = await updateData(data);

    // 4. Отмечаем в localStorage
    localStorage.setItem('voted_graduation', selectedOptionId.toString());

    // 5. Показываем экран «Спасибо»
    showSuccessScreen(saved);

  } catch (err) {
    console.error('Ошибка голосования:', err);
    showError('Ошибка при отправке голоса. Попробуйте ещё раз.');
    btn.disabled = false;
    btn.textContent = 'Проголосовать →';
    isSubmitting = false;
  }
}

// ══════════════════════════════
//  UI States
// ══════════════════════════════

function showSuccessScreen(data) {
  $('vote-form').style.display = 'none';
  const ss = $('success-screen');
  ss.classList.add('show');
  renderMiniResults(data);

  // Показываем выбранный вариант в тексте
  const chosenOpt = data.options.find(o => o.id === selectedOptionId);
  if (chosenOpt) {
    $('chosen-option').textContent = `Вы выбрали: ${chosenOpt.emoji || ''} ${chosenOpt.text}`;
  }

  $('total-votes-success').textContent = data.total_votes;
  
  // Праздничный салют 🎉
  fireConfetti();
}

function showAlreadyVoted() {
  const banner = $('already-voted-banner');
  banner.classList.add('show');
  $('vote-form').style.display = 'none';

  // Показываем текущие результаты
  fetchData()
    .then(data => {
      const ss = $('success-screen');
      ss.classList.add('show');
      $('success-title-text').textContent = 'Вы уже голосовали';
      $('success-sub-text').textContent   = 'Текущие результаты:';
      $('success-icon-inner').textContent  = '📊';
      document.querySelector('.success-icon').style.background = 'linear-gradient(135deg, #6c63ff, #a89fff)';
      renderMiniResults(data);
      $('total-votes-success').textContent = data.total_votes;
      const chosenId = parseInt(localStorage.getItem('voted_graduation'));
      const chosenOpt = data.options.find(o => o.id === chosenId);
      if (chosenOpt) {
        $('chosen-option').textContent = `Вы голосовали за: ${chosenOpt.emoji || ''} ${chosenOpt.text}`;
      }
    })
    .catch(() => {});
}

function showError(msg) {
  const errEl = $('error-msg');
  errEl.textContent = msg;
  errEl.style.display = 'block';
}

// ══════════════════════════════
//  Init
// ══════════════════════════════

async function init() {
  // Проверяем конфиг
  if (!CONFIG.isConfigured) {
    $('config-warning').style.display = 'block';
    $('loader').style.display = 'none';
    return;
  }

  try {
    const data = await fetchData();
    currentData = data;

    $('loader').style.display = 'none';
    $('vote-form').style.display = 'block';

    buildOptions(data);

    // Если уже голосовал — сразу показываем результаты
    if (localStorage.getItem('voted_graduation')) {
      showAlreadyVoted();
    }

  } catch (err) {
    console.error('Ошибка загрузки:', err);
    $('loader').style.display = 'none';
    showError('Ошибка API: ' + err.message + '. Проверьте BIN_ID и API_KEY в config.js');
  }
}

// ── Event Listeners ──
document.addEventListener('DOMContentLoaded', () => {
  $('submit-btn').addEventListener('click', submitVote);
  const shareBtn = $('share-btn');
  if (shareBtn) shareBtn.addEventListener('click', handleShare);
  init();
});

// ══════════════════════════════
//  Confetti & Share
// ══════════════════════════════

function fireConfetti() {
  if (typeof confetti !== 'undefined') {
    const duration = 2500;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6c63ff', '#43e97b', '#f7971e', '#ff6584']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#6c63ff', '#43e97b', '#f7971e', '#ff6584']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }
}

async function handleShare(e) {
  e.preventDefault();
  const shareData = {
    title: 'Голосование за выпускной!',
    text: 'Привет! Я проголосовал за формат выпускного 2026. Выбери и ты!',
    url: window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(shareData.url);
      const btn = $('share-btn');
      const oldText = btn.textContent;
      btn.textContent = '✅ Ссылка скопирована!';
      setTimeout(() => btn.textContent = oldText, 2500);
    }
  } catch (err) {
    console.log('Share canceled or failed', err);
  }
}
