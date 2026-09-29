# Random

Randomness is the root of many cryptographic workflows. Keys, salts, nonces, temporary secrets, and unpredictable identifiers all depend on values that an attacker cannot guess. The `crypto` module exposes this through `random_bytes`, which fills a caller-provided buffer with cryptographically secure random bytes.

The API does not accept a seed from the caller. Cryptographic randomness must come from a secure system or provider source, not from application-controlled seeding. When secure entropy cannot be obtained, the function returns an explicit error.

## Header

Use the module entry point for normal crypto code:

```cpp id="l2bbzp"
#include <vix/crypto/crypto.hpp>
```

For files that only need random helpers, the direct header can also be used:

```cpp id="s3fd4n"
#include <vix/crypto/random.hpp>
```

## Generate random bytes

`random_bytes` fills an existing byte buffer.

```cpp id="z7m7xz"
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> bytes{};

  auto result = random_bytes(bytes);

  if (!result.ok())
  {
    return 1;
  }

  return 0;
}
```

The caller controls the size of the buffer. This keeps allocation outside the random function and makes the output size visible at the call site.

## Generate a key-sized buffer

A common use of `random_bytes` is to create key material with a size required by another crypto primitive.

```cpp id="yd3j50"
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

  return key.size() == 32 ? 0 : 1;
}
```

For owned secret keys, prefer `generate_secret_key`. It wraps the random generation step in a `SecretKey` object and zeroizes the owned memory when the key is destroyed.

## Generate a random integer

Use `random_uint` when the code needs a uniformly distributed integer in the range `[0, max)`.

```cpp id="qq90ae"
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto value = random_uint(100);

  if (!value.ok())
  {
    return 1;
  }

  return value.value() < 100 ? 0 : 1;
}
```

The implementation uses rejection sampling to avoid modulo bias. This matters when a random number is mapped into a smaller range, because a simple modulo operation can make some values more likely than others.

## Empty buffers

Passing an empty buffer to `random_bytes` succeeds and performs no work.

```cpp id="4la5kb"
#include <span>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::span<std::uint8_t> empty{};

  auto result = random_bytes(empty);

  return result.ok() ? 0 : 1;
}
```

This behavior is useful for generic code where the requested output size may be zero. It avoids treating a no-op as an error.

## Error handling

Random generation can fail when secure entropy is unavailable or when the platform does not provide a supported secure RNG source.

```cpp id="l7o86f"
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> bytes{};

  auto result = random_bytes(bytes);

  if (!result.ok())
  {
    Error err = result.error();

    if (err.code == ErrorCode::entropy_unavailable)
    {
      return 2;
    }

    return 1;
  }

  return 0;
}
```

Most application code only needs to check `ok()`. More specific error handling is useful in tests, diagnostics, and deployment tooling where the difference between unavailable entropy and unsupported provider configuration matters.

## Use with nonces

Some crypto algorithms need a nonce. A nonce is not always secret, but it must follow the rules of the algorithm. For AES-256-GCM, the nonce size is 12 bytes, and the same nonce must not be reused with the same key.

```cpp id="xsmoqw"
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 12> nonce{};

  auto result = random_bytes(nonce);

  if (!result.ok())
  {
    return 1;
  }

  return 0;
}
```

Generating a random nonce is a practical approach for many local workflows, but the application is still responsible for ensuring that nonce reuse does not happen for the same key.

## API

```cpp id="i3gb7u"
Result<void> random_bytes(std::span<std::uint8_t> out) noexcept;

Result<std::uint64_t> random_uint(std::uint64_t max) noexcept;
```

## Next step

Continue with hashing to compute SHA-256 digests from byte buffers and strings.
