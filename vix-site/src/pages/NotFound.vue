<template>
  <div class="nf">

    <!-- Scanline overlay -->
    <div class="nf-scanlines" aria-hidden="true"></div>

    <!-- Speed particles -->
    <div class="nf-particles" aria-hidden="true">
      <span v-for="i in 18" :key="i" class="nf-particle" :style="particleStyle(i)"></span>
    </div>

    <!-- Main content -->
    <div class="nf-inner">

      <!-- Cheetah SVG -->
      <div class="nf-cheetah-wrap" aria-hidden="true">
        <svg class="nf-cheetah" viewBox="0 0 520 220" fill="none" xmlns="http://www.w3.org/2000/svg">

          <!-- Speed blur streaks behind cheetah -->
          <g class="nf-streaks">
            <line x1="0" y1="95" x2="120" y2="95" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="8 14" opacity="0.35"/>
            <line x1="0" y1="108" x2="100" y2="108" stroke="#22c55e" stroke-width="1" stroke-dasharray="5 18" opacity="0.22"/>
            <line x1="0" y1="120" x2="80" y2="120" stroke="#4ade80" stroke-width="0.8" stroke-dasharray="4 20" opacity="0.15"/>
            <line x1="0" y1="82" x2="60" y2="82" stroke="#22c55e" stroke-width="0.6" stroke-dasharray="3 22" opacity="0.12"/>
          </g>

          <!-- BODY — main torso -->
          <ellipse cx="270" cy="108" rx="88" ry="34" fill="#0f1a12" stroke="#22c55e" stroke-width="1.2" opacity="0.95"/>

          <!-- Neck -->
          <path d="M340 88 Q360 72 372 65 Q382 60 388 62" stroke="#22c55e" stroke-width="12" stroke-linecap="round" fill="none"/>
          <path d="M340 88 Q360 72 372 65 Q382 60 388 62" stroke="#0f1a12" stroke-width="8" stroke-linecap="round" fill="none"/>

          <!-- HEAD -->
          <ellipse cx="400" cy="70" rx="26" ry="20" fill="#0f1a12" stroke="#22c55e" stroke-width="1.2"/>

          <!-- Ear left -->
          <path d="M385 54 L380 42 L392 50 Z" fill="#22c55e" opacity="0.8"/>
          <!-- Ear right -->
          <path d="M400 52 L398 40 L410 50 Z" fill="#22c55e" opacity="0.6"/>

          <!-- Face markings (tear stripes) -->
          <path d="M390 68 Q387 75 386 82" stroke="#22c55e" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
          <path d="M396 70 Q395 77 396 84" stroke="#22c55e" stroke-width="1" stroke-linecap="round" opacity="0.4"/>

          <!-- Eye -->
          <circle cx="408" cy="64" r="4" fill="#22c55e" opacity="0.9"/>
          <circle cx="408" cy="64" r="2" fill="#0a0a0a"/>
          <circle cx="409.5" cy="62.5" r="0.8" fill="#7fff7f" opacity="0.9"/>

          <!-- Nose -->
          <path d="M422 68 L426 65 L422 65 Z" fill="#22c55e" opacity="0.7"/>

          <!-- Snout -->
          <path d="M420 68 Q428 72 432 70" stroke="#22c55e" stroke-width="1" stroke-linecap="round" opacity="0.5"/>

          <!-- Spots on body -->
          <g opacity="0.5" fill="#22c55e">
            <ellipse cx="240" cy="100" rx="4" ry="3"/>
            <ellipse cx="260" cy="92" rx="3.5" ry="2.5"/>
            <ellipse cx="280" cy="102" rx="4" ry="3"/>
            <ellipse cx="300" cy="95" rx="3" ry="2.5"/>
            <ellipse cx="255" cy="115" rx="3.5" ry="3"/>
            <ellipse cx="275" cy="120" rx="4" ry="2.5"/>
            <ellipse cx="295" cy="112" rx="3" ry="2.5"/>
            <ellipse cx="318" cy="100" rx="3.5" ry="3"/>
            <ellipse cx="320" cy="118" rx="3" ry="2"/>
            <ellipse cx="235" cy="115" rx="3" ry="2"/>
          </g>

          <!-- TAIL — curved long tail -->
          <path class="nf-tail" d="M185 100 Q160 90 140 98 Q120 108 115 102 Q108 95 118 88" stroke="#22c55e" stroke-width="6" stroke-linecap="round" fill="none"/>
          <path class="nf-tail" d="M185 100 Q160 90 140 98 Q120 108 115 102 Q108 95 118 88" stroke="#0f1a12" stroke-width="3" stroke-linecap="round" fill="none"/>
          <!-- Tail tip -->
          <ellipse cx="118" cy="87" rx="7" ry="5" fill="#22c55e" opacity="0.8" transform="rotate(-20 118 87)"/>

          <!-- LEGS — galloping pose (all 4 extended, classic cheetah sprint) -->

          <!-- Front right leg (reaching forward) -->
          <path class="nf-leg-fr" d="M330 128 Q338 148 342 165 Q344 172 340 175" stroke="#22c55e" stroke-width="7" stroke-linecap="round" fill="none"/>
          <path class="nf-leg-fr" d="M330 128 Q338 148 342 165 Q344 172 340 175" stroke="#0f1a12" stroke-width="4" stroke-linecap="round" fill="none"/>
          <!-- Front right paw -->
          <ellipse cx="340" cy="176" rx="8" ry="4" fill="#22c55e" opacity="0.8" transform="rotate(-10 340 176)"/>

          <!-- Front left leg (back swing) -->
          <path class="nf-leg-fl" d="M310 128 Q305 148 300 162 Q297 170 293 172" stroke="#22c55e" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.7"/>
          <path class="nf-leg-fl" d="M310 128 Q305 148 300 162 Q297 170 293 172" stroke="#0f1a12" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.7"/>
          <ellipse cx="292" cy="173" rx="8" ry="4" fill="#22c55e" opacity="0.6" transform="rotate(5 292 173)"/>

          <!-- Hind right leg (reaching back and under) -->
          <path class="nf-leg-hr" d="M215 130 Q208 150 210 168 Q212 176 218 178" stroke="#22c55e" stroke-width="7" stroke-linecap="round" fill="none"/>
          <path class="nf-leg-hr" d="M215 130 Q208 150 210 168 Q212 176 218 178" stroke="#0f1a12" stroke-width="4" stroke-linecap="round" fill="none"/>
          <ellipse cx="218" cy="179" rx="8" ry="4" fill="#22c55e" opacity="0.8" transform="rotate(-5 218 179)"/>

          <!-- Hind left leg (extended far forward) -->
          <path class="nf-leg-hl" d="M235 125 Q250 145 268 158 Q276 165 274 170" stroke="#22c55e" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.7"/>
          <path class="nf-leg-hl" d="M235 125 Q250 145 268 158 Q276 165 274 170" stroke="#0f1a12" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.7"/>
          <ellipse cx="273" cy="171" rx="8" ry="4" fill="#22c55e" opacity="0.6" transform="rotate(15 273 171)"/>

          <!-- Ground shadow -->
          <ellipse cx="270" cy="185" rx="95" ry="6" fill="#22c55e" opacity="0.04"/>

          <!-- Speed glow under body -->
          <ellipse cx="270" cy="140" rx="80" ry="20" fill="#22c55e" opacity="0.03" filter="url(#glow)"/>

          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
        </svg>

        <!-- Speed lines below cheetah -->
        <div class="nf-ground-lines" aria-hidden="true">
          <span v-for="j in 6" :key="j" class="nf-ground-line" :style="`animation-delay:${j * 0.12}s`"></span>
        </div>
      </div>

      <!-- Text block -->
      <div class="nf-text">
        <div class="nf-404-wrap">
          <span class="nf-404">404</span>
          <span class="nf-404-sub">PAGE_NOT_FOUND</span>
        </div>

        <h1 class="nf-title">Too fast.<br><span class="nf-title-accent">Went past it.</span></h1>

        <p class="nf-desc">
          This page doesn't exist. The cheetah kept running — maybe it knew something you didn't.
        </p>

        <div class="nf-terminal">
          <span class="nf-prompt">$</span>
          <span class="nf-cmd">vix run <span class="nf-path">{{ path }}</span></span>
          <br>
          <span class="nf-err">error: route not found → 404</span>
        </div>

        <div class="nf-actions">
          <RouterLink to="/" class="nf-btn-primary">
            <svg viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Go home
          </RouterLink>
          <RouterLink to="/install" class="nf-btn-secondary">Install Vix</RouterLink>
          <a href="https://docs.vixcpp.com" target="_blank" rel="noreferrer" class="nf-btn-secondary">Docs</a>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const path = computed(() => route.path);

function particleStyle(i) {
  const seed = i * 137.5;
  const top = ((seed * 0.618) % 80) + 5;
  const width = 20 + (i * 23 % 120);
  const delay = (i * 0.19) % 2.4;
  const duration = 0.6 + (i * 0.11 % 0.8);
  const opacity = 0.04 + (i % 5) * 0.025;
  return `top:${top}%;width:${width}px;animation-delay:${delay}s;animation-duration:${duration}s;opacity:${opacity}`;
}
</script>

<style scoped>
/* ===================== PAGE ===================== */
.nf {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #020d0a;
}

/* Scanlines */
.nf-scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 3px,
    rgba(34, 197, 94, 0.018) 3px,
    rgba(34, 197, 94, 0.018) 4px
  );
  pointer-events: none;
  z-index: 1;
}

/* ===================== PARTICLES ===================== */
.nf-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.nf-particle {
  position: absolute;
  height: 1.5px;
  background: linear-gradient(to right, transparent, #22c55e, transparent);
  border-radius: 999px;
  right: -160px;
  animation: particle-fly linear infinite;
}

@keyframes particle-fly {
  from { transform: translateX(0); opacity: var(--op, 0.08); }
  60%  { opacity: var(--op, 0.08); }
  to   { transform: translateX(-120vw); opacity: 0; }
}

/* ===================== INNER ===================== */
.nf-inner {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: 24px 1.5rem 48px;
  max-width: 860px;
  width: 100%;
  text-align: center;
}

/* ===================== CHEETAH ===================== */
.nf-cheetah-wrap {
  position: relative;
  width: 100%;
  max-width: 520px;
  animation: cheetah-run 0.18s ease-in-out infinite alternate;
}

@keyframes cheetah-run {
  from { transform: translateY(0px) rotate(-0.3deg); }
  to   { transform: translateY(-5px) rotate(0.3deg); }
}

.nf-cheetah {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 0 18px rgba(34, 197, 94, 0.22)) drop-shadow(0 0 40px rgba(34, 197, 94, 0.08));
  animation: cheetah-glow 2.2s ease-in-out infinite;
}

@keyframes cheetah-glow {
  0%, 100% { filter: drop-shadow(0 0 16px rgba(34, 197, 94, 0.20)) drop-shadow(0 0 36px rgba(34, 197, 94, 0.07)); }
  50%       { filter: drop-shadow(0 0 24px rgba(34, 197, 94, 0.35)) drop-shadow(0 0 52px rgba(34, 197, 94, 0.14)); }
}

/* Tail wag */
.nf-tail {
  animation: tail-wag 0.22s ease-in-out infinite alternate;
  transform-origin: 185px 100px;
}

@keyframes tail-wag {
  from { transform: rotate(-6deg); }
  to   { transform: rotate(6deg); }
}

/* Leg animations — galloping rhythm */
.nf-leg-fr {
  animation: leg-fr 0.18s ease-in-out infinite alternate;
  transform-origin: 330px 128px;
}
.nf-leg-fl {
  animation: leg-fl 0.18s ease-in-out infinite alternate;
  transform-origin: 310px 128px;
}
.nf-leg-hr {
  animation: leg-hr 0.18s ease-in-out infinite alternate;
  transform-origin: 215px 130px;
}
.nf-leg-hl {
  animation: leg-hl 0.18s ease-in-out infinite alternate;
  transform-origin: 235px 125px;
}

@keyframes leg-fr {
  from { transform: rotate(-8deg); }
  to   { transform: rotate(8deg); }
}
@keyframes leg-fl {
  from { transform: rotate(8deg); }
  to   { transform: rotate(-8deg); }
}
@keyframes leg-hr {
  from { transform: rotate(10deg); }
  to   { transform: rotate(-10deg); }
}
@keyframes leg-hl {
  from { transform: rotate(-10deg); }
  to   { transform: rotate(10deg); }
}

/* Streak lines on svg */
.nf-streaks line {
  animation: streak-pulse 0.9s ease-in-out infinite alternate;
}

@keyframes streak-pulse {
  from { stroke-dashoffset: 0; opacity: 0.35; }
  to   { stroke-dashoffset: -40; opacity: 0.1; }
}

/* Ground speed lines */
.nf-ground-lines {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: -12px;
  padding-left: 60px;
}

.nf-ground-line {
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(to right, transparent, rgba(34, 197, 94, 0.3), transparent);
  animation: ground-line 0.55s ease-in-out infinite alternate;
}

.nf-ground-line:nth-child(1) { width: 80px; }
.nf-ground-line:nth-child(2) { width: 55px; }
.nf-ground-line:nth-child(3) { width: 100px; }
.nf-ground-line:nth-child(4) { width: 42px; }
.nf-ground-line:nth-child(5) { width: 68px; }
.nf-ground-line:nth-child(6) { width: 30px; }

@keyframes ground-line {
  from { transform: scaleX(1); opacity: 0.6; }
  to   { transform: scaleX(0.4); opacity: 0.15; }
}

/* ===================== TEXT ===================== */
.nf-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  margin-top: 8px;
}

.nf-404-wrap {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
  animation: fade-up 0.6s ease both;
  animation-delay: 0.1s;
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.nf-404 {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: clamp(4rem, 12vw, 8rem);
  font-weight: 900;
  letter-spacing: -0.06em;
  line-height: 1;
  color: transparent;
  -webkit-text-stroke: 1.5px rgba(34, 197, 94, 0.5);
  background: linear-gradient(135deg, #22c55e 0%, #4ade80 40%, rgba(34, 197, 94, 0.3) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nf-404-sub {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: rgba(34, 197, 94, 0.4);
  text-transform: uppercase;
  align-self: center;
}

.nf-title {
  margin: 0 0 14px;
  font-size: clamp(1.6rem, 4vw, 2.8rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.1;
  color: #f1f5f9;
  animation: fade-up 0.6s ease both;
  animation-delay: 0.2s;
}

.nf-title-accent {
  color: #22c55e;
}

.nf-desc {
  margin: 0 0 24px;
  font-size: 0.95rem;
  color: rgba(203, 213, 225, 0.55);
  line-height: 1.7;
  max-width: 42ch;
  animation: fade-up 0.6s ease both;
  animation-delay: 0.3s;
}

/* Terminal snippet */
.nf-terminal {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 0.8rem;
  line-height: 1.9;
  padding: 12px 18px;
  border-radius: 10px;
  background: rgba(2, 6, 23, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.1);
  margin-bottom: 28px;
  text-align: left;
  width: 100%;
  max-width: 440px;
  animation: fade-up 0.6s ease both;
  animation-delay: 0.4s;
}

.nf-prompt {
  color: #22c55e;
  font-weight: 800;
  margin-right: 8px;
}

.nf-cmd {
  color: #e2e8f0;
}

.nf-path {
  color: #7dd3fc;
}

.nf-err {
  color: rgba(248, 113, 113, 0.8);
  padding-left: 20px;
  font-size: 0.75rem;
}

/* Actions */
.nf-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  animation: fade-up 0.6s ease both;
  animation-delay: 0.5s;
}

.nf-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 22px;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  background: #22c55e;
  color: #021a10;
  transition: background 0.14s ease, transform 0.12s ease, box-shadow 0.14s ease;
  box-shadow: 0 4px 18px rgba(34, 197, 94, 0.25);
}

.nf-btn-primary svg {
  width: 14px;
  height: 14px;
}

.nf-btn-primary:hover {
  background: #4ade80;
  transform: translateY(-1px);
  box-shadow: 0 6px 22px rgba(34, 197, 94, 0.35);
}

.nf-btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 500;
  text-decoration: none;
  color: rgba(203, 213, 225, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.03);
  transition: color 0.13s ease, background 0.13s ease, border-color 0.13s ease;
}

.nf-btn-secondary:hover {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(148, 163, 184, 0.28);
}

/* ===================== RESPONSIVE ===================== */
@media (max-width: 600px) {
  .nf-cheetah-wrap {
    max-width: 340px;
  }

  .nf-terminal {
    font-size: 0.72rem;
  }

  .nf-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .nf-btn-primary,
  .nf-btn-secondary {
    justify-content: center;
  }
}
</style>
