// Lesson: dilations, scaled copies, and slope
// Needs ../../assets/js/graph.js (Grid, fracHTML, parseNum, parsePt, rint, pick, ...)

const kHTML = k => fracHTML(Math.round(k * 4), 4) + (Number.isInteger(k) ? "" : ` <span class="hint">(= ${fmt(k)})</span>`);
const ORIG_STYLE = { fill: "var(--orig)", "fill-opacity": 0.18, stroke: "var(--orig)" };
const COPY_STYLE = { fill: "var(--copy)", "fill-opacity": 0.18, stroke: "var(--copy)" };

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

/* =====================================================================
   Explorer 1: scale factor
   ===================================================================== */
(function scaleFactorLab() {
  const G = new Grid(document.getElementById("sf-plot"), { xmin: 0, xmax: 20, ymin: 0, ymax: 10, unit: 30, labels: false });
  const slider = document.getElementById("sf-k"), distort = document.getElementById("sf-distort");
  const shape = [[0, 0], [4, 0], [4, 1], [2, 1], [2, 3], [0, 3]];   // L shape, area 8
  const names = ["A", "B", "C", "D", "E", "F"];
  const area = pts => Math.abs(pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
  const len = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);

  function sideLabels(pts, color) {
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length];
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy);
      // outward normal for a counter-clockwise polygon is (dy, -dx)
      G.text(mx, my, fmt(L), { fill: color, "font-size": 12 }, (dy / L) * 13, (dx / L) * 13 + 4);
    });
  }
  function draw() {
    const k = +slider.value, bad = distort.checked;
    const orig = shape.map(([x, y]) => [x + 1, y + 1]);
    const copy = shape.map(([x, y]) => [6 + x * k, 1 + (bad ? y : y * k)]);
    G.clear();
    G.poly(orig, ORIG_STYLE);
    G.poly(copy, COPY_STYLE);
    sideLabels(orig, "var(--orig)");
    sideLabels(copy, "var(--copy)");
    G.text(3, 0.4, "original", { fill: "var(--orig)", "font-size": 13 });
    G.text(6 + 2 * k, 0.4, "copy", { fill: "var(--copy)", "font-size": 13 });
    document.getElementById("sf-kval").innerHTML = kHTML(k);

    let rows = "", allSame = true;
    orig.forEach((p, i) => {
      const q = orig[(i + 1) % 6], a = len(p, q), b = len(copy[i], copy[(i + 1) % 6]);
      if (Math.abs(b / a - k) > 1e-9) allSame = false;
      rows += `<tr><td>${names[i]}${names[(i + 1) % 6]}</td><td class="o">${fmt(a)}</td><td class="c">${fmt(b)}</td><td><b>${fmt(b / a)}</b></td></tr>`;
    });
    const scaled = allSame || k === 1;
    const A1 = area(orig), A2 = area(copy);
    document.getElementById("sf-read").innerHTML = `
      <table><tr><th>Side</th><th>Original</th><th>Copy</th><th>Copy ÷ orig.</th></tr>${rows}</table>
      <p style="margin:10px 0 4px">${scaled
        ? `<span class="pill yes">✓ Scaled copy</span> every side × ${fmt(k)}`
        : `<span class="pill no">✗ Not a scaled copy</span> the ratios don't match`}</p>
      <p class="hint">Area: <span class="o">${fmt(A1)}</span> → <span class="c">${fmt(A2)}</span> square units
      (× ${fmt(A2 / A1)}${scaled ? ` = ${fmt(k)} × ${fmt(k)}` : ""})</p>
      <p class="hint">Sides are labeled A→F going around the shape counter-clockwise from the bottom-left corner.</p>`;
  }
  slider.addEventListener("input", draw);
  distort.addEventListener("change", draw);
  draw();
})();

/* =====================================================================
   Explorer 2: center of dilation
   ===================================================================== */
(function dilationLab() {
  const G = new Grid(document.getElementById("dil-plot"), { xmin: -10, xmax: 10, ymin: -7, ymax: 7, unit: 26 });
  const slider = document.getElementById("dil-k"), rays = document.getElementById("dil-rays");
  const pts = { P: [-8, -6], A: [-5, -4], B: [-3, -5], C: [-4, -2] };
  const V = ["A", "B", "C"];

  function draw() {
    const k = +slider.value, P = pts.P;
    const img = V.map(n => [P[0] + k * (pts[n][0] - P[0]), P[1] + k * (pts[n][1] - P[1])]);
    const orig = V.map(n => pts[n]);
    G.clear();
    if (rays.checked) {
      V.forEach((n, i) => {
        const far = k >= 1 ? img[i] : pts[n];
        const ext = [P[0] + (far[0] - P[0]) * 1.25, P[1] + (far[1] - P[1]) * 1.25];
        G.line(P[0], P[1], ext[0], ext[1], { stroke: "var(--muted)", "stroke-width": 1.3, "stroke-dasharray": "5 4", "clip-path": G.clipId() });
      });
    }
    G.poly(orig, ORIG_STYLE);
    G.poly(img, { ...COPY_STYLE, "clip-path": G.clipId() });
    V.forEach((n, i) => {
      labelVertex(G, img[i], img, n + "′", "var(--copy)");
      G.point(img[i][0], img[i][1], { fill: "var(--copy)", r: 4 });
    });
    V.forEach((n, i) => {
      labelVertex(G, pts[n], orig, n, "var(--orig)");
      G.point(pts[n][0], pts[n][1], { fill: "var(--orig)", r: 7, class: "handle", stroke: "var(--surface)", "stroke-width": 2 });
    });
    G.point(P[0], P[1], { fill: "var(--text)", r: 7, class: "handle", stroke: "var(--surface)", "stroke-width": 2 });
    G.text(P[0], P[1], "P", {}, -12, 18);

    document.getElementById("dil-kval").innerHTML = kHTML(k);
    let rows = "";
    V.forEach((n, i) => {
      const dx = pts[n][0] - P[0], dy = pts[n][1] - P[1];
      rows += `<tr><td class="o">${n} ${fmtPt(...pts[n])}</td><td>${moveWords(dx, dy)}</td><td>${moveWords(k * dx, k * dy)}</td><td class="c">${n}′ ${fmtPt(...img[i])}</td></tr>`;
    });
    document.getElementById("dil-read").innerHTML = `
      <p style="margin:0 0 6px">Center <b>P ${fmtPt(...P)}</b></p>
      <table><tr><th>Point</th><th>From P</th><th>× ${fmt(k)}</th><th>Image</th></tr>${rows}</table>
      <p class="hint">Recipe: count how far the point is from P, multiply both moves by <i>k</i>, then make those moves starting from P.</p>`;
  }
  G.enableDrag(pts, draw);
  slider.addEventListener("input", draw);
  rays.addEventListener("change", draw);
  draw();
})();

/* =====================================================================
   Explorer 3: slope
   ===================================================================== */
(function slopeLab() {
  const G = new Grid(document.getElementById("sl-plot"), { xmin: -8, xmax: 8, ymin: -6, ymax: 6, unit: 28 });
  const dil = document.getElementById("sl-dil"), slider = document.getElementById("sl-k");
  const pts = { A: [-4, -2], B: [2, 2] };

  function slopeTri(x0, y0, run, rise, dashed) {
    const extra = dashed ? { "stroke-dasharray": "6 4" } : {};
    G.poly([[x0, y0], [x0 + run, y0], [x0 + run, y0 + rise]], { fill: dashed ? "var(--copy)" : "var(--orig)", "fill-opacity": 0.13, stroke: "none" });
    G.line(x0, y0, x0 + run, y0, { stroke: "var(--run)", "stroke-width": 4, ...extra });
    G.line(x0 + run, y0, x0 + run, y0 + rise, { stroke: "var(--rise)", "stroke-width": 4, ...extra });
  }
  function draw() {
    const [ax, ay] = pts.A, [bx, by] = pts.B;
    const run = bx - ax, rise = by - ay, k = +slider.value;
    G.clear();
    document.getElementById("sl-kval").innerHTML = kHTML(k);
    if (run === 0 && rise === 0) {
      G.point(ax, ay, { fill: "var(--accent)", r: 7, class: "handle" });
      document.getElementById("sl-read").innerHTML = "A and B are on top of each other. Drag one away!";
      return;
    }
    G.fullLine(ax, ay, bx, by, { stroke: "var(--text)", "stroke-width": 2.5 });
    if (dil.checked) slopeTri(ax, ay, run * k, rise * k, true);
    slopeTri(ax, ay, run, rise, false);
    if (run !== 0) G.text(ax + run / 2, ay, `run ${fmt(run)}`, { fill: "var(--run)" }, 0, rise >= 0 ? 18 : -8);
    if (rise !== 0) G.text(bx, ay + rise / 2, `rise ${fmt(rise)}`, { fill: "var(--rise)", "text-anchor": run >= 0 ? "start" : "end" }, run >= 0 ? 8 : -8, 5);
    for (const n of ["A", "B"]) {
      G.point(pts[n][0], pts[n][1], { fill: "var(--accent)", r: 7, class: "handle", stroke: "var(--surface)", "stroke-width": 2 });
      G.text(pts[n][0], pts[n][1], n, {}, -12, -10);
    }

    let html = `<p style="margin:0">A ${fmtPt(ax, ay)} → B ${fmtPt(bx, by)}</p>`;
    if (run === 0) {
      html += `<p class="big">Vertical line: slope is undefined</p><p class="hint">The run is 0, and you can't divide by 0.</p>`;
    } else {
      const kind = rise === 0 ? "flat → slope 0" : (rise / run > 0 ? "uphill → positive" : "downhill → negative");
      html += `<p class="big">slope = <span class="frac"><span class="r">${fmt(rise)}</span><span class="g">${fmt(run)}</span></span> = ${fracHTML(rise, run)}</p>
               <p class="hint">${kind}${rise !== 0 && rise % run !== 0 ? ` · as a decimal ≈ ${fmt(rise / run)}` : ""}</p>`;
      if (dil.checked) {
        html += `<p style="margin-top:10px">Dilated triangle (× ${fmt(k)} from A):<br>
          <span class="frac"><span class="r">${fmt(rise * k)}</span><span class="g">${fmt(run * k)}</span></span> = ${fracHTML(rise, run)} <b>same slope!</b></p>`;
      }
    }
    html += `<p class="hint">Tip: always count the run left-to-right as positive; then up is positive rise and down is negative rise. (Dragging B to the left of A gives negative run and rise, and the slope comes out the same.)</p>`;
    document.getElementById("sl-read").innerHTML = html;
  }
  G.enableDrag(pts, draw);
  dil.addEventListener("change", draw);
  slider.addEventListener("input", () => { dil.checked = true; draw(); });
  draw();
})();

/* =====================================================================
   Concept check (fixed questions, shuffled answer order)
   ===================================================================== */
const QUIZ = [
  { q: "When you make a scaled copy of a figure, what stays the same?",
    a: ["The angle measures", "The side lengths", "The perimeter", "The area"],
    why: "Scaling multiplies every length by the scale factor, so side lengths, perimeter, and area change, but the angles do not. That's why the shape looks the same." },
  { q: "A scaled copy is made with a scale factor of 1/2. The copy is…",
    a: ["Smaller than the original", "Bigger than the original", "The same size", "Impossible to tell"],
    why: "A scale factor between 0 and 1 shrinks the figure. Every length is cut in half." },
  { q: "Rectangle A is 2 by 3. Rectangle B is 4 by 5. Is B a scaled copy of A?",
    a: ["No, because 4 ÷ 2 = 2 but 5 ÷ 3 is not 2", "Yes, because each side got 2 bigger", "Yes, because both are rectangles", "No, because B is bigger"],
    why: "For a scaled copy you must MULTIPLY every side by the same number. 2 → 4 is ×2, but 3 → 5 is not ×2. Adding 2 to each side does not make a scaled copy." },
  { q: "Point A is 4 units from the center of dilation P. After a dilation with scale factor 3, how far is A′ from P?",
    a: ["12 units", "7 units", "4 units", "4/3 units"],
    why: "In a dilation, the distance from the center is multiplied by the scale factor: 4 × 3 = 12." },
  { q: "What happens to the center of dilation during a dilation?",
    a: ["It stays in the same place", "It moves k times farther away", "It moves to the origin", "It becomes a vertex of the image"],
    why: "The center is the fixed point everything stretches away from (or shrinks toward). Its distance from itself is 0, and 0 × k = 0, so it doesn't move." },
  { q: "Where does the image of point A always land in a dilation with center P?",
    a: ["On the ray that starts at P and goes through A", "Directly above A", "On the y-axis", "Anywhere, as long as it's farther from P"],
    why: "P, A, and A′ always line up on the same ray from P. That's how you can find the center: draw lines through matching points and see where they meet." },
  { q: "Triangle A′B′C′ is a dilation of triangle ABC. Side AB is 6 and side A′B′ is 9. What is the scale factor?",
    a: ["3/2", "2/3", "3", "15"],
    why: "Scale factor = image length ÷ original length = 9 ÷ 6 = 3/2 = 1.5." },
  { q: "On a coordinate grid, a dilation has its center at the origin and scale factor 2. Where does (3, −1) go?",
    a: ["(6, −2)", "(5, 1)", "(6, −1)", "(1.5, −0.5)"],
    why: "With the center at the origin, multiply BOTH coordinates by the scale factor: (3·2, −1·2) = (6, −2)." },
  { q: "Two different slope triangles are drawn on the same line. What is true?",
    a: ["They are similar, so rise ÷ run is the same for both", "The bigger one gives a bigger slope", "They must be the same size", "Their rises are always equal"],
    why: "Any slope triangle on a line is a dilation of any other one, so their sides are in the same ratio. That means rise ÷ run, the slope, is the same everywhere on the line." },
  { q: "A line goes DOWN as you move from left to right. Its slope is…",
    a: ["Negative", "Positive", "Zero", "Undefined"],
    why: "Going right, the line goes down, so the rise is negative and the run is positive. Negative ÷ positive is negative." },
  { q: "What is the slope of a horizontal (flat) line?",
    a: ["0", "1", "Undefined", "It depends on the line"],
    why: "A flat line has no rise: rise = 0, so slope = 0 ÷ run = 0. (A vertical line is the one with undefined slope.)" },
  { q: "A line goes through (1, 2) and (4, 8). What is its slope?",
    a: ["2", "1/2", "6", "3"],
    why: "Rise = 8 − 2 = 6, run = 4 − 1 = 3. Slope = 6 ÷ 3 = 2." },
  { q: "A figure is dilated with scale factor 3. How many times bigger is the area of the image?",
    a: ["9 times", "3 times", "6 times", "27 times"],
    why: "Both the length and the width get multiplied by 3, so area gets multiplied by 3 × 3 = 9." },
];

(function quiz() {
  const box = document.getElementById("quiz"), scoreEl = document.getElementById("quiz-score");
  let answered = 0, right = 0;
  function render() {
    answered = right = 0;
    scoreEl.textContent = `0 / ${QUIZ.length}`;
    box.innerHTML = "";
    QUIZ.forEach((item, qi) => {
      const div = document.createElement("div");
      div.className = "q";
      const opts = shuffle(item.a.map((t, i) => ({ t, ok: i === 0 })));
      div.innerHTML = `<div class="stem">${qi + 1}. ${item.q}</div><div class="opts"></div><div class="explain"></div>`;
      const optBox = div.querySelector(".opts"), ex = div.querySelector(".explain");
      let first = true;
      opts.forEach(o => {
        const b = document.createElement("button");
        b.className = "opt";
        b.textContent = o.t;
        b.onclick = () => {
          if (b.classList.contains("right")) return;
          b.classList.add(o.ok ? "right" : "wrong");
          if (first) { first = false; answered++; if (o.ok) right++; scoreEl.textContent = `${right} / ${QUIZ.length}`; }
          ex.innerHTML = (o.ok ? "<b>✓ Correct!</b> " : "<b>Not quite. Try another.</b> ") + item.why;
          ex.classList.add("show");
        };
        optBox.appendChild(b);
      });
      box.appendChild(div);
    });
  }
  document.getElementById("quiz-reset").onclick = render;
  render();
})();

/* =====================================================================
   Practice problem generators
   Each returns { prompt, type: "num"|"pt"|"choice", answer, choices?, steps: [html],
                  grid?: {opts, draw(G)}, drawSolution?(G) }
   ===================================================================== */
// scale factors as [numerator, denominator]
const K_UP = [[2, 1], [3, 1], [3, 2], [5, 2], [4, 1]];
const K_DOWN = [[1, 2], [1, 3], [2, 3], [1, 4]];
const K_ALL = K_UP.concat(K_DOWN);
const kval = ([p, q]) => p / q;

function inBox(pts, lo, hi) { return pts.every(([x, y]) => x >= lo && x <= hi && y >= lo && y <= hi); }
function collinear(a, b, c) { return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) === 0; }

// a triangle given as offsets from a center; every offset coordinate is a multiple of m
function randTriOffsets(m, range) {
  for (;;) {
    const d = [0, 1, 2].map(() => [m * rint(-range, range), m * rint(-range, range)]);
    if (d.some(([x, y]) => x === 0 && y === 0)) continue;
    if (collinear(d[0], d[1], d[2])) continue;
    if (collinear([0, 0], d[0], d[1]) || collinear([0, 0], d[1], d[2]) || collinear([0, 0], d[0], d[2])) continue;
    return d;
  }
}

const GENERATORS = {
  // ---------------- scaled copies ----------------
  rectScale: { group: "g-scaled", tag: "Scale factor from a picture", make() {
    for (;;) {
      const [p, q] = pick(K_ALL), k = p / q;
      const w = q * rint(1, 4), h = q * rint(1, 3);
      const W = w * k, H = h * k;
      if (w + W + 3 > 20 || Math.max(h, H) > 9 || W < 1 || H < 1 || (w === h)) continue;
      return {
        prompt: `Rectangle <b class="c">B</b> is a scaled copy of rectangle <b class="o">A</b>. What is the scale factor from <b class="o">A</b> to <b class="c">B</b>?`,
        type: "num", answer: k,
        grid: { opts: { xmin: 0, xmax: 20, ymin: 0, ymax: 10, unit: 20, labels: false }, draw(G) {
          const a = [[1, 1], [1 + w, 1], [1 + w, 1 + h], [1, 1 + h]];
          const x0 = 2 + w, b = [[x0, 1], [x0 + W, 1], [x0 + W, 1 + H], [x0, 1 + H]];
          G.poly(a, ORIG_STYLE); G.poly(b, COPY_STYLE);
          G.text(1 + w / 2, 1, w, { fill: "var(--orig)" }, 0, 16); G.text(1, 1 + h / 2, h, { fill: "var(--orig)", "text-anchor": "end" }, -5, 5);
          G.text(x0 + W / 2, 1, W, { fill: "var(--copy)" }, 0, 16); G.text(x0 + W, 1 + H / 2, H, { fill: "var(--copy)", "text-anchor": "start" }, 5, 5);
          G.text(1 + w / 2, 1 + h / 2, "A", { fill: "var(--orig)" }, 0, 5); G.text(x0 + W / 2, 1 + H / 2, "B", { fill: "var(--copy)" }, 0, 5);
        } },
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

  isScaled: { group: "g-scaled", tag: "Scaled copy or not?", make() {
    for (;;) {
      const w = rint(1, 5), h = rint(1, 4);
      if (w === h) continue;
      const yes = Math.random() < 0.5;
      let W, H;
      if (yes) { const k = pick([2, 3, 1.5]); W = w * k; H = h * k; if (!Number.isInteger(W) || !Number.isInteger(H)) continue; }
      else if (Math.random() < 0.6) { const a = rint(1, 4); W = w + a; H = h + a; }          // "added the same amount" trap
      else { const k = pick([2, 3]); W = w * k; H = h * k + pick([-1, 1]); }
      if (!yes && W * h === H * w) continue;
      if (w + W + 3 > 20 || H > 9 || H < 1) continue;
      return {
        prompt: `Is rectangle <b class="c">B</b> a scaled copy of rectangle <b class="o">A</b>?`,
        type: "choice", choices: ["Yes", "No"], answer: yes ? "Yes" : "No",
        grid: { opts: { xmin: 0, xmax: 20, ymin: 0, ymax: 10, unit: 20, labels: false }, draw(G) {
          const x0 = 2 + w;
          G.poly([[1, 1], [1 + w, 1], [1 + w, 1 + h], [1, 1 + h]], ORIG_STYLE);
          G.poly([[x0, 1], [x0 + W, 1], [x0 + W, 1 + H], [x0, 1 + H]], COPY_STYLE);
          G.text(1 + w / 2, 1, w, { fill: "var(--orig)" }, 0, 16); G.text(1, 1 + h / 2, h, { fill: "var(--orig)", "text-anchor": "end" }, -5, 5);
          G.text(x0 + W / 2, 1, W, { fill: "var(--copy)" }, 0, 16); G.text(x0 + W, 1 + H / 2, H, { fill: "var(--copy)", "text-anchor": "start" }, 5, 5);
          G.text(1 + w / 2, 1 + h / 2, "A", { fill: "var(--orig)" }, 0, 5); G.text(x0 + W / 2, 1 + H / 2, "B", { fill: "var(--copy)" }, 0, 5);
        } },
        steps: [`Compare matching sides by dividing: widths ${W} ÷ ${w} = ${fracHTML(W, w)}${Number.isInteger(W / w) ? "" : ` ≈ ${fmt(W / w)}`}, heights ${H} ÷ ${h} = ${fracHTML(H, h)}${Number.isInteger(H / h) ? "" : ` ≈ ${fmt(H / h)}`}.`,
                yes ? `Both ratios are the same, so <b>yes</b>, B is a scaled copy (scale factor ${fmt(W / w)}).`
                    : `The ratios are different, so <b>no</b>, B is not a scaled copy.${W - w === H - h ? ` (Adding ${W - w} to each side is a trap: you have to <i>multiply</i>.)` : ""}`],
      };
    }
  } },

  scaleDrawing: { group: "g-scaled", tag: "Scale drawing", make() {
    const ctx = pick([
      { unit: "cm", real: "km", thing: "On a map", what: "two towns" },
      { unit: "inch", real: "feet", thing: "On a floor plan", what: "two walls" },
      { unit: "cm", real: "m", thing: "In a drawing of a park", what: "two benches" },
    ]);
    const a = pick([1, 1, 2, 3]), b = pick([2, 3, 4, 5, 10, 15, 20, 25, 50]);
    const dist = a * rint(2, 7);
    const forward = Math.random() < 0.6;
    const plural = n => (n === 1 ? ctx.unit : ctx.unit === "inch" ? "inches" : ctx.unit);
    if (forward) {
      const ans = dist / a * b;
      return {
        prompt: `${ctx.thing}, <b>${a} ${plural(a)}</b> represents <b>${b} ${ctx.real}</b>. The ${ctx.what} are <b>${dist} ${plural(dist)}</b> apart in the drawing. How many ${ctx.real} apart are they really?`,
        type: "num", answer: ans,
        steps: [`How many groups of ${a} ${plural(a)} fit in ${dist} ${plural(dist)}? ${dist} ÷ ${a} = ${dist / a}.`,
                `Each group is ${b} ${ctx.real}: ${dist / a} × ${b} = <b>${fmt(ans)} ${ctx.real}</b>.`],
      };
    }
    const realD = dist / a * b;
    return {
      prompt: `${ctx.thing}, <b>${a} ${plural(a)}</b> represents <b>${b} ${ctx.real}</b>. The ${ctx.what} are really <b>${realD} ${ctx.real}</b> apart. How many ${plural(2)} apart are they in the drawing?`,
      type: "num", answer: dist,
      steps: [`How many groups of ${b} ${ctx.real} are in ${realD} ${ctx.real}? ${realD} ÷ ${b} = ${realD / b}.`,
              `Each group is ${a} ${plural(a)} in the drawing: ${realD / b} × ${a} = <b>${dist} ${plural(dist)}</b>.`],
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

  // ---------------- dilations ----------------
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
        grid: { opts: { xmin: -10, xmax: 10, ymin: -10, ymax: 10, unit: 17, step: 2 }, draw(G) {
          G.point(0, 0, { r: 5 }); G.point(x, y, { fill: "var(--orig)", r: 6 });
          G.text(x, y, "A", { fill: "var(--orig)" }, 0, -10);
        } },
        drawSolution(G) {
          G.line(0, 0, X, Y, { stroke: "var(--muted)", "stroke-dasharray": "5 4", "stroke-width": 1.5 });
          G.point(X, Y, { fill: "var(--copy)", r: 6 }); G.text(X, Y, "A′", { fill: "var(--copy)" }, 0, -10);
        },
        steps: [`With the center at the origin, multiply both coordinates by ${fracHTML(p, q)}.`,
                `(${x} × ${fracHTML(p, q)}, ${y} × ${fracHTML(p, q)}) = <b>${fmtPt(X, Y)}</b>.`],
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
        grid: { opts: { xmin: -10, xmax: 10, ymin: -10, ymax: 10, unit: 17, step: 2 }, draw(G) {
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
                `Start at P ${fmtPt(...C)} and make those moves: (${C[0]} + ${fmt(k * dx)}, ${C[1]} + ${fmt(k * dy)}) = <b>${fmtPt(...A2)}</b>.`],
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
        grid: { opts: { xmin: -10, xmax: 10, ymin: -10, ymax: 10, unit: 17, step: 2 }, draw(G) {
          G.poly(tri, ORIG_STYLE); G.poly(img, COPY_STYLE);
          "ABC".split("").forEach((n, i) => { labelVertex(G, tri[i], tri, n, "var(--orig)"); labelVertex(G, img[i], img, n + "′", "var(--copy)"); });
        } },
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
        grid: { opts: { xmin: -10, xmax: 10, ymin: -10, ymax: 10, unit: 17, step: 2 }, draw(G) {
          G.poly(tri, ORIG_STYLE); G.poly(img, COPY_STYLE);
          "ABC".split("").forEach((n, j) => { labelVertex(G, tri[j], tri, n, "var(--orig)"); labelVertex(G, img[j], img, n + "′", "var(--copy)"); });
          G.point(C[0], C[1], { r: 6 }); G.text(C[0], C[1], "P", {}, -10, 16);
        } },
        steps: [`Pick a vertex, say ${"ABC"[i]}. From P to ${"ABC"[i]}: ${moveWords(d[i][0], d[i][1])}.`,
                `From P to ${"ABC"[i]}′: ${moveWords(k * d[i][0], k * d[i][1])}.`,
                `Scale factor = ${fmt(Math.abs(k * d[i][0]))} ÷ ${Math.abs(d[i][0])} = <b>${fracHTML(p, q)}</b>${q > 1 ? ` (≈ ${fmt(k)})` : ""}.${k < 1 ? " Less than 1 because the image is smaller." : ""}`,
                `Or compare side lengths: image side ÷ original side gives the same answer.`],
      };
    }
  } },

  // ---------------- slope ----------------
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
                `<span class="g">Run</span> (across): ${q * m} to the right. <span class="r">Rise</span>: ${p === 0 ? "0 (flat)" : `${Math.abs(p * m)} ${p > 0 ? "up" : "down"}, so the rise is ${p * m}`}.`,
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
      if (gcd(rise, run) === Math.abs(run) && Math.random() < 0.3) continue; // favor fractional answers a bit
      const n = v => (v < 0 ? `(${v})` : v);
      return {
        prompt: `What is the slope of the line through <b>${fmtPt(...A)}</b> and <b>${fmtPt(...B)}</b>?`,
        type: "num", answer: rise / run,
        steps: [`Rise = change in y = ${B[1]} − ${n(A[1])} = ${rise}.`,
                `Run = change in x = ${B[0]} − ${n(A[0])} = ${run}.`,
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
        // schematic: small triangle with run q, rise p, and a bigger "?" triangle (not to scale)
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
};

/* =====================================================================
   Practice cards
   ===================================================================== */
const pracScore = { tried: 0, right: 0 };
function updatePracScore() { document.getElementById("prac-score").textContent = `${pracScore.right} / ${pracScore.tried}`; }

function renderCard(card, gen) {
  const P = gen.make();
  card.innerHTML = `
    <div class="head"><span class="tag">${gen.tag}</span><button class="btn ghost small newp" title="New problem">↻ New</button></div>
    <div class="body"><div>${P.prompt}</div>${P.grid ? "<svg></svg>" : ""}</div>
    <div class="answer-row"></div>
    <div class="fb"></div>
    <div class="solution"><b>Solution</b><ol>${P.steps.map(s => `<li>${s}</li>`).join("")}</ol></div>`;
  let G = null;
  if (P.grid) { G = new Grid(card.querySelector("svg"), P.grid.opts); P.grid.draw(G); }
  const row = card.querySelector(".answer-row"), fb = card.querySelector(".fb"), sol = card.querySelector(".solution");
  let first = true, solved = false;
  const showSolution = () => {
    if (sol.classList.contains("show")) return;
    sol.classList.add("show");
    if (G && P.drawSolution) P.drawSolution(G);
  };
  const record = ok => {
    if (first) { first = false; pracScore.tried++; if (ok) pracScore.right++; updatePracScore(); }
    if (ok) solved = true;
  };

  if (P.type === "choice") {
    P.choices.forEach(c => {
      const b = document.createElement("button");
      b.className = "btn ghost"; b.textContent = c;
      b.onclick = () => {
        if (solved) return;
        const ok = c === P.answer;
        record(ok);
        b.style.borderColor = ok ? "var(--good)" : "var(--bad)";
        fb.className = "fb " + (ok ? "ok" : "no");
        fb.textContent = ok ? "✓ Correct!" : "✗ Not quite. Check the solution.";
        if (ok || !first) showSolution();
      };
      row.appendChild(b);
    });
  } else {
    const inp = document.createElement("input");
    inp.type = "text"; inp.autocomplete = "off"; inp.spellcheck = false;
    inp.placeholder = P.type === "pt" ? "(x, y)" : "your answer";
    inp.inputMode = P.type === "pt" ? "text" : "decimal";
    const check = document.createElement("button");
    check.className = "btn"; check.textContent = "Check";
    const show = document.createElement("button");
    show.className = "btn ghost"; show.textContent = "Show solution";
    row.append(inp, check, show);
    const doCheck = () => {
      if (solved) return;
      let ok;
      if (P.type === "pt") {
        const v = parsePt(inp.value);
        if (!v) { fb.className = "fb no"; fb.textContent = "Type a point like (6, 3)."; return; }
        ok = close(v[0], P.answer[0]) && close(v[1], P.answer[1]);
      } else {
        const v = parseNum(inp.value);
        if (isNaN(v)) { fb.className = "fb no"; fb.textContent = "Type a number, a fraction like 3/2, or a decimal."; return; }
        ok = close(v, P.answer);
      }
      record(ok);
      inp.className = ok ? "ok" : "no";
      fb.className = "fb " + (ok ? "ok" : "no");
      fb.textContent = ok ? "✓ Correct!" : "✗ Not yet. Try again, or show the solution.";
      if (ok) showSolution();
    };
    check.onclick = doCheck;
    inp.addEventListener("keydown", e => { if (e.key === "Enter") doCheck(); });
    show.onclick = () => { if (first) record(false); showSolution(); };
  }
  card.querySelector(".newp").onclick = () => renderCard(card, gen);
}

function newSet() {
  ["g-scaled", "g-dil", "g-slope"].forEach(id => (document.getElementById(id).innerHTML = ""));
  for (const key in GENERATORS) {
    const gen = GENERATORS[key];
    const card = document.createElement("div");
    card.className = "card prob";
    document.getElementById(gen.group).appendChild(card);
    renderCard(card, gen);
  }
}
document.getElementById("prac-new").onclick = newSet;
newSet();
