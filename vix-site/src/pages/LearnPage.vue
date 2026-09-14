<template>
  <div class="learn-page">
    <div class="learn-container">
      <header class="learn-header">
        <h1>Learn Vix.cpp</h1>

        <p>
          Start with the development workflow, then explore the parts of Vix.cpp
          that are useful for the software you want to build.
        </p>
      </header>

      <section class="learn-section">
        <h2>Getting started</h2>

        <p>
          Install Vix.cpp, run your first C++ program, and learn the basic
          development workflow.
        </p>

        <a href="https://docs.vixcpp.com" target="_blank" rel="noreferrer">
          Get started →
        </a>
      </section>

      <section class="learn-section">
        <h2>Documentation</h2>

        <p>
          Explore commands, project configuration, libraries, and the rest of
          the Vix.cpp development system.
        </p>

        <a href="https://docs.vixcpp.com" target="_blank" rel="noreferrer">
          Read the documentation →
        </a>
      </section>
    </div>
  </div>
</template>

<style scoped>
.learn-page {
  padding: clamp(4rem, 8vw, 7rem) 0 clamp(6rem, 10vw, 9rem);
}

.learn-container {
  width: min(100% - 48px, 980px);

  margin-inline: auto;
}

.learn-header {
  max-width: 820px;
}

.learn-header h1 {
  margin: 0;

  color: var(--color-text);

  font-size: clamp(2.8rem, 5vw, 4.4rem);

  font-weight: 680;
  line-height: 1;

  letter-spacing: -0.06em;
}

.learn-header p {
  max-width: 760px;

  margin-top: 1.4rem;

  color: var(--color-text-secondary);

  font-size: clamp(1rem, 1.5vw, 1.1rem);

  line-height: 1.75;
}

.learn-section {
  max-width: 760px;

  margin-top: clamp(4rem, 7vw, 5.5rem);
}

.learn-section h2 {
  margin: 0;

  color: var(--color-text);

  font-size: clamp(1.8rem, 3vw, 2.4rem);

  font-weight: 650;

  letter-spacing: -0.04em;
}

.learn-section p {
  margin: 1rem 0 0;

  color: var(--color-text-secondary);

  font-size: 0.96rem;
  line-height: 1.75;
}

.learn-section a {
  display: inline-block;

  margin-top: 1rem;

  color: var(--color-primary);

  font-size: 0.9rem;
  font-weight: 600;

  text-decoration: none;
}

.learn-section a:hover {
  text-decoration: underline;
}

@media (max-width: 700px) {
  .learn-container {
    width: min(100% - 32px, 980px);
  }
}
</style>
