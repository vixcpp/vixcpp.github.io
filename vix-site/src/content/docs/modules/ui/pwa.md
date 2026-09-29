# PWA helpers

Vix UI provides small helpers for mobile-ready pages and installable web apps.

They help you render viewport metadata, safe-area CSS, web app manifests, and common PWA/mobile tags without hand-writing the same HTML every time.

```cpp
#include <vix/ui/pwa/Viewport.hpp>
#include <vix/ui/pwa/SafeArea.hpp>
#include <vix/ui/pwa/WebAppManifest.hpp>
#include <vix/ui/pwa/PwaMeta.hpp>
```

Use these helpers when your Vix application needs to work well on phones, tablets, desktop browsers, or WebView-based app shells.

## What PWA helpers solve

A mobile-ready web page usually needs more than regular HTML.

It often needs:

- a correct viewport tag
- safe-area support for notches and rounded screens
- theme color metadata
- mobile web app metadata
- a web app manifest
- installable app icons
- predictable mobile display behavior

Vix UI keeps those pieces small and explicit.

## Viewport

`Viewport` renders the `<meta name="viewport">` tag.

The default viewport is responsive:

```cpp
vix::ui::Viewport viewport;

std::string html = viewport.render();
```

Output:

```html
<meta content="width=device-width, initial-scale=1" name="viewport" />
```

## Mobile app viewport

For mobile apps and WebView shells, use `mobile_app()`.

```cpp
vix::ui::Viewport viewport = vix::ui::Viewport::mobile_app();

std::string html = viewport.render();
```

Output:

```html
<meta
  content="width=device-width, initial-scale=1, viewport-fit=cover"
  name="viewport"
/>
```

`viewport-fit=cover` allows the page to use the full screen area on mobile devices.

It is commonly used together with safe-area CSS.

## Custom viewport

```cpp
vix::ui::Viewport viewport;

viewport.set_width("device-width")
    .set_initial_scale("1")
    .set_minimum_scale("1")
    .set_maximum_scale("5")
    .set_user_scalable(true)
    .set_viewport_fit(vix::ui::ViewportFit::Cover);

std::string html = viewport.render();
```

The generated `content` value is built from the options that are set.

Empty values are skipped.

## Viewport attributes

You can add custom attributes when needed.

```cpp
vix::ui::Viewport viewport;

viewport.set_attr("id", "main-viewport");
viewport.set_attr("data-source", "vix-ui");

std::string html = viewport.render();
```

Output:

```html
<meta
  content="width=device-width, initial-scale=1"
  data-source="vix-ui"
  id="main-viewport"
  name="viewport"
/>
```

Attribute values are escaped before rendering.

## SafeArea

`SafeArea` renders CSS variables and classes for mobile safe-area insets.

This is useful on phones with notches, rounded corners, home indicators, or system bars.

```cpp
vix::ui::SafeArea safe_area = vix::ui::SafeArea::all();

std::string css = safe_area.render();
```

Output:

```css
:root {
  --vix-safe-area-top: env(safe-area-inset-top);
  --vix-safe-area-right: env(safe-area-inset-right);
  --vix-safe-area-bottom: env(safe-area-inset-bottom);
  --vix-safe-area-left: env(safe-area-inset-left);
}
.vix-safe-area {
  padding-top: var(--vix-safe-area-top);
  padding-right: var(--vix-safe-area-right);
  padding-bottom: var(--vix-safe-area-bottom);
  padding-left: var(--vix-safe-area-left);
}
```

## Vertical safe area

Most mobile pages only need top and bottom safe-area padding.

```cpp
vix::ui::SafeArea safe_area = vix::ui::SafeArea::vertical();

std::string css = safe_area.render();
```

Output:

```css
:root {
  --vix-safe-area-top: env(safe-area-inset-top);
  --vix-safe-area-bottom: env(safe-area-inset-bottom);
}
.vix-safe-area {
  padding-top: var(--vix-safe-area-top);
  padding-bottom: var(--vix-safe-area-bottom);
}
```

Use the generated class in your page:

```html
<main class="vix-safe-area">...</main>
```

## Custom safe-area names

You can change the selector, class name, and CSS variable prefix.

```cpp
vix::ui::SafeArea safe_area;

safe_area.set_root_selector("html")
    .set_class_name("mobile-safe")
    .set_variable_prefix("--app-safe")
    .set_top("10px")
    .set_right("20px")
    .set_bottom("30px")
    .set_left("40px");

std::string css = safe_area.render();
```

Output:

```css
html {
  --app-safe-top: 10px;
  --app-safe-right: 20px;
  --app-safe-bottom: 30px;
  --app-safe-left: 40px;
}
.mobile-safe {
  padding-top: var(--app-safe-top);
  padding-right: var(--app-safe-right);
  padding-bottom: var(--app-safe-bottom);
  padding-left: var(--app-safe-left);
}
```

## PwaMeta

`PwaMeta` renders common mobile and PWA metadata.

Use it when you want a page to behave more like an app on mobile devices.

```cpp
vix::ui::PwaMeta meta =
    vix::ui::PwaMeta::mobile_app("Vix Mobile", "#111111");

std::string html = meta.render();
```

Example output:

```html
<meta
  content="width=device-width, initial-scale=1, viewport-fit=cover"
  name="viewport"
/>
<link href="/manifest.webmanifest" rel="manifest" />
<meta content="#111111" name="theme-color" />
<meta content="Vix Mobile" name="application-name" />
<meta content="yes" name="apple-mobile-web-app-capable" />
<meta content="Vix Mobile" name="apple-mobile-web-app-title" />
<meta
  content="black-translucent"
  name="apple-mobile-web-app-status-bar-style"
/>
```

## Add color scheme and format detection

```cpp
vix::ui::PwaMeta meta =
    vix::ui::PwaMeta::mobile_app("Vix Mobile", "#111111");

meta.set_color_scheme("light dark")
    .set_format_detection("telephone=no");

std::string html = meta.render();
```

This adds metadata such as:

```html
<meta content="light dark" name="color-scheme" />
<meta content="telephone=no" name="format-detection" />
```

`format-detection` is useful when you do not want mobile browsers to automatically detect phone numbers.

## WebAppManifest

`WebAppManifest` builds a deterministic manifest JSON document.

The manifest describes how the web app should appear when installed.

```cpp
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

manifest.add_icon(
    "/icons/icon-192.png",
    "192x192",
    "image/png");

manifest.add_icon(
    "/icons/icon-512.png",
    "512x512",
    "image/png",
    "any maskable");

std::string json = manifest.render();
```

Example output:

```json
{
  "name": "Vix Mobile",
  "short_name": "Vix",
  "description": "A mobile-ready Vix UI application",
  "start_url": "/",
  "scope": "/",
  "id": "com.vix.mobile",
  "lang": "en",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#111111",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

## Manifest route

A Vix application can expose the manifest from a route.

```cpp
#include <vix/core.hpp>
#include <vix/ui.hpp>

int main()
{
  vix::App app;

  app.get("/manifest.webmanifest", [](vix::Request &req, vix::Response &res) {
    (void)req;

    const std::string manifest =
        vix::ui::WebAppManifest::app("Vix UI PWA", "Vix UI")
            .set_description("A PWA metadata example powered by vix::ui.")
            .set_theme_color("#0f172a")
            .set_background_color("#0f172a")
            .render();

    res.ui(
        vix::ui::HtmlResponse::html(manifest)
            .set_content_type("application/manifest+json"));
  });

  app.run(8080);
  return 0;
}
```

The response body is JSON, but `HtmlResponse` can still carry the body, status, and content type.

## Complete PWA page example

```cpp
#include <vix/core.hpp>
#include <vix/ui.hpp>

int main()
{
  vix::App app;

  app.get("/", [](vix::Request &req, vix::Response &res) {
    (void)req;

    const std::string pwa_meta =
        vix::ui::PwaMeta::mobile_app("Vix UI PWA", "#0f172a")
            .set_color_scheme("light dark")
            .set_format_detection("telephone=no")
            .render();

    const std::string safe_area =
        vix::ui::SafeArea::all().render();

    const std::string html =
        "<!doctype html>"
        "<html lang=\"en\">"
        "<head>"
        "<meta charset=\"utf-8\">"
        "<title>Vix UI PWA</title>" +
        pwa_meta +
        "<style>" +
        safe_area +
        "body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e5e7eb;}"
        "main{max-width:900px;margin:0 auto;padding:56px 24px;}"
        ".card{padding:32px;border-radius:24px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);}"
        "h1{color:white;}"
        "</style>"
        "</head>"
        "<body>"
        "<main class=\"vix-safe-area\">"
        "<section class=\"card\">"
        "<h1>Vix UI PWA</h1>"
        "<p>This page includes viewport, manifest and safe-area metadata.</p>"
        "</section>"
        "</main>"
        "</body>"
        "</html>";

    res.ui(vix::ui::HtmlResponse::html(html));
  });

  app.get("/manifest.webmanifest", [](vix::Request &req, vix::Response &res) {
    (void)req;

    const std::string manifest =
        vix::ui::WebAppManifest::app("Vix UI PWA", "Vix UI")
            .set_description("A mobile-ready Vix UI application.")
            .set_start_url("/")
            .set_scope("/")
            .set_display(vix::ui::WebAppDisplayMode::Standalone)
            .set_theme_color("#0f172a")
            .set_background_color("#0f172a")
            .add_icon("/icons/icon-192.png", "192x192", "image/png")
            .add_icon("/icons/icon-512.png", "512x512", "image/png", "any maskable")
            .render();

    res.ui(
        vix::ui::HtmlResponse::html(manifest)
            .set_content_type("application/manifest+json"));
  });

  app.run(8080);
  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

## Using PWA helpers with templates

Create the metadata in C++:

```cpp
const std::string pwa_meta =
    vix::ui::PwaMeta::mobile_app("Vix UI PWA", "#0f172a")
        .render();

const std::string safe_area =
    vix::ui::SafeArea::all().render();

auto view =
    vix::ui::View("pwa.html")
        .set_title("Vix UI PWA")
        .set("pwa_meta", pwa_meta)
        .set("safe_area", safe_area);
```

Use it inside the template:

```html
<head>
  <meta charset="utf-8" />
  <title>{{ page_title }}</title>

  {{ pwa_meta | safe }}

  <style>
    {{ safe_area | safe }}

    body {
      margin: 0;
      font-family: system-ui, sans-serif;
    }
  </style>
</head>

<body>
  <main class="vix-safe-area">...</main>
</body>
```

Use `safe` because these helpers already return HTML or CSS.

## Full template example

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>{{ page_title }}</title>

    {{ pwa_meta | safe }}

    <style>
      {{ safe_area | safe }}

      body {
        margin: 0;
        font-family: system-ui, sans-serif;
        background: #0f172a;
        color: #e5e7eb;
      }

      main {
        max-width: 900px;
        margin: 0 auto;
        padding: 56px 24px;
      }

      .card {
        padding: 32px;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
      }

      h1 {
        color: white;
      }
    </style>
  </head>

  <body>
    <main class="vix-safe-area">
      <section class="card">
        <h1>{{ page_title }}</h1>
        <p>This page includes viewport, manifest and safe-area metadata.</p>
      </section>
    </main>
  </body>
</html>
```

## Small standalone example

```cpp
#include <iostream>

#include <vix/ui/pwa/PwaMeta.hpp>
#include <vix/ui/pwa/SafeArea.hpp>
#include <vix/ui/pwa/Viewport.hpp>

int main()
{
  vix::ui::Viewport viewport = vix::ui::Viewport::mobile_app();

  std::cout << "Viewport meta:\n";
  std::cout << viewport.render() << "\n\n";

  vix::ui::SafeArea safe_area = vix::ui::SafeArea::vertical();

  std::cout << "Safe-area CSS:\n";
  std::cout << safe_area.render() << "\n\n";

  vix::ui::PwaMeta meta = vix::ui::PwaMeta::mobile_app("Vix Mobile", "#111111");

  meta.set_color_scheme("light dark")
      .set_format_detection("telephone=no");

  std::cout << "PWA meta tags:\n";
  std::cout << meta.render() << "\n";

  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

## Common mistakes

### Forgetting viewport metadata

A mobile page without a viewport tag may render too wide or zoomed out.

Use:

```cpp
vix::ui::Viewport::responsive().render();
```

For app-like mobile pages, use:

```cpp
vix::ui::Viewport::mobile_app().render();
```

### Using safe-area CSS without the class

Rendering the CSS is not enough.

Wrong:

```html
<main>...</main>
```

Correct:

```html
<main class="vix-safe-area">...</main>
```

### Forgetting `safe` in templates

Wrong:

```html
{{ pwa_meta }} {{ safe_area }}
```

Correct:

```html
{{ pwa_meta | safe }} {{ safe_area | safe }}
```

### Returning the manifest as plain HTML

The manifest should use a manifest content type.

```cpp
res.ui(
    vix::ui::HtmlResponse::html(manifest)
        .set_content_type("application/manifest+json"));
```

### Expecting PwaMeta to generate icons

`PwaMeta` renders metadata tags.

Use `WebAppManifest` to describe installable app icons.

```cpp
manifest.add_icon("/icons/icon-192.png", "192x192", "image/png");
```

## What to remember

Use `Viewport` for responsive and mobile viewport metadata.

Use `SafeArea` for mobile screen insets.

Use `PwaMeta` for common mobile and PWA tags.

Use `WebAppManifest` to generate the installable app manifest.

```txt
Viewport       -> viewport meta tag
SafeArea       -> safe-area CSS variables and class
PwaMeta        -> mobile/PWA HTML metadata
WebAppManifest -> manifest JSON
```

## Next step

Continue with the app shell.

[Open the app shell guide](./app-shell.md)
