export const vixReply = {
  title: "Try real C++ interactively",
  badge: "Vix Reply",
  subtitle:
    "Vix Reply gives Vix.cpp an interactive REPL for expressions, variables, JSON values, runtime helpers, and real C++ snippets powered by the normal vix run pipeline.",
  cta: {
    label: "Read REPL docs",
    to: "https://docs.vixcpp.com/cli/repl",
  },
  terminal: {
    fileName: "terminal",
    code: `<span class="shell-path">~$</span> <span class="shell-cmd">vix</span>

<span class="shell-prompt">&gt;&gt;&gt;</span> :cpp
<span class="shell-success">C++ mode. Type :run to execute or :cancel to exit.</span>

<span class="shell-prompt">cpp&gt;</span> <span class="cpp-directive">#include</span> <span class="cpp-include">&lt;vix/print.hpp&gt;</span>
<span class="shell-prompt">...</span>   <span class="cpp-keyword">int</span> <span class="cpp-fn">main</span>() {
<span class="shell-prompt">...</span>     vix::print(<span class="cpp-string">"Hello from C++"</span>);
<span class="shell-prompt">...</span>   }

<span class="shell-success">Hello from C++</span>`,
  },
};
