# CMake

The `crypto` module is used like the other Vix modules: include the public header in C++ code and link the module target from CMake. The module exposes the public API through `<vix/crypto/crypto.hpp>` and depends on provider support for operations such as hashing, HMAC, HKDF, AEAD, signatures, password hashing, and certificate inspection.

Most projects should link the public module target and let the module handle its provider configuration internally.

## Header

Use the module entry point in C++ code:

```cpp
#include <vix/crypto/crypto.hpp>
```

This header includes the public crypto API: results, errors, randomness, hashing, HMAC, KDF, keys, AEAD, signatures, password helpers, certificate helpers, byte helpers, hex helpers, and constant-time comparison.

## Link the crypto module

For an application target, link `vix::crypto`.

```cmake
cmake_minimum_required(VERSION 3.20)

project(my_crypto_app LANGUAGES CXX)

add_executable(my_crypto_app
  src/main.cpp
)

target_compile_features(my_crypto_app PRIVATE cxx_std_20)

target_link_libraries(my_crypto_app
  PRIVATE
    vix::crypto
)
```

The application code can then include the module header normally:

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  std::array<std::uint8_t, 32> key{};

  auto result = vix::crypto::random_bytes(key);

  return result.ok() ? 0 : 1;
}
```

## Use inside a Vix module

When another Vix module depends on crypto, link the crypto target from that module’s CMake target.

```cmake
target_link_libraries(my_module
  PRIVATE
    vix::crypto
)
```

Use `PRIVATE` when crypto is only used inside the implementation files. Use `PUBLIC` only when the module’s public headers expose crypto types such as `vix::crypto::Result`, `vix::crypto::SecretKey`, `vix::crypto::CertificateInfo`, or crypto enums.

```cmake
target_link_libraries(my_module
  PUBLIC
    vix::crypto
)
```

The visibility should match the public API of the consuming target.

## OpenSSL provider support

The crypto module uses provider-backed implementations for most cryptographic primitives. When OpenSSL support is enabled, the module can provide operations such as:

```txt
SHA-256
HMAC-SHA256
HKDF-SHA256
PBKDF2-SHA256
AES-256-GCM
Ed25519 signatures
X.509 certificate inspection
```

If provider support is not available, the affected functions return explicit errors such as `ErrorCode::provider_unavailable`.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> digest{};

  auto result = sha256("message", digest);

  if (!result.ok() &&
      result.error().code == ErrorCode::provider_unavailable)
  {
    return 0;
  }

  return result.ok() ? 0 : 1;
}
```

This keeps build and deployment problems visible at runtime. The application can distinguish a provider configuration issue from invalid input or authentication failure.

## Compile standard

The public API uses modern C++ types such as `std::span`, `std::array`, `std::string_view`, and `std::filesystem`. Projects using the crypto module should compile with C++20 or newer.

```cmake
target_compile_features(my_crypto_app
  PRIVATE
    cxx_std_20
)
```

Using C++20 keeps the examples and public headers consistent with the rest of Vix.

## Example application

A minimal application can generate random bytes and hash a string.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 32> random{};
  std::array<std::uint8_t, 32> digest{};

  if (!random_bytes(random).ok())
  {
    return 1;
  }

  if (!sha256("hello from vix", digest).ok())
  {
    return 1;
  }

  return 0;
}
```

The matching CMake target only needs to link the crypto module.

```cmake
add_executable(crypto_example
  src/main.cpp
)

target_compile_features(crypto_example
  PRIVATE
    cxx_std_20
)

target_link_libraries(crypto_example
  PRIVATE
    vix::crypto
)
```

## Example with AEAD

AEAD examples use AES-256-GCM and therefore need a 32-byte key and a 12-byte nonce.

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
      "context");

  return sealed.ok() ? 0 : 1;
}
```

The CMake setup remains the same:

```cmake
target_link_libraries(crypto_example
  PRIVATE
    vix::crypto
)
```

The provider support is resolved by the crypto module build configuration, not by the example application.

## Tests

A crypto test target can link `vix::crypto` in the same way as an application target.

```cmake
add_executable(crypto_tests
  tests/crypto_tests.cpp
)

target_compile_features(crypto_tests
  PRIVATE
    cxx_std_20
)

target_link_libraries(crypto_tests
  PRIVATE
    vix::crypto
)
```

A test can then check both successful operations and explicit failure paths.

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  std::array<std::uint8_t, 16> wrong_size{};

  auto result = sha256("data", wrong_size);

  if (!result.ok() &&
      result.error().code == ErrorCode::invalid_argument)
  {
    return 0;
  }

  return 1;
}
```

This is useful because the crypto module is designed around explicit error values.

## Public headers and link visibility

Use `PRIVATE` link visibility when crypto is only used in `.cpp` files.

```cmake
target_link_libraries(my_app
  PRIVATE
    vix::crypto
)
```

Use `PUBLIC` link visibility when your public headers expose crypto types.

```cpp
#pragma once

#include <vix/crypto/crypto.hpp>

vix::crypto::Result<void>
verify_payload(std::string_view payload) noexcept;
```

```cmake
target_link_libraries(my_library
  PUBLIC
    vix::crypto
)
```

This ensures that consumers of `my_library` receive the include paths and link requirements needed by the public API.

## Provider-related failures

The module may compile on platforms where a given provider is not available. In that case, unsupported operations return errors instead of pretending that the operation succeeded.

```txt
provider_unavailable   provider support is not enabled or not available
provider_error         provider was available but the provider call failed
not_supported          selected algorithm is not supported
```

This makes crypto behavior easier to diagnose in CI, release builds, and deployment environments.

## Recommended project shape

A small project using the crypto module can keep its structure simple.

```txt
my_crypto_app/
  CMakeLists.txt
  src/
    main.cpp
```

`CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.20)

project(my_crypto_app LANGUAGES CXX)

add_executable(my_crypto_app
  src/main.cpp
)

target_compile_features(my_crypto_app
  PRIVATE
    cxx_std_20
)

target_link_libraries(my_crypto_app
  PRIVATE
    vix::crypto
)
```

`src/main.cpp`:

```cpp
#include <array>
#include <cstdint>
#include <vix/crypto/crypto.hpp>

int main()
{
  std::array<std::uint8_t, 32> key{};

  auto result = vix::crypto::random_bytes(key);

  return result.ok() ? 0 : 1;
}
```

## API surface

The CMake integration gives access to the public crypto headers.

```txt
<vix/crypto/crypto.hpp>
<vix/crypto/Error.hpp>
<vix/crypto/Result.hpp>
<vix/crypto/random.hpp>
<vix/crypto/hash.hpp>
<vix/crypto/hmac.hpp>
<vix/crypto/kdf.hpp>
<vix/crypto/keys.hpp>
<vix/crypto/aead.hpp>
<vix/crypto/aead_easy.hpp>
<vix/crypto/signature.hpp>
<vix/crypto/signature_easy.hpp>
<vix/crypto/certificate.hpp>
<vix/crypto/password.hpp>
<vix/crypto/compare.hpp>
<vix/crypto/bytes.hpp>
<vix/crypto/hex.hpp>
```

For normal application code, include `<vix/crypto/crypto.hpp>` and link `vix::crypto`.

## Next step

Continue with the API reference for a compact list of the public types, functions, enums, and helpers exposed by the crypto module.
