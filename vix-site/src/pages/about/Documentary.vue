<template>
  <div class="wrap">
    <header class="top">
      <h1 class="h1">The Documentary</h1>
      <p class="p">
        The story is simple: real systems need clarity, speed, and predictable tools under real constraints.
      </p>
    </header>

    <section class="sec">
      <h2 class="h2">Why it exists</h2>
      <p class="muted">
        C++ can be insanely fast, but the “runtime experience” often feels fragmented: hard onboarding,
        unclear errors, integration friction, and too much glue code.
      </p>
    </section>

    <section class="sec">
      <h2 class="h2">What changed</h2>
      <p class="muted">
        Vix.cpp focuses on a consistent runtime workflow: build/run/dev, predictable logs, clean middleware,
        and examples that match real output.
      </p>
    </section>

    <section class="sec">
      <h2 class="h2">What’s next</h2>
      <p class="muted">
        More real examples, more stable contracts, and better developer experience without sacrificing performance.
      </p>
    </section>
  </div>
</template>

<style scoped>
.wrap{ max-width:1120px; margin:0 auto; padding:2.2rem 1.5rem 2.8rem; }
.top{ margin-bottom:1.3rem; }
.h1{ margin:0 0 .55rem 0; font-size:clamp(2rem, 2.6vw, 2.5rem); line-height:1.1; }
.p{ margin:0; color:var(--muted); max-width:78ch; line-height:1.55; }

.sec{ padding:1.25rem 0 1.55rem; border-top:1px solid rgba(45,212,191,.12); }
.h2{ margin:0 0 .35rem 0; font-size:1.2rem; }
.muted{ margin:0; color:var(--muted); line-height:1.55; max-width:95ch; }

@media (max-width: 900px){ .wrap{ padding:1.8rem 1.2rem 2.4rem; } }
</style>
