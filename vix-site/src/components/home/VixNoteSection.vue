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
.note__image {
  margin-top: 44px;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.note__footer {
  margin-top: 30px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 18px;
}

.note__link {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--green-strong);
}

.note__link:hover {
  color: var(--green);
}

@media (max-width: 560px) {
  .note__footer {
    flex-direction: column;
    gap: 14px;
  }
}
</style>
