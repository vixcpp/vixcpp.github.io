<template>
  <div class="wrap">
    <header class="top">
      <h1 class="h1">FAQ</h1>
      <p class="p">Short answers. Concrete scope. No fluff.</p>
    </header>

    <section class="sec">
      <h2 class="h2">Is Vix.cpp only for backend?</h2>
      <p class="muted">
        Vix.cpp targets backend runtimes: HTTP, WebSocket, middleware, and tooling. It’s built for server processes.
      </p>
    </section>

    <section class="sec">
      <h2 class="h2">Can I serve HTML files?</h2>
      <p class="muted">
        Yes. You can serve static content (HTML/CSS/JS) like any HTTP server. Docs/examples will include a minimal static-file sample.
      </p>
    </section>

    <section class="sec">
      <h2 class="h2">What about package management?</h2>
      <p class="muted">
        Vix Registry focuses on discoverability + clean reuse. It’s complementary to vcpkg/Conan depending on your workflow.
      </p>
    </section>

    <section class="sec">
      <h2 class="h2">What’s the philosophy?</h2>
      <p class="muted">
        Performance-first, but predictable. Good DX. Clear outputs. No magic.
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
.muted{ margin:0; color:var(--muted); line-height:1.55; max-width:95ch; }

@media (max-width: 900px){ .wrap{ padding:1.8rem 1.2rem 2.4rem; } }
</style>
