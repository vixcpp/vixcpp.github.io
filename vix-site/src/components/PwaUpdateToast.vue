<script setup>
const props = defineProps({
  show: { type: Boolean, default: false },
  message: { type: String, default: "New version available." },
  detail: { type: String, default: "Refresh to load the latest build." },
  version: { type: String, default: "" },
});

const emit = defineEmits(["refresh", "dismiss"]);
</script>

<template>
  <teleport to="body">
    <div v-if="show" class="pwa-toast-wrap" role="status" aria-live="polite">
      <div class="pwa-toast">
        <div class="pwa-toast-glow" aria-hidden="true"></div>

        <div class="pwa-toast-left">
          <div class="pwa-toast-icon" aria-hidden="true">
            <span class="pwa-dot pwa-dot-red"></span>
            <span class="pwa-dot pwa-dot-yellow"></span>
            <span class="pwa-dot pwa-dot-green"></span>
          </div>

          <div class="pwa-toast-text">
            <div class="pwa-toast-title">{{ message }}</div>

            <div class="pwa-toast-sub">
              {{ detail }}
              <span v-if="version" class="pwa-toast-version">v{{ version }}</span>
            </div>
          </div>
        </div>

        <div class="pwa-toast-actions">
          <button
            class="pwa-btn pwa-btn-ghost"
            type="button"
            @click="emit('dismiss')"
          >
            Later
          </button>

          <button
            class="pwa-btn pwa-btn-primary"
            type="button"
            @click="emit('refresh')"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>
