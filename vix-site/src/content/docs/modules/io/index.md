# IO

The `io` module provides a small stream-oriented I/O layer for Vix applications. It gives application code a consistent way to read bytes, read lines, write text, write bytes, flush output, copy data from one stream to another, and work with standard input, standard output, and standard error.

The module is built around C++ streams, but it keeps the public workflow closer to the rest of Vix: operations return `vix::error::Result<T>` values, errors use a module-specific category, and common actions are exposed through simple functions such as `read_all`, `read_line`, `write_line`, and `copy`.

## Header

Use the public IO header:

```cpp id="dye9jd"
#include <vix/io.hpp>
```

For examples that print diagnostic information, include the Vix print API:

```cpp id="2yfo6x"
#include <vix/print.hpp>
```

## What the module is for

The `io` module is useful when a program needs to work with streams and buffers without spreading low-level stream checks throughout the code. It is not the filesystem module. It does not open files by path, create directories, inspect metadata, or manipulate paths. Those responsibilities belong to `fs` and `path`.

Instead, `io` starts from readable and writable streams. An `Input` wraps a readable stream, an `Output` wraps a writable stream, and the module provides small operations on top of those wrappers. This makes it possible to use the same API shape with standard streams, string streams in tests, file streams created elsewhere, or any other stream-like object that fits the standard C++ stream model.

## Basic example

```cpp id="2lm9p9"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  auto out = vix::io::stdout_stream();

  auto result = vix::io::write_line(out, "Hello from Vix IO");

  if (!result.ok())
  {
    vix::eprint("write failed:", result.error().message());
    return 1;
  }

  vix::print("bytes written:", result.value());

  return 0;
}
```

`write_line` writes the provided text and appends a newline. It returns the number of bytes written, including the newline bytes. The result must be checked because output can fail: a stream may be closed, redirected to a broken pipe, or enter an invalid state.

## Core abstractions

The module is organized around a few small public types.

`Buffer` is an in-memory byte buffer. It stores `std::uint8_t` values, can be constructed from bytes or text, supports append operations, and can convert its bytes back to a string when the data is text.

`Input` wraps a readable stream. It provides `read(max_bytes)`, `read_line()`, `good()`, `eof()`, and access to the underlying stream when lower-level integration is required.

`Output` wraps a writable stream. It provides `write(bytes)`, `write(text)`, `flush()`, `good()`, and access to the underlying stream.

`IoOptions` carries common options used by higher-level operations. It controls chunk size for reading and copying, whether line reads keep the trailing newline, whether writes flush automatically, and which newline mode is used by line-oriented writes.

These types keep the module small. The main workflow remains easy to read: wrap a stream, call an operation, check the result, and continue.

## Reading

Use `read` when the program needs a limited number of bytes, and `read_all` when it wants the remaining content from an input stream.

```cpp id="gyyurv"
#include <sstream>
#include <string>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("hello world");
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

Reading returns bytes because the module works at the I/O layer. When the caller knows that the bytes represent text, it can convert them into a string. For line-oriented text input, `read_line` is usually the clearer API.

## Writing

Use `write` for text or raw bytes, and `write_line` when the operation should append a newline.

```cpp id="k683cj"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::ostringstream target;
  vix::io::Output output(target);

  auto result = vix::io::write_line(output, "status: ok");

  if (!result.ok())
  {
    vix::eprint("write failed:", result.error().message());
    return 1;
  }

  vix::print("captured:", target.str());

  return 0;
}
```

This shape is useful in tests because the same `Output` abstraction can write to a string stream instead of the process output stream. Application code can then use the same result handling style in both real I/O and test I/O.

## Lines

Line-oriented APIs are controlled by `IoOptions`. By default, `read_line` returns the line without the trailing newline, and `write_line` writes `\n`.

```cpp id="5oypli"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("first\nsecond\n");
  vix::io::Input input(source);

  auto line = vix::io::read_line(input);

  if (line.ok())
    vix::print("line:", line.value());

  return 0;
}
```

For output, `NewlineMode` can be set to `LF`, `CRLF`, or `Native`. This makes the newline decision explicit at the call site when a format requires a specific line ending.

## Copying streams

Use `copy` to transfer all remaining bytes from an `Input` to an `Output`.

```cpp id="gmj3fk"
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

`copy` uses the configured chunk size from `IoOptions`. It can also flush the output automatically when `auto_flush` is enabled.

## Result-based errors

I/O operations fail for ordinary reasons: input can be invalid, output can be invalid, a read can fail, a write can fail, or a flush can fail. The module represents those failures with `IoErrorCode` and maps them into the generic Vix error model.

```cpp id="j5em63"
auto out = vix::io::stdout_stream();
auto result = vix::io::write(out, "hello");

if (!result.ok())
{
  vix::eprint("io error:", result.error().message());
  return 1;
}
```

This keeps I/O code explicit. A successful result contains the value produced by the operation, usually bytes, text, a byte count, or a boolean. A failed result contains a structured error with the `io` category.

## Main API groups

The module is documented in focused pages:

```text id="vzze2u"
modules/io/quick-start.md
modules/io/input-and-output.md
modules/io/read-and-write.md
modules/io/lines.md
modules/io/buffers.md
modules/io/copy.md
modules/io/standard-streams.md
modules/io/options.md
modules/io/errors.md
modules/io/api-reference.md
```

Start with the quick start page for the basic workflow, then move to the topic pages depending on whether you need stream wrappers, line-oriented I/O, buffers, copying, standard streams, options, or error handling.
