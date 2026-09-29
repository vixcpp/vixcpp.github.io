# WebRPC

The `webrpc` module provides a transport-agnostic RPC layer for Vix applications.

WebRPC defines the core parts of a remote procedure call: request envelopes, response envelopes, structured errors, execution context, method routing, and dispatching. It does not decide whether the call came from HTTP, WebSocket, P2P, CLI, or an in-process adapter. That decision belongs to the transport layer above it.

This makes the module useful when an application needs a stable RPC core that can be reused across several transports. A handler can receive the same `Context`, validate the same `params`, and return the same `RpcResult`, even if the call arrived through a different channel.

The basic flow is:

```txt
JSON token
  -> RpcRequest
  -> Router
  -> handler(Context)
  -> RpcResult
  -> RpcResponse
  -> JSON token
```

## Header

Use the public WebRPC header when working with the module:

```cpp
#include <vix/webrpc/webrpc.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Basic example

A router maps method names to handlers. Each handler receives a `Context` and returns either a JSON result or a structured `RpcError`.

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

    const auto sum = a->as_i64_or(0) + b->as_i64_or(0);

    return obj({
        "sum", sum,
    });
  });

  token request = obj({
      "id", 1LL,
      "method", "math.add",
      "params", obj({
          "a", 7LL,
          "b", 5LL,
      }),
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(request, "local");

  if (!response.has_value())
  {
    vix::print("no response");
    return 0;
  }

  vix::print("rpc response created");

  return 0;
}
```

The dispatcher receives a JSON-like token, parses it as an RPC request, calls the router, and returns a response token when a response is expected.

## Request envelope

An RPC request is represented by `RpcRequest`.

The expected request shape is:

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

The `method` field is required and must be a non-empty string. The `params` field is optional and can be any JSON-like value. The `id` field is optional. When `id` is missing or null, the call is treated as a notification.

```cpp
using namespace vix::json;
using namespace vix::webrpc;

RpcRequest request{
    token(1LL),
    "math.add",
    obj({
        "a", 7LL,
        "b", 5LL,
    }),
};
```

Requests can also be parsed from a raw token:

```cpp
auto parsed = vix::webrpc::RpcRequest::parse(raw);
```

Parsing returns either a valid `RpcRequest` or an `RpcError`.

## Response envelope

An RPC response is represented by `RpcResponse`.

A successful response has this shape:

```json
{
  "id": 1,
  "result": {
    "sum": 12
  }
}
```

An error response has this shape:

```json
{
  "id": 1,
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Invalid RPC parameters",
    "details": {
      "reason": "a and b must be integers"
    }
  }
}
```

A response contains either `result` or `error`. This keeps success and failure explicit.

```cpp
using namespace vix::json;
using namespace vix::webrpc;

auto ok = RpcResponse::ok(
    token(1LL),
    obj({
        "sum", 12LL,
    }));

auto fail = RpcResponse::fail(
    token(1LL),
    RpcError::invalid_params("a and b must be integers"));
```

## Structured errors

Errors are represented by `RpcError`.

```cpp
struct RpcError
{
  std::string code;
  std::string message;
  vix::json::token details;
};
```

The `code` is machine-readable. The `message` is human-readable. The optional `details` field can contain structured information for debugging, client feedback, or logs.

The module provides standard helpers:

```cpp
RpcError::method_not_found("user.get");
RpcError::invalid_params("params must be an object");
RpcError::parse_error("request must be an object");
RpcError::internal_error("unexpected failure");
```

Errors are values. Handlers return them directly through `RpcResult`.

## Context

Every handler receives a `Context`.

```cpp
router.add("user.get", [](const vix::webrpc::Context &ctx)
    -> vix::webrpc::RpcResult
{
  const auto *params = ctx.params_object_ptr();
  if (!params)
  {
    return vix::webrpc::RpcError::invalid_params(
        "params must be an object");
  }

  return vix::json::obj({
      "ok", true,
  });
});
```

The context contains:

| Field       | Purpose                                                          |
| ----------- | ---------------------------------------------------------------- |
| `method`    | RPC method name.                                                 |
| `params`    | Request parameters as a JSON token.                              |
| `id`        | Optional request id.                                             |
| `transport` | Optional transport label, such as `http`, `websocket`, or `p2p`. |
| `meta`      | Optional metadata map.                                           |

`Context` is a lightweight view. It does not own the request payload. It should be used during the handler call and not stored beyond that call.

## Router

`Router` stores method handlers and dispatches parsed requests.

```cpp
vix::webrpc::Router router;

router.add("ping", [](const vix::webrpc::Context &)
    -> vix::webrpc::RpcResult
{
  return vix::json::obj({
      "pong", true,
  });
});
```

A handler returns `RpcResult`:

```cpp
using RpcResult =
    std::variant<vix::json::token, vix::webrpc::RpcError>;
```

This means a handler always returns either a success payload or a structured error.

## Dispatcher

`Dispatcher` is the orchestration layer above the router.

It handles:

- single request payloads
- batch request payloads
- notifications
- malformed request envelopes
- response wrapping

```cpp
vix::webrpc::Dispatcher dispatcher(router);

auto response = dispatcher.handle(payload, "http");
```

The return type is:

```cpp
std::optional<vix::json::token>
```

The optional is empty when the payload is a notification or when a batch contains only notifications. In those cases, the dispatcher still executes the handler, but no response is returned.

## Notifications

A request without an id is treated as a notification.

```json
{
  "method": "events.track",
  "params": {
    "name": "page.open"
  }
}
```

The dispatcher executes the method, but it does not return a response. This is useful for fire-and-forget events, telemetry, local commands, or message streams where the sender does not need a result.

## Batch calls

The dispatcher can receive an array of request objects.

```json
[
  {
    "id": 1,
    "method": "math.add",
    "params": {
      "a": 7,
      "b": 5
    }
  },
  {
    "id": 2,
    "method": "ping"
  }
]
```

The result is an array of response objects. If some items are notifications, they are executed but omitted from the response array. If every item is a notification, the dispatcher returns no response.

## Metadata

Transport adapters can pass metadata to the dispatcher or router.

```cpp
vix::webrpc::Context::MetaMap meta{
    {"peer", "client-1"},
    {"trace_id", "abc-123"},
};

auto response = dispatcher.handle(payload, "websocket", &meta);
```

Handlers can read metadata through the context:

```cpp
router.add("whoami", [](const vix::webrpc::Context &ctx)
    -> vix::webrpc::RpcResult
{
  auto peer = ctx.meta_value("peer");

  return vix::json::obj({
      "peer", std::string(peer),
  });
});
```

Metadata is optional. When no metadata map is provided, metadata accessors return empty or false.

## Transport boundary

WebRPC is intentionally focused on the RPC core.

A transport adapter is responsible for receiving bytes, parsing JSON into `vix::json::token`, passing the token to `Dispatcher`, and writing the response token back to the client when a response exists.

For example, an HTTP adapter can do this:

```txt
HTTP request body
  -> parse JSON
  -> dispatcher.handle(payload, "http", &meta)
  -> serialize response token
  -> HTTP response body
```

A WebSocket or P2P adapter can use the same dispatcher and router. That is the main reason the module keeps transport information as metadata instead of binding itself to one network stack.

## Core types

| Type          | Purpose                                                  |
| ------------- | -------------------------------------------------------- |
| `RpcRequest`  | Request envelope for one RPC call.                       |
| `RpcResponse` | Response envelope for success or error.                  |
| `RpcError`    | Structured RPC error.                                    |
| `Context`     | Read-only execution context passed to handlers.          |
| `RpcResult`   | Handler return type: success token or error.             |
| `RpcHandler`  | Handler function signature.                              |
| `Router`      | Method registry and request dispatch.                    |
| `Dispatcher`  | Single call, batch, notification, and response handling. |

## Public API surface

The WebRPC public aggregation header includes:

```cpp
#include <vix/webrpc/Error.hpp>
#include <vix/webrpc/Request.hpp>
#include <vix/webrpc/Response.hpp>
#include <vix/webrpc/Context.hpp>
#include <vix/webrpc/Router.hpp>
#include <vix/webrpc/Dispatcher.hpp>
```

Application code should normally include:

```cpp
#include <vix/webrpc/webrpc.hpp>
```

## When to use WebRPC

Use WebRPC when the application needs a clear RPC boundary that is independent from the transport.

It is a good fit for backend modules, local service calls, WebSocket messages, P2P commands, CLI-to-runtime calls, and future adapters that need the same request and response model.

For simple local function calls, normal C++ functions are enough. WebRPC becomes useful when the call needs a structured envelope, a method name, JSON-like parameters, stable errors, and a reusable dispatch path.

## Next step

Continue with the quick start to build a small router, register a method, dispatch a request, and inspect the response.

- [Quick Start](./quick-start)
- [Requests](./requests)
- [Responses](./responses)
- [Errors](./errors)
- [Context](./context)
- [Router](./router)
- [Dispatcher](./dispatcher)
- [Batches and Notifications](./batches-and-notifications)
- [Metadata](./metadata)
- [API Reference](./api-reference)
