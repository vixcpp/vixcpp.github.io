# Input and Output

The `io` module is built around two small stream wrappers: `Input` and `Output`. `Input` wraps a readable `std::istream`, while `Output` wraps a writable `std::ostream`. These classes do not try to replace C++ streams. They provide a Vix-style layer on top of them, where read and write operations return structured `Result` values instead of forcing the caller to inspect stream state manually after every operation.

This design keeps the module flexible. The same API can work with standard input and output, string streams in tests, file streams opened by another part of the program, or any other standard stream object. The important idea is that `io` does not own the source or destination by path. It works with streams that already exist.

## Header

```cpp id="zzpo4l"
#include <vix/io.hpp>
#include <vix/print.hpp>
```

## Input

`Input` is a wrapper around a readable stream. It stores a reference to the underlying stream and exposes a small set of operations for reading bytes, reading one line, checking the stream state, and accessing the original stream when needed.

```cpp id="pkj1m5"
#include <sstream>
#include <string>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("hello world");

  vix::io::Input input(source);

  auto bytes = input.read(5);

  if (!bytes.ok())
  {
    vix::eprint("read failed:", bytes.error().message());
    return 1;
  }

  std::string text(bytes.value().begin(), bytes.value().end());

  vix::print("read:", text);

  return 0;
}
```

`Input::read(max_bytes)` reads up to the requested number of bytes and returns the bytes that were actually read. The returned buffer can be smaller than `max_bytes`, especially near the end of the stream. An empty byte vector can mean that there is no more data to read.

## Reading a line from `Input`

For text-oriented input, `Input` also provides `read_line()`.

```cpp id="oj9p9p"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("first line\nsecond line\n");

  vix::io::Input input(source);

  auto line = input.read_line();

  if (!line.ok())
  {
    vix::eprint("read line failed:", line.error().message());
    return 1;
  }

  vix::print("line:", line.value());

  return 0;
}
```

The returned string does not include the trailing newline. If the stream is already at end-of-stream, the current implementation returns an empty string as a successful result. This behavior is useful for simple text processing, but code that needs to distinguish an empty line from end-of-stream should also check the stream state with `eof()`.

## Input state

`Input::good()` reports whether the wrapped stream is still in a readable state. `Input::eof()` reports whether the stream has reached end-of-stream.

```cpp id="3laeuw"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("data");

  vix::io::Input input(source);

  auto bytes = input.read(16);

  if (bytes.ok())
    vix::print("bytes read:", bytes.value().size());

  vix::print("good:", input.good());
  vix::print("eof:", input.eof());

  return 0;
}
```

These state helpers are useful when a loop needs to continue until the stream is exhausted. For most simple reads, checking the returned `Result` is the main error handling step.

## Output

`Output` is a wrapper around a writable stream. It exposes operations for writing raw bytes, writing text, flushing the stream, checking whether the stream is still writable, and accessing the original stream.

```cpp id="hy7mlg"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::ostringstream target;

  vix::io::Output output(target);

  auto written = output.write("hello");

  if (!written.ok())
  {
    vix::eprint("write failed:", written.error().message());
    return 1;
  }

  vix::print("bytes written:", written.value());
  vix::print("target:", target.str());

  return 0;
}
```

`Output::write(text)` writes the exact text passed to it. It does not append a newline, and it does not flush automatically. The returned value is the number of bytes written.

## Writing bytes

`Output` also accepts raw byte data through `vix::io::Bytes`.

```cpp id="vk4fmf"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::ostringstream target;

  vix::io::Output output(target);

  vix::io::Bytes bytes{65, 66, 67};

  auto written = output.write(bytes);

  if (!written.ok())
  {
    vix::eprint("write failed:", written.error().message());
    return 1;
  }

  vix::print("bytes written:", written.value());
  vix::print("target:", target.str());

  return 0;
}
```

The byte-oriented overload is useful when the data is not naturally text. The module uses `std::uint8_t` for bytes, so callers can work with binary data without converting everything through strings.

## Flushing output

Use `flush()` when buffered output should be pushed to the underlying stream immediately.

```cpp id="24065t"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::ostringstream target;

  vix::io::Output output(target);

  auto written = output.write("ready");

  if (!written.ok())
  {
    vix::eprint("write failed:", written.error().message());
    return 1;
  }

  auto flushed = output.flush();

  if (!flushed.ok())
  {
    vix::eprint("flush failed:", flushed.error().message());
    return 1;
  }

  vix::print("flushed:", flushed.value());

  return 0;
}
```

Flushing can fail, so it also returns a result. This matters when output is redirected, when the destination is no longer writable, or when the underlying stream enters a bad state.

## Output state

`Output::good()` reports whether the wrapped stream is still in a writable state.

```cpp id="5ia1xr"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::ostringstream target;

  vix::io::Output output(target);

  vix::print("writable:", output.good());

  return 0;
}
```

This is useful for diagnostics, but it should not replace checking the result of `write()` or `flush()`. A stream can be good before an operation and fail during the operation itself.

## Free functions and member functions

The module provides both member functions and free functions for the common operations. The free functions are thin wrappers that keep a consistent procedural API across the module.

```cpp id="d7jdw1"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("hello");
  std::ostringstream target;

  vix::io::Input input(source);
  vix::io::Output output(target);

  auto bytes = vix::io::read(input, 5);

  if (!bytes.ok())
  {
    vix::eprint("read failed:", bytes.error().message());
    return 1;
  }

  auto written = vix::io::write(output, bytes.value());

  if (!written.ok())
  {
    vix::eprint("write failed:", written.error().message());
    return 1;
  }

  vix::print("target:", target.str());

  return 0;
}
```

Use the style that makes the surrounding code clearer. Member functions are direct when the code is centered on one wrapper. Free functions are useful when writing code that treats I/O operations as module-level actions.

## Accessing the underlying stream

Both wrappers expose the underlying standard stream through `stream()`.

```cpp id="e4tsbe"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::ostringstream target;

  vix::io::Output output(target);

  output.stream() << "written through the underlying stream";

  vix::print("target:", target.str());

  return 0;
}
```

This escape hatch is useful when integrating with code that already expects a standard C++ stream. Use it deliberately. Once code writes directly to the underlying stream, it is responsible for handling the stream state in the normal C++ way.

## Standard stream wrappers

For process standard streams, use the helpers provided by the module.

```cpp id="0lxj8o"
auto input = vix::io::stdin_stream();
auto output = vix::io::stdout_stream();
auto error = vix::io::stderr_stream();
```

These functions return `Input` or `Output` wrappers around the process standard input, standard output, and standard error streams. They are documented separately on the standard streams page.

## Result handling

The main habit with `Input` and `Output` is to treat I/O as something that can fail. Reading and writing are not just data movement; they depend on the state of the underlying stream and destination.

```cpp id="kgwvsh"
auto result = output.write("message");

if (!result.ok())
{
  vix::eprint("write failed:", result.error().message());
  return 1;
}
```

This pattern keeps failure visible near the operation that produced it. It also keeps I/O code consistent with other Vix modules that use `vix::error::Result<T>`.

## API overview

| API                      | Purpose                                               |
| ------------------------ | ----------------------------------------------------- |
| `vix::io::Input`         | Wrap a readable `std::istream`.                       |
| `Input::read(max_bytes)` | Read up to `max_bytes` bytes.                         |
| `Input::read_line()`     | Read one line without the trailing newline.           |
| `Input::good()`          | Check whether the input stream is readable.           |
| `Input::eof()`           | Check whether the input stream reached end-of-stream. |
| `Input::stream()`        | Access the wrapped `std::istream`.                    |
| `vix::io::Output`        | Wrap a writable `std::ostream`.                       |
| `Output::write(bytes)`   | Write raw bytes.                                      |
| `Output::write(text)`    | Write text.                                           |
| `Output::flush()`        | Flush the output stream.                              |
| `Output::good()`         | Check whether the output stream is writable.          |
| `Output::stream()`       | Access the wrapped `std::ostream`.                    |

## Next step

Continue with read and write to see the higher-level operations for reading byte chunks, reading all remaining bytes, writing text, writing bytes, and flushing output.
