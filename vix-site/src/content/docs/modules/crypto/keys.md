# Keys

The `crypto` module provides a small key ownership type through `SecretKey`. It is designed for secret byte material that should have clear ownership, controlled access, and automatic zeroization when the key object is destroyed.

Cryptographic keys are not ordinary byte arrays. They are sensitive values, and the code that owns them should make that ownership visible. `SecretKey` keeps the API simple: it owns a byte buffer, it cannot be copied, it can be moved, and it exposes the key material through spans when a crypto primitive needs to use it.

## Header

Use the module entry point for normal crypto code:

```cpp
#include <vix/crypto/crypto.hpp>
```

For files that only need key helpers, the direct header can also be used:

```cpp
#include <vix/crypto/keys.hpp>
```

## Generate a secret key

Use `generate_secret_key` to create an owned key filled with cryptographically secure random bytes.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto key = generate_secret_key(32);

  if (!key.ok())
  {
    return 1;
  }

  return key.value().size() == 32 ? 0 : 1;
}
```

The requested size is explicit at the call site. A 32-byte key is commonly used by AES-256-GCM and HMAC-SHA256 examples, but the correct size always depends on the algorithm that will consume the key.

## Use a secret key with HMAC

`SecretKey` exposes a read-only byte span through `bytes()`. That span can be passed directly to crypto functions.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto key = generate_secret_key(32);

  if (!key.ok())
  {
    return 1;
  }

  std::array<std::uint8_t, 32> mac{};

  auto result = hmac_sha256(
    key.value().bytes(),
    "message",
    mac
  );

  return result.ok() ? 0 : 1;
}
```

The key object keeps ownership. The span only provides temporary access to the key bytes.

## Use a secret key with AEAD

AES-256-GCM requires a 32-byte key. The key size can be taken from the AEAD algorithm helper.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  constexpr std::size_t key_size =
    aead_key_size(AeadAlg::aes_256_gcm);

  auto key = generate_secret_key(key_size);

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
    "private message",
    "context"
  );

  return sealed.ok() ? 0 : 1;
}
```

The helper generates the key material, but the application is still responsible for nonce rules, key storage, key rotation, and the lifetime of the encrypted data.

## Move-only ownership

`SecretKey` is movable but not copyable. This prevents accidental duplication of key material through normal copy operations.

```cpp
#include <utility>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto generated = generate_secret_key(32);

  if (!generated.ok())
  {
    return 1;
  }

  SecretKey first = std::move(generated).value();
  SecretKey second = std::move(first);

  return second.size() == 32 ? 0 : 1;
}
```

Move-only ownership makes key flow more visible. When a key is moved, the destination becomes the object that owns the key material.

## Mutable access during initialization

`bytes_mut()` exposes a mutable span. It is intended for controlled initialization, derivation, or provider output.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  SecretKey key(32);

  auto result = random_bytes(key.bytes_mut());

  if (!result.ok())
  {
    return 1;
  }

  return key.empty() ? 1 : 0;
}
```

Application code should keep mutable access short and local. Most crypto operations should use the read-only `bytes()` view.

## Empty keys

A default-constructed `SecretKey` is empty.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  vix::crypto::SecretKey key;

  return key.empty() ? 0 : 1;
}
```

`generate_secret_key` rejects a size of zero because generating an empty secret key is usually a caller mistake.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto key = generate_secret_key(0);

  if (!key.ok() &&
      key.error().code == ErrorCode::invalid_argument)
  {
    return 0;
  }

  return 1;
}
```

## Zeroization

`SecretKey` zeroizes its owned buffer when the object is destroyed. It also zeroizes its previous contents before move-assignment.

This is not a replacement for a complete secret-management system, but it is a safer default than keeping key material in ordinary containers without a cleanup step. It also makes the intended lifecycle of the secret explicit in the type itself.

## SecretKey and raw buffers

Raw arrays and vectors are still useful when a crypto operation needs temporary output, such as a hash, MAC, nonce, or authentication tag. Use `SecretKey` for owned secret material that has a longer logical lifetime.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  SecretKey key(32);
  std::array<std::uint8_t, 12> nonce{};

  if (!random_bytes(key.bytes_mut()).ok())
  {
    return 1;
  }

  if (!random_bytes(nonce).ok())
  {
    return 1;
  }

  return 0;
}
```

This keeps the distinction clear: the key is owned by a secret-aware type, while the nonce is a normal byte buffer with algorithm-specific rules.

## Error handling

Key generation can fail when the requested size is invalid or when secure randomness is unavailable.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto key = generate_secret_key(0);

  if (!key.ok())
  {
    if (key.error().code == ErrorCode::invalid_argument)
    {
      return 0;
    }

    return 1;
  }

  return 1;
}
```

In most application code, checking `ok()` is enough. More specific handling is useful in tests, diagnostics, and tooling that needs to distinguish invalid input from entropy failures.

## API

```cpp
class SecretKey
{
public:
  SecretKey();
  explicit SecretKey(std::size_t size);
  explicit SecretKey(std::vector<std::uint8_t> bytes);

  SecretKey(const SecretKey &) = delete;
  SecretKey &operator=(const SecretKey &) = delete;

  SecretKey(SecretKey &&other) noexcept;
  SecretKey &operator=(SecretKey &&other) noexcept;

  ~SecretKey();

  std::size_t size() const noexcept;
  bool empty() const noexcept;

  std::span<const std::uint8_t> bytes() const noexcept;
  std::span<std::uint8_t> bytes_mut() noexcept;
};
```

```cpp
Result<SecretKey> generate_secret_key(std::size_t size) noexcept;
```

## Next step

Continue with AEAD to use secret keys for authenticated encryption with AES-256-GCM.
