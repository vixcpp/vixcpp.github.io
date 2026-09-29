# Bodies

A request body is the data sent with an outgoing HTTP request.

In `vix::requests`, bodies are represented by `vix::requests::Body`. The body object stores the payload, remembers what kind of body it is, and carries an optional `Content-Type` value. Methods such as `POST`, `PUT`, and `PATCH` usually send a body. Methods such as `GET` and `HEAD` normally do not.

The module provides helpers for the body shapes used most often in application code: JSON, form-url-encoded data, raw text, and binary data.

## Basic idea

A body is passed to request methods that send data.

```cpp id="ckymw0"
auto response = vix::requests::post(
    "https://example.com/api/items",
    vix::requests::json_body(R"({"name":"Vix"})"));
```

The body helper keeps the call clear. The caller does not have to manually set `Content-Type` for common formats, and the request module can add the right `Content-Length` when the request is serialized.

## Send JSON

Use `json_body` when sending JSON text.

```cpp id="u6qh7v"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    vix::requests::RequestOptions options;
    options.headers.set("Accept", "application/json");

    auto response = vix::requests::post(
        "https://example.com/api/items",
        vix::requests::json_body(R"({"name":"Vix","type":"tooling"})"),
        options);

    response.raise_for_status();

    vix::print("status:", response.status_code());
    vix::print("body:", response.text());

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request failed:", error.what());
    return 1;
  }
}
```

Run it:

```bash id="ec6ydj"
vix run main.cpp
```

`json_body` stores the payload as text and uses `application/json` as the content type. It does not parse or validate the JSON; it sends the text you give it.

## Send form data

Use `form_body` for `application/x-www-form-urlencoded` data. This format is common for simple form submissions and login-like endpoints.

```cpp id="f7704d"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    auto response = vix::requests::post(
        "https://example.com/login",
        vix::requests::form_body({
          {"username", "gaspard"},
          {"project", "Vix Requests"}
        }));

    response.raise_for_status();

    vix::print("status:", response.status_code());
    vix::print("response:", response.text());

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request failed:", error.what());
    return 1;
  }
}
```

The form helper encodes the fields using form-url-encoded rules. Spaces are encoded as `+`, and reserved characters are percent-encoded.

```cpp id="jw3gjs"
auto body = vix::requests::form_body({
  {"name", "Vix Requests"},
  {"symbol", "a+b&c=d"}
});

vix::print(body.text());
```

Output shape:

```txt id="e4ce7q"
name=Vix+Requests&symbol=a%2Bb%26c%3Dd
```

You can also build the form body from a `Params` object.

```cpp id="fsp2pq"
vix::requests::Params fields;

fields.set("username", "gaspard");
fields.set("project", "Vix Requests");

auto body = vix::requests::form_body(fields);
```

## Send raw text

Use `raw_body` when the payload is text but does not fit one of the built-in helpers.

```cpp id="cs5rk8"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  try
  {
    auto response = vix::requests::post(
        "https://example.com/events",
        vix::requests::raw_body(
            "event=startup",
            "text/plain"));

    response.raise_for_status();

    vix::print("status:", response.status_code());

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request failed:", error.what());
    return 1;
  }
}
```

The second argument is optional. Use it when the server expects a specific content type.

```cpp id="d9rn1n"
auto body = vix::requests::raw_body(
    "<message>Hello</message>",
    "application/xml");
```

If no content type is given, the body is still sent, but no `Content-Type` is added from the body itself.

## Send binary data

Use `binary_body` when the payload should be treated as bytes.

```cpp id="nrqq2i"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

#include <vector>

int main()
{
  try
  {
    std::vector<unsigned char> data = {
      0x00,
      0x01,
      0x02,
      0xFF
    };

    auto response = vix::requests::post(
        "https://example.com/upload/raw",
        vix::requests::binary_body(
            data,
            "application/octet-stream"));

    response.raise_for_status();

    vix::print("status:", response.status_code());

    return 0;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request failed:", error.what());
    return 1;
  }
}
```

The body internally stores bytes in a string because HTTP request payloads are byte sequences. Use `bytes()` when you need the payload back as `std::vector<unsigned char>`.

```cpp id="z4etjk"
auto body = vix::requests::binary_body(
    std::vector<unsigned char>{0x01, 0x02},
    "application/octet-stream");

auto bytes = body.bytes();

vix::print("size:", bytes.size());
```

## Body type

Each body has a `BodyType`.

```cpp id="irfw0y"
auto body = vix::requests::json_body(R"({"ok":true})");

vix::print("type:", vix::requests::to_string(body.type()));
vix::print("size:", body.size());
vix::print("content type:", body.content_type());
```

The public body types are:

```txt id="tq5j9x"
Empty
Raw
Json
Form
Binary
```

The type is mostly useful when code needs to inspect or debug how a body was built. Normal request code usually does not need to branch on it.

## Empty bodies

A default `Body` is empty.

```cpp id="jqozop"
vix::requests::Body body;

vix::print("empty:", body.empty());
vix::print("size:", body.size());
```

Helpers also produce an empty body when the payload has no data.

```cpp id="qdcfcn"
auto body = vix::requests::json_body("");

vix::print("type:", vix::requests::to_string(body.type()));
vix::print("empty:", body.empty());
```

An empty body is not serialized as request data. This matters for methods where a body is optional.

## Content type

A body may carry a content type.

```cpp id="d9hnox"
auto json = vix::requests::json_body(R"({"name":"Vix"})");

vix::print(json.has_content_type());
vix::print(json.content_type());
```

The common helpers set the content type for you.

```txt id="n1l0z9"
json_body      -> application/json
form_body      -> application/x-www-form-urlencoded
binary_body    -> caller-provided content type, when provided
raw_body       -> caller-provided content type, when provided
```

When a request has a body and no explicit `Content-Type` header, the request module uses the content type from the body. If the caller sets `Content-Type` manually in `RequestOptions`, that explicit header is preserved.

```cpp id="z3ujc5"
vix::requests::RequestOptions options;

options.headers.set("Content-Type", "application/custom");

auto response = vix::requests::post(
    "https://example.com/api",
    vix::requests::json_body(R"({"name":"Vix"})"),
    options);
```

This request uses `application/custom` because the explicit header takes priority.

## Content length

When a request has a body, the module can add `Content-Length` during serialization if the caller did not already provide it.

```cpp id="gu8ozr"
auto body = vix::requests::json_body(R"({"name":"Vix"})");

vix::print("size:", body.size());
```

The size is the number of bytes in the stored payload. For most text payloads in these examples, that also matches the number of characters, but the important value for HTTP is the byte size.

## Body accessors

A `Body` exposes the stored payload in a few forms.

```cpp id="nswe1v"
auto body = vix::requests::raw_body("hello", "text/plain");

vix::print("text:", body.text());
vix::print("data:", body.data());
vix::print("size:", body.size());
vix::print("empty:", body.empty());
```

`text()` and `data()` return the same stored string. The name you use should match the intent of the code. Use `text()` when the payload is text. Use `data()` when the payload may be raw bytes.

Use `bytes()` when the caller needs a byte vector.

```cpp id="px0br7"
auto bytes = body.bytes();

vix::print("byte count:", bytes.size());
```

## Bodies with Client

The `Client` methods use the same body helpers.

```cpp id="cjh7ag"
vix::requests::Client client;

auto response = client.post(
    "https://example.com/api/items",
    vix::requests::json_body(R"({"name":"Vix"})"));
```

For methods that send data, the body comes after the URL and before the options.

```cpp id="lpphc9"
client.post(url, body, options);
client.put(url, body, options);
client.patch(url, body, options);
```

## Bodies with Session

A session can send bodies while also reusing default headers, params, auth, timeout settings, and cookies.

```cpp id="tvimyg"
vix::requests::Session session;

session.set_header("Accept", "application/json");

auto response = session.post(
    "https://example.com/api/items",
    vix::requests::json_body(R"({"name":"Vix"})"));
```

This is useful when a group of requests forms a client workflow and only the body changes from call to call.

## Choosing a body helper

Use the helper that matches the data you are sending.

```txt id="okdjny"
json_body    JSON text
form_body    application/x-www-form-urlencoded fields
raw_body     plain text or custom textual payloads
binary_body  byte data
```

Do not use `form_body` for JSON APIs, and do not use `json_body` for form endpoints. The server usually decides how to parse the payload from the `Content-Type`, so the body format and content type should match what the endpoint expects.

## Current scope

The current public body helpers cover raw, JSON, form-url-encoded, and binary payloads. They do not provide a multipart form builder.

When a server expects `multipart/form-data`, do not present `form_body` as a file upload helper. `form_body` is for `application/x-www-form-urlencoded` fields. Multipart support should be documented separately only when the public API provides a dedicated multipart workflow.

## Common mistakes

### Passing JSON as a raw string without a content type

This sends the text, but it does not tell the server that the payload is JSON.

```cpp id="eqqedc"
auto response = vix::requests::post(
    "https://example.com/api/items",
    vix::requests::raw_body(R"({"name":"Vix"})"));
```

Use `json_body` for JSON APIs.

```cpp id="z7gdt3"
auto response = vix::requests::post(
    "https://example.com/api/items",
    vix::requests::json_body(R"({"name":"Vix"})"));
```

### Using form encoding for nested JSON data

Form encoding is useful for simple key-value fields. For nested data, JSON is usually clearer.

```cpp id="me2h64"
auto response = vix::requests::post(
    "https://example.com/api/items",
    vix::requests::json_body(R"({"name":"Vix","tags":["cpp","http"]})"));
```

### Setting the wrong content type manually

An explicit `Content-Type` header takes priority over the body content type.

```cpp id="b8lv4r"
vix::requests::RequestOptions options;

options.headers.set("Content-Type", "text/plain");

auto response = vix::requests::post(
    "https://example.com/api/items",
    vix::requests::json_body(R"({"name":"Vix"})"),
    options);
```

This sends a JSON-looking payload with `text/plain`. That may be correct for a special endpoint, but for normal JSON APIs it is usually a mistake.

## API summary

```cpp id="d5bof9"
enum class BodyType
{
  Empty,
  Raw,
  Json,
  Form,
  Binary
};

class Body
{
public:
  Body();

  Body(
      BodyType type,
      std::string data,
      std::string contentType = {});

  static Body binary(
      std::vector<unsigned char> data,
      std::string contentType = {});

  BodyType type() const noexcept;

  const std::string &data() const noexcept;
  const std::string &text() const noexcept;

  std::vector<unsigned char> bytes() const;

  const std::string &content_type() const noexcept;

  bool empty() const noexcept;
  std::size_t size() const noexcept;
  bool has_content_type() const noexcept;
};
```

Helpers:

```cpp id="tkq10z"
vix::requests::raw_body(data, contentType);
vix::requests::binary_body(bytes, contentType);
vix::requests::json_body(json);
vix::requests::form_body(params);
vix::requests::form_body({{"name", "value"}});
vix::requests::to_string(bodyType);
```

## Next step

Continue with responses. After a body is sent, the response object is where the status, headers, body, and error behavior are inspected.

[Open the responses guide](/modules/requests/responses)
