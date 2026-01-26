export const INSTALL = {
  title: "Install",
  subtitle:
    "Get Vix.cpp installed in minutes. Keep it simple: install, verify, update.",

  sections: [
    {
      id: "linux",
      title: "Linux (recommended)",
      desc: "Install with a single command. This will download and place the vix binary in a standard location.",
      code: `curl -fsSL https://vixcpp.com/install.sh | bash`,
      note: "Tip: if you're behind a proxy or restricted network, download the binary manually from GitHub Releases.",
    },
    {
      id: "mac",
      title: "macOS",
      desc: "macOS installer is coming soon. Until then, use GitHub Releases.",
      code: `# coming soon
# use GitHub Releases for now`,
      note: "Once the VPS is live, installs and checksums will be served from vixcpp.com.",
    },
    {
      id: "windows",
      title: "Windows",
      desc: "Windows support is coming soon. For now, build from source.",
      code: `# coming soon
# build from source`,
      note: "We’ll publish a clean Windows install path once the packaging story is stable.",
    },
    {
      id: "verify",
      title: "Verify",
      desc: "Confirm your installation and check the version.",
      code: `vix -h
vix --version`,
      note: "If you see the help output and a version, you're good.",
    },
    {
      id: "update",
      title: "Update",
      desc: "Re-run the installer to update to the latest release.",
      code: `curl -fsSL https://vixcpp.com/install.sh | bash`,
      note: "Updates are idempotent: you can run this safely multiple times.",
    },
    {
      id: "uninstall",
      title: "Uninstall",
      desc: "Remove the vix binary from your system.",
      code: `# example (if installed to ~/.local/bin)
rm -f ~/.local/bin/vix

# optional: remove cache
rm -rf ~/.vix`,
      note: "Paths may differ depending on your install location.",
    },
  ],

  external: {
    releasesLabel: "GitHub Releases",
    releasesHref: "https://github.com/vixcpp/vix/releases",
    sourceLabel: "Build from source",
    sourceHref: "https://github.com/vixcpp/vix",
  },
};
