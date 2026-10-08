const html = `<hr>
<h1>Vix.cpp v2.7.2</h1>
<p>Vix.cpp v2.7.2 completes the dependency workflow introduced with Vix App Modules.</p>
<p>A module can now declare the registry packages it needs in its own <code>vix.module</code> file, while the application continues to resolve one effective dependency graph and maintain one root <code>vix.lock</code>.</p>
<p>The release also makes C++ cell execution in Vix Note safer. Programs that do not terminate or produce excessive output are now stopped before they can block the notebook interface.</p>
<p>Together, these changes strengthen two parts of Vix that execute user-defined work: application modules can depend on external packages without becoming separate projects, and Note cells can fail without taking the surrounding development environment with them.</p>
<h2>Release focus</h2>
<p>Vix App Modules were introduced in v2.7.1 to give larger applications a clearer internal structure.</p>
<p>A project can divide routes, services, controllers, storage code, and runtime behavior into modules while keeping one application entry point and one build. Each module has its own <code>vix.module</code> file, and <code>vix.app</code> decides which modules participate in the current application.</p>
<p>The first module release covered module discovery, enablement, build generation, and runtime participation. It did not yet provide a complete answer for packages used by only one module.</p>
<p>A package could be added to the root application, but that lost useful ownership information. An authentication module might be the only part of the project using <code>rix/rix</code>, yet the dependency appeared to belong to the entire application and was linked at the application level.</p>
<p>Vix.cpp v2.7.2 allows the module to declare that dependency directly.</p>
<p>The application still owns package resolution. Modules do not create independent lockfiles, dependency directories, or package environments. Instead, dependencies from enabled modules are merged into the application’s effective dependency set and resolved through the root project.</p>
<h2>Module-level registry dependencies</h2>
<p>A module can now declare registry packages in its <code>vix.module</code> manifest:</p>
<pre class="blog-code blog-code--plain"><code>[deps]
registry = [
  &quot;rix/rix@^0.9.1&quot;,
]

links = [
  &quot;rix::rix&quot;,
]</code></pre><p>The <code>registry</code> list describes the packages required by the module.</p>
<p>The <code>links</code> list describes the CMake targets from those packages that must be linked to the generated module target.</p>
<p>Keeping these two pieces of information in the module manifest makes the dependency relationship explicit. A developer reading <code>modules/auth/vix.module</code> can see both the external package required by the module and the target used by its C++ implementation.</p>
<p>The module does not receive its own <code>vix.lock</code>. Its package requirement is resolved as part of the root application dependency graph.</p>
<h2>Adding a package to a module</h2>
<p>The <code>vix add</code> command now accepts a module target:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> add</span><span style="color:#9ECBFF"> rix/rix</span><span style="color:#79B8FF"> --module</span><span style="color:#9ECBFF"> auth</span></span></code></pre><p>The short form is also supported:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> add</span><span style="color:#9ECBFF"> rix/rix</span><span style="color:#79B8FF"> -m</span><span style="color:#9ECBFF"> auth</span></span></code></pre><p>Assignment-style syntax can be used in scripts:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> add</span><span style="color:#9ECBFF"> rix/rix</span><span style="color:#79B8FF"> --module=auth</span></span></code></pre><p>The command updates:</p>
<pre class="blog-code blog-code--plain"><code>modules/auth/vix.module</code></pre><p>rather than adding the package to the root application manifest.</p>
<p>After updating the module, Vix refreshes the root lockfile so the new dependency is immediately part of the reproducible project state.</p>
<p>The complete workflow is:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> modules</span><span style="color:#9ECBFF"> add</span><span style="color:#9ECBFF"> auth</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> add</span><span style="color:#9ECBFF"> rix/rix</span><span style="color:#79B8FF"> --module</span><span style="color:#9ECBFF"> auth</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> install</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> build</span></span></code></pre><p>There is no separate module installation command and no second dependency resolver inside the module.</p>
<h2>Explicit link targets</h2>
<p>A package can expose one or more CMake targets. When Vix cannot determine the intended target from the package name alone, it can be supplied explicitly:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> add</span><span style="color:#9ECBFF"> rix/rix</span><span style="color:#79B8FF"> \\</span></span>
<span class="line"><span style="color:#79B8FF">  --module</span><span style="color:#9ECBFF"> auth</span><span style="color:#79B8FF"> \\</span></span>
<span class="line"><span style="color:#79B8FF">  --link</span><span style="color:#9ECBFF"> rix::rix</span></span></code></pre><p>For common package names, Vix can infer a default target:</p>
<pre class="blog-code blog-code--plain"><code>rix/rix -&gt; rix::rix</code></pre><p>The inferred or explicit target is written to the module’s <code>links</code> list.</p>
<p>This separation matters because a registry package name and a CMake target are related but not identical concepts. The package identifies what Vix resolves and installs. The target identifies what CMake links into the module.</p>
<h2>One application dependency graph</h2>
<p>Dependencies declared by enabled modules are merged with the root project dependencies before resolution.</p>
<p>Suppose an application has:</p>
<pre class="blog-code blog-code--plain"><code>root dependency:
  fmtlib/fmt

auth module:
  rix/rix

storage module:
  another/database-package</code></pre><p>Vix builds one effective dependency set from the application and its enabled modules. That set is resolved together and written to the root:</p>
<pre class="blog-code blog-code--plain"><code>vix.lock</code></pre><p>This preserves a single version decision for each package across the project.</p>
<p>Two modules cannot silently resolve incompatible copies of the same registry dependency in isolated lockfiles. Version conflicts are handled at the application boundary, where the complete dependency graph is visible.</p>
<p>This also keeps source control straightforward. The repository contains one lockfile representing the exact package state required by the active application configuration.</p>
<h2>Enabled and disabled modules</h2>
<p>Only dependencies from enabled modules participate in the active dependency graph.</p>
<p>If a module exists in the project but is disabled in <code>vix.app</code>, its registry requirements do not force packages into the current installation or build.</p>
<p>This follows the same rule used for module compilation and runtime generation. A disabled module remains part of the source tree, but it is not part of the active application.</p>
<p>The behavior is useful for optional features and project variants. A project can keep an integration module in the repository without requiring every developer or deployment profile to install its external dependencies.</p>
<p>When the module is enabled again, its requirements return to the effective dependency set and are resolved through the root lockfile.</p>
<h2>Root lockfile generation</h2>
<p><code>vix add --module</code> now refreshes the root <code>vix.lock</code> after modifying the module manifest.</p>
<p>Earlier implementations could write the package into <code>vix.module</code> without creating or updating the root lockfile. The module declaration was therefore valid, but the project had no resolved package state for <code>vix install</code> to consume.</p>
<p>Vix.cpp v2.7.2 closes that gap.</p>
<p>The command sequence now has a consistent meaning:</p>
<pre class="blog-code blog-code--plain"><code>vix add --module   declares the dependency and refreshes resolution
vix install        materializes the resolved dependency graph
vix build          loads package targets and compiles the modules</code></pre><p>The root lockfile remains the authoritative record of selected versions, commits, integrity information, and transitive dependencies.</p>
<h2>Module CMake links</h2>
<p>The generated application CMake now records link targets for each module.</p>
<p>For an <code>auth</code> module using <code>rix::rix</code>, Vix can generate:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#F97583">set</span><span style="color:#E1E4E8">(VIX_MODULE_auth_LINKS</span></span>
<span class="line"><span style="color:#E1E4E8">  rix::rix</span></span>
<span class="line"><span style="color:#E1E4E8">)</span></span></code></pre><p>The package target is linked to the generated target for <code>auth</code>, not automatically to the main application executable.</p>
<p>This preserves dependency ownership in the build graph.</p>
<p>A package used only by one module does not become a direct link dependency of every other module or of unrelated application code. Its include directories, compile definitions, and transitive link interface flow through the module that actually consumes it.</p>
<p>This is especially useful as applications grow. Module boundaries are more meaningful when dependencies follow those boundaries instead of accumulating on one global target.</p>
<h2>Dependency loading order</h2>
<p>Registry package targets must exist before module targets attempt to link them.</p>
<p>Vix now includes:</p>
<pre class="blog-code blog-code--plain"><code>.vix/vix_deps.cmake</code></pre><p>before enabled modules are added to the generated application build.</p>
<p>The order is therefore:</p>
<pre class="blog-code blog-code--plain"><code>1. load resolved registry package targets
2. generate enabled module targets
3. link package targets to their modules
4. generate the application runtime and executable</code></pre><p>Previously, packages could be installed correctly but still fail during <code>vix build</code> because the module’s <code>target_link_libraries()</code> call was evaluated before targets such as <code>rix::rix</code> had been defined.</p>
<p>The resulting CMake error often appeared as:</p>
<pre class="blog-code blog-code--plain"><code>missing: rix::rix</code></pre><p>The package itself was present. The problem was that it entered the generated build too late.</p>
<p>The updated generation order makes module dependency declarations usable through the normal build flow.</p>
<h2>Generated dependency integration</h2>
<p>The generated application CMake includes <code>.vix/vix_deps.cmake</code> when at least one active dependency requires it.</p>
<p>This condition now considers dependencies declared by enabled modules as well as dependencies declared at the root application level.</p>
<p>A project containing only module-level registry packages therefore receives the same dependency initialization as a project with root dependencies.</p>
<p>This removes the previous assumption that the root manifest had to contain a package before generated dependency CMake would be loaded.</p>
<h2>Module dependency validation</h2>
<p>Vix now validates the relationship between registry packages and module link targets.</p>
<p>A module that declares a registry package but provides no corresponding link information may be incomplete. The package would be installed, but the module might never consume its exported target.</p>
<p>The opposite case is also checked. A module should not declare an external link target without a package requirement capable of providing it.</p>
<p>These checks do not assume that package names and target names must have identical spelling. They verify that the manifest contains a coherent dependency description and report incomplete metadata before CMake produces a less useful unresolved-target error.</p>
<p>Validation also covers malformed dependency entries and unsafe combinations inside the <code>[deps]</code> section.</p>
<h2>Project-level compatibility</h2>
<p>The existing root dependency workflow remains unchanged:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> add</span><span style="color:#9ECBFF"> rix/rix</span></span></code></pre><p>Without <code>--module</code>, the dependency is added to the root project as before.</p>
<p>The two forms now express different ownership:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> add</span><span style="color:#9ECBFF"> rix/rix</span></span></code></pre><p>means that the package belongs to the application dependency set directly.</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> add</span><span style="color:#9ECBFF"> rix/rix</span><span style="color:#79B8FF"> --module</span><span style="color:#9ECBFF"> auth</span></span></code></pre><p>means that the <code>auth</code> module owns the declaration and link relationship.</p>
<p>Both dependency sources are resolved into the same root lockfile.</p>
<h2>Application and module responsibilities</h2>
<p>The module dependency design keeps each project file responsible for one part of the workflow.</p>
<p><code>vix.app</code> determines which modules belong to the active application:</p>
<pre class="blog-code blog-code--plain"><code>[module.auth]
enabled = true
path = &quot;modules/auth&quot;
kind = &quot;service&quot;</code></pre><p><code>vix.module</code> describes the module itself and what it needs:</p>
<pre class="blog-code blog-code--plain"><code>name = &quot;auth&quot;
kind = &quot;service&quot;

[routes]
prefix = &quot;/api/auth&quot;

[deps]
registry = [
  &quot;rix/rix@^0.9.1&quot;,
]

links = [
  &quot;rix::rix&quot;,
]

[tests]
enabled = true</code></pre><p>The root <code>vix.lock</code> records the exact package resolution for the application and all enabled modules.</p>
<p><code>vix install</code> materializes that locked graph.</p>
<p><code>vix build</code> loads the resulting package targets before generating and compiling the active modules.</p>
<p>This model gives modules local ownership without turning them into independent package-management islands.</p>
<h2>Vix Note execution guards</h2>
<p>Vix Note executes C++ cells as native programs.</p>
<p>That is useful because a notebook can compile and run real C++ rather than evaluating a restricted approximation of the language. It also means the code can behave like any native program, including entering an infinite loop or writing output without stopping.</p>
<p>Before this release, a cell containing non-terminating code could leave the execution request waiting indefinitely. A program producing a very large stream of output could also consume memory and make the browser interface unresponsive.</p>
<p>Vix.cpp v2.7.2 adds timeout and output-size guards around C++ cell execution.</p>
<p>These safeguards do not attempt to prove whether a program is correct. They put practical limits around one notebook execution so a bad cell does not prevent the user from continuing to work.</p>
<h2>Execution timeout</h2>
<p>C++ cell execution now has a time limit.</p>
<p>When a program does not terminate before the configured deadline, Vix Note stops the child process and returns a controlled execution result.</p>
<p>This covers accidental infinite loops, blocked programs, and code waiting indefinitely for input or another condition that the notebook environment cannot satisfy.</p>
<p>The timeout applies to the execution process rather than compilation. Compiler diagnostics still return normally when the source does not build.</p>
<p>A timed-out program is reported as an execution failure, allowing the notebook to recover and accept another cell run.</p>
<h2>Output capture limit</h2>
<p>Vix Note now limits how much output can be captured from a C++ cell.</p>
<p>Consider this program:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#F97583">#include</span><span style="color:#9ECBFF"> &#x3C;iostream></span></span>
<span class="line"><span style="color:#F97583">#include</span><span style="color:#9ECBFF"> &#x3C;vector></span></span>
<span class="line"></span>
<span class="line"><span style="color:#F97583">int</span><span style="color:#B392F0"> main</span><span style="color:#E1E4E8">()</span></span>
<span class="line"><span style="color:#E1E4E8">{</span></span>
<span class="line"><span style="color:#B392F0">  std</span><span style="color:#E1E4E8">::vector</span><span style="color:#F97583">&#x3C;int></span><span style="color:#E1E4E8"> v;</span></span>
<span class="line"></span>
<span class="line"><span style="color:#F97583">  for</span><span style="color:#E1E4E8"> (</span><span style="color:#F97583">int</span><span style="color:#E1E4E8"> i </span><span style="color:#F97583">=</span><span style="color:#79B8FF"> 0</span><span style="color:#E1E4E8">; i </span><span style="color:#F97583">&#x3C;</span><span style="color:#E1E4E8"> v.</span><span style="color:#B392F0">size</span><span style="color:#E1E4E8">() </span><span style="color:#F97583">-</span><span style="color:#79B8FF"> 1</span><span style="color:#E1E4E8">; i</span><span style="color:#F97583">++</span><span style="color:#E1E4E8">)</span></span>
<span class="line"><span style="color:#E1E4E8">  {</span></span>
<span class="line"><span style="color:#B392F0">    std</span><span style="color:#E1E4E8">::cout </span><span style="color:#F97583">&#x3C;&#x3C;</span><span style="color:#E1E4E8"> i </span><span style="color:#F97583">&#x3C;&#x3C;</span><span style="color:#9ECBFF"> '</span><span style="color:#79B8FF">\\n</span><span style="color:#9ECBFF">'</span><span style="color:#E1E4E8">;</span></span>
<span class="line"><span style="color:#E1E4E8">  }</span></span>
<span class="line"></span>
<span class="line"><span style="color:#F97583">  return</span><span style="color:#79B8FF"> 0</span><span style="color:#E1E4E8">;</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span></code></pre><p><code>v.size()</code> returns an unsigned value. When the vector is empty, subtracting one underflows and produces a very large value.</p>
<p>The loop can therefore print far more output than the author expected.</p>
<p>Vix Note now stops the execution when captured output reaches the allowed limit. The oversized result is not sent in full to the browser.</p>
<p>This protects the server process, the HTTP response, and the notebook frontend from one unexpectedly noisy cell.</p>
<h2>Recoverable cell failures</h2>
<p>Timeout and output-limit failures are treated as failures of the current cell execution, not failures of the complete Note session.</p>
<p>The user can inspect the result, correct the source, and run the cell again.</p>
<p>This distinction is important in an interactive notebook. User code is expected to be incomplete or incorrect during development. The surrounding tool should contain those failures and remain usable.</p>
<p>The guards do not make arbitrary native code completely isolated. They address the two immediate cases that previously caused visible blocking: non-terminating execution and unbounded captured output.</p>
<h2>Warning cleanup</h2>
<p>Vix.cpp v2.7.2 also removes remaining compiler warnings from the affected code paths.</p>
<p>Vix Note runtime and web route code had sign-conversion warnings where signed and unsigned values crossed API boundaries.</p>
<p>The Note web server also contained socket-length conversions that could produce warnings on supported compilers and platforms.</p>
<p>These conversions are now handled explicitly.</p>
<p>Additional warnings across the Vix build were corrected so normal project compilation and CI logs remain focused on actionable problems.</p>
<p>A warning-free build is not only cosmetic. It makes new warnings visible when they are introduced and reduces the chance that unsafe conversions become accepted as ordinary build noise.</p>
<h2>Fixed workflow gaps</h2>
<p>This release fixes several failures that came from the incomplete connection between module manifests and the root dependency system.</p>
<p><code>vix add --module</code> now updates the root lockfile instead of leaving the project without a resolved dependency state.</p>
<p><code>vix install</code> now works when every registry dependency originates from modules and the root application contains no direct package declaration.</p>
<p>Generated builds load installed package targets before module CMake is evaluated.</p>
<p>Module link targets from <code>vix.module</code> are applied to the generated module that owns them.</p>
<p>Disabled modules no longer introduce inactive package requirements.</p>
<p>Together, these changes complete the path from declaration to compilation:</p>
<pre class="blog-code blog-code--plain"><code>vix.module
    ↓
root dependency resolution
    ↓
vix.lock
    ↓
vix install
    ↓
.vix/vix_deps.cmake
    ↓
module target links
    ↓
vix build</code></pre><h2>Validation</h2>
<p>Regression coverage was added for module dependency declaration, root lockfile generation, installation, CMake generation, and target linking.</p>
<p>The tests cover:</p>
<ul>
<li>adding a package with <code>--module</code>;</li>
<li>short <code>-m</code> syntax;</li>
<li>assignment-style <code>--module=&lt;name&gt;</code>;</li>
<li>explicit <code>--link</code>;</li>
<li>default target inference;</li>
<li>updates to the correct <code>vix.module</code>;</li>
<li>root lockfile creation and refresh;</li>
<li>dependencies from several enabled modules;</li>
<li>exclusion of disabled-module dependencies;</li>
<li>generation of module-specific link variables;</li>
<li>loading <code>.vix/vix_deps.cmake</code> before module targets;</li>
<li>successful resolution of package targets such as <code>rix::rix</code>;</li>
<li>invalid package and link declarations;</li>
<li>project-level <code>vix add</code> compatibility.</li>
</ul>
<p>Vix Note validation covers:</p>
<ul>
<li>non-terminating C++ cells;</li>
<li>processes exceeding the execution timeout;</li>
<li>programs producing excessive output;</li>
<li>output truncation before browser delivery;</li>
<li>recovery of the notebook after a guarded execution;</li>
<li>normal C++ cells completing inside the configured limits.</li>
</ul>
<p>The full project was also rebuilt after warning cleanup to verify that the updated code paths compile without the previous conversion warnings.</p>
<h2>Compatibility</h2>
<p>Existing projects with root registry dependencies continue to use the same <code>vix add</code>, <code>vix install</code>, and <code>vix build</code> workflow.</p>
<p>Existing modules without a <code>[deps]</code> section remain valid.</p>
<p>Module dependencies are additive. A project can keep shared dependencies at the root while moving feature-specific packages into the modules that use them.</p>
<p>The application continues to maintain one root <code>vix.lock</code>. This release does not introduce nested module lockfiles or separate dependency installations under each module directory.</p>
<p>Projects that disable a module may see its exclusive packages removed from the effective dependency graph the next time the root lockfile is refreshed. Re-enabling the module restores those requirements.</p>
<p>Vix Note continues to compile and run ordinary C++ cells normally. Timeout and output limits affect only executions that exceed the configured safety boundaries.</p>
<h2>Known limitations</h2>
<p>Module-level dependencies currently use the application’s registry dependency system. They do not make a module independently publishable or installable as a separate package.</p>
<p>The <code>links</code> list remains explicit metadata. Vix can infer common target names, but packages exposing several possible public targets may still require <code>--link</code>.</p>
<p>Dependencies are resolved globally, so incompatible version requirements from two enabled modules must be reconciled at the application level. Modules do not receive isolated package versions.</p>
<p>Vix Note execution guards limit runtime duration and captured output, but they are not a complete operating-system sandbox. Native code can still access resources permitted to the Vix Note process.</p>
<p>More advanced isolation, resource accounting, and interactive process control require additional runtime work beyond this release.</p>
<h2>Release summary</h2>
<p>Vix.cpp v2.7.2 gives App Modules ownership of their external package requirements without fragmenting the project dependency model.</p>
<p>A module can declare registry packages and CMake links in <code>vix.module</code>. Enabled module requirements are merged into the application graph, resolved through one root <code>vix.lock</code>, installed once, and linked only to the module that needs them.</p>
<p>The release also makes Vix Note more resilient when native C++ cells do not behave as expected. Execution timeouts and output limits keep an infinite loop or excessive output from blocking the notebook.</p>
<p>With the remaining compiler warnings removed, v2.7.2 provides a cleaner and more reliable foundation for the module and notebook workflows introduced in the v2.7 release line.</p>
`;
const v2_7_2 = {
  html
};
export {
  v2_7_2 as default,
  html
};
