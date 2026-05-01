export const SUPPORT_DATA = {
  hero: {
    title: "Support Vix.cpp",
    subtitle:
      "Vix is built independently — no VC funding, no ads, no corporate backing. Every contribution goes directly into keeping the runtime alive, the registry running, and the tooling moving forward.",
    note: "100% independent. Open source. MIT licensed.",
  },

  stats: [
    { value: "MIT", label: "Licensed" },
    { value: "0", label: "Ads or paywalls" },
    { value: "100%", label: "Open source" },
    { value: "1", label: "Independent developer" },
  ],

  impact: [
    {
      amount: "$1",
      label: "Keeps the registry online for a day",
      desc: "Infrastructure costs are real. Every dollar covers hosting, bandwidth, and uptime.",
    },
    {
      amount: "$5",
      label: "Funds one focused bug fix or improvement",
      desc: "Small contributions stack up and translate directly into better tooling.",
    },
    {
      amount: "$20",
      label: "Supports CI infrastructure and cross-platform tests",
      desc: "Automated testing across Linux, macOS, and Windows is expensive. This helps.",
    },
    {
      amount: "$50+",
      label: "Enables a full development sprint",
      desc: "Bigger features, better documentation, and deeper reliability work all require sustained time.",
    },
  ],

  why: [
    "Maintain the Vix Registry infrastructure and package availability",
    "Improve documentation, examples, and onboarding experience",
    "Stabilize runtime modules and reduce friction in core workflows",
    "Expand CI and cross-platform validation (Linux, macOS, Windows)",
    "Keep the project independent and free of commercial pressure",
    "Ensure Vix stays MIT licensed with no features behind paywalls",
  ],

  realUsage: {
    title: "Built on top of Vix",
    subtitle:
      "Vix is already being used to build real systems. PulseGrid, a production realtime monitoring application, is built on Vix and runs in production environments managed by Softadastra.",
    projects: [
      {
        name: "PulseGrid",
        desc: "A realtime monitoring application built with Vix, running WebSocket-based data pipelines in production.",
        tag: "Production",
      },
      {
        name: "Softadastra Infrastructure",
        desc: "Offline-first and reliable backend services built using Vix as the core runtime foundation.",
        tag: "Active",
      },
    ],
  },

  international: [
    {
      label: "USDT (TRC20)",
      value: "THPVrMZAryx9NTpqgZVipWCcov6ZYxacLW",
      type: "usdt",
      qr: true,
      network: "Tron Network",
    },
    {
      label: "Bitcoin (BTC)",
      value: "bc1qcqxdq3dwuk9ge4st65ec4gnu99yvgxnwdgqt7e",
      type: "btc",
      qr: true,
      network: "Bitcoin Mainnet",
    },
    {
      label: "Ethereum (ETH)",
      value: "0x5160EDDF2A0AcCe2dcEb946Ddb6D7Ef48bb6716d",
      type: "eth",
      qr: true,
      network: "Ethereum Mainnet",
    },
  ],

  local: [
    {
      label: "MTN Mobile Money",
      value: "+256 790 220 177",
      type: "momo",
      note: "Uganda — MTN MoMo",
    },
  ],

  socialProof: {
    title: "Early supporters",
    subtitle:
      "Be one of the first people to support Vix publicly. Help show that independent C++ tooling matters to the developer community.",
    emptyLabel: "No public supporters yet",
    emptyNote:
      "Your name could be the first here. Early supporters help signal that this project is worth building.",
  },

  principles: [
    "No features are locked behind paywalls — ever",
    "No ads, no tracking, no data monetization",
    "Support does not influence technical decisions or roadmap priority",
    "Vix remains open source and MIT licensed regardless of funding",
    "All infrastructure choices prioritize developer experience over revenue",
  ],

  faq: [
    {
      q: "Is Vix free to use?",
      a: "Yes. Vix is MIT licensed and free to use for any purpose, commercial or personal. Support is entirely optional.",
    },
    {
      q: "Where does the money go?",
      a: "Directly into infrastructure costs (registry hosting, CI, bandwidth), development time, and tooling improvements. There is no company, no investors, no overhead.",
    },
    {
      q: "Can I support anonymously?",
      a: "Yes. Crypto contributions are anonymous by default. Mobile Money transfers don't require you to share any public information.",
    },
    {
      q: "Will supporting Vix give me special access?",
      a: "No. Vix doesn't have tiers, perks, or exclusive features. Every user gets the same open-source runtime regardless of whether they contribute financially.",
    },
    {
      q: "What if I can't contribute financially?",
      a: "That's completely fine. Using Vix, sharing it, opening issues, and contributing code are all meaningful forms of support.",
    },
  ],

  footnote:
    "Support is optional and never required. But if Vix saves you time, reduces friction in your workflow, or helps you ship something real — even a small contribution makes a direct difference.",
};
