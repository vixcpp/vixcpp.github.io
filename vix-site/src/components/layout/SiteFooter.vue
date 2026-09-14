<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <p class="site-footer__text">
        Vix.cpp is open source and maintained by
        <a href="https://softadastra.com" target="_blank" rel="noreferrer">
          Softadastra </a
        >.
      </p>

      <nav class="site-footer__links" aria-label="Footer navigation">
        <a
          href="https://github.com/vixcpp/vix/blob/dev/LICENSE"
          target="_blank"
          rel="noreferrer"
        >
          MIT License
        </a>

        <a
          href="https://github.com/vixcpp/vix"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>

        <RouterLink to="/community"> Community </RouterLink>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  padding: 2.6rem 1.5rem;

  background: var(--vix-bg);

  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.site-footer__inner {
  display: flex;
  flex-direction: column;
  align-items: center;

  gap: 0.45rem;

  text-align: center;
}

.site-footer__text {
  margin: 0;

  color: var(--color-text-secondary);

  font-size: 0.82rem;
  line-height: 1.6;
}

.site-footer__links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;

  gap: 1rem;

  font-size: 0.82rem;
}

.site-footer a {
  color: var(--vix-link);

  text-decoration: none;
}

.site-footer a:hover {
  color: var(--vix-link-hover);
  text-decoration: underline;
}
</style>
