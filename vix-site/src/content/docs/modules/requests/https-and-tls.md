# HTTPS and TLS

`vix::requests` supports both HTTP and HTTPS.

HTTP requests use the plain TCP transport. HTTPS requests use the TLS transport backed by OpenSSL. The public API stays the same for both schemes: the URL decides which transport is used.

```cpp id="cv7xv4"
auto response = vix::requests::get("https://example.com/");
```

For normal application code, there is no separate HTTPS client to create. Use the same `get`, `post`, `Client`, or `Session` API and pass an `https://` URL.

## Basic HTTPS request

```cpp id="tx0h4y"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    auto response = vix::requests::get("https://example.com/");

    response.raise_for_status();

    vix::print("status:", response.status_code(), response.reason());
    vix::print("url:", response.url());
    vix::print("size:", response.size());

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("HTTPS request failed:", error.what());
    return 1;
  }
}
```

Run it:

```bash id="bb6zqw"
vix run main.cpp
```

The request module parses the URL, detects the `https` scheme, creates the HTTPS transport, opens the TLS connection, sends the HTTP request, and returns a normal `Response`.

## TLS verification

TLS verification is enabled by default.

```cpp id="ftc5yo"
vix::requests::RequestOptions options;

options.verify_tls = true;

auto response = vix::requests::get(
    "https://example.com/",
    options);
```

This is the expected setting for normal HTTPS traffic. It means the client should not silently accept a certificate that cannot be verified for the server being contacted.

Most code does not need to set `verify_tls` manually because the default is already `true`.

```cpp id="laj963"
auto response = vix::requests::get("https://example.com/");
```

Keep the default unless the request is part of a local development or testing workflow where the certificate is intentionally self-signed or otherwise not trusted by the local system.

## Local development with self-signed certificates

For local HTTPS servers, test fixtures, or internal development endpoints, you may need to disable TLS verification for one request.

```cpp id="w7lu5v"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    vix::requests::RequestOptions options;

    options.verify_tls = false;

    auto response = vix::requests::get(
        "https://localhost:8443/health",
        options);

    vix::print("status:", response.status_code());
    vix::print("body:", response.text());

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request failed:", error.what());
    return 1;
  }
}
```

Disabling verification should stay close to the request that needs it. That makes the exception visible in the code and avoids turning a local testing decision into the default behavior of the whole client.

## Use HTTPS with Client

`Client` uses the same request options.

```cpp id="jg6z55"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    vix::requests::Client client;

    vix::requests::RequestOptions options;
    options.headers.set("Accept", "application/json");

    auto response = client.get(
        "https://example.com/api/status",
        options);

    response.raise_for_status();

    vix::print("status:", response.status_code());
    vix::print("body:", response.text());

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("HTTPS request failed:", error.what());
    return 1;
  }
}
```

The client does not need to know whether the request is HTTP or HTTPS before the call. The URL scheme controls transport selection.

## Use HTTPS with Session

A session is useful when several HTTPS requests share headers, params, authentication, timeouts, or cookies.

```cpp id="w4hnwa"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

#include <chrono>

int main()
{
  try
  {
    vix::requests::Session session;

    session.set_header("Accept", "application/json");
    session.set_header("User-Agent", "vix-client/1.0");
    session.timeout() = std::chrono::seconds(10);

    auto profile = session.get("https://example.com/api/profile");

    profile.raise_for_status();

    vix::print("profile:", profile.text());

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("HTTPS session failed:", error.what());
    return 1;
  }
}
```

Cookies stored by a session follow the same URL matching rules used by the cookie jar. Secure cookies are only sent over HTTPS.

## HTTPS and timeouts

TLS does not remove the need for timeouts. A TLS connection can still fail slowly if the remote host is unreachable, overloaded, or blocked by the network.

```cpp id="szgvxr"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

#include <chrono>

int main()
{
  try
  {
    vix::requests::RequestOptions options;

    options.timeout = std::chrono::seconds(10);

    auto response = vix::requests::get(
        "https://example.com/api/status",
        options);

    response.raise_for_status();

    vix::print("status:", response.status_code());
    vix::print("elapsed:", response.elapsed());

    return 0;
  }
  catch (const vix::requests::TimeoutException &error)
  {
    vix::eprint("timeout:", error.what());
    return 1;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request failed:", error.what());
    return 1;
  }
}
```

Use timeouts for external HTTPS calls in long-running applications. The TLS layer protects the connection, but the timeout protects the caller from waiting without a clear limit.

## HTTPS and redirects

Redirects can move between URLs. When redirects are enabled, the client follows supported redirect responses and creates the next request from the redirect location.

```cpp id="zosvm5"
vix::requests::RequestOptions options;

options.follow_redirects = true;
options.max_redirects = 5;

auto response = vix::requests::get(
    "https://example.com/start",
    options);

vix::print("final url:", response.url());
vix::print("status:", response.status_code());
```

The redirect target decides the next transport. An `https://` target uses the HTTPS transport. An `http://` target uses the plain HTTP transport.

When security matters, be careful with redirects from HTTPS to HTTP. The module can follow the redirect as an HTTP redirect, but the application should decide whether that downgrade is acceptable for its workflow.

Disable redirects when the application needs to inspect the redirect response before deciding.

```cpp id="to6mw7"
vix::requests::RequestOptions options;

options.follow_redirects = false;

auto response = vix::requests::get(
    "https://example.com/start",
    options);

vix::print("status:", response.status_code());
vix::print("location:", response.location().value_or("none"));
```

## Supported schemes

The requests module supports:

```txt id="t2tmnu"
http
https
```

Unsupported schemes raise `UnsupportedProtocolException`.

```cpp id="zmxvx0"
try
{
  auto response = vix::requests::get("ftp://example.com/file");

  vix::print(response.status_code());
}
catch (const vix::requests::UnsupportedProtocolException &error)
{
  vix::eprint("unsupported protocol:", error.what());
}
catch (const vix::requests::RequestException &error)
{
  vix::eprint("request failed:", error.what());
}
```

Use `http://` for plain HTTP and `https://` when the connection should use TLS.

## OpenSSL when running a single file

In a normal Vix project, the module setup should provide the needed build configuration. For a single-file experiment where explicit linker flags are needed, pass them after `--`.

```bash id="ry9wku"
vix run main.cpp -- -lssl -lcrypto
```

In script mode, `--` is for compiler and linker flags. Runtime arguments belong after `--run`.

```bash id="yyz7gr"
vix run main.cpp -- -lssl -lcrypto --run --endpoint https://example.com
```

Keep this distinction clear when debugging single-file examples. Linker flags configure the build. Runtime arguments are passed to the program after it starts.

## Handling TLS-related failures

TLS failures are request failures. They may appear as transport, connection, or general request exceptions depending on where the failure happens.

```cpp id="c2ejuu"
try
{
  auto response = vix::requests::get("https://example.com/");

  response.raise_for_status();

  vix::print(response.text());
}
catch (const vix::requests::ConnectionException &error)
{
  vix::eprint("connection error:", error.what());
}
catch (const vix::requests::TransportException &error)
{
  vix::eprint("transport error:", error.what());
}
catch (const vix::requests::RequestException &error)
{
  vix::eprint("request error:", error.what());
}
```

Catch `RequestException` when the caller only needs to report failure. Catch more specific exceptions when connection or transport failures should be handled differently from HTTP status errors.

## Common mistakes

### Disabling TLS verification for normal HTTPS traffic

This may make a local test pass, but it removes an important HTTPS check.

```cpp id="xkgxb0"
vix::requests::RequestOptions options;

options.verify_tls = false;
```

Use this only for controlled development or test environments. For normal HTTPS traffic, keep verification enabled.

```cpp id="i1x2d8"
vix::requests::RequestOptions options;

options.verify_tls = true;
```

Or rely on the default.

```cpp id="i8tzev"
auto response = vix::requests::get("https://example.com/");
```

### Assuming HTTPS changes the response API

The response API is the same for HTTP and HTTPS.

```cpp id="v4z4zd"
auto response = vix::requests::get("https://example.com/");

vix::print(response.status_code());
vix::print(response.text());
```

The transport changes underneath. The application still receives a normal `Response`.

### Forgetting linker flags in a single-file experiment

When a single-file HTTPS example fails at link time, the issue may be that OpenSSL libraries were not linked in that script build.

```bash id="t8q2tz"
vix run main.cpp -- -lssl -lcrypto
```

This is a build issue, not an HTTP response failure. Runtime request errors happen after the program starts.

### Ignoring HTTPS to HTTP redirects

An HTTPS URL can redirect to an HTTP URL. Depending on the application, that may or may not be acceptable.

```cpp id="bb9i1z"
vix::requests::RequestOptions options;

options.follow_redirects = false;

auto response = vix::requests::get(
    "https://example.com/start",
    options);

vix::print("location:", response.location().value_or("none"));
```

Disable redirects when the application must inspect or reject a downgrade before making the next request.

## API summary

TLS verification:

```cpp id="u2q2x8"
vix::requests::RequestOptions options;

options.verify_tls = true;
options.verify_tls = false;
```

HTTPS request:

```cpp id="dxf3eu"
auto response = vix::requests::get(
    "https://example.com/",
    options);
```

HTTPS with client:

```cpp id="l0dgtt"
vix::requests::Client client;

auto response = client.get(
    "https://example.com/",
    options);
```

HTTPS with session:

```cpp id="xv9gme"
vix::requests::Session session;

auto response = session.get(
    "https://example.com/",
    options);
```

Unsupported protocol handling:

```cpp id="p2r1cs"
catch (const vix::requests::UnsupportedProtocolException &error)
{
  vix::eprint("unsupported protocol:", error.what());
}
```

Single-file OpenSSL linker flags:

```bash id="o6c64p"
vix run main.cpp -- -lssl -lcrypto
```

## Next step

Continue with error handling. HTTPS failures, connection failures, timeouts, redirect loops, and HTTP error statuses all use the same request exception model.

[Open the errors guide](/modules/requests/errors)
