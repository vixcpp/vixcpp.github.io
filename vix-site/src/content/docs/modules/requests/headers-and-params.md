# Headers and Params

`vix::requests::Headers` and `vix::requests::Params` are small containers used to describe the metadata around a request.

Headers become HTTP header lines such as `Accept`, `Content-Type`, `Authorization`, or `User-Agent`. Params become URL query parameters such as `page=1`, `q=vix`, or `tag=cpp`. They are kept separate from the URL and the request body because they have different rules, different encoding behavior, and different meaning in HTTP.

Most application code does not need to build raw HTTP text by hand. It should set headers and params through these containers, then let the request module serialize them correctly.

## Headers

Headers are stored in a case-insensitive container.

HTTP header names are not meant to depend on casing, so `Content-Type`, `content-type`, and `CONTENT-TYPE` refer to the same header when reading, replacing, or removing a value. The container still preserves the original casing of the first inserted name, which keeps serialized requests readable.

```cpp id="b8k21x"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  vix::requests::Headers headers;

  headers.set("Accept", "application/json");
  headers.set("User-Agent", "vix-client/1.0");

  vix::print("has accept:", headers.has("accept"));
  vix::print("accept:", headers.get("ACCEPT").value_or("missing"));

  return 0;
}
```

## Set a header

Use `set` when the request should have one value for a header name.

```cpp id="mm64hz"
vix::requests::Headers headers;

headers.set("Accept", "application/json");
headers.set("Content-Type", "application/json");
```

If the header already exists, `set` replaces the value and keeps the original header name casing.

```cpp id="tf12eq"
vix::requests::Headers headers;

headers.set("Content-Type", "application/json");
headers.set("content-type", "text/plain");

vix::print(headers.get("CONTENT-TYPE").value_or("missing"));
```

Output shape:

```txt id="w3ng19"
text/plain
```

The stored header name still uses the first casing, `Content-Type`.

## Append a header

Use `append` when repeated header entries are meaningful.

```cpp id="l72dg9"
vix::requests::Headers headers;

headers.append("Set-Cookie", "session=abc");
headers.append("Set-Cookie", "theme=dark");

auto values = headers.get_all("set-cookie");

vix::print("cookie headers:", values.size());
```

For outgoing request headers, `set` is usually the better default because most request headers should have one effective value. `append` exists because HTTP can carry repeated fields, and response handling often needs to preserve them.

## Read headers

Use `get` when the first value is enough.

```cpp id="sh8g2r"
auto content_type = headers.get("Content-Type");

if (content_type.has_value())
{
  vix::print("content type:", *content_type);
}
```

Use `get_all` when a header may appear more than once.

```cpp id="u9oet6"
for (const auto &cookie : headers.get_all("Set-Cookie"))
{
  vix::print("cookie:", cookie);
}
```

Use `has` when the code only needs to know whether a header exists.

```cpp id="xvrqpa"
if (headers.has("Authorization"))
{
  vix::print("authorization header is present");
}
```

## Remove and clear headers

`remove` deletes all headers matching a name and returns the number of removed entries.

```cpp id="h32jtl"
vix::requests::Headers headers;

headers.set("Accept", "application/json");
headers.append("accept", "text/plain");

auto removed = headers.remove("ACCEPT");

vix::print("removed:", removed);
vix::print("has accept:", headers.has("Accept"));
```

Use `clear` when the container should be emptied.

```cpp id="n3xhxp"
headers.clear();
```

## Headers in request options

In normal application code, headers are usually set through `RequestOptions`.

```cpp id="p6o4x0"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  vix::requests::RequestOptions options;

  options.headers.set("Accept", "application/json");
  options.headers.set("User-Agent", "vix-client/1.0");

  auto response = vix::requests::get(
      "https://example.com/api/status",
      options);

  vix::print("status:", response.status_code());

  return 0;
}
```

The request module later builds the effective headers for serialization. If some standard headers are missing, it can add values such as `Host`, `User-Agent`, `Accept`, `Connection`, `Content-Type`, and `Content-Length` when they are needed.

## Params

`vix::requests::Params` is an ordered query parameter container.

Params are used for values that belong in the URL query string. The container preserves insertion order, supports duplicate keys through `append`, and encodes values when building the final query string.

```cpp id="jvqcmd"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  vix::requests::Params params;

  params.set("page", "1");
  params.set("q", "vix requests");

  vix::print(params.to_query_string());

  return 0;
}
```

Output:

```txt id="vv8a4j"
page=1&q=vix%20requests
```

Spaces are encoded as `%20` for URL query usage.

## Set a param

Use `set` when a parameter should have one value.

```cpp id="mnk2tq"
vix::requests::Params params;

params.set("page", "1");
params.set("q", "vix requests");
```

If a key already exists, `set` replaces the first value and removes duplicated entries for the same key.

```cpp id="x6xxg1"
vix::requests::Params params;

params.append("tag", "cpp");
params.append("tag", "http");
params.set("tag", "vix");

vix::print("tag:", params.get("tag").value_or("missing"));
vix::print("count:", params.size());
```

After this, only one `tag` value remains.

## Append a param

Use `append` when the API expects repeated query keys.

```cpp id="ccpavu"
vix::requests::Params params;

params.append("tag", "cpp");
params.append("tag", "http");
params.append("tag", "vix");

auto tags = params.get_all("tag");

vix::print("tags:", tags);
vix::print("query:", params.to_query_string());
```

Output shape:

```txt id="ntj9k5"
tags: [cpp, http, vix]
query: tag=cpp&tag=http&tag=vix
```

This is useful for APIs that treat repeated keys as a list.

## Read params

Use `get` for the first value.

```cpp id="kqyav9"
auto page = params.get("page").value_or("1");

vix::print("page:", page);
```

Use `get_all` when duplicate values are expected.

```cpp id="l19qmi"
for (const auto &tag : params.get_all("tag"))
{
  vix::print("tag:", tag);
}
```

Use `has` to check whether a key exists.

```cpp id="eri3t2"
if (params.has("q"))
{
  vix::print("search query is present");
}
```

## Remove and clear params

`remove` deletes all values for a key and returns the number of removed entries.

```cpp id="m9pgqw"
vix::requests::Params params;

params.append("tag", "cpp");
params.append("tag", "http");
params.set("page", "1");

auto removed = params.remove("tag");

vix::print("removed:", removed);
vix::print("query:", params.to_query_string());
```

Use `clear` when no query parameters should remain.

```cpp id="xa4i1b"
params.clear();
```

## Params in request options

Most requests use params through `RequestOptions`.

```cpp id="hlba7m"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  vix::requests::RequestOptions options;

  options.params.set("page", "1");
  options.params.set("q", "vix requests");

  auto response = vix::requests::get(
      "https://example.com/search",
      options);

  vix::print("final url:", response.url());
  vix::print("status:", response.status_code());

  return 0;
}
```

If the URL already contains a query string, the params from the options are appended.

```cpp id="rgku2m"
vix::requests::RequestOptions options;
options.params.set("page", "2");

auto response = vix::requests::get(
    "https://example.com/search?sort=new",
    options);
```

The final request target is equivalent to:

```txt id="skfwxx"
/search?sort=new&page=2
```

## URL encoding and form encoding

The module exposes helpers for both URL query encoding and form-url-encoded body encoding.

```cpp id="huhx12"
vix::print(vix::requests::url_encode("hello world"));
vix::print(vix::requests::form_url_encode("hello world"));
```

Output:

```txt id="fykgda"
hello%20world
hello+world
```

URL query encoding uses `%20` for spaces. Form encoding uses `+` for spaces because `application/x-www-form-urlencoded` follows form encoding rules.

The matching decode helpers are also available.

```cpp id="y4p5m0"
vix::print(vix::requests::url_decode("hello%20world"));
vix::print(vix::requests::form_url_decode("hello+world"));
```

## Build a query string directly

When the code needs a query string without sending a request, use `to_query_string` or `build_query_string`.

```cpp id="aewm61"
vix::requests::Params params;

params.set("page", "1");
params.set("q", "vix requests");

std::string query = params.to_query_string();

vix::print(query);
```

`build_query_string` is the free-function form.

```cpp id="jifvbg"
std::string query = vix::requests::build_query_string(params);
```

Both return the encoded query string without the leading `?`.

## Headers and params together

Headers and params are commonly used together when calling JSON APIs.

```cpp id="fi3hii"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

#include <chrono>

int main()
{
  try
  {
    vix::requests::RequestOptions options;

    options.headers.set("Accept", "application/json");
    options.headers.set("User-Agent", "vix-client/1.0");
    options.params.set("page", "1");
    options.params.set("q", "vix requests");
    options.timeout = std::chrono::seconds(10);

    auto response = vix::requests::get(
        "https://example.com/api/search",
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

The headers describe how the request should be interpreted. The params describe the query attached to the URL. Keeping them separate makes the request easier to read and avoids manual string building.

## Common mistakes

### Manually encoding dynamic query values

This is easy to get wrong when values contain spaces, `+`, `&`, `=`, or other reserved characters.

```cpp id="scgfj1"
auto response = vix::requests::get(
    "https://example.com/search?q=vix requests");
```

Use params instead.

```cpp id="s0o9u6"
vix::requests::RequestOptions options;
options.params.set("q", "vix requests");

auto response = vix::requests::get(
    "https://example.com/search",
    options);
```

The module encodes the value before sending the request.

### Using `append` when one value is expected

`append` keeps duplicates.

```cpp id="x569ag"
params.append("page", "1");
params.append("page", "2");
```

This produces:

```txt id="y694t0"
page=1&page=2
```

Use `set` when the parameter should have one final value.

```cpp id="xhnxyv"
params.set("page", "2");
```

### Treating header names as case-sensitive

Header lookup is case-insensitive.

```cpp id="hcqgo2"
headers.set("Content-Type", "application/json");

vix::print(headers.has("content-type"));
vix::print(headers.has("CONTENT-TYPE"));
```

Both checks return true.

## API summary

Headers:

```cpp id="bkyizu"
vix::requests::Headers headers;

headers.set(name, value);
headers.append(name, value);

headers.get(name);
headers.get_all(name);
headers.has(name);

headers.remove(name);
headers.clear();

headers.empty();
headers.size();
headers.entries();
```

Params:

```cpp id="yzxve8"
vix::requests::Params params;

params.set(name, value);
params.append(name, value);

params.get(name);
params.get_all(name);
params.has(name);

params.remove(name);
params.clear();

params.empty();
params.size();
params.to_query_string();
params.entries();
```

Encoding helpers:

```cpp id="ddhmbr"
vix::requests::url_encode(value);
vix::requests::url_decode(value);

vix::requests::form_url_encode(value);
vix::requests::form_url_decode(value);

vix::requests::build_query_string(params);
```

## Next step

Continue with request bodies. Headers and params describe the request around the URL; bodies describe the data sent by methods such as `POST`, `PUT`, and `PATCH`.

[Open the bodies guide](/modules/requests/bodies)
