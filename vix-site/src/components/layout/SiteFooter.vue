<template>
  <footer class="footer">
    <div class="footer__inner container-wide">
      <section class="footer__brand">
        <RouterLink class="brand" to="/" aria-label="Vix.cpp home">
          <img class="brand__mark" :src="images.logo" alt="" />
          <span class="brand__name"
            >Vix<span class="brand__dot">.cpp</span></span
          >
        </RouterLink>
        <p class="footer__tagline">
          A modern application workflow for native C++.
        </p>
        <p class="footer__meta">
          Maintained by
          <a :href="links.softadastra" target="_blank" rel="noreferrer"
            >Softadastra</a
          >.
        </p>
      </section>

      <nav class="footer__nav" aria-label="Footer navigation">
        <div class="footer__group">
          <span class="footer__label">Project</span>
          <a :href="links.github" target="_blank" rel="noreferrer">GitHub</a>
          <a :href="links.releasesGithub" target="_blank" rel="noreferrer"
            >Releases</a
          >
          <a :href="links.issues" target="_blank" rel="noreferrer">Issues</a>
          <a :href="links.discussions" target="_blank" rel="noreferrer"
            >Discussions</a
          >
        </div>
        <div class="footer__group">
          <span class="footer__label">Site</span>
          <RouterLink to="/install">Install</RouterLink>
          <RouterLink to="/sdks">SDKs</RouterLink>
          <RouterLink to="/registry">Registry</RouterLink>
          <RouterLink to="/ecosystem">Ecosystem</RouterLink>
          <RouterLink to="/pico">Pico</RouterLink>
          <RouterLink to="/about">About</RouterLink>
        </div>
        <div class="footer__group">
          <span class="footer__label">Resources</span>
          <a :href="links.docs" target="_blank" rel="noreferrer">Docs</a>
          <a :href="links.registryExternal" target="_blank" rel="noreferrer"
            >Registry Index</a
          >
          <a :href="links.blog" target="_blank" rel="noreferrer"
            >Engineering Notes</a
          >
          <RouterLink to="/security">Security</RouterLink>
          <RouterLink to="/releases">Release Notes</RouterLink>
        </div>
        <div class="footer__group">
          <span class="footer__label">Ecosystem</span>
          <a :href="links.rix" target="_blank" rel="noreferrer">Rix</a>
          <a :href="links.pico" target="_blank" rel="noreferrer">Pico app</a>
          <a :href="links.cnerium" target="_blank" rel="noreferrer">Cnerium</a>
          <a :href="links.kordex" target="_blank" rel="noreferrer">Kordex</a>
        </div>
      </nav>
    </div>

    <div class="footer__bottom">
      <div class="footer__bottom-inner container-wide">
        <span class="footer__bottom-left">
          <svg
            class="footer__mark"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <polygon points="28,24 45,24 60,96 50,96" fill="#4ade80" />
            <polygon points="92,24 75,24 60,96 70,96" fill="#22c55e" />
          </svg>
          MIT licensed · Vix.cpp
        </span>
        <span>Built by Softadastra</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { links } from "@/data/links";
import { images } from "@/data/images";
</script>

<style scoped>
.footer {
  position: relative;
  background: var(--bg-ink);
  color: var(--text-invert);
}

.footer__inner {
  display: grid;
  grid-template-columns: minmax(220px, 1.1fr) 2fr;
  gap: clamp(36px, 6vw, 80px);
  padding: clamp(56px, 7vw, 88px) 0 clamp(40px, 5vw, 64px);
}

/* ── Brand block ── */
.brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
}
.brand__mark {
  width: 28px;
  height: 28px;
}
.brand__name {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-invert);
}
.brand__dot {
  color: var(--text-invert-soft);
  font-weight: 600;
}

.footer__tagline {
  margin-top: 16px;
  max-width: 32ch;
  color: var(--text-invert-soft);
  font-size: 0.95rem;
  line-height: 1.65;
}

.footer__meta {
  margin-top: 16px;
  font-size: 0.85rem;
  color: var(--text-invert-soft);
}
.footer__meta a {
  color: var(--green-bright);
  font-weight: 600;
}
.footer__meta a:hover {
  color: #86efac;
}

/* ── Nav columns ── */
.footer__nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 28px;
}

.footer__group {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.footer__label {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--green-bright);
  margin-bottom: 2px;
}

.footer__group a {
  font-size: 0.88rem;
  color: var(--text-invert-soft);
  transition: color var(--speed) var(--ease);
  width: fit-content;
}
.footer__group a:hover {
  color: var(--text-invert);
}

/* ── Bottom bar ── */
.footer__bottom {
  border-top: 1px solid var(--line-ink);
}

.footer__bottom-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 0;
  font-family: var(--font-mono);
  font-size: 0.76rem;
  color: var(--text-invert-soft);
}

.footer__bottom-left {
  display: inline-flex;
  align-items: center;
  gap: 9px;
}

.footer__mark {
  width: 14px;
  height: 14px;
}

/* ── Responsive ── */
@media (max-width: 860px) {
  .footer__inner {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .footer__nav {
    grid-template-columns: repeat(2, 1fr);
    gap: 28px 24px;
  }
}

@media (max-width: 520px) {
  .footer__bottom-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
