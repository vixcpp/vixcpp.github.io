<template>
  <div class="learn-page">
    <div class="learn-container">
      <!-- ===================================================
           Header
      ==================================================== -->

      <header class="learn-header">
        <h1>Learn Vix.cpp</h1>

        <p>
          Learn how Vix.cpp fits into a C++ project, then move from a single
          source file to a complete application workflow.
        </p>
      </header>

      <!-- ===================================================
           Start here
      ==================================================== -->

      <section class="learn-section">
        <h2>Start here</h2>

        <div class="learn-steps">
          <article class="learn-step">
            <span class="learn-step__number"> 01 </span>

            <div class="learn-step__content">
              <h3>Run C++ with Vix.cpp</h3>

              <p>
                Start with a single C++ source file and understand the basic
                Vix.cpp development workflow.
              </p>
            </div>
          </article>

          <article class="learn-step">
            <span class="learn-step__number"> 02 </span>

            <div class="learn-step__content">
              <h3>Work with a project</h3>

              <p>
                Use Vix.cpp with a C++ project, its build system, dependencies,
                tests, and existing libraries.
              </p>
            </div>
          </article>

          <article class="learn-step">
            <span class="learn-step__number"> 03 </span>

            <div class="learn-step__content">
              <h3>Build real applications</h3>

              <p>
                Follow the application workflow from development and execution
                through testing and production.
              </p>
            </div>
          </article>
        </div>

        <a
          class="learn-link"
          href="https://docs.vixcpp.com"
          target="_blank"
          rel="noreferrer"
        >
          Get started
          <span aria-hidden="true">↗</span>
        </a>
      </section>

      <!-- ===================================================
           Continue learning
      ==================================================== -->

      <section class="learn-section">
        <h2>Continue learning</h2>

        <div class="learn-resources">
          <article class="learn-resource">
            <div>
              <h3>Documentation</h3>

              <p>
                Reference for commands, project configuration, libraries, and
                the capabilities available in Vix.cpp.
              </p>
            </div>

            <a href="https://docs.vixcpp.com" target="_blank" rel="noreferrer">
              Read the documentation
              <span aria-hidden="true">↗</span>
            </a>
          </article>

          <article class="learn-resource">
            <div>
              <h3>Blog</h3>

              <p>
                Technical articles, release notes, development updates, and
                deeper explanations from the Vix.cpp project.
              </p>
            </div>

            <RouterLink to="/blog">
              Read the blog
              <span aria-hidden="true">→</span>
            </RouterLink>
          </article>

          <article class="learn-resource">
            <div>
              <h3>Community</h3>

              <p>
                Ask questions, share what you build, exchange ideas, and meet
                other people interested in Vix.cpp.
              </p>
            </div>

            <RouterLink to="/community">
              Join the community
              <span aria-hidden="true">→</span>
            </RouterLink>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.learn-page {
  padding: clamp(4rem, 8vw, 6.5rem) 0 clamp(6rem, 10vw, 8rem);

  background: var(--vix-bg);
}

.learn-container {
  width: min(100% - 48px, 980px);

  margin-inline: auto;
}

/* ==========================================================
   Header
========================================================== */

.learn-header {
  max-width: 820px;
}

.learn-header h1 {
  margin: 0;

  color: var(--vix-text);

  font-size: clamp(2.8rem, 5vw, 4.2rem);

  font-weight: 680;
  line-height: 1;

  letter-spacing: -0.055em;
}

.learn-header p {
  max-width: 720px;

  margin: 1.3rem 0 0;

  color: var(--vix-text-secondary);

  font-size: clamp(1rem, 1.5vw, 1.1rem);

  line-height: 1.75;
}

/* ==========================================================
   Sections
========================================================== */

.learn-section {
  max-width: 820px;

  margin-top: clamp(4rem, 7vw, 5.5rem);
}

.learn-section h2 {
  margin: 0;

  color: var(--vix-text);

  font-size: clamp(1.8rem, 3vw, 2.35rem);

  font-weight: 650;
  line-height: 1.15;

  letter-spacing: -0.04em;
}

/* ==========================================================
   Learning steps
========================================================== */

.learn-steps {
  margin-top: 1.5rem;

  border-top: 1px solid var(--vix-border);
}

.learn-step {
  display: grid;

  grid-template-columns:
    48px
    minmax(0, 1fr);

  gap: 1.1rem;

  padding: 1.45rem 0;

  border-bottom: 1px solid var(--vix-border);
}

.learn-step__number {
  padding-top: 0.22rem;

  color: var(--vix-green);

  font-family: var(--font-mono);
  font-size: 0.68rem;
}

.learn-step__content {
  max-width: 680px;
}

.learn-step h3 {
  margin: 0;

  color: var(--vix-text);

  font-size: 1.15rem;
  font-weight: 640;

  letter-spacing: -0.025em;
}

.learn-step p {
  margin: 0.55rem 0 0;

  color: var(--vix-text-secondary);

  font-size: 0.95rem;
  line-height: 1.7;
}

/* ==========================================================
   Main link
========================================================== */

.learn-link {
  display: inline-flex;
  align-items: center;

  gap: 0.5rem;

  margin-top: 1.25rem;

  color: var(--vix-link);

  font-size: 0.9rem;
  font-weight: 620;

  text-decoration: none;
}

.learn-link:hover {
  color: var(--vix-link-hover);

  text-decoration: underline;
}

/* ==========================================================
   Resources
========================================================== */

.learn-resources {
  margin-top: 1.5rem;

  border-top: 1px solid var(--vix-border);
}

.learn-resource {
  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    auto;

  align-items: center;

  gap: 2rem;

  padding: 1.5rem 0;

  border-bottom: 1px solid var(--vix-border);
}

.learn-resource > div {
  max-width: 620px;
}

.learn-resource h3 {
  margin: 0;

  color: var(--vix-text);

  font-size: 1.12rem;
  font-weight: 640;

  letter-spacing: -0.025em;
}

.learn-resource p {
  margin: 0.5rem 0 0;

  color: var(--vix-text-secondary);

  font-size: 0.94rem;
  line-height: 1.7;
}

.learn-resource a {
  display: inline-flex;
  align-items: center;

  gap: 0.45rem;

  color: var(--vix-link);

  font-size: 0.85rem;
  font-weight: 600;

  text-decoration: none;

  white-space: nowrap;
}

.learn-resource a:hover {
  color: var(--vix-link-hover);

  text-decoration: underline;
}

.learn-resource a span {
  font-size: 0.8rem;
}

/* ==========================================================
   Responsive
========================================================== */

@media (max-width: 700px) {
  .learn-page {
    padding-top: 3.5rem;
  }

  .learn-container {
    width: min(100% - 32px, 980px);
  }

  .learn-resource {
    grid-template-columns: 1fr;

    gap: 0.8rem;
  }

  .learn-step {
    grid-template-columns:
      38px
      minmax(0, 1fr);
  }
}
</style>
