export const hero = {
  title: "A runtime for C++ applications.",

  description:
    "Vix.cpp provides a coherent way to build, run, and operate C++ applications throughout their lifecycle, while working with the C++ ecosystem you already use.",

  actions: [
    {
      label: "Get Started",
      href: "https://docs.vixcpp.com",
      primary: true,
      external: true,
    },
    {
      label: "GitHub",
      href: "https://github.com/vixcpp/vix",
      primary: false,
      external: true,
    },
  ],

  meta: ["Open source", "Works with existing CMake projects"],

  showcase: [
    {
      title: "From one file to a project.",
      description:
        "Run a C++ source file directly, or use Vix.cpp with a complete project.",
      points: [
        "Run a single .cpp file with vix run.",
        "Build and test project targets.",
        "Existing CMake projects can remain CMake-first.",
      ],
    },

    {
      title: "Manage project dependencies.",
      description:
        "Install and lock C++ dependencies without replacing the build system your project already uses.",
      points: [
        "Install Registry or Git dependencies.",
        "Use installed dependencies from existing CMake projects.",
        "Keep resolved dependency state in vix.lock.",
      ],
    },

    {
      title: "From build to production.",
      description:
        "Build, deploy, and operate C++ backend applications through the Vix.cpp workflow.",
      points: [
        "Deploy with vix deploy.",
        "Manage services, reverse proxies and health checks.",
        "Inspect production state and logs with vix.",
      ],
    },
  ],
};
