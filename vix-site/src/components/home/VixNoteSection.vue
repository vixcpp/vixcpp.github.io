<template>
  <section class="note section-tight">
    <div class="container-wide">
      <SectionTitle
        eyebrow="Vix Note"
        title="A visual space for executable C++ work."
        description="Vix Note is part of the Vix.cpp developer experience. It gives C++ developers a visual space for executable notes, examples, experiments, and diagnostics, while still using the normal Vix workflow underneath."
        center
      />

      <ImagePanel class="note__image" :src="images.note" alt="Vix Note" />

      <div class="note__footer">
        <CommandLine command="vix note" />

        <a
          class="note__link"
          :href="links.docs"
          target="_blank"
          rel="noreferrer"
        >
          Read the documentation →
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import SectionTitle from "@/components/common/SectionTitle.vue";
import ImagePanel from "@/components/common/ImagePanel.vue";
import CommandLine from "@/components/common/CommandLine.vue";

import { images } from "@/data/images";
import { links } from "@/data/links";
</script>

<style scoped>
.note {
  position: relative;
}

.note__image {
  margin-top: 42px;
}

.note__footer {
  margin-top: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.note__link {
  color: var(--text-muted);
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  transition: color var(--speed) var(--ease);
}

.note__link:hover {
  color: var(--green-soft);
}

@media (max-width: 720px) {
  .note__image {
    margin-top: 30px;
  }

  .note__footer {
    justify-content: flex-start;
  }
}
</style>
