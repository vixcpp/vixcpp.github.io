# Vix UI

`vix::ui` is the UI layer for Vix.cpp applications.

It helps you build server-rendered pages, dashboards, forms, live HTML fragments, PWA metadata, and WebView-based app shells using C++.

```cpp
#include <vix/ui.hpp>
```

## What Vix UI is for

Use Vix UI when your application needs a web interface but you still want to stay close to C++.

It is useful for:

- admin panels
- dashboards
- internal tools
- server-rendered websites
- forms and validation screens
- mobile-ready web apps
- desktop shells powered by a local Vix server
- small UI fragments returned from routes or live updates

Vix UI is not a frontend framework. It does not replace HTML, CSS, or the Vix template engine.

It gives you practical C++ helpers around them.

## Basic page

A common Vix UI page starts with a route, creates a view, fills it with data, and sends it as a response.

```cpp
#include <vix.hpp>
#include <vix/ui.hpp>

int main()
{
  vix::App app;

  app.templates("templates");

  app.get("/", [](vix::Request &, vix::Response &res) {
    auto view =
        vix::ui::View("home.html")
            .set_title("Dashboard")
            .set("framework", "Vix.cpp")
            .set("module", "vix::ui");

    res.ui(view);
  });

  app.run(8080);
  return 0;
}
```

Template:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>{{ page_title }}</title>
  </head>

  <body>
    <main>
      <h1>{{ page_title }}</h1>
      <p>{{ framework }} page rendered with {{ module }}.</p>
    </main>
  </body>
</html>
```

Run it:

```bash
vix run main.cpp
```

## Core ideas

Vix UI is built around a few simple ideas.

| Idea           | Purpose                                             |
| -------------- | --------------------------------------------------- |
| Views          | Pass page data to templates                         |
| HTML helpers   | Generate escaped HTML safely from C++               |
| HTML responses | Represent rendered HTML before sending it           |
| Assets         | Render stylesheets, scripts, fonts, and images      |
| Forms          | Build server-rendered forms and keep old input      |
| Live fragments | Return small HTML pieces for partial updates        |
| PWA helpers    | Generate viewport, safe-area, and manifest metadata |
| App shell      | Open a Vix web UI inside a desktop shell            |

## When to use templates

Use templates for full pages.

```cpp
auto view =
    vix::ui::View("profile.html")
        .set_title("Profile")
        .set("name", "Gaspard");

res.ui(view);
```

Templates are best when the page has real structure:

```html
<h1>{{ page_title }}</h1>
<p>Hello {{ name }}</p>
```

## When to use HTML helpers

Use HTML helpers for small pieces of generated markup.

```cpp
vix::ui::HtmlAttrs attrs;
attrs.set("class", "card");

std::string card =
    vix::ui::Html::tag(
        "section",
        vix::ui::Html::tag("h2", vix::ui::Html::text("Stats")),
        attrs);
```

HTML text is escaped by default when you use `Html::text`.

## When to use forms

Use forms when you want to describe inputs from C++ and render them consistently.

```cpp
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

std::string html = form.render();
```

Forms can also bind old input after validation fails.

```cpp
vix::ui::FormData old_input;
old_input.set("email", "hello@example.com");

form.bind(old_input);
form.add_error("email", "This email is already used.");
```

## When to use live fragments

Use fragments when only part of the page needs to change.

```cpp
vix::ui::Fragment stats =
    vix::ui::Fragment::make("stats")
        .set_target("#stats")
        .set_html("<strong>128</strong><span> users</span>");

std::string html = stats.render();
```

For WebSocket-style updates, use `LiveUpdate`.

```cpp
vix::ui::LiveUpdate update =
    vix::ui::LiveUpdate::replace("#stats", stats);

std::string payload = update.to_json();
```

## When to use PWA helpers

Use PWA helpers when your page needs mobile-friendly metadata.

```cpp
std::string meta =
    vix::ui::PwaMeta::mobile_app("Vix Mobile", "#111111")
        .render();

std::string safe_area =
    vix::ui::SafeArea::all().render();
```

This is useful for mobile WebView apps and installable web apps.

## When to use the app shell

Use the app shell when you already have a Vix web UI and want to open it inside a desktop window.

```bash
vix desktop run ui_dashboard.cpp --port 8080
```

The desktop shell runs the Vix server and opens the target URL in a WebView shell.

## Upgrade the SDK

Some UI shell features require the desktop SDK.

```bash
vix upgrade --sdk install desktop
```

Check available SDKs:

```bash
vix upgrade --sdk list
```

## Recommended reading order

Start here, then continue with the pages that match what you are building.

1. [Views](./views)
2. [HTML helpers](./html)
3. [HTML responses](./html-response)
4. [Assets](./assets)
5. [Forms](./forms)
6. [Live UI](./live)
7. [PWA helpers](./pwa)
8. [App shell](./app-shell)
9. [Examples](./examples)

For commands:

1. [Desktop command](../../cli/desktop)
2. [Mobile command](../../cli/mobile)
3. [Note command](../../cli/note)

## What Vix UI does not try to be

Vix UI is not:

- a React clone
- a Flutter clone
- a Qt replacement
- a native widget toolkit
- a virtual DOM framework
- a CSS framework
- a JavaScript bundler

The goal is simpler:

```txt
C++ server
Vix templates
small UI helpers
HTML-first interfaces
WebView shells when needed
```

## Next step

Continue with views.

[Open the Views guide](./views)
