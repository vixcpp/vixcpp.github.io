<template>
  <main class="sdk-profiles-page">
    <section class="sdk-hero section">
      <div class="container">
        <SectionTitle
          eyebrow="What are Vix SDK profiles?"
          title="SDK profiles let Vix.cpp install by application domain."
          description="A SDK profile is a native development layer for a specific kind of Vix.cpp project. It contains the headers, libraries, CMake package files, and modules needed for that workflow."
        />

        <div class="sdk-hero__actions">
          <BaseButton :href="links.install" arrow> Install Vix </BaseButton>

          <BaseButton :href="links.docs" variant="secondary" external arrow>
            Read SDK docs
          </BaseButton>
        </div>
      </div>
    </section>

    <section class="sdk-answer section-tight">
      <div class="sdk-answer__inner container">
        <article class="sdk-answer__content">
          <h2>Why profiles exist</h2>

          <p>
            C++ applications do not all need the same runtime surface. A small
            command-line tool, a backend service, a data-backed application, a
            desktop shell, a peer-to-peer system, a game-oriented project, and
            an agent workflow can have very different dependency requirements.
          </p>

          <p>
            Vix.cpp uses SDK profiles so the CLI can stay small and the SDK can
            follow the application. A developer can inspect a profile before
            installing it, understand which modules it contains, and install
            only the layer needed by the project.
          </p>
        </article>

        <aside class="sdk-answer__panel panel">
          <p class="sdk-answer__label">Common flow</p>

          <CommandLine command="vix upgrade --sdk list" />
          <CommandLine command="vix upgrade --sdk info web" />
          <CommandLine command="vix upgrade --sdk web" />
        </aside>
      </div>
    </section>

    <section class="profiles section">
      <div class="profiles__inner container">
        <article
          v-for="profile in profiles"
          :key="profile.name"
          class="profile-card"
        >
          <span class="profile-card__name">{{ profile.name }}</span>
          <p>{{ profile.description }}</p>
        </article>
      </div>
    </section>

    <section class="sdk-model section-tight">
      <div class="sdk-model__inner container">
        <SectionTitle
          eyebrow="Model"
          title="The CLI is the bootstrap. The SDK is the development layer."
          description="This split keeps the installation path clear. The first install gives the user the command line tool. The SDK profile gives the project the native modules and package files it actually needs."
        />

        <div class="sdk-model__panel panel-soft">
          <p>
            Profiles also make release validation more disciplined. Each profile
            can be built, packaged, inspected, and checked as a specific SDK
            surface instead of treating the whole platform as one large default
            installation.
          </p>

          <p>
            That is important for long-term trust, because Vix.cpp should be
            easier to install, easier to validate, and easier to reason about as
            the ecosystem grows.
          </p>
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

const profiles = [
  {
    name: "default",
    description:
      "Core Vix workflow and common runtime foundations for normal C++ application development.",
  },
  {
    name: "web",
    description:
      "HTTP, middleware, WebSocket, validation, crypto, WebRPC, requests, and backend service workflows.",
  },
  {
    name: "data",
    description:
      "Database, ORM, key-value storage, cache, and persistence-oriented workflows.",
  },
  {
    name: "desktop",
    description: "Desktop shell workflows for Vix web UI applications.",
  },
  {
    name: "p2p",
    description: "Peer-to-peer and distributed application foundations.",
  },
  {
    name: "game",
    description:
      "Game-oriented runtime workflows and native application experiments.",
  },
  {
    name: "agent",
    description:
      "Local agent workflows and higher-level automation built around Vix.",
  },
  {
    name: "all",
    description:
      "The full SDK profile for development, validation, release checks, and advanced usage.",
  },
];
</script>

<style scoped>
.sdk-profiles-page {
  overflow: hidden;
}

.sdk-hero {
  padding-top: clamp(72px, 10vw, 128px);
}

.sdk-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.sdk-answer__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 390px;
  gap: clamp(28px, 5vw, 72px);
  align-items: start;
}

.sdk-answer__content h2 {
  font-size: clamp(1.8rem, 3vw, 2.8rem);
}

.sdk-answer__content p {
  margin-top: 18px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.85;
}

.sdk-answer__panel {
  display: grid;
  gap: 12px;
  padding: 28px;
}

.sdk-answer__label {
  margin-bottom: 6px;
  color: var(--green-soft);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.profiles__inner {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.profile-card {
  min-height: 190px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
    rgba(7, 17, 12, 0.62);
  padding: 22px;
}

.profile-card__name {
  width: fit-content;
  border: 1px solid rgba(34, 197, 94, 0.22);
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.08);
  padding: 0.35rem 0.65rem;
  color: var(--green-soft);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 800;
}

.profile-card p {
  margin-top: 16px;
  color: var(--text-soft);
  font-size: 0.92rem;
  line-height: 1.65;
}

.sdk-model__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: center;
}

.sdk-model__panel {
  display: grid;
  gap: 18px;
  padding: clamp(24px, 4vw, 38px);
}

.sdk-model__panel p {
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.85;
}

@media (max-width: 1040px) {
  .profiles__inner {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sdk-answer__inner,
  .sdk-model__inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .sdk-hero__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .profiles__inner {
    grid-template-columns: 1fr;
  }
}
</style>
