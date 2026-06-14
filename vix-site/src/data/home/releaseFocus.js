export const releaseFocus = {
  title: "Vix.cpp 2.6.0 expands the runtime",
  subtitle:
    "This release makes the direction clearer: Vix is not only for web backends. It is becoming a broader runtime for C++ applications.",
  note: "Web is one use case. The runtime is bigger.",
  ctas: [
    {
      label: "Read release notes",
      to: "https://docs.vixcpp.com/releases/v2.6.0",
      kind: "primary",
    },
    {
      label: "Read the blog",
      to: "https://blog.vixcpp.com",
      kind: "secondary",
    },
  ],
  preview: {
    title: "v2.6.0",
    code: `$ vix new mario --template game
$ vix agent analyze .
$ vix build --fast
$ vix check --san --tests
$ vix deploy --dry-run`,
  },
};
