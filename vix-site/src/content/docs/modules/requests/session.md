# Session

`vix::requests::Session` is a reusable HTTP client context.

Use it when several outgoing requests belong to the same workflow and should share defaults. A session can keep common headers, query parameters, timeout settings, basic authentication, redirect behavior, TLS settings, and cookies in one place, so each request does not have to repeat the same setup.

A session is not required for every HTTP call. For one isolated request, the free functions or `Client` are usually clearer. A session becomes useful when the code starts behaving like a real client for another service.

## Basic use

```cpp id="x9l6vp"
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

    auto response = session.get("https://example.com/api/profile");

    response.raise_for_status();

    vix::print("status:", response.status_code());
    vix::print("profile:", response.text());

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("session request failed:", error.what());
    return 1;
  }
}
```

Run it:

```bash id="fwl4pq"
vix run main.cpp
```

The session keeps the defaults. The request still returns a normal `Response`, so the response handling stays the same as with `get`, `post`, or `Client`.

## Why use a session

Many HTTP workflows are not just one request. A program may call a login endpoint, receive cookies, then call a profile endpoint. It may talk to an API where every request needs the same `Accept` header, authorization setup, query parameter, timeout, or user agent. Repeating that setup at every call makes the code harder to read and easier to break.

A session keeps that shared client state together.

```cpp id="awm8mr"
vix::requests::Session session;

session.set_header("Accept", "application/json");
session.set_param("client", "vix");
session.timeout() = std::chrono::seconds(10);

auto first = session.get("https://example.com/api/first");
auto second = session.get("https://example.com/api/second");
```

Both requests use the same session defaults. Each call can still pass its own `RequestOptions` when one request needs to override or extend the session behavior.

## Default headers

Use `headers()` when you want direct access to the default header container.

```cpp id="g4byah"
vix::requests::Session session;

session.headers().set("Accept", "application/json");
session.headers().set("User-Agent", "my-vix-client/1.0");
```

For simple updates, use the chainable helpers.

```cpp id="s4nycn"
vix::requests::Session session;

session
    .set_header("Accept", "application/json")
    .set_header("User-Agent", "my-vix-client/1.0");
```

Remove a default header when it should no longer be applied.

```cpp id="wu7hof"
session.remove_header("Accept");
```

Header lookup is case-insensitive, so removing `Accept`, `accept`, or `ACCEPT` targets the same header name.

## Default query params

Default params are appended to URLs sent through the session.

```cpp id="unckwd"
vix::requests::Session session;

session.set_param("token", "demo-token");
session.set_param("client", "vix");

auto response = session.get("https://example.com/api/profile");
```

This is useful for APIs that require stable query values across many calls. For request-specific params, pass `RequestOptions` to that call instead of storing them on the session.

```cpp id="xv02ha"
vix::requests::RequestOptions options;
options.params.set("page", "1");

auto response = session.get(
    "https://example.com/api/items",
    options);
```

The session defaults and request options are merged before the request is sent.

## Timeout defaults

A session can define the timeout used by its requests.

```cpp id="dnijqv"
#include <chrono>

vix::requests::Session session;

session.timeout() = std::chrono::seconds(10);
```

That assigns the same timeout value to the connect, read, and total phases. Use a custom `Timeout` object when those phases need different values.

```cpp id="uqp1ry"
vix::requests::Timeout timeout;
timeout.set_connect(std::chrono::seconds(3));
timeout.set_read(std::chrono::seconds(10));
timeout.set_total(std::chrono::seconds(15));

session.timeout() = timeout;
```

A timeout of zero means no explicit timeout is configured for that phase.

## Basic authentication

Use `set_basic_auth` when every request in the session should use the same basic authentication credentials.

```cpp id="d2bziz"
vix::requests::Session session;

session.set_basic_auth("username", "password");

auto response = session.get("https://example.com/private");
```

The `Authorization` header is added during request serialization when credentials are configured and the request has not already provided an explicit `Authorization` header.

## Cookies

A session stores cookies in memory. When a response contains `Set-Cookie`, the session stores matching cookies and applies them to later requests when the target URL matches.

```cpp id="u3w6gf"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    vix::requests::Session session;

    auto login = session.post(
        "https://example.com/login",
        vix::requests::form_body({
          {"username", "gaspard"},
          {"password", "secret"}
        }));

    login.raise_for_status();

    auto profile = session.get("https://example.com/profile");

    profile.raise_for_status();

    vix::print("profile:", profile.text());

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request failed:", error.what());
    return 1;
  }
}
```

The cookie jar is part of the session runtime. It is not written to disk. When the session object is destroyed, the stored cookies are gone.

Clear stored cookies when the workflow should forget them.

```cpp id="fuq4mo"
session.clear_cookies();
```

## Per-request overrides

Session defaults do not prevent a request from adding its own options. The request options are merged with the session defaults before the request is sent.

```cpp id="heqzzb"
vix::requests::Session session;

session.set_header("Accept", "application/json");
session.timeout() = std::chrono::seconds(10);

vix::requests::RequestOptions options;
options.headers.set("X-Request-Id", "demo-001");
options.timeout = std::chrono::seconds(3);

auto response = session.get(
    "https://example.com/api/items",
    options);
```

Use session defaults for values that are part of the client identity. Use per-request options for values that belong only to one call.

## Sending JSON with a session

The request methods on `Session` follow the same shape as the free functions and `Client`.

```cpp id="oztk0b"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    vix::requests::Session session;

    session.set_header("Accept", "application/json");

    auto response = session.post(
        "https://example.com/api/items",
        vix::requests::json_body(R"({"name":"Vix"})"));

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

For methods that send a body, the body comes after the URL and before the request options.

```cpp id="xj1n3y"
session.post(url, body, options);
session.put(url, body, options);
session.patch(url, body, options);
```

For methods without a body, options come after the URL.

```cpp id="epbkwt"
session.get(url, options);
session.del(url, options);
session.head(url, options);
```

## Redirects

Redirect behavior is controlled through request options. Sessions follow redirects by default because the default `RequestOptions` enable redirects.

```cpp id="qchm4o"
vix::requests::Session session;

session.defaults().follow_redirects = true;
session.defaults().max_redirects = 10;

auto response = session.get("https://example.com/old-path");

vix::print("final url:", response.url());
vix::print("status:", response.status_code());
```

Disable redirects when the application needs to inspect the redirect response itself.

```cpp id="n17j0a"
vix::requests::RequestOptions options;
options.follow_redirects = false;

auto response = session.get(
    "https://example.com/old-path",
    options);

vix::print("status:", response.status_code());
vix::print("location:", response.location().value_or("none"));
```

Redirect loops and chains longer than `max_redirects` raise `TooManyRedirectsException`.

## Prepared requests

A session can also send a prepared `Request`.

```cpp id="m9btcs"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    vix::requests::Session session;

    session.set_header("Accept", "application/json");

    vix::requests::RequestOptions options;
    options.params.set("page", "1");

    vix::requests::Request request(
        vix::requests::Method::Get,
        "https://example.com/api/items",
        options);

    auto response = session.send(request);

    response.raise_for_status();

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

The prepared request is still merged with the session defaults. This is useful when a request is built by one part of the program and executed by another part that owns the session.

## Move-only behavior

`Session` owns runtime state, including its cookie jar. For that reason, it is not copyable. It can be moved.

```cpp id="bc86dp"
vix::requests::Session create_session()
{
  vix::requests::Session session;

  session.set_header("Accept", "application/json");
  session.timeout() = std::chrono::seconds(10);

  return session;
}
```

This keeps ownership clear. If several parts of an application need to use the same session, pass it by reference.

```cpp id="nf3fi4"
void fetch_profile(vix::requests::Session &session)
{
  auto response = session.get("https://example.com/profile");
  response.raise_for_status();

  vix::print(response.text());
}
```

## Error handling

A session uses the same exception model as the rest of the module. Network and request failures raise request exceptions. HTTP error statuses are returned as responses unless `raise_for_status()` is called.

```cpp id="oaad21"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    vix::requests::Session session;

    auto response = session.get("https://example.com/missing");

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

Catching `RequestException` is enough when the caller only needs to report failure. Catch more specific exceptions when the application can make a different decision for timeouts, HTTP errors, connection failures, or redirect problems.

## Async session calls

`Session` exposes async methods for code that already uses the Vix async runtime. These methods return `vix::async::core::task<Response>`.

```cpp id="v5ch0e"
#include <vix/requests/requests.hpp>
#include <vix/async/core/io_context.hpp>
#include <vix/async/core/task.hpp>
#include <vix/print.hpp>

vix::async::core::task<void> fetch(
    vix::async::core::io_context &ctx,
    vix::requests::Session &session)
{
  try
  {
    auto pending = session.async_get(
        ctx,
        "https://example.com/");

    auto response = co_await std::move(pending);

    response.raise_for_status();

    vix::print("status:", response.status_code());
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request failed:", error.what());
  }

  ctx.stop();
  co_return;
}

int main()
{
  vix::async::core::io_context ctx;
  vix::requests::Session session;

  session.set_header("Accept", "application/json");

  auto task = fetch(ctx, session);
  ctx.post(task.handle());
  ctx.run();

  return 0;
}
```

Use the async API when the surrounding code is already built around `io_context` and tasks. Synchronous session calls are simpler for small command-line programs and most introductory examples.

## API summary

```cpp id="jh4mk9"
vix::requests::Session session;

session.defaults();
session.set_defaults(options);

session.headers();
session.set_header(name, value);
session.remove_header(name);

session.params();
session.set_param(name, value);
session.remove_param(name);

session.timeout();

session.set_basic_auth(username, password);
session.clear_cookies();

session.send(request);

session.request(method, url, options, body);
session.request("CUSTOM", url, options, body);

session.get(url, options);
session.post(url, body, options);
session.put(url, body, options);
session.patch(url, body, options);
session.del(url, options);
session.head(url, options);

session.async_send(ctx, request);

session.async_request(ctx, method, url, options, body);
session.async_get(ctx, url, options);
session.async_post(ctx, url, body, options);
session.async_put(ctx, url, body, options);
session.async_patch(ctx, url, body, options);
session.async_del(ctx, url, options);
session.async_head(ctx, url, options);
```

## Next step

Continue with request options. They define how a single call behaves and how session defaults are merged with request-specific settings.

[Open the request options guide](/modules/requests/request-options)
