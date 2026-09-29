# Errors

`vix::requests` reports request failures through exception types.

A request can fail before an HTTP response exists, for example when the URL is invalid, the protocol is unsupported, the connection cannot be opened, the request times out, or a redirect loop is detected. A server can also return an HTTP error status such as `404` or `500`. Those are different situations, and the module keeps them separate.

Transport and request failures throw exceptions during the request call. HTTP error statuses are returned as normal responses until the caller decides to call `raise_for_status()`.

## Basic error handling

For small programs, catching `RequestException` is enough.

```cpp id="kqm4nt"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    auto response = vix::requests::get("https://example.com/");

    response.raise_for_status();

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

Run it:

```bash id="nl23te"
vix run main.cpp
```

`RequestException` is the base type for request-specific failures. Catching it gives the program one clear fallback for errors from the requests module.

## HTTP status errors

An HTTP error status is still a valid HTTP response. The request completed, the server answered, and the caller receives a `Response`.

```cpp id="r4tqss"
auto response = vix::requests::get("https://example.com/missing");

vix::print("status:", response.status_code());
vix::print("body:", response.text());
```

This is useful when an API returns a meaningful error body that the application wants to inspect.

Call `raise_for_status()` when an error status should stop the success path.

```cpp id="cl8dz5"
try
{
  auto response = vix::requests::get("https://example.com/missing");

  response.raise_for_status();

  vix::print(response.text());
}
catch (const vix::requests::HttpException &error)
{
  vix::eprint("HTTP error:", error.status_code(), error.reason());
}
```

`raise_for_status()` throws `HttpException` when the status code is `400` or higher. The exception stores the status code, reason phrase, and response URL.

## Specific exception types

The module provides specific exception types so applications can handle different failure families without parsing error strings.

```txt id="siryno"
RequestException
InvalidUrlException
UnsupportedProtocolException
TransportException
ConnectionException
TimeoutException
TooManyRedirectsException
HttpException
```

Use specific catches when the program can make a useful decision from the failure type. Use `RequestException` when the program only needs to report that the request failed.

## Invalid URLs

`InvalidUrlException` is raised when the URL cannot be parsed or does not follow the supported URL shape.

```cpp id="ivx2vl"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    auto response = vix::requests::get("example.com");

    vix::print(response.status_code());

    return 0;
  }
  catch (const vix::requests::InvalidUrlException &error)
  {
    vix::eprint("invalid URL:", error.what());
    return 1;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request failed:", error.what());
    return 1;
  }
}
```

Requests should use absolute URLs with a supported scheme, such as `http://example.com` or `https://example.com`.

## Unsupported protocols

`UnsupportedProtocolException` is raised when the URL scheme is not supported by the requests module.

```cpp id="e5zbdv"
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

The public transports support `http` and `https`. Other schemes should be handled by another part of the application.

## Connection failures

`ConnectionException` is used when the client cannot open or keep the connection needed for the request.

```cpp id="e2cikg"
try
{
  auto response = vix::requests::get("https://127.0.0.1:65535/");

  response.raise_for_status();

  vix::print(response.text());
}
catch (const vix::requests::ConnectionException &error)
{
  vix::eprint("connection error:", error.what());
}
catch (const vix::requests::RequestException &error)
{
  vix::eprint("request failed:", error.what());
}
```

Connection failures are transport failures. They happen before the application receives a useful HTTP response.

## Timeouts

`TimeoutException` is raised when a configured timeout is reached.

```cpp id="l6t7dt"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

#include <chrono>

int main()
{
  try
  {
    vix::requests::RequestOptions options;

    options.timeout = std::chrono::milliseconds(100);

    auto response = vix::requests::get(
        "https://example.com/slow",
        options);

    response.raise_for_status();

    vix::print(response.text());

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

Catch `TimeoutException` before `RequestException` when timeouts should produce a different message, retry policy, or fallback behavior.

## Redirect failures

`TooManyRedirectsException` is raised when a redirect chain exceeds the configured limit or when a redirect loop is detected.

```cpp id="j6dk3d"
try
{
  vix::requests::RequestOptions options;

  options.follow_redirects = true;
  options.max_redirects = 3;

  auto response = vix::requests::get(
      "https://example.com/start",
      options);

  response.raise_for_status();

  vix::print("final url:", response.url());
}
catch (const vix::requests::TooManyRedirectsException &error)
{
  vix::eprint("redirect error:", error.what());
}
catch (const vix::requests::RequestException &error)
{
  vix::eprint("request failed:", error.what());
}
```

Redirect failures are request failures because the client cannot safely reach a final response.

## Transport failures

`TransportException` is the base type for low-level transport failures. `ConnectionException` and `TimeoutException` derive from it.

```cpp id="aftvb3"
try
{
  auto response = vix::requests::get("https://example.com/");

  response.raise_for_status();

  vix::print(response.text());
}
catch (const vix::requests::TransportException &error)
{
  vix::eprint("transport error:", error.what());
}
catch (const vix::requests::RequestException &error)
{
  vix::eprint("request failed:", error.what());
}
```

Catching `TransportException` is useful when the application wants to group network-level failures together while still handling HTTP status errors separately.

## HTTP exception details

`HttpException` carries the HTTP status code, reason phrase, and URL.

```cpp id="gxy53f"
try
{
  auto response = vix::requests::get("https://example.com/missing");

  response.raise_for_status();

  vix::print(response.text());
}
catch (const vix::requests::HttpException &error)
{
  vix::eprint("status:", error.status_code());
  vix::eprint("reason:", error.reason());
  vix::eprint("url:", error.url());
}
```

This is better than parsing `what()` when the application needs structured error data.

## Catch order

Catch the most specific exception first, then the broader base type.

```cpp id="wkolld"
try
{
  auto response = vix::requests::get("https://example.com/missing");

  response.raise_for_status();

  vix::print(response.text());
}
catch (const vix::requests::HttpException &error)
{
  vix::eprint("HTTP error:", error.status_code(), error.reason());
}
catch (const vix::requests::TimeoutException &error)
{
  vix::eprint("timeout:", error.what());
}
catch (const vix::requests::ConnectionException &error)
{
  vix::eprint("connection error:", error.what());
}
catch (const vix::requests::TooManyRedirectsException &error)
{
  vix::eprint("redirect error:", error.what());
}
catch (const vix::requests::RequestException &error)
{
  vix::eprint("request error:", error.what());
}
```

This order matters because the specific exceptions derive from broader exception types. If `RequestException` is caught first, the later specific catches will not run.

## Errors with Client

`Client` uses the same exception model as the free functions.

```cpp id="j1u9wr"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    vix::requests::Client client;

    auto response = client.get("https://example.com/api/status");

    response.raise_for_status();

    vix::print("status:", response.status_code());

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("client request failed:", error.what());
    return 1;
  }
}
```

The caller does not need a different error strategy just because the request is sent through a `Client`.

## Errors with Session

A session also uses the same exception model. The difference is that a session may carry default options and cookies across calls.

```cpp id="pvcg6g"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    vix::requests::Session session;

    session.set_header("Accept", "application/json");

    auto response = session.get("https://example.com/api/profile");

    response.raise_for_status();

    vix::print(response.text());

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("session request failed:", error.what());
    return 1;
  }
}
```

Session state does not change how errors are reported. It changes how requests are prepared and sent.

## When not to use exceptions for HTTP statuses

Sometimes the response status is part of normal application logic. A cache lookup might return `404` when an item is missing. A permission check might return `403` and still include a useful body. In those cases, inspect the response directly instead of calling `raise_for_status()` immediately.

```cpp id="gm1iwr"
auto response = vix::requests::get("https://example.com/api/items/42");

if (response.status_code() == 404)
{
  vix::print("item not found");
  return 0;
}

response.raise_for_status();

vix::print(response.text());
```

Use `raise_for_status()` when an error status should stop the success path. Avoid it when the status code itself is part of the expected control flow.

## Common mistakes

### Assuming a `404` throws automatically

A `404` response does not throw by itself.

```cpp id="wu52mi"
auto response = vix::requests::get("https://example.com/missing");

vix::print("status:", response.status_code());
```

Call `raise_for_status()` when you want `404`, `500`, and other HTTP error statuses to become exceptions.

```cpp id="ond898"
auto response = vix::requests::get("https://example.com/missing");

response.raise_for_status();
```

### Catching only `std::exception` in examples

This works, but it hides the useful request-specific structure.

```cpp id="a2jemo"
catch (const std::exception &error)
{
  vix::eprint("error:", error.what());
}
```

Prefer request exceptions when writing Vix requests code.

```cpp id="cjm1tu"
catch (const vix::requests::RequestException &error)
{
  vix::eprint("request error:", error.what());
}
```

Use `std::exception` only as a broader application-level fallback when the code is catching more than request failures.

### Catching `RequestException` before specific exceptions

This prevents the specific catches from running.

```cpp id="tdidkc"
catch (const vix::requests::RequestException &error)
{
  vix::eprint("request error:", error.what());
}
catch (const vix::requests::TimeoutException &error)
{
  vix::eprint("timeout:", error.what());
}
```

Put specific exceptions first.

```cpp id="ls47km"
catch (const vix::requests::TimeoutException &error)
{
  vix::eprint("timeout:", error.what());
}
catch (const vix::requests::RequestException &error)
{
  vix::eprint("request error:", error.what());
}
```

### Calling `raise_for_status()` after using the success body

If the body should only be used for successful responses, check the status first.

```cpp id="w9db6q"
auto response = vix::requests::get("https://example.com/api/items");

response.raise_for_status();

vix::print(response.text());
```

This keeps the success path honest and makes HTTP error handling clear.

## API summary

Base request exception:

```cpp id="a2ki1b"
class RequestException : public std::runtime_error;
```

URL and protocol errors:

```cpp id="l5pfgt"
class InvalidUrlException : public RequestException;
class UnsupportedProtocolException : public RequestException;
```

Transport errors:

```cpp id="nhaph3"
class TransportException : public RequestException;
class ConnectionException : public TransportException;
class TimeoutException : public TransportException;
```

Redirect errors:

```cpp id="e0l0u8"
class TooManyRedirectsException : public RequestException;
```

HTTP status errors:

```cpp id="ajrcfh"
class HttpException : public RequestException
{
public:
  int status_code() const noexcept;
  const std::string &reason() const noexcept;
  const std::string &url() const noexcept;
};
```

Response status helper:

```cpp id="w21a7c"
response.raise_for_status();
```

HTTP error message helper:

```cpp id="zrb41i"
vix::requests::make_http_error_message(
    statusCode,
    reason,
    url);
```

## Next step

Continue with the API reference when you need the compact list of public types and functions.

[Open the API reference](/modules/requests/api-reference)
