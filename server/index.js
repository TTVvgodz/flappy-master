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

function loadData() {
  try { if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch(e) {}
  return { users:{}, scores:[], daily:{}, history:[], chat:[] };
}
function saveData(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }
let db = loadData();
setInterval(() => saveData(db), 8000);

const RANKS = [
  {name:'Egg',tiers:1,pts:0},{name:'Hatchling',tiers:3,pts:50},{name:'Fledgling',tiers:3,pts:200},
  {name:'Flapper',tiers:3,pts:500},{name:'Tailwind',tiers:3,pts:1000},{name:'Skybreaker',tiers:3,pts:2000},
  {name:'Pipebuster',tiers:3,pts:4000},{name:'Flappy Master',tiers:1,pts:8000},
];

const CASES = {
  // Bird crates
  bird_common:   { name:'Feather Crate',  price:50,  color:'#F5C842', icon:'🐦', pool:[
    {type:'bird',id:'sky',rarity:'common'},{type:'bird',id:'rose',rarity:'common'},
    {type:'bird',id:'jade',rarity:'uncommon'},{type:'bird',id:'coral',rarity:'uncommon'},
    {type:'bird',id:'amethyst',rarity:'rare'},{type:'bird',id:'gold',rarity:'rare'},
    {type:'bird',id:'shadow',rarity:'epic'},{type:'bird',id:'phoenix',rarity:'epic'},
    {type:'bird',id:'void_bird',rarity:'legendary'},
  ]},
  bird_premium:  { name:'Golden Egg Crate',price:50, color:'#fac775', icon:'🥚', pool:[
    {type:'bird',id:'amethyst',rarity:'rare'},{type:'bird',id:'gold',rarity:'rare'},
    {type:'bird',id:'shadow',rarity:'epic'},{type:'bird',id:'phoenix',rarity:'epic'},
    {type:'bird',id:'void_bird',rarity:'legendary'},{type:'bird',id:'void_bird',rarity:'mythical'},
  ]},
  // Pipe crates
  pipe_common:   { name:'Pipe Crate',     price:50,  color:'#5BC63C', icon:'🎋', pool:[
    {type:'pipe',id:'sky',rarity:'common'},{type:'pipe',id:'lava',rarity:'common'},
    {type:'pipe',id:'teal',rarity:'uncommon'},{type:'pipe',id:'amethyst',rarity:'uncommon'},
    {type:'pipe',id:'gold',rarity:'rare'},{type:'pipe',id:'rose',rarity:'rare'},
    {type:'pipe',id:'midnight',rarity:'epic'},{type:'pipe',id:'neon',rarity:'legendary'},
    {type:'pipe',id:'void_pipe',rarity:'mythical'},
  ]},
  pipe_premium:  { name:'Steel Pipe Crate',price:50, color:'#B0B0B0', icon:'⚙️', pool:[
    {type:'pipe',id:'gold',rarity:'rare'},{type:'pipe',id:'rose',rarity:'rare'},
    {type:'pipe',id:'midnight',rarity:'epic'},{type:'pipe',id:'neon',rarity:'legendary'},
    {type:'pipe',id:'void_pipe',rarity:'mythical'},
  ]},
  // Background crates
  bg_common:     { name:'Horizon Crate',  price:50,  color:'#5EC8F5', icon:'🌄', pool:[
    {type:'bg',id:'sunset',rarity:'common'},{type:'bg',id:'forest',rarity:'common'},
    {type:'bg',id:'ocean',rarity:'uncommon'},{type:'bg',id:'candy',rarity:'uncommon'},
    {type:'bg',id:'storm',rarity:'rare'},{type:'bg',id:'night',rarity:'rare'},
    {type:'bg',id:'aurora',rarity:'epic'},{type:'bg',id:'cosmic',rarity:'legendary'},
    {type:'bg',id:'void',rarity:'mythical'},
  ]},
  bg_premium:    { name:'Galaxy Crate',   price:50,  color:'#7f77dd', icon:'🌌', pool:[
    {type:'bg',id:'storm',rarity:'rare'},{type:'bg',id:'aurora',rarity:'epic'},
    {type:'bg',id:'cosmic',rarity:'legendary'},{type:'bg',id:'void',rarity:'mythical'},
  ]},
  // Trail crates
  trail_common:  { name:'Spark Crate',    price:50,  color:'#FF7A00', icon:'✨', pool:[
    {type:'trail',id:'fire',rarity:'common'},{type:'trail',id:'ice',rarity:'uncommon'},
    {type:'trail',id:'lightning',rarity:'rare'},{type:'trail',id:'rainbow',rarity:'rare'},
    {type:'trail',id:'galaxy',rarity:'epic'},{type:'trail',id:'void',rarity:'legendary'},
  ]},
  trail_premium: { name:'Mythic Spark',   price:50,  color:'#e24b4a', icon:'🌀', pool:[
    {type:'trail',id:'lightning',rarity:'rare'},{type:'trail',id:'rainbow',rarity:'epic'},
    {type:'trail',id:'galaxy',rarity:'legendary'},{type:'trail',id:'void',rarity:'mythical'},
  ]},
};

const RARITY_W = {common:40,uncommon:28,rare:18,epic:10,legendary:3.5,mythical:0.5};
function rollCase(caseId) {
  const c = CASES[caseId]; if (!c) return null;
  const pool = [];
  c.pool.forEach(item => { const w=Math.round((RARITY_W[item.rarity]||10)*10); for(let i=0;i<w;i++) pool.push(item); });
  return pool[Math.floor(Math.random()*pool.length)];
}

function todayKey() { const d=new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }
function dailySeed(challengeIdx=0) { const d=new Date(); return (d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate())*10+(challengeIdx%10); }
const DAILY_CHALLENGES = [
  {id:0,name:'Morning Flight',diff:'easy',  desc:'A gentle warm-up run',  icon:'☀️'},
  {id:1,name:'Noon Rush',     diff:'normal',desc:'The classic experience', icon:'🌤️'},
  {id:2,name:'Storm Run',     diff:'hard',  desc:'Only for the brave',    icon:'⚡'},
  {id:3,name:'Speed Demon',   diff:'hard',  desc:'Pipes fly fast today',  icon:'💨'},
  {id:4,name:'Easy Glide',    diff:'easy',  desc:'Relax and rack up coins',icon:'🌿'},
];
function xpForLevel(lvl) { return Math.min(lvl*100, 10000); }
function diffMult(diff) { return diff==='easy'?1:diff==='hard'?2:1.5; }

function getRankInfo(pts) {
  for (let i=RANKS.length-1;i>=0;i--) {
    if (pts>=RANKS[i].pts) {
      const r=RANKS[i],next=RANKS[i+1];
      const span=next?next.pts-r.pts:1,within=pts-r.pts;
      const ti=next?Math.min(Math.floor((within/span)*r.tiers),r.tiers-1):0;
      const pct=next?Math.min(100,Math.round((within/span)*100)):100;
      return {name:r.name+(r.tiers>1?' '+['I','II','III'][ti]:''),pct,pts};
    }
  }
  return {name:'Egg',pct:0,pts:0};
}

function newUser(username) {
  return {
    username,password:'',coins:0,rank_pts:0,best_score:0,games_played:0,xp:0,level:1,
    inventory:{birds:['hatchling'],pipes:['bamboo'],bgs:['sky'],trails:[],cases:[]},
    equipped:{bird:'hatchling',pipe:'bamboo',bg:'sky',trail:'none'},
    daily_done:'',created_at:Math.floor(Date.now()/1000),
  };
}

function migrateUser(u) {
  if (!u.inventory) u.inventory={birds:u.owned_birds||['hatchling'],pipes:u.owned_pipes||['bamboo'],bgs:u.owned_bgs||['sky'],trails:[],cases:[]};
  if (!u.equipped) u.equipped={bird:u.equipped_bird||'hatchling',pipe:u.equipped_pipe||'bamboo',bg:u.equipped_bg||'sky',trail:'none'};
  if (u.xp===undefined) u.xp=0;
  if (!u.level) u.level=1;
  if (!u.inventory.trails) u.inventory.trails=[];
  if (!u.inventory.cases) u.inventory.cases=[];
  if (!u.equipped.trail) u.equipped.trail='none';
}

function sanitizeUser(u) {
  const {password,...safe}=u;
  safe.rank=getRankInfo(u.rank_pts||0);
  return safe;
}

function authMiddleware(req,res,next) {
  const token=req.headers.authorization?.split(' ')[1];
  if(!token) return res.status(401).json({error:'No token'});
  try {req.user=jwt.verify(token,JWT_SECRET);next();}
  catch {res.status(401).json({error:'Invalid token'});}
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname,'../public')));

// Auth
app.post('/api/register', async (req,res) => {
  const {username,password}=req.body;
  if(!username||username.length<3) return res.status(400).json({error:'Username must be 3+ characters'});
  if(!password||password.length<12) return res.status(400).json({error:'Password must be 12+ characters'});
  const key=username.toLowerCase();
  if(db.users[key]) return res.status(400).json({error:'Username already taken'});
  const hash=await bcrypt.hash(password,10);
  const user=newUser(username); user.password=hash;
  db.users[key]=user; saveData(db);
  const token=jwt.sign({username},JWT_SECRET,{expiresIn:'90d'});
  res.json({token,user:sanitizeUser(user)});
});

app.post('/api/login', async (req,res) => {
  const {username,password}=req.body;
  const user=db.users[username?.toLowerCase()];
  if(!user) return res.status(400).json({error:'Incorrect username or password'});
  const match=await bcrypt.compare(password,user.password);
  if(!match) return res.status(400).json({error:'Incorrect username or password'});
  migrateUser(user);
  const token=jwt.sign({username:user.username},JWT_SECRET,{expiresIn:'90d'});
  res.json({token,user:sanitizeUser(user)});
});

app.get('/api/me', authMiddleware, (req,res) => {
  const user=db.users[req.user.username?.toLowerCase()];
  if(!user) return res.status(404).json({error:'Not found'});
  migrateUser(user);
  res.json({user:sanitizeUser(user)});
});

// Score (auto-saves, handles XP+levels)
app.post('/api/score', authMiddleware, (req,res) => {
  const {score,mode,diff}=req.body;
  const key=req.user.username.toLowerCase();
  const user=db.users[key];
  if(!user) return res.status(404).json({error:'Not found'});
  migrateUser(user);

  const mult=diffMult(diff);
  const finalScore=Math.round(score*mult);

  if(!db.history) db.history=[];
  db.history.push({username:user.username,score:finalScore,rawScore:score,mode:mode||'normal',diff:diff||'normal',created_at:Math.floor(Date.now()/1000)});
  if(db.history.length>8000) db.history=db.history.slice(-8000);

  user.coins=(user.coins||0)+score;
  user.xp=(user.xp||0)+(score*5);
  let levelsGained=0,levelCoins=0;
  while((user.level||1)<100 && user.xp>=xpForLevel(user.level||1)){
    user.xp-=xpForLevel(user.level||1);
    user.level=(user.level||1)+1;
    levelsGained++;
    levelCoins+=20+levelsGained*5;
  }
  if((user.level||1)>=100) user.xp=Math.min(user.xp,xpForLevel(100)-1);
  user.coins+=levelCoins;
  if(finalScore>(user.best_score||0)) user.best_score=finalScore;
  user.games_played=(user.games_played||0)+1;

  let rankPtsGained=0;
  if(mode==='ranked'){
    if(score>=50) rankPtsGained=30;
    else if(score>=25) rankPtsGained=15;
    else if(score>=10) rankPtsGained=5;
    else if(score>=5) rankPtsGained=2;
    user.rank_pts=(user.rank_pts||0)+rankPtsGained;
  }

  if(!db.scores) db.scores=[];
  if(mode!=='daily'){
    const ex=db.scores.find(s=>s.username===user.username);
    if(!ex) db.scores.push({username:user.username,score:finalScore,diff:diff||'normal'});
    else if(finalScore>ex.score){ex.score=finalScore;ex.diff=diff||'normal';}
  } else {
    const day=todayKey();
    if(!db.daily) db.daily={};
    if(!db.daily[day]) db.daily[day]=[];
    const ex=db.daily[day].find(s=>s.username===user.username);
    if(!ex) db.daily[day].push({username:user.username,score:finalScore});
    else if(finalScore>ex.score) ex.score=finalScore;
    user.daily_done=day;
  }

  saveData(db);
  res.json({user:sanitizeUser(user),rank_pts_gained:rankPtsGained,xp_gained:score*5,levels_gained:levelsGained,level_coins:levelCoins,final_score:finalScore});
});

// Leaderboards
app.get('/api/leaderboard',(req,res)=>{
  const s=(db.scores||[]).sort((a,b)=>b.score-a.score).slice(0,20).map((r,i)=>({...r,crown:i===0}));
  res.json(s);
});
app.get('/api/leaderboard/daily',(req,res)=>res.json((db.daily?.[todayKey()]||[]).sort((a,b)=>b.score-a.score).slice(0,20)));
app.get('/api/leaderboard/ranked',(req,res)=>{
  const rows=Object.values(db.users).sort((a,b)=>(b.rank_pts||0)-(a.rank_pts||0)).slice(0,20)
    .map((u,i)=>({username:u.username,rank_pts:u.rank_pts||0,best_score:u.best_score||0,rank:getRankInfo(u.rank_pts||0),crown:i===0,level:u.level||1,equipped:u.equipped||{}}));
  res.json(rows);
});
app.get('/api/history',authMiddleware,(req,res)=>{
  res.json((db.history||[]).filter(h=>h.username===req.user.username).slice(-20).reverse());
});

// Cases
app.get('/api/cases',(req,res)=>res.json(Object.entries(CASES).map(([id,c])=>({id,name:c.name,price:c.price,color:c.color}))));

app.post('/api/cases/buy',authMiddleware,(req,res)=>{
  const {caseId,qty=1}=req.body;
  const key=req.user.username.toLowerCase();
  const user=db.users[key];
  if(!user) return res.status(404).json({error:'Not found'});
  migrateUser(user);
  const c=CASES[caseId];
  if(!c) return res.status(400).json({error:'Invalid case'});
  const total=c.price*qty;
  if((user.coins||0)<total) return res.status(400).json({error:'Not enough coins'});
  user.coins-=total;
  for(let i=0;i<qty;i++) user.inventory.cases.push(caseId);
  saveData(db);
  res.json({user:sanitizeUser(user)});
});

app.post('/api/cases/open',authMiddleware,(req,res)=>{
  const {caseId}=req.body;
  const key=req.user.username.toLowerCase();
  const user=db.users[key];
  if(!user) return res.status(404).json({error:'Not found'});
  migrateUser(user);
  const idx=user.inventory.cases.indexOf(caseId);
  if(idx<0) return res.status(400).json({error:'Case not in inventory'});
  user.inventory.cases.splice(idx,1);
  const item=rollCase(caseId);
  if(!item) return res.status(500).json({error:'Roll failed'});
  const inv=item.type==='bird'?user.inventory.birds:item.type==='pipe'?user.inventory.pipes:item.type==='bg'?user.inventory.bgs:user.inventory.trails;
  const dup=inv.includes(item.id);
  if(!dup) inv.push(item.id);
  const dupCoins=dup?({common:5,uncommon:10,rare:20,epic:50,legendary:100,mythical:250}[item.rarity]||5):0;
  if(dup) user.coins+=dupCoins;
  saveData(db);
  res.json({item,duplicate:dup,dup_coins:dupCoins,user:sanitizeUser(user)});
});

// Equip
app.post('/api/equip',authMiddleware,(req,res)=>{
  const {type,itemId}=req.body;
  const key=req.user.username.toLowerCase();
  const user=db.users[key];
  if(!user) return res.status(404).json({error:'Not found'});
  migrateUser(user);
  if(itemId!=='none'){
    const inv=type==='bird'?user.inventory.birds:type==='pipe'?user.inventory.pipes:type==='bg'?user.inventory.bgs:user.inventory.trails;
    if(!inv.includes(itemId)) return res.status(400).json({error:'Not owned'});
  }
  user.equipped[type]=itemId;
  saveData(db);
  res.json({user:sanitizeUser(user)});
});

app.get('/api/daily',(req,res)=>res.json({
  challenges: DAILY_CHALLENGES.map(c=>({...c,seed:dailySeed(c.id),key:todayKey()})),
  key:todayKey()
}));
app.get('/api/chat',(req,res)=>res.json(db.chat?.slice(-50)||[]));

// Socket
const queue=[],matches={};
let matchCounter=0;

io.on('connection',(socket)=>{
  socket.on('chat_message',({token,text})=>{
    let username='Guest';
    try{const d=jwt.verify(token,JWT_SECRET);username=d.username;}catch{}
    if(!text||!text.trim()||text.length>200) return;
    const msg={username,text:text.trim().slice(0,200),ts:Date.now()};
    if(!db.chat) db.chat=[];
    db.chat.push(msg);
    if(db.chat.length>200) db.chat=db.chat.slice(-200);
    io.emit('chat_message',msg);
  });

  socket.on('join_ranked',({token,username,equippedSkin})=>{
    let ud={username:username||'Guest',rankPts:0,equippedSkin};
    try{
      const dec=jwt.verify(token,JWT_SECRET);
      const user=db.users[dec.username?.toLowerCase()];
      if(user){migrateUser(user);ud={username:user.username,rankPts:user.rank_pts||0,equippedSkin:user.equipped};}
    }catch{}
    const idx=queue.findIndex(p=>p.socketId===socket.id);
    if(idx>=0) queue.splice(idx,1);
    queue.push({socketId:socket.id,...ud});
    socket.emit('queue_joined',{position:queue.length});
    io.emit('queue_update',{count:queue.length});
    if(queue.length>=2){
      queue.sort((a,b)=>a.rankPts-b.rankPts);
      const [p1,p2]=queue.splice(0,2);
      io.emit('queue_update',{count:queue.length});
      const matchId=`m${++matchCounter}`,seed=Math.floor(Math.random()*999999);
      matches[matchId]={players:[p1,p2],scores:{},deaths:[],ready:new Set(),seed};
      [p1,p2].forEach(p=>{
        const s=io.sockets.sockets.get(p.socketId);
        if(s){
          s.join(matchId);s.data.matchId=matchId;
          const opp=p===p1?p2:p1;
          s.emit('match_found',{matchId,seed,opponent:opp.username,opponentRank:getRankInfo(opp.rankPts).name,opponentSkin:opp.equippedSkin});
        }
      });
    }
  });

  socket.on('match_ready',({matchId})=>{
    const m=matches[matchId];if(!m)return;
    m.ready.add(socket.id);
    if(m.ready.size===2) io.to(matchId).emit('match_start',{startAt:Date.now()+3000,seed:m.seed});
  });

  socket.on('pos_update',({matchId,y,angle})=>socket.to(matchId).emit('opponent_pos',{y,angle}));
  socket.on('score_update',({matchId,score})=>{const m=matches[matchId];if(m){m.scores[socket.id]=score;socket.to(matchId).emit('opponent_score',{score});}});

  socket.on('match_died',({matchId,finalScore})=>{
    const m=matches[matchId];if(!m)return;
    if(!m.deaths)m.deaths=[];
    m.deaths.push(socket.id);
    m.scores[socket.id]=finalScore||0;
    socket.to(matchId).emit('opponent_died',{score:finalScore});
    if(m.deaths.length===1){
      const [p1,p2]=m.players;
      const loser=socket.id===p1.socketId?p1:p2,winner=socket.id===p1.socketId?p2:p1;
      io.to(matchId).emit('match_over',{player1:{username:p1.username,score:m.scores[p1.socketId]||0},player2:{username:p2.username,score:m.scores[p2.socketId]||0},winner:winner.username,draw:false});
      const wk=winner.username.toLowerCase(),lk=loser.username.toLowerCase();
      if(db.users[wk]) db.users[wk].rank_pts=(db.users[wk].rank_pts||0)+20;
      if(db.users[lk]) db.users[lk].rank_pts=Math.max(0,(db.users[lk].rank_pts||0)-5);
      saveData(db);
      delete matches[matchId];
    }
  });

  socket.on('leave_queue',()=>{
    const idx=queue.findIndex(p=>p.socketId===socket.id);
    if(idx>=0)queue.splice(idx,1);
    io.emit('queue_update',{count:queue.length});
  });

  socket.on('disconnect',()=>{
    const idx=queue.findIndex(p=>p.socketId===socket.id);
    if(idx>=0)queue.splice(idx,1);
    io.emit('queue_update',{count:queue.length});
    const matchId=socket.data?.matchId;
    if(matchId&&matches[matchId]){io.to(matchId).emit('opponent_disconnected');delete matches[matchId];}
  });
});

server.listen(PORT,()=>console.log(`\n🐦 Flappy Master running at http://localhost:${PORT}\n`));
