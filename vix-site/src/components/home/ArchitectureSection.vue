<template>
  <section class="architecture section-tight">
    <div class="container-wide">
      <SectionTitle
        eyebrow="Architecture"
        title="Native C++ stays at the center."
        description="Vix.cpp sits around the normal C++ toolchain. It gives the application workflow a consistent shape without taking away the compiler, CMake, native build outputs, or the tools experienced C++ developers already use."
        center
      />

      <ImagePanel
        class="architecture__image"
        :src="images.architecture"
        alt="Vix.cpp architecture"
      />

      <div class="architecture__text">
        <p>
          Vix.cpp is not a separate universe for C++ projects. It is a workflow
          layer, a runtime layer, and a set of platform foundations that work
          with the existing ecosystem instead of replacing it.
        </p>

        <p>
          The detailed command reference, module guides, SDK profiles, examples,
          and internals live in the documentation. The purpose of this page is
          to show the shape of the project and the direction behind it.
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
.architecture {
  position: relative;
}

.architecture__image {
  margin-top: 42px;
}

.architecture__text {
  max-width: 860px;
  margin: 34px auto 0;
  display: grid;
  gap: 18px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.8;
  text-align: center;
}

@media (max-width: 720px) {
  .architecture__image {
    margin-top: 30px;
  }

  .architecture__text {
    text-align: left;
  }
}
</style>
