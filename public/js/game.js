// ── Canvas ────────────────────────────────────────────────────────────────────
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let W, H;
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
resize(); window.addEventListener('resize', resize);

// ── Constants ─────────────────────────────────────────────────────────────────
const API = '';
const GROUND_H = 70, PIPE_W = 62, BIRD_R = 18;
const GRAVITY = 0.42, JUMP = -8.8;
function BIRD_X() { return Math.floor(W * 0.2); }

const DIFFS = {
  easy:   { speed:2.8, gap:215, freq:130, mult:1,   label:'easy',   desc:'wide gaps, slow pipes · ×1 score' },
  normal: { speed:3.6, gap:178, freq:108, mult:1.5,  label:'normal', desc:'balanced · ×1.5 score' },
  hard:   { speed:5.0, gap:142, freq:82,  mult:2,    label:'hard',   desc:'fast pipes, tight gaps · ×2 score' },
};

const RANKS = [
  {name:'Egg',tiers:1,pts:0,color:'#888',bg:'rgba(136,136,136,.2)'},{name:'Hatchling',tiers:3,pts:50,color:'#cd7f32',bg:'rgba(205,127,50,.2)'},
  {name:'Fledgling',tiers:3,pts:200,color:'#aaa',bg:'rgba(170,170,170,.2)'},{name:'Flapper',tiers:3,pts:500,color:'#fac775',bg:'rgba(250,199,117,.2)'},
  {name:'Tailwind',tiers:3,pts:1000,color:'#5ec8f5',bg:'rgba(94,200,245,.2)'},{name:'Skybreaker',tiers:3,pts:2000,color:'#7f77dd',bg:'rgba(127,119,221,.2)'},
  {name:'Pipebuster',tiers:3,pts:4000,color:'#5dcaa5',bg:'rgba(93,202,165,.2)'},{name:'Flappy Master',tiers:1,pts:8000,color:'#e24b4a',bg:'rgba(226,75,74,.2)'},
];

function getRankInfo(pts) {
  for (let i=RANKS.length-1;i>=0;i--) {
    if (pts>=RANKS[i].pts) {
      const r=RANKS[i],next=RANKS[i+1];
      const span=next?next.pts-r.pts:1,within=pts-r.pts;
      const ti=next?Math.min(Math.floor((within/span)*r.tiers),r.tiers-1):0;
      const pct=next?Math.min(100,Math.round((within/span)*100)):100;
      return {label:r.name+(r.tiers>1?' '+['I','II','III'][ti]:''),color:r.color,bg:r.bg,pct,pts};
    }
  }
  return {label:'Egg',color:'#888',bg:'rgba(136,136,136,.2)',pct:0,pts:0};
}

const BIRD_SKINS = [
  {id:'hatchling',name:'Hatchling',colors:['#F5C842','#F0A800','#FF7A00']},
  {id:'sky',      name:'Sky',      colors:['#85B7EB','#378ADD','#185FA5']},
  {id:'rose',     name:'Rose',     colors:['#ED93B1','#D4537E','#993556']},
  {id:'jade',     name:'Jade',     colors:['#5DCAA5','#1D9E75','#0F6E56']},
  {id:'amethyst', name:'Amethyst', colors:['#AFA9EC','#7F77DD','#534AB7']},
  {id:'coral',    name:'Coral',    colors:['#F0997B','#D85A30','#993C1D']},
  {id:'gold',     name:'Gold',     colors:['#FAC775','#BA7517','#854F0B']},
  {id:'shadow',   name:'Shadow',   colors:['#B4B2A9','#5F5E5A','#2C2C2A']},
  {id:'phoenix',  name:'Phoenix',  colors:['#F09595','#E24B4A','#fac775']},
  {id:'void_bird',name:'Void',     colors:['#3a1a5e','#7f77dd','#e24b4a']},
];
const PIPE_SKINS = [
  {id:'bamboo',   name:'Bamboo',   light:'#5BC63C',dark:'#4DB533'},
  {id:'sky',      name:'Sky',      light:'#378ADD',dark:'#185FA5'},
  {id:'lava',     name:'Lava',     light:'#E24B4A',dark:'#A32D2D'},
  {id:'amethyst', name:'Amethyst', light:'#7F77DD',dark:'#534AB7'},
  {id:'teal',     name:'Teal',     light:'#1D9E75',dark:'#0F6E56'},
  {id:'gold',     name:'Gold',     light:'#EF9F27',dark:'#BA7517'},
  {id:'rose',     name:'Rose',     light:'#D4537E',dark:'#993556'},
  {id:'midnight', name:'Midnight', light:'#5F5E5A',dark:'#2C2C2A'},
  {id:'neon',     name:'Neon',     light:'#5DCAA5',dark:'#E24B4A'},
  {id:'void_pipe',name:'Void',     light:'#3a1a5e',dark:'#7f77dd'},
];
const BG_SKINS = [
  {id:'sky',    name:'Day',    sky:'#5EC8F5',clouds:'rgba(255,255,255,.55)'},
  {id:'sunset', name:'Sunset', sky:'#e07b50',clouds:'rgba(255,210,160,.5)' },
  {id:'night',  name:'Night',  sky:'#111428',clouds:'rgba(60,65,110,.6)'   },
  {id:'forest', name:'Forest', sky:'#639922',clouds:'rgba(190,240,160,.4)' },
  {id:'ocean',  name:'Ocean',  sky:'#185FA5',clouds:'rgba(160,210,255,.45)'},
  {id:'candy',  name:'Candy',  sky:'#ED93B1',clouds:'rgba(255,230,245,.65)'},
  {id:'storm',  name:'Storm',  sky:'#2a2a35',clouds:'rgba(100,100,120,.55)'},
  {id:'aurora', name:'Aurora', sky:'#063020',clouds:'rgba(80,200,130,.35)' },
  {id:'cosmic', name:'Cosmic', sky:'#16103a',clouds:'rgba(160,140,220,.4)' },
  {id:'void',   name:'Void',   sky:'#0a0010',clouds:'rgba(100,0,150,.4)'   },
];
const TRAIL_DEFS = {
  none:      {name:'None',     draw:()=>{}},
  fire:      {name:'Fire',     color:'#FF7A00', glow:'#e24b4a'},
  ice:       {name:'Ice',      color:'#85B7EB', glow:'#5ec8f5'},
  lightning: {name:'Lightning',color:'#fac775', glow:'#fff'},
  rainbow:   {name:'Rainbow',  color:null,      rainbow:true},
  galaxy:    {name:'Galaxy',   color:'#7f77dd', glow:'#e24b4a', stars:true},
  void:      {name:'Void',     color:'#3a1a5e', glow:'#7f77dd', pulse:true},
};
const RARITY_COLORS = {common:'#aaa',uncommon:'#5dcaa5',rare:'#5ec8f5',epic:'#afa9ec',legendary:'#fac775',mythical:'#e24b4a'};
const RARITY_LABELS = {common:'Common',uncommon:'Uncommon',rare:'Rare',epic:'Epic',legendary:'Legendary',mythical:'Mythical'};

// ── Music ─────────────────────────────────────────────────────────────────────
const TRACKS = [
  {name:'Chill Breeze',  gen:'chill1'},{name:'Lo-Fi Drift', gen:'chill2'},
  {name:'Sky Walk',      gen:'chill3'},{name:'Game Beat',   gen:'game'},
  {name:'Upbeat Run',    gen:'game2'},{name:'Ranked Hype',  gen:'ranked'},
];
let audioCtx=null,currentTrackIdx=0,musicPlaying=false,musicNodes=[],musicGainNode=null;

function getAudio(){if(!audioCtx){try{audioCtx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}return audioCtx;}

function stopMusic(){musicNodes.forEach(n=>{try{n.stop();}catch(e){}});musicNodes=[];musicPlaying=false;document.getElementById('music-btn').textContent='▶';}

const TRACK_DATA={
  chill1:{bpm:72,notes:[261,294,330,349,392,440,494],type:'sine',bass:[98,110,131],pattern:[0,2,4,2,1,3,4,3]},
  chill2:{bpm:80,notes:[220,261,294,330,349,392],type:'sine',bass:[82,98,110],pattern:[0,1,3,1,2,4,2,1]},
  chill3:{bpm:68,notes:[196,220,261,294,330,392,440],type:'triangle',bass:[73,82,98],pattern:[0,3,2,4,1,3,0,2]},
  game:  {bpm:120,notes:[261,330,392,523,659],type:'square',bass:[98,131,165],pattern:[0,1,2,1,3,2,4,3]},
  game2: {bpm:130,notes:[294,330,392,440,523,659],type:'sawtooth',bass:[110,131,147],pattern:[0,2,1,3,0,4,2,3]},
  ranked:{bpm:148,notes:[220,294,330,392,440,494,523],type:'sawtooth',bass:[110,147,165],pattern:[0,1,3,4,2,4,3,1]},
};
function playGeneratedTrack(gen){
  const ac=getAudio();if(!ac)return;
  stopMusic();
  musicPlaying=true;
  document.getElementById('music-btn').textContent='⏸';
  const td=TRACK_DATA[gen]||TRACK_DATA.chill1;
  const masterGain=ac.createGain();masterGain.gain.value=0.04;masterGain.connect(ac.destination);
  musicGainNode=masterGain;
  const reverb=ac.createConvolver();
  const len=ac.sampleRate*.8;const buf=ac.createBuffer(2,len,ac.sampleRate);
  for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2);}
  reverb.buffer=buf;reverb.connect(masterGain);
  const dryGain=ac.createGain();dryGain.gain.value=0.7;dryGain.connect(masterGain);
  const wetGain=ac.createGain();wetGain.gain.value=0.3;wetGain.connect(reverb);
  const beat=60/td.bpm;
  let t=ac.currentTime+0.1;let step=0;
  const melody=()=>{
    if(!musicPlaying)return;
    const pi=td.pattern[step%td.pattern.length];
    const freq=td.notes[pi%td.notes.length];
    const o=ac.createOscillator();const g=ac.createGain();
    o.type=td.type;o.frequency.value=freq;
    o.connect(g);g.connect(dryGain);g.connect(wetGain);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.18,t+0.02);
    g.gain.exponentialRampToValueAtTime(0.001,t+beat*0.8);
    o.start(t);o.stop(t+beat*0.85);musicNodes.push(o);
    // bass on beat 1 and 3
    if(step%2===0){
      const bf=td.bass[Math.floor(step/2)%td.bass.length];
      const bo=ac.createOscillator();const bg2=ac.createGain();
      bo.type='sine';bo.frequency.value=bf;
      bo.connect(bg2);bg2.connect(masterGain);
      bg2.gain.setValueAtTime(0,t);bg2.gain.linearRampToValueAtTime(0.12,t+0.04);
      bg2.gain.exponentialRampToValueAtTime(0.001,t+beat*1.8);
      bo.start(t);bo.stop(t+beat*1.9);musicNodes.push(bo);
    }
    step++;t+=beat;
    if(t<ac.currentTime+3)setTimeout(melody,0);else setTimeout(melody,(t-ac.currentTime-3)*1000);
  };
  melody();
}

function toggleMusic(){
  if(musicPlaying){stopMusic();}
  else{const t=TRACKS[currentTrackIdx];document.getElementById('music-track').textContent=t.name;playGeneratedTrack(t.gen);}
}
function prevTrack(){currentTrackIdx=(currentTrackIdx-1+TRACKS.length)%TRACKS.length;const t=TRACKS[currentTrackIdx];document.getElementById('music-track').textContent=t.name;if(musicPlaying){stopMusic();playGeneratedTrack(t.gen);}}
function nextTrack(){currentTrackIdx=(currentTrackIdx+1)%TRACKS.length;const t=TRACKS[currentTrackIdx];document.getElementById('music-track').textContent=t.name;if(musicPlaying){stopMusic();playGeneratedTrack(t.gen);}}
function setMusicVolume(v){if(musicGainNode)musicGainNode.gain.value=v;}

// SFX
function playFlap(){const ac=getAudio();if(!ac)return;const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.setValueAtTime(520,ac.currentTime);o.frequency.exponentialRampToValueAtTime(780,ac.currentTime+0.06);g.gain.setValueAtTime(0.12,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.1);o.start();o.stop(ac.currentTime+0.1);}
function playPoint(){const ac=getAudio();if(!ac)return;[523,659,784].forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='triangle';o.frequency.value=f;const t=ac.currentTime+i*0.06;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.09,t+0.02);g.gain.exponentialRampToValueAtTime(0.001,t+0.1);o.start(t);o.stop(t+0.1);});}
function playLevelUp(){const ac=getAudio();if(!ac)return;[523,659,784,1047].forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='triangle';o.frequency.value=f;const t=ac.currentTime+i*0.1;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.15,t+0.03);g.gain.exponentialRampToValueAtTime(0.001,t+0.18);o.start(t);o.stop(t+0.18);});}
function playCrunch(){const ac=getAudio();if(!ac)return;const buf=ac.createBuffer(1,ac.sampleRate*.22,ac.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,1.5);const src=ac.createBufferSource(),g=ac.createGain(),flt=ac.createBiquadFilter();flt.type='lowpass';flt.frequency.value=380;src.buffer=buf;src.connect(flt);flt.connect(g);g.connect(ac.destination);g.gain.setValueAtTime(0.5,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+.22);src.start();src.stop(ac.currentTime+.22);}

// ── State ─────────────────────────────────────────────────────────────────────
let currentUser=null, authToken=localStorage.getItem('fm_token')||null;
let isGameScreen=false, hubSection='play', chosenDiff='normal', gameMode='normal';
let bird,pipes,score,frame,gState,groundOffset,sessionBest,particles,coinPopups,deadBird,trailPoints;
let menuFrame=0,menuBirdY=0,menuBirdVY=0,menuPipes=[],menuBirds=[],menuObjects=[];
let activeDailyChallenge=0;
let matchId=null,opponentName=null,opponentAlive=true,matchCountdown=null;
let ghostY=0,ghostAngle=0,opponentSkin=null;
let crownUser=null; // username of global #1

// ── Socket ────────────────────────────────────────────────────────────────────
const socket = io();

socket.on('queue_update',({count})=>{const el=document.getElementById('mm-status');if(el)el.textContent=`${count} player${count!==1?'s':''} in queue`;});
socket.on('match_found',({matchId:mid,seed,opponent,opponentRank,opponentSkin:os})=>{
  matchId=mid;opponentName=opponent;opponentAlive=true;opponentSkin=os;
  ghostY=H/2;ghostAngle=0;
  document.getElementById('mm-cancel').style.display='none';
  document.getElementById('mm-title').textContent=`matched vs ${opponent}`;
  document.getElementById('mm-status').textContent=opponentRank;
  document.getElementById('mm-icon').textContent='⚔';
  socket.emit('match_ready',{matchId:mid});
});
socket.on('match_start',({startAt,seed})=>{
  let rem=Math.ceil((startAt-Date.now())/1000);
  const cd=document.getElementById('mm-cd');cd.style.display='block';
  matchCountdown=setInterval(()=>{
    rem=Math.ceil((startAt-Date.now())/1000);
    if(rem>0)cd.textContent=rem;
    else{clearInterval(matchCountdown);startLiveMatch();}
  },80);
});
socket.on('opponent_pos',({y,angle})=>{ghostY=y;ghostAngle=angle;});
socket.on('opponent_score',({score:s})=>{const el=document.getElementById('vs-opp-s');if(el)el.textContent=s;});
socket.on('opponent_died',()=>{
  opponentAlive=false;
  const el=document.getElementById('vs-opp-s');if(el){el.textContent='dead';el.className='vs-dead';}
  const st=document.getElementById('vs-status');if(st)st.textContent='opponent died — survive to win!';
});
socket.on('opponent_disconnected',()=>{
  opponentAlive=false;
  const st=document.getElementById('vs-status');if(st)st.textContent='opponent disconnected!';
  if(gState==='playing'){gState='dead';}
});
socket.on('match_over',(result)=>{
  const isWinner=result.winner===currentUser?.username;
  if(currentUser)refreshUser();
  setTimeout(()=>showRankedOverPanel(isWinner,result.draw,result.winner),1400);
});
socket.on('chat_message',(msg)=>{appendChatMsg(msg);});

function startLiveMatch(){
  hideAllPanels();showHubOverlay(false);isGameScreen=true;
  document.getElementById('hud').classList.add('active');
  document.getElementById('hud-bottom').classList.add('active');
  document.getElementById('vs-ov').classList.add('active');
  document.getElementById('chat-overlay').classList.add('active');
  document.getElementById('vs-opp-name').textContent=opponentName;
  document.getElementById('vs-opp-label').textContent=opponentName;
  const n=currentUser?currentUser.username:'Guest';
  setAv(document.getElementById('hud-av'),n,30);
  document.getElementById('hud-name').textContent=n;
  document.getElementById('hud-coins-disp').textContent=currentUser?currentUser.coins||0:'—';
  resetGame();gState='playing';spawnPipe();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function apiFetch(path,opts={}){
  const headers={'Content-Type':'application/json'};
  if(authToken)headers['Authorization']='Bearer '+authToken;
  const res=await fetch(API+path,{...opts,headers:{...headers,...opts.headers}});
  return res.json();
}
async function refreshUser(){
  if(!authToken)return;
  const data=await apiFetch('/api/me');
  if(data.user){currentUser=data.user;updateHubBar();}
}
async function doRegister(){
  const username=document.getElementById('reg-name').value.trim();
  const password=document.getElementById('reg-pass').value;
  const password2=document.getElementById('reg-pass2').value;
  const err=document.getElementById('reg-err');
  if(!username||username.length<3){err.textContent='Username must be 3+ characters';return;}
  if(password.length<12){err.textContent='Password must be 12+ characters';return;}
  if(password!==password2){err.textContent='Passwords do not match';return;}
  const data=await apiFetch('/api/register',{method:'POST',body:JSON.stringify({username,password})});
  if(data.error){err.textContent=data.error;return;}
  authToken=data.token;localStorage.setItem('fm_token',authToken);currentUser=data.user;err.textContent='';goHub();
}
async function doLogin(){
  const username=document.getElementById('log-name').value.trim();
  const password=document.getElementById('log-pass').value;
  const err=document.getElementById('log-err');
  const data=await apiFetch('/api/login',{method:'POST',body:JSON.stringify({username,password})});
  if(data.error){err.textContent=data.error;return;}
  authToken=data.token;localStorage.setItem('fm_token',authToken);currentUser=data.user;err.textContent='';goHub();
}
function doLogout(){
  authToken=null;currentUser=null;localStorage.removeItem('fm_token');
  socket.emit('leave_queue');isGameScreen=false;
  document.getElementById('hud').classList.remove('active');
  document.getElementById('hud-bottom').classList.remove('active');
  document.getElementById('vs-ov').classList.remove('active');
  document.getElementById('chat-overlay').classList.remove('active');
  showHubOverlay(false);showPanel('panel-menu');loadMenuLb();
}
function playAsGuest(){currentUser=null;goHub();}

// ── UI Helpers ────────────────────────────────────────────────────────────────
function showPanel(id){document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));const el=document.getElementById(id);if(el)el.classList.add('active');}
function hideAllPanels(){document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));}
function showHubOverlay(s){document.getElementById('hub').classList.toggle('active',s);}
function togglePw(id,btn){const inp=document.getElementById(id);inp.type=inp.type==='text'?'password':'text';btn.textContent=inp.type==='text'?'🙈':'👁';}
function updateStrength(){
  const p=document.getElementById('reg-pass').value;
  const bar=document.getElementById('strength-bar'),lbl=document.getElementById('strength-label');
  let s=0;if(p.length>=12)s++;if(p.length>=16)s++;if(/[A-Z]/.test(p))s++;if(/[0-9]/.test(p))s++;if(/[^A-Za-z0-9]/.test(p))s++;
  const lvl=p.length<12?0:Math.min(s,5);
  const L=[{w:'0%',c:'#e24b4a',t:'too short — need 12+'},{w:'20%',c:'#e24b4a',t:'weak'},{w:'40%',c:'#ef9f27',t:'fair'},{w:'60%',c:'#ef9f27',t:'moderate'},{w:'80%',c:'#5dcaa5',t:'strong'},{w:'100%',c:'#1d9e75',t:'very strong'}];
  bar.style.width=L[lvl].w;bar.style.background=L[lvl].c;lbl.textContent=L[lvl].t;
}
const AVC=[{bg:'#1a2a40',fg:'#5ec8f5'},{bg:'#1a3028',fg:'#5dcaa5'},{bg:'#302010',fg:'#fac775'},{bg:'#221a3a',fg:'#afa9ec'},{bg:'#3a1a10',fg:'#f0997b'},{bg:'#2a1a28',fg:'#ed93b1'}];
function avColor(n){let h=0;for(let c of n)h=(h*31+c.charCodeAt(0))&0xffff;return AVC[h%AVC.length];}
function initials(n){return n.trim().split(/\s+/).map(w=>w[0].toUpperCase()).slice(0,2).join('');}
function setAv(el,n,sz){if(!el)return;const a=avColor(n);el.style.cssText+='background:'+a.bg+';color:'+a.fg+';min-width:'+sz+'px;width:'+sz+'px;height:'+sz+'px;font-size:'+(sz*.35)+'px;';el.textContent=initials(n)||'?';}

// ── Hub ───────────────────────────────────────────────────────────────────────
function goHub(){
  hideAllPanels();showHubOverlay(true);isGameScreen=false;
  document.getElementById('hud').classList.remove('active');
  document.getElementById('hud-bottom').classList.remove('active');
  document.getElementById('vs-ov').classList.remove('active');
  document.getElementById('chat-overlay').classList.remove('active');
  updateHubBar();goSection('play');
}
function updateHubBar(){
  const isGuest=!currentUser;
  const n=isGuest?'Guest':currentUser.username;
  setAv(document.getElementById('hub-av'),n,34);
  document.getElementById('hub-uname').textContent=n;
  const pill=document.getElementById('hub-rpill');
  const coinsEl=document.getElementById('hub-coins');
  if(isGuest){pill.textContent='Guest';pill.style.cssText='background:rgba(100,100,100,.2);color:#888;';coinsEl.textContent='—';}
  else{
    const ri=getRankInfo(currentUser.rank_pts||0);
    pill.textContent=ri.label;pill.style.cssText='background:'+ri.bg+';color:'+ri.color+';';
    coinsEl.textContent=currentUser.coins||0;
    const lvl=currentUser.level||1,xp=currentUser.xp||0;
    const xpNeeded=Math.min(lvl*100,10000);
    document.getElementById('hub-lvl').textContent='Lvl '+lvl;
    document.getElementById('hub-xpbar').style.width=Math.round((xp/xpNeeded)*100)+'%';
  }
}
function goSection(s){
  hubSection=s;
  document.querySelectorAll('.hnb').forEach(b=>b.classList.toggle('active',b.dataset.s===s));
  const el=document.getElementById('hub-body');
  if(s==='play')renderPlay(el);
  else if(s==='ranked')renderRanked(el);
  else if(s==='daily')renderDaily(el);
  else if(s==='cases')renderCases(el);
  else if(s==='inventory')renderInventory(el);
  else if(s==='chat')renderChatSection(el);
  else if(s==='profile')renderProfile(el);
}

// ── Play ──────────────────────────────────────────────────────────────────────
async function renderPlay(el){
  el.innerHTML=`
    <div class="slabel">difficulty</div>
    <div class="drow">${['easy','normal','hard'].map(d=>`<button class="dbtn${chosenDiff===d?' sel':''}" onclick="selDiff('${d}')">${d}</button>`).join('')}</div>
    <div style="font-size:12px;color:rgba(255,255,255,.4);margin-bottom:12px;">${DIFFS[chosenDiff].desc}</div>
    <button class="btn-p" onclick="startGame('normal')">▶ play now</button>
    <div class="slabel" style="margin-top:14px;">🏆 leaderboard</div>
    <div id="play-lb"><div class="empty">loading...</div></div>`;
  const rows=await apiFetch('/api/leaderboard');
  const lbEl=document.getElementById('play-lb');
  if(lbEl)lbEl.innerHTML=renderLbHTML(rows,'score');
  // grab crown holder
  if(rows.length>0)crownUser=rows[0].username;
}
function selDiff(d){chosenDiff=d;renderPlay(document.getElementById('hub-body'));}

// ── Ranked ────────────────────────────────────────────────────────────────────
async function renderRanked(el){
  if(!currentUser){el.innerHTML='<div class="empty">create an account to play ranked</div>';return;}
  const ri=getRankInfo(currentUser.rank_pts||0);
  const lbRows=await apiFetch('/api/leaderboard/ranked');
  el.innerHTML=`
    <div class="slabel">your rank</div>
    <span class="rank-pill" style="background:${ri.bg};color:${ri.color};font-size:13px;padding:4px 12px;border-radius:20px;display:inline-block;margin-bottom:8px;">${ri.label}</span>
    <div class="rbw"><div class="rbb" style="width:${ri.pct}%;background:${ri.color};"></div></div>
    <div style="font-size:11px;color:rgba(255,255,255,.35);margin-bottom:12px;">${currentUser.rank_pts||0} pts · ${ri.pct}% to next</div>
    <div style="font-size:12px;color:rgba(255,255,255,.4);margin-bottom:12px;line-height:1.7;">
      🏆 Survival mode — <strong style="color:#fac775;">first to die loses</strong><br>
      Win = <strong style="color:#5dcaa5;">+20 pts</strong> · Lose = <strong style="color:#e24b4a;">−5 pts</strong><br>
      You can see your opponent's ghost in-game!
    </div>
    <button class="btn-p" onclick="joinRankedQueue()" style="margin-bottom:14px;">⚔ find opponent</button>
    <div class="slabel">rank leaderboard</div>
    ${renderRankedLbHTML(lbRows)}
    ${renderRankLadder(currentUser.rank_pts||0)}`;
}
function renderRankedLbHTML(rows){
  if(!rows.length)return'<div class="empty">no ranked players yet</div>';
  return rows.slice(0,8).map((r,i)=>{
    const ri2=getRankInfo(r.rank_pts||0);
    const isYou=currentUser&&r.username===currentUser.username;
    const av=avColor(r.username);
    return `<div class="lbr"><span class="lbrank ${i===0?'g':i===1?'s':i===2?'b':''}">#${i+1}</span><div class="lbav" style="background:${av.bg};color:${av.fg};">${initials(r.username)}</div><span class="lbn">${r.username}${isYou?' <span class="lbyou">you</span>':''}${r.crown?' 👑':''}</span><span style="font-size:9px;padding:1px 5px;border-radius:3px;background:${ri2.bg};color:${ri2.color};">${ri2.label}</span><span class="lbp" style="color:#fac775;">${r.rank_pts||0}</span></div>`;
  }).join('');
}
function renderRankLadder(pts){
  return'<div style="margin-top:14px;"><div class="slabel">rank ladder</div>'+
    RANKS.map((r,i)=>{const active=pts>=r.pts&&(i===RANKS.length-1||pts<RANKS[i+1].pts);return`<div class="rli"><div class="rld" style="background:${r.color};${active?'box-shadow:0 0 0 3px '+r.color+'30;':''}"></div><span style="font-size:12px;color:${active?r.color:'rgba(255,255,255,.35)'};font-weight:${active?700:400};">${r.name}${r.tiers>1?' I–III':''}</span><span style="font-size:10px;color:rgba(255,255,255,.25);margin-left:auto;">${r.pts} pts</span></div>`;}).join('')+'</div>';
}
function joinRankedQueue(){
  showHubOverlay(false);showPanel('panel-mm');
  document.getElementById('mm-title').textContent='finding opponent...';
  document.getElementById('mm-status').textContent='in queue';
  document.getElementById('mm-cancel').style.display='block';
  document.getElementById('mm-cd').style.display='none';
  document.getElementById('mm-icon').textContent='🐦';
  socket.emit('join_ranked',{token:authToken,username:currentUser?.username,equippedSkin:currentUser?.equipped});
}
function leaveQueue(){socket.emit('leave_queue');if(matchCountdown)clearInterval(matchCountdown);hideAllPanels();goHub();}

// ── Daily ─────────────────────────────────────────────────────────────────────
async function renderDaily(el){
  const info=await apiFetch('/api/daily');
  const lbRows=await apiFetch('/api/leaderboard/daily');
  const done=currentUser&&currentUser.daily_done===info.key;
  el.innerHTML=`
    <div class="slabel">📅 daily challenge</div>
    <div style="font-size:12px;color:rgba(255,255,255,.4);margin-bottom:8px;">Seed <strong style="color:#fff;">#${info.seed%10000}</strong> — same pipes for everyone!</div>
    ${done?'<div style="font-size:12px;color:#5dcaa5;margin-bottom:8px;">✓ completed today!</div>':''}
    <button class="btn-p" onclick="startGame('daily')" ${done?'disabled style="opacity:.4;"':''} style="margin-bottom:14px;">${done?'completed':'play daily'}</button>
    <div class="slabel">today's leaderboard</div>
    ${lbRows.length?renderLbHTML(lbRows,'score'):'<div class="empty">no scores yet — be first!</div>'}`;
}

// ── Cases ─────────────────────────────────────────────────────────────────────
const CRATE_CATEGORIES=[
  {key:'bird', label:'🐦 Bird Crates',       ids:['bird_common','bird_premium']},
  {key:'pipe', label:'🎋 Pipe Crates',       ids:['pipe_common','pipe_premium']},
  {key:'bg',   label:'🌄 Background Crates', ids:['bg_common','bg_premium']},
  {key:'trail',label:'✨ Trail Crates',       ids:['trail_common','trail_premium']},
];

async function renderCases(el){
  if(!currentUser){el.innerHTML='<div class="empty">log in to buy and open crates</div>';return;}
  const cases=await apiFetch('/api/cases');
  const inv=currentUser.inventory||{};
  const myCase=inv.cases||[];
  const caseMap={};cases.forEach(c=>caseMap[c.id]=c);
  let html='';
  CRATE_CATEGORIES.forEach(cat=>{
    html+='<div class="slabel">'+cat.label+'</div><div style="display:flex;gap:8px;margin-bottom:14px;">';
    cat.ids.forEach(cid=>{
      const c=caseMap[cid];if(!c)return;
      const owned=myCase.filter(x=>x===cid).length;
      const PRM={bird_common:['Common','Uncommon','Rare','Epic'],bird_premium:['Rare','Epic','Legendary','Mythical'],pipe_common:['Common','Uncommon','Rare','Epic'],pipe_premium:['Rare','Epic','Legendary','Mythical'],bg_common:['Common','Uncommon','Rare','Epic'],bg_premium:['Rare','Epic','Legendary','Mythical'],trail_common:['Common','Uncommon','Rare','Epic'],trail_premium:['Rare','Epic','Legendary','Mythical']};
      const RC2={Common:'#aaa',Uncommon:'#5dcaa5',Rare:'#5ec8f5',Epic:'#afa9ec',Legendary:'#fac775',Mythical:'#e24b4a'};
      const poolR=(PRM[cid]||[]).map(r=>'<span style="color:'+RC2[r]+';font-size:8px;font-weight:700;">'+r+'</span>').join(' ');
      html+='<div style="flex:1;background:rgba(255,255,255,.05);border:1px solid '+c.color+'33;border-radius:12px;padding:10px 6px;text-align:center;cursor:pointer;" onclick="buyCase('+JSON.stringify(cid)+')">'+
        '<div style="font-size:24px;margin-bottom:4px;">'+(c.icon||'📦')+'</div>'+
        '<div style="font-size:10px;font-weight:700;color:'+c.color+';margin-bottom:3px;">'+c.name+'</div>'+
        (poolR?'<div style="margin-bottom:4px;line-height:1.8;">'+poolR+'</div>':'')+
        '<div style="font-size:10px;color:rgba(255,255,255,.35);">50 🪙</div>'+
        (owned>0?'<div style="font-size:9px;font-weight:700;color:#5dcaa5;margin-top:3px;">x'+owned+' owned</div>':'')+
        '</div>';
    });
    html+='</div>';
  });
  html+='<div class="slabel">your crates ('+myCase.length+')</div>';
  if(myCase.length===0){
    html+='<div class="empty">no crates — buy some above!</div>';
  } else {
    html+='<div style="display:flex;flex-wrap:wrap;gap:6px;">';
    [...new Set(myCase)].forEach(cid=>{
      const c=caseMap[cid]||{name:cid,color:'#fff',icon:'📦'};
      const count=myCase.filter(x=>x===cid).length;
      html+='<div style="background:rgba(255,255,255,.07);border:1px solid '+c.color+'44;border-radius:10px;padding:10px 14px;cursor:pointer;text-align:center;min-width:80px;" onclick="openCase('+JSON.stringify(cid)+')">'+
        '<div style="font-size:22px;">'+(c.icon||'📦')+'</div>'+
        '<div style="font-size:10px;font-weight:700;color:'+c.color+';margin-top:3px;">'+c.name+'</div>'+
        '<div style="font-size:10px;color:rgba(255,255,255,.4);">×'+count+' · open</div>'+
        '</div>';
    });
    html+='</div>';
  }
  html+='<div style="font-size:11px;color:rgba(255,255,255,.22);margin-top:10px;">Duplicates give coins instead. Each crate costs 50 🪙.</div>';
  el.innerHTML=html;
}
async function buyCase(caseId){
  if(!currentUser)return;
  if((currentUser.coins||0)<50){alert('not enough coins! need 50 🪙');return;}
  const data=await apiFetch('/api/cases/buy',{method:'POST',body:JSON.stringify({caseId,qty:1})});
  if(data.error){alert(data.error);return;}
  currentUser=data.user;updateHubBar();renderCases(document.getElementById('hub-body'));
}

async function openCase(caseId){
  if(!currentUser)return;
  const overlay=document.getElementById('open-overlay');
  overlay.classList.add('active');
  document.getElementById('open-box').style.display='block';
  document.getElementById('open-item-reveal').style.display='none';
  document.getElementById('open-result-name').textContent='';
  document.getElementById('open-result-rarity').textContent='';
  document.getElementById('open-result-dup').textContent='';
  setTimeout(async()=>{
    const data=await apiFetch('/api/cases/open',{method:'POST',body:JSON.stringify({caseId})});
    if(data.error){overlay.classList.remove('active');alert(data.error);return;}
    currentUser=data.user;updateHubBar();
    document.getElementById('open-box').style.display='none';
    const reveal=document.getElementById('open-item-reveal');
    const emoji=data.item.type==='bird'?'🐦':data.item.type==='pipe'?'🎋':data.item.type==='bg'?'🌄':'✨';
    reveal.textContent=emoji;reveal.style.display='block';
    const rc=RARITY_COLORS[data.item.rarity]||'#fff';
    document.getElementById('open-result-name').style.color='#fff';
    document.getElementById('open-result-name').textContent=data.item.id.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    document.getElementById('open-result-rarity').style.color=rc;
    document.getElementById('open-result-rarity').textContent=(RARITY_LABELS[data.item.rarity]||data.item.rarity)+' '+data.item.type;
    if(data.duplicate) document.getElementById('open-result-dup').textContent=`duplicate — got ${data.dup_coins} 🪙 instead`;
  },1200);
}
function closeOpenOverlay(){
  document.getElementById('open-overlay').classList.remove('active');
  if(hubSection==='cases')renderCases(document.getElementById('hub-body'));
  if(hubSection==='inventory')renderInventory(document.getElementById('hub-body'));
}

// ── Inventory ─────────────────────────────────────────────────────────────────
function renderInventory(el){
  if(!currentUser){el.innerHTML='<div class="empty">log in to see your inventory</div>';return;}
  const inv=currentUser.inventory||{birds:['hatchling'],pipes:['bamboo'],bgs:['sky'],trails:[],cases:[]};
  const eq=currentUser.equipped||{bird:'hatchling',pipe:'bamboo',bg:'sky',trail:'none'};
  el.innerHTML=`
    <div class="slabel">🐦 bird skins (${inv.birds.length})</div>
    <div class="inv-grid">${inv.birds.map(id=>{
      const skin=BIRD_SKINS.find(s=>s.id===id)||{id,name:id,colors:['#F5C842','#F0A800','#FF7A00']};
      const isEq=eq.bird===id;
      return`<div class="inv-item${isEq?' equipped':''}" onclick="equipItem('bird','${id}')">
        <canvas id="ibrd-${id}" width="40" height="30"></canvas>
        <div class="inv-item-name">${skin.name}</div>
        ${isEq?'<div style="font-size:9px;color:#5ec8f5;">✓ equipped</div>':''}
      </div>`;
    }).join('')}</div>
    <div class="slabel">🎋 pipe skins (${inv.pipes.length})</div>
    <div class="inv-grid">${inv.pipes.map(id=>{
      const skin=PIPE_SKINS.find(s=>s.id===id)||{id,name:id,light:'#5BC63C',dark:'#4DB533'};
      const isEq=eq.pipe===id;
      return`<div class="inv-item${isEq?' equipped':''}" onclick="equipItem('pipe','${id}')">
        <div style="width:40px;height:30px;display:flex;align-items:center;justify-content:center;gap:3px;margin:0 auto 3px;">
          <div style="width:14px;height:26px;background:${skin.light};border-radius:2px;"></div>
          <div style="width:14px;height:26px;background:${skin.dark};border-radius:2px;"></div>
        </div>
        <div class="inv-item-name">${skin.name}</div>
        ${isEq?'<div style="font-size:9px;color:#5ec8f5;">✓ equipped</div>':''}
      </div>`;
    }).join('')}</div>
    <div class="slabel">🌄 backgrounds (${inv.bgs.length})</div>
    <div class="inv-grid">${inv.bgs.map(id=>{
      const skin=BG_SKINS.find(s=>s.id===id)||{id,name:id,sky:'#5EC8F5'};
      const isEq=eq.bg===id;
      return`<div class="inv-item${isEq?' equipped':''}" onclick="equipItem('bg','${id}')">
        <div style="width:40px;height:30px;border-radius:4px;background:${skin.sky};margin:0 auto 3px;"></div>
        <div class="inv-item-name">${skin.name}</div>
        ${isEq?'<div style="font-size:9px;color:#5ec8f5;">✓ equipped</div>':''}
      </div>`;
    }).join('')}</div>
    <div class="slabel">✨ trails (${inv.trails.length+1})</div>
    <div class="inv-grid">
      <div class="inv-item${eq.trail==='none'?' equipped':''}" onclick="equipItem('trail','none')">
        <div style="width:40px;height:30px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.3);font-size:11px;margin:0 auto 3px;">—</div>
        <div class="inv-item-name">None</div>
        ${eq.trail==='none'?'<div style="font-size:9px;color:#5ec8f5;">✓ equipped</div>':''}
      </div>
      ${inv.trails.map(id=>{
        const td=TRAIL_DEFS[id]||{name:id,color:'#fff'};
        const isEq=eq.trail===id;
        return`<div class="inv-item${isEq?' equipped':''}" onclick="equipItem('trail','${id}')">
          <div style="width:40px;height:30px;display:flex;align-items:center;justify-content:center;font-size:16px;margin:0 auto 3px;">${id==='fire'?'🔥':id==='ice'?'❄️':id==='lightning'?'⚡':id==='rainbow'?'🌈':id==='galaxy'?'🌌':'🌀'}</div>
          <div class="inv-item-name">${td.name}</div>
          ${isEq?'<div style="font-size:9px;color:#5ec8f5;">✓ equipped</div>':''}
        </div>`;
      }).join('')}
    </div>`;
  requestAnimationFrame(()=>inv.birds.forEach(id=>{
    const c=document.getElementById('ibrd-'+id);if(!c)return;
    const skin=BIRD_SKINS.find(s=>s.id===id)||BIRD_SKINS[0];
    const x=c.getContext('2d');x.clearRect(0,0,40,30);
    x.fillStyle=skin.colors[0];x.beginPath();x.ellipse(20,15,12,10,0,0,Math.PI*2);x.fill();
    x.fillStyle=skin.colors[1];x.beginPath();x.ellipse(22,18,9,7,.3,0,Math.PI*2);x.fill();
    x.fillStyle='white';x.beginPath();x.arc(27,10,3.5,0,Math.PI*2);x.fill();
    x.fillStyle='#111';x.beginPath();x.arc(28,9.5,2,0,Math.PI*2);x.fill();
    x.fillStyle=skin.colors[2];x.beginPath();x.moveTo(31,13);x.lineTo(38,15);x.lineTo(31,17);x.closePath();x.fill();
  }));
}

async function equipItem(type,id){
  if(!currentUser)return;
  const data=await apiFetch('/api/equip',{method:'POST',body:JSON.stringify({type,itemId:id})});
  if(data.error){alert(data.error);return;}
  currentUser=data.user;updateHubBar();renderInventory(document.getElementById('hub-body'));
}

// ── Chat ──────────────────────────────────────────────────────────────────────
async function renderChatSection(el){
  const msgs=await apiFetch('/api/chat');
  el.innerHTML=`
    <div style="background:rgba(0,0,0,.4);border-radius:10px;padding:10px;max-height:280px;overflow-y:auto;margin-bottom:10px;font-size:12px;" id="hub-chat-msgs"></div>
    <div style="display:flex;gap:6px;">
      <input type="text" id="hub-chat-input" placeholder="say something..." maxlength="200" style="flex:1;padding:8px 10px;" onkeydown="if(event.key==='Enter')sendChatHub()"/>
      <button class="btn-p" style="width:auto;padding:8px 14px;" onclick="sendChatHub()">send</button>
    </div>`;
  const box=document.getElementById('hub-chat-msgs');
  msgs.forEach(m=>appendHubChatMsg(m,box));
  box.scrollTop=box.scrollHeight;
}
function appendHubChatMsg(msg,box){
  if(!box)box=document.getElementById('hub-chat-msgs');
  if(!box)return;
  const div=document.createElement('div');
  div.style.cssText='margin-bottom:5px;color:rgba(255,255,255,.8);';
  const av=avColor(msg.username);
  div.innerHTML=`<strong style="color:${av.fg};">${msg.username}:</strong> ${escHtml(msg.text)}`;
  box.appendChild(div);box.scrollTop=box.scrollHeight;
}
function sendChatHub(){
  const inp=document.getElementById('hub-chat-input');if(!inp)return;
  const text=inp.value.trim();if(!text)return;
  socket.emit('chat_message',{token:authToken,text});
  inp.value='';
}
function appendChatMsg(msg){
  appendHubChatMsg(msg);
  // In hub chat section
  const hubBox=document.getElementById('hub-chat-msgs');
  if(hubBox) appendHubChatMsg(msg,hubBox);
  // In-game persistent msgs box
  const box=document.getElementById('chat-msgs');
  if(box){
    const div=document.createElement('div');div.className='chat-msg';
    const av=avColor(msg.username);
    div.innerHTML='<strong style="color:'+av.fg+';">'+msg.username+':</strong> '+escHtml(msg.text);
    box.appendChild(div);if(box.children.length>30)box.removeChild(box.firstChild);
    box.scrollTop=box.scrollHeight;
    // Auto-hide after 5s
    setTimeout(()=>{if(div.parentNode)div.style.opacity='0';setTimeout(()=>{if(div.parentNode)div.parentNode.removeChild(div);},600);},5000);
  }
}
function sendChat(){
  const inp=document.getElementById('chat-input');if(!inp)return;
  const text=inp.value.trim();if(!text)return;
  socket.emit('chat_message',{token:authToken,text});inp.value='';
}
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&document.activeElement.id==='chat-input')sendChat();});
function escHtml(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// ── Profile ───────────────────────────────────────────────────────────────────
async function renderProfile(el){
  if(!currentUser){el.innerHTML='<div class="empty">log in to see your profile</div>';return;}
  const hist=await apiFetch('/api/history');
  const ri=getRankInfo(currentUser.rank_pts||0);
  const av=avColor(currentUser.username);
  const lvl=currentUser.level||1,xp=currentUser.xp||0,xpNeeded=Math.min(lvl*100,10000);
  el.innerHTML=`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
      <div style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:17px;background:${av.bg};color:${av.fg};flex-shrink:0;">${initials(currentUser.username)}</div>
      <div><div style="font-size:16px;font-weight:700;color:#fff;">${currentUser.username}${currentUser.username===crownUser?' 👑':''}</div><div style="font-size:11px;color:rgba(255,255,255,.35);">joined ${new Date((currentUser.created_at||0)*1000).toLocaleDateString()}</div></div>
    </div>
    <div class="mrow">
      <div class="met"><div class="metl">best</div><div class="metv">${currentUser.best_score||0}</div></div>
      <div class="met"><div class="metl">games</div><div class="metv">${currentUser.games_played||0}</div></div>
      <div class="met"><div class="metl">coins</div><div class="metv">${currentUser.coins||0}</div></div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <span style="font-size:12px;font-weight:700;color:#5ec8f5;">Level ${lvl}</span>
      <span style="font-size:10px;color:rgba(255,255,255,.35);">${xp}/${xpNeeded} XP</span>
    </div>
    <div class="rbw" style="margin-bottom:10px;"><div class="rbb" style="width:${Math.round(xp/xpNeeded*100)}%;background:linear-gradient(90deg,#5ec8f5,#7f77dd);"></div></div>
    <span class="rank-pill" style="background:${ri.bg};color:${ri.color};font-size:12px;padding:3px 10px;border-radius:20px;display:inline-block;margin-bottom:10px;">${ri.label}</span>
    <div class="slabel">recent games</div>
    ${hist.length?hist.slice(0,8).map(r=>`<div class="hi"><span style="font-size:13px;font-weight:700;color:#fff;flex:1;">${r.score}</span><span class="htag tag-${r.mode==='ranked'?'ranked':r.mode==='daily'?'daily':r.diff||'normal'}">${r.mode==='ranked'?'ranked':r.mode==='daily'?'daily':r.diff}</span><span style="font-size:10px;color:rgba(255,255,255,.25);">${new Date((r.created_at||0)*1000).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span></div>`).join(''):'<div class="empty">no games yet</div>'}`;
}

// ── LB HTML ───────────────────────────────────────────────────────────────────
function renderLbHTML(rows,key='score'){
  if(!rows||!rows.length)return'<div class="empty">no scores yet</div>';
  return rows.slice(0,8).map((r,i)=>{
    const isYou=currentUser&&r.username===currentUser.username;
    const av=avColor(r.username);
    return`<div class="lbr"><span class="lbrank ${i===0?'g':i===1?'s':i===2?'b':''}">#${i+1}</span><div class="lbav" style="background:${av.bg};color:${av.fg};">${initials(r.username)}</div><span class="lbn">${r.username}${isYou?' <span class="lbyou">you</span>':''}${r.crown?' 👑':''}</span><span class="lbp">${r[key]}</span></div>`;
  }).join('');
}

// ── Ranked over panel ─────────────────────────────────────────────────────────
function showRankedOverPanel(isWinner,isDraw,winnerName){
  isGameScreen=false;
  document.getElementById('hud').classList.remove('active');
  document.getElementById('hud-bottom').classList.remove('active');
  document.getElementById('vs-ov').classList.remove('active');
  document.getElementById('chat-overlay').classList.remove('active');
  hideAllPanels();showHubOverlay(false);
  const icon=document.getElementById('ro-icon'),title=document.getElementById('ro-title'),result=document.getElementById('ro-result'),pts=document.getElementById('ro-pts');
  if(isDraw){icon.textContent='🤝';title.textContent='draw!';result.textContent='nobody wins this time';pts.textContent='';}
  else if(isWinner){icon.textContent='🏆';title.textContent='you survived!';result.textContent=(winnerName||'you')+' outlasted the opponent';pts.textContent='+20 rank pts';}
  else{icon.textContent='💀';title.textContent='you died first';result.textContent=(winnerName||'opponent')+' survived longer';pts.textContent='-5 rank pts';}
  showPanel('panel-ranked-over');
}
function requeueRanked(){hideAllPanels();joinRankedQueue();}
function exitRankedToHub(){hideAllPanels();goHub();}

// ── Game ──────────────────────────────────────────────────────────────────────
function getEquipped(){
  const eq=currentUser?.equipped||{bird:'hatchling',pipe:'bamboo',bg:'sky',trail:'none'};
  return {
    bird:BIRD_SKINS.find(s=>s.id===eq.bird)||BIRD_SKINS[0],
    pipe:PIPE_SKINS.find(s=>s.id===eq.pipe)||PIPE_SKINS[0],
    bg:BG_SKINS.find(s=>s.id===eq.bg)||BG_SKINS[0],
    trail:eq.trail||'none',
  };
}

function startGame(mode){
  gameMode=mode;sessionBest=0;matchId=null;opponentName=null;opponentAlive=true;
  const n=currentUser?currentUser.username:'Guest';
  hideAllPanels();showHubOverlay(false);isGameScreen=true;
  setAv(document.getElementById('hud-av'),n,30);
  document.getElementById('hud-name').textContent=n;
  document.getElementById('hud-coins-disp').textContent=currentUser?currentUser.coins||0:'—';
  document.getElementById('hud-score').textContent='0';
  document.getElementById('hud-best').textContent='0';
  document.getElementById('hud-xp').textContent='+0';
  document.getElementById('vs-ov').classList.remove('active');
  document.getElementById('chat-overlay').classList.add('active');
  document.getElementById('hud').classList.add('active');
  document.getElementById('hud-bottom').classList.add('active');
  // switch music to game track
  currentTrackIdx=1;document.getElementById('music-track').textContent=TRACKS[1].name;
  if(musicPlaying){stopMusic();playGeneratedTrack('game');}
  resetGame();
  showCutscene();
}

// Cutscene
let cutsceneActive=false,cutsceneFrame=0,cutsceneBirdX=0;
function showCutscene(){
  cutsceneActive=true;cutsceneFrame=0;cutsceneBirdX=-60;
  setTimeout(()=>{cutsceneActive=false;gState='idle';},2000);
}

function playAgain(){
  hideDeadButtons();
  resetGame();gState='idle';
}

function exitToHub(){
  resetGame();isGameScreen=false;
  document.getElementById('hud').classList.remove('active');
  document.getElementById('hud-bottom').classList.remove('active');
  document.getElementById('vs-ov').classList.remove('active');
  document.getElementById('chat-overlay').classList.remove('active');
  currentTrackIdx=0;document.getElementById('music-track').textContent=TRACKS[0].name;
  if(musicPlaying){stopMusic();playGeneratedTrack('menu');}
  goHub();
}

async function autoSaveScore(){
  if(!currentUser||score===0)return;
  const data=await apiFetch('/api/score',{method:'POST',body:JSON.stringify({score,mode:gameMode,diff:chosenDiff})});
  if(data.user){
    currentUser=data.user;updateHubBar();
    document.getElementById('hud-coins-disp').textContent=currentUser.coins||0;
    if(data.levels_gained>0){
      showLevelUpPopup(currentUser.level);playLevelUp();
    }
  }
}

function showLevelUpPopup(lvl){
  coinPopups.push({x:W/2,y:H*.35,text:'LEVEL UP! '+lvl,life:1,vy:-2,big:true});
}

function resetGame(){
  bird={y:H/2,vy:0,angle:0};
  pipes=[];score=0;frame=0;groundOffset=0;
  gState='cutscene';deadBird=null;particles=[];coinPopups=[];trailPoints=[];
  cutsceneActive=false;hideDeadButtons();_deadButtonsVisible=false;
  const sc=document.getElementById('hud-score');if(sc)sc.textContent='0';
}

function flap(){
  if(!isGameScreen)return;
  if(gState==='idle'||gState==='cutscene'){if(!cutsceneActive){gState='playing';spawnPipe();playFlap();}}
  else if(gState==='playing'){bird.vy=JUMP;playFlap();}
  else if(gState==='dead'&&!deadBird&&!matchId){resetGame();cutsceneActive=false;gState='idle';}
}

canvas.addEventListener('click',flap);
canvas.addEventListener('touchstart',e=>{e.preventDefault();flap();},{passive:false});
document.addEventListener('keydown',e=>{if(e.code==='Space'&&document.activeElement.tagName!=='INPUT'){e.preventDefault();flap();}});

let dailyRandState=0;
function dailyRand(){dailyRandState=(dailyRandState*9301+49297)%233280;return dailyRandState/233280;}

function spawnPipe(){
  const d=gameMode==='ranked'?DIFFS.normal:DIFFS[chosenDiff];
  let topH;
  const minTop=90,maxTop=H-GROUND_H-d.gap-90;
  if(gameMode==='daily'){
    if(pipes.length===0){const s=new Date();dailyRandState=(s.getFullYear()*10000+(s.getMonth()+1)*100+s.getDate())*10+(activeDailyChallenge%10);}
    topH=minTop+dailyRand()*(maxTop-minTop);
  } else {
    topH=minTop+Math.random()*(maxTop-minTop);
  }
  pipes.push({x:W+10,topH,passed:false});
}

function spawnFeathers(x,y,skin){for(let i=0;i<16;i++){const a=Math.random()*Math.PI*2,sp=2+Math.random()*4;particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2.5,life:1,color:skin.colors[Math.floor(Math.random()*3)],size:3+Math.random()*5,rot:Math.random()*Math.PI*2,rotV:(Math.random()-.5)*.22});}}

// ── Draw functions ────────────────────────────────────────────────────────────
function drawSky(bg){
  ctx.fillStyle=bg.sky;ctx.fillRect(0,0,W,H-GROUND_H);
  ctx.fillStyle=bg.clouds;
  const t=menuFrame*.3;
  const sc=W/500;
  [[W*.12+Math.sin(t*.009)*18,H*.1],[W*.5,H*.07+Math.sin(t*.007)*7],[W*.82,H*.12]].forEach(([cx,cy])=>{
    ctx.beginPath();ctx.ellipse(cx,cy,60*sc,23*sc,0,0,Math.PI*2);ctx.ellipse(cx+30*sc,cy+6*sc,42*sc,19*sc,0,0,Math.PI*2);ctx.ellipse(cx-24*sc,cy+7*sc,32*sc,17*sc,0,0,Math.PI*2);ctx.fill();
  });
}
function drawGround(){
  ctx.fillStyle='#5aaa3a';ctx.fillRect(0,H-GROUND_H,W,18);
  ctx.fillStyle='#3e8a28';ctx.fillRect(0,H-GROUND_H+18,W,GROUND_H-18);
}
function drawPipe(x,topH,gap,pipe){
  const botY=topH+gap,capH=Math.round(H*.038),capW=PIPE_W+10,ox=(capW-PIPE_W)/2;
  ctx.fillStyle=pipe.light;ctx.fillRect(x,0,PIPE_W,topH);ctx.fillRect(x,botY,PIPE_W,H-GROUND_H-botY);
  ctx.fillStyle=pipe.dark;
  ctx.beginPath();ctx.roundRect(x-ox,topH-capH,capW,capH,[0,0,5,5]);ctx.fill();
  ctx.beginPath();ctx.roundRect(x-ox,botY,capW,capH,[5,5,0,0]);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(x+4,0,10,topH);ctx.fillRect(x+4,botY,10,H-GROUND_H-botY);
}
function drawBirdAt(bx,by,angle,wb,skin,alpha=1){
  const r=BIRD_R;
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(bx,by);ctx.rotate(Math.min(Math.max(angle,-.55),Math.PI*1.5));
  ctx.fillStyle=skin.colors[0];ctx.beginPath();ctx.ellipse(0,0,r,r-4,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=skin.colors[1];ctx.beginPath();ctx.ellipse(3,4,r-4,r-8,.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=skin.colors[1];ctx.beginPath();ctx.ellipse(-5,3+wb,11,5,-.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='white';ctx.beginPath();ctx.arc(8,-6,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#111';ctx.beginPath();ctx.arc(9,-6.5,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='white';ctx.beginPath();ctx.arc(10.5,-8,1.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=skin.colors[2];ctx.beginPath();ctx.moveTo(13,-1);ctx.lineTo(22,2);ctx.lineTo(13,5);ctx.closePath();ctx.fill();
  // Crown if global #1
  if(currentUser&&currentUser.username===crownUser){
    ctx.fillStyle='#fac775';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText('👑',-2,-r-4);
  }
  ctx.restore();
}
function drawTrail(bx,by,trailId){
  if(!trailId||trailId==='none'||!trailPoints)return;
  const td=TRAIL_DEFS[trailId];if(!td)return;
  trailPoints.unshift({x:bx,y:by,t:Date.now()});
  if(trailPoints.length>18)trailPoints.pop();
  trailPoints.forEach((pt,i)=>{
    if(i===0)return;
    const age=i/trailPoints.length;
    const sz=Math.max(1,BIRD_R*(1-age)*.6);
    ctx.save();ctx.globalAlpha=(1-age)*.7;
    if(td.rainbow){ctx.fillStyle=`hsl(${menuFrame*4+i*20},100%,60%)`;}
    else{ctx.fillStyle=td.color||'#fff';}
    if(td.glow){ctx.shadowColor=td.glow;ctx.shadowBlur=sz*2;}
    ctx.beginPath();ctx.arc(pt.x,pt.y,sz,0,Math.PI*2);ctx.fill();
    ctx.restore();
  });
}

// ── Animated menu ─────────────────────────────────────────────────────────────
function initMenuScene(){
  menuBirds=[];
  for(let i=0;i<4;i++){menuBirds.push({x:Math.random()*W,y:H*.08+Math.random()*H*.55,vy:(Math.random()-.5)*1.5,vx:1+Math.random()*1.8,frame:Math.random()*100,skin:BIRD_SKINS[Math.floor(Math.random()*BIRD_SKINS.length)]});}
  menuObjects=[];
  for(let i=0;i<5;i++){menuObjects.push({type:'coin',x:Math.random()*W,y:Math.random()*H*.8,vy:-.4-.2*Math.random(),life:Math.random()});}
  // add planes/UFOs
  for(let i=0;i<2;i++){menuObjects.push({type:Math.random()>.5?'plane':'ufo',x:-120,y:H*.05+Math.random()*H*.25,speed:1.5+Math.random()*1.5});}
}

function menuLoop(){
  menuFrame++;
  drawSky(BG_SKINS[0]);

  // Scrolling pipes
  if(menuFrame%Math.round(W/3.2)===0)menuPipes.push({x:W+10,topH:H*.1+Math.random()*H*.42});
  menuPipes.forEach(p=>p.x-=1.6);menuPipes=menuPipes.filter(p=>p.x+PIPE_W>0);
  menuPipes.forEach(p=>drawPipe(p.x,p.topH,H*.36,PIPE_SKINS[0]));
  drawGround();

  // Animated birds
  menuBirds.forEach(b=>{
    b.frame++;b.vy+=.14;b.y+=b.vy;b.x+=b.vx;
    if(b.y>H*.68){b.vy=-5.5-Math.random()*2;b.y=H*.68;}
    if(b.y<H*.06)b.vy=Math.abs(b.vy)*.5;
    if(b.x>W+60){b.x=-60;b.y=H*.1+Math.random()*H*.5;}
    drawBirdAt(b.x,b.y,b.vy*.07,Math.sin(b.frame*.22)*4,b.skin);
  });

  // Background objects
  menuObjects.forEach(o=>{
    if(o.type==='coin'){
      o.y+=o.vy;o.life+=.007;
      if(o.y<-20||o.life>1){o.x=Math.random()*W;o.y=H*.88;o.life=0;}
      ctx.save();ctx.globalAlpha=Math.sin(o.life*Math.PI)*.65;
      ctx.fillStyle='#fac775';ctx.font='bold '+Math.round(H*.025)+'px sans-serif';ctx.textAlign='center';ctx.fillText('🪙',o.x,o.y);ctx.restore();
    } else if(o.type==='plane'||o.type==='ufo'){
      o.x+=o.speed;
      if(o.x>W+150){o.x=-120;}
      ctx.save();ctx.font='bold '+Math.round(H*.04)+'px sans-serif';ctx.textAlign='center';
      ctx.fillText(o.type==='plane'?'✈️':'🛸',o.x,o.y);ctx.restore();
    }
  });

  // Semi-transparent overlay so panel is readable
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(0,0,W,H);

  // Animated title — top center
  const pulse=Math.sin(menuFrame*.035)*.04+1;
  const titleSize=Math.round(Math.min(W*.1,H*.075));
  const titleY=H*.13;
  // Glow
  ctx.save();
  ctx.textAlign='center';
  ctx.shadowColor='#5ec8f5';ctx.shadowBlur=Math.round(20+Math.sin(menuFrame*.05)*8);
  ctx.font='bold '+Math.round(titleSize*pulse)+'px sans-serif';
  ctx.fillStyle='#fff';
  ctx.fillText('🐦',W/2,titleY);
  ctx.restore();
  // Title text with gradient
  const grd=ctx.createLinearGradient(W/2-200,0,W/2+200,0);
  grd.addColorStop(0,'#5ec8f5');
  grd.addColorStop(0.5,'#ffffff');
  grd.addColorStop(1,'#fac775');
  ctx.save();
  ctx.textAlign='center';
  ctx.shadowColor='rgba(0,0,0,.8)';ctx.shadowBlur=12;
  ctx.font='bold '+Math.round(titleSize*.72)+'px sans-serif';
  ctx.fillStyle=grd;
  ctx.fillText('FLAPPY MASTER',W/2,titleY+Math.round(titleSize*.88));
  ctx.font=Math.round(titleSize*.3)+'px sans-serif';
  ctx.fillStyle='rgba(255,255,255,.5)';
  ctx.fillText('the ultimate flapping experience',W/2,titleY+Math.round(titleSize*1.28));
  ctx.restore();
}

function hubLoop(){
  menuFrame++;const eq=getEquipped();drawSky(eq.bg);drawGround();
  ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(0,0,W,H);
}

let _deadButtonsVisible=false;
function showDeadButtons(){
  if(_deadButtonsVisible)return;_deadButtonsVisible=true;
  const el=document.getElementById('dead-buttons');if(el)el.style.display='flex';
}
function hideDeadButtons(){
  if(!_deadButtonsVisible)return;_deadButtonsVisible=false;
  const el=document.getElementById('dead-buttons');if(el)el.style.display='none';
}

// ── Game loop ─────────────────────────────────────────────────────────────────
function gameLoop(){
  menuFrame++;frame++;
  const eq=getEquipped();
  const d=gameMode==='ranked'?DIFFS.normal:DIFFS[chosenDiff];
  drawSky(eq.bg);

  // Background objects during gameplay
  if(frame%200===0)menuObjects.push({type:Math.random()>.4?'plane':'ufo',x:-120,y:H*.03+Math.random()*H*.18,speed:2+Math.random()*2});
  menuObjects=menuObjects.filter(o=>o.x<W+200);
  menuObjects.forEach(o=>{if(o.type==='plane'||o.type==='ufo'){o.x+=o.speed;ctx.save();ctx.font='bold '+Math.round(H*.035)+'px sans-serif';ctx.textAlign='center';ctx.globalAlpha=.45;ctx.fillText(o.type==='plane'?'✈️':'🛸',o.x,o.y);ctx.restore();}});

  // Cutscene
  if(cutsceneActive){
    cutsceneFrame++;cutsceneBirdX+=W*.012;
    if(cutsceneBirdX>W*.18){cutsceneActive=false;gState='idle';}
    pipes.forEach(p=>drawPipe(p.x,p.topH,d.gap,eq.pipe));
    drawGround();
    drawBirdAt(cutsceneBirdX,H*.45,-.2,Math.sin(cutsceneFrame*.25)*4,eq.bird);
    ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillRect(0,0,W,H);
    const fs=Math.round(H*.04);
    ctx.fillStyle='white';ctx.textAlign='center';ctx.font='bold '+fs+'px sans-serif';ctx.fillText('ready?',W/2,H/2);
    requestAnimationFrame(()=>{});return;
  }

  if(gState==='playing'){
    bird.vy+=GRAVITY;bird.y+=bird.vy;bird.angle=bird.vy*.08;
    groundOffset+=d.speed;
    if(frame%d.freq===0)spawnPipe();
    pipes.forEach(p=>p.x-=d.speed);
    pipes=pipes.filter(p=>p.x+PIPE_W>0);
    let hit=false;
    pipes.forEach(p=>{
      if(!p.passed&&p.x+PIPE_W<BIRD_X()){
        p.passed=true;score++;
        const sc=document.getElementById('hud-score');if(sc)sc.textContent=score;
        if(score>sessionBest){sessionBest=score;const hb=document.getElementById('hud-best');if(hb)hb.textContent=sessionBest;}
        if(currentUser){
          currentUser.coins=(currentUser.coins||0)+1;
          const cd=document.getElementById('hud-coins-disp');if(cd)cd.textContent=currentUser.coins;
          coinPopups.push({x:p.x+PIPE_W/2,y:H*.4,text:'+1',life:1,vy:-1.8});
          const xpEl=document.getElementById('hud-xp');if(xpEl)xpEl.textContent='+'+score*5+' xp';
        }
        if(matchId)socket.emit('score_update',{matchId,score});
        playPoint();
      }
      const br=BIRD_R-5;
      if(BIRD_X()+br>p.x&&BIRD_X()-br<p.x+PIPE_W&&(bird.y-br<p.topH||bird.y+br>p.topH+d.gap))hit=true;
    });
    if(bird.y+BIRD_R>H-GROUND_H||bird.y-BIRD_R<0)hit=true;
    if(hit){
      gState='dying';
      deadBird={x:BIRD_X(),y:bird.y,vy:bird.vy-2,vx:1.5,angle:bird.angle,spin:.22};
      spawnFeathers(BIRD_X(),bird.y,eq.bird);playCrunch();
      if(matchId)socket.emit('match_died',{matchId,finalScore:score});
      else autoSaveScore(); // auto-save on death
      const ys=document.getElementById('vs-you-s');if(ys){ys.textContent='dead';ys.className='vs-dead';}
    }
    // Ghost sync
    if(matchId&&frame%3===0)socket.emit('pos_update',{matchId,y:bird.y,angle:bird.angle});
  }
  if(gState==='dying'&&deadBird){
    deadBird.vy+=.5;deadBird.y+=deadBird.vy;deadBird.x+=deadBird.vx;deadBird.angle+=deadBird.spin;
    if(deadBird.y>H-GROUND_H-BIRD_R){deadBird.y=H-GROUND_H-BIRD_R;deadBird.vy*=-.28;deadBird.vx*=.55;deadBird.spin*=.35;if(Math.abs(deadBird.vy)<.5){gState='dead';deadBird=null;}}
    if(deadBird&&deadBird.y>H+80){gState='dead';deadBird=null;}
  }

  pipes.forEach(p=>drawPipe(p.x,p.topH,d.gap,eq.pipe));
  drawGround();

  // Particles
  particles.forEach(p=>{ctx.save();ctx.globalAlpha=p.life;ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.color;ctx.beginPath();ctx.ellipse(0,0,p.size,p.size*.4,0,0,Math.PI*2);ctx.fill();ctx.restore();p.x+=p.vx;p.y+=p.vy;p.vy+=.12;p.life-=.022;p.rot+=p.rotV;});
  particles=particles.filter(p=>p.life>0);
  coinPopups.forEach(p=>{ctx.save();ctx.globalAlpha=p.life;ctx.fillStyle=p.big?'#fac775':'#fac775';ctx.font='bold '+Math.round(p.big?H*.03:H*.022)+'px sans-serif';ctx.textAlign='center';if(p.big){ctx.shadowColor='#fac775';ctx.shadowBlur=10;}ctx.fillText(p.text,p.x,p.y);ctx.restore();p.y+=p.vy;p.life-=.018;});
  coinPopups=coinPopups.filter(p=>p.life>0);

  // Trail (doesn't collide)
  if(gState==='playing'&&eq.trail!=='none') drawTrail(BIRD_X(),bird.y,eq.trail);

  // Ghost opponent
  if(matchId&&opponentSkin){
    const gSkin=BIRD_SKINS.find(s=>s.id===opponentSkin.bird)||BIRD_SKINS[1];
    drawBirdAt(BIRD_X()+50,ghostY,ghostAngle,0,gSkin,0.45);
    ctx.save();ctx.globalAlpha=.4;ctx.fillStyle='white';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText(opponentName||'opp',BIRD_X()+50,ghostY-BIRD_R-8);ctx.restore();
  }

  if(deadBird)drawBirdAt(deadBird.x,deadBird.y,deadBird.angle,0,eq.bird);
  else if(gState!=='dead')drawBirdAt(BIRD_X(),bird.y,bird.angle,gState==='playing'?Math.sin(frame*.25)*5:0,eq.bird);

  const fs=Math.round(H*.042);
  if(gState==='playing'){
    ctx.fillStyle='white';ctx.textAlign='center';ctx.font='bold '+fs+'px sans-serif';
    ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=8;
    ctx.fillText(score,W/2,H*.09);ctx.shadowBlur=0;
  }
  if(gState==='idle'){
    ctx.fillStyle='rgba(0,0,0,.42)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='white';ctx.textAlign='center';ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=10;
    ctx.font='bold '+fs+'px sans-serif';ctx.fillText('tap to start',W/2,H/2-fs*.3);
    ctx.font=Math.round(fs*.46)+'px sans-serif';ctx.fillStyle='rgba(255,255,255,.65)';
    ctx.fillText(gameMode==='daily'?'daily challenge':gameMode==='ranked'?'ranked — first to die loses':'difficulty: '+chosenDiff+' · ×'+DIFFS[chosenDiff].mult+' score',W/2,H/2+fs*.55);
    ctx.shadowBlur=0;
  }
  if(gState==='dead'){
    ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='white';ctx.textAlign='center';ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=10;
    ctx.font='bold '+fs+'px sans-serif';ctx.fillText('game over',W/2,H/2-fs*.65);
    ctx.font=Math.round(fs*.46)+'px sans-serif';ctx.fillStyle='rgba(255,255,255,.75)';
    ctx.fillText('score: '+score,W/2,H/2+fs*.05);
    if(!currentUser){ctx.font=Math.round(fs*.34)+'px sans-serif';ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillText('create account to save scores & earn coins',W/2,H/2+fs*1.5);}
    ctx.shadowBlur=0;
    showDeadButtons();
  } else { hideDeadButtons(); }
}

// ── Main loop ─────────────────────────────────────────────────────────────────
function mainLoop(){
  if(isGameScreen)gameLoop();
  else if(document.getElementById('hub').classList.contains('active'))hubLoop();
  else menuLoop();
  requestAnimationFrame(mainLoop);
}

async function loadMenuLb(){
  const el=document.getElementById('menu-lb');if(!el)return;
  const rows=await apiFetch('/api/leaderboard');
  if(rows.length>0)crownUser=rows[0].username;
  el.innerHTML='<div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;">🏆 top scores</div>'+renderLbHTML(rows.slice(0,4),'score');
}

// Init
(async function init(){
  initMenuScene();menuBirdY=H/2;resetGame();gState='idle';
  document.getElementById('music-track').textContent=TRACKS[0].name;
  // Auto-play after first interaction to satisfy browser policy
  document.addEventListener('click',function startMusic(){
    if(!musicPlaying){playGeneratedTrack(TRACKS[currentTrackIdx].gen);}
    document.removeEventListener('click',startMusic);
  },{once:true});
  if(authToken){
    const data=await apiFetch('/api/me');
    if(data.user){currentUser=data.user;goHub();}
    else{authToken=null;localStorage.removeItem('fm_token');}
  }
  loadMenuLb();mainLoop();
})();
