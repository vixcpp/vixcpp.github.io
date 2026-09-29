# Buffers

The `io` module uses `Buffer` as a small in-memory byte container. It is useful when code needs to collect bytes before writing them, keep bytes returned by an operation, or move simple text-like data through an API that is designed around raw I/O.

A buffer is not a stream. It does not read from the operating system, write to a destination, flush output, or own a file. It only stores bytes in memory. That makes it a good companion to `Input`, `Output`, `read`, and `write`, because those APIs often need a simple byte representation that is not tied to a specific stream object.

## Header

```cpp id="2lm4kn"
#include <vix/io.hpp>
#include <vix/print.hpp>
```

## Create an empty buffer

A default-constructed `Buffer` starts empty.

```cpp id="7qjz63"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  vix::io::Buffer buffer;

  vix::print("empty:", buffer.empty());
  vix::print("size:", buffer.size());

  return 0;
}
```

`empty()` reports whether the buffer contains no bytes, and `size()` returns the number of bytes currently stored.

## Create a buffer from text

A buffer can be constructed from a text string. The text is stored as bytes.

```cpp id="ebuo02"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  vix::io::Buffer buffer("Hello Vix");

  vix::print("size:", buffer.size());
  vix::print("content:", buffer.to_string());

  return 0;
}
```

This is useful for examples, tests, and small text payloads. The buffer itself does not enforce text encoding. It stores the bytes it receives, and `to_string()` simply builds a `std::string` from those bytes.

## Create a buffer from bytes

A buffer can also be constructed from a byte vector.

```cpp id="7o1q01"
#include <cstdint>
#include <vector>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  std::vector<std::uint8_t> bytes{65, 66, 67};

  vix::io::Buffer buffer(bytes);

  vix::print("size:", buffer.size());
  vix::print("content:", buffer.to_string());

  return 0;
}
```

The values `65`, `66`, and `67` correspond to the text bytes for `A`, `B`, and `C`. In real binary data, the bytes may not represent readable text, so `to_string()` should only be used when the caller knows that the buffer contains text-like data.

## Append text

Use `append(std::string_view)` to add text bytes to the end of the buffer.

```cpp id="oax8a2"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  vix::io::Buffer buffer;

  buffer.append("Hello");
  buffer.append(" ");
  buffer.append("Vix");

  vix::print("content:", buffer.to_string());
  vix::print("size:", buffer.size());

  return 0;
}
```

Append operations keep the existing bytes and add new bytes at the end. Appending an empty string does nothing.

## Append raw bytes

Use the raw byte overload when the data is already represented as bytes.

```cpp id="ae87fq"
#include <cstdint>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  vix::io::Buffer buffer;

  std::uint8_t bytes[] = {65, 66, 67};

  buffer.append(bytes, 3);

  vix::print("content:", buffer.to_string());
  vix::print("size:", buffer.size());

  return 0;
}
```

If the pointer is `nullptr` or the size is `0`, the append operation does nothing. This keeps no-op appends simple and avoids turning empty data into an error.

## Append a byte vector

The buffer also accepts its storage type directly.

```cpp id="ua1xmk"
#include <cstdint>
#include <vector>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  vix::io::Buffer buffer("prefix:");

  std::vector<std::uint8_t> bytes{32, 65, 66, 67};

  buffer.append(bytes);

  vix::print("content:", buffer.to_string());

  return 0;
}
```

This is useful when bytes come from another API before being collected into a `Buffer`.

## Access bytes

Use `bytes()` when the caller needs access to the underlying byte vector.

```cpp id="4vq6x2"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  vix::io::Buffer buffer("hello");

  const auto &bytes = buffer.bytes();

  vix::print("byte count:", bytes.size());

  return 0;
}
```

`bytes()` has both const and mutable overloads. The mutable overload is useful when a caller needs to modify the underlying byte storage directly, but it should be used carefully because it bypasses the small guardrails provided by the append functions.

## Access raw data

Use `data()` when an API needs a pointer to the underlying bytes.

```cpp id="7a7bu9"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  vix::io::Buffer buffer("hello");

  const auto *data = buffer.data();

  if (data != nullptr)
    vix::print("first byte:", data[0]);

  return 0;
}
```

The pointer is only useful together with `size()`. As with `std::vector`, the pointer should not be kept after operations that may reallocate the buffer storage.

## Clear a buffer

Use `clear()` to remove all bytes.

```cpp id="nbz5bu"
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  vix::io::Buffer buffer("temporary data");

  vix::print("before:", buffer.size());

  buffer.clear();

  vix::print("after:", buffer.size());
  vix::print("empty:", buffer.empty());

  return 0;
}
```

Clearing a buffer leaves it usable. New data can be appended after the previous content has been removed.

## Convert to string

Use `to_string()` when the buffer contains text and the caller wants a `std::string`.

```cpp id="5fsift"
#include <string>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  vix::io::Buffer buffer;

  buffer.append("status");
  buffer.append(": ");
  buffer.append("ok");

  std::string text = buffer.to_string();

  vix::print("text:", text);

  return 0;
}
```

This conversion does not validate the content as UTF-8 or any other encoding. It only copies the stored bytes into a string. That is the right behavior for a low-level I/O buffer, but the caller should know whether the bytes are actually text.

## Buffer and `Bytes`

The module also defines `Bytes` as the standard raw byte type for I/O operations.

```cpp id="lfp9sd"
using Bytes = std::vector<std::uint8_t>;
```

`Buffer` is a small class around byte storage. `Bytes` is the plain byte vector used by read and write operations. Use `Bytes` when an API expects the raw vector directly. Use `Buffer` when code benefits from a small object with append, clear, size, data access, and string conversion helpers.

```cpp id="hkzl57"
#include <sstream>
#include <vix/io.hpp>
#include <vix/print.hpp>

int main()
{
  vix::io::Buffer buffer("Hello");
  buffer.append(" Vix");

  std::ostringstream target;
  vix::io::Output output(target);

  auto written = vix::io::write(output, buffer.bytes());

  if (!written.ok())
  {
    vix::eprint("write failed:", written.error().message());
    return 1;
  }

  vix::print("target:", target.str());

  return 0;
}
```

This pattern is useful when bytes are built in memory first, then written through the normal output API.

## Buffer API overview

| API                         | Purpose                                    |
| --------------------------- | ------------------------------------------ |
| `vix::io::Buffer()`         | Create an empty buffer.                    |
| `vix::io::Buffer(bytes)`    | Create a buffer from byte storage.         |
| `vix::io::Buffer(text)`     | Create a buffer from text bytes.           |
| `buffer.empty()`            | Return whether the buffer has no bytes.    |
| `buffer.size()`             | Return the number of bytes stored.         |
| `buffer.clear()`            | Remove all bytes.                          |
| `buffer.append(data, size)` | Append raw bytes from a pointer and size.  |
| `buffer.append(bytes)`      | Append a byte vector.                      |
| `buffer.append(text)`       | Append text bytes.                         |
| `buffer.bytes()`            | Access the underlying byte vector.         |
| `buffer.data()`             | Access the underlying byte pointer.        |
| `buffer.to_string()`        | Convert stored bytes into a `std::string`. |

## Next step

Continue with copy to see how the IO module transfers bytes from an `Input` stream to an `Output` stream using chunked reads and writes.
