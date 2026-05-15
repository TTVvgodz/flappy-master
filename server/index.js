const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const JWT_SECRET = process.env.JWT_SECRET || 'flappy-master-secret-change-in-prod';
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// ── JSON "Database" ───────────────────────────────────────────────────────────
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch(e) {}
  return { users: {}, scores: [], daily: {}, history: [] };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let db = loadData();

// Auto-save every 10 seconds
setInterval(() => saveData(db), 10000);

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function dailySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate();
}

function getRankInfo(pts) {
  const RANKS = [
    { name: 'Egg',           tiers: 1, pts: 0    },
    { name: 'Hatchling',     tiers: 3, pts: 50   },
    { name: 'Fledgling',     tiers: 3, pts: 200  },
    { name: 'Flapper',       tiers: 3, pts: 500  },
    { name: 'Tailwind',      tiers: 3, pts: 1000 },
    { name: 'Skybreaker',    tiers: 3, pts: 2000 },
    { name: 'Pipebuster',    tiers: 3, pts: 4000 },
    { name: 'Flappy Master', tiers: 1, pts: 8000 },
  ];
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (pts >= RANKS[i].pts) {
      const r = RANKS[i], next = RANKS[i+1];
      const span = next ? next.pts - r.pts : 1;
      const within = pts - r.pts;
      const ti = next ? Math.min(Math.floor((within/span)*r.tiers), r.tiers-1) : 0;
      const pct = next ? Math.min(100, Math.round((within/span)*100)) : 100;
      const tLabel = r.tiers > 1 ? ' ' + ['I','II','III'][ti] : '';
      return { name: r.name + tLabel, pct, pts };
    }
  }
  return { name: 'Egg', pct: 0, pts: 0 };
}

function newUser(username) {
  return {
    username,
    password: '',
    coins: 0,
    rank_pts: 0,
    best_score: 0,
    games_played: 0,
    owned_birds: ['hatchling'],
    owned_pipes: ['bamboo'],
    owned_bgs: ['sky'],
    equipped_bird: 'hatchling',
    equipped_pipe: 'bamboo',
    equipped_bg: 'sky',
    daily_done: '',
    created_at: Math.floor(Date.now()/1000),
  };
}

function sanitizeUser(u) {
  const { password, ...safe } = u;
  safe.rank = getRankInfo(u.rank_pts || 0);
  return safe;
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
  if (!password || password.length < 12) return res.status(400).json({ error: 'Password must be at least 12 characters' });
  const key = username.toLowerCase();
  if (db.users[key]) return res.status(400).json({ error: 'Username already taken' });
  const hash = await bcrypt.hash(password, 10);
  const user = newUser(username);
  user.password = hash;
  db.users[key] = user;
  saveData(db);
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: sanitizeUser(user) });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = db.users[username?.toLowerCase()];
  if (!user) return res.status(400).json({ error: 'Incorrect username or password' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: 'Incorrect username or password' });
  const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: sanitizeUser(user) });
});

app.get('/api/me', authMiddleware, (req, res) => {
  const user = db.users[req.user.username?.toLowerCase()];
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: sanitizeUser(user) });
});

// ── Scores ────────────────────────────────────────────────────────────────────
app.post('/api/score', authMiddleware, (req, res) => {
  const { score, mode, diff, max_combo } = req.body;
  const key = req.user.username.toLowerCase();
  const user = db.users[key];
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Add to history
  if (!db.history) db.history = [];
  db.history.push({ username: user.username, score, mode: mode||'normal', diff: diff||'normal', max_combo: max_combo||1, created_at: Math.floor(Date.now()/1000) });
  if (db.history.length > 5000) db.history = db.history.slice(-5000);

  // Update coins and best
  user.coins = (user.coins || 0) + score;
  user.best_score = Math.max(user.best_score || 0, score);
  user.games_played = (user.games_played || 0) + 1;

  // Rank pts for ranked mode
  let rankPtsGained = 0;
  if (mode === 'ranked') {
    if (score >= 50) rankPtsGained = 30;
    else if (score >= 25) rankPtsGained = 15;
    else if (score >= 10) rankPtsGained = 5;
    else if (score >= 5) rankPtsGained = 2;
    user.rank_pts = (user.rank_pts || 0) + rankPtsGained;
  }

  // Global leaderboard — keep personal best only
  if (mode !== 'daily') {
    if (!db.scores) db.scores = [];
    const existing = db.scores.find(s => s.username === user.username);
    if (!existing) {
      db.scores.push({ username: user.username, score, diff: diff||'normal', combo: max_combo||1 });
    } else if (score > existing.score) {
      existing.score = score; existing.diff = diff||'normal'; existing.combo = max_combo||1;
    }
  } else {
    // Daily leaderboard
    const day = todayKey();
    if (!db.daily) db.daily = {};
    if (!db.daily[day]) db.daily[day] = [];
    const ex = db.daily[day].find(s => s.username === user.username);
    if (!ex) {
      db.daily[day].push({ username: user.username, score });
    } else if (score > ex.score) {
      ex.score = score;
    }
    user.daily_done = day;
  }

  saveData(db);
  res.json({ user: sanitizeUser(user), rank_pts_gained: rankPtsGained });
});

// ── Leaderboards ──────────────────────────────────────────────────────────────
app.get('/api/leaderboard', (req, res) => {
  const scores = (db.scores || []).sort((a,b) => b.score - a.score).slice(0, 20);
  res.json(scores);
});

app.get('/api/leaderboard/daily', (req, res) => {
  const rows = (db.daily?.[todayKey()] || []).sort((a,b) => b.score - a.score).slice(0, 20);
  res.json(rows);
});

app.get('/api/leaderboard/ranked', (req, res) => {
  const rows = Object.values(db.users)
    .sort((a,b) => (b.rank_pts||0) - (a.rank_pts||0))
    .slice(0, 20)
    .map(u => ({ username: u.username, rank_pts: u.rank_pts||0, best_score: u.best_score||0, rank: getRankInfo(u.rank_pts||0) }));
  res.json(rows);
});

app.get('/api/history', authMiddleware, (req, res) => {
  const rows = (db.history || [])
    .filter(h => h.username === req.user.username)
    .slice(-20).reverse();
  res.json(rows);
});

// ── Shop ──────────────────────────────────────────────────────────────────────
app.post('/api/shop/buy', authMiddleware, (req, res) => {
  const { type, itemId, price } = req.body;
  const key = req.user.username.toLowerCase();
  const user = db.users[key];
  if (!user) return res.status(404).json({ error: 'Not found' });
  if ((user.coins||0) < price) return res.status(400).json({ error: 'Not enough coins' });
  const ownedKey = type==='bird'?'owned_birds':type==='pipe'?'owned_pipes':'owned_bgs';
  if (!user[ownedKey]) user[ownedKey] = [];
  if (user[ownedKey].includes(itemId)) return res.status(400).json({ error: 'Already owned' });
  user[ownedKey].push(itemId);
  user.coins -= price;
  const equippedKey = type==='bird'?'equipped_bird':type==='pipe'?'equipped_pipe':'equipped_bg';
  user[equippedKey] = itemId;
  saveData(db);
  res.json({ user: sanitizeUser(user) });
});

app.post('/api/shop/equip', authMiddleware, (req, res) => {
  const { type, itemId } = req.body;
  const key = req.user.username.toLowerCase();
  const user = db.users[key];
  if (!user) return res.status(404).json({ error: 'Not found' });
  const ownedKey = type==='bird'?'owned_birds':type==='pipe'?'owned_pipes':'owned_bgs';
  if (!user[ownedKey]?.includes(itemId)) return res.status(400).json({ error: 'Not owned' });
  const equippedKey = type==='bird'?'equipped_bird':type==='pipe'?'equipped_pipe':'equipped_bg';
  user[equippedKey] = itemId;
  saveData(db);
  res.json({ user: sanitizeUser(user) });
});

// ── Daily Info ────────────────────────────────────────────────────────────────
app.get('/api/daily', (req, res) => {
  res.json({ seed: dailySeed(), key: todayKey() });
});

// ── Socket.io Matchmaking ─────────────────────────────────────────────────────
const queue = [];
const matches = {};
let matchCounter = 0;

io.on('connection', (socket) => {

  socket.on('join_ranked', ({ token, username }) => {
    let userData = { username: username || 'Guest', rankPts: 0 };
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.users[decoded.username?.toLowerCase()];
      if (user) userData = { username: user.username, rankPts: user.rank_pts||0 };
    } catch {}

    // Remove if already in queue
    const idx = queue.findIndex(p => p.socketId === socket.id);
    if (idx >= 0) queue.splice(idx, 1);

    queue.push({ socketId: socket.id, ...userData });
    socket.emit('queue_joined', { position: queue.length });
    io.emit('queue_update', { count: queue.length });

    // Match closest rank pts
    if (queue.length >= 2) {
      queue.sort((a,b) => a.rankPts - b.rankPts);
      const [p1, p2] = queue.splice(0, 2);
      io.emit('queue_update', { count: queue.length });

      const matchId = `m${++matchCounter}`;
      const seed = Math.floor(Math.random() * 999999);
      matches[matchId] = { players:[p1,p2], scores:{}, maxCombos:{}, ready: new Set(), seed };

      [p1, p2].forEach(p => {
        const s = io.sockets.sockets.get(p.socketId);
        if (s) {
          s.join(matchId);
          s.data.matchId = matchId;
          s.emit('match_found', {
            matchId, seed,
            opponent: p===p1 ? p2.username : p1.username,
            opponentRank: getRankInfo(p===p1 ? p2.rankPts : p1.rankPts).name,
          });
        }
      });
    }
  });

  socket.on('match_ready', ({ matchId }) => {
    const m = matches[matchId]; if (!m) return;
    m.ready.add(socket.id);
    if (m.ready.size === 2) {
      const startAt = Date.now() + 3000;
      io.to(matchId).emit('match_start', { startAt, seed: m.seed });
    }
  });

  socket.on('score_update', ({ matchId, score, combo }) => {
    const m = matches[matchId]; if (!m) return;
    m.scores[socket.id] = score;
    socket.to(matchId).emit('opponent_score', { score, combo });
  });

  socket.on('match_died', ({ matchId, finalScore, maxCombo, survived }) => {
    const m = matches[matchId]; if (!m) return;

    // Record who died and when
    if (!m.deaths) m.deaths = [];
    m.deaths.push({ socketId: socket.id, finalScore: finalScore||0, maxCombo: maxCombo||1 });
    m.scores[socket.id] = finalScore||0;

    // Notify opponent that this player died
    socket.to(matchId).emit('opponent_died', { score: finalScore });

    // If first to die → opponent wins immediately (survival mode)
    if (m.deaths.length === 1) {
      // Give opponent 3 seconds to keep playing, then end match
      // Actually end immediately: first death = loss
      const [p1, p2] = m.players;
      const loserSocketId = socket.id;
      const winner = loserSocketId === p1.socketId ? p2 : p1;
      const loser  = loserSocketId === p1.socketId ? p1 : p2;

      const result = {
        player1: { username: p1.username, score: m.scores[p1.socketId]||0 },
        player2: { username: p2.username, score: m.scores[p2.socketId]||0 },
        winner: winner.username,
        draw: false,
        mode: 'survival',
      };
      io.to(matchId).emit('match_over', result);

      // Award rank pts: winner +20, loser -5
      const wKey = winner.username.toLowerCase();
      const lKey = loser.username.toLowerCase();
      if (db.users[wKey]) { db.users[wKey].rank_pts = (db.users[wKey].rank_pts||0) + 20; }
      if (db.users[lKey]) { db.users[lKey].rank_pts = Math.max(0,(db.users[lKey].rank_pts||0) - 5); }
      saveData(db);
      delete matches[matchId];
    }
  });

  socket.on('leave_queue', () => {
    const idx = queue.findIndex(p => p.socketId === socket.id);
    if (idx >= 0) queue.splice(idx, 1);
    io.emit('queue_update', { count: queue.length });
  });

  socket.on('disconnect', () => {
    const idx = queue.findIndex(p => p.socketId === socket.id);
    if (idx >= 0) queue.splice(idx, 1);
    io.emit('queue_update', { count: queue.length });
    const matchId = socket.data?.matchId;
    if (matchId && matches[matchId]) {
      io.to(matchId).emit('opponent_disconnected');
      delete matches[matchId];
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🐦 Flappy Master running at http://localhost:${PORT}\n`);
});
