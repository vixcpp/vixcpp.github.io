<template>
  <section class="pico section">
    <div class="container-wide">
      <SectionTitle
        eyebrow="Pico"
        title="Where design decisions meet application reality."
        description="Pico is a real application built with Vix.cpp. It exists to keep the runtime honest by validating the platform inside a working application, not only through isolated examples."
        center
      />

      <ImagePanel
        class="pico__image"
        :src="images.pico"
        alt="Pico application built with Vix.cpp"
        :href="links.pico"
        link-label="Open Pico"
      />

      <div class="pico__text">
        <p>
          Pico brings the pieces together inside a working application: routing,
          middleware, persistence, diagnostics, runtime behavior, and the
          developer workflow around them.
        </p>

        <p>
          This matters because Vix.cpp is not meant to be a collection of
          disconnected modules. The goal is for the platform to hold together
          when used to build real software.
        </p>

        <a
          class="pico__link"
          :href="links.pico"
          target="_blank"
          rel="noreferrer"
        >
          Visit pico.vixcpp.com →
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import SectionTitle from "@/components/common/SectionTitle.vue";
import ImagePanel from "@/components/common/ImagePanel.vue";

import { images } from "@/data/images";
import { links } from "@/data/links";
</script>

<style scoped>
.pico__image {
  margin-top: 44px;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.pico__text {
  max-width: 760px;
  margin: 36px auto 0;
  display: grid;
  gap: 18px;
  text-align: center;
}

.pico__text p {
  color: var(--text-soft);
  font-size: clamp(1rem, 1.3vw, 1.1rem);
  line-height: 1.78;
}

.pico__link {
  justify-self: center;
  margin-top: 6px;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--green-strong);
  transition: gap var(--speed) var(--ease);
}

.pico__link:hover {
  color: var(--green);
}

@media (max-width: 720px) {
  .pico__text {
    text-align: left;
  }
  .pico__link {
    justify-self: start;
  }
}
</style>
