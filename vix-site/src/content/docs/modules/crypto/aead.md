# AEAD

AEAD means authenticated encryption with associated data. It encrypts a plaintext and produces an authentication tag that protects the ciphertext and the additional authenticated data. In `vix::crypto`, AEAD is used when data must remain private and must also be verified before it is trusted.

The current AEAD implementation supports AES-256-GCM. The API is split into two levels. The low-level functions work with caller-provided buffers. The `vix::crypto::aead` helpers allocate the ciphertext container for common use cases and return a `Sealed` value containing the ciphertext and tag.

## Header

Use the module entry point for normal crypto code:

```cpp
#include <vix/crypto/crypto.hpp>
```

For files that only need AEAD, the direct headers can also be used:

```cpp
#include <vix/crypto/aead.hpp>
#include <vix/crypto/aead_easy.hpp>
```

## Algorithm sizes

AES-256-GCM uses a 32-byte key, a 12-byte nonce, and a 16-byte authentication tag.

```cpp
#include <cstddef>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  constexpr std::size_t key_size =
      aead_key_size(AeadAlg::aes_256_gcm);

  constexpr std::size_t nonce_size =
      aead_nonce_size(AeadAlg::aes_256_gcm);

  constexpr std::size_t tag_size =
      aead_tag_size(AeadAlg::aes_256_gcm);

  static_assert(key_size == 32);
  static_assert(nonce_size == 12);
  static_assert(tag_size == 16);

  return 0;
}
```

These helpers make the required sizes visible at the call site and avoid scattering algorithm parameters across the application.

## Seal a string

The easiest way to encrypt data is to use `aead::seal`. It returns ciphertext and tag in a `Sealed` object.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> key{};
  std::array<std::uint8_t, 12> nonce{};

  if (!random_bytes(key).ok())
  {
    return 1;
  }

  if (!random_bytes(nonce).ok())
  {
    return 1;
  }

  auto sealed = aead::seal(
      AeadAlg::aes_256_gcm,
      key,
      nonce,
      "private message",
      "request:42");

  return sealed.ok() ? 0 : 1;
}
```

The plaintext is encrypted. The additional authenticated data is not encrypted, but it is authenticated. During decryption, the same AAD must be provided or authentication fails.

## Open a sealed string

Use `aead::open_string` when the decrypted plaintext should be returned as a `std::string`.

```cpp
#include <array>
#include <cstdint>
#include <string>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> key{};
  std::array<std::uint8_t, 12> nonce{};

  if (!random_bytes(key).ok())
  {
    return 1;
  }

  if (!random_bytes(nonce).ok())
  {
    return 1;
  }

  auto sealed = aead::seal(
      AeadAlg::aes_256_gcm,
      key,
      nonce,
      "private message",
      "request:42");

  if (!sealed.ok())
  {
    return 1;
  }

  auto opened = aead::open_string(
      AeadAlg::aes_256_gcm,
      key,
      nonce,
      sealed.value(),
      "request:42");

  if (!opened.ok())
  {
    return 1;
  }

  return opened.value() == "private message" ? 0 : 1;
}
```

`open_string` constructs a string from the decrypted bytes. It does not validate text encoding. This is suitable for UTF-8 text or binary-safe string usage when the caller controls the format.

## Authentication failure

AEAD decryption verifies the tag before the plaintext can be trusted. If the AAD, key, nonce, ciphertext, or tag does not match, the operation fails.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> key{};
  std::array<std::uint8_t, 12> nonce{};

  if (!random_bytes(key).ok())
  {
    return 1;
  }

  if (!random_bytes(nonce).ok())
  {
    return 1;
  }

  auto sealed = aead::seal(
      AeadAlg::aes_256_gcm,
      key,
      nonce,
      "message",
      "aad");

  if (!sealed.ok())
  {
    return 1;
  }

  auto opened = aead::open_string(
      AeadAlg::aes_256_gcm,
      key,
      nonce,
      sealed.value(),
      "different-aad");

  if (!opened.ok() &&
      opened.error().code == ErrorCode::authentication_failed)
  {
    return 0;
  }

  return 1;
}
```

When authentication fails, the decrypted output must be treated as invalid. Application code should discard it and handle the operation as a failed verification.

## Work with raw bytes

The helper API also works with byte spans. This is useful when the plaintext is already binary data.

```cpp
#include <array>
#include <cstdint>
#include <vector>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> key{};
  std::array<std::uint8_t, 12> nonce{};

  std::vector<std::uint8_t> plaintext{
      0x76, 0x69, 0x78};

  if (!random_bytes(key).ok())
  {
    return 1;
  }

  if (!random_bytes(nonce).ok())
  {
    return 1;
  }

  auto sealed = aead::seal(
      AeadAlg::aes_256_gcm,
      key,
      nonce,
      plaintext);

  if (!sealed.ok())
  {
    return 1;
  }

  auto opened = aead::open(
      AeadAlg::aes_256_gcm,
      key,
      nonce,
      sealed.value());

  if (!opened.ok())
  {
    return 1;
  }

  return opened.value() == plaintext ? 0 : 1;
}
```

The byte-based API avoids any assumption about text encoding and is the right shape for binary payloads, tokens, serialized records, and protocol data.

## Use the low-level API

The low-level AEAD functions do not allocate output containers. The caller provides the ciphertext buffer, plaintext buffer, and authentication tag buffer.

```cpp
#include <array>
#include <cstdint>
#include <vector>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> key{};
  std::array<std::uint8_t, 12> nonce{};
  std::array<std::uint8_t, 16> tag{};

  std::vector<std::uint8_t> plaintext{
      0x76, 0x69, 0x78};

  std::vector<std::uint8_t> ciphertext(plaintext.size());
  std::vector<std::uint8_t> opened(plaintext.size());

  if (!random_bytes(key).ok())
  {
    return 1;
  }

  if (!random_bytes(nonce).ok())
  {
    return 1;
  }

  auto encrypted = aead_encrypt(
      AeadAlg::aes_256_gcm,
      key,
      nonce,
      bytes("context"),
      plaintext,
      ciphertext,
      tag);

  if (!encrypted.ok())
  {
    return 1;
  }

  auto decrypted = aead_decrypt(
      AeadAlg::aes_256_gcm,
      key,
      nonce,
      bytes("context"),
      ciphertext,
      tag,
      opened);

  if (!decrypted.ok())
  {
    return 1;
  }

  return opened == plaintext ? 0 : 1;
}
```

The low-level API is useful in performance-sensitive code, tests, or integrations where allocation and buffer ownership must remain under the caller’s control.

## Nonce rules

For AES-256-GCM, the nonce size is 12 bytes. The nonce must be unique for every encryption with the same key.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 12> nonce{};

  auto result = random_bytes(nonce);

  return result.ok() ? 0 : 1;
}
```

A random nonce is practical for many workflows, but the application is still responsible for making sure the same nonce is not reused with the same key. The AEAD helpers do not track nonce history and do not provide replay protection.

## Key handling

The AEAD helpers accept any byte span with the correct key size. For owned secret material, use `SecretKey`.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto key = generate_secret_key(
      aead_key_size(AeadAlg::aes_256_gcm));

  if (!key.ok())
  {
    return 1;
  }

  std::array<std::uint8_t, 12> nonce{};

  if (!random_bytes(nonce).ok())
  {
    return 1;
  }

  auto sealed = aead::seal(
      AeadAlg::aes_256_gcm,
      key.value().bytes(),
      nonce,
      "message");

  return sealed.ok() ? 0 : 1;
}
```

`SecretKey` makes ownership clear and zeroizes its internal buffer when destroyed. The AEAD operation only receives a temporary view of the key bytes.

## Buffer size errors

The low-level API requires the ciphertext buffer to have the same size as the plaintext during encryption, and the plaintext buffer to have the same size as the ciphertext during decryption.

```cpp
#include <array>
#include <cstdint>
#include <vector>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> key{};
  std::array<std::uint8_t, 12> nonce{};
  std::array<std::uint8_t, 16> tag{};

  std::vector<std::uint8_t> plaintext{
      0x01, 0x02, 0x03};

  std::vector<std::uint8_t> wrong_size(1);

  if (!random_bytes(key).ok())
  {
    return 1;
  }

  if (!random_bytes(nonce).ok())
  {
    return 1;
  }

  auto result = aead_encrypt(
      AeadAlg::aes_256_gcm,
      key,
      nonce,
      {},
      plaintext,
      wrong_size,
      tag);

  if (!result.ok() &&
      result.error().code == ErrorCode::invalid_argument)
  {
    return 0;
  }

  return 1;
}
```

The helper API avoids this specific mistake by sizing the ciphertext buffer from the plaintext size.

## Sealed value

`aead::Sealed` is the output container returned by the helper API.

```cpp
namespace vix::crypto::aead
{
  struct Sealed final
  {
    std::vector<std::uint8_t> ciphertext{};
    std::array<std::uint8_t, 16> tag{};
  };
}
```

The ciphertext length matches the plaintext length. The tag is 16 bytes for AES-256-GCM.

## API

```cpp
enum class AeadAlg : std::uint8_t
{
  aes_256_gcm = 1
};
```

```cpp
constexpr std::size_t aead_key_size(AeadAlg alg) noexcept;
constexpr std::size_t aead_nonce_size(AeadAlg alg) noexcept;
constexpr std::size_t aead_tag_size(AeadAlg alg) noexcept;
```

```cpp
Result<void> aead_encrypt(
    AeadAlg alg,
    std::span<const std::uint8_t> key,
    std::span<const std::uint8_t> nonce,
    std::span<const std::uint8_t> aad,
    std::span<const std::uint8_t> plaintext,
    std::span<std::uint8_t> ciphertext,
    std::span<std::uint8_t> tag) noexcept;
```

```cpp
Result<void> aead_decrypt(
    AeadAlg alg,
    std::span<const std::uint8_t> key,
    std::span<const std::uint8_t> nonce,
    std::span<const std::uint8_t> aad,
    std::span<const std::uint8_t> ciphertext,
    std::span<const std::uint8_t> tag,
    std::span<std::uint8_t> plaintext) noexcept;
```

```cpp
namespace vix::crypto::aead
{
  Result<Sealed> seal(
      AeadAlg alg,
      std::span<const std::uint8_t> key,
      std::span<const std::uint8_t> nonce,
      std::span<const std::uint8_t> plaintext,
      std::span<const std::uint8_t> aad = {}) noexcept;

  Result<Sealed> seal(
      AeadAlg alg,
      std::span<const std::uint8_t> key,
      std::span<const std::uint8_t> nonce,
      std::string_view plaintext,
      std::string_view aad = {}) noexcept;

  Result<std::vector<std::uint8_t>> open(
      AeadAlg alg,
      std::span<const std::uint8_t> key,
      std::span<const std::uint8_t> nonce,
      const Sealed &sealed,
      std::span<const std::uint8_t> aad = {}) noexcept;

  Result<std::vector<std::uint8_t>> open(
      AeadAlg alg,
      std::span<const std::uint8_t> key,
      std::span<const std::uint8_t> nonce,
      const Sealed &sealed,
      std::string_view aad) noexcept;

  Result<std::string> open_string(
      AeadAlg alg,
      std::span<const std::uint8_t> key,
      std::span<const std::uint8_t> nonce,
      const Sealed &sealed,
      std::span<const std::uint8_t> aad = {}) noexcept;

  Result<std::string> open_string(
      AeadAlg alg,
      std::span<const std::uint8_t> key,
      std::span<const std::uint8_t> nonce,
      const Sealed &sealed,
      std::string_view aad) noexcept;
}
```

## Next step

Continue with signatures to generate Ed25519 key pairs, sign messages, and verify signatures with public keys.
