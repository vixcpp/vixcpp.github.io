# Quick Start

The `webrpc` module gives Vix applications a small RPC core that is independent from the transport.

A WebRPC call starts as a JSON-like `vix::json::token`. The dispatcher parses the request envelope, sends the method to a router, executes the matching handler, and returns a response token when a response is expected.

The basic workflow is:

```txt
create router
  -> register methods
  -> create dispatcher
  -> pass request token
  -> receive response token
```

## Header

Use the public WebRPC header:

```cpp
#include <vix/webrpc/webrpc.hpp>
```

WebRPC uses the Vix JSON token model:

```cpp
#include <vix/json/Simple.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Create a router

A `Router` stores RPC method handlers.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  vix::webrpc::Router router;

  vix::print("router created");

  return 0;
}
```

The router is transport-agnostic. It does not know whether the call came from HTTP, WebSocket, P2P, CLI, or a local adapter.

## Register a method

Use `router.add(...)` to register a method name and a handler.

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

  vix::print("registered methods:", router.size());

  return 0;
}
```

A handler receives a `Context` and returns `RpcResult`.

```cpp
using RpcResult =
    std::variant<vix::json::token, vix::webrpc::RpcError>;
```

Returning a `vix::json::token` means success. Returning `RpcError` means failure.

## Dispatch a request

Create a request token and pass it to `Dispatcher`.

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

  if (!response.has_value())
  {
    vix::print("no response");
    return 0;
  }

  vix::print("response created");

  return 0;
}
```

The dispatcher returns `std::optional<vix::json::token>`. A normal request with an `id` produces a response. A notification without an `id` produces no response.

## Inspect the response

A successful response contains `id` and `result`.

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
  if (!response.has_value())
  {
    return 1;
  }

  const auto *response_object = response->as_object_ptr().get();
  if (!response_object)
  {
    return 1;
  }

  const token *result = response_object->get_ptr("result");
  if (!result)
  {
    return 1;
  }

  const auto *result_object = result->as_object_ptr().get();
  if (!result_object)
  {
    return 1;
  }

  vix::print("pong:", result_object->get_bool_or("pong", false));

  return 0;
}
```

In most real applications, a transport adapter serializes the response token back to the client. Local tests and examples can inspect the token directly.

## Read parameters

Handlers read input through `Context::params`.

```cpp
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

  if (response.has_value())
  {
    vix::print("math.add response created");
  }

  return 0;
}
```

Handlers are responsible for validating the shape and type of their own parameters. If parameters are invalid, return `RpcError::invalid_params(...)`.

## Return an error

A handler can return a structured `RpcError`.

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

    const token *id = params->get_ptr("id");
    if (!id || !id->is_i64())
    {
      return RpcError::invalid_params("id must be an integer");
    }

    return obj({
        "id", id->as_i64_or(0),
        "name", "Gaspard",
    });
  });

  token request = obj({
      "id", 1LL,
      "method", "user.get",
      "params", obj({
          "id", "bad",
      }),
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

The dispatcher wraps the returned error into a response envelope:

```json
{
  "id": 1,
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Invalid RPC parameters",
    "details": {
      "reason": "id must be an integer"
    }
  }
}
```

## Handle missing methods

If a request calls a method that is not registered, the router returns `METHOD_NOT_FOUND`.

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

The error response keeps the failure explicit and machine-readable.

## Use notifications

A request without an `id` is a notification.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  Router router;

  router.add("events.track", [](const Context &ctx) -> RpcResult
  {
    const auto *params = ctx.params_object_ptr();
    if (!params)
    {
      return RpcError::invalid_params("params must be an object");
    }

    vix::print("event received");

    return obj({
        "ok", true,
    });
  });

  token notification = obj({
      "method", "events.track",
      "params", obj({
          "name", "page.open",
      }),
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(notification, "local");

  if (!response.has_value())
  {
    vix::print("notification handled without response");
  }

  return 0;
}
```

The handler is still executed, but the dispatcher returns no response. This is useful for fire-and-forget events.

## Use batch calls

The dispatcher can handle an array of request objects.

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
              "id", 2LL,
              "method", "ping",
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

A batch response is an array of response objects. Notifications inside a batch are executed, but they are not included in the response array.

## Pass metadata

Transport adapters can pass metadata to handlers through the context.

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
    const auto peer = ctx.meta_value("peer");

    return obj({
        "peer", std::string(peer),
        "transport", std::string(ctx.transport),
    });
  });

  Context::MetaMap meta{
      {"peer", "client-1"},
      {"trace_id", "abc-123"},
  };

  token request = obj({
      "id", 1LL,
      "method", "whoami",
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(request, "websocket", &meta);

  if (response.has_value())
  {
    vix::print("metadata response created");
  }

  return 0;
}
```

Metadata is optional. It is useful for headers, peer ids, trace ids, authentication context, or transport-specific tags.

## Direct router dispatch

Use `Router::dispatch(...)` directly when you already have a parsed request and do not need response wrapping.

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

  vix::print("router dispatch succeeded");

  return 0;
}
```

Use `Router` directly for internal calls, tests, or custom dispatch flows. Use `Dispatcher` when you want request parsing, batch handling, notifications, and response envelopes.

## Complete example

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

  router.add("ping", [](const Context &) -> RpcResult
  {
    return obj({
        "pong", true,
    });
  });

  Dispatcher dispatcher(router);

  token request = obj({
      "id", 1LL,
      "method", "math.add",
      "params", obj({
          "a", 7LL,
          "b", 5LL,
      }),
  });

  auto response = dispatcher.handle(request, "local");

  if (!response.has_value())
  {
    vix::print("no response");
    return 0;
  }

  const auto *response_object = response->as_object_ptr().get();
  if (!response_object)
  {
    vix::print("invalid response");
    return 1;
  }

  if (const token *error = response_object->get_ptr("error"))
  {
    const auto parsed = RpcError::parse(*error);

    if (parsed.ok())
    {
      vix::print("rpc error:", parsed.value().code);
    }

    return 1;
  }

  const token *result = response_object->get_ptr("result");
  if (!result)
  {
    vix::print("missing result");
    return 1;
  }

  const auto *result_object = result->as_object_ptr().get();
  if (!result_object)
  {
    vix::print("invalid result");
    return 1;
  }

  vix::print("sum:", result_object->get_i64_or("sum", 0));

  return 0;
}
```

This is the normal WebRPC path: register handlers, dispatch a token, and inspect the response.

## What to remember

WebRPC does not replace a transport layer. It gives the transport layer a stable RPC core.

An HTTP adapter, WebSocket adapter, P2P adapter, or CLI adapter can all use the same router and dispatcher. The adapter only needs to convert incoming data into a `vix::json::token`, call the dispatcher, and send the response token back when one exists.

## Next step

Continue with requests to understand the request envelope, parsing rules, request ids, parameters, and notification behavior.

- [Requests](./requests)
- [Responses](./responses)
- [Errors](./errors)
- [Context](./context)
- [Router](./router)
- [Dispatcher](./dispatcher)
