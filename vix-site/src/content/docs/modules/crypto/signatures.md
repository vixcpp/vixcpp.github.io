# Signatures

Digital signatures are used when a message must be verified with a public key. Unlike HMAC, which requires both sides to share the same secret key, a signature uses a private key to sign and a public key to verify. This makes signatures useful for protocols, packages, tokens, configuration files, and any workflow where one side proves authorship while another side verifies it without receiving the private key.

The `crypto` module currently exposes Ed25519 signatures. The low-level API works with caller-provided buffers, while the `vix::crypto::signature` helper namespace provides a smaller interface for key generation, signing, and verification.

## Header

Use the module entry point for normal crypto code:

```cpp
#include <vix/crypto/crypto.hpp>
```

For files that only need signatures, the direct headers can also be used:

```cpp
#include <vix/crypto/signature.hpp>
#include <vix/crypto/signature_easy.hpp>
```

## Algorithm sizes

Ed25519 uses a 32-byte public key, a 64-byte private key in the Vix helper format, and a 64-byte signature.

```cpp
#include <cstddef>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  constexpr std::size_t public_key_size =
      signature_public_key_size(SignatureAlg::ed25519);

  constexpr std::size_t private_key_size =
      signature_private_key_size(SignatureAlg::ed25519);

  constexpr std::size_t signature_bytes =
      signature_size(SignatureAlg::ed25519);

  static_assert(public_key_size == 32);
  static_assert(private_key_size == 64);
  static_assert(signature_bytes == 64);

  return 0;
}
```

These helpers keep the required sizes close to the selected algorithm and avoid spreading fixed numbers across the application.

## Generate a key pair

The easiest way to create a signature key pair is to use `signature::keygen`.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto keypair = signature::keygen();

  if (!keypair.ok())
  {
    return 1;
  }

  return 0;
}
```

The returned `Keypair` contains a public verification key and a private signing key. For Ed25519, the private key stored by the helper is 64 bytes: a 32-byte seed followed by the 32-byte public key.

## Sign a message

Use `signature::sign` to sign a message with a private key.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto keypair = signature::keygen();

  if (!keypair.ok())
  {
    return 1;
  }

  auto sig = signature::sign(
      SignatureAlg::ed25519,
      keypair.value().private_key,
      "message to sign");

  if (!sig.ok())
  {
    return 1;
  }

  return 0;
}
```

The message string is interpreted as raw bytes. No encoding conversion or text normalization is performed.

## Verify a signature

Use `signature::verify` with the public key, the original message, and the signature bytes.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto keypair = signature::keygen();

  if (!keypair.ok())
  {
    return 1;
  }

  auto sig = signature::sign(
      SignatureAlg::ed25519,
      keypair.value().private_key,
      "message to sign");

  if (!sig.ok())
  {
    return 1;
  }

  auto verified = signature::verify(
      SignatureAlg::ed25519,
      keypair.value().public_key,
      "message to sign",
      sig.value());

  return verified.ok() ? 0 : 1;
}
```

A successful verification returns `Result<void>{}`. A failed verification returns an error, usually with `ErrorCode::verify_failed` when the signature is not valid.

## Invalid signature

A signature must match the public key, the message, and the signature bytes. If the message changes, verification fails.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto keypair = signature::keygen();

  if (!keypair.ok())
  {
    return 1;
  }

  auto sig = signature::sign(
      SignatureAlg::ed25519,
      keypair.value().private_key,
      "original message");

  if (!sig.ok())
  {
    return 1;
  }

  auto verified = signature::verify(
      SignatureAlg::ed25519,
      keypair.value().public_key,
      "changed message",
      sig.value());

  if (!verified.ok() &&
      verified.error().code == ErrorCode::verify_failed)
  {
    return 0;
  }

  return 1;
}
```

A failed verification is not the same kind of problem as a missing provider or an invalid buffer size. It means the signature could not be trusted for the given message and public key.

## Sign byte data

The helper API also accepts byte spans. This is useful when the data is already binary.

```cpp
#include <array>
#include <cstdint>
#include <vector>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto keypair = signature::keygen();

  if (!keypair.ok())
  {
    return 1;
  }

  std::vector<std::uint8_t> message{
      0x76, 0x69, 0x78};

  auto sig = signature::sign(
      SignatureAlg::ed25519,
      keypair.value().private_key,
      message);

  if (!sig.ok())
  {
    return 1;
  }

  auto verified = signature::verify(
      SignatureAlg::ed25519,
      keypair.value().public_key,
      message,
      sig.value());

  return verified.ok() ? 0 : 1;
}
```

The byte-based overload avoids any assumption about text encoding and is the right shape for serialized records, package metadata, protocol payloads, and binary messages.

## Use the low-level API

The low-level API uses caller-provided buffers for the public key, private key, and signature.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> public_key{};
  std::array<std::uint8_t, 64> private_key{};
  std::array<std::uint8_t, 64> sig{};

  auto generated = signature_keygen(
      SignatureAlg::ed25519,
      public_key,
      private_key);

  if (!generated.ok())
  {
    return 1;
  }

  auto signed_message = sign(
      SignatureAlg::ed25519,
      private_key,
      bytes("message"),
      sig);

  if (!signed_message.ok())
  {
    return 1;
  }

  auto verified = verify(
      SignatureAlg::ed25519,
      public_key,
      bytes("message"),
      sig);

  return verified.ok() ? 0 : 1;
}
```

This form is useful in tests, low-level integrations, or code that already manages fixed-size buffers directly.

## Buffer size errors

The low-level API requires exact buffer sizes. Ed25519 public keys must be 32 bytes, private keys must be 64 bytes for generated keys, and signatures must be 64 bytes.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 16> public_key{};
  std::array<std::uint8_t, 64> private_key{};

  auto result = signature_keygen(
      SignatureAlg::ed25519,
      public_key,
      private_key);

  if (!result.ok() &&
      result.error().code == ErrorCode::invalid_argument)
  {
    return 0;
  }

  return 1;
}
```

The helper API avoids some of this manual sizing by returning a fixed `Keypair` and a fixed-size signature container.

## Keypair helper

`signature::Keypair` is the helper container returned by `signature::keygen`.

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

The public key is safe to distribute. The private key must be protected by the application and should not be logged, exposed in API responses, or stored without a clear key-management decision.

## Signatures and HMAC

Signatures and HMACs both verify message authenticity, but they are used in different trust models.

```txt
HMAC        one shared secret key signs and verifies
Signature   private key signs, public key verifies
```

Use HMAC when both sides are allowed to know the same secret. Use signatures when verification should be possible without access to the signing key.

## API

```cpp
enum class SignatureAlg : std::uint8_t
{
  ed25519 = 1
};
```

```cpp
constexpr std::size_t
signature_public_key_size(SignatureAlg alg) noexcept;

constexpr std::size_t
signature_private_key_size(SignatureAlg alg) noexcept;

constexpr std::size_t
signature_size(SignatureAlg alg) noexcept;
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

```cpp
namespace vix::crypto::signature
{
  Result<Keypair> keygen(
      SignatureAlg alg = SignatureAlg::ed25519) noexcept;

  Result<std::array<std::uint8_t, 64>> sign(
      SignatureAlg alg,
      std::span<const std::uint8_t> private_key,
      std::span<const std::uint8_t> message) noexcept;

  Result<std::array<std::uint8_t, 64>> sign(
      SignatureAlg alg,
      std::span<const std::uint8_t> private_key,
      std::string_view message) noexcept;

  Result<void> verify(
      SignatureAlg alg,
      std::span<const std::uint8_t> public_key,
      std::span<const std::uint8_t> message,
      std::span<const std::uint8_t> sig) noexcept;

  Result<void> verify(
      SignatureAlg alg,
      std::span<const std::uint8_t> public_key,
      std::string_view message,
      std::span<const std::uint8_t> sig) noexcept;
}
```

## Next step

Continue with certificates to inspect PEM X.509 TLS certificates and validate DNS names for deployment tooling.
