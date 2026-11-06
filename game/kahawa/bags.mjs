// Coffee bag drawings for Kahawa Iko Wapi?, shared by the server (which draws the hidden outlines)
// and the phone (which colours a bag in once it is found).
// Every bag is drawn in a box 1 unit tall, centred on 0,0, then moved, sized and turned into place.

// Parts are drawn in order. `role` picks the fill colour; parts without a role are line details.
export const KINDS = {
  // stand-up pouch with a crimped top, a valve and a front label
  pouch: [
    { role: 'body', d: 'M-.34-.36L.34-.36L.36 .44Q.36 .5 .3 .5L-.3 .5Q-.36 .5-.36 .44Z' },
    { role: 'band', d: 'M-.34-.5L.34-.5L.34-.36L-.34-.36Z' },
    { d: 'M-.34-.45L.34-.45' },
    { role: 'label', d: 'M-.22-.17H.22Q.26-.17 .26-.13V.25Q.26 .29 .22 .29H-.22Q-.26 .29-.26 .25V-.13Q-.26-.17-.22-.17Z' },
    { d: 'M.03-.28A.035 .035 0 1 1 .029-.28Z' },
  ],
  // jute sack tied at the neck
  sack: [
    { role: 'body', d: 'M-.16-.32C-.4-.2-.43 .3-.33 .44Q-.3 .5-.2 .5L.2 .5Q.3 .5 .33 .44C.43 .3 .4-.2 .16-.32Z' },
    { role: 'band', d: 'M-.16-.33L-.25-.5Q0-.43 .25-.5L.16-.33Z' },
    { role: 'tie', d: 'M-.19-.37H.19V-.3H-.19Z' },
    { role: 'label', d: 'M-.19-.1H.19Q.23-.1 .23-.06V.25Q.23 .29 .19 .29H-.19Q-.23 .29-.23 .25V-.06Q-.23-.1-.19-.1Z' },
    { d: 'M-.3-.12Q-.34 .1-.3 .4M.3-.12Q.34 .1 .3 .4', dash: true },
  ],
  // paper bag with the top rolled over and a tin tie
  fold: [
    { role: 'body', d: 'M-.32-.32L.32-.32L.35 .5L-.35 .5Z' },
    { role: 'band', d: 'M-.32-.5L.32-.5L.32-.32L-.32-.32Z' },
    { d: 'M-.32-.4L.32-.4' },
    { role: 'tie', d: 'M-.39-.46H.39V-.42H-.39Z' },
    { role: 'label', d: 'M.19 .1A.19 .19 0 1 1 .189 .09Z' },
    { d: 'M-.2 .5L-.17-.32M.2 .5L.17-.32', thin: true },
  ],
};
export const KIND_NAMES = Object.keys(KINDS);

// the bean printed on every label, centre of the label
const BEAN = { pouch: [0, .07], sack: [0, .1], fold: [0, .1] };
const beanPath = ([x, y]) => `M${x} ${y - .1}C${x + .09} ${y - .1} ${x + .09} ${y + .1} ${x} ${y + .1}C${x - .09} ${y + .1} ${x - .09} ${y - .1} ${x} ${y - .1}Z`;
const beanLine = ([x, y]) => `M${x + .01} ${y - .09}C${x - .04} ${y - .03} ${x + .04} ${y + .03} ${x - .01} ${y + .09}`;

// HZE colours. Found bags turn orange; the one golden bag a day turns gold.
export const PALETTES = {
  outline: { body: '#fff', band: '#fff', tie: '#fff', label: '#fff', bean: '#fff', ink: '#1f1a17' },
  color: { body: '#C4510E', band: '#D4A559', tie: '#291810', label: '#FFFBF5', bean: '#4a2414', ink: '#291810' },
  gold: { body: '#E8C27A', band: '#C4510E', tie: '#291810', label: '#FFFBF5', bean: '#C4510E', ink: '#5a3a10' },
};

// One bag as an SVG <g>. b = { x, y, s (height in scene pixels), r (degrees), kind, flip }.
// `line` is the stroke width in scene pixels, so bags match the line weight of the drawing.
export function bagSvg(b, palette = 'outline', line = 3, extra = '') {
  const c = PALETTES[palette], parts = KINDS[b.kind] || KINDS.pouch, w = line / b.s;
  const stroke = (t = 1) => `stroke="${c.ink}" stroke-width="${(w * t).toFixed(4)}"`;
  const body = parts.map(p => p.role
    ? `<path d="${p.d}" fill="${c[p.role]}" ${stroke()}/>`
    : `<path d="${p.d}" fill="none" ${stroke(p.thin ? .7 : 1)}${p.dash ? ` stroke-dasharray="${(w * 2).toFixed(3)} ${(w * 2).toFixed(3)}"` : ''}/>`).join('');
  const bean = BEAN[b.kind] || BEAN.pouch;
  const mark = `<path d="${beanPath(bean)}" fill="${c.bean}" ${stroke(.8)}/><path d="${beanLine(bean)}" fill="none" ${stroke(.7)}/>`;
  // the brand only shows once a bag is coloured in
  const brand = palette === 'outline' ? '' : `<text x="${bean[0]}" y="${bean[1] - .12}" text-anchor="middle" font-family="Lilita,sans-serif" font-size=".09" fill="${c.ink}">HZE</text>`;
  return `<g transform="translate(${b.x} ${b.y}) rotate(${b.r || 0}) scale(${b.flip ? -b.s : b.s} ${b.s})" stroke-linejoin="round" stroke-linecap="round"${extra}>${body}${mark}${brand}</g>`;
}

// Is scene point (px, py) on bag b? Generous box so fingers don't have to be exact.
export function onBag(b, px, py, pad = .12) {
  const a = -(b.r || 0) * Math.PI / 180, dx = px - b.x, dy = py - b.y;
  const lx = (dx * Math.cos(a) - dy * Math.sin(a)) / b.s, ly = (dx * Math.sin(a) + dy * Math.cos(a)) / b.s;
  return Math.abs(lx) <= .38 + pad && Math.abs(ly) <= .5 + pad;
}
