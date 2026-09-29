# Requests

`vix::requests` is the HTTP client module for Vix.cpp.

It is used when a C++ application needs to make outgoing HTTP or HTTPS requests: calling an API, fetching a resource, sending a form, posting JSON, or talking to another service from inside a Vix project. The module gives those workflows a direct C++ API without forcing the application to manage sockets, HTTP serialization, redirects, response parsing, or TLS details by hand.

```cpp
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
    vix::eprint("request error:", error.what());
    return 1;
  }
}
```

## What this module is for

Vix already has server-side request and response types in the core runtime. Those types are used when your application receives HTTP traffic. The `requests` module solves the other side of the problem: it lets your application send HTTP traffic to another server.

That distinction matters in real backend applications. A route handler may receive a request from a user, then call an internal service, a payment API, a registry endpoint, a webhook target, or a local development server. In that situation, `vix::requests` is the client API used by your application to make the outgoing call.

The API is intentionally small at the surface. For simple cases, free functions such as `get`, `post`, `put`, `patch`, `del`, `head`, and `request` are enough. When calls need shared headers, query parameters, authentication, timeout settings, or cookies, use `Session`.

## Main include

Use the umbrella header for normal application code:

```cpp
#include <vix/requests/requests.hpp>
```

This exposes the public API for requests, responses, headers, params, bodies, options, sessions, errors, and transport abstractions.

When examples print values, include the Vix print API:

```cpp
#include <vix/print.hpp>
```

## Run a small example

Create a file named `main.cpp`:

```cpp
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    auto response = vix::requests::get("https://example.com/");

    vix::print("url:", response.url());
    vix::print("status:", response.status_code(), response.reason());
    vix::print("size:", response.size());

    response.raise_for_status();

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request failed:", error.what());
    return 1;
  }
}
```

Run it with Vix:

```bash
vix run main.cpp
```

For a single file, `vix run` compiles the file, links what is needed, and starts the program. That makes it useful for small examples and quick checks before moving the same code into a larger project.

## Request options

Most requests start with a URL and optional `RequestOptions`.

```cpp
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

#include <chrono>

int main()
{
  vix::requests::RequestOptions options;

  options.headers.set("Accept", "application/json");
  options.params.set("page", "1");
  options.params.set("q", "vix requests");
  options.timeout = std::chrono::seconds(10);

  auto response = vix::requests::get(
      "https://example.com/search",
      options);

  vix::print("status:", response.status_code());
  vix::print("content type:", response.content_type().value_or("unknown"));

  return 0;
}
```

Options keep request behavior close to the call site. They are used for headers, query parameters, timeouts, basic authentication, redirects, TLS verification, keep-alive behavior, the user agent, and an optional host override.

## Sending request bodies

For methods that send data, the module provides body helpers for the common HTTP body shapes.

```cpp
auto response = vix::requests::post(
    "https://example.com/api/items",
    vix::requests::json_body(R"({"name":"Vix"})"));
```

For form-url-encoded data:

```cpp
auto response = vix::requests::post(
    "https://example.com/login",
    vix::requests::form_body({
      {"username", "gaspard"},
      {"project", "Vix Requests"}
    }));
```

The body helpers set the right body type and content type for the request. Raw and binary bodies are also available when the application needs to send data that does not fit JSON or form encoding.

## Reusing a session

Use `Session` when multiple requests belong to the same client workflow.

A session stores default options and keeps an in-memory cookie jar. This is useful for authenticated flows, APIs that expect the same headers on every request, or a sequence of calls that should share cookies after login.

```cpp
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

#include <chrono>

int main()
{
  vix::requests::Session session;

  session.set_header("Accept", "application/json");
  session.set_header("User-Agent", "vix-client/1.0");
  session.set_param("token", "demo-token");
  session.timeout() = std::chrono::seconds(10);

  auto profile = session.get("https://example.com/api/profile");

  profile.raise_for_status();

  vix::print("profile:", profile.text());

  return 0;
}
```

Use the free functions for isolated calls. Use `Session` when the same client context should be reused across calls.

## Responses

A response contains the final URL, status code, reason phrase, headers, body, and elapsed time.

```cpp
auto response = vix::requests::get("https://example.com/");

vix::print("status:", response.status_code());
vix::print("reason:", response.reason());
vix::print("ok:", response.ok());
vix::print("redirect:", response.is_redirect());
vix::print("error:", response.is_error());
vix::print("content length:", response.content_length().value_or(0));
```

Use `response.text()` when the body should be handled as text. Use `response.bytes()` when the body should be treated as bytes. Use `raise_for_status()` when HTTP error responses should become exceptions.

## Errors

Network calls can fail for different reasons: invalid URLs, unsupported protocols, connection failures, timeouts, redirect loops, or HTTP error statuses raised by `raise_for_status()`.

```cpp
try
{
  auto response = vix::requests::get("https://example.com/missing");
  response.raise_for_status();
}
catch (const vix::requests::HttpException &error)
{
  vix::eprint("HTTP error:", error.status_code(), error.reason());
}
catch (const vix::requests::TimeoutException &error)
{
  vix::eprint("timeout:", error.what());
}
catch (const vix::requests::RequestException &error)
{
  vix::eprint("request error:", error.what());
}
```

All request-specific exceptions derive from `RequestException`, so applications can catch specific failures where they matter and still keep one fallback for the rest.

## HTTP and HTTPS

The module supports HTTP and HTTPS. HTTP uses the TCP transport. HTTPS uses OpenSSL TLS, with certificate verification enabled by default.

```cpp
vix::requests::RequestOptions options;
options.verify_tls = true;

auto response = vix::requests::get(
    "https://example.com/",
    options);
```

For local development or test fixtures using self-signed certificates, TLS verification can be disabled per request:

```cpp
vix::requests::RequestOptions options;
options.verify_tls = false;

auto response = vix::requests::get(
    "https://localhost:8443/",
    options);
```

Keep verification enabled for normal production traffic.

## Public API

The most common public types are:

```txt
vix::requests::Client
vix::requests::Session
vix::requests::Request
vix::requests::Response
vix::requests::RequestOptions
vix::requests::Headers
vix::requests::Params
vix::requests::Body
vix::requests::Timeout
vix::requests::Url
```

The module also exposes request error types such as `RequestException`, `InvalidUrlException`, `UnsupportedProtocolException`, `ConnectionException`, `TimeoutException`, `TooManyRedirectsException`, and `HttpException`.

## Current scope

`vix::requests` is focused on practical outgoing HTTP calls for Vix applications. It covers the normal client workflow: build a request, add options, send it, inspect the response, handle errors, and reuse a session when state should be shared.

The module does not depend on `curl` or `libcurl`, and it does not call shell commands to perform requests. It uses its own HTTP serialization, response parser, redirect handling, cookie storage, TCP transport, and HTTPS transport.

## Next step

Start with a small request and run it as a single file.

[Open the quick start guide](/modules/requests/quick-start)
