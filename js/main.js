(function () {
  'use strict';
  const query = new URLSearchParams(location.search);
  const seed = query.get('seed') || String(Date.now());
  if (query.get('hud') === '0') document.body.classList.add('ambient');
  const status = DungeonStatus.create();
  const fps = query.get('fps') === '60' ? 60 : 30;
  const step = 1/30, interval = 1000/fps;
  const state = DungeonCore.create(seed);
  const renderer = DungeonRender.createRenderer(document.getElementById('dungeon'));
  let previous = null, lastDraw = -Infinity, lastReport = -Infinity, accumulator = 0;
  renderer.draw(state);
  status.update(state);
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { previous=null; accumulator=0; return; }
    if (previous === null) previous=now;
    accumulator += Math.min((now-previous)/1000,.1);
    previous=now;
    while (accumulator >= step) { DungeonCore.update(state,step); accumulator-=step; }
    if (now-lastReport >= 250) { status.update(state); lastReport=now; }
    if (now-lastDraw >= interval-1) { renderer.draw(state); lastDraw=now; }
  }
  document.addEventListener('visibilitychange',function () { previous=null; accumulator=0; });
  requestAnimationFrame(frame);
})();
