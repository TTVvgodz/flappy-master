# 🐦 Flappy Master

A multiplayer Flappy Bird game with accounts, ranked play, live 1v1 matches, a coin shop, daily challenges, and a full rank ladder.

---

## Features

- **Accounts** — register/login with JWT auth, passwords hashed with bcrypt
- **Live 1v1 Ranked Matches** — Socket.io matchmaking, real-time score sharing, win/loss rank points
- **Rank System** — Egg → Hatchling → Fledgling → Flapper → Tailwind → Skybreaker → Pipebuster → Flappy Master (3 tiers each except Egg and Flappy Master)
- **Coin System** — earn 1 coin per pipe, spend in the shop
- **Shop** — 9 bird skins, 9 pipe colors, 9 backgrounds; rotates every 5 minutes
- **Daily Challenge** — seeded pipes so everyone plays the same course each day
- **Leaderboards** — global, daily, ranked
- **Profile** — game history, rank progress, stats
- **Sound effects** — flap, score, crunch via Web Audio API
- **Particle effects** — feather burst on death, combo multiplier

---

## Quick Start

### 1. Install Node.js
Download from https://nodejs.org (v18+ recommended)

### 2. Install dependencies
```bash
cd flappy-master
npm install
```

### 3. Start the server
```bash
npm start
```

### 4. Open the game
Visit http://localhost:3000 in your browser.

---

## Deploy to the Internet (so others can play)

### Option A — Railway (easiest, free tier)
1. Push this folder to a GitHub repo
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Select your repo — Railway auto-detects Node.js
4. Set environment variable: `JWT_SECRET=your-long-random-secret`
5. Railway gives you a public URL instantly

### Option B — Render (free tier)
1. Push to GitHub
2. Go to https://render.com → New Web Service
3. Connect repo, set build command: `npm install`, start command: `npm start`
4. Add env var `JWT_SECRET=your-long-random-secret`
5. Done — share the `.onrender.com` URL

### Option C — VPS (DigitalOcean, Linode, etc.)
```bash
# On your server
git clone <your-repo>
cd flappy-master
npm install
JWT_SECRET=your-secret PORT=3000 npm start

# Keep it running with PM2
npm install -g pm2
pm2 start server/index.js --name flappy-master
pm2 save && pm2 startup
```

### Option D — Fly.io (free tier)
```bash
npm install -g flyctl
flyctl launch        # follow prompts
flyctl secrets set JWT_SECRET=your-long-random-secret
flyctl deploy
```

---

## Environment Variables

| Variable     | Default                              | Description                    |
|--------------|--------------------------------------|--------------------------------|
| `PORT`       | `3000`                               | Server port                    |
| `JWT_SECRET` | `flappy-master-secret-change-in-prod`| JWT signing secret — **change this in production!** |

---

## Project Structure

```
flappy-master/
├── server/
│   └── index.js          # Express + Socket.io server, SQLite DB, all API routes
├── public/
│   ├── index.html        # Game HTML
│   ├── css/
│   │   └── style.css     # Dark theme styles
│   └── js/
│       └── game.js       # All game logic, UI, Socket.io client
├── package.json
└── README.md
```

---

## How Ranked Works

- **Solo ranked** — play a game, earn rank pts based on score (5/15/30 pts for 10/25/50+ score)
- **Live 1v1** — click "find opponent", get matched by rank proximity, play same pipe seed simultaneously
  - Winner: **+20 rank pts**
  - Loser: **−5 rank pts**

### Rank Ladder

| Rank           | Pts Required | Tiers |
|----------------|-------------|-------|
| Egg            | 0           | 1     |
| Hatchling      | 50          | I–III |
| Fledgling      | 200         | I–III |
| Flapper        | 500         | I–III |
| Tailwind       | 1,000       | I–III |
| Skybreaker     | 2,000       | I–III |
| Pipebuster     | 4,000       | I–III |
| Flappy Master  | 8,000       | 1     |

---

## Database

SQLite (`server/flappy.db`) — created automatically on first run. No setup needed.

For production with many concurrent users, consider migrating to PostgreSQL by replacing `better-sqlite3` with `pg` and adjusting queries.
