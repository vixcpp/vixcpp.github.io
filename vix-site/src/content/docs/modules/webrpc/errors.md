# Errors

The `webrpc` module represents RPC failures with `RpcError`.

An RPC error is a structured value. It is not an exception and it is not a transport status code. It belongs to the WebRPC response model and can be returned by a handler, produced by request parsing, produced by response parsing, or created by the router when a method does not exist.

A WebRPC error has three parts:

```txt
code
message
details
```

The `code` is stable and machine-readable. The `message` is human-readable. The optional `details` field can contain structured information that helps clients, logs, tests, or transport adapters understand the failure.

## Header

Use the public WebRPC header:

```cpp
#include <vix/webrpc/webrpc.hpp>
```

WebRPC errors use the Vix JSON token model:

```cpp
#include <vix/json/Simple.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Error shape

A serialized WebRPC error is a JSON-like object.

```json
{
  "code": "INVALID_PARAMS",
  "message": "Invalid RPC parameters",
  "details": {
    "reason": "id must be an integer"
  }
}
```

The `details` field is optional. When an error has no details, it is omitted from the serialized object.

```json
{
  "code": "INTERNAL_ERROR",
  "message": "unexpected failure"
}
```

## RpcError

`RpcError` is the C++ value type used to represent one RPC failure.

```cpp
struct RpcError
{
  std::string code;
  std::string message;
  vix::json::token details;
};
```

The type is intentionally small. It can be returned from handlers, embedded in `RpcResponse`, serialized to a token, or parsed back from a token.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  vix::webrpc::RpcError error{
      "INVALID_PARAMS",
      "Invalid RPC parameters"};

  if (error.valid())
  {
    vix::print("code:", error.code);
    vix::print("message:", error.message);
  }

  return 0;
}
```

An error is considered valid when its `code` is not empty.

## Error with details

Use `details` when the caller needs structured context.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  RpcError error{
      "INVALID_PARAMS",
      "Invalid RPC parameters",
      obj({
          "reason", "id must be an integer",
          "field", "id",
      }),
  };

  if (error.has_details())
  {
    vix::print("error has details");
  }

  return 0;
}
```

Details are useful for debugging and client feedback because they keep the error code stable while still carrying extra information about the specific failure.

## Serialize an error

Use `to_json()` or `to_json_token()` to convert an error to a JSON-like token.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  RpcError error = RpcError::invalid_params("id must be an integer");

  token out = error.to_json();

  const auto *object = out.as_object_ptr().get();
  if (!object)
  {
    return 1;
  }

  vix::print("code:", object->get_string_or("code", ""));
  vix::print("message:", object->get_string_or("message", ""));

  return 0;
}
```

When `details` is null, the serialized object contains only `code` and `message`.

## Parse an error

Use `RpcError::parse(...)` when an error token must be validated.

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

  const RpcError &error = parsed.value();

  vix::print("code:", error.code);
  vix::print("message:", error.message);

  return 0;
}
```

`RpcError::parse(...)` does not throw. It returns a small explicit parse result that contains either the parsed error or another `RpcError` explaining why parsing failed.

## RpcErrorParseResult

`RpcErrorParseResult` is the result type returned by `RpcError::parse(...)`.

```cpp
struct RpcErrorParseResult
{
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

This avoids ambiguity between a parsed RPC error and a parsing failure.

## Error parsing rules

`RpcError::parse(...)` validates the error object.

| Rule                                                 | Failure            |
| ---------------------------------------------------- | ------------------ |
| Root value must be an object.                        | `PARSE_ERROR`      |
| `code` must exist.                                   | `PARSE_ERROR`      |
| `message` must exist.                                | `PARSE_ERROR`      |
| `code` must be a string.                             | `PARSE_ERROR`      |
| `message` must be a string.                          | `PARSE_ERROR`      |
| `code` must not be empty.                            | `PARSE_ERROR`      |
| `details`, when present, can be any JSON-like value. | No envelope error. |

The parser validates the error envelope. It does not impose an application-specific shape on `details`.

## Standard error helpers

The module provides standard helper constructors for common RPC failures.

```cpp
RpcError::method_not_found("user.get");
RpcError::invalid_params("params must be an object");
RpcError::parse_error("request must be an object");
RpcError::internal_error("unexpected failure");
```

These helpers keep common error codes consistent across routers, dispatchers, handlers, and tests.

## METHOD_NOT_FOUND

Use `method_not_found(...)` when a request references an RPC method that is not registered.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  vix::webrpc::RpcError error =
      vix::webrpc::RpcError::method_not_found("user.get");

  vix::print("code:", error.code);
  vix::print("message:", error.message);

  return 0;
}
```

The error uses this shape:

```json
{
  "code": "METHOD_NOT_FOUND",
  "message": "RPC method not found",
  "details": {
    "method": "user.get"
  }
}
```

`Router` returns this error automatically when no handler exists for the requested method.

## INVALID_PARAMS

Use `invalid_params(...)` when the request envelope is valid but the method parameters are not acceptable.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  vix::webrpc::RpcError error =
      vix::webrpc::RpcError::invalid_params("id must be an integer");

  vix::print("code:", error.code);

  return 0;
}
```

The error uses this shape:

```json
{
  "code": "INVALID_PARAMS",
  "message": "Invalid RPC parameters",
  "details": {
    "reason": "id must be an integer"
  }
}
```

Handlers should return `INVALID_PARAMS` when `params` has the wrong shape, missing fields, or values with the wrong JSON type.

## PARSE_ERROR

Use `parse_error(...)` when the RPC payload or envelope is malformed.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  vix::webrpc::RpcError error =
      vix::webrpc::RpcError::parse_error("request must be an object");

  vix::print("code:", error.code);
  vix::print("message:", error.message);

  return 0;
}
```

The error uses this shape:

```json
{
  "code": "PARSE_ERROR",
  "message": "Failed to parse RPC payload",
  "details": {
    "reason": "request must be an object"
  }
}
```

`RpcRequest::parse(...)`, `RpcResponse::parse(...)`, and `RpcError::parse(...)` use parse errors when the envelope itself is malformed.

## INTERNAL_ERROR

Use `internal_error(...)` when an RPC method fails because of an internal condition.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/print.hpp>

int main()
{
  vix::webrpc::RpcError error =
      vix::webrpc::RpcError::internal_error("database unavailable");

  vix::print("code:", error.code);
  vix::print("message:", error.message);

  return 0;
}
```

This error does not add structured details by default.

```json
{
  "code": "INTERNAL_ERROR",
  "message": "database unavailable"
}
```

Use this for unexpected failures that are not caused by the request shape or parameters.

## Return errors from handlers

A handler returns `RpcResult`, which is either a JSON result token or an `RpcError`.

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

  vix::print("handler registered");

  return 0;
}
```

The handler does not need to build a response envelope. It only returns a result or an error. The dispatcher wraps that value into `RpcResponse` when the request expects a response.

## Error response from Dispatcher

When a request has an id and the handler returns `RpcError`, the dispatcher creates an error response.

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

The response contains the original request id and the structured error object.

```json
{
  "id": 1,
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Invalid RPC parameters",
    "details": {
      "reason": "params must be an object"
    }
  }
}
```

## Errors in notifications

A notification has no id, so the dispatcher does not return a response.

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

The handler still executes. The returned error is intentionally not sent back because the request has no id.

## Errors in batch calls

In a batch request, each request with an id can produce its own error response.

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
              "method", "missing.method",
          }),
          obj({
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

The notification item is executed but omitted from the batch response. The missing method item produces a `METHOD_NOT_FOUND` error response.

## Parse request errors

`RpcRequest::parse(...)` returns `RpcError` when the request envelope is invalid.

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
    vix::print("message:", error.message);

    return 1;
  }

  return 0;
}
```

A missing method is an invalid request envelope and returns `INVALID_PARAMS`.

## Parse response errors

`RpcResponse::parse(...)` returns `RpcError` when the response envelope is invalid.

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
      "error", RpcError::internal_error("ambiguous response").to_json(),
  });

  auto parsed = RpcResponse::parse(raw);

  if (std::holds_alternative<RpcError>(parsed))
  {
    const auto &error = std::get<RpcError>(parsed);

    vix::print("response parse error:", error.code);
    return 1;
  }

  return 0;
}
```

A response cannot contain both `result` and `error`.

## Custom application errors

Applications can define their own error codes.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  RpcError error{
      "USER_NOT_FOUND",
      "User was not found",
      obj({
          "id", 42LL,
      }),
  };

  vix::print("code:", error.code);

  return 0;
}
```

Custom codes should be stable and machine-readable. A good code is short, uppercase, and specific enough for clients to handle.

## Error details

The `details` token can hold any JSON-like value.

```cpp
#include <vix/webrpc/webrpc.hpp>
#include <vix/json/Simple.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::json;
  using namespace vix::webrpc;

  RpcError error{
      "VALIDATION_FAILED",
      "Validation failed",
      obj({
          "field", "email",
          "reason", "invalid email format",
      }),
  };

  token serialized = error.to_json();

  const auto *object = serialized.as_object_ptr().get();
  if (!object)
  {
    return 1;
  }

  const token *details = object->get_ptr("details");
  if (details)
  {
    vix::print("details available");
  }

  return 0;
}
```

Use details for structured context, not for replacing the main error code. The code should still be useful on its own.

## Keep messages readable

The `message` field is meant for humans. It should explain the failure without requiring the caller to inspect internal code.

Good examples:

```txt
Invalid RPC parameters
RPC method not found
Failed to parse RPC payload
User was not found
```

Transport adapters and client libraries can display the message directly, log it, or map the code to localized messages.

## Error code recommendations

Use stable codes because clients may depend on them.

```txt
METHOD_NOT_FOUND
INVALID_PARAMS
PARSE_ERROR
INTERNAL_ERROR
USER_NOT_FOUND
VALIDATION_FAILED
UNAUTHORIZED
FORBIDDEN
```

Avoid putting dynamic values inside the code. Put dynamic values in `details`.

```json
{
  "code": "USER_NOT_FOUND",
  "message": "User was not found",
  "details": {
    "id": 42
  }
}
```

This makes the error easier to handle in clients and tests.

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
          "b", "bad",
      }),
  });

  Dispatcher dispatcher(router);

  auto maybe_response = dispatcher.handle(request, "local");

  if (!maybe_response.has_value())
  {
    vix::print("no response");
    return 0;
  }

  auto parsed_response = RpcResponse::parse(*maybe_response);

  if (std::holds_alternative<RpcError>(parsed_response))
  {
    const auto &error = std::get<RpcError>(parsed_response);
    vix::print("invalid response:", error.code);
    return 1;
  }

  const RpcResponse &response = std::get<RpcResponse>(parsed_response);

  if (!response.ok())
  {
    vix::print("rpc error code:", response.error.code);
    vix::print("rpc error message:", response.error.message);

    if (response.error.has_details())
    {
      vix::print("rpc error has details");
    }

    return 1;
  }

  vix::print("rpc call succeeded");

  return 0;
}
```

This example shows the full error path: a handler validates parameters, returns `RpcError`, the dispatcher wraps it into an error response, and the caller parses the response.

## API overview

| API                               | Purpose                                             |
| --------------------------------- | --------------------------------------------------- |
| `RpcError`                        | Structured RPC failure value.                       |
| `RpcError::code`                  | Stable machine-readable error code.                 |
| `RpcError::message`               | Human-readable error message.                       |
| `RpcError::details`               | Optional structured error details.                  |
| `RpcError::valid()`               | Returns `true` when the code is not empty.          |
| `RpcError::has_details()`         | Returns `true` when details are not null.           |
| `RpcError::to_json_token()`       | Serialize the error to a JSON-like token.           |
| `RpcError::to_json()`             | Alias for `to_json_token()`.                        |
| `RpcError::parse(...)`            | Parse and validate an error object.                 |
| `RpcError::method_not_found(...)` | Create a `METHOD_NOT_FOUND` error.                  |
| `RpcError::invalid_params(...)`   | Create an `INVALID_PARAMS` error.                   |
| `RpcError::parse_error(...)`      | Create a `PARSE_ERROR` error.                       |
| `RpcError::internal_error(...)`   | Create an `INTERNAL_ERROR` error.                   |
| `RpcErrorParseResult`             | Explicit result returned by `RpcError::parse(...)`. |

## Next step

Continue with context to understand what each RPC handler receives during execution.

- [Context](./context)
