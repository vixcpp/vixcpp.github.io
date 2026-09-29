# Options

The `io` module uses `IoOptions` to configure the small behaviors that are shared by higher-level I/O operations. The options do not change what an `Input` or `Output` is. They only control how functions such as `read_all`, `read_line`, `write_line`, and `copy` perform their work.

This keeps the main API simple. Most calls can use the default options, while code that needs a specific chunk size, newline behavior, or flush behavior can make that choice explicit at the call site.

## Header

```cpp id="qxg8mu"
#include <vix/io.hpp>
#include <vix/print.hpp>
```

## `IoOptions`

`IoOptions` contains the common configuration fields used by the module.

```cpp id="1m1qwq"
struct IoOptions
{
  std::size_t chunk_size{4096};
  bool keep_newline{false};
  bool auto_flush{false};
  NewlineMode newline_mode{NewlineMode::LF};
};
```

The default values are meant to be practical for ordinary stream work. Reads and copies use a `4096` byte chunk size, line reads remove the trailing newline, writes do not flush automatically, and line writes use `\n`.

## Chunk size

`chunk_size` controls how many bytes `read_all()` and `copy()` request from the input stream during each internal read.

```cpp id="kov04i"
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

A smaller chunk size is useful in tests because it forces the function to perform several reads. In normal application code, the default is usually the right starting point. Tune it only when the data size, memory behavior, or stream source gives you a concrete reason to do so.

If `chunk_size` is set to `0`, operations that use it normalize it to at least `1`. This avoids an invalid zero-byte read loop.

## Keep newline when reading a line

By default, `read_line()` returns the line content without the trailing newline. Set `keep_newline` when the caller wants to preserve that newline in the returned string.

```cpp id="oqnce6"
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

This option is useful when the program needs to preserve the original text shape, forward lines to another stream, or process a format where line endings are meaningful. For user input and most simple line processing, the default `false` value is easier to work with.

## Auto-flush

`auto_flush` asks line writes and copy operations to flush the output after the operation completes.

```cpp id="m39j4i"
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
    vix::eprint("write failed:", written.error().message());
    return 1;
  }

  vix::print("bytes written:", written.value());

  return 0;
}
```

Automatic flushing is useful for prompts, status messages, and interactive output where the caller wants the data to become visible immediately. It should not be enabled everywhere by habit. Flushing too often can reduce the benefit of buffering, especially when writing many small lines.

## Newline mode

`newline_mode` controls which newline sequence `write_line()` appends.

```cpp id="pj7vhr"
enum class NewlineMode
{
  LF,
  CRLF,
  Native
};
```

`NewlineMode::LF` writes `\n`. `NewlineMode::CRLF` writes `\r\n`. `NewlineMode::Native` writes the platform convention: `\r\n` on Windows and `\n` on other supported platforms.

```cpp id="c6tpco"
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

Use an explicit newline mode when a protocol, generated format, test fixture, or platform convention requires it. When the output format does not care, the default `LF` mode keeps behavior predictable across platforms.

## Options with copy

`copy()` uses `chunk_size` while transferring data and respects `auto_flush` after the copy finishes.

```cpp id="fdhtr2"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("copy this text");
  std::ostringstream target;

  vix::io::Input input(source);
  vix::io::Output output(target);

  vix::io::IoOptions options;
  options.chunk_size = 4;
  options.auto_flush = true;

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

This is the right place to tune streaming behavior when the program is moving data without inspecting it. If the program needs to transform the content, read it first, modify it, then write the result explicitly.

## Options with lines

`read_line()` uses `keep_newline`, while `write_line()` uses `newline_mode` and `auto_flush`.

```cpp id="7xbw9b"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::istringstream source("alpha\n");
  std::ostringstream target;

  vix::io::Input input(source);
  vix::io::Output output(target);

  vix::io::IoOptions read_options;
  read_options.keep_newline = false;

  auto line = vix::io::read_line(input, read_options);

  if (!line.ok())
  {
    vix::eprint("read failed:", line.error().message());
    return 1;
  }

  vix::io::IoOptions write_options;
  write_options.newline_mode = vix::io::NewlineMode::LF;
  write_options.auto_flush = true;

  auto written = vix::io::write_line(output, line.value(), write_options);

  if (!written.ok())
  {
    vix::eprint("write failed:", written.error().message());
    return 1;
  }

  vix::print("target:", target.str());

  return 0;
}
```

Using separate option objects can make the intent clearer when reading and writing have different requirements. A read option that preserves newlines is not the same decision as a write option that chooses a line ending.

## Default options

Most code can use the defaults.

```cpp id="l9egzw"
auto line = vix::io::read_line(input);
auto written = vix::io::write_line(output, "ok");
auto copied = vix::io::copy(input, output);
```

The default behavior is simple: read and copy in reasonable chunks, remove the trailing newline from line reads, write `\n` for line output, and leave flushing under the caller’s control.

## Options API overview

| Field          | Default           | Used by              | Purpose                                                |
| -------------- | ----------------- | -------------------- | ------------------------------------------------------ |
| `chunk_size`   | `4096`            | `read_all`, `copy`   | Preferred number of bytes to read per chunk.           |
| `keep_newline` | `false`           | `read_line`          | Preserve the trailing newline in the returned string.  |
| `auto_flush`   | `false`           | `write_line`, `copy` | Flush output after the operation completes.            |
| `newline_mode` | `NewlineMode::LF` | `write_line`         | Choose the newline sequence appended to written lines. |

| Newline mode          | Written newline     |
| --------------------- | ------------------- |
| `NewlineMode::LF`     | `\n`                |
| `NewlineMode::CRLF`   | `\r\n`              |
| `NewlineMode::Native` | Platform convention |

## Next step

Continue with errors to understand how the IO module represents invalid input, invalid output, failed reads, failed writes, failed flushes, end-of-stream, closed streams, timeouts, and unknown failures.
