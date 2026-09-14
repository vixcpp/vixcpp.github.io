<script setup>
import { whyVix } from "../../data/whyVix";

const reasons = whyVix.items;
</script>

<template>
  <section :id="whyVix.id" class="why">
    <div class="container">
      <header class="why__header">
        <h2 class="why__title">{{ whyVix.title }}</h2>
        <p class="why__description">{{ whyVix.description }}</p>
      </header>

      <div class="why__reasons">
        <article v-for="reason in reasons" :key="reason.key" class="reason">
          <span class="reason__number">{{ reason.number }}</span>
          <h3>{{ reason.title }}</h3>

          <div
            v-if="reason.key === 'stack'"
            class="reason__diagram stack-diagram"
            aria-label="CMake, compilers, and your libraries work with Vix.cpp"
          >
            <span>CMake</span><span>GCC / Clang</span
            ><span>your libraries</span>
            <div class="stack-diagram__links" aria-hidden="true">
              <i /><i /><i />
            </div>
            <strong>works with<br />Vix.cpp</strong>
          </div>

          <div
            v-else-if="reason.key === 'lifecycle'"
            class="reason__diagram lifecycle-diagram"
            aria-label="Vix.cpp connects build, run, test, deploy, and inspect"
          >
            <span>build</span><i>→</i><span>run</span><i>→</i><span>test</span
            ><i>→</i><span>deploy</span><i>→</i><span>inspect</span>
            <strong>Vix.cpp</strong>
          </div>

          <div
            v-else
            class="reason__diagram diagnostic-diagram"
            aria-label="Vix.cpp connects lifecycle signals to a cause, location, and hint"
          >
            <div class="diagnostic-diagram__sources">
              <span>compiler</span><span>runtime</span><span>dependencies</span
              ><span>build</span><span>production</span>
            </div>
            <div class="diagnostic-diagram__vix">Vix.cpp</div>
            <div class="diagnostic-diagram__outcomes">
              <span>cause</span><span>location</span><span>hint</span>
            </div>
          </div>

          <p>{{ reason.description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.why {
  padding: clamp(4rem, 7vw, 5.75rem) 0;
  background: var(--vix-bg-alt);
  border-top: 1px solid var(--vix-border);
}
.why__header {
  max-width: 760px;
  margin-bottom: clamp(2.25rem, 4vw, 3.25rem);
}
.why__title {
  margin: 0;
  color: var(--vix-text);
  font-size: clamp(2.3rem, 4vw, 3.55rem);
  font-weight: 660;
  line-height: 1.04;
  letter-spacing: -0.052em;
}
.why__description {
  max-width: 680px;
  margin-top: 1rem;
  color: var(--vix-text-secondary);
  font-size: 1.04rem;
  line-height: 1.7;
}
.why__reasons {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--vix-border);
}
.reason {
  min-width: 0;
  padding: 1.75rem clamp(1.25rem, 2.5vw, 2rem) 0;
}
.reason:first-child {
  padding-left: 0;
}
.reason + .reason {
  border-left: 1px solid var(--vix-border);
}
.reason__number {
  color: var(--vix-green-light);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.08em;
}
.reason h3 {
  margin: 0.8rem 0 0;
  color: var(--vix-text);
  font-size: clamp(1.35rem, 2vw, 1.7rem);
  font-weight: 650;
  line-height: 1.16;
  letter-spacing: -0.035em;
}
.reason > p {
  margin-top: 1rem;
  color: var(--vix-text-secondary);
  font-size: 0.9rem;
  line-height: 1.68;
}
.reason__diagram {
  min-height: 116px;
  margin-top: 1.35rem;
  color: var(--vix-text-muted);
  font-family: var(--font-mono);
  font-size: 0.67rem;
}

.stack-diagram {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, auto);
  justify-content: space-between;
  gap: 0.6rem;
  padding-bottom: 2.75rem;
}
.stack-diagram > span {
  z-index: 1;
  white-space: nowrap;
}
.stack-diagram__links {
  position: absolute;
  right: 14%;
  bottom: 1.25rem;
  left: 14%;
  height: 1px;
  background: var(--vix-border);
}
.stack-diagram__links i {
  position: absolute;
  top: -1.1rem;
  width: 1px;
  height: 1.15rem;
  background: var(--vix-border);
  transform-origin: bottom;
}
.stack-diagram__links i:nth-child(1) {
  left: 0;
  transform: rotate(-34deg);
}
.stack-diagram__links i:nth-child(2) {
  left: 50%;
}
.stack-diagram__links i:nth-child(3) {
  right: 0;
  transform: rotate(34deg);
}
.stack-diagram strong {
  position: absolute;
  bottom: 0;
  left: 50%;
  color: var(--vix-green-light);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 650;
  line-height: 1.15;
  text-align: center;
  transform: translateX(-50%);
}

.lifecycle-diagram {
  display: flex;
  align-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.3rem 0.38rem;
}
.lifecycle-diagram span {
  color: var(--vix-text-secondary);
}
.lifecycle-diagram i {
  color: var(--vix-green-light);
  font-style: normal;
}
.lifecycle-diagram strong {
  flex-basis: 100%;
  margin-top: 0.85rem;
  color: var(--vix-green-light);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 650;
}

.diagnostic-diagram {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 0.8fr);
  align-items: center;
  gap: 0.8rem;
}
.diagnostic-diagram__sources,
.diagnostic-diagram__outcomes {
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}
.diagnostic-diagram__sources span::after {
  float: right;
  color: var(--vix-border);
  content: " ─";
}
.diagnostic-diagram__vix {
  padding: 0.45rem 0.5rem;
  color: var(--vix-green-light);
  border-inline: 1px solid var(--vix-border);
  font-family: var(--font-sans);
  font-size: 0.78rem;
  font-weight: 650;
}
.diagnostic-diagram__outcomes span::before {
  color: var(--vix-green-light);
  content: "→ ";
}

@media (max-width: 900px) {
  .why__reasons {
    grid-template-columns: 1fr;
  }
  .reason,
  .reason:first-child {
    padding: 1.5rem 0;
  }
  .reason + .reason {
    border-top: 1px solid var(--vix-border);
    border-left: 0;
  }
  .reason__diagram {
    max-width: 440px;
  }
}
</style>
