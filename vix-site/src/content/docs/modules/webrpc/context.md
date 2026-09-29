# Context

`Context` is the execution object passed to every WebRPC handler.

A handler needs more than the method name. It usually needs the request parameters, the optional request id, the transport label, and sometimes metadata coming from the transport layer. `Context` groups that information into one lightweight read-only object.

The context is created by the router when a request is dispatched. It is meant to live only during the handler call.

```txt
RpcRequest
  -> Router
  -> Context
  -> RpcHandler
```

## Header

Use the public WebRPC header:

```cpp
#include <vix/webrpc/webrpc.hpp>
```

WebRPC context values use the Vix JSON token model:

```cpp
#include <vix/json/Simple.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Basic handler context

Every handler receives a `const Context&`.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  Router router;

  router.add("ping", [](const Context &ctx) -> RpcResult
  {
    vix::print("method:", ctx.method);

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
    vix::print("response created");
  }

  return 0;
}
```

The context gives the handler access to the RPC call without exposing transport-specific details.

## Context fields

`Context` contains the data needed during one handler call.

```cpp
struct Context
{
  std::string_view method;
  const vix::json::token &params;
  const vix::json::token &id;
  std::string_view transport;
  const MetaMap *meta;
};
```

| Field       | Purpose                   |
| ----------- | ------------------------- |
| `method`    | RPC method name.          |
| `params`    | Request parameters.       |
| `id`        | Optional request id.      |
| `transport` | Optional transport label. |
| `meta`      | Optional metadata map.    |

The context does not own the request payload. It stores views and references to data owned by the request and the caller.

## Method name

Use `ctx.method` to read the method being executed.

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

  router.add("system.info", [](const Context &ctx) -> RpcResult
  {
    return obj({
        "method", std::string(ctx.method),
    });
  });

  token request = obj({
      "id", 1LL,
      "method", "system.info",
  });

  Dispatcher dispatcher(router);
  auto response = dispatcher.handle(request, "local");

  if (response.has_value())
  {
    vix::print("method returned in response");
  }

  return 0;
}
```

The method is a `std::string_view`. It should be read during the handler call and not stored for later use.

## Request id

Use `has_id()` to know whether the call expects a response.

```cpp
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
        "has_id", ctx.has_id(),
    });
  });

  token request = obj({
      "id", "req-1",
      "method", "whoami",
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(request, "local");

  if (response.has_value())
  {
    vix::print("request had an id");
  }

  return 0;
}
```

A missing or null id usually means the call is a notification. The handler still runs, but the dispatcher does not return a response for notifications.

## Parameters

`ctx.params` is the raw parameter token from the request.

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

  token request = obj({
      "id", 1LL,
      "method", "echo",
      "params", obj({
          "message", "hello",
      }),
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(request, "local");

  if (response.has_value())
  {
    vix::print("echo response created");
  }

  return 0;
}
```

The context does not validate the meaning of `params`. Each handler decides what shape it expects.

## Check parameter shape

Use `params_is_object()` and `params_is_array()` to check the top-level parameter shape.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  Router router;

  router.add("inspect", [](const Context &ctx) -> RpcResult
  {
    return obj({
        "is_object", ctx.params_is_object(),
        "is_array", ctx.params_is_array(),
    });
  });

  token request = obj({
      "id", 1LL,
      "method", "inspect",
      "params", obj({
          "ok", true,
      }),
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(request, "local");

  if (response.has_value())
  {
    vix::print("params inspected");
  }

  return 0;
}
```

These helpers keep handler code explicit and simple.

## Object parameters

Use `params_object_ptr()` when a handler expects named parameters.

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

`params_object_ptr()` returns `nullptr` when `params` is not an object.

## Array parameters

Use `params_array_ptr()` when a handler expects ordered parameters.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  Router router;

  router.add("math.count", [](const Context &ctx) -> RpcResult
  {
    const auto *params = ctx.params_array_ptr();
    if (!params)
    {
      return RpcError::invalid_params("params must be an array");
    }

    return obj({
        "count", static_cast<long long>(params->elems.size()),
    });
  });

  token request = obj({
      "id", 1LL,
      "method", "math.count",
      "params", array_t{
          {
              token(1LL),
              token(2LL),
              token(3LL),
          },
      },
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(request, "local");

  if (response.has_value())
  {
    vix::print("array params handled");
  }

  return 0;
}
```

This is useful for compact methods where positional input is more natural than object fields.

## Transport label

The transport label is optional and informational.

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

  router.add("transport.name", [](const Context &ctx) -> RpcResult
  {
    return obj({
        "transport", std::string(ctx.transport),
    });
  });

  token request = obj({
      "id", 1LL,
      "method", "transport.name",
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(request, "websocket");

  if (response.has_value())
  {
    vix::print("transport response created");
  }

  return 0;
}
```

A handler can use the label for diagnostics or optional behavior, but the WebRPC core itself remains independent from the transport.

## Metadata map

`Context::MetaMap` stores optional metadata provided by the caller or transport layer.

```cpp
using MetaMap = std::unordered_map<std::string, std::string>;
```

Metadata can contain headers, peer ids, trace ids, authentication tags, or other transport-specific values.

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
        "peer", std::string(ctx.meta_value("peer")),
        "trace_id", std::string(ctx.meta_value("trace_id")),
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

  auto response = dispatcher.handle(request, "p2p", &meta);

  if (response.has_value())
  {
    vix::print("metadata response created");
  }

  return 0;
}
```

The metadata map is optional. When no metadata is provided, metadata accessors return empty or false.

## Read metadata values

Use `meta_value(...)` to read a metadata value.

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

  router.add("peer.name", [](const Context &ctx) -> RpcResult
  {
    std::string_view peer = ctx.meta_value("peer");

    if (peer.empty())
    {
      return RpcError::invalid_params("missing peer metadata");
    }

    return obj({
        "peer", std::string(peer),
    });
  });

  Context::MetaMap meta{
      {"peer", "client-1"},
  };

  token request = obj({
      "id", 1LL,
      "method", "peer.name",
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(request, "websocket", &meta);

  if (response.has_value())
  {
    vix::print("peer response created");
  }

  return 0;
}
```

`meta_value(...)` returns an empty `std::string_view` when the metadata map is absent or when the key does not exist.

## Check metadata presence

Use `has_meta(...)` when the difference between a missing value and an empty value matters.

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

  router.add("trace.check", [](const Context &ctx) -> RpcResult
  {
    return obj({
        "has_trace", ctx.has_meta("trace_id"),
    });
  });

  Context::MetaMap meta{
      {"trace_id", "abc-123"},
  };

  token request = obj({
      "id", 1LL,
      "method", "trace.check",
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(request, "http", &meta);

  if (response.has_value())
  {
    vix::print("trace checked");
  }

  return 0;
}
```

This is useful for optional metadata such as tracing, authentication state, request source, or peer identity.

## Context lifetime

`Context` is a lightweight view. It does not own the request payload.

The following fields are views or references:

| Field       | Lifetime note                                                             |
| ----------- | ------------------------------------------------------------------------- |
| `method`    | `std::string_view`; underlying storage must remain valid during the call. |
| `params`    | Reference to a JSON token owned by the request.                           |
| `id`        | Reference to a JSON token owned by the request.                           |
| `transport` | `std::string_view`; underlying storage must remain valid during the call. |
| `meta`      | Pointer to a metadata map owned by the caller.                            |

The normal router flow guarantees this because the context is created and used immediately.

```txt
request exists
  -> router creates context
  -> handler executes
  -> context is discarded
```

Do not store `Context`, `ctx.method`, `ctx.transport`, or metadata string views for later use.

## Copying context

`Context` is intentionally lightweight. It mainly stores views, references, and a pointer.

Copying it is cheap, but copying does not extend the lifetime of the data it references. A copied context is still only valid while the original request and metadata are valid.

```cpp
router.add("copy.example", [](const vix::webrpc::Context &ctx)
    -> vix::webrpc::RpcResult
{
  vix::webrpc::Context copy = ctx;

  return vix::json::obj({
      "method", std::string(copy.method),
  });
});
```

This is safe inside the handler call. It should not be used to keep context state after dispatch finishes.

## Context and notifications

A notification request has no id. Inside the handler, `ctx.has_id()` returns `false`.

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
    vix::print("has id:", ctx.has_id());

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
    vix::print("notification produced no response");
  }

  return 0;
}
```

The handler can still inspect params, transport, and metadata. The only difference is that the dispatcher does not send a response back.

## Context and direct router dispatch

`Router::dispatch(...)` also creates a context when dispatching a parsed request.

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

  vix::print("direct dispatch succeeded");

  return 0;
}
```

Direct router dispatch is useful in tests, internal calls, or adapters that already parsed the request envelope.

## Context and Dispatcher

`Dispatcher` creates the request, then the router creates the context.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  Router router;

  router.add("ping", [](const Context &ctx) -> RpcResult
  {
    return obj({
        "method", std::string(ctx.method),
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
    vix::print("dispatcher created response");
  }

  return 0;
}
```

This is the normal path for transport adapters because the dispatcher handles parsing, notifications, batch calls, and response wrapping.

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

  router.add("profile.update", [](const Context &ctx) -> RpcResult
  {
    const auto *params = ctx.params_object_ptr();
    if (!params)
    {
      return RpcError::invalid_params("params must be an object");
    }

    const token *name = params->get_ptr("name");
    if (!name || !name->is_string())
    {
      return RpcError::invalid_params("name must be a string");
    }

    std::string_view peer = ctx.meta_value("peer");

    return obj({
        "ok", true,
        "method", std::string(ctx.method),
        "transport", std::string(ctx.transport),
        "peer", std::string(peer),
        "name", name->as_string_or(""),
        "has_id", ctx.has_id(),
    });
  });

  Context::MetaMap meta{
      {"peer", "client-1"},
      {"trace_id", "abc-123"},
  };

  token request = obj({
      "id", "req-1",
      "method", "profile.update",
      "params", obj({
          "name", "Gaspard",
      }),
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(request, "websocket", &meta);

  if (!response.has_value())
  {
    vix::print("no response");
    return 0;
  }

  vix::print("profile.update response created");

  return 0;
}
```

This example shows the normal use of context: read parameters, use metadata when available, include transport information when useful, and return a structured result.

## API overview

| API                            | Purpose                                         |
| ------------------------------ | ----------------------------------------------- |
| `Context`                      | Execution context passed to handlers.           |
| `Context::MetaMap`             | Metadata map type.                              |
| `Context::method`              | RPC method name.                                |
| `Context::params`              | Request parameter token.                        |
| `Context::id`                  | Optional request id token.                      |
| `Context::transport`           | Optional transport label.                       |
| `Context::meta`                | Optional metadata map pointer.                  |
| `Context::has_id()`            | Returns `true` when the request id is not null. |
| `Context::params_is_object()`  | Returns `true` when params is an object.        |
| `Context::params_is_array()`   | Returns `true` when params is an array.         |
| `Context::params_object_ptr()` | Returns params as object pointer or null.       |
| `Context::params_array_ptr()`  | Returns params as array pointer or null.        |
| `Context::meta_value(...)`     | Returns a metadata value or empty view.         |
| `Context::has_meta(...)`       | Returns `true` when metadata contains the key.  |

## Next step

Continue with router to understand how methods are registered, replaced, removed, and dispatched.

- [Router](./router)
