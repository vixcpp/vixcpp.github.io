<script setup>
import { RouterLink } from "vue-router";
</script>

<template>
  <section class="page">
    <!-- Top bar -->
    <header class="topbar">
      <div class="topbar-inner">
        <RouterLink class="brand" to="/registry/browse" aria-label="Back to registry browse">
          <span class="brand-dot" aria-hidden="true"></span>
          <span class="brand-text">Registry</span>
        </RouterLink>

        <div class="crumbs" aria-label="Breadcrumb">
          <RouterLink class="crumb" to="/registry/browse">Browse</RouterLink>
          <span class="sep">/</span>
          <span class="here">Publish</span>
        </div>

        <nav class="nav">
          <a class="nav-link" href="/docs/registry/publish" target="_self" rel="noreferrer">Docs</a>
          <a class="nav-link pill" href="/docs/modules/cli/publish" target="_self" rel="noreferrer">vix publish</a>
        </nav>
      </div>
    </header>

    <div class="wrap">
      <!-- Hero -->
      <div class="hero">
        <div class="hero-left">
          <div class="kicker">CLI-only</div>

          <h1 class="h1">Publish a C++ library in minutes</h1>

          <p class="p">
            Create a library with <span class="mono">vix new</span>.
            The project is already configured.
            When your code is ready, tag a version and publish.
          </p>

          <div class="steps" role="list" aria-label="Publish steps">
            <div class="step" role="listitem">
              <div class="num">1</div>
              <div class="txt">
                <div class="t">Create</div>
                <div class="s">Generate a header-only library template.</div>
              </div>
            </div>

            <div class="step" role="listitem">
              <div class="num">2</div>
              <div class="txt">
                <div class="t">Test</div>
                <div class="s">Run tests and iterate locally.</div>
              </div>
            </div>

            <div class="step" role="listitem">
              <div class="num">3</div>
              <div class="txt">
                <div class="t">Tag + Publish</div>
                <div class="s">Tag a version, then run one command.</div>
              </div>
            </div>
          </div>

          <div class="cta">
            <a class="btn primary" href="/docs/registry/publish" target="_self" rel="noreferrer">Publish docs</a>
            <RouterLink class="btn" to="/registry/browse">Browse packages</RouterLink>
          </div>

          <div class="note">
            Requirement: your repository must be <span class="em">open source</span>.
          </div>
        </div>

        <div class="hero-right">
          <div class="terminal" role="region" aria-label="CLI example">
            <div class="term-top">
              <span class="dot r" aria-hidden="true"></span>
              <span class="dot y" aria-hidden="true"></span>
              <span class="dot g" aria-hidden="true"></span>
              <span class="term-title">Example</span>
              <span class="term-hint">copy and run</span>
            </div>

            <pre class="term"><code># Create a C++ library (already configured)
vix new tree --lib
cd tree
vix tests

# When ready, tag + publish
git tag -a v0.1.0 -m "v0.1.0"
git push origin v0.1.0

vix publish 0.1.0 --notes "Initial release"</code></pre>
          </div>

          <div class="mini">
            <div class="mini-title">After publishing</div>
            <div class="mini-row">
              <span class="mini-k">Search</span>
              <span class="mini-v mono">vix search tree</span>
            </div>
            <div class="mini-row">
              <span class="mini-k">Browse</span>
              <span class="mini-v mono">Registry / @namespace/tree</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom strip -->
      <div class="footer">
        <div class="foot-left">
          <div class="foot-title">Publishing is intentionally not in the web UI</div>
          <div class="foot-sub">
            The registry website is for discovery.
            The CLI handles publishing quickly and reliably.
          </div>
        </div>

        <div class="foot-right">
          <RouterLink class="btn primary" to="/registry/browse">Browse</RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page{
  --max: 1160px;
  --pad: 20px;
  --text: rgba(255,255,255,.92);
  min-height: 100vh;
}

/* topbar */
.topbar{
  position: sticky;
  top: 0;
  z-index: 30;
  backdrop-filter: blur(10px);
  background: linear-gradient(to bottom, rgba(0,0,0,.55), rgba(0,0,0,.30));
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.topbar-inner{
  max-width: var(--max);
  margin: 0 auto;
  padding: 12px var(--pad);
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.brand{
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text);
  font-weight: 950;
}

.brand-dot{
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: rgba(140,200,255,.80);
  box-shadow: 0 0 0 3px rgba(140,200,255,.14);
}

.brand-text{
  font-size: 14px;
  opacity: .95;
}

.crumbs{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255,255,255,.60);
  font-size: 13px;
  font-weight: 900;
}

.crumb{ color: rgba(255,255,255,.70); text-decoration: none; }
.crumb:hover{ color: rgba(255,255,255,.92); }
.sep{ opacity: .6; }
.here{ color: rgba(255,255,255,.86); }

.nav{
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.nav-link{
  text-decoration: none;
  color: rgba(255,255,255,.70);
  font-size: 13px;
  font-weight: 900;
}
.nav-link:hover{ color: rgba(255,255,255,.92); }

.pill{
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.04);
}

/* wrap */
.wrap{
  max-width: var(--max);
  margin: 0 auto;
  padding: 18px var(--pad) 44px;
}

/* hero */
.hero{
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 520px);
  gap: 16px;
  align-items: start;
  margin-top: 12px;
  padding-top: 0 !important;
}

.hero-left{
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.03);
  border-radius: 14px;
  padding: 16px;
}

.kicker{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  font-weight: 950;
  letter-spacing: .10em;
  text-transform: uppercase;
  color: rgba(255,255,255,.62);
}

.h1{
  margin: 8px 0 0;
  font-size: 20px;
  font-weight: 950;
  color: var(--text);
  letter-spacing: -0.01em;
}

.p{
  margin: 10px 0 0;
  color: rgba(255,255,255,.72);
  font-size: 14px;
  font-weight: 800;
  line-height: 1.65;
}

.mono{
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 900;
}

.steps{
  margin-top: 12px;
  display: grid;
  gap: 10px;
}

.step{
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(0,0,0,.14);
}

.num{
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 950;
  color: rgba(200,235,255,.95);
  background: rgba(140,200,255,.14);
  border: 1px solid rgba(140,200,255,.22);
  flex: 0 0 auto;
}

.txt{ min-width: 0; }
.t{
  font-size: 13px;
  font-weight: 950;
  color: rgba(255,255,255,.90);
}
.s{
  margin-top: 2px;
  font-size: 12.5px;
  font-weight: 850;
  color: rgba(255,255,255,.62);
  line-height: 1.45;
}

.cta{
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.btn{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.86);
  font-size: 13px;
  font-weight: 950;
  text-decoration: none;
}

.btn:hover{
  background: rgba(255,255,255,.06);
  border-color: rgba(255,255,255,.14);
  color: rgba(255,255,255,.94);
}

.primary{
  border-color: rgba(140,200,255,.22);
  background: rgba(140,200,255,.10);
  color: rgba(200,235,255,.98);
}
.primary:hover{ background: rgba(140,200,255,.14); }

.note{
  margin-top: 12px;
  font-size: 12.5px;
  font-weight: 850;
  color: rgba(255,255,255,.62);
  border-top: 1px solid rgba(255,255,255,.08);
  padding-top: 12px;
}
.em{ color: rgba(255,255,255,.92); }

/* right */
.hero-right{
  display: grid;
  gap: 12px;
  min-width: 0;
}

.terminal{
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.03);
  border-radius: 14px;
  overflow: hidden;
}

.term-top{
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.dot{ width: 10px; height: 10px; border-radius: 999px; }
.dot.r{ background: rgba(255,120,120,.75); }
.dot.y{ background: rgba(255,210,120,.75); }
.dot.g{ background: rgba(140,230,160,.75); }

.term-title{
  margin-left: 6px;
  font-size: 12px;
  font-weight: 950;
  color: rgba(255,255,255,.70);
}
.term-hint{
  margin-left: auto;
  font-size: 11.5px;
  font-weight: 900;
  color: rgba(255,255,255,.55);
}

.term{
  margin: 0;
  padding: 12px 12px 14px;
  overflow: auto;
  white-space: pre;
  font-size: 12.5px;
  line-height: 1.6;
  color: rgba(230,245,255,.92);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* mini */
.mini{
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.03);
  border-radius: 14px;
  padding: 12px;
}

.mini-title{
  font-size: 12px;
  font-weight: 950;
  color: rgba(255,255,255,.78);
}

.mini-row{
  margin-top: 10px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  color: rgba(255,255,255,.72);
  font-size: 12.5px;
  font-weight: 850;
}
.mini-k{ color: rgba(255,255,255,.56); }

/* footer */
.footer{
  margin-top: 14px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.03);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.foot-title{
  font-size: 13px;
  font-weight: 950;
  color: rgba(255,255,255,.88);
}
.foot-sub{
  margin-top: 6px;
  font-size: 12.5px;
  font-weight: 850;
  color: rgba(255,255,255,.62);
  line-height: 1.5;
}

/* responsive */
@media (max-width: 1060px){
  .hero{ grid-template-columns: 1fr; }
}

@media (max-width: 960px){
  .topbar-inner{ grid-template-columns: 1fr; }
  .nav{ justify-content: flex-start; }
}

@media (max-width: 560px){
  .wrap{ padding: 14px 14px 34px; }
  .term{ font-size: 12px; }
}
</style>
