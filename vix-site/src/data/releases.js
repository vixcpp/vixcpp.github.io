export const RELEASES_DATA = {
  hero: {
    title: "Releases",
    subtitle:
      "Vix.cpp ships fast, but predictably. Every release is about stable behavior, clear migration paths, and no surprises in production.",
    current: {
      version: "2.5.2",
      label: "Latest stable",
      date: "2025",
      href: "https://github.com/vixcpp/vix/releases",
    },
  },

  versioning: {
    title: "Versioning",
    subtitle:
      "Vix follows semantic versioning. The version number tells you exactly what changed and what to expect.",
    tiers: [
      {
        type: "Patch",
        example: "2.5.1 → 2.5.2",
        color: "green",
        desc: "Bugfixes, output stability improvements, documentation updates, and internal refactors that don't affect behavior.",
        safe: true,
        items: [
          "Fix incorrect CLI output or error messages",
          "Internal code cleanup with no observable effect",
          "Documentation and example corrections",
          "Performance improvements with stable interfaces",
        ],
      },
      {
        type: "Minor",
        example: "2.4.0 → 2.5.0",
        color: "blue",
        desc: "New features and capabilities that keep all existing behavior stable. Safe to upgrade without changing your code.",
        safe: true,
        items: [
          "New CLI commands or flags (additive only)",
          "New runtime modules or APIs",
          "New registry workflow improvements",
          "Expanded platform or environment support",
        ],
      },
      {
        type: "Major",
        example: "1.x → 2.0",
        color: "amber",
        desc: "Breaking changes that require explicit migration. Always shipped with detailed migration notes and a clear reason.",
        safe: false,
        items: [
          "CLI flag or command renames or removals",
          "Changed default behavior that was previously documented",
          "API surface changes in runtime modules",
          "Registry workflow breaking changes",
        ],
      },
    ],
  },

  stability: {
    title: "Stability rules",
    subtitle:
      "These are the concrete commitments that define what 'stable' means in Vix. Not aspirational — enforceable.",
    rules: [
      {
        title: "CLI outputs are stable",
        desc: "Outputs shown in documentation must not change without an explicit decision. If a change breaks a screenshot or a script that parses output, it needs a justification.",
      },
      {
        title: "New flags don't change defaults",
        desc: "Adding a new CLI flag must not silently change the behavior of existing commands. Defaults are locked once documented.",
      },
      {
        title: "Error messages are controlled",
        desc: "Making error messages clearer is always welcome. Changing the shape or structure of error output is treated as a potential breaking change.",
      },
      {
        title: "Registry behavior is versioned",
        desc: "The package resolution algorithm, lock file format, and registry protocol changes are treated as versioned interfaces — not implementation details.",
      },
      {
        title: "Migration notes ship before breaking changes",
        desc: "Major versions always include a migration guide. No breaking changes ship without documented paths for existing users.",
      },
    ],
  },

  cadence: {
    title: "Release cadence",
    subtitle: "How Vix ships and what to expect between releases.",
    items: [
      {
        label: "Patches",
        value: "As needed",
        desc: "Shipped when bugs are confirmed and fixed. No waiting for a release window.",
      },
      {
        label: "Minor releases",
        value: "Monthly or faster",
        desc: "Shipped when meaningful new functionality is ready and stable.",
      },
      {
        label: "Major releases",
        value: "Rarely, with notice",
        desc: "Only when breaking changes are unavoidable. Always preceded by a deprecation period.",
      },
      {
        label: "Release notes",
        value: "Every release",
        desc: "GitHub Releases contains the full changelog for every version.",
      },
    ],
  },

  changelog: {
    title: "Recent changes",
    subtitle: "What has been shipping recently in Vix.cpp.",
    entries: [
      {
        version: "2.5.2",
        date: "2025",
        kind: "minor",
        highlights: [
          "New stable options-based vix::print(...) API with Python-like customization",
          "New vix::input(...) interactive API for console applications",
          "30+ new runtime error rules: concurrency, template, coroutine, and OOP diagnostics",
          "Single-file binary export in vix build with --bin and --out flags",
          "Cross-compilation support via --target in single-file builds",
          "vix run now supports docker://, ssh://, http:// and direct binary targets",
          "Built-in HTTPS / TLS support via OpenSSL in vix::core",
          "Generic session transport abstraction (PlainTransport / TlsTransport)",
        ],
      },
      {
        version: "2.5.1",
        date: "2025",
        kind: "patch",
        highlights: [
          "core: close HTTP sessions on EOF to prevent infinite loops",
          "async: suppress false-positive -Wnull-dereference around Asio headers",
          "websocket: remove unused set_affinity placeholder",
          "8 new production-oriented WebSocket examples (chat, metrics, dashboard, long-polling)",
          "Migrate all examples from config/config.json to .env configuration",
          "core: add OpenAPI + /docs interactive Swagger UI in README",
        ],
      },
      {
        version: "2.5.0",
        date: "2025",
        kind: "minor",
        highlights: [
          "Stabilized App::close() shutdown flow and HTTP server stop/join behavior",
          "Fixed complex shutdown issues in mixed HTTP + WebSocket runtimes",
          "Fixed WebSocket session write flush lifecycle issues",
          "Restored multi-threaded HTTP I/O performance after debugging",
          "Added /bench fast path benchmarked at ~98k req/s in release mode",
          "Fixed public Asio propagation from vix::async to dependent modules",
        ],
      },
      {
        version: "2.4.0",
        date: "2025",
        kind: "minor",
        highlights: [
          "Native App::static_dir — static file serving built into the runtime, no middleware required",
          "9 new modules: env, error, fs, io, log, os, path, process, tests",
          "Umbrella headers for all 24+ modules (vix/async.hpp, vix/fs.hpp, ...)",
          "New vix::tests native testing system — no macros, no hidden magic",
          "Expanded .env-based configuration system with typed access",
          "New environment-driven database examples (MySQL, SQLite, transactions)",
        ],
      },
      {
        version: "2.3.0",
        date: "2025",
        kind: "minor",
        highlights: [
          "Ultra-fast direct C++ execution in vix run without CMake for simple files",
          "Smart CMake fallback when project structure requires it",
          "Global cache for script builds keyed by absolute file path",
          "New manifest + resolver + lockfile architecture for dependencies",
          "Full semver support across add, install, outdated commands",
          "New vix make:config command with interactive prompts",
        ],
      },
      {
        version: "2.0.0",
        date: "2026-03-31",
        kind: "major",
        highlights: [
          "Native HTTP stack (vix::http) — Boost.Beast dependency removed entirely",
          "Async-first architecture with native TCP listener",
          "WebSocket migrated to vix::http with improved shutdown safety",
          "Legacy executors replaced by RuntimeExecutor",
          "Major cleanup and reorganization across the entire ecosystem",
          "First official V2 release through the release pipeline",
        ],
      },
    ],
    cta: {
      label: "Full changelog on GitHub",
      href: "https://github.com/vixcpp/vix/releases",
    },
  },

  upgrade: {
    title: "Upgrading Vix",
    subtitle: "The standard upgrade path for any platform.",
    steps: [
      {
        label: "Unix (macOS / Linux)",
        code: "curl -fsSL https://vixcpp.com/install.sh | bash",
      },
      {
        label: "Windows",
        code: "irm https://vixcpp.com/install.ps1 | iex",
      },
      {
        label: "Or use vix upgrade",
        code: "vix upgrade",
      },
      {
        label: "Verify after upgrade",
        code: "vix --version",
      },
    ],
    note: "Re-running the installer always installs the latest stable version. It is safe to run over an existing install. You can also use vix upgrade for in-place upgrades with integrity verification.",
  },
};
