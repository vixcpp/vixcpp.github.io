# API Reference

This page lists the public API exposed by the Vix `webrpc` module.

WebRPC provides a small transport-agnostic RPC core. It defines request and response envelopes, structured errors, execution context, method routing, and dispatching for single calls, notifications, and batches.

The module is designed around explicit values:

```txt
RpcRequest
  -> Context
  -> RpcHandler
  -> RpcResult
  -> RpcResponse
```

Handlers return success or failure as values. Normal RPC failures are represented by `RpcError`, not by exceptions.

## Header

Use the public WebRPC aggregation header:

```cpp
#include <vix/webrpc/webrpc.hpp>
```

The module uses the Vix JSON token model:

```cpp
#include <vix/json/Simple.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

The public aggregation header includes:

```cpp
#include <vix/webrpc/Error.hpp>
#include <vix/webrpc/Request.hpp>
#include <vix/webrpc/Response.hpp>
#include <vix/webrpc/Context.hpp>
#include <vix/webrpc/Router.hpp>
#include <vix/webrpc/Dispatcher.hpp>
```

## Namespace

All WebRPC APIs live in the `vix::webrpc` namespace.

```cpp
namespace vix::webrpc
{
}
```

WebRPC works with JSON-like values from:

```cpp
namespace vix::json
{
}
```

## RpcError

`RpcError` represents one structured RPC failure.

```cpp
struct RpcError
{
  std::string code{};
  std::string message{};
  vix::json::token details{nullptr};

  RpcError() = default;

  RpcError(
      std::string code_,
      std::string message_);

  RpcError(
      std::string code_,
      std::string message_,
      vix::json::token details_);

  bool valid() const noexcept;
  bool has_details() const noexcept;

  vix::json::token to_json_token() const;
  vix::json::token to_json() const;

  static RpcErrorParseResult parse(const vix::json::token &root);

  static RpcError method_not_found(std::string_view method);
  static RpcError invalid_params(std::string_view reason);
  static RpcError parse_error(std::string_view reason);
  static RpcError internal_error(std::string_view msg);
};
```

### Fields

| Field     | Purpose                                      |
| --------- | -------------------------------------------- |
| `code`    | Stable machine-readable error code.          |
| `message` | Human-readable error message.                |
| `details` | Optional structured details as a JSON token. |

### Standard helpers

| Helper                            | Error code         | Purpose                                 |
| --------------------------------- | ------------------ | --------------------------------------- |
| `RpcError::method_not_found(...)` | `METHOD_NOT_FOUND` | Method is not registered in the router. |
| `RpcError::invalid_params(...)`   | `INVALID_PARAMS`   | Request parameters are not acceptable.  |
| `RpcError::parse_error(...)`      | `PARSE_ERROR`      | Payload or envelope is malformed.       |
| `RpcError::internal_error(...)`   | `INTERNAL_ERROR`   | Internal server-side failure.           |

Example:

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  auto error =
      vix::webrpc::RpcError::invalid_params("id must be an integer");

  vix::print("code:", error.code);
  vix::print("message:", error.message);

  return 0;
}
```

## RpcError serialization

Use `to_json()` or `to_json_token()` to serialize an error.

```cpp
vix::json::token to_json_token() const;
vix::json::token to_json() const;
```

Serialized shape with details:

```json
{
  "code": "INVALID_PARAMS",
  "message": "Invalid RPC parameters",
  "details": {
    "reason": "id must be an integer"
  }
}
```

Serialized shape without details:

```json
{
  "code": "INTERNAL_ERROR",
  "message": "database unavailable"
}
```

Example:

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::webrpc;

  RpcError error = RpcError::method_not_found("user.get");

  auto token = error.to_json();

  const auto *object = token.as_object_ptr().get();
  if (!object)
  {
    return 1;
  }

  vix::print("code:", object->get_string_or("code", ""));

  return 0;
}
```

## RpcErrorParseResult

`RpcErrorParseResult` is returned by `RpcError::parse(...)`.

```cpp
struct RpcErrorParseResult
{
  static RpcErrorParseResult ok(RpcError v);
  static RpcErrorParseResult fail(RpcError e);

  bool ok() const noexcept;

  const RpcError &value() const noexcept;
  RpcError &value() noexcept;

  const RpcError &error() const noexcept;
  RpcError &error() noexcept;
};
```

Use `ok()` before reading `value()`.

```cpp
auto parsed = vix::webrpc::RpcError::parse(raw);

if (parsed.ok())
{
  const auto &error = parsed.value();
}
else
{
  const auto &parse_error = parsed.error();
}
```

## RpcError::parse

Parses a JSON-like token into `RpcError`.

```cpp
static RpcErrorParseResult
parse(const vix::json::token &root);
```

Parsing rules:

| Rule                                       | Failure           |
| ------------------------------------------ | ----------------- |
| Root must be an object.                    | `PARSE_ERROR`     |
| `code` must exist.                         | `PARSE_ERROR`     |
| `message` must exist.                      | `PARSE_ERROR`     |
| `code` must be a string.                   | `PARSE_ERROR`     |
| `message` must be a string.                | `PARSE_ERROR`     |
| `code` must not be empty.                  | `PARSE_ERROR`     |
| `details`, when present, can be any token. | No parse failure. |

Example:

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  token raw = obj({
      "code", "INVALID_PARAMS",
      "message", "Invalid RPC parameters",
      "details", obj({
          "reason", "id must be an integer",
      }),
  });

  RpcErrorParseResult parsed = RpcError::parse(raw);

  if (!parsed.ok())
  {
    vix::print("invalid error object");
    return 1;
  }

  vix::print("code:", parsed.value().code);

  return 0;
}
```

## RpcRequest

`RpcRequest` represents one RPC call.

```cpp
struct RpcRequest
{
  vix::json::token id{nullptr};
  std::string method{};
  vix::json::token params{nullptr};

  RpcRequest() = default;

  RpcRequest(
      vix::json::token id_,
      std::string method_,
      vix::json::token params_);

  bool has_id() const noexcept;
  bool valid() const noexcept;

  vix::json::token to_json() const;

  static std::variant<RpcRequest, RpcError>
  parse(const vix::json::token &root);

  const vix::json::kvs *params_object_ptr() const noexcept;
  const vix::json::array_t *params_array_ptr() const noexcept;

  const vix::json::token *
  param_ptr(std::string_view key) const noexcept;
};
```

### Request shape

```json
{
  "id": 1,
  "method": "math.add",
  "params": {
    "a": 7,
    "b": 5
  }
}
```

### Fields

| Field    | Purpose                                       |
| -------- | --------------------------------------------- |
| `id`     | Optional request id. Null means notification. |
| `method` | Required RPC method name.                     |
| `params` | Optional JSON-like parameters.                |

Example:

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  RpcRequest request{
      token(1LL),
      "ping",
      token(nullptr),
  };

  vix::print("method:", request.method);
  vix::print("has id:", request.has_id());

  return 0;
}
```

## RpcRequest::parse

Parses a request envelope.

```cpp
static std::variant<RpcRequest, RpcError>
parse(const vix::json::token &root);
```

Parsing rules:

| Rule                                                  | Failure              |
| ----------------------------------------------------- | -------------------- |
| Root must be an object.                               | `PARSE_ERROR`        |
| `method` must exist.                                  | `INVALID_PARAMS`     |
| `method` must be a non-empty string.                  | `INVALID_PARAMS`     |
| `id`, when present, must be null, string, or integer. | `INVALID_PARAMS`     |
| `params`, when present, can be any token.             | No envelope failure. |

Example:

```cpp
#include <variant>
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  token raw = obj({
      "id", 1LL,
      "method", "ping",
  });

  auto parsed = RpcRequest::parse(raw);

  if (std::holds_alternative<RpcError>(parsed))
  {
    const auto &error = std::get<RpcError>(parsed);
    vix::print("request error:", error.code);
    return 1;
  }

  const RpcRequest &request = std::get<RpcRequest>(parsed);
  vix::print("method:", request.method);

  return 0;
}
```

## RpcRequest helpers

### has_id

```cpp
bool has_id() const noexcept;
```

Returns `true` when `id` is not null.

A request without an id is treated as a notification by the dispatcher.

### valid

```cpp
bool valid() const noexcept;
```

Returns `true` when `method` is not empty.

### to_json

```cpp
vix::json::token to_json() const;
```

Serializes the request to a JSON-like token.

### params_object_ptr

```cpp
const vix::json::kvs *
params_object_ptr() const noexcept;
```

Returns params as an object pointer, or `nullptr` when params is not an object.

### params_array_ptr

```cpp
const vix::json::array_t *
params_array_ptr() const noexcept;
```

Returns params as an array pointer, or `nullptr` when params is not an array.

### param_ptr

```cpp
const vix::json::token *
param_ptr(std::string_view key) const noexcept;
```

Returns one object parameter by key, or `nullptr`.

## RpcResponse

`RpcResponse` represents the output envelope for one RPC call.

```cpp
struct RpcResponse
{
  vix::json::token id{nullptr};
  vix::json::token result{nullptr};
  RpcError error{};
  bool has_error{false};

  RpcResponse() = default;

  static RpcResponse ok(
      vix::json::token id_,
      vix::json::token result_);

  static RpcResponse fail(
      vix::json::token id_,
      RpcError err);

  bool is_notification() const noexcept;
  bool ok() const noexcept;

  vix::json::token to_json() const;

  static std::variant<RpcResponse, RpcError>
  parse(const vix::json::token &root);
};
```

### Success shape

```json
{
  "id": 1,
  "result": {
    "pong": true
  }
}
```

### Error shape

```json
{
  "id": 1,
  "error": {
    "code": "METHOD_NOT_FOUND",
    "message": "RPC method not found",
    "details": {
      "method": "missing.method"
    }
  }
}
```

A response contains either `result` or `error`, not both.

## RpcResponse::ok

Creates a success response.

```cpp
static RpcResponse ok(
    vix::json::token id_,
    vix::json::token result_);
```

Example:

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  RpcResponse response = RpcResponse::ok(
      token(1LL),
      obj({
          "pong", true,
      }));

  vix::print("ok:", response.ok());

  return 0;
}
```

## RpcResponse::fail

Creates an error response.

```cpp
static RpcResponse fail(
    vix::json::token id_,
    RpcError err);
```

Example:

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  RpcResponse response = RpcResponse::fail(
      token(1LL),
      RpcError::invalid_params("id must be an integer"));

  if (!response.ok())
  {
    vix::print("error:", response.error.code);
  }

  return 0;
}
```

## RpcResponse::parse

Parses a response envelope.

```cpp
static std::variant<RpcResponse, RpcError>
parse(const vix::json::token &root);
```

Parsing rules:

| Rule                                                  | Failure                                    |
| ----------------------------------------------------- | ------------------------------------------ |
| Root must be an object.                               | `PARSE_ERROR`                              |
| `id`, when present, must be null, string, or integer. | `INVALID_PARAMS`                           |
| Response must contain `result` or `error`.            | `INVALID_PARAMS`                           |
| Response cannot contain both `result` and `error`.    | `INVALID_PARAMS`                           |
| `error` must be a valid `RpcError`.                   | Parse failure from `RpcError::parse(...)`. |

Example:

```cpp
#include <variant>
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  token raw = obj({
      "id", 1LL,
      "result", obj({
          "pong", true,
      }),
  });

  auto parsed = RpcResponse::parse(raw);

  if (std::holds_alternative<RpcError>(parsed))
  {
    const auto &error = std::get<RpcError>(parsed);
    vix::print("response error:", error.code);
    return 1;
  }

  const RpcResponse &response = std::get<RpcResponse>(parsed);

  vix::print("ok:", response.ok());

  return 0;
}
```

## RpcResponse helpers

### is_notification

```cpp
bool is_notification() const noexcept;
```

Returns `true` when the response id is null.

### ok

```cpp
bool ok() const noexcept;
```

Returns `true` when the response is a success response.

### to_json

```cpp
vix::json::token to_json() const;
```

Serializes the response into a JSON-like token.

## Context

`Context` is the execution context passed to every RPC handler.

```cpp
struct Context
{
  using MetaMap =
      std::unordered_map<std::string, std::string>;

  std::string_view method{};
  const vix::json::token &params;
  const vix::json::token &id;
  std::string_view transport{};
  const MetaMap *meta{nullptr};

  Context(
      std::string_view method_,
      const vix::json::token &params_,
      const vix::json::token &id_,
      std::string_view transport_ = {},
      const MetaMap *meta_ = nullptr) noexcept;

  bool has_id() const noexcept;

  bool params_is_object() const noexcept;
  bool params_is_array() const noexcept;

  const vix::json::kvs *params_object_ptr() const noexcept;
  const vix::json::array_t *params_array_ptr() const noexcept;

  std::string_view meta_value(std::string_view key) const noexcept;
  bool has_meta(std::string_view key) const noexcept;
};
```

### Fields

| Field       | Purpose                        |
| ----------- | ------------------------------ |
| `method`    | RPC method name.               |
| `params`    | Request parameters token.      |
| `id`        | Optional request id token.     |
| `transport` | Optional transport label.      |
| `meta`      | Optional metadata map pointer. |

`Context` is a lightweight view. It does not own the request payload or metadata.

## Context helpers

### has_id

```cpp
bool has_id() const noexcept;
```

Returns `true` when the request id is not null.

### params_is_object

```cpp
bool params_is_object() const noexcept;
```

Returns `true` when params is an object.

### params_is_array

```cpp
bool params_is_array() const noexcept;
```

Returns `true` when params is an array.

### params_object_ptr

```cpp
const vix::json::kvs *
params_object_ptr() const noexcept;
```

Returns params as an object pointer, or `nullptr`.

### params_array_ptr

```cpp
const vix::json::array_t *
params_array_ptr() const noexcept;
```

Returns params as an array pointer, or `nullptr`.

### meta_value

```cpp
std::string_view
meta_value(std::string_view key) const noexcept;
```

Returns a metadata value, or an empty view when metadata is absent or the key is missing.

### has_meta

```cpp
bool has_meta(std::string_view key) const noexcept;
```

Returns `true` when metadata exists and contains the key.

Example:

```cpp
#include <string>
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  Router router;

  router.add("whoami", [](const Context &ctx) -> RpcResult
  {
    return obj({
        "transport", std::string(ctx.transport),
        "peer", std::string(ctx.meta_value("peer")),
        "has_id", ctx.has_id(),
    });
  });

  Context::MetaMap meta{
      {"peer", "client-1"},
  };

  token request = obj({
      "id", 1LL,
      "method", "whoami",
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(request, "websocket", &meta);

  if (response.has_value())
  {
    vix::print("response created");
  }

  return 0;
}
```

## RpcResult

`RpcResult` is the return type used by RPC handlers.

```cpp
using RpcResult =
    std::variant<vix::json::token, RpcError>;
```

A handler returns a token for success or an `RpcError` for failure.

```cpp
router.add("ping", [](const vix::webrpc::Context &)
    -> vix::webrpc::RpcResult
{
  return vix::json::obj({
      "pong", true,
  });
});
```

## RpcHandler

`RpcHandler` is the handler function signature stored by the router.

```cpp
using RpcHandler =
    std::function<RpcResult(const Context &)>;
```

Handlers are synchronous and receive a read-only `Context`.

## Router

`Router` stores method handlers and dispatches parsed requests.

```cpp
class Router
{
public:
  Router() = default;

  void add(std::string name, RpcHandler handler);

  bool remove(std::string_view name);

  std::size_t size() const noexcept;

  bool has(std::string_view name) const noexcept;

  RpcResult dispatch(
      const RpcRequest &req,
      std::string_view transport = {},
      const Context::MetaMap *meta = nullptr) const;

  RpcResult dispatch(
      const vix::json::token &raw,
      std::string_view transport = {},
      const Context::MetaMap *meta = nullptr) const;
};
```

## Router::add

Registers or replaces a method handler.

```cpp
void add(std::string name, RpcHandler handler);
```

Example:

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  Router router;

  router.add("ping", [](const Context &) -> RpcResult
  {
    return obj({
        "pong", true,
    });
  });

  vix::print("methods:", router.size());

  return 0;
}
```

If the method already exists, the handler is replaced.

## Router::remove

Removes a registered method.

```cpp
bool remove(std::string_view name);
```

Returns `true` when a handler was removed.

## Router::size

Returns the number of registered methods.

```cpp
std::size_t size() const noexcept;
```

## Router::has

Checks whether a method is registered.

```cpp
bool has(std::string_view name) const noexcept;
```

## Router::dispatch with RpcRequest

Dispatches a parsed request.

```cpp
RpcResult dispatch(
    const RpcRequest &req,
    std::string_view transport = {},
    const Context::MetaMap *meta = nullptr) const;
```

Behavior:

| Condition                 | Result                            |
| ------------------------- | --------------------------------- |
| Request method is empty.  | `RpcError::invalid_params(...)`   |
| Method is not registered. | `RpcError::method_not_found(...)` |
| Method exists.            | Handler result.                   |

Example:

```cpp
#include <variant>
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  Router router;

  router.add("echo", [](const Context &ctx) -> RpcResult
  {
    return ctx.params;
  });

  RpcRequest request{
      token(1LL),
      "echo",
      obj({
          "message", "hello",
      }),
  };

  RpcResult result = router.dispatch(request, "local");

  if (std::holds_alternative<RpcError>(result))
  {
    const auto &error = std::get<RpcError>(result);
    vix::print("error:", error.code);
    return 1;
  }

  vix::print("dispatch succeeded");

  return 0;
}
```

## Router::dispatch with token

Parses and dispatches one raw request token.

```cpp
RpcResult dispatch(
    const vix::json::token &raw,
    std::string_view transport = {},
    const Context::MetaMap *meta = nullptr) const;
```

This helper supports a single request object. Use `Dispatcher` for batch handling, notifications, and response wrapping.

## Dispatcher

`Dispatcher` handles the full request envelope flow.

```cpp
class Dispatcher
{
public:
  explicit Dispatcher(const Router &router) noexcept;

  std::optional<vix::json::token> handle(
      const vix::json::token &payload,
      std::string_view transport = {},
      const Context::MetaMap *meta = nullptr) const;

  std::optional<RpcResponse> handle_one(
      const vix::json::token &payload,
      std::string_view transport = {},
      const Context::MetaMap *meta = nullptr) const;
};
```

The dispatcher stores a reference to the router. The router must outlive the dispatcher.

## Dispatcher::handle

Handles either a single request payload or a batch payload.

```cpp
std::optional<vix::json::token> handle(
    const vix::json::token &payload,
    std::string_view transport = {},
    const Context::MetaMap *meta = nullptr) const;
```

Return behavior:

| Payload                     | Return                                 |
| --------------------------- | -------------------------------------- |
| Single request with id      | Response object token.                 |
| Single notification         | `std::nullopt`.                        |
| Batch with response items   | Array token of response objects.       |
| Batch of only notifications | `std::nullopt`.                        |
| Invalid single request      | Error response token with `id = null`. |
| Empty batch                 | Error response token with `id = null`. |

Example:

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  Router router;

  router.add("ping", [](const Context &) -> RpcResult
  {
    return obj({
        "pong", true,
    });
  });

  Dispatcher dispatcher(router);

  token request = obj({
      "id", 1LL,
      "method", "ping",
  });

  auto response = dispatcher.handle(request, "local");

  if (response.has_value())
  {
    vix::print("response token created");
  }

  return 0;
}
```

## Dispatcher::handle_one

Handles one request object and returns an optional `RpcResponse`.

```cpp
std::optional<RpcResponse> handle_one(
    const vix::json::token &payload,
    std::string_view transport = {},
    const Context::MetaMap *meta = nullptr) const;
```

Return behavior:

| Request               | Return                                 |
| --------------------- | -------------------------------------- |
| Valid request with id | `RpcResponse`.                         |
| Notification          | `std::nullopt`.                        |
| Malformed request     | Error `RpcResponse` with `id = null`.  |
| Handler error         | Error `RpcResponse` with request id.   |
| Handler success       | Success `RpcResponse` with request id. |

Example:

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  Router router;

  router.add("ping", [](const Context &) -> RpcResult
  {
    return obj({
        "pong", true,
    });
  });

  Dispatcher dispatcher(router);

  token request = obj({
      "id", 1LL,
      "method", "ping",
  });

  auto response = dispatcher.handle_one(request, "local");

  if (response.has_value() && response->ok())
  {
    vix::print("single request succeeded");
  }

  return 0;
}
```

## Batch behavior

Batch handling is implemented by `Dispatcher::handle(...)`.

Batch rules:

| Input                       | Behavior                                                     |
| --------------------------- | ------------------------------------------------------------ |
| Empty array                 | Error response with `id = null`.                             |
| Non-object item             | Error response entry with `id = null`; processing continues. |
| Malformed request item      | Error response entry with `id = null`; processing continues. |
| Request item with id        | Response entry is added.                                     |
| Notification item           | Handler runs, but no response entry is added.                |
| Batch of only notifications | `std::nullopt`.                                              |
| Mixed batch                 | Response array contains only items that produced responses.  |

Example:

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  Router router;

  router.add("ping", [](const Context &) -> RpcResult
  {
    return obj({
        "pong", true,
    });
  });

  token batch = array_t{
      {
          obj({
              "id", 1LL,
              "method", "ping",
          }),
          obj({
              "method", "ping",
          }),
          obj({
              "id", 2LL,
              "method", "missing.method",
          }),
      },
  };

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(batch, "local");

  if (response.has_value())
  {
    vix::print("batch response created");
  }

  return 0;
}
```

## Notifications

A request without an id, or with `id = null`, is a notification.

Notification behavior:

| Level      | Behavior                                         |
| ---------- | ------------------------------------------------ |
| Router     | Handler still executes and returns `RpcResult`.  |
| Dispatcher | Handler executes, but no response is returned.   |
| Batch      | Notification is omitted from the response array. |

Example:

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  Router router;

  router.add("events.track", [](const Context &) -> RpcResult
  {
    vix::print("event handled");

    return obj({
        "ok", true,
    });
  });

  token notification = obj({
      "method", "events.track",
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(notification, "local");

  if (!response.has_value())
  {
    vix::print("no response for notification");
  }

  return 0;
}
```

## Metadata

Metadata can be passed through `Dispatcher` or `Router`.

```cpp
Context::MetaMap meta{
    {"peer", "client-1"},
    {"trace_id", "abc-123"},
};

auto response =
    dispatcher.handle(payload, "websocket", &meta);
```

Handlers read metadata through `Context`.

```cpp
router.add("whoami", [](const vix::webrpc::Context &ctx)
    -> vix::webrpc::RpcResult
{
  return vix::json::obj({
      "peer", std::string(ctx.meta_value("peer")),
      "transport", std::string(ctx.transport),
  });
});
```

The metadata map is owned by the caller and must remain valid during dispatch.

## Complete example

```cpp
#include <variant>
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  Router router;

  router.add("math.add", [](const Context &ctx) -> RpcResult
  {
    const auto *params = ctx.params_object_ptr();
    if (!params)
    {
      return RpcError::invalid_params("params must be an object");
    }

    const token *a = params->get_ptr("a");
    const token *b = params->get_ptr("b");

    if (!a || !b || !a->is_i64() || !b->is_i64())
    {
      return RpcError::invalid_params("a and b must be integers");
    }

    return obj({
        "sum", a->as_i64_or(0) + b->as_i64_or(0),
    });
  });

  router.add("ping", [](const Context &) -> RpcResult
  {
    return obj({
        "pong", true,
    });
  });

  token batch = array_t{
      {
          obj({
              "id", 1LL,
              "method", "math.add",
              "params", obj({
                  "a", 7LL,
                  "b", 5LL,
              }),
          }),
          obj({
              "method", "ping",
          }),
          obj({
              "id", 2LL,
              "method", "missing.method",
          }),
      },
  };

  Dispatcher dispatcher(router);

  auto maybe_response = dispatcher.handle(batch, "local");

  if (!maybe_response.has_value())
  {
    vix::print("no response");
    return 0;
  }

  const auto *items = maybe_response->as_array_ptr().get();
  if (!items)
  {
    vix::print("batch response must be an array");
    return 1;
  }

  for (const auto &item : items->elems)
  {
    auto parsed = RpcResponse::parse(item);

    if (std::holds_alternative<RpcError>(parsed))
    {
      vix::print("invalid response item");
      continue;
    }

    const RpcResponse &response = std::get<RpcResponse>(parsed);

    if (response.ok())
    {
      vix::print("success response");
    }
    else
    {
      vix::print("error response:", response.error.code);
    }
  }

  return 0;
}
```

This example uses the full WebRPC flow: register handlers, dispatch a batch, execute a notification, receive success and error responses, and inspect the output.

## Summary

| API family            | Main use                                                               |
| --------------------- | ---------------------------------------------------------------------- |
| `RpcError`            | Structured RPC failure.                                                |
| `RpcErrorParseResult` | Explicit result for error parsing.                                     |
| `RpcRequest`          | Request envelope for one RPC call.                                     |
| `RpcResponse`         | Response envelope for one RPC call.                                    |
| `Context`             | Read-only handler execution context.                                   |
| `RpcResult`           | Handler return type: success token or error.                           |
| `RpcHandler`          | Handler callable stored by the router.                                 |
| `Router`              | Method registry and synchronous dispatch.                              |
| `Dispatcher`          | Request parsing, batch handling, notifications, and response wrapping. |

Use `Router` to register and execute methods. Use `Dispatcher` when the input is a raw payload that needs the full WebRPC envelope flow. Use `Context` inside handlers to read params, id, transport, and metadata. Use `RpcError` for every structured RPC failure.
