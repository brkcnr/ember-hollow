/* Original, hand-drawn blocky sprites. Each character fits inside an 18px tile. */
(function(root){
  'use strict';
  const palettes={
    hero:{outline:'#182330',hair:'#493021',hairLight:'#70503b',skin:'#bb875f',skinLight:'#e0ad7c',eye:'#d8e8e9',pupil:'#415d78',shirt:'#36a6a4',shirtLight:'#62c7bb',shirtDark:'#227478',pants:'#445b9b',pantsLight:'#647abe',boots:'#263648'},
    zombie:{outline:'#162822',hair:'#284635',hairLight:'#426043',skin:'#668e51',skinLight:'#96b769',eye:'#cee295',pupil:'#293b30',shirt:'#447f79',shirtLight:'#69998c',shirtDark:'#315d5c',pants:'#4d4d73',pantsLight:'#696489',boots:'#263b35'}
  };
  function block(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(x,y,w,h);}
  function shadow(c){c.save();c.globalAlpha*=.45;block(c,'#03060b',-6,6,12,2);c.restore();}
  function humanoid(c,p,facing,frame,moving){
    const side=facing===1||facing===3,back=facing===2,step=moving?(frame?1:-1):0;
    shadow(c);
    // Legs alternate by one pixel; the head stays still while arms counter-swing.
    block(c,p.outline,-4,3,8,5);
    block(c,p.pants,-3,3,3,3+Math.max(0,step));block(c,p.pantsLight,1,3,3,3+Math.max(0,-step));
    block(c,p.boots,-3,6+Math.max(0,step),3,1);block(c,p.boots,1,6+Math.max(0,-step),3,1);
    block(c,p.outline,-6,-2,12,6);
    block(c,p.shirt,-4,-2,8,5);block(c,p.shirtDark,-4,2,8,1);block(c,p.shirtLight,-3,-1,2,3);
    block(c,p.shirt,-6,-1-step,2,3);block(c,p.shirtDark,4,-1+step,2,3);
    block(c,p.skin,-6,2-step,2,2);block(c,p.skinLight,4,2+step,2,2);
    block(c,p.outline,-5,-8,10,7);
    block(c,p.skin,-4,-7,8,6);block(c,p.skinLight,-3,-6,6,4);
    block(c,p.hair,-4,-7,8,2);block(c,p.hairLight,-3,-7,3,1);
    if(back){block(c,p.hair,-4,-6,8,5);block(c,p.hairLight,-3,-5,2,2);block(c,p.shirtDark,-1,-1,2,3);}
    else if(side){const edge=facing===1?3:-4;block(c,p.hair,facing===1?-4:1,-6,3,5);block(c,p.eye,edge,-4,1,1);block(c,p.pupil,edge,-3,1,1);block(c,p.hair,facing===1?1:-3,-2,3,1);}
    else{block(c,p.hair,-4,-5,1,3);block(c,p.hair,3,-5,1,3);block(c,p.eye,-3,-4,2,1);block(c,p.eye,1,-4,2,1);block(c,p.pupil,-2,-4,1,1);block(c,p.pupil,1,-4,1,1);block(c,p.hair,-2,-2,4,1);}
  }
  function skeleton(c,facing,frame,moving){
    const bone='#c0c4b0',light='#e1dfc5',shade='#7d928e',dark='#202c33',step=moving?(frame?1:-1):0;
    shadow(c);block(c,dark,-4,-8,9,8);block(c,bone,-3,-7,7,6);block(c,light,-2,-7,5,2);
    if(facing!==2){block(c,dark,facing===1?2:-2,-4,facing===0?2:1,2);if(facing===0)block(c,dark,1,-4,2,2);block(c,shade,-1,-2,3,1);}
    else block(c,shade,-2,-3,5,1);
    block(c,shade,0,-1,1,6);for(let y=0;y<4;y+=2){block(c,bone,-3,y,7,1);block(c,light,-2,y,2,1);}
    block(c,bone,-5,-1-step,1,5);block(c,shade,5,-1+step,1,5);
    block(c,bone,-2,4,1,3+Math.max(0,step));block(c,light,2,4,1,3+Math.max(0,-step));
    block(c,shade,-3,7,2,1);block(c,shade,2,7,2,1);
    // A splintered bow makes the silhouette different from the humanoids.
    block(c,'#796947',7,-4,1,9);block(c,'#aa9461',6,-5,1,2);block(c,'#aa9461',6,4,1,2);
  }
  function spider(c,frame,moving,time,phase){
    const step=moving?(frame?1:-1):0;shadow(c);
    for(const sign of [-1,1])for(let i=0;i<3;i++){
      const y=-4+i*4;block(c,'#51465f',sign<0?-7:4,y+step*(i%2?1:-1),3,1);block(c,'#7b647d',sign<0?-8:7,y-1,1,3);
    }
    block(c,'#201e2e',-5,-5,10,10);block(c,'#554657',-4,-5,8,7);block(c,'#796279',-3,-4,5,2);block(c,'#382e43',-4,1,8,4);
    block(c,'#968296',-2,-3,2,1);block(c,'#d77b79',-3,2,2,1);block(c,'#d77b79',1,2,2,1);block(c,'#e7c1a0',-2,4,1,1);block(c,'#e7c1a0',2,4,1,1);
  }
  function draw(c,kind,x,y,facing,frame,moving,hit,time,phase,dead){
    c.save();c.translate(Math.round(x),Math.round(y));
    if(dead)c.rotate(Math.PI/2);
    if(hit)c.globalAlpha*=.55+.4*(Math.sin(time*75)>0?1:0);
    if(kind==='hero'||kind==='zombie')humanoid(c,palettes[kind],facing,frame,moving);
    else if(kind==='skeleton')skeleton(c,facing,frame,moving);
    else spider(c,frame,moving,time,phase);
    if(kind==='hero'){
      // Small pale blade hangs at the right hip until the combat arc takes over.
      block(c,'#bfd4ca',7,1,1,5);block(c,'#7f9c97',6,4,1,2);block(c,'#c5a474',6,0,3,1);
    }
    c.restore();
  }
  root.DungeonSprites={draw};
})(typeof globalThis!=='undefined'?globalThis:window);
