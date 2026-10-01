/* Generation, lifecycle and long-run checks; no dependencies. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../js/core.js');
assert.deepEqual(C.generate('repeatable',2,3),C.generate('repeatable',2,3));
assert.notDeepEqual(C.generate('repeatable',2,3).tiles,C.generate('different',2,3).tiles);
for(let i=0;i<500;i++){
  const d=C.generate('generation-'+i,1,1),seen=new Set([C.key(d.start.x,d.start.y)]),q=[d.start];
  for(let j=0;j<q.length;j++)for(const[dx,dy]of C.DIRS){const x=q[j].x+dx,y=q[j].y+dy,k=C.key(x,y);if(C.floor(d,x,y)&&!seen.has(k)){seen.add(k);q.push({x,y});}}
  assert.equal(seen.size,d.floorCount,'Every floor tile must be reachable');
  assert.ok(C.path(d,d.start,d.exit).length>0,'Stairs reachable');
  assert.ok(d.rooms.length>=5,'Several distinct rooms');
  for(const thing of [...d.enemies,...d.items])assert.ok(C.floor(d,thing.x,thing.y));
}
const invalid=C.create('invalid');for(const dt of [NaN,Infinity,0,-1])C.update(invalid,dt);assert.equal(invalid.time,0);
const death=C.create('death');death.runStats.kills=12;death.runStats.time=42;death.depth=8;death.hero.hp=0;death.hero.potions=0;death.tick=0;C.update(death,.1);assert.equal(death.transition.kind,'death');
for(let i=0;i<35;i++)C.update(death,.1);assert.equal(death.run,2);assert.equal(death.depth,1);assert.equal(death.hero.hp,36);assert.equal(death.transition,null);assert.equal(death.runStats.kills,0);assert.equal(death.best.kills,12);assert.equal(death.best.depth,8);assert.equal(death.best.survival,42);assert.ok(death.events.some(e=>e.text.includes('Run 1 ended')));
const descent=C.create('descent');descent.dungeon.enemies.forEach(e=>e.hp=0);descent.hero.x=descent.dungeon.exit.x;descent.hero.y=descent.dungeon.exit.y;descent.age=106;descent.tick=0;C.update(descent,.1);assert.equal(descent.transition.kind,'descend');
for(let i=0;i<35;i++)C.update(descent,.1);assert.equal(descent.depth,2);assert.equal(descent.transition,null);
let floors=0,deaths=0,maxParticles=0;
for(const seed of ['cloister','ash','crypt','zero','999999','long run']){
  const s=C.create(seed);
  for(let i=0;i<12*3600*10;i++){
    C.update(s,.1);
    assert.ok(s.age<180,'AI must finish a floor or restart within three minutes');
    assert.ok(C.floor(s.dungeon,s.hero.x,s.hero.y),'Hero stays on walkable tiles');
    assert.ok(Number.isFinite(s.hero.rx)&&Number.isFinite(s.hero.ry)&&Number.isFinite(s.hero.hp));
    assert.ok(s.events.length<=64&&s.best.depth>=s.depth&&s.best.kills>=s.runStats.kills,'Status data and log stay consistent');
    assert.ok(s.particles.length<=120&&s.effects.length<=12,'Bounded effects');
    assert.ok(s.dungeon.enemies.length<=13&&s.dungeon.items.length<=13);
    maxParticles=Math.max(maxParticles,s.particles.length);
  }
  assert.ok(s.descents>100&&s.kills>500&&s.loot>500,'Exploration, combat and collection continue');
  assert.ok(s.deaths>0,'Death/restart occurs');floors+=s.descents;deaths+=s.deaths;
  console.log(`${seed}: 12 simulated hours; ${s.descents} descents, ${s.deaths} restarts, ${s.kills} kills, ${s.loot} pickups`);
}
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');for(const m of html.matchAll(/(?:src|href)="(\.\/[^"?]+)"/g))assert.ok(fs.existsSync(path.join(__dirname,'..',m[1])));
console.log(`PASS: 500 connected maps, death/descent lifecycle, 72 simulated hours, ${floors} descents, ${deaths} restarts; peak particles ${maxParticles}.`);
