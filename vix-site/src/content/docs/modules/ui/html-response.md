# HTML response

`HtmlResponse` represents an HTML response before it is written to a real HTTP connection.

It stores the response body, status code, content type, charset, and small render metadata.

Use it when a route already has HTML and needs to return it cleanly.

```cpp
#include <vix/ui/html/HtmlResponse.hpp>
```

## Basic example

```cpp
vix::ui::HtmlResponse response =
    vix::ui::HtmlResponse::html("<h1>Hello from Vix UI</h1>", 200);

response.status_code();          // 200
response.content_type();         // text/html
response.charset();              // utf-8
response.header_content_type();  // text/html; charset=utf-8
response.body();                 // <h1>Hello from Vix UI</h1>
```

## Return HTML from a Vix route

```cpp
#include <vix/core.hpp>
#include <vix/ui.hpp>

int main()
{
  vix::App app;

  app.get("/", [](vix::Request &req, vix::Response &res) {
    (void)req;

    const std::string html =
        "<!doctype html>"
        "<html lang=\"en\">"
        "<head>"
        "<meta charset=\"utf-8\">"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
        "<title>Vix UI</title>"
        "</head>"
        "<body>"
        "<h1>Hello from Vix UI</h1>"
        "</body>"
        "</html>";

    res.ui(vix::ui::HtmlResponse::html(html));
  });

  app.run(8080);
  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

Then open:

```txt
http://127.0.0.1:8080
```

## Create a response

Use `HtmlResponse::html()` when you already have the HTML string.

```cpp
vix::ui::HtmlResponse response =
    vix::ui::HtmlResponse::html("<p>Saved</p>");
```

The default status code is `200`.

```cpp
vix::ui::HtmlResponse response =
    vix::ui::HtmlResponse::html("<p>Created</p>", 201);
```

## Set the body

```cpp
vix::ui::HtmlResponse response;

response.set_body("<h1>Dashboard</h1>");
```

You can also append HTML in multiple steps.

```cpp
vix::ui::HtmlResponse response;

response.append("<main>");
response.append("<h1>Dashboard</h1>");
response.append("</main>");
```

## Status code

```cpp
vix::ui::HtmlResponse response;

response.set_status(404);
```

Check whether the response is successful:

```cpp
if (response.ok())
{
  // status is in the 2xx range
}
```

`ok()` returns true for status codes from `200` to `299`.

Invalid status codes throw `HtmlError`.

```cpp
try
{
  response.set_status(99);
}
catch (const vix::ui::HtmlError &)
{
  // invalid HTTP status
}
```

Valid status codes are from `100` to `599`.

## Content type

By default, `HtmlResponse` uses:

```txt
text/html
```

with:

```txt
utf-8
```

So the final header value is:

```txt
text/html; charset=utf-8
```

Change the content type when the response body is not normal HTML.

```cpp
vix::ui::HtmlResponse response =
    vix::ui::HtmlResponse::html(manifest_json)
        .set_content_type("application/manifest+json");
```

This is useful for PWA manifests:

```cpp
app.get("/manifest.webmanifest", [](vix::Request &req, vix::Response &res) {
  (void)req;

  const std::string manifest =
      vix::ui::WebAppManifest::app("Vix UI PWA", "Vix UI")
          .set_description("A PWA powered by Vix UI.")
          .set_theme_color("#0f172a")
          .set_background_color("#0f172a")
          .render();

  res.ui(
      vix::ui::HtmlResponse::html(manifest)
          .set_content_type("application/manifest+json"));
});
```

## Charset

Change the charset when needed.

```cpp
vix::ui::HtmlResponse response;

response.set_charset("utf-16");
```

The header becomes:

```txt
text/html; charset=utf-16
```

Set an empty charset to remove the charset from the header.

```cpp
response.set_charset("");
```

The header becomes:

```txt
text/html
```

## Response size

Use `size()` and `empty()` to inspect the body.

```cpp
vix::ui::HtmlResponse response;

response.empty(); // true
response.size();  // 0

response.set_body("abc");

response.empty(); // false
response.size();  // 3
```

## From a rendered view

A `View` renders into a `ViewResult`.

`HtmlResponse` can be created from that result.

```cpp
vix::ui::ViewResult result = view.render(engine);

vix::ui::HtmlResponse response =
    vix::ui::HtmlResponse::from_view_result(result);
```

This copies:

```txt
rendered output
cache metadata
escaping metadata
```

The response status remains `200` unless changed later.

```cpp
vix::ui::HtmlResponse response =
    vix::ui::HtmlResponse::from_view_result(result)
        .set_status(200);
```

## Render a template and return it

```cpp
#include <memory>

#include <vix/core.hpp>
#include <vix/template/Engine.hpp>
#include <vix/template/StringLoader.hpp>
#include <vix/ui.hpp>

int main()
{
  auto loader = std::make_shared<vix::template_::StringLoader>();

  loader->set(
      "home.html",
      "<!doctype html>"
      "<html>"
      "<head><title>{{ page_title }}</title></head>"
      "<body><h1>Hello {{ name }}</h1></body>"
      "</html>");

  vix::template_::Engine engine(loader);

  vix::App app;

  app.get("/", [&engine](vix::Request &req, vix::Response &res) {
    (void)req;

    vix::ui::View view("home.html");

    view.set_title("Vix UI");
    view.set("name", "Gaspard");

    const vix::ui::ViewResult result = view.render(engine);

    if (!result.success)
    {
      res.ui(
          vix::ui::HtmlResponse::html("<h1>Render failed</h1>", 500));
      return;
    }

    res.ui(vix::ui::HtmlResponse::from_view_result(result));
  });

  app.run(8080);
  return 0;
}
```

## Transport-neutral design

`HtmlResponse` does not open sockets and does not depend on a specific HTTP server.

It only describes the response.

```txt
body
status
content type
charset
metadata
```

The Vix HTTP integration can then copy those values into the real response.

That keeps UI rendering separate from the transport layer.

## Practical error page

```cpp
static vix::ui::HtmlResponse error_page(
    int status,
    const std::string &title,
    const std::string &message)
{
  const std::string html =
      "<!doctype html>"
      "<html lang=\"en\">"
      "<head>"
      "<meta charset=\"utf-8\">"
      "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
      "<title>" +
      vix::ui::Html::text(title) +
      "</title>"
      "</head>"
      "<body>"
      "<main>"
      "<h1>" +
      vix::ui::Html::text(title) +
      "</h1>"
      "<p>" +
      vix::ui::Html::text(message) +
      "</p>"
      "</main>"
      "</body>"
      "</html>";

  return vix::ui::HtmlResponse::html(html, status);
}
```

Usage:

```cpp
app.get("/admin", [](vix::Request &req, vix::Response &res) {
  (void)req;

  res.ui(error_page(
      403,
      "Access denied",
      "You do not have permission to open this page."));
});
```

## Common mistakes

### Returning JSON with the HTML content type

Wrong:

```cpp
res.ui(vix::ui::HtmlResponse::html("{\"ok\":true}"));
```

Correct:

```cpp
res.ui(
    vix::ui::HtmlResponse::html("{\"ok\":true}")
        .set_content_type("application/json"));
```

For normal API responses, prefer `res.json()`.

### Forgetting to return after an error response

Wrong:

```cpp
res.ui(vix::ui::HtmlResponse::html("<h1>Not found</h1>", 404));

res.ui(vix::ui::HtmlResponse::html("<h1>OK</h1>"));
```

Correct:

```cpp
res.ui(vix::ui::HtmlResponse::html("<h1>Not found</h1>", 404));
return;
```

### Using `HtmlResponse` to generate HTML

`HtmlResponse` stores the final response.

It does not build tags.

Use these helpers to create HTML:

```txt
Html
HtmlAttrs
HtmlEscape
View
templates
```

Then wrap the final body with `HtmlResponse`.

## What to remember

`HtmlResponse` is the bridge between rendered UI and HTTP output.

Use it when you already have HTML and need a clean response object with:

```txt
status code
content type
charset
body
render metadata
```

## Next step

Continue with assets.

[Open the assets guide](./assets.md)
