# `vix run`

`vix run` is the execution side of Vix.

With a C++ source file, Vix can compile and run the program in one command. With a project, it runs the executable recorded by the most recent successful `vix build`. It can also run an existing executable directly.

```bash
vix run main.cpp
```

## Run a C++ file

A standalone C++ file does not need a project just to be executed.

```cpp
#include <iostream>

int main()
{
  std::cout << "Hello, world\n";
  return 0;
}
```

Run it with:

```bash
vix run main.cpp
```

```text
Hello, world
```

Vix accepts `.cpp`, `.cc`, and `.cxx` source files.

For direct single-file compilation, Vix uses `CXX` when that environment variable is set. Otherwise it uses `c++` on Unix-like systems and `g++` on Windows. C++20 is used when no `-std=` flag is provided.

To choose another language mode:

```bash
vix run main.cpp -- -std=c++23
```

## How single-file execution works

Not every C++ file has the same build requirements. Vix inspects the source, its resolved dependencies, and the compiler and linker options before deciding how to build it.

Simple files can be compiled directly. When the source needs build-system features such as compiled dependencies, database integration, explicit libraries, or CMake targets, Vix switches to a generated CMake build automatically.

The command stays the same:

```bash
vix run main.cpp
```

This keeps the common case small without limiting files that need a richer C++ build.

## Script cache

Single-file builds are cached so an unchanged program does not need to be compiled on every run.

The normal direct cache lives under:

```text
~/.vix/cache/scripts/<key>/
```

A cache decision is based on more than the source timestamp. Vix fingerprints the source contents, compiler, C++ standard, relevant compile and link options, dependencies, sanitizer mode, and the headers that participate in the build.

A change in one of those inputs can trigger a rebuild even when `main.cpp` itself has not changed.

### See why Vix rebuilt

Use `--trace-cache` when you want to inspect the decision:

```bash
vix run main.cpp --trace-cache
```

Example:

```text
script strategy: direct
cache key: 7b347a95a6844aa6
cache dir: /home/softadastra/.vix/cache/scripts/7b347a95a6844aa6
binary exists: yes
metadata exists: yes
cached failure: no
cache key match: yes
source mtime match: yes
source content hash match: yes
fingerprint match: yes
direct PCH: unavailable
rebuild reason: cache hit
Hello, world
```

The important line is the rebuild reason. In this case the existing executable still represents the current build inputs, so Vix runs it directly.

`--verbose` also exposes the direct cache trace.

### Compiler fingerprint

The default compiler fingerprint mode is `fast`:

```bash
vix run main.cpp --compiler-fingerprint fast
```

`fast` avoids extra compiler identity queries during startup.

For a stricter toolchain boundary:

```bash
vix run main.cpp --compiler-fingerprint strict
```

On supported Unix-like toolchains, `strict` also queries the compiler version and target triple and includes them in the cache fingerprint.

Use `strict` when a compiler change must be reflected more explicitly in cache validation.

### Local cache

Use:

```bash
vix run main.cpp --local-cache
```

to keep single-file cache artifacts in the current directory:

```text
.vix-scripts/
```

This applies to both direct single-file builds and the generated CMake fallback.

## Dependencies

Single-file programs can use packages managed by Vix without manually assembling include paths and linker flags.

For example:

```cpp
#include <rix.hpp>

int main()
{
  rix.debug.print("Hello", "Rix");

  auto table = rix.csv.parse("name,language\nAda,C++\n");
  rix.debug.log("loaded {} rows", table.size());

  return 0;
}
```

Add the package through the normal dependency workflow:

```bash
vix add @rix/rix
vix install
```

Then run the file normally:

```bash
vix run main.cpp
```

```text
Hello Rix
[debug] loaded 2 rows
```

A small source directory can remain as simple as:

```text
main.cpp
vix.json
vix.lock
```

For a single C++ file, Vix searches the local dependency context and adds matching dependency include paths automatically. If the file appears to use a declared registry dependency that has not been installed yet, Vix can prepare the declared dependency set before compiling.

When the relevant dependency context is located in a parent directory, extend the search with:

```bash
vix run src/tool.cpp --auto-deps=up
```

The normal package workflow remains `vix add`, `vix install`, and `vix run`.

## Compiler flags and program arguments

Compiler options and program arguments use different paths.

Everything after `--` is a compiler or linker flag when the target is a C++ source file:

```bash
vix run main.cpp -- -std=c++23 -O2
```

Use `--run` when the remaining values belong to the program:

```bash
vix run main.cpp --run input.txt --verbose
```

You can also add runtime arguments one at a time:

```bash
vix run main.cpp --args input.txt --args --verbose
```

For an explicit target, ordinary positional arguments after the target are runtime arguments:

```bash
vix run ./app input.txt
```

If a Vix option is placed after `--`, Vix treats it as a compiler or linker flag rather than as a Vix option.

## Runtime environment and working directory

Use `--env` to add or override an environment value for the launched program:

```bash
vix run main.cpp --env APP_ENV=development
```

The option is repeatable:

```bash
vix run main.cpp \
  --env APP_ENV=development \
  --env PORT=8080
```

Use `--cwd` to choose the working directory seen by the program:

```bash
vix run main.cpp --cwd ./runtime-data
```

## Run a project

A normal project keeps build and execution explicit.

```bash
vix build
vix run
```

`vix build` records the successful executable in `.vix/meta.json`. `vix run` reads that metadata and executes the recorded binary.

If the project has not been built successfully yet:

```text
error: No successful build found for this project.
hint: Run: vix build
```

If the recorded executable no longer exists or is not executable, Vix asks for a new build rather than guessing another target.

You can run another project directory directly:

```bash
vix run ./shop
```

or:

```bash
vix run --dir ./shop
```

### Build without running

`--check` runs the project build flow and stops before execution:

```bash
vix run --check
```

The project options `--preset`, `--jobs`, and `--clean` apply to this build-only path.

For normal builds, prefer the dedicated command:

```bash
vix build
```

## Run an existing executable

An existing executable can be passed directly:

```bash
vix run ./app
```

Runtime arguments, `--cwd`, `--env`, replay capture, signal handling, and runtime diagnostics remain available through this path.

## Watch and reload

Use watch mode when a program should rebuild and restart as files change:

```bash
vix run main.cpp --watch
```

`--reload` is an alias:

```bash
vix run main.cpp --reload
```

Single-file watch follows the script build inputs and restarts the process after a successful rebuild.

Project watch is implemented on POSIX systems. On Windows, Vix reports that project watch is not yet available and falls back to a one-shot run.

For the broader development workflow, see [`vix dev`](./dev.md).

### Script or server behavior

A short-lived command and a server do not behave the same way during process supervision.

Use:

```bash
vix run main.cpp --force-script
```

for a short-lived program, or:

```bash
vix run server.cpp --force-server
```

for a long-running process.

If both are provided, server behavior wins.

## Compiler and runtime diagnostics

When a source file does not compile, `vix run` uses the same compiler diagnostic pipeline as the Vix build workflow. It extracts the useful compiler error, shows the relevant source location, and keeps secondary compiler cascades out of the default output.

Runtime failures are inspected separately.

For example, a program that lets a joinable `std::thread` reach destruction can produce:

```text
runtime error: joinable std::thread destroyed
--> /home/softadastra/tmp/vix/errors.cpp:19:15
code:
  18 |   std::thread t1(appendA);
  19 |   std::thread t2(appendB);
                     ^
  20 |
  21 |   t1.join();
hint: call t2.join() or t2.detach() before leaving the scope
hint: prefer std::jthread for RAII thread shutdown when possible
at: /home/softadastra/tmp/vix/errors.cpp:19
```

Vix also recognizes sanitizer reports, signals, uncaught termination, and several common C++ runtime failure patterns. If no specialized diagnostic applies, the underlying process failure is still reported.

## Sanitizers

Enable AddressSanitizer and UndefinedBehaviorSanitizer together:

```bash
vix run main.cpp --san
```

Use only UndefinedBehaviorSanitizer:

```bash
vix run main.cpp --ubsan
```

Use ThreadSanitizer:

```bash
vix run main.cpp --tsan
```

Clear the sanitizer selection with:

```bash
vix run main.cpp --no-san
```

The sanitizer mode participates in single-file build configuration and cache validation.

On POSIX systems, Vix also prepares the sanitizer runtime environment so reports can be captured and interpreted consistently.

## Replay

Record a supported local run with:

```bash
vix run ./app --replay
```

Run records are stored under:

```text
.vix/runs/
```

Replay captures execution context and process results so the run can be inspected later with the Vix replay workflow.

See [`vix replay`](./replay.md).

## Logging and output

Set the application log level for a run:

```bash
vix run main.cpp --log-level debug
```

Supported levels are:

```text
trace
debug
info
warn
error
critical
off
```

`--verbose` is the debug-level shortcut:

```bash
vix run main.cpp --verbose
```

`--quiet` uses warning-level logging:

```bash
vix run main.cpp --quiet
```

Choose the log format with:

```bash
vix run main.cpp --log-format kv
vix run main.cpp --log-format json
vix run main.cpp --log-format json-pretty
```

Color handling can be controlled with:

```bash
vix run main.cpp --log-color auto
vix run main.cpp --log-color always
vix run main.cpp --log-color never
```

or:

```bash
vix run main.cpp --no-color
```

## Application docs

For applications that expose Vix OpenAPI or documentation support:

```bash
vix run --docs
```

Disable it with:

```bash
vix run --no-docs
```

`--docs=true`, `--docs=false`, `--docs=1`, and `--docs=0` are also accepted.

The current run path writes `VIX_DOCS` for the child process. When no docs option is selected, it writes `VIX_DOCS=0`. If you need docs enabled for a run, use `--docs` rather than relying on a pre-existing `VIX_DOCS=1`.

## Environment variables

A few environment variables are meaningful inputs to `vix run`.

| Variable               | Behavior                                                                |
| ---------------------- | ----------------------------------------------------------------------- |
| `CXX`                  | Selects the compiler used by direct single-file compilation.            |
| `PATH`                 | Used to resolve the compiler and external tools.                        |
| `HOME` / `USERPROFILE` | Used to locate the Vix installation and global cache.                   |
| `VIX_LOG_LEVEL`        | Existing value is preserved unless a CLI log-level option overrides it. |
| `VIX_LOG_FORMAT`       | Existing value is preserved unless `--log-format` overrides it.         |
| `VIX_COLOR`            | Existing value is preserved unless a CLI color option overrides it.     |
| `VIX_MODE`             | Existing value is preserved. Otherwise Vix sets `run` or `dev`.         |

Some variables are written by Vix for the child process rather than treated as user configuration.

| Variable          | Behavior                                                  |
| ----------------- | --------------------------------------------------------- |
| `VIX_DOCS`        | Written from the docs option. The current default is `0`. |
| `VIX_STDOUT_MODE` | Set to line-oriented output on POSIX run paths.           |
| `VIX_CLI_CLEAR`   | Written from the current `--clear` mode.                  |
| `ASAN_OPTIONS`    | Prepared when AddressSanitizer is active.                 |
| `UBSAN_OPTIONS`   | Prepared when UndefinedBehaviorSanitizer is active.       |
| `TSAN_OPTIONS`    | Prepared when ThreadSanitizer is active.                  |

Advanced diagnostics also recognize variables such as:

```text
VIX_PERF_TRACE
VIX_PROCESS_DEBUG
VIX_RUN_HEARTBEAT
VIX_BUILD_HEARTBEAT
```

These are useful when investigating the CLI itself or a slow script build, and are not required for ordinary application configuration.

For example:

```bash
VIX_PERF_TRACE=1 vix run main.cpp
```

prints timing information for stages of the direct single-file path.

## Other targets

`vix run` also accepts a few delegated runtime targets on non-Windows platforms.

Docker:

```bash
vix run docker://ubuntu:latest
```

Container alias:

```bash
vix run container://ubuntu:latest
```

SSH:

```bash
vix run ssh://user@example.com
```

HTTP:

```bash
vix run https://example.com
```

These forms delegate to `docker`, `ssh`, or `curl`. They do not use the local C++ single-file build pipeline.

## Complete command reference

The current command help is:

```text
Usage:
  vix run [target] [options] [-- compiler/linker flags] [--run <args...>]

Run a C++ file, executable, or a previously built project.

Targets:
  project                    Current project or project directory/name
  source.cpp                 Single C++ source file
  app.vix                    Vix manifest
  ./app                      Executable binary
  docker://<image>           Docker image
  container://<image>        Container image
  ssh://<target>             SSH target
  http://<target>            HTTP target

Project:
  -d, --dir <path>           Project directory
  --preset <name>            Build preset used with --check, default: dev-ninja
  -j, --jobs <n>             Parallel build jobs used with --check
  --clean                    Clean/reconfigure when used with --check
  --check                    Build the project without running it
  --replay                   Record this run under .vix/runs/

Runtime:
  --cwd <path>               Runtime working directory
  --env <K=V>                Add or override an environment variable
  --args <value>             Add one runtime argument, repeatable
  --run <args...>            Runtime arguments for script mode

Watch:
  --watch                    Rebuild and restart on file changes
  --reload                   Alias for --watch
  --force-server             Treat the program as a long-running server
  --force-script             Treat the program as a short-lived script

  --dev-mode                 Use the build-ninja project watch layout

Run behavior:
  --ui                       Enable interactive run progress UI
  --no-ui                    Disable interactive run progress UI
  --env-hint                 Show .env hint when .env.example exists
  --no-env-hint              Disable the .env hint
  --trace-cache              Trace script cache strategy and decisions
  --no-trace-cache           Disable script cache tracing
  --compiler-fingerprint <mode>
                             Compiler cache fingerprint: fast, strict

Script mode:
  --dep <git-url>            Temporary Git dependency for single-file run
  --save                     Save --dep entries into vix.app
  --auto-deps                Auto-add includes from .vix/deps/*/include
  --auto-deps=local          Same as --auto-deps
  --auto-deps=up             Search dependencies in parent directories too
  --san                      Enable AddressSanitizer and UndefinedBehaviorSanitizer
  --no-san                   Disable default sanitizers
  --ubsan                    Enable UndefinedBehaviorSanitizer only
  --tsan                     Enable ThreadSanitizer only
  --with-sqlite              Enable SQLite support
  --with-mysql               Enable MySQL support
  --local-cache              Use local .vix-scripts cache

Documentation:
  --docs                     Enable OpenAPI/docs for this run
  --no-docs                  Disable OpenAPI/docs for this run
  --docs=<value>             Set OpenAPI/docs: 0, 1, true, false

Output and logging:
  --clear <mode>             Terminal clearing: auto, always, never
  --no-clear                 Alias for --clear=never
  --log-level <level>        trace, debug, info, warn, error, critical, off
  --loglevel <level>         Alias for --log-level
  --verbose                  Alias for --log-level=debug
  -q, --quiet                Alias for --log-level=warn
  --log-format <format>      kv, json, json-pretty
  --log-color <mode>         auto, always, never
  --no-color                 Alias for --log-color=never

Compiler/linker flags:
  -- [flags...]              Pass flags to the compiler in script mode

Important:
  Use --run or --args for script runtime arguments.
  Everything after -- is treated as compiler/linker flags.

Environment:
  VIX_DOCS                   0 or 1
  VIX_LOG_LEVEL              trace, debug, info, warn, error, critical, off
  VIX_LOG_FORMAT             kv, json, json-pretty
  VIX_COLOR                  auto, always, never

  -h, --help                 Show this help
```

`--dep` and `--save` remain in the command reference because they are still part of the public CLI help. For normal package management, use `vix add` and `vix install`.

## Related commands

Use [`vix build`](./build.md) to build a project explicitly.

Use [`vix dev`](./dev.md) for a continuous development workflow.

Use [`vix replay`](./replay.md) to inspect recorded runs.
