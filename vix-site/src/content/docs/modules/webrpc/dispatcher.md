# Dispatcher

`Dispatcher` is the request orchestration layer of the `webrpc` module.

The router knows how to execute a parsed RPC method. The dispatcher handles the higher-level RPC envelope flow around that router. It receives a JSON-like payload, parses it as a request or a batch of requests, dispatches each call through the router, and wraps results into response envelopes when a response is expected.

The dispatcher is still transport-agnostic. It does not read sockets, parse HTTP bodies, manage WebSocket frames, or send bytes. A transport adapter gives it a `vix::json::token`, and the dispatcher returns an optional response token.

The normal flow is:

```txt
payload token
  -> Dispatcher
  -> RpcRequest::parse
  -> Router::dispatch
  -> RpcResponse
  -> response token
```

## Header

Use the public WebRPC header:

```cpp
#include <vix/webrpc/webrpc.hpp>
```

WebRPC dispatcher payloads use the Vix JSON token model:

```cpp
#include <vix/json/Simple.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Basic dispatcher

A dispatcher is created from an existing router.

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
    vix::print("response created");
  }

  return 0;
}
```

The dispatcher stores a reference to the router. The router must outlive the dispatcher.

## Dispatcher responsibility

The dispatcher handles the parts of RPC that sit above method routing.

It supports:

```txt
single request payloads
batch request payloads
notifications
malformed request envelopes
response wrapping
```

It does not own the method registry. That belongs to `Router`.

It does not own the transport. That belongs to an adapter above WebRPC.

## Handle a payload

Use `handle(...)` when the input may be a single request object or a batch array.

```cpp
std::optional<vix::json::token> handle(
    const vix::json::token &payload,
    std::string_view transport = {},
    const Context::MetaMap *meta = nullptr) const;
```

The return type is optional because notifications do not produce responses.

```cpp
auto response = dispatcher.handle(payload, "http");

if (response.has_value())
{
  // Send or inspect the response token.
}
else
{
  // Notification or batch of only notifications.
}
```

A response token can be a single response object or an array of response objects.

## Single request

When the payload is an object, the dispatcher handles it as one RPC call.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  Router router;

  router.add("system.ping", [](const Context &) -> RpcResult
  {
    return obj({
        "pong", true,
    });
  });

  token request = obj({
      "id", "req-1",
      "method", "system.ping",
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(request, "local");

  if (!response.has_value())
  {
    vix::print("no response");
    return 1;
  }

  vix::print("single response created");

  return 0;
}
```

The dispatcher parses the request, executes the method through the router, and returns a response token because the request has an id.

## Inspect a single response

A single response payload is a response object.

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

  token request = obj({
      "id", 1LL,
      "method", "ping",
  });

  Dispatcher dispatcher(router);

  auto maybe_response = dispatcher.handle(request, "local");

  if (!maybe_response.has_value())
  {
    return 1;
  }

  auto parsed = RpcResponse::parse(*maybe_response);

  if (std::holds_alternative<RpcError>(parsed))
  {
    const auto &error = std::get<RpcError>(parsed);
    vix::print("invalid response:", error.code);
    return 1;
  }

  const RpcResponse &response = std::get<RpcResponse>(parsed);

  if (response.ok())
  {
    vix::print("rpc call succeeded");
  }

  return 0;
}
```

A transport adapter usually serializes the response token directly. Tests and local tools can parse it back into `RpcResponse`.

## Handler error response

When a handler returns `RpcError`, the dispatcher wraps it into an error response.

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

The response token contains `error` instead of `result`.

## Method not found

When the router cannot find the requested method, the dispatcher returns an error response.

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

The response uses `METHOD_NOT_FOUND` and includes the missing method name in error details.

## Malformed request

If the request envelope is malformed, the dispatcher returns an error response with `id = null`.

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

  token payload = obj({
      "id", 1LL,
  });

  auto response = dispatcher.handle(payload, "local");

  if (response.has_value())
  {
    vix::print("parse error response created");
  }

  return 0;
}
```

The dispatcher uses a null id because a malformed request may not have a reliable id that can be safely echoed.

## Notifications

A request without an id is a notification.

```json
{
  "method": "events.track",
  "params": {
    "name": "page.open"
  }
}
```

The dispatcher still executes the handler, but it returns no response.

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

    vix::print("event tracked");

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

Even if the handler returns a result or an error, the dispatcher suppresses the response because there is no id.

## Null id notifications

A request with `"id": null` is also treated as a notification.

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
      "id", token(nullptr),
      "method", "events.track",
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(notification, "local");

  if (!response.has_value())
  {
    vix::print("null id notification produced no response");
  }

  return 0;
}
```

The dispatcher checks the parsed request id. If it is null, no response is returned.

## Batch requests

When the payload is an array, the dispatcher handles it as a batch.

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

The returned token is an array of response objects.

## Batch with notifications

Notifications inside a batch are executed but omitted from the response array.

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

  router.add("events.track", [](const Context &) -> RpcResult
  {
    vix::print("event notification handled");

    return obj({
        "ok", true,
    });
  });

  token batch = array_t{
      {
          obj({
              "id", 1LL,
              "method", "ping",
          }),
          obj({
              "method", "events.track",
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
    vix::print("batch response contains only request-response items");
  }

  return 0;
}
```

The response array contains responses for `id = 1` and `id = 2`. The notification is not included.

## Batch of only notifications

If a batch contains only notifications, the dispatcher returns no response.

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
    vix::print("notification handled");

    return obj({
        "ok", true,
    });
  });

  token batch = array_t{
      {
          obj({
              "method", "events.track",
          }),
          obj({
              "method", "events.track",
          }),
      },
  };

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(batch, "local");

  if (!response.has_value())
  {
    vix::print("batch of notifications produced no response");
  }

  return 0;
}
```

This keeps notification semantics consistent for both single calls and batches.

## Empty batch

An empty batch is invalid.

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

  token batch = array_t{};

  auto response = dispatcher.handle(batch, "local");

  if (response.has_value())
  {
    vix::print("empty batch error response created");
  }

  return 0;
}
```

The dispatcher returns an error response with `id = null` and an `INVALID_PARAMS` error.

## Invalid batch item

A batch item must be an object. Non-object items produce an error response entry, and processing continues for the remaining items.

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
          token("bad item"),
          obj({
              "id", 1LL,
              "method", "ping",
          }),
      },
  };

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(batch, "local");

  if (response.has_value())
  {
    vix::print("batch response contains item error and success response");
  }

  return 0;
}
```

This gives batch processing a best-effort behavior. One malformed item does not prevent the dispatcher from handling valid items that follow.

## Inspect a batch response

A batch response is an array token.

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

  token batch = array_t{
      {
          obj({
              "id", 1LL,
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
    return 1;
  }

  const auto *items = maybe_response->as_array_ptr().get();
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

Batch responses are usually handled by client-side or adapter code.

## Transport label

The dispatcher accepts an optional transport label and passes it through to handlers.

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

The label is informational. WebRPC does not change its behavior based on the transport.

## Metadata

The dispatcher can pass metadata into handler context.

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

Metadata is owned by the caller. The dispatcher only passes a pointer through to the router and context during dispatch.

## handle_one

Use `handle_one(...)` when you explicitly want to handle a single request object and receive an `RpcResponse`.

```cpp
std::optional<RpcResponse> handle_one(
    const vix::json::token &payload,
    std::string_view transport = {},
    const Context::MetaMap *meta = nullptr) const;
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

  token request = obj({
      "id", 1LL,
      "method", "ping",
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle_one(request, "local");

  if (response.has_value() && response->ok())
  {
    vix::print("single call succeeded");
  }

  return 0;
}
```

If the request is a notification, `handle_one(...)` returns `std::nullopt`.

## handle versus handle_one

Use `handle(...)` for normal transport adapters because it accepts both single calls and batches.

Use `handle_one(...)` when the code already knows the payload is one request object and wants an `RpcResponse` value before serialization.

```txt
handle(...)
  -> accepts object or array
  -> returns optional token

handle_one(...)
  -> accepts one request object
  -> returns optional RpcResponse
```

Most application adapters should use `handle(...)`.

## Dispatcher and Router

The dispatcher depends on the router but does not own it.

```cpp
vix::webrpc::Router router;
vix::webrpc::Dispatcher dispatcher(router);
```

The router must remain alive for as long as the dispatcher can be used.

The router stores handlers. The dispatcher uses the router to execute parsed requests and then builds response envelopes around the router result.

## Dispatcher in a transport adapter

A transport adapter can be small because the dispatcher handles the WebRPC envelope.

```txt
receive bytes
  -> parse bytes into vix::json::token
  -> dispatcher.handle(payload, transport, &meta)
  -> if response exists, serialize token
  -> send response
```

The adapter remains responsible for the transport details. The dispatcher remains responsible for the RPC details.

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

  const auto *responses = maybe_response->as_array_ptr().get();
  if (!responses)
  {
    vix::print("response must be an array");
    return 1;
  }

  for (const auto &item : responses->elems)
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

This example shows the dispatcher handling a mixed batch: one successful request, one notification, and one missing method. The notification is executed but omitted from the response array.

## API overview

| API                                     | Purpose                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `Dispatcher`                            | Transport-agnostic RPC request orchestration layer.                             |
| `Dispatcher::Dispatcher(const Router&)` | Create a dispatcher bound to an existing router.                                |
| `Dispatcher::handle(...)`               | Handle a single payload or batch payload and return an optional response token. |
| `Dispatcher::handle_one(...)`           | Handle one request object and return an optional `RpcResponse`.                 |
| `Router`                                | Method registry used by the dispatcher.                                         |
| `RpcRequest::parse(...)`                | Used by the dispatcher to parse request envelopes.                              |
| `RpcResponse::ok(...)`                  | Used by the dispatcher for successful calls.                                    |
| `RpcResponse::fail(...)`                | Used by the dispatcher for failed calls.                                        |
| `Context::MetaMap`                      | Optional metadata passed through to handlers.                                   |

## Next step

Continue with batches and notifications to understand the exact behavior of batch arrays, notification calls, empty batches, and mixed payloads.

- [Batches and Notifications](./batches-and-notifications)
