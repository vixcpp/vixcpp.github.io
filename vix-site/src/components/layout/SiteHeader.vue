<template>
  <header class="site-header" :class="{ 'site-header--scrolled': scrolled }">
    <div class="site-header__inner container-wide">
      <RouterLink class="brand" to="/" aria-label="Vix.cpp home">
        <img class="brand__mark" :src="images.logo" alt="" />
        <span class="brand__name">Vix<span class="brand__dot">.cpp</span></span>
      </RouterLink>

      <nav class="nav" aria-label="Main navigation">
        <template v-for="item in site.nav" :key="item.label">
          <a
            v-if="item.external"
            class="nav__link"
            :href="item.href"
            target="_blank"
            rel="noreferrer"
          >
            {{ item.label }}
          </a>
          <RouterLink v-else class="nav__link" :to="item.href">
            {{ item.label }}
          </RouterLink>
        </template>
      </nav>

      <div class="site-header__right">
        <a
          class="github"
          :href="links.github"
          target="_blank"
          rel="noreferrer"
          aria-label="Open Vix.cpp on GitHub"
        >
          <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.21 11.19.6.11.82-.25.82-.57v-2.2c-3.34.71-4.04-1.58-4.04-1.58-.55-1.36-1.34-1.73-1.34-1.73-1.09-.73.08-.71.08-.71 1.2.08 1.84 1.21 1.84 1.21 1.07 1.79 2.81 1.27 3.5.97.11-.76.42-1.27.76-1.56-2.67-.3-5.47-1.31-5.47-5.81 0-1.28.47-2.33 1.23-3.15-.13-.3-.53-1.52.11-3.16 0 0 1-.32 3.3 1.2a11.6 11.6 0 0 1 6 0c2.28-1.52 3.29-1.2 3.29-1.2.65 1.64.24 2.86.12 3.16.77.82 1.23 1.87 1.23 3.15 0 4.51-2.81 5.5-5.49 5.79.43.37.81 1.1.81 2.22v3.29c0 .32.21.69.82.57A12.02 12.02 0 0 0 24 12.29C24 5.78 18.63.5 12 .5Z"
            />
          </svg>
          <span>GitHub</span>
        </a>

        <button
          class="menu-toggle"
          type="button"
          :aria-expanded="open"
          aria-label="Toggle navigation"
          @click="open = !open"
        >
          <span class="menu-toggle__bar" :class="{ open }" />
          <span class="menu-toggle__bar" :class="{ open }" />
        </button>
      </div>
    </div>

    <!-- Mobile drawer -->
    <transition name="drawer">
      <nav v-if="open" class="mobile-nav" aria-label="Mobile navigation">
        <template v-for="item in site.nav" :key="item.label">
          <a
            v-if="item.external"
            class="mobile-nav__link"
            :href="item.href"
            target="_blank"
            rel="noreferrer"
            @click="open = false"
          >
            {{ item.label }}
          </a>
          <RouterLink
            v-else
            class="mobile-nav__link"
            :to="item.href"
            @click="open = false"
          >
            {{ item.label }}
          </RouterLink>
        </template>
        <a
          class="mobile-nav__link mobile-nav__link--gh"
          :href="links.github"
          target="_blank"
          rel="noreferrer"
        >
          GitHub →
        </a>
      </nav>
    </transition>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { links } from "@/data/links";
import { images } from "@/data/images";
import { site } from "@/data/site";

const scrolled = ref(false);
const open = ref(false);

function onScroll() {
  scrolled.value = window.scrollY > 8;
}
onMounted(() => {
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
});
onUnmounted(() => window.removeEventListener("scroll", onScroll));
</script>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(26, 30, 34, 0.78);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition:
    border-color var(--speed) var(--ease),
    background var(--speed) var(--ease);
}

.site-header--scrolled {
  border-bottom-color: var(--line);
  background: rgba(26, 30, 34, 0.92);
}

.site-header__inner {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 60px;
}

/* ── Brand ── */
.brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  flex-shrink: 0;
}

.brand__mark {
  width: 26px;
  height: 26px;
}

.brand__name {
  font-size: 1.02rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text);
}

.brand__dot {
  color: var(--text-muted);
  font-weight: 600;
}

/* ── Nav (desktop) ── */
.nav {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.nav__link {
  position: relative;
  padding: 0.4rem 0.7rem;
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--text-soft);
  transition:
    color var(--speed) var(--ease),
    background var(--speed) var(--ease);
}

.nav__link:hover {
  color: var(--text);
  background: var(--bg-sunken);
}

.nav__link.router-link-active {
  color: var(--green-strong);
}

/* ── Right ── */
.site-header__right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.github {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0.45rem 0.85rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--line-strong);
  background: var(--bg-panel);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
  transition:
    border-color var(--speed) var(--ease),
    color var(--speed) var(--ease),
    transform var(--speed) var(--ease);
}

.github:hover {
  border-color: var(--green-line);
  color: var(--green-strong);
  transform: translateY(-1px);
}

/* ── Mobile toggle ── */
.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: var(--bg-panel);
}

.menu-toggle__bar {
  display: block;
  width: 17px;
  height: 1.8px;
  margin: 0 auto;
  background: var(--text);
  border-radius: 2px;
  transition:
    transform var(--speed) var(--ease),
    opacity var(--speed) var(--ease);
}
.menu-toggle__bar.open:first-child {
  transform: translateY(3.4px) rotate(45deg);
}
.menu-toggle__bar.open:last-child {
  transform: translateY(-3.4px) rotate(-45deg);
}

/* ── Mobile drawer ── */
.mobile-nav {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  flex-direction: column;
  padding: 8px 16px 16px;
  border-bottom: 1px solid var(--line);
  background: rgba(26, 30, 34, 0.98);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
}

.mobile-nav__link {
  padding: 0.7rem 0.6rem;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-soft);
  border-bottom: 1px solid var(--line-soft);
}
.mobile-nav__link:last-child {
  border-bottom: none;
}
.mobile-nav__link:hover {
  color: var(--text);
}
.mobile-nav__link--gh {
  margin-top: 6px;
  color: var(--green-strong);
  font-weight: 600;
}

.drawer-enter-active,
.drawer-leave-active {
  transition:
    opacity var(--speed) var(--ease),
    transform var(--speed) var(--ease);
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── Responsive ── */
@media (max-width: 860px) {
  .nav {
    display: none;
  }
  .github span {
    display: none;
  }
  .github {
    padding: 0.5rem;
  }
  .menu-toggle {
    display: flex;
  }
  .mobile-nav {
    display: flex;
  }
}
</style>
