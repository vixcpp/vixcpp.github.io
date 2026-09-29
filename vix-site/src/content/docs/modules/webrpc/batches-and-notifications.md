# Batches and Notifications

The `webrpc` module supports both notification calls and batch calls through `Dispatcher`.

A notification is a request without a response. It is useful when the caller wants to send an event or command but does not need a result. A batch is an array of request objects handled together. It is useful when a caller wants to send several RPC calls in one payload.

Both features are handled at the dispatcher level. The router still executes each method normally. The dispatcher decides whether a response should be returned.

```txt
payload
  -> Dispatcher
  -> single request or batch
  -> Router
  -> handler
  -> response only when an id exists
```

## Header

Use the public WebRPC header:

```cpp
#include <vix/webrpc/webrpc.hpp>
```

WebRPC payloads use the Vix JSON token model:

```cpp
#include <vix/json/Simple.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Notification request

A notification is a request without an `id`.

```json
{
  "method": "events.track",
  "params": {
    "name": "page.open"
  }
}
```

The dispatcher executes the handler, but it returns no response.

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

The handler result is intentionally ignored by the dispatcher because the request has no id.

## Null id notification

A request with `"id": null` is also treated as a notification.

```json
{
  "id": null,
  "method": "events.track",
  "params": {
    "name": "page.open"
  }
}
```

In C++, the parsed request id is null, so `has_id()` returns `false`.

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
    return obj({
        "has_id", ctx.has_id(),
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

This keeps notification behavior consistent whether the id is omitted or explicitly null.

## Notification errors

A notification can still fail inside the handler, but the dispatcher does not return that error to the caller.

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
    return RpcError::invalid_params("event payload is invalid");
  });

  token notification = obj({
      "method", "events.track",
  });

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(notification, "local");

  if (!response.has_value())
  {
    vix::print("notification error produced no response");
  }

  return 0;
}
```

This is part of the notification contract. A call without an id does not have a response channel in WebRPC.

## Request-response call

A request with an id produces a response.

```json
{
  "id": 1,
  "method": "ping"
}
```

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
    vix::print("request produced a response");
  }

  return 0;
}
```

The dispatcher wraps the handler result into a `RpcResponse` because the id is present.

## Batch request

A batch request is an array of request objects.

```json
[
  {
    "id": 1,
    "method": "ping"
  },
  {
    "id": 2,
    "method": "ping"
  }
]
```

The dispatcher returns an array of response objects.

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

The response token is an array because the input payload was an array.

## Inspect a batch response

Each item in a batch response is a normal `RpcResponse`.

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
              "method", "ping",
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

This is useful in tests and client-side adapters that need to inspect every response entry.

## Batch with notifications

A batch can contain both request-response calls and notifications.

```json
[
  {
    "id": 1,
    "method": "ping"
  },
  {
    "method": "events.track"
  },
  {
    "id": 2,
    "method": "ping"
  }
]
```

Notifications are executed, but they are not included in the response array.

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
    vix::print("mixed batch response created");
  }

  return 0;
}
```

In this example, the response array contains two entries: one for `id = 1` and one for `id = 2`. The notification is omitted.

## Batch of only notifications

If every item in a batch is a notification, the dispatcher returns no response.

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
    vix::print("all notifications handled without response");
  }

  return 0;
}
```

This follows the same rule as a single notification: no id means no response.

## Empty batch

An empty batch is invalid.

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
  Dispatcher dispatcher(router);

  token batch = array_t{};

  auto response = dispatcher.handle(batch, "local");

  if (!response.has_value())
  {
    return 1;
  }

  auto parsed = RpcResponse::parse(*response);

  if (std::holds_alternative<RpcError>(parsed))
  {
    return 1;
  }

  const RpcResponse &rpc_response = std::get<RpcResponse>(parsed);

  if (!rpc_response.ok())
  {
    vix::print("error:", rpc_response.error.code);
  }

  return 0;
}
```

The dispatcher returns an error response with `id = null` and an `INVALID_PARAMS` error because an empty batch does not contain any calls to process.

## Invalid batch item

Each batch item must be an object. If an item is not an object, the dispatcher adds an error response for that item and continues with the rest of the batch.

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
    vix::print("batch response contains an item error and a success response");
  }

  return 0;
}
```

This gives batch handling a best-effort behavior. One bad item does not prevent later valid items from being processed.

## Malformed request inside a batch

If a batch item is an object but not a valid request envelope, that item produces an error response with `id = null`.

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

Processing continues after the malformed item. The valid `ping` request still runs.

## Missing method inside a batch

If a batch item references a method that is not registered, that item receives a `METHOD_NOT_FOUND` response.

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
              "method", "missing.method",
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
    vix::print("batch response includes method-not-found and success");
  }

  return 0;
}
```

The dispatcher does not stop the batch when one item fails. Each request-response item receives its own outcome.

## Handler errors inside a batch

A handler can return `RpcError` for one batch item while other items succeed.

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

  token batch = array_t{
      {
          obj({
              "id", 1LL,
              "method", "math.add",
              "params", obj({
                  "a", 7LL,
                  "b", "bad",
              }),
          }),
          obj({
              "id", 2LL,
              "method", "math.add",
              "params", obj({
                  "a", 7LL,
                  "b", 5LL,
              }),
          }),
      },
  };

  Dispatcher dispatcher(router);

  auto response = dispatcher.handle(batch, "local");

  if (response.has_value())
  {
    vix::print("batch response includes error and success");
  }

  return 0;
}
```

The first item produces an `INVALID_PARAMS` error response. The second item produces a success response.

## Metadata in batch calls

The same transport label and metadata pointer are passed to every item in the batch.

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
    });
  });

  Context::MetaMap meta{
      {"peer", "client-1"},
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

Metadata belongs to the caller or transport adapter. The dispatcher only passes it through during handling.

## Response order

The dispatcher appends responses in the order it processes batch items.

Notifications are skipped because they do not produce responses. This means the response array keeps the relative order of the request-response items, not necessarily the same length as the input batch.

```txt
input batch:
  request id=1
  notification
  request id=2

response batch:
  response id=1
  response id=2
```

This behavior is important for clients that match responses by id rather than by array index.

## Best-effort processing

Batch processing is best-effort.

A malformed item, a missing method, or a handler error does not stop the dispatcher from processing later items. Each item is handled independently as much as possible.

This makes batches useful for mixed workloads where one failing request should not prevent unrelated calls from running.

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

  router.add("ping", [](const Context &) -> RpcResult
  {
    return obj({
        "pong", true,
    });
  });

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
              "method", "math.add",
              "params", obj({
                  "a", 7LL,
                  "b", "bad",
              }),
          }),
          obj({
              "id", 3LL,
              "method", "math.add",
              "params", obj({
                  "a", 7LL,
                  "b", 5LL,
              }),
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

This example shows the full behavior: a normal request, a notification, a request that returns an error, and a request that succeeds. The notification runs but does not appear in the response array.

## Rules summary

| Input                             | Behavior                                                     |
| --------------------------------- | ------------------------------------------------------------ |
| Single request with id            | Handler runs and response is returned.                       |
| Single request without id         | Handler runs and no response is returned.                    |
| Single request with `id: null`    | Handler runs and no response is returned.                    |
| Batch with request-response items | Response array is returned.                                  |
| Batch with notifications          | Notifications run and are omitted from response array.       |
| Batch of only notifications       | No response is returned.                                     |
| Empty batch                       | Error response with `id = null`.                             |
| Non-object batch item             | Error response entry with `id = null`; processing continues. |
| Malformed request item            | Error response entry with `id = null`; processing continues. |
| Missing method item               | Error response entry for that item; processing continues.    |
| Handler error item                | Error response entry for that item; processing continues.    |

## API overview

| API                           | Purpose                                               |
| ----------------------------- | ----------------------------------------------------- |
| `Dispatcher::handle(...)`     | Handles single payloads and batch payloads.           |
| `Dispatcher::handle_one(...)` | Handles one request object.                           |
| `RpcRequest::has_id()`        | Determines whether a request expects a response.      |
| `Context::has_id()`           | Lets a handler know whether the call has an id.       |
| `RpcResponse::ok(...)`        | Creates a success response.                           |
| `RpcResponse::fail(...)`      | Creates an error response.                            |
| `RpcResponse::parse(...)`     | Parses response entries when inspecting batch output. |

## Next step

Continue with metadata to understand how transport adapters can pass headers, peer ids, trace ids, and other contextual values into handlers.

- [Metadata](./metadata)
