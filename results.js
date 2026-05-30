/* ─────────────────────────────────────────────
   results.js — Логика страницы результатов
   ───────────────────────────────────────────── */

// ══════════════════════════════
//  API helpers (аналогично app.js)
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

// ══════════════════════════════
//  Chart.js instance
// ══════════════════════════════

let chart = null;
let currentView = 'bar';   // 'bar' | 'pie'
let pollTimer   = null;

const $ = id => document.getElementById(id);

// ══════════════════════════════
//  Render helpers
// ══════════════════════════════

function getLabels(data) {
  return data.options.map(o => `${o.emoji || ''} ${o.text}`);
}

function getVotes(data) {
  return data.options.map(o => o.votes);
}

function getColors() {
  return CONFIG.OPTION_COLORS.map(c => c.bar);
}

function getColorsFaded() {
  return CONFIG.OPTION_COLORS.map(c => c.bar + '40');  // 25% прозрачность
}

// ══════════════════════════════
//  Chart.js
// ══════════════════════════════

function createChart(data) {
  const ctx = $('vote-chart').getContext('2d');
  const labels = getLabels(data);
  const votes  = getVotes(data);
  const colors = getColors();

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700, easing: 'easeOutQuart' },
    plugins: {
      legend: {
        position: currentView === 'pie' ? 'bottom' : 'top',
        labels: {
          color: 'rgba(240,240,255,0.7)',
          font: { family: "'Inter', sans-serif", size: 13, weight: '500' },
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10
        }
      },
      tooltip: {
        backgroundColor: '#1c1c28',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#f0f0ff',
        bodyColor: 'rgba(240,240,255,0.7)',
        padding: 12,
        callbacks: {
          label: ctx => {
            const total = data.total_votes || 1;
            const pct = Math.round((ctx.parsed / total) * 100);
            return ` ${ctx.parsed} голосов (${pct}%)`;
          }
        }
      }
    }
  };

  if (currentView === 'bar') {
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Голоса',
          data: votes,
          backgroundColor: getColorsFaded(),
          borderColor: colors,
          borderWidth: 2,
          borderRadius: 10,
          borderSkipped: false
        }]
      },
      options: {
        ...commonOptions,
        scales: {
          x: {
            ticks: { color: 'rgba(240,240,255,0.55)', font: { size: 12 } },
            grid:  { color: 'rgba(255,255,255,0.05)' }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: 'rgba(240,240,255,0.55)',
              stepSize: 1,
              precision: 0,
              font: { size: 12 }
            },
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        }
      }
    });
  } else {
    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: votes,
          backgroundColor: getColorsFaded(),
          borderColor: colors,
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        ...commonOptions,
        cutout: '62%'
      }
    });
  }
}

function updateChart(data) {
  if (!chart) return;
  chart.data.datasets[0].data = getVotes(data);
  chart.update('active');
}

// ══════════════════════════════
//  Result bars (full view)
// ══════════════════════════════

function renderBars(data) {
  const container = $('result-bars');
  const total = data.total_votes || 0;

  // Сортируем по убыванию голосов (опционально — для визуала)
  const sorted = [...data.options]
    .map((o, i) => ({ ...o, originalIndex: i }))
    .sort((a, b) => b.votes - a.votes);

  container.innerHTML = '';

  sorted.forEach((opt, rank) => {
    const i     = opt.originalIndex;
    const color = CONFIG.OPTION_COLORS[i]?.bar || '#6c63ff';
    const pct   = total > 0 ? Math.round((opt.votes / total) * 100) : 0;

    const item = document.createElement('div');
    item.className = `result-bar-item delay-${rank + 1}`;
    item.id = `rbi-${opt.id}`;
    item.innerHTML = `
      <div class="rbi-top">
        <div class="rbi-label">
          <span class="rbi-emoji">${opt.emoji || ''}</span>
          <span>${opt.text}</span>
        </div>
        <div class="rbi-stats">
          <span class="rbi-votes">${opt.votes} голосов</span>
          <span class="rbi-pct">${pct}%</span>
        </div>
      </div>
      <div class="rbi-track">
        <div class="rbi-fill" id="fill-${opt.id}"
             style="width:0%; background:${color};"></div>
      </div>
    `;
    container.appendChild(item);

    // Анимируем ширину
    setTimeout(() => {
      const fill = document.getElementById(`fill-${opt.id}`);
      if (fill) fill.style.width = pct + '%';
    }, 60 + rank * 80);
  });
}

function updateBars(data) {
  const total = data.total_votes || 0;

  data.options.forEach(opt => {
    const pct   = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
    const fill  = document.getElementById(`fill-${opt.id}`);
    const rbi   = document.getElementById(`rbi-${opt.id}`);

    if (!fill || !rbi) return;

    fill.style.width = pct + '%';
    const votesEl = rbi.querySelector('.rbi-votes');
    const pctEl   = rbi.querySelector('.rbi-pct');
    if (votesEl) votesEl.textContent = `${opt.votes} голосов`;
    if (pctEl)   pctEl.textContent   = `${pct}%`;
  });

  // Пересортировать строки по убыванию голосов
  const container = $('result-bars');
  const items = [...container.querySelectorAll('.result-bar-item')];
  items
    .sort((a, b) => {
      const aVotes = data.options.find(o => `rbi-${o.id}` === a.id)?.votes || 0;
      const bVotes = data.options.find(o => `rbi-${o.id}` === b.id)?.votes || 0;
      return bVotes - aVotes;
    })
    .forEach(el => container.appendChild(el));
}

// ══════════════════════════════
//  Stats
// ══════════════════════════════

function updateStats(data) {
  const total = data.total_votes || 0;
  $('stat-total').textContent = total;

  // Лидер
  const leader = data.options.reduce((a, b) => b.votes > a.votes ? b : a, data.options[0]);
  const leaderPct = total > 0 ? Math.round((leader.votes / total) * 100) : 0;
  $('stat-leader').textContent = `${leader.emoji || ''} ${leader.text}`;
  $('stat-leader-pct').textContent = total > 0 ? `${leaderPct}%` : '—';

  // Последнее обновление
  const now = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  $('last-update').textContent = `Последнее обновление: ${now}`;

  // Обновляем счётчик в header
  $('total-count-val').textContent = total;
}

// ══════════════════════════════
//  Full update cycle
// ══════════════════════════════

let firstLoad = true;

async function refresh() {
  try {
    const data = await fetchData();

    updateStats(data);

    if (firstLoad) {
      // Первый рендер
      createChart(data);
      renderBars(data);
      $('loader').style.display = 'none';
      $('main-content').style.display = 'block';
      firstLoad = false;
    } else {
      // Обновление без перезагрузки
      updateChart(data);
      updateBars(data);
    }

    // Убираем ошибку если была
    $('error-msg').style.display = 'none';

  } catch (err) {
    console.error('Ошибка обновления:', err);
    if (firstLoad) {
      $('loader').style.display = 'none';
      $('error-msg').style.display = 'block';
      $('error-msg').textContent = 'Не удалось загрузить данные. Проверьте API-ключ.';
    }
  }
}

// ══════════════════════════════
//  Chart type tabs
// ══════════════════════════════

function switchView(view) {
  if (view === currentView) return;
  currentView = view;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  // Пересоздаём chart
  if (chart) {
    chart.destroy();
    chart = null;
  }

  fetchData().then(data => createChart(data)).catch(() => {});
}

// ══════════════════════════════
//  Init
// ══════════════════════════════

function init() {
  if (!CONFIG.isConfigured) {
    $('config-warning').style.display = 'block';
    $('loader').style.display = 'none';
    return;
  }

  // Первая загрузка
  refresh();

  // Авто-обновление каждые N секунд
  pollTimer = setInterval(refresh, CONFIG.POLL_INTERVAL);

  // Tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
}

document.addEventListener('DOMContentLoaded', init);

// Остановить таймер при закрытии вкладки (GC)
window.addEventListener('beforeunload', () => {
  if (pollTimer) clearInterval(pollTimer);
});
