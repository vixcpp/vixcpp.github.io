<template>
  <section class="ecosystem section">
    <div class="ecosystem__inner container">
      <div class="ecosystem__top">
        <div class="ecosystem__copy">
          <SectionTitle
            eyebrow="Ecosystem"
            title="Vix.cpp stays at the center."
            description="Vix.cpp is the native foundation. Other projects can sit above it, validate it, or extend it into specialized layers without making the core platform lose focus."
          />

          <p>
            The ecosystem should grow around a clear center: the C++ workflow,
            the runtime, the registry, SDKs, modules, documentation, and real
            application validation. Vix.cpp remains the foundation; specialized
            tools can build on top of it.
          </p>
        </div>

        <aside class="ecosystem__foundation" aria-label="Ecosystem foundation">
          <img
            class="ecosystem__foundation-mark"
            :src="images.logo"
            alt=""
            aria-hidden="true"
          />

          <div>
            <p class="ecosystem__foundation-label">Core foundation</p>
            <strong>Native C++ application workflow</strong>
            <span>
              Run, build, test, package, install SDKs, use modules, and keep the
              project workflow coherent.
            </span>
          </div>
        </aside>
      </div>

      <div class="ecosystem__grid">
        <a
          v-for="(item, index) in ecosystem"
          :key="item.name"
          class="eco-card"
          :href="item.href"
          target="_blank"
          rel="noreferrer"
        >
          <span class="eco-card__index">
            {{ String(index + 1).padStart(2, "0") }}
          </span>

          <span class="eco-card__name">{{ item.name }}</span>

          <p>{{ item.description }}</p>

          <span class="eco-card__arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import SectionTitle from "@/components/common/SectionTitle.vue";
import { ecosystem } from "@/data/ecosystem";
import { images } from "@/data/images";
</script>

<style scoped>
.ecosystem {
  position: relative;
}

.ecosystem__inner {
  display: grid;
  gap: 44px;
}

.ecosystem__top {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) 380px;
  gap: clamp(32px, 5vw, 70px);
  align-items: start;
}

.ecosystem__copy {
  max-width: 760px;
}

.ecosystem__copy > p {
  margin-top: 24px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.25vw, 1.08rem);
  line-height: 1.82;
  max-width: 64ch;
}

.ecosystem__foundation {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  padding: 24px;
  border: 1px solid rgba(34, 197, 94, 0.16);
  border-radius: var(--radius-lg);
  background: var(--bg-ink);
  box-shadow: var(--shadow-lg);
}

.ecosystem__foundation-mark {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  object-fit: contain;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.24);
  background: rgba(34, 197, 94, 0.06);
  padding: 7px;
}
.ecosystem__foundation-label {
  margin: 0 0 8px;
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.ecosystem__foundation strong {
  display: block;
  color: var(--text);
  font-size: 1.05rem;
  font-weight: 850;
  line-height: 1.3;
  letter-spacing: -0.03em;
}

.ecosystem__foundation span {
  display: block;
  margin-top: 10px;
  color: var(--text-muted);
  font-size: 0.86rem;
  line-height: 1.65;
}

.ecosystem__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(255px, 1fr));
  gap: 14px;
}

.eco-card {
  position: relative;
  min-height: 190px;
  display: flex;
  flex-direction: column;
  padding: 22px 22px 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: transparent;
  transition:
    border-color var(--speed) var(--ease),
    background var(--speed) var(--ease),
    transform var(--speed) var(--ease),
    box-shadow var(--speed) var(--ease);
}

.eco-card:hover {
  border-color: rgba(34, 197, 94, 0.28);
  background: rgba(34, 197, 94, 0.035);
  box-shadow: var(--shadow-soft);
  transform: translateY(-3px);
}

.eco-card__index {
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.eco-card__name {
  display: block;
  margin-top: 18px;
  color: var(--text);
  font-size: 1.05rem;
  font-weight: 850;
  letter-spacing: -0.03em;
}

.eco-card p {
  margin: 10px 0 0;
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.65;
}

.eco-card__arrow {
  margin-top: auto;
  padding-top: 22px;
  color: var(--text-faint);
  font-size: 1.1rem;
  transition:
    color var(--speed) var(--ease),
    transform var(--speed) var(--ease);
}

.eco-card:hover .eco-card__arrow {
  color: var(--green-bright);
  transform: translateX(4px);
}

@media (max-width: 920px) {
  .ecosystem__top {
    grid-template-columns: 1fr;
  }

  .ecosystem__foundation {
    max-width: 620px;
  }
}

@media (max-width: 560px) {
  .ecosystem__foundation {
    padding: 20px;
  }

  .eco-card {
    min-height: auto;
  }
}
</style>
