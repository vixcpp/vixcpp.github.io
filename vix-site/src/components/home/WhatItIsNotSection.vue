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
.not__inner {
  max-width: 900px;
}

.not__panel {
  margin-top: 32px;
  padding: 28px 30px;
  border-left: 3px solid var(--green);
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
}

.not__panel p {
  color: var(--text-soft);
  font-size: clamp(1rem, 1.3vw, 1.12rem);
  line-height: 1.78;
}
</style>
