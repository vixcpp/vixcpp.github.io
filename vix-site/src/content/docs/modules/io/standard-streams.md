# Standard Streams

The `io` module provides small wrappers around the process standard streams. These helpers let a Vix program treat standard input, standard output, and standard error the same way it treats any other stream wrapped by `Input` or `Output`.

This is useful when an application wants result-based I/O while still working with the normal process streams. Instead of writing directly to the underlying C++ stream, the program can call `stdin_stream()`, `stdout_stream()`, or `stderr_stream()`, then use the same `read_line`, `write`, `write_line`, `flush`, and `copy` operations documented in the rest of the module.

## Header

```cpp id="q7lm8p"
#include <vix/io.hpp>
#include <vix/print.hpp>
```

## Standard input

Use `stdin_stream()` to get an `Input` wrapper around the process standard input stream.

```cpp id="7k8g2l"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  auto input = vix::io::stdin_stream();

  vix::print("Enter a command:");

  auto line = vix::io::read_line(input);

  if (!line.ok())
  {
    vix::eprint("failed to read from stdin:", line.error().message());
    return 1;
  }

  vix::print("command:", line.value());

  return 0;
}
```

This pattern is useful for command-line tools and small interactive programs. `read_line()` returns the text without the trailing newline by default, which is usually the most convenient form for user input.

## Standard output

Use `stdout_stream()` to get an `Output` wrapper around the process standard output stream.

```cpp id="vqsvx1"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  auto output = vix::io::stdout_stream();

  auto written = vix::io::write_line(output, "Hello from stdout");

  if (!written.ok())
  {
    vix::eprint("failed to write to stdout:", written.error().message());
    return 1;
  }

  return 0;
}
```

For normal examples and simple diagnostic messages, `vix::print` is usually the clearer API. Use `stdout_stream()` when the example or application logic specifically needs the IO module’s stream abstraction, byte counts, newline options, flush behavior, or result-based write errors.

## Standard error

Use `stderr_stream()` to get an `Output` wrapper around the process standard error stream.

```cpp id="aid611"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  auto error = vix::io::stderr_stream();

  auto written = vix::io::write_line(error, "error: missing input");

  if (!written.ok())
  {
    vix::eprint("failed to write to stderr:", written.error().message());
    return 1;
  }

  return 1;
}
```

Standard error is useful for messages that should remain separate from normal program output. This matters for command-line tools where standard output may be piped into another process or captured as data, while errors should still be visible to the user.

## Prompt and read input

A small interactive flow often writes a prompt to standard output, flushes it, then reads a line from standard input.

```cpp id="i7whmz"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  auto input = vix::io::stdin_stream();
  auto output = vix::io::stdout_stream();

  auto prompt = vix::io::write(output, "Name: ");

  if (!prompt.ok())
  {
    vix::eprint("failed to write prompt:", prompt.error().message());
    return 1;
  }

  auto flushed = vix::io::flush(output);

  if (!flushed.ok())
  {
    vix::eprint("failed to flush prompt:", flushed.error().message());
    return 1;
  }

  auto name = vix::io::read_line(input);

  if (!name.ok())
  {
    vix::eprint("failed to read name:", name.error().message());
    return 1;
  }

  vix::print("Hello", name.value());

  return 0;
}
```

The explicit flush is important for prompts that do not end with a newline. Without it, the prompt may remain buffered depending on the environment.

## Write line with automatic flush

For line-oriented output, `IoOptions` can request an automatic flush after `write_line()` succeeds.

```cpp id="ks7b4b"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  auto output = vix::io::stdout_stream();

  vix::io::IoOptions options;
  options.auto_flush = true;

  auto written = vix::io::write_line(output, "ready", options);

  if (!written.ok())
  {
    vix::eprint("failed to write line:", written.error().message());
    return 1;
  }

  return 0;
}
```

Automatic flushing is useful for interactive output and status messages that must become visible immediately. For large output, it is usually better to let the stream buffer normally and flush at deliberate points.

## Copy standard input to standard output

Because the standard streams use the same `Input` and `Output` wrappers, they can be used with `copy()`.

```cpp id="1nkwl4"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  auto input = vix::io::stdin_stream();
  auto output = vix::io::stdout_stream();

  auto copied = vix::io::copy(input, output);

  if (!copied.ok())
  {
    vix::eprint("copy failed:", copied.error().message());
    return 1;
  }

  return 0;
}
```

This creates a simple pass-through program. It reads all remaining bytes from standard input and writes them to standard output. The operation stops when input is exhausted or when an I/O error occurs.

## Report copy errors to standard error

A command-line tool can keep normal data on standard output and report failures on standard error.

```cpp id="33az6e"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  auto input = vix::io::stdin_stream();
  auto output = vix::io::stdout_stream();
  auto error = vix::io::stderr_stream();

  auto copied = vix::io::copy(input, output);

  if (!copied.ok())
  {
    auto message = vix::io::write_line(error, copied.error().message());

    if (!message.ok())
      vix::eprint("failed to report io error:", message.error().message());

    return 1;
  }

  return 0;
}
```

This separation is important for tools that participate in shell pipelines. Standard output remains reserved for the program’s real output, while standard error carries diagnostics.

## Standard stream API overview

| API                        | Return type | Purpose                                  |
| -------------------------- | ----------- | ---------------------------------------- |
| `vix::io::stdin_stream()`  | `Input`     | Return a wrapper around standard input.  |
| `vix::io::stdout_stream()` | `Output`    | Return a wrapper around standard output. |
| `vix::io::stderr_stream()` | `Output`    | Return a wrapper around standard error.  |

These helpers do not create new streams. They wrap the existing process streams and let the rest of the IO module operate on them through the same `Input` and `Output` abstractions.

## Next step

Continue with options to understand how `IoOptions` controls chunk size, newline preservation, automatic flushing, and newline mode.
