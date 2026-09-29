# API Reference

This page lists the public API exposed by the Vix Requests module.

Use this page when you already understand the workflow and need to check names, types, signatures, or return values. For a guided explanation, start with the overview, quick start, client, session, and request options pages first.

## Header

Use the public umbrella header in normal application code.

```cpp id="x7w4ro"
#include <vix/requests/requests.hpp>
```

This header exposes the main public API:

```cpp id="az6jsu"
#include <vix/requests/Error.hpp>
#include <vix/requests/Method.hpp>
#include <vix/requests/Headers.hpp>
#include <vix/requests/Params.hpp>
#include <vix/requests/Url.hpp>
#include <vix/requests/Body.hpp>
#include <vix/requests/Timeout.hpp>
#include <vix/requests/RequestOptions.hpp>
#include <vix/requests/Request.hpp>
#include <vix/requests/Response.hpp>
#include <vix/requests/Client.hpp>
#include <vix/requests/Session.hpp>
#include <vix/requests/transport/Transport.hpp>
```

## Namespace

```cpp id="v9wy7f"
namespace vix::requests
```

Transport abstractions live under:

```cpp id="yw3uix"
namespace vix::requests::transport
```

## Free functions

The free functions are the shortest way to make one outgoing request.

```cpp id="jx7zf5"
vix::requests::Response request(
    vix::requests::Method method,
    std::string_view url,
    vix::requests::RequestOptions options = {},
    vix::requests::Body body = {});

vix::requests::Response request(
    std::string_view method,
    std::string_view url,
    vix::requests::RequestOptions options = {},
    vix::requests::Body body = {});

vix::requests::Response get(
    std::string_view url,
    vix::requests::RequestOptions options = {});

vix::requests::Response post(
    std::string_view url,
    vix::requests::Body body = {},
    vix::requests::RequestOptions options = {});

vix::requests::Response put(
    std::string_view url,
    vix::requests::Body body = {},
    vix::requests::RequestOptions options = {});

vix::requests::Response patch(
    std::string_view url,
    vix::requests::Body body = {},
    vix::requests::RequestOptions options = {});

vix::requests::Response del(
    std::string_view url,
    vix::requests::RequestOptions options = {});

vix::requests::Response head(
    std::string_view url,
    vix::requests::RequestOptions options = {});
```

Example:

```cpp id="dj3gvb"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  auto response = vix::requests::get("https://example.com/");

  vix::print("status:", response.status_code());

  return 0;
}
```

## Async free functions

The async free functions return `vix::async::core::task<Response>` and require an `io_context`.

```cpp id="cnp9ep"
vix::async::core::task<vix::requests::Response> async_request(
    vix::async::core::io_context &ctx,
    vix::requests::Method method,
    std::string_view url,
    vix::requests::RequestOptions options = {},
    vix::requests::Body body = {});

vix::async::core::task<vix::requests::Response> async_request(
    vix::async::core::io_context &ctx,
    std::string_view method,
    std::string_view url,
    vix::requests::RequestOptions options = {},
    vix::requests::Body body = {});

vix::async::core::task<vix::requests::Response> async_get(
    vix::async::core::io_context &ctx,
    std::string_view url,
    vix::requests::RequestOptions options = {});

vix::async::core::task<vix::requests::Response> async_post(
    vix::async::core::io_context &ctx,
    std::string_view url,
    vix::requests::Body body = {},
    vix::requests::RequestOptions options = {});

vix::async::core::task<vix::requests::Response> async_put(
    vix::async::core::io_context &ctx,
    std::string_view url,
    vix::requests::Body body = {},
    vix::requests::RequestOptions options = {});

vix::async::core::task<vix::requests::Response> async_patch(
    vix::async::core::io_context &ctx,
    std::string_view url,
    vix::requests::Body body = {},
    vix::requests::RequestOptions options = {});

vix::async::core::task<vix::requests::Response> async_del(
    vix::async::core::io_context &ctx,
    std::string_view url,
    vix::requests::RequestOptions options = {});

vix::async::core::task<vix::requests::Response> async_head(
    vix::async::core::io_context &ctx,
    std::string_view url,
    vix::requests::RequestOptions options = {});
```

## Client

`Client` is the stateless client object. It does not keep default headers, params, auth, timeout settings, or cookies between calls.

```cpp id="kl7htg"
class Client
{
public:
  Client();

  Response send(const Request &request) const;

  vix::async::core::task<Response> async_send(
      vix::async::core::io_context &ctx,
      const Request &request) const;

  Response request(
      Method method,
      std::string_view url,
      RequestOptions options = {},
      Body body = {}) const;

  Response request(
      std::string_view method,
      std::string_view url,
      RequestOptions options = {},
      Body body = {}) const;

  Response get(
      std::string_view url,
      RequestOptions options = {}) const;

  Response post(
      std::string_view url,
      Body body = {},
      RequestOptions options = {}) const;

  Response put(
      std::string_view url,
      Body body = {},
      RequestOptions options = {}) const;

  Response patch(
      std::string_view url,
      Body body = {},
      RequestOptions options = {}) const;

  Response del(
      std::string_view url,
      RequestOptions options = {}) const;

  Response head(
      std::string_view url,
      RequestOptions options = {}) const;

  vix::async::core::task<Response> async_request(
      vix::async::core::io_context &ctx,
      Method method,
      std::string_view url,
      RequestOptions options = {},
      Body body = {}) const;

  vix::async::core::task<Response> async_request(
      vix::async::core::io_context &ctx,
      std::string_view method,
      std::string_view url,
      RequestOptions options = {},
      Body body = {}) const;

  vix::async::core::task<Response> async_get(
      vix::async::core::io_context &ctx,
      std::string_view url,
      RequestOptions options = {}) const;

  vix::async::core::task<Response> async_post(
      vix::async::core::io_context &ctx,
      std::string_view url,
      Body body = {},
      RequestOptions options = {}) const;

  vix::async::core::task<Response> async_put(
      vix::async::core::io_context &ctx,
      std::string_view url,
      Body body = {},
      RequestOptions options = {}) const;

  vix::async::core::task<Response> async_patch(
      vix::async::core::io_context &ctx,
      std::string_view url,
      Body body = {},
      RequestOptions options = {}) const;

  vix::async::core::task<Response> async_del(
      vix::async::core::io_context &ctx,
      std::string_view url,
      RequestOptions options = {}) const;

  vix::async::core::task<Response> async_head(
      vix::async::core::io_context &ctx,
      std::string_view url,
      RequestOptions options = {}) const;
};
```

## Session

`Session` is a reusable client context. It stores default options and an in-memory cookie jar.

```cpp id="ckx17q"
class Session
{
public:
  Session();
  explicit Session(RequestOptions defaults);

  ~Session();

  Session(const Session &) = delete;
  Session &operator=(const Session &) = delete;

  Session(Session &&other) noexcept;
  Session &operator=(Session &&other) noexcept;

  RequestOptions &defaults() noexcept;
  const RequestOptions &defaults() const noexcept;

  void set_defaults(RequestOptions options);

  Headers &headers() noexcept;
  const Headers &headers() const noexcept;

  Params &params() noexcept;
  const Params &params() const noexcept;

  Timeout &timeout() noexcept;
  const Timeout &timeout() const noexcept;

  Session &set_header(
      std::string_view name,
      std::string_view value);

  Session &remove_header(std::string_view name);

  Session &set_param(
      std::string_view name,
      std::string_view value);

  Session &remove_param(std::string_view name);

  Session &set_basic_auth(
      std::string username,
      std::string password);

  Session &clear_cookies();

  Response send(const Request &request);

  vix::async::core::task<Response> async_send(
      vix::async::core::io_context &ctx,
      const Request &request);

  Response request(
      Method method,
      std::string_view url,
      RequestOptions options = {},
      Body body = {});

  Response request(
      std::string_view method,
      std::string_view url,
      RequestOptions options = {},
      Body body = {});

  Response get(
      std::string_view url,
      RequestOptions options = {});

  Response post(
      std::string_view url,
      Body body = {},
      RequestOptions options = {});

  Response put(
      std::string_view url,
      Body body = {},
      RequestOptions options = {});

  Response patch(
      std::string_view url,
      Body body = {},
      RequestOptions options = {});

  Response del(
      std::string_view url,
      RequestOptions options = {});

  Response head(
      std::string_view url,
      RequestOptions options = {});

  vix::async::core::task<Response> async_request(
      vix::async::core::io_context &ctx,
      Method method,
      std::string_view url,
      RequestOptions options = {},
      Body body = {});

  vix::async::core::task<Response> async_request(
      vix::async::core::io_context &ctx,
      std::string_view method,
      std::string_view url,
      RequestOptions options = {},
      Body body = {});

  vix::async::core::task<Response> async_get(
      vix::async::core::io_context &ctx,
      std::string_view url,
      RequestOptions options = {});

  vix::async::core::task<Response> async_post(
      vix::async::core::io_context &ctx,
      std::string_view url,
      Body body = {},
      RequestOptions options = {});

  vix::async::core::task<Response> async_put(
      vix::async::core::io_context &ctx,
      std::string_view url,
      Body body = {},
      RequestOptions options = {});

  vix::async::core::task<Response> async_patch(
      vix::async::core::io_context &ctx,
      std::string_view url,
      Body body = {},
      RequestOptions options = {});

  vix::async::core::task<Response> async_del(
      vix::async::core::io_context &ctx,
      std::string_view url,
      RequestOptions options = {});

  vix::async::core::task<Response> async_head(
      vix::async::core::io_context &ctx,
      std::string_view url,
      RequestOptions options = {});
};
```

## Method

`Method` represents the known HTTP methods used by the high-level API.

```cpp id="aa5lcf"
enum class Method
{
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Head,
  Options,
  Trace,
  Connect
};
```

Helpers:

```cpp id="tmjw44"
std::string_view to_string(Method method) noexcept;

std::optional<Method> method_from_string(
    std::string_view value);

std::string normalize_method(
    std::string_view value);

bool is_valid_method_token(
    std::string_view value) noexcept;

bool method_allows_request_body(
    Method method) noexcept;

bool method_expects_response_body(
    Method method) noexcept;
```

## Headers

`Headers` is a case-insensitive HTTP header container. Lookups ignore casing, while inserted header names keep their original casing.

```cpp id="v5ku3x"
struct Header
{
  std::string name;
  std::string value;
};

class Headers
{
public:
  using Container = std::vector<Header>;
  using iterator = Container::iterator;
  using const_iterator = Container::const_iterator;

  Headers();

  Headers(
      std::initializer_list<
          std::pair<std::string, std::string>> values);

  void set(
      std::string_view name,
      std::string_view value);

  void append(
      std::string_view name,
      std::string_view value);

  std::optional<std::string> get(
      std::string_view name) const;

  std::vector<std::string> get_all(
      std::string_view name) const;

  bool has(
      std::string_view name) const noexcept;

  std::size_t remove(
      std::string_view name);

  void clear() noexcept;

  bool empty() const noexcept;
  std::size_t size() const noexcept;

  const Container &entries() const noexcept;

  iterator begin() noexcept;
  iterator end() noexcept;

  const_iterator begin() const noexcept;
  const_iterator end() const noexcept;

  const_iterator cbegin() const noexcept;
  const_iterator cend() const noexcept;
};
```

## Params

`Params` is an ordered query parameter container. It preserves insertion order and can keep duplicate keys when `append` is used.

```cpp id="eel35d"
struct Param
{
  std::string name;
  std::string value;
};

class Params
{
public:
  using Container = std::vector<Param>;
  using iterator = Container::iterator;
  using const_iterator = Container::const_iterator;

  Params();

  Params(
      std::initializer_list<
          std::pair<std::string, std::string>> values);

  void set(
      std::string_view name,
      std::string_view value);

  void append(
      std::string_view name,
      std::string_view value);

  std::optional<std::string> get(
      std::string_view name) const;

  std::vector<std::string> get_all(
      std::string_view name) const;

  bool has(
      std::string_view name) const noexcept;

  std::size_t remove(
      std::string_view name);

  void clear() noexcept;

  bool empty() const noexcept;
  std::size_t size() const noexcept;

  std::string to_query_string() const;

  const Container &entries() const noexcept;

  iterator begin() noexcept;
  iterator end() noexcept;

  const_iterator begin() const noexcept;
  const_iterator end() const noexcept;

  const_iterator cbegin() const noexcept;
  const_iterator cend() const noexcept;
};
```

Encoding helpers:

```cpp id="cn6ayc"
std::string url_encode(std::string_view value);
std::string url_decode(std::string_view value);

std::string form_url_encode(std::string_view value);
std::string form_url_decode(std::string_view value);

std::string build_query_string(const Params &params);
```

## Body

`Body` stores request payload data and an optional content type.

```cpp id="lldb1c"
enum class BodyType
{
  Empty,
  Raw,
  Json,
  Form,
  Binary
};

class Body
{
public:
  Body();

  Body(
      BodyType type,
      std::string data,
      std::string contentType = {});

  static Body binary(
      std::vector<unsigned char> data,
      std::string contentType = {});

  BodyType type() const noexcept;

  const std::string &data() const noexcept;
  const std::string &text() const noexcept;

  std::vector<unsigned char> bytes() const;

  const std::string &content_type() const noexcept;

  bool empty() const noexcept;
  std::size_t size() const noexcept;
  bool has_content_type() const noexcept;
};
```

Body helpers:

```cpp id="jtc978"
Body raw_body(
    std::string_view data,
    std::string contentType = {});

Body binary_body(
    std::vector<unsigned char> data,
    std::string contentType = {});

Body json_body(
    std::string_view json);

Body form_body(
    const Params &params);

Body form_body(
    std::initializer_list<
        std::pair<std::string, std::string>> values);

std::string_view to_string(
    BodyType type) noexcept;
```

## Timeout

`Timeout` stores connect, read, and total timeout values.

```cpp id="gchlyh"
class Timeout
{
public:
  using Duration = std::chrono::milliseconds;

  Timeout();

  explicit Timeout(Duration value);

  Timeout(
      Duration connect,
      Duration read,
      Duration total);

  Timeout &operator=(Duration value);

  static Timeout seconds(long seconds);
  static Timeout milliseconds(long milliseconds);
  static Timeout none();

  Duration connect() const noexcept;
  Duration read() const noexcept;
  Duration total() const noexcept;

  void set_connect(Duration value);
  void set_read(Duration value);
  void set_total(Duration value);

  bool has_connect() const noexcept;
  bool has_read() const noexcept;
  bool has_total() const noexcept;

  bool active() const noexcept;
};
```

## RequestOptions

`RequestOptions` controls request behavior.

```cpp id="c77n7v"
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

  RequestOptions &set_timeout(
      Timeout::Duration value);

  RequestOptions &set_user_agent(
      std::string value);

  RequestOptions &set_host_override(
      std::string value);

  RequestOptions &clear_host_override();
};
```

Helpers:

```cpp id="oowzoj"
RequestOptions merge_request_options(
    const RequestOptions &baseOptions,
    const RequestOptions &overrideOptions);

bool has_option_header(
    const RequestOptions &options,
    std::string_view name) noexcept;
```

## Url

`Url` represents a parsed absolute HTTP or HTTPS URL.

```cpp id="bcxqcw"
class Url
{
public:
  Url();

  static Url parse(
      std::string_view value);

  const std::string &scheme() const noexcept;
  const std::string &host() const noexcept;

  std::uint16_t port() const noexcept;

  std::optional<std::uint16_t> explicit_port() const noexcept;
  bool has_explicit_port() const noexcept;

  const std::string &path() const noexcept;
  const std::string &query() const noexcept;
  const std::string &fragment() const noexcept;

  bool is_http() const noexcept;
  bool is_https() const noexcept;
  bool has_query() const noexcept;

  std::string authority() const;
  std::string origin() const;

  std::string request_target() const;

  std::string without_fragment() const;
  std::string to_string() const;

  Url with_params(
      const Params &params) const;
};
```

Helpers:

```cpp id="vdm194"
Url parse_url(
    std::string_view value);

std::string append_query_string(
    std::string_view url,
    std::string_view query);
```

## Request

`Request` is a prepared outgoing HTTP request.

```cpp id="cex62w"
class Request
{
public:
  Request();

  Request(
      Method method,
      std::string_view url,
      RequestOptions options = {},
      Body body = {});

  Request(
      std::string_view method,
      std::string_view url,
      RequestOptions options = {},
      Body body = {});

  const std::string &method() const noexcept;

  std::optional<Method> known_method() const;

  const Url &url() const noexcept;

  Url final_url() const;

  std::string request_target() const;

  const RequestOptions &options() const noexcept;
  RequestOptions &options() noexcept;

  const Body &body() const noexcept;

  void set_body(Body body);

  bool has_body() const noexcept;

  Headers effective_headers() const;

  std::string host_header() const;

  bool expects_response_body() const;
  bool allows_request_body() const;
};
```

## Response

`Response` is returned after a request completes.

```cpp id="nkwibm"
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

```cpp id="yejt0a"
std::string_view default_reason_phrase(
    int statusCode) noexcept;

bool is_redirect_status(
    int statusCode) noexcept;
```

## Error types

All request-specific failures derive from `RequestException`.

```cpp id="df1xwd"
class RequestException : public std::runtime_error;

class InvalidUrlException : public RequestException;

class UnsupportedProtocolException : public RequestException;

class TransportException : public RequestException;

class ConnectionException : public TransportException;

class TimeoutException : public TransportException;

class TooManyRedirectsException : public RequestException;
```

`HttpException` is raised by `Response::raise_for_status()` when the response status code is `400` or higher.

```cpp id="sy6qg6"
class HttpException : public RequestException
{
public:
  HttpException(
      int statusCode,
      std::string reason = {},
      std::string url = {});

  int status_code() const noexcept;

  const std::string &reason() const noexcept;

  const std::string &url() const noexcept;
};
```

Helper:

```cpp id="et12kc"
std::string make_http_error_message(
    int statusCode,
    const std::string &reason,
    const std::string &url);
```

## Transport

The transport layer is public enough to allow inspection and extension, but most application code should use `Client`, `Session`, or the free functions.

```cpp id="mit4tu"
namespace vix::requests::transport
{
  enum class TransportProtocol
  {
    Http,
    Https
  };

  std::string_view to_string(
      TransportProtocol protocol) noexcept;

  TransportProtocol protocol_from_scheme(
      std::string_view scheme);

  class Transport
  {
  public:
    virtual ~Transport() = default;

    Transport(const Transport &) = delete;
    Transport &operator=(const Transport &) = delete;

    Transport(Transport &&) noexcept = default;
    Transport &operator=(Transport &&) noexcept = default;

    virtual Response send(
        const Request &request) = 0;

    virtual vix::async::core::task<Response> async_send(
        vix::async::core::io_context &ctx,
        const Request &request) = 0;

    virtual bool supports(
        const Url &url) const noexcept = 0;

    virtual TransportProtocol protocol() const noexcept = 0;

  protected:
    Transport() = default;
  };

  using TransportPtr = std::unique_ptr<Transport>;
}
```

Transport factory helpers:

```cpp id="irnw47"
vix::requests::transport::TransportPtr make_transport(
    vix::requests::transport::TransportProtocol protocol);

vix::requests::transport::TransportPtr make_transport_for_url(
    const vix::requests::Url &url);

bool scheme_supported(
    std::string_view scheme) noexcept;

bool url_supported(
    const vix::requests::Url &url) noexcept;
```

## Common request shapes

Simple GET:

```cpp id="w2zap4"
auto response = vix::requests::get("https://example.com/");
```

GET with options:

```cpp id="cqosqr"
vix::requests::RequestOptions options;

options.headers.set("Accept", "application/json");
options.params.set("page", "1");

auto response = vix::requests::get(
    "https://example.com/api/items",
    options);
```

POST JSON:

```cpp id="pvte93"
auto response = vix::requests::post(
    "https://example.com/api/items",
    vix::requests::json_body(R"({"name":"Vix"})"));
```

Session workflow:

```cpp id="eey83y"
vix::requests::Session session;

session.set_header("Accept", "application/json");

auto profile = session.get("https://example.com/api/profile");
auto created = session.post(
    "https://example.com/api/items",
    vix::requests::json_body(R"({"name":"Vix"})"));
```

Error handling:

```cpp id="eycp5w"
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
catch (const vix::requests::RequestException &error)
{
  vix::eprint("request error:", error.what());
}
```

## Next step

Return to the module overview when you need the conceptual picture, or continue from the specific guide that matches the part of the API you are using.

[Back to Requests overview](/modules/requests/)
