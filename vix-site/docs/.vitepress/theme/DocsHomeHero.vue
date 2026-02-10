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
      <div class="vix-hero-annot">
        Your runtime endpoint works with the Vix.cpp API
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
</template>
