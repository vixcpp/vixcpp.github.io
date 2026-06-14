export const releaseFocus = {
  title: "Vix.cpp is growing beyond C++ web backends",
  subtitle:
    "Vix.cpp is becoming a broader runtime and developer toolkit for native C++ applications: backend services, games, AI workflows, realtime systems, packages, and production deployment.",
  note: "Web is one use case. Vix.cpp is a runtime foundation for modern C++ software.",
  ctas: [
    {
      label: "Read release notes",
      href: "https://github.com/vixcpp/vix/releases/tag/v2.6.0",
      kind: "primary",
      external: true,
    },
    {
      label: "View the roadmap",
      to: "/roadmap",
      kind: "secondary",
    },
  ],
  preview: {
    title: "Vix.cpp workflow",
    code: `$ vix new mario --template game
$ vix agent analyze .
$ vix add rix/rix
$ vix install
$ vix build
$ vix run`,
  },
};
