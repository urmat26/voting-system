/**
 * ╔══════════════════════════════════════════════╗
 * ║          VOTING SYSTEM — CONFIG              ║
 * ╠══════════════════════════════════════════════╣
 * ║  1. Зайди на https://jsonbin.io              ║
 * ║  2. Зарегистрируйся (бесплатно)              ║
 * ║  3. Создай новый Bin с данными ниже          ║
 * ║  4. Скопируй BIN_ID и API_KEY сюда           ║
 * ╚══════════════════════════════════════════════╝
 */

const CONFIG = {
  // ─── JSONBin.io ────────────────────────────────
  // Замените на ваши реальные данные с jsonbin.io
  BIN_ID:  '6a1ad2f9ddf5aa59f7782fe4',
  API_KEY: '$2a$10$IYOZUu8h882RU4pCDftHiOw7MdWRsrDumgcQoRxgWGYMKlsuABKBa',

  // ─── Начальные данные для Bin ──────────────────
  // При создании Bin вставьте этот JSON:
  INITIAL_DATA: {
    question: "Какой формат выпускного?",
    options: [
      { id: 1, text: "Ресторан",         emoji: "🍽️", votes: 0 },
      { id: 2, text: "Пикник в парке",   emoji: "🌿", votes: 0 },
      { id: 3, text: "Квест по городу",  emoji: "🗺️", votes: 0 },
      { id: 4, text: "Кинотеатр + пицца",emoji: "🎬", votes: 0 }
    ],
    total_votes: 0
  },

  // ─── Интервал авто-обновления (мс) ────────────
  POLL_INTERVAL: 3000,   // 3 секунды

  // ─── Цвета вариантов ──────────────────────────
  OPTION_COLORS: [
    { gradient: 'linear-gradient(135deg, #6c63ff, #a89fff)', bar: '#6c63ff' },
    { gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)', bar: '#43e97b' },
    { gradient: 'linear-gradient(135deg, #f7971e, #ffd200)', bar: '#f7971e' },
    { gradient: 'linear-gradient(135deg, #ff6584, #ff8fab)', bar: '#ff6584' }
  ]
};

// Проверка конфига при загрузке
CONFIG.isConfigured = (
  CONFIG.BIN_ID  !== 'YOUR_BIN_ID_HERE' &&
  CONFIG.API_KEY !== 'YOUR_API_KEY_HERE'
);

// URL JSONBin API
CONFIG.API_URL = `https://api.jsonbin.io/v3/b/${CONFIG.BIN_ID}`;
