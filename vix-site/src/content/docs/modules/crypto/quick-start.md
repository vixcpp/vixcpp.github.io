# Quick Start

The `crypto` module is easiest to start with through the module entry point:

```cpp id="czwd51"
#include <vix/crypto/crypto.hpp>
```

Most functions in the module return `Result<T>` or `Result<void>`. A successful result can be used normally, while a failed result carries an `Error`. This makes crypto failures explicit in the code, which is important for operations that depend on secure entropy, valid key sizes, authentication tags, or provider support.

## Generate random bytes

Random bytes are used for keys, salts, nonces, and other values that must not be predictable. The `random_bytes` function fills a caller-provided buffer and returns an explicit result.

```cpp id="ehsxca"
#include <array>
#include <cstdint>
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

The caller does not seed the generator manually. If the platform or provider cannot supply secure entropy, the function returns an error instead of silently producing weak data.

## Hash a value

The initial hashing API provides one-shot SHA-256. The caller provides a 32-byte output buffer.

```cpp id="zgi4qu"
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> digest{};

  auto result = sha256("hello from vix", digest);

  if (!result.ok())
  {
    return 1;
  }

  return 0;
}
```

The string overload treats the input as raw bytes. It does not perform encoding conversion.

## Encode bytes as hex

Hashes and MACs are binary values. When they need to be displayed, logged, or stored as text, use `hex_lower`.

```cpp id="m3ngab"
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

  return text.empty() ? 1 : 0;
}
```

The encoder produces lowercase hexadecimal text using the `0-9a-f` range.

## Compute an HMAC

Use HMAC when a message needs to be authenticated with a shared secret key. The HMAC-SHA256 helper writes a 32-byte MAC into the output buffer.

```cpp id="1vh37f"
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

  auto result = hmac_sha256(key, "signed message", mac);

  if (!result.ok())
  {
    return 1;
  }

  return 0;
}
```

A hash proves that data has a specific digest. An HMAC proves that the digest was produced by someone who had the secret key.

## Hash and verify a password

Passwords should not be stored as plain text. The password API creates a self-describing encoded hash that contains the algorithm, iteration count, salt, and derived hash.

```cpp id="hw4u8q"
#include <string>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto stored = password_hash("correct horse battery staple");

  if (!stored.ok())
  {
    return 1;
  }

  auto verified = password_verify(
    "correct horse battery staple",
    stored.value()
  );

  if (!verified.ok())
  {
    return 1;
  }

  return verified.value() ? 0 : 1;
}
```

The returned string can be stored in a database. Verification parses that string, derives the password hash again, and compares the derived bytes using constant-time comparison.

## Encrypt and authenticate data

AEAD provides authenticated encryption. It encrypts the plaintext and produces an authentication tag. During decryption, the tag must verify before the plaintext can be trusted.

```cpp id="zqopsd"
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
    "request:42"
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
    "request:42"
  );

  if (!opened.ok())
  {
    return 1;
  }

  return opened.value() == "private message" ? 0 : 1;
}
```

The additional authenticated data, or AAD, is authenticated but not encrypted. It must be the same during encryption and decryption. The nonce must also be unique for each encryption with the same key.

## Sign and verify a message

Use digital signatures when a message needs to be verified with a public key. The private key signs the message, and the public key verifies it.

```cpp id="tj3h1j"
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
    "message to sign"
  );

  if (!sig.ok())
  {
    return 1;
  }

  auto verified = signature::verify(
    SignatureAlg::ed25519,
    keypair.value().public_key,
    "message to sign",
    sig.value()
  );

  return verified.ok() ? 0 : 1;
}
```

This workflow is different from HMAC. HMAC uses one shared secret key. Digital signatures use a private key for signing and a public key for verification.

## Use explicit errors

When a crypto operation fails, inspect the returned error when the caller needs to react differently depending on the failure.

```cpp id="ux2o2h"
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
    Error err = result.error();

    if (err.code == ErrorCode::invalid_argument)
    {
      return 2;
    }

    return 1;
  }

  return 0;
}
```

Most application code only needs to check `ok()`. More detailed handling is useful in tooling, diagnostics, tests, and places where the application can recover from a specific crypto error.

## Next step

Continue with results and errors to understand the error model used by every crypto operation.
