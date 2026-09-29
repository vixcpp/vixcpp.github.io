# Copy

The `io` module provides `copy()` for transferring all remaining bytes from an `Input` stream to an `Output` stream. It is the simplest API to use when the program does not need to inspect or transform the data, and only needs to move bytes from one stream to another.

`copy()` works at the stream level. It does not open files by path, create destinations, or decide where data comes from. The caller provides an `Input` and an `Output`, and the module reads in chunks until the input stream is exhausted or an error occurs.

## Header

```cpp id="ygd3bh"
#include <vix/io.hpp>
#include <vix/print.hpp>
```

## Copy from one stream to another

A basic copy operation wraps a readable stream in `Input`, wraps a writable stream in `Output`, then calls `copy()`.

```cpp id="6sy165"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("hello from input");
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

The returned value is the total number of bytes written to the output stream. In this example, the content is text, but `copy()` does not treat it as text. It copies bytes, which makes the operation suitable for both text-like and binary stream data.

## Copy uses chunks

Internally, `copy()` reads from the input in chunks and writes each chunk to the output. The default chunk size comes from `IoOptions`.

```cpp id="yl4c2f"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("abcdef");
  std::ostringstream target;

  vix::io::Input input(source);
  vix::io::Output output(target);

  vix::io::IoOptions options;
  options.chunk_size = 2;

  auto copied = vix::io::copy(input, output, options);

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

A smaller chunk size is useful in tests because it proves that the operation works across multiple read and write steps. In normal code, the default chunk size is usually enough unless the caller has a specific memory or performance reason to tune it.

## Copy and auto-flush

When `auto_flush` is enabled, `copy()` flushes the output after the copy finishes.

```cpp id="nbb2xf"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("flush after copy");
  std::ostringstream target;

  vix::io::Input input(source);
  vix::io::Output output(target);

  vix::io::IoOptions options;
  options.auto_flush = true;

  auto copied = vix::io::copy(input, output, options);

  if (!copied.ok())
  {
    vix::eprint("copy failed:", copied.error().message());
    return 1;
  }

  vix::print("copied bytes:", copied.value());

  return 0;
}
```

This is useful when the destination should receive the copied data immediately, especially for interactive streams or output that may be read by another process. It should not be enabled automatically in every case, because flushing too often can reduce the benefit of buffering.

## Copy an empty stream

Copying an empty input stream succeeds and returns `0`.

```cpp id="c9wmyq"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("");
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
  vix::print("target is empty:", target.str().empty());

  return 0;
}
```

An empty stream is not an error. It simply means there were no bytes left to transfer.

## Copy to standard output

`copy()` can also work with the process standard streams through the IO stream helpers.

```cpp id="2w76ms"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("written through stdout\n");

  vix::io::Input input(source);
  auto output = vix::io::stdout_stream();

  auto copied = vix::io::copy(input, output);

  if (!copied.ok())
  {
    vix::eprint("copy to stdout failed:", copied.error().message());
    return 1;
  }

  return 0;
}
```

For ordinary documentation messages, `vix::print` is still the clearer output helper. Use `vix::io::copy()` when the example is specifically about transferring stream data.

## Error handling

`copy()` can fail during the read step, during the write step, or during the optional flush step. When any of those operations fails, the function returns the error immediately.

```cpp id="b9p3j8"
auto copied = vix::io::copy(input, output);

if (!copied.ok())
{
  vix::eprint("copy failed:", copied.error().message());
  return 1;
}
```

This is important because a copy operation is made of several smaller I/O operations. The input stream may fail while reading, the output stream may fail while writing, and a flush may fail even after all bytes were written. The result returned by `copy()` keeps those failures visible to the caller.

## When to use `copy`

Use `copy()` when the program wants to transfer bytes as they are. It is a good fit for forwarding stream content, building small test utilities, piping data between stream abstractions, or moving content from one already-opened source to one already-opened destination.

When the program needs to inspect, transform, filter, or parse the data, use `read()`, `read_all()`, or `read_line()` instead, then write the transformed result through `write()` or `write_line()`.

## Copy API overview

| API                                     | Return type    | Purpose                                                              |
| --------------------------------------- | -------------- | -------------------------------------------------------------------- |
| `vix::io::copy(input, output)`          | `IoSizeResult` | Copy all remaining bytes from input to output.                       |
| `vix::io::copy(input, output, options)` | `IoSizeResult` | Copy all remaining bytes using the provided chunk and flush options. |

The returned value is the total number of bytes written to the output stream.

## Next step

Continue with standard streams to see how the IO module wraps standard input, standard output, and standard error.
