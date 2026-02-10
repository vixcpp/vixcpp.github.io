## Performance is not a feature it’s a requirement

Vix.cpp is designed to remove overhead, unpredictability, and GC pauses.

### ⚡ Benchmarks (Dec 2025)

| Framework                   | Requests/sec | Avg Latency |
| --------------------------- | ------------ | ----------- |
| ⭐ **Vix.cpp (pinned CPU)** | **~99,000**  | 7–10 ms     |
| Vix.cpp (default)           | ~81,400      | 9–11 ms     |
| Go (Fiber)                  | ~81,300      | ~0.6 ms     |
| Deno                        | ~48,800      | ~16 ms      |
| Node.js (Fastify)           | ~4,200       | ~16 ms      |
| PHP (Slim)                  | ~2,800       | ~17 ms      |
| FastAPI (Python)            | ~750         | ~64 ms      |

