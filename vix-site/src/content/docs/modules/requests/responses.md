# Responses

`vix::requests::Response` is the object returned after an outgoing HTTP request completes.

It contains the information the client received from the server: the final URL, status code, reason phrase, headers, body, and elapsed time. The response does not hide the HTTP result from you. A `404` or `500` response is still a response; it only becomes an exception when you explicitly call `raise_for_status()`.

That behavior keeps the caller in control. Some applications need to inspect an error response body. Others want to stop immediately when the server returns an error status. `Response` supports both workflows.

## Basic use

```cpp id="q3j2qk"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    auto response = vix::requests::get("https://example.com/");

    vix::print("url:", response.url());
    vix::print("status:", response.status_code(), response.reason());
    vix::print("ok:", response.ok());
    vix::print("size:", response.size());

    response.raise_for_status();

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

```bash id="x4z42g"
vix run main.cpp
```

The response can be inspected before or after `raise_for_status()`. If the status code is lower than `400`, `raise_for_status()` does nothing. If the status code is `400` or higher, it throws `HttpException`.

## Status code and reason

Use `status_code()` for the numeric HTTP status code and `reason()` for the reason phrase.

```cpp id="h6s0c7"
auto response = vix::requests::get("https://example.com/");

vix::print("status:", response.status_code());
vix::print("reason:", response.reason());
```

The status code is usually the most important value. The reason phrase is useful for display, diagnostics, and simple command-line tools.

```cpp id="k5ubgb"
if (response.status_code() == 200)
{
  vix::print("request succeeded");
}
```

For normal success checks, `ok()` is more direct.

```cpp id="cc3kb9"
if (response.ok())
{
  vix::print("success");
}
```

## Success, redirects, and errors

`Response` provides small helpers for common status checks.

```cpp id="lb6f24"
vix::print("ok:", response.ok());
vix::print("redirect:", response.is_redirect());
vix::print("error:", response.is_error());
```

`ok()` returns true for `2xx` responses. `is_redirect()` returns true for redirect statuses handled by the client, such as `301`, `302`, `303`, `307`, and `308`. `is_error()` returns true for status codes greater than or equal to `400`.

These helpers are intentionally simple. They are useful for readable control flow, but they do not replace application-specific status handling.

```cpp id="k6pkck"
if (response.status_code() == 404)
{
  vix::print("item was not found");
}
else if (response.is_error())
{
  response.raise_for_status();
}
```

## HTTP errors

HTTP error statuses are not thrown automatically. The request function returns the response, and the caller decides what to do with it.

```cpp id="ah60ne"
auto response = vix::requests::get("https://example.com/missing");

vix::print("status:", response.status_code());
vix::print("body:", response.text());
```

Call `raise_for_status()` when the success path requires a non-error HTTP status.

```cpp id="g78bfe"
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
```

`HttpException` stores the status code, reason phrase, and response URL. Catch it when HTTP error responses need their own handling.

## Response URL

`url()` returns the final response URL.

```cpp id="oz1m35"
auto response = vix::requests::get("https://example.com/");

vix::print("url:", response.url());
```

This matters when redirects are enabled. If the client follows a redirect, the response URL is the final URL, not necessarily the URL originally passed to the request.

```cpp id="tyk8kn"
auto response = vix::requests::get("https://example.com/old-path");

vix::print("final url:", response.url());
vix::print("status:", response.status_code());
```

When redirects are disabled, the response remains the redirect response and the `Location` header can be inspected.

```cpp id="cw0451"
vix::requests::RequestOptions options;
options.follow_redirects = false;

auto response = vix::requests::get(
    "https://example.com/old-path",
    options);

vix::print("status:", response.status_code());
vix::print("location:", response.location().value_or("none"));
```

## Headers

Use `header()` to read the first value for a header name.

```cpp id="li04w8"
auto response = vix::requests::get("https://example.com/");

auto content_type = response.header("Content-Type");

vix::print("content type:", content_type.value_or("unknown"));
```

Header lookup is case-insensitive.

```cpp id="r9b5xq"
vix::print(response.header("content-type").value_or("unknown"));
vix::print(response.header("CONTENT-TYPE").value_or("unknown"));
```

Use `headers_all()` when a header may appear more than once.

```cpp id="x55ry5"
for (const auto &cookie : response.headers_all("Set-Cookie"))
{
  vix::print("cookie:", cookie);
}
```

For direct access to the full header container, use `headers()`.

```cpp id="vq2cur"
for (const auto &entry : response.headers().entries())
{
  vix::print(entry.name + ":", entry.value);
}
```

## Common header helpers

`Response` provides helpers for headers that are frequently needed.

```cpp id="oa4fzz"
vix::print(
    "content type:",
    response.content_type().value_or("unknown"));

vix::print(
    "content length:",
    response.content_length().value_or(0));

vix::print(
    "location:",
    response.location().value_or("none"));
```

`content_type()` reads `Content-Type`. `content_length()` reads `Content-Length` and returns it as a number when the value is valid. `location()` reads the `Location` header, which is most often used with redirect responses.

Each helper returns an optional value because the header may be missing.

## Text body

Use `text()` when the response body should be handled as text.

```cpp id="vw6bn2"
auto response = vix::requests::get("https://example.com/");

response.raise_for_status();

vix::print(response.text());
```

`body()` returns the same stored response body. The two names exist so the caller can choose the name that best matches the intent of the code.

```cpp id="e2p4zu"
vix::print(response.body());
```

Use `text()` for normal text responses. Use `body()` when the code is treating the response as raw response data.

## Bytes

Use `bytes()` when the response should be handled as binary data.

```cpp id="pzlbkt"
auto response = vix::requests::get("https://example.com/file.bin");

response.raise_for_status();

auto data = response.bytes();

vix::print("downloaded bytes:", data.size());
```

The response internally stores the body as a string because HTTP bodies are byte sequences. `bytes()` gives you a `std::vector<unsigned char>` when that is the more useful representation.

## Size and empty responses

Use `size()` to get the stored body size in bytes.

```cpp id="ey7ch9"
vix::print("size:", response.size());
```

Use `empty()` when the code only needs to know whether the body has data.

```cpp id="ybr7nn"
if (response.empty())
{
  vix::print("response body is empty");
}
```

Some responses are expected to have no body. A `HEAD` request does not expose a response body to the caller, and statuses such as `204 No Content` are also treated as bodyless responses.

```cpp id="bj0xux"
auto response = vix::requests::head("https://example.com/status");

vix::print("status:", response.status_code());
vix::print("empty:", response.empty());
```

## Elapsed time

`elapsed()` returns the time spent on the request as a `std::chrono::milliseconds` duration.

```cpp id="xvyehu"
auto response = vix::requests::get("https://example.com/");

vix::print("elapsed:", response.elapsed());
```

This value is useful for diagnostics, simple command-line checks, and observing slow endpoints during development. For production logs, prefer the Vix logging API around the request workflow.

## Reading JSON responses

`vix::requests` returns the response body as text or bytes. If the response body contains JSON, parse it with the JSON API used by your application.

```cpp id="r87h1r"
auto response = vix::requests::get("https://example.com/api/status");

response.raise_for_status();

vix::print("content type:", response.content_type().value_or("unknown"));
vix::print("json text:", response.text());
```

The response object does not assume that every `application/json` response should be parsed automatically. Keeping parsing explicit makes the boundary between HTTP and application data clear.

## Response with Client

`Client` returns the same `Response` type.

```cpp id="otcyqk"
vix::requests::Client client;

auto response = client.get("https://example.com/");

response.raise_for_status();

vix::print("status:", response.status_code());
```

The response API does not change between free functions, `Client`, and `Session`.

## Response with Session

A session also returns the same `Response` type, while keeping shared defaults and cookies across requests.

```cpp id="s56cla"
vix::requests::Session session;

session.set_header("Accept", "application/json");

auto response = session.get("https://example.com/api/profile");

response.raise_for_status();

vix::print("profile:", response.text());
```

The session affects how the request is sent. The response is still the normal response object returned by the request module.

## Common mistakes

### Assuming HTTP error statuses throw automatically

This returns a response even if the server returns `404`.

```cpp id="kpwg62"
auto response = vix::requests::get("https://example.com/missing");

vix::print("status:", response.status_code());
```

Call `raise_for_status()` when an HTTP error should stop the success path.

```cpp id="t85nv5"
auto response = vix::requests::get("https://example.com/missing");

response.raise_for_status();
```

### Reading the body before checking the status

Sometimes this is intentional, especially when an API returns useful error details. When the body should only be used for successful responses, check first.

```cpp id="rr5mb5"
auto response = vix::requests::get("https://example.com/api/items");

response.raise_for_status();

vix::print(response.text());
```

This keeps success handling separate from error handling.

### Expecting `Content-Length` to always exist

Not every response has a `Content-Length` header. Some responses use chunked transfer encoding or connection-close body framing.

```cpp id="za6a7i"
auto length = response.content_length();

if (length.has_value())
{
  vix::print("content length:", *length);
}
else
{
  vix::print("content length is not provided");
}
```

Use `response.size()` when you need the size of the body stored by the client after the response is received.

### Treating every body as text

Use `text()` for text responses and `bytes()` for binary responses.

```cpp id="fmk4ps"
auto data = response.bytes();

vix::print("bytes:", data.size());
```

This keeps binary workflows clear and avoids treating arbitrary byte data as display text.

## API summary

```cpp id="p1w68l"
class Response
{
public:
  using Duration = std::chrono::milliseconds;

  Response();

  Response(
      std::string url,
      int statusCode,
      std::string reason = {},
      Headers headers = {},
      std::string body = {});

  const std::string &url() const noexcept;
  void set_url(std::string value);

  int status_code() const noexcept;
  void set_status_code(int value) noexcept;

  const std::string &reason() const noexcept;
  void set_reason(std::string value);

  const Headers &headers() const noexcept;
  Headers &headers() noexcept;
  void set_headers(Headers value);

  const std::string &text() const noexcept;
  const std::string &body() const noexcept;
  void set_body(std::string value);

  std::vector<unsigned char> bytes() const;

  std::size_t size() const noexcept;
  bool empty() const noexcept;

  bool ok() const noexcept;
  bool is_redirect() const noexcept;
  bool is_error() const noexcept;

  void raise_for_status() const;

  std::optional<std::string> header(
      std::string_view name) const;

  std::vector<std::string> headers_all(
      std::string_view name) const;

  std::optional<std::string> content_type() const;
  std::optional<std::size_t> content_length() const;
  std::optional<std::string> location() const;

  Duration elapsed() const noexcept;
  void set_elapsed(Duration value) noexcept;
};
```

Helpers:

```cpp id="umrjlr"
vix::requests::default_reason_phrase(statusCode);
vix::requests::is_redirect_status(statusCode);
```

## Next step

Continue with timeouts. Responses show what came back from the server; timeouts define how long the client should wait for the network work to complete.

[Open the timeouts guide](/modules/requests/timeouts)
