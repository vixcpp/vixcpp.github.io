<template>
  <section class="difference section">
    <div class="difference__inner container">
      <SectionTitle
        eyebrow="Why Vix.cpp exists"
        title="The difficult part is often the work around the code."
        description="C++ already has mature compilers, strong performance, native binaries, a large ecosystem, and decades of production use. The problem Vix.cpp focuses on is not whether C++ can build something, but how much project wiring is required before the code feels like an application."
      />

      <div class="difference__content">
        <p>
          A small C++ program can quickly become a set of repeated decisions:
          how the project is laid out, how the build is configured, how the
          binary is run, how tests are executed, how dependencies are added, how
          diagnostics are read, how development mode works, how the project is
          packaged, and how the same workflow is reproduced on another machine
          or in CI.
        </p>

        <p>
          Vix.cpp exists in that space. It gives those concerns a standard
          workflow while still leaving the native C++ toolchain visible and
          usable. It is a layer of application workflow, runtime support,
          diagnostics, and packaging around ordinary C++ projects.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import SectionTitle from "@/components/common/SectionTitle.vue";
</script>

<style scoped>
.difference__inner {
  max-width: 920px;
}

.difference__content {
  margin-top: 34px;
  display: grid;
  gap: 22px;
  max-width: 760px;
}

.difference__content p {
  color: var(--text-soft);
  font-size: clamp(1rem, 1.3vw, 1.12rem);
  line-height: 1.8;
}

/* Lead-in accent on first paragraph */
.difference__content p:first-child {
  padding-left: 20px;
  border-left: 2px solid var(--green-line);
}
</style>
