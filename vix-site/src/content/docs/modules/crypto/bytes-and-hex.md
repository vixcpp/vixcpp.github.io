# Bytes and Hex

Cryptographic APIs usually work with bytes, while application code often starts with strings. The `crypto` module keeps that boundary explicit. Text can be viewed as bytes with `bytes()`, and binary output such as hashes, MACs, keys, or signatures can be converted into lowercase hexadecimal text with `hex_lower()`.

These helpers are intentionally small. They do not hide encoding rules, allocate unnecessary buffers, or reinterpret data beyond what the caller asks for. This keeps byte handling clear at the call site, which is important when the same data may be hashed, signed, encrypted, or stored.

## Header

Use the module entry point for normal crypto code:

```cpp
#include <vix/crypto/crypto.hpp>
```

For files that only need these helpers, the direct headers can also be used:

```cpp
#include <vix/crypto/bytes.hpp>
#include <vix/crypto/hex.hpp>
```

## View a string as bytes

Use `bytes()` when a function expects a byte span and the input is already available as a string or string view.

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
    bytes("hello"),
    digest
  );

  return result.ok() ? 0 : 1;
}
```

The returned span points directly to the string memory. No allocation and no copy are performed. Because of that, the input string must remain alive for as long as the returned span is used.

## Use with string views

`bytes()` accepts `std::string_view`, which makes it useful for APIs that receive text without owning it.

```cpp
#include <array>
#include <cstdint>
#include <string_view>
#include <vix/crypto/crypto.hpp>

vix::crypto::Result<void>
hash_message(std::string_view message, std::span<std::uint8_t> out) noexcept
{
  return vix::crypto::sha256(
    vix::crypto::bytes(message),
    out
  );
}

int main()
{
  std::array<std::uint8_t, 32> digest{};

  auto result = hash_message("vix", digest);

  return result.ok() ? 0 : 1;
}
```

The helper does not validate encoding. A UTF-8 string, an ASCII token, or binary-safe string content is treated as the bytes already present in memory.

## Encode bytes as hexadecimal

Use `hex_lower()` when binary data needs to be represented as text.

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

Each byte becomes two lowercase hexadecimal characters. A 32-byte SHA-256 digest becomes a 64-character string.

## Encode MACs and signatures

Hex encoding is useful for values that are binary by design but need to appear in logs, test output, configuration files, or database fields.

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

  std::string encoded = hex_lower(mac);

  return encoded.empty() ? 1 : 0;
}
```

The encoded string is a representation of the bytes. It is not a new cryptographic value, and it should not be compared with normal string equality when the value is security-sensitive. Decode and compare sensitive byte values with a constant-time comparison when verification matters.

## Work with existing byte containers

`hex_lower()` accepts a byte span, so it works naturally with arrays and vectors.

```cpp
#include <cstdint>
#include <string>
#include <vector>
#include <vix/crypto/crypto.hpp>

int main()
{
  std::vector<std::uint8_t> data{
    0x76, 0x69, 0x78
  };

  std::string encoded = vix::crypto::hex_lower(data);

  return encoded == "766978" ? 0 : 1;
}
```

The function always produces lowercase hexadecimal output using the `0-9a-f` range.

## Lifetime of byte views

The span returned by `bytes()` does not own memory. It is only a view over the input string data.

```cpp
#include <span>
#include <cstdint>
#include <string>
#include <vix/crypto/crypto.hpp>

int main()
{
  std::string message = "temporary data";

  std::span<const std::uint8_t> view = vix::crypto::bytes(message);

  return view.size() == message.size() ? 0 : 1;
}
```

This is safe because `message` is still alive while `view` is used. Avoid storing the returned span beyond the lifetime of the original string or string view.

## API

```cpp
std::span<const std::uint8_t>
bytes(std::string_view s) noexcept;
```

```cpp
std::string
hex_lower(std::span<const std::uint8_t> bytes);
```

## Next step

Continue with constant-time compare to see how sensitive byte values such as MACs, password hashes, and authentication tags should be compared.
