export const INSTALL = {
  title: "Install Vix.cpp",
  subtitle:
    "Install the Vix.cpp CLI in minutes. Simple, explicit, and reproducible.",

  sections: [
    {
      id: "linux",
      title: "Linux (recommended)",
      desc: "Install using the official installer. This downloads a prebuilt binary and places it in a standard location.",
      code: `curl -fsSL https://vixcpp.com/install.sh | bash`,
      note: "The installer is idempotent and safe to re-run. It verifies the binary and does not modify your system outside the install path.",
    },

    {
      id: "mac",
      title: "macOS",
      desc: "macOS binaries are distributed via GitHub Releases. A native installer is planned once the packaging format is finalized.",
      code: `# download the latest release
# https://github.com/vixcpp/vix/releases

chmod +x vix
mv vix /usr/local/bin/vix`,
      note: "We intentionally avoid Homebrew until the CLI interface and upgrade guarantees are fully stabilized.",
    },

    {
      id: "windows",
      title: "Windows",
      desc: "Windows support is experimental. Build from source if you need to evaluate Vix.cpp on Windows today.",
      code: `# build from source
git clone https://github.com/vixcpp/vix
cd vix
cmake -B build
cmake --build build`,
      note: "A packaged Windows distribution will be published once the runtime and CLI behavior are locked.",
    },

    {
      id: "verify",
      title: "Verify installation",
      desc: "Confirm that Vix.cpp is installed correctly and accessible from your shell.",
      code: `vix -h
vix --version`,
      note: "If both commands work and a version is displayed, the installation is complete.",
    },

    {
      id: "update",
      title: "Update",
      desc: "Update Vix.cpp to the latest release using the same installer.",
      code: `curl -fsSL https://vixcpp.com/install.sh | bash`,
      note: "Updates are safe and repeatable. Existing configurations and projects are preserved.",
    },

    {
      id: "uninstall",
      title: "Uninstall",
      desc: "Remove Vix.cpp from your system.",
      code: `# example (default install location)
rm -f ~/.local/bin/vix

# optional: remove local cache and registry data
rm -rf ~/.vix`,
      note: "Paths may differ depending on where you installed the binary.",
    },
  ],

  external: {
    releasesLabel: "GitHub Releases",
    releasesHref: "https://github.com/vixcpp/vix/releases",
    sourceLabel: "Source code",
    sourceHref: "https://github.com/vixcpp/vix",
  },
};
