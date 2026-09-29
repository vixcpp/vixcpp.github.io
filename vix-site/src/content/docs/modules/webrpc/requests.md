# Requests

The `webrpc` module represents one RPC call with `RpcRequest`.

A request is the input envelope that tells WebRPC which method should be executed, which parameters should be passed to the handler, and whether the caller expects a response. The request model is intentionally small because WebRPC is not tied to HTTP, WebSocket, P2P, CLI, or any other transport.

A transport adapter only needs to produce a `vix::json::token` that follows the request shape. After that, WebRPC can parse it, route it, and execute the matching handler.

## Header

Use the public WebRPC header:

```cpp
#include <vix/webrpc/webrpc.hpp>
```

WebRPC requests use the Vix JSON token model:

```cpp
#include <vix/json/Simple.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Request shape

A WebRPC request is a JSON-like object.

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

The `method` field is required. The `id` and `params` fields are optional.

| Field    | Required | Meaning                                     |
| -------- | -------- | ------------------------------------------- |
| `method` | Yes      | RPC method name.                            |
| `id`     | No       | Request id used for request-response calls. |
| `params` | No       | Parameters passed to the handler.           |

The request envelope is independent from the transport. The same shape can be used by an HTTP adapter, a WebSocket adapter, a P2P adapter, a CLI adapter, or an in-process caller.

## RpcRequest

`RpcRequest` is the C++ value type used by WebRPC.

```cpp
struct RpcRequest
{
  vix::json::token id;
  std::string method;
  vix::json::token params;
};
```

The request stores the id, method name, and parameters as explicit values.

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
      "math.add",
      obj({
          "a", 7LL,
          "b", 5LL,
      }),
  };

  vix::print("method:", request.method);
  vix::print("has id:", request.has_id());

  return 0;
}
```

This form is useful in tests, local calls, or internal code that already knows the request fields.

## Parse a request

Most transport adapters start with a raw `vix::json::token`. Use `RpcRequest::parse(...)` to validate the envelope.

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
      "method", "math.add",
      "params", obj({
          "a", 7LL,
          "b", 5LL,
      }),
  });

  auto parsed = RpcRequest::parse(raw);

  if (std::holds_alternative<RpcError>(parsed))
  {
    const auto &error = std::get<RpcError>(parsed);
    vix::print("request error:", error.code);
    return 1;
  }

  const auto &request = std::get<RpcRequest>(parsed);

  vix::print("method:", request.method);

  return 0;
}
```

Parsing returns either a valid `RpcRequest` or an `RpcError`. This keeps request validation explicit and exception-free.

## Parsing rules

`RpcRequest::parse(...)` applies the request envelope rules before a handler is called.

| Rule                                                    | Failure            |
| ------------------------------------------------------- | ------------------ |
| Root value must be an object.                           | `PARSE_ERROR`      |
| `method` must exist.                                    | `INVALID_PARAMS`   |
| `method` must be a non-empty string.                    | `INVALID_PARAMS`   |
| `id`, when present, must be `null`, string, or integer. | `INVALID_PARAMS`   |
| `params`, when present, can be any JSON-like value.     | No envelope error. |

The request parser checks the envelope only. It does not validate the application meaning of `params`. Each handler is responsible for validating its own parameter shape.

## Method name

The method identifies which handler should be executed.

```json
{
  "id": 1,
  "method": "user.get"
}
```

The method must be a non-empty string.

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
      "method", "",
  });

  auto parsed = RpcRequest::parse(raw);

  if (std::holds_alternative<RpcError>(parsed))
  {
    const auto &error = std::get<RpcError>(parsed);

    vix::print("code:", error.code);
    vix::print("message:", error.message);

    return 1;
  }

  return 0;
}
```

Method naming is an application decision. Names such as `user.get`, `math.add`, `events.track`, and `system.ping` are simple and readable.

## Request id

The `id` identifies a request-response call.

```json
{
  "id": "req-1",
  "method": "ping"
}
```

A request id can be:

```txt
null
string
integer
```

When the id is present and not null, `has_id()` returns `true`.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  RpcRequest request{
      token("req-1"),
      "ping",
      token(nullptr),
  };

  if (request.has_id())
  {
    vix::print("request expects a response");
  }

  return 0;
}
```

The dispatcher echoes the same id in the response envelope.

## Notification requests

A request without an id is treated as a notification.

```json
{
  "method": "events.track",
  "params": {
    "name": "page.open"
  }
}
```

A notification is still dispatched to its handler, but the dispatcher does not return a response.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  token raw = obj({
      "method", "events.track",
      "params", obj({
          "name", "page.open",
      }),
  });

  auto parsed = RpcRequest::parse(raw);

  if (std::holds_alternative<RpcRequest>(parsed))
  {
    const auto &request = std::get<RpcRequest>(parsed);

    vix::print("has id:", request.has_id());
  }

  return 0;
}
```

Notifications are useful for fire-and-forget events, telemetry, local messages, and commands where the caller does not need a result.

## Null id

A request with `"id": null` behaves like a notification because the parsed id is null.

```json
{
  "id": null,
  "method": "events.track",
  "params": {
    "name": "page.open"
  }
}
```

In C++, this means:

```cpp
request.has_id() == false
```

The dispatcher uses that rule to decide whether a response should be returned.

## Parameters

The `params` field is optional and can contain any JSON-like value.

Object parameters are common:

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

Array parameters are also allowed:

```json
{
  "id": 1,
  "method": "math.sum",
  "params": [1, 2, 3]
}
```

A method can also omit params:

```json
{
  "id": 1,
  "method": "ping"
}
```

The request envelope does not force one parameter shape. The handler decides what it expects.

## Object parameters

Use `params_object_ptr()` when the handler expects an object.

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
      "math.add",
      obj({
          "a", 7LL,
          "b", 5LL,
      }),
  };

  const auto *params = request.params_object_ptr();

  if (!params)
  {
    vix::print("params must be an object");
    return 1;
  }

  vix::print("a:", params->get_i64_or("a", 0));
  vix::print("b:", params->get_i64_or("b", 0));

  return 0;
}
```

The pointer is null when `params` is not an object.

## Array parameters

Use `params_array_ptr()` when the handler expects an array.

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
      "math.sum",
      array_t{
          {
              token(1LL),
              token(2LL),
              token(3LL),
          },
      },
  };

  const auto *params = request.params_array_ptr();

  if (!params)
  {
    vix::print("params must be an array");
    return 1;
  }

  vix::print("items:", params->elems.size());

  return 0;
}
```

This is useful for methods where ordered arguments are more natural than named fields.

## Read one parameter by key

Use `param_ptr(...)` when `params` is expected to be an object and you need one field.

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
      "user.get",
      obj({
          "id", 42LL,
      }),
  };

  const token *id = request.param_ptr("id");

  if (!id || !id->is_i64())
  {
    vix::print("id must be an integer");
    return 1;
  }

  vix::print("user id:", id->as_i64_or(0));

  return 0;
}
```

`param_ptr(...)` returns null when `params` is not an object or when the key does not exist.

## Serialize a request

Use `to_json()` to convert a request back into a JSON-like token.

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

  token out = request.to_json();

  const auto *object = out.as_object_ptr().get();
  if (!object)
  {
    return 1;
  }

  vix::print("method:", object->get_string_or("method", ""));

  return 0;
}
```

When the request id is null, `to_json()` omits `id`. When params are null, it omits `params`. This keeps notification and minimal request envelopes clean.

## Invalid request object

If the root value is not an object, parsing returns a parse error.

```cpp
#include <variant>
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  token raw = array_t{
      {
          token("not"),
          token("an"),
          token("object"),
      },
  };

  auto parsed = RpcRequest::parse(raw);

  if (std::holds_alternative<RpcError>(parsed))
  {
    const auto &error = std::get<RpcError>(parsed);

    vix::print("code:", error.code);
    vix::print("message:", error.message);

    return 1;
  }

  return 0;
}
```

This protects the router from receiving a malformed envelope.

## Missing method

A request without `method` is invalid.

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

  auto parsed = RpcRequest::parse(raw);

  if (std::holds_alternative<RpcError>(parsed))
  {
    const auto &error = std::get<RpcError>(parsed);

    vix::print("code:", error.code);

    return 1;
  }

  return 0;
}
```

The returned error uses `INVALID_PARAMS` because the request object exists, but the required field is missing.

## Invalid id type

The id must be null, a string, or an integer.

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
      "id", obj({
          "bad", true,
      }),
      "method", "ping",
  });

  auto parsed = RpcRequest::parse(raw);

  if (std::holds_alternative<RpcError>(parsed))
  {
    const auto &error = std::get<RpcError>(parsed);

    vix::print("code:", error.code);
    vix::print("message:", error.message);

    return 1;
  }

  return 0;
}
```

Keeping request ids simple makes response correlation predictable across transports.

## Use requests with Router

`Router::dispatch(...)` can receive a parsed `RpcRequest`.

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

  vix::print("request dispatched");

  return 0;
}
```

This is useful when code already has a request object and does not need a response envelope.

## Use requests with Dispatcher

`Dispatcher` is the normal entry point when the input is still a raw token.

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

  token raw = obj({
      "id", 1LL,
      "method", "ping",
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(raw, "local");

  if (response.has_value())
  {
    vix::print("response created");
  }

  return 0;
}
```

The dispatcher parses the request, calls the router, and wraps the result into a response object when the request has an id.

## Request lifetime

`RpcRequest` owns its `id`, `method`, and `params`.

When a request is dispatched through `Router`, the router builds a `Context` that holds references and views into the request. That context is intended to live only during the handler call.

This means the normal lifecycle is safe and simple:

```txt
RpcRequest exists
  -> Router builds Context
  -> handler executes immediately
  -> Context is discarded
```

Do not store the `Context` or views derived from it beyond the handler call.

## Request and transport

A request does not store transport behavior.

Transport information is passed separately when dispatching:

```cpp
dispatcher.handle(payload, "http");
router.dispatch(request, "websocket");
```

Inside the handler, the transport label is visible through `Context::transport`.

```cpp
router.add("whoami", [](const vix::webrpc::Context &ctx)
    -> vix::webrpc::RpcResult
{
  return vix::json::obj({
      "transport", std::string(ctx.transport),
  });
});
```

The transport label is informational. WebRPC keeps the request envelope stable across all transports.

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

  token raw = obj({
      "id", "req-1",
      "method", "math.add",
      "params", obj({
          "a", 7LL,
          "b", 5LL,
      }),
  });

  auto parsed = RpcRequest::parse(raw);

  if (std::holds_alternative<RpcError>(parsed))
  {
    const auto &error = std::get<RpcError>(parsed);

    vix::print("invalid request:");
    vix::print("code:", error.code);
    vix::print("message:", error.message);

    return 1;
  }

  const RpcRequest &request = std::get<RpcRequest>(parsed);

  vix::print("method:", request.method);
  vix::print("has id:", request.has_id());

  const auto *params = request.params_object_ptr();
  if (!params)
  {
    vix::print("params must be an object");
    return 1;
  }

  const token *a = params->get_ptr("a");
  const token *b = params->get_ptr("b");

  if (!a || !b || !a->is_i64() || !b->is_i64())
  {
    vix::print("a and b must be integers");
    return 1;
  }

  vix::print("a:", a->as_i64_or(0));
  vix::print("b:", b->as_i64_or(0));

  return 0;
}
```

This example only parses and inspects the request. In normal WebRPC usage, the parsed request is passed to a router or the raw token is passed to a dispatcher.

## API overview

| API                               | Purpose                                      |
| --------------------------------- | -------------------------------------------- |
| `RpcRequest`                      | Value object representing one RPC call.      |
| `RpcRequest::id`                  | Optional request id.                         |
| `RpcRequest::method`              | Required RPC method name.                    |
| `RpcRequest::params`              | Optional parameter token.                    |
| `RpcRequest::has_id()`            | Returns `true` when the id is not null.      |
| `RpcRequest::valid()`             | Returns `true` when the method is not empty. |
| `RpcRequest::to_json()`           | Serializes the request to a JSON-like token. |
| `RpcRequest::parse(...)`          | Parses and validates a request envelope.     |
| `RpcRequest::params_object_ptr()` | Returns params as object pointer or null.    |
| `RpcRequest::params_array_ptr()`  | Returns params as array pointer or null.     |
| `RpcRequest::param_ptr(...)`      | Returns one object parameter by key or null. |

## Next step

Continue with responses to understand how WebRPC wraps successful results and structured errors into response envelopes.

- [Responses](./responses)
