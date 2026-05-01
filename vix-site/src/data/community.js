export const COMMUNITY_DATA = {
  hero: {
    title: "Community",
    subtitle:
      "Vix.cpp is built in the open. No corporate agenda, no bloat, no hidden roadmap. If you care about performance, clean developer experience, and practical C++ tooling — you're in the right place.",
    pills: [
      "Open-source",
      "MIT licensed",
      "Performance-first",
      "DX-focused",
      "Offline-first",
    ],
  },

  links: {
    title: "Official links",
    subtitle:
      "The only official places to follow the project, report issues, and contribute.",
    items: [
      {
        label: "vixcpp/vix",
        desc: "Main repository — source code, issues, pull requests",
        href: "https://github.com/vixcpp/vix",
        primary: true,
        icon: "github",
      },
      {
        label: "GitHub Org",
        desc: "All public Vix repositories",
        href: "https://github.com/vixcpp",
        icon: "github",
      },
      {
        label: "Issues",
        desc: "Report bugs or request improvements",
        href: "https://github.com/vixcpp/vix/issues",
        icon: "issue",
      },
      {
        label: "Discussions",
        desc: "Ask questions and share ideas",
        href: "https://github.com/vixcpp/vix/discussions",
        icon: "discussion",
      },
      {
        label: "Releases",
        desc: "Changelog and versioned releases",
        href: "https://github.com/vixcpp/vix/releases",
        icon: "release",
      },
      {
        label: "Documentation",
        desc: "Full reference for the runtime and CLI",
        href: "https://docs.vixcpp.com",
        icon: "docs",
      },
    ],
    meta: [
      { key: "Best place for bugs", value: "GitHub Issues" },
      { key: "Best place for questions", value: "GitHub Discussions" },
      { key: "Best place for PRs", value: "vixcpp/vix" },
    ],
  },

  contribute: {
    title: "How to contribute",
    subtitle:
      "Small, focused, and purposeful contributions are the fastest to review and merge. You don't need to rewrite the runtime to make a meaningful impact.",
    steps: [
      {
        n: "1",
        title: "Pick something small",
        desc: "Start with docs, a typo fix, one CLI hint, or a missing example. Small scope = fast feedback.",
      },
      {
        n: "2",
        title: "One idea per PR",
        desc: "Keep pull requests tight. One problem, one solution. Easier to review, faster to ship.",
      },
      {
        n: "3",
        title: "Add a minimal example",
        desc: "When relevant, include expected output or a runnable snippet. Makes reviewing much easier.",
      },
      {
        n: "4",
        title: "Explain what and why",
        desc: "Clear title, short reasoning in the PR body. No need for an essay — just context.",
      },
    ],
    note: "The best contributions are precise, small, and easy to understand at a glance.",
  },

  firstContributions: {
    title: "Good first contributions",
    subtitle:
      "If you're new to the codebase, these are high-impact, low-risk entry points that don't require deep runtime knowledge.",
    items: [
      {
        title: "Documentation",
        desc: "Add one example with expected terminal output. Every missing example is a friction point for someone.",
        tag: "Low risk",
        tagKind: "green",
        href: "https://github.com/vixcpp/vix/issues?q=label%3Adocumentation",
      },
      {
        title: "CLI hints",
        desc: "Improve one error message or help text. Good CLI output reduces support requests significantly.",
        tag: "High leverage",
        tagKind: "blue",
        href: "https://github.com/vixcpp/vix/issues?q=label%3Acli",
      },
      {
        title: "Website",
        desc: "Add a section or page without redesigning everything. Clear, focused additions welcome.",
        tag: "Fast feedback",
        tagKind: "amber",
        href: "https://github.com/vixcpp/vix/issues?q=label%3Awebsite",
      },
      {
        title: "Registry packages",
        desc: "Publish a package to Vix Registry. Growing the ecosystem is one of the highest-value contributions.",
        tag: "Ecosystem",
        tagKind: "purple",
        href: "https://registry.vixcpp.com",
      },
      {
        title: "Bug reports",
        desc: "Found something broken? A well-written bug report with a minimal reproducer is a real contribution.",
        tag: "Always needed",
        tagKind: "red",
        href: "https://github.com/vixcpp/vix/issues/new",
      },
      {
        title: "Examples & templates",
        desc: "Build a minimal working example for HTTP, WebSocket, P2P, or async. Makes onboarding faster.",
        tag: "Beginner-friendly",
        tagKind: "green",
        href: "https://github.com/vixcpp/vix/discussions",
      },
    ],
  },

  values: {
    title: "What we care about",
    items: [
      {
        title: "Less friction",
        desc: "Every sharp edge in the DX is a bug. If something is harder than it should be, it's worth fixing.",
      },
      {
        title: "Explicit over magic",
        desc: "Vix doesn't guess. Workflows are clear, paths are documented, errors tell you what to do next.",
      },
      {
        title: "Real-world first",
        desc: "Features are built for actual production use cases — not benchmarks or demos.",
      },
      {
        title: "Offline reliability",
        desc: "The registry and toolchain work in unstable environments. Connectivity is not a prerequisite.",
      },
    ],
  },

  codeOfConduct: {
    title: "How we work together",
    items: [
      "Be direct and constructive — blunt feedback on code is fine, personal attacks are not",
      "Assume good intent — most issues come from confusion, not malice",
      "Ship small, iterate fast — perfection blocks progress",
      "Document as you go — if you had to figure it out, someone else will too",
    ],
  },
};
