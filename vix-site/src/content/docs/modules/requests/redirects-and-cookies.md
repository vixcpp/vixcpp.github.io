# Redirects and Cookies

Redirects and cookies are part of the behavior around an HTTP request, not the request body itself.

A redirect tells the client that the resource should be requested from another URL. A cookie lets a server store small pieces of state that may be sent back on later requests. `vix::requests` handles both in a practical way: redirects are followed by default, and cookies are stored when you use a `Session`.

For isolated requests, the free functions and `Client` are enough. For workflows where cookies should survive across several calls, use `Session`.

## Redirects

Redirect handling is controlled through `RequestOptions`.

```cpp id="y5ki4p"
vix::requests::RequestOptions options;

options.follow_redirects = true;
options.max_redirects = 10;
```

Redirects are enabled by default. When a response returns a redirect status and provides a `Location` header, the client follows the redirect and returns the final response.

```cpp id="r5j11m"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    auto response = vix::requests::get("https://example.com/old-path");

    response.raise_for_status();

    vix::print("final url:", response.url());
    vix::print("status:", response.status_code());

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

```bash id="ll55ng"
vix run main.cpp
```

The final URL matters because the URL returned by the response may not be the original URL passed to the request.

## Disable redirects

Disable redirects when the application needs to inspect the redirect response itself.

```cpp id="ffpw5z"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    vix::requests::RequestOptions options;
    options.follow_redirects = false;

    auto response = vix::requests::get(
        "https://example.com/old-path",
        options);

    vix::print("status:", response.status_code());
    vix::print("location:", response.location().value_or("none"));

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request failed:", error.what());
    return 1;
  }
}
```

When redirects are disabled, a `301`, `302`, `303`, `307`, or `308` response is returned like any other response. The caller can then read the status code and `Location` header directly.

## Maximum redirects

`max_redirects` protects the client from following a redirect chain forever.

```cpp id="cxr3vu"
vix::requests::RequestOptions options;

options.follow_redirects = true;
options.max_redirects = 5;

auto response = vix::requests::get(
    "https://example.com/start",
    options);
```

If the redirect chain is longer than the configured limit, the request raises `TooManyRedirectsException`.

```cpp id="aw3kdu"
try
{
  vix::requests::RequestOptions options;
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

The client also detects redirect loops, where a chain points back to a URL that was already visited.

## Redirect method behavior

HTTP redirects do not always keep the same method.

For `303`, the next request is sent as `GET`, except when the original method is `HEAD`. For `301` and `302`, a `POST` request is rewritten to `GET`, which follows the behavior many HTTP clients use for compatibility. For `307` and `308`, the method and body are preserved.

This matters when a request sends data.

```cpp id="spk80u"
auto response = vix::requests::post(
    "https://example.com/submit",
    vix::requests::json_body(R"({"name":"Vix"})"));
```

If the server answers with `302`, the redirected request is sent as `GET` and the body is not preserved. If the server answers with `307` or `308`, the redirected request keeps the original method and body.

The caller usually does not need to manage this manually, but it is important when designing endpoints that redirect after form submissions or API writes.

## Redirect locations

The redirect target comes from the `Location` header.

`vix::requests` resolves common redirect forms:

```txt id="pintgo"
https://example.com/new-path
//example.com/new-path
/new-path
?next=value
../new-path
#fragment
```

Absolute URLs are used directly. Protocol-relative URLs reuse the current scheme. Root-relative and relative paths are resolved against the current response URL. Fragments are not sent as part of the HTTP request target.

This keeps redirect handling close to what servers normally emit without requiring the application to manually rebuild URLs.

## Redirects with Client

`Client` follows redirects according to the request options.

```cpp id="lf7uif"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    vix::requests::Client client;

    vix::requests::RequestOptions options;
    options.max_redirects = 5;

    auto response = client.get(
        "https://example.com/start",
        options);

    vix::print("final url:", response.url());
    vix::print("status:", response.status_code());

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request failed:", error.what());
    return 1;
  }
}
```

`Client` is stateless. It can follow redirects during one request, but it does not keep cookies for later requests.

## Cookies

Cookies are handled by `Session`.

A session stores cookies from response headers and applies matching cookies to later requests. This is useful for login flows, test clients, dashboards, or APIs that use cookie-based state.

```cpp id="iy55r2"
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

The cookie jar is in memory. It belongs to the session object and is not written to disk. When the session is destroyed, the stored cookies are gone.

## Clear cookies

Use `clear_cookies()` when the session should forget stored cookies.

```cpp id="oo9o9v"
vix::requests::Session session;

session.clear_cookies();
```

This is useful after logout, between tests, or before reusing a session object for a different client identity.

```cpp id="px3sdf"
session.clear_cookies();

auto response = session.get("https://example.com/public");
```

Clearing cookies does not remove default headers, params, timeout settings, or authentication options. It only clears the cookie jar.

## Cookies and redirects together

A session handles cookies across redirected requests as part of the same workflow.

If a response sets cookies before a later request, the session stores them and applies matching cookies when the target URL allows it. This is useful for flows where the server redirects after login or attaches state during a redirect chain.

```cpp id="zrhteq"
vix::requests::Session session;

session.set_header("Accept", "application/json");

auto response = session.get("https://example.com/start");

vix::print("final url:", response.url());
vix::print("status:", response.status_code());
```

The application still receives the final `Response`. The cookie handling remains inside the session.

## Cookie matching

Cookies are only sent when they match the target URL.

The session respects the normal pieces of cookie scope such as the cookie name, domain, path, secure flag, and expiration. Expired cookies are removed before cookies are applied to a request. Secure cookies are only sent to HTTPS URLs.

Most application code does not need to inspect the cookie jar directly. The important point is that cookies are attached to the session, not to the global HTTP client.

## Session defaults still apply

Cookies are only one part of a session. The same session can also reuse headers, params, timeout settings, and authentication.

```cpp id="npj6f1"
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

    auto first = session.get("https://example.com/api/first");
    first.raise_for_status();

    auto second = session.get("https://example.com/api/second");
    second.raise_for_status();

    vix::print("first:", first.status_code());
    vix::print("second:", second.status_code());

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("session failed:", error.what());
    return 1;
  }
}
```

This is the main reason to use `Session`: it keeps one client workflow together instead of spreading common request behavior across many calls.

## Client or Session for cookies

Use `Client` when every request is independent.

```cpp id="kthaqp"
vix::requests::Client client;

auto response = client.get("https://example.com/status");
```

Use `Session` when cookies or shared defaults should carry across calls.

```cpp id="agxjiw"
vix::requests::Session session;

auto login = session.post(
    "https://example.com/login",
    vix::requests::form_body({
      {"username", "gaspard"},
      {"password", "secret"}
    }));

auto profile = session.get("https://example.com/profile");
```

This distinction keeps client state explicit. A session has memory. A client does not.

## Error handling

Redirect and cookie workflows use the same exception model as the rest of the module.

```cpp id="yc3n2d"
try
{
  vix::requests::Session session;

  vix::requests::RequestOptions options;
  options.max_redirects = 3;

  auto response = session.get(
      "https://example.com/start",
      options);

  response.raise_for_status();

  vix::print(response.text());
}
catch (const vix::requests::TooManyRedirectsException &error)
{
  vix::eprint("redirect error:", error.what());
}
catch (const vix::requests::HttpException &error)
{
  vix::eprint("HTTP error:", error.status_code(), error.reason());
}
catch (const vix::requests::RequestException &error)
{
  vix::eprint("request error:", error.what());
}
```

`TooManyRedirectsException` is raised for redirect loops and chains that exceed the configured limit. HTTP error statuses are still returned as responses unless `raise_for_status()` is called.

## Common mistakes

### Expecting cookies to persist with free functions

Free functions are useful for isolated calls, but they do not give you a reusable cookie jar.

```cpp id="gyfckn"
auto login = vix::requests::post(
    "https://example.com/login",
    vix::requests::form_body({
      {"username", "gaspard"},
      {"password", "secret"}
    }));

auto profile = vix::requests::get("https://example.com/profile");
```

Use `Session` when cookies need to carry from one request to the next.

```cpp id="xx0cs9"
vix::requests::Session session;

auto login = session.post(
    "https://example.com/login",
    vix::requests::form_body({
      {"username", "gaspard"},
      {"password", "secret"}
    }));

auto profile = session.get("https://example.com/profile");
```

### Disabling redirects when the code expects the final response

When redirects are disabled, the caller receives the redirect response itself.

```cpp id="tebpcq"
vix::requests::RequestOptions options;
options.follow_redirects = false;

auto response = vix::requests::get(
    "https://example.com/start",
    options);

vix::print("status:", response.status_code());
vix::print("location:", response.location().value_or("none"));
```

Leave redirects enabled when the code wants the final destination response.

### Forgetting that redirects can change POST to GET

For `301`, `302`, and `303`, the redirected request may not keep the original `POST` body. Use `307` or `308` on the server side when the redirected request must preserve the method and body.

This is not usually a client-side bug. It is part of redirect behavior and should be considered when designing endpoints.

## API summary

Redirect options:

```cpp id="mio3l3"
vix::requests::RequestOptions options;

options.follow_redirects = true;
options.max_redirects = 10;
```

Disable redirects:

```cpp id="px8kzi"
options.follow_redirects = false;
```

Catch redirect failures:

```cpp id="ru2hq6"
catch (const vix::requests::TooManyRedirectsException &error)
{
  vix::eprint("redirect error:", error.what());
}
```

Session cookie workflow:

```cpp id="oig4ia"
vix::requests::Session session;

session.get(url);
session.post(url, body);

session.clear_cookies();
```

Useful response helpers:

```cpp id="ucwnsj"
response.url();
response.is_redirect();
response.location();
response.status_code();
response.raise_for_status();
```

## Next step

Continue with HTTPS and TLS. Redirects and cookies describe how the client behaves across HTTP responses; TLS controls how HTTPS connections are verified and protected.

[Open the HTTPS and TLS guide](/modules/requests/https-and-tls)
