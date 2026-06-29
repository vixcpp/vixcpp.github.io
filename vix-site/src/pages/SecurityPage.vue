<template>
  <main class="security-page">
    <section class="security-hero section">
      <div class="container">
        <SectionTitle
          eyebrow="Security"
          title="Release integrity is part of the developer workflow."
          description="Vix.cpp ships native binaries and SDK archives, so installation has to be predictable, inspectable, and verifiable. The project treats checksums, signatures, release notes, and responsible reporting as part of the platform."
        />

        <div class="security-hero__actions">
          <BaseButton
            :href="`${links.github}/blob/main/SECURITY.md`"
            external
            arrow
          >
            Security policy
          </BaseButton>

          <BaseButton :href="links.releases" variant="secondary" external arrow>
            View releases
          </BaseButton>
        </div>
      </div>
    </section>

    <section class="security-grid section-tight">
      <div class="security-grid__inner container">
        <article class="security-card panel">
          <p class="security-card__label">Checksums</p>
          <h2>Verify what is downloaded.</h2>
          <p>
            Release assets are distributed with SHA-256 checksum files so the
            installer and users can verify that the archive matches the expected
            release artifact.
          </p>
        </article>

        <article class="security-card panel">
          <p class="security-card__label">Signatures</p>
          <h2>Prefer signed artifacts.</h2>
          <p>
            Vix.cpp installers support Minisign verification when signatures are
            available locally, giving release assets an additional integrity
            check before installation.
          </p>
        </article>

        <article class="security-card panel">
          <p class="security-card__label">Disclosure</p>
          <h2>Report issues responsibly.</h2>
          <p>
            Security issues should be reported through the security policy so
            they can be handled carefully before public discussion or release
            notes.
          </p>
        </article>
      </div>
    </section>

    <section class="security-flow section">
      <div class="security-flow__inner container">
        <SectionTitle
          eyebrow="Install flow"
          title="The installer bootstraps the CLI. The CLI installs the SDK."
          description="Keeping the bootstrap small makes the installation path easier to reason about. SDK profiles can then be inspected and installed explicitly through the Vix CLI."
        />

        <div class="security-flow__panel panel-soft">
          <CommandLine
            command="curl -fsSL https://vixcpp.com/install.sh | bash"
          />
          <CommandLine command="vix upgrade --check" />
          <CommandLine command="vix upgrade --sdk info web" />

          <p>
            The same principle applies to releases: make the artifact visible,
            verify it, install it, and keep the next step explicit.
          </p>
        </div>
      </div>
    </section>

    <section class="security-notes section-tight">
      <div class="container">
        <div class="security-notes__panel panel">
          <h2>Security notes</h2>

          <p>
            Vix.cpp is a native C++ project. That means the project has to take
            build integrity, dependency boundaries, tests, sanitizers, release
            packaging, and runtime diagnostics seriously.
          </p>

          <p>
            The public security policy should remain the source of truth for
            reporting instructions and supported release branches.
          </p>

          <a
            :href="`${links.github}/blob/main/SECURITY.md`"
            target="_blank"
            rel="noreferrer"
          >
            Read SECURITY.md →
          </a>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import BaseButton from "@/components/common/BaseButton.vue";
import CommandLine from "@/components/common/CommandLine.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";

import { links } from "@/data/links";
</script>

<style scoped>
.security-page {
  overflow: hidden;
}

.security-hero {
  padding-top: clamp(72px, 10vw, 128px);
}

.security-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.security-grid__inner {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.security-card {
  padding: clamp(24px, 4vw, 34px);
}

.security-card__label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--green-strong);
}

.security-card h2 {
  margin-top: 12px;
  font-size: clamp(1.4rem, 2.6vw, 2rem);
  line-height: 1.1;
}

.security-card p:not(.security-card__label) {
  margin-top: 12px;
  color: var(--text-soft);
  font-size: 0.94rem;
  line-height: 1.72;
}

.security-flow__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: center;
}

.security-flow__panel {
  display: grid;
  gap: 10px;
  padding: clamp(24px, 4vw, 38px);
}

.security-flow__panel p {
  margin-top: 12px;
  color: var(--text-soft);
  font-size: 0.96rem;
  line-height: 1.72;
}

.security-notes__panel {
  padding: clamp(26px, 4vw, 42px);
}

.security-notes__panel h2 {
  font-size: clamp(1.6rem, 3vw, 2.4rem);
}

.security-notes__panel p {
  max-width: 860px;
  margin-top: 16px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.82;
}

.security-notes__panel a {
  display: inline-flex;
  margin-top: 22px;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--green-strong);
  text-decoration: none;
}
.security-notes__panel a:hover {
  color: var(--green);
}

@media (max-width: 980px) {
  .security-grid__inner,
  .security-flow__inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .security-hero__actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
