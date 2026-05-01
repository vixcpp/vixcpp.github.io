export const RELEASES_DATA = {
  hero: {
    title: "Releases",
    subtitle:
      "Vix.cpp ships fast, but predictably. Every release is about stable behavior, clear migration paths, and no surprises in production.",
    current: {
      version: "1.47.0",
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
        example: "1.47.0 → 1.47.1",
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
        example: "1.47.0 → 1.48.0",
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
        version: "1.47.0",
        date: "2025",
        kind: "minor",
        highlights: [
          "Improved vix dev mode stability and reload speed",
          "Registry sync now supports offline-first conflict resolution",
          "WebSocket module: added connection timeout configuration",
          "CLI: clearer error output when vix.lock is out of sync",
        ],
      },
      {
        version: "1.46.x",
        date: "2025",
        kind: "patch",
        highlights: [
          "Fixed header search path on certain Linux distributions",
          "Fixed vix install failing silently on network timeout",
          "Documentation corrections for P2P module usage",
        ],
      },
      {
        version: "1.46.0",
        date: "2025",
        kind: "minor",
        highlights: [
          "P2P module: stable public API surface",
          "Async module: co_await sleep_for now uses steady_clock",
          "vix pack: added --verify flag to validate before packaging",
          "Registry: package search now works fully offline after sync",
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
        label: "Verify after upgrade",
        code: "vix --version",
      },
    ],
    note: "Re-running the installer always installs the latest stable version. It is safe to run over an existing install.",
  },
};
