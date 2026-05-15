const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const cors=require('cors');
const path=require('path');
const fs=require('fs');

const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:'*'}});

const JWT_SECRET=process.env.JWT_SECRET||'flappy-master-secret-change-in-prod';
const PORT=process.env.PORT||3000;
const DATA_FILE=path.join(__dirname,'data.json');

function loadData(){try{if(fs.existsSync(DATA_FILE))return JSON.parse(fs.readFileSync(DATA_FILE,'utf8'));}catch(e){}return{users:{},scores:{easy:[],normal:[],hard:[]},daily:{},history:[],chat:[],pendingTrades:{}};}
function saveData(d){fs.writeFileSync(DATA_FILE,JSON.stringify(d,null,2));}
let db=loadData();
// migrate old flat scores array
if(Array.isArray(db.scores)){const old=db.scores;db.scores={easy:[],normal:[],hard:[]};old.forEach(s=>{const d=s.diff||'normal';if(!db.scores[d])db.scores[d]=[];db.scores[d].push(s);});}
if(!db.scores.easy)db.scores.easy=[];if(!db.scores.normal)db.scores.normal=[];if(!db.scores.hard)db.scores.hard=[];
setInterval(()=>saveData(db),8000);

const RANKS=[
  {name:'Egg',tiers:1,pts:0},{name:'Hatchling',tiers:3,pts:50},{name:'Fledgling',tiers:3,pts:200},
  {name:'Flapper',tiers:3,pts:500},{name:'Tailwind',tiers:3,pts:1000},{name:'Skybreaker',tiers:3,pts:2000},
  {name:'Pipebuster',tiers:3,pts:4000},{name:'Flappy Master',tiers:1,pts:8000},
];

// Expanded cases with lots more items
const CASES={
  bird_common:{name:'Feather Crate',price:50,color:'#F5C842',icon:'🐦',pool:[
    {type:'bird',id:'sky',rarity:'common'},{type:'bird',id:'rose',rarity:'common'},
    {type:'bird',id:'jade',rarity:'common'},{type:'bird',id:'coral',rarity:'common'},
    {type:'bird',id:'lemon',rarity:'common'},{type:'bird',id:'mint',rarity:'common'},
    {type:'bird',id:'peach',rarity:'common'},{type:'bird',id:'slate',rarity:'uncommon'},
    {type:'bird',id:'amethyst',rarity:'uncommon'},{type:'bird',id:'ember',rarity:'uncommon'},
    {type:'bird',id:'teal_bird',rarity:'uncommon'},{type:'bird',id:'crimson',rarity:'rare'},
    {type:'bird',id:'gold',rarity:'rare'},{type:'bird',id:'midnight_bird',rarity:'rare'},
    {type:'bird',id:'shadow',rarity:'epic'},{type:'bird',id:'phoenix',rarity:'epic'},
    {type:'bird',id:'crystal',rarity:'epic'},{type:'bird',id:'void_bird',rarity:'legendary'},
  ]},
  bird_premium:{name:'Golden Egg Crate',price:100,color:'#fac775',icon:'🥚',pool:[
    {type:'bird',id:'crimson',rarity:'rare'},{type:'bird',id:'gold',rarity:'rare'},
    {type:'bird',id:'midnight_bird',rarity:'rare'},{type:'bird',id:'shadow',rarity:'epic'},
    {type:'bird',id:'phoenix',rarity:'epic'},{type:'bird',id:'crystal',rarity:'epic'},
    {type:'bird',id:'nebula',rarity:'legendary'},{type:'bird',id:'void_bird',rarity:'legendary'},
    {type:'bird',id:'celestial',rarity:'mythical'},
  ]},
  pipe_common:{name:'Pipe Crate',price:50,color:'#5BC63C',icon:'🎋',pool:[
    {type:'pipe',id:'sky',rarity:'common'},{type:'pipe',id:'lava',rarity:'common'},
    {type:'pipe',id:'brick',rarity:'common'},{type:'pipe',id:'wood',rarity:'common'},
    {type:'pipe',id:'teal',rarity:'uncommon'},{type:'pipe',id:'amethyst',rarity:'uncommon'},
    {type:'pipe',id:'copper',rarity:'uncommon'},{type:'pipe',id:'chrome',rarity:'uncommon'},
    {type:'pipe',id:'gold',rarity:'rare'},{type:'pipe',id:'rose',rarity:'rare'},
    {type:'pipe',id:'obsidian',rarity:'rare'},{type:'pipe',id:'midnight',rarity:'epic'},
    {type:'pipe',id:'plasma',rarity:'epic'},{type:'pipe',id:'neon',rarity:'legendary'},
    {type:'pipe',id:'void_pipe',rarity:'mythical'},
  ]},
  pipe_premium:{name:'Steel Pipe Crate',price:100,color:'#B0C4DE',icon:'⚙️',pool:[
    {type:'pipe',id:'obsidian',rarity:'rare'},{type:'pipe',id:'gold',rarity:'rare'},
    {type:'pipe',id:'plasma',rarity:'epic'},{type:'pipe',id:'midnight',rarity:'epic'},
    {type:'pipe',id:'neon',rarity:'legendary'},{type:'pipe',id:'prism',rarity:'legendary'},
    {type:'pipe',id:'void_pipe',rarity:'mythical'},
  ]},
  bg_common:{name:'Horizon Crate',price:50,color:'#5EC8F5',icon:'🌄',pool:[
    {type:'bg',id:'sunset',rarity:'common'},{type:'bg',id:'forest',rarity:'common'},
    {type:'bg',id:'desert',rarity:'common'},{type:'bg',id:'tundra',rarity:'common'},
    {type:'bg',id:'ocean',rarity:'uncommon'},{type:'bg',id:'candy',rarity:'uncommon'},
    {type:'bg',id:'volcano',rarity:'uncommon'},{type:'bg',id:'jungle',rarity:'uncommon'},
    {type:'bg',id:'storm',rarity:'rare'},{type:'bg',id:'night',rarity:'rare'},
    {type:'bg',id:'neon_city',rarity:'rare'},{type:'bg',id:'aurora',rarity:'epic'},
    {type:'bg',id:'undersea',rarity:'epic'},{type:'bg',id:'cosmic',rarity:'legendary'},
    {type:'bg',id:'void',rarity:'mythical'},
  ]},
  bg_premium:{name:'Galaxy Crate',price:100,color:'#7f77dd',icon:'🌌',pool:[
    {type:'bg',id:'neon_city',rarity:'rare'},{type:'bg',id:'aurora',rarity:'epic'},
    {type:'bg',id:'undersea',rarity:'epic'},{type:'bg',id:'crystal_cave',rarity:'epic'},
    {type:'bg',id:'cosmic',rarity:'legendary'},{type:'bg',id:'dimension',rarity:'legendary'},
    {type:'bg',id:'void',rarity:'mythical'},
  ]},
  trail_common:{name:'Spark Crate',price:50,color:'#FF7A00',icon:'✨',pool:[
    {type:'trail',id:'fire',rarity:'common'},{type:'trail',id:'smoke',rarity:'common'},
    {type:'trail',id:'bubbles',rarity:'common'},{type:'trail',id:'leaves',rarity:'common'},
    {type:'trail',id:'ice',rarity:'uncommon'},{type:'trail',id:'hearts',rarity:'uncommon'},
    {type:'trail',id:'stars',rarity:'uncommon'},{type:'trail',id:'lightning',rarity:'rare'},
    {type:'trail',id:'rainbow',rarity:'rare'},{type:'trail',id:'neon_trail',rarity:'rare'},
    {type:'trail',id:'galaxy',rarity:'epic'},{type:'trail',id:'sakura',rarity:'epic'},
    {type:'trail',id:'void',rarity:'legendary'},
  ]},
  trail_premium:{name:'Mythic Spark',price:100,color:'#e24b4a',icon:'🌀',pool:[
    {type:'trail',id:'neon_trail',rarity:'rare'},{type:'trail',id:'rainbow',rarity:'rare'},
    {type:'trail',id:'galaxy',rarity:'epic'},{type:'trail',id:'sakura',rarity:'epic'},
    {type:'trail',id:'plasma_trail',rarity:'legendary'},{type:'trail',id:'void',rarity:'legendary'},
    {type:'trail',id:'divine',rarity:'mythical'},
  ]},
};

const RARITY_W={common:40,uncommon:28,rare:18,epic:10,legendary:3.5,mythical:0.5};
function rollCase(caseId){
  const c=CASES[caseId];if(!c)return null;
  const pool=[];
  c.pool.forEach(item=>{const w=Math.round((RARITY_W[item.rarity]||10)*10);for(let i=0;i<w;i++)pool.push(item);});
  return pool[Math.floor(Math.random()*pool.length)];
}

function todayKey(){const d=new Date();return`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}
function dailySeed(idx=0){const d=new Date();return(d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate())*10+(idx%10);}
function xpForLevel(lvl){return Math.max(50,lvl*50);}  // much lower XP req
function diffMult(diff){return diff==='easy'?1:diff==='hard'?2:1.5;}

const DAILY_CHALLENGES=[
  {id:0,name:'Morning Flight',diff:'easy',desc:'A gentle warm-up run',icon:'☀️'},
  {id:1,name:'Noon Rush',diff:'normal',desc:'The classic experience',icon:'🌤️'},
  {id:2,name:'Storm Run',diff:'hard',desc:'Only for the brave',icon:'⚡'},
  {id:3,name:'Speed Demon',diff:'hard',desc:'Pipes fly fast today',icon:'💨'},
  {id:4,name:'Easy Glide',diff:'easy',desc:'Relax and rack up coins',icon:'🌿'},
];

function getRankInfo(pts){
  for(let i=RANKS.length-1;i>=0;i--){
    if(pts>=RANKS[i].pts){
      const r=RANKS[i],next=RANKS[i+1];
      const span=next?next.pts-r.pts:1,within=pts-r.pts;
      const ti=next?Math.min(Math.floor((within/span)*r.tiers),r.tiers-1):0;
      const pct=next?Math.min(100,Math.round((within/span)*100)):100;
      return{name:r.name+(r.tiers>1?' '+['I','II','III'][ti]:''),pct,pts};
    }
  }
  return{name:'Egg',pct:0,pts:0};
}

function newUser(username){
  return{
    username,password:'',coins:50,rank_pts:0,best_score:0,games_played:0,xp:0,level:1,
    inventory:{birds:['hatchling'],pipes:['bamboo'],bgs:['sky'],trails:[],cases:[]},
    equipped:{bird:'hatchling',pipe:'bamboo',bg:'sky',trail:'none'},
    daily_done:[],created_at:Math.floor(Date.now()/1000),
  };
}

function migrateUser(u){
  if(!u.inventory)u.inventory={birds:u.owned_birds||['hatchling'],pipes:u.owned_pipes||['bamboo'],bgs:u.owned_bgs||['sky'],trails:[],cases:[]};
  if(!u.equipped)u.equipped={bird:u.equipped_bird||'hatchling',pipe:u.equipped_pipe||'bamboo',bg:u.equipped_bg||'sky',trail:'none'};
  if(u.xp===undefined)u.xp=0;
  if(!u.level)u.level=1;
  if(!u.inventory.trails)u.inventory.trails=[];
  if(!u.inventory.cases)u.inventory.cases=[];
  if(!u.equipped.trail)u.equipped.trail='none';
  if(!Array.isArray(u.daily_done))u.daily_done=[];
  if(u.coins===undefined)u.coins=50;
}

function sanitizeUser(u){const{password,...safe}=u;safe.rank=getRankInfo(u.rank_pts||0);return safe;}

function authMiddleware(req,res,next){
  const token=req.headers.authorization?.split(' ')[1];
  if(!token)return res.status(401).json({error:'No token'});
  try{req.user=jwt.verify(token,JWT_SECRET);next();}
  catch{res.status(401).json({error:'Invalid token'});}
}

app.use(cors());app.use(express.json());
app.use(express.static(path.join(__dirname,'../public')));

// Auth
app.post('/api/register',async(req,res)=>{
  const{username,password}=req.body;
  if(!username||username.length<3)return res.status(400).json({error:'Username must be 3+ characters'});
  if(!password||password.length<12)return res.status(400).json({error:'Password must be 12+ characters'});
  const key=username.toLowerCase();
  if(db.users[key])return res.status(400).json({error:'Username already taken'});
  const hash=await bcrypt.hash(password,10);
  const user=newUser(username);user.password=hash;
  db.users[key]=user;saveData(db);
  const token=jwt.sign({username},JWT_SECRET,{expiresIn:'90d'});
  res.json({token,user:sanitizeUser(user)});
});

app.post('/api/login',async(req,res)=>{
  const{username,password}=req.body;
  const user=db.users[username?.toLowerCase()];
  if(!user)return res.status(400).json({error:'Incorrect username or password'});
  const match=await bcrypt.compare(password,user.password);
  if(!match)return res.status(400).json({error:'Incorrect username or password'});
  migrateUser(user);
  const token=jwt.sign({username:user.username},JWT_SECRET,{expiresIn:'90d'});
  res.json({token,user:sanitizeUser(user)});
});

app.get('/api/me',authMiddleware,(req,res)=>{
  const user=db.users[req.user.username?.toLowerCase()];
  if(!user)return res.status(404).json({error:'Not found'});
  migrateUser(user);
  res.json({user:sanitizeUser(user)});
});

// Score - per difficulty leaderboard
app.post('/api/score',authMiddleware,(req,res)=>{
  const{score,mode,diff,challengeId}=req.body;
  const key=req.user.username.toLowerCase();
  const user=db.users[key];
  if(!user)return res.status(404).json({error:'Not found'});
  migrateUser(user);

  const diffKey=diff||'normal';
  const mult=diffMult(diffKey);
  const finalScore=Math.round(score*mult);

  if(!db.history)db.history=[];
  db.history.push({username:user.username,score:finalScore,rawScore:score,mode:mode||'normal',diff:diffKey,created_at:Math.floor(Date.now()/1000)});
  if(db.history.length>8000)db.history=db.history.slice(-8000);

  user.coins=(user.coins||0)+score;
  // Lower XP: 2 per pipe
  const xpGained=score*2;
  user.xp=(user.xp||0)+xpGained;
  let levelsGained=0,levelCoins=0;
  while((user.level||1)<100&&user.xp>=xpForLevel(user.level||1)){
    user.xp-=xpForLevel(user.level||1);
    user.level=(user.level||1)+1;
    levelsGained++;levelCoins+=25+levelsGained*5;
  }
  if((user.level||1)>=100)user.xp=Math.min(user.xp,xpForLevel(100)-1);
  user.coins+=levelCoins;
  if(finalScore>(user.best_score||0))user.best_score=finalScore;
  user.games_played=(user.games_played||0)+1;

  let rankPtsGained=0;
  if(mode==='ranked'){
    if(score>=50)rankPtsGained=30;
    else if(score>=25)rankPtsGained=15;
    else if(score>=10)rankPtsGained=5;
    else if(score>=5)rankPtsGained=2;
    user.rank_pts=(user.rank_pts||0)+rankPtsGained;
  }

  if(mode==='daily'){
    const day=todayKey();
    if(!db.daily)db.daily={};
    if(!db.daily[day])db.daily[day]=[];
    const ex=db.daily[day].find(s=>s.username===user.username);
    if(!ex)db.daily[day].push({username:user.username,score:finalScore});
    else if(finalScore>ex.score)ex.score=finalScore;
    // Mark this challenge as done
    const doneKey=day+':'+challengeId;
    if(!Array.isArray(user.daily_done))user.daily_done=[];
    if(!user.daily_done.includes(doneKey))user.daily_done.push(doneKey);
    // Keep only last 30
    if(user.daily_done.length>30)user.daily_done=user.daily_done.slice(-30);
  } else {
    // Per-difficulty leaderboard
    if(!db.scores[diffKey])db.scores[diffKey]=[];
    const lb=db.scores[diffKey];
    const ex=lb.find(s=>s.username===user.username);
    if(!ex)lb.push({username:user.username,score:finalScore,diff:diffKey});
    else if(finalScore>ex.score)ex.score=finalScore;
  }

  saveData(db);
  res.json({user:sanitizeUser(user),rank_pts_gained:rankPtsGained,xp_gained:xpGained,levels_gained:levelsGained,level_coins:levelCoins,final_score:finalScore});
});

// Leaderboards - per difficulty
app.get('/api/leaderboard',(req,res)=>{
  const diff=req.query.diff||'normal';
  const lb=(db.scores[diff]||[]).sort((a,b)=>b.score-a.score).slice(0,20).map((r,i)=>({...r,crown:i===0}));
  res.json(lb);
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

// Cases - include icon in response
app.get('/api/cases',(req,res)=>res.json(Object.entries(CASES).map(([id,c])=>({id,name:c.name,price:c.price,color:c.color,icon:c.icon}))));

app.post('/api/cases/buy',authMiddleware,(req,res)=>{
  const{caseId,qty=1}=req.body;
  const key=req.user.username.toLowerCase();
  const user=db.users[key];
  if(!user)return res.status(404).json({error:'Not found'});
  migrateUser(user);
  const c=CASES[caseId];
  if(!c)return res.status(400).json({error:'Invalid case'});
  const total=c.price*qty;
  if((user.coins||0)<total)return res.status(400).json({error:'Not enough coins'});
  user.coins-=total;
  for(let i=0;i<qty;i++)user.inventory.cases.push(caseId);
  saveData(db);
  res.json({user:sanitizeUser(user)});
});

app.post('/api/cases/open',authMiddleware,(req,res)=>{
  const{caseId}=req.body;
  const key=req.user.username.toLowerCase();
  const user=db.users[key];
  if(!user)return res.status(404).json({error:'Not found'});
  migrateUser(user);
  const idx=user.inventory.cases.indexOf(caseId);
  if(idx<0)return res.status(400).json({error:'Case not in inventory'});
  user.inventory.cases.splice(idx,1);
  const item=rollCase(caseId);
  if(!item)return res.status(500).json({error:'Roll failed'});
  const inv=item.type==='bird'?user.inventory.birds:item.type==='pipe'?user.inventory.pipes:item.type==='bg'?user.inventory.bgs:user.inventory.trails;
  const dup=inv.includes(item.id);
  if(!dup)inv.push(item.id);
  const dupCoins=dup?({common:5,uncommon:10,rare:20,epic:50,legendary:100,mythical:250}[item.rarity]||5):0;
  if(dup)user.coins+=dupCoins;
  saveData(db);
  res.json({item,duplicate:dup,dup_coins:dupCoins,user:sanitizeUser(user)});
});

app.post('/api/equip',authMiddleware,(req,res)=>{
  const{type,itemId}=req.body;
  const key=req.user.username.toLowerCase();
  const user=db.users[key];
  if(!user)return res.status(404).json({error:'Not found'});
  migrateUser(user);
  if(itemId!=='none'){
    const inv=type==='bird'?user.inventory.birds:type==='pipe'?user.inventory.pipes:type==='bg'?user.inventory.bgs:user.inventory.trails;
    if(!inv.includes(itemId))return res.status(400).json({error:'Not owned'});
  }
  user.equipped[type]=itemId;
  saveData(db);
  res.json({user:sanitizeUser(user)});
});

app.get('/api/daily',(req,res)=>res.json({challenges:DAILY_CHALLENGES.map(c=>({...c,seed:dailySeed(c.id),key:todayKey()})),key:todayKey()}));
app.get('/api/chat',(req,res)=>res.json(db.chat?.slice(-50)||[]));

// Socket
const queue=[],matches={};let matchCounter=0;

io.on('connection',(socket)=>{
  socket.on('chat_message',({token,text})=>{
    let username='Guest';
    try{const d=jwt.verify(token,JWT_SECRET);username=d.username;}catch{}
    if(!text||!text.trim()||text.length>200)return;
    const msg={username,text:text.trim().slice(0,200),ts:Date.now()};
    if(!db.chat)db.chat=[];
    db.chat.push(msg);
    if(db.chat.length>200)db.chat=db.chat.slice(-200);
    io.emit('chat_message',msg);
  });

  socket.on('set_identity',({token})=>{
    try{
      const d=jwt.verify(token,JWT_SECRET);
      const uname=d.username?.toLowerCase();
      socket.data.username=uname;
      // Deliver any pending trades
      if(uname&&db.pendingTrades&&db.pendingTrades[uname]){
        const now=Date.now();
        const valid=db.pendingTrades[uname].filter(t=>now-t.ts<5*60*1000);
        valid.forEach(t=>socket.emit('trade_offer',t));
        delete db.pendingTrades[uname];
        if(valid.length>0)saveData(db);
      }
    }catch{}
  });

  socket.on('join_ranked',({token,username,equippedSkin})=>{
    let ud={username:username||'Guest',rankPts:0,equippedSkin};
    try{const dec=jwt.verify(token,JWT_SECRET);const user=db.users[dec.username?.toLowerCase()];if(user){migrateUser(user);ud={username:user.username,rankPts:user.rank_pts||0,equippedSkin:user.equipped};}}catch{}
    const idx=queue.findIndex(p=>p.socketId===socket.id);if(idx>=0)queue.splice(idx,1);
    queue.push({socketId:socket.id,...ud});
    socket.emit('queue_joined',{position:queue.length});
    io.emit('queue_update',{count:queue.length});
    if(queue.length>=2){
      queue.sort((a,b)=>a.rankPts-b.rankPts);
      const[p1,p2]=queue.splice(0,2);
      io.emit('queue_update',{count:queue.length});
      const matchId=`m${++matchCounter}`,seed=Math.floor(Math.random()*999999);
      matches[matchId]={players:[p1,p2],scores:{},deaths:[],ready:new Set(),seed};
      [p1,p2].forEach(p=>{
        const s=io.sockets.sockets.get(p.socketId);
        if(s){s.join(matchId);s.data.matchId=matchId;const opp=p===p1?p2:p1;s.emit('match_found',{matchId,seed,opponent:opp.username,opponentRank:getRankInfo(opp.rankPts).name,opponentSkin:opp.equippedSkin});}
      });
    }
  });

  socket.on('match_ready',({matchId})=>{const m=matches[matchId];if(!m)return;m.ready.add(socket.id);if(m.ready.size===2)io.to(matchId).emit('match_start',{startAt:Date.now()+3000,seed:m.seed});});
  socket.on('pos_update',({matchId,y,angle})=>socket.to(matchId).emit('opponent_pos',{y,angle}));
  socket.on('score_update',({matchId,score})=>{const m=matches[matchId];if(m){m.scores[socket.id]=score;socket.to(matchId).emit('opponent_score',{score});}});

  socket.on('match_died',({matchId,finalScore})=>{
    const m=matches[matchId];if(!m)return;
    if(!m.deaths)m.deaths=[];m.deaths.push(socket.id);m.scores[socket.id]=finalScore||0;
    socket.to(matchId).emit('opponent_died',{score:finalScore});
    if(m.deaths.length===1){
      const[p1,p2]=m.players;
      const loser=socket.id===p1.socketId?p1:p2,winner=socket.id===p1.socketId?p2:p1;
      io.to(matchId).emit('match_over',{player1:{username:p1.username,score:m.scores[p1.socketId]||0},player2:{username:p2.username,score:m.scores[p2.socketId]||0},winner:winner.username,draw:false});
      const wk=winner.username.toLowerCase(),lk=loser.username.toLowerCase();
      if(db.users[wk])db.users[wk].rank_pts=(db.users[wk].rank_pts||0)+20;
      if(db.users[lk])db.users[lk].rank_pts=Math.max(0,(db.users[lk].rank_pts||0)-5);
      saveData(db);delete matches[matchId];
    }
  });

  socket.on('leave_queue',()=>{const idx=queue.findIndex(p=>p.socketId===socket.id);if(idx>=0)queue.splice(idx,1);io.emit('queue_update',{count:queue.length});});
  // ── Trade ──
  socket.on('trade_offer',({token,from,to,offerType,offerId,wantType,wantId})=>{
    try{jwt.verify(token,JWT_SECRET);}catch{return;}
    const toKey=to.toLowerCase();
    const trade={from,to:toKey,offerType,offerId,wantType,wantId,ts:Date.now()};
    // Try live socket first
    const target=[...io.sockets.sockets.values()].find(s=>s.data?.username===toKey);
    if(target){
      target.data.tradeOffer=trade;
      target.emit('trade_offer',trade);
    } else {
      // Queue for when they come online
      if(!db.pendingTrades)db.pendingTrades={};
      if(!db.pendingTrades[toKey])db.pendingTrades[toKey]=[];
      db.pendingTrades[toKey].push(trade);
      // Keep only last 5 pending trades per user
      if(db.pendingTrades[toKey].length>5)db.pendingTrades[toKey]=db.pendingTrades[toKey].slice(-5);
      saveData(db);
      socket.emit('chat_message',{username:'System',text:'📦 Trade offer queued — '+to+' will see it when they log in.',ts:Date.now()});
    }
  });

  socket.on('trade_respond',({token,accept,trade})=>{
    try{const dec=jwt.verify(token,JWT_SECRET);socket.data.username=dec.username?.toLowerCase();}catch{return;}
    if(!accept){
      // Notify sender
      const sender=[...io.sockets.sockets.values()].find(s=>s.data?.username===trade.from?.toLowerCase());
      if(sender)sender.emit('trade_declined');
      return;
    }
    // Execute trade
    const uKey=socket.data.username;
    const theirKey=trade.from?.toLowerCase();
    const uUser=db.users[uKey];const theirUser=db.users[theirKey];
    if(!uUser||!theirUser){socket.emit('trade_declined');return;}
    migrateUser(uUser);migrateUser(theirUser);
    // Check they own offered item
    const theirInv=trade.offerType==='bird'?theirUser.inventory.birds:trade.offerType==='pipe'?theirUser.inventory.pipes:trade.offerType==='bg'?theirUser.inventory.bgs:theirUser.inventory.trails;
    const myInv=trade.wantType==='bird'?uUser.inventory.birds:trade.wantType==='pipe'?uUser.inventory.pipes:trade.wantType==='bg'?uUser.inventory.bgs:uUser.inventory.trails;
    if(!theirInv.includes(trade.offerId)||!myInv.includes(trade.wantId)){socket.emit('trade_declined');return;}
    // Swap
    theirInv.splice(theirInv.indexOf(trade.offerId),1);
    const myInvR=trade.offerType==='bird'?uUser.inventory.birds:trade.offerType==='pipe'?uUser.inventory.pipes:trade.offerType==='bg'?uUser.inventory.bgs:uUser.inventory.trails;
    if(!myInvR.includes(trade.offerId))myInvR.push(trade.offerId);
    myInv.splice(myInv.indexOf(trade.wantId),1);
    const theirInvR=trade.wantType==='bird'?theirUser.inventory.birds:trade.wantType==='pipe'?theirUser.inventory.pipes:trade.wantType==='bg'?theirUser.inventory.bgs:theirUser.inventory.trails;
    if(!theirInvR.includes(trade.wantId))theirInvR.push(trade.wantId);
    saveData(db);
    socket.emit('trade_accepted',{user:sanitizeUser(uUser)});
    const senderSocket=[...io.sockets.sockets.values()].find(s=>s.data?.username===theirKey);
    if(senderSocket)senderSocket.emit('trade_accepted',{user:sanitizeUser(theirUser)});
  });

  socket.on('disconnect',()=>{
    const idx=queue.findIndex(p=>p.socketId===socket.id);if(idx>=0)queue.splice(idx,1);
    io.emit('queue_update',{count:queue.length});
    const matchId=socket.data?.matchId;
    if(matchId&&matches[matchId]){io.to(matchId).emit('opponent_disconnected');delete matches[matchId];}
  });
});

setInterval(()=>{
  if(!db.pendingTrades)return;
  const now=Date.now();
  Object.keys(db.pendingTrades).forEach(k=>{
    db.pendingTrades[k]=db.pendingTrades[k].filter(t=>now-t.ts<5*60*1000);
    if(!db.pendingTrades[k].length)delete db.pendingTrades[k];
  });
},10*60*1000);

server.listen(PORT,()=>console.log(`\n🐦 Flappy Master running at http://localhost:${PORT}\n`));
