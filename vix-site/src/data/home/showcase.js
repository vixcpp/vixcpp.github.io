export const showcase = {
  heading: "Describe a C++ app in one small file",
  subheading:
    "Use vix.app to start real C++ projects without writing CMake configuration first.",
  visual: {
    fileName: "vix.app",
    code: `<span class="cpp-var">name</span> = <span class="cpp-string">hello</span>
<span class="cpp-var">type</span> = <span class="cpp-string">executable</span>
<span class="cpp-var">standard</span> = <span class="cpp-string">c++20</span>

<span class="cpp-var">sources</span> = [
  <span class="cpp-string">src/main.cpp</span>,
]

<span class="cpp-var">include_dirs</span> = [
  <span class="cpp-string">include</span>,
]`,
    terminal: `<span class="shell-prompt">$</span> <span class="shell-cmd">vix build</span>
✔ Built hello

<span class="shell-prompt">$</span> <span class="shell-cmd">vix run</span>
Hello from Vix`,
  },
  content: {
    title: "Start simple. Grow when needed.",
    badge: "vix.app",
    text: "vix.app lets you describe a C++ application with a small manifest. Vix generates the internal build project and keeps the workflow simple while staying compatible with CMake.",
    cta: {
      label: "More about vix.app",
      to: "https://docs.vixcpp.com/vix-app/",
    },
  },
};
