# Forms

Vix UI forms help you build server-rendered HTML forms from C++.

They are useful when an application needs login pages, dashboards, admin panels, settings pages, product forms, profile forms, or any page where the server renders the form and sends normal HTML to the browser.

```cpp
#include <vix/ui/forms/Form.hpp>
#include <vix/ui/forms/Field.hpp>
#include <vix/ui/forms/FieldOption.hpp>
#include <vix/ui/forms/FormData.hpp>
#include <vix/ui/forms/CsrfToken.hpp>
#include <vix/ui/forms/ValidationError.hpp>
```

## What forms solve

A form can be written manually as HTML.

```html
<form method="post" action="/login">
  <input name="email" type="email" />
  <input name="password" type="password" />
  <button type="submit">Submit</button>
</form>
```

That works, but it becomes repetitive when the application needs labels, placeholders, selected options, old input values, validation errors, CSRF fields, file uploads, and reusable field rendering.

Vix UI forms let you describe the form from C++ and render the final HTML.

```cpp
vix::ui::Form form = vix::ui::Form::post("/login");

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

## Basic form

```cpp
#include <iostream>

#include <vix/ui/forms/Form.hpp>
#include <vix/ui/forms/Field.hpp>

int main()
{
  vix::ui::Form form = vix::ui::Form::post("/login");

  form.set_attr("class", "login-form");

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

  form.add_field(
      vix::ui::Field::checkbox("remember")
          .set_label("Remember me")
          .set_value("1"));

  std::cout << form.render() << "\n";

  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

## Form

`Form` represents the whole HTML form.

Use it to set the method, action, attributes, CSRF field, fields, old input values, and errors.

```cpp
vix::ui::Form form = vix::ui::Form::post("/profile/update");
```

Common factories:

```cpp
vix::ui::Form form = vix::ui::Form::post("/login");
vix::ui::Form form = vix::ui::Form::get("/search");
```

Add HTML attributes to the form:

```cpp
form.set_attr("class", "profile-form");
form.set_attr("id", "profile-form");
```

Render the full form:

```cpp
std::string html = form.render();
```

Render only the opening tag:

```cpp
std::string open = form.render_open();
```

Render only the fields:

```cpp
std::string fields = form.render_fields();
```

Render only the errors:

```cpp
std::string errors = form.render_errors();
```

## Field

`Field` represents one input control.

Vix UI supports the common fields used by server-rendered applications:

- text
- email
- password
- number
- hidden
- checkbox
- radio
- textarea
- select
- file

## Text field

```cpp
vix::ui::Field title =
    vix::ui::Field::text("title")
        .set_label("Product title")
        .set_placeholder("Example: iPhone 13 Pro")
        .set_required(true);
```

## Email field

```cpp
vix::ui::Field email =
    vix::ui::Field::email("email")
        .set_label("Email")
        .set_placeholder("you@example.com")
        .set_required(true);
```

## Password field

```cpp
vix::ui::Field password =
    vix::ui::Field::password("password")
        .set_label("Password")
        .set_placeholder("Your password")
        .set_required(true);
```

## Number field

```cpp
vix::ui::Field price =
    vix::ui::Field::number("price")
        .set_label("Price")
        .set_placeholder("Example: 350")
        .set_attr("min", "0")
        .set_attr("step", "0.01")
        .set_required(true);
```

## Textarea

```cpp
vix::ui::Field description =
    vix::ui::Field::textarea("description")
        .set_label("Description")
        .set_placeholder("Write a short description")
        .set_attr("rows", "5");
```

## Hidden field

```cpp
form.add_hidden("_token", "csrf-demo-token");
```

Hidden fields are useful for tokens, IDs, or server-generated values that must be submitted with the form.

## Checkbox

```cpp
vix::ui::Field newsletter =
    vix::ui::Field::checkbox("newsletter")
        .set_label("Receive product updates")
        .set_value("1");
```

Set the checkbox as checked:

```cpp
newsletter.set_checked(true);
```

You can also use a boolean attribute:

```cpp
newsletter.set_bool_attr("checked", true);
```

## Radio group

A radio field can receive multiple options.

```cpp
vix::ui::Field visibility =
    vix::ui::Field::radio("visibility")
        .set_label("Visibility")
        .set_value("public")
        .set_required(true);

visibility.add_option("public", "Public");
visibility.add_option("private", "Private");
visibility.add_option("draft", "Draft");
```

When the field value matches an option value, that option is rendered as selected.

## Select field

```cpp
vix::ui::Field country =
    vix::ui::Field::select("country")
        .set_label("Country")
        .set_required(true);

country.add_option("", "Choose country");
country.add_option("ug", "Uganda");
country.add_option("cd", "DRC");
country.add_option("rw", "Rwanda");
country.add_option("ke", "Kenya");
```

Set the selected value:

```cpp
country.set_value("ug");
```

## FieldOption

`FieldOption` represents one option in a select or radio field.

```cpp
vix::ui::FieldOption option =
    vix::ui::FieldOption::make("ug", "Uganda");

option.set_selected(true);
option.set_disabled(false);
```

You can also attach attributes:

```cpp
option.set_attr("data-code", "256");
```

Use `FieldOption` directly when an option needs more control than a simple value and label.

## File field

```cpp
vix::ui::Field images =
    vix::ui::Field::file("images")
        .set_label("Product images")
        .set_accept("image/png,image/jpeg,image/webp")
        .set_multiple(true);
```

When a file field is present, the form renders the correct encoding type:

```html
enctype="multipart/form-data"
```

This prevents a common upload mistake where the browser submits the form without file data.

## CSRF token

`CsrfToken` is a rendering helper.

It can render a hidden CSRF input:

```cpp
vix::ui::CsrfToken token =
    vix::ui::CsrfToken::named("_csrf", "secure-token-value");

std::string html = token.render();
```

Output:

```html
<input id="_csrf" name="_csrf" type="hidden" value="secure-token-value" />
```

Attach it to a form:

```cpp
form.set_csrf(
    vix::ui::CsrfToken::named("_csrf", "secure-token-value"));
```

Or use the short form:

```cpp
form.set_csrf("secure-token-value");
```

Render only the CSRF input:

```cpp
std::string csrf = form.render_csrf();
```

`CsrfToken` does not generate, sign, rotate, store, or validate tokens. The application security layer remains responsible for that.

## CSRF meta tag

Some applications also expose the token to JavaScript through a meta tag.

```cpp
vix::ui::CsrfToken token("secure-token-value");

std::string meta = token.render_meta();
```

Output:

```html
<meta
  content="secure-token-value"
  data-header="X-CSRF-Token"
  name="csrf-token"
/>
```

Customize the meta name:

```cpp
std::string meta = token.render_meta("vix-csrf");
```

## Validation errors

Forms can render validation errors.

```cpp
form.add_error("email", "Email is required.");
form.add_error("password", "Password is required.");
```

A field error is attached to a field name.

```cpp
form.add_error("email", "This email address is already used.");
```

Render only errors:

```cpp
std::string errors = form.render_errors();
```

Render the full form with errors:

```cpp
std::string html = form.render();
```

## Old input with FormData

`FormData` stores submitted values or old input values.

It is useful after validation fails.

Instead of returning an empty form, the server can bind the previous values back to the form.

```cpp
vix::ui::FormData old_input;

old_input.set("name", "Gaspard");
old_input.set("email", "gaspard@example.com");
old_input.set("country", "ug");
old_input.set("newsletter", "1");
```

Bind the data to the form:

```cpp
form.bind(old_input);
```

After binding, matching fields receive their old values.

## Multiple values

Some fields can have multiple values.

```cpp
vix::ui::FormData data;

data.add("roles", "admin");
data.add("roles", "editor");
```

Read the first value:

```cpp
std::string role = data.get_or("roles");
```

Read all values:

```cpp
std::vector<std::string> roles = data.get_all_or_empty("roles");
```

Check whether a value exists:

```cpp
bool is_admin = data.contains("roles", "admin");
```

## Profile form with old input

```cpp
#include <iostream>

#include <vix/ui/forms/Form.hpp>
#include <vix/ui/forms/Field.hpp>
#include <vix/ui/forms/FormData.hpp>
#include <vix/ui/forms/CsrfToken.hpp>

int main()
{
  vix::ui::FormData old_input;

  old_input.set("name", "Gaspard");
  old_input.set("email", "gaspard@example.com");
  old_input.set("country", "ug");
  old_input.set("role", "admin");
  old_input.set("newsletter", "1");
  old_input.set("bio", "Building server-rendered UI with Vix.cpp.");

  vix::ui::Form form = vix::ui::Form::post("/profile/update");

  form.set_attr("class", "profile-form")
      .set_csrf(vix::ui::CsrfToken::named("_csrf", "csrf-demo-token"));

  form.add_field(
      vix::ui::Field::text("name")
          .set_label("Name")
          .set_required(true));

  form.add_field(
      vix::ui::Field::email("email")
          .set_label("Email")
          .set_required(true));

  form.add_field(
      vix::ui::Field::password("password")
          .set_label("Password")
          .set_placeholder("Leave empty to keep current password"));

  vix::ui::Field country =
      vix::ui::Field::select("country")
          .set_label("Country")
          .set_required(true);

  country.add_option("ug", "Uganda");
  country.add_option("cd", "DRC");
  country.add_option("rw", "Rwanda");
  country.add_option("ke", "Kenya");

  form.add_field(country);

  vix::ui::Field role =
      vix::ui::Field::radio("role")
          .set_label("Role")
          .set_required(true);

  role.add_option("admin", "Admin");
  role.add_option("editor", "Editor");
  role.add_option("viewer", "Viewer");

  form.add_field(role);

  form.add_field(
      vix::ui::Field::checkbox("newsletter")
          .set_label("Receive product updates")
          .set_value("1"));

  form.add_field(
      vix::ui::Field::textarea("bio")
          .set_label("Bio")
          .set_attr("rows", "4"));

  form.bind(old_input);

  form.add_error("email", "This email address is already used.");

  std::cout << form.render() << "\n";

  return 0;
}
```

Run it:

```bash
vix run main.cpp
```

## Product form example

```cpp
#include <iostream>

#include <vix/ui/forms/Form.hpp>
#include <vix/ui/forms/Field.hpp>

int main()
{
  vix::ui::Form form = vix::ui::Form::post("/products/create");

  form.set_attr("class", "product-form")
      .set_csrf("csrf-demo-token");

  form.add_field(
      vix::ui::Field::text("title")
          .set_label("Product title")
          .set_placeholder("Example: iPhone 13 Pro")
          .set_required(true));

  form.add_field(
      vix::ui::Field::number("price")
          .set_label("Price")
          .set_placeholder("Example: 350")
          .set_required(true)
          .set_attr("min", "0")
          .set_attr("step", "0.01"));

  vix::ui::Field condition =
      vix::ui::Field::select("condition")
          .set_label("Condition")
          .set_required(true);

  condition.add_option("", "Choose condition");
  condition.add_option("new", "New");
  condition.add_option("used", "Used");
  condition.add_option("refurbished", "Refurbished");

  form.add_field(condition);

  vix::ui::Field visibility =
      vix::ui::Field::radio("visibility")
          .set_label("Visibility")
          .set_value("public")
          .set_required(true);

  visibility.add_option("public", "Public");
  visibility.add_option("private", "Private");
  visibility.add_option("draft", "Draft");

  form.add_field(visibility);

  form.add_field(
      vix::ui::Field::checkbox("featured")
          .set_label("Mark as featured")
          .set_value("1")
          .set_checked(true));

  form.add_field(
      vix::ui::Field::file("images")
          .set_label("Product images")
          .set_accept("image/png,image/jpeg,image/webp")
          .set_multiple(true));

  form.add_field(
      vix::ui::Field::textarea("description")
          .set_label("Description")
          .set_placeholder("Write a short product description")
          .set_attr("rows", "5"));

  std::cout << form.render() << "\n";

  return 0;
}
```

## Render a form inside a Vix route

```cpp
#include <vix/core.hpp>
#include <vix/ui.hpp>

int main()
{
  vix::App app;

  app.get("/", [](vix::Request &req, vix::Response &res) {
    (void)req;

    vix::ui::Form form = vix::ui::Form::post("/login");

    form.set_attr("class", "login-form")
        .set_csrf("csrf-demo-token");

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
vix run main.cpp
```

## Render a form inside a template

Create the form in C++:

```cpp
vix::ui::Form form = vix::ui::Form::post("/login");

form.add_field(
    vix::ui::Field::email("email")
        .set_label("Email")
        .set_required(true));

form.add_field(
    vix::ui::Field::password("password")
        .set_label("Password")
        .set_required(true));

auto view =
    vix::ui::View("login.html")
        .set_title("Login")
        .set("form", form.render());

res.ui(view);
```

Use the rendered form in the template:

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

      {{ form | safe }}
    </main>
  </body>
</html>
```

Use `safe` because `form.render()` already returns HTML.

## Attributes

Most form objects support custom HTML attributes.

```cpp
form.set_attr("class", "login-form");
```

```cpp
field.set_attr("autocomplete", "email");
field.set_attr("class", "form-control");
```

Boolean attributes can be added or removed.

```cpp
field.set_bool_attr("disabled", true);
field.set_bool_attr("disabled", false);
```

Attribute values are escaped before rendering.

## Practical validation flow

A common server-rendered flow looks like this:

```txt
GET /profile
  render empty form or existing profile values

POST /profile
  read request body
  validate input
  if invalid:
    bind old input
    attach validation errors
    render form again
  if valid:
    save data
    redirect or render success response
```

Vix UI forms handle the rendering side of this flow.

The application remains responsible for reading the request body and validating the data.

## Common mistakes

### Forgetting `multipart/form-data` for uploads

With Vix UI, adding a file field lets the form render the upload encoding automatically.

```cpp
form.add_field(
    vix::ui::Field::file("images")
        .set_multiple(true));
```

### Rendering trusted form HTML without `safe`

Wrong:

```html
{{ form }}
```

This may escape the form HTML.

Correct:

```html
{{ form | safe }}
```

### Expecting CSRF helper to validate tokens

`CsrfToken` renders tokens.

It does not validate them.

Validation belongs in the application security layer.

### Losing user input after validation fails

Bind old input before rendering the form again.

```cpp
form.bind(old_input);
```

### Setting select options but not the current value

For a selected option, set the field value.

```cpp
country.set_value("ug");
```

Or bind old input:

```cpp
form.bind(old_input);
```

## What to remember

Use `Form` for the whole form.

Use `Field` for each input.

Use `FieldOption` when select or radio options need more control.

Use `FormData` to keep old input after validation fails.

Use `CsrfToken` to render CSRF fields and meta tags.

```txt
Form       -> the full HTML form
Field      -> one input, select, textarea, checkbox, radio, or file field
FieldOption -> one select or radio option
FormData   -> old input or submitted values
CsrfToken  -> hidden input or meta tag rendering
```

## Next step

Continue with live UI.

[Open the live UI guide](./live.md)
