<template>
  <section class="comparison section">
    <div class="container">
      <SectionTitle
        class="comparison__section-title"
        eyebrow="Comparison"
        title="Vix.cpp is not just another C++ web framework."
        description="Drogon and Crow are good names when the question is HTTP routing. Vix.cpp is broader: it gives C++ projects a full application workflow around running files, building, testing, packaging, modules, SDKs, registry, and production preparation."
        center
      />

      <div class="comparison__table">
        <div class="comparison__head">
          <div>
            <strong>Project scope</strong>
            <span>What each tool is mainly responsible for</span>
          </div>
          <div>Vix.cpp</div>
          <div>Drogon</div>
          <div>Crow</div>
        </div>

        <template v-for="item in rows" :key="item.key">
          <div v-if="item.type === 'group'" class="comparison__group">
            <strong>{{ item.title }}</strong>
            <span>{{ item.subtitle }}</span>
          </div>

          <div v-else class="comparison__row">
            <div class="comparison__area">
              <strong>{{ item.area }}</strong>
              <span>{{ item.note }}</span>
            </div>

            <div>
              <StatusPill :status="item.vix.status" :label="item.vix.label" />
            </div>

            <div>
              <StatusPill
                :status="item.drogon.status"
                :label="item.drogon.label"
              />
            </div>

            <div>
              <StatusPill :status="item.crow.status" :label="item.crow.label" />
            </div>
          </div>
        </template>
      </div>

      <div class="comparison__summary">
        <p>
          Drogon and Crow answer a focused question:
          <strong>how do I build a C++ web service?</strong>
          Vix.cpp answers a wider one:
          <strong
            >how do I build, run, test, package, extend, and maintain a real
            native C++ application?</strong
          >
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { defineComponent, h } from "vue";
import SectionTitle from "@/components/common/SectionTitle.vue";

const icons = {
  core: "M8.4 13.6 4.9 10.1l1.4-1.4 2.1 2.1 5.3-5.3 1.4 1.4-6.7 6.7Z",
  partial:
    "M10 3 18 17H2L10 3Zm0 4.2L5.8 15h8.4L10 7.2ZM9.1 9h1.8v3.8H9.1V9Zm0 4.8h1.8v1.6H9.1v-1.6Z",
  external:
    "M5.7 4.3 10 8.6l4.3-4.3 1.4 1.4L11.4 10l4.3 4.3-1.4 1.4L10 11.4l-4.3 4.3-1.4-1.4L8.6 10 4.3 5.7l1.4-1.4Z",
};

const StatusPill = defineComponent({
  name: "StatusPill",
  props: {
    status: { type: String, required: true },
    label: { type: String, required: true },
  },
  setup(props) {
    return () =>
      h(
        "span",
        {
          class: ["status-icon", `status-icon--${props.status}`],
          title: props.label,
          "aria-label": props.label,
        },
        [
          h("svg", { viewBox: "0 0 20 20", "aria-hidden": "true" }, [
            h("path", { d: icons[props.status] || icons.external }),
          ]),
        ],
      );
  },
});

const rows = [
  {
    key: "workflow",
    type: "group",
    title: "Application workflow",
    subtitle: "From a C++ file to a complete project workflow.",
  },
  {
    key: "cli",
    area: "Command workflow",
    note: "Create, run, build, test, check, package, and prepare projects.",
    vix: { status: "core", label: "Built-in" },
    drogon: { status: "external", label: "Project-defined" },
    crow: { status: "external", label: "Project-defined" },
  },
  {
    key: "sdk",
    area: "SDK profiles",
    note: "Install and switch project profiles around runtime modules.",
    vix: { status: "core", label: "Built-in" },
    drogon: { status: "external", label: "External" },
    crow: { status: "external", label: "External" },
  },
  {
    key: "registry",
    area: "Package registry",
    note: "Reusable modules and packages managed from the Vix workflow.",
    vix: { status: "core", label: "Built-in" },
    drogon: { status: "external", label: "External tooling" },
    crow: { status: "external", label: "External tooling" },
  },

  {
    key: "runtime",
    type: "group",
    title: "Runtime capabilities",
    subtitle: "The kind of application pieces the platform can organize.",
  },
  {
    key: "http",
    area: "HTTP services",
    note: "Routes, requests, responses, and backend services.",
    vix: { status: "core", label: "Runtime module" },
    drogon: { status: "core", label: "Core focus" },
    crow: { status: "core", label: "Core focus" },
  },
  {
    key: "ui",
    area: "Server-rendered UI",
    note: "Views, HTML responses, assets, forms, fragments, PWA helpers.",
    vix: { status: "core", label: "Vix UI" },
    drogon: { status: "partial", label: "Possible" },
    crow: { status: "partial", label: "Possible" },
  },
  {
    key: "requests",
    area: "HTTP client",
    note: "Python requests-like client API for C++ applications.",
    vix: { status: "core", label: "Vix Requests" },
    drogon: { status: "partial", label: "Framework scope" },
    crow: { status: "external", label: "External" },
  },
  {
    key: "realtime",
    area: "Realtime and distributed modules",
    note: "WebSocket, P2P, sync, agents, games, and offline-first workflows.",
    vix: { status: "core", label: "Platform scope" },
    drogon: { status: "partial", label: "Web scope" },
    crow: { status: "partial", label: "Web scope" },
  },

  {
    key: "model",
    type: "group",
    title: "C++ model",
    subtitle: "How much the tool changes the native C++ experience.",
  },
  {
    key: "native",
    area: "Native output",
    note: "The result stays a normal native executable or library.",
    vix: { status: "core", label: "Native C++" },
    drogon: { status: "core", label: "Native C++" },
    crow: { status: "core", label: "Native C++" },
  },
  {
    key: "cmake",
    area: "Build ecosystem",
    note: "Works with the existing C++ build world instead of replacing it.",
    vix: { status: "core", label: "CMake + SDKs" },
    drogon: { status: "core", label: "CMake" },
    crow: { status: "core", label: "CMake" },
  },
  {
    key: "fit",
    area: "Best fit",
    note: "The main question each project helps answer.",
    vix: { status: "core", label: "Build an app" },
    drogon: { status: "core", label: "Build a web service" },
    crow: { status: "core", label: "Build a small web app" },
  },
];
</script>

<style scoped>
.comparison {
  position: relative;
}

.comparison__table {
  margin-top: 42px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--bg-ink);
  box-shadow: var(--shadow-lg);
}

.comparison__head,
.comparison__row {
  display: grid;
  grid-template-columns: minmax(280px, 1.55fr) repeat(3, minmax(130px, 0.75fr));
}
.comparison__head {
  background: var(--bg-panel-strong);
  border-bottom: 1px solid var(--line);
}

.comparison__head > div {
  padding: 18px 22px;
  color: var(--text);
  font-size: 0.86rem;
  font-weight: 800;
}

.comparison__head > div:not(:first-child) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.comparison__head strong {
  display: block;
  color: var(--text);
  font-size: 0.95rem;
}
.comparison__section-title :deep(h2) {
  max-width: 820px;
}
.comparison__head span {
  display: block;
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 500;
}

.comparison__group {
  padding: 16px 22px;
  background: rgba(255, 255, 255, 0.035);
  border-bottom: 1px solid var(--line);
}

.comparison__group strong {
  display: block;
  color: var(--text);
  font-size: 0.95rem;
  font-weight: 800;
}

.comparison__group span {
  display: block;
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 500;
}

.comparison__group > div {
  padding: 16px 22px;
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 800;
}

.comparison__group > div:not(:first-child) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.comparison__group strong {
  display: block;
  color: var(--text);
  font-size: 0.95rem;
}

.comparison__group span {
  display: block;
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 500;
}

.comparison__row {
  border-bottom: 1px solid var(--line-soft);
}

.comparison__row:last-child {
  border-bottom: 0;
}

.comparison__row > div {
  min-width: 0;
  padding: 18px 22px;
  color: var(--text-soft);
  font-size: 0.9rem;
  line-height: 1.6;
}

.comparison__row > div:not(:first-child) {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.comparison__area {
  display: grid;
  gap: 5px;
}

.comparison__area strong {
  color: var(--text);
  font-size: 0.95rem;
}

.comparison__area span {
  color: var(--text-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}

:deep(.status-icon) {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
}

:deep(.status-icon svg) {
  width: 15px;
  height: 15px;
  fill: currentColor;
}

:deep(.status-icon--core) {
  color: #86efac;
  background: rgba(34, 197, 94, 0.18);
}

:deep(.status-icon--partial) {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.18);
}

:deep(.status-icon--external) {
  color: #f87171;
  background: rgba(248, 113, 113, 0.18);
}

.comparison__summary {
  max-width: 920px;
  margin: 28px auto 0;
  padding: 22px 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: linear-gradient(
    180deg,
    rgba(34, 197, 94, 0.08),
    rgba(255, 255, 255, 0.025)
  );
  color: var(--text-soft);
  font-size: clamp(1rem, 1.25vw, 1.1rem);
  line-height: 1.75;
  text-align: center;
}

.comparison__summary p {
  margin: 0;
}

.comparison__summary strong {
  color: var(--text);
}

@media (max-width: 920px) {
  .comparison__table {
    overflow-x: auto;
  }

  .comparison__head,
  .comparison__row,
  .comparison__group {
    min-width: 880px;
  }
}
</style>
