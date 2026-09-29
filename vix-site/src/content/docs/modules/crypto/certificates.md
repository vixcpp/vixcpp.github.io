# Certificates

The `crypto` module provides helpers for inspecting PEM-encoded X.509 TLS certificates. This is useful for deployment tooling that needs to check a certificate file before using it, for example before reloading a reverse proxy or validating a domain configuration.

The certificate API focuses on inspection. It checks whether a certificate file exists, whether it can be read, whether it can be parsed as a PEM X.509 certificate, whether it is expired, and which DNS names are present in the Subject Alternative Name extension.

## Header

Use the module entry point for normal crypto code:

```cpp
#include <vix/crypto/crypto.hpp>
```

For files that only need certificate helpers, the direct header can also be used:

```cpp
#include <vix/crypto/certificate.hpp>
```

## Inspect a certificate

Use `inspect_certificate` to read a PEM certificate file and extract basic information.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto result = inspect_certificate(
      "/etc/ssl/example/fullchain.pem");

  if (!result.ok())
  {
    return 1;
  }

  const CertificateInfo &info = result.value();

  if (!info.validFormat)
  {
    return 1;
  }

  return info.expired ? 1 : 0;
}
```

A successful result means the certificate file was found, opened, parsed, and converted into a `CertificateInfo` value. The returned structure can then be used by deployment code, diagnostics, or validation commands.

## Certificate information

`CertificateInfo` contains the fields extracted during inspection.

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

The `subject` and `issuer` fields describe the certificate identity and issuer when available. The `notBefore` and `notAfter` fields expose the certificate validity period as strings. The `dnsNames` vector contains DNS names extracted from the Subject Alternative Name extension.

## Check a domain

Use `certificate_matches_domain` to verify whether a certificate contains a DNS name matching a domain.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto result = inspect_certificate(
      "/etc/ssl/example/fullchain.pem");

  if (!result.ok())
  {
    return 1;
  }

  bool matches = certificate_matches_domain(
      result.value(),
      "example.com");

  return matches ? 0 : 1;
}
```

The check uses the DNS names extracted from the certificate. It does not treat the certificate subject as the source of truth for domain matching.

## Wildcard domains

The domain matcher supports the common wildcard form `*.example.com`.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  CertificateInfo info{};
  info.dnsNames.push_back("*.example.com");

  bool api_matches = certificate_matches_domain(
      info,
      "api.example.com");

  bool root_matches = certificate_matches_domain(
      info,
      "example.com");

  if (!api_matches)
  {
    return 1;
  }

  return root_matches ? 1 : 0;
}
```

A wildcard such as `*.example.com` matches one label before the suffix, such as `api.example.com`. It does not match the root domain `example.com`.

## Missing certificate file

If the certificate path does not exist, inspection returns an error.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto result = inspect_certificate(
      "/tmp/missing-certificate.pem");

  if (!result.ok() &&
      result.error().code == ErrorCode::invalid_argument)
  {
    return 0;
  }

  return 1;
}
```

This makes certificate validation useful in deployment commands because a missing file is reported explicitly before the application or proxy tries to use it.

## Invalid certificate format

A file may exist and still fail certificate inspection if it is not a valid PEM X.509 certificate.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto result = inspect_certificate(
      "/etc/ssl/example/not-a-certificate.txt");

  if (!result.ok())
  {
    return result.error().code == ErrorCode::invalid_argument ? 0 : 1;
  }

  return 1;
}
```

This keeps file existence separate from certificate validity. Deployment tooling can report a clearer error instead of treating every certificate problem as the same failure.

## Expiration checks

The `expired` field tells whether the certificate is already expired.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto result = inspect_certificate(
      "/etc/ssl/example/fullchain.pem");

  if (!result.ok())
  {
    return 1;
  }

  if (result.value().expired)
  {
    return 1;
  }

  return 0;
}
```

The API exposes expiration status as a boolean and also keeps the raw validity strings in `notBefore` and `notAfter` for diagnostics.

## DNS names

The certificate helper extracts DNS names from the Subject Alternative Name extension.

```cpp
#include <string>
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto result = inspect_certificate(
      "/etc/ssl/example/fullchain.pem");

  if (!result.ok())
  {
    return 1;
  }

  for (const std::string &name : result.value().dnsNames)
  {
    if (name == "example.com")
    {
      return 0;
    }
  }

  return 1;
}
```

Subject Alternative Name is the right place to read DNS identities from modern TLS certificates. The helper keeps the extracted names available so deployment commands can show them to the developer.

## Provider availability

Certificate inspection depends on OpenSSL support in the crypto module. If the provider is not enabled, inspection returns `ErrorCode::provider_unavailable`.

```cpp
#include <vix/crypto/crypto.hpp>

int main()
{
  using namespace vix::crypto;

  auto result = inspect_certificate(
      "/etc/ssl/example/fullchain.pem");

  if (!result.ok())
  {
    if (result.error().code == ErrorCode::provider_unavailable)
    {
      return 0;
    }

    return 1;
  }

  return 0;
}
```

This makes build configuration problems visible. The caller can distinguish a missing OpenSSL provider from a missing or invalid certificate file.

## Scope

The certificate API inspects existing certificates. It does not generate certificates, request certificates from ACME, renew certificates, edit Nginx configuration, or manage Let's Encrypt flows.

Those responsibilities belong to deployment tooling. The crypto module only provides the certificate inspection layer that such tooling can use.

## API

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

## Next step

Continue with CMake to understand how to link the crypto module and enable the provider support required by hashing, AEAD, signatures, passwords, KDF, and certificate inspection.
