/* Original luminous dungeon artwork and blocky pixel characters. */
(function(root){
  'use strict';
  const C=root.DungeonCore,W=C.WIDTH,H=C.HEIGHT,T=C.TILE,OX=(W-C.COLS*T)/2,OY=(H-C.ROWS*T)/2;
  const sx=x=>OX+(x+.5)*T,sy=y=>OY+(y+.5)*T;
  function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
  function glow(c,x,y,r,color,alpha){c.save();c.globalAlpha*=alpha;c.globalCompositeOperation='screen';const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
  function glyph(c,text,x,y,color,size,shine){c.font=size+'px Menlo, Consolas, monospace';c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.shadowColor=color;c.shadowBlur=shine;c.fillText(text,Math.round(x),Math.round(y)+1);c.shadowBlur=0;}
  function createRenderer(canvas){
    const c=canvas.getContext('2d',{alpha:false});c.imageSmoothingEnabled=false;
    let artSeed=-1,noise=[],ornaments=[];
    const dust=Array.from({length:60},(_,i)=>{const r=C.random(i+247);return{x:r()*W,y:r()*H,v:r()*2+.6,phase:r()*6};});
    const vignette=c.createRadialGradient(W/2,H/2,100,W/2,H/2,550);vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,0,0,.6)');
    function draw(s){
      const d=s.dungeon,h=s.hero,time=s.time;
      if(artSeed!==d.artSeed){artSeed=d.artSeed;const rand=C.random(artSeed);noise=Array.from({length:C.COLS*C.ROWS},()=>rand());ornaments=d.rooms.map(r=>({...r,style:Math.floor(rand()*3)}));}
      c.globalAlpha=1;c.globalCompositeOperation='source-over';rect(c,'#05070d',0,0,W,H);
      // Nearly invisible architecture beyond the explored area adds depth to the darkness.
      for(const r of ornaments){c.globalAlpha=.025;c.strokeStyle=d.theme.wall;c.lineWidth=1;c.strokeRect(OX+r.x*T-5,OY+r.y*T-5,r.w*T+10,r.h*T+10);}
      c.globalAlpha=1;
      glow(c,sx(h.rx),sy(h.ry),185,'#293046',.17);
      for(let y=1;y<C.ROWS-1;y++)for(let x=1;x<C.COLS-1;x++){
        const k=C.key(x,y),seen=d.seen[k],visible=d.visible[k],isFloor=d.tiles[k]===1;
        if(!seen)continue;
        if(!isFloor&&!C.DIRS.some(([dx,dy])=>C.floor(d,x+dx,y+dy)))continue;
        const distance=Math.hypot(x-h.rx,y-h.ry),light=visible?Math.max(.32,1-distance/11):.22;
        c.globalAlpha=light;
        if(isFloor){
          rect(c,d.theme.floor,OX+x*T,OY+y*T,T-1,T-1);
          c.globalAlpha=light*.85;
          rect(c,noise[k]>.7?'#647080':'#495568',sx(x),sy(y),noise[k]>.85?2:1,1);
          if(d.visited[k]){c.globalAlpha=visible?.22:.08;rect(c,'#d3b97e',sx(x)-3,sy(y)+4,1,1);rect(c,'#d3b97e',sx(x)+2,sy(y)+2,1,1);}
        }else{
          rect(c,'#151a29',OX+x*T+1,OY+y*T+1,T-2,T-2);
          glyph(c,'#',sx(x),sy(y),d.theme.wall,14,visible?3:0);
          c.globalAlpha=light*.3;rect(c,d.theme.wall,OX+x*T+2,OY+y*T+1,T-4,1);
        }
      }
      c.globalAlpha=1;
      // Torches attach to the inside edge of room walls.
      for(const t of d.torches){const x=Math.round(t.x),y=Math.round(t.y),k=C.key(x,y);if(!d.seen[k])continue;
        c.globalAlpha=d.visible[k]?1:.18;const flicker=.8+Math.sin(time*9+t.phase)*.1+Math.sin(time*17+t.phase)*.06;
        glow(c,sx(t.x),sy(t.y),40,'#ae6535',flicker*.17);
        rect(c,'#8e573a',sx(t.x)-1,sy(t.y),3,5);rect(c,'#d78e43',sx(t.x)-2,sy(t.y)-4,4,4);rect(c,'#f8ce82',sx(t.x)-1,sy(t.y)-3-flicker,2,3);
      }
      c.globalAlpha=1;
      if(d.seen[C.key(d.exit.x,d.exit.y)]){c.globalAlpha=d.visible[C.key(d.exit.x,d.exit.y)]?.75:.2;glyph(c,'>',sx(d.exit.x),sy(d.exit.y),'#a4bed1',17,4);}
      for(const item of d.items){const k=C.key(item.x,item.y);if(item.taken||!d.seen[k])continue;c.globalAlpha=d.visible[k]?(.75+Math.sin(time*2+item.x)*.15):.23;
        const x=sx(item.x),y=sy(item.y),color=item.type==='potion'?'#7dc5bb':'#cbae6d';
        if(d.visible[k])glow(c,x,y,18,color,.1);
        if(item.type==='gold')glyph(c,'$',x,y,color,13,3);
        else if(item.type==='relic')glyph(c,'+',x,y,color,15,4);
        else{rect(c,'#b9d4ce',x-1,y-5,3,2);rect(c,'#507e82',x-3,y-3,7,7);rect(c,'#90d3c1',x-2,y,5,3);rect(c,'#d2ebe0',x-2,y-2,1,2);}
      }
      c.globalAlpha=1;
      for(const e of d.enemies){const k=C.key(e.x,e.y);if(e.hp<=0){if(d.seen[k]){c.globalAlpha=.13;glyph(c,'×',sx(e.x),sy(e.y),'#9998a6',11,0);}continue;}if(!d.visible[k])continue;
        c.globalAlpha=.9;const x=sx(e.px),y=sy(e.py),color=e.hit>0?'#fff1c9':['#ba8b9d','#7bbfb2','#aaa5d3'][e.type];
        glow(c,x,y,22,color,.11);const moving=Math.hypot(e.x-e.px,e.y-e.py)>.03;DungeonSprites.draw(c,['skeleton','zombie','spider'][e.type],x,y,e.facing||0,Math.floor(time*9+e.phase)%2,moving,e.hit>0,time,e.phase,false);
      }
      c.globalAlpha=1;
      // A softly lit pixel adventurer anchors the map.
      const hx=sx(h.rx),hy=sy(h.ry),alive=h.hp>0;
      if(alive){
        glow(c,hx,hy,46,h.heal>0?'#72d5c4':'#f0b65e',.23);
        glow(c,hx,hy,15,'#f5ce87',.18);
        c.strokeStyle='rgba(227,190,121,'+(.18+Math.sin(time*2)*.04)+')';c.lineWidth=1;c.beginPath();c.arc(hx,hy,12,0,Math.PI*2);c.stroke();
        DungeonSprites.draw(c,'hero',hx,hy,h.facing||0,Math.floor(time*10)%2,Math.hypot(h.x-h.rx,h.y-h.ry)>.03,h.hit>0,time,0,false);
        if(h.slash>0){const a=1-h.slash/.24,angle=Math.atan2(h.aimY,h.aimX);c.globalAlpha=h.slash/.24;c.strokeStyle='#e8d3a5';c.lineWidth=2;c.beginPath();c.arc(hx,hy,19,angle-1.1,angle-1.1+a*2.2);c.stroke();c.globalAlpha=1;}
      }else{c.globalAlpha=Math.max(0,1-s.transition.elapsed);DungeonSprites.draw(c,'hero',hx,hy,h.facing||0,0,false,false,time,0,true);c.globalAlpha=1;}
      for(const e of s.effects){c.globalAlpha=e.life/.7;c.strokeStyle=e.color;c.lineWidth=1;c.beginPath();c.arc(sx(e.x),sy(e.y),8+(1-e.life/.7)*26,0,Math.PI*2);c.stroke();}
      for(const p of s.particles){c.globalAlpha=Math.min(1,p.life*2);rect(c,p.color,sx(p.x),sy(p.y),2,2);}
      c.globalAlpha=1;
      // Sparse dust and subtle scanlines give a quiet CRT-like texture.
      for(const p of dust){c.globalAlpha=.05+Math.max(0,Math.sin(time*.7+p.phase))*.08;rect(c,'#a8b2c4',(p.x+time*p.v)%W,p.y+Math.sin(time*.2+p.phase)*5,1,1);}
      c.globalAlpha=.07;for(let y=0;y<H;y+=3)rect(c,'#000000',0,y,W,1);c.globalAlpha=1;c.fillStyle=vignette;c.fillRect(0,0,W,H);
      if(s.transition){const t=s.transition.elapsed,alpha=s.transition.kind==='death'?Math.max(0,(t-.5)/.9):t/1.3;c.globalAlpha=s.transition.swapped?Math.max(0,(2.8-t)/.9):Math.min(1,alpha);rect(c,'#05070d',0,0,W,H);c.globalAlpha=1;}
    }
    return{draw};
  }
  root.DungeonRender={createRenderer};
})(typeof globalThis!=='undefined'?globalThis:window);
