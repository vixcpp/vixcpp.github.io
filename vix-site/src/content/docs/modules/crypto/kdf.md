# KDF

A key derivation function transforms input keying material into cryptographic key material for a specific purpose. In `vix::crypto`, the KDF API currently provides HKDF-SHA256. It is useful when an application already has secret input material and needs to derive one or more fixed-size keys from it.

The API is explicit and buffer-oriented. The caller provides the input keying material, an optional salt, optional context information, and an output buffer. The size of the output buffer defines how many bytes are derived.

## Header

Use the module entry point for normal crypto code:

```cpp
#include <vix/crypto/crypto.hpp>
```

For files that only need key derivation, the direct header can also be used:

```cpp
#include <vix/crypto/kdf.hpp>
```

## Derive key material

`hkdf_sha256` derives output bytes from input keying material.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> ikm{};
  std::array<std::uint8_t, 32> out{};

  if (!random_bytes(ikm).ok())
  {
    return 1;
  }

  auto result = hkdf_sha256(
    ikm,
    std::span<const std::uint8_t>{},
    std::span<const std::uint8_t>{},
    out
  );

  return result.ok() ? 0 : 1;
}
```

The input keying material must not be empty. The output buffer can have the size required by the next crypto operation.

## Use salt and context

HKDF accepts a salt and an `info` value. The salt helps separate the derivation from the raw input material. The `info` value identifies the purpose of the derived key.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> ikm{};
  std::array<std::uint8_t, 16> salt{};
  std::array<std::uint8_t, 32> out{};

  if (!random_bytes(ikm).ok())
  {
    return 1;
  }

  if (!random_bytes(salt).ok())
  {
    return 1;
  }

  auto result = hkdf_sha256(
    ikm,
    salt,
    bytes("vix:crypto:aead-key"),
    out
  );

  return result.ok() ? 0 : 1;
}
```

The `info` value should describe the derived key’s role. This avoids accidentally using the same derived bytes for different purposes.

## Derive an AEAD key

The output size can be connected to another crypto primitive. AES-256-GCM uses a 32-byte key, so `aead_key_size` can be used to define the output buffer.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  constexpr std::size_t key_size =
    aead_key_size(AeadAlg::aes_256_gcm);

  std::array<std::uint8_t, 32> ikm{};
  std::array<std::uint8_t, key_size> key{};

  if (!random_bytes(ikm).ok())
  {
    return 1;
  }

  auto result = hkdf_sha256(
    ikm,
    std::span<const std::uint8_t>{},
    bytes("vix:aes-256-gcm:key"),
    key
  );

  return result.ok() ? 0 : 1;
}
```

This keeps the relationship between the derived output and the target algorithm visible in the code.

## Use the generic KDF function

The generic `kdf` function takes an explicit algorithm value. This is useful when code is written around algorithm selection.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> ikm{};
  std::array<std::uint8_t, 32> out{};

  if (!random_bytes(ikm).ok())
  {
    return 1;
  }

  auto result = kdf(
    KdfAlg::hkdf_sha256,
    ikm,
    std::span<const std::uint8_t>{},
    bytes("vix:kdf:example"),
    out
  );

  return result.ok() ? 0 : 1;
}
```

For direct HKDF-SHA256 usage, `hkdf_sha256` is shorter. For generic helpers, `kdf` makes the selected algorithm explicit.

## Empty output

An empty output buffer is accepted as a no-op.

```cpp
#include <array>
#include <cstdint>
#include <span>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> ikm{};
  std::span<std::uint8_t> out{};

  if (!random_bytes(ikm).ok())
  {
    return 1;
  }

  auto result = hkdf_sha256(
    ikm,
    std::span<const std::uint8_t>{},
    std::span<const std::uint8_t>{},
    out
  );

  return result.ok() ? 0 : 1;
}
```

This is useful in generic code where the requested output length may be zero.

## Empty input keying material

The input keying material must not be empty.

```cpp
#include <array>
#include <cstdint>
#include <span>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> out{};

  auto result = hkdf_sha256(
    std::span<const std::uint8_t>{},
    std::span<const std::uint8_t>{},
    std::span<const std::uint8_t>{},
    out
  );

  if (!result.ok() &&
      result.error().code == ErrorCode::invalid_argument)
  {
    return 0;
  }

  return 1;
}
```

A KDF needs real input keying material. Passing an empty input would make the derivation meaningless, so the module rejects it.

## KDF and password hashing

HKDF is not a password hashing API. It is designed for deriving keys from input keying material that already has enough entropy. For user passwords, use `password_hash` and `password_verify`.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto stored = password_hash("correct horse battery staple");

  return stored.ok() ? 0 : 1;
}
```

Passwords need a slow password hashing function with a salt and a configurable cost. HKDF is fast and should be used for key derivation, not for storing user passwords.

## Error handling

KDF operations can fail when the input is invalid, the selected algorithm is not supported, or the crypto provider is unavailable.

```cpp
#include <array>
#include <cstdint>
#include <span>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> out{};

  auto result = hkdf_sha256(
    std::span<const std::uint8_t>{},
    std::span<const std::uint8_t>{},
    bytes("context"),
    out
  );

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

Most application code only needs to check `ok()`. More specific error handling is useful in tests, diagnostics, and build environments where provider configuration may differ.

## API

```cpp
enum class KdfAlg : std::uint8_t
{
  hkdf_sha256 = 1
};
```

```cpp
Result<void> kdf(
  KdfAlg alg,
  std::span<const std::uint8_t> ikm,
  std::span<const std::uint8_t> salt,
  std::span<const std::uint8_t> info,
  std::span<std::uint8_t> out
) noexcept;
```

```cpp
Result<void> hkdf_sha256(
  std::span<const std::uint8_t> ikm,
  std::span<const std::uint8_t> salt,
  std::span<const std::uint8_t> info,
  std::span<std::uint8_t> out
) noexcept;
```

## Next step

Continue with keys to see how the module owns, generates, and zeroizes secret key material.
