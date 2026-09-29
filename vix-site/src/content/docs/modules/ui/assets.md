# Assets

Vix UI provides small helpers for describing CSS, JavaScript, images, fonts, and production asset paths from C++.

Use the assets layer when a page needs to render `<link>`, `<script>`, image, preload, or manifest-based asset tags without manually building the same HTML strings everywhere.

```cpp
#include <vix/ui/assets/Asset.hpp>
#include <vix/ui/assets/AssetManifest.hpp>
#include <vix/ui/assets/AssetManager.hpp>
#include <vix/ui/assets/AssetMap.hpp>
#include <vix/ui/assets/AssetMode.hpp>
```

## What assets solve

A server-rendered page usually needs frontend files:

```html
<link rel="stylesheet" href="/assets/app.css" />
<script defer src="/assets/app.js"></script>
```

You can write those tags by hand, but that quickly becomes repetitive when an application grows.

Vix UI assets let C++ code describe the assets once and render the correct HTML.

```cpp
vix::ui::AssetManager assets("/assets");

assets.add_stylesheet("app_css", "app.css");
assets.add_script("app_js", "app.js", vix::ui::AssetLoading::Deferred);
assets.add_font("inter", "fonts/inter.woff2");

std::string html = assets.render();
```

## Asset

`Asset` represents one frontend resource.

It can describe:

- stylesheet
- script
- module script
- image
- font preload

## Stylesheet

```cpp
vix::ui::Asset css =
    vix::ui::Asset::stylesheet("/assets/app.css");

std::string html = css.to_html();
```

Output:

```html
<link href="/assets/app.css" media="all" rel="stylesheet" />
```

Add integrity and crossorigin metadata:

```cpp
vix::ui::Asset css =
    vix::ui::Asset::stylesheet("/assets/app.css")
        .set_integrity("sha384-demo")
        .set_crossorigin("anonymous");
```

## Script

```cpp
vix::ui::Asset script =
    vix::ui::Asset::script(
        "/assets/app.js",
        vix::ui::AssetLoading::Deferred);
```

Output:

```html
<script defer src="/assets/app.js"></script>
```

Use module scripts for modern JavaScript entry files.

```cpp
vix::ui::Asset script =
    vix::ui::Asset::module_script("/assets/app.js");
```

Output:

```html
<script src="/assets/app.js" type="module"></script>
```

## Image

```cpp
vix::ui::Asset logo =
    vix::ui::Asset::image("/assets/logo.png", "Vix UI logo");

std::string html = logo.to_html();
```

Output:

```html
<img alt="Vix UI logo" src="/assets/logo.png" />
```

Add custom attributes:

```cpp
vix::ui::Asset logo =
    vix::ui::Asset::image("/assets/logo.png", "Vix UI logo")
        .set_attr("class", "logo")
        .set_attr("width", "128")
        .set_attr("height", "128");
```

## Font preload

```cpp
vix::ui::Asset font =
    vix::ui::Asset::font("/assets/fonts/inter.woff2");

std::string html = font.to_html();
```

Output:

```html
<link
  as="font"
  crossorigin="anonymous"
  href="/assets/fonts/inter.woff2"
  rel="preload"
/>
```

## AssetManifest

`AssetManifest` stores a list of assets and renders them together.

Use it when a route or page wants to collect all assets needed by that page.

```cpp
vix::ui::AssetManifest manifest;

manifest
    .add_stylesheet("/assets/app.css")
    .add_script("/assets/app.js", vix::ui::AssetLoading::Deferred)
    .add_font("/assets/fonts/inter.woff2");

std::string html = manifest.render();
```

Render only stylesheets:

```cpp
std::string styles = manifest.render_stylesheets();
```

Render only scripts:

```cpp
std::string scripts = manifest.render_scripts();
```

## AssetManager

`AssetManager` is useful when assets have logical names.

Instead of repeating paths everywhere, you register assets once with a key.

```cpp
vix::ui::AssetManager assets("/assets");

assets.add_stylesheet("app_css", "app.css");
assets.add_script("app_js", "app.js", vix::ui::AssetLoading::Deferred);
assets.add_image("logo", "logo.png", "Vix UI logo");
assets.add_font("inter", "fonts/inter.woff2");
```

Render everything:

```cpp
std::string html = assets.render();
```

Render only stylesheets:

```cpp
std::string styles = assets.render_stylesheets();
```

Render only scripts:

```cpp
std::string scripts = assets.render_scripts();
```

## Asset base path

The manager receives a base path.

```cpp
vix::ui::AssetManager assets("/assets");
```

Then this:

```cpp
assets.add_stylesheet("app_css", "app.css");
```

resolves to:

```txt
/assets/app.css
```

Nested paths are preserved.

```cpp
assets.add_font("inter", "fonts/inter.woff2");
```

resolves to:

```txt
/assets/fonts/inter.woff2
```

## Render assets in a Vix route

```cpp
#include <vix/core.hpp>
#include <vix/ui.hpp>

int main()
{
  vix::App app;

  app.get("/", [](vix::Request &req, vix::Response &res) {
    (void)req;

    vix::ui::AssetManager assets("/assets");

    assets.add_stylesheet("app_css", "app.css");
    assets.add_script(
        "app_js",
        "app.js",
        vix::ui::AssetLoading::Deferred);

    const std::string html =
        "<!doctype html>"
        "<html lang=\"en\">"
        "<head>"
        "<meta charset=\"utf-8\">"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
        "<title>Vix UI Assets</title>" +
        assets.render() +
        "</head>"
        "<body>"
        "<main>"
        "<h1>Vix UI Assets</h1>"
        "<p>Assets rendered from C++.</p>"
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
vix run main.cpp
```

## Render assets inside a template

When using `View`, render assets in C++ and pass them to the template as safe HTML.

```cpp
vix::ui::AssetManager assets("/assets");

assets.add_stylesheet("app_css", "app.css");
assets.add_script("app_js", "app.js", vix::ui::AssetLoading::Deferred);

auto view =
    vix::ui::View("dashboard.html")
        .set_title("Dashboard")
        .set("assets", assets.render());

res.ui(view);
```

Template:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>{{ page_title }}</title>

    {{ assets | safe }}
  </head>
  <body>
    <h1>{{ page_title }}</h1>
  </body>
</html>
```

Use `safe` only for HTML generated by trusted helpers or trusted application code.

## Asset groups

Asset groups let an application organize files by page or feature.

```cpp
vix::ui::AssetManager assets("/assets");

assets.add_stylesheet_to("dashboard", "app_css", "css/app.css");
assets.add_stylesheet_to("dashboard", "dashboard_css", "css/dashboard.css");

assets.add_script_to(
    "dashboard",
    "runtime_js",
    "js/runtime.js",
    vix::ui::AssetLoading::Deferred);

assets.add_module_script_to("dashboard", "dashboard_js", "js/dashboard.js");
```

Render the group:

```cpp
std::string html = assets.render_group("dashboard");
```

This is useful when different pages need different frontend files.

```txt
dashboard page -> dashboard group
admin page     -> admin group
public page    -> public group
```

## Development mode

In development, assets usually keep their normal paths.

```cpp
vix::ui::AssetManager assets("/assets");

assets.set_mode(vix::ui::AssetMode::Development);

assets.add_stylesheet_to("app", "app_css", "css/app.css");
assets.add_module_script_to("app", "app_js", "js/app.js");

std::string html = assets.render_group("app");
```

The rendered paths remain close to the source paths.

```txt
/assets/css/app.css
/assets/js/app.js
```

## Production mode

In production, applications often use hashed filenames.

```txt
css/app.css      -> css/app.8fd21c.css
js/app.js        -> js/app.91af03.js
```

Vix UI does not build or bundle those files.

It only helps resolve and render the final paths.

```cpp
vix::ui::AssetManager assets("/assets");

assets.set_mode(vix::ui::AssetMode::Production);
assets.set_version("0.8.0");

assets.add_stylesheet_to("app", "app_css", "css/app.css");
assets.add_module_script_to("app", "app_js", "js/app.js");

std::string html = assets.render_group("app");
```

## AssetMap

`AssetMap` maps source asset paths to production paths.

Use it when a frontend build tool produces a manifest.

```cpp
vix::ui::AssetMap manifest;

manifest.set("css/app.css", "css/app.8fd21c.css");
manifest.set("css/dashboard.css", "css/dashboard.4ac922.css");
manifest.set("js/app.js", "js/app.91af03.js");
```

Attach it to the manager:

```cpp
vix::ui::AssetManager assets("/assets");

assets.set_mode(vix::ui::AssetMode::Production);
assets.set_manifest(manifest);

assets.add_stylesheet_to("dashboard", "app_css", "css/app.css");
assets.add_stylesheet_to("dashboard", "dashboard_css", "css/dashboard.css");
assets.add_module_script_to("dashboard", "app_js", "js/app.js");

std::string html = assets.render_group("dashboard");
```

The manager resolves the production paths before rendering.

```txt
/assets/css/app.8fd21c.css
/assets/css/dashboard.4ac922.css
/assets/js/app.91af03.js
```

## Direct path lookup

Use `path()` when you need the resolved asset URL.

```cpp
std::string css = assets.path("css/app.css");
std::string js = assets.path("js/app.js");
```

With a manifest, the logical path is resolved to the production path.

```txt
css/app.css -> /assets/css/app.8fd21c.css
js/app.js   -> /assets/js/app.91af03.js
```

If the path does not exist in the manifest, the original path is still resolved from the base path.

```cpp
std::string missing = assets.path("missing.css");
```

Result:

```txt
/assets/missing.css
```

## Complete production example

```cpp
#include <iostream>

#include <vix/ui/assets/AssetManager.hpp>
#include <vix/ui/assets/AssetMap.hpp>
#include <vix/ui/assets/AssetMode.hpp>

int main()
{
  vix::ui::AssetMap manifest;

  manifest.set("css/app.css", "css/app.8fd21c.css");
  manifest.set("css/dashboard.css", "css/dashboard.4ac922.css");
  manifest.set("js/app.js", "js/app.91af03.js");

  vix::ui::AssetManager assets("/assets");

  assets.set_mode(vix::ui::AssetMode::Production);
  assets.set_manifest(manifest);

  assets.add_stylesheet_to("dashboard", "app_css", "css/app.css");
  assets.add_stylesheet_to("dashboard", "dashboard_css", "css/dashboard.css");
  assets.add_module_script_to("dashboard", "app_js", "js/app.js");

  std::cout << assets.render_group("dashboard") << "\n";

  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

## What Vix UI assets do not do

The asset layer does not:

- bundle JavaScript
- compile CSS
- minify files
- fingerprint files
- serve static files
- watch frontend files
- replace Vite, esbuild, Webpack, Rollup, or another frontend build tool

It only describes asset references and renders the final HTML tags.

The application or build pipeline remains responsible for creating the actual files.

## Serving static files

Assets render references to files.

The files must still be served by the application or another static file server.

```cpp
app.static_dir("public");
```

Then a file like:

```txt
public/assets/app.css
```

can be referenced as:

```txt
/assets/app.css
```

## Escaping and attributes

Custom attribute values are escaped before rendering.

```cpp
vix::ui::Asset css =
    vix::ui::Asset::stylesheet("/assets/app.css")
        .set_attr("data-note", "main \"bundle\" & styles");
```

This keeps generated tags safe for normal HTML output.

## Common mistakes

### Expecting AssetManager to serve files

Wrong expectation:

```txt
AssetManager renders /assets/app.css, so the file is automatically served.
```

Correct understanding:

```txt
AssetManager renders the HTML tag.
The application still needs to serve the actual file.
```

### Passing generated HTML without `safe` in templates

Wrong:

```html
{{ assets }}
```

This may escape the tags.

Correct:

```html
{{ assets | safe }}
```

### Using production mode without a manifest

Production mode is useful when the app can resolve production paths.

For hashed files, provide an `AssetMap`.

```cpp
assets.set_manifest(manifest);
```

### Duplicating asset paths everywhere

Prefer logical names:

```cpp
assets.add_stylesheet("app_css", "css/app.css");
```

Then render from the manager instead of manually repeating the same tag in many routes.

## What to remember

Use `Asset` for one resource.

Use `AssetManifest` for a simple list of resources.

Use `AssetManager` when you want logical names, groups, base paths, production mode, or manifest lookup.

```txt
Asset        -> one file
AssetManifest -> page-level list
AssetManager  -> app-level asset registry
AssetMap      -> production path mapping
```

## Next step

Continue with forms.

[Open the forms guide](./forms.md)
