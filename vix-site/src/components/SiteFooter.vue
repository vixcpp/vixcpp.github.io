<template>
  <footer class="ft">
    <div class="ft-inner">

      <!-- Left: brand + tagline -->
      <div class="ft-brand">
        <RouterLink class="ft-logo" to="/" aria-label="Vix.cpp home">
          <svg class="ft-logo-mark" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="ftg-left" x1="5" y1="6" x2="18" y2="30" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#d4fcd4"/>
                <stop offset="55%" stop-color="#4ade80"/>
                <stop offset="100%" stop-color="#22c55e"/>
              </linearGradient>
              <linearGradient id="ftg-right" x1="31" y1="6" x2="18" y2="30" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#22c55e"/>
                <stop offset="100%" stop-color="#15803d"/>
              </linearGradient>
            </defs>
            <polygon points="5,6 12,6 18,28 14,28" fill="url(#ftg-left)"/>
            <polygon points="31,6 24,6 18,28 22,28" fill="url(#ftg-right)"/>
            <line x1="9" y1="16" x2="13.5" y2="29" stroke="#bbf7d0" stroke-width="1.1" stroke-linecap="round" opacity="0.65"/>
          </svg>
          <span class="ft-logo-wordmark">
            <span class="ft-logo-name">Vix</span><span class="ft-logo-ext">.cpp</span>
          </span>
        </RouterLink>
        <p class="ft-tagline">A modern C++ runtime for building fast and reliable applications.</p>
      </div>

      <!-- Center: links -->
      <nav class="ft-nav" aria-label="Footer">
        <div class="ft-nav-group">
          <span class="ft-nav-label">Project</span>
          <a class="ft-link" href="https://github.com/vixcpp/vix" target="_blank" rel="noreferrer">GitHub</a>
          <a class="ft-link" href="https://github.com/vixcpp/vix/releases" target="_blank" rel="noreferrer">Releases</a>
          <a class="ft-link" href="https://github.com/vixcpp/vix/issues" target="_blank" rel="noreferrer">Issues</a>
        </div>
        <div class="ft-nav-group">
          <span class="ft-nav-label">Resources</span>
          <a class="ft-link" href="https://docs.vixcpp.com" target="_blank" rel="noreferrer">Docs</a>
          <a class="ft-link" href="https://registry.vixcpp.com" target="_blank" rel="noreferrer">Registry</a>
          <RouterLink class="ft-link" to="/install">Install</RouterLink>
        </div>
        <div class="ft-nav-group">
          <span class="ft-nav-label">Community</span>
          <RouterLink class="ft-link" to="/support">Support</RouterLink>
          <a class="ft-link" href="https://github.com/vixcpp/vix/discussions" target="_blank" rel="noreferrer">Discussions</a>
        </div>
      </nav>

    </div>

    <!-- Bottom bar -->
    <div class="ft-bottom">
      <div class="ft-bottom-inner">
        <span class="ft-copy">
          MIT licensed &nbsp;·&nbsp; Vix.cpp
          <span v-if="appVersion" class="ft-version">v{{ appVersion }}</span>
        </span>
        <span class="ft-copy">Built by Softadastra</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
const appVersion = import.meta.env.VITE_APP_VERSION;
</script>

<style scoped>
.ft {
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  margin-top: 0;
}

.ft-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 48px 1.5rem 40px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 48px;
  align-items: start;
}

/* ===================== BRAND ===================== */
.ft-logo {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  text-decoration: none;
  margin-bottom: 12px;
}

.ft-logo-mark {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  opacity: 0.85;
}

.ft-logo-wordmark {
  display: inline-flex;
  align-items: baseline;
  gap: 0;
}

.ft-logo-name {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: #22c55e;
}

.ft-logo-ext {
  font-size: 0.9rem;
  font-weight: 400;
  color: rgba(167, 243, 208, 0.4);
}

.ft-tagline {
  margin: 0;
  font-size: 0.82rem;
  color: rgba(148, 163, 184, 0.6);
  line-height: 1.6;
  max-width: 34ch;
}

/* ===================== NAV ===================== */
.ft-nav {
  display: flex;
  gap: 48px;
  align-items: start;
}

.ft-nav-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ft-nav-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.45);
  margin-bottom: 2px;
}

.ft-link {
  font-size: 0.82rem;
  color: rgba(203, 213, 225, 0.6);
  text-decoration: none;
  transition: color 0.14s ease;
  white-space: nowrap;
}

.ft-link:hover {
  color: #e2e8f0;
}

/* ===================== BOTTOM BAR ===================== */
.ft-bottom {
  border-top: 1px solid rgba(148, 163, 184, 0.07);
}

.ft-bottom-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 14px 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.ft-copy {
  font-size: 0.76rem;
  color: rgba(148, 163, 184, 0.4);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.ft-version {
  padding: 1px 7px;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.18);
  background: rgba(34, 197, 94, 0.06);
  color: rgba(167, 243, 208, 0.6);
  font-size: 0.7rem;
  font-weight: 700;
}

/* ===================== RESPONSIVE ===================== */
@media (max-width: 720px) {
  .ft-inner {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 36px 1.25rem 28px;
  }

  .ft-nav {
    gap: 28px;
    flex-wrap: wrap;
  }

  .ft-bottom-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 12px 1.25rem;
  }
}
</style>
