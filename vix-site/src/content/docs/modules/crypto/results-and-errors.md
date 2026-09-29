# Results and Errors

The `crypto` module uses explicit result values for every operation that can fail. Cryptographic code often fails for reasons that are meaningful to the caller: a buffer has the wrong size, a provider is not available, secure entropy cannot be obtained, a key is invalid, or an authentication tag does not verify. Returning those failures as values keeps the control flow visible and avoids using exceptions as the normal error path.

The two central types are `Result<T>` and `Error`. A `Result<T>` contains either a successful value or an `Error`. A `Result<void>` is used when the operation only needs to report success or failure.

## Header

Use the module entry point for normal crypto code:

```cpp id="a9tw6l"
#include <vix/crypto/crypto.hpp>
```

For files that only need the result model, the direct headers can also be used:

```cpp id="8pezec"
#include <vix/crypto/Result.hpp>
#include <vix/crypto/Error.hpp>
```

## Result values

A successful `Result<T>` contains a value. A failed result contains an `Error`.

```cpp id="6w9x03"
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> key{};

  Result<void> result = random_bytes(key);

  if (!result.ok())
  {
    return 1;
  }

  return 0;
}
```

Most low-level crypto functions use `Result<void>` because the caller provides the output buffer. The function writes into that buffer on success and returns an error on failure.

## Result with a value

Some functions produce an owned value. In that case, they return `Result<T>`.

```cpp id="za8rex"
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto key = generate_secret_key(32);

  if (!key.ok())
  {
    return 1;
  }

  SecretKey secret = std::move(key).value();

  return secret.size() == 32 ? 0 : 1;
}
```

Only access `value()` after checking that the result is successful. The result type keeps the API small and predictable, so it does not add hidden recovery behavior when the caller reads the wrong side of the result.

## Boolean checks

`Result` has an explicit boolean conversion, so it can be checked directly in conditions.

```cpp id="ga2d5f"
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> digest{};

  auto result = sha256("hello", digest);

  if (!result)
  {
    return 1;
  }

  return 0;
}
```

Using `ok()` is often clearer in documentation and examples, but both forms express the same idea: the caller must check whether the operation succeeded before using its output.

## Error values

An `Error` contains an `ErrorCode` and an optional message.

```cpp id="y12jbc"
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

The message is a lightweight `std::string_view`. It is intended for diagnostics and logs, not for ownership-heavy error reporting. The stable part of the error is the `ErrorCode`.

## Error codes

`ErrorCode` describes the broad category of failure.

```cpp id="mt9s5n"
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

The codes are small and stable. They are meant to be useful for diagnostics, tests, and tools that need to distinguish between misuse, provider failure, authentication failure, and unsupported functionality.

## Handling authentication failure

Authentication failure is a normal security outcome in APIs such as AEAD decryption. It means the ciphertext, tag, key, nonce, or authenticated data did not match.

```cpp id="869ccd"
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
    "aad"
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
    "different-aad"
  );

  if (!opened.ok() &&
      opened.error().code == ErrorCode::authentication_failed)
  {
    return 0;
  }

  return 1;
}
```

When authentication fails, the decrypted output must not be trusted. The caller should treat the operation as failed and discard any plaintext buffer associated with that attempt.

## Provider errors

Some crypto operations depend on a provider such as OpenSSL. When the provider is not enabled or not available, the module returns an explicit provider error.

```cpp id="e8b5n4"
if (!result.ok())
{
  if (result.error().code == ErrorCode::provider_unavailable)
  {
    return 1;
  }
}
```

This is useful in build and deployment environments because the failure points to configuration rather than to the input data itself.

## Returning errors from helpers

Application helpers can return crypto errors directly. This keeps higher-level code aligned with the module’s error model.

```cpp id="t57z25"
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

vix::crypto::Result<std::array<std::uint8_t, 32>>
hash_token(std::string_view token) noexcept
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> digest{};

  auto result = sha256(token, digest);

  if (!result.ok())
  {
    return Result<std::array<std::uint8_t, 32>>{result.error()};
  }

  return Result<std::array<std::uint8_t, 32>>{digest};
}
```

This pattern is useful when a helper performs one crypto operation and wants to preserve the original failure reason.

## Result API

```cpp id="h62h7u"
template <typename T>
class Result
{
public:
  using value_type = T;

  Result(const T &value);
  Result(T &&value);
  Result(Error err);
  Result(ErrorCode code, std::string_view msg = {});

  bool ok() const noexcept;
  explicit operator bool() const noexcept;

  T &value() &;
  const T &value() const &;
  T &&value() &&;

  const Error &error() const noexcept;
};
```

```cpp id="dmsyzo"
template <>
class Result<void>
{
public:
  Result();
  Result(Error err);
  Result(ErrorCode code, std::string_view msg = {});

  bool ok() const noexcept;
  explicit operator bool() const noexcept;

  const Error &error() const noexcept;
};
```

## Error API

```cpp id="2dq0tn"
struct Error
{
  ErrorCode code;
  std::string_view message;

  constexpr Error();
  constexpr Error(ErrorCode c, std::string_view msg = {});

  constexpr bool ok() const noexcept;
  constexpr explicit operator bool() const noexcept;
};

constexpr Error ok() noexcept;
```

## Next step

Continue with random to understand how the crypto module obtains secure entropy for keys, salts, nonces, and other unpredictable values.
