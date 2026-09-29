# Tests

Vix UI is designed to be tested like normal C++ code.

Most helpers return plain values such as strings, status codes, flags, JSON payloads, or result objects. That makes UI behavior easy to verify with simple assertions before it is connected to a real browser or server.

## Run UI tests

From a Vix project that includes the UI module:

```bash
vix tests
```

For a single test file, you can also use `vix run`:

```bash
vix run view_test.cpp
vix run form_test.cpp
vix run html_test.cpp
```

## What should be tested

A Vix UI application usually needs tests for:

| Area           | What to verify                                        |
| -------------- | ----------------------------------------------------- |
| Views          | template name, title, context values, rendered output |
| HTML helpers   | escaping, tags, attributes, invalid names             |
| HTML responses | body, status code, content type, charset              |
| Assets         | generated stylesheet, script, image, font tags        |
| Forms          | fields, values, errors, CSRF input, old input binding |
| Live UI        | fragments, flash messages, toasts, update payloads    |
| PWA helpers    | viewport meta, safe-area CSS, manifest JSON           |
| App shell      | configuration, target URL, server readiness           |

The goal is not to test the browser.
The goal is to test the HTML and metadata your C++ code produces.

## View test

Use view tests to verify that a template receives the expected values.

```cpp
#include <cassert>
#include <memory>
#include <string>

#include <vix/template/Engine.hpp>
#include <vix/template/StringLoader.hpp>
#include <vix/ui/core/View.hpp>

int main()
{
  auto loader = std::make_shared<vix::template_::StringLoader>();

  loader->set("home.html", "Hello {{ name }}");

  vix::template_::Engine engine(loader);

  vix::ui::View view("home.html");
  view.set("name", "Gaspard");

  const vix::ui::ViewResult result = view.render(engine);

  assert(result.success);
  assert(result.template_name == "home.html");
  assert(result.output == "Hello Gaspard");
  assert(result.escaped);

  return 0;
}
```

Run it:

```bash
vix run view_test.cpp
```

## View context test

Use `ViewContext` when you want to test the data passed into a view separately from rendering.

```cpp
#include <cassert>

#include <vix/ui/core/ViewContext.hpp>

int main()
{
  vix::ui::ViewContext ctx;

  assert(ctx.empty());

  ctx.set("name", "Gaspard");
  ctx.set("active", true);

  assert(!ctx.empty());
  assert(ctx.size() == 2);
  assert(ctx.has("name"));
  assert(ctx.has("active"));

  const auto *name = ctx.get("name");
  assert(name != nullptr);
  assert(name->as_string() == "Gaspard");

  const auto template_ctx = ctx.to_template_context();

  assert(template_ctx.get("name") != nullptr);
  assert(template_ctx.get("active") != nullptr);

  return 0;
}
```

## HTML escaping test

HTML helpers should escape user-controlled text.

```cpp
#include <cassert>
#include <string>

#include <vix/ui/html/Html.hpp>
#include <vix/ui/html/HtmlEscape.hpp>

int main()
{
  const std::string escaped =
      vix::ui::HtmlEscape::text(R"(<div class="x">Tom & Jerry</div>)");

  assert(
      escaped ==
      "&lt;div class=&quot;x&quot;&gt;Tom &amp; Jerry&lt;/div&gt;");

  const std::string html =
      vix::ui::Html::tag(
          "p",
          vix::ui::Html::text("Hello <Vix>"));

  assert(html == "<p>Hello &lt;Vix&gt;</p>");

  return 0;
}
```

## HTML attributes test

Use attribute tests to verify rendered attributes and invalid names.

```cpp
#include <cassert>
#include <string>

#include <vix/ui/html/HtmlAttrs.hpp>
#include <vix/ui/support/Error.hpp>

int main()
{
  vix::ui::HtmlAttrs attrs;

  attrs.set("class", "card");
  attrs.set("data-id", "42");
  attrs.boolean("hidden", true);

  assert(attrs.has("class"));
  assert(attrs.has("data-id"));
  assert(attrs.has("hidden"));

  assert(attrs.render() == R"(class="card" data-id="42" hidden)");

  bool thrown = false;

  try
  {
    attrs.set("1bad", "value");
  }
  catch (const vix::ui::HtmlError &)
  {
    thrown = true;
  }

  assert(thrown);

  return 0;
}
```

## HTML response test

`HtmlResponse` can be tested without starting a server.

```cpp
#include <cassert>

#include <vix/ui/html/HtmlResponse.hpp>

int main()
{
  vix::ui::HtmlResponse response =
      vix::ui::HtmlResponse::html("<h1>Hello</h1>", 201);

  assert(response.body() == "<h1>Hello</h1>");
  assert(response.status_code() == 201);
  assert(response.content_type() == "text/html");
  assert(response.charset() == "utf-8");
  assert(response.header_content_type() == "text/html; charset=utf-8");
  assert(response.ok());

  response.set_status(404);

  assert(response.status_code() == 404);
  assert(!response.ok());

  return 0;
}
```

## Form test

Forms should be tested by checking the generated HTML and the stored field state.

```cpp
#include <cassert>
#include <string>

#include <vix/ui/forms/Field.hpp>
#include <vix/ui/forms/Form.hpp>

int main()
{
  vix::ui::Form form = vix::ui::Form::post("/login");

  form.set_csrf("csrf-demo-token");

  form.add_field(
      vix::ui::Field::email("email")
          .set_label("Email")
          .set_required(true));

  form.add_field(
      vix::ui::Field::password("password")
          .set_label("Password")
          .set_required(true));

  form.add_error("email", "Email is required.");

  const std::string html = form.render();

  assert(html.find(R"(method="post")") != std::string::npos);
  assert(html.find(R"(action="/login")") != std::string::npos);
  assert(html.find(R"(name="email")") != std::string::npos);
  assert(html.find(R"(name="password")") != std::string::npos);
  assert(html.find("Email is required.") != std::string::npos);
  assert(html.find("csrf-demo-token") != std::string::npos);

  return 0;
}
```

## Form data binding test

Use `FormData` to test old input binding after validation fails.

```cpp
#include <cassert>
#include <string>

#include <vix/ui/all.hpp>

int main()
{
  vix::ui::FormData old_input;

  old_input.set("name", "Gaspard");
  old_input.set("country", "ug");
  old_input.set("newsletter", "1");

  vix::ui::Form form = vix::ui::Form::post("/profile");

  form.add_field(
      vix::ui::Field::text("name")
          .set_label("Name"));

  vix::ui::Field country =
      vix::ui::Field::select("country")
          .set_label("Country");

  country.add_option("ug", "Uganda");
  country.add_option("cd", "DRC");

  form.add_field(country);

  form.add_field(
      vix::ui::Field::checkbox("newsletter")
          .set_label("Receive updates")
          .set_value("1"));

  form.bind(old_input);

  const std::string html = form.render();

  assert(html.find(R"(value="Gaspard")") != std::string::npos);
  assert(html.find(R"(<option selected value="ug">Uganda</option>)") != std::string::npos);
  assert(html.find("checked") != std::string::npos);

  return 0;
}
```

## CSRF token test

`CsrfToken` is a rendering helper. Test the input and meta tag it produces.

```cpp
#include <cassert>
#include <string>

#include <vix/ui/forms/CsrfToken.hpp>

int main()
{
  vix::ui::CsrfToken token =
      vix::ui::CsrfToken::named("_csrf", "secure-token");

  assert(token.name() == "_csrf");
  assert(token.value() == "secure-token");
  assert(token.has_value());

  assert(
      token.render() ==
      R"(<input id="_csrf" name="_csrf" type="hidden" value="secure-token">)");

  assert(
      token.render_meta() ==
      R"(<meta content="secure-token" data-header="X-CSRF-Token" name="csrf-token">)");

  return 0;
}
```

## Live fragment test

Fragments return raw HTML by default and can also be wrapped with metadata.

```cpp
#include <cassert>
#include <string>

#include <vix/ui/live/Fragment.hpp>

int main()
{
  vix::ui::Fragment fragment =
      vix::ui::Fragment::make("stats")
          .set_target("#stats")
          .set_html("<strong>42</strong>");

  assert(fragment.name() == "stats");
  assert(fragment.target() == "#stats");
  assert(fragment.render() == "<strong>42</strong>");

  assert(
      fragment.render_wrapped() ==
      R"(<div data-fragment="stats" data-target="#stats"><strong>42</strong></div>)");

  return 0;
}
```

## Live update test

Live updates can be tested as JSON payloads.

```cpp
#include <cassert>
#include <string>

#include <vix/ui/live/Fragment.hpp>
#include <vix/ui/live/LiveUpdate.hpp>

int main()
{
  vix::ui::Fragment fragment =
      vix::ui::Fragment::make("stats")
          .set_html("<span>42</span>");

  vix::ui::LiveUpdate update =
      vix::ui::LiveUpdate::replace("#stats", fragment)
          .set_event("stats.updated")
          .set_id("update-42");

  assert(update.action() == vix::ui::LiveUpdateAction::Replace);
  assert(update.target() == "#stats");
  assert(update.render() == "<span>42</span>");

  assert(
      update.to_json() ==
      R"({"type":"ui.update","action":"replace","target":"#stats","event":"stats.updated","id":"update-42","fragment":"stats","html":"<span>42</span>"})");

  return 0;
}
```

## Flash message test

Flash messages should expose the right level, role, title, and message.

```cpp
#include <cassert>
#include <string>

#include <vix/ui/live/FlashMessage.hpp>

int main()
{
  vix::ui::FlashMessage flash =
      vix::ui::FlashMessage::success("Profile updated.")
          .set_title("Saved")
          .set_dismissible(true);

  assert(flash.level() == vix::ui::FlashLevel::Success);
  assert(flash.title() == "Saved");
  assert(flash.message() == "Profile updated.");
  assert(flash.dismissible());

  const std::string html = flash.render();

  assert(html.find("flash-success") != std::string::npos);
  assert(html.find("Saved") != std::string::npos);
  assert(html.find("Profile updated.") != std::string::npos);
  assert(html.find("data-dismissible") != std::string::npos);

  return 0;
}
```

## Toast test

Toasts can be tested by checking their level, position, timeout, and rendered HTML.

```cpp
#include <cassert>
#include <chrono>
#include <string>

#include <vix/ui/live/Toast.hpp>

int main()
{
  vix::ui::Toast toast =
      vix::ui::Toast::info("Background sync completed.")
          .set_title("Sync")
          .set_position(vix::ui::ToastPosition::BottomRight)
          .set_timeout(std::chrono::milliseconds(3000));

  assert(toast.title() == "Sync");
  assert(toast.message() == "Background sync completed.");
  assert(toast.timeout().count() == 3000);

  const std::string html = toast.render();

  assert(html.find("toast") != std::string::npos);
  assert(html.find("Sync") != std::string::npos);
  assert(html.find("Background sync completed.") != std::string::npos);

  return 0;
}
```

## PWA metadata test

PWA helpers generate deterministic strings, so they are easy to assert.

```cpp
#include <cassert>
#include <string>

#include <vix/ui/pwa/PwaMeta.hpp>
#include <vix/ui/pwa/SafeArea.hpp>
#include <vix/ui/pwa/Viewport.hpp>

int main()
{
  vix::ui::Viewport viewport =
      vix::ui::Viewport::mobile_app();

  assert(
      viewport.content() ==
      "width=device-width, initial-scale=1, viewport-fit=cover");

  vix::ui::SafeArea safe_area =
      vix::ui::SafeArea::vertical();

  const std::string css = safe_area.render();

  assert(css.find("--vix-safe-area-top") != std::string::npos);
  assert(css.find("--vix-safe-area-bottom") != std::string::npos);

  vix::ui::PwaMeta meta =
      vix::ui::PwaMeta::mobile_app("Vix Mobile", "#111111");

  const std::string html = meta.render();

  assert(html.find("viewport-fit=cover") != std::string::npos);
  assert(html.find("theme-color") != std::string::npos);
  assert(html.find("Vix Mobile") != std::string::npos);

  return 0;
}
```

## Web app manifest test

The manifest helper returns JSON text.

```cpp
#include <cassert>
#include <string>

#include <vix/ui/pwa/WebAppManifest.hpp>

int main()
{
  vix::ui::WebAppManifest manifest =
      vix::ui::WebAppManifest::app("Vix Mobile", "Vix");

  manifest.set_description("A mobile-ready Vix UI application")
      .set_start_url("/")
      .set_scope("/")
      .set_id("com.vix.mobile")
      .set_theme_color("#111111");

  manifest.add_icon("/icons/icon-192.png", "192x192", "image/png");

  const std::string json = manifest.render();

  assert(json.find(R"("name":"Vix Mobile")") != std::string::npos);
  assert(json.find(R"("short_name":"Vix")") != std::string::npos);
  assert(json.find(R"("id":"com.vix.mobile")") != std::string::npos);
  assert(json.find(R"("src":"/icons/icon-192.png")") != std::string::npos);

  return 0;
}
```

## App shell configuration test

Most app shell behavior can be tested before opening any window.

```cpp
#include <cassert>
#include <chrono>

#include <vix/ui/shell/ShellConfig.hpp>

int main()
{
  vix::ui::ShellConfig config =
      vix::ui::ShellConfig::make()
          .set_name("Vix Admin")
          .set_title("Vix Admin")
          .set_host("127.0.0.1")
          .set_port(8080)
          .set_width(1280)
          .set_height(720)
          .set_wait_for_server(true)
          .set_startup_timeout(std::chrono::milliseconds(5000));

  assert(config.name() == "Vix Admin");
  assert(config.title() == "Vix Admin");
  assert(config.host() == "127.0.0.1");
  assert(config.port() == 8080);
  assert(config.width() == 1280);
  assert(config.height() == 720);
  assert(config.wait_for_server());
  assert(config.effective_url() == "http://127.0.0.1:8080");

  return 0;
}
```

## Server readiness test

Use readiness tests when a desktop shell depends on a local HTTP server.

```cpp
#include <cassert>
#include <chrono>

#include <vix/ui/shell/ServerReadiness.hpp>

int main()
{
  auto parsed =
      vix::ui::ServerReadiness::parse_url("http://127.0.0.1:8080/health");

  assert(parsed.is_ok());
  assert(parsed.value().host == "127.0.0.1");
  assert(parsed.value().port == 8080);

  auto invalid =
      vix::ui::ServerReadiness::parse_url("ftp://127.0.0.1:8080");

  assert(invalid.is_failed());

  auto unreachable =
      vix::ui::ServerReadiness::wait(
          "http://127.0.0.1:1",
          std::chrono::milliseconds(1));

  assert(unreachable.is_failed());

  return 0;
}
```

## Testing HTTP routes that return UI

When a route returns HTML, test the helper logic separately first.

Keep the route small:

```cpp
#include <string>

#include <vix/ui/html/HtmlResponse.hpp>

static vix::ui::HtmlResponse home_page()
{
  const std::string html =
      "<!doctype html>"
      "<html lang=\"en\">"
      "<head><title>Home</title></head>"
      "<body><h1>Hello from Vix UI</h1></body>"
      "</html>";

  return vix::ui::HtmlResponse::html(html);
}
```

Then test it:

```cpp
#include <cassert>
#include <string>

int main()
{
  const vix::ui::HtmlResponse response = home_page();

  assert(response.status_code() == 200);
  assert(response.header_content_type() == "text/html; charset=utf-8");
  assert(response.body().find("Hello from Vix UI") != std::string::npos);

  return 0;
}
```

The route only sends the result:

```cpp
app.get("/", [](vix::Request &, vix::Response &res) {
  res.ui(home_page());
});
```

## Recommended testing style

Prefer small focused tests.

Good:

```cpp
assert(response.status_code() == 200);
assert(response.body().find("Dashboard") != std::string::npos);
```

Avoid testing everything through a browser first. Browser tests are useful later, but most Vix UI behavior is generated from C++ and can be verified before that.

## Common mistakes

### Testing raw user input without escaping

Wrong:

```cpp
assert(html.find("<script>") != std::string::npos);
```

Correct:

```cpp
assert(html.find("&lt;script&gt;") != std::string::npos);
```

### Testing only that output is not empty

Weak:

```cpp
assert(!html.empty());
```

Better:

```cpp
assert(html.find(R"(name="email")") != std::string::npos);
assert(html.find(R"(type="email")") != std::string::npos);
```

### Starting a desktop shell in every test

Avoid opening a desktop shell for basic checks.

Test `ShellConfig`, URLs, readiness parsing, and server behavior separately. Use a real desktop shell test only when you need to verify the full app shell flow.

### Forgetting that `CsrfToken` only renders

`CsrfToken` does not generate or validate secure tokens. Test generation and validation in your application security layer.
