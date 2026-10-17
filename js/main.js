// Main: build the timeline, then draw whichever scene owns time T.
build();
function render(T) {
  ctx.clearRect(0, 0, W, H);
  const s = sceneAt(T), lt = T - s.start;
  if (s.render) s.render(T, lt, s); else renderStreet(T); // street scenes share one renderer
  if (s.overlay) s.overlay(T, lt, s);
}
window.render = render;
window.ready = (async () => {
  await Promise.all(['60px Lilita', '800 60px Fraunces', 'italic 800 60px Fraunces', '900 60px Nunito', 'italic 700 60px Nunito', '700 60px Nunito', 'italic 800 60px Nunito'].map(f => document.fonts.load(f)));
  LOGO = new Image(); LOGO.src = 'logo.svg'; await LOGO.decode(); return true;
})();
window.frame = async (t, q = .93) => { render(t); return cv.toDataURL('image/jpeg', q); };
