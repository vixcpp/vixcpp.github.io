export const rixEcosystem = {
  title: "Rix: the userland library layer for Vix.cpp",
  badge: "Rix",
  subtitle:
    "Rix provides optional C++ libraries for Vix.cpp projects through the Vix Registry. Use packages independently or through one clean facade for auth, debug tools, CSV, PDF, and application-level APIs.",
  cta: {
    label: "Explore Rix",
    to: "https://rix.vixcpp.com",
  },
  cards: {
    install: {
      fileName: "terminal",
      code: `<span class="shell-path">~$</span> <span class="shell-cmd">vix registry sync</span>
<span class="shell-success">✔</span> Registry synchronized

<span class="shell-path">~$</span> <span class="shell-cmd">vix add</span> rix/rix
<span class="shell-success">✔</span> Added package

<span class="shell-path">~$</span> <span class="shell-cmd">vix install</span>
<span class="shell-success">✔</span> Dependencies installed`,
    },
    cpp: {
      fileName: "main.cpp",
      code: `<span class="cpp-directive">#include</span> <span class="cpp-include">&lt;rix.hpp&gt;</span>

<span class="cpp-keyword">int</span> <span class="cpp-fn">main</span>()
{
  rix.debug.print(<span class="cpp-string">"Hello from Rix"</span>);

  <span class="cpp-keyword">auto</span> auth = rix.auth.memory();

  <span class="cpp-keyword">auto</span> user = auth.register_user({
    <span class="cpp-string">"ada@example.com"</span>,
    <span class="cpp-string">"correct-password"</span>
  });

  <span class="cpp-keyword">if</span> (user.failed())
  {
    rix.debug.eprint(<span class="cpp-string">"auth failed"</span>);
    <span class="cpp-keyword">return</span> <span class="cpp-number">1</span>;
  }

  rix.debug.print(<span class="cpp-string">"registered:"</span>, user.value().email());

  <span class="cpp-keyword">return</span> <span class="cpp-number">0</span>;
}`,
    },
  },
};
