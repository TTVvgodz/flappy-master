// ── Canvas setup ──────────────────────────────────────────────────────────────
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let W, H;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// ── Config ────────────────────────────────────────────────────────────────────
const API = '';
const GROUND_H = 70;
const PIPE_W = 60;
const BIRD_R = 18;

// Bird X is 20% from left
function BIRD_X() { return Math.floor(W * 0.2); }

const GRAVITY = 0.42;
const JUMP = -8.5;

const DIFFS = {
  easy:   { speed: 2.8, gap: 210, freq: 130, desc: 'wider gaps, slower — great for beginners' },
  normal: { speed: 3.6, gap: 175, freq: 105, desc: 'balanced speed and gap size' },
  hard:   { speed: 5.0, gap: 140, freq:  82, desc: 'fast pipes, tight gaps — experts only' },
};

const RANKS = [
  { name:'Egg',          tiers:1, pts:0,    color:'#888',   bg:'rgba(136,136,136,.18)' },
  { name:'Hatchling',    tiers:3, pts:50,   color:'#cd7f32',bg:'rgba(205,127,50,.18)'  },
  { name:'Fledgling',    tiers:3, pts:200,  color:'#aaa',   bg:'rgba(170,170,170,.18)' },
  { name:'Flapper',      tiers:3, pts:500,  color:'#fac775',bg:'rgba(250,199,117,.18)' },
  { name:'Tailwind',     tiers:3, pts:1000, color:'#5ec8f5',bg:'rgba(94,200,245,.18)'  },
  { name:'Skybreaker',   tiers:3, pts:2000, color:'#7f77dd',bg:'rgba(127,119,221,.18)' },
  { name:'Pipebuster',   tiers:3, pts:4000, color:'#5dcaa5',bg:'rgba(93,202,165,.18)'  },
  { name:'Flappy Master',tiers:1, pts:8000, color:'#e24b4a',bg:'rgba(226,75,74,.18)'   },
];

function getRankInfo(pts) {
  for (let i = RANKS.length-1; i >= 0; i--) {
    if (pts >= RANKS[i].pts) {
      const r=RANKS[i], next=RANKS[i+1];
      const span=next?next.pts-r.pts:1, within=pts-r.pts;
      const ti=next?Math.min(Math.floor((within/span)*r.tiers),r.tiers-1):0;
      const pct=next?Math.min(100,Math.round((within/span)*100)):100;
      return { label:r.name+(r.tiers>1?' '+['I','II','III'][ti]:''), color:r.color, bg:r.bg, pct, pts };
    }
  }
  return { label:'Egg', color:'#888', bg:'rgba(136,136,136,.18)', pct:0, pts:0 };
}

const BIRD_SKINS=[
  {id:'hatchling',name:'Hatchling',price:0,  colors:['#F5C842','#F0A800','#FF7A00']},
  {id:'sky',      name:'Sky',      price:30,  colors:['#85B7EB','#378ADD','#185FA5']},
  {id:'rose',     name:'Rose',     price:30,  colors:['#ED93B1','#D4537E','#993556']},
  {id:'jade',     name:'Jade',     price:30,  colors:['#5DCAA5','#1D9E75','#0F6E56']},
  {id:'amethyst', name:'Amethyst', price:50,  colors:['#AFA9EC','#7F77DD','#534AB7']},
  {id:'coral',    name:'Coral',    price:50,  colors:['#F0997B','#D85A30','#993C1D']},
  {id:'gold',     name:'Gold',     price:80,  colors:['#FAC775','#BA7517','#854F0B']},
  {id:'shadow',   name:'Shadow',   price:80,  colors:['#B4B2A9','#5F5E5A','#2C2C2A']},
  {id:'phoenix',  name:'Phoenix',  price:150, colors:['#F09595','#E24B4A','#fac775']},
];
const PIPE_SKINS=[
  {id:'bamboo',   name:'Bamboo',   price:0,   light:'#5BC63C',dark:'#4DB533'},
  {id:'sky',      name:'Sky',      price:20,  light:'#378ADD',dark:'#185FA5'},
  {id:'lava',     name:'Lava',     price:20,  light:'#E24B4A',dark:'#A32D2D'},
  {id:'amethyst', name:'Amethyst', price:30,  light:'#7F77DD',dark:'#534AB7'},
  {id:'teal',     name:'Teal',     price:30,  light:'#1D9E75',dark:'#0F6E56'},
  {id:'gold',     name:'Gold',     price:50,  light:'#EF9F27',dark:'#BA7517'},
  {id:'rose',     name:'Rose',     price:50,  light:'#D4537E',dark:'#993556'},
  {id:'midnight', name:'Midnight', price:80,  light:'#5F5E5A',dark:'#2C2C2A'},
  {id:'neon',     name:'Neon',     price:150, light:'#5DCAA5',dark:'#E24B4A'},
];
const BG_SKINS=[
  {id:'sky',    name:'Day',    price:0,   sky:'#5EC8F5',clouds:'rgba(255,255,255,.55)'},
  {id:'sunset', name:'Sunset', price:25,  sky:'#e07b50',clouds:'rgba(255,210,160,.5)' },
  {id:'night',  name:'Night',  price:25,  sky:'#111428',clouds:'rgba(60,65,110,.6)'   },
  {id:'forest', name:'Forest', price:35,  sky:'#639922',clouds:'rgba(190,240,160,.4)' },
  {id:'ocean',  name:'Ocean',  price:35,  sky:'#185FA5',clouds:'rgba(160,210,255,.45)'},
  {id:'candy',  name:'Candy',  price:50,  sky:'#ED93B1',clouds:'rgba(255,230,245,.65)'},
  {id:'storm',  name:'Storm',  price:50,  sky:'#2a2a35',clouds:'rgba(100,100,120,.55)'},
  {id:'aurora', name:'Aurora', price:80,  sky:'#063020',clouds:'rgba(80,200,130,.35)' },
  {id:'cosmic', name:'Cosmic', price:150, sky:'#16103a',clouds:'rgba(160,140,220,.4)' },
];

// ── State ─────────────────────────────────────────────────────────────────────
let currentUser = null, authToken = localStorage.getItem('fm_token') || null;
let activePanel = 'panel-menu';
let hubSection = 'play';
let chosenDiff = 'normal', gameMode = 'normal';
let bird, pipes, score, frame, gState, groundOffset, sessionBest, combo, maxCombo, particles, coinPopups, deadBird;
let menuFrame=0, menuBirdY=0, menuBirdVY=0, menuPipes=[];
let audioCtx=null;
let shopSeed=Math.floor(Date.now()/(5*60*1000));
let shopRotateAt=(shopSeed+1)*5*60*1000;
let visibleBirds, visiblePipes, visibleBgs;
let matchId=null, opponentName=null, opponentAlive=true, matchCountdown=null;
let isGameScreen = false;

// ── Socket ────────────────────────────────────────────────────────────────────
const socket = io();

socket.on('queue_update', ({count}) => {
  const el=document.getElementById('mm-status');
  if(el) el.textContent=`${count} player${count!==1?'s':''} in queue`;
});

socket.on('match_found', ({matchId:mid, seed, opponent, opponentRank}) => {
  matchId=mid; opponentName=opponent; opponentAlive=true;
  document.getElementById('mm-cancel').style.display='none';
  document.getElementById('mm-title').textContent=`matched vs ${opponent}`;
  document.getElementById('mm-status').textContent=opponentRank;
  document.getElementById('mm-icon').textContent='⚔';
  socket.emit('match_ready', {matchId:mid});
});

socket.on('match_start', ({startAt, seed:mSeed}) => {
  let rem = Math.ceil((startAt - Date.now())/1000);
  const cd = document.getElementById('mm-cd');
  cd.style.display='block';
  matchCountdown = setInterval(()=>{
    rem = Math.ceil((startAt - Date.now())/1000);
    if(rem > 0) { cd.textContent = rem; }
    else {
      clearInterval(matchCountdown);
      startLiveMatch(mSeed);
    }
  }, 80);
});

socket.on('opponent_died', () => {
  opponentAlive = false;
  const el = document.getElementById('vs-opp-s');
  if(el){ el.textContent='dead'; el.className='vs-dead'; }
  const st = document.getElementById('vs-status');
  if(st) st.textContent='opponent died — survive to win!';
});

socket.on('opponent_disconnected', () => {
  opponentAlive = false;
  const st = document.getElementById('vs-status');
  if(st) st.textContent='opponent disconnected — you win!';
  if(gState==='playing') endMatchWin();
});

socket.on('match_over', (result) => {
  const isWinner = result.winner === currentUser?.username;
  const st = document.getElementById('vs-status');
  if(st) st.textContent = result.draw ? 'draw!' : isWinner ? '🏆 you win! +20 rank pts' : `${result.winner} wins. -5 rank pts`;
  if(currentUser) refreshUser();
});

function startLiveMatch(seed) {
  hideAllPanels();
  showHubOverlay(false);
  isGameScreen = true;
  document.getElementById('hud').classList.add('active');
  document.getElementById('hud-bottom').classList.add('active');
  document.getElementById('vs-ov').classList.add('active');
  document.getElementById('vs-opp-name').textContent = opponentName;
  document.getElementById('vs-opp-label').textContent = opponentName;
  document.getElementById('save-btn').style.display='none';
  const n = currentUser?currentUser.username:'Guest';
  setAv(document.getElementById('hud-av'), n, 32);
  document.getElementById('hud-name').textContent = n;
  resetGame();
  gState='playing';
  spawnPipe();
}

function endMatchWin() {
  if(matchId) socket.emit('match_died', {matchId, finalScore:score, maxCombo, survived:true});
  gState='dead';
}

// ── API ───────────────────────────────────────────────────────────────────────
async function apiFetch(path, opts={}) {
  const headers={'Content-Type':'application/json'};
  if(authToken) headers['Authorization']='Bearer '+authToken;
  const res = await fetch(API+path, {...opts, headers:{...headers,...opts.headers}});
  return res.json();
}

async function refreshUser() {
  if(!authToken) return;
  const data = await apiFetch('/api/me');
  if(data.user){ currentUser=data.user; updateHubBar(); }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function doRegister() {
  const username=document.getElementById('reg-name').value.trim();
  const password=document.getElementById('reg-pass').value;
  const password2=document.getElementById('reg-pass2').value;
  const err=document.getElementById('reg-err');
  if(!username||username.length<3){err.textContent='Username must be 3+ characters';return;}
  if(password.length<12){err.textContent='Password must be 12+ characters';return;}
  if(password!==password2){err.textContent='Passwords do not match';return;}
  const data=await apiFetch('/api/register',{method:'POST',body:JSON.stringify({username,password})});
  if(data.error){err.textContent=data.error;return;}
  authToken=data.token; localStorage.setItem('fm_token',authToken);
  currentUser=data.user; err.textContent=''; goHub();
}

async function doLogin() {
  const username=document.getElementById('log-name').value.trim();
  const password=document.getElementById('log-pass').value;
  const err=document.getElementById('log-err');
  const data=await apiFetch('/api/login',{method:'POST',body:JSON.stringify({username,password})});
  if(data.error){err.textContent=data.error;return;}
  authToken=data.token; localStorage.setItem('fm_token',authToken);
  currentUser=data.user; err.textContent=''; goHub();
}

function doLogout() {
  authToken=null; currentUser=null; localStorage.removeItem('fm_token');
  socket.emit('leave_queue');
  showHubOverlay(false); isGameScreen=false;
  document.getElementById('hud').classList.remove('active');
  document.getElementById('hud-bottom').classList.remove('active');
  document.getElementById('vs-ov').classList.remove('active');
  showPanel('panel-menu');
  loadMenuLb();
}

function playAsGuest() { currentUser=null; goHub(); }

// ── UI helpers ────────────────────────────────────────────────────────────────
function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  const el=document.getElementById(id);
  if(el) el.classList.add('active');
  activePanel=id;
}
function hideAllPanels() {
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
}
function showHubOverlay(show) {
  document.getElementById('hub').classList.toggle('active', show);
}

function togglePw(id,btn) {
  const inp=document.getElementById(id);
  inp.type=inp.type==='text'?'password':'text';
  btn.textContent=inp.type==='text'?'🙈':'👁';
}
function updateStrength() {
  const p=document.getElementById('reg-pass').value;
  const bar=document.getElementById('strength-bar'), lbl=document.getElementById('strength-label');
  let s=0;
  if(p.length>=12)s++;if(p.length>=16)s++;
  if(/[A-Z]/.test(p))s++;if(/[0-9]/.test(p))s++;if(/[^A-Za-z0-9]/.test(p))s++;
  const lvl=p.length<12?0:Math.min(s,5);
  const L=[{w:'0%',c:'#e24b4a',t:'too short — need 12+'},{w:'20%',c:'#e24b4a',t:'weak'},{w:'40%',c:'#ef9f27',t:'fair'},{w:'60%',c:'#ef9f27',t:'moderate'},{w:'80%',c:'#5dcaa5',t:'strong'},{w:'100%',c:'#1d9e75',t:'very strong'}];
  bar.style.width=L[lvl].w; bar.style.background=L[lvl].c; lbl.textContent=L[lvl].t;
}

const AVC=[{bg:'#1a2a40',fg:'#5ec8f5'},{bg:'#1a3028',fg:'#5dcaa5'},{bg:'#302010',fg:'#fac775'},{bg:'#221a3a',fg:'#afa9ec'},{bg:'#3a1a10',fg:'#f0997b'},{bg:'#2a1a28',fg:'#ed93b1'}];
function avColor(n){let h=0;for(let c of n)h=(h*31+c.charCodeAt(0))&0xffff;return AVC[h%AVC.length];}
function initials(n){return n.trim().split(/\s+/).map(w=>w[0].toUpperCase()).slice(0,2).join('');}
function setAv(el,n,sz){const a=avColor(n);el.style.cssText+='background:'+a.bg+';color:'+a.fg+';min-width:'+sz+'px;width:'+sz+'px;height:'+sz+'px;font-size:'+(sz*.35)+'px;';el.textContent=initials(n)||'?';}

// ── Hub ───────────────────────────────────────────────────────────────────────
function goHub() {
  hideAllPanels();
  showHubOverlay(true);
  isGameScreen=false;
  document.getElementById('hud').classList.remove('active');
  document.getElementById('hud-bottom').classList.remove('active');
  document.getElementById('vs-ov').classList.remove('active');
  updateHubBar();
  goSection('play');
}

function updateHubBar() {
  const isGuest=!currentUser;
  const n=isGuest?'Guest':currentUser.username;
  setAv(document.getElementById('hub-av'),n,34);
  document.getElementById('hub-uname').textContent=n;
  const pill=document.getElementById('hub-rpill');
  const coinsEl=document.getElementById('hub-coins');
  if(isGuest){
    pill.textContent='Guest';pill.style.cssText='background:rgba(100,100,100,.2);color:#888;';
    coinsEl.textContent='—';
  } else {
    const ri=getRankInfo(currentUser.rank_pts||0);
    pill.textContent=ri.label;pill.style.cssText='background:'+ri.bg+';color:'+ri.color+';';
    coinsEl.textContent=currentUser.coins||0;
  }
}

function goSection(s) {
  hubSection=s;
  document.querySelectorAll('.hnb').forEach(b=>b.classList.toggle('active',b.dataset.s===s));
  const el=document.getElementById('hub-body');
  if(s==='play') renderPlay(el);
  else if(s==='ranked') renderRanked(el);
  else if(s==='daily') renderDaily(el);
  else if(s==='shop') renderShop(el);
  else if(s==='profile') renderProfile(el);
}

// ── Section: Play ─────────────────────────────────────────────────────────────
async function renderPlay(el) {
  el.innerHTML=`
    <div style="margin-bottom:14px;">
      <div class="slabel">difficulty</div>
      <div class="drow">
        ${['easy','normal','hard'].map(d=>`<button class="dbtn${chosenDiff===d?' sel':''}" onclick="selDiff('${d}')">${d}</button>`).join('')}
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:12px;">${DIFFS[chosenDiff].desc}</div>
      <button class="btn-p" onclick="startGame('normal')">▶ play now</button>
    </div>
    <div class="slabel">🏆 global leaderboard</div>
    <div id="play-lb"><div class="empty">loading...</div></div>`;
  const rows=await apiFetch('/api/leaderboard');
  const lbEl=document.getElementById('play-lb');
  if(lbEl) lbEl.innerHTML=renderLbHTML(rows,'score');
}
function selDiff(d){chosenDiff=d;renderPlay(document.getElementById('hub-body'));}

// ── Section: Ranked ───────────────────────────────────────────────────────────
async function renderRanked(el) {
  if(!currentUser){el.innerHTML='<div class="empty">create an account to play ranked</div>';return;}
  const ri=getRankInfo(currentUser.rank_pts||0);
  const lbRows=await apiFetch('/api/leaderboard/ranked');
  el.innerHTML=`
    <div class="slabel">your rank</div>
    <span class="rank-pill" style="background:${ri.bg};color:${ri.color};font-size:13px;padding:4px 12px;border-radius:20px;display:inline-block;margin-bottom:8px;">${ri.label}</span>
    <div class="rbw"><div class="rbb" style="width:${ri.pct}%;background:${ri.color};"></div></div>
    <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:14px;">${currentUser.rank_pts||0} rank pts · ${ri.pct}% to next tier</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.45);margin-bottom:12px;line-height:1.6;">
      Ranked mode is <strong style="color:#fac775;">survival</strong> — whoever dies first loses.<br>
      Win a live match = <strong style="color:#5dcaa5;">+20 pts</strong> · Lose = <strong style="color:#e24b4a;">−5 pts</strong><br>
      Solo: 10+ score = +5pts · 25+ = +15pts · 50+ = +30pts
    </div>
    <button class="btn-p" onclick="joinRankedQueue()" style="margin-bottom:16px;">⚔ find opponent</button>
    <div style="font-size:10px;color:rgba(255,255,255,0.25);text-align:center;margin-bottom:16px;">uses normal difficulty · pipes are identical for both players</div>
    <div class="slabel">🏆 rank leaderboard</div>
    ${renderRankedLbHTML(lbRows)}
    ${renderRankLadder(currentUser.rank_pts||0)}`;
}

function renderRankedLbHTML(rows) {
  if(!rows.length) return '<div class="empty">no ranked players yet</div>';
  return rows.slice(0,8).map((r,i)=>{
    const ri2=getRankInfo(r.rank_pts||0);
    const isYou=currentUser&&r.username===currentUser.username;
    const av=avColor(r.username);
    return `<div class="lbr"><span class="lbrank ${i===0?'g':i===1?'s':i===2?'b':''}">#${i+1}</span><div class="lbav" style="background:${av.bg};color:${av.fg};">${initials(r.username)}</div><span class="lbn">${r.username}${isYou?' <span class="lbyou">you</span>':''}</span><span style="font-size:9px;padding:1px 5px;border-radius:3px;background:${ri2.bg};color:${ri2.color};">${ri2.label}</span><span class="lbp" style="color:#fac775;">${r.rank_pts||0}</span></div>`;
  }).join('');
}

function renderRankLadder(pts) {
  return '<div style="margin-top:14px;"><div class="slabel">rank ladder</div>'+
    RANKS.map((r,i)=>{
      const active=pts>=r.pts&&(i===RANKS.length-1||pts<RANKS[i+1].pts);
      return `<div class="rli"><div class="rld" style="background:${r.color};${active?'box-shadow:0 0 0 3px '+r.color+'30;':''}"></div><span style="font-size:12px;color:${active?r.color:'rgba(255,255,255,0.35)'};font-weight:${active?700:400};">${r.name}${r.tiers>1?' I–III':''}</span><span style="font-size:10px;color:rgba(255,255,255,0.25);margin-left:auto;">${r.pts} pts</span></div>`;
    }).join('')+'</div>';
}

function joinRankedQueue() {
  showHubOverlay(false);
  showPanel('panel-mm');
  document.getElementById('mm-title').textContent='finding opponent...';
  document.getElementById('mm-status').textContent='in queue';
  document.getElementById('mm-cancel').style.display='block';
  document.getElementById('mm-cd').style.display='none';
  document.getElementById('mm-icon').textContent='🐦';
  socket.emit('join_ranked',{token:authToken, username:currentUser.username});
}

function leaveQueue() {
  socket.emit('leave_queue');
  if(matchCountdown) clearInterval(matchCountdown);
  hideAllPanels();
  goHub();
}

// ── Section: Daily ────────────────────────────────────────────────────────────
async function renderDaily(el) {
  const info=await apiFetch('/api/daily');
  const lbRows=await apiFetch('/api/leaderboard/daily');
  const done=currentUser&&currentUser.daily_done===info.key;
  el.innerHTML=`
    <div style="margin-bottom:14px;">
      <div class="slabel">📅 daily challenge</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.45);margin-bottom:8px;">Today's seed: <strong style="color:#fff;">#${info.seed%10000}</strong> — everyone gets the same pipes!</div>
      ${done?'<div style="font-size:12px;color:#5dcaa5;margin-bottom:8px;">✓ completed today! come back tomorrow.</div>':''}
      <button class="btn-p" onclick="startGame(\'daily\')" ${done?'disabled':''} style="${done?'opacity:.4;':''}">${done?'completed':'play daily challenge'}</button>
    </div>
    <div class="slabel">today's leaderboard</div>
    ${lbRows.length?renderLbHTML(lbRows,'score'):'<div class="empty">no scores yet today — be first!</div>'}`;
}

// ── Section: Shop ─────────────────────────────────────────────────────────────
function rotateShop() {
  function ss(arr,seed){const a=[...arr];let s=seed;for(let i=a.length-1;i>0;i--){s=(s*9301+49297)%233280;const j=Math.floor((s/233280)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,3);}
  visibleBirds=ss(BIRD_SKINS,shopSeed);
  visiblePipes=ss(PIPE_SKINS,shopSeed+1);
  visibleBgs=ss(BG_SKINS,shopSeed+2);
}

function renderShop(el) {
  const now=Date.now();
  if(now>shopRotateAt){shopSeed=Math.floor(now/(5*60*1000));shopRotateAt=(shopSeed+1)*5*60*1000;rotateShop();}
  const secs=Math.max(0,Math.round((shopRotateAt-now)/1000));
  const mm=String(Math.floor(secs/60)).padStart(2,'0'),ss2=String(secs%60).padStart(2,'0');
  const owned=currentUser?{birds:currentUser.owned_birds||['hatchling'],pipes:currentUser.owned_pipes||['bamboo'],bgs:currentUser.owned_bgs||['sky'],eBird:currentUser.equipped_bird||'hatchling',ePipe:currentUser.equipped_pipe||'bamboo',eBg:currentUser.equipped_bg||'sky',coins:currentUser.coins||0}:{birds:['hatchling'],pipes:['bamboo'],bgs:['sky'],eBird:'hatchling',ePipe:'bamboo',eBg:'sky',coins:0};
  el.innerHTML=`
    <div class="stimer">rotates in ${mm}:${ss2}</div>
    <div class="slabel">🐦 bird skins</div>
    <div class="sg">${visibleBirds.map(s=>shopItemHTML('bird',s,owned)).join('')}</div>
    <div class="slabel">🎋 pipe colors</div>
    <div class="sg">${visiblePipes.map(s=>shopItemHTML('pipe',s,owned)).join('')}</div>
    <div class="slabel">🌄 backgrounds</div>
    <div class="sg">${visibleBgs.map(s=>shopItemHTML('bg',s,owned)).join('')}</div>`;
  requestAnimationFrame(()=>visibleBirds.forEach(s=>drawShopBird(s)));
}

function shopItemHTML(type,s,owned) {
  const ownArr=type==='bird'?owned.birds:type==='pipe'?owned.pipes:owned.bgs;
  const equ=type==='bird'?owned.eBird:type==='pipe'?owned.ePipe:owned.eBg;
  const isOwned=ownArr.includes(s.id), isEquipped=equ===s.id;
  const cls=isEquipped?'equipped':isOwned?'owned':'';
  const label=isEquipped?'✓ on':isOwned?'use':(s.price===0?'free':'🪙 '+s.price);
  if(type==='bird') return`<div class="si ${cls}" onclick="shopAction('bird','${s.id}',${s.price})"><canvas id="sbrd-${s.id}" width="44" height="34"></canvas><div class="sin">${s.name}</div><div class="sip">${label}</div></div>`;
  if(type==='pipe') return`<div class="si ${cls}" onclick="shopAction('pipe','${s.id}',${s.price})"><div style="width:44px;height:34px;margin:0 auto 4px;display:flex;align-items:center;justify-content:center;gap:4px;"><div style="width:16px;height:30px;background:${s.light};border-radius:3px;"></div><div style="width:16px;height:30px;background:${s.dark};border-radius:3px;"></div></div><div class="sin">${s.name}</div><div class="sip">${label}</div></div>`;
  return`<div class="si ${cls}" onclick="shopAction('bg','${s.id}',${s.price})"><div style="width:44px;height:34px;margin:0 auto 4px;border-radius:5px;background:${s.sky};display:flex;align-items:center;justify-content:center;"><div style="width:32px;height:10px;border-radius:5px;background:${s.clouds};"></div></div><div class="sin">${s.name}</div><div class="sip">${label}</div></div>`;
}

function drawShopBird(skin) {
  const c=document.getElementById('sbrd-'+skin.id);if(!c)return;
  const x=c.getContext('2d');x.clearRect(0,0,44,34);
  x.fillStyle=skin.colors[0];x.beginPath();x.ellipse(22,17,13,11,0,0,Math.PI*2);x.fill();
  x.fillStyle=skin.colors[1];x.beginPath();x.ellipse(24,20,10,8,.3,0,Math.PI*2);x.fill();
  x.fillStyle='white';x.beginPath();x.arc(28,11,4,0,Math.PI*2);x.fill();
  x.fillStyle='#111';x.beginPath();x.arc(29,10.5,2.2,0,Math.PI*2);x.fill();
  x.fillStyle=skin.colors[2];x.beginPath();x.moveTo(32,15);x.lineTo(40,17);x.lineTo(32,19);x.closePath();x.fill();
}

async function shopAction(type,id,price) {
  if(!currentUser){alert('create an account to use the shop!');return;}
  const ownArr=type==='bird'?currentUser.owned_birds:type==='pipe'?currentUser.owned_pipes:currentUser.owned_bgs;
  if(ownArr&&ownArr.includes(id)){
    const data=await apiFetch('/api/shop/equip',{method:'POST',body:JSON.stringify({type,itemId:id})});
    if(data.user){currentUser=data.user;updateHubBar();renderShop(document.getElementById('hub-body'));}
  } else {
    if((currentUser.coins||0)<price){alert(`not enough coins! you have ${currentUser.coins||0} 🪙, need ${price} 🪙`);return;}
    if(!confirm(`buy ${id} for ${price} 🪙?`))return;
    const data=await apiFetch('/api/shop/buy',{method:'POST',body:JSON.stringify({type,itemId:id,price})});
    if(data.error){alert(data.error);return;}
    if(data.user){currentUser=data.user;updateHubBar();renderShop(document.getElementById('hub-body'));}
  }
}

// ── Section: Profile ──────────────────────────────────────────────────────────
async function renderProfile(el) {
  if(!currentUser){el.innerHTML='<div class="empty">create an account to see your profile</div>';return;}
  const hist=await apiFetch('/api/history');
  const ri=getRankInfo(currentUser.rank_pts||0);
  const av=avColor(currentUser.username);
  el.innerHTML=`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
      <div style="width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;background:${av.bg};color:${av.fg};flex-shrink:0;">${initials(currentUser.username)}</div>
      <div><div style="font-size:16px;font-weight:700;color:#fff;">${currentUser.username}</div><div style="font-size:11px;color:rgba(255,255,255,0.35);">joined ${new Date((currentUser.created_at||0)*1000).toLocaleDateString()}</div></div>
    </div>
    <div class="mrow">
      <div class="met"><div class="metl">best</div><div class="metv">${currentUser.best_score||0}</div></div>
      <div class="met"><div class="metl">games</div><div class="metv">${currentUser.games_played||0}</div></div>
      <div class="met"><div class="metl">coins</div><div class="metv">${currentUser.coins||0}</div></div>
    </div>
    <span class="rank-pill" style="background:${ri.bg};color:${ri.color};font-size:12px;padding:3px 10px;border-radius:20px;display:inline-block;margin-bottom:6px;">${ri.label}</span>
    <div class="rbw"><div class="rbb" style="width:${ri.pct}%;background:${ri.color};"></div></div>
    <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:14px;">${currentUser.rank_pts||0} rank pts</div>
    <div class="slabel">recent games</div>
    ${hist.length?hist.slice(0,8).map(r=>`<div class="hi"><span style="font-size:13px;font-weight:700;color:#fff;flex:1;">${r.score} pts</span><span class="htag tag-${r.mode==='ranked'?'ranked':r.mode==='daily'?'daily':r.diff||'normal'}">${r.mode==='ranked'?'ranked':r.mode==='daily'?'daily':r.diff}</span><span style="font-size:11px;color:rgba(255,255,255,0.3);">×${r.max_combo} combo</span><span style="font-size:10px;color:rgba(255,255,255,0.25);">${new Date((r.created_at||0)*1000).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span></div>`).join(''):'<div class="empty">no games yet</div>'}`;
}

// ── Leaderboard HTML ──────────────────────────────────────────────────────────
function renderLbHTML(rows, scoreKey='score') {
  if(!rows||!rows.length) return '<div class="empty">no scores yet</div>';
  return rows.slice(0,8).map((r,i)=>{
    const isYou=currentUser&&r.username===currentUser.username;
    const av=avColor(r.username);
    return `<div class="lbr"><span class="lbrank ${i===0?'g':i===1?'s':i===2?'b':''}">#${i+1}</span><div class="lbav" style="background:${av.bg};color:${av.fg};">${initials(r.username)}</div><span class="lbn">${r.username}${isYou?' <span class="lbyou">you</span>':''}</span><span class="lbp">${r[scoreKey]}</span></div>`;
  }).join('');
}

// ── Game ──────────────────────────────────────────────────────────────────────
function getEquipped() {
  if(!currentUser) return {bird:BIRD_SKINS[0],pipe:PIPE_SKINS[0],bg:BG_SKINS[0]};
  return {
    bird:BIRD_SKINS.find(s=>s.id===currentUser.equipped_bird)||BIRD_SKINS[0],
    pipe:PIPE_SKINS.find(s=>s.id===currentUser.equipped_pipe)||PIPE_SKINS[0],
    bg:BG_SKINS.find(s=>s.id===currentUser.equipped_bg)||BG_SKINS[0],
  };
}

function startGame(mode) {
  gameMode=mode; sessionBest=0; combo=1; maxCombo=1;
  matchId=null; opponentName=null; opponentAlive=true;
  const isGuest=!currentUser;
  const n=currentUser?currentUser.username:'Guest';
  hideAllPanels(); showHubOverlay(false);
  isGameScreen=true;
  setAv(document.getElementById('hud-av'),n,32);
  document.getElementById('hud-name').textContent=n;
  document.getElementById('hud-coins-disp').textContent=currentUser?currentUser.coins||0:'—';
  document.getElementById('hud-score').textContent='0';
  document.getElementById('hud-combo').textContent='×1';
  document.getElementById('hud-best').textContent='0';
  document.getElementById('save-btn').style.display=isGuest?'none':'block';
  document.getElementById('vs-ov').classList.remove('active');
  document.getElementById('hud').classList.add('active');
  document.getElementById('hud-bottom').classList.add('active');
  resetGame();
}

function exitToHub() {
  resetGame(); isGameScreen=false;
  document.getElementById('hud').classList.remove('active');
  document.getElementById('hud-bottom').classList.remove('active');
  document.getElementById('vs-ov').classList.remove('active');
  goHub();
}

async function saveScore() {
  if(!currentUser||score===0) return;
  const data=await apiFetch('/api/score',{method:'POST',body:JSON.stringify({score,mode:gameMode,diff:chosenDiff,max_combo:maxCombo})});
  if(data.user){
    currentUser=data.user; updateHubBar();
    document.getElementById('hud-coins-disp').textContent=currentUser.coins||0;
  }
}

function resetGame() {
  const bx=BIRD_X();
  bird={y:H/2,vy:0,angle:0};
  pipes=[];score=0;frame=0;groundOffset=0;
  gState='idle';deadBird=null;particles=[];coinPopups=[];combo=1;maxCombo=1;
  const sc=document.getElementById('hud-score');if(sc)sc.textContent='0';
  const cb=document.getElementById('hud-combo');if(cb)cb.textContent='×1';
}

function flap() {
  if(!isGameScreen) return;
  if(gState==='idle'){gState='playing';spawnPipe();playFlap();}
  else if(gState==='playing'){bird.vy=JUMP;playFlap();}
  else if(gState==='dead'&&!deadBird){resetGame();}
}

canvas.addEventListener('click', flap);
canvas.addEventListener('touchstart', e=>{e.preventDefault();flap();},{passive:false});
document.addEventListener('keydown', e=>{if(e.code==='Space'){e.preventDefault();flap();}});

let dailyRandState=0;
function dailyRand(){dailyRandState=(dailyRandState*9301+49297)%233280;return dailyRandState/233280;}

function spawnPipe() {
  const d=gameMode==='ranked'?DIFFS.normal:DIFFS[chosenDiff];
  let topH;
  const minTop=80, maxTop=H-GROUND_H-d.gap-80;
  if(gameMode==='daily'){
    if(pipes.length===0){const s=new Date();dailyRandState=s.getFullYear()*10000+(s.getMonth()+1)*100+s.getDate();}
    topH=minTop+dailyRand()*(maxTop-minTop);
  } else {
    topH=minTop+Math.random()*(maxTop-minTop);
  }
  pipes.push({x:W+10,topH,passed:false});
}

function getAudio(){if(!audioCtx){try{audioCtx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}return audioCtx;}
function playFlap(){const ac=getAudio();if(!ac)return;const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.setValueAtTime(520,ac.currentTime);o.frequency.exponentialRampToValueAtTime(780,ac.currentTime+0.06);g.gain.setValueAtTime(0.12,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.1);o.start();o.stop(ac.currentTime+0.1);}
function playPoint(c){const ac=getAudio();if(!ac)return;const fs=c>=3?[659,784,1047]:[523,659,784];fs.forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='triangle';o.frequency.value=f;const t=ac.currentTime+i*0.06;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.1,t+0.02);g.gain.exponentialRampToValueAtTime(0.001,t+0.1);o.start(t);o.stop(t+0.1);});}
function playCrunch(){const ac=getAudio();if(!ac)return;const buf=ac.createBuffer(1,ac.sampleRate*0.22,ac.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,1.5);const src=ac.createBufferSource(),g=ac.createGain(),flt=ac.createBiquadFilter();flt.type='lowpass';flt.frequency.value=380;src.buffer=buf;src.connect(flt);flt.connect(g);g.connect(ac.destination);g.gain.setValueAtTime(0.5,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.22);src.start();src.stop(ac.currentTime+0.22);}

function spawnFeathers(x,y,skin){for(let i=0;i<16;i++){const a=Math.random()*Math.PI*2,sp=1.5+Math.random()*4;particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2.5,life:1,color:skin.colors[Math.floor(Math.random()*3)],size:3+Math.random()*5,rot:Math.random()*Math.PI*2,rotV:(Math.random()-.5)*.22});}}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawSky(bg) {
  ctx.fillStyle=bg.sky; ctx.fillRect(0,0,W,H-GROUND_H);
  ctx.fillStyle=bg.clouds;
  const t=menuFrame*.3;
  const cx1=W*.15+Math.sin(t*.009)*20, cx2=W*.5, cx3=W*.82;
  [[cx1,H*.12],[cx2,H*.08+Math.sin(t*.007)*8],[cx3,H*.14]].forEach(([cx,cy])=>{
    const sc=W/400;
    ctx.beginPath();ctx.ellipse(cx,cy,55*sc,22*sc,0,0,Math.PI*2);ctx.ellipse(cx+28*sc,cy+5*sc,38*sc,18*sc,0,0,Math.PI*2);ctx.ellipse(cx-22*sc,cy+7*sc,30*sc,16*sc,0,0,Math.PI*2);ctx.fill();
  });
}
function drawGround() {
  ctx.fillStyle='#5aaa3a'; ctx.fillRect(0,H-GROUND_H,W,18);
  ctx.fillStyle='#3e8a28'; ctx.fillRect(0,H-GROUND_H+18,W,GROUND_H-18);
}
function drawPipe(x,topH,gap,pipe) {
  const botY=topH+gap, capH=Math.round(H*0.04), capW=PIPE_W+10, ox=(capW-PIPE_W)/2;
  ctx.fillStyle=pipe.light;
  ctx.fillRect(x,0,PIPE_W,topH); ctx.fillRect(x,botY,PIPE_W,H-GROUND_H-botY);
  ctx.fillStyle=pipe.dark;
  ctx.beginPath();ctx.roundRect(x-ox,topH-capH,capW,capH,[0,0,5,5]);ctx.fill();
  ctx.beginPath();ctx.roundRect(x-ox,botY,capW,capH,[5,5,0,0]);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.1)'; ctx.fillRect(x+4,0,10,topH); ctx.fillRect(x+4,botY,10,H-GROUND_H-botY);
}
function drawBirdAt(bx,by,angle,wb,skin) {
  const r=BIRD_R;
  ctx.save();ctx.translate(bx,by);ctx.rotate(Math.min(Math.max(angle,-.55),Math.PI*1.5));
  ctx.fillStyle=skin.colors[0];ctx.beginPath();ctx.ellipse(0,0,r,r-4,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=skin.colors[1];ctx.beginPath();ctx.ellipse(3,4,r-4,r-8,.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=skin.colors[1];ctx.beginPath();ctx.ellipse(-5,3+wb,11,5,-.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='white';ctx.beginPath();ctx.arc(8,-6,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#111';ctx.beginPath();ctx.arc(9,-6.5,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='white';ctx.beginPath();ctx.arc(10.5,-8,1.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=skin.colors[2];ctx.beginPath();ctx.moveTo(13,-1);ctx.lineTo(22,2);ctx.lineTo(13,5);ctx.closePath();ctx.fill();
  ctx.restore();
}

// ── Game loop ─────────────────────────────────────────────────────────────────
function gameLoop() {
  menuFrame++;frame++;
  const eq=getEquipped();
  const d=gameMode==='ranked'?DIFFS.normal:DIFFS[chosenDiff];
  drawSky(eq.bg);

  if(gState==='playing'){
    bird.vy+=GRAVITY; bird.y+=bird.vy; bird.angle=bird.vy*.08;
    groundOffset+=d.speed;
    if(frame%d.freq===0) spawnPipe();
    pipes.forEach(p=>p.x-=d.speed);
    pipes=pipes.filter(p=>p.x+PIPE_W>0);
    let hit=false;
    pipes.forEach(p=>{
      if(!p.passed&&p.x+PIPE_W<BIRD_X()){
        p.passed=true; combo=Math.min(combo+1,8); maxCombo=Math.max(maxCombo,combo);
        score+=combo;
        const sc=document.getElementById('hud-score');if(sc)sc.textContent=score;
        const cb=document.getElementById('hud-combo');if(cb)cb.textContent='×'+combo;
        if(score>sessionBest){sessionBest=score;const hb=document.getElementById('hud-best');if(hb)hb.textContent=sessionBest;}
        if(currentUser){
          currentUser.coins=(currentUser.coins||0)+1;
          const cd=document.getElementById('hud-coins-disp');if(cd)cd.textContent=currentUser.coins;
          coinPopups.push({x:p.x+PIPE_W/2,y:H*.4,text:'+1',life:1,vy:-1.8});
        }
        if(matchId) socket.emit('score_update',{matchId,score,combo});
        playPoint(combo);
      }
      const br=BIRD_R-4;
      if(BIRD_X()+br>p.x&&BIRD_X()-br<p.x+PIPE_W&&(bird.y-br<p.topH||bird.y+br>p.topH+d.gap))hit=true;
    });
    if(bird.y+BIRD_R>H-GROUND_H||bird.y-BIRD_R<0)hit=true;
    if(hit){
      gState='dying';
      deadBird={x:BIRD_X(),y:bird.y,vy:bird.vy-2,vx:1.5,angle:bird.angle,spin:.22};
      combo=1; const cb=document.getElementById('hud-combo');if(cb)cb.textContent='×1';
      spawnFeathers(BIRD_X(),bird.y,eq.bird); playCrunch();
      if(matchId) socket.emit('match_died',{matchId,finalScore:score,maxCombo,survived:false});
      // In ranked: dying = you lose
      if(matchId){
        const ys=document.getElementById('vs-you-s');
        if(ys){ys.textContent='dead';ys.className='vs-dead';}
      }
    }
  }

  if(gState==='dying'&&deadBird){
    deadBird.vy+=.5; deadBird.y+=deadBird.vy; deadBird.x+=deadBird.vx; deadBird.angle+=deadBird.spin;
    if(deadBird.y>H-GROUND_H-BIRD_R){deadBird.y=H-GROUND_H-BIRD_R;deadBird.vy*=-.28;deadBird.vx*=.55;deadBird.spin*=.35;if(Math.abs(deadBird.vy)<.5){gState='dead';deadBird=null;}}
    if(deadBird&&deadBird.y>H+80){gState='dead';deadBird=null;}
  }

  pipes.forEach(p=>drawPipe(p.x,p.topH,d.gap,eq.pipe));
  drawGround();

  // Particles
  particles.forEach(p=>{ctx.save();ctx.globalAlpha=p.life;ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.color;ctx.beginPath();ctx.ellipse(0,0,p.size,p.size*.4,0,0,Math.PI*2);ctx.fill();ctx.restore();p.x+=p.vx;p.y+=p.vy;p.vy+=.13;p.life-=.022;p.rot+=p.rotV;});
  particles=particles.filter(p=>p.life>0);
  coinPopups.forEach(p=>{ctx.save();ctx.globalAlpha=p.life;ctx.fillStyle='#fac775';ctx.font='bold '+Math.round(H*.022)+'px sans-serif';ctx.textAlign='center';ctx.fillText(p.text,p.x,p.y);ctx.restore();p.y+=p.vy;p.life-=.02;});
  coinPopups=coinPopups.filter(p=>p.life>0);

  if(deadBird) drawBirdAt(deadBird.x,deadBird.y,deadBird.angle,0,eq.bird);
  else if(gState!=='dead') drawBirdAt(BIRD_X(),bird.y,bird.angle,gState==='playing'?Math.sin(frame*.25)*5:0,eq.bird);

  const fs=Math.round(H*.045);
  if(gState==='playing'){
    ctx.fillStyle='white'; ctx.textAlign='center'; ctx.font='bold '+fs+'px sans-serif';
    ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=8;
    ctx.fillText(score,W/2,H*.1);
    if(combo>1){ctx.font='bold '+Math.round(fs*.55)+'px sans-serif';ctx.fillStyle='#fac775';ctx.fillText('×'+combo+' combo!',W/2,H*.1+fs*.7);}
    ctx.shadowBlur=0;
  }
  if(gState==='idle'){
    ctx.fillStyle='rgba(0,0,0,.4)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='white'; ctx.textAlign='center'; ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=10;
    ctx.font='bold '+fs+'px sans-serif'; ctx.fillText('tap to start',W/2,H/2-fs*.3);
    ctx.font=Math.round(fs*.5)+'px sans-serif'; ctx.fillStyle='rgba(255,255,255,.7)';
    ctx.fillText(gameMode==='daily'?'daily challenge':gameMode==='ranked'?'ranked — survive longer to win':'difficulty: '+chosenDiff,W/2,H/2+fs*.5);
    ctx.shadowBlur=0;
  }
  if(gState==='dead'){
    ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='white'; ctx.textAlign='center'; ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=10;
    ctx.font='bold '+fs+'px sans-serif'; ctx.fillText('game over',W/2,H/2-fs*.7);
    ctx.font=Math.round(fs*.5)+'px sans-serif'; ctx.fillStyle='rgba(255,255,255,.8)';
    ctx.fillText('score: '+score+' · best combo: ×'+maxCombo,W/2,H/2+fs*.1);
    ctx.font=Math.round(fs*.42)+'px sans-serif'; ctx.fillStyle='rgba(255,255,255,.55)';
    ctx.fillText('tap to try again',W/2,H/2+fs*.7);
    if(!currentUser){ctx.font=Math.round(fs*.38)+'px sans-serif';ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillText('create account to save scores & earn coins',W/2,H/2+fs*1.3);}
    ctx.shadowBlur=0;
  }
}

// ── Menu loop ─────────────────────────────────────────────────────────────────
function menuLoop() {
  menuFrame++;
  drawSky(BG_SKINS[0]);
  menuBirdVY+=.2; menuBirdY+=menuBirdVY;
  if(menuBirdY>H*.6){menuBirdVY=-7;menuBirdY=H*.6;}
  if(menuBirdY<H*.15)menuBirdVY=Math.abs(menuBirdVY)*.5;
  if(menuFrame%Math.round(W/3.5)===0) menuPipes.push({x:W+10,topH:H*.12+Math.random()*(H*.45)});
  menuPipes.forEach(p=>p.x-=2); menuPipes=menuPipes.filter(p=>p.x+PIPE_W>0);
  menuPipes.forEach(p=>drawPipe(p.x,p.topH,H*.35,PIPE_SKINS[0]));
  drawGround();
  drawBirdAt(W*.15,menuBirdY,menuBirdVY*.07,Math.sin(menuFrame*.2)*4,BIRD_SKINS[0]);
  ctx.fillStyle='rgba(0,0,0,.3)'; ctx.fillRect(0,0,W,H);
}

function hubLoop() {
  menuFrame++;
  const eq=getEquipped();
  drawSky(eq.bg); drawGround();
  ctx.fillStyle='rgba(0,0,0,.7)'; ctx.fillRect(0,0,W,H);
}

// ── Main loop ─────────────────────────────────────────────────────────────────
function mainLoop() {
  if(isGameScreen) gameLoop();
  else if(document.getElementById('hub').classList.contains('active')) hubLoop();
  else menuLoop();
  requestAnimationFrame(mainLoop);
}

// ── Menu LB ───────────────────────────────────────────────────────────────────
async function loadMenuLb() {
  const el=document.getElementById('menu-lb'); if(!el)return;
  const rows=await apiFetch('/api/leaderboard');
  el.innerHTML='<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;">🏆 top scores</div>'+renderLbHTML(rows.slice(0,5),'score');
}

// ── Shop timer ────────────────────────────────────────────────────────────────
setInterval(()=>{
  const now=Date.now();
  if(now>shopRotateAt){shopSeed=Math.floor(now/(5*60*1000));shopRotateAt=(shopSeed+1)*5*60*1000;rotateShop();if(hubSection==='shop'&&document.getElementById('hub').classList.contains('active'))goSection('shop');}
  if(hubSection==='shop'){const t=document.querySelector('.stimer');if(t){const s=Math.max(0,Math.round((shopRotateAt-now)/1000));t.textContent='rotates in '+String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}}
},1000);

// ── Init ──────────────────────────────────────────────────────────────────────
(async function init(){
  rotateShop(); menuBirdY=H/2;
  resetGame();
  if(authToken){
    const data=await apiFetch('/api/me');
    if(data.user){currentUser=data.user;goHub();}
    else{authToken=null;localStorage.removeItem('fm_token');}
  }
  loadMenuLb();
  mainLoop();
})();
