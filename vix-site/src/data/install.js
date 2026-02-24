export const INSTALL = {
  title: "Install Vix.cpp",
  subtitle:
    "Install the Vix.cpp CLI in minutes. Simple, explicit, and reproducible.",

  sections: [
    {
      id: "trust",
      title: "What you get",
      desc: "Vix installs cleanly, stays upgradeable, and remains observable when things go wrong.",
      bullets: [
        "User-level install by default (no sudo, no system files touched)",
        "Upgrades via `vix upgrade` (uses install metadata)",
        "Health checks via `vix doctor` (optional online release check)",
        "Clean removal via `vix uninstall` (optional `--purge`)",
      ],
      note: "If your environment is locked down, Vix still works with user-level paths and explicit prefixes.",
    },

    {
      id: "linux",
      title: "Linux (recommended)",
      desc: "Install using the official installer. This downloads a prebuilt release binary and installs it for the current user.",
      code: `curl -fsSL https://vixcpp.com/install.sh | bash`,
      note: "Default path: ~/.local/bin/vix. Install metadata is written for future upgrades. The installer is safe to re-run.",
    },

    {
      id: "mac",
      title: "macOS",
      desc: "Install using the official installer. This downloads the official macOS binary and installs it locally for the current user.",
      code: `curl -fsSL https://vixcpp.com/install.sh | bash`,
      note: "macOS uses the same installer as Linux. Homebrew is intentionally not supported to keep installs explicit and reproducible.",
    },

    {
      id: "windows",
      title: "Windows",
      desc: "Install using the official PowerShell installer. This installs Vix for the current user without admin privileges.",
      code: `irm https://vixcpp.com/install.ps1 | iex`,
      note: "Typical path: %LOCALAPPDATA%\\Vix. Install metadata is written for future upgrades.",
    },

    {
      id: "verify",
      title: "Verify installation",
      desc: "Confirm that Vix is available, then run a local health check.",
      code: `vix -h
vix --version
vix doctor`,
      note: "If these commands succeed, Vix is installed correctly. Use `vix doctor --online` to also check the latest GitHub release.",
    },

    {
      id: "quickstart",
      title: "Quick start",
      desc: "Create a project, run dev mode, then package and verify the artifact.",
      code: `vix new api
cd api
vix dev

# package it
vix pack --version 1.0.0
vix verify`,
      note: "This is the smallest end-to-end workflow: project creation, dev loop, packaging, and verification.",
    },

    {
      id: "upgrade",
      title: "Upgrade",
      desc: "Upgrade to the latest release using the built-in upgrade command.",
      code: `vix upgrade`,
      note: "Use `vix upgrade --check` to preview the target version and download info. Use `vix upgrade --dry-run` to simulate the plan.",
    },

    {
      id: "doctor",
      title: "Doctor (health check)",
      desc: "Diagnose PATH issues, multiple installs, permissions, and release status.",
      code: `vix doctor --online
vix doctor --json --online`,
      note: "Run `--json` when you want to paste a clean diagnostic summary into an issue report.",
    },

    {
      id: "uninstall",
      title: "Uninstall",
      desc: "Remove Vix cleanly using the built-in uninstall command.",
      code: `vix uninstall`,
      note: "Add `--all` to remove every detected vix in common locations. Add `--purge` to also remove local store/cache/state.",
    },

    {
      id: "uninstall_manual",
      title: "Manual removal (last resort)",
      desc: "If the CLI cannot run, remove the default install location manually.",
      code: `# Linux / macOS (default install location)
rm -f ~/.local/bin/vix

# optional: remove local cache, store, and state
rm -rf ~/.vix`,
      note: "Paths may differ if you installed to a custom prefix. Prefer `vix uninstall` when possible because it removes install metadata too.",
    },

    {
      id: "help",
      title: "Need help?",
      desc: "If installation succeeds but Vix still fails to run, doctor is the fastest path to a fix.",
      code: `vix doctor --online`,
      note: "If you open a bug report, include the output of `vix doctor --online` (or `--json`) and your OS + shell.",
    },
  ],

  external: {
    docsLabel: "CLI docs",
    docsHref: "https://vixcpp.com/docs/modules/cli",
    releasesLabel: "GitHub Releases",
    releasesHref: "https://github.com/vixcpp/vix/releases",
    sourceLabel: "Source code",
    sourceHref: "https://github.com/vixcpp/vix",
    issuesLabel: "Report a bug",
    issuesHref: "https://github.com/vixcpp/vix/issues",
  },
};
