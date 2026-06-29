<template>
  <main class="sdks-page">
    <section class="sdks-hero section">
      <div class="container">
        <SectionTitle
          eyebrow="SDK profiles"
          title="Install only the Vix.cpp layer your project needs."
          description="SDK profiles keep the Vix.cpp installation practical. A project can start with the default foundation and move to web, data, desktop, p2p, game, agent, or full profiles when the application requires them."
        />

        <div class="sdks-hero__commands">
          <CommandLine command="vix upgrade --sdk list" />
          <CommandLine command="vix upgrade --sdk info web" />
          <CommandLine command="vix upgrade --sdk web" />
        </div>
      </div>
    </section>

    <section class="profiles section-tight">
      <div class="profiles__inner container">
        <article
          v-for="profile in profiles"
          :key="profile.name"
          class="profile-card"
        >
          <span class="profile-card__name">{{ profile.name }}</span>
          <p>{{ profile.description }}</p>
          <CommandLine :command="`vix upgrade --sdk ${profile.name}`" />
        </article>
      </div>
    </section>

    <section class="sdk-notes section">
      <div class="sdk-notes__inner container">
        <SectionTitle
          eyebrow="Why profiles exist"
          title="The SDK should follow the application, not the other way around."
          description="A native C++ application can have very different needs depending on whether it is a small tool, a web service, a data-backed backend, a desktop shell, a p2p system, a game-oriented project, or an agent workflow."
        />

        <div class="sdk-notes__panel panel-soft">
          <p>
            Profiles keep the installation readable and the release pipeline
            honest. Each profile can be documented, packaged, checked, and
            validated without making every user install the entire platform by
            default.
          </p>

          <p>
            The CLI remains the entry point. The SDK profile supplies the native
            development layer that a project needs for its domain.
          </p>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import CommandLine from "@/components/common/CommandLine.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";

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
.sdks-page {
  overflow: hidden;
}

.sdks-hero {
  padding-top: clamp(72px, 10vw, 128px);
}

.sdks-hero__commands {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 30px;
}

.profiles__inner {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.profile-card {
  display: flex;
  flex-direction: column;
  min-height: 260px;
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

.profile-card :deep(.cmd) {
  width: 100%;
  margin-top: auto;
}

.sdk-notes__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: center;
}

.sdk-notes__panel {
  display: grid;
  gap: 18px;
  padding: clamp(24px, 4vw, 38px);
}

.sdk-notes__panel p {
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.85;
}

@media (max-width: 1040px) {
  .profiles__inner {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .sdk-notes__inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .sdks-hero__commands {
    flex-direction: column;
  }

  .profiles__inner {
    grid-template-columns: 1fr;
  }
}
</style>
