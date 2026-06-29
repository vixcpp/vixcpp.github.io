<template>
  <main class="home">
    <HeroSection />

    <!-- 1. Explain what Vix.cpp is before going deeper -->
    <WhatItIsSection />
    <ArchitectureSection />

    <!-- 2. Show how the user starts and works with it -->
    <InstallSection />
    <CliSection />
    <DifferenceSection />

    <!-- 3. Build trust with numbers and positioning -->
    <PerformanceSection />
    <ComparisonSection />
    <WhatItIsNotSection />

    <!-- 4. Explain the repository and real validation projects -->
    <RepositoryPurposeSection />
    <VixNoteSection />
    <PicoSection />

    <!-- 5. Show ecosystem and future direction -->
    <EcosystemSection />
    <RoadmapSection />
    <DirectionSection />

    <!-- 6. Company and final resources -->
    <SoftadastraSection />
    <ResourcesSection />
  </main>
</template>

<script setup>
import HeroSection from "@/components/home/HeroSection.vue";

import WhatItIsSection from "@/components/home/WhatItIsSection.vue";
import ArchitectureSection from "@/components/home/ArchitectureSection.vue";

import InstallSection from "@/components/home/InstallSection.vue";
import CliSection from "@/components/home/CliSection.vue";
import DifferenceSection from "@/components/home/DifferenceSection.vue";

import PerformanceSection from "@/components/home/PerformanceSection.vue";
import ComparisonSection from "@/components/home/ComparisonSection.vue";
import WhatItIsNotSection from "@/components/home/WhatItIsNotSection.vue";

import RepositoryPurposeSection from "@/components/home/RepositoryPurposeSection.vue";
import VixNoteSection from "@/components/home/VixNoteSection.vue";
import PicoSection from "@/components/home/PicoSection.vue";

import EcosystemSection from "@/components/home/EcosystemSection.vue";
import RoadmapSection from "@/components/home/RoadmapSection.vue";
import DirectionSection from "@/components/home/DirectionSection.vue";

import SoftadastraSection from "@/components/home/SoftadastraSection.vue";
import ResourcesSection from "@/components/home/ResourcesSection.vue";
</script>

<style scoped>
.home {
  overflow: hidden;
}
</style>
