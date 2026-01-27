<script setup>
import { computed } from "vue";

const props = defineProps({
  show: { type: Boolean, default: false },
  message: { type: String, default: "Install Vix.cpp?" },
  detail: {
    type: String,
    default: "Get an app-like experience: offline support, faster launch.",
  },
  canInstall: { type: Boolean, default: true },
});

const emit = defineEmits(["install", "dismiss"]);

const installDisabled = computed(() => !props.canInstall);
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
            <div class="pwa-toast-sub">{{ detail }}</div>
          </div>
        </div>

        <div class="pwa-toast-actions">
          <button
            class="pwa-btn pwa-btn-ghost"
            type="button"
            @click="emit('dismiss')"
          >
            Not now
          </button>

          <button
            class="pwa-btn pwa-btn-primary"
            type="button"
            :disabled="installDisabled"
            @click="emit('install')"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>
