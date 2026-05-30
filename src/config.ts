export const CONFIG = {
  BIN_ID: '6a1ad2f9ddf5aa59f7782fe4',
  API_KEY: '$2a$10$IYOZUu8h882RU4pCDftHiOw7MdWRsrDumgcQoRxgWGYMKlsuABKBa',
  POLL_INTERVAL: 3000,
  OPTION_COLORS: [
    { gradient: 'linear-gradient(135deg, #6c63ff, #a89fff)', bar: '#6c63ff' },
    { gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)', bar: '#43e97b' },
    { gradient: 'linear-gradient(135deg, #f7971e, #ffd200)', bar: '#f7971e' },
    { gradient: 'linear-gradient(135deg, #ff6584, #ff8fab)', bar: '#ff6584' }
  ],
  get isConfigured() {
    return this.BIN_ID !== 'YOUR_BIN_ID_HERE' && this.API_KEY !== 'YOUR_API_KEY_HERE';
  },
  get API_URL() {
    return `https://api.jsonbin.io/v3/b/${this.BIN_ID}`;
  }
};
