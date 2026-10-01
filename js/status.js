/* Original pixel HUD. Read-only real simulation data, refreshed four times a second. */
(function(root){
  'use strict';
  function clock(seconds){const total=Math.floor(seconds);return Math.floor(total/60)+':'+String(total%60).padStart(2,'0');}
  const art={
    heart:['.bb...bb.','brhb.brrb','brrrrrrrb','brrrrrrrb','.brrrrrb.','..brrrb..','...brb...','....b....','.........'],
    shield:['.bbbbbbb.','.bsssssb.','.bshsssb.','.bshsssb.','..bsssb..','..bsssb..','...bsb...','....b....','.........'],
    sword:['.........hh.','........hsb.','.......hsb..','......hsb...','.....hsb....','..g.hsb.....','...gsb......','...bg.......','..bbb.g.....','.bwb........','bwb.........','bb..........'],
    gold:['............','...ggggg....','..ghhhhgb...','.ghggggggb..','.ghggggggb..','.ghggggggb..','.ggggggggb..','..ggggggb...','...bbbb.....','............','............','............'],
    skull:['............','...ssssss...','..shhhhhsb..','..shhhhhsb..','..sbbhbbsb..','..sbbhbbsb..','..shhshhsb..','...shhhsb...','...bsbsb....','....bbbb....','............','............'],
    stairs:['............','.......sssb.','.......shhb.','.....ssshhb.','.....shhhhb.','...ssshhhhb.','...shhhhhhb.','.ssshhhhhhb.','.shhhhhhhhb.','.bbbbbbbbbb.','............','............'],
    clock:['............','...ssssss...','..shhhhhsb..','.shhhhhhhsb.','.shhbbhhhsb.','.shhbhhhhsb.','.shhbsshhsb.','.shhhhhhhhs.','..shhhhhsb..','...bbbbbb...','............','............'],
    map:['............','.wwwwwwwwww.','.whhhhhhhgw.','.whwwwhhhgw.','.whhwhghhgw.','.whhwhghhgw.','.whhhwghhgw.','.whhhwwhhgw.','.whhhhghhhw.','.wwwwwwwwww.','............','............'],
    tunic:['............','..eeeeeeee..','.eeehhhheee.','eeeehhhhheee','eeeheehheeee','bb.eeeeee.bb','...eeheee...','...eeheee...','...eeeeee...','...bbbbbb...','............','............'],
    potion:['....bbbb....','....wwww....','....bhhb....','...bshhsb...','..bshhhhssb.','..bshhhhssb.','..bsreeersb.','..bseeeeess.','..bsreeeess.','...bsssssb..','....bbbbb...','............']
  };
  const palette={b:'#121c20',r:'#e9534e',s:'#a3b8bb',h:'#e8e6d6',g:'#eac259',w:'#9c7750',e:'#69beb3'};
  function icon(kind,ghost){
    const rows=art[kind],size=kind==='heart'||kind==='shield'?9:12;
    let svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+size+' '+size+'" aria-hidden="true" focusable="false">';
    rows.forEach((line,y)=>Array.from(line).forEach((color,x)=>{if(color!=='.')svg+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+(ghost?(color==='b'?'#0c1317':'#405052'):palette[color])+'"/>';}));
    return svg+'</svg>';
  }
  function create(){
    // Several HUD locations can present the same value (run, biome and level).
    const fields=new Map();
    for(const el of document.querySelectorAll('[data-field]')){const name=el.dataset.field;if(!fields.has(name))fields.set(name,[]);fields.get(name).push(el);}
    for(const el of document.querySelectorAll('[data-icon]'))el.innerHTML=icon(el.dataset.icon,false);
    const health=document.querySelector('.health'),armor=document.querySelector('.armor-meter'),xp=document.querySelector('.experience'),xpFill=xp.querySelector('i'),log=document.getElementById('action-log');
    function makeMeter(bar,kind){const fills=[];for(let i=0;i<10;i++){
      const cell=document.createElement('span'),fill=document.createElement('span');cell.className='meter-icon';cell.innerHTML=icon(kind,true);fill.className='icon-fill';fill.innerHTML=icon(kind,false);cell.append(fill);bar.append(cell);fills.push(fill);
    }return fills;}
    const hearts=makeMeter(health,'heart'),shields=makeMeter(armor,'shield');
    const portrait=document.getElementById('portrait').getContext('2d');portrait.imageSmoothingEnabled=false;portrait.scale(3,3);root.DungeonSprites.draw(portrait,'hero',10,10,0,0,false,false,0,0,false);
    let logId=-1;
    function meter(bar,fills,value,max){
      const amount=Math.max(0,Math.min(max,value));bar.setAttribute('aria-valuenow',amount);bar.setAttribute('aria-valuemax',max);
      for(let i=0;i<fills.length;i++){
        const cut=(1-Math.max(0,Math.min(1,amount/max*10-i)))*100,clip='inset(0 '+cut.toFixed(2)+'% 0 0)';
        if(fills[i].style.clipPath!==clip)fills[i].style.clipPath=clip;
      }
    }
    function update(s){const h=s.hero,r=s.runStats,b=s.best;
      let revealed=0;for(let i=0;i<s.dungeon.tiles.length;i++)if(s.dungeon.tiles[i]===1&&s.dungeon.seen[i])revealed++;
      const values={depthPadded:String(s.depth).padStart(2,'0'),run:s.run,location:s.dungeon.theme.name,bestDepth:b.depth,bestKills:b.kills,bestSurvival:clock(b.survival),deaths:s.deaths,hp:Math.max(0,h.hp)+' / '+h.maxHp,guard:h.defense+' / 3',heroLevel:h.level,xp:h.xp+' / '+(h.level*12),attack:h.attack+h.level,depth:s.depth+' / '+r.turns,kills:r.kills,gold:h.gold,survival:clock(r.time),revealed:Math.round(revealed/s.dungeon.floorCount*100)+'%',weapon:'Iron blade'+(h.attack>5?' +'+(h.attack-5):''),armor:h.defense>0?'Tunic · guard '+h.defense:"Traveler's tunic",potionCount:h.potions,potionsUsed:r.potions,intent:s.intent};
      for(const[name,value]of Object.entries(values))for(const el of fields.get(name)||[]){const text=String(value);if(el.textContent!==text)el.textContent=text;}
      meter(health,hearts,h.hp,h.maxHp);meter(armor,shields,h.defense,3);
      xpFill.style.width=Math.max(0,Math.min(100,h.xp/(h.level*12)*100))+'%';xp.setAttribute('aria-valuenow',h.xp);xp.setAttribute('aria-valuemax',h.level*12);
      const id=s.events.length?s.events[s.events.length-1].id:0;
      if(id!==logId){logId=id;const entries=s.events.slice(-18).reverse().map(event=>{const li=document.createElement('li'),stamp=document.createElement('time'),text=document.createElement('span');li.className=event.type;stamp.textContent=clock(event.time);text.textContent=event.text;li.append(stamp,text);return li;});log.replaceChildren(...entries);}
    }
    return{update};
  }
  root.DungeonStatus={create};
})(typeof globalThis!=='undefined'?globalThis:window);
