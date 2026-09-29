# vix desktop

`vix desktop` runs a Vix web UI inside a desktop shell.

It is made for applications that already render a web interface with Vix, then need to open that interface as a desktop app.

```bash
vix desktop run ui_dashboard.cpp --port 8080
```

The command can start a local Vix server, wait until it is ready, and open the app in a desktop window.

## Overview

`vix desktop` is the desktop command for Vix UI applications.

It supports three workflows:

```txt
run      start a desktop app for development
build    build a desktop server target
package  create a distributable desktop folder
```

Most of the time during development, use:

```bash
vix desktop run app.cpp
```

or the shorter form:

```bash
vix desktop app.cpp
```

Both forms start the C++ file as the managed desktop server and open the desktop shell.

## Basic example

```cpp
#include <vix/core.hpp>
#include <vix/ui.hpp>

int main()
{
  vix::App app;

  app.get("/", [](vix::Request &, vix::Response &res) {
    res.ui(
      vix::ui::HtmlResponse::html(
        "<h1>Hello from Vix Desktop</h1>"
      )
    );
  });

  app.run(8080);
  return 0;
}
```

Run it as a desktop app:

```bash
vix desktop run main.cpp --port 8080
```

Vix builds the C++ file, starts it as a local server, waits for the server, then opens the desktop window.

## Usage

```bash
vix desktop run [target.cpp|binary] [options]
vix desktop build <target.cpp|binary> [options]
vix desktop package <target.cpp|binary> [options]
vix desktop [target.cpp|binary] [options]
```

The short form:

```bash
vix desktop ui_dashboard.cpp
```

is equivalent to:

```bash
vix desktop run ui_dashboard.cpp
```

## Run a desktop app

Use `run` during development.

```bash
vix desktop run ui_dashboard.cpp
```

With a custom port:

```bash
vix desktop run ui_dashboard.cpp --port 8080
```

With a custom name and window title:

```bash
vix desktop run ui_dashboard.cpp \
  --name "Vix Dashboard" \
  --title "Vix Dashboard"
```

With a custom window size:

```bash
vix desktop run ui_dashboard.cpp \
  --width 1280 \
  --height 720
```

Enable developer tools:

```bash
vix desktop run ui_dashboard.cpp --devtools
```

## Run an existing local server

Use `--url` when the server is already running.

```bash
vix desktop run --url http://127.0.0.1:8080
```

This opens the URL inside the desktop shell.

## Run an existing binary

A compiled server binary can be used directly.

```bash
vix desktop run ./build/my_server --port 8080
```

Vix starts the binary as the managed server and opens:

```txt
http://127.0.0.1:8080
```

## Managed server mode

When a C++ file or server binary is passed to `vix desktop run`, Vix treats it as a managed server.

```bash
vix desktop run ui_dashboard.cpp --port 8080
```

This means Vix will:

1. build the C++ file when needed,
2. start the server,
3. wait for the target URL,
4. open the desktop shell,
5. stop when the desktop session closes.

The target URL is built from the host and port:

```txt
http://127.0.0.1:8080
```

## Attach mode

When only a URL is passed, Vix does not start a server.

```bash
vix desktop run --url http://127.0.0.1:8080
```

Use this when the app is already running somewhere else.

## Readiness URL

By default, the desktop shell waits for the target URL.

Set a custom readiness URL when the server has a health route:

```bash
vix desktop run ui_dashboard.cpp \
  --port 8080 \
  --readiness-url http://127.0.0.1:8080/health
```

Disable readiness waiting:

```bash
vix desktop run ui_dashboard.cpp --no-wait
```

Set the startup timeout:

```bash
vix desktop run ui_dashboard.cpp --timeout-ms 10000
```

## Build a desktop server

`build` compiles the server target used by the desktop app.

```bash
vix desktop build ui_dashboard.cpp
```

With an app name:

```bash
vix desktop build ui_dashboard.cpp --name "Vix UI Dashboard"
```

With clean rebuild:

```bash
vix desktop build ui_dashboard.cpp --clean
```

With parallel jobs:

```bash
vix desktop build ui_dashboard.cpp -j 8
```

Use an already-built server binary:

```bash
vix desktop build --binary ./build/ui_dashboard --name "Vix UI Dashboard"
```

## Package a desktop app

`package` creates a desktop folder containing the server, launcher, desktop metadata, and runtime resources.

```bash
vix desktop package ui_dashboard.cpp --target dir
```

With a custom output directory:

```bash
vix desktop package ui_dashboard.cpp \
  --target dir \
  --out dist/dashboard
```

With app metadata:

```bash
vix desktop package ui_dashboard.cpp \
  --target dir \
  --name "Vix Dashboard" \
  --title "Vix Dashboard" \
  --app-id com.vix.dashboard \
  --app-version 1.0.0 \
  --vendor "Vix.cpp"
```

With an icon:

```bash
vix desktop package ui_dashboard.cpp \
  --target dir \
  --icon assets/icon.png
```

The supported package target is currently:

```txt
dir
```

## Runtime resources

When packaging, Vix can copy common runtime folders automatically.

Default resource folder names:

```txt
templates
assets
static
public
views
resources
wwwroot
```

This is useful for apps that load templates, CSS, JavaScript, images, or public files at runtime.

Add an extra resource path:

```bash
vix desktop package ui_dashboard.cpp \
  --target dir \
  --resources ./uploads
```

Disable automatic resource discovery:

```bash
vix desktop package ui_dashboard.cpp \
  --target dir \
  --no-auto-resources
```

## Server options

```bash
vix desktop run ui_dashboard.cpp \
  --host 127.0.0.1 \
  --port 8080
```

Available server options:

| Option                      | Description                              |
| --------------------------- | ---------------------------------------- |
| `--url <url>`               | Target URL to open                       |
| `--host <host>`             | Local server host. Default: `127.0.0.1`  |
| `--port <port>`             | Local server port. Default: `8080`       |
| `--readiness-url <url>`     | URL checked before opening the shell     |
| `--server <command>`        | Custom server command                    |
| `--cwd <dir>`               | Working directory for the server command |
| `--working-directory <dir>` | Same as `--cwd`                          |
| `--wait`                    | Wait for server readiness                |
| `--no-wait`                 | Do not wait for server readiness         |
| `--timeout-ms <ms>`         | Startup timeout in milliseconds          |

## Window options

```bash
vix desktop run ui_dashboard.cpp \
  --width 1200 \
  --height 800 \
  --resizable
```

Available window options:

| Option           | Description                                   |
| ---------------- | --------------------------------------------- |
| `--width <px>`   | Window width. Default: `1200`                 |
| `--height <px>`  | Window height. Default: `800`                 |
| `--fullscreen`   | Start fullscreen                              |
| `--resizable`    | Allow resizing                                |
| `--no-resizable` | Disable resizing                              |
| `--devtools`     | Enable WebView developer tools when supported |
| `--no-devtools`  | Disable developer tools                       |

## App metadata options

```bash
vix desktop run ui_dashboard.cpp \
  --name "Vix Dashboard" \
  --title "Vix Dashboard" \
  --app-id com.vix.dashboard \
  --app-version 1.0.0 \
  --vendor "Vix.cpp"
```

Available metadata options:

| Option                    | Description                   |
| ------------------------- | ----------------------------- |
| `--name <name>`           | Application name              |
| `--title <title>`         | Window title                  |
| `--app-id <id>`           | Stable desktop application id |
| `--app-version <version>` | Application version           |
| `--version <version>`     | Same as `--app-version`       |
| `--vendor <name>`         | Vendor name                   |
| `--icon <path>`           | Desktop icon path             |

## Build options

```bash
vix desktop build ui_dashboard.cpp \
  --clean \
  -j 8
```

Available build options:

| Option                   | Description                            |
| ------------------------ | -------------------------------------- |
| `--clean`                | Clean or rebuild before building       |
| `-j, --jobs <n>`         | Parallel build jobs                    |
| `--with-sqlite`          | Enable SQLite support for script build |
| `--with-mysql`           | Enable MySQL support for script build  |
| `--local-cache`          | Use local script cache                 |
| `--binary <path>`        | Use an already-built server binary     |
| `--server-binary <path>` | Same as `--binary`                     |

## Package options

```bash
vix desktop package ui_dashboard.cpp \
  --target dir \
  --out dist/dashboard
```

Available package options:

| Option                | Description                                      |
| --------------------- | ------------------------------------------------ |
| `--out <dir>`         | Output directory                                 |
| `--target <target>`   | Package target. Supported: `dir`                 |
| `--resources <path>`  | Copy an extra runtime resource file or directory |
| `--resource <path>`   | Same as `--resources`                            |
| `--no-auto-resources` | Disable automatic resource copying               |
| `--icon <path>`       | Copy an application icon                         |

## Output options

| Option          | Description                             |
| --------------- | --------------------------------------- |
| `--quiet`, `-q` | Only print errors                       |
| `--json`        | Print machine-readable lifecycle events |
| `--no-color`    | Disable ANSI colors                     |

Vix also respects:

```txt
NO_COLOR
FORCE_COLOR
```

## Examples

Run a UI dashboard:

```bash
vix desktop run ui_dashboard.cpp --port 8080
```

Run a form-heavy UI:

```bash
vix desktop run ui_forms.cpp --port 8080
```

Run a live UI page:

```bash
vix desktop run ui_live.cpp --port 8080
```

Open an already-running server:

```bash
vix desktop run --url http://127.0.0.1:8080
```

Build a desktop server:

```bash
vix desktop build ui_dashboard.cpp --name "Vix UI Dashboard"
```

Package a desktop folder:

```bash
vix desktop package ui_dashboard.cpp \
  --target dir \
  --name "Vix UI Dashboard"
```

Package with templates and assets:

```bash
vix desktop package ui_dashboard.cpp \
  --target dir \
  --resources templates \
  --resources assets
```

## Common mistakes

### Passing `vix run` as the server command

Wrong:

```bash
vix desktop run --server "vix run ui_dashboard.cpp"
```

Correct:

```bash
vix desktop run ui_dashboard.cpp --port 8080
```

For desktop development, pass the C++ file directly.

### Forgetting the port

If your app runs on port `8080`, keep the desktop command on the same port:

```bash
vix desktop run ui_dashboard.cpp --port 8080
```

### Opening a URL before the server is ready

Use a readiness URL:

```bash
vix desktop run ui_dashboard.cpp \
  --readiness-url http://127.0.0.1:8080/health
```

### Packaging without runtime files

If the app needs templates or assets, include them:

```bash
vix desktop package ui_dashboard.cpp \
  --target dir \
  --resources templates \
  --resources assets
```

## Difference between `run`, `build`, and `package`

| Command               | Purpose                               |
| --------------------- | ------------------------------------- |
| `vix desktop run`     | Start a desktop app for development   |
| `vix desktop build`   | Build the desktop server target       |
| `vix desktop package` | Create a distributable desktop folder |

## Related commands

| Command      | Purpose                              |
| ------------ | ------------------------------------ |
| `vix run`    | Build and run a normal Vix target    |
| `vix dev`    | Run a development server with reload |
| `vix mobile` | Prepare mobile app workflows         |
| `vix note`   | Run the Vix Note UI                  |
| `vix build`  | Compile a project or target          |
