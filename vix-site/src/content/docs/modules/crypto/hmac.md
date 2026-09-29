# HMAC

HMAC is used when a message needs to be authenticated with a shared secret key. A normal hash proves that some input produced a digest, but anyone can compute that digest. HMAC adds a secret key to the process, so the output can only be reproduced by someone who has the same key.

In `vix::crypto`, HMAC is exposed as a one-shot API. The caller provides the key, the input data, and the output buffer. The function writes the MAC into the output buffer and returns a `Result<void>` to make failures explicit.

## Header

Use the module entry point for normal crypto code:

```cpp
#include <vix/crypto/crypto.hpp>
```

For files that only need HMAC, the direct header can also be used:

```cpp
#include <vix/crypto/hmac.hpp>
```

## Compute HMAC-SHA256

`hmac_sha256` writes a 32-byte MAC into a caller-provided output buffer.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> key{};
  std::array<std::uint8_t, 32> mac{};

  auto random = random_bytes(key);

  if (!random.ok())
  {
    return 1;
  }

  auto result = hmac_sha256(key, "message", mac);

  if (!result.ok())
  {
    return 1;
  }

  return 0;
}
```

The string overload treats the message as raw bytes. It does not perform encoding conversion or text normalization.

## Use byte input

When the message is already represented as bytes, pass it directly.

```cpp
#include <array>
#include <cstdint>
#include <vector>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> key{};
  std::array<std::uint8_t, 32> mac{};

  std::vector<std::uint8_t> message{
    0x76, 0x69, 0x78
  };

  if (!random_bytes(key).ok())
  {
    return 1;
  }

  auto result = hmac_sha256(key, message, mac);

  return result.ok() ? 0 : 1;
}
```

The API works with `std::span`, so arrays, vectors, and other contiguous byte containers can be passed without changing the function signature.

## Use the generic HMAC function

The generic `hmac` function takes an explicit algorithm value. This is useful when code is written around algorithm selection.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> key{};
  std::array<std::uint8_t, 32> mac{};

  if (!random_bytes(key).ok())
  {
    return 1;
  }

  auto result = hmac(
    HmacAlg::sha256,
    key,
    bytes("message"),
    mac
  );

  return result.ok() ? 0 : 1;
}
```

For direct HMAC-SHA256 usage, `hmac_sha256` is shorter. For generic helpers or future algorithm selection, `hmac` keeps the selected algorithm visible at the call site.

## Output size

Use `hmac_size` when code needs to allocate or validate the output buffer for a selected algorithm.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  constexpr std::size_t size = hmac_size(HmacAlg::sha256);

  static_assert(size == 32);

  std::array<std::uint8_t, 32> key{};
  std::array<std::uint8_t, size> mac{};

  if (!random_bytes(key).ok())
  {
    return 1;
  }

  auto result = hmac(
    HmacAlg::sha256,
    key,
    bytes("payload"),
    mac
  );

  return result.ok() ? 0 : 1;
}
```

HMAC-SHA256 produces 32 bytes. If the output buffer has the wrong size, the operation returns an error instead of writing a partial MAC.

## Encode a MAC as text

A MAC is binary data. When it needs to be stored or displayed as text, encode it explicitly.

```cpp
#include <array>
#include <cstdint>
#include <string>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> key{};
  std::array<std::uint8_t, 32> mac{};

  if (!random_bytes(key).ok())
  {
    return 1;
  }

  auto result = hmac_sha256(key, "message", mac);

  if (!result.ok())
  {
    return 1;
  }

  std::string text = hex_lower(mac);

  return text.size() == 64 ? 0 : 1;
}
```

Hex encoding turns the 32-byte MAC into a 64-character lowercase hexadecimal string.

## Compare MAC values

Use `constant_time_equal` when comparing a computed MAC with an expected MAC.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> key{};
  std::array<std::uint8_t, 32> expected{};
  std::array<std::uint8_t, 32> actual{};

  if (!random_bytes(key).ok())
  {
    return 1;
  }

  if (!hmac_sha256(key, "message", expected).ok())
  {
    return 1;
  }

  if (!hmac_sha256(key, "message", actual).ok())
  {
    return 1;
  }

  return constant_time_equal(expected, actual) ? 0 : 1;
}
```

A normal equality comparison can return as soon as it finds a difference. For authentication values such as MACs, constant-time comparison is safer because it avoids exposing useful timing differences.

## Error handling

HMAC can fail when the output buffer has the wrong size, when the provider reports an error, or when the selected algorithm is not supported.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> key{};
  std::array<std::uint8_t, 16> wrong_size{};

  if (!random_bytes(key).ok())
  {
    return 1;
  }

  auto result = hmac_sha256(key, "message", wrong_size);

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

Most application code only needs to check `ok()`. More detailed error handling is useful in tests, diagnostics, and tooling that needs to distinguish caller mistakes from provider configuration issues.

## API

```cpp
enum class HmacAlg : std::uint8_t
{
  sha256 = 1
};

constexpr std::size_t hmac_size(HmacAlg alg) noexcept;

Result<void> hmac(
  HmacAlg alg,
  std::span<const std::uint8_t> key,
  std::span<const std::uint8_t> data,
  std::span<std::uint8_t> out
) noexcept;

Result<void> hmac_sha256(
  std::span<const std::uint8_t> key,
  std::span<const std::uint8_t> data,
  std::span<std::uint8_t> out
) noexcept;

Result<void> hmac_sha256(
  std::span<const std::uint8_t> key,
  std::string_view data,
  std::span<std::uint8_t> out
) noexcept;
```

## Next step

Continue with bytes and hex to see how the crypto module handles string-to-byte views and lowercase hexadecimal encoding.
