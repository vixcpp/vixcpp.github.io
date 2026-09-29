# Errors

The `io` module uses structured errors for operations that read from streams, write to streams, flush output, or copy bytes between streams. These operations can fail for ordinary reasons: a stream may be invalid, input may enter a bad state, output may reject a write, or a flush may fail after buffered data is written.

Instead of hiding those cases behind stream flags that the caller must remember to inspect manually, Vix returns `vix::error::Result<T>` values. A successful result contains the value produced by the operation. A failed result contains a `vix::error::Error` with the `io` category and a generic Vix error code.

## Header

```cpp id="15cptu"
#include <vix/io.hpp>
#include <vix/print.hpp>
```

## Handle an I/O result

The normal pattern is to call an I/O operation, check the result, then use either the value or the error.

```cpp id="i93ffk"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  auto output = vix::io::stdout_stream();

  auto result = vix::io::write_line(output, "hello");

  if (!result.ok())
  {
    vix::eprint("write failed:", result.error().message());
    return 1;
  }

  vix::print("bytes written:", result.value());

  return 0;
}
```

This style keeps the failure close to the stream operation that produced it. That matters because stream errors are often environmental. The same program may write successfully in a terminal, fail when output is redirected to a closed pipe, or fail because the underlying stream has entered a bad state.

## I/O error codes

The module defines `IoErrorCode` for failures that are specific to I/O operations.

```cpp id="99jgir"
enum class IoErrorCode
{
  None = 0,
  InvalidInput,
  InvalidOutput,
  InvalidOperation,
  ReadFailed,
  WriteFailed,
  FlushFailed,
  EndOfStream,
  Closed,
  Timeout,
  Unknown
};
```

These codes describe the semantic reason for the failure before it is mapped into the generic Vix error model.

| I/O error code                  | Meaning                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| `IoErrorCode::None`             | No I/O error.                                                    |
| `IoErrorCode::InvalidInput`     | The input stream or input operation is invalid.                  |
| `IoErrorCode::InvalidOutput`    | The output stream or output operation is invalid.                |
| `IoErrorCode::InvalidOperation` | The requested I/O operation is not valid in the current context. |
| `IoErrorCode::ReadFailed`       | Reading from the input stream failed.                            |
| `IoErrorCode::WriteFailed`      | Writing to the output stream failed.                             |
| `IoErrorCode::FlushFailed`      | Flushing the output stream failed.                               |
| `IoErrorCode::EndOfStream`      | The operation reached the end of the stream.                     |
| `IoErrorCode::Closed`           | The stream or channel is closed.                                 |
| `IoErrorCode::Timeout`          | The operation timed out.                                         |
| `IoErrorCode::Unknown`          | The failure could not be classified more precisely.              |

Some codes are part of the public error vocabulary even if the current stream helpers do not produce all of them in ordinary use. This gives the module room to support richer I/O sources later without changing the basic error model.

## Generic Vix error mapping

`IoErrorCode` values are converted to generic `vix::error::ErrorCode` values. This lets higher-level code handle broad categories of errors without depending on every module-specific enum.

| I/O error code                  | Generic error code                       |
| ------------------------------- | ---------------------------------------- |
| `IoErrorCode::None`             | `vix::error::ErrorCode::Ok`              |
| `IoErrorCode::InvalidInput`     | `vix::error::ErrorCode::InvalidArgument` |
| `IoErrorCode::InvalidOutput`    | `vix::error::ErrorCode::InvalidArgument` |
| `IoErrorCode::InvalidOperation` | `vix::error::ErrorCode::InvalidArgument` |
| `IoErrorCode::ReadFailed`       | `vix::error::ErrorCode::IoError`         |
| `IoErrorCode::WriteFailed`      | `vix::error::ErrorCode::IoError`         |
| `IoErrorCode::FlushFailed`      | `vix::error::ErrorCode::IoError`         |
| `IoErrorCode::EndOfStream`      | `vix::error::ErrorCode::NotFound`        |
| `IoErrorCode::Closed`           | `vix::error::ErrorCode::InvalidState`    |
| `IoErrorCode::Timeout`          | `vix::error::ErrorCode::Timeout`         |
| `IoErrorCode::Unknown`          | `vix::error::ErrorCode::Unknown`         |

This mapping is useful when an application wants to treat all stream failures as `IoError`, but still preserve more precise module-level information near the implementation.

## Error category

All structured errors created by the IO module use the `io` category.

```cpp id="sdlc2i"
auto category = vix::io::io_error_category();
```

The category helps identify where the error came from. A failed read from the IO module is different from a filesystem error, a path error, an OS query error, or an application validation error, even when the generic error code is similar.

## Read failures

Read operations return `IoBytesResult` or `IoStringResult`. A failed read returns an error instead of a partial value.

```cpp id="x3pqsr"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("hello");
  vix::io::Input input(source);

  auto bytes = vix::io::read(input, 5);

  if (!bytes.ok())
  {
    vix::eprint("read failed:", bytes.error().message());
    return 1;
  }

  vix::print("bytes read:", bytes.value().size());

  return 0;
}
```

An empty byte vector is not automatically an error. It can mean that the stream is already exhausted. A real read failure is reported as a failed result, usually with a generic `IoError` code.

## Line reads and end-of-stream

In the current implementation, `read_line()` can return an empty string successfully when the stream is at end-of-stream. Code that needs to distinguish an empty line from end-of-stream should check the input state.

```cpp id="y7jpit"
auto line = vix::io::read_line(input);

if (!line.ok())
{
  vix::eprint("read line failed:", line.error().message());
  return 1;
}

if (line.value().empty() && input.eof())
{
  vix::print("end of stream");
}
else
{
  vix::print("line:", line.value());
}
```

This distinction matters for parsers and line-based tools. An empty line can be valid input, while end-of-stream means there is no more input to process.

## Write failures

Write operations return `IoSizeResult`. On success, the value is the number of bytes written. On failure, the result contains an I/O error.

```cpp id="84c7tk"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  auto output = vix::io::stdout_stream();

  auto written = vix::io::write(output, "message");

  if (!written.ok())
  {
    vix::eprint("write failed:", written.error().message());
    return 1;
  }

  return 0;
}
```

Writing can fail even when the stream looked valid before the call. A redirected output stream may be closed by the receiving process, a file-backed stream may fail underneath, or the stream state may become invalid during the write itself. Checking the result after the operation is the reliable point of failure handling.

## Flush failures

`flush()` also returns a result. This is important because a stream can accept buffered data and still fail when the program tries to push that data to the destination.

```cpp id="gs5cse"
auto output = vix::io::stdout_stream();

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
```

When immediate visibility matters, handle flush errors just as deliberately as write errors. This is especially important for prompts, progress output, and tools that communicate through pipes.

## Copy failures

`copy()` combines several operations: it reads a chunk, writes that chunk, repeats until the input is exhausted, and optionally flushes the output. Any of those steps can fail.

```cpp id="gh82x9"
auto copied = vix::io::copy(input, output);

if (!copied.ok())
{
  vix::eprint("copy failed:", copied.error().message());
  return 1;
}

vix::print("copied bytes:", copied.value());
```

A copy failure returns the first error encountered. This keeps the API simple and makes the caller handle the operation as one unit: either the copy completed and returned a byte count, or it failed with the underlying I/O error.

## Creating an I/O error

The module provides `make_io_error()` for implementation code and tests that need to construct a structured IO error.

```cpp id="z4676i"
auto error = vix::io::make_io_error(
  vix::io::IoErrorCode::WriteFailed,
  "failed to write text to output stream"
);
```

This creates a `vix::error::Error` using the mapped generic error code, the `io` category, and the provided message. Application code usually receives these errors from public IO functions rather than creating them directly.

## Converting I/O error codes to strings

Use `to_string()` when diagnostics or tests need the stable symbolic name of an `IoErrorCode`.

```cpp id="q5xlws"
auto name = vix::io::to_string(vix::io::IoErrorCode::ReadFailed);

vix::print("io error:", name);
```

Typical returned values include:

```text id="n22kk8"
none
invalid_input
invalid_output
invalid_operation
read_failed
write_failed
flush_failed
end_of_stream
closed
timeout
unknown
```

These names are useful for diagnostics and assertions. For user-facing messages, prefer the message stored in the returned `vix::error::Error`.

## Practical error handling style

Treat required I/O as fatal and optional I/O as recoverable. A command that cannot read its input should usually return an error. A diagnostic command that fails to print one optional value may be able to continue. The important part is to make that decision explicitly.

```cpp id="k9sipj"
auto output = vix::io::stdout_stream();

auto result = vix::io::write_line(output, "status: ok");

if (!result.ok())
{
  vix::eprint("cannot write status:", result.error().message());
  return 1;
}
```

This is the main discipline of the module. Stream operations are small, but they are still external operations. They can fail, and the code should say clearly what happens when they do.

## Error API overview

| API                                     | Purpose                                               |
| --------------------------------------- | ----------------------------------------------------- |
| `vix::io::IoErrorCode`                  | I/O-specific semantic error code.                     |
| `vix::io::io_error_category()`          | Return the `io` error category.                       |
| `vix::io::to_error_code(code)`          | Convert an `IoErrorCode` to a generic Vix error code. |
| `vix::io::to_string(code)`              | Convert an `IoErrorCode` to a symbolic string.        |
| `vix::io::make_io_error(code, message)` | Create a structured IO error.                         |
| `vix::io::IoBoolResult`                 | Result type for operations returning a boolean.       |
| `vix::io::IoStringResult`               | Result type for operations returning text.            |
| `vix::io::IoBytesResult`                | Result type for operations returning bytes.           |
| `vix::io::IoSizeResult`                 | Result type for operations returning a byte count.    |

## Next step

Continue with the API reference for a compact lookup of every public type and function provided by the IO module.
