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
        "Health checks via `vix doctor` (offline by default, optional online release check)",
        "Clean removal via `vix uninstall` (optional `--purge`)",
        "Works even in locked down environments (explicit prefixes and PATH guidance)",
      ],
      note: "On new machines, most issues are PATH, shell profile not loaded, or multiple installs. `vix doctor` is designed to surface those quickly.",
    },

    {
      id: "before_you_install",
      title: "Before you install (new machines)",
      desc: "These checks prevent 90% of first install issues.",
      bullets: [
        "Make sure your shell can run user binaries (PATH includes `~/.local/bin` on Linux/macOS)",
        "Avoid running installers inside a restricted shell session (some CI shells do not load profiles)",
        "If you already installed Vix before, remove duplicates or keep one canonical location",
      ],
      code: `# Linux / macOS
echo "$SHELL"
echo "$PATH"
ls -la ~/.local/bin 2>/dev/null || true

# If you use zsh:
test -f ~/.zshrc && tail -n 5 ~/.zshrc || true

# If you use bash:
test -f ~/.bashrc && tail -n 5 ~/.bashrc || true`,
      note: "If `~/.local/bin` is missing from PATH, add it (see the PATH fix section below) then restart your terminal.",
    },

    {
      id: "linux_dependencies",
      title: "Linux dependencies",
      desc: "Install the required system packages before building or using advanced features on Linux.",
      code: `sudo apt update
sudo apt install -y \\
  build-essential cmake ninja-build pkg-config git curl unzip zip \\
  libssl-dev libsqlite3-dev zlib1g-dev libbrotli-dev \\
  nlohmann-json3-dev \\
  libspdlog-dev libfmt-dev`,
      note: "This example uses apt-based distributions such as Ubuntu and Debian.",
    },

    {
      id: "mac_dependencies",
      title: "macOS dependencies (example)",
      desc: "Install the required development dependencies with Homebrew.",
      code: `brew install cmake ninja pkg-config openssl@3 spdlog fmt nlohmann-json brotli`,
      note: "This example assumes Homebrew is already installed.",
    },

    {
      id: "linux",
      title: "Linux (recommended)",
      desc: "Install using the official installer. This downloads a prebuilt release binary and installs it for the current user.",
      code: `curl -fsSL https://vixcpp.com/install.sh | bash`,
      note: "Default path: `~/.local/bin/vix`. Install metadata is written for future upgrades. Safe to re-run. If you see a minisign warning, it is optional.",
    },

    {
      id: "mac",
      title: "macOS",
      desc: "Install using the official installer. This installs the official macOS binary for the current user.",
      code: `curl -fsSL https://vixcpp.com/install.sh | bash`,
      note: "macOS uses the same installer as Linux. Homebrew is intentionally not supported to keep installs explicit and reproducible.",
    },

    {
      id: "windows",
      title: "Windows",
      desc: "Install using the official PowerShell installer. This installs Vix for the current user without admin privileges.",
      code: `irm https://vixcpp.com/install.ps1 | iex`,
      note: "Typical path: `%LOCALAPPDATA%\\\\Vix`. Install metadata is written for future upgrades. If PowerShell blocks the script, see the Windows notes below.",
    },

    {
      id: "path_fix",
      title: "PATH fix (common on fresh machines)",
      desc: "If `vix` installs but your shell says command not found, add the default install dir to PATH.",
      code: `# bash (Linux)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# zsh (macOS or Linux)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# verify
command -v vix
vix --version`,
      note: "If you use a terminal like VS Code, restart the terminal window after changing PATH.",
    },

    {
      id: "verify",
      title: "Verify installation",
      desc: "Confirm that Vix is available, then run a local health check.",
      code: `vix -h
vix --version
vix doctor`,
      note: "If these succeed, the CLI is installed correctly. Use `vix doctor --online` only if you want release checks too.",
    },

    {
      id: "common_fixes",
      title: "Common fixes",
      desc: "If something looks wrong right after install, these are the fastest fixes.",
      bullets: [
        "`vix: command not found` -> Fix your PATH (see: PATH fix)",
        "Strange version mismatch or unstable behavior -> You likely have multiple installs (see: Multiple installs)",
        "`minisign` not installed -> Optional. Install still works. Use it only for signature verification when available.",
      ],
      note: "If you still have trouble, run `vix doctor --json --online` and paste it into an issue report.",
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
      note: "This is the smallest end-to-end workflow: project creation, dev loop, packaging, verification.",
    },

    {
      id: "upgrade",
      title: "Upgrade",
      desc: "Upgrade to the latest release using the built-in upgrade command.",
      code: `vix upgrade`,
      note: "Use `vix upgrade --check` to preview the target version. Use `vix upgrade --dry-run` to simulate the plan.",
    },

    {
      id: "doctor",
      title: "Doctor (health check)",
      desc: "Diagnose PATH issues, multiple installs, permissions, toolchain, and release status.",
      code: `vix doctor
vix doctor --online
vix doctor --json --online`,
      note: "Use `--json` if you want to paste a clean diagnostic summary into an issue report.",
    },

    {
      id: "multi_install",
      title: "Multiple installs (common after retries)",
      desc: "If `vix` behaves strangely, you may have multiple binaries. Keep one and remove the rest.",
      code: `# Linux / macOS
which -a vix || true
ls -la ~/.local/bin/vix 2>/dev/null || true

# If needed:
vix uninstall --all
# then reinstall
curl -fsSL https://vixcpp.com/install.sh | bash`,
      note: "If `which -a vix` shows multiple entries, it can cause version mismatch and confusing behavior.",
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
      note: "Paths differ if you installed to a custom prefix. Prefer `vix uninstall` when possible because it also removes install metadata.",
    },

    {
      id: "help",
      title: "Need help?",
      desc: "If installation succeeds but Vix still fails to run, doctor is the fastest path to a fix.",
      code: `vix doctor --online`,
      note: "If you open a bug report, include `vix doctor --json --online` and your OS + shell.",
    },

    {
      id: "windows_notes",
      title: "Windows notes (fresh installs)",
      desc: "PowerShell and execution policies can block installers on new machines.",
      bullets: [
        "Run PowerShell as the current user (no admin needed)",
        "If scripts are blocked, allow running remote-signed scripts for the current user only",
        "Restart your terminal after install so PATH updates apply",
      ],
      code: `# If PowerShell blocks scripts:
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

# Install again:
irm https://vixcpp.com/install.ps1 | iex

# Verify:
vix --version
vix doctor`,
      note: "If your environment is managed (company laptop), policy may be enforced. In that case use build-from-source or a portable install path.",
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
