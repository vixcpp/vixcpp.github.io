# Output Directory

`output_dir` controls where Vix places the target output inside the build output. In most application projects, this field is set to `bin` so the executable and its runtime files live in one predictable directory.

```ini id="vix-app-output-basic"
output_dir = "bin"
```

This is a small field, but it matters for daily development. When a backend reads `.env`, serves files from `public`, loads views, or a game loads assets, the program should find those files next to the built target without requiring the developer to guess where the runtime directory is.

## Basic usage

A typical application manifest places the executable in `bin`.

```ini id="vix-app-output-minimal"
name = "hello"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
]

include_dirs = [
  "src",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

After building, Vix keeps the target output under the build area and uses the configured output directory for the application target. The exact build root depends on the active Vix build configuration, but the runtime directory remains stable from the manifest point of view.

```txt id="vix-app-output-layout"
bin/
  hello
```

## Why generated apps use `bin`

Generated Vix applications use `bin` because it is simple and familiar. A developer can build the project, look for the runtime output, and understand immediately where the executable is expected to live.

```ini id="vix-app-output-generated"
output_dir = "bin"
```

For an application, this is usually enough. The manifest does not need a complicated output structure unless the project has a clear reason for it.

## Output directory and resources

`output_dir` works together with `resources`. The output directory decides where the target is placed, and resources are copied beside that target.

```ini id="vix-app-output-with-resources"
output_dir = "bin"

resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

A backend runtime layout may look like this:

```txt id="vix-app-output-backend-layout"
bin/
  api
  .env
  public/
  views/
  storage/
```

This keeps the backend runtime close to the executable. The application can start from the normal Vix workflow and still find its environment file, static files, templates, and storage directory.

## Backend example

A backend manifest normally uses `output_dir = "bin"`.

```ini id="vix-app-output-backend-example"
name = "api"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
  "src/api/app/AppBootstrap.cpp",
  "src/api/support/HttpResponses.cpp",
  "src/api/presentation/routes/RouteRegistry.cpp",
  "src/api/presentation/middleware/MiddlewareRegistry.cpp",
  "src/api/presentation/controllers/HomeController.cpp",
  "src/api/presentation/controllers/HealthController.cpp",
]

include_dirs = [
  "include",
  "src",
]

defines = [
  "VIX_BACKEND_APP=1",
  "VIX_APP_NAME=api",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
]

resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

The important part is not only that the binary is placed under `bin`, but that the backend resources are copied into the same runtime area. This gives the application a clean development layout without asking the source tree to become the runtime tree.

## Game example

A game project also benefits from a clear output directory because assets and package metadata must be available when the game starts.

```ini id="vix-app-output-game-example"
name = "space-demo"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
]

include_dirs = [
  "src",
]

packages = [
  "vix",
]

links = [
  "vix::game",
  "vix::io",
]

resources = [
  "assets=assets",
  "game.package.json=game.package.json",
]
```

The runtime output then stays easy to understand.

```txt id="vix-app-output-game-layout"
bin/
  space-demo
  assets/
  game.package.json
```

The C++ source stays in `sources`, while assets and metadata stay in `resources`.

## Library targets

`output_dir` can also be used with library targets.

```ini id="vix-app-output-library"
name = "mathkit"
type = "static-library"
standard = "c++20"
output_dir = "lib"

sources = [
  "src/add.cpp",
  "src/multiply.cpp",
]

include_dirs = [
  "include",
]
```

For application projects, `bin` is the better default. For reusable libraries, a directory such as `lib` can make the output easier to recognize. The choice should match the target type and the way the project is consumed.

## Relative paths

`output_dir` should be a relative path.

```ini id="vix-app-output-relative"
output_dir = "bin"
```

Avoid absolute machine-specific paths.

```ini id="vix-app-output-avoid-absolute"
# Avoid this.
output_dir = "/home/user/build-output/bin"
```

A manifest with absolute paths becomes difficult to share with another developer, run in CI, or move to another machine. Keep the project portable by describing paths relative to the build output managed by Vix.

## Keep it simple

Most projects should use one short output directory name.

```ini id="vix-app-output-simple"
output_dir = "bin"
```

A deeply nested output directory usually does not make the project clearer.

```ini id="vix-app-output-nested"
# Avoid unless the project really needs this.
output_dir = "runtime/linux/x86_64/debug/bin"
```

The manifest should remain readable. Build presets, release modes, and platform-specific details should be handled by the Vix workflow, not encoded into every path in the application manifest.

## When to omit `output_dir`

`output_dir` is optional. When it is omitted, Vix uses the default output layout for the active build workflow.

```ini id="vix-app-output-omitted"
name = "hello"
type = "executable"
standard = "c++20"

sources = [
  "src/main.cpp",
]
```

For small experiments, omitting it is acceptable. For generated applications, backends, games, and projects with runtime resources, declare it explicitly so the runtime layout is obvious.

```ini id="vix-app-output-explicit"
output_dir = "bin"
```

## Common mistakes

The most common mistake is treating `output_dir` as a source path. It is not where source files live, and it is not where headers are found. Source files belong in `sources`, headers are reached through `include_dirs`, and runtime files are copied through `resources`.

```ini id="vix-app-output-wrong"
# Wrong idea.
output_dir = "src"
```

Another mistake is using `output_dir` to solve missing resource problems. If the program cannot find `.env` or `public`, check `resources` first.

```ini id="vix-app-output-resource-fix"
resources = [
  ".env=.env",
  "public=public",
]
```

`output_dir` decides where the runtime area is. `resources` decides what gets copied there.

## Checking the output layout

After changing `output_dir`, build the project.

```bash id="vix-app-output-build"
vix build
```

Then run it normally.

```bash id="vix-app-output-run"
vix run
```

For applications with runtime files, confirm that the executable and copied resources appear together in the configured output directory. This is especially important for backends, games, and frontend + backend projects where the program depends on files outside the compiled C++ source.

## Recommended default

Use this for normal Vix applications:

```ini id="vix-app-output-recommended"
output_dir = "bin"
```

It is clear, portable, and works well with resources. A backend gets its executable and runtime directories in one place. A game gets its executable, assets, and package metadata together. A small command-line tool stays easy to find after the build.

## Next step

Continue with libraries to see how `vix.app` describes static and shared library targets.

[Libraries](/guides/vix-app/libraries)
