<template>
  <section class="not section-tight">
    <div class="not__inner container">
      <SectionTitle
        eyebrow="What it is not"
        title="Vix.cpp is not trying to take C++ away from C++ developers."
        description="The project is not a successor to C++, and it is not a language experiment. It does not introduce a competing syntax, a separate compiler model, or a closed ecosystem that replaces the tools C++ developers already use."
      />

      <div class="not__panel panel-soft">
        <p>
          Vix.cpp is also not a replacement for CMake. Projects with an existing
          CMake structure can keep using it. Projects that do not need custom
          CMake logic can start with a simpler Vix application manifest and
          still end up with native C++ build outputs.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import SectionTitle from "@/components/common/SectionTitle.vue";
</script>

<style scoped>
.not {
  position: relative;
}

.not__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: center;
}

.not__panel {
  padding: clamp(24px, 4vw, 38px);
}

.not__panel p {
  color: var(--text-soft);
  font-size: clamp(1rem, 1.4vw, 1.15rem);
  line-height: 1.85;
}

@media (max-width: 900px) {
  .not__inner {
    grid-template-columns: 1fr;
  }
}
</style>
