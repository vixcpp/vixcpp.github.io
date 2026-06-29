<template>
  <section class="performance section">
    <div class="performance__inner container">
      <SectionTitle
        eyebrow="Performance"
        title="Fast feedback is part of the Vix.cpp workflow."
        description="Vix.cpp performance is measured across the real developer loop: run a single C++ file, build native targets, benchmark HTTP endpoints, and protect internal runtime paths with Release baselines."
        center
      />

      <div class="performance__shell">
        <div
          class="performance__tabs"
          role="tablist"
          aria-label="Performance benchmarks"
        >
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="performance__tab"
            :class="{ 'performance__tab--active': activeKey === tab.key }"
            role="tab"
            :aria-selected="activeKey === tab.key"
            @click="activeKey = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="performance__chart-card">
          <div class="performance__chart-head">
            <div>
              <p class="performance__chart-kicker">{{ activeTab.kicker }}</p>
              <h3>{{ activeTab.title }}</h3>
              <span>{{ activeTab.subtitle }}</span>
            </div>

            <div class="performance__badge">
              <strong>{{ activeTab.version }}</strong>
              <span>{{ activeTab.mode }}</span>
            </div>
          </div>

          <div class="performance__bars" aria-label="Benchmark chart">
            <div
              v-for="bar in activeTab.bars"
              :key="bar.name"
              class="performance__bar-item"
            >
              <div class="performance__bar-value">{{ bar.display }}</div>

              <div class="performance__bar-track">
                <div
                  class="performance__bar-fill"
                  :style="{ height: bar.height + '%' }"
                >
                  <span
                    v-if="bar.logo"
                    class="performance__bar-logo"
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 120 120"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="60" cy="60" r="56" fill="#0f1215" />
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        stroke="#22c55e"
                        stroke-opacity="0.35"
                        stroke-width="3"
                      />
                      <polygon
                        points="28,24 45,24 60,96 50,96"
                        fill="#86efac"
                      />
                      <polygon
                        points="92,24 75,24 60,96 70,96"
                        fill="#22c55e"
                      />
                    </svg>
                  </span>
                </div>
              </div>

              <strong>{{ bar.name }}</strong>
              <span>{{ bar.note }}</span>
            </div>
          </div>

          <div class="performance__facts">
            <div v-for="fact in activeTab.facts" :key="fact.label">
              <strong>{{ fact.value }}</strong>
              <span>{{ fact.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="performance__trust">
        <article>
          <strong>Run fast</strong>
          <span
            >Small C++ files can be edited and executed directly with vix
            run.</span
          >
        </article>

        <article>
          <strong>Build smarter</strong>
          <span
            >Clean target builds can return through the build-state fast
            path.</span
          >
        </article>

        <article>
          <strong>Protect baselines</strong>
          <span
            >Runtime, executor, router, HTTP, session, and app paths are
            benchmarked.</span
          >
        </article>
      </div>

      <div class="performance__commands">
        <CommandLine command="time vix run main.cpp" />
        <CommandLine command="vix build --fast --build-target vix" />
        <CommandLine
          command="wrk -t8 -c800 -d30s --latency http://127.0.0.1:8080/bench"
        />
      </div>

      <p class="performance__note">
        The vix run numbers show a local single-file edit/run feedback loop. The
        build numbers describe a clean no-op target build where the fast path
        can skip the full pipeline. The HTTP result comes from a local v2.7
        release benchmark on an HP EliteBook, not a dedicated benchmark server.
      </p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from "vue";
import CommandLine from "@/components/common/CommandLine.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";

const activeKey = ref("run");

const tabs = [
  {
    key: "run",
    label: "vix run",
    kicker: "Single-file feedback loop",
    title: "Edit a C++ file and run it in about half a second.",
    subtitle:
      "A tiny C++ file was edited and executed twice locally with vix run. The full command completed around 0.57s.",
    version: "local",
    mode: "dev loop",
    bars: [
      {
        name: "First run",
        display: "0.579s",
        height: 100,
        note: "Hello, world",
        logo: true,
      },
      {
        name: "After edit",
        display: "0.569s",
        height: 96,
        note: "Hellodd, world",
        logo: false,
      },
      {
        name: "Feedback loop",
        display: "~0.57s",
        height: 82,
        note: "edit → run → output",
        logo: false,
      },
    ],
    facts: [
      { value: "0.579s", label: "first local run" },
      { value: "0.569s", label: "after source edit" },
      { value: "1 file", label: "main.cpp" },
      { value: "direct", label: "vix run workflow" },
    ],
  },
  {
    key: "build",
    label: "vix build",
    kicker: "Build-state fast path",
    title: "No-op target builds can return in hundreds of milliseconds.",
    subtitle:
      "When the project state proves nothing changed, vix build --fast can skip the full build pipeline and return early.",
    version: "build graph",
    mode: "fast path",
    bars: [
      {
        name: "vix build --fast",
        display: "303ms",
        height: 100,
        note: "clean no-op target",
        logo: true,
      },
      {
        name: "normal build",
        display: "6.10s",
        height: 42,
        note: "full no-op path",
        logo: false,
      },
      {
        name: "graph disabled",
        display: "6.16s",
        height: 40,
        note: "compat path",
        logo: false,
      },
    ],
    facts: [
      { value: "303ms", label: "fast no-op build" },
      { value: "6.10s", label: "normal no-op build" },
      { value: "6.16s", label: "graph disabled" },
      { value: "~20x", label: "faster no-op path" },
    ],
  },
  {
    key: "http",
    label: "HTTP",
    kicker: "Local v2.7 benchmark",
    title: "HTTP endpoint reached 112k requests per second locally.",
    subtitle:
      "Measured with wrk, 8 threads, 800 connections, and a 30 second run against a local release build.",
    version: "v2.7",
    mode: "Release",
    bars: [
      {
        name: "Vix HTTP",
        display: "112,539",
        height: 100,
        note: "requests/sec",
        logo: true,
      },
      {
        name: "Requests",
        display: "3,386,276",
        height: 74,
        note: "completed in 30.09s",
        logo: false,
      },
      {
        name: "p99 latency",
        display: "12.19ms",
        height: 38,
        note: "at 800 connections",
        logo: false,
      },
    ],
    facts: [
      { value: "112,539", label: "requests/sec" },
      { value: "7.31ms", label: "average latency" },
      { value: "12.19ms", label: "p99 latency" },
      { value: "800", label: "connections" },
    ],
  },
  {
    key: "router",
    label: "Router",
    kicker: "Core benchmark baseline",
    title: "Route matching costs are visible and tracked.",
    subtitle:
      "Static, parameterized, nested, and query-string route paths are measured separately.",
    version: "v2.6.3",
    mode: "Release",
    bars: [
      {
        name: "Strip query",
        display: "41.6M",
        height: 100,
        note: "ops/sec",
        logo: true,
      },
      {
        name: "Static route",
        display: "9.37M",
        height: 66,
        note: "ops/sec",
        logo: false,
      },
      {
        name: "Param route",
        display: "5.67M",
        height: 48,
        note: "ops/sec",
        logo: false,
      },
    ],
    facts: [
      { value: "41.6M", label: "strip query ops/sec" },
      { value: "9.37M", label: "static route ops/sec" },
      { value: "5.67M", label: "param route ops/sec" },
      { value: "3.91M", label: "nested param ops/sec" },
    ],
  },
  {
    key: "runtime",
    label: "Runtime",
    kicker: "Core benchmark baseline",
    title: "Runtime queues and scheduler paths are benchmarked.",
    subtitle:
      "Low-level runtime pieces are measured because higher-level HTTP, sessions, and app APIs depend on them.",
    version: "v2.6.3",
    mode: "Release",
    bars: [
      {
        name: "Queue push/pop",
        display: "49.6M",
        height: 100,
        note: "ops/sec",
        logo: true,
      },
      {
        name: "Queue push/clear",
        display: "33.3M",
        height: 78,
        note: "ops/sec",
        logo: false,
      },
      {
        name: "Worker tasks",
        display: "747K",
        height: 42,
        note: "ops/sec",
        logo: false,
      },
    ],
    facts: [
      { value: "49.6M", label: "queue push/pop" },
      { value: "33.3M", label: "queue push/clear" },
      { value: "747K", label: "worker tasks" },
      { value: "677K", label: "scheduler tasks" },
    ],
  },
];

const activeTab = computed(
  () => tabs.find((tab) => tab.key === activeKey.value) || tabs[0],
);
</script>

<style scoped>
.performance {
  position: relative;
  overflow: hidden;
}

.performance::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 50% 0%,
      rgba(34, 197, 94, 0.1),
      transparent 24rem
    ),
    radial-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px);
  background-size:
    auto,
    22px 22px;
  opacity: 0.5;
  mask-image: linear-gradient(#000, transparent 88%);
}

.performance__inner {
  position: relative;
}

.performance__shell {
  max-width: 900px;
  margin: 42px auto 0;
}

.performance__tabs {
  display: flex;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid var(--line);
  overflow-x: auto;
  scrollbar-width: none;
}

.performance__tabs::-webkit-scrollbar {
  display: none;
}

.performance__tab {
  position: relative;
  flex: 0 0 auto;
  border: 0;
  background: transparent;
  color: var(--text-soft);
  padding: 0.95rem 1.2rem;
  font-size: 0.92rem;
  font-weight: 750;
  cursor: pointer;
}

.performance__tab::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: transparent;
}

.performance__tab:hover {
  color: var(--text);
}

.performance__tab--active {
  color: #86efac;
  background: rgba(255, 255, 255, 0.045);
}

.performance__tab--active::after {
  background: var(--green);
}

.performance__chart-card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
    var(--bg-ink);
  box-shadow: var(--shadow-lg);
}

.performance__chart-head {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 26px 28px;
  border-bottom: 1px solid var(--line-soft);
}

.performance__chart-kicker {
  margin: 0 0 8px;
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.performance__chart-head h3 {
  margin: 0;
  color: var(--text);
  font-size: clamp(1.35rem, 2.2vw, 2rem);
  line-height: 1.1;
  letter-spacing: -0.04em;
}

.performance__chart-head span {
  display: block;
  margin-top: 8px;
  color: var(--text-soft);
  font-size: 0.92rem;
  line-height: 1.55;
}

.performance__badge {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  align-content: center;
  min-width: 92px;
  height: 66px;
  padding: 0 14px;
  border: 1px solid rgba(34, 197, 94, 0.25);
  border-radius: var(--radius-md);
  background: rgba(34, 197, 94, 0.08);
  text-align: center;
}

.performance__badge strong {
  color: #86efac;
  font-family: var(--font-mono);
  font-size: 0.9rem;
}

.performance__badge span {
  margin: 2px 0 0;
  color: rgba(187, 247, 208, 0.7);
  font-size: 0.72rem;
  font-weight: 750;
}

.performance__bars {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: end;
  gap: 28px;
  min-height: 290px;
  padding: 34px 42px 30px;
}

.performance__bar-item {
  display: grid;
  justify-items: center;
  align-items: end;
  min-width: 0;
}

.performance__bar-value {
  margin-bottom: 8px;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 0.98rem;
  font-weight: 850;
  letter-spacing: -0.03em;
}

.performance__bar-track {
  position: relative;
  display: flex;
  align-items: end;
  justify-content: center;
  width: min(100%, 104px);
  height: 170px;
}

.performance__bar-fill {
  position: relative;
  width: 100%;
  min-height: 38px;
  border-radius: 12px 12px 0 0;
  background:
    linear-gradient(180deg, rgba(134, 239, 172, 0.95), rgba(34, 197, 94, 0.74)),
    var(--green);
  box-shadow: 0 16px 38px rgba(34, 197, 94, 0.18);
}

.performance__bar-item:nth-child(2) .performance__bar-fill {
  background: linear-gradient(180deg, #7dd3fc, #64748b);
  box-shadow: 0 16px 38px rgba(125, 211, 252, 0.12);
}

.performance__bar-item:nth-child(3) .performance__bar-fill {
  background: linear-gradient(180deg, #c4b5fd, #64748b);
  box-shadow: 0 16px 38px rgba(196, 181, 253, 0.12);
}

.performance__bar-logo {
  position: absolute;
  left: 50%;
  bottom: 16px;
  width: 44px;
  height: 44px;
  transform: translateX(-50%);
}

.performance__bar-logo svg {
  width: 100%;
  height: 100%;
}

.performance__bar-item strong {
  margin-top: 14px;
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 850;
  text-align: center;
}

.performance__bar-item span {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 650;
  text-align: center;
}

.performance__facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, 0.025);
}

.performance__facts div {
  padding: 18px 16px;
  border-right: 1px solid var(--line-soft);
  text-align: center;
}

.performance__facts div:last-child {
  border-right: 0;
}

.performance__facts strong {
  display: block;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 0.95rem;
  font-weight: 850;
}

.performance__facts span {
  display: block;
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.performance__trust {
  max-width: 900px;
  margin: 24px auto 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.performance__trust article {
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.025);
}

.performance__trust strong {
  display: block;
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 850;
}

.performance__trust span {
  display: block;
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 0.8rem;
  line-height: 1.55;
}

.performance__commands {
  max-width: 900px;
  margin: 26px auto 0;
  display: grid;
  gap: 8px;
}

.performance__note {
  max-width: 860px;
  margin: 20px auto 0;
  color: var(--text-muted);
  font-size: 0.88rem;
  line-height: 1.7;
  text-align: center;
}

@media (max-width: 760px) {
  .performance__chart-head {
    flex-direction: column;
  }

  .performance__badge {
    place-items: start;
    align-content: center;
    text-align: left;
  }

  .performance__bars {
    gap: 18px;
    padding: 28px 20px;
  }

  .performance__facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .performance__facts div:nth-child(2) {
    border-right: 0;
  }

  .performance__facts div:nth-child(-n + 2) {
    border-bottom: 1px solid var(--line-soft);
  }

  .performance__trust {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .performance__bars {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .performance__bar-track {
    width: 100%;
    height: 78px;
    align-items: center;
    justify-content: flex-start;
  }

  .performance__bar-fill {
    height: 34px !important;
    border-radius: 999px;
  }

  .performance__bar-logo {
    display: none;
  }
}
</style>
