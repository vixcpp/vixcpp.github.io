const html = `<h1>Vix Build Roadmap Execution</h1>
<p><code>vix build</code> is becoming more than a CMake/Ninja frontend.</p>
<p>The goal is not to replace CMake and Ninja immediately.
The goal is to build a smarter layer above them:</p>
<pre class="blog-code blog-code--plain"><code>fast when safe
correct by default
fallback when needed</code></pre><p>The latest work focused on turning the build roadmap into real implementation steps.</p>
<p>The main areas were:</p>
<ul>
<li>build routing</li>
<li>clean output</li>
<li>safe fast path</li>
<li>security tests</li>
<li>no-op optimization</li>
<li>why rebuild</li>
<li>safer Ninja import</li>
<li>ObjectCache</li>
<li>ArtifactCache</li>
<li>native vix.app builds</li>
<li>diagnostics</li>
<li>CI and benchmarks</li>
</ul>
<p>This article summarizes what changed and why it matters.</p>
<h2>1. Stabilizing the build routing</h2>
<p>The first step was to make the build path predictable.
The rules are now clearer:</p>
<pre class="blog-code blog-code--plain"><code>vix build --build-target all
  -&gt; CMake/Ninja

vix build --build-target &lt;real-target&gt;
  -&gt; Graph Target Executor
  -&gt; fallback CMake/Ninja

vix build --fast --build-target &lt;real-target&gt;
  -&gt; build-state fast path
  -&gt; fallback Graph Target Executor
  -&gt; fallback CMake/Ninja

VIX_GRAPH_EXECUTOR=0 vix build --build-target &lt;target&gt;
  -&gt; CMake/Ninja</code></pre><p>This matters because build systems must never guess dangerously.</p>
<p>The <code>all</code> target stays on the CMake/Ninja path because it can represent many things:</p>
<ul>
<li>executables</li>
<li>libraries</li>
<li>tests</li>
<li>examples</li>
<li>generated targets</li>
<li>install targets</li>
<li>utility targets</li>
</ul>
<p>A real executable or library target can use the graph executor.
A global or ambiguous target falls back to CMake/Ninja.</p>
<p>The principle is simple:</p>
<pre class="blog-code blog-code--plain"><code>real target      -&gt; Vix graph path
global target    -&gt; CMake/Ninja path
ambiguous target -&gt; CMake/Ninja path</code></pre><h2>2. Cleaner user output</h2>
<p>The second step was to make the output more stable and less noisy.
A no-op fast path should look like this:</p>
<pre class="blog-code blog-code--plain"><code>Checking vix (dev)
  ✔ Up to date in 0.30s</code></pre><p>A graph target build should look like this:</p>
<pre class="blog-code blog-code--plain"><code>Building vix (dev)
  ✔ Graph target: vix
  ✔ Up to date
  ✔ Done</code></pre><p>The output rules are now:</p>
<pre class="blog-code blog-code--plain"><code>vix build
  -&gt; minimal user output

vix build -v
  -&gt; detailed but still readable output

VIX_LOG_LEVEL=debug vix build -v
  -&gt; internal graph/cache/build logs</code></pre><p>Internal details should not pollute normal builds.
Users should see what matters.
Developers debugging Vix internals can still access the deeper logs.</p>
<h2>3. Safer <code>--fast</code></h2>
<p>The <code>--fast</code> path is only useful if it is safe.
It should never say <code>Up to date</code> unless the target is really up to date.
The build state validation was strengthened to check:</p>
<ul>
<li>project fingerprint</li>
<li>build signature</li>
<li>build target</li>
<li>preset</li>
<li>build type</li>
<li>compiler identity</li>
<li>target identity</li>
<li>project inputs</li>
<li>last binary path</li>
<li>last binary exists</li>
<li>last binary is executable</li>
<li>artifact root exists</li>
</ul>
<p>Some values such as launcher, linker and CMake variables are already part of the build signature.
The important rule is:</p>
<pre class="blog-code blog-code--plain"><code>state hit is not enough
the final binary must still exist</code></pre><p>So if the last binary was deleted, Vix must fallback to the normal build path.</p>
<p>Example:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> build</span><span style="color:#79B8FF"> --build-target</span><span style="color:#9ECBFF"> vix</span></span>
<span class="line"><span style="color:#B392F0">rm</span><span style="color:#79B8FF"> -f</span><span style="color:#9ECBFF"> build-ninja/vix</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> build</span><span style="color:#79B8FF"> --fast</span><span style="color:#79B8FF"> --build-target</span><span style="color:#9ECBFF"> vix</span></span></code></pre><p>The last command must not return a false <code>Up to date</code>.</p>
<h2>4. Build safety tests</h2>
<p>The next step was adding a dedicated safety test script.
The script covers the most fragile paths:</p>
<ul>
<li>build target all</li>
<li>build target real</li>
<li>graph executor enabled</li>
<li>graph executor disabled</li>
<li><code>--fast</code> state hit</li>
<li><code>--fast</code> fallback</li>
<li>missing last binary</li>
<li>changed source file</li>
<li>changed header file</li>
<li>changed CMakeLists.txt</li>
<li>changed compiler flags</li>
<li>changed build target</li>
</ul>
<p>The goal is regression protection.
Every optimization must prove that it does not break correctness.
The test script creates a small temporary CMake project, runs <code>vix build</code> in different modes, and checks the output behavior.</p>
<p>This gives Vix a safety net before adding more aggressive caching or native build execution.</p>
<h2>5. Faster no-op builds without <code>--fast</code></h2>
<p>Before this step, the normal build path could still pay for:</p>
<ul>
<li>scan project</li>
<li>load compile_commands.json</li>
<li>load build.ninja</li>
<li>load dependency files</li>
<li>propagate dirty state</li>
</ul>
<p>even when nothing changed.
The improvement was to allow a valid build state hit to return early even without <code>--fast</code>.
That means:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> build</span><span style="color:#79B8FF"> --build-target</span><span style="color:#9ECBFF"> vix</span></span></code></pre><p>can also become fast when the build state proves that nothing changed.
The ideal no-op path becomes:</p>
<pre class="blog-code blog-code--plain"><code>read build state
snapshot project inputs
compare signatures
verify last binary
return up to date</code></pre><p>This turns the build state from a <code>--fast</code>-only feature into a general no-op optimization.</p>
<h2>6. Explaining why Vix rebuilds</h2>
<p>Speed is not the only goal.
A build tool should also explain its decisions.
The new <code>--explain</code> path is designed for this:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> build</span><span style="color:#79B8FF"> --explain</span><span style="color:#79B8FF"> --build-target</span><span style="color:#9ECBFF"> vix</span></span></code></pre><p>Expected output:</p>
<pre class="blog-code blog-code--plain"><code>Rebuilding BuildCommand.cpp
  reason: source file changed

Rebuilding CLI.cpp
  reason: CLI.hpp changed

Relinking vix
  reason: object file changed</code></pre><p>The first version uses the current graph and the previous graph to compare:</p>
<ul>
<li>task existence</li>
<li>command hash</li>
<li>missing outputs</li>
<li>source changes</li>
<li>header changes</li>
<li>config changes</li>
<li>node state changes</li>
</ul>
<p>This starts the foundation for a bigger feature:</p>
<blockquote>
<p>Vix should not only rebuild. Vix should explain why it rebuilt.
That is very important for large C++ projects.
When a single header causes many files to rebuild, users should be able to see the reason.</p>
</blockquote>
<h2>7. Safer Ninja import</h2>
<p>Vix imports <code>build.ninja</code> so it can understand the generated build graph.</p>
<p>The goal is not to blindly reimplement Ninja.
The goal is to use Ninja metadata safely.
The improved rules are:</p>
<pre class="blog-code blog-code--plain"><code>--build-target all       -&gt; CMake/Ninja
phony complex target     -&gt; CMake/Ninja
real output target       -&gt; Graph Executor
ambiguous target         -&gt; CMake/Ninja</code></pre><p>This means Vix can import more Ninja edges, but still avoid unsafe execution.
The safer import path improves:</p>
<ul>
<li>link edges</li>
<li>archive edges</li>
<li>copy edges</li>
<li>install edges</li>
<li>utility edges</li>
<li>target dependencies</li>
<li>real output detection</li>
</ul>
<p>But the executor only handles clear real outputs.</p>
<p>For now:</p>
<pre class="blog-code blog-code--plain"><code>Link/Archive target              -&gt; safe candidate
Copy/Install/Utility/phony       -&gt; fallback
multiple matches                 -&gt; fallback
zero matches                     -&gt; fallback</code></pre><p>The correction rule is more important than speed: if unsure, use CMake/Ninja.</p>
<h2>8. Stronger ObjectCache</h2>
<p>ObjectCache is responsible for avoiding unnecessary recompilation.
The cache key must be strong enough to prevent wrong reuse.
A compile cache key now depends on:</p>
<ul>
<li>source content hash</li>
<li>dependency/header content hash</li>
<li>command hash</li>
<li>compiler identity</li>
<li>target triple</li>
<li>build fingerprint</li>
<li>build type</li>
<li>defines</li>
<li>include dirs</li>
<li>compile flags</li>
</ul>
<p>The expected flow is:</p>
<pre class="blog-code blog-code--plain"><code>for each compile task:
  compute object cache key

  if cache hit:
    restore .o
    restore .d
    skip compiler

  else:
    compile
    store .o
    store .d</code></pre><p>A key improvement is making the object cache survive build directory deletion.
Instead of only living under the build directory, the object cache can live under:</p>
<pre class="blog-code blog-code--plain"><code>~/.vix/cache/objects</code></pre><p>That enables this workflow:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> build</span><span style="color:#79B8FF"> --build-target</span><span style="color:#9ECBFF"> vix</span></span>
<span class="line"><span style="color:#B392F0">rm</span><span style="color:#79B8FF"> -rf</span><span style="color:#9ECBFF"> build-ninja</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> build</span><span style="color:#79B8FF"> --build-target</span><span style="color:#9ECBFF"> vix</span></span></code></pre><p>With a warm cache, Vix should restore object files instead of recompiling everything.</p>
<h2>9. ArtifactCache for complete targets</h2>
<p>ObjectCache avoids recompiling <code>.o</code> files.
ArtifactCache goes one level higher.</p>
<p>It can restore the final target itself:</p>
<pre class="blog-code blog-code--plain"><code>ArtifactCache  -&gt; restore final binary/library
ObjectCache    -&gt; restore .o/.d
Compiler       -&gt; compile only misses</code></pre><p>The ideal flow is:</p>
<pre class="blog-code blog-code--plain"><code>check artifact cache

if artifact hit:
  restore final binary/lib
  done

else:
  check object cache
  compile only misses
  link
  store artifact</code></pre><p>This matters for:</p>
<ul>
<li>CI</li>
<li>clean builds</li>
<li>developer machines</li>
<li>packages</li>
<li>global dependencies</li>
<li>release builds</li>
</ul>
<p>For a target like <code>vix</code>, the cache can store the final binary under the artifact root:</p>
<pre class="blog-code blog-code--plain"><code>~/.vix/cache/build/.../bin/vix</code></pre><p>Then a later build can restore it directly.</p>
<p>This is the fastest path after build-state validation.</p>
<h2>10. Native <code>vix.app</code> build path</h2>
<p><code>vix.app</code> already exists.</p>
<p>Today, the compatibility path is:</p>
<pre class="blog-code blog-code--plain"><code>vix.app -&gt; generated CMake -&gt; CMake/Ninja</code></pre><p>That is good because it supports more features safely.
The new direction is to add a native path for simple cases:</p>
<pre class="blog-code blog-code--plain"><code>vix.app simple executable
  -&gt; Native BuildGraph
  -&gt; ObjectCache
  -&gt; Scheduler
  -&gt; Link</code></pre><p>But the important rule stays:</p>
<pre class="blog-code blog-code--plain"><code>simple features   -&gt; native Vix build path
complex features  -&gt; generated CMake fallback</code></pre><p>Vix already has:</p>
<ul>
<li>AppManifest</li>
<li>AppManifest parser</li>
<li>AppProjectResolver</li>
<li>AppCMakeGenerator</li>
</ul>
<p>So the native path should reuse the existing AppManifest.
It should not create a second parser.
The safe V1 supports simple executable projects.
Complex features still fallback to generated CMake:</p>
<ul>
<li>packages</li>
<li>resources</li>
<li>links</li>
<li>compile features</li>
<li>static libraries</li>
<li>shared libraries</li>
</ul>
<p>This keeps compatibility while letting Vix start owning the native build path.</p>
<h2>11. Better diagnostics</h2>
<p>A faster build is not enough.
When a build fails, the output should help the developer fix it quickly.
The diagnostic improvements focus on:</p>
<ul>
<li>compiler errors with code frame</li>
<li>warnings grouped</li>
<li>file + line + column</li>
<li>raw command hidden by default</li>
<li>raw command visible in debug</li>
<li>hint for missing headers</li>
<li>hint for linker errors</li>
<li>hint for unresolved targets</li>
</ul>
<p>Expected style:</p>
<pre class="blog-code blog-code--plain"><code>Build failed

src/main.cpp:12:10
  error: 'App' was not declared

Hint:
  Declare the symbol before use, include the right header,
  or move the function definition above the call.</code></pre><p>For missing headers:</p>
<pre class="blog-code blog-code--plain"><code>Build failed

src/main.cpp:2:10
  error: fatal error: app.hpp: No such file or directory

Hint:
  Check that the header exists and that its directory is listed
  in include_dirs, target_include_directories, or your compiler include paths.</code></pre><p>Warnings should be grouped:</p>
<pre class="blog-code blog-code--plain"><code>  warning  3 compiler warnings
    • src/main.cpp:10:9: warning: unused variable 'x'
    • src/app.cpp:4:12: warning: unused function 'foo'
    • src/db.cpp:8:5:  warning: control reaches end of non-void function</code></pre><p>Raw commands should stay hidden by default. Debug mode can show them:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#E1E4E8">VIX_LOG_LEVEL</span><span style="color:#F97583">=</span><span style="color:#9ECBFF">debug</span><span style="color:#B392F0"> vix</span><span style="color:#9ECBFF"> build</span><span style="color:#79B8FF"> -v</span></span></code></pre><p>This keeps normal output clean and makes internal debugging possible.</p>
<h2>12. CI and official benchmarks</h2>
<p>The last step was adding a reproducible way to prove the gains.
The standard benchmark is:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">hyperfine</span><span style="color:#79B8FF"> --warmup</span><span style="color:#79B8FF"> 5</span><span style="color:#79B8FF"> --runs</span><span style="color:#79B8FF"> 20</span><span style="color:#79B8FF"> \\</span></span>
<span class="line"><span style="color:#9ECBFF">  'vix build --fast --build-target vix'</span><span style="color:#79B8FF"> \\</span></span>
<span class="line"><span style="color:#9ECBFF">  'vix build --build-target vix'</span><span style="color:#79B8FF"> \\</span></span>
<span class="line"><span style="color:#9ECBFF">  'VIX_GRAPH_EXECUTOR=0 vix build --build-target vix'</span></span></code></pre><p>The official scenarios are:</p>
<ul>
<li>no-op build</li>
<li>incremental one source changed</li>
<li>incremental one header changed</li>
<li>clean build cold cache</li>
<li>clean build warm object cache</li>
<li>target build vs all build</li>
<li>fast path hit</li>
<li>fast path fallback</li>
</ul>
<p>Every benchmark report should include:</p>
<ul>
<li>CPU, RAM, OS</li>
<li>compiler, linker, launcher</li>
<li>Vix version</li>
<li>project size</li>
<li>number of source files, headers, compile tasks</li>
<li>cache status</li>
</ul>
<p>This matters because build performance depends heavily on the machine and environment.
A benchmark without environment details is not very useful.</p>
<h2>Current architecture after this work</h2>
<p>The build model now has multiple layers:</p>
<pre class="blog-code blog-code--plain"><code>Build state    -&gt; fastest no-op validation
ArtifactCache  -&gt; restore complete target
BuildGraph     -&gt; target-aware analysis
ObjectCache    -&gt; restore .o/.d files
Scheduler      -&gt; execute selected compile tasks
CMake/Ninja    -&gt; compatibility fallback</code></pre><p>The routing model is:</p>
<pre class="blog-code blog-code--plain"><code>if build state proves clean:
  return up to date

else if complete artifact exists:
  restore target

else if real target is graph-safe:
  use Graph Executor

else:
  use CMake/Ninja</code></pre><p>This creates a progressive build system.
Each layer tries to solve the build earlier.
If a layer cannot prove correctness, Vix falls back to the next safer layer.</p>
<h2>Why this matters</h2>
<p>C++ build tooling often forces users to choose between power and simplicity.</p>
<p>Vix is taking a different path:</p>
<ul>
<li>keep CMake/Ninja compatibility</li>
<li>add fast paths where safe</li>
<li>add graph intelligence gradually</li>
<li>improve diagnostics</li>
<li>make common workflows simpler</li>
</ul>
<p>This is not a rewrite of the C++ ecosystem.
It is a practical build layer that improves the developer workflow step by step.</p>
<h2>The principle</h2>
<blockquote>
<p>Vix should be fast when it can prove correctness.
Vix should fallback when another tool is safer.</p>
</blockquote>
<p>That principle applies to every part:</p>
<pre class="blog-code blog-code--plain"><code>all target          -&gt; fallback
ambiguous target    -&gt; fallback
complex vix.app     -&gt; fallback
missing binary      -&gt; fallback
changed inputs      -&gt; rebuild
valid no-op state   -&gt; return fast</code></pre><p>This is how Vix can become faster without becoming fragile.</p>
<h2>Conclusion</h2>
<p>The latest <code>vix build</code> work turns the roadmap into a stronger build architecture.</p>
<p>Vix now has a clearer path toward:</p>
<ul>
<li>fast no-op builds</li>
<li>safer target routing</li>
<li>better cache reuse</li>
<li>native vix.app execution</li>
<li>clearer diagnostics</li>
<li>reproducible benchmarks</li>
</ul>
<p>The long-term direction is now visible:</p>
<pre class="blog-code blog-code--plain"><code>CMake/Ninja    -&gt; for compatibility
BuildGraph     -&gt; for intelligence
ObjectCache    -&gt; for compile reuse
ArtifactCache  -&gt; for target reuse
vix.app        -&gt; for native simple builds
diagnostics    -&gt; for developer experience
CI/benchmarks  -&gt; for proof</code></pre><p>This is the foundation of a modern C++ build workflow inside Vix.</p>
`;
const vixBuildRoadmapExecution = {
  html
};
export {
  vixBuildRoadmapExecution as default,
  html
};
