<script setup>
import CodeBlock from "./CodeBlock.vue";

const heroCode = `#include <vix.hpp>
using namespace vix;

int main()
{
  App app;

  app.get("/", [](Request&, Response& res){
    res.send("Hello");
  });

  app.run(8080);
}`;

const features = [
  {
    title: "HTTP APIs",
    desc: "Build fast endpoints with explicit routing, predictable performance, and zero hidden magic.",
    icon: "swap",
    href: "/docs/api",
  },
  {
    title: "WebSockets",
    desc: "Real time channels with robust connection handling and backpressure friendly design.",
    icon: "bolt",
    href: "/docs/guide",
  },
  {
    title: "Async Tasks",
    desc: "A unified runtime for scheduling, timers, and concurrency in performance critical workloads.",
    icon: "chip",
    href: "/docs/tutorial",
  },
  {
    title: "P2P",
    desc: "Peer to peer communication primitives designed for unstable networks and local first systems.",
    icon: "p2p",
    href: "/docs/p2p",
  },
];

function iconPath(name) {
  if (name === "swap") {
    return "M7 7h11l-2-2m2 2l-2 2M17 17H6l2 2m-2-2l2-2";
  }
  if (name === "bolt") {
    return "M13 2L4 14h7l-1 8 9-12h-7l1-8z";
  }
  if (name === "chip") {
    return "M9 9h6v6H9V9zm-5 3h2m12 0h2M12 4v2m0 12v2M6.5 6.5l1.4 1.4m8.2 8.2l1.4 1.4m0-12.4l-1.4 1.4M7.9 16.1l-1.4 1.4";
  }
  // P2P (nodes + links)
  return "M6 12a2 2 0 114 0 2 2 0 01-4 0zm8-6a2 2 0 114 0 2 2 0 01-4 0zm0 12a2 2 0 114 0 2 2 0 01-4 0zM10 12l4-6M10 12l4 6";
}

</script>

<template>
  <div class="vix-docs-hero">
    <div class="vix-docs-hero__left">
      <h1 class="vix-docs-h1">Vix.cpp Documentation</h1>

      <p class="vix-docs-lead">
        A modern C++ runtime for building fast, explicit,
        and offline-first applications.
      </p>

      <p class="vix-docs-body">
        Vix.cpp is designed for real-world conditions:
        unstable networks, constrained environments,
        and performance-critical workloads. It provides a unified runtime for HTTP APIs, WebSockets,
        async tasks, and local-first systems, without garbage collection or hidden magic.
      </p>

      <div class="actions">
        <a class="primary" href="/docs/quick-start">Get started <span class="cta-arrow">→</span></a>
      </div>
    </div>

    <div class="vix-docs-hero__right">
      <div class="vix-hero-annot vix-hint">
        Your runtime endpoint <br>
        works with the Vix.cpp API
      </div>

      <CodeBlock
        title="main.cpp"
        lang="cpp"
        :chips="['http']"
        :code="heroCode"
        :maxHeight="360"
      />
    </div>
  </div>

  <!-- Feature boxes like Modular -->
  <div class="vix-hero-cards">
    <a
      v-for="f in features"
      :key="f.title"
      class="vix-hero-card"
      :href="f.href"
    >
      <div class="vix-hero-card__top">
        <div class="vix-hero-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              :d="iconPath(f.icon)"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <div class="vix-hero-card__arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>

      <div class="vix-hero-card__title">{{ f.title }}</div>
      <div class="vix-hero-card__desc">{{ f.desc }}</div>
    </a>
  </div>
</template>
