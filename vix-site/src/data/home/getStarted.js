export const getStarted = {
  title: "Start building native C++ applications with Vix.cpp",
  subtitle:
    "Create a project, build it, run it, and grow into backend services, realtime apps, CLI tools, production systems, or package-based C++ applications with one workflow.",
  code: `vix new api --app
cd api
vix build
vix run`,
  note: "Start with a simple C++ application, then add dev mode, packages, registry dependencies, tests, services, and deployment workflows as the project grows.",
  ctas: [
    { label: "Install Vix.cpp", to: "/install", kind: "primary" },
    {
      label: "View on GitHub",
      href: "https://github.com/vixcpp/vix",
      kind: "secondary",
      external: true,
    },
  ],
};
