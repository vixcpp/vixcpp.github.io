export const FAQ_DATA = {
  hero: {
    title: "FAQ",
    subtitle:
      "Concrete answers to the most common questions about Vix.cpp — the runtime, the registry, the tooling, and what it is and isn't.",
  },

  categories: [
    {
      id: "general",
      label: "General",
      questions: [
        {
          q: "What is Vix.cpp exactly?",
          a: "Vix is a modern C++ runtime for building fast and reliable applications. It combines a CLI workflow (vix run, vix dev, vix build), a package registry, and runtime modules for HTTP, WebSocket, P2P, and async — all in one coherent ecosystem. It is not just a framework, not just a package manager, and not just a CLI.",
        },
        {
          q: "What problem does Vix solve?",
          a: "C++ is powerful but the workflow is often painful: too much configuration, complex build systems, no standard way to manage packages, and enormous friction when going from a single file to a real application. Vix reduces that friction. You can run a C++ file directly with `vix run`, create a project with `vix new`, and grow into production-grade systems without switching tools.",
        },
        {
          q: "Is Vix free?",
          a: "Yes. Vix is MIT licensed. Free to use for any purpose, commercial or personal. No features are behind paywalls, no usage limits, no tracking.",
        },
        {
          q: "What is the philosophy behind Vix?",
          a: "Performance-first, but predictable. Good DX. Clear outputs. Explicit behavior — Vix doesn't guess. Error messages tell you what to do. Outputs are stable across releases. The goal is a runtime that feels modern without hiding what is actually happening.",
        },
        {
          q: "Who is Vix built for?",
          a: "C++ developers who want a modern workflow. This includes people building backend systems, realtime applications, CLI tools, offline-first software, and systems that need to be fast, reliable, and deployable without complex infrastructure.",
        },
      ],
    },
    {
      id: "runtime",
      label: "Runtime & CLI",
      questions: [
        {
          q: "How does vix run work?",
          a: "vix run compiles and executes a C++ file directly. You don't need to configure a build system, write a CMakeLists, or set up any toolchain ahead of time. It's the fastest way to go from code to running output.",
          code: "vix run main.cpp",
        },
        {
          q: "What is vix dev?",
          a: "vix dev starts a development mode that watches your files and recompiles on change. It's designed for fast iteration — write, save, and see results immediately without manual rebuild steps.",
          code: "vix new api\ncd api\nvix dev",
        },
        {
          q: "Can I use Vix for CLI applications?",
          a: "Yes. Vix produces native C++ binaries. If you want a CLI application, you build it in C++ and ship the binary. Vix handles the build workflow and packaging — your binary runs with no runtime dependency.",
        },
        {
          q: "Is Vix only for backend?",
          a: "Primarily, yes. Vix is focused on backend systems: HTTP servers, WebSocket servers, P2P networks, async pipelines, and CLI tools. It is built for server-side processes, not for GUI applications or game engines.",
        },
        {
          q: "Can I serve static files (HTML, CSS, JS)?",
          a: "Yes. Any Vix HTTP server can serve static content like any other HTTP server. You control the routing and the response — Vix does not make decisions for you about what to serve.",
        },
        {
          q: "What does vix build produce?",
          a: "vix build produces a native C++ binary for your platform. The output is a standalone executable with no runtime dependencies — just the binary. You can ship it directly to production.",
        },
      ],
    },
    {
      id: "modules",
      label: "Modules & Features",
      questions: [
        {
          q: "What modules does Vix include?",
          a: "Vix ships with HTTP, WebSocket, P2P, and async modules. HTTP gives you a routing layer. WebSocket handles realtime connections. P2P enables peer-to-peer networking. Async provides co_await-based coroutines for non-blocking workflows.",
        },
        {
          q: "How do I add modules to my project?",
          a: "Use vix modules to manage your project's modules. Start with init, then add the modules you need.",
          code: "vix modules init\nvix modules add websocket\nvix modules add p2p",
        },
        {
          q: "Can I build a WebSocket server with Vix?",
          a: "Yes. The WebSocket module provides a server with on_text and on_binary handlers. You can build realtime messaging, live feeds, or any bidirectional communication layer.",
          code: "#include <vix/websocket.hpp>\n\nint main()\n{\n  vix::websocket::Server ws;\n  ws.on_text([](auto&, std::string_view msg) {\n    // handle message\n  });\n  ws.listen_blocking(9090);\n}",
        },
        {
          q: "Does Vix support async / coroutines?",
          a: "Yes. The async module provides co_await-based coroutines using vix::task<T>. You can use sleep_for, non-blocking I/O, and composable async workflows without callback hell.",
          code: "#include <vix/async.hpp>\nusing namespace vix;\n\ntask<void> main_task()\n{\n  co_await sleep_for(50ms);\n  co_return;\n}\n\nint main()\n{\n  async::run(main_task());\n}",
        },
        {
          q: "What is offline-first support in Vix?",
          a: "Vix is designed to work reliably in environments with unstable or no connectivity. The registry supports syncing packages locally so you can build without internet. Lock files (vix.lock) ensure reproducible builds regardless of registry availability.",
        },
      ],
    },
    {
      id: "registry",
      label: "Registry & Packages",
      questions: [
        {
          q: "What is the Vix Registry?",
          a: "The Vix Registry is the package ecosystem for Vix.cpp. You can search for packages, add them to your project, lock them with vix.lock, and sync locally for offline use. It is designed for real development workflows, not just package installation.",
        },
        {
          q: "How do I add a package to my project?",
          a: "Use vix add followed by the package name, then vix install to resolve and install dependencies.",
          code: "vix add @gk/pdf\nvix install\n# Dependencies are now available",
        },
        {
          q: "How does vix.lock work?",
          a: "vix.lock records the exact resolved versions of all dependencies. Committing this file ensures every developer and every CI environment builds with identical packages — no version drift, no surprises.",
        },
        {
          q: "Can I use Vix Registry offline?",
          a: "Yes. Run vix registry sync once when you have connectivity. After that, package search and installation work fully offline from the local cache.",
          code: "vix registry sync\n# Now you can work offline\nvix search pdf\nvix add @gk/pdf\nvix install",
        },
        {
          q: "Is Vix Registry complementary to vcpkg or Conan?",
          a: "Yes. Vix Registry is focused on packages that work well within the Vix workflow. It is not a replacement for vcpkg or Conan — you can use those alongside Vix for system-level or platform dependencies.",
        },
      ],
    },
    {
      id: "reliability",
      label: "Reliability & Production",
      questions: [
        {
          q: "How does Vix handle errors?",
          a: "Error handling in Vix is explicit. There is no hidden exception translation layer. You control the status code, the error structure, and the message format. This makes your API predictable and production-safe.",
          code: 'res.status(400).json({\n  "error", "Invalid input",\n  "code", 400\n});',
        },
        {
          q: "Does Vix support streaming responses?",
          a: "Yes. HTTP streaming (SSE, chunked transfer) and WebSocket streaming are both supported. For streaming, Vix recommends typed event envelopes (inference.start, inference.token, inference.end) and explicit end events so clients always know when a stream is complete.",
        },
        {
          q: "What are the recommended timeout settings?",
          a: "Set timeouts at both transport and provider levels. Recommended values: connect timeout 2–5s, first token 5–15s, total request 30–120s depending on workload. Always enforce timeouts — never let requests hang indefinitely.",
        },
        {
          q: "How should I handle retries?",
          a: "Retry only transient failures: 429 Too Many Requests, 503 Service Unavailable, network timeouts, connection resets. Never retry 4xx validation errors. Use exponential backoff with jitter and limit to 2–3 attempts maximum.",
        },
        {
          q: "Is Vix production-ready?",
          a: "Yes. Vix is being used in production systems including PulseGrid, a realtime monitoring application built by Softadastra. The runtime is designed around predictable behavior under failure, explicit error handling, and stable CLI outputs.",
        },
      ],
    },
    {
      id: "toolchain",
      label: "Toolchain & Setup",
      questions: [
        {
          q: "What are the system requirements?",
          a: "Vix runs on Linux, macOS, and Windows. You need a C++20-capable compiler (GCC 12+, Clang 14+, or MSVC 2022+). The installer handles the rest automatically on all supported platforms.",
        },
        {
          q: "How do I install the full SDK vs CLI only?",
          a: "The default installer installs the full SDK: CLI, headers, and libraries. If you only need the `vix` binary without headers, use the CLI-only mode.",
          code: "# Full SDK (default)\ncurl -fsSL https://vixcpp.com/install.sh | bash\n\n# CLI only\nVIX_INSTALL_KIND=cli curl -fsSL https://vixcpp.com/install.sh | bash",
        },
        {
          q: "How do I update Vix?",
          a: "Re-run the installer. It is safe to run over an existing installation and always installs the latest stable version.",
          code: "curl -fsSL https://vixcpp.com/install.sh | bash",
        },
        {
          q: "Can I build Vix from source?",
          a: "Yes. Clone the repository and build with CMake and Ninja. This gives you full control over the build and installs the SDK and CLI from your local toolchain.",
          code: "git clone --recursive https://github.com/vixcpp/vix.git\ncd vix\ncmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release -DVIX_ENABLE_INSTALL=ON\ncmake --build build -j\ncmake --install build",
        },
        {
          q: "vix is not found after installation — what should I do?",
          a: "Add the default install directory to your PATH. Restart your terminal after making this change.",
          code: "# bash\necho 'export PATH=\"$HOME/.local/bin:$PATH\"' >> ~/.bashrc\nsource ~/.bashrc\n\n# zsh\necho 'export PATH=\"$HOME/.local/bin:$PATH\"' >> ~/.zshrc\nsource ~/.zshrc",
        },
      ],
    },
  ],
};
