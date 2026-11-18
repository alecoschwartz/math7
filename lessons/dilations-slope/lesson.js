// Unit 2 lesson page: explorers, concept check, practice cards.
// Needs ../../assets/js/graph.js and problems.js (helpers + GENERATORS).

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
    const P1 = orig.reduce((s, p, i) => s + len(p, orig[(i + 1) % 6]), 0), P2 = copy.reduce((s, p, i) => s + len(p, copy[(i + 1) % 6]), 0);
    document.getElementById("sf-read").innerHTML = `
      <table><tr><th>Side</th><th>Original</th><th>Copy</th><th>Copy ÷ orig.</th></tr>${rows}</table>
      <p style="margin:10px 0 4px">${scaled
        ? `<span class="pill yes">✓ Scaled copy</span> every side × ${fmt(k)}`
        : `<span class="pill no">✗ Not a scaled copy</span> the ratios don't match`}</p>
      <p class="hint">Perimeter: <span class="o">${fmt(P1)}</span> → <span class="c">${fmt(P2)}</span> (× ${fmt(P2 / P1)})<br>
      Area: <span class="o">${fmt(A1)}</span> → <span class="c">${fmt(A2)}</span> square units
      (× ${fmt(A2 / A1)}${scaled ? ` = ${fmt(k)} × ${fmt(k)}` : ""})</p>
      <p class="hint">Sides are labeled A→F going around the shape counter-clockwise from the bottom-left corner.</p>`;
  }
  slider.addEventListener("input", draw);
  distort.addEventListener("change", draw);
  draw();
})();

/* =====================================================================
   Explorer 2: center of dilation (click anywhere to place the center)
   ===================================================================== */
(function dilationLab() {
  const G = new Grid(document.getElementById("dil-plot"), { xmin: -10, xmax: 10, ymin: -7, ymax: 7, unit: 26 });
  const slider = document.getElementById("dil-k"), rays = document.getElementById("dil-rays"), snap = document.getElementById("dil-snap");
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
      G.point(img[i][0], img[i][1], { fill: "var(--copy)", r: 4, "clip-path": G.clipId() });
    });
    V.forEach((n, i) => {
      labelVertex(G, pts[n], orig, n, "var(--orig)");
      G.point(pts[n][0], pts[n][1], { fill: "var(--orig)", r: 7, class: "handle", stroke: "var(--surface)", "stroke-width": 2 });
    });
    G.point(P[0], P[1], { fill: "var(--bad)", r: 8, class: "handle", stroke: "var(--surface)", "stroke-width": 2 });
    G.text(P[0], P[1], "P", { fill: "var(--bad)" }, -12, 18);

    document.getElementById("dil-kval").innerHTML = fmt(k) + (k === 0.5 ? " (½)" : "");
    let rows = "";
    V.forEach((n, i) => {
      const dx = pts[n][0] - P[0], dy = pts[n][1] - P[1];
      rows += `<tr><td class="o">${n} ${fmtPt(...pts[n])}</td><td>${moveWords(dx, dy)}</td><td>${moveWords(k * dx, k * dy)}</td><td class="c">${n}′ ${fmtPt(...img[i])}</td></tr>`;
    });
    const size = k > 1 ? "bigger" : k < 1 ? (k === 0 ? "squashed to the point P" : "smaller") : "the same size";
    document.getElementById("dil-read").innerHTML = `
      <p style="margin:0 0 6px">Center <b style="color:var(--bad)">P ${fmtPt(...P)}</b> · image is <b>${size}</b></p>
      <table><tr><th>Point</th><th>From P</th><th>× ${fmt(k)}</th><th>Image</th></tr>${rows}</table>
      <p class="hint">Recipe: count how far the point is from P, multiply both moves by <i>k</i>, then make those moves starting from P. Try clicking right on a corner of the triangle's edge, or inside it!</p>`;
  }
  G.enableDrag(pts, draw, 0.6, {
    snap: n => (n === "P" ? (snap.checked ? 1 : 0.1) : 1),
    onEmpty: () => "P",            // clicking anywhere empty moves the center there
  });
  slider.addEventListener("input", draw);
  rays.addEventListener("change", draw);
  document.querySelectorAll("[data-k]").forEach(b => b.addEventListener("click", () => { slider.value = b.dataset.k; draw(); }));
  let anim = null;
  document.getElementById("dil-play").addEventListener("click", () => {
    cancelAnimationFrame(anim);
    const t0 = performance.now();
    const step = now => {
      const t = (now - t0) / 1000;                       // 0 → 3 → 0.5 → 2 over 4.5 s
      const k = t < 2 ? 3 * t / 2 : t < 3.25 ? 3 - 2 * (t - 2) : t < 4.5 ? 0.5 + 1.2 * (t - 3.25) : 2;
      slider.value = Math.round(k * 20) / 20; draw();
      if (t < 4.5) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  });
  draw();
})();

/* =====================================================================
   Explorer 3: similar figures (sequence of transformations)
   ===================================================================== */
(function similarityLab() {
  const G = new Grid(document.getElementById("sim-plot"), { xmin: -10, xmax: 10, ymin: -7, ymax: 7, unit: 26 });
  const flip = document.getElementById("sim-flip"), rot = document.getElementById("sim-rot"), kS = document.getElementById("sim-k"), bad = document.getElementById("sim-bad");
  const O = [[-8, -6], [-5, -6], [-8, -4]];       // A, B, C
  const pts = { Ap: [1, -2] };                     // where A lands: dragging it = translation
  let target = null;

  function transform(p, s) {
    let v = [p[0] - O[0][0], p[1] - O[0][1]];
    if (s.flip) v = [-v[0], v[1]];
    const t = s.rot * Math.PI / 180, c = Math.cos(t), si = Math.sin(t);
    v = [v[0] * c - v[1] * si, v[0] * si + v[1] * c];
    v = [v[0] * s.k * (s.bad ? 1.6 : 1), v[1] * s.k];
    return [s.ap[0] + v[0], s.ap[1] + v[1]];
  }
  const state = () => ({ flip: flip.checked, rot: +rot.value, k: +kS.value, bad: bad.checked, ap: pts.Ap });
  const len = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const ang = (p, a, b) => { // angle at p in degrees
    const u = [a[0] - p[0], a[1] - p[1]], w = [b[0] - p[0], b[1] - p[1]];
    return Math.acos((u[0] * w[0] + u[1] * w[1]) / (Math.hypot(...u) * Math.hypot(...w))) * 180 / Math.PI;
  };
  function newTarget() {
    for (;;) {
      const s = { flip: Math.random() < 0.5, rot: pick([0, 90, 180, 270]), k: pick([0.5, 1, 1.5, 2]), bad: false, ap: [rint(-9, 9), rint(-6, 6)] };
      const T = O.map(p => transform(p, s));
      if (T.every(([x, y]) => x >= -9.5 && x <= 9.5 && y >= -6.5 && y <= 6.5) && !(s.rot === 0 && !s.flip && s.k === 1)) { target = T; return; }
    }
  }
  function draw() {
    const s = state(), I = O.map(p => transform(p, s));
    G.clear();
    if (target) G.poly(target, { fill: "none", stroke: "var(--bad)", "stroke-width": 2.5, "stroke-dasharray": "7 5" });
    G.poly(O, ORIG_STYLE);
    G.poly(I, { ...COPY_STYLE, "clip-path": G.clipId() });
    "ABC".split("").forEach((n, i) => { labelVertex(G, O[i], O, n, "var(--orig)"); labelVertex(G, I[i], I, n + "′", "var(--copy)"); });
    G.point(...pts.Ap, { fill: "var(--copy)", r: 8, class: "handle", stroke: "var(--surface)", "stroke-width": 2 });

    document.getElementById("sim-rotval").textContent = `${s.rot}°`;
    document.getElementById("sim-kval").innerHTML = kHTML(s.k);
    const sides = [[0, 1, "AB"], [1, 2, "BC"], [2, 0, "CA"]];
    let rows = "", ratios = [];
    sides.forEach(([i, j, n]) => {
      const a = len(O[i], O[j]), b = len(I[i], I[j]); ratios.push(b / a);
      rows += `<tr><td>${n}</td><td class="o">${fmt(a)}</td><td class="c">${fmt(b)}</td><td><b>${fmt(b / a)}</b></td></tr>`;
    });
    const angO = [ang(O[0], O[1], O[2]), ang(O[1], O[2], O[0]), ang(O[2], O[0], O[1])];
    const angI = [ang(I[0], I[1], I[2]), ang(I[1], I[2], I[0]), ang(I[2], I[0], I[1])];
    const sameAngles = angO.every((a, i) => Math.abs(a - angI[i]) < 0.5);
    const similar = sameAngles && ratios.every(r => Math.abs(r - ratios[0]) < 1e-6);
    const congruent = similar && Math.abs(ratios[0] - 1) < 1e-6;
    const seq = [];
    if (s.flip) seq.push("reflection");
    if (s.rot) seq.push(`rotation ${s.rot}°`);
    if (s.k !== 1) seq.push(`dilation × ${fmt(s.k)}`);
    if (s.bad) seq.push(`<span style="color:var(--bad)">sideways stretch</span>`);
    seq.push(`translation to A′ ${fmtPt(...pts.Ap)}`);
    let matched = target && I.every((p, i) => Math.abs(p[0] - target[i][0]) < 0.01 && Math.abs(p[1] - target[i][1]) < 0.01);
    const matchedAny = target && !matched && I.every(p => target.some(t => Math.abs(p[0] - t[0]) < 0.01 && Math.abs(p[1] - t[1]) < 0.01));
    document.getElementById("sim-read").innerHTML = `
      <p style="margin:0 0 6px"><b>Sequence:</b> ${seq.join(" → ")}</p>
      <table><tr><th>Side</th><th>ABC</th><th>A′B′C′</th><th>ratio</th></tr>${rows}</table>
      <p class="hint" style="margin-top:6px">Angles: A ${fmt(angO[0])}° → ${fmt(angI[0])}°, B ${fmt(angO[1])}° → ${fmt(angI[1])}°, C ${fmt(angO[2])}° → ${fmt(angI[2])}°</p>
      <p style="margin:8px 0 0">${similar
        ? (congruent ? `<span class="pill yes">✓ Congruent</span> (and similar): same shape and same size` : `<span class="pill yes">✓ Similar</span> same angles, every side × ${fmt(ratios[0])}`)
        : `<span class="pill no">✗ Not similar</span> stretching one way changes the angles`}</p>
      ${target ? `<p style="margin:8px 0 0">${matched ? `🎯 <b>You hit the target!</b> That sequence takes ABC onto it, so they're similar.` : matchedAny ? `Close! The corners land on the target, but A′, B′, C′ aren't on the matching corners. Try a reflection or a different rotation.` : `🎯 Target: land A′B′C′ exactly on the dashed red triangle (A′ goes on the target's corner that matches A).`}</p>` : ""}`;
  }
  G.enableDrag(pts, draw, 0.8);
  [flip, bad].forEach(e => e.addEventListener("change", draw));
  [rot, kS].forEach(e => e.addEventListener("input", draw));
  document.getElementById("sim-new").addEventListener("click", () => { newTarget(); draw(); });
  document.getElementById("sim-reset").addEventListener("click", () => {
    flip.checked = false; bad.checked = false; rot.value = 0; kS.value = 1; pts.Ap = [1, -2]; draw();
  });
  draw();
})();

/* =====================================================================
   Explorer 4: slope, test point, equation
   ===================================================================== */
(function slopeLab() {
  const G = new Grid(document.getElementById("sl-plot"), { xmin: -8, xmax: 8, ymin: -6, ymax: 6, unit: 28 });
  const dil = document.getElementById("sl-dil"), slider = document.getElementById("sl-k");
  const pts = { A: [-4, -2], B: [2, 2], C: [6, 3] };

  function slopeTri(x0, y0, run, rise, dashed) {
    const extra = dashed ? { "stroke-dasharray": "6 4" } : {};
    G.poly([[x0, y0], [x0 + run, y0], [x0 + run, y0 + rise]], { fill: dashed ? "var(--copy)" : "var(--orig)", "fill-opacity": 0.13, stroke: "none" });
    G.line(x0, y0, x0 + run, y0, { stroke: "var(--run)", "stroke-width": 4, ...extra });
    G.line(x0 + run, y0, x0 + run, y0 + rise, { stroke: "var(--rise)", "stroke-width": 4, ...extra });
  }
  function draw() {
    const [ax, ay] = pts.A, [bx, by] = pts.B, [cx, cy] = pts.C;
    const run = bx - ax, rise = by - ay, k = +slider.value;
    G.clear();
    document.getElementById("sl-kval").innerHTML = kHTML(k);
    if (run === 0 && rise === 0) {
      G.point(ax, ay, { fill: "var(--accent)", r: 7, class: "handle" });
      document.getElementById("sl-read").innerHTML = "A and B are on top of each other. Drag one away!";
      return;
    }
    const onLine = run * (cy - ay) - rise * (cx - ax) === 0;
    G.fullLine(ax, ay, bx, by, { stroke: "var(--text)", "stroke-width": 2.5 });
    if (dil.checked) slopeTri(ax, ay, run * k, rise * k, true);
    slopeTri(ax, ay, run, rise, false);
    if (!(cx === ax && cy === ay)) G.line(ax, ay, cx, cy, { stroke: onLine ? "var(--good)" : "var(--bad)", "stroke-width": 1.5, "stroke-dasharray": "3 4" });
    if (run !== 0) G.text(ax + run / 2, ay, `run ${fmt(run)}`, { fill: "var(--run)" }, 0, rise >= 0 ? 18 : -8);
    if (rise !== 0) G.text(bx, ay + rise / 2, `rise ${fmt(rise)}`, { fill: "var(--rise)", "text-anchor": run >= 0 ? "start" : "end" }, run >= 0 ? 8 : -8, 5);
    for (const n of ["A", "B"]) {
      G.point(pts[n][0], pts[n][1], { fill: "var(--accent)", r: 7, class: "handle", stroke: "var(--surface)", "stroke-width": 2 });
      G.text(pts[n][0], pts[n][1], n, {}, -12, -10);
    }
    G.point(cx, cy, { fill: onLine ? "var(--good)" : "var(--bad)", r: 7, class: "handle", stroke: "var(--surface)", "stroke-width": 2 });
    G.text(cx, cy, `C ${fmtPt(cx, cy)}`, { fill: onLine ? "var(--good)" : "var(--bad)" }, 0, -12);

    let html = `<p style="margin:0">A ${fmtPt(ax, ay)} → B ${fmtPt(bx, by)}</p>`;
    if (run === 0) {
      html += `<p class="big">Vertical line: slope is undefined</p><p class="hint">The run is 0, and you can't divide by 0.</p>`;
    } else {
      const kind = rise === 0 ? "flat → slope 0" : (rise / run > 0 ? "uphill → positive" : "downhill → negative");
      html += `<p class="big">slope = <span class="frac"><span class="r">${fmt(rise)}</span><span class="g">${fmt(run)}</span></span> = ${fracHTML(rise, run)}</p>
               <p class="hint">${kind}${rise !== 0 && rise % run !== 0 ? ` · as a decimal ≈ ${fmt(rise / run)}` : ""}</p>
               <p style="margin:8px 0 0">Equation (any point (x, y) on the line): <span class="eq">${eqHTML(ax, ay, rise, run)}</span></p>`;
      if (dil.checked) {
        html += `<p style="margin-top:10px">Dilated triangle (× ${fmt(k)} from A):
          <span class="frac"><span class="r">${fmt(rise * k)}</span><span class="g">${fmt(run * k)}</span></span> = ${fracHTML(rise, run)} <b>same slope!</b></p>`;
      }
    }
    if (cx === ax && cy === ay) html += `<p style="margin-top:10px"><b>C</b> is sitting on A, so it's on the line.</p>`;
    else {
      const r2 = cy - ay, u2 = cx - ax;
      html += `<p style="margin-top:10px"><b>Is C on the line?</b> Slope A → C = ${u2 === 0 ? "undefined (straight up/down)" : `<span class="frac"><span>${fmt(r2)}</span><span>${fmt(u2)}</span></span>${u2 && gcd(r2, u2) !== 1 ? ` = ${fracHTML(r2, u2)}` : ""}`}
        ${onLine ? `<span class="pill yes">✓ same slope: on the line</span>` : `<span class="pill no">✗ different slope: not on the line</span>`}</p>`;
    }
    document.getElementById("sl-read").innerHTML = html;
  }
  G.enableDrag(pts, draw);
  dil.addEventListener("change", draw);
  slider.addEventListener("input", () => { dil.checked = true; draw(); });
  draw();
})();

/* =====================================================================
   Concept check (fixed questions, shuffled answer order; first answer is correct)
   ===================================================================== */
const QUIZ = [
  { q: "When you make a scaled copy of a figure, what stays the same?",
    a: ["The angle measures", "The side lengths", "The perimeter", "The area"],
    why: "Scaling multiplies every length by the scale factor, so side lengths, perimeter, and area change, but the angles do not. That's why the shape looks the same." },
  { q: "Tyler says Figure B is a scaled copy of Figure A because all of its peaks are half as tall. What else has to be true?",
    a: ["Every length, including the width, must also be half as long", "Nothing else, half as tall is enough", "The width must stay the same", "The area must be half as big"],
    why: "A scaled copy multiplies EVERY length by the same number. If only the heights are halved, the shape gets squashed: not a scaled copy." },
  { q: "Rectangle A is 2 by 3. Rectangle B is 4 by 5. Is B a scaled copy of A?",
    a: ["No, because 4 ÷ 2 = 2 but 5 ÷ 3 is not 2", "Yes, because each side got 2 bigger", "Yes, because both are rectangles", "No, because B is bigger"],
    why: "For a scaled copy you must MULTIPLY every side by the same number. 2 → 4 is ×2, but 3 → 5 is not ×2. Adding 2 to each side does not make a scaled copy." },
  { q: "Figure Y is a scaled copy of Figure X with a scale factor of 5. Which statement is true?",
    a: ["Figure Y has angles with the same measures as Figure X", "Figure Y is smaller than Figure X", "Figure Y has the same area as Figure X", "A 4-inch side on X matches a 9-inch side on Y"],
    why: "Angles never change in a scaled copy. Y is 5 times as long in every direction (bigger), its area is 25 times as big, and a 4-inch side becomes 4 × 5 = 20 inches, not 9." },
  { q: "Quadrilateral P has a perimeter of 62 units. Quadrilateral Q is a scaled copy of P with scale factor 3. What is the perimeter of Q?",
    a: ["186 units", "62 units", "65 units", "558 units"],
    why: "Every side is multiplied by 3, so the perimeter is multiplied by 3 too: 62 × 3 = 186." },
  { q: "A figure is dilated with scale factor 3. How many times bigger is the area of the image?",
    a: ["9 times", "3 times", "6 times", "27 times"],
    why: "Both the length and the width get multiplied by 3, so area gets multiplied by 3 × 3 = 9." },
  { q: "What is a scale (like on a map)?",
    a: ["A ratio of a drawing distance to the actual distance", "The number of sides on a figure", "The angle between two roads", "How much the map weighs"],
    why: "A scale like 1 inch : 50 feet compares a distance on the drawing to the real distance." },
  { q: "Map 1 has a scale of 1 inch to 5,000 feet. Map 2 shows the same park with 1 inch to 1,000 feet. Which map is larger?",
    a: ["Map 2 (1 inch to 1,000 feet)", "Map 1 (1 inch to 5,000 feet)", "They're the same size", "You can't tell"],
    why: "On Map 2 each inch shows less of the park, so it takes more inches to show the whole park. A 10,000-foot park is 10 inches on Map 2 but only 2 inches on Map 1." },
  { q: "A drawing has a scale of 1 to 20, with no units. What does that mean?",
    a: ["1 of any unit on the drawing is 20 of the same unit in real life", "1 inch is 20 feet", "1 cm is 20 inches", "The drawing is 20 units long"],
    why: "A scale without units works with any unit, as long as both sides use the same one: 1 cm to 20 cm, 1 in to 20 in, 1 m to 20 m…" },
  { q: "A model airplane is built at a scale of 1 to 72. The model is 8 inches long. How long is the real airplane?",
    a: ["48 feet", "576 feet", "9 feet", "80 inches"],
    why: "8 × 72 = 576 inches. There are 12 inches in a foot, so 576 ÷ 12 = 48 feet." },
  { q: "A dilation changes a figure's…",
    a: ["Size, but not its shape", "Shape, but not its size", "Both size and shape", "Neither size nor shape"],
    why: "A dilation makes it bigger or smaller (size), but angles stay the same, so the shape doesn't change." },
  { q: "Point A is 4 units from the center of dilation P. After a dilation with scale factor 3, how far is A′ from P?",
    a: ["12 units", "7 units", "4 units", "4/3 units"],
    why: "In a dilation, the distance from the center is multiplied by the scale factor: 4 × 3 = 12." },
  { q: "What happens to the center of dilation during a dilation?",
    a: ["It stays in the same place", "It moves k times farther away", "It moves to the origin", "It becomes a vertex of the image"],
    why: "The center is the fixed point everything stretches away from (or shrinks toward). Its distance from itself is 0, and 0 × k = 0, so it doesn't move." },
  { q: "A dilation with center at the origin takes C(4, −4) to C′(10, −10). Where does A(−4, 2) go?",
    a: ["(−10, 5)", "(2, 8)", "(−8, 4)", "(−10, 2)"],
    why: "The scale factor is 10 ÷ 4 = 2.5. Multiply A's coordinates by 2.5: (−4 × 2.5, 2 × 2.5) = (−10, 5)." },
  { q: "Two figures are similar if…",
    a: ["A sequence of translations, rotations, reflections, and dilations takes one onto the other", "They have the same area", "They have the same perimeter", "They are both triangles"],
    why: "That's the definition of similar. Similar figures have the same shape (equal angles, sides in the same ratio) but can be different sizes." },
  { q: "How are congruent figures different from similar figures?",
    a: ["Congruent figures are also the same size (scale factor 1)", "Congruent figures can have different angles", "Congruent figures always need a dilation", "There is no difference"],
    why: "Congruent figures only need translations, rotations, and reflections: same shape AND same size. Every congruent pair is similar, but not every similar pair is congruent." },
  { q: "Triangle U has angles 45° and 75°. Triangle V has angles 45° and 60°. Are they similar?",
    a: ["Yes, U's third angle is 60°, so all three angles match", "No, because 75° isn't in triangle V", "No, you need side lengths to tell", "Yes, because both have a 45° angle"],
    why: "U: 180 − 45 − 75 = 60, so U is 45°, 75°, 60°. V: 180 − 45 − 60 = 75, so V is 45°, 60°, 75°. Same angles → similar (angle-angle)." },
  { q: "Triangle Y has angles 71° and 29°. Triangle Z has angles 65° and 35°. Are they similar?",
    a: ["No, the angles don't all match", "Yes, both third angles are 80°", "Yes, all triangles are similar", "Can't tell without sides"],
    why: "Both third angles are 80° (a trap!), but Y is 71°, 29°, 80° and Z is 65°, 35°, 80°. Only one angle matches, so they are not similar." },
  { q: "Two different slope triangles are drawn on the same line. What is true?",
    a: ["They are similar, so rise ÷ run is the same for both", "The bigger one gives a bigger slope", "They must be the same size", "Their rises are always equal"],
    why: "Slope triangles on a line are always similar, always the same ratio of sides. That means rise ÷ run, the slope, is the same everywhere on the line." },
  { q: "A line goes DOWN as you move from left to right. Its slope is…",
    a: ["Negative", "Positive", "Zero", "Undefined"],
    why: "Going right, the line goes down, so the rise is negative and the run is positive. Negative ÷ positive is negative." },
  { q: "What is the slope of a horizontal (flat) line?",
    a: ["0", "1", "Undefined", "It depends on the line"],
    why: "A flat line has no rise: rise = 0, so slope = 0 ÷ run = 0. (A vertical line is the one with undefined slope.)" },
  { q: "The points (2, 11) and (10, 75) are on a line. Is (20, 150) also on the line?",
    a: ["No", "Yes", "Only if the line goes through (0, 0)", "Can't tell"],
    why: "Slope from (2, 11) to (10, 75) = 64 ÷ 8 = 8. Slope from (2, 11) to (20, 150) = 139 ÷ 18 ≈ 7.7. Different slopes, so (20, 150) is not on the line." },
  { q: "The point (7, 11) is on a line with slope 2. Which equation describes the line?",
    a: ["(y − 11) ÷ (x − 7) = 2", "(y − 7) ÷ (x − 11) = 2", "(x − 7) ÷ (y − 11) = 2", "(y + 11) ÷ (x + 7) = 2"],
    why: "A slope triangle from (7, 11) to any point (x, y) is y − 11 tall and x − 7 wide. Tall ÷ wide = slope, so (y − 11)/(x − 7) = 2." },
  { q: "A line goes through (0, 0) and (5, 2). Is (20, 8) on the line?",
    a: ["Yes, 8/20 = 2/5", "No, 20 isn't a multiple of 2", "No, 8/20 isn't 5/2", "Can't tell"],
    why: "For a line through the origin, every point has y/x = slope = 2/5. And 8/20 = 2/5, so yes." },
];

(function quiz() {
  const box = document.getElementById("quiz"), scoreEl = document.getElementById("quiz-score");
  let right = 0;
  function render() {
    right = 0;
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
          if (first) { first = false; if (o.ok) right++; scoreEl.textContent = `${right} / ${QUIZ.length}`; }
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
  const verdict = (ok, msg) => {
    fb.className = "fb " + (ok ? "ok" : "no");
    fb.textContent = ok ? "✓ Correct!" : msg;
  };

  if (P.type === "choice") {
    row.style.flexDirection = P.choices.some(c => c.length > 12) ? "column" : "row";
    P.choices.forEach(c => {
      const b = document.createElement("button");
      b.className = "btn ghost"; b.style.textAlign = "left";
      if (P.html) b.innerHTML = c; else b.textContent = c;
      b.onclick = () => {
        if (solved) return;
        const ok = c === P.answer;
        const wasFirst = first;
        record(ok);
        b.style.borderColor = ok ? "var(--good)" : "var(--bad)";
        verdict(ok, wasFirst && P.choices.length > 2 ? "✗ Not quite. Try another." : "✗ Not quite. Check the solution.");
        if (ok || !(wasFirst && P.choices.length > 2)) showSolution();
      };
      row.appendChild(b);
    });
  } else if (P.type === "drag") {
    const pts = { A: P.drag.A.slice(), B: P.drag.B.slice() };
    const redraw = () => {
      G.clear();
      const [ax, ay] = pts.A, [bx, by] = pts.B;
      if (ax !== bx || ay !== by) G.fullLine(ax, ay, bx, by, { stroke: "var(--text)", "stroke-width": 2.5 });
      if (ax !== bx) {
        G.line(ax, ay, bx, ay, { stroke: "var(--run)", "stroke-width": 3 });
        G.line(bx, ay, bx, by, { stroke: "var(--rise)", "stroke-width": 3 });
      }
      G.point(ax, ay, { fill: "var(--text)", r: 6 }); G.text(ax, ay, "A", {}, -12, -8);
      G.point(bx, by, { fill: "var(--accent)", r: 8, class: "handle", stroke: "var(--surface)", "stroke-width": 2 }); G.text(bx, by, "B", { fill: "var(--accent)" }, 12, -8);
      fb.className = "fb"; fb.innerHTML = ax !== bx ? `Your line: rise ${by - ay}, run ${bx - ax} → slope ${fracHTML(by - ay, bx - ax)}` : (ay !== by ? "Vertical line: slope undefined" : "");
    };
    G.enableDrag(pts, redraw, 0.9, { fixed: ["A"] });
    redraw();
    const check = document.createElement("button"); check.className = "btn"; check.textContent = "Check";
    const show = document.createElement("button"); show.className = "btn ghost"; show.textContent = "Show solution";
    row.append(check, show);
    check.onclick = () => {
      if (solved) return;
      const run = pts.B[0] - pts.A[0], rise = pts.B[1] - pts.A[1];
      const ok = run !== 0 && close(rise / run, P.answer);
      record(ok);
      verdict(ok, "✗ Not that slope yet. Count the rise and run again.");
      if (ok) showSolution();
    };
    show.onclick = () => { if (first) record(false); showSolution(); };
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
        const v = parseNum(inp.value.replace(/[°a-z]+$/i, ""));
        if (isNaN(v)) { fb.className = "fb no"; fb.textContent = "Type a number, a fraction like 3/2, or a decimal."; return; }
        ok = close(v, P.answer);
      }
      record(ok);
      inp.className = ok ? "ok" : "no";
      verdict(ok, "✗ Not yet. Try again, or show the solution.");
      if (ok) showSolution();
    };
    check.onclick = doCheck;
    inp.addEventListener("keydown", e => { if (e.key === "Enter") doCheck(); });
    show.onclick = () => { if (first) record(false); showSolution(); };
  }
  card.querySelector(".newp").onclick = () => renderCard(card, gen);
}

function newSet() {
  ["g-scaled", "g-drawings", "g-dil", "g-sim", "g-slope", "g-lines"].forEach(id => (document.getElementById(id).innerHTML = ""));
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
