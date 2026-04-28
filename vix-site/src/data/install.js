export const INSTALL = {
  title: "Install Vix.cpp",
  subtitle:
    "Install Vix.cpp in minutes. Clear defaults, full SDK support, and explicit paths.",

  sections: [
    {
      id: "overview",
      title: "Choose your install mode",
      desc: "Vix provides two installation modes depending on what you need.",
      bullets: [
        "SDK (default): installs the CLI, headers, libraries, and development files",
        "CLI only: installs only the `vix` binary",
      ],
      note: "If you want to compile code with `#include <vix.hpp>`, install the full SDK.",
    },

    {
      id: "linux_mac",
      title: "Linux and macOS",
      desc: "Install the full SDK with the official installer.",
      code: `curl -fsSL https://vixcpp.com/install.sh | bash`,
      note: "Default install mode is SDK.",
    },

    {
      id: "windows",
      title: "Windows",
      desc: "Install the full SDK with the official PowerShell installer.",
      code: `irm https://vixcpp.com/install.ps1 | iex`,
      note: "Default install mode is SDK.",
    },

    {
      id: "cli_only",
      title: "CLI only",
      desc: "If you only need the CLI and do not need headers or SDK files.",
      code: `VIX_INSTALL_KIND=cli curl -fsSL https://vixcpp.com/install.sh | bash`,
      note: "CLI-only install cannot compile projects using `#include <vix.hpp>`.",
    },

    {
      id: "verify",
      title: "Verify installation",
      desc: "Check that Vix is installed correctly.",
      code: `vix --version
find ~/.local/include -name vix.hpp 2>/dev/null`,
      note: "If SDK is installed correctly, you should see `~/.local/include/vix.hpp`.",
    },

    {
      id: "common_issue",
      title: "Common issue",
      desc: "If you see an include error right after install:",
      code: `error: header file not found

--> index.cpp:1:10
code:
  1 | #include <vix.hpp>
               ^`,
      note: "This usually means you installed the CLI only, not the full SDK.",
    },

    {
      id: "path_fix",
      title: "PATH fix",
      desc: "If installation succeeds but `vix` is not found in your shell, add the default install directory to PATH.",
      code: `# bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# zsh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc`,
      note: "Restart your terminal if needed.",
    },

    {
      id: "build_from_source",
      title: "Build from source",
      desc: "If you want full control or prefer a source build, build and install Vix locally.",
      code: `git clone --recursive https://github.com/vixcpp/vix.git
cd vix

cmake -S . -B build -G Ninja \\
  -DCMAKE_BUILD_TYPE=Release \\
  -DVIX_ENABLE_INSTALL=ON

cmake --build build -j
cmake --install build`,
      note: "This installs the SDK and CLI using your local toolchain.",
    },

    {
      id: "quickstart",
      title: "Quick start",
      desc: "Create and run your first Vix project.",
      code: `vix new app
cd app
vix dev`,
      note: "This is the fastest way to verify that the full toolchain works.",
    },

    {
      id: "more_help",
      title: "More installation help",
      desc: "For troubleshooting, upgrades, uninstall, multiple installs, and advanced environments, use the full installation guide.",
      code: `https://docs.vixcpp.com/installation`,
      note: "Use the extended guide if your environment is non-standard or if you need deeper diagnostics.",
    },
  ],

  external: {
    docsLabel: "Installation docs",
    docsHref: "https://docs.vixcpp.com/installation",
    releasesLabel: "GitHub Releases",
    releasesHref: "https://github.com/vixcpp/vix/releases",
    sourceLabel: "Source code",
    sourceHref: "https://github.com/vixcpp/vix",
    issuesLabel: "Report a bug",
    issuesHref: "https://github.com/vixcpp/vix/issues",
  },
};
