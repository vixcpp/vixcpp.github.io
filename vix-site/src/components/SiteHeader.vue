<!-- src/components/SiteHeader.vue -->
<template>
  <header class="hdr">
    <div class="wrap">
      <RouterLink class="brand" to="/">
        <span class="logo">Vix.cpp</span>
        <span class="tag">Modern C++ backend runtime</span>
      </RouterLink>

      <!-- Desktop nav -->
      <nav class="nav">
        <template v-for="item in leftItems" :key="itemKey(item)">
          <!-- Simple link -->
          <RouterLink
            v-if="item.kind !== 'dropdown'"
            class="link"
            :to="item.to"
            active-class="is-active"
          >
            {{ item.label }}
          </RouterLink>

          <!-- Dropdown -->
          <div
            v-else
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

            <div
              class="dd-menu"
              :class="{ open: isOpen(item.label) }"
              role="menu"
            >
              <RouterLink
                v-for="child in item.items"
                :key="child.to"
                class="dd-item"
                :to="child.to"
                @click="closeAll()"
              >
                {{ child.label }}
              </RouterLink>
            </div>
          </div>
        </template>

        <div class="spacer"></div>

        <!-- External -->
        <a class="link ext" :href="external.registry.href" target="_blank" rel="noreferrer">
          {{ external.registry.label }}
          <small class="pill">{{ external.registry.badge }}</small>
        </a>

        <a class="cta" :href="external.github.href" target="_blank" rel="noreferrer">
          {{ external.github.label }}
          <small class="pill">{{ external.github.badge }}</small>
        </a>
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
      <template v-for="item in leftItems" :key="'m-' + itemKey(item)">
        <RouterLink
          v-if="item.kind !== 'dropdown'"
          class="mlink"
          :to="item.to"
          @click="closeMobile()"
        >
          {{ item.label }}
        </RouterLink>

        <div v-else class="mdd">
          <button
            type="button"
            class="mlink mdd-btn"
            @click="toggleMobileGroup(item.label)"
            :aria-expanded="String(isMobileGroupOpen(item.label))"
          >
            {{ item.label }}
            <span class="chev" aria-hidden="true">▾</span>
          </button>

          <div v-if="isMobileGroupOpen(item.label)" class="mdd-menu">
            <RouterLink
              v-for="child in item.items"
              :key="'m-' + child.to"
              class="mdd-item"
              :to="child.to"
              @click="closeMobile()"
            >
              {{ child.label }}
            </RouterLink>
          </div>
        </div>
      </template>

      <div class="msep"></div>

      <a class="mlink ext" :href="external.registry.href" target="_blank" rel="noreferrer">
        {{ external.registry.label }}
        <small class="pill">{{ external.registry.badge }}</small>
      </a>

      <a class="mlink cta" :href="external.github.href" target="_blank" rel="noreferrer">
        {{ external.github.label }}
        <small class="pill">{{ external.github.badge }}</small>
      </a>
    </div>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { NAV, EXTERNAL } from "@/data/nav";

const external = EXTERNAL;

const leftItems = computed(() => NAV);

function itemKey(item) {
  return item.kind === "dropdown" ? `dd:${item.label}` : `to:${item.to}`;
}

/* ---------------------------
   Desktop dropdown state
--------------------------- */
const openKey = ref(""); // label du dropdown ouvert

function isOpen(label) {
  return openKey.value === label;
}

function openDropdown(label) {
  openKey.value = label;
}

function closeDropdown(label) {
  if (openKey.value === label) openKey.value = "";
}

function toggleDropdown(label) {
  openKey.value = openKey.value === label ? "" : label;
}

function closeAll() {
  openKey.value = "";
}

/* Close on outside click + ESC */
function onDocClick(e) {
  const el = e.target;
  if (!(el instanceof Element)) return;
  if (!el.closest(".hdr")) closeAll();
}

function onKey(e) {
  if (e.key === "Escape") closeAll();
}

onMounted(() => {
  document.addEventListener("click", onDocClick, { passive: true });
  document.addEventListener("keydown", onKey);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
  document.removeEventListener("keydown", onKey);
});

/* ---------------------------
   Mobile menu state
--------------------------- */
const mobileOpen = ref(false);
const mobileGroups = ref(new Set()); // labels ouverts

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
  if (s.has(label)) s.delete(label);
  else s.add(label);
  mobileGroups.value = s;
}

function isMobileGroupOpen(label) {
  return mobileGroups.value.has(label);
}

onBeforeUnmount(() => {
  document.documentElement.classList.remove("nav-open");
});
</script>

<style scoped>
/* === Header shell === */
.hdr {
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

:root { --hdr-h: 64px; } /* ajuste si besoin */

main, #app {
  padding-top: var(--hdr-h);
}


.wrap {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0.6rem 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

/* === Brand === */
.brand {
  display: inline-flex;
  align-items: baseline;
  gap: 0.8rem;
}

.logo {
  font-weight: 800;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #2dd4bf, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 18px rgba(45, 212, 191, 0.35);
  font-size: 1.3rem;
}

.tag {
  color: rgba(203, 213, 225, 0.9);
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 44ch;
}

/* === Desktop nav === */
.nav {
  display: none;
  align-items: center;
  gap: 1.1rem;
  margin-left: auto;
}

.link {
  color: #cbd5e1;
  position: relative;
  padding: 0.25rem 0.2rem;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.link:hover {
  color: #5eead4;
}

.link::after {
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
.is-active::after {
  transform: scaleX(1);
}

.spacer {
  width: 0.75rem;
}

/* Pills */
.pill {
  margin-left: 0.35rem;
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  border: 1px solid rgba(45, 212, 191, 0.3);
  background: rgba(2, 44, 34, 0.55);
  color: #e5f9f6;
  font-size: 0.72rem;
  white-space: nowrap;
}

.ext {
  opacity: 0.95;
}

/* CTA */
.cta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(2, 44, 34, 0.9);
  border: 1px solid rgba(45, 212, 191, 0.55);
  color: #e5f9f6;
  font-size: 0.86rem;
  transition: background 0.16s ease, border-color 0.16s ease, transform 0.12s ease;
}

.cta:hover {
  background: rgba(2, 60, 47, 0.95);
  border-color: rgba(45, 212, 191, 0.85);
  transform: translateY(-1px);
}

/* === Dropdown === */
.dd {
  position: relative;
}

.dd-btn {
  background: transparent;
  border: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.chev {
  opacity: 0.8;
  font-size: 0.85em;
  transform: translateY(-1px);
}

.dd-menu {
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

.dd-menu.open {
  display: flex;
  animation: ddFade 0.12s ease-out;
}

.dd-item {
  padding: 0.42rem 0.55rem;
  border-radius: 10px;
  color: #e5e7eb;
  font-size: 0.86rem;
}

.dd-item:hover {
  background: rgba(15, 118, 110, 0.35);
}

@keyframes ddFade {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* === Mobile burger === */
.burger {
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

.burger:hover {
  background: rgba(3, 68, 54, 0.98);
  border-color: rgba(34, 197, 154, 0.9);
  transform: translateY(-1px);
}

.burger span {
  width: 16px;
  height: 2px;
  border-radius: 999px;
  background: rgba(229, 249, 246, 0.95);
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.burger.open span:nth-child(2) { opacity: 0; }
.burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* Mobile panel */
.mnav {
  padding: 0.85rem 1.1rem 1.1rem;
  background: radial-gradient(circle at top, #020817 0, #020617 60%);
  border-bottom: 1px solid rgba(34, 197, 154, 0.35);
  box-shadow: 0 22px 40px rgba(0, 0, 0, 0.85);
}

.mlink {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.25rem;
  color: #cbd5e1;
  font-size: 0.98rem;
}

.mlink:hover {
  color: #5eead4;
}

.msep {
  height: 1px;
  background: rgba(34, 197, 154, 0.22);
  margin: 0.55rem 0;
}

.mdd-btn {
  width: 100%;
  background: transparent;
  border: 0;
  cursor: pointer;
  text-align: left;
}

.mdd-menu {
  padding: 0.25rem 0.2rem 0.55rem;
}

.mdd-item {
  display: block;
  padding: 0.45rem 0.45rem;
  border-radius: 10px;
  color: #e5e7eb;
  font-size: 0.92rem;
}

.mdd-item:hover {
  background: rgba(15, 118, 110, 0.35);
}

/* Desktop switch */
@media (min-width: 900px) {
  .burger { display: none; }
  .nav { display: flex; }
  .tag { max-width: 60ch; }
}
</style>
