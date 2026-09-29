# Metadata

The `webrpc` module lets transports pass optional metadata into RPC handlers.

Metadata is not part of the RPC request envelope. It belongs to the layer that received the call. An HTTP adapter may attach headers, a WebSocket adapter may attach a peer id, a P2P adapter may attach node information, and a local adapter may attach tracing data. WebRPC keeps this information separate from `params` so the method input stays clean while the handler can still inspect useful execution context.

The flow is:

```txt
transport adapter
  -> metadata map
  -> Dispatcher or Router
  -> Context
  -> handler
```

## Header

Use the public WebRPC header:

```cpp
#include <vix/webrpc/webrpc.hpp>
```

WebRPC metadata often appears together with JSON responses:

```cpp
#include <vix/json/Simple.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Metadata map

Metadata is represented by `Context::MetaMap`.

```cpp
using MetaMap =
    std::unordered_map<std::string, std::string>;
```

The map is optional. A dispatcher or router call can pass a pointer to metadata:

```cpp
Context::MetaMap meta{
    {"peer", "client-1"},
    {"trace_id", "abc-123"},
};

auto response = dispatcher.handle(payload, "websocket", &meta);
```

The context stores only a pointer to this map. The caller owns the metadata and must keep it alive during dispatch.

## Basic metadata usage

A handler reads metadata through `Context`.

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

  auto response = dispatcher.handle(request, "websocket", &meta);

  if (response.has_value())
  {
    vix::print("metadata response created");
  }

  return 0;
}
```

The metadata values are available only during the handler call.

## Read a metadata value

Use `meta_value(...)` to read one metadata value.

```cpp
std::string_view value = ctx.meta_value("peer");
```

If the metadata map is missing or the key does not exist, the function returns an empty view.

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

  auto response = dispatcher.handle(request, "p2p", &meta);

  if (response.has_value())
  {
    vix::print("peer metadata handled");
  }

  return 0;
}
```

This is useful when metadata is required by a handler.

## Check whether metadata exists

Use `has_meta(...)` when the difference between a missing key and an empty value matters.

```cpp
bool exists = ctx.has_meta("trace_id");
```

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
    vix::print("trace metadata checked");
  }

  return 0;
}
```

This keeps optional metadata handling explicit.

## Metadata with Dispatcher

`Dispatcher::handle(...)` accepts metadata and passes it to every handler involved in the payload.

```cpp
std::optional<vix::json::token> handle(
    const vix::json::token &payload,
    std::string_view transport = {},
    const Context::MetaMap *meta = nullptr) const;
```

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

  router.add("request.info", [](const Context &ctx) -> RpcResult
  {
    return obj({
        "transport", std::string(ctx.transport),
        "peer", std::string(ctx.meta_value("peer")),
    });
  });

  Context::MetaMap meta{
      {"peer", "client-1"},
  };

  token request = obj({
      "id", 1LL,
      "method", "request.info",
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(request, "websocket", &meta);

  if (response.has_value())
  {
    vix::print("request info response created");
  }

  return 0;
}
```

The dispatcher does not interpret metadata. It only carries the pointer into the handler context.

## Metadata with Router

`Router::dispatch(...)` also accepts metadata.

```cpp
RpcResult dispatch(
    const RpcRequest &req,
    std::string_view transport = {},
    const Context::MetaMap *meta = nullptr) const;
```

Example:

```cpp
#include <variant>
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
        "transport", std::string(ctx.transport),
    });
  });

  Context::MetaMap meta{
      {"peer", "client-1"},
  };

  RpcRequest request{
      token(1LL),
      "whoami",
      token(nullptr),
  };

  RpcResult result = router.dispatch(request, "local", &meta);

  if (std::holds_alternative<RpcError>(result))
  {
    const auto &error = std::get<RpcError>(result);
    vix::print("error:", error.code);
    return 1;
  }

  vix::print("metadata dispatch succeeded");

  return 0;
}
```

This is useful in tests or internal calls where the request is already parsed.

## Metadata in batch calls

When a batch is dispatched, the same metadata pointer is passed to every item in the batch.

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

  token batch = array_t{
      {
          obj({
              "id", 1LL,
              "method", "whoami",
          }),
          obj({
              "id", 2LL,
              "method", "whoami",
          }),
      },
  };

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(batch, "websocket", &meta);

  if (response.has_value())
  {
    vix::print("batch metadata response created");
  }

  return 0;
}
```

This is useful when all calls in one payload came from the same connection, peer, request, or transport event.

## Metadata and notifications

Notifications also receive metadata.

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

  router.add("events.track", [](const Context &ctx) -> RpcResult
  {
    vix::print("peer:", ctx.meta_value("peer"));
    vix::print("event received");

    return obj({
        "ok", true,
    });
  });

  Context::MetaMap meta{
      {"peer", "client-1"},
  };

  token notification = obj({
      "method", "events.track",
      "params", obj({
          "name", "page.open",
      }),
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(notification, "websocket", &meta);

  if (!response.has_value())
  {
    vix::print("notification handled without response");
  }

  return 0;
}
```

The handler can use metadata during execution. The dispatcher still returns no response because the request has no id.

## Missing metadata

Metadata is optional. A handler must be able to handle a missing metadata map when the metadata is not required.

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

  router.add("optional.peer", [](const Context &ctx) -> RpcResult
  {
    std::string_view peer = ctx.meta_value("peer");

    return obj({
        "peer", std::string(peer),
        "has_peer", ctx.has_meta("peer"),
    });
  });

  token request = obj({
      "id", 1LL,
      "method", "optional.peer",
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(request, "local");

  if (response.has_value())
  {
    vix::print("optional metadata response created");
  }

  return 0;
}
```

When no map is passed, `meta_value(...)` returns an empty view and `has_meta(...)` returns `false`.

## Required metadata

Some handlers may require metadata. In that case, return a structured error when it is missing.

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

  router.add("secure.action", [](const Context &ctx) -> RpcResult
  {
    if (!ctx.has_meta("user_id"))
    {
      return RpcError::invalid_params("missing user_id metadata");
    }

    return obj({
        "ok", true,
        "user_id", std::string(ctx.meta_value("user_id")),
    });
  });

  token request = obj({
      "id", 1LL,
      "method", "secure.action",
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(request, "http");

  if (response.has_value())
  {
    vix::print("secure action response created");
  }

  return 0;
}
```

This keeps metadata validation explicit and visible in the handler.

## Metadata and params

Metadata should not replace `params`.

Use `params` for method input. Use metadata for execution context around the call.

```txt
params:
  user id requested by the method
  product id
  command arguments
  form data
  method payload

metadata:
  peer id
  trace id
  transport name
  authenticated user id
  headers converted by the adapter
  source address or connection tag
```

Keeping these separate makes handlers easier to reason about. The method payload remains the method payload, while metadata describes the environment in which the call arrived.

## Metadata and transport

The transport label and metadata often work together.

```cpp
return obj({
    "transport", std::string(ctx.transport),
    "peer", std::string(ctx.meta_value("peer")),
});
```

The transport label is a simple name such as `http`, `websocket`, `p2p`, or `local`. Metadata carries additional values that are specific to that transport event.

## Lifetime rules

`Context` does not own metadata. It stores a pointer.

This means the metadata map must outlive the dispatch call.

```cpp
Context::MetaMap meta{
    {"trace_id", "abc-123"},
};

auto response = dispatcher.handle(payload, "http", &meta);
```

This is safe because `meta` remains alive while `handle(...)` is executing.

Do not store `ctx.meta`, metadata string views, or `Context` itself beyond the handler call.

## String view lifetime

`meta_value(...)` returns `std::string_view`.

The returned view points into the `std::string` stored in the metadata map. It is valid only while the map is alive and unchanged.

```cpp
router.add("example", [](const vix::webrpc::Context &ctx)
    -> vix::webrpc::RpcResult
{
  std::string_view peer = ctx.meta_value("peer");

  return vix::json::obj({
      "peer", std::string(peer),
  });
});
```

Convert the value to `std::string` when it must be stored in a JSON result or kept beyond immediate inspection.

## Building metadata in an adapter

A transport adapter can build metadata before calling the dispatcher.

```cpp
vix::webrpc::Context::MetaMap meta;
meta["trace_id"] = "abc-123";
meta["peer"] = "client-1";

auto response = dispatcher.handle(payload, "http", &meta);
```

For an HTTP adapter, metadata may come from headers. For a WebSocket adapter, it may come from connection state. For a P2P adapter, it may come from peer identity. WebRPC does not require a fixed metadata schema.

## Complete example

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

  router.add("session.info", [](const Context &ctx) -> RpcResult
  {
    if (!ctx.has_meta("session_id"))
    {
      return RpcError::invalid_params("missing session_id metadata");
    }

    const auto *params = ctx.params_object_ptr();
    if (!params)
    {
      return RpcError::invalid_params("params must be an object");
    }

    const token *verbose = params->get_ptr("verbose");

    return obj({
        "transport", std::string(ctx.transport),
        "session_id", std::string(ctx.meta_value("session_id")),
        "trace_id", std::string(ctx.meta_value("trace_id")),
        "verbose", verbose && verbose->is_bool()
            ? verbose->as_bool_or(false)
            : false,
    });
  });

  Context::MetaMap meta{
      {"session_id", "sess-123"},
      {"trace_id", "trace-456"},
  };

  token request = obj({
      "id", 1LL,
      "method", "session.info",
      "params", obj({
          "verbose", true,
      }),
  });

  Dispatcher dispatcher(router);

  auto maybe_response = dispatcher.handle(request, "http", &meta);

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

  vix::print("session:", result->get_string_or("session_id", ""));
  vix::print("trace:", result->get_string_or("trace_id", ""));

  return 0;
}
```

This example shows a handler that uses both method parameters and metadata. The `verbose` value belongs to `params`, while `session_id` and `trace_id` belong to metadata.

## Common metadata keys

WebRPC does not enforce metadata names, but these names are practical in adapters:

| Key           | Meaning                                    |
| ------------- | ------------------------------------------ |
| `trace_id`    | Request or message trace id.               |
| `peer`        | Peer or client identifier.                 |
| `session_id`  | Session identifier.                        |
| `user_id`     | Authenticated user id.                     |
| `request_id`  | Transport-level request id.                |
| `remote_addr` | Remote address or endpoint label.          |
| `auth_scheme` | Authentication scheme used by the adapter. |

Keep metadata names stable inside one application so handlers and tests can rely on them.

## API overview

| API                                 | Purpose                                                  |
| ----------------------------------- | -------------------------------------------------------- |
| `Context::MetaMap`                  | Metadata map type.                                       |
| `Context::meta`                     | Optional metadata map pointer.                           |
| `Context::meta_value(...)`          | Read a metadata value or return an empty view.           |
| `Context::has_meta(...)`            | Check whether a metadata key exists.                     |
| `Dispatcher::handle(..., meta)`     | Pass metadata through the dispatcher.                    |
| `Dispatcher::handle_one(..., meta)` | Pass metadata for a single request.                      |
| `Router::dispatch(..., meta)`       | Pass metadata through direct router dispatch.            |
| `Context::transport`                | Optional transport label related to the metadata source. |

## Next step

Continue with the API reference for a compact list of the public types and functions exposed by the WebRPC module.

- [API Reference](./api-reference)
