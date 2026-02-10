<!-- src/pages/registry/RegistryHome.vue -->
<template>
  <section class="reg-hero">
    <!-- top mini nav like JSR -->
    <div class="reg-top">
      <div class="reg-top-inner">
        <div class="reg-top-left">
          <RouterLink class="reg-top-link" to="/registry/browse">Browse packages</RouterLink>
          <a class="reg-top-link" href="/docs/" target="_self" rel="noreferrer">Docs</a>
        </div>

        <div class="reg-top-right">
          <button class="reg-icon-btn" type="button" aria-label="Toggle theme" @click="toggleTheme()">
            <span aria-hidden="true">◐</span>
          </button>
          <a class="reg-top-link" href="/signin" target="_self" rel="noreferrer">Sign in</a>
        </div>
      </div>
    </div>

    <!-- background -->
    <div class="reg-bg" aria-hidden="true">
      <span class="n n1"></span><span class="n n2"></span><span class="n n3"></span><span class="n n4"></span>
      <span class="n n5"></span><span class="n n6"></span><span class="n n7"></span><span class="n n8"></span>
      <svg class="reg-lines" viewBox="0 0 1200 600" preserveAspectRatio="none" aria-hidden="true">
        <path d="M40,230 L180,170 L300,240" />
        <path d="M980,110 L860,190 L760,150" />
        <path d="M1050,440 L940,380 L840,470" />
        <path d="M200,520 L240,380 L340,420" />
      </svg>
    </div>

    <!-- center content -->
    <div class="reg-inner">
     <div class="reg-logo-wrap" aria-hidden="true">
        <div class="reg-logo">
          <span class="pix p1"></span>
          <span class="pix p2"></span>
          <span class="pix p3"></span>
          <span class="pix p4"></span>
          <span class="pix p5"></span>
          <span class="pix p6"></span>
          <span class="pix p7"></span>
        </div>
      </div>

      <h1 class="reg-title">
        The open-source package registry
        <br />
        for <span class="reg-em">Vix.cpp</span>
      </h1>

      <div class="reg-links">
        <a class="reg-mini-link" href="/docs/" target="_self" rel="noreferrer">Docs</a>
        <span class="reg-mini-sep">|</span>
        <RouterLink class="reg-mini-link" to="/registry/docs">Why Vix Registry?</RouterLink>
        <span class="reg-mini-sep">|</span>
        <a class="reg-mini-link" href="https://discord.gg/XXXX" target="_blank" rel="noreferrer">Discord</a>
      </div>

      <form class="reg-search" @submit.prevent="goSearch" role="search">
        <input
          v-model.trim="q"
          class="reg-in"
          type="search"
          placeholder="Search for packages (Ctrl+K)"
          autocomplete="off"
        />
        <button class="reg-go" type="submit" :disabled="!q" aria-label="Search">
          <span aria-hidden="true">⌕</span>
        </button>
      </form>

      <RouterLink class="reg-publish" to="/registry/publish">
        <span class="plus" aria-hidden="true">+</span>
        Publish a package
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const q = ref("");

function goSearch() {
  const s = q.value.trim();
  if (!s) return;
  router.push({ path: "/registry/browse", query: { q: s } });
}

function toggleTheme() {
  // simple: toggle .dark on html (align with your existing approach if any)
  document.documentElement.classList.toggle("dark");
}
</script>

<style scoped>
/* =========================
   Registry hero (dark green)
   ========================= */

.reg-hero{
  position: relative;
  min-height: calc(100vh - var(--hdr-h, 64px));
  overflow: hidden;

  /* dark green base */
  background: radial-gradient(circle at 50% 10%, rgba(20, 184, 166, 0.18), transparent 55%),
              radial-gradient(circle at 50% 55%, rgba(2, 132, 199, 0.10), transparent 60%),
              linear-gradient(to bottom, #011816, #020617);

  color: #e5f9f6;
}

/* Center content stays above */
.reg-inner{
  position: relative;
  z-index: 2;
  max-width: 980px;
  margin: 0 auto;
  padding: 72px 22px 80px;
  text-align: center;
}

/* Headline */
.reg-title{
  margin: 0;
  font-size: 2.45rem;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #f8fafc;
  font-weight: 850;
  text-shadow: 0 10px 28px rgba(0,0,0,.45);
}

.reg-em{ font-weight: 950; }

/* mini links under title */
.reg-mini-link{
  color: rgba(226, 232, 240, 0.78);
  text-decoration: underline;
  text-underline-offset: 3px;
  font-size: 0.95rem;
}

.reg-mini-link:hover{ color: #ffffff; }

.reg-mini-sep{
  color: rgba(226,232,240,.25);
}

/* top nav links */
.reg-top-link{
  color: rgba(96,165,250,.95);
  text-decoration: underline;
  text-underline-offset: 3px;
  font-size: 0.98rem;
}
.reg-top-link:hover{ color: rgba(147,197,253,1); }

.reg-top-sep{ color: rgba(226,232,240,.28); }

.reg-icon-btn{
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(148,163,184,.22);
  background: rgba(255,255,255,.10);
  color: rgba(226,232,240,.92);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.reg-icon-btn:hover{
  border-color: rgba(94,234,212,.35);
}

/* search bar */
.reg-search{
  margin: 34px auto 0;
  max-width: 920px;
  display: flex;
  align-items: stretch;
  border-radius: 12px;
  overflow: hidden;

  border: 1px solid rgba(148,163,184,.22);
  background: rgba(255,255,255,0.94);
  box-shadow: 0 20px 50px rgba(0,0,0,.35);
}

.reg-in{
  flex: 1;
  min-width: 240px;
  padding: 16px 18px;
  font-size: 1.05rem;
  border: 0;
  outline: none;
  color: #020617;
}

.reg-in::placeholder{ color: rgba(2,6,23,.45); }

.reg-go{
  width: 62px;
  border: 0;
  background: #0f766e;
  color: #ecfeff;
  font-weight: 900;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.reg-go:hover{ background: #14b8a6; }

.reg-go:disabled{
  opacity: 0.65;
  cursor: not-allowed;
}

/* publish button */
.reg-publish{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  margin-top: 26px;
  padding: 12px 18px;
  border-radius: 10px;

  background: #facc15;
  color: #111827;
  font-weight: 900;
  text-decoration: none;

  border: 1px solid rgba(15,23,42,.22);
  box-shadow: 0 10px 0 rgba(0,0,0,.22);
}

.reg-publish:hover{
  transform: translateY(-1px);
  box-shadow: 0 11px 0 rgba(0,0,0,.22);
}

/* =========================
   Background (nodes + lines)
   ========================= */

.reg-bg{
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

/* subtle fog at center to match logo glow */
.reg-bg::after{
  content: "";
  position: absolute;
  left: 50%;
  top: 52%;
  width: 900px;
  height: 520px;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle,
    rgba(94,234,212,.20),
    rgba(6,182,212,.10),
    transparent 65%
  );
  filter: blur(30px);
  opacity: .85;
}

/* lines */
.reg-lines{
  position: absolute;
  inset: 0;
  opacity: 0.65;
}

.reg-lines path{
  fill: none;
  stroke: rgba(94,234,212,0.28);
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  animation: linePulse 6.8s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}

.reg-lines path:nth-child(2){ animation-delay: 1.2s; }
.reg-lines path:nth-child(3){ animation-delay: 2.4s; }
.reg-lines path:nth-child(4){ animation-delay: 3.6s; }

@keyframes linePulse{
  0%{ opacity: 0.12; transform: translateX(0); }
  50%{ opacity: 0.42; transform: translateX(8px); }
  100%{ opacity: 0.12; transform: translateX(0); }
}

/* nodes */
.n{
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: rgba(94,234,212,.85);
  box-shadow: 0 0 0 4px rgba(94,234,212,.10), 0 0 18px rgba(94,234,212,.25);
  animation: nodeFloat 7.6s ease-in-out infinite;
}

.n:nth-child(odd){ animation-delay: 1.4s; }
.n:nth-child(even){ animation-delay: 3.0s; }

@keyframes nodeFloat{
  0%{ opacity: .18; transform: translateY(0); }
  50%{ opacity: .72; transform: translateY(-10px); }
  100%{ opacity: .18; transform: translateY(0); }
}

/* keep your positioning but slightly smaller */
.n1{ left: 8%; top: 36%; }
.n2{ left: 18%; top: 28%; background: rgba(148,163,184,.55); box-shadow: 0 0 0 4px rgba(148,163,184,.08), 0 0 12px rgba(148,163,184,.20); }
.n3{ left: 28%; top: 40%; background: rgba(250,204,21,.95); box-shadow: 0 0 0 4px rgba(250,204,21,.12), 0 0 16px rgba(250,204,21,.18); }
.n4{ right: 12%; top: 22%; background: rgba(148,163,184,.55); box-shadow: 0 0 0 4px rgba(148,163,184,.08), 0 0 12px rgba(148,163,184,.20); }
.n5{ right: 22%; top: 30%; }
.n6{ right: 16%; bottom: 26%; opacity: .35; }
.n7{ left: 20%; bottom: 22%; opacity: .35; }
.n8{ left: 12%; bottom: 34%; background: rgba(56,189,248,.55); box-shadow: 0 0 0 4px rgba(56,189,248,.10), 0 0 16px rgba(56,189,248,.16); }

/* responsive */
@media (max-width: 640px){
  .reg-inner{ padding-top: 54px; }
  .reg-title{ font-size: 1.85rem; }
  .reg-search{ margin-top: 24px; }
  .reg-go{ width: 54px; }
}

/* center */
.reg-inner{
  position: relative;
  z-index: 2;
  max-width: 980px;
  margin: 0 auto;
  padding: 72px 22px 80px;
  text-align: center;
}

/* pixel logo (simple, no asset) */
.reg-logo{
  width: 120px;
  height: 72px;
  margin: 0 auto 22px;
  position: relative;
}

.pix{
  position: absolute;
  width: 16px;
  height: 16px;
  background: #0f172a;
  box-shadow: 0 0 0 1px rgba(15,23,42,.06);
}

.p1{ left: 12px; top: 28px; background: #0f172a; }
.p2{ left: 28px; top: 28px; background: #0f172a; }
.p3{ left: 44px; top: 28px; background: #facc15; }
.p4{ left: 60px; top: 28px; background: #facc15; }
.p5{ left: 76px; top: 28px; background: #facc15; }
.p6{ left: 92px; top: 28px; background: #0f172a; }
.p7{ left: 108px; top: 28px; background: #0f172a; }

.reg-title{
  margin: 0;
  font-size: 2.45rem;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: rgba(15,23,42,.9);
  font-weight: 800;
}

.reg-em{
  font-weight: 900;
}

.reg-links{
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.reg-mini-link{
  color: rgba(15,23,42,.65);
  text-decoration: underline;
  text-underline-offset: 3px;
  font-size: 0.95rem;
}

.reg-mini-link:hover{
  color: rgba(15,23,42,.85);
}

.reg-mini-sep{
  color: rgba(15,23,42,.3);
}

/* search bar like JSR */
.reg-search{
  margin: 34px auto 0;
  max-width: 920px;
  display: flex;
  align-items: stretch;
  border: 1px solid rgba(15,23,42,.18);
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.reg-in{
  flex: 1;
  min-width: 240px;
  padding: 16px 18px;
  font-size: 1.05rem;
  border: 0;
  outline: none;
  color: rgba(15,23,42,.92);
}

.reg-in::placeholder{
  color: rgba(15,23,42,.45);
}

.reg-go{
  width: 62px;
  border: 0;
  background: #083344;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.reg-go:disabled{
  opacity: 0.6;
  cursor: not-allowed;
}

.reg-go:hover{
  filter: brightness(1.06);
}

/* publish button */
.reg-publish{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  margin-top: 26px;
  padding: 12px 18px;
  border-radius: 8px;

  background: #facc15;
  color: #0f172a;
  font-weight: 800;
  text-decoration: none;
  border: 1px solid rgba(15,23,42,.18);
  box-shadow: 0 6px 0 rgba(15,23,42,.18);
}

.reg-publish:hover{
  transform: translateY(-1px);
  box-shadow: 0 7px 0 rgba(15,23,42,.18);
}

.plus{
  font-weight: 900;
  font-size: 1.1rem;
}

/* responsive */
@media (max-width: 640px){
  .reg-inner{ padding-top: 54px; }
  .reg-title{ font-size: 1.85rem; }
  .reg-search{ margin-top: 24px; }
  .reg-go{ width: 54px; }
}

/* =========================
   Registry hero – dark text tuning
   ========================= */

.reg-hero{
  color: #e5f9f6;
}

/* Main title */
.reg-title{
  color: #f8fafc;
}

/* Subtitle / secondary text */
.reg-sub,
.reg-links,
.reg-mini-link{
  color: rgba(226, 232, 240, 0.75);
}

/* Mini links hover */
.reg-mini-link:hover{
  color: #ffffff;
}

/* Top right links */
.reg-top-link{
  color: #60a5fa;
}

.reg-top-link:hover{
  color: #93c5fd;
}

/* Search bar */
.reg-search{
  background: rgba(255,255,255,0.92);
}

.reg-in{
  color: #020617;
}

.reg-in::placeholder{
  color: rgba(2,6,23,.45);
}

/* Search button */
.reg-go{
  background: #0f766e;
  color: #ecfeff;
}

.reg-go:hover{
  background: #14b8a6;
}

/* Publish button stays JSR-like */
.reg-publish{
  background: #facc15;
  color: #111827;
}

/* Small visual boost for pixel logo */
.reg-logo{
  filter: drop-shadow(0 6px 20px rgba(0,0,0,.45));
}

.reg-lines path{
  fill: none;
  stroke: rgba(94, 234, 212, 0.35);
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-linejoin: round;

  animation: linePulse 6s ease-in-out infinite;
}

.reg-lines path:nth-child(2){ animation-delay: 1.2s; }
.reg-lines path:nth-child(3){ animation-delay: 2.4s; }
.reg-lines path:nth-child(4){ animation-delay: 3.6s; }

@keyframes linePulse{
  0%{
    opacity: 0.15;
    transform: translateX(0);
  }
  50%{
    opacity: 0.45;
    transform: translateX(6px);
  }
  100%{
    opacity: 0.15;
    transform: translateX(0);
  }
}

.reg-logo-wrap{
  position: relative;
  display: inline-block;
}

.reg-logo-wrap::after{
  content: "";
  position: absolute;
  inset: -40%;
  background: radial-gradient(
    circle,
    rgba(94,234,212,.25),
    rgba(94,234,212,.12),
    transparent 65%
  );
  filter: blur(32px);
  z-index: -1;
}

.reg-hero{
  background: radial-gradient(circle at 50% 10%, rgba(20,184,166,.18), transparent 55%),
              radial-gradient(circle at 50% 55%, rgba(2,132,199,.10), transparent 60%),
              linear-gradient(to bottom, #011816, #020617) !important;
  color: #e5f9f6;
}

/* ensure the glow does not wash the page to white */
.reg-bg::after{
  opacity: .45 !important;
  mix-blend-mode: screen;
}

/* title + links visible */
.reg-title{
  color: #f8fafc !important;
  text-shadow: 0 12px 30px rgba(0,0,0,.55);
}

.reg-mini-link,
.reg-mini-sep{
  color: rgba(226,232,240,.78) !important;
}

.reg-mini-link:hover{ color: #fff !important; }

.reg-top-inner{
  display: flex;
  align-items: center;
  justify-content: space-between; /* important */
  gap: 14px;
  max-width: 1120px;
  margin: 0 auto;
}
.reg-hero{
  width: 100%;
  min-height: 100vh;
  margin: 0;
  border-radius: 0;
}
</style>
