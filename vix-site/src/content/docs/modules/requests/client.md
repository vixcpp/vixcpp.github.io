# Client

`vix::requests::Client` is the stateless HTTP client object used by the `requests` module.

It sends prepared requests, follows redirects according to the request options, and returns a `Response`. It does not store cookies, default headers, default query parameters, or authentication state between calls. When a workflow needs shared state, use `Session` instead.

The free functions such as `vix::requests::get`, `post`, `put`, and `request` are built around the same idea. They are convenient for one isolated call. `Client` is useful when you want an explicit object in your code without creating a session.

## Basic use

```cpp id="zng8ta"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    vix::requests::Client client;

    auto response = client.get("https://example.com/");

    response.raise_for_status();

    vix::print("status:", response.status_code(), response.reason());
    vix::print("size:", response.size());

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

```bash id="ficb98"
vix run main.cpp
```

A `Client` can be created where the request is made, passed to another function, or kept by a small service object. Since it does not keep request state between calls, each request should carry the options it needs.

## Free functions and Client

For a single request, the free functions keep the code short.

```cpp id="hs6lig"
auto response = vix::requests::get("https://example.com/");
```

Using `Client` makes the caller explicit.

```cpp id="q0o7ck"
vix::requests::Client client;

auto response = client.get("https://example.com/");
```

Both forms are valid. The difference is mostly about structure. Use the free functions in small examples and one-off calls. Use `Client` when an application component should own the HTTP client behavior but does not need cookies or shared defaults.

## Request methods

`Client` exposes helpers for the common HTTP methods.

```cpp id="ysdpjt"
vix::requests::Client client;

auto get_response = client.get("https://example.com/items");

auto post_response = client.post(
    "https://example.com/items",
    vix::requests::json_body(R"({"name":"Vix"})"));

auto put_response = client.put(
    "https://example.com/items/1",
    vix::requests::json_body(R"({"name":"Updated"})"));

auto patch_response = client.patch(
    "https://example.com/items/1",
    vix::requests::json_body(R"({"name":"Patch"})"));

auto delete_response = client.del("https://example.com/items/1");

auto head_response = client.head("https://example.com/status");
```

The method name for delete is `del` because `delete` is a C++ keyword.

## Request options

Most real calls need headers, query params, timeouts, authentication, or redirect settings. Pass a `RequestOptions` object to the method call.

```cpp id="sr6fc1"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

#include <chrono>

int main()
{
  try
  {
    vix::requests::Client client;
    vix::requests::RequestOptions options;

    options.headers.set("Accept", "application/json");
    options.params.set("page", "1");
    options.params.set("q", "vix requests");
    options.timeout = std::chrono::seconds(10);

    auto response = client.get(
        "https://example.com/search",
        options);

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

The options apply to that call only. The client does not remember them for the next request.

## Posting JSON

Use `json_body` when sending JSON. The helper stores the body data and sets the content type to `application/json`.

```cpp id="n2e7vu"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    vix::requests::Client client;

    vix::requests::RequestOptions options;
    options.headers.set("Accept", "application/json");

    auto response = client.post(
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

The body comes before the options for methods that send data:

```cpp id="z0ix66"
client.post(url, body, options);
client.put(url, body, options);
client.patch(url, body, options);
```

For methods without a body, the options are passed directly after the URL:

```cpp id="k3dc9v"
client.get(url, options);
client.del(url, options);
client.head(url, options);
```

## Custom methods

Use `request` when the method is chosen dynamically or when the method is not one of the helper methods.

```cpp id="d4w5si"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    vix::requests::Client client;

    auto response = client.request(
        "OPTIONS",
        "https://example.com/api");

    vix::print("status:", response.status_code());
    vix::print("allow:", response.header("Allow").value_or("unknown"));

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request failed:", error.what());
    return 1;
  }
}
```

The custom method string is normalized before the request is sent. Invalid HTTP method tokens raise a request exception.

## Prepared requests

For more control, build a `Request` object and send it with `client.send`.

```cpp id="npchxa"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

#include <chrono>

int main()
{
  try
  {
    vix::requests::Client client;
    vix::requests::RequestOptions options;

    options.headers.set("Accept", "application/json");
    options.timeout = std::chrono::seconds(5);

    vix::requests::Request request(
        vix::requests::Method::Get,
        "https://example.com/api/status",
        options);

    auto response = client.send(request);

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

Prepared requests are useful when the request is assembled in one part of the program and executed in another part. For most direct application code, the method helpers are easier to read.

## Redirect behavior

`Client` follows redirects by default. The request options control whether redirects are followed and how many redirects are allowed.

```cpp id="nihpfp"
vix::requests::RequestOptions options;

options.follow_redirects = true;
options.max_redirects = 5;

auto response = client.get(
    "https://example.com/old-path",
    options);

vix::print("final url:", response.url());
vix::print("status:", response.status_code());
```

When redirects are disabled, the redirect response is returned to the caller.

```cpp id="lwldxx"
vix::requests::RequestOptions options;
options.follow_redirects = false;

auto response = client.get(
    "https://example.com/old-path",
    options);

vix::print("status:", response.status_code());
vix::print("location:", response.location().value_or("none"));
```

If the redirect chain is too long or loops back to a URL that was already visited, the client raises `TooManyRedirectsException`.

## Error handling

`Client` separates transport failures from HTTP error statuses. A failed connection, invalid URL, unsupported protocol, timeout, or redirect loop raises a request exception during the call. An HTTP response such as `404` or `500` is returned normally unless you call `raise_for_status()`.

```cpp id="ks8w5y"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    vix::requests::Client client;

    auto response = client.get("https://example.com/missing");

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

This keeps the caller in control. Some applications want to treat a `404` as a normal response. Others prefer to turn all error statuses into exceptions. `raise_for_status()` makes that choice explicit.

## Async entry points

`Client` also exposes async versions of the request methods. They return `vix::async::core::task<Response>` and are meant to fit into code that already uses the Vix async runtime.

```cpp id="d68nie"
#include <vix/requests/requests.hpp>
#include <vix/async/core/io_context.hpp>
#include <vix/async/core/task.hpp>
#include <vix/print.hpp>

vix::async::core::task<void> fetch(
    vix::async::core::io_context &ctx)
{
  try
  {
    vix::requests::Client client;

    auto pending = client.async_get(
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

  auto task = fetch(ctx);
  ctx.post(task.handle());
  ctx.run();

  return 0;
}
```

Use the async API when the caller is already structured around `io_context` and tasks. For ordinary command-line examples and simple backend code, the synchronous API is easier to read.

## Client or Session

Use `Client` when each request is self-contained.

Use `Session` when several requests should share defaults or cookies.

```cpp id="q5ubfq"
vix::requests::Client client;
auto one = client.get("https://example.com/api/one");

vix::requests::Session session;
session.set_header("Accept", "application/json");

auto first = session.get("https://example.com/api/first");
auto second = session.get("https://example.com/api/second");
```

A `Client` keeps the request boundary explicit. A `Session` keeps a client workflow together.

## API summary

```cpp id="nu19cn"
vix::requests::Client client;

client.send(request);

client.request(method, url, options, body);
client.request("CUSTOM", url, options, body);

client.get(url, options);
client.post(url, body, options);
client.put(url, body, options);
client.patch(url, body, options);
client.del(url, options);
client.head(url, options);

client.async_send(ctx, request);

client.async_request(ctx, method, url, options, body);
client.async_get(ctx, url, options);
client.async_post(ctx, url, body, options);
client.async_put(ctx, url, body, options);
client.async_patch(ctx, url, body, options);
client.async_del(ctx, url, options);
client.async_head(ctx, url, options);
```

## Next step

Continue with sessions when requests need shared headers, params, auth, timeout settings, or cookies.

[Open the session guide](/modules/requests/session)
