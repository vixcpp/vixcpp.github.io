<template>
  <canvas ref="cv" class="net" aria-hidden="true"></canvas>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue";

const cv = ref(null);

let raf = 0;
let ctx = null;

let w = 0;
let h = 0;
let dpr = 1;

const nodes = [];
const baseNodes = 42;

const mouse = {
  x: 0,
  y: 0,
  active: false,
  down: false,
  lastSpawnX: 0,
  lastSpawnY: 0,
};

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function resize() {
  const el = cv.value;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  w = Math.floor(rect.width);
  h = Math.floor(rect.height);

  el.width = Math.floor(w * dpr);
  el.height = Math.floor(h * dpr);

  ctx = el.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ensureNodeCount();
}

function ensureNodeCount() {
  const target = baseNodes + Math.floor((w * h) / 70000);
  while (nodes.length < target) spawnNode(rand(0, w), rand(0, h), true);
  while (nodes.length > target) nodes.pop();
}

function spawnNode(x, y, calm = false) {
  const n = {
    x,
    y,
    vx: calm ? rand(-0.15, 0.15) : rand(-0.45, 0.45),
    vy: calm ? rand(-0.15, 0.15) : rand(-0.45, 0.45),
    s: Math.random() < 0.12 ? 8 : 6, // pixel size
    a: rand(0.22, 0.62), // alpha
    tone: pickTone(),
  };
  nodes.push(n);
}

function pickTone() {
  const r = Math.random();
  if (r < 0.72) return "teal";
  if (r < 0.90) return "slate";
  return "yellow";
}

function toneColor(tone, alpha) {
  if (tone === "yellow") return `rgba(250, 204, 21, ${alpha})`;
  if (tone === "slate") return `rgba(148, 163, 184, ${alpha})`;
  return `rgba(94, 234, 212, ${alpha})`; // teal
}

function lineColor(alpha) {
  return `rgba(94, 234, 212, ${alpha})`;
}

function step() {
  raf = requestAnimationFrame(step);

  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);

  const maxDist = Math.min(220, Math.max(140, w * 0.18));
  const maxDist2 = maxDist * maxDist;

  // Update nodes
  for (const n of nodes) {
    // subtle attraction to mouse when active
    if (mouse.active) {
      const dx = mouse.x - n.x;
      const dy = mouse.y - n.y;
      const d2 = dx * dx + dy * dy;
      const pullR = 220;
      if (d2 < pullR * pullR) {
        const d = Math.max(1, Math.sqrt(d2));
        const f = (1 - d / pullR) * 0.015;
        n.vx += (dx / d) * f;
        n.vy += (dy / d) * f;
      }
    }

    // integrate
    n.x += n.vx;
    n.y += n.vy;

    // gentle damping
    n.vx *= 0.995;
    n.vy *= 0.995;

    // bounce
    if (n.x < 0) {
      n.x = 0;
      n.vx = Math.abs(n.vx);
    }
    if (n.x > w) {
      n.x = w;
      n.vx = -Math.abs(n.vx);
    }
    if (n.y < 0) {
      n.y = 0;
      n.vy = Math.abs(n.vy);
    }
    if (n.y > h) {
      n.y = h;
      n.vy = -Math.abs(n.vy);
    }
  }

  // Lines
  ctx.lineWidth = 1.15;
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > maxDist2) continue;

      const d = Math.sqrt(d2);
      let alpha = (1 - d / maxDist) * 0.42;

      // boost near mouse
      if (mouse.active) {
        const mdx = (a.x + b.x) * 0.5 - mouse.x;
        const mdy = (a.y + b.y) * 0.5 - mouse.y;
        const md2 = mdx * mdx + mdy * mdy;
        if (md2 < 240 * 240) alpha *= 1.45;
      }

      alpha = clamp(alpha, 0.02, 0.55);

      ctx.strokeStyle = lineColor(alpha);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  // Nodes (small squares)
  for (const n of nodes) {
    const size = n.s;
    const aa = mouse.active ? n.a * 1.05 : n.a;
    ctx.fillStyle = toneColor(n.tone, clamp(aa, 0.12, 0.92));
    ctx.fillRect(n.x - size / 2, n.y - size / 2, size, size);
  }

  // soft vignette like JSR
  const g = ctx.createRadialGradient(w * 0.5, h * 0.55, 0, w * 0.5, h * 0.55, Math.max(w, h) * 0.65);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function pointerPos(e) {
  const rect = cv.value.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function maybeSpawnTree(x, y) {
  const dx = x - mouse.lastSpawnX;
  const dy = y - mouse.lastSpawnY;
  const d2 = dx * dx + dy * dy;

  // spacing between new nodes while dragging
  if (d2 < 18 * 18) return;

  mouse.lastSpawnX = x;
  mouse.lastSpawnY = y;

  // spawn 1-2 nodes for a dense "tree"
  const count = Math.random() < 0.35 ? 2 : 1;
  for (let i = 0; i < count; i++) {
    spawnNode(
      x + rand(-6, 6),
      y + rand(-6, 6),
      false
    );
  }
}

function onMove(e) {
  if (!cv.value) return;
  const p = pointerPos(e);
  mouse.x = p.x;
  mouse.y = p.y;
  mouse.active = true;

  if (mouse.down) {
    maybeSpawnTree(p.x, p.y);
  }
}

function onDown(e) {
  if (!cv.value) return;
  const p = pointerPos(e);
  mouse.down = true;
  mouse.active = true;
  mouse.x = p.x;
  mouse.y = p.y;
  mouse.lastSpawnX = p.x;
  mouse.lastSpawnY = p.y;

  // immediate burst
  for (let i = 0; i < 3; i++) {
    spawnNode(p.x + rand(-10, 10), p.y + rand(-10, 10), false);
  }
}

function onUp() {
  mouse.down = false;
}

function onLeave() {
  mouse.active = false;
  mouse.down = false;
}

onMounted(() => {
  const el = cv.value;
  if (!el) return;

  // initial nodes after first resize
  resize();

  // seed calm nodes
  if (nodes.length === 0) {
    for (let i = 0; i < baseNodes; i++) spawnNode(rand(0, w), rand(0, h), true);
    ensureNodeCount();
  }

  // events
  el.addEventListener("pointermove", onMove, { passive: true });
  el.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("pointerup", onUp, { passive: true });
  el.addEventListener("pointerleave", onLeave, { passive: true });

  const ro = new ResizeObserver(() => resize());
  ro.observe(el);

  raf = requestAnimationFrame(step);

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    el.removeEventListener("pointerleave", onLeave);
    ro.disconnect();
  });
});
</script>

<style scoped>
.net{
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
