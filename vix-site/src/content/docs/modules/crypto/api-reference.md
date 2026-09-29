# API Reference

This page provides a compact reference for the public API exposed by the `crypto` module. It is meant as a quick lookup after reading the topic pages. For normal application code, include the module entry point and use the types and functions through `vix::crypto`.

## Header

```cpp
#include <vix/crypto/crypto.hpp>
```

The module entry point includes the public crypto API:

```cpp
#include <vix/crypto/Error.hpp>
#include <vix/crypto/Result.hpp>
#include <vix/crypto/random.hpp>
#include <vix/crypto/hash.hpp>
#include <vix/crypto/hmac.hpp>
#include <vix/crypto/kdf.hpp>
#include <vix/crypto/keys.hpp>
#include <vix/crypto/aead.hpp>
#include <vix/crypto/aead_easy.hpp>
#include <vix/crypto/signature.hpp>
#include <vix/crypto/signature_easy.hpp>
#include <vix/crypto/certificate.hpp>
#include <vix/crypto/password.hpp>
#include <vix/crypto/compare.hpp>
#include <vix/crypto/bytes.hpp>
#include <vix/crypto/hex.hpp>
```

## Namespace

```cpp
namespace vix::crypto
{
}
```

The AEAD helper API is exposed in:

```cpp
namespace vix::crypto::aead
{
}
```

The signature helper API is exposed in:

```cpp
namespace vix::crypto::signature
{
}
```

## Error codes

```cpp
enum class ErrorCode : std::uint8_t
{
  ok = 0,

  invalid_argument,
  invalid_state,
  not_supported,

  entropy_unavailable,
  weak_entropy,

  hash_failed,
  mac_failed,

  invalid_key,
  key_generation_failed,
  key_derivation_failed,

  encrypt_failed,
  decrypt_failed,
  authentication_failed,

  sign_failed,
  verify_failed,

  provider_error,
  provider_unavailable,

  internal_error
};
```

## Error

```cpp
struct Error
{
  ErrorCode code{ErrorCode::ok};
  std::string_view message{};

  constexpr Error() = default;

  constexpr Error(
      ErrorCode c,
      std::string_view msg = {});

  constexpr bool ok() const noexcept;

  constexpr explicit operator bool() const noexcept;
};
```

```cpp
constexpr Error ok() noexcept;
```

## Result

```cpp
template <typename T>
class Result
{
public:
  using value_type = T;

  constexpr Result(const T &value);
  constexpr Result(T &&value);

  constexpr Result(Error err);

  constexpr Result(
      ErrorCode code,
      std::string_view msg = {});

  Result(const Result &other);

  Result(Result &&other) noexcept(
      std::is_nothrow_move_constructible_v<T>);

  Result &operator=(Result other) noexcept;

  ~Result();

  constexpr bool ok() const noexcept;

  constexpr explicit operator bool() const noexcept;

  T &value() &;

  const T &value() const &;

  T &&value() &&;

  const Error &error() const noexcept;

  void swap(Result &other) noexcept;
};
```

```cpp
template <>
class Result<void>
{
public:
  constexpr Result() = default;

  constexpr Result(Error err);

  constexpr Result(
      ErrorCode code,
      std::string_view msg = {});

  constexpr bool ok() const noexcept;

  constexpr explicit operator bool() const noexcept;

  const Error &error() const noexcept;
};
```

## Random

```cpp
Result<void> random_bytes(
    std::span<std::uint8_t> out) noexcept;
```

```cpp
Result<std::uint64_t> random_uint(
    std::uint64_t max) noexcept;
```

## Hashing

```cpp
enum class HashAlg : std::uint8_t
{
  sha256 = 1
};
```

```cpp
constexpr std::size_t hash_size(
    HashAlg alg) noexcept;
```

```cpp
Result<void> hash(
    HashAlg alg,
    std::span<const std::uint8_t> data,
    std::span<std::uint8_t> out) noexcept;
```

```cpp
Result<void> sha256(
    std::span<const std::uint8_t> data,
    std::span<std::uint8_t> out) noexcept;
```

```cpp
Result<void> sha256(
    std::string_view data,
    std::span<std::uint8_t> out) noexcept;
```

## HMAC

```cpp
enum class HmacAlg : std::uint8_t
{
  sha256 = 1
};
```

```cpp
constexpr std::size_t hmac_size(
    HmacAlg alg) noexcept;
```

```cpp
Result<void> hmac(
    HmacAlg alg,
    std::span<const std::uint8_t> key,
    std::span<const std::uint8_t> data,
    std::span<std::uint8_t> out) noexcept;
```

```cpp
Result<void> hmac_sha256(
    std::span<const std::uint8_t> key,
    std::span<const std::uint8_t> data,
    std::span<std::uint8_t> out) noexcept;
```

```cpp
Result<void> hmac_sha256(
    std::span<const std::uint8_t> key,
    std::string_view data,
    std::span<std::uint8_t> out) noexcept;
```

## KDF

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
    std::span<std::uint8_t> out) noexcept;
```

```cpp
Result<void> hkdf_sha256(
    std::span<const std::uint8_t> ikm,
    std::span<const std::uint8_t> salt,
    std::span<const std::uint8_t> info,
    std::span<std::uint8_t> out) noexcept;
```

## Secret keys

```cpp
class SecretKey
{
public:
  SecretKey();

  explicit SecretKey(
      std::size_t size);

  explicit SecretKey(
      std::vector<std::uint8_t> bytes);

  SecretKey(const SecretKey &) = delete;

  SecretKey &operator=(
      const SecretKey &) = delete;

  SecretKey(
      SecretKey &&other) noexcept;

  SecretKey &operator=(
      SecretKey &&other) noexcept;

  ~SecretKey();

  std::size_t size() const noexcept;

  bool empty() const noexcept;

  std::span<const std::uint8_t> bytes() const noexcept;

  std::span<std::uint8_t> bytes_mut() noexcept;
};
```

```cpp
Result<SecretKey> generate_secret_key(
    std::size_t size) noexcept;
```

## Passwords

```cpp
enum class PasswordHashAlg : std::uint8_t
{
  pbkdf2_sha256 = 1
};
```

```cpp
struct PasswordHashParams final
{
  std::uint32_t iterations{310000};
  std::size_t salt_size{16};
  std::size_t hash_size{32};
  PasswordHashAlg alg{PasswordHashAlg::pbkdf2_sha256};
};
```

```cpp
Result<std::string> password_hash(
    std::string_view password,
    const PasswordHashParams &params = {}) noexcept;
```

```cpp
Result<bool> password_verify(
    std::string_view password,
    std::string_view encoded_hash) noexcept;
```

The encoded password hash format is:

```txt
vix-pbkdf2-sha256$310000$<salt_hex>$<hash_hex>
```

## Bytes

```cpp
std::span<const std::uint8_t> bytes(
    std::string_view s) noexcept;
```

## Hex

```cpp
std::string hex_lower(
    std::span<const std::uint8_t> bytes);
```

## Constant-time comparison

```cpp
bool constant_time_equal(
    std::span<const std::uint8_t> a,
    std::span<const std::uint8_t> b) noexcept;
```

## AEAD

```cpp
enum class AeadAlg : std::uint8_t
{
  aes_256_gcm = 1
};
```

```cpp
constexpr std::size_t aead_key_size(
    AeadAlg alg) noexcept;
```

```cpp
constexpr std::size_t aead_nonce_size(
    AeadAlg alg) noexcept;
```

```cpp
constexpr std::size_t aead_tag_size(
    AeadAlg alg) noexcept;
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

## AEAD helpers

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

```cpp
namespace vix::crypto::aead
{
  Result<Sealed> seal(
      AeadAlg alg,
      std::span<const std::uint8_t> key,
      std::span<const std::uint8_t> nonce,
      std::span<const std::uint8_t> plaintext,
      std::span<const std::uint8_t> aad = {}) noexcept;
}
```

```cpp
namespace vix::crypto::aead
{
  Result<Sealed> seal(
      AeadAlg alg,
      std::span<const std::uint8_t> key,
      std::span<const std::uint8_t> nonce,
      std::string_view plaintext,
      std::string_view aad = {}) noexcept;
}
```

```cpp
namespace vix::crypto::aead
{
  Result<std::vector<std::uint8_t>> open(
      AeadAlg alg,
      std::span<const std::uint8_t> key,
      std::span<const std::uint8_t> nonce,
      const Sealed &sealed,
      std::span<const std::uint8_t> aad = {}) noexcept;
}
```

```cpp
namespace vix::crypto::aead
{
  Result<std::vector<std::uint8_t>> open(
      AeadAlg alg,
      std::span<const std::uint8_t> key,
      std::span<const std::uint8_t> nonce,
      const Sealed &sealed,
      std::string_view aad) noexcept;
}
```

```cpp
namespace vix::crypto::aead
{
  Result<std::string> open_string(
      AeadAlg alg,
      std::span<const std::uint8_t> key,
      std::span<const std::uint8_t> nonce,
      const Sealed &sealed,
      std::span<const std::uint8_t> aad = {}) noexcept;
}
```

```cpp
namespace vix::crypto::aead
{
  Result<std::string> open_string(
      AeadAlg alg,
      std::span<const std::uint8_t> key,
      std::span<const std::uint8_t> nonce,
      const Sealed &sealed,
      std::string_view aad) noexcept;
}
```

## Signatures

```cpp
enum class SignatureAlg : std::uint8_t
{
  ed25519 = 1
};
```

```cpp
constexpr std::size_t signature_public_key_size(
    SignatureAlg alg) noexcept;
```

```cpp
constexpr std::size_t signature_private_key_size(
    SignatureAlg alg) noexcept;
```

```cpp
constexpr std::size_t signature_size(
    SignatureAlg alg) noexcept;
```

```cpp
Result<void> signature_keygen(
    SignatureAlg alg,
    std::span<std::uint8_t> out_public_key,
    std::span<std::uint8_t> out_private_key) noexcept;
```

```cpp
Result<void> sign(
    SignatureAlg alg,
    std::span<const std::uint8_t> private_key,
    std::span<const std::uint8_t> message,
    std::span<std::uint8_t> out_signature) noexcept;
```

```cpp
Result<void> verify(
    SignatureAlg alg,
    std::span<const std::uint8_t> public_key,
    std::span<const std::uint8_t> message,
    std::span<const std::uint8_t> signature) noexcept;
```

## Signature helpers

```cpp
namespace vix::crypto::signature
{
  struct Keypair final
  {
    std::array<std::uint8_t, 32> public_key{};
    std::array<std::uint8_t, 64> private_key{};
  };
}
```

```cpp
namespace vix::crypto::signature
{
  Result<Keypair> keygen(
      SignatureAlg alg = SignatureAlg::ed25519) noexcept;
}
```

```cpp
namespace vix::crypto::signature
{
  Result<std::array<std::uint8_t, 64>> sign(
      SignatureAlg alg,
      std::span<const std::uint8_t> private_key,
      std::span<const std::uint8_t> message) noexcept;
}
```

```cpp
namespace vix::crypto::signature
{
  Result<std::array<std::uint8_t, 64>> sign(
      SignatureAlg alg,
      std::span<const std::uint8_t> private_key,
      std::string_view message) noexcept;
}
```

```cpp
namespace vix::crypto::signature
{
  Result<void> verify(
      SignatureAlg alg,
      std::span<const std::uint8_t> public_key,
      std::span<const std::uint8_t> message,
      std::span<const std::uint8_t> sig) noexcept;
}
```

```cpp
namespace vix::crypto::signature
{
  Result<void> verify(
      SignatureAlg alg,
      std::span<const std::uint8_t> public_key,
      std::string_view message,
      std::span<const std::uint8_t> sig) noexcept;
}
```

## Certificates

```cpp
struct CertificateInfo final
{
  bool exists{false};
  bool readable{false};
  bool validFormat{false};
  bool expired{false};

  std::string subject{};
  std::string issuer{};

  std::string notBefore{};
  std::string notAfter{};

  std::vector<std::string> dnsNames{};
};
```

```cpp
Result<CertificateInfo> inspect_certificate(
    const std::filesystem::path &path) noexcept;
```

```cpp
bool certificate_matches_domain(
    const CertificateInfo &info,
    std::string_view domain) noexcept;
```

## Provider-related errors

Several crypto operations depend on provider support. When a provider is missing or disabled, the operation returns an explicit error instead of silently succeeding.

```txt
provider_unavailable   provider support is not enabled or not available
provider_error         provider was available but the provider call failed
not_supported          selected algorithm is not supported by the public API
```

## Common output sizes

```txt
SHA-256 digest              32 bytes
HMAC-SHA256 MAC             32 bytes
AES-256-GCM key             32 bytes
AES-256-GCM nonce           12 bytes
AES-256-GCM tag             16 bytes
Ed25519 public key          32 bytes
Ed25519 private key         64 bytes
Ed25519 signature           64 bytes
Default password salt       16 bytes
Default password hash       32 bytes
```

## Next step

Return to the overview page when you need the conceptual map of the module, or use the focused pages when you need examples for a specific primitive.
