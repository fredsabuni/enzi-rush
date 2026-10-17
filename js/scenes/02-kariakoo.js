// SCENE 2 — KARIAKOO (ride). Out of the door into the market at dawn; ollie a chicken and a crate stack.
// jumps: [seconds into scene, obstacle]; beans: [from, to, spacing] in scene seconds.
scene({
  id: 'kariakoo', dur: 2.5, kind: 'ride', zone: 0, banner: .15,
  jumps: [[.6, 'kuku'], [1.45, 'crate']],
  beans: [[.45, 2.0]],
  overlay(T, lt) { if (lt < .45) irisMask(SX, GY - 220, lerp(0, 1400, easeOut(win(lt, 0, .45)))); },
});
