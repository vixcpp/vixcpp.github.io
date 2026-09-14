---
title: vix run Runtime Arguments
description: How vix run separates Vix CLI options from user program arguments across script mode and project mode.
date: 2026-05-17
---

# vix run Runtime Arguments

`vix run` has two responsibilities.

It must control Vix itself.

It must also run the user program.

Those two responsibilities create an important problem:

```txt
Which arguments are for Vix?
Which arguments are for the program being executed?
```

For example:

```bash
vix run main.cpp --name Gaspard
```

Does `--name` belong to Vix?

Or does it belong to `main.cpp`?

A good runtime argument design must answer this clearly.

## The problem

Command-line tools use flags.

Vix has flags.

User programs also have flags.

Example Vix flags:

```txt
--watch
--preset
--build-target
--dir
--clean
--cmake-verbose
```

Example user program flags:

```txt
--port
--config
--verbose
--name
--help
```

If there is no clear boundary, Vix can accidentally consume arguments intended for the user program.

That makes `vix run` unpredictable.

## The core rule

The core rule should be:

```txt
Arguments before the runtime boundary belong to Vix.
Arguments after the runtime boundary belong to the program.
```

The most common boundary is:

```bash
--
```

Example:

```bash
vix run main.cpp -- --name Gaspard
```

Here:

```txt
vix run main.cpp
```

belongs to Vix.

This:

```txt
--name Gaspard
```

belongs to the program.

## Script mode example

Given this file:

```cpp
#include <vix.hpp>

int main(int argc, char **argv)
{
  for (int i = 0; i < argc; ++i)
    vix::print(argv[i]);

  return 0;
}
```

Run:

```bash
vix run main.cpp -- --name Gaspard
```

The program should receive:

```txt
argv[0] = path to executable
argv[1] = --name
argv[2] = Gaspard
```

Vix should not try to parse `--name`.

## Project mode example

Inside a project:

```txt
server/
  vix.app
  src/
    main.cpp
```

Run:

```bash
vix run -- --port 8080 --config config/app.json
```

Vix should build and run the project.

The program should receive:

```txt
--port 8080 --config config/app.json
```

Those arguments are runtime arguments.

They are not Vix build options.

## Why the boundary is necessary

Without a boundary, this command is ambiguous:

```bash
vix run --verbose
```

It could mean:

```txt
run Vix in verbose mode
```

or:

```txt
pass --verbose to the user program
```

With a boundary, the meaning is clear.

Vix verbose mode:

```bash
vix run --verbose
```

Program verbose mode:

```bash
vix run -- --verbose
```

This is predictable.

## Vix arguments

Arguments before the boundary configure Vix.

Examples:

```bash
vix run main.cpp --watch
```

```bash
vix run --preset release
```

```bash
vix run --build-target server
```

```bash
vix run --dir ./examples/hello
```

These affect how Vix builds or runs the program.

They are not passed to the program unless they appear after the boundary.

## Program arguments

Arguments after the boundary are forwarded to the executable.

Example:

```bash
vix run main.cpp -- --input data.txt --limit 10
```

The program receives:

```txt
--input
data.txt
--limit
10
```

Vix does not interpret them.

## Project mode with Vix and program args

You can combine Vix options and runtime arguments.

Example:

```bash
vix run --preset release -- --port 8080
```

Meaning:

```txt
--preset release
  used by Vix

--port 8080
  passed to the program
```

This makes the command expressive without ambiguity.

## Script mode with Vix and program args

Example:

```bash
vix run main.cpp --watch -- --name Gaspard
```

Meaning:

```txt
main.cpp
  script input

--watch
  Vix option

--name Gaspard
  program arguments
```

When the file changes, Vix rebuilds and reruns the program with the same runtime arguments.

## Alternative boundary: --run

Some Vix workflows may also use a runtime marker such as:

```bash
--run
```

Example:

```bash
vix run main.cpp --run --name Gaspard
```

In that model, arguments after `--run` belong to the program.

The idea is the same:

```txt
there must be a clear point where Vix parsing stops
and program arguments begin
```

The `--` separator is still the most standard CLI convention.

## Recommended rule

The recommended rule is:

```txt
Use -- to pass arguments to the program.
```

Example:

```bash
vix run main.cpp -- --name Gaspard
```

For project mode:

```bash
vix run -- --port 8080
```

This is familiar to engineers who use tools like npm, cargo, go, and many Unix commands.

## Why not pass unknown flags automatically?

One possible design is:

```txt
if Vix does not recognize a flag, pass it to the program
```

That sounds convenient, but it creates problems.

Example:

```bash
vix run --watc
```

Is that a typo for:

```txt
--watch
```

or a program argument?

If unknown flags are forwarded silently, Vix may hide user mistakes.

An explicit boundary is safer.

## Avoiding accidental behavior

With an explicit boundary, Vix can report unknown Vix flags clearly.

Example:

```bash
vix run --watc
```

Vix can say:

```txt
unknown option: --watc
did you mean --watch?
```

But this:

```bash
vix run -- --watc
```

is clearly a program argument.

Vix should forward it.

## Runtime arguments should be preserved

Vix should forward runtime arguments exactly.

If the user writes:

```bash
vix run main.cpp -- --message "hello world"
```

The program should receive:

```txt
--message
hello world
```

Vix should preserve quoting according to the shell’s argv behavior.

The shell handles quotes first.

Vix receives already-tokenized arguments.

## Empty arguments

Some programs may need empty string arguments.

Example:

```bash
vix run main.cpp -- ""
```

The program should receive an empty string argument.

Vix should not drop it.

Argument forwarding should preserve the argv list as accurately as possible.

## Arguments that look like Vix flags

After the boundary, arguments are program arguments even if they look like Vix flags.

Example:

```bash
vix run main.cpp -- --watch --preset release
```

The program receives:

```txt
--watch
--preset
release
```

Vix should not treat them as its own options.

## Arguments before the boundary

Before the boundary, Vix parses the arguments.

Example:

```bash
vix run main.cpp --watch --preset release
```

Here:

```txt
--watch
--preset release
```

belong to Vix.

They should not be forwarded to the program.

## Runtime arguments in direct script mode

In direct script mode, the flow is:

```txt
parse Vix args
compile source
link executable
run executable with runtime args
```

Example:

```bash
vix run main.cpp -- --count 5
```

The compile and link steps do not use:

```txt
--count 5
```

Only the final executable receives them.

## Runtime arguments in CMake fallback mode

If script mode falls back to generated CMake, runtime arguments should behave the same.

Example:

```bash
vix run main.cpp -- --count 5
```

Whether Vix uses:

```txt
direct compiler path
```

or:

```txt
generated CMake fallback
```

the program should receive:

```txt
--count 5
```

The build path should not change the runtime interface.

## Runtime arguments in project mode

Project mode follows the same rule.

Example:

```bash
vix run --build-target server -- --port 8080
```

Vix uses:

```txt
--build-target server
```

The program receives:

```txt
--port 8080
```

The target resolution and build planning happen before the runtime arguments are forwarded.

## Runtime arguments and vix.app

For a `vix.app` project:

```ini
name = server
type = executable
standard = c++20

sources = [
  src/main.cpp,
]
```

Run:

```bash
vix run -- --port 8080
```

Vix should:

```txt
resolve vix.app
build target server
find executable server
run server with --port 8080
```

The runtime arguments do not affect the manifest.

They only affect the launched process.

## Runtime arguments and output_dir

If `vix.app` uses:

```ini
output_dir = bin
```

Vix may run:

```txt
build-ninja/bin/server
```

with the runtime arguments:

```txt
--port 8080
```

The executable path and argument list are separate:

```txt
executable path: build-ninja/bin/server
argv: --port 8080
```

## Runtime working directory

Runtime arguments are not the only runtime concern.

The working directory also matters.

Example:

```bash
vix run -- --config config/app.json
```

The program receives:

```txt
config/app.json
```

But whether that path works depends on the process working directory.

Vix should define a predictable runtime working directory.

Possible choices:

```txt
current working directory
project root
executable directory
```

The best choice should be consistent and documented.

## Recommended working directory model

For project mode, the cleanest default is often:

```txt
project root
```

because users usually expect paths to be relative to the project.

For script mode, the cleanest default is often:

```txt
current working directory
```

because the user explicitly runs a file from a shell location.

If resources are copied next to the executable, Vix may also need an option to run from the executable directory.

The important rule is predictability.

## Runtime arguments and resources

Suppose a `vix.app` project has:

```ini
resources = [
  "data/config.json=config/config.json",
]
```

and the user runs:

```bash
vix run -- --config config/config.json
```

If the working directory is the project root, the program looks for:

```txt
project/config/config.json
```

If the working directory is the executable directory, it looks for:

```txt
build-ninja/bin/config/config.json
```

This is why runtime working directory must be defined clearly.

## Exit codes

Runtime arguments affect the user program.

The user program may exit successfully or fail.

Example:

```cpp
int main(int argc, char **argv)
{
  return argc > 1 ? 0 : 1;
}
```

If the program exits with code `1`, Vix should preserve that meaning.

A non-zero program exit is not the same as:

```txt
compile error
link error
Vix internal failure
```

## Runtime exit vs build failure

These are different:

```txt
build failed:
  compiler or linker failed

runtime failed:
  program ran and returned non-zero

runtime crashed:
  program terminated abnormally
```

`vix run` should distinguish them.

This matters for scripts, tests, CI, and automation.

## Interactive programs

Runtime argument forwarding should not break interactive programs.

Example:

```cpp
#include <vix.hpp>

int main(int argc, char **argv)
{
  auto name = vix::input("Name: ");
  vix::print("Hello", name);
  return 0;
}
```

Run:

```bash
vix run main.cpp -- --interactive
```

The program receives:

```txt
--interactive
```

and should still be able to read from stdin.

## Standard streams

When running the program, Vix should preserve:

```txt
stdin
stdout
stderr
```

The user program should feel like it is running normally.

If Vix captures output for diagnostics, it must avoid breaking interactive programs.

## Environment variables

Runtime arguments are not environment variables.

But both affect process execution.

Vix should pass the environment to the child process by default.

Example:

```bash
MYAPP_ENV=dev vix run -- --port 8080
```

The program should be able to read:

```txt
MYAPP_ENV=dev
```

unless Vix intentionally sanitizes the environment.

## Watch mode and runtime arguments

In watch mode, Vix should reuse the same runtime arguments on each rerun.

Example:

```bash
vix run main.cpp --watch -- --name Gaspard
```

When the file changes:

```txt
rebuild
rerun with --name Gaspard
```

Runtime arguments should not be lost between reruns.

## Restart behavior

In watch mode, if the previous process is still running, Vix may need to stop it before starting the next one.

The runtime argument list should stay the same.

Flow:

```txt
start program with args
file changes
stop program
rebuild
start program with same args
```

This makes watch mode predictable.

## Tests and runtime arguments

A test executable may accept filters.

Example:

```bash
vix run -- --filter math
```

This should pass:

```txt
--filter math
```

to the test program.

For `vix.app` tests:

```bash
cd tests
vix run -- --filter add
```

The test executable receives the filter.

## Program help flags

Many programs use:

```bash
--help
```

To pass it to the program:

```bash
vix run -- --help
```

If the user runs:

```bash
vix run --help
```

that should show Vix help.

This is another reason the boundary is necessary.

## Program version flags

Same rule:

```bash
vix run -- --version
```

passes `--version` to the program.

```bash
vix run --version
```

shows Vix version or Vix command behavior.

## Common mistake: missing boundary

Command:

```bash
vix run main.cpp --name Gaspard
```

If `--name` is not a Vix option, Vix should probably report:

```txt
unknown option: --name
```

The correct command is:

```bash
vix run main.cpp -- --name Gaspard
```

This teaches the boundary.

## Common mistake: placing Vix flags after boundary

Incorrect:

```bash
vix run main.cpp -- --watch
```

if the user intended Vix watch mode.

This passes `--watch` to the program.

Correct:

```bash
vix run main.cpp --watch
```

or:

```bash
vix run main.cpp --watch -- --program-arg
```

## Common mistake: expecting runtime args to affect build

Runtime args do not change the build.

This:

```bash
vix run -- --mode release
```

passes `--mode release` to the program.

It does not build in release mode.

To build in release mode:

```bash
vix run --preset release
```

or:

```bash
vix run --preset release -- --mode release
```

## Common mistake: confusing -- and --run

If both are supported, their behavior should be documented clearly.

Recommended simple model:

```txt
-- is the standard runtime argument boundary.
```

If `--run` exists for compatibility, it should behave consistently.

Example:

```bash
vix run main.cpp --run --name Gaspard
```

means program receives:

```txt
--name Gaspard
```

But the standard form should remain:

```bash
vix run main.cpp -- --name Gaspard
```

## Implementation model

Internally, argument parsing can produce two arrays:

```txt
vixArgs
runtimeArgs
```

Example command:

```bash
vix run main.cpp --watch -- --name Gaspard
```

Parsed result:

```txt
vixArgs:
  main.cpp
  --watch

runtimeArgs:
  --name
  Gaspard
```

Then Vix uses `vixArgs` to build and `runtimeArgs` to run the process.

## Process invocation

When execution starts, Vix should invoke:

```txt
executable + runtimeArgs
```

Example:

```txt
build-ninja/bin/server --port 8080
```

But internally it should avoid shell-string reconstruction when possible.

It is safer to pass argv directly to the process API.

This preserves spaces and special characters correctly.

## Avoid shell injection issues

Vix should not construct one big shell string like:

```txt
"./server --name " + userInput
```

It should pass arguments as an argv vector when possible.

This avoids quoting bugs and shell injection risks.

Conceptual model:

```txt
argv[0] = executable
argv[1] = --name
argv[2] = Gaspard
```

## Quoting behavior

The shell handles quotes before Vix receives arguments.

Command:

```bash
vix run main.cpp -- --message "hello world"
```

Vix receives:

```txt
--message
hello world
```

It should forward those two arguments as-is.

It should not split `hello world` again.

## Runtime args and logs

Verbose output can show runtime arguments when useful.

Example:

```txt
Run:
  executable: build-ninja/bin/server
  args: --port 8080
```

Be careful with sensitive data.

If users pass secrets as arguments, logs can expose them.

A future version may need redaction rules.

## Runtime args and CI

In CI, runtime arguments are useful for tests.

Example:

```bash
vix run -- --ci --report junit.xml
```

Vix should return the program exit code so CI can fail correctly.

This makes `vix run` useful for test executables.

## Runtime args and project tests

For a test project:

```txt
tests/
  vix.app
  test_math.cpp
```

Run:

```bash
cd tests
vix run -- --case add
```

The test executable receives:

```txt
--case add
```

This keeps test filtering inside the test program.

## Runtime args and examples

For examples:

```bash
cd examples/server
vix run -- --port 8080
```

This should run the example server with port `8080`.

The example manifest controls build.

Runtime args control execution.

## Good user-facing examples

Script mode:

```bash
vix run main.cpp -- --name Gaspard
```

Project mode:

```bash
vix run -- --port 8080
```

Vix option plus runtime args:

```bash
vix run --preset release -- --port 8080
```

Watch mode plus runtime args:

```bash
vix run main.cpp --watch -- --name Gaspard
```

Explicit target plus runtime args:

```bash
vix run --build-target server -- --port 8080
```

## Error messages

If the user passes an unknown Vix option before the boundary, the error should be helpful.

Example:

```bash
vix run main.cpp --name Gaspard
```

Possible message:

```txt
unknown Vix option: --name

If this option belongs to your program, pass it after --:

  vix run main.cpp -- --name Gaspard
```

This teaches the correct model.

## Design principle

The design principle is:

```txt
Vix owns arguments before the boundary.
The program owns arguments after the boundary.
```

This keeps the command predictable.

It also prevents Vix from guessing too much.

## Summary

`vix run` must separate build/tool arguments from runtime arguments.

Use:

```bash
--
```

as the runtime boundary.

Examples:

```bash
vix run main.cpp -- --name Gaspard
```

```bash
vix run -- --port 8080
```

```bash
vix run --preset release -- --port 8080
```

Before the boundary, arguments configure Vix.

After the boundary, arguments are forwarded to the user program.

This rule works for:

```txt
script mode
project mode
vix.app
CMake projects
direct runner
CMake fallback
watch mode
tests
examples
```

A clear argument boundary makes `vix run` predictable, scriptable, and safe for real CLI programs.
