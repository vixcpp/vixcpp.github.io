# App shell

Vix UI provides app shell primitives for running server-rendered Vix interfaces inside desktop or WebView-style containers.

The app shell does not replace the web application.

It wraps a normal Vix web UI and opens it as an application window.

```cpp
#include <vix/ui/shell/AppShell.hpp>
#include <vix/ui/shell/ShellConfig.hpp>
```

Or use the UI umbrella header:

```cpp
#include <vix/ui.hpp>
```

## When to use it

Use the app shell when you already have a Vix web page, dashboard, admin panel, internal tool, or mobile-ready UI and you want to run it like an app.

Typical use cases:

- desktop dashboards
- internal tools
- admin panels
- local-first tools
- server-rendered interfaces
- WebView-based desktop apps
- UI examples opened from a local Vix server

The important idea is simple:

```txt
Vix server-rendered UI -> local HTTP server -> app shell window
```

## Basic shell configuration

`ShellConfig` describes the app window and the target URL.

```cpp
vix::ui::ShellConfig config = vix::ui::ShellConfig::make()
                                  .set_name("Vix Desktop App")
                                  .set_title("Vix Desktop Shell")
                                  .set_host("127.0.0.1")
                                  .set_port(8080)
                                  .set_width(1200)
                                  .set_height(800)
                                  .set_resizable(true)
                                  .set_fullscreen(false)
                                  .set_devtools(true);
```

The effective URL is built from the host and port:

```cpp
std::cout << config.effective_url() << "\n";
```

Output:

```txt
http://127.0.0.1:8080
```

## Start a shell

```cpp
#include <iostream>

#include <vix/ui.hpp>

int main()
{
  vix::ui::ShellConfig config = vix::ui::ShellConfig::make()
                                    .set_name("Vix Desktop App")
                                    .set_title("Vix Desktop Shell")
                                    .set_host("127.0.0.1")
                                    .set_port(8080)
                                    .set_width(1200)
                                    .set_height(800)
                                    .set_resizable(true)
                                    .set_fullscreen(false)
                                    .set_devtools(true)
                                    .set_start_server(false);

  vix::ui::AppShell shell = vix::ui::AppShell::make(config);

  const vix::ui::Result<void> result = shell.start();

  if (result.is_failed())
  {
    std::cerr << "failed to start desktop shell: "
              << result.error_message()
              << "\n";

    return 1;
  }

  std::cout << "desktop shell started\n";
  std::cout << "target url: " << shell.target_url() << "\n";
  std::cout << "status: " << shell.status() << "\n";

  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

This example expects the target server to already be running at:

```txt
http://127.0.0.1:8080
```

## Managed server mode

The app shell can also start a local server command before opening the window.

Use managed server mode when the shell should control the server process.

```cpp
#include <iostream>
#include <string>

#include <vix/ui.hpp>

int main()
{
  const std::string command =
      "vix run ui_dashboard.cpp --force-server --run --port 8080";

  vix::ui::ShellConfig config = vix::ui::ShellConfig::make()
                                    .set_name("Vix UI Server App")
                                    .set_title("Vix UI Desktop Shell")
                                    .set_host("127.0.0.1")
                                    .set_port(8080)
                                    .set_width(1200)
                                    .set_height(800)
                                    .set_resizable(true)
                                    .set_fullscreen(false)
                                    .set_devtools(true)
                                    .set_start_server(true)
                                    .set_server_command(command);

  vix::ui::AppShell shell = vix::ui::AppShell::make(config);

  const vix::ui::Result<void> result = shell.start();

  if (result.is_failed())
  {
    std::cerr << "failed to start desktop shell: "
              << result.error_message()
              << "\n";

    return 1;
  }

  return 0;
}
```

In this mode, the app shell starts the server command and then opens the configured target URL.

## Readiness check

For better startup behavior, the shell can wait until the server is ready.

```cpp
#include <chrono>
#include <iostream>
#include <string>

#include <vix/ui.hpp>

int main()
{
  const std::string command =
      "vix run ui_dashboard.cpp --force-server --run --port 8080";

  vix::ui::ShellConfig config = vix::ui::ShellConfig::make()
                                    .set_name("Vix UI Readiness App")
                                    .set_title("Vix UI Desktop Readiness")
                                    .set_app_id("com.vix.ui.readiness")
                                    .set_app_version("0.8.0")
                                    .set_vendor("Vix.cpp")
                                    .set_host("127.0.0.1")
                                    .set_port(8080)
                                    .set_readiness_url("http://127.0.0.1:8080/health")
                                    .set_startup_timeout(std::chrono::milliseconds(5000))
                                    .set_wait_for_server(true)
                                    .set_start_server(true)
                                    .set_server_command(command)
                                    .set_width(1200)
                                    .set_height(800)
                                    .set_resizable(true)
                                    .set_devtools(true);

  vix::ui::AppShell shell = vix::ui::AppShell::make(config);

  std::cout << "starting local server:\n";
  std::cout << "  " << command << "\n";
  std::cout << "waiting for readiness URL:\n";
  std::cout << "  " << config.effective_readiness_url() << "\n";
  std::cout << "opening target URL:\n";
  std::cout << "  " << shell.target_url() << "\n";

  const vix::ui::Result<void> result = shell.start();

  if (result.is_failed())
  {
    std::cerr << "failed to start desktop shell: "
              << result.error_message()
              << "\n";

    return 1;
  }

  std::cout << "desktop shell closed\n";
  std::cout << "status: " << shell.status() << "\n";

  return 0;
}
```

This avoids opening the shell before the server is ready.

## Using environment variables

For examples and local tools, the server command can come from an environment variable.

```cpp
#include <cstdlib>
#include <iostream>
#include <string>

#include <vix/ui.hpp>

static std::string env_or_empty(const char *name)
{
  const char *value = std::getenv(name);

  if (value == nullptr)
  {
    return {};
  }

  return std::string(value);
}

int main()
{
  const std::string command = env_or_empty("VIX_UI_SERVER_CMD");

  if (command.empty())
  {
    std::cerr << "missing server command\n";
    std::cerr << "usage:\n";
    std::cerr << "  VIX_UI_SERVER_CMD=\"<server command>\" ./app\n";
    return 1;
  }

  vix::ui::ShellConfig config = vix::ui::ShellConfig::make()
                                    .set_name("Vix UI Server App")
                                    .set_title("Vix UI Desktop Shell")
                                    .set_host("127.0.0.1")
                                    .set_port(8080)
                                    .set_width(1200)
                                    .set_height(800)
                                    .set_resizable(true)
                                    .set_fullscreen(false)
                                    .set_devtools(true)
                                    .set_start_server(true)
                                    .set_server_command(command);

  vix::ui::AppShell shell = vix::ui::AppShell::make(config);

  const vix::ui::Result<void> result = shell.start();

  if (result.is_failed())
  {
    std::cerr << result.error_message() << "\n";
    return 1;
  }

  return 0;
}
```

Run it:

```bash
VIX_UI_SERVER_CMD="vix run ui_dashboard.cpp --force-server --run --port 8080" \
vix run main.cpp
```

## Desktop command

The easiest way to run a Vix UI file as a desktop app is through the desktop command.

```bash
vix desktop run ui_dashboard.cpp --port 8080
```

Example output:

```txt
info  Building desktop server:
• /home/softadastra/tmp/ui/ui_dashboard.cpp

Vix Desktop
app        Vix Desktop
target     http://127.0.0.1:8080
mode       dev (managed server)

Vix.cpp   READY   v2.7.0   run
> HTTP:    http://localhost:8080/
- Status:  ready
- Hint:    Ctrl+C to stop the server
```

This command builds the C++ UI server, starts it, and opens it through the desktop shell flow.

## Example Vix UI server

A shell usually opens a normal Vix server-rendered page.

```cpp
#include <vix/core.hpp>
#include <vix/ui.hpp>

int main()
{
  vix::App app;

  app.templates("templates");

  app.get("/", [](vix::Request &req, vix::Response &res) {
    (void)req;

    const std::string flash =
        vix::ui::FlashMessage::success("Vix UI dashboard is running.")
            .set_title("Ready")
            .set_dismissible(true)
            .render();

    auto view =
        vix::ui::View("dashboard.html")
            .set_title("Vix UI Dashboard")
            .set("flash", flash)
            .set("framework", "Vix.cpp")
            .set("module", "vix::ui");

    res.ui(view);
  });

  app.run(8080);
  return 0;
}
```

Run it as a desktop app:

```bash
vix desktop run ui_dashboard.cpp --port 8080
```

## ShellConfig reference

Common configuration methods:

| Method                     | Purpose                          |
| -------------------------- | -------------------------------- |
| `set_name(...)`            | Internal app name                |
| `set_title(...)`           | Window title                     |
| `set_app_id(...)`          | App identifier                   |
| `set_app_version(...)`     | App version                      |
| `set_vendor(...)`          | Vendor name                      |
| `set_icon_path(...)`       | App icon path                    |
| `set_url(...)`             | Explicit target URL              |
| `set_host(...)`            | Target host                      |
| `set_port(...)`            | Target port                      |
| `set_readiness_url(...)`   | URL used to check readiness      |
| `set_startup_timeout(...)` | Maximum readiness wait time      |
| `set_wait_for_server(...)` | Wait before opening the shell    |
| `set_start_server(...)`    | Start a server command           |
| `set_server_command(...)`  | Command used to start the server |
| `set_width(...)`           | Window width                     |
| `set_height(...)`          | Window height                    |
| `set_resizable(...)`       | Allow resizing                   |
| `set_fullscreen(...)`      | Start fullscreen                 |
| `set_devtools(...)`        | Enable developer tools           |

## Effective URL

When no explicit URL is set, the shell builds the target URL from host and port.

```cpp
vix::ui::ShellConfig config;

config.set_host("127.0.0.1")
      .set_port(8080);

std::cout << config.effective_url() << "\n";
```

Output:

```txt
http://127.0.0.1:8080
```

Use `set_url(...)` when you want full control:

```cpp
config.set_url("http://127.0.0.1:8080/admin");
```

## Effective readiness URL

If a readiness URL is provided, the shell uses it.

```cpp
config.set_readiness_url("http://127.0.0.1:8080/health");
```

If no readiness URL is provided, the shell can fall back to the effective target URL.

```cpp
std::cout << config.effective_readiness_url() << "\n";
```

## ServerProcess

`ServerProcess` is a small helper for starting and stopping a local server process.

```cpp
vix::ui::ServerProcess process("sleep 30");

vix::ui::Result<void> start = process.start();

if (start.is_ok())
{
  std::cout << "server pid: " << process.pid() << "\n";
}

process.stop();
```

It is used by the app shell when managed server mode is enabled.

Most users do not need to use it directly unless they are building custom shell workflows.

## ServerReadiness

`ServerReadiness` checks whether a server endpoint is reachable.

```cpp
auto endpoint =
    vix::ui::ServerReadiness::parse_url("http://127.0.0.1:8080/health");

if (endpoint.is_failed())
{
  std::cerr << endpoint.error_message() << "\n";
  return 1;
}

auto ready = vix::ui::ServerReadiness::check_once(endpoint.value());

if (ready.is_ok())
{
  std::cout << "server is ready\n";
}
```

Wait for a server:

```cpp
auto result =
    vix::ui::ServerReadiness::wait(
        "http://127.0.0.1:8080/health",
        std::chrono::milliseconds(5000));

if (result.is_failed())
{
  std::cerr << result.error_message() << "\n";
}
```

## Result handling

App shell operations return `vix::ui::Result<void>`.

Always check the result before assuming the shell started correctly.

```cpp
const vix::ui::Result<void> result = shell.start();

if (result.is_failed())
{
  std::cerr << result.error_message() << "\n";
  return 1;
}
```

## Common workflows

### Open an existing local server

Start your server first:

```bash
vix run ui_dashboard.cpp --force-server --run --port 8080
```

Then open a shell that targets:

```txt
http://127.0.0.1:8080
```

### Let the shell start the server

Use:

```cpp
config.set_start_server(true)
      .set_server_command("vix run ui_dashboard.cpp --force-server --run --port 8080");
```

### Wait until the server is ready

Use:

```cpp
config.set_wait_for_server(true)
      .set_readiness_url("http://127.0.0.1:8080/health")
      .set_startup_timeout(std::chrono::milliseconds(5000));
```

### Use the desktop command

```bash
vix desktop run ui_dashboard.cpp --port 8080
```

This is the simplest workflow for Vix UI desktop examples.

## Common mistakes

### Opening the shell before the server is ready

If the page is blank or fails to load, enable readiness waiting.

```cpp
config.set_wait_for_server(true)
      .set_readiness_url("http://127.0.0.1:8080/health");
```

### Forgetting to start the server

If `set_start_server(false)` is used, the app shell only opens the target URL.

It does not start the Vix server.

```cpp
config.set_start_server(false);
```

Use this only when the server is already running.

### Using the wrong port

The shell port and the server port must match.

```cpp
config.set_port(8080);
```

Run the server on the same port:

```bash
vix desktop run ui_dashboard.cpp --port 8080
```

### Missing health route

If the readiness URL is `/health`, the server should expose it.

```cpp
app.get("/health", [](vix::Request &, vix::Response &res) {
  res.json({"ok", true});
});
```

### Treating app shell as a native widget toolkit

The app shell is not a native UI toolkit.

It is designed to open web-first Vix UI applications inside an app window.

For UI rendering, use normal Vix routes, templates, HTML responses, forms, assets, live fragments, and PWA helpers.

## What to remember

`AppShell` opens a configured URL as an application shell.

`ShellConfig` describes the app name, window, URL, server command, and readiness behavior.

`ServerProcess` can start and stop a local server.

`ServerReadiness` can wait until the server is reachable.

```txt
ShellConfig -> AppShell -> target URL
                      -> optional server process
                      -> optional readiness check
```

For normal usage, prefer:

```bash
vix desktop run ui_dashboard.cpp --port 8080
```

## Next step

Continue with UI examples.

[Open the examples guide](./examples.md)
