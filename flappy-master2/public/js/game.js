// ── Constants & Config ────────────────────────────────────────────────────────
const API = '';  // same origin
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const GROUND_H = 52, PIPE_W = 46, BIRD_X = 78, BIRD_R = 14;
const GRAVITY = 0.37, JUMP = -6.8;

const DIFFS = {
  easy:   { speed: 1.9, gap: 158, freq: 84, label: 'easy',   desc: 'wider gaps, slower — perfect for beginners' },
  normal: { speed: 2.4, gap: 136, freq: 72, label: 'normal', desc: 'balanced speed and gap size' },
  hard:   { speed: 3.3, gap: 112, freq: 59, label: 'hard',   desc: 'fast pipes, tight gaps — experts only' },
};

const RANKS = [
  { name: 'Egg',           tiers: 1, pts: 0,    color: '#888',   bg: 'rgba(136,136,136,.15)' },
  { name: 'Hatchling',     tiers: 3, pts: 50,   color: '#cd7f32',bg: 'rgba(205,127,50,.15)' },
  { name: 'Fledgling',     tiers: 3, pts: 200,  color: '#aaa',   bg: 'rgba(170,170,170,.15)' },
  { name: 'Flapper',       tiers: 3, pts: 500,  color: '#fac775',bg: 'rgba(250,199,117,.15)' },
  { name: 'Tailwind',      tiers: 3, pts: 1000, color: '#5ec8f5',bg: 'rgba(94,200,245,.15)' },
  { name: 'Skybreaker',    tiers: 3, pts: 2000, color: '#7f77dd',bg: 'rgba(127,119,221,.15)' },
  { name: 'Pipebuster',    tiers: 3, pts: 4000, color: '#5dcaa5',bg: 'rgba(93,202,165,.15)' },
  { name: 'Flappy Master', tiers: 1, pts: 8000, color: '#e24b4a',bg: 'rgba(226,75,74,.15)' },
];

function getRankInfo(pts) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (pts >= RANKS[i].pts) {
      const r = RANKS[i], next = RANKS[i+1];
      const span = next ? next.pts - r.pts : 1;
      const within = pts - r.pts;
      const ti = next ? Math.min(Math.floor((within/span)*r.tiers), r.tiers-1) : 0;
      const pct = next ? Math.min(100, Math.round((within/span)*100)) : 100;
      const tLabel = r.tiers > 1 ? ' '+['I','II','III'][ti] : '';
      return { label: r.name+tLabel, color: r.color, bg: r.bg, pct, pts };
    }
  }
  return { label: 'Egg', color: '#888', bg: 'rgba(136,136,136,.15)', pct: 0, pts: 0 };
}

const BIRD_SKINS = [
  { id:'hatchling', name:'Hatchling', price:0,  colors:['#F5C842','#F0A800','#FF7A00'] },
  { id:'sky',       name:'Sky',       price:30,  colors:['#85B7EB','#378ADD','#185FA5'] },
  { id:'rose',      name:'Rose',      price:30,  colors:['#ED93B1','#D4537E','#993556'] },
  { id:'jade',      name:'Jade',      price:30,  colors:['#5DCAA5','#1D9E75','#0F6E56'] },
  { id:'amethyst',  name:'Amethyst',  price:50,  colors:['#AFA9EC','#7F77DD','#534AB7'] },
  { id:'coral',     name:'Coral',     price:50,  colors:['#F0997B','#D85A30','#993C1D'] },
  { id:'gold',      name:'Gold',      price:80,  colors:['#FAC775','#BA7517','#854F0B'] },
  { id:'shadow',    name:'Shadow',    price:80,  colors:['#B4B2A9','#5F5E5A','#2C2C2A'] },
  { id:'phoenix',   name:'Phoenix',   price:150, colors:['#F09595','#E24B4A','#fac775'] },
];
const PIPE_SKINS = [
  { id:'bamboo',    name:'Bamboo',    price:0,   light:'#5BC63C', dark:'#4DB533' },
  { id:'sky',       name:'Sky',       price:20,  light:'#378ADD', dark:'#185FA5' },
  { id:'lava',      name:'Lava',      price:20,  light:'#E24B4A', dark:'#A32D2D' },
  { id:'amethyst',  name:'Amethyst',  price:30,  light:'#7F77DD', dark:'#534AB7' },
  { id:'teal',      name:'Teal',      price:30,  light:'#1D9E75', dark:'#0F6E56' },
  { id:'gold',      name:'Gold',      price:50,  light:'#EF9F27', dark:'#BA7517' },
  { id:'rose',      name:'Rose',      price:50,  light:'#D4537E', dark:'#993556' },
  { id:'midnight',  name:'Midnight',  price:80,  light:'#5F5E5A', dark:'#2C2C2A' },
  { id:'neon',      name:'Neon',      price:150, light:'#5DCAA5', dark:'#E24B4A' },
];
const BG_SKINS = [
  { id:'sky',     name:'Day',    price:0,   sky:'#5EC8F5', clouds:'rgba(255,255,255,.55)' },
  { id:'sunset',  name:'Sunset', price:25,  sky:'#e07b50', clouds:'rgba(255,210,160,.5)'  },
  { id:'night',   name:'Night',  price:25,  sky:'#111428', clouds:'rgba(60,65,110,.6)'    },
  { id:'forest',  name:'Forest', price:35,  sky:'#639922', clouds:'rgba(190,240,160,.4)'  },
  { id:'ocean',   name:'Ocean',  price:35,  sky:'#185FA5', clouds:'rgba(160,210,255,.45)' },
  { id:'candy',   name:'Candy',  price:50,  sky:'#ED93B1', clouds:'rgba(255,230,245,.65)' },
  { id:'storm',   name:'Storm',  price:50,  sky:'#2a2a35', clouds:'rgba(100,100,120,.55)' },
  { id:'aurora',  name:'Aurora', price:80,  sky:'#063020', clouds:'rgba(80,200,130,.35)'  },
  { id:'cosmic',  name:'Cosmic', price:150, sky:'#16103a', clouds:'rgba(160,140,220,.4)'  },
];

// ── State ─────────────────────────────────────────────────────────────────────
let currentUser = null;
let authToken = localStorage.getItem('fm_token') || null;
let activeScreen = 'screen-menu';
let hubSection = 'play';
let chosenDiff = 'normal';
let gameMode = 'normal';
let bird, pipes, score, frame, gState, groundOffset, sessionBest, combo, maxCombo, particles, coinPopups, deadBird;
let menuFrame = 0, menuBirdY = H/2, menuBirdVY = 0, menuPipes = [];
let audioCtx = null;
let shopSeed = Math.floor(Date.now() / (5*60*1000));
let shopRotateAt = (shopSeed+1) * 5*60*1000;
let visibleBirds, visiblePipes, visibleBgs;
let matchId = null, opponentName = null, opponentScore = 0, matchCountdown = null;
let profileTab = 'hist';

// ── Socket.io ─────────────────────────────────────────────────────────────────
const socket = io();

socket.on('queue_update', ({ count }) => {
  const el = document.getElementById('mm-status');
  if (el) el.textContent = `${count} player${count!==1?'s':''} in queue`;
});

socket.on('match_found', ({ matchId: mid, seed, opponent, opponentRank }) => {
  matchId = mid; opponentName = opponent; opponentScore = 0;
  document.getElementById('mm-cancel-btn').style.display = 'none';
  document.getElementById('mm-title').textContent = `matched vs ${opponent}`;
  document.getElementById('mm-status').textContent = opponentRank;
  socket.emit('match_ready', { matchId: mid });
});

socket.on('match_start', ({ startAt, seed: matchSeed }) => {
  let remaining = Math.ceil((startAt - Date.now()) / 1000);
  const cd = document.getElementById('mm-countdown');
  cd.style.display = 'block';
  document.getElementById('mm-bird-anim').textContent = '⚔';
  matchCountdown = setInterval(() => {
    remaining = Math.ceil((startAt - Date.now()) / 1000);
    if (remaining > 0) { cd.textContent = remaining; }
    else {
      clearInterval(matchCountdown);
      startLiveMatch(matchSeed);
    }
  }, 100);
});

socket.on('opponent_score', ({ score: os, combo: oc }) => {
  opponentScore = os;
  const el = document.getElementById('vs-opp');
  if (el) el.textContent = os;
});
socket.on('opponent_died', ({ score: os }) => {
  opponentScore = os;
  const st = document.getElementById('vs-status');
  if (st) st.textContent = `${opponentName} died with ${os}!`;
});
socket.on('opponent_disconnected', () => {
  const st = document.getElementById('vs-status');
  if (st) st.textContent = 'opponent disconnected — you win!';
  gState = 'dead';
});
socket.on('match_over', (result) => {
  const isWinner = result.winner === currentUser?.username;
  const isDraw = result.draw;
  if (gState !== 'dead') { gState = 'dead'; }
  const st = document.getElementById('vs-status');
  if (st) st.textContent = isDraw ? 'draw!' : isWinner ? '🏆 you win! +20 rank pts' : `${result.winner} wins. -5 rank pts`;
  if (currentUser) refreshUser();
});

function startLiveMatch(seed) {
  showScreen('screen-game');
  document.getElementById('versus-panel').style.display = 'block';
  document.getElementById('vs-opponent').textContent = opponentName;
  document.getElementById('vs-opp-name').textContent = opponentName;
  document.getElementById('save-btn').style.display = 'none';
  resetGame(seed);
  gState = 'playing';
  spawnPipe(seed);
}

// ── Auth & API ────────────────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
  const res = await fetch(API + path, { ...opts, headers: { ...headers, ...opts.headers } });
  return res.json();
}

async function refreshUser() {
  if (!authToken) return;
  const data = await apiFetch('/api/me');
  if (data.user) { currentUser = data.user; updateHubHeader(); }
}

async function doRegister() {
  const username = document.getElementById('reg-name').value.trim();
  const password = document.getElementById('reg-pass').value;
  const password2 = document.getElementById('reg-pass2').value;
  const err = document.getElementById('reg-err');
  if (!username || username.length < 3) { err.textContent = 'Username must be 3+ characters'; return; }
  if (password.length < 12) { err.textContent = 'Password must be 12+ characters'; return; }
  if (password !== password2) { err.textContent = 'Passwords do not match'; return; }
  const data = await apiFetch('/api/register', { method: 'POST', body: JSON.stringify({ username, password }) });
  if (data.error) { err.textContent = data.error; return; }
  authToken = data.token; localStorage.setItem('fm_token', authToken);
  currentUser = data.user; err.textContent = ''; goHub();
}

async function doLogin() {
  const username = document.getElementById('log-name').value.trim();
  const password = document.getElementById('log-pass').value;
  const err = document.getElementById('log-err');
  const data = await apiFetch('/api/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  if (data.error) { err.textContent = data.error; return; }
  authToken = data.token; localStorage.setItem('fm_token', authToken);
  currentUser = data.user; err.textContent = ''; goHub();
}

function doLogout() {
  authToken = null; currentUser = null; localStorage.removeItem('fm_token');
  socket.emit('leave_queue');
  showScreen('screen-menu');
  loadMenuLb();
}

function playAsGuest() {
  currentUser = null;
  goHub();
}

// ── UI Helpers ────────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  activeScreen = id;
}

function togglePw(id, btn) {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'text' ? 'password' : 'text';
  btn.textContent = inp.type === 'text' ? '🙈' : '👁';
}

function updateStrength() {
  const p = document.getElementById('reg-pass').value;
  const bar = document.getElementById('strength-bar');
  const lbl = document.getElementById('strength-label');
  let s = 0;
  if (p.length >= 12) s++; if (p.length >= 16) s++;
  if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
  const lvl = p.length < 12 ? 0 : Math.min(s, 5);
  const L = [
    { w:'0%',   c:'#e24b4a', t:'too short — need 12+ characters' },
    { w:'20%',  c:'#e24b4a', t:'weak' },
    { w:'40%',  c:'#ef9f27', t:'fair' },
    { w:'60%',  c:'#ef9f27', t:'moderate' },
    { w:'80%',  c:'#5dcaa5', t:'strong' },
    { w:'100%', c:'#1d9e75', t:'very strong' },
  ];
  bar.style.width = L[lvl].w; bar.style.background = L[lvl].c;
  lbl.textContent = L[lvl].t;
}

const AVC = [
  { bg:'#1a2a40', fg:'#5ec8f5' }, { bg:'#1a3028', fg:'#5dcaa5' },
  { bg:'#302010', fg:'#fac775' }, { bg:'#221a3a', fg:'#afa9ec' },
  { bg:'#3a1a10', fg:'#f0997b' }, { bg:'#2a1a28', fg:'#ed93b1' },
];
function avColor(n) { let h=0; for(let c of n) h=(h*31+c.charCodeAt(0))&0xffff; return AVC[h%AVC.length]; }
function initials(n) { return n.trim().split(/\s+/).map(w=>w[0].toUpperCase()).slice(0,2).join(''); }
function setAv(el, n, sz) {
  const a = avColor(n);
  el.style.cssText += `background:${a.bg};color:${a.fg};width:${sz}px;height:${sz}px;font-size:${sz*.35}px;`;
  el.textContent = initials(n) || '?';
}

// ── Hub ───────────────────────────────────────────────────────────────────────
function goHub() {
  updateHubHeader();
  goSection('play');
  showScreen('screen-hub');
}

function updateHubHeader() {
  const isGuest = !currentUser;
  const name = isGuest ? 'Guest' : currentUser.username;
  setAv(document.getElementById('hub-avatar'), name, 36);
  document.getElementById('hub-name').textContent = name;
  const badge = document.getElementById('hub-rank-badge');
  if (isGuest) {
    badge.textContent = 'Guest'; badge.style.cssText = 'background:rgba(100,100,100,.2);color:#888;';
    document.getElementById('hub-coins').textContent = '—';
    document.getElementById('hub-rank-bar').style.width = '0%';
    document.getElementById('hub-rank-progress').textContent = 'create an account to earn rank & coins';
  } else {
    const ri = getRankInfo(currentUser.rank_pts || 0);
    badge.textContent = ri.label; badge.style.cssText = `background:${ri.bg};color:${ri.color};`;
    document.getElementById('hub-coins').textContent = currentUser.coins || 0;
    document.getElementById('hub-rank-bar').style.cssText = `width:${ri.pct}%;background:${ri.color};`;
    document.getElementById('hub-rank-progress').textContent =
      ri.pct === 100 && currentUser.rank_pts >= 8000 ? 'Flappy Master — max rank!' : `${ri.pct}% to next tier`;
  }
}

function goSection(s) {
  hubSection = s;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const nb = document.querySelector(`.nav-btn[data-section="${s}"]`);
  if (nb) nb.classList.add('active');
  const el = document.getElementById('hub-section');
  if (s === 'play')    renderPlaySection(el);
  else if (s === 'ranked')   renderRankedSection(el);
  else if (s === 'daily')    renderDailySection(el);
  else if (s === 'shop')     renderShopSection(el);
  else if (s === 'profile')  renderProfileSection(el);
}

// ── Section: Play ─────────────────────────────────────────────────────────────
function renderPlaySection(el) {
  el.innerHTML = `
    <div class="card">
      <div class="card-title">▶ play</div>
      <div class="field"><label>difficulty</label></div>
      <div class="diff-row">
        ${['easy','normal','hard'].map(d=>`<button class="diff-btn${chosenDiff===d?' sel':''}" onclick="selDiff('${d}')">${d}</button>`).join('')}
      </div>
      <div style="font-size:11px;color:var(--text-secondary);margin-bottom:12px;">${DIFFS[chosenDiff].desc}</div>
      <button class="btn-p" onclick="startGame('normal')">play now</button>
    </div>
    <div class="card">
      <div class="card-title">🏆 global leaderboard</div>
      <div id="play-lb"><div class="empty-msg">loading...</div></div>
    </div>`;
  loadGlobalLb();
}

function selDiff(d) { chosenDiff = d; renderPlaySection(document.getElementById('hub-section')); }

async function loadGlobalLb() {
  const el = document.getElementById('play-lb');
  if (!el) return;
  const rows = await apiFetch('/api/leaderboard');
  el.innerHTML = renderLbHTML(rows, 'score');
}

async function loadMenuLb() {
  const el = document.getElementById('menu-lb');
  if (!el) return;
  const rows = await apiFetch('/api/leaderboard');
  el.innerHTML = renderLbHTML(rows.slice(0,5), 'score');
}

// ── Section: Ranked ───────────────────────────────────────────────────────────
async function renderRankedSection(el) {
  if (!currentUser) { el.innerHTML = '<div class="card"><p class="empty-msg">create an account to play ranked</p></div>'; return; }
  const ri = getRankInfo(currentUser.rank_pts || 0);
  const lbRows = await apiFetch('/api/leaderboard/ranked');
  el.innerHTML = `
    <div class="card">
      <div class="card-title">⚔ ranked mode</div>
      <div style="margin-bottom:10px;">
        <span class="rank-badge" style="background:${ri.bg};color:${ri.color};font-size:12px;padding:3px 10px;border-radius:20px;">${ri.label}</span>
      </div>
      <div class="rank-bar-wrap"><div class="rank-bar" style="width:${ri.pct}%;background:${ri.color};"></div></div>
      <div style="font-size:10px;color:var(--text-tertiary);margin-bottom:10px;">${currentUser.rank_pts||0} rank pts · ${ri.pct}% to next</div>
      <div style="font-size:11px;color:var(--text-secondary);margin-bottom:10px;">
        Score 10+ = +5pts · 25+ = +15pts · 50+ = +30pts<br>
        Win a live match = +20pts · Lose = −5pts
      </div>
      <button class="btn-p" onclick="joinRankedQueue()">⚔ find opponent</button>
      <div style="font-size:10px;color:var(--text-tertiary);text-align:center;margin-top:6px;" id="queue-count"></div>
    </div>
    <div class="card">
      <div class="card-title">🏆 rank leaderboard</div>
      ${renderRankedLbHTML(lbRows)}
    </div>
    ${renderRankLadderHTML(currentUser.rank_pts||0)}`;
}

function renderRankedLbHTML(rows) {
  if (!rows.length) return '<p class="empty-msg">no ranked players yet</p>';
  return rows.map((r, i) => {
    const ri2 = getRankInfo(r.rank_pts||0);
    const isYou = currentUser && r.username === currentUser.username;
    const av = avColor(r.username);
    return `<div class="lb-row">
      <span class="lb-rank ${i===0?'g':i===1?'s':i===2?'b':''}">#${i+1}</span>
      <div class="lb-avatar" style="background:${av.bg};color:${av.fg};">${initials(r.username)}</div>
      <span class="lb-name">${r.username}${isYou?' <span class="lb-you">you</span>':''}</span>
      <span style="font-size:9px;padding:1px 5px;border-radius:3px;background:${ri2.bg};color:${ri2.color};">${ri2.label}</span>
      <span class="lb-pts" style="color:var(--gold)">${r.rank_pts||0}</span>
    </div>`;
  }).join('');
}

function renderRankLadderHTML(pts) {
  return `<div class="card"><div class="card-title">rank ladder</div>${RANKS.map((r,i)=>{
    const active = pts >= r.pts && (i===RANKS.length-1 || pts < RANKS[i+1].pts);
    return `<div class="rank-ladder-item">
      <div class="rank-dot" style="background:${r.color};${active?'box-shadow:0 0 0 3px '+r.color+'33;':''}"></div>
      <span style="font-size:11px;color:${active?r.color:'var(--text-secondary)'};font-weight:${active?700:400};">${r.name}${r.tiers>1?' I–III':''}</span>
      <span style="font-size:10px;color:var(--text-tertiary);margin-left:auto;">${r.pts} pts</span>
    </div>`;
  }).join('')}</div>`;
}

function joinRankedQueue() {
  showScreen('screen-matchmaking');
  document.getElementById('mm-title').textContent = 'finding opponent...';
  document.getElementById('mm-status').textContent = 'in queue';
  document.getElementById('mm-cancel-btn').style.display = 'block';
  document.getElementById('mm-countdown').style.display = 'none';
  document.getElementById('mm-bird-anim').textContent = '🐦';
  socket.emit('join_ranked', { token: authToken, username: currentUser.username });
}

function leaveQueue() {
  socket.emit('leave_queue');
  if (matchCountdown) clearInterval(matchCountdown);
  goHub();
}

// ── Section: Daily ────────────────────────────────────────────────────────────
async function renderDailySection(el) {
  const info = await apiFetch('/api/daily');
  const lbRows = await apiFetch('/api/leaderboard/daily');
  const done = currentUser && currentUser.daily_done === info.key;
  el.innerHTML = `
    <div class="card">
      <div class="card-title">📅 daily challenge</div>
      <div style="font-size:11px;color:var(--text-secondary);margin-bottom:6px;">
        Today's seed: <strong>#${info.seed % 10000}</strong> — everyone faces the same pipes!
      </div>
      ${done ? '<div style="font-size:11px;color:var(--success);margin-bottom:8px;">✓ completed today! come back tomorrow.</div>' : ''}
      <button class="btn-p" onclick="startGame(\'daily\')" ${done?'disabled':''}>${done?'completed':'play daily challenge'}</button>
    </div>
    <div class="card">
      <div class="card-title">today's leaderboard</div>
      ${lbRows.length ? renderLbHTML(lbRows, 'score') : '<p class="empty-msg">no scores yet today — be first!</p>'}
    </div>`;
}

// ── Section: Shop ─────────────────────────────────────────────────────────────
function rotateShop() {
  function seededShuffle(arr, seed) {
    const a = [...arr]; let s = seed;
    for (let i = a.length-1; i > 0; i--) { s=(s*9301+49297)%233280; const j=Math.floor((s/233280)*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a.slice(0,3);
  }
  visibleBirds = seededShuffle(BIRD_SKINS, shopSeed);
  visiblePipes = seededShuffle(PIPE_SKINS, shopSeed+1);
  visibleBgs   = seededShuffle(BG_SKINS,   shopSeed+2);
}

function renderShopSection(el) {
  const now = Date.now();
  if (now > shopRotateAt) { shopSeed = Math.floor(now/(5*60*1000)); shopRotateAt=(shopSeed+1)*5*60*1000; rotateShop(); }
  const secs = Math.max(0, Math.round((shopRotateAt - now)/1000));
  const mm = String(Math.floor(secs/60)).padStart(2,'0'), ss = String(secs%60).padStart(2,'0');
  const owned = currentUser ? {
    birds: currentUser.owned_birds || ['hatchling'],
    pipes: currentUser.owned_pipes || ['bamboo'],
    bgs:   currentUser.owned_bgs   || ['sky'],
    eBird: currentUser.equipped_bird || 'hatchling',
    ePipe: currentUser.equipped_pipe || 'bamboo',
    eBg:   currentUser.equipped_bg   || 'sky',
    coins: currentUser.coins || 0,
  } : { birds:['hatchling'], pipes:['bamboo'], bgs:['sky'], eBird:'hatchling', ePipe:'bamboo', eBg:'sky', coins:0 };

  el.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div class="card-title" style="margin:0;">🛍 shop</div>
        <div class="shop-timer">rotates in ${mm}:${ss}</div>
      </div>
      <div class="shop-section-label">🐦 bird skins</div>
      <div class="shop-grid">${visibleBirds.map(s=>shopItemHTML('bird',s,owned)).join('')}</div>
      <div class="shop-section-label">🎋 pipe colors</div>
      <div class="shop-grid">${visiblePipes.map(s=>shopItemHTML('pipe',s,owned)).join('')}</div>
      <div class="shop-section-label">🌄 backgrounds</div>
      <div class="shop-grid">${visibleBgs.map(s=>shopItemHTML('bg',s,owned)).join('')}</div>
    </div>`;
  requestAnimationFrame(() => visibleBirds.forEach(s => drawShopBird(s)));
}

function shopItemHTML(type, s, owned) {
  const ownArr = type==='bird'?owned.birds:type==='pipe'?owned.pipes:owned.bgs;
  const equ = type==='bird'?owned.eBird:type==='pipe'?owned.ePipe:owned.eBg;
  const isOwned = ownArr.includes(s.id);
  const isEquipped = equ === s.id;
  const cls = isEquipped?'equipped':isOwned?'owned':'';
  const label = isEquipped?'✓ on':isOwned?'use':(s.price===0?'free':'🪙 '+s.price);
  if (type==='bird') return `<div class="shop-item ${cls}" onclick="shopAction('bird','${s.id}',${s.price})"><canvas id="sbrd-${s.id}" width="42" height="32"></canvas><div class="shop-item-name">${s.name}</div><div class="shop-item-price">${label}</div></div>`;
  if (type==='pipe') return `<div class="shop-item ${cls}" onclick="shopAction('pipe','${s.id}',${s.price})"><div style="width:42px;height:32px;margin:0 auto 4px;display:flex;align-items:center;justify-content:center;gap:4px;"><div style="width:15px;height:28px;background:${s.light};border-radius:3px;"></div><div style="width:15px;height:28px;background:${s.dark};border-radius:3px;"></div></div><div class="shop-item-name">${s.name}</div><div class="shop-item-price">${label}</div></div>`;
  return `<div class="shop-item ${cls}" onclick="shopAction('bg','${s.id}',${s.price})"><div style="width:42px;height:32px;margin:0 auto 4px;border-radius:4px;background:${s.sky};display:flex;align-items:center;justify-content:center;"><div style="width:30px;height:10px;border-radius:5px;background:${s.clouds};"></div></div><div class="shop-item-name">${s.name}</div><div class="shop-item-price">${label}</div></div>`;
}

function drawShopBird(skin) {
  const c = document.getElementById('sbrd-'+skin.id); if (!c) return;
  const x = c.getContext('2d'); x.clearRect(0,0,42,32);
  x.fillStyle=skin.colors[0];x.beginPath();x.ellipse(21,16,12,10,0,0,Math.PI*2);x.fill();
  x.fillStyle=skin.colors[1];x.beginPath();x.ellipse(23,19,9,7,0.3,0,Math.PI*2);x.fill();
  x.fillStyle='white';x.beginPath();x.arc(27,11,3.5,0,Math.PI*2);x.fill();
  x.fillStyle='#1a1a2e';x.beginPath();x.arc(28,10.5,2,0,Math.PI*2);x.fill();
  x.fillStyle=skin.colors[2];x.beginPath();x.moveTo(31,14);x.lineTo(38,16);x.lineTo(31,18);x.closePath();x.fill();
}

async function shopAction(type, id, price) {
  if (!currentUser) { alert('create an account to use the shop!'); return; }
  const ownArr = type==='bird'?currentUser.owned_birds:type==='pipe'?currentUser.owned_pipes:currentUser.owned_bgs;
  if (ownArr && ownArr.includes(id)) {
    const data = await apiFetch('/api/shop/equip', { method:'POST', body: JSON.stringify({ type, itemId: id }) });
    if (data.user) { currentUser = data.user; updateHubHeader(); renderShopSection(document.getElementById('hub-section')); }
  } else {
    if ((currentUser.coins||0) < price) { alert(`not enough coins! you have ${currentUser.coins||0} 🪙, need ${price} 🪙`); return; }
    if (!confirm(`buy ${id} for ${price} 🪙?`)) return;
    const data = await apiFetch('/api/shop/buy', { method:'POST', body: JSON.stringify({ type, itemId: id, price }) });
    if (data.error) { alert(data.error); return; }
    if (data.user) { currentUser = data.user; updateHubHeader(); renderShopSection(document.getElementById('hub-section')); }
  }
}

// ── Section: Profile ──────────────────────────────────────────────────────────
async function renderProfileSection(el) {
  if (!currentUser) { el.innerHTML = '<div class="card"><p class="empty-msg">create an account to see your profile</p></div>'; return; }
  const hist = await apiFetch('/api/history');
  const ri = getRankInfo(currentUser.rank_pts||0);
  const av = avColor(currentUser.username);
  el.innerHTML = `
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div class="prof-avatar-large" style="background:${av.bg};color:${av.fg};">${initials(currentUser.username)}</div>
        <div>
          <div style="font-size:16px;font-weight:700;">${currentUser.username}</div>
          <div style="font-size:10px;color:var(--text-tertiary);">joined ${new Date((currentUser.created_at||0)*1000).toLocaleDateString()}</div>
        </div>
      </div>
      <div class="metrics-row" style="margin-bottom:12px;">
        <div class="metric"><div class="metric-label">best</div><div class="metric-val">${currentUser.best_score||0}</div></div>
        <div class="metric"><div class="metric-label">games</div><div class="metric-val">${currentUser.games_played||0}</div></div>
        <div class="metric"><div class="metric-label">coins</div><div class="metric-val">${currentUser.coins||0}</div></div>
      </div>
      <span class="rank-badge" style="background:${ri.bg};color:${ri.color};font-size:12px;padding:3px 10px;border-radius:20px;display:inline-block;margin-bottom:6px;">${ri.label}</span>
      <div class="rank-bar-wrap"><div class="rank-bar" style="width:${ri.pct}%;background:${ri.color};"></div></div>
      <div style="font-size:10px;color:var(--text-tertiary);margin-bottom:12px;">${currentUser.rank_pts||0} rank pts</div>
      <div class="tab-row">
        <button class="tab-btn${profileTab==='hist'?' active':''}" onclick="switchProfileTab('hist')">history</button>
        <button class="tab-btn${profileTab==='rank'?' active':''}" onclick="switchProfileTab('rank')">rank ladder</button>
      </div>
      <div id="prof-content">
        ${profileTab==='hist' ? renderHistHTML(hist) : renderRankLadderHTML(currentUser.rank_pts||0).replace(/<div class="card">.*?<div class="card-title">rank ladder<\/div>/s,'')}
      </div>
    </div>`;
}

function switchProfileTab(t) { profileTab = t; renderProfileSection(document.getElementById('hub-section')); }

function renderHistHTML(hist) {
  if (!hist.length) return '<p class="empty-msg">no games yet — start playing!</p>';
  return hist.slice(0,10).map(r => {
    const d = new Date(r.created_at * 1000);
    return `<div class="hist-item">
      <span class="hist-score">${r.score} pts</span>
      <span class="hist-tag tag-${r.mode==='ranked'?'ranked':r.mode==='daily'?'daily':r.diff||'normal'}">${r.mode==='ranked'?'ranked':r.mode==='daily'?'daily':r.diff}</span>
      <span style="font-size:10px;color:var(--text-tertiary);">×${r.max_combo} combo</span>
      <span class="hist-date">${d.toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span>
    </div>`;
  }).join('');
}

// ── Leaderboard HTML ──────────────────────────────────────────────────────────
function renderLbHTML(rows, scoreKey = 'score') {
  if (!rows.length) return '<p class="empty-msg">no scores yet</p>';
  return rows.slice(0,8).map((r, i) => {
    const isYou = currentUser && r.username === currentUser.username;
    const av = avColor(r.username);
    return `<div class="lb-row">
      <span class="lb-rank ${i===0?'g':i===1?'s':i===2?'b':''}">#${i+1}</span>
      <div class="lb-avatar" style="background:${av.bg};color:${av.fg};">${initials(r.username)}</div>
      <span class="lb-name">${r.username}${isYou?' <span class="lb-you">you</span>':''}</span>
      <span class="lb-pts">${r[scoreKey]}</span>
    </div>`;
  }).join('');
}

// ── Game ──────────────────────────────────────────────────────────────────────
function getEquipped() {
  if (!currentUser) return { bird: BIRD_SKINS[0], pipe: PIPE_SKINS[0], bg: BG_SKINS[0] };
  return {
    bird: BIRD_SKINS.find(s=>s.id===currentUser.equipped_bird)||BIRD_SKINS[0],
    pipe: PIPE_SKINS.find(s=>s.id===currentUser.equipped_pipe)||PIPE_SKINS[0],
    bg:   BG_SKINS.find(s=>s.id===currentUser.equipped_bg)||BG_SKINS[0],
  };
}

function startGame(mode) {
  gameMode = mode; sessionBest = 0; combo = 1; maxCombo = 1;
  matchId = null; opponentName = null; opponentScore = 0;
  const isGuest = !currentUser;
  const n = currentUser ? currentUser.username : 'Guest';
  setAv(document.getElementById('hud-avatar'), n, 26);
  document.getElementById('hud-name').textContent = n;
  document.getElementById('hud-coins').textContent = currentUser ? currentUser.coins||0 : '—';
  document.getElementById('hud-score').textContent = '0';
  document.getElementById('hud-combo').textContent = '×1';
  document.getElementById('hud-best').textContent = '0';
  document.getElementById('save-btn').style.display = isGuest ? 'none' : 'block';
  document.getElementById('versus-panel').style.display = 'none';
  loadGameLb();
  resetGame();
  showScreen('screen-game');
}

function exitToHub() { resetGame(); goHub(); }

async function loadGameLb() {
  const el = document.getElementById('lb-list'); if (!el) return;
  const rows = await apiFetch(gameMode==='daily' ? '/api/leaderboard/daily' : '/api/leaderboard');
  el.innerHTML = renderLbHTML(rows);
}

async function saveScore() {
  if (!currentUser || score === 0) return;
  const data = await apiFetch('/api/score', {
    method: 'POST',
    body: JSON.stringify({ score, mode: gameMode, diff: chosenDiff, max_combo: maxCombo }),
  });
  if (data.user) {
    currentUser = data.user; updateHubHeader();
    document.getElementById('hud-coins').textContent = currentUser.coins||0;
    if (data.rank_pts_gained > 0) {
      const st = document.getElementById('vs-status');
      if (st && st.style.display !== 'none') {} // already shown
    }
  }
  loadGameLb();
}

function resetGame(seedOverride) {
  bird = { y: H/2, vy: 0, angle: 0 };
  pipes = []; score = 0; frame = 0; groundOffset = 0;
  gState = 'idle'; deadBird = null; particles = []; coinPopups = [];
  combo = 1; maxCombo = 1;
  if (document.getElementById('hud-score')) document.getElementById('hud-score').textContent = '0';
  if (document.getElementById('hud-combo')) document.getElementById('hud-combo').textContent = '×1';
}

let dailyRandState = 0;
function dailyRand() { dailyRandState=(dailyRandState*9301+49297)%233280; return dailyRandState/233280; }

function spawnPipe(seedOverride) {
  const d = gameMode==='ranked' ? DIFFS.normal : DIFFS[chosenDiff];
  let topH;
  if (gameMode === 'daily') {
    if (frame === 0) { const s = new Date(); dailyRandState = s.getFullYear()*10000+(s.getMonth()+1)*100+s.getDate(); }
    topH = 65 + dailyRand() * (H - GROUND_H - d.gap - 80);
  } else if (seedOverride !== undefined) {
    dailyRandState = seedOverride + pipes.length * 997;
    topH = 65 + dailyRand() * (H - GROUND_H - d.gap - 80);
  } else {
    topH = 65 + Math.random() * (H - GROUND_H - d.gap - 80);
  }
  pipes.push({ x: W+10, topH, passed: false });
}

function getAudio() { if (!audioCtx) { try { audioCtx = new(window.AudioContext||window.webkitAudioContext)(); } catch(e){} } return audioCtx; }
function playFlap() { const ac=getAudio();if(!ac)return;const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.setValueAtTime(520,ac.currentTime);o.frequency.exponentialRampToValueAtTime(780,ac.currentTime+0.06);g.gain.setValueAtTime(0.13,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.1);o.start();o.stop(ac.currentTime+0.1); }
function playPoint(c) { const ac=getAudio();if(!ac)return;const fs=c>=3?[659,784,1047]:[523,659,784];fs.forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='triangle';o.frequency.value=f;const t=ac.currentTime+i*0.06;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.11,t+0.02);g.gain.exponentialRampToValueAtTime(0.001,t+0.1);o.start(t);o.stop(t+0.1);}); }
function playCrunch() { const ac=getAudio();if(!ac)return;const buf=ac.createBuffer(1,ac.sampleRate*0.22,ac.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,1.5);const src=ac.createBufferSource(),g=ac.createGain(),f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=380;src.buffer=buf;src.connect(f);f.connect(g);g.connect(ac.destination);g.gain.setValueAtTime(0.5,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.22);src.start();src.stop(ac.currentTime+0.22); }

function spawnFeathers(x, y, skin) {
  for (let i=0;i<14;i++) {
    const a=Math.random()*Math.PI*2,sp=1+Math.random()*3;
    particles.push({ x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,life:1,color:skin.colors[Math.floor(Math.random()*3)],size:2+Math.random()*4,rot:Math.random()*Math.PI*2,rotV:(Math.random()-.5)*.2 });
  }
}

function flap() {
  if (activeScreen !== 'screen-game') return;
  if (gState === 'idle') { gState='playing'; spawnPipe(); playFlap(); }
  else if (gState === 'playing') { bird.vy=JUMP; playFlap(); }
  else if (gState === 'dead' && !deadBird) { resetGame(); }
}
canvas.addEventListener('click', flap);
document.addEventListener('keydown', e => { if (e.code==='Space'){ e.preventDefault(); flap(); }});

function drawSky(bg) {
  ctx.fillStyle = bg.sky; ctx.fillRect(0,0,W,H-GROUND_H);
  ctx.fillStyle = bg.clouds;
  const t = menuFrame*.3;
  [[42+Math.sin(t*.009)*7,55],[168,38+Math.sin(t*.007)*4],[262,65]].forEach(([cx,cy])=>{
    ctx.beginPath();ctx.ellipse(cx,cy,25,11,0,0,Math.PI*2);ctx.ellipse(cx+14,cy+3,17,9,0,0,Math.PI*2);ctx.ellipse(cx-12,cy+3,14,8,0,0,Math.PI*2);ctx.fill();
  });
}
function drawGround() { ctx.fillStyle='#5aaa3a';ctx.fillRect(0,H-GROUND_H,W,13);ctx.fillStyle='#3e8a28';ctx.fillRect(0,H-GROUND_H+13,W,GROUND_H-13); }
function drawPipe(x,topH,gap,pipe) {
  const botY=topH+gap,capH=15,capW=PIPE_W+7,ox=(capW-PIPE_W)/2;
  ctx.fillStyle=pipe.light;ctx.fillRect(x,0,PIPE_W,topH);ctx.fillRect(x,botY,PIPE_W,H-GROUND_H-botY);
  ctx.fillStyle=pipe.dark;
  ctx.beginPath();ctx.roundRect(x-ox,topH-capH,capW,capH,[0,0,4,4]);ctx.fill();
  ctx.beginPath();ctx.roundRect(x-ox,botY,capW,capH,[4,4,0,0]);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(x+3,0,6,topH);ctx.fillRect(x+3,botY,6,H-GROUND_H-botY);
}
function drawBirdAt(bx,by,angle,wb,skin) {
  ctx.save();ctx.translate(bx,by);ctx.rotate(Math.min(Math.max(angle,-.5),Math.PI*1.5));
  ctx.fillStyle=skin.colors[0];ctx.beginPath();ctx.ellipse(0,0,BIRD_R,BIRD_R-3,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=skin.colors[1];ctx.beginPath();ctx.ellipse(2,3,BIRD_R-3,BIRD_R-6,.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=skin.colors[1];ctx.beginPath();ctx.ellipse(-4,2+wb,8,4,-.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='white';ctx.beginPath();ctx.arc(6,-5,4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#111';ctx.beginPath();ctx.arc(7,-5.5,2.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='white';ctx.beginPath();ctx.arc(8,-6.5,1,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=skin.colors[2];ctx.beginPath();ctx.moveTo(10,-1);ctx.lineTo(17,2);ctx.lineTo(10,4);ctx.closePath();ctx.fill();
  ctx.restore();
}

function gameLoop() {
  menuFrame++; frame++;
  const eq = getEquipped();
  const d = gameMode==='ranked' ? DIFFS.normal : DIFFS[chosenDiff];
  drawSky(eq.bg);
  if (gState==='playing') {
    bird.vy+=GRAVITY;bird.y+=bird.vy;bird.angle=bird.vy*.08;
    groundOffset+=d.speed;
    if(frame%d.freq===0) spawnPipe(matchId?matchId.length:undefined);
    pipes.forEach(p=>p.x-=d.speed);
    pipes=pipes.filter(p=>p.x+PIPE_W>0);
    let hit=false;
    pipes.forEach(p=>{
      if(!p.passed&&p.x+PIPE_W<BIRD_X){
        p.passed=true;combo=Math.min(combo+1,8);maxCombo=Math.max(maxCombo,combo);
        score+=combo;
        document.getElementById('hud-score').textContent=score;
        document.getElementById('hud-combo').textContent='×'+combo;
        if(score>sessionBest){sessionBest=score;document.getElementById('hud-best').textContent=sessionBest;}
        if(currentUser){
          const cu=document.getElementById('hud-coins');
          currentUser.coins=(currentUser.coins||0)+1;
          if(cu)cu.textContent=currentUser.coins;
          const yvs=document.getElementById('vs-you');if(yvs)yvs.textContent=score;
          if(matchId)socket.emit('score_update',{matchId,score,combo});
        }
        coinPopups.push({x:p.x+PIPE_W/2,y:H/2,text:'+1',life:1,vy:-1.4});
        playPoint(combo);
      }
      const br=BIRD_R-3;
      if(BIRD_X+br>p.x&&BIRD_X-br<p.x+PIPE_W&&(bird.y-br<p.topH||bird.y+br>p.topH+d.gap))hit=true;
    });
    if(bird.y+BIRD_R>H-GROUND_H||bird.y-BIRD_R<0)hit=true;
    if(hit){
      gState='dying';
      deadBird={x:BIRD_X,y:bird.y,vy:bird.vy-1.5,vx:1.1,angle:bird.angle,spin:.2};
      combo=1;document.getElementById('hud-combo').textContent='×1';
      spawnFeathers(BIRD_X,bird.y,eq.bird);playCrunch();
      if(matchId)socket.emit('match_died',{matchId,finalScore:score,maxCombo});
    }
  }
  if(gState==='dying'&&deadBird){
    deadBird.vy+=.48;deadBird.y+=deadBird.vy;deadBird.x+=deadBird.vx;deadBird.angle+=deadBird.spin;
    if(deadBird.y>H-GROUND_H-BIRD_R){deadBird.y=H-GROUND_H-BIRD_R;deadBird.vy*=-.28;deadBird.vx*=.55;deadBird.spin*=.35;if(Math.abs(deadBird.vy)<.4){gState='dead';deadBird=null;}}
    if(deadBird&&deadBird.y>H+60){gState='dead';deadBird=null;}
  }
  pipes.forEach(p=>drawPipe(p.x,p.topH,d.gap,eq.pipe));
  drawGround();
  particles.forEach(p=>{ctx.save();ctx.globalAlpha=p.life;ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.color;ctx.beginPath();ctx.ellipse(0,0,p.size,p.size*.4,0,0,Math.PI*2);ctx.fill();ctx.restore();p.x+=p.vx;p.y+=p.vy;p.vy+=.11;p.life-=.023;p.rot+=p.rotV;});
  particles=particles.filter(p=>p.life>0);
  coinPopups.forEach(p=>{ctx.save();ctx.globalAlpha=p.life;ctx.fillStyle='#fac775';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(p.text,p.x,p.y);ctx.restore();p.y+=p.vy;p.life-=.02;});
  coinPopups=coinPopups.filter(p=>p.life>0);
  if(deadBird)drawBirdAt(deadBird.x,deadBird.y,deadBird.angle,0,eq.bird);
  else if(gState!=='dead')drawBirdAt(BIRD_X,bird.y,bird.angle,gState==='playing'?Math.sin(frame*.25)*4:0,eq.bird);
  if(gState==='playing'){
    ctx.fillStyle='white';ctx.textAlign='center';ctx.font='bold 28px sans-serif';ctx.fillText(score,W/2,40);
    if(combo>1){ctx.font='bold 13px sans-serif';ctx.fillStyle='#fac775';ctx.fillText('×'+combo+' combo!',W/2,60);}
    if(opponentName){ctx.font='11px sans-serif';ctx.fillStyle='rgba(255,255,255,.6)';ctx.fillText(opponentName+': '+opponentScore,W/2,H-GROUND_H-8);}
  }
  if(gState==='idle'){
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='white';ctx.textAlign='center';ctx.font='bold 20px sans-serif';ctx.fillText('tap to start',W/2,H/2-8);
    ctx.font='12px sans-serif';ctx.fillStyle='rgba(255,255,255,.7)';
    ctx.fillText(gameMode==='daily'?'daily challenge':gameMode==='ranked'?'ranked mode':'difficulty: '+chosenDiff,W/2,H/2+10);
  }
  if(gState==='dead'){
    ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='white';ctx.textAlign='center';
    ctx.font='bold 22px sans-serif';ctx.fillText('game over',W/2,H/2-30);
    ctx.font='13px sans-serif';ctx.fillStyle='rgba(255,255,255,.8)';ctx.fillText('score: '+score+' · best combo: ×'+maxCombo,W/2,H/2-8);
    ctx.font='12px sans-serif';ctx.fillStyle='rgba(255,255,255,.6)';ctx.fillText('tap to try again',W/2,H/2+10);
    if(!currentUser){ctx.font='11px sans-serif';ctx.fillStyle='rgba(255,255,255,.4)';ctx.fillText('create account to save scores & earn coins',W/2,H/2+28);}
  }
}

function menuLoop() {
  menuFrame++;drawSky(BG_SKINS[0]);
  menuBirdVY+=.17;menuBirdY+=menuBirdVY;
  if(menuBirdY>H*.65){menuBirdVY=-5.2;menuBirdY=H*.65;}
  if(menuBirdY<H*.2)menuBirdVY=Math.abs(menuBirdVY)*.5;
  if(menuFrame%95===0)menuPipes.push({x:W+10,topH:80+Math.random()*(H-GROUND_H-175)});
  menuPipes.forEach(p=>p.x-=1.3);menuPipes=menuPipes.filter(p=>p.x+PIPE_W>0);
  menuPipes.forEach(p=>drawPipe(p.x,p.topH,162,PIPE_SKINS[0]));
  drawGround();drawBirdAt(BIRD_X,menuBirdY,menuBirdVY*.07,Math.sin(menuFrame*.2)*3,BIRD_SKINS[0]);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='white';ctx.textAlign='center';
  ctx.font='bold 26px sans-serif';ctx.fillText('Flappy Master',W/2,H/2-14);
  ctx.font='13px sans-serif';ctx.fillStyle='rgba(255,255,255,.65)';ctx.fillText('sign in or play as guest',W/2,H/2+10);
}

function mainLoop() {
  if(activeScreen==='screen-menu'||activeScreen==='screen-register'||activeScreen==='screen-login')menuLoop();
  else if(activeScreen==='screen-game')gameLoop();
  else{menuFrame++;const eq=getEquipped();drawSky(eq.bg);drawGround();ctx.fillStyle='rgba(0,0,0,.05)';ctx.fillRect(0,0,W,H);}
  requestAnimationFrame(mainLoop);
}

// ── Shop timer ────────────────────────────────────────────────────────────────
setInterval(()=>{
  const now=Date.now();
  if(now>shopRotateAt){shopSeed=Math.floor(now/(5*60*1000));shopRotateAt=(shopSeed+1)*5*60*1000;rotateShop();if(activeScreen==='screen-hub'&&hubSection==='shop')goSection('shop');}
  if(activeScreen==='screen-hub'&&hubSection==='shop'){const t=document.querySelector('.shop-timer');if(t){const s=Math.max(0,Math.round((shopRotateAt-now)/1000));t.textContent='rotates in '+String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}}
},1000);

// ── Init ──────────────────────────────────────────────────────────────────────
(async function init() {
  rotateShop();
  resetGame();
  if (authToken) {
    const data = await apiFetch('/api/me');
    if (data.user) { currentUser = data.user; goHub(); }
    else { authToken = null; localStorage.removeItem('fm_token'); }
  }
  loadMenuLb();
  mainLoop();
})();
