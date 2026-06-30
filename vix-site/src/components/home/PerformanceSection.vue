<template>
  <section class="performance section">
    <div class="performance__inner container">
      <SectionTitle
        eyebrow="Performance"
        title="Vix.cpp performance is measured across the real runtime."
        description="The numbers below come from local release benchmarks: HTTP throughput, router matching, runtime queues, executor paths, HTTP objects, sessions, and app registration."
        center
      />

      <div class="performance__meta">
        <div>
          <span>Build</span>
          <strong>Release</strong>
        </div>
        <div>
          <span>Compiler</span>
          <strong>GCC 13.3.0</strong>
        </div>
        <div>
          <span>Machine</span>
          <strong>HP EliteBook, x86_64</strong>
        </div>
        <div>
          <span>CPU</span>
          <strong>8 threads</strong>
        </div>
      </div>

      <div class="performance__shell">
        <div
          class="performance__tabs"
          role="tablist"
          aria-label="Performance benchmark groups"
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

        <article class="performance__panel">
          <div class="performance__panel-head">
            <div>
              <p class="performance__kicker">{{ activeTab.kicker }}</p>
              <h3>{{ activeTab.title }}</h3>
              <span>{{ activeTab.subtitle }}</span>
            </div>

            <div class="performance__badge">
              <strong>{{ activeTab.version }}</strong>
              <span>{{ activeTab.mode }}</span>
            </div>
          </div>

          <div class="performance__metrics">
            <div
              v-for="metric in activeTab.metrics"
              :key="metric.label"
              class="performance-metric"
              :class="{ 'performance-metric--featured': metric.featured }"
            >
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
              <small>{{ metric.note }}</small>

              <div class="performance-metric__track" aria-hidden="true">
                <div
                  class="performance-metric__fill"
                  :style="{ width: metric.width + '%' }"
                />
              </div>
            </div>
          </div>

          <div class="performance__table">
            <div class="performance__table-head">
              <div>Benchmark</div>
              <div>Median</div>
              <div>Notes</div>
            </div>

            <div
              v-for="row in activeTab.rows"
              :key="row.name"
              class="performance__table-row"
            >
              <div>
                <strong>{{ row.name }}</strong>
                <span>{{ row.group }}</span>
              </div>
              <div>{{ row.value }}</div>
              <div>{{ row.note }}</div>
            </div>
          </div>
        </article>
      </div>

      <div class="performance__commands">
        <CommandLine
          command="vix build --clean --preset release --build-target all -v -- -DVIX_CORE_BUILD_BENCHMARKS=ON -DVIX_CORE_BUILD_TESTS=ON"
        />

        <CommandLine command="ls -lah build-release/benchmarks/core" />

        <CommandLine
          command="./scripts/run_core_benchmarks.sh --bin-dir build-release/benchmarks/core --out-dir benchmarks/results/current --version current --runner local --machine softadastra-HP-EliteBook-x360-1030-G3"
        />
      </div>

      <p class="performance__note">
        These are local benchmark numbers, not universal production claims. Very
        small microbenchmarks can produce extremely high ops/sec values, so they
        are used mainly as regression guardrails. The broader router, runtime,
        HTTP, executor, session, and app groups are the most useful signals for
        release tracking.
      </p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from "vue";
import CommandLine from "@/components/common/CommandLine.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";

const activeKey = ref("http");

const tabs = [
  {
    key: "http",
    label: "HTTP",
    kicker: "Local HTTP benchmark",
    title: "Vix.cpp reached 112k requests per second locally.",
    subtitle:
      "A simple /bench endpoint was measured with wrk using 8 threads, 800 connections, and a 30 second run.",
    version: "v2.7.0",
    mode: "Release",
    metrics: [
      {
        label: "Requests/sec",
        value: "112,539",
        note: "local /bench endpoint",
        width: 100,
        featured: true,
      },
      {
        label: "Total requests",
        value: "3,386,276",
        note: "completed in 30.09s",
        width: 86,
        featured: false,
      },
      {
        label: "Average latency",
        value: "7.31ms",
        note: "800 connections",
        width: 62,
        featured: false,
      },
      {
        label: "P99 latency",
        value: "12.19ms",
        note: "tail latency",
        width: 72,
        featured: true,
      },
    ],
    rows: [
      {
        name: "wrk throughput",
        group: "http.bench",
        value: "112,539 req/s",
        note: "Simple local endpoint under 800 concurrent connections.",
      },
      {
        name: "Average latency",
        group: "http.bench",
        value: "7.31ms",
        note: "Measured during the same 30 second run.",
      },
      {
        name: "P90 latency",
        group: "http.bench",
        value: "8.73ms",
        note: "Good mid-tail signal for the current HTTP runtime.",
      },
      {
        name: "P99 latency",
        group: "http.bench",
        value: "12.19ms",
        note: "The most important latency number from this run.",
      },
    ],
  },
  {
    key: "router",
    label: "Router",
    kicker: "Core router benchmark",
    title: "Route matching paths are tracked separately.",
    subtitle:
      "Static routes, parameterized routes, query strings, wrong methods, and mixed route tables are measured as separate benchmark cases.",
    version: "current",
    mode: "Release",
    metrics: [
      {
        label: "Strip query",
        value: "40.64M",
        note: "ops/sec",
        width: 100,
        featured: true,
      },
      {
        label: "Static route",
        value: "9.43M",
        note: "ops/sec",
        width: 68,
        featured: true,
      },
      {
        label: "Param route",
        value: "5.62M",
        note: "ops/sec",
        width: 52,
        featured: false,
      },
      {
        label: "Many static",
        value: "5.96M",
        note: "ops/sec",
        width: 55,
        featured: false,
      },
    ],
    rows: [
      {
        name: "router.match/strip_query",
        group: "router.match",
        value: "40.64M ops/sec",
        note: "Fast query stripping path before route matching.",
      },
      {
        name: "router.match/static_route",
        group: "router.match",
        value: "9.43M ops/sec",
        note: "Simple static route lookup path.",
      },
      {
        name: "router.match/param_route",
        group: "router.match",
        value: "5.62M ops/sec",
        note: "Parameterized route matching path.",
      },
      {
        name: "router.match/many_static_routes",
        group: "router.match",
        value: "5.96M ops/sec",
        note: "Route table with many static entries.",
      },
    ],
  },
  {
    key: "runtime",
    label: "Runtime",
    kicker: "Core runtime benchmark",
    title: "Runtime queues and worker paths are part of the baseline.",
    subtitle:
      "The low-level queue, scheduler, and worker paths are benchmarked because the higher-level HTTP and app layers depend on them.",
    version: "current",
    mode: "Release",
    metrics: [
      {
        label: "Queue push/pop",
        value: "55.52M",
        note: "ops/sec",
        width: 100,
        featured: true,
      },
      {
        label: "Queue push/clear",
        value: "33.86M",
        note: "ops/sec",
        width: 76,
        featured: false,
      },
      {
        label: "Worker tasks",
        value: "1.29M",
        note: "ops/sec",
        width: 48,
        featured: true,
      },
      {
        label: "Scheduler tasks",
        value: "692K",
        note: "ops/sec",
        width: 38,
        featured: false,
      },
    ],
    rows: [
      {
        name: "runtime.queue/push_pop",
        group: "runtime.queue",
        value: "55.52M ops/sec",
        note: "Queue push and pop path.",
      },
      {
        name: "runtime.queue/push_clear",
        group: "runtime.queue",
        value: "33.86M ops/sec",
        note: "Queue push and clear path.",
      },
      {
        name: "runtime.worker/submit_complete_tasks",
        group: "runtime.worker",
        value: "1.29M ops/sec",
        note: "Worker submit and completion path.",
      },
      {
        name: "runtime.scheduler/submit_complete_tasks",
        group: "runtime.scheduler",
        value: "692K ops/sec",
        note: "Scheduler submit and completion path.",
      },
    ],
  },
  {
    key: "objects",
    label: "HTTP objects",
    kicker: "HTTP object benchmark",
    title: "Request and response object paths are measured directly.",
    subtitle:
      "These benchmarks track object construction and response helper paths before full network and application costs are added.",
    version: "current",
    mode: "Release",
    metrics: [
      {
        label: "Response body",
        value: "65.92M",
        note: "ops/sec",
        width: 100,
        featured: true,
      },
      {
        label: "Request default",
        value: "10.85M",
        note: "ops/sec",
        width: 72,
        featured: true,
      },
      {
        label: "Static target",
        value: "1.06M",
        note: "ops/sec",
        width: 46,
        featured: false,
      },
      {
        label: "Query target",
        value: "656K",
        note: "ops/sec",
        width: 36,
        featured: false,
      },
    ],
    rows: [
      {
        name: "http.response/construct_status_body",
        group: "http.response",
        value: "65.92M ops/sec",
        note: "Status + body response construction path.",
      },
      {
        name: "http.request/default_construct",
        group: "http.request",
        value: "10.85M ops/sec",
        note: "Default request object construction.",
      },
      {
        name: "http.request/construct_static_target",
        group: "http.request",
        value: "1.06M ops/sec",
        note: "Request object with static target.",
      },
      {
        name: "http.request/construct_query_target",
        group: "http.request",
        value: "656K ops/sec",
        note: "Request object with query target parsing.",
      },
    ],
  },
  {
    key: "executor",
    label: "Executor",
    kicker: "Executor benchmark",
    title: "Executor submit, post, and metrics paths are tracked.",
    subtitle:
      "Executor numbers are useful for detecting regressions in task scheduling, completion, and runtime metric reads.",
    version: "current",
    mode: "Release",
    metrics: [
      {
        label: "Idle reads",
        value: "107.44M",
        note: "ops/sec guardrail",
        width: 100,
        featured: false,
      },
      {
        label: "Running reads",
        value: "2.72M",
        note: "ops/sec",
        width: 64,
        featured: false,
      },
      {
        label: "Submit task",
        value: "494K",
        note: "ops/sec",
        width: 44,
        featured: true,
      },
      {
        label: "Post void",
        value: "402K",
        note: "ops/sec",
        width: 40,
        featured: true,
      },
    ],
    rows: [
      {
        name: "executor.metrics/idle_reads",
        group: "executor.metrics",
        value: "107.44M ops/sec",
        note: "Very small guardrail benchmark, not a marketing number.",
      },
      {
        name: "executor.metrics/running_idle_reads",
        group: "executor.metrics",
        value: "2.72M ops/sec",
        note: "Metric reads while the executor is active.",
      },
      {
        name: "executor.submit/task_complete",
        group: "executor.submit",
        value: "494K ops/sec",
        note: "Submit and complete task path.",
      },
      {
        name: "executor.post/void_tasks",
        group: "executor.post",
        value: "402K ops/sec",
        note: "Post void task path.",
      },
    ],
  },
  {
    key: "app",
    label: "App/session",
    kicker: "Application benchmark",
    title: "App registration and fake session transport are benchmarked.",
    subtitle:
      "These numbers are closer to framework-level behavior because they touch app route registration and fake request transport paths.",
    version: "current",
    mode: "Release",
    metrics: [
      {
        label: "Session root",
        value: "181K",
        note: "ops/sec",
        width: 100,
        featured: true,
      },
      {
        label: "Session health",
        value: "168K",
        note: "ops/sec",
        width: 92,
        featured: false,
      },
      {
        label: "Route get",
        value: "132K",
        note: "ops/sec",
        width: 72,
        featured: true,
      },
      {
        label: "Group objects",
        value: "73K",
        note: "ops/sec",
        width: 48,
        featured: false,
      },
    ],
    rows: [
      {
        name: "session.fake_transport/single_get_root",
        group: "session.fake_transport",
        value: "181K ops/sec",
        note: "Fake transport GET / path.",
      },
      {
        name: "session.fake_transport/single_get_health",
        group: "session.fake_transport",
        value: "168K ops/sec",
        note: "Fake transport health endpoint.",
      },
      {
        name: "app.route_registration/get_routes",
        group: "app.route_registration",
        value: "132K ops/sec",
        note: "Route registration lookup path.",
      },
      {
        name: "app.group_registration/create_group_objects",
        group: "app.group_registration",
        value: "73K ops/sec",
        note: "Group object creation path.",
      },
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
      rgba(34, 197, 94, 0.12),
      transparent 25rem
    ),
    radial-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px);
  background-size:
    auto,
    22px 22px;
  opacity: 0.55;
  mask-image: linear-gradient(#000, transparent 88%);
}

.performance__inner {
  position: relative;
}

.performance__meta {
  max-width: 980px;
  margin: 40px auto 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.performance__meta > div {
  padding: 17px 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.035);
}

.performance__meta span {
  display: block;
  margin-bottom: 7px;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.performance__meta strong {
  display: block;
  color: var(--text);
  font-size: 0.95rem;
  line-height: 1.4;
}

.performance__shell {
  max-width: 980px;
  margin: 26px auto 0;
}

.performance__tabs {
  display: flex;
  justify-content: center;
  gap: 8px;
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
  padding: 0.95rem 1.05rem;
  font-size: 0.88rem;
  font-weight: 800;
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

.performance__panel {
  overflow: hidden;
  border: 1px solid var(--line);
  border-top: 0;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
    var(--bg-ink);
  box-shadow: var(--shadow-lg);
}

.performance__panel-head {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border-bottom: 1px solid var(--line-soft);
}

.performance__kicker {
  margin: 0 0 8px;
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.performance__panel-head h3 {
  max-width: 680px;
  margin: 0;
  color: var(--text);
  font-size: clamp(1.35rem, 2.2vw, 2rem);
  line-height: 1.12;
  letter-spacing: -0.04em;
}

.performance__panel-head span {
  display: block;
  max-width: 720px;
  margin-top: 9px;
  color: var(--text-soft);
  font-size: 0.92rem;
  line-height: 1.6;
}

.performance__badge {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  align-content: center;
  min-width: 98px;
  height: 68px;
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
  color: rgba(187, 247, 208, 0.72);
  font-size: 0.72rem;
  font-weight: 800;
}

.performance__metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  padding: 24px;
}

.performance-metric {
  position: relative;
  overflow: hidden;
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.03);
}

.performance-metric--featured {
  border-color: rgba(34, 197, 94, 0.32);
  background:
    radial-gradient(
      circle at top right,
      rgba(34, 197, 94, 0.14),
      transparent 42%
    ),
    rgba(255, 255, 255, 0.035);
}

.performance-metric span {
  display: block;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.performance-metric strong {
  display: block;
  margin-top: 10px;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: clamp(1.35rem, 2vw, 1.75rem);
  font-weight: 900;
  letter-spacing: -0.06em;
}

.performance-metric small {
  display: block;
  margin-top: 5px;
  color: var(--text-soft);
  font-size: 0.78rem;
  line-height: 1.4;
}

.performance-metric__track {
  margin-top: 16px;
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.performance-metric__fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #22c55e, #86efac);
}

.performance__table {
  border-top: 1px solid var(--line-soft);
}

.performance__table-head,
.performance__table-row {
  display: grid;
  grid-template-columns: minmax(260px, 1.25fr) minmax(150px, 0.65fr) minmax(
      260px,
      1.1fr
    );
}

.performance__table-head {
  background: rgba(255, 255, 255, 0.035);
}

.performance__table-head > div {
  padding: 14px 20px;
  color: var(--text);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.performance__table-row {
  border-top: 1px solid var(--line-soft);
}

.performance__table-row > div {
  min-width: 0;
  padding: 17px 20px;
  color: var(--text-soft);
  font-size: 0.88rem;
  line-height: 1.55;
}

.performance__table-row strong {
  display: block;
  color: var(--text);
  font-size: 0.9rem;
}

.performance__table-row span {
  display: block;
  margin-top: 4px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
}

.performance__table-row > div:nth-child(2) {
  color: #86efac;
  font-family: var(--font-mono);
  font-weight: 850;
}

.performance__commands {
  max-width: 980px;
  margin: 26px auto 0;
  display: grid;
  gap: 8px;
}

.performance__note {
  max-width: 900px;
  margin: 20px auto 0;
  color: var(--text-muted);
  font-size: 0.88rem;
  line-height: 1.75;
  text-align: center;
}

@media (max-width: 980px) {
  .performance__meta,
  .performance__metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  .performance__table {
    overflow-x: auto;
  }

  .performance__table-head,
  .performance__table-row {
    min-width: 780px;
  }
}

@media (max-width: 720px) {
  .performance__panel-head {
    flex-direction: column;
  }

  .performance__badge {
    place-items: start;
    text-align: left;
  }

  .performance__meta {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .performance__metrics {
    grid-template-columns: 1fr;
    padding: 18px;
  }

  .performance__panel-head {
    padding: 22px;
  }

  .performance__tab {
    padding-inline: 0.9rem;
  }
}
</style>
