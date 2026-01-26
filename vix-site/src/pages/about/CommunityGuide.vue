<template>
  <div class="wrap">
    <header class="top">
      <h1 class="h1">Community Guide</h1>
      <p class="p">
        Contributing should be predictable. One idea per PR. Clear why. Clean diffs. Fast reviews.
      </p>
    </header>

    <section class="sec">
      <h2 class="h2">The PR contract</h2>

      <div class="cards">
        <div class="card">
          <div class="cardTitle">1) What changed</div>
          <p class="muted">State the concrete change. No story, just facts.</p>
        </div>
        <div class="card">
          <div class="cardTitle">2) Why it matters</div>
          <p class="muted">What real problem it fixes (DX, perf, correctness).</p>
        </div>
        <div class="card">
          <div class="cardTitle">3) The fix</div>
          <p class="muted">Explain the approach in 2–4 lines. Keep it local.</p>
        </div>
        <div class="card">
          <div class="cardTitle">4) Why it solves it</div>
          <p class="muted">Result: clearer output, fewer edge cases, stable behavior.</p>
        </div>
      </div>

      <p class="note">
        This structure matches Vix.cpp communication: concrete → problem → action → benefit.
      </p>
    </section>

    <section class="sec">
      <h2 class="h2">Good first PRs</h2>
      <ul class="list">
        <li>Docs: add one example with expected output.</li>
        <li>CLI: improve one error hint or one help section.</li>
        <li>Website: add one small section without redesigning everything.</li>
      </ul>
    </section>

    <section class="sec">
      <h2 class="h2">Review expectations</h2>
      <ul class="list">
        <li>Keep diffs small and scoped.</li>
        <li>No behavior changes without an example/test when possible.</li>
        <li>Prefer explicit naming over cleverness.</li>
        <li>Don’t break stable outputs used in docs/screenshots.</li>
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
.muted{ margin:0; color:var(--muted); line-height:1.55; }

.cards{
  display:grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap:1rem;
  margin-top:.9rem;
}
.card{
  border-radius:16px;
  border:1px solid rgba(15,118,110,.5);
  background: rgba(1,24,22,.72);
  box-shadow: 0 14px 28px rgba(0,0,0,.55);
  padding:1rem 1.05rem;
}
.cardTitle{ font-weight:800; margin-bottom:.25rem; }

.list{ margin:.7rem 0 0 1.1rem; color:var(--muted); line-height:1.65; }
.note{ margin:.9rem 0 0 0; color:var(--muted); line-height:1.55; max-width:95ch; }

@media (max-width: 900px){
  .cards{ grid-template-columns: 1fr; }
  .wrap{ padding:1.8rem 1.2rem 2.4rem; }
}
</style>
