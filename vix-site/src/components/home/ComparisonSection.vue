<template>
  <section class="comparison section">
    <div class="container">
      <SectionTitle
        class="comparison__section-title"
        eyebrow="Benchmark comparison"
        title="Vix.cpp stands very close to Drogon and ahead of Crow."
        description="A simple local Hello World benchmark using the same endpoint, the same port, the same wrk command, and 8 server threads."
        center
      />

      <div class="comparison__meta">
        <div>
          <span>Command</span>
          <strong>wrk -t8 -c800 -d30s --latency</strong>
        </div>
        <div>
          <span>Endpoint</span>
          <strong>/bench</strong>
        </div>
        <div>
          <span>Machine</span>
          <strong>HP EliteBook, 8 CPU threads</strong>
        </div>
      </div>

      <div class="comparison__cards">
        <article
          v-for="item in frameworks"
          :key="item.name"
          class="comparison-card"
          :class="{ 'comparison-card--highlight': item.highlight }"
        >
          <div class="comparison-card__top">
            <div>
              <span class="comparison-card__rank">{{ item.rank }}</span>
              <h3>{{ item.name }}</h3>
            </div>

            <span class="comparison-card__badge">
              {{ item.badge }}
            </span>
          </div>

          <div class="comparison-card__main">
            <strong>{{ item.requests }}</strong>
            <span>requests/sec</span>
          </div>

          <div class="comparison-card__stats">
            <div>
              <span>Avg latency</span>
              <strong>{{ item.avg }}</strong>
            </div>
            <div>
              <span>P99 latency</span>
              <strong>{{ item.p99 }}</strong>
            </div>
          </div>

          <p>{{ item.note }}</p>
        </article>
      </div>

      <div class="comparison__table">
        <div class="comparison__head">
          <div>Framework</div>
          <div>Requests/sec</div>
          <div>Avg latency</div>
          <div>P50</div>
          <div>P90</div>
          <div>P99</div>
        </div>

        <div
          v-for="item in frameworks"
          :key="`${item.name}-row`"
          class="comparison__row"
          :class="{ 'comparison__row--highlight': item.highlight }"
        >
          <div>
            <strong>{{ item.name }}</strong>
            <span>{{ item.role }}</span>
          </div>
          <div>{{ item.requests }}</div>
          <div>{{ item.avg }}</div>
          <div>{{ item.p50 }}</div>
          <div>{{ item.p90 }}</div>
          <div>{{ item.p99 }}</div>
        </div>
      </div>

      <div class="comparison__summary">
        <p>
          Drogon is slightly ahead in raw throughput, but Vix.cpp stays very
          close while showing the best p99 latency in this test. Compared to
          Crow, Vix.cpp is faster and keeps a lower tail latency.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import SectionTitle from "@/components/common/SectionTitle.vue";

const frameworks = [
  {
    rank: "#1",
    name: "Drogon",
    role: "High-performance C++ web framework",
    badge: "Throughput leader",
    requests: "115,151.01",
    avg: "6.38 ms",
    p50: "5.49 ms",
    p90: "12.03 ms",
    p99: "21.16 ms",
    note: "Drogon is the fastest in raw requests/sec on this local benchmark.",
    highlight: false,
  },
  {
    rank: "#2",
    name: "Vix.cpp",
    role: "C++ application platform and runtime",
    badge: "Best p99",
    requests: "112,539.11",
    avg: "7.31 ms",
    p50: "6.51 ms",
    p90: "8.73 ms",
    p99: "12.19 ms",
    note: "Vix.cpp stays close to Drogon in throughput and has the lowest p99 latency here.",
    highlight: true,
  },
  {
    rank: "#3",
    name: "Crow",
    role: "Lightweight C++ web framework",
    badge: "Simple web framework",
    requests: "93,339.82",
    avg: "8.30 ms",
    p50: "7.21 ms",
    p90: "14.72 ms",
    p99: "26.76 ms",
    note: "Crow remains simple and fast, but it trails both Drogon and Vix.cpp in this test.",
    highlight: false,
  },
];
</script>

<style scoped>
.comparison {
  position: relative;
}

.comparison__section-title :deep(h2) {
  max-width: 860px;
}

.comparison__meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 40px;
}

.comparison__meta > div {
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.035);
}

.comparison__meta span {
  display: block;
  margin-bottom: 6px;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.comparison__meta strong {
  color: var(--text);
  font-size: 0.92rem;
  line-height: 1.5;
}

.comparison__cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 22px;
}

.comparison-card {
  position: relative;
  overflow: hidden;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--bg-ink);
  box-shadow: var(--shadow-md);
}

.comparison-card--highlight {
  border-color: rgba(34, 197, 94, 0.45);
  background:
    radial-gradient(
      circle at top right,
      rgba(34, 197, 94, 0.18),
      transparent 34%
    ),
    var(--bg-ink);
}

.comparison-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.comparison-card__rank {
  display: inline-flex;
  margin-bottom: 8px;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.comparison-card h3 {
  margin: 0;
  color: var(--text);
  font-size: clamp(1.25rem, 1.8vw, 1.55rem);
  letter-spacing: -0.03em;
}

.comparison-card__badge {
  flex: 0 0 auto;
  padding: 7px 10px;
  border: 1px solid rgba(34, 197, 94, 0.28);
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.1);
  color: #86efac;
  font-size: 0.72rem;
  font-weight: 800;
  white-space: nowrap;
}

.comparison-card__main {
  margin-top: 28px;
}

.comparison-card__main strong {
  display: block;
  color: var(--text);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.06em;
}

.comparison-card__main span {
  display: block;
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 700;
}

.comparison-card__stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 24px;
}

.comparison-card__stats div {
  padding: 14px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.035);
}

.comparison-card__stats span {
  display: block;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
}

.comparison-card__stats strong {
  display: block;
  margin-top: 4px;
  color: var(--text);
  font-size: 1rem;
}

.comparison-card p {
  margin: 22px 0 0;
  color: var(--text-soft);
  font-size: 0.9rem;
  line-height: 1.65;
}

.comparison__table {
  margin-top: 24px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--bg-ink);
  box-shadow: var(--shadow-lg);
}

.comparison__head,
.comparison__row {
  display: grid;
  grid-template-columns: minmax(210px, 1.45fr) repeat(5, minmax(110px, 0.8fr));
}

.comparison__head {
  background: var(--bg-panel-strong);
  border-bottom: 1px solid var(--line);
}

.comparison__head > div {
  padding: 16px 18px;
  color: var(--text);
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.comparison__head > div:not(:first-child),
.comparison__row > div:not(:first-child) {
  text-align: center;
}

.comparison__row {
  border-bottom: 1px solid var(--line-soft);
}

.comparison__row:last-child {
  border-bottom: 0;
}

.comparison__row--highlight {
  background: rgba(34, 197, 94, 0.055);
}

.comparison__row > div {
  min-width: 0;
  padding: 18px;
  color: var(--text-soft);
  font-size: 0.9rem;
  line-height: 1.5;
}

.comparison__row strong {
  display: block;
  color: var(--text);
  font-size: 0.95rem;
}

.comparison__row span {
  display: block;
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 0.78rem;
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
  font-size: clamp(1rem, 1.25vw, 1.08rem);
  line-height: 1.75;
  text-align: center;
}

.comparison__summary p {
  margin: 0;
}

@media (max-width: 980px) {
  .comparison__meta,
  .comparison__cards {
    grid-template-columns: 1fr;
  }

  .comparison__table {
    overflow-x: auto;
  }

  .comparison__head,
  .comparison__row {
    min-width: 860px;
  }
}

@media (max-width: 560px) {
  .comparison__meta {
    margin-top: 30px;
  }

  .comparison-card {
    padding: 20px;
  }

  .comparison-card__top {
    flex-direction: column;
  }

  .comparison-card__stats {
    grid-template-columns: 1fr;
  }
}
</style>
