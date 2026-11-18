// Unit 2 practice-problem generators + shared lesson helpers.
// Needs ../../assets/js/graph.js. Loaded before lesson.js.
//
// Each generator's make() returns
//   { prompt, type: "num" | "pt" | "choice" | "drag", answer, choices?, steps: [html],
//     grid?: { opts, draw(G) }, drawSolution?(G), drag?: {...} }

const ORIG_STYLE = { fill: "var(--orig)", "fill-opacity": 0.18, stroke: "var(--orig)" };
const COPY_STYLE = { fill: "var(--copy)", "fill-opacity": 0.18, stroke: "var(--copy)" };
const kHTML = k => fracHTML(Math.round(k * 4), 4) + (Number.isInteger(k) ? "" : ` <span class="hint">(= ${fmt(k)})</span>`);

// label a polygon vertex, pushed away from the polygon's center
function labelVertex(G, p, poly, str, color) {
  const cx = poly.reduce((s, q) => s + q[0], 0) / poly.length;
  const cy = poly.reduce((s, q) => s + q[1], 0) / poly.length;
  let dx = p[0] - cx, dy = p[1] - cy;
  const L = Math.hypot(dx, dy) || 1;
  dx /= L; dy /= L;
  G.text(p[0], p[1], str, { fill: color }, dx * 13, -dy * 13 + 5);
}
function moveWords(dx, dy) {
  const h = dx === 0 ? "" : `${fmt(Math.abs(dx))} ${dx > 0 ? "right" : "left"}`;
  const v = dy === 0 ? "" : `${fmt(Math.abs(dy))} ${dy > 0 ? "up" : "down"}`;
  return [h, v].filter(Boolean).join(", ") || "0 (same spot)";
}
// "y − 7", "x + 3", or just "y" when the number is 0
function minusTerm(v, n) { return n === 0 ? v : n > 0 ? `${v} − ${n}` : `${v} + ${-n}`; }
function eqHTML(x1, y1, num, den = 1) {
  if (x1 === 0 && y1 === 0) return `<span class="frac"><span>y</span><span>x</span></span> = ${fracHTML(num, den)}`;
  return `<span class="frac"><span>${minusTerm("y", y1)}</span><span>${minusTerm("x", x1)}</span></span> = ${fracHTML(num, den)}`;
}

const K_UP = [[2, 1], [3, 1], [3, 2], [5, 2], [4, 1]];
const K_DOWN = [[1, 2], [1, 3], [2, 3], [1, 4]];
const K_ALL = K_UP.concat(K_DOWN);

function inBox(pts, lo, hi) { return pts.every(([x, y]) => x >= lo && x <= hi && y >= lo && y <= hi); }
function collinear(a, b, c) { return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) === 0; }

// triangle as offsets from a center; every offset coordinate is a multiple of m
function randTriOffsets(m, range) {
  for (;;) {
    const d = [0, 1, 2].map(() => [m * rint(-range, range), m * rint(-range, range)]);
    if (d.some(([x, y]) => x === 0 && y === 0)) continue;
    if (collinear(d[0], d[1], d[2])) continue;
    if (collinear([0, 0], d[0], d[1]) || collinear([0, 0], d[1], d[2]) || collinear([0, 0], d[0], d[2])) continue;
    return d;
  }
}
const triLabels = (G, tri, img) => "ABC".split("").forEach((n, i) => {
  labelVertex(G, tri[i], tri, n, "var(--orig)");
  if (img) labelVertex(G, img[i], img, n + "′", "var(--copy)");
});
function rectPair(G, w, h, W, H) {
  const x0 = 2 + w;
  G.poly([[1, 1], [1 + w, 1], [1 + w, 1 + h], [1, 1 + h]], ORIG_STYLE);
  G.poly([[x0, 1], [x0 + W, 1], [x0 + W, 1 + H], [x0, 1 + H]], COPY_STYLE);
  G.text(1 + w / 2, 1, w, { fill: "var(--orig)" }, 0, 16); G.text(1, 1 + h / 2, h, { fill: "var(--orig)", "text-anchor": "end" }, -5, 5);
  G.text(x0 + W / 2, 1, W, { fill: "var(--copy)" }, 0, 16); G.text(x0 + W, 1 + H / 2, H, { fill: "var(--copy)", "text-anchor": "start" }, 5, 5);
  G.text(1 + w / 2, 1 + h / 2, "A", { fill: "var(--orig)" }, 0, 5); G.text(x0 + W / 2, 1 + H / 2, "B", { fill: "var(--copy)" }, 0, 5);
}
// a polygon can only close up if its longest side is shorter than all the others put together
const validPolygon = s => 2 * Math.max(...s) < s.reduce((a, b) => a + b, 0);
const GRID10 = { xmin: -10, xmax: 10, ymin: -10, ymax: 10, unit: 17, step: 2 };
const plural = (n, unit) => (n === 1 ? unit : unit === "inch" ? "inches" : unit === "foot" ? "feet" : unit);
// signed number for inline arithmetic: −3 shows as (−3)
const sn = v => (v < 0 ? `(${fmt(v)})` : fmt(v));

const GENERATORS = {
  /* ======================= A · scaled copies ======================= */
  rectScale: { group: "g-scaled", tag: "Scale factor from a picture", make() {
    for (;;) {
      const [p, q] = pick(K_ALL), k = p / q;
      const w = q * rint(1, 4), h = q * rint(1, 3);
      const W = w * k, H = h * k;
      if (w + W + 3 > 20 || Math.max(h, H) > 9 || W < 1 || H < 1 || w === h) continue;
      return {
        prompt: `Rectangle <b class="c">B</b> is a scaled copy of rectangle <b class="o">A</b>. What is the scale factor from <b class="o">A</b> to <b class="c">B</b>?`,
        type: "num", answer: k,
        grid: { opts: { xmin: 0, xmax: 20, ymin: 0, ymax: 10, unit: 20, labels: false }, draw: G => rectPair(G, w, h, W, H) },
        steps: [`Scale factor = copy length ÷ original length.`,
                `Widths: ${W} ÷ ${w} = ${fracHTML(W, w)}.`,
                `Check with heights: ${H} ÷ ${h} = ${fracHTML(H, h)}. ✓ Same number.`,
                `Scale factor = <b>${fracHTML(p, q)}</b>${q > 1 ? ` (= ${fmt(k)})` : ""}${k < 1 ? ". Less than 1 because B is smaller." : "."}`],
      };
    }
  } },

  missingSide: { group: "g-scaled", tag: "Missing side length", make() {
    const [p, q] = pick(K_ALL), k = p / q;
    const shape = pick(["triangle", "quadrilateral", "pentagon"]);
    const n = { triangle: 3, quadrilateral: 4, pentagon: 5 }[shape];
    const sides = Array.from({ length: n }, () => q * rint(1, 6));
    if (!validPolygon(sides)) return this.make();
    const letters = "ABCDE".slice(0, n).split("");
    const names = letters.map((L, i) => L + letters[(i + 1) % n]);
    const i = rint(0, n - 1); let j = rint(0, n - 1); while (j === i) j = rint(0, n - 1);
    const known = sides[i] * k, ans = sides[j] * k;
    return {
      prompt: `${shape[0].toUpperCase() + shape.slice(1)} <b class="c">${letters.map(L => L + "′").join("")}</b> is a scaled copy of ${shape} <b class="o">${letters.join("")}</b>.<br>
        Original sides: ${names.map((s, t) => `${s} = <span class="o">${sides[t]}</span>`).join(", ")}.<br>
        In the copy, <b>${names[i][0]}′${names[i][1]}′ = <span class="c">${fmt(known)}</span></b>. How long is <b>${names[j][0]}′${names[j][1]}′</b>?`,
      type: "num", answer: ans,
      steps: [`Find the scale factor from matching sides: ${names[i][0]}′${names[i][1]}′ ÷ ${names[i]} = ${fmt(known)} ÷ ${sides[i]} = ${fracHTML(p, q)}.`,
              `Multiply the other side by it: ${names[j][0]}′${names[j][1]}′ = ${sides[j]} × ${fracHTML(p, q)} = <b>${fmt(ans)}</b>.`],
    };
  } },

  scaledAngle: { group: "g-scaled", tag: "Missing angle in a scaled copy", make() {
    const a = rint(25, 95), b = rint(20, 150 - a), c = 180 - a - b;
    const [p, q] = pick(K_ALL);
    return {
      prompt: `Triangle <b class="c">DEF</b> is a scaled copy of triangle <b class="o">ABC</b> with scale factor ${fracHTML(p, q)}. (D matches A, E matches B, F matches C.)<br>
        In triangle ABC, ∠A = <span class="o">${a}°</span> and ∠B = <span class="o">${b}°</span>. What is the measure of <b>∠F</b>, in degrees?`,
      type: "num", answer: c,
      steps: [`Scaling changes lengths, <b>not angles</b>, so ∠F is the same as ∠C. (The scale factor doesn't matter here!)`,
              `The angles of a triangle add up to 180°: ∠C = 180 − ${a} − ${b} = ${c}.`,
              `∠F = <b>${c}°</b>.`],
    };
  } },

  isScaled: { group: "g-scaled", tag: "Scaled copy or not?", make() {
    for (;;) {
      const w = rint(1, 5), h = rint(1, 4);
      if (w === h) continue;
      const yes = Math.random() < 0.5;
      let W, H;
      if (yes) { const k = pick([2, 3, 1.5]); W = w * k; H = h * k; if (!Number.isInteger(W) || !Number.isInteger(H)) continue; }
      else if (Math.random() < 0.6) { const a = rint(1, 4); W = w + a; H = h + a; }   // "added the same amount" trap
      else { const k = pick([2, 3]); W = w * k; H = h * k + pick([-1, 1]); }
      if (!yes && W * h === H * w) continue;
      if (w + W + 3 > 20 || H > 9 || H < 1) continue;
      return {
        prompt: `Is rectangle <b class="c">B</b> a scaled copy of rectangle <b class="o">A</b>?`,
        type: "choice", choices: ["Yes", "No"], answer: yes ? "Yes" : "No",
        grid: { opts: { xmin: 0, xmax: 20, ymin: 0, ymax: 10, unit: 20, labels: false }, draw: G => rectPair(G, w, h, W, H) },
        steps: [`Compare matching sides by dividing: widths ${W} ÷ ${w} = ${fracHTML(W, w)}${Number.isInteger(W / w) ? "" : ` ≈ ${fmt(W / w)}`}, heights ${H} ÷ ${h} = ${fracHTML(H, h)}${Number.isInteger(H / h) ? "" : ` ≈ ${fmt(H / h)}`}.`,
                yes ? `Both ratios are the same, so <b>yes</b>, B is a scaled copy (scale factor ${fmt(W / w)}).`
                    : `The ratios are different, so <b>no</b>, B is not a scaled copy.${W - w === H - h ? ` (Adding ${W - w} to each side is a trap: you have to <i>multiply</i>.)` : ""}`],
      };
    }
  } },

  rectList: { group: "g-scaled", tag: "Could it be a scaled copy?", make() {
    for (;;) {
      const g = rint(2, 6), a = pick([3, 4, 5]), b = pick([2, 3, 4]);
      if (a === b || gcd(a, b) !== 1) continue;
      const L = a * g, Wd = b * g;                         // rectangle X is L by Wd
      const yes = Math.random() < 0.5;
      let L2, W2;
      if (yes) { const m = pick([1, 2, 3, 4, 5, 6, 7, 8].filter(v => v !== g)); L2 = a * m; W2 = b * m; }
      else if (Math.random() < 0.5) { const d = rint(2, 10) * pick([1, -1]); L2 = L + d; W2 = Wd + d; }
      else { const m = rint(1, 8); L2 = a * m; W2 = b * m + pick([1, 2, -1]); }
      if (L2 <= 0 || W2 <= 0 || (!yes && L2 * Wd === W2 * L) || L2 === L) continue;
      const ratio = L2 / L;
      return {
        prompt: `Rectangle X measures <b class="o">${L} in by ${Wd} in</b>. Could <b class="c">${L2} in by ${W2} in</b> be the dimensions of a scaled copy of X?`,
        type: "choice", choices: ["Yes", "No"], answer: yes ? "Yes" : "No",
        steps: [`Long sides: ${L2} ÷ ${L} = ${fracHTML(L2, L)}${Number.isInteger(ratio) ? "" : ` ≈ ${fmt(ratio)}`}. Short sides: ${W2} ÷ ${Wd} = ${fracHTML(W2, Wd)}${Number.isInteger(W2 / Wd) ? "" : ` ≈ ${fmt(W2 / Wd)}`}.`,
                yes ? `Same scale factor for both, so <b>yes</b> (scale factor ${fracHTML(L2, L)}).`
                    : `The two ratios are different, so <b>no</b>.`,
                `Shortcut: X is ${L} : ${Wd} = ${a} : ${b}. A scaled copy must also simplify to ${a} : ${b}; ${L2} : ${W2} simplifies to ${L2 / gcd(L2, W2)} : ${W2 / gcd(L2, W2)}.`],
      };
    }
  } },

  perimeterScale: { group: "g-scaled", tag: "Perimeter of a scaled copy", make() {
    const n = pick([3, 4, 4, 5]);
    const sides = Array.from({ length: n }, () => rint(3, 25));
    if (!validPolygon(sides)) return this.make();
    const P = sides.reduce((s, v) => s + v, 0);
    const [p, q] = pick([[2, 1], [3, 1], [4, 1], [5, 2], [3, 2]]);
    const sideList = q === 1 ? sides : sides.map(v => v * q);
    const P0 = sideList.reduce((s, v) => s + v, 0), ans = P0 * p / q;
    const name = { 3: "Triangle", 4: "Quadrilateral", 5: "Pentagon" }[n];
    return {
      prompt: `${name} P has sides ${sideList.join(", ")} units. ${name} Q is a scaled copy of P with scale factor <b>${fracHTML(p, q)}</b>. What is the <b>perimeter</b> of Q?`,
      type: "num", answer: ans,
      steps: [`Perimeter of P = ${sideList.join(" + ")} = ${P0}.`,
              `Every side is multiplied by ${fracHTML(p, q)}, so the perimeter is too: ${P0} × ${fracHTML(p, q)} = <b>${fmt(ans)}</b> units.`],
    };
  } },

  areaScale: { group: "g-scaled", tag: "Area of a scaled copy", make() {
    const k = pick([2, 3, 4, 0.5]);
    const w = k === 0.5 ? 2 * rint(1, 6) : rint(2, 7), h = k === 0.5 ? 2 * rint(1, 5) : rint(1, 6);
    const A = w * h, ans = A * k * k;
    return {
      prompt: `A rectangle is ${w} units by ${h} units. It is scaled by a scale factor of <b>${fracHTML(k * 2, 2)}</b>. What is the <b>area</b> of the scaled copy, in square units?`,
      type: "num", answer: ans,
      steps: [`New sides: ${w} × ${fmt(k)} = ${fmt(w * k)} and ${h} × ${fmt(k)} = ${fmt(h * k)}.`,
              `New area: ${fmt(w * k)} × ${fmt(h * k)} = <b>${fmt(ans)}</b> square units.`,
              `Shortcut: area gets multiplied by k × k = ${fmt(k * k)}, so ${A} × ${fmt(k * k)} = ${fmt(ans)}.`],
    };
  } },

  /* ======================= B · scale drawings ======================= */
  scaleDrawing: { group: "g-drawings", tag: "Scale drawing: actual or drawing length", make() {
    const ctx = pick([
      { unit: "cm", real: "km", thing: "On a map", what: "two towns" },
      { unit: "inch", real: "feet", thing: "On a floor plan", what: "two walls" },
      { unit: "cm", real: "m", thing: "In a drawing of a park", what: "two benches" },
    ]);
    const a = pick([1, 1, 2, 3]), b = pick([2, 3, 4, 5, 10, 15, 20, 25, 50]);
    const dist = a * rint(2, 7);
    if (Math.random() < 0.6) {
      const ans = dist / a * b;
      return {
        prompt: `${ctx.thing}, <b>${a} ${plural(a, ctx.unit)}</b> represents <b>${b} ${ctx.real}</b>. The ${ctx.what} are <b>${dist} ${plural(dist, ctx.unit)}</b> apart in the drawing. How many ${ctx.real} apart are they really?`,
        type: "num", answer: ans,
        steps: [`How many groups of ${a} ${plural(a, ctx.unit)} fit in ${dist}? ${dist} ÷ ${a} = ${dist / a}.`,
                `Each group is ${b} ${ctx.real}: ${dist / a} × ${b} = <b>${fmt(ans)} ${ctx.real}</b>.`],
      };
    }
    const realD = dist / a * b;
    return {
      prompt: `${ctx.thing}, <b>${a} ${plural(a, ctx.unit)}</b> represents <b>${b} ${ctx.real}</b>. The ${ctx.what} are really <b>${realD} ${ctx.real}</b> apart. How many ${plural(2, ctx.unit)} apart are they in the drawing?`,
      type: "num", answer: dist,
      steps: [`How many groups of ${b} ${ctx.real} are in ${realD}? ${realD} ÷ ${b} = ${realD / b}.`,
              `Each group is ${a} ${plural(a, ctx.unit)} in the drawing: ${realD / b} × ${a} = <b>${dist} ${plural(dist, ctx.unit)}</b>.`],
    };
  } },

  scaleUnits: { group: "g-drawings", tag: "Scale without units (convert!)", make() {
    if (Math.random() < 0.6) {
      const N = pick([12, 24, 36, 48, 72, 96]), a = rint(2, 12);
      const thing = pick(["model airplane", "model car", "model ship", "model train"]);
      const inches = a * N, feet = inches / 12;
      return {
        prompt: `A ${thing} is built at a scale of <b>1 to ${N}</b>. The model is <b>${a} inches</b> long. How many <b>feet</b> long is the actual ${thing.split(" ")[1]}?`,
        type: "num", answer: feet,
        steps: [`A scale without units means the same unit on both sides: 1 inch on the model = ${N} inches in real life.`,
                `${a} × ${N} = ${inches} inches.`,
                `Convert to feet (12 inches in a foot): ${inches} ÷ 12 = <b>${fmt(feet)} feet</b>.`],
      };
    }
    const N = pick([20, 25, 50, 100, 200]), a = rint(2, 9);
    const u = pick(["cm", "inches", "mm"]);
    return {
      prompt: `A drawing has a scale of <b>1 to ${N}</b>. A line in the drawing is <b>${a} ${u}</b> long. How long is the real thing, in <b>${u}</b>?`,
      type: "num", answer: a * N,
      steps: [`Without units, 1 of any unit stands for ${N} of the <b>same</b> unit.`, `${a} × ${N} = <b>${a * N} ${u}</b>.`],
    };
  } },

  floorPlan: { group: "g-drawings", tag: "Floor plan dimensions", make() {
    const F = pick([4, 6, 8, 10, 12, 20]);
    const L = rint(6, 12) / 2, W = rint(3, Math.floor(L * 2) - 1) / 2;
    const askLong = Math.random() < 0.5, d = askLong ? L : W;
    return {
      prompt: `A blueprint shows a floor plan that is <b>${fmt(L)} inches long</b> and <b>${fmt(W)} inches wide</b>. The scale says 1 inch is equivalent to <b>${F} feet</b>. How many feet <b>${askLong ? "long" : "wide"}</b> is the actual building?`,
      type: "num", answer: d * F,
      steps: [`Each inch on the blueprint is ${F} feet.`, `${fmt(d)} × ${F} = <b>${fmt(d * F)} feet</b> ${askLong ? "long" : "wide"}.`,
              `(The other side: ${fmt(askLong ? W : L)} × ${F} = ${fmt((askLong ? W : L) * F)} feet.)`],
    };
  } },

  findScale: { group: "g-drawings", tag: "Find the scale (unit rate)", make() {
    const per = pick([5, 10, 12, 15, 20, 25, 40, 50]), a = rint(2, 6);
    const ctx = pick([["inches", "miles", "map"], ["cm", "km", "map"], ["inches", "feet", "blueprint"]]);
    return {
      prompt: `On a ${ctx[2]}, <b>${a} ${ctx[0]}</b> represents <b>${a * per} ${ctx[1]}</b>. Complete the scale: 1 ${ctx[0] === "inches" ? "inch" : ctx[0]} represents how many ${ctx[1]}?`,
      type: "num", answer: per,
      steps: [`Divide both parts by ${a} so the drawing side is 1.`, `${a * per} ÷ ${a} = <b>${per}</b>. The scale is 1 ${ctx[0] === "inches" ? "inch" : ctx[0]} : ${per} ${ctx[1]}.`],
    };
  } },

  whichMap: { group: "g-drawings", tag: "Which map is larger?", make() {
    const u = pick(["feet", "miles", "meters"]);
    let a = pick([100, 500, 1000, 2000, 5000]), b = pick([100, 500, 1000, 2000, 5000]);
    while (b === a) b = pick([100, 500, 1000, 2000, 5000]);
    const A = `1 inch to ${a.toLocaleString()} ${u}`, B = `1 inch to ${b.toLocaleString()} ${u}`;
    const big = a < b ? A : B;
    return {
      prompt: `Two maps show the same park. Map 1 has a scale of <b>${A}</b>. Map 2 has a scale of <b>${B}</b>. Which map is <b>larger</b>?`,
      type: "choice", choices: [`Map 1 (${A})`, `Map 2 (${B})`], answer: a < b ? `Map 1 (${A})` : `Map 2 (${B})`,
      steps: [`On the ${big} map, each inch shows <b>less</b> of the park.`,
              `So it takes more inches to show the whole park: that map is larger. Example: a 10,000-${{ feet: "foot", miles: "mile", meters: "meter" }[u]} park is ${fmt(10000 / Math.min(a, b))} inches on it, but only ${fmt(10000 / Math.max(a, b))} inches on the other.`],
    };
  } },

  /* ======================= C · dilations ======================= */
  dilateOrigin: { group: "g-dil", tag: "Dilate a point (center at origin)", make() {
    for (;;) {
      const [p, q] = pick([[2, 1], [3, 1], [1, 2], [3, 2], [1, 3]]), k = p / q;
      const x = q * rint(-4, 4), y = q * rint(-4, 4);
      if (x === 0 && y === 0) continue;
      const X = x * k, Y = y * k;
      if (!inBox([[x, y], [X, Y]], -9, 9)) continue;
      return {
        prompt: `Point <b class="o">A ${fmtPt(x, y)}</b> is dilated with <b>center (0, 0)</b> and scale factor <b>${fracHTML(p, q)}</b>. What are the coordinates of <b class="c">A′</b>?`,
        type: "pt", answer: [X, Y],
        grid: { opts: GRID10, draw(G) {
          G.point(0, 0, { r: 5 }); G.point(x, y, { fill: "var(--orig)", r: 6 });
          G.text(x, y, "A", { fill: "var(--orig)" }, 0, -10);
        } },
        drawSolution(G) {
          G.line(0, 0, X, Y, { stroke: "var(--muted)", "stroke-dasharray": "5 4", "stroke-width": 1.5 });
          G.point(X, Y, { fill: "var(--copy)", r: 6 }); G.text(X, Y, "A′", { fill: "var(--copy)" }, 0, -10);
        },
        steps: [`With the center at the origin, multiply both coordinates by ${fracHTML(p, q)}.`,
                `(${sn(x)} × ${fracHTML(p, q)}, ${sn(y)} × ${fracHTML(p, q)}) = <b>${fmtPt(X, Y)}</b>.`],
      };
    }
  } },

  dilateCenter: { group: "g-dil", tag: "Dilate a point (any center)", make() {
    for (;;) {
      const [p, q] = pick([[2, 1], [3, 1], [1, 2], [2, 1], [3, 2]]), k = p / q;
      const C = [rint(-5, 5), rint(-5, 5)];
      const dx = q * rint(-3, 3), dy = q * rint(-3, 3);
      if (dx === 0 && dy === 0) continue;
      const A = [C[0] + dx, C[1] + dy], A2 = [C[0] + k * dx, C[1] + k * dy];
      if (!inBox([A, A2, C], -9, 9)) continue;
      return {
        prompt: `Point <b class="o">A ${fmtPt(...A)}</b> is dilated using center <b>P ${fmtPt(...C)}</b> and scale factor <b>${fracHTML(p, q)}</b>. Where is <b class="c">A′</b>?`,
        type: "pt", answer: A2,
        grid: { opts: GRID10, draw(G) {
          G.point(C[0], C[1], { r: 6 }); G.text(C[0], C[1], "P", {}, -10, 16);
          G.point(A[0], A[1], { fill: "var(--orig)", r: 6 }); G.text(A[0], A[1], "A", { fill: "var(--orig)" }, 0, -10);
        } },
        drawSolution(G) {
          G.line(C[0], C[1], C[0] + dx, C[1], { stroke: "var(--run)", "stroke-width": 3 });
          G.line(C[0] + dx, C[1], A[0], A[1], { stroke: "var(--rise)", "stroke-width": 3 });
          G.line(C[0], C[1], A2[0], A2[1], { stroke: "var(--muted)", "stroke-dasharray": "5 4", "stroke-width": 1.5 });
          G.point(A2[0], A2[1], { fill: "var(--copy)", r: 6 }); G.text(A2[0], A2[1], "A′", { fill: "var(--copy)" }, 0, -10);
        },
        steps: [`From P to A: ${moveWords(dx, dy)}.`,
                `Multiply each move by ${fracHTML(p, q)}: ${moveWords(k * dx, k * dy)}.`,
                `Start at P ${fmtPt(...C)} and make those moves: (${fmt(C[0])} + ${sn(k * dx)}, ${fmt(C[1])} + ${sn(k * dy)}) = <b>${fmtPt(...A2)}</b>.`],
      };
    }
  } },

  dilateFromImage: { group: "g-dil", tag: "C goes to C′. Where does A go?", make() {
    for (;;) {
      const [p, q] = pick([[2, 1], [3, 1], [3, 2], [5, 2], [1, 2]]), k = p / q;
      const C = [q * rint(-4, 4), q * rint(-4, 4)], A = [q * rint(-4, 4), q * rint(-4, 4)];
      if ((C[0] === 0 && C[1] === 0) || (A[0] === 0 && A[1] === 0) || (A[0] === C[0] && A[1] === C[1])) continue;
      if (C[0] === 0) continue; // need a nonzero x to read k from
      const C2 = C.map(v => v * k), A2 = A.map(v => v * k);
      if (!inBox([C, A, C2, A2], -9, 9)) continue;
      return {
        prompt: `A figure is dilated with <b>center (0, 0)</b>. The dilation takes <b class="o">C ${fmtPt(...C)}</b> to <b class="c">C′ ${fmtPt(...C2)}</b>. Where does <b class="o">A ${fmtPt(...A)}</b> go?`,
        type: "pt", answer: A2,
        grid: { opts: GRID10, draw(G) {
          G.point(0, 0, { r: 4 });
          G.point(...C, { fill: "var(--orig)", r: 6 }); G.text(...C, "C", { fill: "var(--orig)" }, 0, -10);
          G.point(...C2, { fill: "var(--copy)", r: 6 }); G.text(...C2, "C′", { fill: "var(--copy)" }, 0, -10);
          G.point(...A, { fill: "var(--orig)", r: 6 }); G.text(...A, "A", { fill: "var(--orig)" }, 0, -10);
        } },
        drawSolution(G) { G.point(...A2, { fill: "var(--copy)", r: 6 }); G.text(...A2, "A′", { fill: "var(--copy)" }, 0, -10); },
        steps: [`Find the scale factor from C → C′: ${fmt(C2[0])} ÷ ${sn(C[0])} = ${fracHTML(p, q)}.`,
                `The center is the origin, so multiply A's coordinates by ${fracHTML(p, q)}: (${sn(A[0])} × ${fracHTML(p, q)}, ${sn(A[1])} × ${fracHTML(p, q)}) = <b>${fmtPt(...A2)}</b>.`],
      };
    }
  } },

  findCenter: { group: "g-dil", tag: "Find the center of dilation", make() {
    for (;;) {
      const [p, q] = pick([[2, 1], [3, 1], [1, 2], [2, 1]]), k = p / q;
      const C = [rint(-6, 6), rint(-6, 6)];
      const d = randTriOffsets(q, k >= 2 ? 2 : 3);
      const tri = d.map(([x, y]) => [C[0] + x, C[1] + y]);
      const img = d.map(([x, y]) => [C[0] + k * x, C[1] + k * y]);
      if (!inBox(tri.concat(img), -9, 9)) continue;
      return {
        prompt: `Triangle <b class="c">A′B′C′</b> is a dilation of triangle <b class="o">ABC</b>. What are the coordinates of the <b>center of dilation</b>?`,
        type: "pt", answer: C,
        grid: { opts: GRID10, draw(G) { G.poly(tri, ORIG_STYLE); G.poly(img, COPY_STYLE); triLabels(G, tri, img); } },
        drawSolution(G) {
          [0, 1, 2].forEach(i => G.fullLine(tri[i][0], tri[i][1], img[i][0], img[i][1], { stroke: "var(--muted)", "stroke-dasharray": "5 4", "stroke-width": 1.5 }));
          G.point(C[0], C[1], { r: 6, fill: "var(--bad)" });
        },
        steps: [`Draw a line through A and A′, another through B and B′, and another through C and C′.`,
                `All the lines meet at one point: the center. Here they cross at <b>${fmtPt(...C)}</b>.`,
                `Check with A: from the center to A is ${moveWords(d[0][0], d[0][1])}; to A′ is ${moveWords(k * d[0][0], k * d[0][1])}. That's × ${fracHTML(p, q)}, the same for every vertex. ✓`],
      };
    }
  } },

  findK: { group: "g-dil", tag: "Find the scale factor from a graph", make() {
    for (;;) {
      const [p, q] = pick([[2, 1], [3, 1], [1, 2], [1, 3], [3, 2], [2, 3]]), k = p / q;
      const C = [rint(-6, 6), rint(-6, 6)];
      const d = randTriOffsets(q, k >= 2 ? 2 : 3);
      const tri = d.map(([x, y]) => [C[0] + x, C[1] + y]);
      const img = d.map(([x, y]) => [C[0] + k * x, C[1] + k * y]);
      if (!inBox(tri.concat(img), -9, 9)) continue;
      const i = d.findIndex(([x]) => x !== 0);
      return {
        prompt: `Triangle <b class="o">ABC</b> is dilated from center <b>P ${fmtPt(...C)}</b> to make triangle <b class="c">A′B′C′</b>. What is the scale factor?`,
        type: "num", answer: k,
        grid: { opts: GRID10, draw(G) {
          G.poly(tri, ORIG_STYLE); G.poly(img, COPY_STYLE); triLabels(G, tri, img);
          G.point(C[0], C[1], { r: 6 }); G.text(C[0], C[1], "P", {}, -10, 16);
        } },
        steps: [`Pick a vertex, say ${"ABC"[i]}. From P to ${"ABC"[i]}: ${moveWords(d[i][0], d[i][1])}.`,
                `From P to ${"ABC"[i]}′: ${moveWords(k * d[i][0], k * d[i][1])}.`,
                `Scale factor = ${fmt(Math.abs(k * d[i][0]))} ÷ ${Math.abs(d[i][0])} = <b>${fracHTML(p, q)}</b>${q > 1 ? ` (≈ ${fmt(k)})` : ""}.${k < 1 ? " Less than 1 because the image is smaller." : ""}`],
      };
    }
  } },

  writeRule: { group: "g-dil", tag: "Write the rule", make() {
    for (;;) {
      const [p, q] = pick([[2, 1], [3, 1], [1, 2], [3, 2], [1, 3]]), k = p / q;
      const d = randTriOffsets(q, 3);
      const img = d.map(([x, y]) => [k * x, k * y]);
      if (!inBox(d.concat(img), -9, 9)) continue;
      const i = d.findIndex(([x]) => x !== 0);
      return {
        prompt: `Triangle <b class="c">A′B′C′</b> is a dilation of triangle <b class="o">ABC</b> with center (0, 0). Complete the rule:<br><span class="eq">(x, y) → (<b>?</b>·x, <b>?</b>·y)</span>. What number goes in the blanks?`,
        type: "num", answer: k,
        grid: { opts: GRID10, draw(G) { G.poly(d, ORIG_STYLE); G.poly(img, COPY_STYLE); triLabels(G, d, img); G.point(0, 0, { r: 4 }); } },
        steps: [`Read one vertex: ${"ABC"[i]} ${fmtPt(...d[i])} → ${"ABC"[i]}′ ${fmtPt(...img[i])}.`,
                `${fmt(img[i][0])} ÷ ${sn(d[i][0])} = ${fracHTML(p, q)}, and the y-coordinates give the same number.`,
                `Rule: <b>(x, y) → (${fracHTML(p, q)}x, ${fracHTML(p, q)}y)</b>.`],
      };
    }
  } },

  matchDilation: { group: "g-dil", tag: "Which dilation made the image?", make() {
    for (;;) {
      const tri = [[2 * rint(2, 5), 2 * rint(2, 4)], [2 * rint(2, 5), 2 * rint(2, 4)], [2 * rint(2, 5), 2 * rint(2, 4)]];
      if (collinear(...tri)) continue;
      const O = [2 * rint(0, 2), 2 * rint(4, 5)];
      if (tri.some(v => v[0] === O[0] && v[1] === O[1])) continue;
      const centers = [["O", O], ["A", tri[0]], ["B", tri[1]], ["C", tri[2]]];
      const ks = [[2, "2"], [0.5, "½"]];
      const opts = [];
      for (const [cn, c] of centers) for (const [k, kt] of ks) {
        const img = tri.map(v => [c[0] + k * (v[0] - c[0]), c[1] + k * (v[1] - c[1])]);
        if (inBox(img, 0, 16)) opts.push({ text: `Center ${cn}, scale factor ${kt}`, img, c });
      }
      if (opts.length < 3) continue;
      const pickd = shuffle(opts).slice(0, 3), right = pickd[0];
      return {
        prompt: `The <b class="c">yellow</b> triangle is a dilation of triangle <b class="o">ABC</b>. Which dilation was it?`,
        type: "choice", choices: shuffle(pickd.map(o => o.text)), answer: right.text,
        grid: { opts: { xmin: 0, xmax: 16, ymin: 0, ymax: 16, unit: 18, labels: false }, draw(G) {
          G.poly(tri, ORIG_STYLE); G.poly(right.img, COPY_STYLE); triLabels(G, tri);
          G.point(...O, { r: 5 }); G.text(...O, "O", {}, -10, -6);
        } },
        drawSolution(G) { right.img.forEach(v => G.line(...right.c, ...v, { stroke: "var(--muted)", "stroke-dasharray": "4 4", "stroke-width": 1.3 })); },
        steps: [`Find the point that didn't move or where lines through matching corners meet: that's the center.`,
                `Compare sizes: a bigger image means scale factor 2; a smaller one means ½.`,
                `Answer: <b>${right.text}</b>.`],
      };
    }
  } },

  /* ======================= D · similarity ======================= */
  congruentOrSimilar: { group: "g-sim", tag: "Congruent or similar?", make() {
    const rigid = ["a translation", "a rotation of 90°", "a reflection across the y-axis", "a rotation of 180°", "a reflection across the x-axis"];
    const dil = ["a dilation with scale factor 2", "a dilation with scale factor ½", "a dilation with scale factor 3", "a dilation with scale factor 1.5"];
    const bad = ["a stretch that makes it twice as wide but the same height", "a stretch that makes it 3 times as tall but the same width"];
    const kind = pick(["cong", "sim", "sim", "none"]);
    let moves = shuffle(rigid).slice(0, rint(1, 2));
    if (kind === "sim") moves.splice(rint(0, moves.length), 0, pick(dil));
    if (kind === "none") moves.splice(rint(0, moves.length), 0, pick(bad));
    const choices = ["Congruent (and similar)", "Similar, but not congruent", "Not similar"];
    const answer = { cong: choices[0], sim: choices[1], none: choices[2] }[kind];
    return {
      prompt: `Figure B was made from figure A using ${moves.join(", then ")}. Which describes figures A and B?`,
      type: "choice", choices, answer,
      steps: [`Translations, rotations, and reflections keep size <b>and</b> shape → congruent.`,
              `Adding a dilation changes the size but keeps the shape → similar (not congruent if k ≠ 1).`,
              `Stretching in only one direction changes the shape → not similar.`,
              `So: <b>${answer}</b>.`],
    };
  } },

  aaSimilar: { group: "g-sim", tag: "Angle-angle: similar?", make() {
    for (;;) {
      const x = rint(20, 100), y = rint(15, 160 - x), z = 180 - x - y;
      if (z < 15 || new Set([x, y, z]).size < 3) continue;
      const yes = Math.random() < 0.5;
      let t2;
      if (yes) t2 = shuffle([x, y, z]).slice(0, 2);
      else {
        const keep = pick([x, y, z]);
        const w = rint(15, 165 - keep - 15), third = 180 - keep - w;
        if (third < 15) continue;
        const set1 = [x, y, z].sort((a, b) => a - b).join(), set2 = [keep, w, third].sort((a, b) => a - b).join();
        if (set1 === set2) continue;
        t2 = shuffle([keep, w]);
      }
      const third1 = 180 - x - y, third2 = 180 - t2[0] - t2[1];
      return {
        prompt: `Triangle 1 has angles <b>${x}°</b> and <b>${y}°</b>. Triangle 2 has angles <b>${t2[0]}°</b> and <b>${t2[1]}°</b>. Are the triangles similar?`,
        type: "choice", choices: ["Yes", "No"], answer: yes ? "Yes" : "No",
        steps: [`Find each third angle (angles add to 180°).`,
                `Triangle 1: 180 − ${x} − ${y} = ${third1}°, so its angles are ${x}°, ${y}°, ${third1}°.`,
                `Triangle 2: 180 − ${t2[0]} − ${t2[1]} = ${third2}°, so its angles are ${t2[0]}°, ${t2[1]}°, ${third2}°.`,
                yes ? `All three angles match, so <b>yes</b>, they're similar (angle-angle).` : `The angles don't all match, so <b>no</b>, not similar.`],
      };
    }
  } },

  similarTriangles: { group: "g-sim", tag: "Missing side in similar triangles", make() {
    const base = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10]]);
    const m = rint(1, 3), n = m * pick([2, 3, 4]) + pick([0, 0, m]);
    if (n === m) return this.make();
    const small = base.map(v => v * m), big = base.map(v => v * n);
    const askBig = Math.random() < 0.5, idx = rint(0, 2);
    const known = askBig ? (idx + 1) % 3 : (idx + 2) % 3;  // a different side in the asked triangle is shown
    const ans = (askBig ? big : small)[idx];
    const lab = (arr, isAsk) => arr.map((v, i) => (isAsk && i === idx ? "x" : isAsk && i !== known ? "" : v));
    const sL = lab(small, !askBig), bL = lab(big, askBig);
    return {
      prompt: `These two right triangles are similar (matching sides are in the same positions). Find <b>x</b>.`,
      type: "num", answer: ans,
      grid: { opts: { xmin: 0, xmax: 22, ymin: 0, ymax: 11, unit: 19, labels: false }, draw(G) {
        const s = 4 / Math.max(base[0], base[1]), S = 8.5 / Math.max(base[0], base[1]);
        const tri = (x0, sc, L, col) => {
          const a = base[0] * sc, b = base[1] * sc;
          G.poly([[x0, 1], [x0 + b, 1], [x0, 1 + a]], col === "o" ? ORIG_STYLE : COPY_STYLE);
          G.poly([[x0, 1], [x0 + 0.4, 1], [x0 + 0.4, 1.4], [x0, 1.4]], { fill: "none", stroke: "var(--text)", "stroke-width": 1 });
          const c = col === "o" ? "var(--orig)" : "var(--copy)";
          if (L[0] !== "") G.text(x0, 1 + a / 2, L[0], { fill: c, "text-anchor": "end" }, -5, 5);
          if (L[1] !== "") G.text(x0 + b / 2, 1, L[1], { fill: c }, 0, 17);
          if (L[2] !== "") G.text(x0 + b / 2, 1 + a / 2, L[2], { fill: c, "text-anchor": "start" }, 8, -4);
        };
        tri(1.5, s, sL, "o");
        tri(9.5, S, bL, "c");
        G.text(19, 10.3, "not to scale", { fill: "var(--muted)", "font-size": 11, "font-weight": 400 });
      } },
      steps: [`Use the matching pair of sides that is labeled in <b>both</b> triangles: ${small[known]} ↔ ${big[known]}.`,
              `Scale factor small → big = ${big[known]} ÷ ${small[known]} = ${fracHTML(n, m)}.`,
              askBig ? `x = ${small[idx]} × ${fracHTML(n, m)} = <b>${ans}</b>.` : `x = ${big[idx]} ÷ ${fracHTML(n, m)} = <b>${ans}</b>.`],
    };
  } },

  /* ======================= E · slope ======================= */
  slopeGraph: { group: "g-slope", tag: "Slope from a graph", make() {
    for (;;) {
      const [p, q] = pick([[1, 2], [2, 3], [3, 4], [2, 1], [3, 1], [1, 3], [-1, 2], [-2, 3], [-3, 1], [-1, 1], [1, 1], [3, 2], [-3, 2], [-4, 3], [0, 1], [-2, 5], [4, 5]]);
      const m = q <= 2 && Math.abs(p) <= 2 ? pick([1, 2]) : 1;
      const A = [rint(-7, 3), rint(-7, 7)], B = [A[0] + q * m, A[1] + p * m];
      if (!inBox([A, B], -8, 8)) continue;
      return {
        prompt: `What is the slope of this line? (It goes through the two marked points.)`,
        type: "num", answer: p / q,
        grid: { opts: { xmin: -9, xmax: 9, ymin: -9, ymax: 9, unit: 19, step: 2 }, draw(G) {
          G.fullLine(A[0], A[1], B[0], B[1], { stroke: "var(--text)", "stroke-width": 2.5 });
          G.point(A[0], A[1], { fill: "var(--accent)", r: 6 }); G.point(B[0], B[1], { fill: "var(--accent)", r: 6 });
        } },
        drawSolution(G) {
          G.line(A[0], A[1], B[0], A[1], { stroke: "var(--run)", "stroke-width": 4 });
          G.line(B[0], A[1], B[0], B[1], { stroke: "var(--rise)", "stroke-width": 4 });
        },
        steps: [`Go from the left point ${fmtPt(...A)} to the right point ${fmtPt(...B)}.`,
                `<span class="g">Run</span> (across): ${q * m} to the right. <span class="r">Rise</span>: ${p === 0 ? "0 (flat)" : `${Math.abs(p * m)} ${p > 0 ? "up" : "down"}, so the rise is ${fmt(p * m)}`}.`,
                `Slope = rise ÷ run = ${fracHTML(p * m, q * m, false)} = <b>${fracHTML(p, q)}</b>.${p < 0 ? " Negative because the line goes downhill." : ""}`],
      };
    }
  } },

  slopePoints: { group: "g-slope", tag: "Slope from two points", make() {
    for (;;) {
      const A = [rint(-9, 9), rint(-9, 9)], B = [rint(-9, 9), rint(-9, 9)];
      if (A[0] === B[0]) continue;
      const rise = B[1] - A[1], run = B[0] - A[0];
      if (Math.abs(run) / gcd(rise, run) > 6) continue; // keep simplified denominators kid-sized
      if (gcd(rise, run) === Math.abs(run) && Math.random() < 0.3) continue;
      return {
        prompt: `What is the slope of the line through <b>${fmtPt(...A)}</b> and <b>${fmtPt(...B)}</b>?`,
        type: "num", answer: rise / run,
        steps: [`Rise = change in y = ${fmt(B[1])} − ${sn(A[1])} = ${fmt(rise)}.`,
                `Run = change in x = ${fmt(B[0])} − ${sn(A[0])} = ${fmt(run)}.`,
                `Slope = ${fracHTML(rise, run, false)} = <b>${fracHTML(rise, run)}</b>.`],
      };
    }
  } },

  slopeTriangle: { group: "g-slope", tag: "Similar slope triangles", make() {
    const [p, q] = pick([[2, 3], [3, 4], [1, 2], [3, 5], [4, 3], [5, 2], [2, 5]]);
    const m = rint(2, 6);
    const givenRun = Math.random() < 0.5;
    const steps = givenRun
      ? [`Slope = rise ÷ run, so rise = slope × run.`, `Rise = ${fracHTML(p, q)} × ${q * m} = <b>${p * m}</b>.`,
         `Check: ${p * m} ÷ ${q * m} = ${fracHTML(p, q)}. ✓ This triangle is the ${fracHTML(p, q)} triangle dilated by ${m}.`]
      : [`Slope = rise ÷ run, so run = rise ÷ slope.`, `Run = ${p * m} ÷ ${fracHTML(p, q)} = ${p * m} × ${fracHTML(q, p)} = <b>${q * m}</b>.`,
         `Check: ${p * m} ÷ ${q * m} = ${fracHTML(p, q)}. ✓`];
    return {
      prompt: `A line has slope <b>${fracHTML(p, q)}</b>. A slope triangle on this line has a ${givenRun ? `horizontal side (run) of <b>${q * m}</b>. How long is its vertical side (rise)?` : `vertical side (rise) of <b>${p * m}</b>. How long is its horizontal side (run)?`}`,
      type: "num", answer: givenRun ? p * m : q * m,
      grid: { opts: { xmin: 0, xmax: 12, ymin: 0, ymax: 7, unit: 26, labels: false }, draw(G) {
        const s = Math.min(1, 3 / Math.max(p, q));
        const big = Math.min(2.2, 6 / (Math.max(p, q) * s));
        G.fullLine(1, 1, 1 + q, 1 + p, { stroke: "var(--text)", "stroke-width": 2 });
        G.line(1, 1, 1 + q * s, 1, { stroke: "var(--run)", "stroke-width": 3 });
        G.line(1 + q * s, 1, 1 + q * s, 1 + p * s, { stroke: "var(--rise)", "stroke-width": 3 });
        G.text(1 + q * s / 2, 1, q, { fill: "var(--run)" }, 0, 16); G.text(1 + q * s, 1 + p * s / 2, p, { fill: "var(--rise)", "text-anchor": "start" }, 5, 5);
        const R = q * s * big, H = p * s * big;
        G.line(1, 1, 1 + R, 1, { stroke: "var(--run)", "stroke-width": 3, "stroke-dasharray": "6 4" });
        G.line(1 + R, 1, 1 + R, 1 + H, { stroke: "var(--rise)", "stroke-width": 3, "stroke-dasharray": "6 4" });
        G.text(1 + R / 2, 1, givenRun ? q * m : "?", { fill: "var(--run)" }, 0, 30);
        G.text(1 + R, 1 + H / 2, givenRun ? "?" : p * m, { fill: "var(--rise)", "text-anchor": "start" }, 5, 5);
        G.text(9, 6.2, "not to scale", { fill: "var(--muted)", "font-size": 11, "font-weight": 400 });
      } },
      steps,
    };
  } },

  drawSlope: { group: "g-slope", tag: "Draw a line with a given slope", make() {
    for (;;) {
      const [p, q] = pick([[2, 3], [1, 2], [3, 4], [4, 1], [3, 1], [2, 1], [1, 3], [-1, 2], [-2, 3], [-3, 1], [3, 2]]);
      const A = [rint(-5, 1), rint(-5, 5)];
      if (!inBox([[A[0] + q, A[1] + p]], -7, 7)) continue;
      return {
        prompt: `<b>Drag point B</b> so the line through A and B has a slope of <b>${fracHTML(p, q)}</b>. Then click Check.`,
        type: "drag", answer: p / q,
        drag: { A, B: [A[0] + 2, A[1]] },
        grid: { opts: { xmin: -8, xmax: 8, ymin: -8, ymax: 8, unit: 19, step: 2 }, draw() {} },
        steps: [`Slope ${fracHTML(p, q)} means: for every ${q} to the right, go ${Math.abs(p)} ${p > 0 ? "up" : "down"}.`,
                `From A ${fmtPt(...A)}, count ${q} right and ${Math.abs(p)} ${p > 0 ? "up" : "down"}: B = <b>${fmtPt(A[0] + q, A[1] + p)}</b> works (so does any point you reach by repeating that).`],
      };
    }
  } },

  /* ======================= E · points on a line & equations ======================= */
  pointOnLine: { group: "g-lines", tag: "Is the point on the line?", make() {
    for (;;) {
      const [p, q] = pick([[8, 1], [1, 2], [2, 3], [3, 1], [5, 2], [1, 1], [4, 3], [3, 4], [2, 1]]);
      const A = [rint(1, 6), rint(1, 12)];
      const t0 = rint(1, 3), B = [A[0] + q * t0, A[1] + p * t0];
      const t = rint(4, 9);
      const yes = Math.random() < 0.5;
      const T = [A[0] + q * t, A[1] + p * t + (yes ? 0 : pick([-2, -1, 1, 2, 3]))];
      const r1 = T[1] - A[1], r2 = T[0] - A[0];
      return {
        prompt: `The points <b>${fmtPt(...A)}</b> and <b>${fmtPt(...B)}</b> are on a line. Is the point <b>${fmtPt(...T)}</b> also on this line?`,
        type: "choice", choices: ["Yes", "No"], answer: yes ? "Yes" : "No",
        steps: [`Slope of the line: (${B[1]} − ${A[1]}) ÷ (${B[0]} − ${A[0]}) = ${fracHTML(B[1] - A[1], B[0] - A[0], false)} = ${fracHTML(p, q)}.`,
                `Slope from ${fmtPt(...A)} to ${fmtPt(...T)}: (${T[1]} − ${A[1]}) ÷ (${T[0]} − ${A[0]}) = ${fracHTML(r1, r2, false)} = ${fracHTML(r1, r2)}.`,
                yes ? `Same slope, so <b>yes</b>, it's on the line.` : `Different slope, so <b>no</b>, it's not on the line.`],
      };
    }
  } },

  pointOnLineGraph: { group: "g-lines", tag: "On the line? (line through the origin)", make() {
    const [p, q] = pick([[2, 5], [1, 2], [2, 3], [3, 4], [1, 3], [3, 2], [4, 5]]);
    const t = rint(6, 30), yes = Math.random() < 0.45;
    let X = q * t, Y = p * t;
    if (!yes) { if (Math.random() < 0.5) Y += pick([-2, -1, 1, 2]); else [X, Y] = [q * t + q * pick([1, 2]), p * t]; }
    if (!yes && Y * q === X * p) return this.make();
    return {
      prompt: `Line ℓ goes through the origin and the marked point. Is the point <b>${fmtPt(X, Y)}</b> on line ℓ?`,
      type: "choice", choices: ["Yes", "No"], answer: yes ? "Yes" : "No",
      grid: { opts: { xmin: -1, xmax: 11, ymin: -1, ymax: 9, unit: 24 }, draw(G) {
        G.fullLine(0, 0, q, p, { stroke: "var(--text)", "stroke-width": 2.5 });
        G.point(0, 0, { r: 5 }); G.point(q, p, { r: 6, fill: "var(--accent)" });
        G.text(q, p, `(${q}, ${p})`, { fill: "var(--accent)", "text-anchor": "end" }, -8, -8);
        G.text(10.3, p / q * 10.3 > 8.5 ? 8.5 : p / q * 10.3, "ℓ", {}, 0, -6);
      } },
      steps: [`For a line through (0, 0), every point has the same <span class="frac"><span>y</span><span>x</span></span> = slope = ${fracHTML(p, q)}.`,
              `For ${fmtPt(X, Y)}: <span class="frac"><span>${Y}</span><span>${X}</span></span> = ${fracHTML(Y, X)}.`,
              yes ? `That equals ${fracHTML(p, q)}, so <b>yes</b>.` : `That isn't ${fracHTML(p, q)}, so <b>no</b>.`],
    };
  } },

  lineEquation: { group: "g-lines", tag: "Equation of a line", make() {
    for (;;) {
      const [p, q] = pick([[3, 1], [1, 2], [3, 4], [2, 3], [4, 1], [5, 2], [2, 1]]);
      const x1 = rint(1, 9), y1 = rint(1, 12);
      if (x1 === y1) continue;
      const right = eqHTML(x1, y1, p, q);
      const wrong = [
        eqHTML(y1, x1, p, q),                                                                   // swapped coordinates
        `<span class="frac"><span>${minusTerm("x", x1)}</span><span>${minusTerm("y", y1)}</span></span> = ${fracHTML(p, q)}`, // upside down
        `<span class="frac"><span>y + ${y1}</span><span>x + ${x1}</span></span> = ${fracHTML(p, q)}`,                      // wrong signs
      ];
      return {
        prompt: `The point <b>${fmtPt(x1, y1)}</b> is on a line with a slope of <b>${fracHTML(p, q)}</b>. Which is an equation of the line? (Use any point (x, y) on the line.)`,
        type: "choice", choices: shuffle([right, ...wrong]), answer: right, html: true,
        steps: [`Make a slope triangle from ${fmtPt(x1, y1)} to a general point (x, y) on the line.`,
                `It is <b>y − ${y1}</b> tall and <b>x − ${x1}</b> wide.`,
                `Tall ÷ wide = slope, so the equation is <b>${right}</b>.`],
      };
    }
  } },
};
