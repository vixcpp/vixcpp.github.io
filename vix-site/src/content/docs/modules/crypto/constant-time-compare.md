# Constant-Time Compare

Cryptographic values should not always be compared with ordinary equality. A normal comparison may stop as soon as it finds a different byte, which can reveal information through timing differences. That behavior is acceptable for normal application values, but it is not appropriate for sensitive values such as MACs, password hashes, authentication tags, token digests, or derived secrets.

The `crypto` module provides `constant_time_equal` for these cases. It compares byte sequences without returning early on the first difference, so the comparison does not expose the same kind of byte-by-byte timing signal.

## Header

Use the module entry point for normal crypto code:

```cpp
#include <vix/crypto/crypto.hpp>
```

For files that only need constant-time comparison, the direct header can also be used:

```cpp
#include <vix/crypto/compare.hpp>
```

## Compare two byte sequences

`constant_time_equal` takes two byte spans and returns `true` only when both sequences have the same size and the same content.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 4> a{1, 2, 3, 4};
  std::array<std::uint8_t, 4> b{1, 2, 3, 4};

  bool same = constant_time_equal(a, b);

  return same ? 0 : 1;
}
```

The function is intended for binary values. It works naturally with arrays, vectors, and other contiguous byte containers that can be viewed as `std::span<const std::uint8_t>`.

## Compare HMAC values

A common use of constant-time comparison is verifying a MAC. The code computes a MAC from the received message and compares it with the expected MAC.

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

The important part is not only that the bytes match. It is also that the comparison does not reveal which byte failed first when the values do not match.

## Different sizes

If the two inputs have different sizes, the function returns `false`.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  std::array<std::uint8_t, 3> a{1, 2, 3};
  std::array<std::uint8_t, 4> b{1, 2, 3, 4};

  bool same = vix::crypto::constant_time_equal(a, b);

  return same ? 1 : 0;
}
```

The function still processes input in a deterministic way based on the largest input size before returning. This avoids the most direct form of early-return comparison while still making size mismatch a failed comparison.

## Compare decoded values, not text when possible

When a sensitive value is stored or transferred as hexadecimal text, the safest workflow is to compare the underlying bytes after decoding them. `hex_lower` is an encoder only; it turns bytes into lowercase text. The current helper does not provide public hex decoding, so applications that store sensitive values as text should decode them carefully before using `constant_time_equal`.

For values that are already available as bytes, compare the byte containers directly.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> first{};
  std::array<std::uint8_t, 32> second{};

  if (!sha256("token", first).ok())
  {
    return 1;
  }

  if (!sha256("token", second).ok())
  {
    return 1;
  }

  return constant_time_equal(first, second) ? 0 : 1;
}
```

This keeps comparison close to the binary value that the cryptographic operation produced.

## Use with password verification

Applications usually do not need to call `constant_time_equal` directly for password hashes. The password API already uses constant-time comparison internally when verifying a password against an encoded hash.

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

Use `password_verify` for password checks. Use `constant_time_equal` when implementing other verification workflows that compare sensitive byte values directly.

## API

```cpp
bool constant_time_equal(
  std::span<const std::uint8_t> a,
  std::span<const std::uint8_t> b
) noexcept;
```

## Next step

Continue with passwords to see how the module hashes and verifies passwords using an encoded PBKDF2-SHA256 format.
