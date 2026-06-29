<template>
  <footer class="footer">
    <div class="footer__inner">
      <section class="footer__brand">
        <RouterLink class="brand" to="/" aria-label="Vix.cpp home">
          <img class="brand__mark" :src="images.logo" alt="" />
          <span class="brand__name">Vix.cpp</span>
        </RouterLink>

        <p class="footer__tagline">
          A modern application workflow for native C++.
        </p>

        <p class="footer__meta">
          Maintained by
          <a :href="links.softadastra" target="_blank" rel="noreferrer">
            Softadastra </a
          >.
        </p>
      </section>

      <nav class="footer__nav" aria-label="Footer navigation">
        <div class="footer__group">
          <span class="footer__label">Project</span>
          <a :href="links.github" target="_blank" rel="noreferrer">GitHub</a>
          <a :href="links.releases" target="_blank" rel="noreferrer"
            >Releases</a
          >
          <a :href="links.issues" target="_blank" rel="noreferrer">Issues</a>
          <a :href="links.discussions" target="_blank" rel="noreferrer">
            Discussions
          </a>
        </div>

        <div class="footer__group">
          <span class="footer__label">Resources</span>
          <a :href="links.docs" target="_blank" rel="noreferrer">Docs</a>
          <a :href="links.registry" target="_blank" rel="noreferrer"
            >Registry</a
          >
          <a :href="links.blog" target="_blank" rel="noreferrer">
            Engineering Notes
          </a>
          <RouterLink to="/install">Install</RouterLink>
        </div>

        <div class="footer__group">
          <span class="footer__label">Ecosystem</span>
          <a :href="links.rix" target="_blank" rel="noreferrer">Rix</a>
          <a :href="links.pico" target="_blank" rel="noreferrer">Pico</a>
          <a :href="links.cnerium" target="_blank" rel="noreferrer">Cnerium</a>
          <a :href="links.kordex" target="_blank" rel="noreferrer">Kordex</a>
        </div>
      </nav>
    </div>

    <div class="footer__bottom">
      <div class="footer__bottom-inner">
        <span>MIT licensed · Vix.cpp</span>
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
  border-top: 1px solid rgba(148, 163, 184, 0.08);
  background:
    radial-gradient(
      circle at 12% 0%,
      rgba(34, 197, 94, 0.05),
      transparent 28rem
    ),
    rgba(3, 7, 5, 0.5);
}

.footer__inner {
  width: min(100% - 2rem, var(--container-wide));
  margin-inline: auto;
  padding: 56px 0 44px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 56px;
  align-items: start;
}

.footer__brand {
  max-width: 380px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.brand:hover {
  color: inherit;
}

.brand__mark {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
}

.brand__name {
  color: var(--text);
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.footer__tagline {
  margin-top: 16px;
  color: var(--text-soft);
  font-size: 0.92rem;
  line-height: 1.7;
}

.footer__meta {
  margin-top: 12px;
  color: var(--text-faint);
  font-size: 0.82rem;
  line-height: 1.65;
}

.footer__meta a {
  color: var(--text-muted);
  text-decoration: none;
}

.footer__meta a:hover {
  color: var(--green-soft);
}

.footer__nav {
  display: flex;
  gap: 52px;
}

.footer__group {
  min-width: 126px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.footer__label {
  margin-bottom: 4px;
  color: var(--text-faint);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.footer__group a {
  color: var(--text-muted);
  font-size: 0.84rem;
  line-height: 1.35;
  text-decoration: none;
  transition: color var(--speed) var(--ease);
}

.footer__group a:hover {
  color: var(--text);
}

.footer__bottom {
  border-top: 1px solid rgba(148, 163, 184, 0.07);
}

.footer__bottom-inner {
  width: min(100% - 2rem, var(--container-wide));
  min-height: 48px;
  margin-inline: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: var(--text-faint);
  font-size: 0.76rem;
}

@media (max-width: 820px) {
  .footer__inner {
    grid-template-columns: 1fr;
    gap: 36px;
    padding: 44px 0 34px;
  }

  .footer__nav {
    flex-wrap: wrap;
    gap: 32px;
  }

  .footer__bottom-inner {
    padding: 14px 0;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
  }
}
</style>
