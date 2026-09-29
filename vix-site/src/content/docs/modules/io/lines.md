# Lines

The `io` module provides line-oriented helpers for text input and output. Use `read_line()` when a program needs to read one line from an input stream, and `write_line()` when it needs to write text followed by a newline.

Line I/O is still stream I/O. The module does not decide where the stream comes from, and it does not open files by path. It works with an `Input` or an `Output`, then applies a small amount of text-oriented behavior around newline handling.

## Header

```cpp id="y8dl60"
#include <vix/io.hpp>
#include <vix/print.hpp>
```

## Read one line

Use `read_line()` to read a single line from an input stream.

```cpp id="uw81ka"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("first line\nsecond line\n");

  vix::io::Input input(source);

  auto line = vix::io::read_line(input);

  if (!line.ok())
  {
    vix::eprint("read line failed:", line.error().message());
    return 1;
  }

  vix::print("line:", line.value());

  return 0;
}
```

By default, the returned string does not include the trailing newline. This is usually the expected behavior when reading user input, configuration-like text, simple command output, or line-based data that will be processed one line at a time.

## Keep the trailing newline

`IoOptions` can preserve the newline when reading a line.

```cpp id="6wlg8s"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("hello\n");

  vix::io::Input input(source);

  vix::io::IoOptions options;
  options.keep_newline = true;

  auto line = vix::io::read_line(input, options);

  if (!line.ok())
  {
    vix::eprint("read line failed:", line.error().message());
    return 1;
  }

  vix::print("line:", line.value());

  return 0;
}
```

Keeping the newline is useful when the caller wants to preserve the original text shape, forward lines to another stream, or process content where line endings matter. For most user-facing input, the default is easier to work with because the returned value contains only the line content.

## Read several lines

A line-reading loop can keep reading until the stream reaches end-of-stream. In the current implementation, reading from an empty stream or after the last line can return an empty string successfully, so code that needs to distinguish an empty line from end-of-stream should also inspect `input.eof()`.

```cpp id="qgvmr6"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("alpha\nbeta\n");

  vix::io::Input input(source);

  while (!input.eof())
  {
    auto line = vix::io::read_line(input);

    if (!line.ok())
    {
      vix::eprint("read line failed:", line.error().message());
      return 1;
    }

    if (line.value().empty() && input.eof())
      break;

    vix::print("line:", line.value());
  }

  return 0;
}
```

This pattern is useful for simple text processing. It treats stream failure as an error, while allowing end-of-stream to stop the loop naturally.

## Write one line

Use `write_line()` to write text and append a newline.

```cpp id="fk49bb"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::ostringstream target;

  vix::io::Output output(target);

  auto written = vix::io::write_line(output, "status: ok");

  if (!written.ok())
  {
    vix::eprint("write line failed:", written.error().message());
    return 1;
  }

  vix::print("bytes written:", written.value());
  vix::print("target:", target.str());

  return 0;
}
```

The returned byte count includes the bytes written for the text and the newline. With the default options, `write_line()` appends `\n`.

## Choose a newline mode

Line output uses `NewlineMode` to decide which newline sequence should be appended.

```cpp id="6joll9"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::ostringstream target;

  vix::io::Output output(target);

  vix::io::IoOptions options;
  options.newline_mode = vix::io::NewlineMode::CRLF;

  auto written = vix::io::write_line(output, "hello", options);

  if (!written.ok())
  {
    vix::eprint("write line failed:", written.error().message());
    return 1;
  }

  vix::print("bytes written:", written.value());

  return 0;
}
```

`NewlineMode::LF` writes `\n`. `NewlineMode::CRLF` writes `\r\n`. `NewlineMode::Native` uses the platform convention, which is `\r\n` on Windows and `\n` on other supported platforms.

This option is useful when output must match a protocol, test fixture, generated file format, or platform convention. When the format does not require a specific line ending, the default `LF` mode keeps behavior simple and predictable.

## Auto-flush after writing a line

Set `auto_flush` when the output should be flushed immediately after the line is written.

```cpp id="u3eeay"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::ostringstream target;

  vix::io::Output output(target);

  vix::io::IoOptions options;
  options.auto_flush = true;

  auto written = vix::io::write_line(output, "ready", options);

  if (!written.ok())
  {
    vix::eprint("write line failed:", written.error().message());
    return 1;
  }

  vix::print("bytes written:", written.value());

  return 0;
}
```

Automatic flushing is useful for interactive output, progress messages, and streams where the caller wants the line to be visible immediately. It should not be enabled everywhere by habit, because flushing after every line can be more expensive than letting the stream buffer normally.

## Standard input and output

The line APIs work with the standard stream wrappers too.

```cpp id="sp8km1"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  auto input = vix::io::stdin_stream();
  auto output = vix::io::stdout_stream();

  auto prompt = vix::io::write_line(output, "Enter a command:");

  if (!prompt.ok())
  {
    vix::eprint("failed to write prompt:", prompt.error().message());
    return 1;
  }

  auto command = vix::io::read_line(input);

  if (!command.ok())
  {
    vix::eprint("failed to read command:", command.error().message());
    return 1;
  }

  vix::print("command:", command.value());

  return 0;
}
```

For ordinary documentation output, `vix::print` is still the simpler helper. Use `vix::io::write_line()` when the example is specifically about writing through the IO module or when the result-based write behavior matters.

## Empty lines and end-of-stream

An empty string can mean a real empty line, or it can appear when the stream reaches end-of-stream. The distinction depends on stream state.

```cpp id="qkzuj6"
auto line = vix::io::read_line(input);

if (!line.ok())
{
  vix::eprint("read failed:", line.error().message());
  return 1;
}

if (line.value().empty())
{
  if (input.eof())
    vix::print("end of stream");
  else
    vix::print("empty line");
}
```

This is important for parsers and line-based tools. If empty lines are meaningful in the input format, check `eof()` before treating an empty string as the end.

## Line API overview

| API                                          | Return type      | Purpose                                                 |
| -------------------------------------------- | ---------------- | ------------------------------------------------------- |
| `vix::io::read_line(input)`                  | `IoStringResult` | Read one line without the trailing newline.             |
| `vix::io::read_line(input, options)`         | `IoStringResult` | Read one line with optional newline preservation.       |
| `vix::io::write_line(output, text)`          | `IoSizeResult`   | Write text followed by `\n`.                            |
| `vix::io::write_line(output, text, options)` | `IoSizeResult`   | Write text followed by the configured newline sequence. |

Line APIs use `IoOptions` for newline-related behavior. `keep_newline` affects line reads, while `newline_mode` and `auto_flush` affect line writes.

## Next step

Continue with buffers to understand how the IO module represents in-memory byte data before it is read from or written to streams.
