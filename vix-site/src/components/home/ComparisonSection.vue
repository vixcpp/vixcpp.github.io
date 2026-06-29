<template>
  <section class="comparison section">
    <div class="container">
      <SectionTitle
        eyebrow="Comparison"
        title="Vix.cpp does not sit at the same layer as Drogon or Crow."
        description="Developers sometimes compare Vix.cpp with C++ web frameworks because Vix can build web services. The better comparison is about project scope. Drogon and Crow focus on web application APIs. Vix.cpp focuses on the full native C++ application workflow around the project."
      />

      <div class="comparison__table panel">
        <div class="comparison__head">
          <div>Area</div>
          <div>Vix.cpp</div>
          <div>Drogon</div>
          <div>Crow</div>
        </div>

        <div v-for="row in rows" :key="row.area" class="comparison__row">
          <div class="comparison__area">
            <strong>{{ row.area }}</strong>
            <span>{{ row.note }}</span>
          </div>

          <div>{{ row.vix }}</div>
          <div>{{ row.drogon }}</div>
          <div>{{ row.crow }}</div>
        </div>
      </div>

      <div class="comparison__text">
        <p>
          If the goal is only to choose a C++ HTTP framework, Drogon and Crow
          are direct names to evaluate. If the goal is to create, run, build,
          test, package, install SDKs, manage dependencies, inspect diagnostics,
          and keep a native C++ application workflow coherent, Vix.cpp is
          operating at a broader layer.
        </p>

        <p>
          Vix.cpp can include web runtime pieces, but the project is not defined
          only by HTTP routing. Its role is to make native C++ applications
          easier to build and maintain as complete projects.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import SectionTitle from "@/components/common/SectionTitle.vue";

const rows = [
  {
    area: "Primary role",
    note: "What the project is mainly organized around.",
    vix: "Application workflow and runtime toolkit",
    drogon: "C++ web application framework",
    crow: "C++ micro web framework",
  },
  {
    area: "Command workflow",
    note: "How the project is created, built, run, checked, and packaged.",
    vix: "First-class CLI workflow",
    drogon: "Project-defined workflow",
    crow: "Project-defined workflow",
  },
  {
    area: "Native C++ model",
    note: "Whether the result remains ordinary native C++.",
    vix: "Native executable or library",
    drogon: "Native executable or library",
    crow: "Native executable or library",
  },
  {
    area: "Build ecosystem",
    note: "How it relates to existing C++ build tools.",
    vix: "Works with CMake and SDK profiles",
    drogon: "Usually integrated through CMake",
    crow: "Usually integrated through CMake",
  },
  {
    area: "Package workflow",
    note: "How dependencies and reusable packages fit into the platform.",
    vix: "Registry and package commands",
    drogon: "External package tooling",
    crow: "External package tooling",
  },
  {
    area: "Best fit",
    note: "The kind of question each project answers.",
    vix: "How do I build and maintain a C++ application?",
    drogon: "How do I build a C++ web service?",
    crow: "How do I build a lightweight C++ web app?",
  },
];
</script>

<style scoped>
.comparison {
  position: relative;
}

.comparison__table {
  margin-top: 38px;
  overflow: hidden;
}

.comparison__head,
.comparison__row {
  display: grid;
  grid-template-columns: 1.25fr repeat(3, minmax(0, 1fr));
}

.comparison__head {
  border-bottom: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.035);
}

.comparison__head div {
  padding: 18px 20px;
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.comparison__row {
  border-bottom: 1px solid var(--line);
}

.comparison__row:last-child {
  border-bottom: 0;
}

.comparison__row > div {
  padding: 20px;
  color: var(--text-soft);
  font-size: 0.92rem;
  line-height: 1.65;
}

.comparison__area {
  display: grid;
  gap: 6px;
}

.comparison__area strong {
  color: var(--text);
  font-size: 0.96rem;
}

.comparison__area span {
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.55;
}

.comparison__text {
  max-width: 900px;
  margin-top: 34px;
  display: grid;
  gap: 18px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.85;
}

@media (max-width: 920px) {
  .comparison__table {
    overflow-x: auto;
  }

  .comparison__head,
  .comparison__row {
    min-width: 860px;
  }
}
</style>
