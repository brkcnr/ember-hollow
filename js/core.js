/* Original autonomous roguelike simulation; no DOM, input or dependencies. */
(function(root){
  'use strict';
  const WIDTH=960, HEIGHT=540, COLS=48, ROWS=25, TILE=18;
  const DIRS=[[1,0],[0,1],[-1,0],[0,-1]];
  const THEMES=[{wall:'#7b87b5',floor:'#253141',mist:'#475776'}, {wall:'#83a6a0',floor:'#253934',mist:'#42645d'}, {wall:'#a28caa',floor:'#382b3d',mist:'#615069'}];
  const NAMES=['Skeleton','Moss zombie','Cave spider'];
  function report(s,text,type='journey'){s.eventId++;s.events.push({id:s.eventId,time:s.time,text,type});if(s.events.length>64)s.events.shift();}
  function records(s){s.best.depth=Math.max(s.best.depth,s.depth);s.best.kills=Math.max(s.best.kills,s.runStats.kills);s.best.survival=Math.max(s.best.survival,s.runStats.time);}
  function runStats(){return{kills:0,potions:0,turns:0,time:0};}
  function hash(text){let h=2166136261; for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function random(seed){let n=seed>>>0;return function(){n=(n+0x6D2B79F5)>>>0;let t=Math.imul(n^(n>>>15),n|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
  const key=(x,y)=>y*COLS+x;
  function floor(d,x,y){return x>=0&&x<COLS&&y>=0&&y<ROWS&&d.tiles[key(x,y)]===1;}
  function generate(seed,run,depth){
    const rand=random(hash(seed+':'+run+':'+depth)), tiles=new Uint8Array(COLS*ROWS), rooms=[];
    function carve(x,y){if(x>0&&x<COLS-1&&y>0&&y<ROWS-1)tiles[key(x,y)]=1;}
    for(let attempt=0;attempt<240&&rooms.length<13;attempt++){
      const w=5+Math.floor(rand()*5),h=4+Math.floor(rand()*4),x=2+Math.floor(rand()*(COLS-w-4)),y=2+Math.floor(rand()*(ROWS-h-4));
      if(rooms.some(r=>x<r.x+r.w+2&&x+w+2>r.x&&y<r.y+r.h+2&&y+h+2>r.y))continue;
      rooms.push({x,y,w,h,cx:x+Math.floor(w/2),cy:y+Math.floor(h/2)});
      for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)carve(xx,yy);
    }
    // A connected tree with occasional extra passages: every generated room is reachable.
    function join(a,b){let x=a.cx,y=a.cy;const horiz=rand()>.5;
      while(x!==b.cx||y!==b.cy){carve(x,y);if((horiz&&x!==b.cx)||y===b.cy)x+=Math.sign(b.cx-x);else y+=Math.sign(b.cy-y);}carve(x,y);
    }
    for(let i=1;i<rooms.length;i++){
      let closest=rooms[0],best=Infinity;
      for(let j=0;j<i;j++){const d=Math.abs(rooms[i].cx-rooms[j].cx)+Math.abs(rooms[i].cy-rooms[j].cy);if(d<best){best=d;closest=rooms[j];}}
      join(rooms[i],closest);
    }
    for(let i=0;i<2;i++)join(rooms[Math.floor(rand()*rooms.length)],rooms[Math.floor(rand()*rooms.length)]);
    // Begin in a central chamber, keeping the initial scene visible on different displays.
    const start=rooms.reduce((a,b)=>Math.hypot(a.cx-24,a.cy-12)<Math.hypot(b.cx-24,b.cy-12)?a:b);
    const end=rooms.reduce((a,b)=>Math.abs(a.cx-start.cx)+Math.abs(a.cy-start.cy)>Math.abs(b.cx-start.cx)+Math.abs(b.cy-start.cy)?a:b);
    const occupied=new Set([key(start.cx,start.cy),key(end.cx,end.cy)]),enemies=[],items=[],torches=[];
    function place(r){for(let i=0;i<30;i++){const x=r.x+1+Math.floor(rand()*(r.w-2)),y=r.y+1+Math.floor(rand()*(r.h-2)),k=key(x,y);if(!occupied.has(k)){occupied.add(k);return{x,y};}}return null;}
    rooms.forEach((r,i)=>{
      torches.push({x:r.x-.15,y:r.y+r.h*.5,phase:rand()*10});
      torches.push({x:r.x+r.w-.85,y:r.y+1,phase:rand()*10});
      if(r!==start){const p=place(r);if(p)enemies.push({...p,px:p.x,py:p.y,id:i,type:i%3,hp:7+depth*3+(i%3)*2,hit:0,cooldown:0,phase:rand()*6,facing:0});}
      const p=place(r);if(p)items.push({...p,type:r===start?'potion':['gold','potion','relic'][i%3],taken:false});
    });
    return{tiles,rooms,start:{x:start.cx,y:start.cy},exit:{x:end.cx,y:end.cy},enemies,items,torches,seen:new Uint8Array(COLS*ROWS),visible:new Uint8Array(COLS*ROWS),visited:new Uint8Array(COLS*ROWS),floorCount:tiles.reduce((sum,t)=>sum+t,0),theme:THEMES[(depth-1)%3],artSeed:hash(seed+':art:'+run+':'+depth)};
  }
  function sight(d,x0,y0,x1,y1){let dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx-dy;
    while(x0!==x1||y0!==y1){if(!floor(d,x0,y0))return false;const e=err*2;if(e>-dy){err-=dy;x0+=sx;}if(e<dx){err+=dx;y0+=sy;}}
    return true;
  }
  function reveal(s){const d=s.dungeon,h=s.hero;d.visible.fill(0);
    for(let y=Math.max(0,h.y-8);y<=Math.min(ROWS-1,h.y+8);y++)for(let x=Math.max(0,h.x-8);x<=Math.min(COLS-1,h.x+8);x++){
      if(Math.hypot(x-h.x,y-h.y)<=8&&sight(d,h.x,h.y,x,y)){d.visible[key(x,y)]=1;d.seen[key(x,y)]=1;}
    }
    const k=key(h.x,h.y);if(!d.visited[k]){d.visited[k]=1;s.explored++;}
    for(const r of d.rooms)if(!r.discovered&&h.x>=r.x&&h.x<r.x+r.w&&h.y>=r.y&&h.y<r.y+r.h){r.discovered=true;report(s,'Discovered a new chamber.','explore');}
  }
  function path(d,start,goal){const previous=new Int16Array(COLS*ROWS).fill(-1),queue=[key(start.x,start.y)],target=key(goal.x,goal.y);previous[queue[0]]=queue[0];
    for(let i=0;i<queue.length;i++){const k=queue[i];if(k===target)break;for(const[dx,dy]of DIRS){const x=k%COLS+dx,y=Math.floor(k/COLS)+dy,n=key(x,y);if(floor(d,x,y)&&previous[n]===-1){previous[n]=k;queue.push(n);}}}
    if(previous[target]===-1)return[];const result=[];let k=target;while(k!==queue[0]){result.push({x:k%COLS,y:Math.floor(k/COLS)});k=previous[k];}return result.reverse();
  }
  function facing(dx,dy){return Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy<0?2:0);}
  function newHero(){return{x:0,y:0,px:0,py:0,rx:0,ry:0,face:1,facing:0,aimX:1,aimY:0,hp:36,maxHp:36,attack:5,defense:0,level:1,xp:0,potions:1,gold:0,hit:0,slash:0,heal:0};}
  function create(seed){const s={seed:String(seed),run:1,depth:1,time:0,turn:0,tick:.22,age:0,hero:newHero(),dungeon:null,explored:0,particles:[],effects:[],transition:null,kills:0,deaths:0,descents:0,loot:0,goal:null,intent:'Exploring',events:[],eventId:0,runStats:runStats(),best:{depth:1,kills:0,survival:0}};load(s);return s;}
  function load(s){s.dungeon=generate(s.seed,s.run,s.depth);const h=s.hero;h.x=h.px=h.rx=s.dungeon.start.x;h.y=h.py=h.ry=s.dungeon.start.y;h.hit=h.slash=h.heal=0;s.explored=0;s.age=0;s.turn=0;s.tick=.3;s.goal=null;s.intent='Exploring';s.particles.length=0;s.effects.length=0;reveal(s);report(s,s.depth===1?'Run '+s.run+' · an adventurer enters the dungeon.':'Descended to depth '+s.depth+'.');records(s);}
  function burst(s,x,y,color,count){const rand=random(hash(s.seed+':'+s.time+':'+x+':'+y));for(let i=0;i<count&&s.particles.length<120;i++)s.particles.push({x,y,vx:(rand()-.5)*3,vy:(rand()-.5)*3,life:.3+rand()*.5,color});}
  function effect(s,x,y,color){if(s.effects.length<12)s.effects.push({x,y,color,life:.7});}
  function attack(s,e){const h=s.hero;s.intent='Fighting · '+NAMES[e.type].toLowerCase();h.face=e.x-h.x||h.face;h.aimX=e.x-h.x;h.aimY=e.y-h.y;h.facing=facing(h.aimX,h.aimY);h.slash=.24;e.hp-=h.attack+h.level;e.hit=.22;burst(s,e.x,e.y,'#e6b97c',6);
    if(e.hp<=0){s.kills++;s.runStats.kills++;h.xp+=4+s.depth;h.gold+=2;report(s,'Defeated '+NAMES[e.type].toLowerCase()+' · +'+(4+s.depth)+' XP.','loot');burst(s,e.x,e.y,'#8cd3bd',12);if(h.xp>=h.level*12){h.xp-=h.level*12;h.level++;h.maxHp+=5;h.hp=Math.min(h.maxHp,h.hp+13);effect(s,h.x,h.y,'#e8ca85');report(s,'Reached level '+h.level+' · health restored.','level');}}
    else report(s,'Struck '+NAMES[e.type].toLowerCase()+' for '+(h.attack+h.level)+'.','combat');
  }
  function takeItems(s){const h=s.hero;for(const item of s.dungeon.items){if(!item.taken&&item.x===h.x&&item.y===h.y){item.taken=true;s.loot++;if(item.type==='potion'){h.potions++;report(s,'Found a healing potion.','heal');}else if(item.type==='gold'){h.gold+=8;report(s,'Collected 8 gold.','loot');}else{h.attack+=1;h.defense=Math.min(3,h.defense+.25);report(s,'Ancient relic strengthened blade and armor.','loot');}effect(s,h.x,h.y,item.type==='potion'?'#69c7ba':'#e8c784');}}}
  function target(s){const d=s.dungeon,h=s.hero;
    // Threats first; loot next; then the nearest unvisited revealed floor.
    let route=[],best=Infinity;
    for(const e of d.enemies){if(e.hp<=0||!d.visible[key(e.x,e.y)]||Math.abs(e.x-h.x)+Math.abs(e.y-h.y)>6)continue;const p=path(d,h,e);if(p.length<best){best=p.length;route=p;}}
    if(route.length){s.intent='Approaching a creature';return route;}
    if(s.explored/d.floorCount>.76||s.age>105){s.intent='Finding the stairs';return path(d,h,d.exit);}
    for(const item of d.items){if(!item.taken&&d.seen[key(item.x,item.y)]){const p=path(d,h,item);if(p.length&&p.length<best){best=p.length;route=p;}}}
    if(route.length){s.intent='Collecting supplies';return route;}
    // A BFS frontier avoids picking inaccessible corners or getting stuck in corridors.
    const q=[{x:h.x,y:h.y}],seen=new Uint8Array(COLS*ROWS);seen[key(h.x,h.y)]=1;
    for(let i=0;i<q.length;i++){const p=q[i];if(d.seen[key(p.x,p.y)]&&!d.visited[key(p.x,p.y)]){s.intent='Exploring';return path(d,h,p);}
      for(const[dx,dy]of DIRS){const x=p.x+dx,y=p.y+dy,k=key(x,y);if(floor(d,x,y)&&!seen[k]){seen[k]=1;q.push({x,y});}}
    }
    s.intent='Finding the stairs';return path(d,h,d.exit);
  }
  function turn(s){const h=s.hero,d=s.dungeon;s.turn++;s.runStats.turns++;
    if(h.hp<h.maxHp*.48&&h.potions>0){const healed=Math.min(20,h.maxHp-h.hp);h.potions--;s.runStats.potions++;h.hp=Math.min(h.maxHp,h.hp+20);h.heal=.8;effect(s,h.x,h.y,'#7fd4c3');report(s,'Used a potion · restored '+healed+' health.','heal');}
    const adjacent=d.enemies.find(e=>e.hp>0&&Math.abs(e.x-h.x)+Math.abs(e.y-h.y)<=1);
    if(adjacent)attack(s,adjacent);
    else{
      const route=target(s),next=route[0];s.goal=route[route.length-1]||null;
      if(next){const blocker=d.enemies.find(e=>e.hp>0&&e.x===next.x&&e.y===next.y);if(blocker)attack(s,blocker);else{h.px=h.x;h.py=h.y;h.face=next.x-h.x||h.face;h.facing=facing(next.x-h.x,next.y-h.y);h.x=next.x;h.y=next.y;reveal(s);takeItems(s);}}
    }
    for(const e of d.enemies){if(e.hp<=0)continue;const dist=Math.abs(e.x-h.x)+Math.abs(e.y-h.y);
      if(dist<=1&&e.cooldown<=0){const damage=Math.max(1,2+s.depth+e.type-h.defense);h.hp-=damage;h.hit=.2;e.cooldown=.95;burst(s,h.x,h.y,'#d77581',5);report(s,NAMES[e.type]+' dealt '+damage+' damage.','combat');}
      else if(dist>1&&dist<7&&d.visible[key(e.x,e.y)]&&s.turn%3===e.id%3){const p=path(d,e,h)[0];if(p&&!(p.x===h.x&&p.y===h.y)&&!d.enemies.some(other=>other!==e&&other.hp>0&&other.x===p.x&&other.y===p.y)){e.facing=facing(p.x-e.x,p.y-e.y);e.px=e.x;e.py=e.y;e.x=p.x;e.y=p.y;}}
    }
    if(h.hp<=0){s.deaths++;s.intent='Fallen · a new run begins';report(s,'Run '+s.run+' ended at depth '+s.depth+' · '+s.runStats.kills+' kills.','combat');s.transition={elapsed:0,kind:'death',swapped:false};burst(s,h.x,h.y,'#e9be8b',24);}
    else if(h.x===d.exit.x&&h.y===d.exit.y&&(s.explored/d.floorCount>.76||s.age>105)){s.intent='Descending';s.transition={elapsed:0,kind:'descend',swapped:false};}
    records(s);
  }
  function update(s,dt){if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.1);s.time+=dt;s.age+=dt;const h=s.hero;
    if(!s.transition&&h.hp>0)s.runStats.time+=dt;
    records(s);
    h.hit=Math.max(0,h.hit-dt);h.slash=Math.max(0,h.slash-dt);h.heal=Math.max(0,h.heal-dt);
    const blend=1-Math.exp(-dt*19);h.rx+=(h.x-h.rx)*blend;h.ry+=(h.y-h.ry)*blend;
    for(const e of s.dungeon.enemies){e.hit=Math.max(0,e.hit-dt);e.cooldown=Math.max(0,e.cooldown-dt);e.px+=(e.x-e.px)*blend;e.py+=(e.y-e.py)*blend;}
    for(let i=s.particles.length-1;i>=0;i--){const p=s.particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.life<=0)s.particles.splice(i,1);}
    for(let i=s.effects.length-1;i>=0;i--){s.effects[i].life-=dt;if(s.effects[i].life<=0)s.effects.splice(i,1);}
    if(s.transition){s.transition.elapsed+=dt;if(!s.transition.swapped&&s.transition.elapsed>=1.6){if(s.transition.kind==='death'){s.run++;s.depth=1;s.hero=newHero();s.runStats=runStats();}else{s.depth++;s.descents++;h.hp=Math.min(h.maxHp,h.hp+6);}load(s);s.transition.swapped=true;}if(s.transition.elapsed>=2.8)s.transition=null;return;}
    s.tick-=dt;if(s.tick<=0){s.tick+=.26;turn(s);}
  }
  const api={WIDTH,HEIGHT,COLS,ROWS,TILE,DIRS,THEMES,hash,random,key,floor,generate,path,reveal,create,update};root.DungeonCore=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
