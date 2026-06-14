export const registryShowcase = {
  title: "Packages without the friction",
  badge: "Registry",
  text: "Add dependencies, lock versions, install packages, and reuse cached builds with a predictable C++ workflow.",
  cta: {
    label: "Explore Vix Registry",
    to: "https://registry.vixcpp.com",
  },
  cards: {
    top: {
      fileName: "vix.app",
      code: `<span class="cpp-var">name</span> = <span class="cpp-string">api</span>
<span class="cpp-var">type</span> = <span class="cpp-string">executable</span>
<span class="cpp-var">standard</span> = <span class="cpp-string">c++20</span>

<span class="cpp-var">sources</span> = [
  <span class="cpp-string">src/main.cpp</span>,
]

<span class="cpp-var">deps</span> = [
  <span class="cpp-string">@softadastra/json</span>,
]`,
    },
    bottom: {
      fileName: "terminal",
      code: `<span class="shell-path">~$</span> <span class="shell-cmd">vix add</span> @softadastra/json
<span class="shell-success">✔</span> Added package

<span class="shell-path">~$</span> <span class="shell-cmd">vix install</span>
<span class="shell-success">✔</span> Dependencies installed

<span class="shell-path">~$</span> <span class="shell-cmd">vix build</span>
<span class="shell-success">✔</span> Build completed`,
    },
  },
};
