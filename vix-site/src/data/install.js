export const INSTALL = {
  title: "Install Vix.cpp",
  subtitle:
    "Install the Vix.cpp CLI in minutes. Simple, explicit, and reproducible.",

  sections: [
    {
      id: "linux",
      title: "Linux (recommended)",
      desc: "Install using the official installer. This downloads a prebuilt, signed binary and installs it in a standard user location.",
      code: `curl -fsSL https://vixcpp.com/install.sh | bash`,
      note: "The installer is idempotent and safe to re-run. By default, Vix is installed to ~/.local/bin/vix. No system files are modified.",
    },

    {
      id: "mac",
      title: "macOS",
      desc: "Install using the official installer. This downloads a signed macOS binary and installs it locally.",
      code: `curl -fsSL https://vixcpp.com/install.sh | bash`,
      note: "macOS uses the same installer as Linux. Homebrew is intentionally not supported to keep installs explicit and reproducible.",
    },

    {
      id: "windows",
      title: "Windows",
      desc: "Install using the official PowerShell installer. This downloads a signed binary and installs it for the current user.",
      code: `irm https://vixcpp.com/install.ps1 | iex`,
      note: "The installer does not require administrator privileges. The binary is typically installed under %LOCALAPPDATA%\\Vix.",
    },

    {
      id: "verify",
      title: "Verify installation",
      desc: "Confirm that Vix.cpp is installed correctly and available in your shell.",
      code: `vix -h
vix --version`,
      note: "If both commands succeed and a version is displayed, the installation is complete.",
    },

    {
      id: "update",
      title: "Update",
      desc: "Update Vix.cpp to the latest release using the same installer.",
      code: `curl -fsSL https://vixcpp.com/install.sh | bash`,
      note: "Updates are safe and repeatable. Existing projects, caches, and configuration are preserved.",
    },

    {
      id: "uninstall",
      title: "Uninstall",
      desc: "Remove Vix.cpp from your system.",
      code: `# Linux / macOS (default install location)
rm -f ~/.local/bin/vix

# optional: remove local cache, registry, and state
rm -rf ~/.vix`,
      note: "Paths may differ if you installed the binary manually or changed the install prefix.",
    },
  ],

  external: {
    releasesLabel: "GitHub Releases",
    releasesHref: "https://github.com/vixcpp/vix/releases",
    sourceLabel: "Source code",
    sourceHref: "https://github.com/vixcpp/vix",
  },
};
