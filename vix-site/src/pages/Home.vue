<script setup>
import * as HomeData from "@/data/home";
import { ref, onMounted } from "vue";

import Hero from "@/components/home/Hero.vue";
import BatteriesIncluded from "@/components/home/BatteriesIncluded.vue";
import LazySection from "@/components/common/LazySection.vue";

import HomeInstall from "@/components/home/HomeInstall.vue";
import HomeShowcase from "@/components/home/HomeShowcase.vue";
import HomeRegistryShowcase from "@/components/home/HomeRegistryShowcase.vue";
import HomeTemplateEngine from "@/components/home/HomeTemplateEngine.vue";
import HomeReleaseFocus from "@/components/home/HomeReleaseFocus.vue";
import HomeSignals from "@/components/home/HomeSignals.vue";
import HomeStableFoundation from "@/components/home/HomeStableFoundation.vue";
import HomeGetStarted from "@/components/home/HomeGetStarted.vue";
import HomeSupportCta from "@/components/home/HomeSupportCta.vue";

import { getInitialGithubStats, refreshGithubStats } from "@/lib/githubStats";

const HOME =
  HomeData?.HOME ??
  HomeData?.default ??
  HomeData?.default?.HOME ??
  HomeData?.default?.default ??
  null;

const github = ref(null);

onMounted(async () => {
  github.value = await getInitialGithubStats();
  const updated = await refreshGithubStats({ timeoutMs: 1200 });
  if (updated) github.value = updated;
});
</script>

<template>
  <div class="page">
    <div v-if="!HOME" class="container loading">
      <h2 class="loading-title">Loading…</h2>
      <p class="loading-sub">
        HOME is null. Check export in <code>@/data/home</code>.
      </p>
    </div>

    <template v-else>
      <!-- ===================== HERO ===================== -->

      <Hero
        v-if="HOME.hero"
        :title="HOME.hero.title"
        :subtitle="HOME.hero.subtitle"
        :ctas="HOME.hero.ctas"
        :badges="HOME.hero.badges"
        :examples="HOME.hero.examples"
        :support="HOME.hero.support"
      />

      <div class="section-sep hero-sep"></div>

      <!-- ===================== INSTALL ===================== -->
      <HomeInstall v-if="HOME.install" :install="HOME.install" />

      <LazySection>
        <div class="section-sep"></div>

        <!-- ===================== SHOWCASE ===================== -->
        <HomeShowcase v-if="HOME.showcase" :showcase="HOME.showcase" />

        <div class="section-sep"></div>
      </LazySection>

      <!-- ===================== REGISTRY SHOWCASE ===================== -->
      <LazySection>
        <HomeRegistryShowcase
          v-if="HOME.registryShowcase"
          :registry-showcase="HOME.registryShowcase"
        />
      </LazySection>

      <LazySection>
        <div v-if="HOME.templateEngine" class="section-sep"></div>

        <!-- ===================== TEMPLATE ENGINE ===================== -->
        <HomeTemplateEngine
          v-if="HOME.templateEngine"
          :template-engine="HOME.templateEngine"
        />

        <div v-if="HOME.templateEngine" class="section-sep"></div>

        <HomeReleaseFocus
          v-if="HOME.releaseFocus"
          :release-focus="HOME.releaseFocus"
        />
      </LazySection>

      <div v-if="HOME.releaseFocus" class="section-sep"></div>

      <!-- ===================== SIGNALS ===================== -->
      <HomeSignals
        v-if="HOME.signals"
        :signals="HOME.signals"
        :github="github"
      />

      <!-- ===================== BATTERIES ===================== -->
      <LazySection>
        <div class="section-sep"></div>

        <BatteriesIncluded
          v-if="HOME.batteries"
          :title="HOME.batteries.title"
          :subtitle="HOME.batteries.subtitle"
          :items="HOME.batteries.items || []"
        />
      </LazySection>

      <div v-if="HOME.stableFoundation" class="section-sep"></div>

      <!-- ===================== STABLE FOUNDATION ===================== -->
      <HomeStableFoundation
        v-if="HOME.stableFoundation"
        :stable-foundation="HOME.stableFoundation"
      />

      <div class="section-sep"></div>

      <!-- ===================== GET STARTED ===================== -->
      <HomeGetStarted v-if="HOME.getStarted" :get-started="HOME.getStarted" />

      <div class="section-sep"></div>

      <!-- ===================== SUPPORT CTA ===================== -->
      <HomeSupportCta />
    </template>
  </div>
</template>

<style scoped>
.page {
  width: 100%;
  padding-top: var(--hdr-h);
}

.loading {
  padding: 56px 0;
  opacity: 0.85;
}

.loading-title {
  margin: 0 0 10px;
  font-size: 1.35rem;
  letter-spacing: -0.01em;
}

.loading-sub {
  margin: 0;
  opacity: 0.85;
}

.section-sep {
  width: 100%;
  height: 1px;
  margin: 0;
  background: linear-gradient(
    to right,
    transparent,
    rgba(148, 163, 184, 0.14),
    transparent
  );
}
</style>
