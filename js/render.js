/* Original block cave artwork, cached pixel textures and atmospheric animation. */
(function(root){
  'use strict';
  const C=root.DungeonCore,W=C.WIDTH,H=C.HEIGHT,T=C.TILE,OX=(W-C.COLS*T)/2,OY=(H-C.ROWS*T)/2;
  const sx=x=>OX+(x+.5)*T,sy=y=>OY+(y+.5)*T;
  function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
  function glow(c,x,y,r,color,alpha){c.save();c.globalAlpha*=alpha;c.globalCompositeOperation='screen';const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
  function texture(theme,material,wall,variant){
    const canvas=document.createElement('canvas');canvas.width=T;canvas.height=T;
    const c=canvas.getContext('2d'),rand=C.random(C.hash(theme.id+':'+material+':'+wall+':'+variant));
    const base=(wall?theme.rock:theme.ground)[material];
    rect(c,base,0,0,T,T);
    // Broad squared mineral facets make each tile read as a block, even at small sizes.
    for(let i=0;i<9;i++){
      c.globalAlpha=.10+rand()*.15;
      rect(c,i%2?'#030510':'#fff0d2',1+Math.floor(rand()*6)*2,1+Math.floor(rand()*6)*2,2+Math.floor(rand()*3)*2,2+Math.floor(rand()*2)*2);
    }
    c.globalAlpha=1;
    if(wall){
      rect(c,'rgba(246,231,206,.18)',0,0,T,2);
      rect(c,'rgba(255,255,255,.07)',0,2,2,T-5);
      rect(c,'rgba(0,0,0,.36)',0,T-5,T,5);
      rect(c,'rgba(0,0,0,.28)',T-2,2,2,T-2);
      rect(c,'rgba(255,255,255,.1)',1,T-5,T-3,1);
      rect(c,'rgba(0,0,0,.2)',1,7,5,1);rect(c,'rgba(0,0,0,.17)',9,3,1,5);
    }else{
      rect(c,'rgba(255,246,221,.07)',0,0,T-1,1);
      rect(c,'rgba(0,0,0,.26)',0,T-1,T,1);rect(c,'rgba(0,0,0,.22)',T-1,0,1,T);
      if(material===1&&theme.id==='stone'){
        for(let i=0;i<6;i++)rect(c,i%2?'#5c785b':'#355b4b',2+Math.floor(rand()*6)*2,2+Math.floor(rand()*6)*2,3,2);
      }
      if(material===2&&theme.id==='ember'){
        rect(c,'#c47735',4,4,5,1);rect(c,'#c47735',8,5,1,4);rect(c,'#e9a34b',9,8,4,1);
      }
    }
    return canvas;
  }
  function createRenderer(canvas){
    const c=canvas.getContext('2d',{alpha:false});c.imageSmoothingEnabled=false;
    let artSeed=-1,noise=[],atlas=null;
    const dust=Array.from({length:70},(_,i)=>{const r=C.random(i+247);return{x:r()*W,y:r()*H,v:r()*3+1,phase:r()*6};});
    const silhouettes=Array.from({length:16},(_,i)=>{const r=C.random(i+811);return{x:r()*W,y:r()*H,w:18+r()*50,h:30+r()*90};});
    const vignette=c.createRadialGradient(W/2,H/2,170,W/2,H/2,580);vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,0,0,.46)');
    function liquid(d,x,y,time,light){
      const theme=d.theme,k=C.key(x,y),kind=d.tiles[k],px=OX+x*T,py=OY+y*T;
      const colors=kind===2?['#173f4d','#2a7180','#78bfc2']:kind===3?['#c14521','#ef7b28','#ffd069']:['#151023','#50336d','#b27ddb'];
      c.globalAlpha=light;rect(c,colors[0],px,py,T,T);
      const pulse=Math.sin(time*(kind===3?2:1)+noise[k]*6)*.5+.5;
      c.globalAlpha=light*(.28+pulse*.23);rect(c,colors[1],px+2,py+2,T-4,T-4);
      const shift=Math.floor(time*(kind===3?2:1)+noise[k]*7)%6;
      c.globalAlpha=light*.65;
      if(kind===4){rect(c,colors[2],px+3+shift,py+6,1,1);rect(c,colors[1],px+10-shift,py+12,2,1);}
      else{rect(c,colors[2],px+3,py+4+shift,6,1);rect(c,colors[1],px+9,py+12-shift,5,2);}
      // Exposed banks give water, lava and chasms an inset edge.
      c.globalAlpha=light;
      for(const[dx,dy]of C.DIRS)if(C.floor(d,x+dx,y+dy)){
        if(dx)rect(c,theme.rock[0],px+(dx>0?T-2:0),py,2,T);
        else rect(c,theme.rock[0],px,py+(dy>0?T-2:0),T,2);
      }
      if(kind===3&&d.visible[k])glow(c,sx(x),sy(y),29,theme.accent,.16+pulse*.06);
    }
    function draw(s){
      const d=s.dungeon,h=s.hero,time=s.time,theme=d.theme;
      if(artSeed!==d.artSeed){
        artSeed=d.artSeed;const rand=C.random(artSeed);noise=Array.from({length:C.COLS*C.ROWS},()=>rand());
        atlas=[false,true].map(wall=>Array.from({length:3},(_,m)=>Array.from({length:8},(_,v)=>texture(theme,m,wall,v))));
      }
      c.globalAlpha=1;c.globalCompositeOperation='source-over';rect(c,theme.back,0,0,W,H);
      // Huge distant stone silhouettes drift separately from the stable gameplay grid.
      for(const p of silhouettes){const drift=Math.sin(time*.035+p.x)*5;c.globalAlpha=.065;
        rect(c,theme.rock[0],p.x+drift,p.y,p.w,p.h);rect(c,theme.rock[1],p.x+drift+5,p.y+p.h*.3,p.w-5,p.h*.7);
      }
      c.globalAlpha=1;glow(c,sx(h.rx),sy(h.ry),165,theme.mist,.15);
      for(let y=1;y<C.ROWS-1;y++)for(let x=1;x<C.COLS-1;x++){
        const k=C.key(x,y),seen=d.seen[k],visible=d.visible[k],tile=d.tiles[k];
        if(!seen)continue;
        if(tile===0&&!C.DIRS.some(([dx,dy])=>d.tiles[C.key(x+dx,y+dy)]>0))continue;
        const distance=Math.hypot(x-h.rx,y-h.ry),light=visible?Math.max(.56,1-distance/19):.36;
        if(tile>1){liquid(d,x,y,time,light);continue;}
        c.globalAlpha=light;
        c.drawImage(atlas[tile===0?1:0][d.materials[k]][Math.floor(noise[k]*8)],OX+x*T,OY+y*T);
        if(tile===0){
          const ore=d.ores[k];
          if(ore){const color=theme.ore[ore-1];
            for(let i=0;i<4;i++){const ox=3+((i*5+Math.floor(noise[k]*17))%10),oy=3+((i*3+Math.floor(noise[k]*13))%8);rect(c,color,OX+x*T+ox,OY+y*T+oy,3,2);rect(c,'rgba(255,255,255,.24)',OX+x*T+ox,OY+y*T+oy,1,1);}
            if(visible&&((theme.id==='void')||(theme.id==='ember'&&ore===1)))glow(c,sx(x),sy(y),22,color,.18);
          }
          // Crystal formations grow from selected walls, never from a walkable route.
          if(noise[k]>.89&&theme.id!=='ember'){
            const px=sx(x),py=sy(y),color=theme.id==='void'?'#bd91e0':'#73c9c5';
            rect(c,'#273842',px-3,py-5,6,10);rect(c,color,px-2,py-7,3,10);rect(c,'#e5def0',px-1,py-7,1,7);rect(c,color,px+2,py-3,3,7);
            if(visible)glow(c,px,py,23,color,.12);
          }
        }else if(d.visited[k]){
          c.globalAlpha=visible?.18:.07;rect(c,'#e3cfaa',sx(x)-3,sy(y)+4,1,1);rect(c,'#e3cfaa',sx(x)+2,sy(y)+2,1,1);
        }
      }
      c.globalAlpha=1;
      for(const t of d.torches){const x=Math.round(t.x),y=Math.round(t.y),k=C.key(x,y);if(!d.seen[k])continue;
        c.globalAlpha=d.visible[k]?1:.25;const flicker=.8+Math.sin(time*9+t.phase)*.1+Math.sin(time*17+t.phase)*.06;
        glow(c,sx(t.x),sy(t.y),45,theme.torch,flicker*.24);
        rect(c,'#48382c',sx(t.x)-1,sy(t.y),3,6);rect(c,theme.torch,sx(t.x)-2,sy(t.y)-4,4,4);rect(c,theme.id==='void'?'#ead3ff':'#ffe1a0',sx(t.x)-1,sy(t.y)-3-flicker,2,3);
      }
      c.globalAlpha=1;
      const ek=C.key(d.exit.x,d.exit.y);
      if(d.seen[ek]){
        const x=sx(d.exit.x),y=sy(d.exit.y);c.globalAlpha=d.visible[ek]?1:.38;
        rect(c,'#24242e',x-8,y-10,16,19);rect(c,theme.accent,x-5,y-8,10,15);
        c.globalAlpha*=.65+.12*Math.sin(time*3);rect(c,theme.back,x-3,y-6,6,11);
        rect(c,theme.rock[0],x-8,y-10,3,19);rect(c,theme.rock[0],x+5,y-10,3,19);rect(c,theme.rock[2],x-8,y-10,16,3);
        if(d.visible[ek])glow(c,x,y,35,theme.accent,.19);
      }
      for(const item of d.items){const k=C.key(item.x,item.y);if(item.taken||!d.seen[k])continue;c.globalAlpha=d.visible[k]?(.85+Math.sin(time*2+item.x)*.1):.3;
        const x=sx(item.x),y=sy(item.y),color=item.type==='potion'?'#7dc5bb':'#e9bd66';
        if(d.visible[k])glow(c,x,y,18,color,.12);
        if(item.type==='gold'){rect(c,'#765029',x-4,y+1,8,4);rect(c,'#e9bd66',x-4,y,8,2);rect(c,'#ffdf97',x-2,y-3,5,3);rect(c,'#fff0b6',x-2,y-3,2,1);}
        else if(item.type==='relic'){rect(c,'#52496c',x-3,y-5,6,9);rect(c,'#c0a8ea',x-2,y-4,4,7);rect(c,'#f0e1ff',x-1,y-3,1,4);}
        else{rect(c,'#b9d4ce',x-1,y-5,3,2);rect(c,'#507e82',x-3,y-3,7,7);rect(c,'#90d3c1',x-2,y,5,3);rect(c,'#d2ebe0',x-2,y-2,1,2);}
      }
      c.globalAlpha=1;
      for(const e of d.enemies){const k=C.key(e.x,e.y);if(e.hp<=0){if(d.seen[k]){c.globalAlpha=.24;rect(c,'#b5b2a8',sx(e.x)-4,sy(e.y),8,2);rect(c,'#b5b2a8',sx(e.x)-1,sy(e.y)-3,2,6);}continue;}if(!d.visible[k])continue;
        c.globalAlpha=1;const x=sx(e.px),y=sy(e.py),color=e.hit>0?'#fff1c9':['#ba8b9d','#7bbfb2','#aaa5d3'][e.type];
        glow(c,x,y,22,color,.09);const moving=Math.hypot(e.x-e.px,e.y-e.py)>.03;DungeonSprites.draw(c,['skeleton','zombie','spider'][e.type],x,y,e.facing||0,Math.floor(time*9+e.phase)%2,moving,e.hit>0,time,e.phase,false);
      }
      c.globalAlpha=1;
      const hx=sx(h.rx),hy=sy(h.ry),alive=h.hp>0;
      if(alive){
        glow(c,hx,hy,46,h.heal>0?'#72d5c4':'#f0b65e',.20);glow(c,hx,hy,15,'#f5ce87',.12);
        c.strokeStyle='rgba(227,190,121,'+(.14+Math.sin(time*2)*.04)+')';c.lineWidth=1;c.beginPath();c.arc(hx,hy,12,0,Math.PI*2);c.stroke();
        DungeonSprites.draw(c,'hero',hx,hy,h.facing||0,Math.floor(time*10)%2,Math.hypot(h.x-h.rx,h.y-h.ry)>.03,h.hit>0,time,0,false);
        if(h.slash>0){const a=1-h.slash/.24,angle=Math.atan2(h.aimY,h.aimX);c.globalAlpha=h.slash/.24;c.strokeStyle='#e8d3a5';c.lineWidth=2;c.beginPath();c.arc(hx,hy,19,angle-1.1,angle-1.1+a*2.2);c.stroke();c.globalAlpha=1;}
      }else{c.globalAlpha=Math.max(0,1-s.transition.elapsed);DungeonSprites.draw(c,'hero',hx,hy,h.facing||0,0,false,false,time,0,true);c.globalAlpha=1;}
      for(const e of s.effects){c.globalAlpha=e.life/.7;c.strokeStyle=e.color;c.lineWidth=1;c.beginPath();c.arc(sx(e.x),sy(e.y),8+(1-e.life/.7)*26,0,Math.PI*2);c.stroke();}
      for(const p of s.particles){c.globalAlpha=Math.min(1,p.life*2);rect(c,p.color,sx(p.x),sy(p.y),2,2);}
      // Tiny spores, rising cinders or void motes; a few broad fog ribbons stay in the background.
      for(const p of dust){
        const x=(p.x+time*p.v*(theme.id==='void'?.4:1))%W,y=theme.id==='ember'?((p.y-time*p.v*3)%H+H)%H:p.y+Math.sin(time*.2+p.phase)*7;
        c.globalAlpha=.10+Math.max(0,Math.sin(time*.7+p.phase))*.17;rect(c,theme.particle,x,y,theme.id==='ember'?2:1,1);
      }
      for(let i=0;i<4;i++){const y=H*(i+.4)/4+Math.sin(time*.06+i)*17;c.globalAlpha=.018;c.fillStyle=theme.mist;c.fillRect(0,y,W,14);}
      c.globalAlpha=.025;for(let y=0;y<H;y+=3)rect(c,'#000000',0,y,W,1);
      c.globalAlpha=1;c.fillStyle=vignette;c.fillRect(0,0,W,H);
      if(s.transition){const t=s.transition.elapsed,alpha=s.transition.kind==='death'?Math.max(0,(t-.5)/.9):t/1.3;c.globalAlpha=s.transition.swapped?Math.max(0,(2.8-t)/.9):Math.min(1,alpha);rect(c,theme.back,0,0,W,H);c.globalAlpha=1;}
    }
    return{draw};
  }
  root.DungeonRender={createRenderer};
})(typeof globalThis!=='undefined'?globalThis:window);
