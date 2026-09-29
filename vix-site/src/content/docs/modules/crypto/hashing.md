# Hashing

Hashing turns input data into a fixed-size digest. In `vix::crypto`, the hashing API currently provides one-shot SHA-256, with explicit buffers and explicit error handling. The caller provides the input bytes, provides a 32-byte output buffer, then checks the returned `Result`.

This API is meant for cases where the full input is already available in memory. It does not provide streaming or incremental hashing. That keeps the interface small and predictable for module tests, identifiers, integrity checks, and protocol code that only needs a single digest operation.

## Header

Use the module entry point for normal crypto code:

```cpp
#include <vix/crypto/crypto.hpp>
```

For files that only need hashing, the direct header can also be used:

```cpp
#include <vix/crypto/hash.hpp>
```

## Compute SHA-256

`sha256` writes the digest into a caller-provided 32-byte buffer.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> digest{};

  auto result = sha256("hello", digest);

  if (!result.ok())
  {
    return 1;
  }

  return 0;
}
```

The string overload treats the input as raw bytes. It does not perform encoding conversion, normalization, or text validation.

## Hash byte buffers

When data is already represented as bytes, pass it directly as a byte span.

```cpp
#include <array>
#include <cstdint>
#include <vector>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::vector<std::uint8_t> data{
    0x76, 0x69, 0x78
  };

  std::array<std::uint8_t, 32> digest{};

  auto result = sha256(data, digest);

  if (!result.ok())
  {
    return 1;
  }

  return 0;
}
```

The function does not allocate the output buffer. The caller owns the memory and decides whether the digest should live in an array, a vector, or another byte container.

## Use the generic hash function

The generic `hash` function takes an explicit algorithm value. This is useful when code is written around algorithm selection instead of calling a concrete helper directly.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> digest{};

  auto result = hash(
    HashAlg::sha256,
    bytes("message"),
    digest
  );

  if (!result.ok())
  {
    return 1;
  }

  return 0;
}
```

For direct SHA-256 usage, `sha256` is shorter. For code that may later choose between algorithms, `hash` makes the selected algorithm visible at the call site.

## Output size

Use `hash_size` when code needs to allocate or validate an output buffer for a selected algorithm.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  constexpr std::size_t size = hash_size(HashAlg::sha256);

  static_assert(size == 32);

  std::array<std::uint8_t, size> digest{};

  auto result = hash(
    HashAlg::sha256,
    bytes("vix"),
    digest
  );

  return result.ok() ? 0 : 1;
}
```

SHA-256 produces 32 bytes. If the output buffer has the wrong size, the operation returns an error instead of writing a partial digest.

## Convert a digest to text

A digest is binary data. When it needs to be displayed or stored as text, encode it explicitly.

```cpp
#include <array>
#include <cstdint>
#include <string>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> digest{};

  auto result = sha256("hello", digest);

  if (!result.ok())
  {
    return 1;
  }

  std::string text = hex_lower(digest);

  return text.size() == 64 ? 0 : 1;
}
```

Hex encoding expands each byte into two characters. A 32-byte SHA-256 digest therefore becomes a 64-character lowercase hexadecimal string.

## Error handling

Hashing can fail when the output buffer has the wrong size or when the crypto provider is unavailable.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 16> wrong_size{};

  auto result = sha256("data", wrong_size);

  if (!result.ok())
  {
    if (result.error().code == ErrorCode::invalid_argument)
    {
      return 0;
    }

    return 1;
  }

  return 1;
}
```

Most application code only needs to check `ok()`. More detailed error handling is useful in tests and diagnostics, especially when distinguishing caller mistakes from provider configuration problems.

## API

```cpp
enum class HashAlg : std::uint8_t
{
  sha256 = 1
};

constexpr std::size_t hash_size(HashAlg alg) noexcept;

Result<void> hash(
  HashAlg alg,
  std::span<const std::uint8_t> data,
  std::span<std::uint8_t> out
) noexcept;

Result<void> sha256(
  std::span<const std::uint8_t> data,
  std::span<std::uint8_t> out
) noexcept;

Result<void> sha256(
  std::string_view data,
  std::span<std::uint8_t> out
) noexcept;
```

## Next step

Continue with HMAC to authenticate messages with a shared secret key instead of only computing a public digest.
