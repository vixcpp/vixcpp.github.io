export const getStarted = {
  title: "Start building fast and reliable C++ applications",
  subtitle:
    "Create a project, start dev mode, and begin building native backend, realtime, CLI, or systems applications with Vix.",
  code: `vix new api
cd api
vix build
vix dev`,
  note: "Start with dev mode, then move to run, package, registry, and deployment workflows as your project grows.",
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
