<template>
  <footer class="ft">
    <div class="wrap">
      <div class="left">
        <div class="brand">Vix.cpp</div>
        <div class="muted">
          Modern C++ backend runtime
          <span class="version">v{{ appVersion }}</span>
        </div>
      </div>

      <div class="right">
        <a
          class="link"
          href="https://github.com/vixcpp/vix"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        <a
          class="link"
          href="https://github.com/vixcpp/vix/releases"
          target="_blank"
          rel="noreferrer"
        >
          Releases
        </a>
        <a
          class="link"
          href="https://github.com/vixcpp/vix/issues"
          target="_blank"
          rel="noreferrer"
        >
          Issues
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup>
// version exposée depuis .env (Vite)
const appVersion = import.meta.env.VITE_APP_VERSION;
</script>

<style scoped>
.ft {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: 30px;
}

.wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 18px;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.brand {
  font-weight: 800;
  letter-spacing: 0.2px;
}

.muted {
  opacity: 0.7;
  font-size: 12px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.version {
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  border: 1px solid rgba(45, 212, 191, 0.25);
  background: rgba(2, 44, 34, 0.45);
  color: #a7f3d0;
  font-weight: 700;
  font-size: 11px;
}

.right {
  display: flex;
  gap: 14px;
  align-items: center;
}

.link {
  text-decoration: none;
  opacity: 0.8;
  font-size: 13px;
}

.link:hover {
  opacity: 1;
}
</style>
