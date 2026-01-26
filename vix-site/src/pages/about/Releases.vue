<template>
  <div class="wrap">
    <header class="top">
      <h1 class="h1">Releases</h1>
      <p class="p">
        Vix.cpp ships fast, but predictable. Releases are about stable behavior, not surprise.
      </p>
    </header>

    <section class="sec">
      <h2 class="h2">Versioning</h2>
      <ul class="list">
        <li>Patch: bugfixes, output stability, docs, internal refactors.</li>
        <li>Minor: new features that keep existing behavior stable.</li>
        <li>Major: breaking changes with migration notes.</li>
      </ul>
    </section>

    <section class="sec">
      <h2 class="h2">Stability rules</h2>
      <ul class="list">
        <li>CLI outputs shown in docs should stay stable.</li>
        <li>New flags must not change defaults silently.</li>
        <li>Error messages: clearer is good, shape changes are controlled.</li>
      </ul>
      <p class="note">
        If a change breaks docs/screenshots, it needs an explicit reason and updated examples.
      </p>
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
.list{ margin:.7rem 0 0 1.1rem; color:var(--muted); line-height:1.65; }
.note{ margin:.9rem 0 0 0; color:var(--muted); line-height:1.55; max-width:95ch; }

@media (max-width: 900px){ .wrap{ padding:1.8rem 1.2rem 2.4rem; } }
</style>
