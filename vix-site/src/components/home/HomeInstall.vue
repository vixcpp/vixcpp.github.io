<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
  install: { type: Object, required: true },
});

const activePlatform = ref("unix");
const copied = ref(false);

function copyCommand() {
  const cmd = props.install?.commands?.[activePlatform.value];
  if (!cmd) return;

  navigator.clipboard.writeText(cmd);
  copied.value = true;

  setTimeout(() => {
    copied.value = false;
  }, 1500);
}

onMounted(() => {
  const platform = navigator.platform.toLowerCase();
  activePlatform.value = platform.includes("win") ? "windows" : "unix";
});
</script>

<template>
  <section class="install">
    <div class="container install-inner">
      <h2 class="install-title">
        {{ install.title }}
        <span class="install-version">{{ install.version }}</span>
      </h2>
      <p class="install-note">{{ install.note }}</p>

      <div class="install-card code-card">
        <div class="code-head install-head">
          <div class="head-left">
            <span class="dot dot-red"></span>
            <span class="dot dot-yellow"></span>
            <span class="dot dot-green"></span>
            <span class="head-title">install</span>
          </div>
          <button
            type="button"
            class="install-copy-btn"
            @click="copyCommand"
            :aria-label="copied ? 'Copied' : 'Copy command'"
          >
            <svg
              v-if="!copied"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2"></rect>
              <path
                d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
              ></path>
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 6L9 17l-5-5"></path>
            </svg>
          </button>
        </div>

        <div class="install-tabs-wrap">
          <div class="install-tabs">
            <button
              type="button"
              :class="['install-tab', { active: activePlatform === 'unix' }]"
              @click="activePlatform = 'unix'"
            >
              macOS / Linux
            </button>
            <button
              type="button"
              :class="['install-tab', { active: activePlatform === 'windows' }]"
              @click="activePlatform = 'windows'"
            >
              Windows
            </button>
          </div>
        </div>

        <div class="code-body install-code-body">
          <pre
            class="code-pre install-code-pre"
          ><code>{{ install.commands?.[activePlatform] || '' }}</code></pre>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.install {
  padding: 32px 0 40px;
  background:
    radial-gradient(circle at top, rgba(34, 197, 94, 0.1), transparent 42%),
    linear-gradient(180deg, #031f1a 0%, #042a23 100%);
}

.install-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.install-title {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;

  font-size: clamp(1.4rem, 2.6vw, 2.2rem);

  font-weight: 800;
  letter-spacing: -0.02em;
  color: #ecfdf5;
}

.install-version {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 10px;
  background: #22c55e;
  color: #03140f;
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1;
}

.install-note {
  margin: 14px 0 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.98rem;
  line-height: 1.6;
}

.install-card {
  width: 100%;
  max-width: 820px;
  margin-top: 28px;
  text-align: left;
}

/* Header */
.install-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.install-head-left {
  min-width: 0;
  flex: 1 1 auto;
}

.install-head .head-left {
  min-width: 0;
}

/* Copy button stays top-right */
.install-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;

  width: 40px;
  height: 40px;
  padding: 0;

  border-radius: 12px;
  white-space: nowrap;
  align-self: center;

  transition:
    transform 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease;
}

.install-copy svg {
  width: 16px;
  height: 16px;
}

.install-copy:hover {
  transform: translateY(-1px);
}

/* Tabs below header */
.install-tabs-wrap {
  padding: 12px 12px 0;
}

.install-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.install-tabs .tab {
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
  white-space: nowrap;
}

/* Code */
.install-code-body {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.install-code-pre {
  margin: 0;
  padding: 14px;
  width: 100%;
  max-width: 100%;
  min-width: 0 !important;

  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.install-code-pre > code {
  display: block;
  width: 100%;
  min-width: 0;
}

/* Tablet */
@media (max-width: 900px) {
  .install-card {
    max-width: 100%;
  }

  .install-head {
    align-items: center;
    justify-content: space-between;
  }

  .install-copy {
    width: 40px;
    height: 40px;
  }
}

/* Mobile */
@media (max-width: 640px) {
  .install {
    padding: 56px 0 64px;
  }

  .install-title {
    flex-direction: column;
    gap: 10px;
  }

  .install-note {
    font-size: 0.92rem;
    max-width: 32rem;
  }

  .install-head {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .install-head-left {
    flex: 1 1 auto;
  }

  .install-copy {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
  }

  .install-tabs {
    flex-direction: row;
    gap: 8px;
  }

  .install-tabs .tab {
    flex: 1 1 0;
    width: auto;
  }

  .install-code-pre {
    font-size: 0.82rem;
    line-height: 1.6;
    padding: 12px;
  }
}

/* Very small screens */
@media (max-width: 420px) {
  .install-tabs {
    flex-direction: column;
  }

  .install-tabs .tab {
    width: 100%;
  }
}

.install-card {
  max-width: 620px;
}

.install-copy {
  width: 40px !important;
  min-width: 40px;
  max-width: 40px;
  height: 40px;
  flex: 0 0 40px !important;
  align-self: center;
}

.install-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.install-head-left {
  flex: 1 1 auto;
  min-width: 0;
}

.install-tabs {
  display: flex !important;
  flex-direction: row !important;
  align-items: center;
  gap: 8px;
}

.install-tabs .tab {
  flex: 1 1 0;
  width: auto !important;
  min-width: 0;
}

@media (max-width: 420px) {
  .install-tabs {
    flex-direction: column !important;
  }

  .install-tabs .tab {
    width: 100% !important;
  }
}

.install-code-body {
  padding: 0;
}

.install-code-pre {
  padding: 10px 14px;
  line-height: 4;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
}

.install-card .code-body {
  min-height: auto;
  height: auto;
}

.install-tabs-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 12px;
}

.install-tabs {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 50px;
}

.install-tabs .tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 6px 14px;
  font-size: 0.9rem;

  color: #cbd5e1;
  background: transparent;

  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 999px;

  cursor: pointer;
  white-space: nowrap;

  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease,
    transform 0.12s ease;
}

/* hover */
.install-tabs .tab:hover {
  color: #ffffff;
  background: rgba(148, 163, 184, 0.08);
  transform: translateY(-1px);
}

/* actif */
.install-tabs .tab.active {
  color: #d1fae5;
  border-color: rgba(34, 197, 94, 0.35);
}

/* mobile */
@media (max-width: 640px) {
  .install-tabs {
    flex-direction: row;
    justify-content: center;
  }
}

.install-tabs .tab.active {
  color: #22c55e;
  position: relative;
}

.install-tabs .tab.active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -4px;
  height: 2px;
  border-radius: 2px;
}

/* ===================== INSTALL (second block) ===================== */
.install {
  padding: 48px 0;
  background: rgba(34, 197, 94, 0.03);
}

.install-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.install-title {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: clamp(1.4rem, 2.4vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #f1f5f9;
}

.install-version {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 12px;
  border-radius: 8px;
  background: #22c55e;
  color: #021a10;
  font-size: 0.88rem;
  font-weight: 800;
  line-height: 1;
}

.install-note {
  margin: 10px 0 0;
  color: rgba(203, 213, 225, 0.6);
  font-size: 0.88rem;
}

.install-card {
  width: 100%;
  max-width: 600px;
  margin-top: 28px;
  text-align: left;
}

.install-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.install-copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  padding: 0;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 8px;
  color: #4ade80;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    background 0.15s ease;
}

.install-copy-btn svg {
  width: 14px;
  height: 14px;
}

.install-copy-btn:hover {
  transform: translateY(-1px);
  background: rgba(34, 197, 94, 0.18);
}

.install-tabs-wrap {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.install-tabs {
  display: flex;
  gap: 6px;
}

.install-tab {
  font-size: 0.78rem;
  color: rgba(203, 213, 225, 0.55);
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;
}

.install-tab:hover {
  color: #e2e8f0;
}

.install-tab.active {
  color: #4ade80;
  border-color: rgba(34, 197, 94, 0.25);
}

.install-code-body {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.install-code-pre {
  margin: 0;
  padding: 14px 16px;
  white-space: nowrap;
  overflow-x: auto;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  opacity: 0.95;
}
.dot-red {
  background: #fb923c;
}
.dot-yellow {
  background: #facc15;
}
.dot-green {
  background: #22c55e;
}

@media (max-width: 640px) {
  .install {
    padding: 40px 0;
  }

  .install-card {
    max-width: 100%;
  }
}
</style>
