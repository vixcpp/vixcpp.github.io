# Router

`Router` is the method registry and execution layer of the `webrpc` module.

A router maps RPC method names to C++ handlers. When a request is dispatched, the router validates the request, finds the matching handler, builds a `Context`, and executes the handler synchronously. The router does not create response envelopes. It only returns a `RpcResult`, which is either a success token or a structured `RpcError`.

This keeps the routing layer focused:

```txt
RpcRequest
  -> Router
  -> Context
  -> RpcHandler
  -> RpcResult
```

The dispatcher can then wrap that result into a `RpcResponse` when a response is expected.

## Header

Use the public WebRPC header:

```cpp
#include <vix/webrpc/webrpc.hpp>
```

WebRPC handlers use the Vix JSON token model:

```cpp
#include <vix/json/Simple.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Basic router

Create a router and register a method with `add(...)`.

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

The method name is an application-level name such as `ping`, `math.add`, `user.get`, or `events.track`.

## Handler signature

A WebRPC handler receives a `Context` and returns `RpcResult`.

```cpp
using RpcHandler =
    std::function<RpcResult(const Context &)>;
```

`RpcResult` is a variant:

```cpp
using RpcResult =
    std::variant<vix::json::token, RpcError>;
```

Returning a `vix::json::token` means the call succeeded. Returning `RpcError` means the call failed.

```cpp
router.add("system.info", [](const vix::webrpc::Context &ctx)
    -> vix::webrpc::RpcResult
{
  return vix::json::obj({
      "method", std::string(ctx.method),
  });
});
```

The router does not throw to report normal RPC failures. Handlers return errors as values.

## Register a method

Use `add(name, handler)` to register a method.

```cpp
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

  if (router.has("echo"))
  {
    vix::print("echo registered");
  }

  return 0;
}
```

If a method with the same name already exists, `add(...)` replaces it.

## Replace a method

Calling `add(...)` again with the same method name replaces the previous handler.

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
        "version", 1LL,
    });
  });

  router.add("ping", [](const Context &) -> RpcResult
  {
    return obj({
        "version", 2LL,
    });
  });

  vix::print("registered methods:", router.size());

  return 0;
}
```

Replacement is useful during setup when a module wants to override a default handler with an application-specific handler.

## Remove a method

Use `remove(...)` to unregister a method.

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

  bool removed = router.remove("ping");

  vix::print("removed:", removed);
  vix::print("registered methods:", router.size());

  return 0;
}
```

`remove(...)` returns `true` when a handler was removed and `false` when no method existed with that name.

## Check whether a method exists

Use `has(...)` to test whether a method is registered.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  Router router;

  router.add("user.get", [](const Context &) -> RpcResult
  {
    return obj({
        "ok", true,
    });
  });

  if (router.has("user.get"))
  {
    vix::print("user.get exists");
  }

  return 0;
}
```

This is useful for tests, diagnostics, and module setup code.

## Count registered methods

Use `size()` to get the number of registered handlers.

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

  router.add("echo", [](const Context &ctx) -> RpcResult
  {
    return ctx.params;
  });

  vix::print("method count:", router.size());

  return 0;
}
```

The count reflects the number of unique method names currently registered.

## Dispatch a parsed request

Use `dispatch(const RpcRequest&, ...)` when you already have a parsed request.

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

This form is useful in tests, internal calls, and adapters that have already parsed the request envelope.

## Dispatch a raw token

Use `dispatch(const vix::json::token&, ...)` when you have a raw request token and want the router to parse a single request object.

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

  RpcResult result = router.dispatch(raw, "local");

  if (std::holds_alternative<RpcError>(result))
  {
    const auto &error = std::get<RpcError>(result);

    vix::print("error:", error.code);
    return 1;
  }

  vix::print("raw dispatch succeeded");

  return 0;
}
```

This helper only handles a single request object. Use `Dispatcher` when you need response wrapping, notifications, or batch handling.

## Read parameters in a handler

Handlers read request parameters through the `Context`.

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

    return obj({
        "sum", a->as_i64_or(0) + b->as_i64_or(0),
    });
  });

  RpcRequest request{
      token(1LL),
      "math.add",
      obj({
          "a", 7LL,
          "b", 5LL,
      }),
  };

  RpcResult result = router.dispatch(request, "local");

  if (std::holds_alternative<RpcError>(result))
  {
    return 1;
  }

  vix::print("math.add dispatched");

  return 0;
}
```

A handler should validate its own parameter shape and return `RpcError::invalid_params(...)` when the input is not acceptable.

## Return a success token

A successful handler returns a JSON-like token.

```cpp
router.add("user.get", [](const vix::webrpc::Context &)
    -> vix::webrpc::RpcResult
{
  return vix::json::obj({
      "id", 1LL,
      "name", "Gaspard",
  });
});
```

The router returns this token as the success side of `RpcResult`. The dispatcher can later wrap it into:

```json
{
  "id": 1,
  "result": {
    "id": 1,
    "name": "Gaspard"
  }
}
```

## Return a structured error

A failing handler returns `RpcError`.

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

The router does not convert errors into response envelopes. It returns the error as `RpcResult`. The dispatcher performs response wrapping when needed.

## Method not found

When a method is not registered, the router returns `RpcError::method_not_found(...)`.

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

  RpcRequest request{
      token(1LL),
      "missing.method",
      token(nullptr),
  };

  RpcResult result = router.dispatch(request, "local");

  if (std::holds_alternative<RpcError>(result))
  {
    const auto &error = std::get<RpcError>(result);

    vix::print("code:", error.code);
    vix::print("message:", error.message);

    return 1;
  }

  return 0;
}
```

The error includes the missing method name in `details`.

## Invalid request

When the parsed request has an empty method, the router returns `INVALID_PARAMS`.

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

  RpcRequest request;
  request.method = "";

  RpcResult result = router.dispatch(request, "local");

  if (std::holds_alternative<RpcError>(result))
  {
    const auto &error = std::get<RpcError>(result);

    vix::print("code:", error.code);
    return 1;
  }

  return 0;
}
```

This protects handler execution from invalid request values.

## Transport label

The router accepts an optional transport label and passes it into the context.

```cpp
#include <string>
#include <variant>
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  Router router;

  router.add("transport.name", [](const Context &ctx) -> RpcResult
  {
    return obj({
        "transport", std::string(ctx.transport),
    });
  });

  RpcRequest request{
      token(1LL),
      "transport.name",
      token(nullptr),
  };

  RpcResult result = router.dispatch(request, "websocket");

  if (std::holds_alternative<RpcError>(result))
  {
    return 1;
  }

  vix::print("transport dispatched");

  return 0;
}
```

The transport label is informational. It allows handlers to inspect where the call came from without coupling the router to a transport implementation.

## Metadata

The router can pass metadata into the handler context.

```cpp
#include <string>
#include <variant>
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
        "peer", std::string(ctx.meta_value("peer")),
        "trace_id", std::string(ctx.meta_value("trace_id")),
    });
  });

  Context::MetaMap meta{
      {"peer", "client-1"},
      {"trace_id", "abc-123"},
  };

  RpcRequest request{
      token(1LL),
      "whoami",
      token(nullptr),
  };

  RpcResult result = router.dispatch(request, "p2p", &meta);

  if (std::holds_alternative<RpcError>(result))
  {
    return 1;
  }

  vix::print("metadata dispatched");

  return 0;
}
```

Metadata is owned by the caller. The context only stores a pointer to it during dispatch.

## Router and notifications

The router itself does not decide whether a response should be returned.

A notification is represented by a request with a null id, but the router still executes the handler normally.

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

  router.add("events.track", [](const Context &ctx) -> RpcResult
  {
    vix::print("has id:", ctx.has_id());

    return obj({
        "ok", true,
    });
  });

  RpcRequest request{
      token(nullptr),
      "events.track",
      obj({
          "name", "page.open",
      }),
  };

  RpcResult result = router.dispatch(request, "local");

  if (std::holds_alternative<RpcError>(result))
  {
    return 1;
  }

  vix::print("notification dispatched by router");

  return 0;
}
```

The dispatcher is responsible for suppressing responses for notifications.

## Router and Dispatcher

Use `Router` for registering methods and executing parsed requests. Use `Dispatcher` when the input is a payload that needs request parsing, batch handling, notification handling, and response wrapping.

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
    vix::print("dispatcher wrapped router result");
  }

  return 0;
}
```

This is the normal application flow. The router owns the method table, and the dispatcher owns the RPC envelope flow.

## Router lifetime

`Dispatcher` stores a reference to a router. The router must outlive the dispatcher.

```cpp
vix::webrpc::Router router;
vix::webrpc::Dispatcher dispatcher(router);
```

This is intentional. The router is usually part of the application setup, while the dispatcher is a small orchestration object that uses that router.

## Handler lifetime

Handlers are stored inside the router.

If a handler captures references, those referenced objects must outlive the router or at least outlive every dispatch that may call the handler.

```cpp
struct Service
{
  vix::json::token ping() const
  {
    return vix::json::obj({
        "pong", true,
    });
  }
};

Service service;

router.add("ping", [&service](const vix::webrpc::Context &)
    -> vix::webrpc::RpcResult
{
  return service.ping();
});
```

This is normal C++ ownership. The router does not manage captured service lifetimes.

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

  token raw = obj({
      "id", 1LL,
      "method", "math.add",
      "params", obj({
          "a", 7LL,
          "b", 5LL,
      }),
  });

  RpcResult result = router.dispatch(raw, "local");

  if (std::holds_alternative<RpcError>(result))
  {
    const auto &error = std::get<RpcError>(result);

    vix::print("rpc error:", error.code);
    vix::print("message:", error.message);

    return 1;
  }

  const token &value = std::get<token>(result);

  const auto *object = value.as_object_ptr().get();
  if (!object)
  {
    vix::print("result must be an object");
    return 1;
  }

  vix::print("sum:", object->get_i64_or("sum", 0));

  return 0;
}
```

This example uses the router directly. It parses a raw request token, dispatches it to the registered method, and inspects the raw handler result.

## API overview

| API                                              | Purpose                                         |
| ------------------------------------------------ | ----------------------------------------------- |
| `RpcResult`                                      | Handler result: success token or `RpcError`.    |
| `RpcHandler`                                     | Handler function signature.                     |
| `Router`                                         | Method registry and synchronous dispatch layer. |
| `Router::add(...)`                               | Register or replace a method handler.           |
| `Router::remove(...)`                            | Remove a method handler by name.                |
| `Router::size()`                                 | Return the number of registered methods.        |
| `Router::has(...)`                               | Check whether a method exists.                  |
| `Router::dispatch(const RpcRequest&, ...)`       | Dispatch a parsed request.                      |
| `Router::dispatch(const vix::json::token&, ...)` | Parse and dispatch one raw request object.      |

## Next step

Continue with dispatcher to understand request parsing, response wrapping, notifications, and batch handling.

- [Dispatcher](./dispatcher)
