<template>
  <section class="latest">
    <div class="latest__inner">
      <div class="latest__heading sd-reveal">
        <span class="latest__label">Latest release</span>

        <h2>Vix.cpp v2.9.0</h2>

        <p class="latest__statement">A release about ownership.</p>
      </div>

      <div class="latest__content sd-reveal">
        <p class="latest__summary">
          Vix.cpp v2.9.0 clarifies responsibility across the build system,
          networking, SDK packaging, and mobile platform support.
        </p>

        <div class="latest__areas" aria-label="Vix.cpp v2.9.0 highlights">
          <div class="latest__area">
            <span>Build</span>
            <p>
              Vix focuses on project intent while CMake and Ninja own the
              concrete compilation graph.
            </p>
          </div>

          <div class="latest__area">
            <span>Requests</span>
            <p>
              The asynchronous HTTP path now remains asynchronous throughout the
              operation.
            </p>
          </div>

          <div class="latest__area">
            <span>SDKs</span>
            <p>
              SDKs own more of their internal dependencies and expose a cleaner
              consumer contract.
            </p>
          </div>

          <div class="latest__area">
            <span>Mobile</span>
            <p>
              Android and iOS support works with their native Gradle and Xcode
              toolchains.
            </p>
          </div>
        </div>

        <div class="latest__links">
          <RouterLink class="latest__primary-link" to="/blog/changelog/v2.9.0">
            Read the release notes
            <span aria-hidden="true">→</span>
          </RouterLink>

          <RouterLink class="latest__secondary-link" to="/blog">
            View all posts
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.latest {
  padding: clamp(72px, 8vw, 104px) 0;
  border-block: 1px solid var(--vix-border);
  background: var(--vix-bg-alt);
  color: var(--vix-text);
}

.latest__inner {
  display: grid;
  width: min(100% - 40px, 1080px);
  grid-template-columns: minmax(240px, 0.72fr) minmax(0, 1.28fr);
  gap: clamp(54px, 9vw, 120px);
  margin-inline: auto;
}

.latest__heading {
  align-self: start;
}

.latest__label {
  display: block;
  margin-bottom: 18px;
  color: #4ade80;
  font-family: var(--vix-font-mono, monospace);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.latest__heading h2 {
  margin: 0;
  color: var(--vix-text);
  font-size: clamp(34px, 4.5vw, 52px);
  font-weight: 650;
  line-height: 1;
  letter-spacing: -0.045em;
}

.latest__statement {
  margin: 18px 0 0;
  color: var(--vix-text-secondary);
  font-size: clamp(18px, 2vw, 22px);
  line-height: 1.45;
}

.latest__content {
  min-width: 0;
}

.latest__summary {
  max-width: 690px;
  margin: 0;
  color: var(--vix-text);
  font-size: clamp(18px, 2.1vw, 24px);
  line-height: 1.5;
  letter-spacing: -0.02em;
}

.latest__areas {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 36px;
  border-top: 1px solid var(--vix-border);
  border-left: 1px solid var(--vix-border);
}

.latest__area {
  min-height: 126px;
  padding: 22px;
  border-right: 1px solid var(--vix-border);
  border-bottom: 1px solid var(--vix-border);
}

.latest__area span {
  display: block;
  margin-bottom: 10px;
  color: #4ade80;
  font-family: var(--vix-font-mono, monospace);
  font-size: 10px;
  font-weight: 600;
}

.latest__area p {
  margin: 0;
  color: var(--vix-text-secondary);
  font-size: 13px;
  line-height: 1.65;
}

.latest__links {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-top: 30px;
}

.latest__primary-link,
.latest__secondary-link {
  text-decoration: none;
}

.latest__primary-link {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--vix-link);
  font-size: 14px;
  font-weight: 550;
}

.latest__primary-link span {
  transition: transform 160ms ease;
}

.latest__primary-link:hover {
  color: var(--vix-link-hover);
}

.latest__primary-link:hover span {
  transform: translateX(4px);
}

.latest__secondary-link {
  color: var(--vix-text-secondary);
  font-size: 13px;
}

.latest__secondary-link:hover {
  color: var(--vix-text);
}

@media (max-width: 760px) {
  .latest {
    padding: 64px 0;
  }

  .latest__inner {
    width: min(100% - 32px, 1080px);
    grid-template-columns: 1fr;
    gap: 38px;
  }

  .latest__areas {
    grid-template-columns: 1fr;
  }

  .latest__area {
    min-height: 0;
  }
}

@media (max-width: 480px) {
  .latest__links {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }
}
</style>
