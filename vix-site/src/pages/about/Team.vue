<template>
  <div class="wrap">
    <header class="top">
      <h1 class="h1">Team</h1>
      <p class="p">
        Vix.cpp is built by people who care about correctness, performance, and developer experience.
      </p>
    </header>

    <section class="sec">
      <h2 class="h2">Maintainers</h2>
      <p class="muted">
        This page can list maintainers once roles are finalized. For now, the canonical contact is GitHub Issues.
      </p>

      <div class="links">
        <a class="btn" href="https://github.com/vixcpp/vix/issues" target="_blank" rel="noreferrer">Open an Issue</a>
        <a class="btn" href="https://github.com/vixcpp/vix" target="_blank" rel="noreferrer">Repository</a>
      </div>
    </section>

    <section class="sec">
      <h2 class="h2">Collaboration</h2>
      <ul class="list">
        <li>Propose a small scoped PR first.</li>
        <li>Prefer measurable improvements (perf, DX, correctness).</li>
        <li>Keep discussions concrete and reproducible.</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.wrap{ max-width:1120px; margin:0 auto; padding:2.2rem 1.5rem 2.8rem; }
.top{ margin-bottom:1.3rem; }
.h1{ margin:0 0 .55rem 0; font-size:clamp(2rem, 2.6vw, 2.5rem); line-height:1.1; }
.p{ margin:0; color:var(--muted); max-width:75ch; line-height:1.55; }

.sec{ padding:1.25rem 0 1.55rem; border-top:1px solid rgba(45,212,191,.12); }
.h2{ margin:0 0 .35rem 0; font-size:1.2rem; }
.muted{ margin:0; color:var(--muted); line-height:1.55; max-width:95ch; }
.list{ margin:.7rem 0 0 1.1rem; color:var(--muted); line-height:1.65; }

.links{ display:flex; flex-wrap:wrap; gap:.7rem; margin-top:.9rem; }
.btn{
  display:inline-flex; align-items:center; justify-content:center;
  padding:.6rem 1.05rem; border-radius:999px;
  font-size:.9rem;
  border:1px solid rgba(45,212,191,.55);
  color:#e5f9f6;
  background: rgba(2,44,34,.90);
  transition: transform .12s ease, background .16s ease, border-color .16s ease;
}
.btn:hover{ transform: translateY(-1px); background: rgba(2,60,47,.95); border-color: rgba(45,212,191,.85); }

@media (max-width: 900px){ .wrap{ padding:1.8rem 1.2rem 2.4rem; } }
</style>
