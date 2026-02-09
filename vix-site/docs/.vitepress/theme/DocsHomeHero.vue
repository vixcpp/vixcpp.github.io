<script setup>
import HeroCodeBlock from "../../../src/components/HeroCodeBlock.vue";

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
</script>

<template>
  <div class="vix-docs-hero">
    <div class="vix-docs-hero__left">
      <h1 class="vix-docs-h1">Vix.cpp<br />Documentation</h1>

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
      <div class="vix-hero-annot">
        Your runtime endpoint works with the Vix.cpp API
        <svg
          class="vix-hero-annot__arrow"
          viewBox="0 0 300 180"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="
              M12 38
              C80 4, 190 6, 246 54
              C272 78, 280 104, 262 128
              M262 128
              L276 120
              M262 128
              L274 142
            "
            fill="none"
            stroke="currentColor"
            stroke-width="6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <HeroCodeBlock langLabel="cpp" codeLang="cpp" :code="heroCode" />
    </div>
  </div>
</template>
