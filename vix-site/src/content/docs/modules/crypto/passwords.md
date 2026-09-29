# Passwords

The `crypto` module provides password hashing helpers for authentication systems. Passwords should not be stored as plain text, and they should not be stored with a simple hash such as SHA-256. The password API derives a password hash with PBKDF2-SHA256, stores the salt and parameters with the derived hash, and verifies passwords through the same encoded format.

The public API is intentionally small. `password_hash` creates a self-describing encoded string, and `password_verify` checks a plain-text password against that encoded value.

## Header

Use the module entry point for normal crypto code:

```cpp
#include <vix/crypto/crypto.hpp>
```

For files that only need password hashing helpers, the direct header can also be used:

```cpp
#include <vix/crypto/password.hpp>
```

## Hash a password

`password_hash` takes a plain-text password and returns an encoded password hash.

```cpp
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

  std::string encoded = stored.value();

  return encoded.empty() ? 1 : 0;
}
```

The returned string is the value that should be stored in the database. It contains the algorithm name, the iteration count, the random salt, and the derived hash.

## Verify a password

`password_verify` checks a plain-text password against an encoded hash produced by `password_hash`.

```cpp
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

A successful `Result<bool>` means the verification process completed. The boolean value then tells whether the password matched. A failed result means the encoded hash was invalid, the parameters were not accepted, or the crypto provider failed.

## Encoded format

Password hashes are stored in a self-describing format:

```txt
vix-pbkdf2-sha256$310000$<salt_hex>$<hash_hex>
```

This format keeps all verification data in one string:

```txt
algorithm   vix-pbkdf2-sha256
iterations  PBKDF2 iteration count
salt_hex    random salt encoded as lowercase hexadecimal
hash_hex    derived password hash encoded as lowercase hexadecimal
```

This is useful for database storage because the application does not need separate columns for the algorithm, salt, and derived hash. The encoded string contains everything needed to verify the password later.

## Default parameters

The default password hashing parameters are:

```cpp
PasswordHashParams params{};
```

```txt
algorithm    PBKDF2-SHA256
iterations   310000
salt size    16 bytes
hash size    32 bytes
```

The default values are suitable for the module baseline. Applications can pass explicit parameters when they need to tune the cost.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  PasswordHashParams params{};
  params.iterations = 350000;
  params.salt_size = 16;
  params.hash_size = 32;

  auto stored = password_hash("password", params);

  return stored.ok() ? 0 : 1;
}
```

Higher iteration counts make password hashing slower, which helps resist brute-force attacks. The cost should be chosen according to the deployment environment and the acceptable authentication latency.

## Parameter validation

The implementation rejects weak parameters. The current minimums are:

```txt
iterations   at least 100000
salt size    at least 16 bytes
hash size    at least 32 bytes
```

If a caller provides parameters below those limits, `password_hash` returns an error.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  PasswordHashParams params{};
  params.iterations = 10;

  auto stored = password_hash("password", params);

  if (!stored.ok() &&
      stored.error().code == ErrorCode::invalid_argument)
  {
    return 0;
  }

  return 1;
}
```

This keeps weak password hashing settings from being accepted accidentally.

## Empty passwords

The password API rejects empty passwords.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto stored = password_hash("");

  if (!stored.ok() &&
      stored.error().code == ErrorCode::invalid_argument)
  {
    return 0;
  }

  return 1;
}
```

Application-level password policy can still enforce stronger rules before calling the crypto module. The module-level check only prevents an empty password from entering the hashing operation.

## Invalid encoded hashes

`password_verify` parses the encoded hash before deriving and comparing the password hash. If the encoded string is malformed, unsupported, or below the minimum accepted parameters, verification returns an error.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto verified = password_verify(
    "password",
    "invalid-format"
  );

  if (!verified.ok() &&
      verified.error().code == ErrorCode::invalid_argument)
  {
    return 0;
  }

  return 1;
}
```

This separates a normal password mismatch from an invalid stored hash. A mismatch returns `Result<bool>{false}`. A malformed hash returns an error.

## Wrong password

A wrong password is not a crypto failure. It is a successful verification operation with a `false` result.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto stored = password_hash("correct password");

  if (!stored.ok())
  {
    return 1;
  }

  auto verified = password_verify(
    "wrong password",
    stored.value()
  );

  if (!verified.ok())
  {
    return 1;
  }

  return verified.value() ? 1 : 0;
}
```

This distinction matters in authentication code. Invalid storage data and provider failures should be handled as errors. A wrong password should be handled as a normal failed login attempt.

## Constant-time verification

During verification, the module derives the password hash again and compares the derived bytes with the stored hash using constant-time comparison.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto stored = password_hash("secret");

  if (!stored.ok())
  {
    return 1;
  }

  auto verified = password_verify("secret", stored.value());

  if (!verified.ok())
  {
    return 1;
  }

  return verified.value() ? 0 : 1;
}
```

Application code should normally use `password_verify` directly instead of parsing the encoded hash and comparing values manually.

## Store the encoded value

In a user table, the encoded string can be stored in one column.

```txt
users
  id
  email
  password_hash
  created_at
```

The stored value should be treated as sensitive authentication data. It is not the plain password, but it still represents a password verifier and should not be exposed in logs, API responses, or client-side payloads.

## API

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
  const PasswordHashParams &params = {}
) noexcept;
```

```cpp
Result<bool> password_verify(
  std::string_view password,
  std::string_view encoded_hash
) noexcept;
```

## Next step

Continue with KDF to derive cryptographic key material from input keying material using HKDF-SHA256.
