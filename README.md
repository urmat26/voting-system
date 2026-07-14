# 🗳️ Voting System — Real-time School Voting Platform

[![Live Demo](https://img.shields.io/badge/Live-Demo-success?style=for-the-badge&logo=vercel)](https://urmat26-voting-system.vercel.app/)
[![HTML](https://img.shields.io/badge/HTML-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS](https://img.shields.io/badge/CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)

> A real-time voting platform built for school events. Students vote from their phones, results update live on the projector every 3 seconds.

---

## ✨ Features

- 📱 **Mobile-first voting page** — optimized for student phones
- 📊 **Live results dashboard** — auto-updates every 3 seconds via Chart.js (bar + pie charts)
- 🔄 **Anti-spam protection** — prevents double voting using localStorage
- 🎨 **Dark theme with animations** — sleek UI for school events
- ⚡ **Scales to 200+ users** — powered by JSONBin.io + Vercel CDN

---

## 🖥️ Screens

| Voting Page (Mobile) | Results (Projector) |
|---|---|
| Students vote from phones | Live charts for the auditorium |

---

## 🚀 Quick Start

### 1. Setup JSONBin.io

1. Go to [jsonbin.io](https://jsonbin.io) and sign up (free)
2. Click **"+ New Bin"** and paste the initial data:

```json
{
  "question": "What format for the graduation party?",
  "options": [
    { "id": 1, "text": "Restaurant",      "emoji": "🍽️", "votes": 0 },
    { "id": 2, "text": "Picnic in the park",    "emoji": "🌿", "votes": 0 },
    { "id": 3, "text": "City quest",   "emoji": "🗺️", "votes": 0 },
    { "id": 4, "text": "Cinema + pizza", "emoji": "🎬", "votes": 0 }
  ],
  "total_votes": 0
}
```

3. Click **Create Bin** → copy your **Bin ID**
4. Go to **Account → API Keys** → copy your **Master Key**

### 2. Configure

Open `config.js` and replace:

```js
BIN_ID:  'YOUR_BIN_ID_HERE',   // ← paste your Bin ID
API_KEY: 'YOUR_API_KEY_HERE',  // ← paste your Master Key
```

### 3. Deploy to Vercel

```bash
# Fork this repo, then:
vercel --prod
```

Or connect your GitHub repo at [vercel.com](https://vercel.com) for auto-deploy.

---

## 📁 Project Structure

```
voting-system/
├── index.html      # Voting page (for phones)
├── results.html    # Results dashboard (for projector)
├── style.css       # Dark theme + animations
├── app.js          # Voting logic
├── results.js      # Live results + Chart.js
└── config.js       # ⚙️ API configuration
```

---

## 🔗 Live URLs

| Page | URL | Audience |
|------|-----|----------|
| Voting | `/` | Students (phone) |
| Results | `/results.html` | Auditorium projector |

---

## ⚡ How It Works

```
Student opens voting page
        ↓
Selects option → clicks "Vote"
        ↓
PUT request to JSONBin.io
        ↓
Results page polls every 3s → Chart.js re-renders
```

---

## 🛡️ Anti-Cheat

| Method | Effectiveness |
|--------|---------------|
| localStorage flag | Blocks 99% of casual users |
| Browser/session reset | ⚠️ Can be bypassed |
| **Recommendation** | For production: add Google/Email auth |

> For a school MVP with trusted students — localStorage is sufficient.

---

## 🛠️ Tech Stack

- **HTML5** — semantic markup
- **CSS3** — dark theme, flexbox, CSS animations
- **Vanilla JavaScript** — no frameworks, pure DOM manipulation
- **Chart.js** — interactive bar and pie charts
- **JSONBin.io** — free cloud JSON storage
- **Vercel** — zero-config static hosting

---

## ❓ FAQ

**Q: Why 3 seconds and not instant?**  
A: 200 students × 1 req/sec = 200 req/sec. JSONBin free tier can't handle that. 3s is the sweet spot.

**Q: Race conditions with simultaneous votes?**  
A: JSONBin processes PUTs sequentially. Theoretically possible but acceptable for a school event.

**Q: How to reset votes?**  
A: Edit your Bin in JSONBin Dashboard — set all `votes: 0` and `total_votes: 0`.

---

## 📝 License

MIT — feel free to use for your school events!

---

*Built for the Graduation 2026 🎓*