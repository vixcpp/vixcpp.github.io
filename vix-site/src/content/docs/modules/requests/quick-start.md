# Quick Start

This guide shows the smallest useful workflow for `vix::requests`: make an HTTP request, inspect the response, handle errors, then run the file with Vix.

The `requests` module is an outgoing HTTP client. It is used when your C++ program needs to call another server, such as a public API, an internal service, a local backend, or a test endpoint. For simple calls, the free functions are enough. For repeated calls that share headers, params, auth, timeout settings, or cookies, use a `Session`.

## Create a file

Create a file named `main.cpp`:

```cpp
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
    vix::eprint("request error:", error.what());
    return 1;
  }
}
```

Run it:

```bash
vix run main.cpp
```

`vix run` is useful for this kind of example because it can compile and run a single C++ file without requiring a full project first. When the same code grows into an application, it can move into a normal Vix project without changing the way the `requests` API is used.

## Read the response

A response contains the final URL, the status code, the reason phrase, the headers, the body, and the elapsed request time.

```cpp
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  auto response = vix::requests::get("https://example.com/");

  vix::print("status:", response.status_code());
  vix::print("reason:", response.reason());
  vix::print("ok:", response.ok());
  vix::print("content type:", response.content_type().value_or("unknown"));
  vix::print("body size:", response.size());

  return 0;
}
```

Use `response.text()` when the body should be treated as text. Use `response.bytes()` when the body should be handled as raw bytes.

## Add headers and query params

Most real HTTP calls need at least a few options. `RequestOptions` keeps those details close to the request without making the simple case harder.

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
  vix::print("body:", response.text());

  return 0;
}
```

The params are appended to the URL and encoded before the request is sent. Headers use case-insensitive lookup, so `Content-Type`, `content-type`, and `CONTENT-TYPE` refer to the same header name when reading or replacing values.

## Send JSON

Use `json_body` when sending a JSON payload. The helper stores the body text and sets the content type to `application/json`.

```cpp
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    vix::requests::RequestOptions options;
    options.headers.set("Accept", "application/json");

    auto response = vix::requests::post(
        "https://example.com/api/items",
        vix::requests::json_body(R"({"name":"Vix"})"),
        options);

    response.raise_for_status();

    vix::print("created:", response.status_code());
    vix::print(response.text());

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request failed:", error.what());
    return 1;
  }
}
```

## Send a form

Use `form_body` for `application/x-www-form-urlencoded` requests. This is the common format for simple form submissions.

```cpp
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    auto response = vix::requests::post(
        "https://example.com/login",
        vix::requests::form_body({
          {"username", "gaspard"},
          {"project", "Vix Requests"}
        }));

    response.raise_for_status();

    vix::print("status:", response.status_code());
    vix::print(response.text());

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request failed:", error.what());
    return 1;
  }
}
```

The form helper encodes spaces, special characters, and reserved URL characters using the form-url-encoded rules.

## Use a session

A `Session` is useful when several requests belong to the same client workflow. It stores default request options and keeps an in-memory cookie jar, so headers, params, auth, timeout settings, and cookies can be reused across calls.

```cpp
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

#include <chrono>

int main()
{
  try
  {
    vix::requests::Session session;

    session.set_header("Accept", "application/json");
    session.set_header("User-Agent", "vix-requests-example/1.0");
    session.timeout() = std::chrono::seconds(10);

    auto profile = session.get("https://example.com/api/profile");

    profile.raise_for_status();

    vix::print("profile:", profile.text());

    auto created = session.post(
        "https://example.com/api/items",
        vix::requests::json_body(R"({"name":"Vix"})"));

    created.raise_for_status();

    vix::print("created:", created.status_code());

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("session request failed:", error.what());
    return 1;
  }
}
```

Use a session when the same client context matters. For one isolated request, the free functions keep the code shorter.

## Handle errors

`raise_for_status()` turns HTTP error statuses into `HttpException`. Other failures, such as invalid URLs, timeouts, connection errors, unsupported protocols, and redirect loops, use request-specific exception types. All of them derive from `RequestException`.

```cpp
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    auto response = vix::requests::get("https://example.com/missing");

    response.raise_for_status();

    vix::print(response.text());

    return 0;
  }
  catch (const vix::requests::HttpException &error)
  {
    vix::eprint("HTTP error:", error.status_code(), error.reason());
    return 1;
  }
  catch (const vix::requests::TimeoutException &error)
  {
    vix::eprint("timeout:", error.what());
    return 1;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request error:", error.what());
    return 1;
  }
}
```

Catching specific exceptions is useful when the application can recover differently from each failure. For small tools and examples, catching `RequestException` is often enough.

## Run with linked libraries

HTTPS support uses OpenSSL TLS. In a normal Vix project, the module setup should provide the needed configuration. For a single-file experiment where explicit linker flags are needed, pass compiler or linker flags after `--`.

```bash
vix run main.cpp -- -lssl -lcrypto
```

In script mode, `--` is for compiler and linker flags. Runtime arguments for the program should be passed with `--run`.

```bash
vix run main.cpp --run --name demo
```

## Next step

Continue with the client API.

[Open the client guide](/modules/requests/client)
