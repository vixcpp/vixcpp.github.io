<template>
  <section class="roadmap section-tight">
    <div class="container-wide">
      <SectionTitle
        eyebrow="Roadmap"
        title="The design decisions are meant to support the same direction."
        description="The roadmap shows how the main choices fit together. Vix.cpp starts from native C++ workflow, application-first runtime design, CMake interoperability, readable diagnostics, SDK profiles, registry workflow, CI, tests, documentation, and release quality."
        center
      />

      <ImagePanel
        class="roadmap__image"
        :src="images.roadmap"
        alt="Roadmap of where Vix.cpp design decisions lead"
      />

      <div class="roadmap__text">
        <p>
          These are not independent features. They are meant to support the same
          direction: make native C++ application development more direct, more
          repeatable, and easier to trust over time.
        </p>

        <p>
          The long-term goal is not to make Vix.cpp larger for its own sake. The
          goal is to make the existing platform more coherent, better tested,
          easier to install, easier to validate, and more predictable for real
          C++ projects.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import SectionTitle from "@/components/common/SectionTitle.vue";
import ImagePanel from "@/components/common/ImagePanel.vue";

import { images } from "@/data/images";
</script>

<style scoped>
.roadmap {
  position: relative;
}

.roadmap__image {
  margin-top: 42px;
}

.roadmap__text {
  max-width: 900px;
  margin: 34px auto 0;
  display: grid;
  gap: 18px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.85;
  text-align: center;
}

@media (max-width: 720px) {
  .roadmap__image {
    margin-top: 30px;
  }

  .roadmap__text {
    text-align: left;
  }
}
</style>
