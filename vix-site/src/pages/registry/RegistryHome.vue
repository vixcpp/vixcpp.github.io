<template>
  <section class="hero">
    <div class="bg" aria-hidden="true"></div>

    <div class="inner">
      <h1>
        The package registry for
        <span class="em">Vix.cpp</span>
      </h1>
      <p class="sub">
        Discover packages, browse namespaces, and publish modules for the Vix ecosystem.
      </p>

      <form class="search" @submit.prevent="goSearch">
        <input v-model.trim="q" class="in" type="search" placeholder="Search packages…" />
        <button class="btn" type="submit" :disabled="!q">Search</button>
      </form>

      <div class="actions">
        <RouterLink class="pill" to="/registry/browse">Browse packages</RouterLink>
        <RouterLink class="pill yellow" to="/registry/publish">Publish a package</RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const q = ref("");

function goSearch() {
  const s = q.value.trim();
  if (!s) return;
  // future: /registry/search?q=
  router.push({ path: "/registry/browse", query: { q: s } });
}
</script>

<style scoped>
.hero{
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  padding: 3.2rem 1.6rem;
  background: #fff;
  border: 1px solid rgba(15,23,42,.08);
}

.bg{
  position:absolute; inset:-30%;
  background:
    radial-gradient(circle at 20% 20%, rgba(56,189,248,.14), transparent 45%),
    radial-gradient(circle at 75% 30%, rgba(45,212,191,.12), transparent 40%),
    radial-gradient(circle at 50% 80%, rgba(250,204,21,.14), transparent 45%);
  transform: rotate(-8deg);
}

.inner{ position: relative; max-width: 760px; margin: 0 auto; text-align: center; }

h1{
  font-size: 2.2rem;
  letter-spacing: -0.8px;
  color: #0f172a;
  margin: 0 0 .6rem;
}

.em{ font-weight: 900; }

.sub{
  margin: 0 auto 1.3rem;
  color: rgba(15,23,42,.68);
  max-width: 66ch;
}

.search{
  display:flex;
  gap:.6rem;
  justify-content:center;
  align-items:center;
  margin: 0 auto 1.2rem;
  max-width: 760px;
}

.in{
  flex: 1;
  min-width: 220px;
  padding: .85rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(15,23,42,.14);
  outline: none;
  font-size: 1rem;
}

.in:focus{
  border-color: rgba(56,189,248,.55);
  box-shadow: 0 0 0 4px rgba(56,189,248,.14);
}

.btn{
  padding: .85rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(15,23,42,.18);
  background: rgba(15,23,42,.92);
  color: #fff;
  font-weight: 800;
}

.btn:disabled{ opacity: .55; cursor: not-allowed; }

.actions{
  display:flex;
  gap:.65rem;
  justify-content:center;
  flex-wrap: wrap;
}

.pill{
  padding: .55rem .9rem;
  border-radius: 999px;
  border: 1px solid rgba(15,23,42,.16);
  background: #fff;
  color: #0f172a;
  font-weight: 700;
}

.pill.yellow{
  background: #facc15;
}
</style>
