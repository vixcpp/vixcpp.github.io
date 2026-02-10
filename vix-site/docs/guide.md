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

---
## Installation

For detailed installation instructions, advanced options, and troubleshooting,
visit the official installation guide:
👉 https://vixcpp.com/install

#### Linux
**Example (Ubuntu):**
```bash
sudo apt update
sudo apt install -y \
  build-essential cmake ninja-build pkg-config \
  libboost-all-dev libssl-dev libsqlite3-dev
```

#### macOS
```bash
brew install cmake ninja pkg-config boost openssl@3
```
### Shell (Linux, macOS)

```bash
curl -fsSL https://vixcpp.com/install.sh | bash
```

### PowerShell (Windows)

```powershell
irm https://vixcpp.com/install.ps1 | iex
```

Verify installation:

```bash
vix --version
```

---

## Your first Vix.cpp program

Create a file called `server.cpp`:

```cpp
#include <vix.hpp>
using namespace vix;

int main() {
  App app;

  app.get("/", [](Request&, Response& res) {
    res.send("Hello, world!");
  });

  app.run(8080);
}
```

Run it:

```bash
vix run server.cpp
```

Open http://localhost:8080
That’s it.

---

## Script mode (no project setup)

Run C++ like a script:

```bash
vix run main.cpp
vix dev main.cpp
```

Vix handles compilation, linking, and execution automatically.

---

## Learn more

- 📘 Docs: https://vixcpp.com/docs
- 🌍 Website: https://vixcpp.com
- 📦 Examples: https://github.com/vixcpp/vix/tree/main/examples
---

## Contributing

Contributions are welcome.

If you care about modern C++, performance, and real-world reliability, you’ll feel at home here.

Please read the contributing guide before opening a PR.

---

⭐ If this project resonates with you, consider starring the repository.
MIT License


