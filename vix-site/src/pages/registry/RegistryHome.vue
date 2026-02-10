<template>
  <section class="reg-hero">
    <header class="reg-top">
      <div class="reg-top-inner">
        <nav class="reg-top-right">
          <RouterLink class="reg-top-link" to="/registry/browse">Browse packages</RouterLink>
          <a class="reg-top-link" href="/docs/" target="_self" rel="noreferrer">Docs</a>
        </nav>
      </div>
    </header>

    <div class="reg-bg" aria-hidden="true">
      <RegistryNetBg />
    </div>

    <div class="reg-inner">
      <div class="reg-logo-wrap" aria-hidden="true">
        <svg
          class="reg-logo-svg"
          viewBox="0 0 160 160"
          width="96"
          height="96"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="vixGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#5eead4" />
              <stop offset="100%" stop-color="#22c55e" />
            </linearGradient>

            <filter id="glow">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- Hexagon outline -->
          <path
            d="M80 10
              L135 42
              L135 118
              L80 150
              L25 118
              L25 42
              Z"
            fill="none"
            stroke="url(#vixGrad)"
            stroke-width="6"
            filter="url(#glow)"
          />

          <!-- V letter -->
          <path
            d="M52 48
              L80 110
              L108 48
              L98 48
              L80 90
              L62 48
              Z"
            fill="url(#vixGrad)"
          />

          <!-- Small cubes -->
          <rect x="92" y="104" width="12" height="12" rx="2" fill="#e5f9f6" />
          <rect x="108" y="96" width="12" height="12" rx="2" fill="#e5f9f6" />
          <rect x="124" y="88" width="12" height="12" rx="2" fill="#e5f9f6" />

          <!-- Purple node -->
          <circle cx="118" cy="30" r="8" fill="#a5b4fc" />
        </svg>
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
import RegistryNetBg from "@/components/RegistryNetBg.vue";

const router = useRouter();
const q = ref("");

function goSearch() {
  const s = q.value.trim();
  if (!s) return;
  router.push({ path: "/registry/browse", query: { q: s } });
}
</script>

<style scoped>
.reg-hero{
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 12%, rgba(34, 211, 238, 0.10), transparent 55%),
    radial-gradient(circle at 50% 60%, rgba(16, 185, 129, 0.08), transparent 60%),
    linear-gradient(to bottom, #031b1a, #020617);
  color: #e5f9f6;
}

.reg-top{
  position: relative;
  z-index: 3;
  padding: 18px 22px 0;
}

.reg-top-inner{
  max-width: 1120px;
  margin: 0 auto;
  display: flex;
  justify-content: flex-end;
}

.reg-top-right{
  display: inline-flex;
  align-items: center;
  gap: 18px;
}

.reg-top-link{
  font-size: 0.98rem;
  color: rgba(147, 197, 253, 0.95);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.reg-top-link:hover{
  color: rgba(191, 219, 254, 1);
}

.reg-bg{
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: auto;
}

.reg-inner{
  position: relative;
  z-index: 2;
  max-width: 980px;
  margin: 0 auto;
  padding: 92px 22px 90px;
  text-align: center;
  pointer-events: none;
}

.reg-inner a,
.reg-inner button,
.reg-inner input{
  pointer-events: auto;
}

.reg-title{
  margin: 0;
  font-size: 2.45rem;
  line-height: 1.08;
  letter-spacing: -0.03em;
  color: #f8fafc;
  font-weight: 850;
  text-shadow: 0 12px 30px rgba(0,0,0,.55);
}

.reg-em{ font-weight: 950; }

.reg-links{
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.reg-mini-link{
  color: rgba(226,232,240,.78);
  text-decoration: underline;
  text-underline-offset: 3px;
  font-size: 0.95rem;
}

.reg-mini-link:hover{ color: #ffffff; }
.reg-mini-sep{ color: rgba(226,232,240,.25); }

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
.reg-go:disabled{ opacity: 0.65; cursor: not-allowed; }

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
  transition: transform .10s ease, box-shadow .10s ease;
}

.reg-publish:hover{
  transform: translateY(-1px);
  box-shadow: 0 11px 0 rgba(0,0,0,.22);
}

.plus{ font-weight: 900; font-size: 1.1rem; }

/* Pixel logo */
.reg-logo-wrap{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  filter: drop-shadow(0 10px 30px rgba(0,0,0,.55));
}

.reg-logo-svg{
  width: 96px;
  height: 96px;
}

.reg-logo-svg{
  animation: logoFloat 6s ease-in-out infinite;
}

@keyframes logoFloat{
  0%{ transform: translateY(0); }
  50%{ transform: translateY(-4px); }
  100%{ transform: translateY(0); }
}
.reg-logo{
  width: 120px;
  height: 72px;
  margin: 0 auto;
  position: relative;
}

.pix{
  position: absolute;
  width: 16px;
  height: 16px;
  background: #0f172a;
}

.p1{ left: 12px; top: 28px; }
.p2{ left: 28px; top: 28px; }
.p3{ left: 44px; top: 28px; background: #facc15; }
.p4{ left: 60px; top: 28px; background: #facc15; }
.p5{ left: 76px; top: 28px; background: #facc15; }
.p6{ left: 92px; top: 28px; }
.p7{ left: 108px; top: 28px; }

/* Responsive */
@media (max-width: 640px){
  .reg-top{ padding-left: 16px; padding-right: 16px; }
  .reg-inner{ padding: 70px 16px 70px; }
  .reg-title{ font-size: 1.85rem; }
  .reg-search{ margin-top: 24px; }
  .reg-go{ width: 54px; }
}
</style>
