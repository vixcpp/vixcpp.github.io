<script setup>
import { hero } from "../../data/hero";
</script>

<template>
  <section class="hero">
    <div class="container">
      <!-- ===================================================
           Intro
      ==================================================== -->

      <div class="hero-intro">
        <div class="hero-intro__copy">
          <h1 class="hero-title">
            {{ hero.title }}
          </h1>

          <p class="hero-description">
            {{ hero.description }}
          </p>
        </div>

        <aside class="hero-start" aria-label="Get started with Vix.cpp">
          <span class="hero-start__label">Get started</span>

          <a
            class="hero-start__primary"
            href="https://docs.vixcpp.com"
            target="_blank"
            rel="noreferrer"
          >
            Get Started
          </a>

          <div class="hero-start__secondary-actions">
            <a href="https://docs.vixcpp.com" target="_blank" rel="noreferrer">
              Documentation
            </a>
            <a
              href="https://github.com/vixcpp/vix"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </aside>
      </div>

      <!-- ===================================================
           Showcase
      ==================================================== -->

      <div class="hero-showcase">
        <!-- Left -->
        <div class="showcase-copy">
          <article
            v-for="(section, index) in hero.showcase"
            :key="section.title"
            class="showcase-item"
          >
            <div class="showcase-item__number">
              {{ String(index + 1).padStart(2, "0") }}
            </div>

            <div class="showcase-item__body">
              <h2>
                {{ section.title }}
              </h2>

              <p>
                {{ section.description }}
              </p>

              <ul>
                <li v-for="point in section.points" :key="point">
                  {{ point }}
                </li>
              </ul>
            </div>
          </article>
        </div>

        <!-- Right -->
        <div class="showcase-demo">
          <div class="dev-window">
            <!-- Editor title bar -->
            <div class="dev-window__bar">
              <div class="dev-window__bar-left">
                <span class="window-dot" />
                <span class="window-dot" />
                <span class="window-dot window-dot--active" />

                <span class="dev-window__file"> main.cpp </span>
              </div>

              <span class="dev-window__language"> C++ </span>
            </div>

            <!-- Code -->
            <div class="editor">
              <div class="editor__line">
                <span class="editor__number">1</span
                ><code
                  ><span class="cpp-directive">#include</span>
                  <span class="cpp-include">&lt;future&gt;</span></code
                >
              </div>
              <div class="editor__line">
                <span class="editor__number">2</span
                ><code
                  ><span class="cpp-directive">#include</span>
                  <span class="cpp-include">&lt;iostream&gt;</span></code
                >
              </div>
              <div class="editor__line">
                <span class="editor__number">3</span
                ><code
                  ><span class="cpp-directive">#include</span>
                  <span class="cpp-include">&lt;thread&gt;</span></code
                >
              </div>
              <div class="editor__line">
                <span class="editor__number">4</span><code />
              </div>
              <div class="editor__line">
                <span class="editor__number">5</span
                ><code
                  ><span class="cpp-keyword">int</span>
                  <span class="cpp-function">main</span
                  ><span class="cpp-op">()</span></code
                >
              </div>
              <div class="editor__line">
                <span class="editor__number">6</span
                ><code><span class="cpp-op">{</span></code>
              </div>
              <div class="editor__line editor__line--problem">
                <span class="editor__number">7</span
                ><code
                  >&nbsp;&nbsp;&nbsp;&nbsp;<span class="cpp-namespace">std</span
                  ><span class="cpp-op">::</span>promise<span class="cpp-op"
                    >&lt;</span
                  ><span class="cpp-keyword">int</span
                  ><span class="cpp-op">&gt;</span> promise<span class="cpp-op"
                    >;</span
                  ></code
                >
              </div>
              <div class="editor__line">
                <span class="editor__number">8</span
                ><code
                  >&nbsp;&nbsp;&nbsp;&nbsp;<span class="cpp-keyword">auto</span>
                  future <span class="cpp-op">=</span> promise<span
                    class="cpp-op"
                    >.</span
                  ><span class="cpp-function">get_future</span
                  ><span class="cpp-op">();</span></code
                >
              </div>
              <div class="editor__line">
                <span class="editor__number">9</span><code />
              </div>
              <div class="editor__line">
                <span class="editor__number">10</span
                ><code
                  >&nbsp;&nbsp;&nbsp;&nbsp;<span class="cpp-namespace">std</span
                  ><span class="cpp-op">::</span>thread worker<span
                    class="cpp-op"
                    >([</span
                  >p <span class="cpp-op">=</span>
                  <span class="cpp-namespace">std</span
                  ><span class="cpp-op">::</span
                  ><span class="cpp-function">move</span
                  ><span class="cpp-op">(</span>promise<span class="cpp-op"
                    >)]() </span
                  >mutable <span class="cpp-op">{});</span></code
                >
              </div>
              <div class="editor__line">
                <span class="editor__number">11</span
                ><code
                  >&nbsp;&nbsp;&nbsp;&nbsp;worker<span class="cpp-op">.</span
                  ><span class="cpp-function">join</span
                  ><span class="cpp-op">();</span></code
                >
              </div>
              <div class="editor__line">
                <span class="editor__number">12</span><code />
              </div>
              <div class="editor__line">
                <span class="editor__number">13</span
                ><code
                  >&nbsp;&nbsp;&nbsp;&nbsp;<span class="cpp-namespace">std</span
                  ><span class="cpp-op">::</span>cout
                  <span class="cpp-op">&lt;&lt;</span> future<span
                    class="cpp-op"
                    >.</span
                  ><span class="cpp-function">get</span
                  ><span class="cpp-op">() &lt;&lt;</span>
                  <span class="cpp-include">'\n'</span
                  ><span class="cpp-op">;</span></code
                >
              </div>
              <div class="editor__line">
                <span class="editor__number">14</span
                ><code><span class="cpp-op">}</span></code>
              </div>
            </div>

            <!-- Terminal -->
            <div class="terminal">
              <div class="terminal__bar">
                <span>Terminal</span>

                <span class="terminal__state"> Vix </span>
              </div>

              <div class="terminal__body">
                <div class="terminal__command">
                  <span class="terminal__prompt">$</span>

                  <span class="terminal__command-text">vix run main.cpp</span>
                </div>

                <div>
                  <span class="terminal__error">runtime error:</span> broken
                  promise
                </div>

                <div class="terminal__location">
                  --&gt; /home/softadastra/tmp/vix/main.cpp:7:5
                </div>

                <div class="terminal__frame">
                  <div>
                    <span class="terminal__line-number"> 5 | </span>

                    int main()
                  </div>

                  <div>
                    <span class="terminal__line-number"> 6 | </span>
                    {
                  </div>

                  <div class="terminal__problem">
                    <span class="terminal__line-number"> 7 | </span>
                    &nbsp;&nbsp;&nbsp;&nbsp;std::promise&lt;int&gt; promise;
                  </div>

                  <div>
                    <span class="terminal__line-number"> &nbsp;&nbsp;| </span>
                    <span class="terminal__caret"
                      >&nbsp;&nbsp;&nbsp;&nbsp;^</span
                    >
                  </div>

                  <div>
                    <span class="terminal__line-number"> 8 | </span>
                    &nbsp;&nbsp;&nbsp;&nbsp;auto future = promise.get_future();
                  </div>
                </div>

                <div class="terminal__hint">
                  <span class="terminal__hint-label">hint:</span>

                  <span>
                    set a value or exception before destroying the promise, or
                    keep the promise alive until fulfillment
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ==========================================================
   HERO
========================================================== */

.hero {
  position: relative;

  padding: clamp(2.75rem, 5vw, 4rem) 0 clamp(5rem, 8vw, 7rem);

  overflow: hidden;
  background: var(--vix-bg);
}

.hero::before {
  content: none;
}

/* ==========================================================
   INTRO
========================================================== */

.hero-intro {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    minmax(270px, 0.44fr);

  align-items: center;

  gap: clamp(3rem, 7vw, 7rem);
}

.hero-intro__copy {
  max-width: 760px;
}

.hero-title {
  max-width: 760px;

  margin: 0;

  color: var(--color-text);

  font-size: clamp(2.8rem, 4.9vw, 4.35rem);
  font-weight: 670;
  line-height: 1;

  letter-spacing: -0.058em;
}

.hero-description {
  max-width: 680px;

  margin-top: 1.25rem;

  color: var(--color-text-secondary);

  font-size: clamp(1rem, 1.4vw, 1.1rem);
  line-height: 1.72;
}

.hero-start {
  display: flex;
  align-items: flex-start;
  flex-direction: column;

  gap: 0.8rem;
  min-width: 0;
  padding-left: clamp(1.25rem, 3vw, 2.5rem);

  border-left: 1px solid var(--vix-border);
}

.hero-start__label {
  color: var(--vix-text-muted);

  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.hero-start__primary {
  display: inline-flex;
  align-items: center;

  min-height: 42px;
  padding: 0 1rem;

  color: #041008;
  background: var(--vix-green-light);
  border: 1px solid var(--vix-green-light);
  border-radius: var(--radius-sm);

  font-size: 0.88rem;
  font-weight: 700;
}

.hero-start__secondary-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.hero-start__secondary-actions a {
  padding: 0.3rem 0;

  color: var(--vix-link);
  border-bottom: 1px solid var(--vix-border);

  font-size: 0.78rem;
  font-weight: 600;
}

.hero-start__secondary-actions a:hover {
  color: var(--vix-link-hover);
  border-color: var(--vix-link-hover);
}

/* ==========================================================
   SHOWCASE
========================================================== */

.hero-showcase {
  display: grid;
  grid-template-columns:
    minmax(0, 0.86fr)
    minmax(470px, 1.14fr);

  gap: clamp(3.5rem, 7vw, 7rem);

  margin-top: clamp(2.75rem, 5vw, 4rem);
  padding-top: clamp(2.8rem, 5vw, 4rem);

  border-top: 1px solid var(--color-border);
}

/* ==========================================================
   SHOWCASE LEFT
========================================================== */

.showcase-copy {
  display: flex;
  flex-direction: column;
}

.showcase-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);

  gap: 1rem;

  padding-bottom: 2rem;

  border-bottom: 1px solid var(--color-border);
}

.showcase-item + .showcase-item {
  padding-top: 2rem;
}

.showcase-item__number {
  padding-top: 0.26rem;

  color: var(--color-primary);

  font-family: var(--font-mono);
  font-size: 0.68rem;
}

.showcase-item__body h2 {
  max-width: 520px;

  margin: 0;

  color: var(--color-text);

  font-size: clamp(1.28rem, 2vw, 1.62rem);
  font-weight: 650;
  line-height: 1.17;

  letter-spacing: -0.034em;
}

.showcase-item__body p {
  max-width: 540px;

  margin-top: 0.6rem;

  color: var(--color-text-secondary);

  font-size: 0.91rem;
  line-height: 1.68;
}

.showcase-item__body ul {
  display: flex;
  flex-direction: column;

  gap: 0.24rem;

  margin: 0.62rem 0 0;

  padding-left: 1.1rem;

  color: var(--color-text-muted);

  font-size: 0.83rem;
  line-height: 1.62;
}

.showcase-item__body li::marker {
  color: var(--color-primary);
}

/* ==========================================================
   DEV WINDOW
========================================================== */

.showcase-demo {
  position: sticky;

  top: 94px;

  align-self: start;

  min-width: 0;
}

.dev-window {
  overflow: hidden;

  background: var(--vix-bg-soft);

  border: 1px solid var(--vix-border);
  border-radius: var(--radius-md);
}

.dev-window__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;

  min-height: 39px;
  padding-inline: 0.9rem;

  color: #9aa79f;
  background: var(--vix-bg-soft);

  border-bottom: 1px solid rgba(255, 255, 255, 0.055);

  font-family: var(--font-mono);
  font-size: 0.69rem;
}

.dev-window__bar-left {
  display: flex;
  align-items: center;

  gap: 0.44rem;
}

.window-dot {
  width: 7px;
  height: 7px;

  background: #3c4840;

  border-radius: 50%;
}

.window-dot--active {
  margin-right: 0.4rem;

  background: rgba(34, 197, 94, 0.72);
}

.dev-window__file {
  color: #adb8b1;
}

.dev-window__language {
  color: #5e6c63;
}

/* ==========================================================
   EDITOR
========================================================== */

.editor {
  padding-block: 1.1rem;

  background: var(--vix-bg-soft);

  font-family: var(--font-mono);
  font-size: 0.81rem;
  line-height: 1.72;
}

.editor__line {
  display: grid;
  grid-template-columns: 40px 1fr;

  min-height: 1.72em;

  padding-right: 1rem;

  color: #d3d8d5;
}

.editor__number {
  padding-right: 0.85rem;

  color: #435047;

  text-align: right;

  user-select: none;
}

.editor__line--problem {
  background: rgba(239, 68, 68, 0.05);
}

.cpp-directive {
  color: #c586c0;
}

.cpp-include {
  color: #ce9178;
}

.cpp-keyword {
  color: #569cd6;
}

.cpp-namespace {
  color: #4fc1ff;
}

.cpp-function {
  color: #dcdcaa;
}

.cpp-number {
  color: #b5cea8;
}

.cpp-op {
  color: rgba(226, 232, 240, 0.6);
}

/* ==========================================================
   TERMINAL
========================================================== */

.terminal {
  border-top: 1px solid rgba(255, 255, 255, 0.065);
}

.terminal__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;

  min-height: 34px;
  padding-inline: 0.9rem;

  color: #68766d;
  background: var(--vix-bg-soft);

  border-bottom: 1px solid rgba(255, 255, 255, 0.045);

  font-family: var(--font-mono);
  font-size: 0.66rem;
}

.terminal__state {
  color: rgba(34, 197, 94, 0.82);
}

.terminal__body {
  padding: 1.15rem;

  color: #bac3be;
  background: var(--vix-bg-soft);

  font-family: var(--font-mono);
  font-size: 0.73rem;
  line-height: 1.7;
}

.terminal__command {
  color: var(--vix-green-light);
}

.terminal__command-text {
  color: var(--vix-green-light);
}

.terminal__prompt {
  margin-right: 0.45rem;

  color: #22c55e;

  font-weight: 800;
}

.terminal__space {
  height: 0.65rem;
}

.terminal__error {
  margin-right: 0.35rem;

  color: #fb7185;

  font-weight: 750;
}

.terminal__location {
  color: #a7dfb8;
}

.terminal__frame {
  margin-block: 0.35rem;
}

.terminal__line-number {
  color: #56635b;
}

.terminal__problem {
  color: var(--vix-text);
}

.terminal__caret {
  color: #fb7185;
}

.terminal__hint {
  display: flex;

  gap: 0.45rem;

  margin-top: 0.55rem;

  color: #bac4be;
}

.terminal__hint-label {
  flex: 0 0 auto;

  color: #facc15;

  font-weight: 700;
}

/* ==========================================================
   RESPONSIVE
========================================================== */

@media (max-width: 1020px) {
  .hero-intro {
    grid-template-columns:
      minmax(0, 1fr)
      260px;

    gap: 2.5rem;
  }

  .hero-showcase {
    grid-template-columns: 1fr;
  }

  .showcase-demo {
    position: static;

    max-width: 760px;
  }
}

@media (max-width: 760px) {
  .hero {
    padding-top: 2.75rem;
  }

  .hero-intro {
    grid-template-columns: 1fr;
  }

  .hero-start {
    margin-top: 0.35rem;
    padding-left: 1rem;
  }

  .hero-title {
    font-size: clamp(2.7rem, 12vw, 3.9rem);
  }

  .hero-showcase {
    margin-top: 3.2rem;
    padding-top: 2.6rem;
  }
}

@media (max-width: 540px) {
  .showcase-item {
    grid-template-columns: 1fr;

    gap: 0.3rem;
  }

  .editor {
    font-size: 0.64rem;
  }

  .editor__line {
    grid-template-columns:
      30px
      1fr;
  }

  .terminal__body {
    padding-inline: 0.72rem;

    font-size: 0.6rem;
  }
}
</style>
