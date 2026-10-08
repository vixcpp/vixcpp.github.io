const html = `<h1>How Vix Turns C++ Errors Into Actionable Diagnostics</h1>
<p>C++ is powerful because it gives developers direct control over memory, ownership, templates, concurrency, system calls, and runtime behavior.
That power also comes with a cost.
When something goes wrong, the error is often technically correct but difficult to act on:</p>
<pre class="blog-code blog-code--plain"><code>terminate called after throwing an instance of 'std::runtime_error'
Aborted (core dumped)</code></pre><p>Or:</p>
<pre class="blog-code blog-code--plain"><code>use of deleted function</code></pre><p>Or:</p>
<pre class="blog-code blog-code--plain"><code>no matching function for call to ...</code></pre><p>Or:</p>
<pre class="blog-code blog-code--plain"><code>AddressSanitizer: heap-use-after-free</code></pre><p>The compiler, sanitizer, or runtime usually knows what failed.
But it does not always present the failure in a way that helps the developer fix the code immediately.
Vix.cpp treats this as a core developer experience problem.
The goal is not to hide C++.
The goal is to make C++ errors explain themselves.</p>
<h2>The problem with raw C++ errors</h2>
<p>C++ errors usually come from several different layers:</p>
<ul>
<li>compiler</li>
<li>template instantiation</li>
<li>concept constraints</li>
<li>linker</li>
<li>runtime exception</li>
<li><code>std::terminate</code></li>
<li>sanitizers</li>
<li>operating system</li>
<li>filesystem</li>
<li>network</li>
<li>threading runtime</li>
</ul>
<p>Each layer speaks a different language.
A template error may expose implementation details from <code>&lt;type_traits&gt;</code> or <code>&lt;concepts&gt;</code>.
A runtime crash may only say <code>Aborted</code>.</p>
<p>A sanitizer report may contain the correct stack trace, but the important user frame can be buried inside a large log.
A filesystem error may be technically clear but not mapped to the line of user code that triggered it.
Vix tries to normalize these failures into one shape:</p>
<ul>
<li>error type</li>
<li>source location</li>
<li>code frame</li>
<li>human hint</li>
<li>raw log excerpt when needed</li>
</ul>
<p>The output should answer four questions quickly:</p>
<ul>
<li>What happened?</li>
<li>Where did it happen?</li>
<li>Why did it probably happen?</li>
<li>What should I check next?</li>
</ul>
<h2>The diagnostic pipeline</h2>
<p>Vix error handling is built as a rule-based diagnostic pipeline.
There are three major families:</p>
<ul>
<li>build/compiler diagnostics</li>
<li>template and modern C++ diagnostics</li>
<li>runtime diagnostics</li>
</ul>
<p>Each diagnostic rule is small, focused, and responsible for one family of errors.
A rule generally does four things:</p>
<ol>
<li>detect whether a log or compiler error belongs to its family</li>
<li>classify the specific subtype when possible</li>
<li>locate the best source line</li>
<li>print a code frame and actionable hint</li>
</ol>
<p>This makes the system extensible.
Instead of one large error parser trying to understand all of C++, Vix uses many precise rules.</p>
<h2>Runtime diagnostics</h2>
<p>Runtime errors are the hardest because they can come from undefined behavior, exceptions, operating system failures, sanitizers, or library-specific failures.
Vix currently handles the following runtime families.</p>
<h2>Process termination and aborts</h2>
<ul>
<li><code>AbortRule</code></li>
<li><code>ThreadJoinableRule</code></li>
<li><code>UncaughtExceptionRuntimeRule</code></li>
</ul>
<p>These rules handle errors such as:</p>
<ul>
<li><code>std::terminate</code> called</li>
<li><code>terminate called after throwing an instance of ...</code></li>
<li><code>terminate called without an active exception</code></li>
<li><code>Aborted (core dumped)</code></li>
<li><code>SIGABRT</code></li>
<li>joinable <code>std::thread</code> destroyed</li>
</ul>
<p>A raw abort is often too generic.</p>
<p>For example, this output is not enough:</p>
<pre class="blog-code blog-code--plain"><code>terminate called after throwing an instance of 'std::runtime_error'
Aborted (core dumped)</code></pre><p>Vix extracts the actual exception reason when available:</p>
<pre class="blog-code blog-code--plain"><code>what(): Failed to load environment configuration:
failed to parse .env content at line 1: invalid .env line: key is invalid</code></pre><p>Then it can point to the real file:</p>
<pre class="blog-code blog-code--plain"><code>runtime error: environment configuration parse failed

--&gt; /home/softadastra/tmp/.env:1:1
code:
  1 | production.websocket.host=127.0.0.1
      ^
  2 | production.websocket.port=9090
  3 | production.websocket.path=/ws

hint: fix the invalid environment file line; use KEY=value with a valid key name
at: /home/softadastra/tmp/.env:1</code></pre><p>That is the kind of diagnostic Vix is designed to produce.</p>
<p>Not just:</p>
<pre class="blog-code blog-code--plain"><code>std::terminate called</code></pre><p>But:</p>
<pre class="blog-code blog-code--plain"><code>this exact config file has an invalid key on line 1</code></pre><h2>Memory safety diagnostics</h2>
<p>C++ memory bugs are often catastrophic.
Vix recognizes the most common memory safety families:</p>
<ul>
<li><code>DoubleFreeRule</code></li>
<li><code>InvalidFreeRule</code></li>
<li><code>UseAfterFreeRule</code></li>
<li><code>MemoryLeakRule</code></li>
<li><code>BufferOverflowRule</code></li>
<li><code>StackOverflowRule</code></li>
<li><code>NullPointerRule</code></li>
<li><code>MisalignedAccessRule</code></li>
</ul>
<p>These rules handle logs from libc, AddressSanitizer, UndefinedBehaviorSanitizer, and raw crashes.</p>
<p>Examples:</p>
<ul>
<li>double free</li>
<li>invalid free</li>
<li>heap-use-after-free</li>
<li>stack-use-after-scope</li>
<li>heap-buffer-overflow</li>
<li>stack-buffer-overflow</li>
<li>global-buffer-overflow</li>
<li>stack overflow</li>
<li>null pointer dereference</li>
<li>misaligned memory access</li>
</ul>
<p>The important design choice is that Vix avoids overly broad matches.
For example, <code>InvalidFreeRule</code> does not trigger on <code>invalid pointer</code> alone, because that phrase can appear in unrelated contexts.</p>
<p>It requires stronger signals such as:</p>
<ul>
<li><code>free(): invalid pointer</code></li>
<li><code>munmap_chunk(): invalid pointer</code></li>
<li><code>bad-free</code></li>
<li><code>AddressSanitizer</code> + attempting free</li>
<li><code>AddressSanitizer</code> + not malloc()-ed</li>
</ul>
<p>This reduces false positives.</p>
<p>For memory bugs, Vix also keeps the raw sanitizer excerpt visible because the sanitizer often contains multiple important locations:</p>
<ul>
<li>allocation site</li>
<li>free site</li>
<li>invalid use site</li>
<li>thread creation site</li>
</ul>
<p>A friendly diagnostic should simplify the report without hiding evidence.</p>
<h2>Container and iterator diagnostics</h2>
<p>STL errors are common in real C++ code.</p>
<p>Vix handles:</p>
<ul>
<li><code>EmptyContainerFrontBackRule</code></li>
<li><code>OutOfRangeAccessRule</code></li>
<li><code>InvalidIteratorDereferenceRule</code></li>
<li><code>IteratorInvalidationRule</code></li>
</ul>
<p>These rules detect problems like:</p>
<ul>
<li><code>front()</code> on empty container</li>
<li><code>back()</code> on empty container</li>
<li><code>pop_front()</code> on empty container</li>
<li><code>pop_back()</code> on empty container</li>
<li><code>top()</code> on empty container</li>
<li>vector out-of-range access</li>
<li>string out-of-range access</li>
<li><code>map::at</code> missing key</li>
<li><code>unordered_map::at</code> missing key</li>
<li>invalid iterator dereference</li>
<li>end iterator dereference</li>
<li>singular iterator dereference</li>
<li>iterator invalidated by erase</li>
<li>iterator invalidated by reallocation</li>
</ul>
<p>These are especially useful with debug STL modes and sanitizers.
For example, raw STL diagnostics may say:</p>
<pre class="blog-code blog-code--plain"><code>attempt to dereference a singular iterator</code></pre><p>Vix turns that into:</p>
<pre class="blog-code blog-code--plain"><code>runtime error: singular iterator dereference
hint: initialize the iterator and refresh it after erase, insert, resize, reserve, or container reallocation</code></pre><p>The goal is not to replace the STL diagnostic.
The goal is to translate it into an immediate correction path.</p>
<h2>Ownership and lifetime diagnostics</h2>
<p>Modern C++ reduces many memory bugs through RAII, but lifetime mistakes still happen.
Vix currently handles:</p>
<ul>
<li><code>StringViewDanglingRuntimeRule</code></li>
<li><code>SpanLifetimeRule</code></li>
<li><code>DetachedThreadLifetimeRule</code></li>
<li><code>UseAfterFreeRule</code></li>
<li><code>NullPointerRule</code></li>
</ul>
<p>These rules catch patterns such as:</p>
<ul>
<li>dangling <code>std::string_view</code></li>
<li><code>std::string_view</code> outlived local string data</li>
<li><code>std::string_view</code> points to freed memory</li>
<li><code>std::span</code> outlived local storage</li>
<li><code>std::span</code> invalidated by vector reallocation</li>
<li>detached thread captured expired stack data</li>
<li>detached thread used freed memory</li>
</ul>
<p>These diagnostics are important because <code>std::string_view</code> and <code>std::span</code> do not own memory.
They are safe only when the underlying storage outlives the view.
This is valid:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">std</span><span style="color:#E1E4E8">::string name </span><span style="color:#F97583">=</span><span style="color:#9ECBFF"> "vix"</span><span style="color:#E1E4E8">;</span></span>
<span class="line"><span style="color:#B392F0">std</span><span style="color:#E1E4E8">::string_view view </span><span style="color:#F97583">=</span><span style="color:#E1E4E8"> name;</span></span></code></pre><p>This is dangerous:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">std</span><span style="color:#E1E4E8">::</span><span style="color:#B392F0">string_view</span><span style="color:#B392F0"> make_name</span><span style="color:#E1E4E8">()</span></span>
<span class="line"><span style="color:#E1E4E8">{</span></span>
<span class="line"><span style="color:#B392F0">  std</span><span style="color:#E1E4E8">::string name </span><span style="color:#F97583">=</span><span style="color:#9ECBFF"> "vix"</span><span style="color:#E1E4E8">;</span></span>
<span class="line"><span style="color:#F97583">  return</span><span style="color:#E1E4E8"> name;</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span></code></pre><p>The compiler may not catch this.
A sanitizer may catch it later.
Vix turns that runtime failure into a lifetime-focused diagnostic.</p>
<h2>Concurrency diagnostics</h2>
<p>Concurrency bugs are among the hardest C++ problems to debug.
Vix handles several families:</p>
<ul>
<li><code>DataRaceRule</code></li>
<li><code>DeadlockRule</code></li>
<li><code>MutexMisuseRule</code></li>
<li><code>ConditionVariableMisuseRule</code></li>
<li><code>ThreadCreationFailureRule</code></li>
<li><code>ThreadJoinableRule</code></li>
<li><code>DetachedThreadLifetimeRule</code></li>
<li><code>FuturePromiseRule</code></li>
</ul>
<p>These rules cover:</p>
<ul>
<li>data race</li>
<li>lock-order inversion</li>
<li>deadlock</li>
<li>resource deadlock avoided</li>
<li>invalid mutex unlock</li>
<li>mutex used after destruction</li>
<li>condition variable wait without lock</li>
<li>condition variable destroyed while still in use</li>
<li>thread resource limit reached</li>
<li><code>pthread_create</code> failed</li>
<li>joinable <code>std::thread</code> destroyed</li>
<li>broken promise</li>
<li>promise already satisfied</li>
<li>future already retrieved</li>
<li>future has no associated state</li>
</ul>
<p>Concurrency diagnostics must be careful.</p>
<p>For example, a ThreadSanitizer data race report usually has at least two important locations:</p>
<ul>
<li>current read/write</li>
<li>previous conflicting read/write</li>
<li>thread creation site</li>
</ul>
<p>Vix does not hide that log.</p>
<p>Instead, it prints a short human explanation and keeps the runtime log excerpt visible:</p>
<pre class="blog-code blog-code--plain"><code>runtime error: data race between read and write

hint: protect every read and write of the shared value with the same mutex, or make the value atomic
hint: do not ignore the runtime log: data races usually require comparing both conflicting stack traces</code></pre><p>This is important because data races are not single-line bugs.
They are relationship bugs between multiple execution paths.</p>
<h2>Arithmetic and undefined behavior diagnostics</h2>
<p>Vix also handles common undefined behavior families:</p>
<ul>
<li><code>DivisionByZeroRule</code></li>
<li><code>IntegerOverflowRule</code></li>
<li><code>UninitializedMemoryRule</code></li>
<li><code>MisalignedAccessRule</code></li>
<li><code>InvalidCastRule</code></li>
<li><code>PureVirtualCallRule</code></li>
</ul>
<p>These detect errors such as:</p>
<ul>
<li>division by zero</li>
<li><code>SIGFPE</code></li>
<li>signed integer overflow</li>
<li>invalid shift</li>
<li>use of uninitialized value</li>
<li>misaligned address</li>
<li>invalid vptr</li>
<li>bad dynamic cast</li>
<li><code>bad_any_cast</code></li>
<li><code>bad_variant_access</code></li>
<li>pure virtual function call</li>
</ul>
<p>These are often reported by UBSan, MSan, or the C++ runtime.
A raw UBSan message may be correct, but Vix makes the output more directly actionable:</p>
<pre class="blog-code blog-code--plain"><code>runtime error: signed integer overflow
hint: use wider integer types or check bounds before arithmetic</code></pre><p>Or:</p>
<pre class="blog-code blog-code--plain"><code>runtime error: pure virtual function call
hint: avoid calling virtual functions from constructors/destructors or after object destruction</code></pre><p>These diagnostics matter because many undefined behavior bugs do not fail immediately in release mode.
They may silently corrupt program behavior.</p>
<h2>Filesystem, network, and OS diagnostics</h2>
<p>Not every runtime error is memory-related.
Vix also handles operational failures:</p>
<ul>
<li><code>FilesystemRuntimeRule</code></li>
<li><code>PermissionDeniedRule</code></li>
<li><code>AddressAlreadyInUseRule</code></li>
<li><code>BrokenPipeRule</code></li>
<li><code>TimeoutRuntimeRule</code></li>
<li><code>JsonParseRuntimeRule</code></li>
<li><code>ConfigParseRuntimeRule</code></li>
</ul>
<p>These cover:</p>
<ul>
<li>filesystem error</li>
<li>file not found</li>
<li>path is not a directory</li>
<li>path already exists</li>
<li>permission denied</li>
<li>address already in use</li>
<li>port already in use</li>
<li>broken pipe</li>
<li>connection reset by peer</li>
<li>operation timed out</li>
<li>JSON parse failed</li>
<li>environment configuration parse failed</li>
</ul>
<p>This matters because C++ applications increasingly behave like systems software:</p>
<ul>
<li>servers</li>
<li>CLIs</li>
<li>build tools</li>
<li>package managers</li>
<li>database clients</li>
<li>network runtimes</li>
<li>edge applications</li>
<li>offline-first systems</li>
</ul>
<p>A good C++ runtime should explain not only pointer errors, but also system-level failures.</p>
<p>Example:</p>
<pre class="blog-code blog-code--plain"><code>runtime error: address already in use
hint: port 8080 is already in use; stop the other process or change the port</code></pre><p>Or:</p>
<pre class="blog-code blog-code--plain"><code>runtime error: broken pipe
hint: the peer closed the connection before the write completed; handle disconnects and retry only when safe</code></pre><p>This is not language-level C++ only.
It is production C++.</p>
<h2>Template and modern C++ diagnostics</h2>
<p>Runtime diagnostics are only one side.
C++ also has extremely complex compile-time errors, especially around templates, concepts, overload resolution, coroutines, ownership types, and modern library features.
Vix currently handles these template and modern C++ families:</p>
<ul>
<li><code>DependentTypenameRule</code></li>
<li><code>NoTypeNamedRule</code></li>
<li><code>TemplateArgumentMismatchRule</code></li>
<li><code>InvalidTemplateTemplateArgumentRule</code></li>
<li><code>CtadFailureRule</code></li>
<li><code>RequiresExpressionFailureRule</code></li>
<li><code>ConceptConstraintFailureRule</code></li>
<li><code>NoMatchingOverloadWithConstraintsRule</code></li>
<li><code>SubstitutionFailureRule</code></li>
<li><code>StaticAssertFailureRule</code></li>
<li><code>ConstexprEvaluationFailureRule</code></li>
<li><code>MoveOnlyCopyRule</code></li>
<li><code>DeletedFunctionRule</code></li>
<li><code>PrivateConstructorRule</code></li>
<li><code>InaccessibleMemberRule</code></li>
<li><code>IncompleteTypeRule</code></li>
<li><code>NoViableConversionRule</code></li>
<li><code>ConstQualifierRule</code></li>
<li><code>InvalidReferenceBindingRule</code></li>
<li><code>InvalidInitializerListRule</code></li>
<li><code>NarrowingConversionRule</code></li>
<li><code>MissingBeginEndRule</code></li>
<li><code>OperatorNotFoundRule</code></li>
<li><code>AllocatorValueTypeMismatchRule</code></li>
<li><code>TupleVariantAccessRule</code></li>
<li><code>InvalidUseOfVoidRule</code></li>
<li><code>LambdaCaptureLifetimeRule</code></li>
<li><code>NonVirtualDestructorDeleteRule</code></li>
<li><code>ObjectSlicingRule</code></li>
<li><code>BadOverrideRule</code></li>
<li><code>InvalidDowncastRule</code></li>
<li><code>CoroutineReturnTypeRule</code></li>
<li><code>MissingCoReturnRule</code></li>
<li><code>InvalidAwaitableRule</code></li>
<li><code>NoMemberAwaitReadyRule</code></li>
<li><code>NoMemberAwaitSuspendRule</code></li>
<li><code>NoMemberAwaitResumeRule</code></li>
<li><code>InvalidPromiseTypeRule</code></li>
</ul>
<p>This is a large part of the C++ developer experience problem.
A beginner may struggle with:</p>
<ul>
<li>missing semicolon</li>
<li>header not found</li>
<li><code>cout</code> not declared</li>
</ul>
<p>But an experienced C++ developer often loses time on:</p>
<ul>
<li>substitution failure</li>
<li>failed constraint</li>
<li>requires-expression failure</li>
<li>invalid awaitable</li>
<li>bad override</li>
<li>deleted copy constructor</li>
<li>CTAD failure</li>
<li><code>static_assert</code> failure</li>
<li><code>consteval</code>/<code>constexpr</code> failure</li>
<li>invalid template template argument</li>
</ul>
<p>Vix aims to make those failures readable.</p>
<h2>Concepts and constraints</h2>
<p>Modern C++ uses concepts to encode requirements.
When constraints fail, the compiler often emits a long instantiation trace.</p>
<p>Vix recognizes:</p>
<ul>
<li><code>ConceptConstraintFailureRule</code></li>
<li><code>RequiresExpressionFailureRule</code></li>
<li><code>NoMatchingOverloadWithConstraintsRule</code></li>
<li><code>SubstitutionFailureRule</code></li>
</ul>
<p>These diagnostics focus on the actual missing requirement.
Instead of leaving the user with a long template backtrace, Vix tries to produce a message closer to:</p>
<pre class="blog-code blog-code--plain"><code>error: concept constraint failed
hint: check which required expression, type, or operation is not satisfied</code></pre><p>This is especially important for libraries that use heavily constrained APIs.</p>
<h2>Coroutine diagnostics</h2>
<p>C++ coroutines have very specific rules.
A coroutine type must expose the right promise type and awaitable operations.
Vix recognizes:</p>
<ul>
<li><code>CoroutineReturnTypeRule</code></li>
<li><code>MissingCoReturnRule</code></li>
<li><code>InvalidAwaitableRule</code></li>
<li><code>InvalidPromiseTypeRule</code></li>
<li><code>NoMemberAwaitReadyRule</code></li>
<li><code>NoMemberAwaitSuspendRule</code></li>
<li><code>NoMemberAwaitResumeRule</code></li>
</ul>
<p>These cover errors like:</p>
<ul>
<li>missing <code>co_return</code></li>
<li>invalid coroutine return type</li>
<li><code>promise_type</code> missing</li>
<li><code>await_ready</code> missing</li>
<li><code>await_suspend</code> missing</li>
<li><code>await_resume</code> missing</li>
</ul>
<p>The goal is to map coroutine compiler errors back to the coroutine mental model:</p>
<ul>
<li><code>promise_type</code></li>
<li><code>co_await</code> protocol</li>
<li><code>co_return</code></li>
<li><code>await_ready</code></li>
<li><code>await_suspend</code></li>
<li><code>await_resume</code></li>
</ul>
<h2>Ownership diagnostics at compile time</h2>
<p>Some ownership bugs are runtime bugs.
Others are visible at compile time.
Vix handles compile-time ownership patterns such as:</p>
<ul>
<li><code>MoveOnlyCopyRule</code></li>
<li><code>DeletedFunctionRule</code></li>
<li><code>NonVirtualDestructorDeleteRule</code></li>
<li><code>ObjectSlicingRule</code></li>
<li><code>InvalidDowncastRule</code></li>
<li><code>LambdaCaptureLifetimeRule</code></li>
</ul>
<p>These help with errors like:</p>
<ul>
<li>copying <code>std::unique_ptr</code></li>
<li>copying <code>std::thread</code></li>
<li>copying a move-only type</li>
<li>deleting derived object through non-virtual base destructor</li>
<li>object slicing</li>
<li>invalid downcast</li>
<li>lambda captures unsafe reference</li>
</ul>
<p>For example, a raw compiler error might say:</p>
<pre class="blog-code blog-code--plain"><code>use of deleted function 'std::unique_ptr&lt;T&gt;::unique_ptr(const std::unique_ptr&lt;T&gt;&amp;)'</code></pre><p>Vix can turn that into:</p>
<pre class="blog-code blog-code--plain"><code>error: copy of move-only type
hint: use std::move, pass by reference, or delete copying intentionally</code></pre><p>This is better because it explains the C++ rule, not only the failed symbol.</p>
<h2>Why ordering matters</h2>
<p>The diagnostic pipeline is ordered.
This matters because many errors overlap.
For example:</p>
<pre class="blog-code blog-code--plain"><code>std::out_of_range</code></pre><p>could be handled by a generic uncaught exception rule.
But a better rule exists:</p>
<pre class="blog-code blog-code--plain"><code>OutOfRangeAccessRule</code></pre><p>So the specialized rule must run first.
Another example:</p>
<pre class="blog-code blog-code--plain"><code>failed to parse .env content at line 1</code></pre><p>could be seen as an uncaught <code>std::runtime_error</code>.
But the better rule is:</p>
<pre class="blog-code blog-code--plain"><code>ConfigParseRuntimeRule</code></pre><p>So it must run before generic exception handling.
The same applies to memory errors:</p>
<pre class="blog-code blog-code--plain"><code>AddressSanitizer: heap-use-after-free</code></pre><p>should be handled by:</p>
<pre class="blog-code blog-code--plain"><code>UseAfterFreeRule</code></pre><p>not by a generic segfault or abort rule.
This is why Vix keeps broad fallback rules at the end:</p>
<ul>
<li><code>SegfaultRule</code></li>
<li><code>AbortRule</code></li>
</ul>
<p>They are still useful, but only when no better rule can explain the failure.</p>
<h2>Avoiding false positives</h2>
<p>Good diagnostics are not only about matching more errors.
They are also about avoiding wrong explanations.
Vix rules are intentionally conservative.</p>
<p>Examples:</p>
<p><code>InvalidFreeRule</code> does not match <code>invalid pointer</code> alone, because that phrase is too generic.
<code>BrokenPipeRule</code> does not match <code>write failed</code> alone unless socket, stream, or connection context is present.
<code>JsonParseRuntimeRule</code> does not match <code>unexpected token</code> unless JSON context is present.
<code>FilesystemRuntimeRule</code> steps aside when permission-specific signals are present, so <code>PermissionDeniedRule</code> can produce the better message.
This is important.</p>
<p>A wrong friendly diagnostic is worse than a raw compiler error.</p>
<h2>The role of raw logs</h2>
<p>Vix does not try to hide the original compiler, sanitizer, or runtime log.
Instead, it gives a better first explanation and keeps the relevant log excerpt visible.
This is especially important for:</p>
<ul>
<li>data races</li>
<li>deadlocks</li>
<li>use-after-free</li>
<li>double free</li>
<li>buffer overflows</li>
<li>template substitution failures</li>
<li>concept failures</li>
<li>uncaught exceptions</li>
</ul>
<p>Many advanced C++ failures cannot be fully explained from a single line.
The diagnostic should guide the developer without removing the original evidence.</p>
<h2>What this means for Vix</h2>
<p>Vix is not only a build tool.
Vix is becoming a C++ runtime and developer system that understands the failure modes of real C++ programs.
That includes:</p>
<ul>
<li>compilation</li>
<li>templates</li>
<li>concepts</li>
<li>coroutines</li>
<li>ownership</li>
<li>memory safety</li>
<li>threading</li>
<li>filesystem</li>
<li>networking</li>
<li>configuration</li>
<li>runtime crashes</li>
<li>sanitizers</li>
</ul>
<p>The goal is simple:
C++ should remain powerful.
The error experience should become humane.</p>
<p>A developer should not need to decode a 200-line template trace just to understand that a type is missing <code>begin()</code>.</p>
<p>A developer should not only see <code>Aborted (core dumped)</code> when the real issue is line 1 of <code>.env</code>.
A developer should not lose time guessing whether a crash is a null pointer, use-after-free, invalid iterator, or joinable thread destruction.
Vix gives the error a name, a location, and a next step.</p>
<h2>Current diagnostic families managed by Vix</h2>
<h3>Runtime families</h3>
<ul>
<li><code>AbortRule</code></li>
<li><code>ThreadJoinableRule</code></li>
<li><code>UncaughtExceptionRuntimeRule</code></li>
<li><code>DataRaceRule</code></li>
<li><code>DeadlockRule</code></li>
<li><code>ConditionVariableMisuseRule</code></li>
<li><code>MutexMisuseRule</code></li>
<li><code>FuturePromiseRule</code></li>
<li><code>ThreadCreationFailureRule</code></li>
<li><code>DetachedThreadLifetimeRule</code></li>
<li><code>DoubleFreeRule</code></li>
<li><code>InvalidFreeRule</code></li>
<li><code>UseAfterFreeRule</code></li>
<li><code>MemoryLeakRule</code></li>
<li><code>BufferOverflowRule</code></li>
<li><code>StackOverflowRule</code></li>
<li><code>NullPointerRule</code></li>
<li><code>DivisionByZeroRule</code></li>
<li><code>IntegerOverflowRule</code></li>
<li><code>UninitializedMemoryRule</code></li>
<li><code>MisalignedAccessRule</code></li>
<li><code>InvalidCastRule</code></li>
<li><code>PureVirtualCallRule</code></li>
<li><code>EmptyContainerFrontBackRule</code></li>
<li><code>OutOfRangeAccessRule</code></li>
<li><code>InvalidIteratorDereferenceRule</code></li>
<li><code>IteratorInvalidationRule</code></li>
<li><code>StringViewDanglingRuntimeRule</code></li>
<li><code>SpanLifetimeRule</code></li>
<li><code>FilesystemRuntimeRule</code></li>
<li><code>PermissionDeniedRule</code></li>
<li><code>AddressAlreadyInUseRule</code></li>
<li><code>BrokenPipeRule</code></li>
<li><code>TimeoutRuntimeRule</code></li>
<li><code>JsonParseRuntimeRule</code></li>
<li><code>ConfigParseRuntimeRule</code></li>
<li><code>SegfaultRule</code></li>
</ul>
<h3>Template and modern C++ families</h3>
<ul>
<li><code>DependentTypenameRule</code></li>
<li><code>NoTypeNamedRule</code></li>
<li><code>TemplateArgumentMismatchRule</code></li>
<li><code>InvalidTemplateTemplateArgumentRule</code></li>
<li><code>CtadFailureRule</code></li>
<li><code>RequiresExpressionFailureRule</code></li>
<li><code>ConceptConstraintFailureRule</code></li>
<li><code>NoMatchingOverloadWithConstraintsRule</code></li>
<li><code>SubstitutionFailureRule</code></li>
<li><code>StaticAssertFailureRule</code></li>
<li><code>ConstexprEvaluationFailureRule</code></li>
<li><code>MoveOnlyCopyRule</code></li>
<li><code>DeletedFunctionRule</code></li>
<li><code>PrivateConstructorRule</code></li>
<li><code>InaccessibleMemberRule</code></li>
<li><code>IncompleteTypeRule</code></li>
<li><code>NoViableConversionRule</code></li>
<li><code>ConstQualifierRule</code></li>
<li><code>InvalidReferenceBindingRule</code></li>
<li><code>InvalidInitializerListRule</code></li>
<li><code>NarrowingConversionRule</code></li>
<li><code>MissingBeginEndRule</code></li>
<li><code>OperatorNotFoundRule</code></li>
<li><code>AllocatorValueTypeMismatchRule</code></li>
<li><code>TupleVariantAccessRule</code></li>
<li><code>InvalidUseOfVoidRule</code></li>
<li><code>LambdaCaptureLifetimeRule</code></li>
<li><code>NonVirtualDestructorDeleteRule</code></li>
<li><code>ObjectSlicingRule</code></li>
<li><code>BadOverrideRule</code></li>
<li><code>InvalidDowncastRule</code></li>
<li><code>CoroutineReturnTypeRule</code></li>
<li><code>MissingCoReturnRule</code></li>
<li><code>InvalidAwaitableRule</code></li>
<li><code>NoMemberAwaitReadyRule</code></li>
<li><code>NoMemberAwaitSuspendRule</code></li>
<li><code>NoMemberAwaitResumeRule</code></li>
<li><code>InvalidPromiseTypeRule</code></li>
</ul>
<h3>Beginner and common compile-time families</h3>
<ul>
<li><code>CoutNotDeclaredRule</code></li>
<li><code>HeaderNotFoundRule</code></li>
<li><code>MissingSemicolonRule</code></li>
<li><code>VectorOstreamRule</code></li>
<li><code>ProcessNullptrAmbiguityRule</code></li>
<li><code>UniquePtrCopyRule</code></li>
<li><code>SharedPtrRawPtrMisuseRule</code></li>
<li><code>DeleteMismatchRule</code></li>
<li><code>UseAfterMoveRule</code></li>
<li><code>DanglingStringViewRule</code></li>
<li><code>ReturnLocalRefRule</code></li>
<li><code>UseOfUninitializedRule</code></li>
</ul>
<h2>Conclusion</h2>
<p>C++ does not need to become less powerful to become more accessible.
The language can stay explicit, native, and close to the system.
But the tooling around it should be better.
Vix.cpp is building that layer.
A layer that understands C++ errors.
A layer that turns raw compiler output, runtime crashes, and sanitizer logs into diagnostics developers can act on immediately.
That is the direction:</p>
<ul>
<li>less guessing</li>
<li>less hidden context</li>
<li>better source locations</li>
<li>better hints</li>
<li>better C++ developer experience</li>
</ul>
<p>C++ errors should not only be correct.
They should be useful.</p>
`;
const vixErrorDiagnostics = {
  html
};
export {
  vixErrorDiagnostics as default,
  html
};
