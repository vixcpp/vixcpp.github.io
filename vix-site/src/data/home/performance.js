export const performance = {
  title: "High-performance C++ backend runtime",
  badge: "Performance",
  subtitle:
    "Vix.cpp keeps the native performance of C++ while giving developers a modern workflow for building backend services, WebSocket apps, production systems, and package-based applications.",
  note: "Benchmark numbers depend on hardware, route behavior, compiler settings, and deployment environment.",
  cta: {
    label: "Read performance notes",
    to: "https://blog.vixcpp.com/posts/",
  },
  metrics: [
    {
      label: "Requests/sec",
      value: "~98k",
    },
    {
      label: "Avg latency",
      value: "~8.47 ms",
    },
    {
      label: "P99 latency",
      value: "~14.01 ms",
    },
  ],
  cards: {
    benchmark: {
      fileName: "benchmark",
      code: `<span class="shell-success">Requests/sec</span>  ~98k
<span class="shell-success">Avg latency</span>   ~8.47 ms
<span class="shell-success">P99 latency</span>   ~14.01 ms`,
    },
    workflow: {
      fileName: "terminal",
      code: `<span class="shell-path">~$</span> <span class="shell-cmd">vix build --preset release</span>
<span class="shell-success">✔</span> Release build completed

<span class="shell-path">~$</span> <span class="shell-cmd">vix run</span>
<span class="shell-success">✔</span> Native C++ service running`,
    },
  },
};
