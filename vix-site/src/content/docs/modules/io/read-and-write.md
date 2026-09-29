# Read and Write

The `io` module provides direct operations for reading bytes from an `Input` and writing bytes or text to an `Output`. These operations are intentionally small. They do not open files, discover paths, or manage resources by themselves. They work on streams that already exist, and they return `Result` values so the caller can handle I/O failure explicitly.

This page focuses on byte-oriented and text-oriented stream operations: `read`, `read_all`, `write`, and `flush`. Line-oriented operations are covered separately because they involve newline behavior and `IoOptions`.

## Header

```cpp id="hmqg23"
#include <vix/io.hpp>
#include <vix/print.hpp>
```

## Read a fixed number of bytes

Use `read()` when the program wants to read up to a specific number of bytes from an input stream.

```cpp id="z04qkp"
#include <sstream>
#include <string>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("hello world");

  vix::io::Input input(source);

  auto bytes = vix::io::read(input, 5);

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

`read(input, max_bytes)` returns the bytes that were actually read. The returned byte vector may contain fewer bytes than requested, especially near the end of the stream. An empty byte vector is not automatically an error; it can mean that the stream has no more data to provide.

## Read all remaining bytes

Use `read_all()` when the program wants to consume the rest of an input stream.

```cpp id="xanjt7"
#include <sstream>
#include <string>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("Vix IO reads all remaining bytes");

  vix::io::Input input(source);

  auto bytes = vix::io::read_all(input);

  if (!bytes.ok())
  {
    vix::eprint("read_all failed:", bytes.error().message());
    return 1;
  }

  std::string text(bytes.value().begin(), bytes.value().end());

  vix::print("content:", text);

  return 0;
}
```

`read_all()` reads in chunks until the stream is exhausted. The default chunk size comes from `IoOptions`, and the operation returns one `Bytes` value containing all bytes collected from the stream.

## Configure read chunk size

`read_all()` accepts `IoOptions`. The `chunk_size` field controls how many bytes the function asks for on each internal read.

```cpp id="f9p2hf"
#include <sstream>
#include <string>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("abcdef");

  vix::io::Input input(source);

  vix::io::IoOptions options;
  options.chunk_size = 2;

  auto bytes = vix::io::read_all(input, options);

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

A small chunk size is useful in tests because it exercises repeated reads. In normal application code, the default is usually enough unless the caller has a specific reason to tune it.

## Write text

Use `write()` with a string-like value when the program needs to write text exactly as provided.

```cpp id="ha45ol"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::ostringstream target;

  vix::io::Output output(target);

  auto written = vix::io::write(output, "hello");

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

`write()` does not append a newline. It writes the text as-is and returns the number of bytes written. Use `write_line()` when the operation should append a newline.

## Write raw bytes

Use the byte overload when the data is binary or when the program already has a `Bytes` value.

```cpp id="q90o8s"
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

  vix::print("bytes written:", written.value());
  vix::print("target:", target.str());

  return 0;
}
```

`Bytes` is an alias for `std::vector<std::uint8_t>`. The module uses it for raw reads and writes because not every stream contains text.

## Flush output

Use `flush()` when buffered output should be pushed to the underlying stream immediately.

```cpp id="xsz4kp"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::ostringstream target;

  vix::io::Output output(target);

  auto written = vix::io::write(output, "ready");

  if (!written.ok())
  {
    vix::eprint("write failed:", written.error().message());
    return 1;
  }

  auto flushed = vix::io::flush(output);

  if (!flushed.ok())
  {
    vix::eprint("flush failed:", flushed.error().message());
    return 1;
  }

  vix::print("flushed:", flushed.value());

  return 0;
}
```

Flushing can fail when the stream is no longer writable or when the underlying destination reports an error. For that reason, `flush()` returns an `IoBoolResult` instead of silently assuming success.

## Writing to standard output

For process standard output, use `stdout_stream()` to create an `Output` wrapper.

```cpp id="5nc0nx"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  auto out = vix::io::stdout_stream();

  auto written = vix::io::write(out, "hello from stdout\n");

  if (!written.ok())
  {
    vix::eprint("stdout write failed:", written.error().message());
    return 1;
  }

  return 0;
}
```

For ordinary example output in documentation, `vix::print` remains the preferred helper. Use `vix::io::write` when the example is specifically about writing through the IO module.

## Reading and writing together

A common pattern is to read bytes from one stream and write them to another. For complete stream copying, use `copy()`. For smaller transformations, read the bytes, inspect or modify them, then write the result.

```cpp id="1gfkz7"
#include <algorithm>
#include <cctype>
#include <sstream>
#include <string>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("hello");
  std::ostringstream target;

  vix::io::Input input(source);
  vix::io::Output output(target);

  auto bytes = vix::io::read_all(input);

  if (!bytes.ok())
  {
    vix::eprint("read failed:", bytes.error().message());
    return 1;
  }

  std::string text(bytes.value().begin(), bytes.value().end());

  std::transform(text.begin(), text.end(), text.begin(), [](unsigned char c) {
    return static_cast<char>(std::toupper(c));
  });

  auto written = vix::io::write(output, text);

  if (!written.ok())
  {
    vix::eprint("write failed:", written.error().message());
    return 1;
  }

  vix::print("target:", target.str());

  return 0;
}
```

This keeps the stream operations explicit. The module reads bytes from the input, the application performs the transformation, and the module writes the result to the output.

## Empty reads and empty writes

An empty read result is not always an error. When `read()` reaches the end of the stream, it can return an empty byte vector successfully. This lets simple read loops stop naturally without treating end-of-stream as a failure.

```cpp id="yv4tvk"
auto bytes = vix::io::read(input, 4096);

if (!bytes.ok())
{
  vix::eprint("read failed:", bytes.error().message());
  return 1;
}

if (bytes.value().empty())
{
  vix::print("end of stream");
}
```

Empty writes are also valid. Writing an empty string or empty byte vector returns `0` bytes written. This behavior keeps no-op writes predictable and avoids turning harmless empty data into an error.

## Result types

Read and write operations use the standard IO result aliases.

| API                                 | Return type     | Meaning                                   |
| ----------------------------------- | --------------- | ----------------------------------------- |
| `vix::io::read(input, max_bytes)`   | `IoBytesResult` | Bytes read from the stream.               |
| `vix::io::read_all(input, options)` | `IoBytesResult` | All remaining bytes read from the stream. |
| `vix::io::write(output, text)`      | `IoSizeResult`  | Number of text bytes written.             |
| `vix::io::write(output, bytes)`     | `IoSizeResult`  | Number of raw bytes written.              |
| `vix::io::flush(output)`            | `IoBoolResult`  | Whether the flush succeeded.              |

`IoBytesResult` contains `vix::io::Bytes`. `IoSizeResult` contains a `std::uintmax_t` byte count. These types keep I/O code explicit about whether it is returning data, a size, or a success state.

## Practical error handling

A read or write operation should be checked at the point where it happens. Stream errors often depend on the environment: redirected output may be closed, input may be unavailable, and a stream that was valid earlier can fail during the operation.

```cpp id="tyidlb"
auto result = vix::io::write(output, "message");

if (!result.ok())
{
  vix::eprint("write failed:", result.error().message());
  return 1;
}
```

This pattern is the main discipline of the module. The API stays small, but the caller does not lose the ability to handle failure precisely.

## Next step

Continue with lines to see how `read_line()` and `write_line()` handle text lines, trailing newlines, newline modes, and automatic flushing.
