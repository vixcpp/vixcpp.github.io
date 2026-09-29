# Getting Started

This guide shows the basic `vix.app` workflow from a small application to the normal build and run cycle.

A `vix.app` project is still a normal C++ project. The difference is that the application target is described in a small manifest at the project root, and Vix takes care of turning that manifest into the internal build files it needs. In daily use, you work with the same commands:

```bash id="o6dn7a"
vix build
vix run
```

## Create an application

The simplest way to start is to let Vix generate the application structure.

```bash id="gkd7bz"
vix new hello --app
cd hello
```

A generated app contains a `vix.app` file at the project root.

```txt id="cbhyxp"
hello/
  src/
  vix.app
  vix.json
```

The manifest is the file that tells Vix how the application target is assembled. It contains the target name, source files, include directories, linked Vix libraries, copied resources, and output location.

## A minimal vix.app

A small application can start with a manifest like this:

```ini id="vr9xeq"
name = "hello"
type = "executable"
standard = "c++20"

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

output_dir = "bin"
```

This file describes one executable target named `hello`. The source file is `src/main.cpp`, the include root is `src`, and the target links the base Vix library.

## Write the entry point

Create or open `src/main.cpp`:

```cpp id="v21up3"
#include <vix/print.hpp>

int main()
{
  vix::print("Hello from vix.app");
  return 0;
}
```

Vix examples use `vix::print` because it keeps simple output readable without bringing `std::cout` into every small example.

## Build the application

From the project root, run:

```bash id="xmncq0"
vix build
```

Vix reads `vix.app`, prepares the generated build input under `.vix/generated/app/`, and builds the target. The generated files are part of Vix’s internal workflow. They are useful when debugging, but they should not become the source of truth for the project.

The file you edit is still:

```txt id="jmzydm"
vix.app
```

## Run the application

After building, run:

```bash id="zfz78p"
vix run
```

The output should look like this:

```txt id="jqj7no"
Hello from vix.app
```

The important point is that the workflow stays centered on the Vix CLI. You do not need to manually call lower-level build commands for the normal application cycle.

## Add another source file

As the application grows, add new source files to the `sources` list.

```txt id="x9hlaz"
src/main.cpp
src/app.cpp
```

Then update `vix.app`:

```ini id="qfzs7q"
sources = [
  "src/main.cpp",
  "src/app.cpp",
]
```

If you also add headers under `include`, declare that directory in `include_dirs`:

```ini id="lhzjd7"
include_dirs = [
  "include",
  "src",
]
```

Paths in `vix.app` are written relative to the project root. This keeps the manifest readable even when the app has several source folders.

## Add runtime resources

Applications often need files at runtime, such as `.env`, public assets, views, storage folders, or package metadata. Declare them with `resources`.

```ini id="jgpeg8"
resources = [
  ".env=.env",
  "public=public",
]
```

Each entry follows this shape:

```txt id="kgw21u"
source=destination
```

The source is read from the project root. The destination is copied next to the built target, inside the runtime output directory.

## Control the output directory

Generated applications usually use `bin` as the output directory:

```ini id="c90ezb"
output_dir = "bin"
```

This keeps the executable and copied resources in one predictable runtime location inside the build tree.

## Link Vix modules

The `packages` field makes a package available. The `links` field selects the targets that the application actually links.

For a basic app:

```ini id="a7yrab"
packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

For a game app, the links are different:

```ini id="o6bp58"
links = [
  "vix::game",
  "vix::io",
]
```

For a backend using the ORM module:

```ini id="zcnz6s"
links = [
  "vix::vix",
  "vix::orm",
]
```

Keep this distinction clear. `packages` loads the package layer; `links` says what the target is actually built with.

## Use vix.app with app modules

A larger backend may be split into internal modules. Those modules are declared directly in `vix.app`.

```ini id="d7d2kw"
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

The `vix modules` command can create and update these sections:

```bash id="rxrmmx"
vix modules add auth
vix modules list
vix modules disable auth
vix modules enable auth
```

Enabled modules are wired into the generated application target. Disabled modules stay in the manifest, but Vix does not link them into the app. This is useful when a backend grows feature by feature and needs a clear internal structure.

## Common first workflow

A normal first session with `vix.app` looks like this:

```bash id="g1b7mr"
vix new hello --app
cd hello

vix build
vix run
```

Then, after editing sources or the manifest:

```bash id="kkh7ub"
vix build
vix run
```

When registry dependencies are added through `deps`, install or refresh them before building:

```bash id="frjf9o"
vix install
vix build
```

## What to edit

In a `vix.app` project, these are the files you normally edit:

```txt id="elxao3"
vix.app        application target manifest
vix.json       project metadata, tasks, and registry dependency state
src/           application source files
include/       application headers, when used
modules/       internal app modules, when used
```

The generated directory is managed by Vix:

```txt id="cp9hvn"
.vix/generated/app/
```

Treat that directory as build infrastructure, not as the place where application design should live.

## Next step

Continue with the project types guide to understand how executable apps, backends, libraries, and generated templates map to the fields inside `vix.app`.

[Project Types](/guides/vix-app/project-types)
