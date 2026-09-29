# Quick Start

The `io` module gives Vix applications a small, result-based API for stream input and output. It is designed for code that already has a stream, or wants to use standard input, standard output, standard error, string streams in tests, or file streams created elsewhere.

This module is different from `fs`. The filesystem module works with files, directories, metadata, and paths. The `io` module works with streams and bytes. That distinction keeps the API focused: `io` reads from an `Input`, writes to an `Output`, copies from one stream to another, and reports failures through `vix::error::Result`.

## Include the module

Use the public IO header:

```cpp id="u0f7sg"
#include <vix/io.hpp>
```

For examples that print diagnostic information, include the Vix print API:

```cpp id="vn7xnf"
#include <vix/print.hpp>
```

## Write to standard output

The quickest way to write through the IO module is to wrap standard output with `stdout_stream()` and call `write_line()`.

```cpp id="2pgfnu"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  auto out = vix::io::stdout_stream();

  auto written = vix::io::write_line(out, "Hello from Vix IO");

  if (!written.ok())
  {
    vix::eprint("write failed:", written.error().message());
    return 1;
  }

  vix::print("bytes written:", written.value());

  return 0;
}
```

`write_line()` writes the text, appends a newline, and returns the number of bytes written. The result should be checked because output can fail when the stream is closed, redirected, or in a bad state.

## Write without adding a newline

Use `write()` when the text should be written exactly as provided.

```cpp id="c2p5zp"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  auto out = vix::io::stdout_stream();

  auto written = vix::io::write(out, "loading...");

  if (!written.ok())
  {
    vix::eprint("write failed:", written.error().message());
    return 1;
  }

  auto flushed = vix::io::flush(out);

  if (!flushed.ok())
  {
    vix::eprint("flush failed:", flushed.error().message());
    return 1;
  }

  return 0;
}
```

`write()` does not flush automatically. Use `flush()` when the program needs buffered output to be pushed immediately.

## Read a line from standard input

Use `stdin_stream()` to wrap standard input, then call `read_line()`.

```cpp id="x2o7qe"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  auto input = vix::io::stdin_stream();

  vix::print("Enter your name:");

  auto line = vix::io::read_line(input);

  if (!line.ok())
  {
    vix::eprint("read failed:", line.error().message());
    return 1;
  }

  vix::print("Hello", line.value());

  return 0;
}
```

By default, `read_line()` returns the line without the trailing newline. If the stream is already at end-of-stream, the current implementation returns an empty string as a successful result.

## Read all bytes from a stream

Use `read_all()` when the program wants all remaining bytes from an input stream. This is useful for tools, tests, and small transformations where the caller controls the source.

```cpp id="6v02ts"
#include <sstream>
#include <string>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("Vix IO reads bytes");

  vix::io::Input input(source);

  auto bytes = vix::io::read_all(input);

  if (!bytes.ok())
  {
    vix::eprint("read failed:", bytes.error().message());
    return 1;
  }

  std::string text(bytes.value().begin(), bytes.value().end());

  vix::print("content:", text);

  return 0;
}
```

The module returns bytes for raw reads because stream input is not always text. When the caller knows the data is textual, it can convert the returned `Bytes` value into a `std::string`.

## Write to a string stream

The same `Output` wrapper can be used with a string stream. This is useful in tests because the program can inspect what was written without touching the process standard output.

```cpp id="dx47um"
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
    vix::eprint("write failed:", written.error().message());
    return 1;
  }

  vix::print("captured:", target.str());

  return 0;
}
```

This is one of the main benefits of keeping `io` stream-oriented. The public workflow is the same whether the destination is standard output, a test buffer, or another stream owned by the application.

## Copy from input to output

Use `copy()` when the program wants to transfer all remaining bytes from one stream to another.

```cpp id="akx22c"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("copy this text");
  std::ostringstream target;

  vix::io::Input input(source);
  vix::io::Output output(target);

  auto copied = vix::io::copy(input, output);

  if (!copied.ok())
  {
    vix::eprint("copy failed:", copied.error().message());
    return 1;
  }

  vix::print("copied bytes:", copied.value());
  vix::print("target:", target.str());

  return 0;
}
```

`copy()` reads in chunks and writes each chunk to the output stream. The default chunk size comes from `IoOptions`.

## Use options

`IoOptions` carries the small configuration values used by higher-level operations. It controls chunk size, line newline behavior, automatic flushing, and the newline mode used by `write_line()`.

```cpp id="f6glr4"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::ostringstream target;

  vix::io::Output output(target);

  vix::io::IoOptions options;
  options.newline_mode = vix::io::NewlineMode::CRLF;
  options.auto_flush = true;

  auto written = vix::io::write_line(output, "hello", options);

  if (!written.ok())
  {
    vix::eprint("write failed:", written.error().message());
    return 1;
  }

  vix::print("bytes written:", written.value());

  return 0;
}
```

For line output, `NewlineMode::LF` writes `\n`, `NewlineMode::CRLF` writes `\r\n`, and `NewlineMode::Native` follows the platform convention.

## Work with bytes

The module uses `vix::io::Bytes` for raw byte data.

```cpp id="ev3vms"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::ostringstream target;

  vix::io::Output output(target);

  vix::io::Bytes bytes{65, 66, 67};

  auto written = vix::io::write(output, bytes);

  if (!written.ok())
  {
    vix::eprint("write failed:", written.error().message());
    return 1;
  }

  vix::print("text:", target.str());

  return 0;
}
```

`Bytes` is an alias for `std::vector<std::uint8_t>`. It is used by raw reads and writes so the API can represent binary data without pretending that every stream contains text.

## Use `Buffer` for in-memory bytes

`Buffer` is a small in-memory byte buffer. It can be built from text, appended to, cleared, inspected, and converted back to a string when the bytes are textual.

```cpp id="w0dj9y"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  vix::io::Buffer buffer("Hello");

  buffer.append(" ");
  buffer.append("Vix");

  vix::print("size:", buffer.size());
  vix::print("content:", buffer.to_string());

  return 0;
}
```

`Buffer` is useful when an operation needs to collect or pass bytes in memory before they are written somewhere else.

## Result handling pattern

The most important habit with the IO module is to check the result of every operation that can fail.

```cpp id="kc8h2a"
auto out = vix::io::stdout_stream();

auto result = vix::io::write_line(out, "message");

if (!result.ok())
{
  vix::eprint("io error:", result.error().message());
  return 1;
}
```

A successful result contains the value produced by the operation, such as bytes read, text read, bytes written, or a boolean flush result. A failed result contains a structured error with the `io` category and a generic Vix error code.

## Next step

Continue with input and output to understand the `Input` and `Output` wrappers, then move to read and write operations, line-oriented I/O, buffers, copying, standard streams, options, and error handling.
