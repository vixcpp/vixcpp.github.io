# Live UI

Vix UI live helpers let an application render small HTML pieces from C++ and describe how the browser should apply them.

They are useful for dashboards, counters, notifications, status panels, table rows, chat previews, admin pages, and any interface where a small part of the page changes without rendering the full page again.

```cpp
#include <vix/ui/live/Fragment.hpp>
#include <vix/ui/live/LiveUpdate.hpp>
#include <vix/ui/live/FlashMessage.hpp>
#include <vix/ui/live/Toast.hpp>
```

## What live helpers solve

A web page often needs to update one small area.

For example:

```html
<section id="stats">
  <strong>42</strong>
  <span>active users</span>
</section>
```

Instead of rebuilding the whole page, the server can render only the new fragment:

```cpp
vix::ui::Fragment stats =
    vix::ui::Fragment::make("dashboard-stats")
        .set_target("#stats")
        .set_html("<strong>128</strong><span>active users</span>");
```

Then the application can send the rendered HTML, or send a JSON update describing what the client should do with it.

## Fragment

`Fragment` represents a small HTML piece.

It can be returned from a route, embedded inside a template, or sent through a WebSocket-friendly payload.

```cpp
vix::ui::Fragment fragment =
    vix::ui::Fragment::make("stats")
        .set_html("<strong>42</strong><span>users</span>");
```

Render the raw HTML:

```cpp
std::string html = fragment.render();
```

Output:

```html
<strong>42</strong><span>users</span>
```

## Basic fragment example

```cpp
#include <iostream>

#include <vix/ui/live/Fragment.hpp>

int main()
{
  vix::ui::Fragment stats =
      vix::ui::Fragment::make("dashboard-stats")
          .set_target("#stats-card")
          .set_attr("class", "stats-fragment")
          .set_html(
              "<div class=\"stat-card\">"
              "<strong>128</strong>"
              "<span>active users</span>"
              "</div>");

  std::cout << "Raw fragment:\n";
  std::cout << stats.render() << "\n\n";

  std::cout << "Wrapped fragment:\n";
  std::cout << stats.render_wrapped() << "\n";

  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

## Named fragments

A fragment can have a name.

```cpp
vix::ui::Fragment fragment = vix::ui::Fragment::make("user-row");
```

The name is useful when the client, logs, or update payload needs to know what kind of UI piece was rendered.

```cpp
fragment.name();      // user-row
fragment.has_name();  // true
```

## Fragment target

A target describes where the fragment should be applied in the page.

```cpp
fragment.set_target("#stats-card");
```

The target is usually a CSS selector.

```cpp
fragment.target();      // #stats-card
fragment.has_target();  // true
```

The target does not modify the HTML by itself. It becomes useful when the fragment is wrapped or used with `LiveUpdate`.

## Raw render

`render()` returns the fragment HTML exactly as stored.

```cpp
vix::ui::Fragment fragment =
    vix::ui::Fragment::html("<p>Saved</p>");

std::string html = fragment.render();
```

Output:

```html
<p>Saved</p>
```

Use raw rendering when the surrounding page already has the container.

## Wrapped render

`render_wrapped()` renders the fragment inside a wrapper element.

```cpp
vix::ui::Fragment fragment =
    vix::ui::Fragment::make("stats")
        .set_target("#stats")
        .set_html("<span>42 users</span>");

std::string html = fragment.render_wrapped();
```

Output:

```html
<div data-fragment="stats" data-target="#stats"><span>42 users</span></div>
```

This is useful when the client needs metadata in the DOM.

## Custom wrapper tag

The default wrapper tag is `div`.

You can choose another tag:

```cpp
vix::ui::Fragment row =
    vix::ui::Fragment::make("user-row")
        .set_html("<td>Gaspard</td><td>online</td>");

std::string html = row.render_wrapped("tr");
```

Output:

```html
<tr data-fragment="user-row">
  <td>Gaspard</td>
  <td>online</td>
</tr>
```

## Fragment attributes

Fragments support custom attributes on the wrapper.

```cpp
vix::ui::Fragment fragment =
    vix::ui::Fragment::make("stats")
        .set_target("#stats")
        .set_attr("class", "card")
        .set_bool_attr("hidden", true)
        .set_html("<span>42 users</span>");
```

Wrapped output:

```html
<div class="card" data-fragment="stats" data-target="#stats" hidden>
  <span>42 users</span>
</div>
```

Attribute values are escaped before rendering.

## LiveUpdate

`LiveUpdate` describes how a client should apply a fragment.

It does not force a specific frontend framework. It gives the server a small, predictable update payload.

```cpp
vix::ui::LiveUpdate update =
    vix::ui::LiveUpdate::replace("#stats", fragment);
```

Supported actions:

| Action    | Meaning                                |
| --------- | -------------------------------------- |
| `replace` | Replace the target content or element  |
| `append`  | Append the fragment inside the target  |
| `prepend` | Prepend the fragment inside the target |
| `before`  | Insert the fragment before the target  |
| `after`   | Insert the fragment after the target   |
| `remove`  | Remove the target                      |
| `none`    | No UI change                           |

## Replace update

```cpp
vix::ui::Fragment stats =
    vix::ui::Fragment::make("dashboard-stats")
        .set_html("<strong>128</strong><span>active users</span>");

vix::ui::LiveUpdate update =
    vix::ui::LiveUpdate::replace("#stats-card", stats);
```

Render the HTML:

```cpp
std::string html = update.render();
```

Render the update payload:

```cpp
std::string json = update.to_json();
```

Example payload:

```json
{
  "type": "ui.update",
  "action": "replace",
  "target": "#stats-card",
  "fragment": "dashboard-stats",
  "html": "<strong>128</strong><span>active users</span>"
}
```

## Append update

```cpp
vix::ui::Fragment message =
    vix::ui::Fragment::make("message")
        .set_html("<li>Hello</li>");

vix::ui::LiveUpdate update =
    vix::ui::LiveUpdate::append("#messages", message);
```

Use append when adding a new item at the end of a list.

## Prepend update

```cpp
vix::ui::Fragment message =
    vix::ui::Fragment::make("message")
        .set_html("<li>First message</li>");

vix::ui::LiveUpdate update =
    vix::ui::LiveUpdate::prepend("#messages", message);
```

Use prepend when the newest item should appear first.

## Before and after updates

Insert content before a target:

```cpp
vix::ui::LiveUpdate update =
    vix::ui::LiveUpdate::before("#content", fragment);
```

Insert content after a target:

```cpp
vix::ui::LiveUpdate update =
    vix::ui::LiveUpdate::after("#content", fragment);
```

These actions are useful for banners, inline messages, or contextual UI blocks.

## Remove update

A remove update does not need a fragment.

```cpp
vix::ui::LiveUpdate update =
    vix::ui::LiveUpdate::remove("#toast-old");
```

Payload:

```json
{ "type": "ui.update", "action": "remove", "target": "#toast-old" }
```

For `remove`, `render()` returns an empty string because there is no HTML to render.

## None update

Use `none` when the server wants to return a valid update object but no UI change is needed.

```cpp
vix::ui::LiveUpdate update = vix::ui::LiveUpdate::none();
```

Payload:

```json
{ "type": "ui.update", "action": "none" }
```

## Events and IDs

A live update can include an event name and an ID.

```cpp
vix::ui::LiveUpdate update =
    vix::ui::LiveUpdate::replace("#user-42", row)
        .set_event("users.updated")
        .set_id("update-42");
```

Example payload:

```json
{
  "type": "ui.update",
  "action": "replace",
  "target": "#user-42",
  "event": "users.updated",
  "id": "update-42",
  "fragment": "user-row",
  "html": "<tr id=\"user-42\"><td>Gaspard</td><td>online</td></tr>"
}
```

Use an event name when the client needs to route updates by domain.

Use an ID when the application needs traceability, deduplication, or debugging.

## Complete LiveUpdate example

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

  std::cout << "Rendered HTML:\n";
  std::cout << update.render() << "\n\n";

  std::cout << "WebSocket-friendly payload:\n";
  std::cout << update.to_json() << "\n\n";

  vix::ui::LiveUpdate remove =
      vix::ui::LiveUpdate::remove("#toast-old")
          .set_event("toast.remove");

  std::cout << "Remove payload:\n";
  std::cout << remove.to_json() << "\n";

  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

## Flash messages

`FlashMessage` renders a message block inside the page.

It is useful after an action succeeds or fails.

```cpp
vix::ui::FlashMessage flash =
    vix::ui::FlashMessage::success("Profile updated successfully.")
        .set_title("Saved")
        .set_dismissible(true);
```

Render it:

```cpp
std::string html = flash.render();
```

## Flash levels

Supported flash levels:

| Level     | Use case                  |
| --------- | ------------------------- |
| `Info`    | General information       |
| `Success` | Successful action         |
| `Warning` | Something needs attention |
| `Error`   | Failed action             |
| `Neutral` | Plain status message      |

Factories:

```cpp
vix::ui::FlashMessage::info("Welcome back.");
vix::ui::FlashMessage::success("Profile saved.");
vix::ui::FlashMessage::warning("Storage is almost full.");
vix::ui::FlashMessage::error("Something went wrong.");
vix::ui::FlashMessage::neutral("No changes detected.");
```

## Flash with title

```cpp
vix::ui::FlashMessage flash =
    vix::ui::FlashMessage::success("Profile updated.")
        .set_title("Saved");
```

Example output:

```html
<div class="flash flash-success" data-flash-level="success" role="status">
  <strong class="flash-title">Saved</strong
  ><span class="flash-message">Profile updated.</span>
</div>
```

Error flashes use `role="alert"`.

```cpp
vix::ui::FlashMessage flash =
    vix::ui::FlashMessage::error("Something went wrong.");
```

## Dismissible flash

```cpp
vix::ui::FlashMessage flash =
    vix::ui::FlashMessage::info("You can close this.")
        .set_dismissible(true);
```

This adds a `data-dismissible` attribute.

The helper renders the HTML. The application or frontend script decides how dismissal works.

## Toasts

`Toast` renders a small notification block.

Use it for temporary messages such as background sync, save confirmations, connection status, or lightweight alerts.

```cpp
vix::ui::Toast toast =
    vix::ui::Toast::info("Background sync completed.")
        .set_title("Sync");
```

Render it:

```cpp
std::string html = toast.render();
```

## Toast levels

Common toast factories:

```cpp
vix::ui::Toast::info("Background sync completed.");
vix::ui::Toast::success("Saved successfully.");
vix::ui::Toast::warning("Connection is slow.");
vix::ui::Toast::error("Connection lost.");
vix::ui::Toast::neutral("No changes detected.");
```

## Toast position

```cpp
vix::ui::Toast toast =
    vix::ui::Toast::info("Background sync completed.")
        .set_title("Sync")
        .set_position(vix::ui::ToastPosition::BottomRight);
```

Common positions include top and bottom placements such as top-right or bottom-right.

The rendered HTML includes position metadata that your CSS or JavaScript can use.

## Toast timeout

```cpp
#include <chrono>

vix::ui::Toast toast =
    vix::ui::Toast::info("Background sync completed.")
        .set_timeout(std::chrono::milliseconds(3000));
```

Disable auto hide:

```cpp
vix::ui::Toast toast =
    vix::ui::Toast::error("Connection lost.")
        .set_auto_hide(false);
```

The timeout is metadata. The client-side behavior is still controlled by the application.

## Flash and toast example

```cpp
#include <chrono>
#include <iostream>

#include <vix/ui/live/FlashMessage.hpp>
#include <vix/ui/live/Toast.hpp>

int main()
{
  vix::ui::FlashMessage flash =
      vix::ui::FlashMessage::success("Profile updated successfully.")
          .set_title("Saved")
          .set_dismissible(true);

  vix::ui::Toast toast =
      vix::ui::Toast::info("Background sync completed.")
          .set_title("Sync")
          .set_position(vix::ui::ToastPosition::BottomRight)
          .set_timeout(std::chrono::milliseconds(3000));

  std::cout << "Flash message:\n";
  std::cout << flash.render() << "\n\n";

  std::cout << "Toast:\n";
  std::cout << toast.render() << "\n";

  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

## Using live helpers in a Vix route

```cpp
#include <vix/core.hpp>
#include <vix/ui.hpp>

int main()
{
  vix::App app;

  app.get("/", [](vix::Request &req, vix::Response &res) {
    (void)req;

    const std::string flash =
        vix::ui::FlashMessage::success("The page was rendered from C++.")
            .set_title("Success")
            .set_dismissible(true)
            .render();

    const std::string toast =
        vix::ui::Toast::info("This is a UI toast.")
            .set_title("Vix UI")
            .render();

    const std::string fragment =
        vix::ui::Fragment::make("counter")
            .set_html("<strong>42</strong><span> live updates</span>")
            .render_wrapped();

    const std::string html =
        "<!doctype html>"
        "<html lang=\"en\">"
        "<head>"
        "<meta charset=\"utf-8\">"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
        "<title>Vix UI Live</title>"
        "</head>"
        "<body>"
        "<main>"
        "<h1>Vix UI Live</h1>" +
        flash +
        "<section class=\"card\">" +
        fragment +
        "</section>" +
        toast +
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

## Using live helpers in templates

Create the HTML fragments in C++:

```cpp
const std::string flash =
    vix::ui::FlashMessage::success("Vix UI dashboard is running.")
        .set_title("Ready")
        .set_dismissible(true)
        .render();

const std::string stats =
    vix::ui::Fragment::make("stats")
        .set_html(
            "<div class=\"stats\">"
            "<article><strong>12</strong><span>Routes</span></article>"
            "<article><strong>4</strong><span>Modules</span></article>"
            "<article><strong>1</strong><span>UI layer</span></article>"
            "</div>")
        .render();

const std::string toast =
    vix::ui::Toast::info("Server-rendered UI from C++.")
        .set_title("Vix UI")
        .render();

auto view =
    vix::ui::View("dashboard.html")
        .set_title("Vix UI Dashboard")
        .set("flash", flash)
        .set("stats", stats)
        .set("toast", toast);
```

Render them in the template:

```html
{{ flash | safe }} {{ stats | safe }} {{ toast | safe }}
```

Use `safe` because these helpers already return HTML.

## Returning a live update from a route

A route can return a JSON update payload.

```cpp
app.get("/stats/update", [](vix::Request &req, vix::Response &res) {
  (void)req;

  vix::ui::Fragment stats =
      vix::ui::Fragment::make("dashboard-stats")
          .set_html("<strong>128</strong><span>active users</span>");

  vix::ui::LiveUpdate update =
      vix::ui::LiveUpdate::replace("#stats-card", stats)
          .set_event("dashboard.stats.updated")
          .set_id("stats-128");

  res.header("Content-Type", "application/json");
  res.send(update.to_json());
});
```

The client can read the action, target, and HTML, then apply the change.

## Minimal client idea

Vix UI does not require a specific frontend runtime.

A small client can apply the payload like this:

```js
function applyVixUpdate(update) {
  if (!update || update.type !== "ui.update") {
    return;
  }

  const target = update.target ? document.querySelector(update.target) : null;

  if (update.action === "none") {
    return;
  }

  if (update.action === "remove") {
    if (target) target.remove();
    return;
  }

  if (!target || !("html" in update)) {
    return;
  }

  if (update.action === "replace") {
    target.outerHTML = update.html;
    return;
  }

  if (update.action === "append") {
    target.insertAdjacentHTML("beforeend", update.html);
    return;
  }

  if (update.action === "prepend") {
    target.insertAdjacentHTML("afterbegin", update.html);
    return;
  }

  if (update.action === "before") {
    target.insertAdjacentHTML("beforebegin", update.html);
    return;
  }

  if (update.action === "after") {
    target.insertAdjacentHTML("afterend", update.html);
  }
}
```

This is only the client-side application logic. The C++ side stays focused on rendering the fragment and describing the update.

## Escaping and safety

`Fragment` stores raw HTML.

That is intentional because fragments are usually built from trusted server-rendered HTML.

When user-controlled values are inserted into a fragment, escape them first.

```cpp
std::string username = vix::ui::Html::text(raw_username);

vix::ui::Fragment row =
    vix::ui::Fragment::make("user-row")
        .set_html("<td>" + username + "</td>");
```

Flash and toast titles and messages are escaped by the helpers.

Fragment wrapper attributes and live update JSON strings are escaped or encoded before rendering.

## Common mistakes

### Escaping rendered fragments in templates

Wrong:

```html
{{ fragment }}
```

Correct:

```html
{{ fragment | safe }}
```

### Using `render()` for a remove update

`remove` does not render HTML.

Use `to_json()` when the client needs to know that a target must be removed.

```cpp
vix::ui::LiveUpdate update = vix::ui::LiveUpdate::remove("#old-toast");

std::string payload = update.to_json();
```

### Forgetting the target

A live update without a target cannot tell the client where to apply the HTML.

```cpp
vix::ui::LiveUpdate update =
    vix::ui::LiveUpdate::replace("#stats", fragment);
```

### Putting raw user input inside a fragment

Wrong:

```cpp
fragment.set_html("<span>" + username + "</span>");
```

Correct:

```cpp
fragment.set_html("<span>" + vix::ui::Html::text(username) + "</span>");
```

### Expecting Vix UI to provide a full frontend framework

Live helpers describe server-rendered fragments and update payloads.

They do not provide a virtual DOM, component runtime, frontend router, or WebSocket server.

## What to remember

Use `Fragment` for small HTML pieces.

Use `LiveUpdate` when the server needs to describe how the client should apply a fragment.

Use `FlashMessage` for page-level feedback.

Use `Toast` for lightweight notifications.

```txt
Fragment     -> small server-rendered HTML piece
LiveUpdate   -> action + target + optional fragment payload
FlashMessage -> visible page feedback
Toast        -> lightweight notification
```

## Next step

Continue with PWA helpers.

[Open the PWA guide](./pwa.md)
