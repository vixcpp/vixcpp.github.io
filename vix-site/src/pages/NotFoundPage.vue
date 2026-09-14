<template>
  <section class="not-found">
    <div class="container">
      <span class="not-found__code"> 404 </span>

      <h1>Page not found</h1>

      <p>The page you are looking for does not exist.</p>

      <RouterLink class="not-found__link" to="/">
        Back to Vix.cpp →
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.not-found {
  padding: clamp(6rem, 12vw, 10rem) 0;
}

.not-found__code {
  color: var(--color-primary);

  font-family: var(--font-mono);
  font-size: 0.8rem;
}

.not-found h1 {
  margin-top: 0.8rem;

  color: var(--color-text);

  font-size: clamp(2.5rem, 5vw, 4.5rem);

  letter-spacing: -0.05em;
}

.not-found p {
  margin-top: 1rem;

  color: var(--color-text-secondary);
}

.not-found__link {
  display: inline-block;

  margin-top: 1.5rem;

  color: var(--color-primary);

  text-decoration: none;
}
</style>
