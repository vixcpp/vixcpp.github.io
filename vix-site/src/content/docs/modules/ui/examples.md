# Examples

This page shows small Vix UI examples that can be copied into your own project or into a temporary folder.

Each example assumes Vix is installed and available from the terminal.

```bash
vix --version
```

For desktop examples, install the desktop SDK first:

```bash
vix upgrade --sdk desktop
```

## Minimal view

Use `View` when you want to render a template with values.

Create `main.cpp`:

```cpp
#include <iostream>
#include <memory>

#include <vix/template/Engine.hpp>
#include <vix/template/StringLoader.hpp>
#include <vix/ui/core/View.hpp>

int main()
{
  auto loader = std::make_shared<vix::template_::StringLoader>();

  loader->set(
      "home.html",
      "<h1>Hello {{ name }}</h1>"
      "<p>{{ page_title }}</p>");

  vix::template_::Engine engine(loader);

  vix::ui::View view("home.html");
  view.set_title("Vix UI");
  view.set("name", "Gaspard");

  const vix::ui::ViewResult result = view.render(engine);

  if (!result.success)
  {
    std::cerr << "failed to render view\n";
    return 1;
  }

  std::cout << result.output << "\n";
  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

## HTML page

Use `Html` and `HtmlAttrs` when you want to build safe HTML fragments from C++.

Create `main.cpp`:

```cpp
#include <iostream>

#include <vix/ui/html/Html.hpp>
#include <vix/ui/html/HtmlAttrs.hpp>

int main()
{
  vix::ui::HtmlAttrs attrs;
  attrs.set("class", "card");

  const std::string html =
      vix::ui::Html::doctype() +
      vix::ui::Html::tag(
          "main",
          vix::ui::Html::tag("h1", vix::ui::Html::text("Vix UI")) +
              vix::ui::Html::tag(
                  "p",
                  vix::ui::Html::text("HTML generated safely from C++.")),
          attrs);

  std::cout << html << "\n";
  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

## HTML response

Use `HtmlResponse` when you want to prepare a response body, status code, and content type before sending it through HTTP.

Create `main.cpp`:

```cpp
#include <iostream>

#include <vix/ui/html/HtmlResponse.hpp>

int main()
{
  vix::ui::HtmlResponse response =
      vix::ui::HtmlResponse::html("<h1>Hello from Vix UI</h1>", 200);

  std::cout << "Status: " << response.status_code() << "\n";
  std::cout << "Content-Type: " << response.header_content_type() << "\n";
  std::cout << response.body() << "\n";

  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

## Assets

Use assets when a page needs stylesheets, scripts, fonts, or images.

Create `main.cpp`:

```cpp
#include <iostream>

#include <vix/ui/assets/AssetManager.hpp>

int main()
{
  vix::ui::AssetManager assets("/assets");

  assets.add_stylesheet("app_css", "app.css");
  assets.add_script("app_js", "app.js", vix::ui::AssetLoading::Deferred);
  assets.add_font("inter", "fonts/inter.woff2");

  std::cout << assets.render() << "\n";

  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

## Form

Use `Form` and `Field` when you want to render server-side forms from C++.

Create `main.cpp`:

```cpp
#include <iostream>

#include <vix/ui/forms/Field.hpp>
#include <vix/ui/forms/Form.hpp>

int main()
{
  vix::ui::Form form = vix::ui::Form::post("/login");

  form.set_attr("class", "login-form");
  form.add_hidden("_token", "csrf-demo-token");

  form.add_field(
      vix::ui::Field::email("email")
          .set_label("Email")
          .set_placeholder("you@example.com")
          .set_required(true));

  form.add_field(
      vix::ui::Field::password("password")
          .set_label("Password")
          .set_placeholder("Your password")
          .set_required(true));

  form.add_error("email", "Email is required.");

  std::cout << form.render() << "\n";

  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

## Old input binding

Use `FormData` when a form needs to keep user input after validation fails.

Create `main.cpp`:

```cpp
#include <iostream>

#include <vix/ui/all.hpp>

int main()
{
  vix::ui::FormData old_input;
  old_input.set("name", "Gaspard");
  old_input.set("email", "gaspard@example.com");
  old_input.set("country", "ug");
  old_input.set("newsletter", "1");

  vix::ui::Form form = vix::ui::Form::post("/profile");

  form.set_csrf("csrf-demo-token");

  form.add_field(
      vix::ui::Field::text("name")
          .set_label("Name")
          .set_required(true));

  form.add_field(
      vix::ui::Field::email("email")
          .set_label("Email")
          .set_required(true));

  vix::ui::Field country =
      vix::ui::Field::select("country")
          .set_label("Country");

  country.add_option("ug", "Uganda");
  country.add_option("cd", "DRC");
  country.add_option("rw", "Rwanda");

  form.add_field(country);

  form.add_field(
      vix::ui::Field::checkbox("newsletter")
          .set_label("Receive updates")
          .set_value("1"));

  form.bind(old_input);

  std::cout << form.render() << "\n";
  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

## Flash message

Use `FlashMessage` for page-level feedback.

Create `main.cpp`:

```cpp
#include <iostream>

#include <vix/ui/live/FlashMessage.hpp>

int main()
{
  vix::ui::FlashMessage flash =
      vix::ui::FlashMessage::success("Profile updated successfully.")
          .set_title("Saved")
          .set_dismissible(true);

  std::cout << flash.render() << "\n";
  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

## Live update payload

Use `LiveUpdate` when the server needs to tell the browser how to apply a new HTML fragment.

Create `main.cpp`:

```cpp
#include <iostream>

#include <vix/ui/live/Fragment.hpp>
#include <vix/ui/live/LiveUpdate.hpp>

int main()
{
  vix::ui::Fragment row =
      vix::ui::Fragment::make("user-row")
          .set_html(
              "<tr id=\"user-42\">"
              "<td>Gaspard</td>"
              "<td>online</td>"
              "</tr>");

  vix::ui::LiveUpdate update =
      vix::ui::LiveUpdate::replace("#user-42", row)
          .set_event("users.updated")
          .set_id("update-42");

  std::cout << update.to_json() << "\n";
  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

## PWA metadata

Use PWA helpers when a page needs mobile viewport metadata, theme color, manifest metadata, or safe-area CSS.

Create `main.cpp`:

```cpp
#include <iostream>

#include <vix/ui/pwa/PwaMeta.hpp>
#include <vix/ui/pwa/SafeArea.hpp>

int main()
{
  vix::ui::PwaMeta meta =
      vix::ui::PwaMeta::mobile_app("Vix App", "#0f172a");

  vix::ui::SafeArea safe_area =
      vix::ui::SafeArea::vertical();

  std::cout << meta.render() << "\n\n";
  std::cout << safe_area.render() << "\n";

  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

## Web app manifest

Use `WebAppManifest` when you need to generate a manifest for an installable web app.

Create `main.cpp`:

```cpp
#include <iostream>

#include <vix/ui/pwa/WebAppManifest.hpp>

int main()
{
  vix::ui::WebAppManifest manifest =
      vix::ui::WebAppManifest::app("Vix Mobile", "Vix");

  manifest.set_description("A mobile-ready Vix UI application")
      .set_start_url("/")
      .set_scope("/")
      .set_id("com.vix.mobile")
      .set_lang("en")
      .set_display(vix::ui::WebAppDisplayMode::Standalone)
      .set_orientation(vix::ui::WebAppOrientation::Portrait)
      .set_background_color("#ffffff")
      .set_theme_color("#111111");

  manifest.add_icon("/icons/icon-192.png", "192x192", "image/png");
  manifest.add_icon("/icons/icon-512.png", "512x512", "image/png", "any maskable");

  std::cout << manifest.render() << "\n";
  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

## HTTP page

Use `res.ui(...)` when a Vix route should return a Vix UI response.

Create `main.cpp`:

```cpp
#include <vix.hpp>
#include <vix/ui.hpp>

using namespace vix;

int main()
{
  App app;

  app.get("/", [](Request &req, Response &res) {
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
        "<main>"
        "<h1>Hello from Vix UI</h1>"
        "<p>This page was rendered from a C++ route.</p>"
        "</main>"
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
vix run main.cpp --force-server
```

Open:

```txt
http://127.0.0.1:8080
```

## HTTP form page

Create `main.cpp`:

```cpp
#include <vix.hpp>
#include <vix/ui.hpp>

using namespace vix;

int main()
{
  App app;

  app.get("/", [](Request &req, Response &res) {
    (void)req;

    vix::ui::Form form = vix::ui::Form::post("/login");

    form.set_csrf("csrf-demo-token");

    form.add_field(
        vix::ui::Field::email("email")
            .set_label("Email")
            .set_placeholder("you@example.com")
            .set_required(true));

    form.add_field(
        vix::ui::Field::password("password")
            .set_label("Password")
            .set_required(true));

    const std::string html =
        "<!doctype html>"
        "<html lang=\"en\">"
        "<head>"
        "<meta charset=\"utf-8\">"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
        "<title>Login</title>"
        "</head>"
        "<body>"
        "<main>"
        "<h1>Login</h1>" +
        form.render() +
        "</main>"
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
vix run main.cpp --force-server
```

Open:

```txt
http://127.0.0.1:8080
```

## Desktop shell

Use the desktop command when you want to run a server-rendered Vix UI page inside a desktop shell.

Create `main.cpp`:

```cpp
#include <vix.hpp>
#include <vix/ui.hpp>

using namespace vix;

int main()
{
  App app;

  app.get("/", [](Request &req, Response &res) {
    (void)req;

    const std::string html =
        "<!doctype html>"
        "<html lang=\"en\">"
        "<head>"
        "<meta charset=\"utf-8\">"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
        "<title>Vix Desktop UI</title>"
        "</head>"
        "<body>"
        "<main>"
        "<h1>Vix Desktop UI</h1>"
        "<p>This page is served by Vix and opened in a desktop shell.</p>"
        "</main>"
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
vix desktop run main.cpp --port 8080
```

## Choosing the right example

| Goal                              | Start with          |
| --------------------------------- | ------------------- |
| Render a template                 | Minimal view        |
| Build safe HTML                   | HTML page           |
| Return HTML from a route          | HTTP page           |
| Build forms                       | Form                |
| Keep old input after validation   | Old input binding   |
| Render notifications              | Flash message       |
| Send live UI updates              | Live update payload |
| Prepare a mobile-ready page       | PWA metadata        |
| Generate a manifest               | Web app manifest    |
| Open a Vix UI page as desktop app | Desktop shell       |

## Next step

Continue with tests.

[Open the tests guide](./tests.md)
