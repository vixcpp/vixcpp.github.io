export const ROADMAP = {
  hero: {
    eyebrow: "Roadmap",
    title: "Vix.cpp Roadmap",
    text: "Vix.cpp already provides a strong foundation for building, running, testing, packaging, and documenting modern C++ applications. The roadmap now focuses on refinement, ecosystem growth, production readiness, and making the developer experience even more reliable.",
    badges: [
      "Stable CLI workflow",
      "Runtime foundation",
      "Module ecosystem",
      "Registry",
      "Production focus",
    ],
  },

  stableFoundation: {
    title: "Stable foundation",
    items: [
      {
        status: "Available",
        statusType: "stable",
        title: "Developer workflow",
        text: "Vix.cpp already supports the core C++ workflow: create projects, install dependencies, run applications, build, test, format, verify, package, and inspect local state with a cleaner CLI experience.",
      },
      {
        status: "Available",
        statusType: "stable",
        title: "Runtime and modules",
        text: "The runtime already includes a broad module foundation covering core utilities, async execution, storage, logging, validation, networking, WebSocket, P2P, sync, templates, process tools, and more.",
      },
      {
        status: "Available",
        statusType: "stable",
        title: "Registry workflow",
        text: "Vix.cpp already has a registry-oriented package workflow with commands for adding, installing, publishing, caching, verifying, listing, updating, and removing packages.",
      },
      {
        status: "Available",
        statusType: "stable",
        title: "Documentation structure",
        text: "The documentation already covers CLI commands, API references, modules, examples, getting started guides, internals, releases, and project setup.",
      },
    ],
  },

  currentFocus: {
    title: "Current focus",
    items: [
      {
        status: "In progress",
        statusType: "active",
        title: "CLI polish and consistency",
        text: "Improve the final user experience across <code>vix new</code>, <code>vix run</code>, <code>vix dev</code>, <code>vix build</code>, <code>vix check</code>, <code>vix tests</code>, replay, diagnostics, and package commands.",
      },
      {
        status: "In progress",
        statusType: "active",
        title: "Diagnostics and error clarity",
        text: "Make C++ errors easier to understand by improving compiler output, runtime hints, codeframes, suggestions, and beginner-friendly explanations without hiding the real build system.",
      },
      {
        status: "In progress",
        statusType: "active",
        title: "Documentation depth",
        text: "Move from basic documentation to deeper guides, API references, module tutorials, production examples, and complete workflows for real-world applications.",
      },
      {
        status: "In progress",
        statusType: "active",
        title: "Production proof",
        text: "Use Vix.cpp in real systems and document what works in production: servers, monitoring tools, WebSocket apps, package workflows, and native backend services.",
      },
    ],
  },

  phases: {
    title: "Next evolution",
    items: [
      {
        phase: "Evolution 1",
        title: "Refined developer experience",
        text: "Make the already working CLI feel smoother, more predictable, and more professional across project creation, development mode, builds, tests, diagnostics, and releases.",
      },
      {
        phase: "Evolution 2",
        title: "Stronger module ecosystem",
        text: "Continue improving each module as a reusable building block with cleaner APIs, better tests, better examples, and clearer documentation.",
      },
      {
        phase: "Evolution 3",
        title: "Registry maturity",
        text: "Turn the registry workflow into a more complete C++ package experience with better discovery, package metadata, verification, publishing, caching, and installation flows.",
      },
      {
        phase: "Evolution 4",
        title: "Production-ready platform",
        text: "Position Vix.cpp as a serious foundation for native applications, backend services, local-first systems, offline-first workflows, and tools that need native performance.",
      },
    ],
  },

  tracks: {
    title: "Main tracks",
    items: [
      {
        title: "CLI",
        text: "Keep improving the command-line experience around project creation, build, run, dev mode, tests, formatting, diagnostics, replay, registry, package commands, and release workflows.",
      },
      {
        title: "Runtime",
        text: "Strengthen the runtime layer used to build real applications: HTTP, WebSocket, async execution, filesystem tools, process tools, logging, errors, templates, and runtime services.",
      },
      {
        title: "Modules",
        text: "Grow the module ecosystem as independent, reusable C++ building blocks that can be documented, tested, packaged, and reused across projects.",
      },
      {
        title: "Docs",
        text: "Make the documentation complete enough for beginners, advanced C++ users, library authors, and teams evaluating Vix.cpp for real applications.",
      },
      {
        title: "Registry",
        text: "Improve package discovery, installation, publishing, verification, local caching, global tools, and package lifecycle management.",
      },
      {
        title: "Production",
        text: "Show that Vix.cpp is not only a concept or a demo. The goal is to prove it through real applications, benchmarks, production systems, and practical workflows.",
      },
    ],
  },

  modules: {
    title: "Module ecosystem",
    text: "Vix.cpp already includes a broad module foundation. The next step is to make each module easier to understand, test, document, package, and use in real applications.",
    groups: [
      {
        title: "Runtime core",
        items: ["core", "error", "log", "config", "env", "time", "os"],
      },
      {
        title: "Application development",
        items: [
          "http",
          "middleware",
          "websocket",
          "webrpc",
          "template",
          "validation",
        ],
      },
      {
        title: "Systems and tooling",
        items: ["async", "threadpool", "process", "fs", "io", "path", "cache"],
      },
      {
        title: "Data and storage",
        items: ["json", "db", "orm", "kv", "conversion"],
      },
      {
        title: "Distributed systems",
        items: ["sync", "p2p", "p2p_http", "net", "crypto"],
      },
    ],
  },

  docs: {
    title: "Documentation roadmap",
    items: [
      {
        status: "In progress",
        statusType: "active",
        title: "CLI guides",
        text: "Continue improving the documentation for every major CLI command: new, run, dev, build, check, tests, fmt, install, registry, replay, cache, pack, verify, upgrade, and more.",
      },
      {
        status: "In progress",
        statusType: "active",
        title: "Module guides",
        text: "Expand module-level documentation for async, kv, p2p, sync, threadpool, and the rest of the Vix module ecosystem.",
      },
      {
        status: "In progress",
        statusType: "active",
        title: "API reference",
        text: "Make public APIs easier to discover and understand with clearer reference pages, examples, usage notes, and recommended patterns.",
      },
      {
        status: "Planned",
        statusType: "planned",
        title: "Real-world applications",
        text: "Add deeper examples showing complete applications: HTTP services, WebSocket apps, P2P nodes, package-based projects, local-first systems, and production-style backends.",
      },
    ],
  },

  longTerm: {
    title: "Long-term direction",
    items: [
      "Make C++ development feel faster, clearer, and less repetitive without hiding the native toolchain.",
      "Provide a reliable runtime foundation for native applications, backend services, and developer tools.",
      "Build a serious module ecosystem around web, async, storage, sync, networking, validation, logging, and packaging.",
      "Make C++ diagnostics easier to understand while keeping the real compiler output accessible.",
      "Create a package and registry workflow that feels natural for modern C++ developers.",
      "Support local-first and offline-first application foundations through sync, storage, cache, and P2P modules.",
      "Prove Vix.cpp through real production systems, not only examples or demos.",
    ],
  },

  cta: {
    title: "Follow the progress",
    text: "Vix.cpp is built in public. The foundation is already here; the next step is refinement, adoption, production proof, and a stronger ecosystem for modern C++ development.",
    primary: {
      label: "View GitHub",
      href: "https://github.com/vixcpp/vix",
    },
    secondary: {
      label: "Read the docs",
      href: "https://docs.vixcpp.com",
    },
  },
};

export default ROADMAP;
