# Spawn and Child

`spawn()` launches a command and returns a `Child` handle. This is the lower-level process workflow in the module. Use it when the application needs to start a process, keep a handle to it, check whether it is still running, wait for its exit code, or stop it later.

The model is simple: `Command` describes what should run, `spawn()` starts it, and `Child` represents the running or completed process. The child handle is then passed to lifecycle functions such as `status()`, `wait()`, `terminate()`, and `kill()`.

## Header

Use the public process header:

```cpp id="rwkdm2"
#include <vix/process.hpp>
```

For examples that print output or diagnostics:

```cpp id="ckakef"
#include <vix/print.hpp>
```

## Spawn a process

`spawn()` takes a `Command` and returns a `SpawnResult`. On success, the result contains a `Child`.

```cpp id="qzyeuc"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("exit 0");
#else
  vix::process::Command command("true");
#endif

  auto spawned = vix::process::spawn(command);

  if (!spawned)
  {
    vix::print("spawn failed", spawned.error().message());
    return 1;
  }

  vix::process::Child child = spawned.value();

  vix::print("spawned process id", child.id());

  return child.valid() ? 0 : 1;
}
```

`spawn()` returns after the child process has been created. It does not wait for the process to finish. Waiting is a separate operation.

## Child

`Child` is the public handle for a spawned process.

```cpp id="uqtu6m"
vix::process::Child child;
```

A default-constructed child is invalid.

```cpp id="z1je5i"
vix::process::Child child;

if (!child.valid())
{
  vix::print("child is invalid");
}
```

A child returned by `spawn()` should be valid.

```cpp id="wgyqb4"
auto spawned = vix::process::spawn(command);

if (spawned)
{
  vix::process::Child child = spawned.value();

  vix::print("valid", child.valid());
  vix::print("process id", child.id());
}
```

The child stores a portable `ProcessId` and an internal backend handle used by the platform implementation. Application code should treat `Child` as an opaque process handle and use the public process functions to interact with it.

## Boolean conversion

`Child` can be checked directly in conditions.

```cpp id="j1ex02"
vix::process::Child child;

if (!child)
{
  vix::print("no child process");
}
```

This is equivalent to checking `child.valid()`.

```cpp id="rzhuro"
if (child.valid())
{
  vix::print("process id", child.id());
}
```

A child is considered valid when it has a non-zero process id.

## Wait for completion

Use `wait()` to block until the child exits and collect its exit code.

```cpp id="fxkvth"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("exit 0");
#else
  vix::process::Command command("true");
#endif

  auto spawned = vix::process::spawn(command);

  if (!spawned)
  {
    vix::print("spawn failed", spawned.error().message());
    return 1;
  }

  auto waited = vix::process::wait(spawned.value());

  if (!waited)
  {
    vix::print("wait failed", waited.error().message());
    return 1;
  }

  vix::print("exit code", waited.value());

  return waited.value() == 0 ? 0 : 1;
}
```

For normal non-detached child processes, waiting is part of owning the process lifecycle. It gives the parent the final exit code and lets the backend update the child state.

## Check status

Use `status()` when the application wants to check whether the child is still running without doing a full blocking wait.

```cpp id="oz70qp"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("ping 127.0.0.1 -n 2 > nul");
#else
  vix::process::Command command("sleep");
  command.arg("1");
#endif

  auto spawned = vix::process::spawn(command);

  if (!spawned)
  {
    vix::print("spawn failed", spawned.error().message());
    return 1;
  }

  vix::process::Child child = spawned.value();

  auto running = vix::process::status(child);

  if (!running)
  {
    vix::print("status failed", running.error().message());
    return 1;
  }

  vix::print("running", running.value());

  auto waited = vix::process::wait(child);

  if (!waited)
  {
    vix::print("wait failed", waited.error().message());
    return 1;
  }

  vix::print("exit code", waited.value());

  return 0;
}
```

`status()` is a snapshot. A process that is running when the check starts may exit immediately after. Use `wait()` when the final result matters.

## Spawn result errors

`spawn()` returns a structured error when the command cannot be launched.

```cpp id="f9x71f"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
  vix::process::Command command("");

  auto spawned = vix::process::spawn(command);

  if (!spawned)
  {
    vix::print("spawn error", spawned.error().message());
    return 0;
  }

  return 1;
}
```

An empty program is invalid. Other launch failures can come from an invalid executable path, an invalid working directory, permission problems, missing programs, or platform process creation errors.

## Invalid child handles

Functions that operate on a child validate the handle.

```cpp id="s8srfv"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
  vix::process::Child child;

  auto waited = vix::process::wait(child);

  if (!waited)
  {
    vix::print("wait failed", waited.error().message());
    return 0;
  }

  return 1;
}
```

A default `Child` does not refer to a real process, so `wait()` returns an error. The same principle applies to `status()`, `terminate()`, and `kill()`.

## Spawn and then wait later

The reason to use `spawn()` instead of `output()` is that the application keeps a child handle and can decide when to wait.

```cpp id="tdf5ip"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("ping 127.0.0.1 -n 2 > nul");
#else
  vix::process::Command command("sleep");
  command.arg("1");
#endif

  auto spawned = vix::process::spawn(command);

  if (!spawned)
  {
    vix::print("spawn failed", spawned.error().message());
    return 1;
  }

  vix::process::Child child = spawned.value();

  vix::print("child started", child.id());

  auto running = vix::process::status(child);

  if (running)
  {
    vix::print("running before wait", running.value());
  }

  auto waited = vix::process::wait(child);

  if (!waited)
  {
    vix::print("wait failed", waited.error().message());
    return 1;
  }

  vix::print("child finished with code", waited.value());

  return waited.value() == 0 ? 0 : 1;
}
```

This pattern is useful for tools and services that need to start work, perform other checks, and then collect the final exit code.

## Spawn with options

`spawn()` uses the options stored in `Command`.

```cpp id="nblx61"
vix::process::Command command("my-tool");

command.arg("--check");
command.cwd("./project");
command.inherit_environment(true);
command.search_in_path(true);
command.stdin_mode(vix::process::PipeMode::Null);
command.stdout_mode(vix::process::PipeMode::Null);
command.stderr_mode(vix::process::PipeMode::Null);

auto spawned = vix::process::spawn(command);
```

This keeps the launch configuration readable. The command describes the executable, the arguments, the environment behavior, the working directory, and stream handling before the process is started.

## Detached processes

A command can request detach mode.

```cpp id="cvp5wz"
vix::process::Command command("my-background-tool");

command.detach(true);
```

Detached processes are meant to run independently. They should not be documented as the normal path for short-lived commands. Most process workflows should keep the child attached and then use `wait()` or `output()` so the parent can observe completion.

Detach behavior is platform-specific, so use it only when the application intentionally wants an independent child process.

## Spawn or output

Use `spawn()` when the application needs a child handle.

```cpp id="aopdts"
auto spawned = vix::process::spawn(command);
```

Use `output()` when the application wants to run a command to completion and collect the captured text.

```cpp id="ex1slz"
auto result = vix::process::output(command);
```

The two APIs solve different problems. `output()` is a convenience workflow. `spawn()` is the lifecycle workflow.

## Complete example

This example starts a process, checks its status, waits for it, and prints the final exit code.

```cpp id="nd81er"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("ping 127.0.0.1 -n 2 > nul");
#else
  vix::process::Command command("sleep");
  command.arg("1");
#endif

  command.stdin_mode(vix::process::PipeMode::Null);
  command.stdout_mode(vix::process::PipeMode::Null);
  command.stderr_mode(vix::process::PipeMode::Null);

  auto spawned = vix::process::spawn(command);

  if (!spawned)
  {
    vix::print("spawn failed", spawned.error().message());
    return 1;
  }

  vix::process::Child child = spawned.value();

  vix::print("pid", child.id());

  auto running = vix::process::status(child);

  if (!running)
  {
    vix::print("status failed", running.error().message());
    return 1;
  }

  vix::print("running", running.value());

  auto exit_code = vix::process::wait(child);

  if (!exit_code)
  {
    vix::print("wait failed", exit_code.error().message());
    return 1;
  }

  vix::print("exit code", exit_code.value());

  return exit_code.value() == 0 ? 0 : 1;
}
```

The example discards the child output because the page is about the lifecycle handle. Use `output()` when the text itself matters.

## Common mistakes

Do not call `spawn()` and forget the child lifecycle for normal attached processes. If the process is not detached, the parent should usually wait for it or otherwise manage it intentionally.

Do not treat `Child::id()` as a complete platform backend. It is the public process id. Process control should go through the module functions.

Do not expect `spawn()` to capture output by itself. It starts a process and returns a handle. Use `output()` when captured stdout and stderr are needed.

Do not assume `status()` is a final result. It only reports the observed running state at the time of the call.

Do not use an invalid child handle with lifecycle functions. A default `Child` is useful as an empty value, but it does not represent a running process.

## Next step

Continue with output to understand the high-level API for running a command to completion and capturing stdout and stderr.

```md id="px85hd"
[Output](./output.md)
```
