// Small SVG coordinate-grid helper shared by all lessons.
const SVGNS = "http://www.w3.org/2000/svg";

class Grid {
  // opts: xmin, xmax, ymin, ymax, unit (px per grid unit), labels (bool), step (label step)
  constructor(svg, opts) {
    this.svg = svg;
    Object.assign(this, { unit: 30, labels: true, step: 1, pad: 6 }, opts);
    this.w = (this.xmax - this.xmin) * this.unit + 2 * this.pad;
    this.h = (this.ymax - this.ymin) * this.unit + 2 * this.pad;
    svg.setAttribute("viewBox", `0 0 ${this.w} ${this.h}`);
    svg.classList.add("plot");
    this.layers = {};
    this.base = this.g("base");
    this.drawGrid();
    this.layer = this.g("main");
  }
  X(x) { return this.pad + (x - this.xmin) * this.unit; }
  Y(y) { return this.pad + (this.ymax - y) * this.unit; }
  g(name) {
    const el = document.createElementNS(SVGNS, "g");
    this.svg.appendChild(el);
    this.layers[name] = el;
    return el;
  }
  el(tag, attrs, parent) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    (parent || this.layer).appendChild(e);
    return e;
  }
  drawGrid() {
    const b = this.base;
    for (let x = Math.ceil(this.xmin); x <= this.xmax; x++)
      this.el("line", { x1: this.X(x), x2: this.X(x), y1: this.Y(this.ymin), y2: this.Y(this.ymax), class: x === 0 ? "ax" : "gl" }, b);
    for (let y = Math.ceil(this.ymin); y <= this.ymax; y++)
      this.el("line", { y1: this.Y(y), y2: this.Y(y), x1: this.X(this.xmin), x2: this.X(this.xmax), class: y === 0 ? "ax" : "gl" }, b);
    if (!this.labels) return;
    const showX = this.ymin <= 0 && this.ymax >= 0, showY = this.xmin <= 0 && this.xmax >= 0;
    for (let x = Math.ceil(this.xmin); x <= this.xmax; x += this.step) {
      if (x === 0 || x === this.xmin || x === this.xmax || !showX) continue;
      this.el("text", { x: this.X(x), y: this.Y(0) + 13, class: "tick", "text-anchor": "middle" }, b).textContent = x;
    }
    for (let y = Math.ceil(this.ymin); y <= this.ymax; y += this.step) {
      if (y === 0 || y === this.ymin || y === this.ymax || !showY) continue;
      this.el("text", { x: this.X(0) - 5, y: this.Y(y) + 4, class: "tick", "text-anchor": "end" }, b).textContent = y;
    }
    if (showX && showY) this.el("text", { x: this.X(0) - 5, y: this.Y(0) + 13, class: "tick", "text-anchor": "end" }, b).textContent = 0;
  }
  clear() { this.layer.innerHTML = ""; }
  line(x1, y1, x2, y2, attrs = {}) {
    return this.el("line", { x1: this.X(x1), y1: this.Y(y1), x2: this.X(x2), y2: this.Y(y2), stroke: "var(--text)", "stroke-width": 2, ...attrs });
  }
  // infinite line through two points, clipped to the grid box
  fullLine(x1, y1, x2, y2, attrs = {}) {
    if (x1 === x2) return this.line(x1, this.ymin, x1, this.ymax, attrs);
    const m = (y2 - y1) / (x2 - x1), f = x => y1 + m * (x - x1);
    return this.line(this.xmin, f(this.xmin), this.xmax, f(this.xmax), { ...attrs, "clip-path": this.clipId() });
  }
  clipId() {
    if (!this._clip) {
      this._clip = "clip" + Math.random().toString(36).slice(2, 8);
      const defs = this.el("defs", {}, this.svg);
      const cp = this.el("clipPath", { id: this._clip }, defs);
      this.el("rect", { x: this.X(this.xmin), y: this.Y(this.ymax), width: this.X(this.xmax) - this.X(this.xmin), height: this.Y(this.ymin) - this.Y(this.ymax) }, cp);
    }
    return `url(#${this._clip})`;
  }
  poly(pts, attrs = {}) {
    return this.el("polygon", { points: pts.map(p => `${this.X(p[0])},${this.Y(p[1])}`).join(" "), "stroke-width": 2.5, "stroke-linejoin": "round", ...attrs });
  }
  point(x, y, attrs = {}) {
    return this.el("circle", { cx: this.X(x), cy: this.Y(y), r: 5, fill: "var(--text)", ...attrs });
  }
  text(x, y, str, attrs = {}, dx = 0, dy = 0) {
    const t = this.el("text", { x: this.X(x) + dx, y: this.Y(y) + dy, class: "lbl", "text-anchor": "middle", ...attrs });
    t.textContent = str;
    return t;
  }
  // convert a pointer event to grid coordinates
  toWorld(evt) {
    const pt = this.svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const p = pt.matrixTransform(this.svg.getScreenCTM().inverse());
    return [this.xmin + (p.x - this.pad) / this.unit, this.ymax - (p.y - this.pad) / this.unit];
  }
  // make named points draggable. pts: {name: [x,y]}; onMove(name) redraws.
  // opts.snap(name) -> grid step to snap to (default 1; 0 = no snapping)
  // opts.onEmpty(x, y) -> called when the press misses every point; may return a name to start dragging
  enableDrag(pts, onMove, radius = 0.7, opts = {}) {
    let active = null;
    const svg = this.svg;
    const snapTo = (name, x, y) => {
      const s = opts.snap ? opts.snap(name) : 1;
      if (s) { x = Math.round(x / s) * s; y = Math.round(y / s) * s; }
      x = Math.max(this.xmin, Math.min(this.xmax, x));
      y = Math.max(this.ymin, Math.min(this.ymax, y));
      return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
    };
    svg.addEventListener("pointerdown", e => {
      const [x, y] = this.toWorld(e);
      let best = null, bd = radius;
      for (const k in pts) {
        if (opts.fixed && opts.fixed.includes(k)) continue;
        const d = Math.hypot(pts[k][0] - x, pts[k][1] - y);
        if (d < bd) { bd = d; best = k; }
      }
      if (!best && opts.onEmpty) {
        best = opts.onEmpty(x, y);
        if (best) { pts[best] = snapTo(best, x, y); onMove(best); }
      }
      if (best) { active = best; svg.setPointerCapture(e.pointerId); e.preventDefault(); }
    });
    svg.addEventListener("pointermove", e => {
      if (!active) return;
      const [x, y] = snapTo(active, ...this.toWorld(e));
      if (pts[active][0] !== x || pts[active][1] !== y) { pts[active] = [x, y]; onMove(active); }
    });
    const end = () => { active = null; };
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);
  }
}

// ---- number helpers -----------------------------------------------------------
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; }

// returns HTML for the fraction n/d, simplified (whole numbers shown plainly)
function fracHTML(n, d = 1, simplify = true) {
  if (d < 0) { n = -n; d = -d; }
  if (simplify) { const g = gcd(n, d); n /= g; d /= g; }
  if (d === 1) return `${n < 0 ? "−" : ""}${Math.abs(n)}`;
  return `${n < 0 ? "−" : ""}<span class="frac"><span>${Math.abs(n)}</span><span>${d}</span></span>`;
}
function fracText(n, d = 1) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d); n /= g; d /= g;
  return d === 1 ? `${n}` : `${n}/${d}`;
}
function fmt(x) { // tidy decimal display
  const r = Math.round(x * 100) / 100;
  return (r < 0 ? "−" : "") + Math.abs(r).toString();
}
function fmtPt(x, y) { return `(${fmt(x)}, ${fmt(y)})`; }

// parse "3", "-2/3", "1.5", "1 1/2", "−4" → number (NaN if invalid)
function parseNum(s) {
  s = String(s).trim().replace(/[−–]/g, "-").replace(/\s+/g, " ");
  if (!s) return NaN;
  let m;
  if ((m = s.match(/^(-?)(\d+) (\d+)\/(\d+)$/))) return (m[1] ? -1 : 1) * (+m[2] + m[3] / m[4]);
  if ((m = s.match(/^(-?\d*\.?\d+)\s*\/\s*(-?\d*\.?\d+)$/))) return m[2] == 0 ? NaN : m[1] / m[2];
  if (/^-?\d*\.?\d+$/.test(s)) return parseFloat(s);
  return NaN;
}
// parse "(6, 3)" or "6,3" → [x, y] or null
function parsePt(s) {
  s = String(s).trim().replace(/[()\[\]]/g, "");
  const parts = s.split(/\s*[,;]\s*|\s+/).filter(Boolean);
  if (parts.length !== 2) return null;
  const a = parts.map(parseNum);
  return a.some(isNaN) ? null : a;
}
const close = (a, b) => Math.abs(a - b) < 0.005;

// random helpers
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
