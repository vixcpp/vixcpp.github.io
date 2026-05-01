<template>
  <header class="hdr" :class="{ 'hdr--scrolled': scrolled }">
    <div class="hdr-inner">

      <!-- Brand -->
      <RouterLink class="brand" to="/" @click="closeMobile()" aria-label="Vix.cpp home">
        <svg class="brand-mark" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="vg-left" x1="5" y1="6" x2="18" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#d4fcd4"/>
              <stop offset="55%" stop-color="#4ade80"/>
              <stop offset="100%" stop-color="#22c55e"/>
            </linearGradient>
            <linearGradient id="vg-right" x1="31" y1="6" x2="18" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#22c55e"/>
              <stop offset="100%" stop-color="#15803d"/>
            </linearGradient>
            <filter id="vg-glow">
              <feGaussianBlur stdDeviation="1.2" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <!-- Left arm -->
          <polygon points="5,6 12,6 18,28 14,28" fill="url(#vg-left)" filter="url(#vg-glow)"/>
          <!-- Right arm -->
          <polygon points="31,6 24,6 18,28 22,28" fill="url(#vg-right)"/>
          <!-- Speed slash accent -->
          <line x1="9" y1="16" x2="13.5" y2="29" stroke="#bbf7d0" stroke-width="1.1" stroke-linecap="round" opacity="0.7"/>
        </svg>
        <span class="brand-wordmark">
          <span class="brand-name">Vix</span><span class="brand-ext">.cpp</span>
        </span>
      </RouterLink>

      <!-- Desktop nav -->
      <nav class="nav" aria-label="Primary">
        <template v-for="item in navItems" :key="itemKey(item)">

          <!-- Dropdown -->
          <div
            v-if="Array.isArray(item.items) && item.items.length"
            class="dd"
            @mouseenter="openDropdown(item.label)"
            @mouseleave="closeDropdown(item.label)"
          >
            <button
              type="button"
              class="nav-link dd-btn"
              :class="{ active: isActive(item) || item.items.some(isChildActive) }"
              @click="toggleDropdown(item.label)"
              :aria-expanded="String(isOpen(item.label))"
              aria-haspopup="menu"
            >
              {{ item.label }}
              <svg class="chev" viewBox="0 0 10 6" fill="none" :class="{ flip: isOpen(item.label) }">
                <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <div class="dd-panel" :class="{ open: isOpen(item.label) }" role="menu">
              <template v-for="child in item.items" :key="childKey(child)">
                <a
                  v-if="isExternal(child)"
                  class="dd-item"
                  :class="{ active: isChildActive(child) }"
                  :href="child.href"
                  :target="child.target || (isSameOrigin(child.href) ? '_self' : '_blank')"
                  rel="noreferrer"
                  @click="closeAll()"
                >
                  {{ child.label }}
                </a>
                <RouterLink
                  v-else
                  class="dd-item"
                  :class="{ active: isChildActive(child) }"
                  :to="child.to"
                  @click="closeAll()"
                >
                  {{ child.label }}
                </RouterLink>
              </template>
            </div>
          </div>

          <!-- External link -->
          <a
            v-else-if="isExternal(item)"
            class="nav-link"
            :class="{ active: isActive(item) }"
            :href="item.href"
            :target="item.target || (isSameOrigin(item.href) ? '_self' : '_blank')"
            rel="noreferrer"
          >{{ item.label }}</a>

          <!-- Internal link -->
          <RouterLink
            v-else
            class="nav-link"
            :class="{ active: isActive(item) }"
            :to="item.to"
            @click="closeAll()"
          >{{ item.label }}</RouterLink>

        </template>
      </nav>

      <!-- Desktop CTA -->
      <div class="hdr-actions">
        <a
          class="hdr-github"
          href="https://github.com/vixcpp/vix"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
        </a>

        <RouterLink class="hdr-install" to="/install">
          Install
        </RouterLink>
      </div>

      <!-- Burger -->
      <button
        type="button"
        class="burger"
        :class="{ open: mobileOpen }"
        aria-label="Toggle navigation"
        @click="toggleMobile()"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

    </div>

    <!-- Mobile panel -->
    <Transition name="mnav">
      <div v-if="mobileOpen" class="mnav">
        <template v-for="item in navItems" :key="'m-' + itemKey(item)">

          <!-- Dropdown group -->
          <div v-if="Array.isArray(item.items) && item.items.length" class="mgroup">
            <button
              type="button"
              class="mlink mgroup-btn"
              :class="{ active: isActive(item) || item.items.some(isChildActive) }"
              @click="toggleMobileGroup(item.label)"
              :aria-expanded="String(isMobileGroupOpen(item.label))"
            >
              <span>{{ item.label }}</span>
              <svg class="chev" viewBox="0 0 10 6" fill="none" :class="{ flip: isMobileGroupOpen(item.label) }">
                <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <Transition name="mdd">
              <div v-if="isMobileGroupOpen(item.label)" class="mgroup-items">
                <template v-for="child in item.items" :key="'mc-' + childKey(child)">
                  <a
                    v-if="isExternal(child)"
                    class="msublink"
                    :class="{ active: isChildActive(child) }"
                    :href="child.href"
                    :target="child.target || (isSameOrigin(child.href) ? '_self' : '_blank')"
                    rel="noreferrer"
                    @click="closeMobile()"
                  >{{ child.label }}</a>
                  <RouterLink
                    v-else
                    class="msublink"
                    :class="{ active: isChildActive(child) }"
                    :to="child.to"
                    @click="closeMobile()"
                  >{{ child.label }}</RouterLink>
                </template>
              </div>
            </Transition>
          </div>

          <!-- External -->
          <a
            v-else-if="isExternal(item)"
            class="mlink"
            :class="{ active: isActive(item) }"
            :href="item.href"
            :target="item.target || (isSameOrigin(item.href) ? '_self' : '_blank')"
            rel="noreferrer"
            @click="closeMobile()"
          >{{ item.label }}</a>

          <!-- Internal -->
          <RouterLink
            v-else
            class="mlink"
            :class="{ active: isActive(item) }"
            :to="item.to"
            @click="closeMobile()"
          >{{ item.label }}</RouterLink>

        </template>

        <!-- Mobile CTAs -->
        <div class="mnav-footer">
          <a
            class="mnav-github"
            href="https://github.com/vixcpp/vix"
            target="_blank"
            rel="noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            GitHub
          </a>
          <RouterLink class="mnav-install" to="/install" @click="closeMobile()">
            Install
          </RouterLink>
        </div>
      </div>
    </Transition>

  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { NAV } from "@/data/nav";

const route = useRoute();
const navItems = computed(() => NAV);

/* Scroll state */
const scrolled = ref(false);
function onScroll() { scrolled.value = window.scrollY > 12; }
onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
});
onBeforeUnmount(() => window.removeEventListener("scroll", onScroll));

/* Helpers */
function isExternal(item) { return !!item?.external || !!item?.href; }

function normalizePath(p) {
  if (!p) return "";
  const q = p.indexOf("?");
  const h = p.indexOf("#");
  const cut = Math.min(q === -1 ? p.length : q, h === -1 ? p.length : h);
  return p.slice(0, cut);
}

function isActive(item) {
  const match = item?.match || "";
  if (!match) return false;
  const current = normalizePath(route.path);
  return current === match || current.startsWith(match + "/");
}

function isChildActive(child) {
  if (child?.to) return normalizePath(route.path).startsWith(normalizePath(child.to));
  if (child?.href && isSameOrigin(child.href)) {
    const path = normalizePath(new URL(child.href, window.location.origin).pathname);
    const current = normalizePath(route.path);
    return current === path || current.startsWith(path + "/");
  }
  return false;
}

function isSameOrigin(href) {
  if (!href) return false;
  if (href.startsWith("/")) return true;
  try {
    return new URL(href, window.location.origin).origin === window.location.origin;
  } catch { return false; }
}

function itemKey(item) {
  if (item.items?.length) return `dd:${item.label}`;
  if (isExternal(item)) return `href:${item.href}`;
  return `to:${item.to}`;
}

function childKey(child) {
  if (isExternal(child)) return `href:${child.href}`;
  return `to:${child.to}`;
}

/* Desktop dropdown */
const openKey = ref("");
function isOpen(label) { return openKey.value === label; }
function openDropdown(label) { openKey.value = label; }
function closeDropdown(label) { if (openKey.value === label) openKey.value = ""; }
function toggleDropdown(label) { openKey.value = openKey.value === label ? "" : label; }
function closeAll() { openKey.value = ""; }

function onDocClick(e) {
  if (!(e.target instanceof Element)) return;
  if (!e.target.closest(".hdr")) closeAll();
}
function onKey(e) { if (e.key === "Escape") { closeAll(); closeMobile(); } }

onMounted(() => {
  document.addEventListener("click", onDocClick, { passive: true });
  document.addEventListener("keydown", onKey);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
  document.removeEventListener("keydown", onKey);
});

/* Mobile */
const mobileOpen = ref(false);
const mobileGroups = ref(new Set());

function toggleMobile() {
  mobileOpen.value = !mobileOpen.value;
  if (!mobileOpen.value) mobileGroups.value = new Set();
  document.documentElement.classList.toggle("nav-open", mobileOpen.value);
}

function closeMobile() {
  mobileOpen.value = false;
  mobileGroups.value = new Set();
  document.documentElement.classList.remove("nav-open");
}

function toggleMobileGroup(label) {
  const s = new Set(mobileGroups.value);
  s.has(label) ? s.delete(label) : s.add(label);
  mobileGroups.value = s;
}

function isMobileGroupOpen(label) { return mobileGroups.value.has(label); }

onBeforeUnmount(() => document.documentElement.classList.remove("nav-open"));
</script>

<style scoped>
/* ===================== SHELL ===================== */
.hdr {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 80;
  width: 100%;
  transition: background 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  background: rgba(2, 13, 10, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(34, 197, 94, 0.08);
}

.hdr--scrolled {
  background: rgba(2, 13, 10, 0.95);
  border-bottom-color: rgba(34, 197, 94, 0.14);
  box-shadow: 0 1px 0 rgba(34, 197, 94, 0.06), 0 8px 32px rgba(0, 0, 0, 0.4);
}

:global(:root) { --hdr-h: 60px; }
:global(main),
:global(.main),
:global(#app > .page) {
  padding-top: var(--hdr-h);
}

.hdr-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.25rem;
  height: var(--hdr-h);
  display: flex;
  align-items: center;
  gap: 0;
}

/* ===================== BRAND ===================== */
.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  margin-right: 2rem;
  flex-shrink: 0;
}

.brand-mark {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  transition: filter 0.2s ease;
}

.brand:hover .brand-mark {
  filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.55));
}

.brand-wordmark {
  display: inline-flex;
  align-items: baseline;
  gap: 0;
  line-height: 1;
}

.brand-name {
  font-size: 1.18rem;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: #22c55e;
  line-height: 1;
}

.brand-ext {
  font-size: 1rem;
  font-weight: 400;
  color: rgba(167, 243, 208, 0.5);
  letter-spacing: 0.2px;
  line-height: 1;
}

/* ===================== DESKTOP NAV ===================== */
.nav {
  display: none;
  align-items: center;
  gap: 0.2rem;
  flex: 1;
}

.nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(203, 213, 225, 0.75);
  text-decoration: none;
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
  white-space: nowrap;
}

.nav-link:hover {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.05);
}

.nav-link.active {
  color: #4ade80;
}

.nav-link.active::after {
  content: "";
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 2px;
  height: 2px;
  border-radius: 999px;
  background: #22c55e;
  opacity: 0.6;
}

/* ===================== CHEVRON ===================== */
.chev {
  width: 10px;
  height: 6px;
  color: currentColor;
  opacity: 0.7;
  transition: transform 0.18s ease;
  flex-shrink: 0;
}

.chev.flip {
  transform: rotate(180deg);
}

/* ===================== DROPDOWN ===================== */
.dd {
  position: relative;
}

.dd-btn {
  /* inherits nav-link */
}

.dd-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 200px;
  padding: 6px;
  border-radius: 12px;
  background: rgba(2, 13, 10, 0.98);
  border: 1px solid rgba(34, 197, 94, 0.2);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(34, 197, 94, 0.06);
  display: none;
  flex-direction: column;
  gap: 2px;
  z-index: 90;
  backdrop-filter: blur(12px);
}

.dd-panel.open {
  display: flex;
  animation: ddIn 0.14s ease-out;
}

@keyframes ddIn {
  from { opacity: 0; transform: translateY(-4px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.dd-item {
  display: block;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.875rem;
  color: rgba(203, 213, 225, 0.82);
  text-decoration: none;
  transition: background 0.12s ease, color 0.12s ease;
}

.dd-item:hover {
  background: rgba(34, 197, 94, 0.08);
  color: #e2e8f0;
}

.dd-item.active {
  color: #4ade80;
  background: rgba(34, 197, 94, 0.06);
}

/* ===================== HEADER ACTIONS ===================== */
.hdr-actions {
  display: none;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.hdr-github {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.14);
  color: rgba(203, 213, 225, 0.7);
  text-decoration: none;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.hdr-github svg {
  width: 16px;
  height: 16px;
}

.hdr-github:hover {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(148, 163, 184, 0.28);
}

.hdr-install {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  background: #22c55e;
  color: #021a10;
  text-decoration: none;
  border: none;
  transition: background 0.15s ease, transform 0.12s ease, box-shadow 0.15s ease;
  box-shadow: 0 4px 14px rgba(34, 197, 94, 0.22);
}

.hdr-install:hover {
  background: #4ade80;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(34, 197, 94, 0.32);
}

.hdr-install:active {
  transform: translateY(0);
}

/* ===================== BURGER ===================== */
.burger {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  margin-left: auto;
  transition: background 0.15s ease, border-color 0.15s ease;
  flex-shrink: 0;
}

.burger:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(148, 163, 184, 0.28);
}

.burger span {
  display: block;
  width: 15px;
  height: 1.5px;
  border-radius: 999px;
  background: rgba(203, 213, 225, 0.8);
  transition: transform 0.2s ease, opacity 0.2s ease, width 0.2s ease;
}

.burger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
.burger.open span:nth-child(2) { opacity: 0; width: 0; }
.burger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

/* ===================== MOBILE PANEL ===================== */
.mnav {
  border-top: 1px solid rgba(34, 197, 94, 0.1);
  background: rgba(2, 13, 10, 0.98);
  padding: 8px 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mnav-enter-active,
.mnav-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.mnav-enter-from,
.mnav-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.mlink {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 0.92rem;
  font-weight: 500;
  color: rgba(203, 213, 225, 0.8);
  text-decoration: none;
  background: transparent;
  border: 0;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background 0.12s ease, color 0.12s ease;
}

.mlink:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #e2e8f0;
}

.mlink.active {
  color: #4ade80;
}

.mgroup-btn {
  /* inherits mlink */
}

.mgroup-items {
  padding: 2px 0 4px 12px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.mdd-enter-active,
.mdd-leave-active {
  transition: opacity 0.14s ease, transform 0.14s ease;
}

.mdd-enter-from,
.mdd-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.msublink {
  display: block;
  padding: 8px 12px;
  border-radius: 7px;
  font-size: 0.875rem;
  color: rgba(203, 213, 225, 0.65);
  text-decoration: none;
  transition: background 0.12s ease, color 0.12s ease;
}

.msublink:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #e2e8f0;
}

.msublink.active {
  color: #4ade80;
}

.mnav-footer {
  display: flex;
  gap: 8px;
  padding: 12px 12px 0;
  margin-top: 4px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.mnav-github {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(203, 213, 225, 0.8);
  text-decoration: none;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.03);
  flex: 1;
  justify-content: center;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}

.mnav-github:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(148, 163, 184, 0.28);
  color: #e2e8f0;
}

.mnav-install {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 20px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 700;
  background: #22c55e;
  color: #021a10;
  text-decoration: none;
  flex: 1;
  transition: background 0.12s ease;
}

.mnav-install:hover {
  background: #4ade80;
}

/* ===================== DESKTOP BREAKPOINT ===================== */
@media (min-width: 900px) {
  .burger { display: none; }
  .nav { display: flex; }
  .hdr-actions { display: flex; }
}

@media (max-width: 899px) {
  .brand {
    margin-right: auto;
  }
}
</style>
