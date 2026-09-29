# Crypto

The `crypto` module provides cryptographic primitives and helpers for Vix applications. It gives C++ code a consistent way to work with secure randomness, hashes, HMACs, key derivation, password hashes, authenticated encryption, digital signatures, certificate inspection, and constant-time comparisons.

The module is designed around explicit control flow. Crypto operations return `Result<T>` or `Result<void>` instead of throwing exceptions, and most low-level functions operate on caller-provided byte buffers. This makes failures visible in the code and keeps memory ownership clear, which matters when working with keys, authentication tags, hashes, and other security-sensitive values.

## Basic model

Most APIs in `vix::crypto` follow the same shape: prepare input bytes, provide the output buffer, call the operation, then check the result.

```cpp
#include <array>
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

This style keeps crypto failures explicit. A missing provider, an invalid buffer size, an unsupported algorithm, or an authentication failure is returned as an `Error`, so the caller can decide how to handle it.

## What the module includes

The module covers the core operations needed by Vix tooling and applications.

```txt
random          secure random bytes and unbiased random integers
hash            one-shot SHA-256 hashing
hmac            one-shot HMAC-SHA256 authentication
kdf             HKDF-SHA256 key derivation
keys            secret key ownership and key generation
password        PBKDF2-SHA256 password hashing and verification
aead            AES-256-GCM authenticated encryption
signature       Ed25519 signing and verification
certificate     PEM X.509 certificate inspection
compare         constant-time comparison for sensitive values
bytes           string-to-byte-span helpers
hex             lowercase hexadecimal encoding
```

The module does not hide these operations behind a single high-level abstraction. Each primitive has a clear purpose, and the APIs are kept small so the developer can see which algorithm, key size, nonce size, and output buffer are being used.

## Results and errors

Crypto functions do not use exceptions as their normal failure path. They return `Result<T>` when a value is produced, or `Result<void>` when the operation only needs to report success or failure.

```cpp
#include <array>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> out{};

  auto result = random_bytes(out);

  if (!result.ok())
  {
    Error error = result.error();
    return error.ok() ? 0 : 1;
  }

  return 0;
}
```

This model is important for cryptographic code because failure is often meaningful. Entropy may be unavailable, a key may have the wrong size, an authentication tag may not verify, or a provider may not be enabled. Returning explicit errors makes those cases part of the normal control flow.

## Secure randomness

`random_bytes` fills a buffer with cryptographically secure random bytes.

```cpp
#include <array>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> key{};

  auto result = random_bytes(key);

  if (!result.ok())
  {
    return 1;
  }

  return 0;
}
```

Randomness is the root of many crypto workflows. It is used for keys, salts, nonces, and other values that must not be predictable. The API does not accept manual seeding from the caller; if secure entropy is not available, it reports an error.

## Hashing and HMAC

Hashing computes a fixed-size digest from input data. The initial stable hashing API provides SHA-256.

```cpp
#include <array>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> digest{};

  auto result = sha256("vix", digest);

  if (!result.ok())
  {
    return 1;
  }

  return 0;
}
```

HMAC adds a secret key to the hashing process and is used when a value needs integrity and authenticity, not just a digest.

```cpp
#include <array>
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

  return 0;
}
```

Hashes and HMACs are one-shot operations in this module. The complete input is passed at once, and the caller provides the output buffer.

## Password hashing

The password API stores password hashes in a self-describing encoded format. The encoded value contains the algorithm, iteration count, salt, and derived hash, so applications can store one string in a database and later verify a password against it.

```cpp
#include <string>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto hashed = password_hash("correct horse battery staple");

  if (!hashed.ok())
  {
    return 1;
  }

  auto verified = password_verify(
    "correct horse battery staple",
    hashed.value()
  );

  if (!verified.ok())
  {
    return 1;
  }

  return verified.value() ? 0 : 1;
}
```

Password verification parses the encoded hash, derives the password hash again, and compares the result using constant-time comparison. This keeps the database format practical while still preserving the security properties needed by an authentication system.

## Authenticated encryption

AEAD combines encryption and authentication. In the current API, AES-256-GCM is the supported AEAD algorithm. It encrypts the plaintext and produces an authentication tag that must verify before decrypted plaintext can be trusted.

```cpp
#include <array>
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
    "secret message",
    "context"
  );

  if (!sealed.ok())
  {
    return 1;
  }

  auto opened = aead::open_string(
    AeadAlg::aes_256_gcm,
    key,
    nonce,
    sealed.value(),
    "context"
  );

  if (!opened.ok())
  {
    return 1;
  }

  return opened.value() == "secret message" ? 0 : 1;
}
```

The nonce must be unique for each encryption with the same key. Reusing a nonce with AES-GCM breaks the security of the encryption. The helper API handles ciphertext allocation, but it does not generate nonces, derive keys, or manage replay protection for the caller.

## Digital signatures

The signature API provides Ed25519 key generation, signing, and verification. The low-level API works with fixed-size buffers, while the `signature` helper namespace provides a simpler interface for common cases.

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
    "message"
  );

  if (!sig.ok())
  {
    return 1;
  }

  auto verified = signature::verify(
    SignatureAlg::ed25519,
    keypair.value().public_key,
    "message",
    sig.value()
  );

  return verified.ok() ? 0 : 1;
}
```

Signatures are useful when data needs to be verified by another party without sharing a secret key. The private key signs the message, and the public key verifies the signature.

## Certificate inspection

The certificate helpers inspect PEM-encoded X.509 TLS certificates. They are useful for deployment tooling that needs to check whether a certificate exists, can be parsed, has expired, or contains a DNS name for a domain.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto info = inspect_certificate("/etc/ssl/example/fullchain.pem");

  if (!info.ok())
  {
    return 1;
  }

  bool matches = certificate_matches_domain(
    info.value(),
    "example.com"
  );

  return matches ? 0 : 1;
}
```

This API inspects certificates. It does not generate certificates and does not manage ACME or Let's Encrypt flows. Those responsibilities belong to deployment tooling.

## Header

Use the module entry point for normal crypto code:

```cpp
#include <vix/crypto/crypto.hpp>
```

The module entry point includes the public crypto components:

```cpp
#include <vix/crypto/Error.hpp>
#include <vix/crypto/Result.hpp>
#include <vix/crypto/random.hpp>
#include <vix/crypto/hash.hpp>
#include <vix/crypto/hmac.hpp>
#include <vix/crypto/kdf.hpp>
#include <vix/crypto/keys.hpp>
#include <vix/crypto/aead.hpp>
#include <vix/crypto/signature.hpp>
#include <vix/crypto/bytes.hpp>
#include <vix/crypto/hex.hpp>
#include <vix/crypto/aead_easy.hpp>
#include <vix/crypto/signature_easy.hpp>
#include <vix/crypto/certificate.hpp>
#include <vix/crypto/compare.hpp>
#include <vix/crypto/password.hpp>
```

For most application code, including `<vix/crypto/crypto.hpp>` is enough.

## Next step

Continue with the quick start page to hash data, generate random bytes, verify a password, and run a small authenticated encryption example.
