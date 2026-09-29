# Request Options

`vix::requests::RequestOptions` defines how one outgoing request should be sent.

A request always has a method and a URL, but real HTTP calls often need more than that. They may need headers, query parameters, a timeout, authentication, redirect rules, TLS behavior, or a custom user agent. `RequestOptions` keeps those details in one object so the request call stays readable while still making the behavior explicit.

```cpp id="wfbxow"
vix::requests::RequestOptions options;

options.headers.set("Accept", "application/json");
options.params.set("page", "1");
options.timeout = std::chrono::seconds(10);

auto response = vix::requests::get(
    "https://example.com/api/items",
    options);
```

Use options when the request needs behavior that should not be hidden inside the URL or hardcoded into the transport layer.

## Basic use

```cpp id="npybm0"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

#include <chrono>

int main()
{
  try
  {
    vix::requests::RequestOptions options;

    options.headers.set("Accept", "application/json");
    options.params.set("page", "1");
    options.params.set("q", "vix requests");
    options.timeout = std::chrono::seconds(10);

    auto response = vix::requests::get(
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

Run it:

```bash id="g3o393"
vix run main.cpp
```

The options object is passed to the request call. It does not change global behavior, and it does not affect other requests unless you reuse the same object yourself.

## Headers

Headers are stored in `options.headers`.

```cpp id="kvqnu9"
vix::requests::RequestOptions options;

options.headers.set("Accept", "application/json");
options.headers.set("X-Client", "vix");
```

The header container uses case-insensitive lookup. This matches how HTTP headers are normally treated, while still preserving the original casing used when the header was inserted.

```cpp id="f4t5l5"
options.headers.set("Content-Type", "application/json");

vix::print(options.headers.has("content-type"));
vix::print(options.headers.get("CONTENT-TYPE").value_or("missing"));
```

Use `set` when the request should have one value for a header. Use `append` when multiple values are valid, such as repeated response-style headers. For normal outgoing request headers, `set` is usually the right choice.

## Query params

Query parameters are stored in `options.params`.

```cpp id="mxg1ft"
vix::requests::RequestOptions options;

options.params.set("page", "1");
options.params.set("q", "vix requests");

auto response = vix::requests::get(
    "https://example.com/search",
    options);
```

The params are appended to the URL before the request is sent. Values are URL-encoded, so spaces and reserved characters are handled by the module instead of being written manually in the URL string.

If the URL already has a query string, the new params are appended.

```cpp id="js654v"
vix::requests::RequestOptions options;
options.params.set("page", "2");

auto response = vix::requests::get(
    "https://example.com/search?sort=new",
    options);
```

The final request target is equivalent to:

```txt id="ow6n53"
/search?sort=new&page=2
```

## Timeout

The timeout setting controls how long the request should wait during network operations.

```cpp id="yxuo2q"
#include <chrono>

vix::requests::RequestOptions options;

options.timeout = std::chrono::seconds(10);
```

Assigning one duration sets the same value for connect, read, and total timeout phases. This is the simplest form and is enough for most requests.

Use a `Timeout` object when the phases need different limits.

```cpp id="zuwec6"
vix::requests::Timeout timeout;

timeout.set_connect(std::chrono::seconds(3));
timeout.set_read(std::chrono::seconds(10));
timeout.set_total(std::chrono::seconds(15));

vix::requests::RequestOptions options;
options.timeout = timeout;
```

A timeout duration of zero means that no explicit timeout is configured for that phase. Negative timeout values are rejected.

## Basic authentication

Use `set_basic_auth` when the request should send HTTP Basic authentication.

```cpp id="sdu2bj"
vix::requests::RequestOptions options;

options.set_basic_auth("username", "password");

auto response = vix::requests::get(
    "https://example.com/private",
    options);
```

The module builds the `Authorization` header during request serialization. If the request already has an explicit `Authorization` header, that header is not overwritten.

```cpp id="grgg59"
vix::requests::RequestOptions options;

options.headers.set("Authorization", "Bearer token");
options.set_basic_auth("username", "password");
```

In this case, the explicit `Authorization` header remains the one used by the request.

## Redirects

Redirects are enabled by default.

```cpp id="l6v2oz"
vix::requests::RequestOptions options;

options.follow_redirects = true;
options.max_redirects = 10;
```

When redirects are enabled, the client follows redirect responses such as `301`, `302`, `303`, `307`, and `308`, then returns the final response.

```cpp id="bn11xv"
auto response = vix::requests::get(
    "https://example.com/old-path",
    options);

vix::print("final url:", response.url());
vix::print("status:", response.status_code());
```

Disable redirects when the application needs to inspect the redirect response itself.

```cpp id="vvumyn"
vix::requests::RequestOptions options;

options.follow_redirects = false;

auto response = vix::requests::get(
    "https://example.com/old-path",
    options);

vix::print("status:", response.status_code());
vix::print("location:", response.location().value_or("none"));
```

If a redirect chain is longer than `max_redirects`, or if it loops back to a URL that was already visited, the request raises `TooManyRedirectsException`.

## TLS verification

HTTPS requests verify TLS certificates by default.

```cpp id="ifbrca"
vix::requests::RequestOptions options;

options.verify_tls = true;

auto response = vix::requests::get(
    "https://example.com/",
    options);
```

Keep TLS verification enabled for normal traffic. It protects the request from accepting a certificate that does not match the server.

For local development, self-signed certificates, or test fixtures, verification can be disabled for a specific request.

```cpp id="lr31oc"
vix::requests::RequestOptions options;

options.verify_tls = false;

auto response = vix::requests::get(
    "https://localhost:8443/",
    options);
```

Disabling TLS verification should be a local or controlled testing decision, not a default production setting.

## Keep-alive

The `keep_alive` option controls the default `Connection` header when the request does not already set one.

```cpp id="qk0wvy"
vix::requests::RequestOptions options;

options.keep_alive = true;
```

When `keep_alive` is true, the effective headers use:

```txt id="se0d9q"
Connection: keep-alive
```

When it is false, the effective headers use:

```txt id="os47i9"
Connection: close
```

If the request already has an explicit `Connection` header, the explicit value is preserved.

## User agent

`user_agent` is sent when the request does not already provide a `User-Agent` header.

```cpp id="r6gdb1"
vix::requests::RequestOptions options;

options.set_user_agent("my-vix-client/1.0");

auto response = vix::requests::get(
    "https://example.com/",
    options);
```

This is useful when calling APIs that expect clients to identify themselves. It also keeps the user agent close to the code that defines the client behavior.

An explicit `User-Agent` header takes priority.

```cpp id="v79oc5"
vix::requests::RequestOptions options;

options.headers.set("User-Agent", "custom-agent");
options.set_user_agent("my-vix-client/1.0");
```

The effective request uses `custom-agent`.

## Host override

Most requests should use the host from the URL. `host_override` exists for cases where the request must connect to one URL but send a different `Host` header.

```cpp id="puotj4"
vix::requests::RequestOptions options;

options.set_host_override("api.internal");

auto response = vix::requests::get(
    "https://127.0.0.1:8443/status",
    options);
```

Clear the override when it should no longer be used.

```cpp id="fkdqk9"
options.clear_host_override();
```

Use host overrides carefully. They are useful for local testing, internal routing, and special deployment setups, but they can make request behavior harder to understand when used casually.

## Effective headers

The module builds effective headers before sending the request. It keeps the headers provided in `RequestOptions`, then adds the defaults that are needed for HTTP serialization when they are missing.

The generated headers can include:

```txt id="kfecpa"
Host
User-Agent
Accept
Connection
Content-Type
Content-Length
Authorization
```

`Host`, `User-Agent`, `Accept`, and `Connection` are added only when the request does not already define them. `Content-Type` and `Content-Length` are added when the request has a body and those headers are missing. `Authorization` is added for configured basic auth when no explicit authorization header exists.

This means the caller can stay concise for normal requests, while still keeping control when a header must be set manually.

## Options with request bodies

For methods that send a body, the body argument comes before the options argument.

```cpp id="mn6h5j"
vix::requests::RequestOptions options;

options.headers.set("Accept", "application/json");

auto response = vix::requests::post(
    "https://example.com/api/items",
    vix::requests::json_body(R"({"name":"Vix"})"),
    options);
```

The same shape is used for `post`, `put`, and `patch`.

```cpp id="wb8j16"
client.post(url, body, options);
client.put(url, body, options);
client.patch(url, body, options);

session.post(url, body, options);
session.put(url, body, options);
session.patch(url, body, options);
```

For methods without a body, options come directly after the URL.

```cpp id="muw120"
client.get(url, options);
client.del(url, options);
client.head(url, options);

session.get(url, options);
session.del(url, options);
session.head(url, options);
```

## Options with Session

A `Session` has default options. A request can still pass its own options for one call.

```cpp id="axzpr7"
vix::requests::Session session;

session.set_header("Accept", "application/json");
session.timeout() = std::chrono::seconds(10);

vix::requests::RequestOptions options;
options.params.set("page", "1");
options.timeout = std::chrono::seconds(3);

auto response = session.get(
    "https://example.com/api/items",
    options);
```

Use session defaults for values that describe the client as a whole. Use per-request options for values that belong to one request only, such as a page number, request id, or a short timeout for a specific endpoint.

## Default values

A default `RequestOptions` object starts with the normal behavior expected for an HTTP client.

```cpp id="u86796"
vix::requests::RequestOptions options;
```

The important defaults are:

```txt id="b1drk1"
headers: empty
params: empty
timeout: no explicit timeout
auth: empty
follow_redirects: true
max_redirects: 10
verify_tls: true
keep_alive: true
user_agent: Vix requests user agent
host_override: empty
```

These defaults keep simple requests short while still making the behavior configurable when needed.

## Common mistakes

### Putting query params directly into the URL when they are dynamic

This works for fixed URLs, but it becomes harder to read when values are computed.

```cpp id="g4lggf"
auto response = vix::requests::get(
    "https://example.com/search?page=1&q=vix%20requests");
```

Prefer `Params` when the values come from code.

```cpp id="c2lq89"
vix::requests::RequestOptions options;

options.params.set("page", "1");
options.params.set("q", "vix requests");

auto response = vix::requests::get(
    "https://example.com/search",
    options);
```

The module handles encoding and keeps the URL readable.

### Disabling TLS verification globally in your own code

Disabling TLS verification can be useful for local development, but it should be done only where the request needs it.

```cpp id="e0yx7f"
vix::requests::RequestOptions options;
options.verify_tls = false;

auto response = vix::requests::get(
    "https://localhost:8443/",
    options);
```

For normal HTTPS traffic, leave `verify_tls` enabled.

### Calling `raise_for_status()` too late

If the code depends on the request being successful, call `raise_for_status()` before using the response body.

```cpp id="pzfbvd"
auto response = vix::requests::get("https://example.com/api/items");

response.raise_for_status();

vix::print(response.text());
```

This keeps the success path clear and moves HTTP error handling into the catch block.

## API summary

```cpp id="aj8gux"
struct BasicAuth
{
  std::string username;
  std::string password;

  bool configured() const noexcept;
};

struct RequestOptions
{
  Headers headers;
  Params params;
  Timeout timeout;
  BasicAuth auth;

  bool follow_redirects = true;
  std::size_t max_redirects = 10;

  bool verify_tls = true;
  bool keep_alive = true;

  std::string user_agent;
  std::optional<std::string> host_override;

  bool redirects_enabled() const noexcept;
  bool has_user_agent() const noexcept;
  bool has_host_override() const noexcept;

  RequestOptions &set_basic_auth(
      std::string username,
      std::string password);

  RequestOptions &set_timeout(Timeout::Duration value);
  RequestOptions &set_user_agent(std::string value);
  RequestOptions &set_host_override(std::string value);
  RequestOptions &clear_host_override();
};
```

Helpers:

```cpp id="z7dq67"
vix::requests::merge_request_options(baseOptions, overrideOptions);
vix::requests::has_option_header(options, name);
```

## Next step

Continue with headers and params. They are used often enough that it helps to understand how lookup, replacement, duplicates, and encoding behave.

[Open the headers and params guide](/modules/requests/headers-and-params)
