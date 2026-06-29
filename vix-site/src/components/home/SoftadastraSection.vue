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
.softadastra__inner {
  max-width: 900px;
}

/* Override panel → ink inversion for emphasis */
.softadastra__panel {
  position: relative;
  overflow: hidden;
  padding: clamp(40px, 5vw, 60px);
  background: var(--bg-ink);
  border: 1px solid var(--line-ink);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

/* Subtle green corner glow */
.softadastra__panel::before {
  content: "";
  position: absolute;
  top: -40%;
  right: -10%;
  width: 60%;
  height: 120%;
  background: radial-gradient(circle, rgba(34, 197, 94, 0.16), transparent 70%);
  pointer-events: none;
}

.softadastra__eyebrow {
  position: relative;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--green-bright);
  margin-bottom: 16px;
}

.softadastra__panel h2 {
  position: relative;
  color: var(--text-invert);
  margin-bottom: 18px;
}

.softadastra__panel > p {
  position: relative;
  max-width: 58ch;
  color: var(--text-invert-soft);
  font-size: clamp(1rem, 1.3vw, 1.12rem);
  line-height: 1.75;
}

.softadastra__link {
  position: relative;
  display: inline-flex;
  margin-top: 24px;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--green-bright);
}

.softadastra__link:hover {
  color: #86efac;
}
</style>
