export const registryShowcase = {
  title: "A package registry for modern C++ projects",
  badge: "Registry",
  text: "Use the Vix Registry to add C++ packages, lock exact versions, install dependencies, and keep builds reproducible with the normal Vix.cpp workflow.",
  cta: {
    label: "Explore Vix Registry",
    to: "https://registry.vixcpp.com",
  },
  cards: {
    top: {
      fileName: "vix.app",
      code: `<span class="cpp-var">name</span> = <span class="cpp-string">"api"</span>
<span class="cpp-var">type</span> = <span class="cpp-string">"executable"</span>
<span class="cpp-var">standard</span> = <span class="cpp-string">"c++20"</span>

<span class="cpp-var">sources</span> = [
  <span class="cpp-string">"src/main.cpp"</span>,
]

<span class="cpp-var">deps</span> = [
  <span class="cpp-string">"rix/rix"</span>,
]`,
    },
    bottom: {
      fileName: "terminal",
      code: `<span class="shell-path">~$</span> <span class="shell-cmd">vix registry sync</span>
<span class="shell-success">✔</span> Registry synchronized

<span class="shell-path">~$</span> <span class="shell-cmd">vix add</span> rix/rix
<span class="shell-success">✔</span> Added package

<span class="shell-path">~$</span> <span class="shell-cmd">vix install</span>
<span class="shell-success">✔</span> Dependencies installed

<span class="shell-path">~$</span> <span class="shell-cmd">vix build</span>
<span class="shell-success">✔</span> Build completed`,
    },
  },
};
