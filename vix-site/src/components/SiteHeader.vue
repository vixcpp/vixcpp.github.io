<!-- src/components/SiteHeader.vue -->
<template>
  <header class="hdr">
    <div class="wrap">
      <RouterLink class="brand" to="/" @click="closeMobile()">
        <span class="logo">Vix.cpp</span>
      </RouterLink>

      <!-- Desktop nav -->
      <nav class="nav" aria-label="Primary">
        <template v-for="item in navItems" :key="itemKey(item)">
          <!-- Dropdown -->
          <div
            v-if="item.kind === 'dropdown'"
            class="dd"
            @mouseenter="openDropdown(item.label)"
            @mouseleave="closeDropdown(item.label)"
          >
            <button
              type="button"
              class="link dd-btn"
              :class="{ 'is-open': isOpen(item.label) }"
              @click="toggleDropdown(item.label)"
              aria-haspopup="menu"
              :aria-expanded="String(isOpen(item.label))"
            >
              {{ item.label }}
              <span class="chev" aria-hidden="true">▾</span>
            </button>

            <div class="dd-menu" :class="{ open: isOpen(item.label) }" role="menu">
              <!-- Dropdown children: support href (docs) OR to (vue routes) -->
              <template v-for="child in item.items" :key="childKey(child)">
                <!-- External / href (same-domain docs or external) -->
                <a
                  v-if="isExternal(child)"
                  class="dd-item"
                  :href="child.href"
                  :target="child.target || (isSameOrigin(child.href) ? '_self' : '_blank')"
                  rel="noreferrer"
                  @click="closeAll()"
                >
                  {{ child.label }}
                </a>

                <!-- Internal vue-router link -->
                <RouterLink
                  v-else
                  class="dd-item"
                  :to="child.to"
                  @click="closeAll()"
                >
                  {{ child.label }}
                </RouterLink>
              </template>
            </div>
          </div>

          <!-- External top-level (GitHub etc.) -->
          <a
            v-else-if="isExternal(item)"
            class="link"
            :href="item.href"
            :target="item.target || (isSameOrigin(item.href) ? '_self' : '_blank')"
            rel="noreferrer"
          >
            {{ item.label }}
          </a>

          <!-- Internal -->
          <RouterLink
            v-else
            class="link"
            :to="item.to"
            active-class="is-active"
            @click="closeAll()"
          >
            {{ item.label }}
          </RouterLink>
        </template>

        <div class="spacer"></div>

        <!-- Desktop search (docs) -->
        <form class="search" role="search" @submit.prevent="submitSearch('desktop')">
          <span class="s-ico" aria-hidden="true">⌕</span>
          <input
            v-model.trim="qDesktop"
            class="s-in"
            type="search"
            placeholder="Search docs…"
            autocomplete="off"
            @keydown.esc.prevent="clearSearch('desktop')"
          />
          <button class="s-btn" type="submit" :disabled="!qDesktop">Search</button>
        </form>
      </nav>

      <!-- Mobile toggle -->
      <button
        type="button"
        class="burger"
        :class="{ open: mobileOpen }"
        aria-label="Toggle navigation"
        @click="toggleMobile()"
      >
        <span></span><span></span><span></span>
      </button>
    </div>

    <!-- Mobile panel -->
    <div v-if="mobileOpen" class="mnav">
      <form class="msearch" role="search" @submit.prevent="submitSearch('mobile')">
        <span class="s-ico" aria-hidden="true">⌕</span>
        <input
          v-model.trim="qMobile"
          class="s-in"
          type="search"
          placeholder="Search docs…"
          autocomplete="off"
          @keydown.esc.prevent="clearSearch('mobile')"
        />
        <button class="s-btn" type="submit" :disabled="!qMobile">Search</button>
      </form>

      <template v-for="item in navItems" :key="'m-' + itemKey(item)">
        <!-- Dropdown -->
        <div v-if="item.kind === 'dropdown'" class="mdd">
          <button
            type="button"
            class="mlink mdd-btn"
            @click="toggleMobileGroup(item.label)"
            :aria-expanded="String(isMobileGroupOpen(item.label))"
          >
            <span>{{ item.label }}</span>
            <span class="chev" aria-hidden="true">▾</span>
          </button>

          <div v-if="isMobileGroupOpen(item.label)" class="mdd-menu">
            <template v-for="child in item.items" :key="'m-' + childKey(child)">
              <!-- External / href -->
              <a
                v-if="isExternal(child)"
                class="mdd-item"
                :href="child.href"
                :target="child.target || (isSameOrigin(child.href) ? '_self' : '_blank')"
                rel="noreferrer"
                @click="closeMobile()"
              >
                {{ child.label }}
              </a>

              <!-- Internal vue-router link -->
              <RouterLink
                v-else
                class="mdd-item"
                :to="child.to"
                @click="closeMobile()"
              >
                {{ child.label }}
              </RouterLink>
            </template>
          </div>
        </div>

        <!-- External -->
        <a
          v-else-if="isExternal(item)"
          class="mlink"
          :href="item.href"
          :target="item.target || (isSameOrigin(item.href) ? '_self' : '_blank')"
          rel="noreferrer"
          @click="closeMobile()"
        >
          {{ item.label }}
        </a>

        <!-- Internal -->
        <RouterLink
          v-else
          class="mlink"
          :to="item.to"
          @click="closeMobile()"
        >
          {{ item.label }}
        </RouterLink>
      </template>
    </div>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { NAV } from "@/data/nav";

const navItems = computed(() => NAV);

function isExternal(item) {
  return !!item?.external || !!item?.href;
}

// Same-origin helper: docs are same-domain (/docs/...)
function isSameOrigin(href) {
  if (!href) return false;
  // relative paths like "/docs/..." are same-origin
  if (href.startsWith("/")) return true;
  try {
    const u = new URL(href, window.location.origin);
    return u.origin === window.location.origin;
  } catch {
    return false;
  }
}

function itemKey(item) {
  if (item.kind === "dropdown") return `dd:${item.label}`;
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

/* Close on outside click + ESC */
function onDocClick(e) {
  const el = e.target;
  if (!(el instanceof Element)) return;
  if (!el.closest(".hdr")) closeAll();
}
function onKey(e) { if (e.key === "Escape") closeAll(); }

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
function isMobileGroupOpen(label) {
  return mobileGroups.value.has(label);
}
onBeforeUnmount(() => {
  document.documentElement.classList.remove("nav-open");
});

/* Search (docs via VitePress) */
const qDesktop = ref("");
const qMobile = ref("");

function clearSearch(which) {
  if (which === "mobile") qMobile.value = "";
  else qDesktop.value = "";
}

function submitSearch(which) {
  const q = (which === "mobile" ? qMobile.value : qDesktop.value).trim();
  if (!q) return;

  closeAll();
  closeMobile();

  // VitePress docs:
  // - simplest: go to /docs/ and let VitePress search handle it
  // - we also pass query param so you can read it later if you want
  window.location.href = `/docs/?q=${encodeURIComponent(q)}`;
}
</script>

<style scoped>
/* === Header shell === */
.hdr{
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 80;
  width: 100%;
  backdrop-filter: blur(18px);
  background: linear-gradient(to bottom, rgba(1, 24, 22, 0.98), rgba(2, 6, 23, 0.9));
  border-bottom: 1px solid rgba(45, 212, 191, 0.22);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
}

:global(:root){ --hdr-h: 64px; }
:global(main),
:global(#app){
  padding-top: var(--hdr-h);
}

.wrap{
  max-width: 1120px;
  margin: 0 auto;
  padding: 0.6rem 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

/* === Brand === */
.brand{
  display: inline-flex;
  align-items: baseline;
  gap: 0.8rem;
}

.logo{
  font-weight: 800;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #2dd4bf, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 18px rgba(45, 212, 191, 0.35);
  font-size: 1.3rem;
}

.tag{
  color: rgba(203, 213, 225, 0.9);
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 44ch;
}

/* === Desktop nav === */
.nav{
  display: none;
  align-items: center;
  gap: 1.1rem;
  margin-left: auto;
}

.link{
  color: #cbd5e1;
  position: relative;
  padding: 0.25rem 0.2rem;
  font-size: 0.9rem;
  transition: color 0.2s ease;
  background: transparent;
  border: 0;
}

.link:hover{ color: #5eead4; }

.link::after{
  content: "";
  position: absolute;
  left: 0.2rem;
  right: 0.2rem;
  bottom: -0.2rem;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, #2dd4bf, #06b6d4);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.18s ease;
}

.link:hover::after,
.is-active::after{
  transform: scaleX(1);
}

.spacer{ width: 0.25rem; }

/* Pills */
.pill{
  margin-left: 0.35rem;
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  border: 1px solid rgba(45, 212, 191, 0.3);
  background: rgba(2, 44, 34, 0.55);
  color: #e5f9f6;
  font-size: 0.72rem;
  white-space: nowrap;
}

/* CTA */
.cta{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(2, 44, 34, 0.9);
  border: 1px solid rgba(45, 212, 191, 0.55);
  color: #e5f9f6;
  font-size: 0.86rem;
  transition: background 0.16s ease, border-color 0.16s ease, transform 0.12s ease;
}

.cta:hover{
  background: rgba(2, 60, 47, 0.95);
  border-color: rgba(45, 212, 191, 0.85);
  transform: translateY(-1px);
}

/* === Dropdown === */
.dd{ position: relative; }

.dd-btn{
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.chev{
  opacity: 0.8;
  font-size: 0.85em;
  transform: translateY(-1px);
}

.dd-menu{
  position: absolute;
  top: 120%;
  left: 0;
  min-width: 230px;
  padding: 0.55rem 0.55rem;
  border-radius: 14px;
  background: rgba(1, 17, 16, 0.98);
  border: 1px solid rgba(34, 197, 154, 0.6);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.9);
  display: none;
  flex-direction: column;
  gap: 0.35rem;
  z-index: 90;
}

.dd-menu.open{
  display: flex;
  animation: ddFade 0.12s ease-out;
}

.dd-item{
  padding: 0.42rem 0.55rem;
  border-radius: 10px;
  color: #e5e7eb;
  font-size: 0.86rem;
}

.dd-item:hover{
  background: rgba(15, 118, 110, 0.35);
}

@keyframes ddFade{
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* === Search === */
.search{
  display: none;
  align-items: center;
  gap: 0.35rem;
  padding: 0.22rem 0.35rem;
  border-radius: 999px;
  border: 1px solid rgba(45, 212, 191, 0.22);
  background: rgba(2, 44, 34, 0.35);
}

.s-ico{
  color: rgba(203, 213, 225, 0.85);
  font-size: 0.95rem;
  padding-left: 0.25rem;
}

.s-in{
  width: 180px;
  max-width: 22vw;
  background: transparent;
  border: 0;
  outline: none;
  color: #e5e7eb;
  font-size: 0.88rem;
  padding: 0.3rem 0.25rem;
}

.s-in::placeholder{ color: rgba(203, 213, 225, 0.65); }

.s-btn{
  border: 0;
  cursor: pointer;
  padding: 0.32rem 0.6rem;
  border-radius: 999px;
  background: rgba(2, 60, 47, 0.85);
  border: 1px solid rgba(45, 212, 191, 0.35);
  color: #e5f9f6;
  font-size: 0.82rem;
  transition: transform 0.12s ease, background 0.16s ease, border-color 0.16s ease;
}

.s-btn:hover{
  transform: translateY(-1px);
  background: rgba(2, 75, 59, 0.92);
  border-color: rgba(45, 212, 191, 0.55);
}

.s-btn:disabled{
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

/* === Burger === */
.burger{
  margin-left: auto;
  width: 40px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(45, 212, 191, 0.4);
  background: rgba(2, 44, 34, 0.95);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.12s ease;
}

.burger:hover{
  background: rgba(3, 68, 54, 0.98);
  border-color: rgba(34, 197, 154, 0.9);
  transform: translateY(-1px);
}

.burger span{
  width: 16px;
  height: 2px;
  border-radius: 999px;
  background: rgba(229, 249, 246, 0.95);
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.burger.open span:nth-child(1){ transform: translateY(7px) rotate(45deg); }
.burger.open span:nth-child(2){ opacity: 0; }
.burger.open span:nth-child(3){ transform: translateY(-7px) rotate(-45deg); }

/* Mobile panel */
.mnav{
  padding: 0.85rem 1.1rem 1.1rem;
  background: radial-gradient(circle at top, #020817 0, #020617 60%);
  border-bottom: 1px solid rgba(34, 197, 154, 0.35);
  box-shadow: 0 22px 40px rgba(0, 0, 0, 0.85);
}

.msearch{
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.45rem;
  border-radius: 14px;
  border: 1px solid rgba(45, 212, 191, 0.22);
  background: rgba(2, 44, 34, 0.25);
  margin-bottom: 0.65rem;
}

.mlink{
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.25rem;
  color: #cbd5e1;
  font-size: 0.98rem;
}

.mlink:hover{ color: #5eead4; }

.msep{
  height: 1px;
  background: rgba(34, 197, 154, 0.22);
  margin: 0.55rem 0;
}

.mdd-btn{
  width: 100%;
  background: transparent;
  border: 0;
  cursor: pointer;
  text-align: left;
}

.mdd-menu{ padding: 0.25rem 0.2rem 0.55rem; }

.mdd-item{
  display: block;
  padding: 0.45rem 0.45rem;
  border-radius: 10px;
  color: #e5e7eb;
  font-size: 0.92rem;
}

.mdd-item:hover{ background: rgba(15, 118, 110, 0.35); }

/* Desktop switch */
@media (min-width: 900px){
  .burger{ display: none; }
  .nav{ display: flex; }
  .tag{ max-width: 60ch; }
  .search{ display: inline-flex; }
}
</style>
