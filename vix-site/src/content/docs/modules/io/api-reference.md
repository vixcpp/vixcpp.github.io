# API Reference

This page lists the public API exposed by the `io` module. The module lives in the `vix::io` namespace and provides stream-oriented helpers for reading bytes, reading lines, writing text, writing bytes, flushing output, copying streams, and wrapping standard input, standard output, and standard error.

For normal application code, include the public IO header:

```cpp id="e6nlmu"
#include <vix/io.hpp>
```

For examples that print diagnostic information, include the Vix print API:

```cpp id="n3fhb2"
#include <vix/print.hpp>
```

## Namespace

All IO module APIs are available under:

```cpp id="9s1urq"
namespace vix::io
```

## Byte and result types

The module uses `Bytes` for raw byte data and result aliases for common I/O return values.

```cpp id="aj0nmz"
using Bytes = std::vector<std::uint8_t>;

using IoBoolResult   = vix::error::Result<bool>;
using IoStringResult = vix::error::Result<std::string>;
using IoBytesResult  = vix::error::Result<Bytes>;
using IoSizeResult   = vix::error::Result<std::uintmax_t>;
```

These aliases do not introduce a separate error model. They are named forms of `vix::error::Result<T>` for the values returned by I/O operations.

| Alias            | Meaning                                                       |
| ---------------- | ------------------------------------------------------------- |
| `Bytes`          | Raw byte storage used by read and write operations.           |
| `IoBoolResult`   | Result type for operations returning a boolean success value. |
| `IoStringResult` | Result type for operations returning text.                    |
| `IoBytesResult`  | Result type for operations returning raw bytes.               |
| `IoSizeResult`   | Result type for operations returning a byte count.            |

## Buffer

`Buffer` is a small in-memory byte buffer.

```cpp id="gecd3h"
class Buffer
{
public:
  using value_type = std::uint8_t;
  using storage_type = std::vector<value_type>;

  Buffer();
  explicit Buffer(storage_type data);
  explicit Buffer(std::string_view text);

  bool empty() const noexcept;
  std::size_t size() const noexcept;
  void clear() noexcept;

  void append(const value_type *data, std::size_t size);
  void append(const storage_type &data);
  void append(std::string_view text);

  const storage_type &bytes() const noexcept;
  storage_type &bytes() noexcept;

  const value_type *data() const noexcept;
  value_type *data() noexcept;

  std::string to_string() const;
};
```

### `Buffer()`

Creates an empty buffer.

```cpp id="pjlcd0"
vix::io::Buffer buffer;

vix::print("empty:", buffer.empty());
```

### `Buffer(storage_type data)`

Creates a buffer from byte storage.

```cpp id="oodljr"
vix::io::Buffer buffer(vix::io::Buffer::storage_type{65, 66, 67});

vix::print("content:", buffer.to_string());
```

### `Buffer(std::string_view text)`

Creates a buffer from text bytes.

```cpp id="zhznui"
vix::io::Buffer buffer("Hello Vix");

vix::print("size:", buffer.size());
```

### `empty`

```cpp id="l0xkns"
bool empty() const noexcept;
```

Returns `true` when the buffer contains no bytes.

### `size`

```cpp id="zdjgrl"
std::size_t size() const noexcept;
```

Returns the number of bytes stored in the buffer.

### `clear`

```cpp id="fs1qpg"
void clear() noexcept;
```

Removes all bytes from the buffer.

### `append`

```cpp id="fic85a"
void append(const value_type *data, std::size_t size);
void append(const storage_type &data);
void append(std::string_view text);
```

Appends raw bytes, byte storage, or text bytes to the end of the buffer. Empty input does nothing.

### `bytes`

```cpp id="t3e7ge"
const storage_type &bytes() const noexcept;
storage_type &bytes() noexcept;
```

Returns the underlying byte storage.

### `data`

```cpp id="an58mu"
const value_type *data() const noexcept;
value_type *data() noexcept;
```

Returns a pointer to the underlying bytes. Use it together with `size()`.

### `to_string`

```cpp id="z3tsp6"
std::string to_string() const;
```

Builds a `std::string` from the stored bytes. This is useful when the buffer contains text-like data.

## Input

`Input` wraps a readable stream.

```cpp id="v6z9z6"
class Input
{
public:
  explicit Input(std::istream &stream) noexcept;

  IoBytesResult read(std::size_t max_bytes);
  IoStringResult read_line();

  bool good() const noexcept;
  bool eof() const noexcept;

  std::istream &stream() noexcept;
};
```

### `Input`

```cpp id="s2hkb7"
explicit Input(std::istream &stream) noexcept;
```

Creates an input wrapper around a readable stream.

```cpp id="eplqu8"
std::istringstream source("hello");

vix::io::Input input(source);
```

### `read`

```cpp id="x39bf5"
IoBytesResult read(std::size_t max_bytes);
```

Reads up to `max_bytes` bytes from the stream.

```cpp id="uoe1v2"
auto bytes = input.read(5);

if (bytes.ok())
  vix::print("bytes read:", bytes.value().size());
```

An empty byte vector can mean end-of-stream. It is not automatically an error.

### `read_line`

```cpp id="z4iaee"
IoStringResult read_line();
```

Reads one line from the stream and returns it without the trailing newline.

```cpp id="d8lzuo"
auto line = input.read_line();

if (line.ok())
  vix::print("line:", line.value());
```

### `good`

```cpp id="1iugyg"
bool good() const noexcept;
```

Returns whether the wrapped stream is still in a readable state.

### `eof`

```cpp id="liukvs"
bool eof() const noexcept;
```

Returns whether the wrapped stream has reached end-of-stream.

### `stream`

```cpp id="8h9zqp"
std::istream &stream() noexcept;
```

Returns the wrapped stream. Use this only when integrating with code that expects a standard C++ input stream.

## Output

`Output` wraps a writable stream.

```cpp id="kh1i3a"
class Output
{
public:
  explicit Output(std::ostream &stream) noexcept;

  IoSizeResult write(const Bytes &data);
  IoSizeResult write(std::string_view text);

  IoBoolResult flush();

  bool good() const noexcept;

  std::ostream &stream() noexcept;
};
```

### `Output`

```cpp id="rw2rxe"
explicit Output(std::ostream &stream) noexcept;
```

Creates an output wrapper around a writable stream.

```cpp id="bc37cz"
std::ostringstream target;

vix::io::Output output(target);
```

### `write(bytes)`

```cpp id="tvf0ix"
IoSizeResult write(const Bytes &data);
```

Writes raw bytes to the stream and returns the number of bytes written.

```cpp id="s3jopo"
vix::io::Bytes bytes{65, 66, 67};

auto written = output.write(bytes);

if (written.ok())
  vix::print("bytes written:", written.value());
```

### `write(text)`

```cpp id="jwuzum"
IoSizeResult write(std::string_view text);
```

Writes text to the stream and returns the number of bytes written. It does not append a newline.

```cpp id="m6qvrz"
auto written = output.write("hello");

if (written.ok())
  vix::print("bytes written:", written.value());
```

### `flush`

```cpp id="ac9a0t"
IoBoolResult flush();
```

Flushes the wrapped stream.

```cpp id="duw7i8"
auto flushed = output.flush();

if (!flushed.ok())
  vix::eprint("flush failed:", flushed.error().message());
```

### `good`

```cpp id="o4h707"
bool good() const noexcept;
```

Returns whether the wrapped stream is still in a writable state.

### `stream`

```cpp id="cr4eay"
std::ostream &stream() noexcept;
```

Returns the wrapped stream. Use this when integrating with code that expects a standard C++ output stream.

## Read operations

### `read`

```cpp id="y8vj7x"
IoBytesResult read(Input &input, std::size_t max_bytes);
```

Reads up to `max_bytes` bytes from an input stream.

```cpp id="zjbz8y"
auto bytes = vix::io::read(input, 1024);

if (!bytes.ok())
{
  vix::eprint("read failed:", bytes.error().message());
  return 1;
}
```

### `read_all`

```cpp id="hex9qe"
IoBytesResult read_all(Input &input, const IoOptions &options = {});
```

Reads all remaining bytes from an input stream.

```cpp id="vgiwri"
auto bytes = vix::io::read_all(input);

if (bytes.ok())
  vix::print("bytes:", bytes.value().size());
```

`read_all()` reads in chunks. The chunk size is controlled by `IoOptions::chunk_size`.

### `read_line`

```cpp id="xzrno0"
IoStringResult read_line(Input &input, const IoOptions &options = {});
```

Reads a single line from an input stream.

```cpp id="mdt2ww"
auto line = vix::io::read_line(input);

if (line.ok())
  vix::print("line:", line.value());
```

By default, the returned string does not include the trailing newline. Set `IoOptions::keep_newline` to preserve it.

## Write operations

### `write(bytes)`

```cpp id="pidxa6"
IoSizeResult write(Output &output, const Bytes &data);
```

Writes raw bytes to an output stream.

```cpp id="hdww78"
vix::io::Bytes bytes{65, 66, 67};

auto written = vix::io::write(output, bytes);
```

### `write(text)`

```cpp id="nq7op5"
IoSizeResult write(Output &output, std::string_view text);
```

Writes text to an output stream.

```cpp id="eo6liu"
auto written = vix::io::write(output, "hello");
```

`write()` does not append a newline. Use `write_line()` for line-oriented output.

### `write_line`

```cpp id="xvr8ps"
IoSizeResult write_line(Output &output,
                        std::string_view text,
                        const IoOptions &options = {});
```

Writes text followed by a newline sequence.

```cpp id="tcu37a"
auto written = vix::io::write_line(output, "status: ok");

if (!written.ok())
{
  vix::eprint("write line failed:", written.error().message());
  return 1;
}
```

The newline sequence is controlled by `IoOptions::newline_mode`. The function returns the total number of bytes written, including the newline bytes.

### `flush`

```cpp id="g5lckk"
IoBoolResult flush(Output &output);
```

Flushes an output stream.

```cpp id="tiygvc"
auto flushed = vix::io::flush(output);

if (!flushed.ok())
  vix::eprint("flush failed:", flushed.error().message());
```

## Copy

### `copy`

```cpp id="c93mqa"
IoSizeResult copy(Input &input,
                  Output &output,
                  const IoOptions &options = {});
```

Copies all remaining bytes from an input stream to an output stream and returns the total number of bytes written.

```cpp id="kxzouf"
auto copied = vix::io::copy(input, output);

if (!copied.ok())
{
  vix::eprint("copy failed:", copied.error().message());
  return 1;
}

vix::print("copied bytes:", copied.value());
```

`copy()` uses `IoOptions::chunk_size` for internal reads. When `IoOptions::auto_flush` is true, it flushes the output after the copy finishes.

## Standard streams

### `stdin_stream`

```cpp id="uh1eec"
Input stdin_stream() noexcept;
```

Returns an `Input` wrapper around the process standard input stream.

```cpp id="wooe1a"
auto input = vix::io::stdin_stream();
```

### `stdout_stream`

```cpp id="w22e51"
Output stdout_stream() noexcept;
```

Returns an `Output` wrapper around the process standard output stream.

```cpp id="uip6v5"
auto output = vix::io::stdout_stream();

auto written = vix::io::write_line(output, "hello");
```

### `stderr_stream`

```cpp id="mfao9c"
Output stderr_stream() noexcept;
```

Returns an `Output` wrapper around the process standard error stream.

```cpp id="r8fzd8"
auto error = vix::io::stderr_stream();

auto written = vix::io::write_line(error, "error: invalid input");
```

## Options

### `NewlineMode`

```cpp id="s1w1fr"
enum class NewlineMode
{
  LF,
  CRLF,
  Native
};
```

Controls the newline sequence used by `write_line()`.

| Value                 | Meaning                      |
| --------------------- | ---------------------------- |
| `NewlineMode::LF`     | Write `\n`.                  |
| `NewlineMode::CRLF`   | Write `\r\n`.                |
| `NewlineMode::Native` | Use the platform convention. |

On Windows, `Native` writes `\r\n`. On other supported platforms, it writes `\n`.

### `IoOptions`

```cpp id="mjw5iw"
struct IoOptions
{
  std::size_t chunk_size{4096};
  bool keep_newline{false};
  bool auto_flush{false};
  NewlineMode newline_mode{NewlineMode::LF};
};
```

Common options reused by higher-level I/O operations.

| Field          | Default           | Used by              | Purpose                                                |
| -------------- | ----------------- | -------------------- | ------------------------------------------------------ |
| `chunk_size`   | `4096`            | `read_all`, `copy`   | Preferred number of bytes read per chunk.              |
| `keep_newline` | `false`           | `read_line`          | Preserve the trailing newline in the returned line.    |
| `auto_flush`   | `false`           | `write_line`, `copy` | Flush output after the operation completes.            |
| `newline_mode` | `NewlineMode::LF` | `write_line`         | Choose the newline sequence appended to written lines. |

## I/O errors

### `IoErrorCode`

```cpp id="r6hc3f"
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

Represents semantic I/O failures before they are mapped into the generic Vix error model.

| Value              | Meaning                                                    |
| ------------------ | ---------------------------------------------------------- |
| `None`             | No I/O error.                                              |
| `InvalidInput`     | The input stream or input operation is invalid.            |
| `InvalidOutput`    | The output stream or output operation is invalid.          |
| `InvalidOperation` | The requested operation is invalid in the current context. |
| `ReadFailed`       | Reading from the input stream failed.                      |
| `WriteFailed`      | Writing to the output stream failed.                       |
| `FlushFailed`      | Flushing the output stream failed.                         |
| `EndOfStream`      | The operation reached the end of the stream.               |
| `Closed`           | The stream or channel is closed.                           |
| `Timeout`          | The operation timed out.                                   |
| `Unknown`          | The failure could not be classified more precisely.        |

### `io_error_category`

```cpp id="y3s2ej"
inline constexpr vix::error::ErrorCategory
io_error_category() noexcept;
```

Returns the IO module error category.

```cpp id="r2tp65"
auto category = vix::io::io_error_category();
```

The category name is `io`.

### `to_error_code`

```cpp id="hiflg5"
inline constexpr vix::error::ErrorCode
to_error_code(IoErrorCode code) noexcept;
```

Converts an `IoErrorCode` to a generic `vix::error::ErrorCode`.

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

### `to_string`

```cpp id="viqf92"
const char *to_string(IoErrorCode code) noexcept;
```

Converts an `IoErrorCode` to a stable symbolic string.

```cpp id="ktzlxf"
auto name = vix::io::to_string(vix::io::IoErrorCode::WriteFailed);

vix::print("io error:", name);
```

Returned values include:

```text id="eg4po0"
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

### `make_io_error`

```cpp id="ui5r8z"
vix::error::Error make_io_error(IoErrorCode code,
                                std::string message);
```

Creates a structured `vix::error::Error` for the IO module.

```cpp id="hii75q"
auto error = vix::io::make_io_error(
  vix::io::IoErrorCode::WriteFailed,
  "failed to write text to output stream"
);
```

This helper is mostly useful inside module implementations and tests. Application code usually receives IO errors from public IO functions.

## Complete API overview

| API                                          | Return type                 | Purpose                                                 |
| -------------------------------------------- | --------------------------- | ------------------------------------------------------- |
| `vix::io::Buffer`                            | class                       | Store bytes in memory.                                  |
| `vix::io::Input`                             | class                       | Wrap a readable stream.                                 |
| `vix::io::Output`                            | class                       | Wrap a writable stream.                                 |
| `vix::io::Bytes`                             | `std::vector<std::uint8_t>` | Represent raw byte data.                                |
| `vix::io::read(input, max_bytes)`            | `IoBytesResult`             | Read up to a fixed number of bytes.                     |
| `vix::io::read_all(input, options)`          | `IoBytesResult`             | Read all remaining bytes.                               |
| `vix::io::read_line(input, options)`         | `IoStringResult`            | Read one line.                                          |
| `vix::io::write(output, bytes)`              | `IoSizeResult`              | Write raw bytes.                                        |
| `vix::io::write(output, text)`               | `IoSizeResult`              | Write text.                                             |
| `vix::io::write_line(output, text, options)` | `IoSizeResult`              | Write text followed by a newline.                       |
| `vix::io::flush(output)`                     | `IoBoolResult`              | Flush an output stream.                                 |
| `vix::io::copy(input, output, options)`      | `IoSizeResult`              | Copy all remaining bytes from input to output.          |
| `vix::io::stdin_stream()`                    | `Input`                     | Wrap standard input.                                    |
| `vix::io::stdout_stream()`                   | `Output`                    | Wrap standard output.                                   |
| `vix::io::stderr_stream()`                   | `Output`                    | Wrap standard error.                                    |
| `vix::io::IoOptions`                         | struct                      | Configure chunk size, newline behavior, and auto-flush. |
| `vix::io::NewlineMode`                       | enum class                  | Select the newline sequence used by line writes.        |
| `vix::io::IoErrorCode`                       | enum class                  | Represent I/O-specific error cases.                     |
| `vix::io::io_error_category()`               | `ErrorCategory`             | Return the IO error category.                           |
| `vix::io::to_error_code(code)`               | `ErrorCode`                 | Convert an IO error code to a generic Vix error code.   |
| `vix::io::to_string(code)`                   | `const char *`              | Convert an IO error code to a symbolic string.          |
| `vix::io::make_io_error(code, message)`      | `Error`                     | Create a structured IO error.                           |

## Related pages

Use the topic pages when you need more explanation around a specific group of APIs:

- [Input and Output](/modules/io/input-and-output)
- [Read and Write](/modules/io/read-and-write)
- [Lines](/modules/io/lines)
- [Buffers](/modules/io/buffers)
- [Copy](/modules/io/copy)
- [Standard Streams](/modules/io/standard-streams)
- [Options](/modules/io/options)
- [Errors](/modules/io/errors)
