<template>
  <div class="reg">
    <header class="rhdr">
      <div class="rwrap">
        <RouterLink class="rbrand" to="/registry">
          <span class="rlogo">Vix Registry</span>
          <span class="rtag">Packages for the Vix ecosystem</span>
        </RouterLink>

        <nav class="rnav" aria-label="Registry">
          <RouterLink class="rlink" to="/registry/browse" active-class="is-active">Browse</RouterLink>
          <RouterLink class="rlink" to="/registry/docs" active-class="is-active">Docs</RouterLink>

          <span class="rsep" aria-hidden="true"></span>

          <a class="rlink" href="/docs/" target="_blank" rel="noreferrer">Vix Docs</a>
          <a class="rlink" href="https://github.com/vixcpp/registry" target="_blank" rel="noreferrer">Git Registry</a>

          <RouterLink class="rbtn" to="/registry/publish">Publish</RouterLink>
        </nav>
      </div>
    </header>

    <main class="rmain">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from "vue";

onMounted(() => {
  document.body.classList.add("is-registry");
});

onBeforeUnmount(() => {
  document.body.classList.remove("is-registry");
});
</script>

<style scoped>
.reg{
  min-height: 100vh;
  background: #ffffff;
}

.rhdr{
  position: sticky;
  top: 0;
  z-index: 60;
  background: #fff;
  border-bottom: 1px solid rgba(15,23,42,.08);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(15,23,42,.08);
}

.rwrap{
  max-width: 1120px;
  margin: 0 auto;
  padding: 0.8rem 1.1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.rbrand{
  display: flex;
  flex-direction: column;
  line-height: 1.05;
}

.rlogo{
  font-weight: 900;
  letter-spacing: -0.5px;
  font-size: 1.05rem;
  color: #0f172a;
}

.rtag{
  font-size: .82rem;
  color: rgba(15,23,42,.65);
}

.rnav{
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: .9rem;
}

.rsep{
  width: 1px;
  height: 18px;
  background: rgba(15,23,42,.12);
}

.rlink{
  color: rgba(15,23,42,.78);
  font-size: .92rem;
  padding: .35rem .2rem;
  position: relative;
}

.rlink:hover{ color: #0f172a; }

.rlink::after{
  content:"";
  position:absolute;
  left:.2rem; right:.2rem; bottom:.12rem;
  height:2px;
  background: rgba(15,23,42,.25);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform .14s ease;
}

.rlink:hover::after,
.is-active::after{ transform: scaleX(1); }

.rbtn{
  background: #facc15;
  color: #0f172a;
  font-weight: 800;
  padding: .45rem .85rem;
  border-radius: 12px;
  border: 1px solid rgba(15,23,42,.18);
  box-shadow: 0 8px 18px rgba(2,6,23,.08);
}

.rbtn:hover{ transform: translateY(-1px); }

.rmain{
  max-width: 1120px;
  margin: 0 auto;
  padding: 1.4rem 1.1rem 2.5rem;
}
</style>
