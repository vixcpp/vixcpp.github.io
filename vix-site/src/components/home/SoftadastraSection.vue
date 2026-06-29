<template>
  <section class="softadastra section-tight">
    <div class="softadastra__inner container">
      <div class="softadastra__panel panel">
        <p class="softadastra__eyebrow">Maintained by Softadastra</p>

        <h2>Tools for modern C++ development.</h2>

        <p>
          Vix.cpp is maintained by Softadastra, a company focused on building
          tools that make modern C++ development more direct, more coherent, and
          easier to use in real projects.
        </p>

        <a
          class="softadastra__link"
          :href="links.softadastra"
          target="_blank"
          rel="noreferrer"
        >
          Visit Softadastra →
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { links } from "@/data/links";
</script>

<style scoped>
.softadastra {
  position: relative;
}

.softadastra__panel {
  position: relative;
  overflow: hidden;
  padding: clamp(30px, 5vw, 56px);
}

.softadastra__panel::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 10% 0%,
      rgba(34, 197, 94, 0.14),
      transparent 24rem
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
}

.softadastra__eyebrow,
.softadastra__panel h2,
.softadastra__panel p,
.softadastra__link {
  position: relative;
}

.softadastra__eyebrow {
  color: var(--green-soft);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.softadastra__panel h2 {
  max-width: 760px;
  margin-top: 14px;
}

.softadastra__panel p {
  max-width: 780px;
  margin-top: 20px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.85;
}

.softadastra__link {
  display: inline-flex;
  margin-top: 26px;
  color: var(--green-soft);
  font-size: 0.9rem;
  font-weight: 850;
  text-decoration: none;
}

.softadastra__link:hover {
  color: #bbf7d0;
}
</style>
