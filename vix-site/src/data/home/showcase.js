export const showcase = {
  heading: "Describe a native C++ application in one small file",
  subheading:
    "Use vix.app to start real C++ projects with a readable manifest, then build and run them through the normal Vix.cpp workflow without writing CMake first.",
  visual: {
    fileName: "vix.app",
    code: `<span class="cpp-var">name</span> = <span class="cpp-string">"hello"</span>
<span class="cpp-var">type</span> = <span class="cpp-string">"executable"</span>
<span class="cpp-var">standard</span> = <span class="cpp-string">"c++20"</span>

<span class="cpp-var">sources</span> = [
  <span class="cpp-string">"src/main.cpp"</span>,
]

<span class="cpp-var">include_dirs</span> = [
  <span class="cpp-string">"include"</span>,
]`,
    terminal: `<span class="shell-prompt">$</span> <span class="shell-cmd">vix build</span>
✔ Built hello

<span class="shell-prompt">$</span> <span class="shell-cmd">vix run</span>
Hello from Vix.cpp`,
  },
  content: {
    title: "Start simple. Grow into a real C++ project.",
    badge: "vix.app",
    text: "vix.app is the application manifest for Vix.cpp. It describes your C++ target, sources, include directories, dependencies, and output while Vix generates the internal build project and keeps the workflow compatible with CMake.",
    cta: {
      label: "More about vix.app",
      to: "https://docs.vixcpp.com/guides/vix-app/",
    },
  },
};
