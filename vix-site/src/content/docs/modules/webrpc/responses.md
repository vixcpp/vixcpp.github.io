# Responses

The `webrpc` module represents RPC output with `RpcResponse`.

A response is the envelope returned when a caller expects a result. It contains the request id and either a successful `result` or a structured `error`. This keeps the RPC boundary explicit: every handled call produces one clear outcome, and the caller can distinguish success from failure without relying on exceptions or transport-specific behavior.

A WebRPC response is transport-agnostic. The same response token can be sent through HTTP, WebSocket, P2P, CLI, or any adapter that can serialize a `vix::json::token`.

## Header

Use the public WebRPC header:

```cpp
#include <vix/webrpc/webrpc.hpp>
```

WebRPC responses use the Vix JSON token model:

```cpp
#include <vix/json/Simple.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Response shape

A successful response contains an `id` and a `result`.

```json
{
  "id": 1,
  "result": {
    "sum": 12
  }
}
```

An error response contains an `id` and an `error`.

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

A response must contain either `result` or `error`, but not both.

## RpcResponse

`RpcResponse` is the C++ value type used by WebRPC.

```cpp
struct RpcResponse
{
  vix::json::token id;
  vix::json::token result;
  RpcError error;
  bool has_error;
};
```

The `id` echoes the request id. The `result` is used when the call succeeds. The `error` is used when the call fails. The `has_error` flag tells which side of the response is active.

## Create a success response

Use `RpcResponse::ok(...)` to create a successful response.

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
          "sum", 12LL,
      }));

  if (response.ok())
  {
    vix::print("response is successful");
  }

  return 0;
}
```

A success response stores the payload in `result` and keeps `has_error` set to `false`.

## Create an error response

Use `RpcResponse::fail(...)` to create an error response.

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
      RpcError::invalid_params("a and b must be integers"));

  if (!response.ok())
  {
    vix::print("response failed:", response.error.code);
  }

  return 0;
}
```

An error response stores the structured error in `error` and keeps `has_error` set to `true`.

## Serialize a response

Use `to_json()` to convert a response into a JSON-like token.

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

  token out = response.to_json();

  const auto *object = out.as_object_ptr().get();
  if (!object)
  {
    return 1;
  }

  const token *result = object->get_ptr("result");
  if (!result)
  {
    return 1;
  }

  vix::print("response serialized");

  return 0;
}
```

Transport adapters normally serialize this token to the wire format used by the transport.

## Parse a response

Use `RpcResponse::parse(...)` when a response token is received from another side and must be validated.

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
    vix::print("response parse error:", error.code);
    return 1;
  }

  const auto &response = std::get<RpcResponse>(parsed);

  if (response.ok())
  {
    vix::print("response is valid");
  }

  return 0;
}
```

Parsing returns either a valid `RpcResponse` or an `RpcError`. This keeps response validation explicit and exception-free.

## Parsing rules

`RpcResponse::parse(...)` validates the response envelope.

| Rule                                                    | Failure                           |
| ------------------------------------------------------- | --------------------------------- |
| Root value must be an object.                           | `PARSE_ERROR`                     |
| `id`, when present, must be `null`, string, or integer. | `INVALID_PARAMS`                  |
| Response must contain `result` or `error`.              | `INVALID_PARAMS`                  |
| Response cannot contain both `result` and `error`.      | `INVALID_PARAMS`                  |
| `error` must be a valid `RpcError` object.              | `PARSE_ERROR` or `INVALID_PARAMS` |

The parser validates the response envelope. It does not validate the application meaning of the `result` payload.

## Inspect a success response

A successful response stores the payload in `result`.

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
          "sum", 12LL,
      }),
  });

  auto parsed = RpcResponse::parse(raw);

  if (std::holds_alternative<RpcError>(parsed))
  {
    return 1;
  }

  const RpcResponse &response = std::get<RpcResponse>(parsed);

  if (!response.ok())
  {
    return 1;
  }

  const auto *result_object = response.result.as_object_ptr().get();
  if (!result_object)
  {
    return 1;
  }

  vix::print("sum:", result_object->get_i64_or("sum", 0));

  return 0;
}
```

The `result` field can contain any JSON-like token. Its shape belongs to the RPC method contract.

## Inspect an error response

An error response stores the failure in `error`.

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
      "error", RpcError::invalid_params("id must be an integer").to_json(),
  });

  auto parsed = RpcResponse::parse(raw);

  if (std::holds_alternative<RpcError>(parsed))
  {
    return 1;
  }

  const RpcResponse &response = std::get<RpcResponse>(parsed);

  if (!response.ok())
  {
    vix::print("code:", response.error.code);
    vix::print("message:", response.error.message);
  }

  return 0;
}
```

The error code is machine-readable. The message is human-readable. Optional details can carry structured context.

## Response id

A response echoes the request id.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  RpcResponse response = RpcResponse::ok(
      token("req-1"),
      obj({
          "ok", true,
      }));

  token out = response.to_json();

  const auto *object = out.as_object_ptr().get();
  if (!object)
  {
    return 1;
  }

  const token *id = object->get_ptr("id");
  if (id && id->is_string())
  {
    vix::print("response id:", id->as_string_or(""));
  }

  return 0;
}
```

The id allows clients to match a response to the request that produced it. This is especially important for batch calls and asynchronous transports.

## Null id

A response may have a null id.

This usually happens when the request envelope was malformed and WebRPC cannot safely recover the original id. In that case, the dispatcher returns an error response with `id = null`.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  RpcResponse response = RpcResponse::fail(
      token(nullptr),
      RpcError::parse_error("request must be an object"));

  if (response.is_notification())
  {
    vix::print("response id is null");
  }

  return 0;
}
```

The method name `is_notification()` means that the id is null. For normal dispatcher behavior, notifications do not produce responses.

## Notifications and responses

A request without an id is a notification. The dispatcher executes the handler but returns no response.

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
    vix::print("notification produced no response");
  }

  return 0;
}
```

Even if the handler returns a result or an error, the dispatcher omits the response for notifications.

## Dispatcher response wrapping

When a request has an id, the dispatcher wraps the router result into `RpcResponse`.

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

  token request = obj({
      "id", 1LL,
      "method", "ping",
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(request, "local");

  if (response.has_value())
  {
    vix::print("response envelope created");
  }

  return 0;
}
```

The router only returns a `RpcResult`. The dispatcher decides whether to create a response envelope.

## Method errors become response errors

When a handler returns `RpcError`, the dispatcher creates an error response.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  Router router;

  router.add("user.get", [](const Context &ctx) -> RpcResult
  {
    const auto *params = ctx.params_object_ptr();
    if (!params)
    {
      return RpcError::invalid_params("params must be an object");
    }

    return obj({
        "ok", true,
    });
  });

  token request = obj({
      "id", 1LL,
      "method", "user.get",
      "params", token("bad"),
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(request, "local");

  if (response.has_value())
  {
    vix::print("error response created");
  }

  return 0;
}
```

The resulting response token contains `error`, not `result`.

## Missing methods become response errors

When the router cannot find a method, it returns `METHOD_NOT_FOUND`.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  Router router;
  Dispatcher dispatcher(router);

  token request = obj({
      "id", 1LL,
      "method", "missing.method",
  });

  auto response = dispatcher.handle(request, "local");

  if (response.has_value())
  {
    vix::print("method-not-found response created");
  }

  return 0;
}
```

The response keeps the error structured, with a stable code and details containing the missing method.

## Invalid response object

A response cannot contain both `result` and `error`.

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
          "ok", true,
      }),
      "error", RpcError::internal_error("bad response").to_json(),
  });

  auto parsed = RpcResponse::parse(raw);

  if (std::holds_alternative<RpcError>(parsed))
  {
    const auto &error = std::get<RpcError>(parsed);
    vix::print("parse failed:", error.code);
    return 1;
  }

  return 0;
}
```

This rule prevents ambiguous responses where a caller would not know whether the call succeeded or failed.

## Missing result and error

A response must contain one outcome.

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
  });

  auto parsed = RpcResponse::parse(raw);

  if (std::holds_alternative<RpcError>(parsed))
  {
    const auto &error = std::get<RpcError>(parsed);
    vix::print("parse failed:", error.code);
    return 1;
  }

  return 0;
}
```

A response without `result` or `error` is invalid because it does not describe an RPC outcome.

## Batch responses

When the dispatcher receives a batch request, it returns an array of response objects.

```json
[
  {
    "id": 1,
    "result": {
      "pong": true
    }
  },
  {
    "id": 2,
    "error": {
      "code": "METHOD_NOT_FOUND",
      "message": "RPC method not found",
      "details": {
        "method": "missing.method"
      }
    }
  }
]
```

Notifications inside a batch are executed but do not appear in the response array. If all items in a batch are notifications, the dispatcher returns no response.

## Parse a batch response

A batch response is an array token. Each element can be parsed as a `RpcResponse`.

```cpp
#include <variant>
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  token batch_response = array_t{
      {
          RpcResponse::ok(
              token(1LL),
              obj({
                  "pong", true,
              }))
              .to_json(),
          RpcResponse::fail(
              token(2LL),
              RpcError::method_not_found("missing.method"))
              .to_json(),
      },
  };

  const auto *items = batch_response.as_array_ptr().get();
  if (!items)
  {
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

    const auto &response = std::get<RpcResponse>(parsed);

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

Batch response handling is usually done by a client or adapter layer.

## Response lifetime

`RpcResponse` owns its `id`, `result`, and `error`.

When a response is serialized with `to_json()`, it produces a new token value that can be passed to a transport adapter. The adapter can then serialize that token into the wire format used by HTTP, WebSocket, P2P, CLI, or another channel.

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

  token request = obj({
      "id", 1LL,
      "method", "math.add",
      "params", obj({
          "a", 7LL,
          "b", 5LL,
      }),
  });

  Dispatcher dispatcher(router);

  auto maybe_response = dispatcher.handle(request, "local");

  if (!maybe_response.has_value())
  {
    vix::print("no response");
    return 0;
  }

  auto parsed = RpcResponse::parse(*maybe_response);

  if (std::holds_alternative<RpcError>(parsed))
  {
    const auto &error = std::get<RpcError>(parsed);
    vix::print("invalid response:", error.code);
    return 1;
  }

  const RpcResponse &response = std::get<RpcResponse>(parsed);

  if (!response.ok())
  {
    vix::print("rpc error:", response.error.code);
    vix::print("message:", response.error.message);
    return 1;
  }

  const auto *result = response.result.as_object_ptr().get();
  if (!result)
  {
    vix::print("result must be an object");
    return 1;
  }

  vix::print("sum:", result->get_i64_or("sum", 0));

  return 0;
}
```

This is the normal response path: a request is dispatched, the router result is wrapped by the dispatcher, and the caller inspects the response envelope.

## API overview

| API                              | Purpose                                         |
| -------------------------------- | ----------------------------------------------- |
| `RpcResponse`                    | Value object representing one RPC response.     |
| `RpcResponse::id`                | Echoed request id.                              |
| `RpcResponse::result`            | Success payload.                                |
| `RpcResponse::error`             | Structured error payload.                       |
| `RpcResponse::has_error`         | Indicates whether the response is an error.     |
| `RpcResponse::ok(...)`           | Create a success response.                      |
| `RpcResponse::fail(...)`         | Create an error response.                       |
| `RpcResponse::is_notification()` | Returns `true` when the response id is null.    |
| `RpcResponse::ok()`              | Returns `true` when the response is successful. |
| `RpcResponse::to_json()`         | Serialize the response to a JSON-like token.    |
| `RpcResponse::parse(...)`        | Parse and validate a response envelope.         |

## Next step

Continue with errors to understand how WebRPC represents structured failures and how handlers return them.

- [Errors](./errors)
