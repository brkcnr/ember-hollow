/* Read-only presentation of real simulation data, refreshed four times a second. */
(function(root){
  'use strict';
  function clock(seconds){const total=Math.floor(seconds);return Math.floor(total/60)+':'+String(total%60).padStart(2,'0');}
  function create(){
    const fields=new Map(Array.from(document.querySelectorAll('[data-field]'),el=>[el.dataset.field,el]));
    const bar=document.querySelector('.health'),fill=bar.querySelector('i'),log=document.getElementById('action-log');
    let logId=-1;
    function update(s){const h=s.hero,r=s.runStats,b=s.best;
      let revealed=0;for(let i=0;i<s.dungeon.tiles.length;i++)if(s.dungeon.tiles[i]&&s.dungeon.seen[i])revealed++;
      const values={depthPadded:String(s.depth).padStart(2,'0'),run:s.run,location:['Drowned cloister','Verdant crypt','Ash cathedral'][(s.depth-1)%3],bestDepth:b.depth,bestKills:b.kills,bestSurvival:clock(b.survival),deaths:s.deaths,hp:Math.max(0,h.hp)+' / '+h.maxHp,combat:(h.attack+h.level)+' / '+h.defense,level:h.level+' · '+h.xp+' / '+(h.level*12),turns:s.depth+' / '+r.turns,wealth:r.kills+' / '+h.gold,survival:clock(r.time),revealed:Math.round(revealed/s.dungeon.floorCount*100)+'%',weapon:'Iron blade'+(h.attack>5?' +'+(h.attack-5):''),armor:h.defense>0?'Tunic · guard '+h.defense:"Traveler's tunic",potions:h.potions+' / '+r.potions,intent:s.intent};
      for(const[name,value]of Object.entries(values)){const text=String(value),el=fields.get(name);if(el&&el.textContent!==text)el.textContent=text;}
      fill.style.width=Math.max(0,Math.min(100,h.hp/h.maxHp*100))+'%';
      bar.setAttribute('aria-valuenow',Math.max(0,h.hp));bar.setAttribute('aria-valuemax',h.maxHp);
      const id=s.events.length?s.events[s.events.length-1].id:0;
      if(id!==logId){logId=id;const entries=s.events.slice(-18).reverse().map(event=>{const li=document.createElement('li'),stamp=document.createElement('time'),text=document.createElement('span');li.className=event.type;stamp.textContent=clock(event.time);text.textContent=event.text;li.append(stamp,text);return li;});log.replaceChildren(...entries);}
    }
    return{update};
  }
  root.DungeonStatus={create};
})(typeof globalThis!=='undefined'?globalThis:window);
