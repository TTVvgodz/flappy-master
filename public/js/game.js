// ── Canvas ────────────────────────────────────────────────────────────────────
const canvas=document.getElementById('c');
const ctx=canvas.getContext('2d');
let W,H;
function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;}
resize();window.addEventListener('resize',resize);

// ── Constants ─────────────────────────────────────────────────────────────────
const API='';
const GROUND_H=70,PIPE_W=58,BIRD_R=17;
const GRAVITY=0.38,JUMP=-8.2;
function BIRD_X(){return Math.floor(W*0.2);}

const DIFFS={
  easy:  {speed:2.4,gap:230,freq:140,mult:1,  label:'easy',  desc:'wide gaps, slow pipes · ×1 score'},
  normal:{speed:3.2,gap:185,freq:112,mult:1.5, label:'normal',desc:'balanced · ×1.5 score'},
  hard:  {speed:4.4,gap:148,freq:88, mult:2,   label:'hard',  desc:'fast pipes, tight gaps · ×2 score'},
};

const RANKS=[
  {name:'Egg',tiers:1,pts:0,color:'#888',bg:'rgba(136,136,136,.2)'},
  {name:'Hatchling',tiers:3,pts:50,color:'#cd7f32',bg:'rgba(205,127,50,.2)'},
  {name:'Fledgling',tiers:3,pts:200,color:'#aaa',bg:'rgba(170,170,170,.2)'},
  {name:'Flapper',tiers:3,pts:500,color:'#fac775',bg:'rgba(250,199,117,.2)'},
  {name:'Tailwind',tiers:3,pts:1000,color:'#5ec8f5',bg:'rgba(94,200,245,.2)'},
  {name:'Skybreaker',tiers:3,pts:2000,color:'#7f77dd',bg:'rgba(127,119,221,.2)'},
  {name:'Pipebuster',tiers:3,pts:4000,color:'#5dcaa5',bg:'rgba(93,202,165,.2)'},
  {name:'Flappy Master',tiers:1,pts:8000,color:'#e24b4a',bg:'rgba(226,75,74,.2)'},
];
// Rank skins unlock automatically when you reach that rank
function getRankSkinId(rankName){
  const map={'Egg':'rank_egg','Hatchling':'rank_hatchling','Fledgling':'rank_fledgling',
    'Flapper':'rank_flapper','Tailwind':'rank_tailwind','Skybreaker':'rank_skybreaker',
    'Pipebuster':'rank_pipebuster','Flappy Master':'rank_master'};
  return map[rankName]||null;
}
function getUnlockedRankSkins(rankPts){
  const unlocked=[];
  RANKS.forEach(r=>{if(rankPts>=r.pts){const sid=getRankSkinId(r.name.split(' ')[0]==='Flappy'?'Flappy Master':r.name.split(' I')[0].split(' II')[0].split(' III')[0]);if(sid)unlocked.push(sid);}});
  return unlocked;
}

function getRankInfo(pts){
  for(let i=RANKS.length-1;i>=0;i--){if(pts>=RANKS[i].pts){const r=RANKS[i],next=RANKS[i+1];const span=next?next.pts-r.pts:1,within=pts-r.pts;const ti=next?Math.min(Math.floor((within/span)*r.tiers),r.tiers-1):0;const pct=next?Math.min(100,Math.round((within/span)*100)):100;return{label:r.name+(r.tiers>1?' '+['I','II','III'][ti]:''),color:r.color,bg:r.bg,pct,pts};}}
  return{label:'Egg',color:'#888',bg:'rgba(136,136,136,.2)',pct:0,pts:0};
}

// Extended skins
const BIRD_SKINS=[
  {id:'hatchling',name:'Hatchling',colors:['#F5C842','#F0A800','#FF7A00']},
  {id:'sky',name:'Sky',colors:['#85B7EB','#378ADD','#185FA5']},
  {id:'rose',name:'Rose',colors:['#ED93B1','#D4537E','#993556']},
  {id:'jade',name:'Jade',colors:['#5DCAA5','#1D9E75','#0F6E56']},
  {id:'coral',name:'Coral',colors:['#F0997B','#D85A30','#993C1D']},
  {id:'lemon',name:'Lemon',colors:['#FFF176','#F9C22E','#F57F17']},
  {id:'mint',name:'Mint',colors:['#A5D6A7','#66BB6A','#2E7D32']},
  {id:'peach',name:'Peach',colors:['#FFCCBC','#FF8A65','#BF360C']},
  {id:'slate',name:'Slate',colors:['#90A4AE','#546E7A','#263238']},
  {id:'amethyst',name:'Amethyst',colors:['#AFA9EC','#7F77DD','#534AB7']},
  {id:'ember',name:'Ember',colors:['#FF8F00','#E65100','#BF360C']},
  {id:'teal_bird',name:'Teal',colors:['#4DD0E1','#00ACC1','#006064']},
  {id:'crimson',name:'Crimson',colors:['#EF9A9A','#E53935','#B71C1C']},
  {id:'gold',name:'Gold',colors:['#FAC775','#BA7517','#854F0B']},
  {id:'midnight_bird',name:'Midnight',colors:['#7986CB','#3949AB','#1A237E']},
  {id:'shadow',name:'Shadow',colors:['#B4B2A9','#5F5E5A','#2C2C2A']},
  {id:'phoenix',name:'Phoenix',colors:['#F09595','#E24B4A','#fac775']},
  {id:'crystal',name:'Crystal',colors:['#E0F7FA','#80DEEA','#00BCD4']},
  {id:'nebula',name:'Nebula',colors:['#CE93D8','#AB47BC','#6A1B9A']},
  {id:'void_bird',name:'Void',colors:['#3a1a5e','#7f77dd','#e24b4a']},
  {id:'celestial',name:'Celestial',colors:['#FFFDE7','#FFD54F','#5ec8f5']},
  // ── Rank skins (unlocked by reaching rank) ──
  {id:'rank_egg',       name:'Cracked Egg',    colors:['#F5E6C8','#D4A853','#8B6914'], rankRequired:'Egg'},
  {id:'rank_hatchling', name:'Chick',          colors:['#FFD54F','#FF8F00','#E65100'], rankRequired:'Hatchling'},
  {id:'rank_fledgling', name:'Fledgling',      colors:['#CFD8DC','#78909C','#263238'], rankRequired:'Fledgling'},
  {id:'rank_flapper',   name:'Golden Flapper', colors:['#FFE082','#FFB300','#FF6F00'], rankRequired:'Flapper'},
  {id:'rank_tailwind',  name:'Tailwind',       colors:['#80D8FF','#0288D1','#01579B'], rankRequired:'Tailwind'},
  {id:'rank_skybreaker',name:'Skybreaker',     colors:['#CE93D8','#7B1FA2','#4A148C'], rankRequired:'Skybreaker'},
  {id:'rank_pipebuster',name:'Pipebuster',     colors:['#A5D6A7','#2E7D32','#1B5E20'], rankRequired:'Pipebuster'},
  {id:'rank_master',    name:'Flappy Master',  colors:['#EF9A9A','#B71C1C','#FFD700'], rankRequired:'Flappy Master'},
];
const PIPE_SKINS=[
  {id:'bamboo',name:'Bamboo',light:'#5BC63C',dark:'#4DB533'},
  {id:'sky',name:'Sky',light:'#378ADD',dark:'#185FA5'},
  {id:'lava',name:'Lava',light:'#E24B4A',dark:'#A32D2D'},
  {id:'brick',name:'Brick',light:'#EF9A9A',dark:'#C62828'},
  {id:'wood',name:'Wood',light:'#BCAAA4',dark:'#6D4C41'},
  {id:'teal',name:'Teal',light:'#1D9E75',dark:'#0F6E56'},
  {id:'amethyst',name:'Amethyst',light:'#7F77DD',dark:'#534AB7'},
  {id:'copper',name:'Copper',light:'#FF9800',dark:'#E65100'},
  {id:'chrome',name:'Chrome',light:'#CFD8DC',dark:'#607D8B'},
  {id:'gold',name:'Gold',light:'#EF9F27',dark:'#BA7517'},
  {id:'rose',name:'Rose',light:'#D4537E',dark:'#993556'},
  {id:'obsidian',name:'Obsidian',light:'#455A64','dark':'#263238'},
  {id:'midnight',name:'Midnight',light:'#5F5E5A',dark:'#2C2C2A'},
  {id:'plasma',name:'Plasma',light:'#CE93D8',dark:'#6A1B9A'},
  {id:'neon',name:'Neon',light:'#5DCAA5',dark:'#E24B4A'},
  {id:'prism',name:'Prism',light:'#80DEEA',dark:'#00ACC1'},
  {id:'void_pipe',name:'Void',light:'#3a1a5e',dark:'#7f77dd'},
];
const BG_SKINS=[
  {id:'sky',name:'Day',draw:(t)=>{drawGradSky('#87CEEB','#E0F4FF',t);drawClouds(t,'rgba(255,255,255,.7)');}},
  {id:'sunset',name:'Sunset',draw:(t)=>{drawGradSky('#FF6B35','#FFD166',t);drawClouds(t,'rgba(255,200,150,.6)');}},
  {id:'night',name:'Night',draw:(t)=>{drawGradSky('#0d1b2a','#1b2838',t);drawStars(t);drawMoon(t);drawClouds(t,'rgba(50,60,100,.5)');}},
  {id:'forest',name:'Forest',draw:(t)=>{drawGradSky('#2d6a4f','#52b788',t);drawClouds(t,'rgba(180,240,160,.4)');drawTrees();}},
  {id:'ocean',name:'Ocean',draw:(t)=>{drawGradSky('#0077b6','#48cae4',t);drawClouds(t,'rgba(160,220,255,.5)');drawWaves(t);}},
  {id:'desert',name:'Desert',draw:(t)=>{drawGradSky('#F4A261','#E9C46A',t);drawClouds(t,'rgba(255,230,180,.4)');drawDunes();}},
  {id:'tundra',name:'Tundra',draw:(t)=>{drawGradSky('#caf0f8','#90e0ef',t);drawClouds(t,'rgba(255,255,255,.8)');drawSnow(t);}},
  {id:'candy',name:'Candy',draw:(t)=>{drawGradSky('#FF85A1','#FFC8DD',t);drawClouds(t,'rgba(255,230,245,.7)');drawCandyClouds(t);}},
  {id:'volcano',name:'Volcano',draw:(t)=>{drawGradSky('#3d0000','#7a1a00',t);drawEmbers(t);drawLavaRiver(t);}},
  {id:'jungle',name:'Jungle',draw:(t)=>{drawGradSky('#1b4332','#40916c',t);drawClouds(t,'rgba(100,200,100,.3)');drawVines();}},
  {id:'storm',name:'Storm',draw:(t)=>{drawGradSky('#212121','#37474F',t);drawStormClouds(t);drawLightningBg(t);drawRain(t);}},
  {id:'neon_city',name:'Neon City',draw:(t)=>{drawGradSky('#0a0015','#1a0030',t);drawCityscape(t);}},
  {id:'aurora',name:'Aurora',draw:(t)=>{drawGradSky('#022c22','#064e3b',t);drawStars(t);drawAurora(t);}},
  {id:'undersea',name:'Undersea',draw:(t)=>{drawGradSky('#023e8a','#0077b6',t);drawBubbles(t);drawFish(t);}},
  {id:'crystal_cave',name:'Crystal Cave',draw:(t)=>{drawGradSky('#1a0050','#3d0066',t);drawCrystals(t);}},
  {id:'cosmic',name:'Cosmic',draw:(t)=>{drawGradSky('#05001a','#120030',t);drawStars(t);drawNebulaBg(t);drawUFOs(t);}},
  {id:'dimension',name:'Dimension',draw:(t)=>{drawGradSky('#001a33','#003366',t);drawPortals(t);}},
  {id:'void',name:'Void',draw:(t)=>{drawGradSky('#000000','#0a0010',t);drawVoidBg(t);drawVoidPortals(t);}},
];
const TRAIL_DEFS={
  none:{name:'None'},
  fire:{name:'Fire',colors:['#FF7A00','#E24B4A','#fac775'],glow:'#FF7A00'},
  smoke:{name:'Smoke',colors:['#888','#aaa','#ccc'],glow:null},
  bubbles:{name:'Bubbles',colors:['#85B7EB','#5ec8f5','#fff'],bubble:true},
  leaves:{name:'Leaves',colors:['#5BC63C','#2E7D32','#fac775'],leaf:true},
  ice:{name:'Ice',colors:['#80DEEA','#5ec8f5','#fff'],glow:'#5ec8f5'},
  hearts:{name:'Hearts',colors:['#ED93B1','#D4537E','#fff'],heart:true},
  stars:{name:'Stars',colors:['#fac775','#fff','#FFD54F'],star:true},
  lightning:{name:'Lightning',colors:['#fac775','#fff','#FFD54F'],glow:'#fff',spark:true},
  rainbow:{name:'Rainbow',rainbow:true},
  neon_trail:{name:'Neon',colors:['#5DCAA5','#E24B4A','#5ec8f5'],glow:'#5DCAA5'},
  galaxy:{name:'Galaxy',colors:['#7f77dd','#e24b4a','#5ec8f5'],glow:'#7f77dd',stars:true},
  sakura:{name:'Sakura',colors:['#ED93B1','#fff','#D4537E'],petal:true},
  plasma_trail:{name:'Plasma',colors:['#CE93D8','#AB47BC','#7f77dd'],glow:'#CE93D8'},
  void:{name:'Void',colors:['#3a1a5e','#7f77dd','#000'],glow:'#7f77dd'},
  divine:{name:'Divine',colors:['#FFD54F','#fff','#fac775'],glow:'#fff',divine:true},
};
const RARITY_COLORS={common:'#aaa',uncommon:'#5dcaa5',rare:'#5ec8f5',epic:'#afa9ec',legendary:'#fac775',mythical:'#e24b4a'};
const RARITY_LABELS={common:'Common',uncommon:'Uncommon',rare:'Rare',epic:'Epic',legendary:'Legendary',mythical:'Mythical'};
const CRATE_CATEGORIES=[
  {key:'bird', label:'🐦 Bird Crates',       ids:['bird_common','bird_premium']},
  {key:'pipe', label:'🎋 Pipe Crates',       ids:['pipe_common','pipe_premium']},
  {key:'bg',   label:'🌄 Background Crates', ids:['bg_common','bg_premium']},
  {key:'trail',label:'✨ Trail Crates',       ids:['trail_common','trail_premium']},
];
const PREMIUM_CRATES=['bird_premium','pipe_premium','bg_premium','trail_premium'];
const POOL_RARITY_MAP={
  bird_common:['Common','Uncommon','Rare','Epic'],
  bird_premium:['Rare','Epic','Legendary','Mythical'],
  pipe_common:['Common','Uncommon','Rare','Epic','Legendary'],
  pipe_premium:['Rare','Epic','Legendary','Mythical'],
  bg_common:['Common','Uncommon','Rare','Epic','Legendary'],
  bg_premium:['Epic','Legendary','Mythical'],
  trail_common:['Common','Uncommon','Rare','Epic'],
  trail_premium:['Rare','Epic','Legendary','Mythical'],
};
const RC_MAP={Common:'#aaa',Uncommon:'#5dcaa5',Rare:'#5ec8f5',Epic:'#afa9ec',Legendary:'#fac775',Mythical:'#e24b4a'};

// ── Background draw helpers ───────────────────────────────────────────────────
function drawGradSky(top,bot,t){
  const g=ctx.createLinearGradient(0,0,0,H-GROUND_H);
  g.addColorStop(0,top);g.addColorStop(1,bot);
  ctx.fillStyle=g;
  ctx.fillRect(0,0,W,H-GROUND_H); // only sky area, not ground
}
function drawClouds(t,col){
  ctx.fillStyle=col;
  [[W*.12+Math.sin(t*.009)*18,H*.1],[W*.5,H*.07+Math.sin(t*.007)*7],[W*.82,H*.12]].forEach(([cx,cy])=>{
    const sc=W/500;
    ctx.beginPath();ctx.ellipse(cx,cy,60*sc,23*sc,0,0,Math.PI*2);ctx.ellipse(cx+30*sc,cy+6*sc,42*sc,19*sc,0,0,Math.PI*2);ctx.ellipse(cx-24*sc,cy+7*sc,32*sc,17*sc,0,0,Math.PI*2);ctx.fill();
  });
}
function drawStars(t){
  if(!window._stars){window._stars=Array.from({length:80},()=>({x:Math.random(),y:Math.random()*.85,r:Math.random()*2+.5,phase:Math.random()*Math.PI*2}));}
  window._stars.forEach(s=>{
    ctx.save();ctx.globalAlpha=.5+.5*Math.sin(t*.05+s.phase);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x*W,s.y*(H-GROUND_H),s.r,0,Math.PI*2);ctx.fill();ctx.restore();
  });
}
function drawTrees(){
  for(let x=0;x<W;x+=80){ctx.fillStyle='#1b4332';ctx.beginPath();ctx.moveTo(x,H-GROUND_H);ctx.lineTo(x+20,H-GROUND_H-60);ctx.lineTo(x+40,H-GROUND_H);ctx.fill();}
}
function drawWaves(t){
  ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=2;
  for(let i=0;i<3;i++){ctx.beginPath();for(let x=0;x<=W;x+=10){ctx.lineTo(x,H-GROUND_H-20-i*12+Math.sin((x/40+t*.04+i))*8);}ctx.stroke();}
}
function drawDunes(){
  ctx.fillStyle='#d4a253';
  ctx.beginPath();ctx.moveTo(0,H-GROUND_H);
  for(let x=0;x<=W;x+=10)ctx.lineTo(x,H-GROUND_H-30*Math.sin(x/W*Math.PI*2));
  ctx.lineTo(W,H-GROUND_H);ctx.closePath();ctx.fill();
}
function drawSnow(t){
  if(!window._snow){window._snow=Array.from({length:40},()=>({x:Math.random(),y:Math.random(),vy:.002+Math.random()*.003}));}
  window._snow.forEach(s=>{s.y=(s.y+s.vy)%1;ctx.save();ctx.globalAlpha=.7;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x*W,s.y*(H-GROUND_H),2,0,Math.PI*2);ctx.fill();ctx.restore();});
}
function drawCandyClouds(t){
  ['#FF85A1','#FFB3C1','#BDE0FE'].forEach((c,i)=>{
    ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(W*(.2+i*.3)+Math.sin(t*.01+i)*15,H*.2+i*15,45,22,0,0,Math.PI*2);ctx.fill();
  });
}
function drawEmbers(t){
  if(!window._embers){window._embers=Array.from({length:30},()=>({x:Math.random(),y:Math.random(),vy:.003+Math.random()*.004,phase:Math.random()*Math.PI*2}));}
  window._embers.forEach(e=>{
    e.y-=e.vy;if(e.y<0){e.y=1;e.x=Math.random();}
    ctx.save();ctx.globalAlpha=.7;ctx.fillStyle='#FF6D00';ctx.beginPath();ctx.arc(e.x*W,e.y*(H-GROUND_H),2,0,Math.PI*2);ctx.fill();ctx.restore();
  });
}
function drawVines(){
  ctx.strokeStyle='#40916c';ctx.lineWidth=3;
  for(let x=0;x<W;x+=120){ctx.beginPath();ctx.moveTo(x,0);for(let y=0;y<H-GROUND_H;y+=20)ctx.lineTo(x+Math.sin(y*.1)*20,y);ctx.stroke();}
}
function drawLightningBg(t){
  const fi=Math.floor(t*.04);
  if(fi%25<3){
    ctx.save();ctx.strokeStyle='rgba(255,255,160,.9)';ctx.lineWidth=2.5;ctx.shadowColor='#fff';ctx.shadowBlur=8;
    const lx=W*(.2+.6*((fi*7)%13/13));
    ctx.beginPath();ctx.moveTo(lx,0);
    let cy=0,cx=lx;
    while(cy<H*.7){cy+=20+Math.random()*20;cx+=Math.random()*40-20;ctx.lineTo(cx,cy);}
    ctx.stroke();ctx.restore();
  }
}
function drawCityscape(t){
  const buildings=[{w:60,h:120},{w:40,h:200},{w:80,h:150},{w:50,h:180},{w:70,h:100}];
  let bx=0;
  buildings.forEach((b,i)=>{
    const col=['#e24b4a','#5ec8f5','#fac775','#7f77dd','#5dcaa5'][i];
    ctx.fillStyle='rgba(10,0,20,.8)';ctx.fillRect(bx,H-GROUND_H-b.h,b.w,b.h);
    // neon windows
    for(let wy=10;wy<b.h;wy+=20){for(let wx=8;wx<b.w-8;wx+=16){if(Math.random()>.4){ctx.fillStyle=col;ctx.globalAlpha=.6+.4*Math.sin(t*.1+wx+wy);ctx.fillRect(bx+wx,H-GROUND_H-b.h+wy,8,10);}}}
    ctx.globalAlpha=1;bx+=b.w+(bx+b.w<W?0:0);
    if(bx>W)bx-=W;
  });
  // scroll
  ctx.fillStyle='rgba(10,0,20,.3)';
}
function drawAurora(t){
  for(let i=0;i<3;i++){
    const y=H*.2+i*H*.1;const cols=['rgba(0,200,100,.15)','rgba(0,100,200,.12)','rgba(200,0,200,.1)'];
    ctx.save();ctx.fillStyle=cols[i];ctx.beginPath();
    ctx.moveTo(0,y);
    for(let x=0;x<=W;x+=10)ctx.lineTo(x,y+Math.sin(x/W*Math.PI*4+t*.03+i)*40);
    ctx.lineTo(W,y+100);ctx.lineTo(0,y+100);ctx.closePath();ctx.fill();ctx.restore();
  }
}
function drawBubbles(t){
  if(!window._bubbles){window._bubbles=Array.from({length:20},()=>({x:Math.random(),y:Math.random(),r:5+Math.random()*15,vy:.001+Math.random()*.002}));}
  window._bubbles.forEach(b=>{b.y-=b.vy;if(b.y<-0.1){b.y=1;b.x=Math.random();}ctx.save();ctx.strokeStyle='rgba(130,220,255,.4)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(b.x*W,b.y*(H-GROUND_H),b.r,0,Math.PI*2);ctx.stroke();ctx.restore();});
}
function drawFish(t){
  [[W*.3,H*.4],[W*.7,H*.6],[W*.5,H*.3]].forEach(([fx,fy],i)=>{
    const x=fx+Math.sin(t*.02+i)*80;const y=fy+Math.cos(t*.015+i)*30;
    ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(255,200,100,.5)';ctx.beginPath();ctx.ellipse(0,0,12,6,0,0,Math.PI*2);ctx.fill();ctx.restore();
  });
}
function drawCrystals(t){
  [[W*.1,H*.4],[W*.3,H*.3],[W*.6,H*.5],[W*.85,H*.35]].forEach(([cx,cy],i)=>{
    const cols=['#CE93D8','#80DEEA','#7f77dd','#5ec8f5'];
    ctx.save();ctx.fillStyle=cols[i%cols.length];ctx.globalAlpha=.6;ctx.beginPath();ctx.moveTo(cx,cy-40);ctx.lineTo(cx+15,cy);ctx.lineTo(cx,cy+20);ctx.lineTo(cx-15,cy);ctx.closePath();ctx.fill();ctx.restore();
  });
}
function drawNebulaBg(t){
  [{x:.2,y:.3,c:'rgba(100,0,200,.08)'},{x:.7,y:.5,c:'rgba(200,0,100,.06)'},{x:.5,y:.2,c:'rgba(0,100,200,.07)'}].forEach(n=>{
    const g=ctx.createRadialGradient(n.x*W,n.y*(H-GROUND_H),0,n.x*W,n.y*(H-GROUND_H),W*.25);
    g.addColorStop(0,n.c);g.addColorStop(1,'transparent');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H-GROUND_H);
  });
}
function drawPortals(t){
  [[W*.25,H*.35],[W*.75,H*.45]].forEach(([px,py],i)=>{
    const r=30+Math.sin(t*.03+i)*5;
    const g=ctx.createRadialGradient(px,py,0,px,py,r);
    g.addColorStop(0,'rgba(94,200,245,.8)');g.addColorStop(.6,'rgba(127,119,221,.4)');g.addColorStop(1,'transparent');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(px,py,r,0,Math.PI*2);ctx.fill();
  });
}
function drawVoidBg(t){
  if(!window._voidParts){window._voidParts=Array.from({length:20},()=>({x:Math.random(),y:Math.random(),r:Math.random()*3+1,phase:Math.random()*Math.PI*2}));}
  window._voidParts.forEach(p=>{
    ctx.save();ctx.globalAlpha=.4+.3*Math.sin(t*.04+p.phase);ctx.fillStyle='#7f77dd';ctx.beginPath();ctx.arc(p.x*W,p.y*(H-GROUND_H),p.r,0,Math.PI*2);ctx.fill();ctx.restore();
  });
}


function drawStormClouds(t){
  ctx.fillStyle='rgba(60,60,70,.9)';
  [[W*.1,H*.08],[W*.4,H*.05],[W*.7,H*.1],[W*.9,H*.07]].forEach(([cx,cy])=>{
    const sc=W/400;ctx.beginPath();ctx.ellipse(cx+Math.sin(t*.008)*10,cy,80*sc,35*sc,0,0,Math.PI*2);ctx.ellipse(cx+40*sc,cy+8*sc,55*sc,28*sc,0,0,Math.PI*2);ctx.fill();
  });
}
function drawRain(t){
  if(!window._rain)window._rain=Array.from({length:60},()=>({x:Math.random(),y:Math.random(),len:.04+Math.random()*.04,spd:.008+Math.random()*.006}));
  window._rain.forEach(r=>{r.y=(r.y+r.spd)%1;const rx=r.x*W,ry=r.y*(H-GROUND_H);ctx.save();ctx.strokeStyle='rgba(180,200,255,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-4,ry+r.len*(H-GROUND_H));ctx.stroke();ctx.restore();});
}
function drawUFOs(t){
  if(!window._ufos)window._ufos=[{x:.15,y:.2,spd:.0008},{x:.7,y:.35,spd:.0005},{x:.45,y:.12,spd:.0012}];
  window._ufos.forEach((u,i)=>{
    const ux=(u.x+t*u.spd)%1.2*W-0.1*W;const uy=u.y*(H-GROUND_H)+Math.sin(t*.04+i)*12;
    ctx.save();
    // Beam
    const bgrad=ctx.createLinearGradient(ux,uy+10,ux,uy+80);bgrad.addColorStop(0,'rgba(150,255,200,.18)');bgrad.addColorStop(1,'transparent');
    ctx.fillStyle=bgrad;ctx.beginPath();ctx.moveTo(ux-8,uy+10);ctx.lineTo(ux-30,uy+80);ctx.lineTo(ux+30,uy+80);ctx.lineTo(ux+8,uy+10);ctx.fill();
    // UFO body
    ctx.fillStyle='rgba(180,180,220,.85)';ctx.beginPath();ctx.ellipse(ux,uy,28,10,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(120,200,255,.8)';ctx.beginPath();ctx.ellipse(ux,uy-6,14,8,0,0,Math.PI*2);ctx.fill();
    // Lights
    [-16,-8,0,8,16].forEach((lx,li)=>{ctx.fillStyle='hsl('+(menuFrame*3+li*30)+',100%,70%)';ctx.beginPath();ctx.arc(ux+lx,uy+4,2.5,0,Math.PI*2);ctx.fill();});
    ctx.restore();
  });
}
function drawVoidPortals(t){
  if(!window._vPortals)window._vPortals=[{x:W*.2,y:H*.3},{x:W*.75,y:H*.5}];
  window._vPortals.forEach((p,i)=>{
    const pulse=1+Math.sin(t*.04+i)*0.12;
    for(let ring=3;ring>=0;ring--){
      const r=(25+ring*12)*pulse;
      const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);
      g.addColorStop(0,'rgba(127,119,221,.6)');g.addColorStop(.5,'rgba(226,75,74,.2)');g.addColorStop(1,'transparent');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();
    }
  });
}
function drawLavaRiver(t){
  const grad=ctx.createLinearGradient(0,H-GROUND_H-30,0,H-GROUND_H);
  grad.addColorStop(0,'rgba(255,50,0,.0)');grad.addColorStop(1,'rgba(255,100,0,.4)');
  ctx.fillStyle=grad;
  ctx.beginPath();ctx.moveTo(0,H-GROUND_H);
  for(let x=0;x<=W;x+=15)ctx.lineTo(x,H-GROUND_H-8-Math.abs(Math.sin(x*.05+t*.04))*16);
  ctx.lineTo(W,H-GROUND_H);ctx.closePath();ctx.fill();
  // glow
  ctx.fillStyle='rgba(255,100,0,.08)';ctx.fillRect(0,H-GROUND_H-40,W,40);
}
function drawMoon(t){
  const mx=W*.8,my=H*.15+Math.sin(t*.005)*8;
  const mg=ctx.createRadialGradient(mx,my,0,mx,my,30);
  mg.addColorStop(0,'rgba(255,255,220,.95)');mg.addColorStop(.7,'rgba(230,230,180,.7)');mg.addColorStop(1,'transparent');
  ctx.fillStyle=mg;ctx.beginPath();ctx.arc(mx,my,30,0,Math.PI*2);ctx.fill();
  // craters
  [[mx-8,my-5,5],[mx+6,my+8,3],[mx-2,my+10,4]].forEach(([cx,cy,cr])=>{ctx.fillStyle='rgba(180,180,140,.4)';ctx.beginPath();ctx.arc(cx,cy,cr,0,Math.PI*2);ctx.fill();});
}

// ── Music ─────────────────────────────────────────────────────────────────────
const TRACKS=[
  {name:'Chill Breeze',gen:'chill1'},{name:'Lo-Fi Drift',gen:'chill2'},
  {name:'Sky Walk',gen:'chill3'},{name:'Gentle Flow',gen:'chill4'},
  {name:'Game Beat',gen:'game'},{name:'Upbeat Run',gen:'game2'},
  {name:'Ranked Hype',gen:'ranked'},
];
let audioCtx=null,currentTrackIdx=0,musicPlaying=false,musicNodes=[],musicGainNode=null;
const TRACK_DATA={
  chill1:{bpm:70,notes:[261,294,330,349,392,440],type:'sine',bass:[98,110,131],pat:[0,2,4,2,1,3]},
  chill2:{bpm:78,notes:[220,261,294,330,349],type:'sine',bass:[82,98,110],pat:[0,1,3,1,2,4]},
  chill3:{bpm:65,notes:[196,220,261,294,330,392],type:'triangle',bass:[73,82,98],pat:[0,3,2,4,1,3]},
  chill4:{bpm:72,notes:[233,261,311,349,392,466],type:'sine',bass:[87,110,131],pat:[0,1,3,5,2,4]},
  game:  {bpm:118,notes:[261,330,392,523,659],type:'square',bass:[98,131,165],pat:[0,1,2,1,3,4]},
  game2: {bpm:128,notes:[294,330,392,440,523],type:'sawtooth',bass:[110,131,147],pat:[0,2,1,3,0,4]},
  ranked:{bpm:145,notes:[220,294,330,392,440,523],type:'sawtooth',bass:[110,147,165],pat:[0,1,3,4,2,4]},
};
function getAudio(){if(!audioCtx){try{audioCtx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}return audioCtx;}
function stopMusic(){musicNodes.forEach(n=>{try{n.stop();}catch(e){}});musicNodes=[];musicPlaying=false;document.getElementById('music-btn').textContent='▶';}
function playGeneratedTrack(gen){
  const ac=getAudio();if(!ac)return;
  stopMusic();musicPlaying=true;document.getElementById('music-btn').textContent='⏸';
  const td=TRACK_DATA[gen]||TRACK_DATA.chill1;
  const master=ac.createGain();master.gain.value=0.035;master.connect(ac.destination);musicGainNode=master;
  const rv=ac.createConvolver();const len=ac.sampleRate*.8;const buf=ac.createBuffer(2,len,ac.sampleRate);
  for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2);}
  rv.buffer=buf;const dg=ac.createGain();dg.gain.value=.7;dg.connect(master);
  const wg=ac.createGain();wg.gain.value=.25;rv.connect(master);wg.connect(rv);
  const beat=60/td.bpm;let t=ac.currentTime+.1;let step=0;
  const melody=()=>{
    if(!musicPlaying)return;
    const pi=td.pat[step%td.pat.length];const freq=td.notes[pi%td.notes.length];
    const o=ac.createOscillator();const g=ac.createGain();
    o.type=td.type;o.frequency.value=freq;o.connect(g);g.connect(dg);g.connect(wg);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+beat*.8);
    o.start(t);o.stop(t+beat*.85);musicNodes.push(o);
    if(step%2===0){const bf=td.bass[Math.floor(step/2)%td.bass.length];const bo=ac.createOscillator();const bg2=ac.createGain();bo.type='sine';bo.frequency.value=bf;bo.connect(bg2);bg2.connect(master);bg2.gain.setValueAtTime(0,t);bg2.gain.linearRampToValueAtTime(.1,t+.04);bg2.gain.exponentialRampToValueAtTime(.001,t+beat*1.8);bo.start(t);bo.stop(t+beat*1.9);musicNodes.push(bo);}
    step++;t+=beat;
    if(t<ac.currentTime+3)setTimeout(melody,0);else setTimeout(melody,(t-ac.currentTime-3)*1000);
  };
  melody();
}
function toggleMusic(){if(musicPlaying)stopMusic();else{const t=TRACKS[currentTrackIdx];document.getElementById('music-track').textContent=t.name;playGeneratedTrack(t.gen);}}
function prevTrack(){currentTrackIdx=(currentTrackIdx-1+TRACKS.length)%TRACKS.length;const t=TRACKS[currentTrackIdx];document.getElementById('music-track').textContent=t.name;if(musicPlaying){stopMusic();playGeneratedTrack(t.gen);}}
function nextTrack(){currentTrackIdx=(currentTrackIdx+1)%TRACKS.length;const t=TRACKS[currentTrackIdx];document.getElementById('music-track').textContent=t.name;if(musicPlaying){stopMusic();playGeneratedTrack(t.gen);}}
function setMusicVolume(v){if(musicGainNode)musicGainNode.gain.value=v;}

function playFlap(){const ac=getAudio();if(!ac)return;const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.setValueAtTime(520,ac.currentTime);o.frequency.exponentialRampToValueAtTime(780,ac.currentTime+.06);g.gain.setValueAtTime(.1,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.1);o.start();o.stop(ac.currentTime+.1);}
function playPoint(){const ac=getAudio();if(!ac)return;[523,659,784].forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='triangle';o.frequency.value=f;const t=ac.currentTime+i*.06;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.08,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+.1);o.start(t);o.stop(t+.1);});}
function playLevelUp(){const ac=getAudio();if(!ac)return;[523,659,784,1047].forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='triangle';o.frequency.value=f;const t=ac.currentTime+i*.1;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.13,t+.03);g.gain.exponentialRampToValueAtTime(.001,t+.18);o.start(t);o.stop(t+.18);});}
function playCrunch(){const ac=getAudio();if(!ac)return;const buf=ac.createBuffer(1,ac.sampleRate*.22,ac.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,1.5);const src=ac.createBufferSource(),g=ac.createGain(),flt=ac.createBiquadFilter();flt.type='lowpass';flt.frequency.value=380;src.buffer=buf;src.connect(flt);flt.connect(g);g.connect(ac.destination);g.gain.setValueAtTime(.45,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.22);src.start();src.stop(ac.currentTime+.22);}

// ── State ─────────────────────────────────────────────────────────────────────
let currentUser=null,authToken=localStorage.getItem('fm_token')||null;
let isGameScreen=false,hubSection='play',chosenDiff='normal',gameMode='normal';
let activeDailyChallenge=0,activeDailyDiff='normal';
let bird,pipes,score,frame,gState,groundOffset,sessionBest,particles,coinPopups,deadBird,trailPoints;
let powerups=[],activePowerup=null,powerupTimer=0;
const POWERUP_TYPES=[
  {id:'double',icon:'×2',label:'Double Points',color:'#fac775',duration:300},
  {id:'slowmo',icon:'⏱',label:'Slow Motion',color:'#5ec8f5',duration:240},
  {id:'shield',icon:'🛡',label:'Shield',color:'#5dcaa5',duration:180},
];
let menuFrame=0,menuPipes=[],menuBirds=[],menuObjects=[];
let matchId=null,opponentName=null,opponentAlive=true,matchCountdown=null;
let ghostY=0,ghostAngle=0,opponentSkin=null;
let crownUser=null;
let pendingTrade=null; // {from, to, offerType, offerId, wantType, wantId}
let _deadButtonsVisible=false;
let cutsceneActive=false,cutsceneFrame=0,cutsceneBirdX=0;

// ── Socket ────────────────────────────────────────────────────────────────────
const socket=io();
socket.on('queue_update',({count})=>{const el=document.getElementById('mm-status');if(el)el.textContent=count+' player'+(count!==1?'s':'')+' in queue';});
socket.on('match_found',({matchId:mid,seed,opponent,opponentRank,opponentSkin:os})=>{
  matchId=mid;opponentName=opponent;opponentAlive=true;opponentSkin=os;ghostY=H/2;ghostAngle=0;
  document.getElementById('mm-cancel').style.display='none';
  document.getElementById('mm-title').textContent='matched vs '+opponent;
  document.getElementById('mm-status').textContent=opponentRank;
  document.getElementById('mm-icon').textContent='⚔';
  socket.emit('match_ready',{matchId:mid});
});
socket.on('match_start',({startAt})=>{
  let rem=Math.ceil((startAt-Date.now())/1000);
  const cd=document.getElementById('mm-cd');cd.style.display='block';
  matchCountdown=setInterval(()=>{rem=Math.ceil((startAt-Date.now())/1000);if(rem>0)cd.textContent=rem;else{clearInterval(matchCountdown);startLiveMatch();}},80);
});
socket.on('opponent_pos',({y,angle})=>{ghostY=y;ghostAngle=angle;});
socket.on('opponent_score',({score:s})=>{const el=document.getElementById('vs-opp-s');if(el)el.textContent=s;});
socket.on('opponent_died',()=>{opponentAlive=false;const el=document.getElementById('vs-opp-s');if(el){el.textContent='dead';el.className='vs-dead';}const st=document.getElementById('vs-status');if(st)st.textContent='opponent died — survive to win!';});
socket.on('opponent_disconnected',()=>{opponentAlive=false;if(gState==='playing')gState='dead';});
socket.on('match_over',(result)=>{const isWinner=result.winner===currentUser?.username;if(currentUser)refreshUser();setTimeout(()=>showRankedOverPanel(isWinner,result.draw,result.winner),1400);});
socket.on('chat_message',(msg)=>{appendChatMsg(msg);});
socket.on('trade_offer',(trade)=>{
  pendingTrade=trade;
  showTradeNotif(trade);
});
socket.on('trade_accepted',(data)=>{
  coinPopups.push({x:W/2,y:H/2,text:'Trade Complete!',life:2,vy:-1.5,big:true});
  if(data.user)currentUser=data.user;
  updateHubBar();
  setTimeout(()=>refreshUser(),500);
});
socket.on('trade_declined',()=>{
  coinPopups.push({x:W/2,y:H/2,text:'Trade Declined',life:1.5,vy:-1.5,big:true});
  pendingTrade=null;
});

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

// ── API ───────────────────────────────────────────────────────────────────────
async function apiFetch(path,opts={}){
  const headers={'Content-Type':'application/json'};
  if(authToken)headers['Authorization']='Bearer '+authToken;
  const res=await fetch(API+path,{...opts,headers:{...headers,...opts.headers}});
  return res.json();
}
async function refreshUser(){if(!authToken)return;const data=await apiFetch('/api/me');if(data.user){currentUser=data.user;updateHubBar();}}
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
  authToken=data.token;localStorage.setItem('fm_token',authToken);currentUser=data.user;err.textContent='';
  socket.emit('set_identity',{token:authToken});
  goHub();
}
async function doLogin(){
  const username=document.getElementById('log-name').value.trim();
  const password=document.getElementById('log-pass').value;
  const err=document.getElementById('log-err');
  const data=await apiFetch('/api/login',{method:'POST',body:JSON.stringify({username,password})});
  if(data.error){err.textContent=data.error;return;}
  authToken=data.token;localStorage.setItem('fm_token',authToken);currentUser=data.user;err.textContent='';
  socket.emit('set_identity',{token:authToken});
  goHub();
}
function doLogout(){
  authToken=null;currentUser=null;localStorage.removeItem('fm_token');socket.emit('leave_queue');
  isGameScreen=false;hideDeadButtons();
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
function updateStrength(){const p=document.getElementById('reg-pass').value;const bar=document.getElementById('strength-bar'),lbl=document.getElementById('strength-label');let s=0;if(p.length>=12)s++;if(p.length>=16)s++;if(/[A-Z]/.test(p))s++;if(/[0-9]/.test(p))s++;if(/[^A-Za-z0-9]/.test(p))s++;const lvl=p.length<12?0:Math.min(s,5);const L=[{w:'0%',c:'#e24b4a',t:'too short'},{w:'20%',c:'#e24b4a',t:'weak'},{w:'40%',c:'#ef9f27',t:'fair'},{w:'60%',c:'#ef9f27',t:'moderate'},{w:'80%',c:'#5dcaa5',t:'strong'},{w:'100%',c:'#1d9e75',t:'very strong'}];bar.style.width=L[lvl].w;bar.style.background=L[lvl].c;lbl.textContent=L[lvl].t;}
const AVC=[{bg:'#1a2a40',fg:'#5ec8f5'},{bg:'#1a3028',fg:'#5dcaa5'},{bg:'#302010',fg:'#fac775'},{bg:'#221a3a',fg:'#afa9ec'},{bg:'#3a1a10',fg:'#f0997b'},{bg:'#2a1a28',fg:'#ed93b1'}];
function avColor(n){let h=0;for(let c of n)h=(h*31+c.charCodeAt(0))&0xffff;return AVC[h%AVC.length];}
function initials(n){return n.trim().split(/\s+/).map(w=>w[0].toUpperCase()).slice(0,2).join('');}
function setAv(el,n,sz){if(!el)return;const a=avColor(n);el.style.cssText+='background:'+a.bg+';color:'+a.fg+';min-width:'+sz+'px;width:'+sz+'px;height:'+sz+'px;font-size:'+(sz*.35)+'px;';el.textContent=initials(n)||'?';}

function showDeadButtons(){if(_deadButtonsVisible)return;_deadButtonsVisible=true;const el=document.getElementById('dead-buttons');if(el)el.style.display='flex';}
function hideDeadButtons(){_deadButtonsVisible=false;const el=document.getElementById('dead-buttons');if(el)el.style.display='none';}
function playAgain(){hideDeadButtons();resetGame();gState='idle';}

// ── Hub ───────────────────────────────────────────────────────────────────────
function goHub(){
  hideAllPanels();showHubOverlay(true);isGameScreen=false;hideDeadButtons();
  document.getElementById('hud').classList.remove('active');
  document.getElementById('hud-bottom').classList.remove('active');
  document.getElementById('vs-ov').classList.remove('active');
  document.getElementById('chat-overlay').classList.remove('active');
  updateHubBar();goSection('play');
}
function updateHubBar(){
  const isGuest=!currentUser;const n=isGuest?'Guest':currentUser.username;
  setAv(document.getElementById('hub-av'),n,34);
  document.getElementById('hub-uname').textContent=n;
  const pill=document.getElementById('hub-rpill'),coinsEl=document.getElementById('hub-coins');
  if(isGuest){pill.textContent='Guest';pill.style.cssText='background:rgba(100,100,100,.2);color:#888;';coinsEl.textContent='—';}
  else{const ri=getRankInfo(currentUser.rank_pts||0);pill.textContent=ri.label;pill.style.cssText='background:'+ri.bg+';color:'+ri.color+';';coinsEl.textContent=currentUser.coins||0;const lvl=currentUser.level||1,xp=currentUser.xp||0,xpNeeded=Math.max(50,lvl*50);document.getElementById('hub-lvl').textContent='Lvl '+lvl;document.getElementById('hub-xpbar').style.width=Math.round((xp/xpNeeded)*100)+'%';}
}
function goSection(s){
  hubSection=s;document.querySelectorAll('.hnb').forEach(b=>b.classList.toggle('active',b.dataset.s===s));
  const el=document.getElementById('hub-body');
  if(s==='play')renderPlay(el);else if(s==='ranked')renderRanked(el);else if(s==='daily')renderDaily(el);
  else if(s==='cases')renderCases(el);else if(s==='inventory')renderInventory(el);
  else if(s==='trade')renderTrade(el);
  else if(s==='chat')renderChatSection(el);else if(s==='profile')renderProfile(el);
}

// ── Play section - per-diff leaderboard ──────────────────────────────────────
async function renderPlay(el){
  el.innerHTML=`
    <div class="slabel">difficulty</div>
    <div class="drow">${['easy','normal','hard'].map(d=>`<button class="dbtn${chosenDiff===d?' sel':''}" onclick="selDiff('${d}')">${d}</button>`).join('')}</div>
    <div style="font-size:12px;color:rgba(255,255,255,.4);margin-bottom:12px;">${DIFFS[chosenDiff].desc}</div>
    <button class="btn-p" onclick="startGame('normal')">▶ play now</button>
    <div class="slabel" style="margin-top:14px;">🏆 ${chosenDiff} leaderboard</div>
    <div id="play-lb"><div class="empty">loading...</div></div>`;
  const rows=await apiFetch('/api/leaderboard?diff='+chosenDiff);
  const lbEl=document.getElementById('play-lb');
  if(lbEl){lbEl.innerHTML=renderLbHTML(rows,'score');if(rows.length>0)crownUser=rows[0].username;}
}
function selDiff(d){chosenDiff=d;renderPlay(document.getElementById('hub-body'));}

// ── Ranked ────────────────────────────────────────────────────────────────────
async function renderRanked(el){
  if(!currentUser){el.innerHTML='<div class="empty">create an account to play ranked</div>';return;}
  const ri=getRankInfo(currentUser.rank_pts||0);const lbRows=await apiFetch('/api/leaderboard/ranked');
  el.innerHTML=`<div class="slabel">your rank</div>
    <span class="rank-pill" style="background:${ri.bg};color:${ri.color};font-size:13px;padding:4px 12px;border-radius:20px;display:inline-block;margin-bottom:8px;">${ri.label}</span>
    <div class="rbw"><div class="rbb" style="width:${ri.pct}%;background:${ri.color};"></div></div>
    <div style="font-size:11px;color:rgba(255,255,255,.35);margin-bottom:12px;">${currentUser.rank_pts||0} pts · ${ri.pct}% to next</div>
    <div style="font-size:12px;color:rgba(255,255,255,.4);margin-bottom:12px;line-height:1.7;">🏆 Survival — <strong style="color:#fac775;">first to die loses</strong><br>Win = <strong style="color:#5dcaa5;">+20 pts</strong> · Lose = <strong style="color:#e24b4a;">−5 pts</strong></div>
    <button class="btn-p" onclick="joinRankedQueue()" style="margin-bottom:14px;">⚔ find opponent</button>
    <div class="slabel">rank leaderboard</div>
    ${renderRankedLbHTML(lbRows)}${renderRankLadder(currentUser.rank_pts||0)}`;
}
function renderRankedLbHTML(rows){if(!rows.length)return'<div class="empty">no ranked players yet</div>';return rows.slice(0,8).map((r,i)=>{const ri2=getRankInfo(r.rank_pts||0);const isYou=currentUser&&r.username===currentUser.username;const av=avColor(r.username);return'<div class="lbr"><span class="lbrank '+(i===0?'g':i===1?'s':i===2?'b':'')+'">#'+(i+1)+'</span><div class="lbav" style="background:'+av.bg+';color:'+av.fg+';">'+initials(r.username)+'</div><span class="lbn">'+r.username+(isYou?' <span class="lbyou">you</span>':'')+(r.crown?' 👑':'')+'</span><span style="font-size:9px;padding:1px 5px;border-radius:3px;background:'+ri2.bg+';color:'+ri2.color+';">'+ri2.label+'</span><span class="lbp" style="color:#fac775;">'+(r.rank_pts||0)+'</span></div>';}).join('');}
function renderRankLadder(pts){return'<div style="margin-top:12px;"><div class="slabel">rank ladder</div>'+RANKS.map((r,i)=>{const active=pts>=r.pts&&(i===RANKS.length-1||pts<RANKS[i+1].pts);return'<div class="rli"><div class="rld" style="background:'+r.color+';'+(active?'box-shadow:0 0 0 3px '+r.color+'30;':'')+'"></div><span style="font-size:12px;color:'+(active?r.color:'rgba(255,255,255,.35)')+';font-weight:'+(active?700:400)+';">'+r.name+(r.tiers>1?' I–III':'')+'</span><span style="font-size:10px;color:rgba(255,255,255,.25);margin-left:auto;">'+r.pts+' pts</span></div>';}).join('')+'</div>';}
function joinRankedQueue(){showHubOverlay(false);showPanel('panel-mm');document.getElementById('mm-title').textContent='finding opponent...';document.getElementById('mm-status').textContent='in queue';document.getElementById('mm-cancel').style.display='block';document.getElementById('mm-cd').style.display='none';document.getElementById('mm-icon').textContent='🐦';socket.emit('join_ranked',{token:authToken,username:currentUser?.username,equippedSkin:currentUser?.equipped});}
function leaveQueue(){socket.emit('leave_queue');if(matchCountdown)clearInterval(matchCountdown);hideAllPanels();goHub();}

// ── Daily ─────────────────────────────────────────────────────────────────────
async function renderDaily(el){
  const info=await apiFetch('/api/daily');const lbRows=await apiFetch('/api/leaderboard/daily');
  const challenges=info.challenges||[];const doneList=currentUser?.daily_done||[];const todayKey=info.key;
  const DIFF_COLORS={easy:'#5dcaa5',normal:'#5ec8f5',hard:'#e24b4a'};
  el.innerHTML='<div class="slabel">📅 daily challenges</div>'+
    '<div style="font-size:11px;color:rgba(255,255,255,.35);margin-bottom:10px;">5 challenges today — same pipes for every player!</div>'+
    challenges.map(c=>{const isDone=doneList.includes(todayKey+':'+c.id);const col=DIFF_COLORS[c.diff]||'#fff';
    return'<div style="background:rgba(255,255,255,.05);border:1px solid '+(isDone?col+'44':'rgba(255,255,255,.1)')+';border-radius:10px;padding:10px 12px;margin-bottom:8px;display:flex;align-items:center;gap:10px;">'+
      '<div style="font-size:22px;">'+c.icon+'</div><div style="flex:1;"><div style="font-size:13px;font-weight:700;color:#fff;">'+c.name+'</div><div style="font-size:11px;color:rgba(255,255,255,.4);">'+c.desc+' · <span style="color:'+col+';">'+c.diff+'</span></div></div>'+
      (isDone?'<div style="font-size:11px;color:#5dcaa5;font-weight:700;">✓ done</div>':'<button onclick="startDailyChallenge('+c.id+',\''+c.diff+'\')" style="background:'+col+';color:#06131a;border:none;border-radius:7px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;">play</button>')+
      '</div>';}).join('')+
    '<div class="slabel" style="margin-top:8px;">today\'s leaderboard</div>'+
    (lbRows.length?renderLbHTML(lbRows,'score'):'<div class="empty">no scores yet — be first!</div>');
}
function startDailyChallenge(id,diff){activeDailyChallenge=id;activeDailyDiff=diff||'normal';startGame('daily');}

// ── Cases ─────────────────────────────────────────────────────────────────────
async function renderCases(el){
  if(!currentUser){el.innerHTML='<div class="empty">log in to buy and open crates</div>';return;}
  const cases=await apiFetch('/api/cases');const inv=currentUser.inventory||{};const myCase=inv.cases||[];
  const caseMap={};cases.forEach(c=>caseMap[c.id]=c);
  let html='';
  CRATE_CATEGORIES.forEach(cat=>{
    html+='<div class="slabel">'+cat.label+'</div><div style="display:flex;gap:8px;margin-bottom:14px;">';
    cat.ids.forEach(cid=>{
      const c=caseMap[cid];if(!c)return;
      const owned=myCase.filter(x=>x===cid).length;
      const poolR=(POOL_RARITY_MAP[cid]||[]).map(r=>'<span style="color:'+RC_MAP[r]+';font-size:8px;font-weight:700;">'+r+'</span>').join(' ');
      html+='<div style="flex:1;background:rgba(255,255,255,.05);border:1px solid '+c.color+'33;border-radius:12px;padding:10px 6px;text-align:center;cursor:pointer;" onclick="buyCase(\''+cid+'\')">'+
        '<div style="font-size:24px;margin-bottom:4px;">'+(c.icon||'📦')+'</div>'+
        '<div style="font-size:10px;font-weight:700;color:'+c.color+';margin-bottom:3px;">'+c.name+'</div>'+
        (poolR?'<div style="margin-bottom:4px;line-height:1.8;">'+poolR+'</div>':'')+
        '<div style="font-size:10px;color:rgba(255,255,255,.35);">'+(PREMIUM_CRATES.includes(cid)?'100':'50')+' 🪙</div>'+
        (owned>0?'<div style="font-size:9px;font-weight:700;color:#5dcaa5;margin-top:3px;">×'+owned+' owned</div>':'')+
        '</div>';
    });
    html+='</div>';
  });
  html+='<div class="slabel">your crates ('+myCase.length+')</div>';
  if(!myCase.length){html+='<div class="empty">no crates — buy some above!</div>';}
  else{
    html+='<div style="display:flex;flex-wrap:wrap;gap:6px;">';
    [...new Set(myCase)].forEach(cid=>{const c=caseMap[cid]||{name:cid,color:'#fff',icon:'📦'};const count=myCase.filter(x=>x===cid).length;html+='<div style="background:rgba(255,255,255,.07);border:1px solid '+c.color+'44;border-radius:10px;padding:10px 14px;cursor:pointer;text-align:center;min-width:80px;" onclick="openCase(\''+cid+'\')"><div style="font-size:22px;">'+(c.icon||'📦')+'</div><div style="font-size:10px;font-weight:700;color:'+c.color+';margin-top:3px;">'+c.name+'</div><div style="font-size:10px;color:rgba(255,255,255,.4);">×'+count+' · open</div></div>';});
    html+='</div>';
  }
  html+='<div style="font-size:11px;color:rgba(255,255,255,.22);margin-top:10px;">Duplicates give coins instead.</div>';
  el.innerHTML=html;
}
async function buyCase(caseId){
  if(!currentUser)return;
  const price=PREMIUM_CRATES.includes(caseId)?100:50;
  if((currentUser.coins||0)<price){alert('not enough coins! need '+price+' 🪙');return;}
  const data=await apiFetch('/api/cases/buy',{method:'POST',body:JSON.stringify({caseId,qty:1})});
  if(data.error){alert(data.error);return;}
  currentUser=data.user;updateHubBar();renderCases(document.getElementById('hub-body'));
}
async function openCase(caseId){
  if(!currentUser)return;
  // Fetch result first
  const data=await apiFetch('/api/cases/open',{method:'POST',body:JSON.stringify({caseId})});
  if(data.error){alert(data.error);return;}
  currentUser=data.user;updateHubBar();
  const winItem=data.item;
  const rc=RARITY_COLORS[winItem.rarity]||'#fff';
  // Build CSGO-style scroll reel
  const overlay=document.getElementById('open-overlay');
  overlay.classList.add('active');
  // Build fake items for scroll
  const CASE_POOLS={bird_common:BIRD_SKINS.map(s=>({...s,type:'bird'})),bird_premium:BIRD_SKINS.filter(s=>['amethyst','gold','shadow','phoenix','void_bird'].includes(s.id)).map(s=>({...s,type:'bird'})),pipe_common:PIPE_SKINS.map(s=>({...s,type:'pipe'})),pipe_premium:PIPE_SKINS.filter(s=>['gold','obsidian','plasma','midnight','neon','void_pipe'].includes(s.id)).map(s=>({...s,type:'pipe'})),bg_common:BG_SKINS.map(s=>({...s,type:'bg'})),bg_premium:BG_SKINS.filter(s=>['aurora','undersea','crystal_cave','cosmic','dimension','void'].includes(s.id)).map(s=>({...s,type:'bg'})),trail_common:Object.entries(TRAIL_DEFS).map(([id,td])=>({id,name:td.name,type:'trail'})),trail_premium:['lightning','rainbow','galaxy','sakura','plasma_trail','void','divine'].map(id=>({id,name:TRAIL_DEFS[id]?.name||id,type:'trail'}))};
  const pool=(CASE_POOLS[caseId]||BIRD_SKINS).filter(s=>s.id);
  // Build reel: 40 random items + winner at position 34
  const reel=[];for(let i=0;i<40;i++){reel.push(pool[Math.floor(Math.random()*pool.length)]);}
  reel[34]={...pool.find(p=>p.id===winItem.id)||pool[0],...winItem};
  // Render reel HTML
  const ITEM_W=110,ITEM_GAP=8;
  const getItemEmoji=(item)=>item.type==='bird'?'🐦':item.type==='pipe'?'🎋':item.type==='bg'?'🌄':'✨';
  const getItemColor=(item)=>{const r=item.rarity;return RARITY_COLORS[r]||'#aaa';};
  overlay.innerHTML=`
    <div style="text-align:center;padding:20px 0 10px;">
      <div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:16px;">opening crate...</div>
      <div style="position:relative;width:100%;max-width:580px;margin:0 auto;overflow:hidden;border-radius:12px;border:1px solid rgba(255,255,255,.15);">
        <!-- Center indicator -->
        <div style="position:absolute;top:0;bottom:0;left:50%;transform:translateX(-50%);width:3px;background:#fac775;z-index:10;box-shadow:0 0 12px #fac775;"></div>
        <div style="position:absolute;top:0;left:0;width:80px;height:100%;background:linear-gradient(90deg,rgba(0,0,0,.8),transparent);z-index:5;pointer-events:none;"></div>
        <div style="position:absolute;top:0;right:0;width:80px;height:100%;background:linear-gradient(270deg,rgba(0,0,0,.8),transparent);z-index:5;pointer-events:none;"></div>
        <div id="crate-reel" style="display:flex;gap:${ITEM_GAP}px;padding:12px 8px;width:max-content;will-change:transform;">
          ${reel.map((item,i)=>{
            const col=getItemColor(item);const emoji=getItemEmoji(item);
            return '<div style="width:'+ITEM_W+'px;flex-shrink:0;background:rgba(255,255,255,.05);border:2px solid '+col+'44;border-radius:10px;padding:10px 6px;text-align:center;"><div style="font-size:28px;">'+emoji+'</div><div style="font-size:10px;font-weight:700;color:#fff;margin-top:4px;">'+(item.name||item.id)+'</div><div style="font-size:9px;color:'+col+';margin-top:2px;">'+(RARITY_LABELS[item.rarity]||'')+'</div></div>';
          }).join('')}
        </div>
      </div>
    </div>
  `;
  // Animate scroll
  const reelEl=overlay.querySelector('#crate-reel');
  const containerW=Math.min(580,window.innerWidth-40);
  const targetPos=34*(ITEM_W+ITEM_GAP)-(containerW/2)+(ITEM_W/2);
  let start=null,duration=4500;
  // Start from left
  reelEl.style.transform='translateX(0px)';
  function animate(ts){
    if(!start)start=ts;
    const elapsed=ts-start;
    const prog=Math.min(elapsed/duration,1);
    // Ease out with overshoot then settle
    const ease=prog<1?1-Math.pow(1-prog,4):1;
    const wobble=prog>.9?Math.sin((prog-.9)*100)*(1-prog)*6:0;
    reelEl.style.transform='translateX(-'+(targetPos*ease+wobble)+'px)';
    if(prog<1){requestAnimationFrame(animate);}
    else{
      // Highlight winner
      const winnerEl=reelEl.children[34];
      if(winnerEl){winnerEl.style.border='2px solid '+rc;winnerEl.style.boxShadow='0 0 20px '+rc;winnerEl.style.background='rgba(255,255,255,.12)';}
      setTimeout(()=>showOpenResult(winItem,data,rc),600);
    }
  }
  requestAnimationFrame(animate);
}
function showOpenResult(item,data,rc){
  const overlay=document.getElementById('open-overlay');
  const emoji=item.type==='bird'?'🐦':item.type==='pipe'?'🎋':item.type==='bg'?'🌄':'✨';
  overlay.innerHTML=`
    <div id="open-item-reveal" style="font-size:64px;animation:reveal .5s ease-out;">${emoji}</div>
    <div style="text-align:center;">
      <div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:6px;">${(item.name||item.id).replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</div>
      <div style="font-size:14px;font-weight:700;color:${rc};margin-bottom:6px;">${RARITY_LABELS[item.rarity]||item.rarity} ${item.type}</div>
      ${data.duplicate?'<div style="font-size:12px;color:rgba(255,255,255,.5);margin-bottom:10px;">duplicate — got '+data.dup_coins+' 🪙 instead</div>':''}
    </div>
    <button class="btn-p" style="width:200px;" onclick="closeOpenOverlay()">nice!</button>
  `;
}
function closeOpenOverlay(){document.getElementById('open-overlay').classList.remove('active');if(hubSection==='cases')renderCases(document.getElementById('hub-body'));if(hubSection==='inventory')renderInventory(document.getElementById('hub-body'));}

// ── Inventory ─────────────────────────────────────────────────────────────────
let invTab='birds';
function renderInventory(el){
  if(!currentUser){el.innerHTML='<div class="empty">log in to see your inventory</div>';return;}
  const inv=currentUser.inventory||{birds:['hatchling'],pipes:['bamboo'],bgs:['sky'],trails:[],cases:[]};
  const eq=currentUser.equipped||{bird:'hatchling',pipe:'bamboo',bg:'sky',trail:'none'};
  const tabs=[{k:'birds',icon:'🐦',label:'Skins'},{k:'pipes',icon:'🎋',label:'Pipes'},{k:'bgs',icon:'🌄',label:'BGs'},{k:'trails',icon:'✨',label:'Trails'},{k:'cases',icon:'📦',label:'Crates'}];
  let html='<div style="display:flex;gap:3px;margin-bottom:10px;background:rgba(0,0,0,.3);border-radius:10px;padding:4px;">';
  tabs.forEach(t=>{const sel=invTab===t.k;html+='<button onclick="setInvTab(\''+t.k+'\')" style="flex:1;padding:6px 2px;font-size:10px;font-weight:700;border:none;border-radius:7px;cursor:pointer;font-family:inherit;background:'+(sel?'rgba(94,200,245,.25)':'transparent')+';color:'+(sel?'#5ec8f5':'rgba(255,255,255,.4)')+';border:1px solid '+(sel?'rgba(94,200,245,.4)':'transparent')+';">'+t.icon+' '+t.label+'</button>';});
  html+='</div>';
  if(invTab==='birds'){
    html+='<div class="slabel">🐦 bird skins ('+inv.birds.length+')</div><div class="inv-grid">';
    getAllOwnedBirds().forEach(id=>{const skin=BIRD_SKINS.find(s=>s.id===id)||{id,name:id,colors:['#F5C842','#F0A800','#FF7A00']};const isEq=eq.bird===id;const isRank=skin.rankRequired;html+='<div class="inv-item'+(isEq?' equipped':'')+'" onclick="equipItem(\'bird\',\''+id+'\')"><canvas id="ibrd-'+id+'" width="40" height="30"></canvas><div class="inv-item-name">'+skin.name+(isRank?'<span style="font-size:7px;color:#fac775;display:block;">'+isRank+'</span>':'')+'</div><div style="font-size:9px;color:'+(isEq?'#5ec8f5':'rgba(255,255,255,.3)')+';">'+(isEq?'✓ on':'tap')+'</div></div>';});
    html+='</div>';
  }else if(invTab==='pipes'){
    html+='<div class="slabel">🎋 pipe skins ('+inv.pipes.length+')</div><div class="inv-grid">';
    inv.pipes.forEach(id=>{const skin=PIPE_SKINS.find(s=>s.id===id)||{id,name:id,light:'#5BC63C',dark:'#4DB533'};const isEq=eq.pipe===id;html+='<div class="inv-item'+(isEq?' equipped':'')+'" onclick="equipItem(\'pipe\',\''+id+'\')"><div style="width:40px;height:30px;display:flex;align-items:center;justify-content:center;gap:3px;margin:0 auto 3px;"><div style="width:14px;height:26px;background:'+skin.light+';border-radius:2px;"></div><div style="width:14px;height:26px;background:'+skin.dark+';border-radius:2px;"></div></div><div class="inv-item-name">'+skin.name+'</div><div style="font-size:9px;color:'+(isEq?'#5ec8f5':'rgba(255,255,255,.3)')+';">'+(isEq?'✓ on':'tap')+'</div></div>';});
    html+='</div>';
  }else if(invTab==='bgs'){
    html+='<div class="slabel">🌄 backgrounds ('+inv.bgs.length+')</div><div class="inv-grid">';
    inv.bgs.forEach(id=>{const skin=BG_SKINS.find(s=>s.id===id)||{id,name:id};const isEq=eq.bg===id;html+='<div class="inv-item'+(isEq?' equipped':'')+'" onclick="equipItem(\'bg\',\''+id+'\')"><canvas id="ibg-'+id+'" width="40" height="30"></canvas><div class="inv-item-name">'+skin.name+'</div><div style="font-size:9px;color:'+(isEq?'#5ec8f5':'rgba(255,255,255,.3)')+';">'+(isEq?'✓ on':'tap')+'</div></div>';});
    html+='</div>';
  }else if(invTab==='trails'){
    html+='<div class="slabel">✨ trails ('+(inv.trails.length+1)+')</div><div class="inv-grid">';
    html+='<div class="inv-item'+(eq.trail==='none'?' equipped':'')+'" onclick="equipItem(\'trail\',\'none\')"><div style="font-size:18px;text-align:center;width:40px;height:30px;display:flex;align-items:center;justify-content:center;margin:0 auto 3px;color:rgba(255,255,255,.3);">—</div><div class="inv-item-name">None</div><div style="font-size:9px;color:'+(eq.trail==='none'?'#5ec8f5':'rgba(255,255,255,.3)')+';">'+(eq.trail==='none'?'✓ on':'tap')+'</div></div>';
    inv.trails.forEach(id=>{const td=TRAIL_DEFS[id]||{name:id};const isEq=eq.trail===id;const TICONS={fire:'🔥',ice:'❄️',lightning:'⚡',rainbow:'🌈',galaxy:'🌌',hearts:'❤️',stars:'⭐',bubbles:'🫧',leaves:'🍃',sakura:'🌸',divine:'✨',smoke:'💨',neon_trail:'🟢',plasma_trail:'💜',void:'🕳️'};const icon=TICONS[id]||'🌀';html+='<div class="inv-item'+(isEq?' equipped':'')+'" onclick="equipItem(\'trail\',\''+id+'\')"><div style="font-size:18px;text-align:center;width:40px;height:30px;display:flex;align-items:center;justify-content:center;margin:0 auto 3px;">'+icon+'</div><div class="inv-item-name">'+td.name+'</div><div style="font-size:9px;color:'+(isEq?'#5ec8f5':'rgba(255,255,255,.3)')+';">'+(isEq?'✓ on':'tap')+'</div></div>';});
    html+='</div>';
  }else if(invTab==='cases'){
    const casesOwned=inv.cases||[];
    if(!casesOwned.length){html+='<div class="empty">no crates — buy some from the Cases tab!</div>';}
    else{
      html+='<div class="slabel">📦 your crates ('+casesOwned.length+')</div><div style="display:flex;flex-wrap:wrap;gap:8px;">';
      const grouped={};casesOwned.forEach(cid=>{grouped[cid]=(grouped[cid]||0)+1;});
      const CICNS={bird_common:'🐦',bird_premium:'🥚',pipe_common:'🎋',pipe_premium:'⚙️',bg_common:'🌄',bg_premium:'🌌',trail_common:'✨',trail_premium:'🌀'};
      const CCOLS={bird_common:'#F5C842',bird_premium:'#fac775',pipe_common:'#5BC63C',pipe_premium:'#B0C4DE',bg_common:'#5EC8F5',bg_premium:'#7f77dd',trail_common:'#FF7A00',trail_premium:'#e24b4a'};
      Object.entries(grouped).forEach(([cid,count])=>{const col=CCOLS[cid]||'#fff',icon=CICNS[cid]||'📦';html+='<div style="background:rgba(255,255,255,.06);border:1px solid '+col+'44;border-radius:12px;padding:12px 14px;cursor:pointer;text-align:center;min-width:80px;" onclick="openCase(\''+cid+'\')"><div style="font-size:28px;">'+icon+'</div><div style="font-size:9px;font-weight:700;color:'+col+';margin-top:4px;">'+cid.replace(/_/g,' ')+'</div><div style="font-size:10px;color:rgba(255,255,255,.5);">×'+count+' · open</div></div>';});
      html+='</div>';
    }
  }
  el.innerHTML=html;
  if(invTab==='birds')requestAnimationFrame(()=>{inv.birds.forEach(id=>{const c=document.getElementById('ibrd-'+id);if(!c)return;const skin=BIRD_SKINS.find(s=>s.id===id)||BIRD_SKINS[0];const x=c.getContext('2d');x.clearRect(0,0,40,30);x.fillStyle=skin.colors[0];x.beginPath();x.ellipse(20,15,12,10,0,0,Math.PI*2);x.fill();x.fillStyle=skin.colors[1];x.beginPath();x.ellipse(22,18,9,7,.3,0,Math.PI*2);x.fill();x.fillStyle='white';x.beginPath();x.arc(27,10,3.5,0,Math.PI*2);x.fill();x.fillStyle='#111';x.beginPath();x.arc(28,9.5,2,0,Math.PI*2);x.fill();x.fillStyle=skin.colors[2];x.beginPath();x.moveTo(31,13);x.lineTo(38,15);x.lineTo(31,17);x.closePath();x.fill();});});
  if(invTab==='bgs')requestAnimationFrame(()=>{inv.bgs.forEach(id=>{const c=document.getElementById('ibg-'+id);if(!c)return;const skin=BG_SKINS.find(s=>s.id===id);if(!skin||!skin.draw)return;try{const cx2=c.getContext('2d');cx2.clearRect(0,0,40,30);const svW=W,svH=H,svC=canvas,svX=ctx;W=40;H=36;canvas=c;ctx=cx2;skin.draw(0);W=svW;H=svH;canvas=svC;ctx=svX;}catch(e){}});});
}
function setInvTab(tab){invTab=tab;renderInventory(document.getElementById('hub-body'));}

// ── Trade System ──────────────────────────────────────────────────────────────
let tradeOffer={offerType:'bird',offerId:'',wantType:'bird',wantId:'',toUser:''};

function renderTrade(el){
  if(!currentUser){el.innerHTML='<div class="empty">log in to trade</div>';return;}
  el.innerHTML=`
    <div class="slabel">🔄 trade items with other players</div>
    <div style="font-size:12px;color:rgba(255,255,255,.4);margin-bottom:12px;">Send a trade offer — the other player accepts or declines in their chat.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
      <div>
        <div class="slabel">you offer</div>
        <select id="trade-offer-type" onchange="updateTradeOffer()" style="width:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;padding:6px;border-radius:6px;margin-bottom:6px;font-family:inherit;font-size:12px;">
          <option value="bird">Bird Skin</option>
          <option value="pipe">Pipe</option>
          <option value="bg">Background</option>
          <option value="trail">Trail</option>
        </select>
        <select id="trade-offer-id" style="width:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;padding:6px;border-radius:6px;font-family:inherit;font-size:12px;"></select>
      </div>
      <div>
        <div class="slabel">you want</div>
        <select id="trade-want-type" onchange="updateTradeWant()" style="width:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;padding:6px;border-radius:6px;margin-bottom:6px;font-family:inherit;font-size:12px;">
          <option value="bird">Bird Skin</option>
          <option value="pipe">Pipe</option>
          <option value="bg">Background</option>
          <option value="trail">Trail</option>
        </select>
        <input id="trade-want-id" placeholder="item name to request" style="width:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;padding:6px;border-radius:6px;font-family:inherit;font-size:12px;"/>
      </div>
    </div>
    <input id="trade-to-user" placeholder="player username to send offer to" style="width:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;padding:8px 10px;border-radius:8px;font-family:inherit;font-size:13px;margin-bottom:10px;"/>
    <button class="btn-p" onclick="sendTradeOffer()" style="margin-bottom:10px;">📤 send trade offer</button>
    ${pendingTrade?`<div style="background:rgba(94,200,245,.1);border:1px solid #5ec8f5;border-radius:10px;padding:12px;margin-top:8px;">
      <div style="font-size:13px;font-weight:700;color:#5ec8f5;margin-bottom:6px;">📥 incoming trade from ${pendingTrade.from}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.7);margin-bottom:10px;">
        They offer: <strong>${pendingTrade.offerId}</strong> (${pendingTrade.offerType})<br>
        They want: <strong>${pendingTrade.wantId}</strong> (${pendingTrade.wantType})
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn-p" onclick="respondTrade(true)" style="flex:1;background:#5dcaa5;color:#000;">✓ accept</button>
        <button class="btn-s" onclick="respondTrade(false)" style="flex:1;">✗ decline</button>
      </div>
    </div>`:'<div class="empty" style="font-size:11px;">no pending trades</div>'}
  `;
  updateTradeOffer();updateTradeWant();
}

function updateTradeOffer(){
  const type=document.getElementById('trade-offer-type')?.value;if(!type)return;
  const inv=currentUser?.inventory||{};
  const items=type==='bird'?getAllOwnedBirds():type==='pipe'?(inv.pipes||['bamboo']):type==='bg'?(inv.bgs||['sky']):(inv.trails||[]);
  const sel=document.getElementById('trade-offer-id');if(!sel)return;
  sel.innerHTML=items.map(id=>'<option value="'+id+'">'+id.replace(/_/g,' ')+'</option>').join('');
}
function updateTradeWant(){} // free-text input

async function sendTradeOffer(){
  const offerType=document.getElementById('trade-offer-type')?.value;
  const offerId=document.getElementById('trade-offer-id')?.value;
  const wantType=document.getElementById('trade-want-type')?.value;
  const wantId=document.getElementById('trade-want-id')?.value?.trim();
  const toUser=document.getElementById('trade-to-user')?.value?.trim();
  if(!offerId||!wantId||!toUser){alert('fill in all fields');return;}
  socket.emit('trade_offer',{token:authToken,from:currentUser.username,to:toUser,offerType,offerId,wantType,wantId});
  coinPopups.push({x:W/2,y:H/2,text:'Trade offer sent!',life:1.5,vy:-1.5,big:true});
}

async function respondTrade(accept){
  if(!pendingTrade)return;
  socket.emit('trade_respond',{token:authToken,accept,trade:pendingTrade});
  if(!accept)pendingTrade=null;
}

function showTradeNotif(trade){
  // Show as a notification popup in coinPopups
  coinPopups.push({x:W/2,y:H*.3,text:'📥 Trade from '+trade.from+'!',life:4,vy:-.5,big:true});
  // If in hub, re-render trade section
  if(hubSection==='trade')renderTrade(document.getElementById('hub-body'));
}
async function equipItem(type,id){if(!currentUser)return;const data=await apiFetch('/api/equip',{method:'POST',body:JSON.stringify({type,itemId:id})});if(data.error){alert(data.error);return;}currentUser=data.user;updateHubBar();renderInventory(document.getElementById('hub-body'));}

// ── Chat ──────────────────────────────────────────────────────────────────────
async function renderChatSection(el){
  const msgs=await apiFetch('/api/chat');
  el.innerHTML='<div style="background:rgba(0,0,0,.4);border-radius:10px;padding:10px;max-height:280px;overflow-y:auto;margin-bottom:10px;font-size:12px;" id="hub-chat-msgs"></div>'+
    '<div style="display:flex;gap:6px;"><input type="text" id="hub-chat-input" placeholder="say something..." maxlength="200" style="flex:1;padding:8px 10px;" onkeydown="if(event.key===\'Enter\')sendChatHub()"/><button class="btn-p" style="width:auto;padding:8px 14px;" onclick="sendChatHub()">send</button></div>';
  const box=document.getElementById('hub-chat-msgs');msgs.forEach(m=>{const div=document.createElement('div');div.style.cssText='margin-bottom:5px;color:rgba(255,255,255,.8);';const av=avColor(m.username);div.innerHTML='<strong style="color:'+av.fg+';">'+m.username+':</strong> '+escHtml(m.text);box.appendChild(div);});box.scrollTop=box.scrollHeight;
}
function sendChatHub(){const inp=document.getElementById('hub-chat-input');if(!inp)return;const text=inp.value.trim();if(!text)return;socket.emit('chat_message',{token:authToken,text});inp.value='';}
function appendChatMsg(msg){
  const hubBox=document.getElementById('hub-chat-msgs');
  if(hubBox){const div=document.createElement('div');div.style.cssText='margin-bottom:5px;color:rgba(255,255,255,.8);';const av=avColor(msg.username);div.innerHTML='<strong style="color:'+av.fg+';">'+msg.username+':</strong> '+escHtml(msg.text);hubBox.appendChild(div);hubBox.scrollTop=hubBox.scrollHeight;}
  const box=document.getElementById('chat-msgs');
  if(box){const div=document.createElement('div');div.className='chat-msg';const av=avColor(msg.username);div.innerHTML='<strong style="color:'+av.fg+';">'+msg.username+':</strong> '+escHtml(msg.text);box.appendChild(div);if(box.children.length>30)box.removeChild(box.firstChild);box.scrollTop=box.scrollHeight;setTimeout(()=>{if(div.parentNode){div.style.opacity='0';setTimeout(()=>{if(div.parentNode)div.parentNode.removeChild(div);},600);}},5000);}
}
function sendChat(){const inp=document.getElementById('chat-input');if(!inp)return;const text=inp.value.trim();if(!text)return;socket.emit('chat_message',{token:authToken,text});inp.value='';}
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&document.activeElement.id==='chat-input')sendChat();});
let _chatVisible=true;
function toggleChat(){
  _chatVisible=!_chatVisible;
  const box=document.getElementById('chat-msgs');const row=document.getElementById('chat-input-row');
  if(box)box.style.display=_chatVisible?'block':'none';
  if(row)row.style.display=_chatVisible?'flex':'none';
  const btn=document.getElementById('chat-toggle-btn');if(btn)btn.textContent=_chatVisible?'💬 hide':'💬 show';
}
function escHtml(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// ── Profile ───────────────────────────────────────────────────────────────────
async function renderProfile(el){
  if(!currentUser){el.innerHTML='<div class="empty">log in to see your profile</div>';return;}
  const hist=await apiFetch('/api/history');const ri=getRankInfo(currentUser.rank_pts||0);const av=avColor(currentUser.username);
  const lvl=currentUser.level||1,xp=currentUser.xp||0,xpNeeded=Math.max(50,lvl*50);
  el.innerHTML='<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;"><div style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:17px;background:'+av.bg+';color:'+av.fg+';flex-shrink:0;">'+initials(currentUser.username)+'</div><div><div style="font-size:16px;font-weight:700;color:#fff;">'+currentUser.username+(currentUser.username===crownUser?' 👑':'')+'</div><div style="font-size:11px;color:rgba(255,255,255,.35);">joined '+new Date((currentUser.created_at||0)*1000).toLocaleDateString()+'</div></div></div>'+
    '<div class="mrow"><div class="met"><div class="metl">best</div><div class="metv">'+(currentUser.best_score||0)+'</div></div><div class="met"><div class="metl">games</div><div class="metv">'+(currentUser.games_played||0)+'</div></div><div class="met"><div class="metl">coins</div><div class="metv">'+(currentUser.coins||0)+'</div></div></div>'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><span style="font-size:12px;font-weight:700;color:#5ec8f5;">Level '+lvl+'</span><span style="font-size:10px;color:rgba(255,255,255,.35);">'+xp+'/'+xpNeeded+' XP</span></div>'+
    '<div class="rbw" style="margin-bottom:10px;"><div class="rbb" style="width:'+Math.round(xp/xpNeeded*100)+'%;background:linear-gradient(90deg,#5ec8f5,#7f77dd);"></div></div>'+
    '<span class="rank-pill" style="background:'+ri.bg+';color:'+ri.color+';font-size:12px;padding:3px 10px;border-radius:20px;display:inline-block;margin-bottom:10px;">'+ri.label+'</span>'+
    '<div class="slabel">recent games</div>'+(hist.length?hist.slice(0,8).map(r=>'<div class="hi"><span style="font-size:13px;font-weight:700;color:#fff;flex:1;">'+r.score+'</span><span class="htag tag-'+(r.mode==='ranked'?'ranked':r.mode==='daily'?'daily':r.diff||'normal')+'">'+r.diff+'</span><span style="font-size:10px;color:rgba(255,255,255,.25);">'+new Date((r.created_at||0)*1000).toLocaleDateString(undefined,{month:'short',day:'numeric'})+'</span></div>').join(''):'<div class="empty">no games yet</div>');
}

// ── LB HTML ───────────────────────────────────────────────────────────────────
function renderLbHTML(rows,key='score'){
  if(!rows||!rows.length)return'<div class="empty">no scores yet</div>';
  return rows.slice(0,8).map((r,i)=>{const isYou=currentUser&&r.username===currentUser.username;const av=avColor(r.username);return'<div class="lbr"><span class="lbrank '+(i===0?'g':i===1?'s':i===2?'b':'')+'">#'+(i+1)+'</span><div class="lbav" style="background:'+av.bg+';color:'+av.fg+';">'+initials(r.username)+'</div><span class="lbn">'+r.username+(isYou?' <span class="lbyou">you</span>':'')+(r.crown?' 👑':'')+'</span><span class="lbp">'+r[key]+'</span></div>';}).join('');
}

// ── Ranked over ───────────────────────────────────────────────────────────────
function showRankedOverPanel(isWinner,isDraw,winnerName){
  isGameScreen=false;hideDeadButtons();
  document.getElementById('hud').classList.remove('active');document.getElementById('hud-bottom').classList.remove('active');
  document.getElementById('vs-ov').classList.remove('active');document.getElementById('chat-overlay').classList.remove('active');
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
  return{bird:BIRD_SKINS.find(s=>s.id===eq.bird)||BIRD_SKINS[0],pipe:PIPE_SKINS.find(s=>s.id===eq.pipe)||PIPE_SKINS[0],bg:BG_SKINS.find(s=>s.id===eq.bg)||BG_SKINS[0],trail:eq.trail||'none'};
}
function getAllOwnedBirds(){
  if(!currentUser)return['hatchling'];
  const base=currentUser.inventory?.birds||['hatchling'];
  const rankSkins=getUnlockedRankSkins(currentUser.rank_pts||0);
  const all=[...new Set([...base,...rankSkins])];
  return all;
}

function startGame(mode){
  gameMode=mode;sessionBest=0;matchId=null;opponentName=null;opponentAlive=true;
  const n=currentUser?currentUser.username:'Guest';
  hideAllPanels();showHubOverlay(false);isGameScreen=true;hideDeadButtons();
  setAv(document.getElementById('hud-av'),n,30);
  document.getElementById('hud-name').textContent=n;
  document.getElementById('hud-coins-disp').textContent=currentUser?currentUser.coins||0:'—';
  document.getElementById('hud-score').textContent='0';document.getElementById('hud-best').textContent='0';
  document.getElementById('hud-xp').textContent='+0';
  document.getElementById('vs-ov').classList.remove('active');
  document.getElementById('chat-overlay').classList.add('active');
  document.getElementById('hud').classList.add('active');
  document.getElementById('hud-bottom').classList.add('active');
  // hide menu btn during play
  const mb=document.getElementById('hud-menu-btn');if(mb)mb.style.display='none';
  currentTrackIdx=mode==='ranked'?6:4;document.getElementById('music-track').textContent=TRACKS[currentTrackIdx].name;
  if(musicPlaying){stopMusic();playGeneratedTrack(TRACKS[currentTrackIdx].gen);}
  resetGame();showCutscene();
}

let _cutsceneTO=null;
function showCutscene(){cutsceneActive=true;cutsceneFrame=0;cutsceneBirdX=-60;if(_cutsceneTO)clearTimeout(_cutsceneTO);_cutsceneTO=setTimeout(()=>{cutsceneActive=false;gState='idle';},2200);}

function exitToHub(){
  resetGame();isGameScreen=false;hideDeadButtons();
  document.getElementById('hud').classList.remove('active');document.getElementById('hud-bottom').classList.remove('active');
  document.getElementById('vs-ov').classList.remove('active');document.getElementById('chat-overlay').classList.remove('active');
  currentTrackIdx=0;document.getElementById('music-track').textContent=TRACKS[0].name;
  if(musicPlaying){stopMusic();playGeneratedTrack(TRACKS[0].gen);}
  goHub();
}

async function autoSaveScore(){
  if(!currentUser||score===0)return;
  const data=await apiFetch('/api/score',{method:'POST',body:JSON.stringify({score,mode:gameMode,diff:gameMode==='daily'?activeDailyDiff:chosenDiff,challengeId:activeDailyChallenge})});
  if(data.user){currentUser=data.user;updateHubBar();document.getElementById('hud-coins-disp').textContent=currentUser.coins||0;if(data.levels_gained>0){coinPopups.push({x:W/2,y:H*.35,text:'LEVEL UP! '+currentUser.level,life:1,vy:-2,big:true});playLevelUp();}}
}

function resetGame(){
  bird={y:H/2,vy:0,angle:0};pipes=[];score=0;frame=0;groundOffset=0;
  gState='cutscene';deadBird=null;particles=[];coinPopups=[];trailPoints=[];
  powerups=[];activePowerup=null;powerupTimer=0;
  cutsceneActive=false;hideDeadButtons();_deadButtonsVisible=false;
  const sc=document.getElementById('hud-score');if(sc)sc.textContent='0';
}

function flap(){
  if(!isGameScreen)return;
  if(gState==='idle'||gState==='cutscene'){if(!cutsceneActive){if(_cutsceneTO)clearTimeout(_cutsceneTO);cutsceneActive=false;gState='playing';spawnPipe();playFlap();}}
  else if(gState==='playing'){bird.vy=JUMP;playFlap();}
  else if(gState==='dead'&&!deadBird&&!matchId){resetGame();}
}
canvas.addEventListener('click',flap);
canvas.addEventListener('touchstart',e=>{e.preventDefault();flap();},{passive:false});
document.addEventListener('keydown',e=>{if(e.code==='Space'&&document.activeElement.tagName!=='INPUT'){e.preventDefault();flap();}});

let dailyRandState=0;
function dailyRand(){dailyRandState=(dailyRandState*9301+49297)%233280;return dailyRandState/233280;}

function spawnPipe(){
  const d=gameMode==='ranked'?DIFFS.normal:gameMode==='daily'?DIFFS[activeDailyDiff]:DIFFS[chosenDiff];
  const safeGap=Math.max(d.gap, BIRD_R*8); // never compress gap below 8x bird radius
  const minTop=Math.round(H*.18);
  const maxTop=Math.round(H-GROUND_H-safeGap-H*.18);
  // Clamp so maxTop is always > minTop
  const clampedMax=Math.max(maxTop, minTop+50);
  let topH;
  if(gameMode==='daily'){
    if(pipes.length===0){const s=new Date();dailyRandState=(s.getFullYear()*10000+(s.getMonth()+1)*100+s.getDate())*10+(activeDailyChallenge%10);}
    topH=minTop+dailyRand()*(clampedMax-minTop);
  } else {
    topH=minTop+Math.random()*(clampedMax-minTop);
  }
  // Extra safety clamp
  topH=Math.max(minTop, Math.min(topH, clampedMax));
  pipes.push({x:W+10,topH,passed:false});
}

function spawnFeathers(x,y,skin){for(let i=0;i<14;i++){const a=Math.random()*Math.PI*2,sp=2+Math.random()*4;particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2.5,life:1,color:skin.colors[Math.floor(Math.random()*3)],size:3+Math.random()*5,rot:Math.random()*Math.PI*2,rotV:(Math.random()-.5)*.22});}}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawGround(){
  const gy=H-GROUND_H;
  // Save and clip to ground area only — prevents grass from poking into sky
  ctx.save();
  ctx.beginPath();ctx.rect(0,gy,W,GROUND_H);ctx.clip();
  // Dirt base
  ctx.fillStyle='#4a2e0f';ctx.fillRect(0,gy,W,GROUND_H);
  // Soil streaks
  for(let i=0;i<8;i++){ctx.fillStyle='rgba(80,40,10,'+(0.1+i*.03)+')';ctx.fillRect(0,gy+14+i*6,W,3);}
  // Grass top solid band
  const gr=ctx.createLinearGradient(0,gy,0,gy+20);
  gr.addColorStop(0,'#56c43a');gr.addColorStop(1,'#3a8c28');
  ctx.fillStyle=gr;ctx.fillRect(0,gy,W,20);
  // Grass blades — drawn FROM ground line upward, clipped so they can't escape
  const bladeCount=Math.floor(W/6);
  for(let i=0;i<bladeCount;i++){
    const bx=(i*6+(menuFrame*.5)%6)%W;
    const bh=5+((i*13)%5); // max 9px tall
    const lean=Math.sin(menuFrame*.025+i*.6)*1.5;
    ctx.fillStyle=i%3===0?'#5ecf42':i%3===1?'#48b535':'#3a9428';
    ctx.beginPath();
    ctx.moveTo(bx,gy);
    ctx.quadraticCurveTo(bx+lean,gy-bh*.5,bx+lean*1.2,gy-bh);
    ctx.lineTo(bx+3,gy-bh);
    ctx.quadraticCurveTo(bx+3-lean*.5,gy-bh*.5,bx+3,gy);
    ctx.fill();
  }
  ctx.restore(); // remove clip
  // Soil dots below grass line
  for(let i=0;i<10;i++){ctx.fillStyle='rgba(0,0,0,.12)';ctx.beginPath();ctx.arc((i*97)%W+8,gy+25+(i*9)%20,2.5,0,Math.PI*2);ctx.fill();}
}
function drawPipe(x,topH,gap,pipe){
  const botY=topH+gap,capH=Math.round(H*.037),capW=PIPE_W+9,ox=(capW-PIPE_W)/2;
  ctx.fillStyle=pipe.light;ctx.fillRect(x,0,PIPE_W,topH);ctx.fillRect(x,botY,PIPE_W,H-GROUND_H-botY);
  ctx.fillStyle=pipe.dark;
  ctx.beginPath();ctx.roundRect(x-ox,topH-capH,capW,capH,[0,0,5,5]);ctx.fill();
  ctx.beginPath();ctx.roundRect(x-ox,botY,capW,capH,[5,5,0,0]);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.09)';ctx.fillRect(x+4,0,9,topH);ctx.fillRect(x+4,botY,9,H-GROUND_H-botY);
}
function drawBirdAt(bx,by,angle,wb,skin,alpha){
  const r=BIRD_R;ctx.save();if(alpha!==undefined)ctx.globalAlpha=alpha;
  ctx.translate(bx,by);ctx.rotate(Math.min(Math.max(angle,-.55),Math.PI*1.5));
  ctx.fillStyle=skin.colors[0];ctx.beginPath();ctx.ellipse(0,0,r,r-4,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=skin.colors[1];ctx.beginPath();ctx.ellipse(3,4,r-4,r-8,.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=skin.colors[1];ctx.beginPath();ctx.ellipse(-5,3+wb,11,5,-.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='white';ctx.beginPath();ctx.arc(8,-6,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#111';ctx.beginPath();ctx.arc(9,-6.5,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='white';ctx.beginPath();ctx.arc(10.5,-8,1.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=skin.colors[2];ctx.beginPath();ctx.moveTo(13,-1);ctx.lineTo(22,2);ctx.lineTo(13,5);ctx.closePath();ctx.fill();
  if(currentUser&&currentUser.username===crownUser){ctx.fillStyle='#fac775';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText('👑',-2,-r-4);}
  ctx.restore();
}

function drawTrail(bx,by,trailId){
  if(!trailId||trailId==='none')return;
  const td=TRAIL_DEFS[trailId];if(!td)return;
  if(!trailPoints)trailPoints=[];
  // Attach to BACK/BUTT of bird (left side, opposite the beak)
  const tailX=bx-BIRD_R*1.4;
  const tailY=by+2;
  trailPoints.unshift({x:tailX,y:tailY});
  if(trailPoints.length>28)trailPoints.pop();
  // Draw trail from oldest to newest so newer points appear on top
  for(let i=trailPoints.length-1;i>=1;i--){
    const age=i/trailPoints.length;
    const sz=Math.max(1.5, BIRD_R*(1-age)*.7);
    const alpha=(1-age)*.8;
    ctx.save();ctx.globalAlpha=alpha;
    let col='#fff';
    if(td.rainbow)col='hsl('+(menuFrame*4+i*15)+',100%,60%)';
    else if(td.colors)col=td.colors[i%td.colors.length];
    ctx.fillStyle=col;
    if(td.glow){ctx.shadowColor=td.glow;ctx.shadowBlur=sz*3;}
    const pt=trailPoints[i];
    if(td.heart){ctx.font='bold '+Math.round(sz*1.8)+'px sans-serif';ctx.textAlign='center';ctx.fillText('❤',pt.x,pt.y);}
    else if(td.star){ctx.font='bold '+Math.round(sz*1.8)+'px sans-serif';ctx.textAlign='center';ctx.fillText('⭐',pt.x,pt.y);}
    else if(td.petal){ctx.font='bold '+Math.round(sz*1.8)+'px sans-serif';ctx.textAlign='center';ctx.fillText('🌸',pt.x,pt.y);}
    else{ctx.beginPath();ctx.arc(pt.x,pt.y,sz,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  // Clear shadow after trail
  ctx.shadowBlur=0;
}

// ── Menu ──────────────────────────────────────────────────────────────────────
function initMenuScene(){
  menuBirds=[];for(let i=0;i<4;i++)menuBirds.push({x:Math.random()*W,y:H*.08+Math.random()*H*.55,vy:(Math.random()-.5)*1.5,vx:1+Math.random()*1.8,frame:Math.random()*100,skin:BIRD_SKINS[Math.floor(Math.random()*BIRD_SKINS.length)]});
  menuObjects=[];for(let i=0;i<5;i++)menuObjects.push({type:'coin',x:Math.random()*W,y:Math.random()*H*.8,vy:-.4-.2*Math.random(),life:Math.random()});
  for(let i=0;i<2;i++)menuObjects.push({type:Math.random()>.5?'plane':'ufo',x:-120,y:H*.05+Math.random()*H*.25,speed:1.5+Math.random()*1.5});
}

function menuLoop(){
  menuFrame++;
  // Use sky BG with unique art
  drawGradSky('#0d1b3e','#1a2f6e',menuFrame);
  drawStars(menuFrame);
  // Parallax aurora streaks
  for(let i=0;i<2;i++){const y=H*.25+i*H*.15;ctx.save();ctx.fillStyle='rgba(94,200,245,0.07)';ctx.beginPath();ctx.moveTo(0,y);for(let x=0;x<=W;x+=8)ctx.lineTo(x,y+Math.sin(x/W*Math.PI*3+menuFrame*.02+i)*35);ctx.lineTo(W,y+80);ctx.lineTo(0,y+80);ctx.closePath();ctx.fill();ctx.restore();}
  // Scrolling pipes
  if(menuFrame%Math.round(W/3.2)===0)menuPipes.push({x:W+10,topH:H*.1+Math.random()*H*.42});
  menuPipes.forEach(p=>p.x-=1.6);menuPipes=menuPipes.filter(p=>p.x+PIPE_W>0);
  menuPipes.forEach(p=>drawPipe(p.x,p.topH,H*.36,PIPE_SKINS[0]));
  drawGround();
  // Animated birds
  menuBirds.forEach(b=>{b.frame++;b.vy+=.14;b.y+=b.vy;b.x+=b.vx;if(b.y>H*.68){b.vy=-5.5-Math.random()*2;b.y=H*.68;}if(b.y<H*.06)b.vy=Math.abs(b.vy)*.5;if(b.x>W+60){b.x=-60;b.y=H*.1+Math.random()*H*.5;}drawBirdAt(b.x,b.y,b.vy*.07,Math.sin(b.frame*.22)*4,b.skin);});
  // Objects
  menuObjects.forEach(o=>{
    if(o.type==='coin'){o.y+=o.vy;o.life+=.007;if(o.y<-20||o.life>1){o.x=Math.random()*W;o.y=H*.88;o.life=0;}ctx.save();ctx.globalAlpha=Math.sin(o.life*Math.PI)*.65;ctx.font='bold '+Math.round(H*.025)+'px sans-serif';ctx.textAlign='center';ctx.fillText('🪙',o.x,o.y);ctx.restore();}
    else if(o.type==='plane'||o.type==='ufo'){o.x+=o.speed;if(o.x>W+150)o.x=-120;ctx.save();ctx.font='bold '+Math.round(H*.04)+'px sans-serif';ctx.textAlign='center';ctx.fillText(o.type==='plane'?'✈️':'🛸',o.x,o.y);ctx.restore();}
  });
  ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(0,0,W,H);
  // Animated title
  const pulse=Math.sin(menuFrame*.035)*.04+1;
  const titleSize=Math.round(Math.min(W*.09,H*.07));
  const titleY=H*.11;
  const grd=ctx.createLinearGradient(W/2-200,0,W/2+200,0);
  grd.addColorStop(0,'#5ec8f5');grd.addColorStop(.5,'#ffffff');grd.addColorStop(1,'#fac775');
  ctx.save();ctx.textAlign='center';ctx.shadowColor='#5ec8f5';ctx.shadowBlur=Math.round(18+Math.sin(menuFrame*.06)*7);
  ctx.font='bold '+Math.round(titleSize*pulse)+'px sans-serif';ctx.fillStyle='#fff';ctx.fillText('🐦',W/2,titleY);
  ctx.shadowColor='rgba(0,0,0,.9)';ctx.shadowBlur=14;
  ctx.font='bold '+Math.round(titleSize*.7)+'px sans-serif';ctx.fillStyle=grd;ctx.fillText('FLAPPY MASTER',W/2,titleY+Math.round(titleSize*.86));
  ctx.font=Math.round(titleSize*.28)+'px sans-serif';ctx.fillStyle='rgba(255,255,255,.45)';ctx.fillText('the ultimate flapping experience',W/2,titleY+Math.round(titleSize*1.24));
  ctx.restore();
}

function hubLoop(){
  menuFrame++;
  const eq=getEquipped();
  if(eq.bg&&eq.bg.draw){try{eq.bg.draw(menuFrame);}catch(e){ctx.fillStyle='#0d1b2a';ctx.fillRect(0,0,W,H);}}
  else{ctx.fillStyle='#0d1b2a';ctx.fillRect(0,0,W,H);}
  drawGround();
  if(!window._hubPipes)window._hubPipes=[];
  if(menuFrame%95===0)window._hubPipes.push({x:W+10,topH:H*.12+Math.random()*H*.38});
  window._hubPipes.forEach(p=>p.x-=1.1);
  window._hubPipes=window._hubPipes.filter(p=>p.x+PIPE_W>-20);
  window._hubPipes.forEach(p=>drawPipe(p.x,p.topH,H*.34,eq.pipe));
  if(!window._hubBirds)window._hubBirds=Array.from({length:2},()=>({x:Math.random()*W,y:H*.25+Math.random()*H*.35,vy:-1,vx:.7+Math.random()*.8,frame:0}));
  window._hubBirds.forEach(b=>{b.frame++;b.vy+=.11;b.y+=b.vy;b.x+=b.vx;if(b.y>H*.68){b.vy=-4.2;}if(b.x>W+40){b.x=-40;b.y=H*.2+Math.random()*H*.4;}drawBirdAt(b.x,b.y,b.vy*.07,Math.sin(b.frame*.22)*3,eq.bird,0.22);});
  ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(0,0,W,H);
}
function gameLoop(){
  menuFrame++;frame++;
  const eq=getEquipped();
  const d=gameMode==='ranked'?DIFFS.normal:gameMode==='daily'?DIFFS[activeDailyDiff]:DIFFS[chosenDiff];
  // Clear full canvas first
  ctx.clearRect(0,0,W,H);
  // Draw sky background (clips to H-GROUND_H automatically)
  if(eq.bg&&eq.bg.draw){try{eq.bg.draw(menuFrame);}catch(e){drawGradSky('#87CEEB','#E0F4FF',menuFrame);}}
  else{drawGradSky('#87CEEB','#E0F4FF',menuFrame);}

  // Background objects
  if(frame%200===0)menuObjects.push({type:Math.random()>.4?'plane':'ufo',x:-120,y:H*.03+Math.random()*H*.15,speed:2+Math.random()*2});
  menuObjects=menuObjects.filter(o=>o.x<W+200);
  menuObjects.forEach(o=>{if(o.type==='plane'||o.type==='ufo'){o.x+=o.speed;ctx.save();ctx.font='bold '+Math.round(H*.032)+'px sans-serif';ctx.textAlign='center';ctx.globalAlpha=.4;ctx.fillText(o.type==='plane'?'✈️':'🛸',o.x,o.y);ctx.restore();}});

  // Cutscene — cinematic fly-in with bars
  if(cutsceneActive){
    cutsceneFrame++;
    const CFRAMES=85;
    const prog=Math.min(cutsceneFrame/CFRAMES,1);
    const eased=1-Math.pow(1-prog,3);
    cutsceneBirdX=-80+eased*(BIRD_X()+80);
    const csY=H*.44+Math.sin(prog*Math.PI)*(-H*.1);
    if(prog>=1){if(_cutsceneTO)clearTimeout(_cutsceneTO);cutsceneActive=false;gState='idle';return;}
    // Draw full bg
    if(eq.bg&&eq.bg.draw){try{eq.bg.draw(menuFrame);}catch(e){ctx.fillStyle='#0d1b2a';ctx.fillRect(0,0,W,H);}}
    else{ctx.fillStyle='#0d1b2a';ctx.fillRect(0,0,W,H);}
    drawGround();
    drawBirdAt(cutsceneBirdX,csY,-.25,Math.sin(cutsceneFrame*.25)*5,eq.bird);
    // Cinematic letterbox bars
    const barH=H*.1;
    const barSlide=Math.min(prog*3,1);
    ctx.fillStyle='#000';
    ctx.fillRect(0,0,W,barH*barSlide);
    ctx.fillRect(0,H-barH*barSlide,W,barH*barSlide);
    // Text
    const fadeIn=Math.min((prog-.2)*3,1);
    if(fadeIn>0){
      const fs2=Math.round(H*.042);
      ctx.save();ctx.globalAlpha=fadeIn;
      ctx.fillStyle='white';ctx.textAlign='center';ctx.shadowColor='rgba(0,0,0,.8)';ctx.shadowBlur=14;
      ctx.font='bold '+fs2+'px sans-serif';
      const modeText=gameMode==='daily'?'Daily Challenge':gameMode==='ranked'?'Ranked Match':'Get Ready!';
      ctx.fillText(modeText,W/2,H*.5);
      ctx.font=Math.round(fs2*.46)+'px sans-serif';ctx.fillStyle='rgba(255,255,255,.55)';
      ctx.fillText(gameMode==='ranked'?'first to die loses':gameMode==='daily'?'same pipes for everyone':'tap to flap',W/2,H*.5+fs2*.85);
      ctx.restore();
    }
    return;
  }

  if(gState==='playing'){
    // Slow-mo powerup affects speed
    const speedMult=(activePowerup==='slowmo')?0.45:1;
    const effGravity=GRAVITY*(activePowerup==='slowmo'?0.45:1);
    bird.vy+=effGravity;bird.y+=bird.vy;bird.angle=bird.vy*.08;
    groundOffset+=d.speed*speedMult;
    if(frame%d.freq===0)spawnPipe();
    pipes.forEach(p=>p.x-=d.speed*speedMult);
    pipes=pipes.filter(p=>p.x+PIPE_W>0);
    // Spawn powerup every ~15 pipes, only if none active and hard mode (or any mode)
    if(frame%Math.round(d.freq*15)===0&&!activePowerup&&powerups.length===0){
      const pt=POWERUP_TYPES[Math.floor(Math.random()*POWERUP_TYPES.length)];
      const topH=H*.2+Math.random()*H*.4;
      powerups.push({x:W+60,y:topH,type:pt,collected:false});
    }
    // Move and draw powerups
    powerups.forEach(pw=>{
      pw.x-=d.speed*speedMult;
      if(!pw.collected){
        // Draw powerup icon
        const px=pw.x,py=pw.y;
        const pulse=1+Math.sin(menuFrame*.1)*.08;
        ctx.save();ctx.shadowColor=pw.type.color;ctx.shadowBlur=12;
        ctx.fillStyle=pw.type.color+'33';ctx.beginPath();ctx.arc(px,py,18*pulse,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=pw.type.color;ctx.lineWidth=2;ctx.stroke();
        ctx.fillStyle='#fff';ctx.font='bold '+Math.round(H*.024)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(pw.type.icon,px,py);ctx.textBaseline='alphabetic';
        ctx.restore();
        // Collision
        const dx=BIRD_X()-px,dy=bird.y-py;
        if(Math.sqrt(dx*dx+dy*dy)<BIRD_R+18){
          pw.collected=true;activePowerup=pw.type.id;powerupTimer=pw.type.duration;
          coinPopups.push({x:px,y:py,text:pw.type.label+'!',life:1.2,vy:-2,big:true});
        }
      }
    });
    powerups=powerups.filter(pw=>pw.x>-60);
    // Tick powerup timer
    if(activePowerup){
      powerupTimer--;
      if(powerupTimer<=0)activePowerup=null;
    }
    let hit=false;
    pipes.forEach(p=>{
      if(!p.passed&&p.x+PIPE_W<BIRD_X()){
        p.passed=true;
        const pts=activePowerup==='double'?2:1;
        score+=pts;
        const sc=document.getElementById('hud-score');if(sc)sc.textContent=score;
        if(score>sessionBest){sessionBest=score;const hb=document.getElementById('hud-best');if(hb)hb.textContent=sessionBest;}
        if(currentUser){currentUser.coins=(currentUser.coins||0)+pts;const cd=document.getElementById('hud-coins-disp');if(cd)cd.textContent=currentUser.coins;coinPopups.push({x:p.x+PIPE_W/2,y:H*.38,text:activePowerup==='double'?'+2':'+1',life:1,vy:-1.8});const xpEl=document.getElementById('hud-xp');if(xpEl)xpEl.textContent='+'+score*2+' xp';}
        if(matchId)socket.emit('score_update',{matchId,score});
        playPoint();
      }
      const br=BIRD_R-5;
      // Shield blocks one hit
      if(BIRD_X()+br>p.x&&BIRD_X()-br<p.x+PIPE_W&&(bird.y-br<p.topH||bird.y+br>p.topH+d.gap)){
        if(activePowerup==='shield'){activePowerup=null;powerupTimer=0;coinPopups.push({x:BIRD_X(),y:bird.y,text:'SHIELDED!',life:1.5,vy:-2,big:true});}
        else hit=true;
      }
    });
    if(bird.y+BIRD_R>H-GROUND_H||bird.y-BIRD_R<0)hit=true;
    if(hit){
      gState='dying';deadBird={x:BIRD_X(),y:bird.y,vy:bird.vy-2,vx:1.5,angle:bird.angle,spin:.22};
      spawnFeathers(BIRD_X(),bird.y,eq.bird);playCrunch();trailPoints=[];powerups=[];
      if(matchId)socket.emit('match_died',{matchId,finalScore:score});
      else autoSaveScore();
      const ys=document.getElementById('vs-you-s');if(ys){ys.textContent='dead';ys.className='vs-dead';}
    }
    if(matchId&&frame%3===0)socket.emit('pos_update',{matchId,y:bird.y,angle:bird.angle});
  }
  if(gState==='dying'&&deadBird){
    deadBird.vy+=.5;deadBird.y+=deadBird.vy;deadBird.x+=deadBird.vx;deadBird.angle+=deadBird.spin;
    if(deadBird.y>H-GROUND_H-BIRD_R){deadBird.y=H-GROUND_H-BIRD_R;deadBird.vy*=-.28;deadBird.vx*=.55;deadBird.spin*=.35;if(Math.abs(deadBird.vy)<.5){gState='dead';deadBird=null;}}
    if(deadBird&&deadBird.y>H+80){gState='dead';deadBird=null;}
  }

  pipes.forEach(p=>drawPipe(p.x,p.topH,d.gap,eq.pipe));
  drawGround();

  particles.forEach(p=>{ctx.save();ctx.globalAlpha=p.life;ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.color;ctx.beginPath();ctx.ellipse(0,0,p.size,p.size*.4,0,0,Math.PI*2);ctx.fill();ctx.restore();p.x+=p.vx;p.y+=p.vy;p.vy+=.12;p.life-=.022;p.rot+=p.rotV;});
  particles=particles.filter(p=>p.life>0);
  coinPopups.forEach(p=>{ctx.save();ctx.globalAlpha=p.life;ctx.fillStyle='#fac775';ctx.font='bold '+Math.round(p.big?H*.03:H*.021)+'px sans-serif';ctx.textAlign='center';if(p.big){ctx.shadowColor='#fac775';ctx.shadowBlur=10;}ctx.fillText(p.text,p.x,p.y);ctx.restore();p.y+=p.vy;p.life-=.018;});
  coinPopups=coinPopups.filter(p=>p.life>0);

  if(gState==='playing'&&eq.trail!=='none')drawTrail(BIRD_X(),bird.y,eq.trail);

  if(matchId&&opponentSkin){const gSkin=BIRD_SKINS.find(s=>s.id===opponentSkin.bird)||BIRD_SKINS[1];drawBirdAt(BIRD_X()+45,ghostY,ghostAngle,0,gSkin,.4);ctx.save();ctx.globalAlpha=.35;ctx.fillStyle='white';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText(opponentName||'opp',BIRD_X()+45,ghostY-BIRD_R-8);ctx.restore();}

  if(deadBird)drawBirdAt(deadBird.x,deadBird.y,deadBird.angle,0,eq.bird);
  else if(gState!=='dead')drawBirdAt(BIRD_X(),bird.y,bird.angle,gState==='playing'?Math.sin(frame*.25)*5:0,eq.bird);

  const fs=Math.round(H*.042);
  if(gState==='playing'){
    ctx.fillStyle='white';ctx.textAlign='center';ctx.font='bold '+fs+'px sans-serif';ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=8;ctx.fillText(score,W/2,H*.09);ctx.shadowBlur=0;
    // Powerup HUD
    if(activePowerup){
      const pt=POWERUP_TYPES.find(p=>p.id===activePowerup);
      if(pt){
        const barW=120,barH=6,barX=W/2-barW/2,barY=H*.13;
        ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.roundRect(barX-8,barY-22,barW+16,32,[8]);ctx.fill();
        ctx.fillStyle=pt.color;ctx.font='bold '+Math.round(fs*.38)+'px sans-serif';ctx.textAlign='center';ctx.fillText(pt.icon+' '+pt.label,W/2,barY-8);
        ctx.fillStyle='rgba(255,255,255,.2)';ctx.beginPath();ctx.roundRect(barX,barY,barW,barH,[3]);ctx.fill();
        ctx.fillStyle=pt.color;const prog=powerupTimer/pt.duration;ctx.beginPath();ctx.roundRect(barX,barY,barW*prog,barH,[3]);ctx.fill();
      }
    }
  }
  if(gState==='idle'){ctx.fillStyle='rgba(0,0,0,.42)';ctx.fillRect(0,0,W,H);ctx.fillStyle='white';ctx.textAlign='center';ctx.shadowColor='rgba(0,0,0,.7)';ctx.shadowBlur=10;ctx.font='bold '+fs+'px sans-serif';ctx.fillText('tap to start',W/2,H/2-fs*.3);ctx.font=Math.round(fs*.44)+'px sans-serif';ctx.fillStyle='rgba(255,255,255,.6)';ctx.fillText(gameMode==='daily'?'daily challenge':gameMode==='ranked'?'ranked — first to die loses':'difficulty: '+chosenDiff+' · ×'+DIFFS[chosenDiff].mult+' score',W/2,H/2+fs*.55);ctx.shadowBlur=0;}
  if(gState==='dead'){
    ctx.fillStyle='rgba(0,0,0,.52)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='white';ctx.textAlign='center';ctx.shadowColor='rgba(0,0,0,.7)';ctx.shadowBlur=10;
    ctx.font='bold '+fs+'px sans-serif';ctx.fillText('game over',W/2,H/2-fs*.65);
    ctx.font=Math.round(fs*.44)+'px sans-serif';ctx.fillStyle='rgba(255,255,255,.75)';ctx.fillText('score: '+score,W/2,H/2+fs*.05);
    if(!currentUser){ctx.font=Math.round(fs*.32)+'px sans-serif';ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillText('create account to save scores & earn coins',W/2,H/2+fs*1.4);}
    ctx.shadowBlur=0;
    showDeadButtons();
  } else hideDeadButtons();
}

// ── Main loop — visibility-aware to prevent tab-switch pausing ──────────────
let _tabHidden=false;
document.addEventListener('visibilitychange',()=>{
  _tabHidden=document.hidden;
  // When tab becomes visible again, reset game physics timing
  if(!_tabHidden&&gState==='playing'){
    // Skip physics for frames missed while hidden by forcing a resetable flag
    bird.vy=Math.min(bird.vy,2); // don't let velocity accumulate while hidden
  }
});
function mainLoop(){
  if(!_tabHidden||!isGameScreen){
    if(isGameScreen)gameLoop();
    else if(document.getElementById('hub').classList.contains('active'))hubLoop();
    else menuLoop();
  }
  requestAnimationFrame(mainLoop);
}

async function loadMenuLb(){
  const el=document.getElementById('menu-lb');if(!el)return;
  const rows=await apiFetch('/api/leaderboard?diff=normal');
  if(rows.length>0)crownUser=rows[0].username;
  el.innerHTML='<div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;">🏆 normal leaderboard</div>'+renderLbHTML(rows.slice(0,4),'score');
}

(async function init(){
  initMenuScene();resetGame();gState='idle';
  document.getElementById('music-track').textContent=TRACKS[0].name;
  // Auto-play on any first interaction
  const _sm=()=>{
    if(!musicPlaying){playGeneratedTrack(TRACKS[currentTrackIdx].gen);document.getElementById('music-track').textContent=TRACKS[currentTrackIdx].name;}
    ['click','keydown','touchstart'].forEach(e=>document.removeEventListener(e,_sm));
  };
  ['click','keydown','touchstart'].forEach(e=>document.addEventListener(e,_sm));
  if(authToken){const data=await apiFetch('/api/me');if(data.user){currentUser=data.user;socket.emit('set_identity',{token:authToken});goHub();}else{authToken=null;localStorage.removeItem('fm_token');}}
  loadMenuLb();requestAnimationFrame(mainLoop);
})();
