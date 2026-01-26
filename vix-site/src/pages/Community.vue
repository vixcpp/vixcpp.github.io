<template>
  <div class="wrap">
    <header class="top">
      <h1 class="h1">Community</h1>
      <p class="p">
        Vix.cpp is built in the open. If you like performance + clean DX, you’ll feel at home here.
      </p>
    </header>

    <section class="sec">
      <h2 class="h2">Links</h2>
      <div class="links">
        <a class="btn" href="https://github.com/vixcpp/vix" target="_blank" rel="noreferrer">GitHub: vixcpp/vix</a>
        <a class="btn" href="https://github.com/vixcpp" target="_blank" rel="noreferrer">GitHub Org</a>
        <a class="btn" href="https://github.com/vixcpp/vix/issues" target="_blank" rel="noreferrer">Issues</a>
      </div>
    </section>

    <section class="sec">
      <h2 class="h2">How to contribute</h2>
      <ol class="list">
        <li>Pick an issue (start with small CLI/docs improvements).</li>
        <li>Create a branch and keep changes focused (one idea per PR).</li>
        <li>Add a minimal example or test when relevant.</li>
        <li>Open a PR with a clear description of what changed and why.</li>
      </ol>
      <p class="note">
        Tip: the best contributions are tiny, precise, and easy to review.
      </p>
    </section>

    <section class="sec">
      <h2 class="h2">Good first contributions</h2>
      <ul class="list">
        <li>Docs: add a small example with expected output.</li>
        <li>CLI: improve help text and error hints for one common case.</li>
        <li>Website: add one page section without redesigning everything.</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.wrap { max-width: 1100px; margin: 0 auto; padding: 28px 18px 60px; }
.top { padding-bottom: 8px; }
.h1 { margin: 0; font-size: 34px; letter-spacing: -0.02em; }
.p { margin: 10px 0 0; opacity: 0.8; max-width: 900px; }
.sec { margin-top: 22px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); }
.h2 { margin: 0 0 10px; font-size: 16px; }
.links { display: flex; gap: 10px; flex-wrap: wrap; }
.btn { text-decoration: none; padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.16); }
.list { padding-left: 18px; opacity: 0.9; line-height: 1.7; }
.note { margin: 10px 0 0; opacity: 0.7; font-size: 13px; }
</style>
