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
.pico {
  position: relative;
}

.pico__image {
  margin-top: 42px;
}

.pico__text {
  max-width: 880px;
  margin: 34px auto 0;
  display: grid;
  gap: 18px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.85;
  text-align: center;
}

.pico__link {
  width: fit-content;
  margin: 4px auto 0;
  color: var(--green-soft);
  font-size: 0.9rem;
  font-weight: 800;
  text-decoration: none;
}

.pico__link:hover {
  color: #bbf7d0;
}

@media (max-width: 720px) {
  .pico__image {
    margin-top: 30px;
  }

  .pico__text {
    text-align: left;
  }

  .pico__link {
    margin-left: 0;
  }
}
</style>
