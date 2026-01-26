<template>
  <div class="wrap">
    <header class="top">
      <h1 class="h1">Community</h1>
      <p class="p">
        Vix.cpp is built in the open. If you like performance, clean DX, and practical tooling,
        you’ll feel at home here.
      </p>

      <div class="pill-row">
        <span class="pill">Open-source</span>
        <span class="pill">Performance-first</span>
        <span class="pill">DX-focused</span>
      </div>
    </header>

    <section class="grid">
      <!-- Links -->
      <div class="card">
        <div class="card-head">
          <h2 class="h2">Links</h2>
          <p class="muted">Official places to follow, report issues, and contribute.</p>
        </div>

        <div class="links">
          <a class="btn primary" href="https://github.com/vixcpp/vix" target="_blank" rel="noreferrer">
            GitHub: vixcpp/vix
          </a>
          <a class="btn" href="https://github.com/vixcpp" target="_blank" rel="noreferrer">
            GitHub Org
          </a>
          <a class="btn" href="https://github.com/vixcpp/vix/issues" target="_blank" rel="noreferrer">
            Issues
          </a>
        </div>

        <div class="mini">
          <div class="mini-item">
            <span class="mini-k">Best place for bugs</span>
            <span class="mini-v">GitHub Issues</span>
          </div>
          <div class="mini-item">
            <span class="mini-k">Best place for PRs</span>
            <span class="mini-v">vixcpp/vix</span>
          </div>
        </div>
      </div>

      <!-- Contribution flow -->
      <div class="card">
        <div class="card-head">
          <h2 class="h2">How to contribute</h2>
          <p class="muted">Small, focused PRs are the fastest to merge.</p>
        </div>

        <ol class="steps">
          <li>
            <span class="step-n">1</span>
            <div class="step-b">
              <div class="step-t">Pick a small issue</div>
              <div class="step-d">Start with docs, examples, or one CLI hint.</div>
            </div>
          </li>
          <li>
            <span class="step-n">2</span>
            <div class="step-b">
              <div class="step-t">One idea per PR</div>
              <div class="step-d">Keep it tight: easier review, faster merge.</div>
            </div>
          </li>
          <li>
            <span class="step-n">3</span>
            <div class="step-b">
              <div class="step-t">Add a minimal test/example</div>
              <div class="step-d">When relevant, include expected output.</div>
            </div>
          </li>
          <li>
            <span class="step-n">4</span>
            <div class="step-b">
              <div class="step-t">Explain what & why</div>
              <div class="step-d">Clear title + short reasoning in the PR body.</div>
            </div>
          </li>
        </ol>

        <p class="note">
          Tip: the best contributions are tiny, precise, and easy to review.
        </p>
      </div>
    </section>

    <!-- Good first contributions -->
    <section class="sec">
      <h2 class="h2">Good first contributions</h2>
      <p class="muted">
        If you’re new to the codebase, these are high-impact and low-risk entry points.
      </p>

      <div class="cards3">
        <div class="mini-card">
          <div class="mini-title">Docs</div>
          <div class="mini-desc">Add one example with expected output.</div>
          <div class="mini-tag">Low risk</div>
        </div>

        <div class="mini-card">
          <div class="mini-title">CLI</div>
          <div class="mini-desc">Improve help text or one error hint.</div>
          <div class="mini-tag">High leverage</div>
        </div>

        <div class="mini-card">
          <div class="mini-title">Website</div>
          <div class="mini-desc">Add one section/page without redesigning everything.</div>
          <div class="mini-tag">Fast feedback</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.wrap{
  max-width: 1120px;
  margin: 0 auto;
  padding: 2.2rem 1.5rem 2.8rem;
}

.top{ margin-bottom: 1.6rem; }

.h1{
  margin: 0 0 .55rem 0;
  font-size: clamp(2rem, 2.6vw, 2.5rem);
  line-height: 1.1;
}

.p{
  margin: 0;
  color: var(--muted);
  max-width: 68ch;
  line-height: 1.55;
}

.pill-row{
  display:flex;
  flex-wrap:wrap;
  gap:.5rem;
  margin-top: .95rem;
}

.pill{
  display:inline-flex;
  align-items:center;
  padding: .22rem .6rem;
  border-radius: 999px;
  border: 1px solid rgba(45, 212, 191, 0.28);
  background: rgba(2, 44, 34, 0.50);
  color: #e5f9f6;
  font-size: .78rem;
  white-space: nowrap;
}

.grid{
  display:grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1.4rem;
}

.grid > *{ min-width:0; }

.card{
  background: rgba(1, 24, 22, 0.96);
  border-radius: var(--radius-md);
  border: 1px solid rgba(15, 118, 110, 0.5);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.7);
  padding: 1.25rem 1.35rem;
  overflow:hidden;
}

.card-head{ margin-bottom: .9rem; }

.h2{
  margin: 0 0 .25rem 0;
  font-size: 1.18rem;
}

.muted{
  margin: 0;
  color: var(--muted);
  line-height: 1.55;
  max-width: 90ch;
}

.links{
  display:flex;
  flex-wrap:wrap;
  gap:.7rem;
  margin-top: .85rem;
}

.btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:.6rem 1.05rem;
  border-radius:999px;
  font-size:.9rem;
  border:1px solid rgba(45,212,191,.55);
  color:#e5f9f6;
  background: rgba(2,44,34,.90);
  transition: transform .12s ease, background .16s ease, border-color .16s ease;
}

.btn:hover{
  transform: translateY(-1px);
  background: rgba(2,60,47,.95);
  border-color: rgba(45,212,191,.85);
}

.btn.primary{
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  color: #01201f;
  border-color: transparent;
  box-shadow: 0 18px 34px rgba(12, 148, 136, 0.45);
  font-weight: 600;
}

.btn.primary:hover{
  box-shadow: 0 22px 42px rgba(12, 148, 136, 0.65);
}

.mini{
  margin-top: 1rem;
  padding-top: .95rem;
  border-top: 1px solid rgba(45, 212, 191, 0.12);
  display:grid;
  gap: .55rem;
}

.mini-item{
  display:flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.mini-k{
  color: var(--muted);
  font-size: .9rem;
}

.mini-v{
  color: #e5f9f6;
  font-weight: 600;
  font-size: .92rem;
  white-space: nowrap;
}

.steps{
  list-style:none;
  margin: .95rem 0 0 0;
  padding:0;
  display:grid;
  gap: .65rem;
}

.steps li{
  display:flex;
  gap: .75rem;
  align-items:flex-start;
  padding: .7rem .75rem;
  border-radius: 14px;
  border: 1px solid rgba(45, 212, 191, 0.12);
  background: rgba(2, 44, 34, 0.35);
}

.step-n{
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  font-weight: 800;
  font-size: .85rem;
  color: #01201f;
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  flex-shrink:0;
}

.step-t{
  font-weight: 700;
  color:#e5f9f6;
  margin-bottom: .15rem;
}

.step-d{
  color: var(--muted);
  line-height: 1.5;
  font-size: .95rem;
}

.note{
  margin: .95rem 0 0 0;
  color: var(--muted);
  line-height: 1.55;
  max-width: 95ch;
  font-size: .95rem;
}

.sec{
  margin-top: 1.6rem;
  padding-top: 1.35rem;
  border-top: 1px solid rgba(45, 212, 191, 0.12);
}

.cards3{
  margin-top: .95rem;
  display:grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.mini-card{
  border-radius: 16px;
  border: 1px solid rgba(15, 118, 110, 0.5);
  background: rgba(1, 24, 22, 0.72);
  box-shadow: 0 14px 28px rgba(0,0,0,.55);
  padding: 1rem 1.05rem;
}

.mini-title{
  font-weight: 800;
  margin-bottom: .25rem;
}

.mini-desc{
  color: var(--muted);
  line-height: 1.55;
  margin-bottom: .65rem;
}

.mini-tag{
  display:inline-flex;
  padding: .18rem .55rem;
  border-radius: 999px;
  font-size: .78rem;
  border: 1px solid rgba(45,212,191,.28);
  background: rgba(2,44,34,.45);
  color:#e5f9f6;
}

@media (max-width: 900px){
  .grid{ grid-template-columns: 1fr; }
  .cards3{ grid-template-columns: 1fr; }
  .wrap{ padding: 1.8rem 1.2rem 2.4rem; }
}
</style>
