# Game Manifest

The game template uses `vix.app` to describe the C++ game executable. The manifest tells Vix which source files are compiled, which include roots are used, which Vix targets are linked, which runtime files are copied beside the executable, and where the built output should be placed.

A generated game manifest is small, but every field has a clear role.

```ini id="game-manifest-generated"
name = "space-demo"
type = "executable"
standard = "c++20"

sources = [
  "src/main.cpp",
]

include_dirs = [
  "src",
]

compile_features = [
  "cxx_std_20",
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

output_dir = "bin"
```

The important difference between the game template and a normal application template is not the target type. Both are executables. The difference is what the executable links and what it needs at runtime. A game links the Vix game runtime, carries assets, and keeps `game.package.json` beside the built target.

## Target name

The `name` field becomes the generated target name.

```ini id="game-manifest-name"
name = "space-demo"
```

For a generated game, the name usually matches the project directory. It is also used by the generated starter code as the game title.

```cpp id="game-manifest-title"
vix::game::App app;
app.set_title("space-demo");
```

Keep the name simple. It should be stable enough to use in build output, project tasks, logs, and local commands.

## Target type

A game project builds an executable.

```ini id="game-manifest-type"
type = "executable"
```

This is the right target type because the project is meant to be run directly.

```bash id="game-manifest-run"
vix build
vix run
```

The game identity does not come from a special manifest target type. It comes from the linked Vix game targets, the game runtime code, the asset directory, and the package metadata copied into the runtime output.

## C++ standard

The generated game uses C++20.

```ini id="game-manifest-standard"
standard = "c++20"
```

The manifest also declares the matching compile feature.

```ini id="game-manifest-compile-feature"
compile_features = [
  "cxx_std_20",
]
```

The `standard` field keeps the manifest readable from a Vix point of view. The `compile_features` entry maps the target to the CMake compile feature used by the generated build.

## Sources

The generated game starts with one source file.

```ini id="game-manifest-sources"
sources = [
  "src/main.cpp",
]
```

That file contains the starter scene and the game runtime startup code. It creates the game app, initializes the runtime, creates the `main` scene, activates it, and runs the loop.

When the game grows, add implementation files to `sources`.

```txt id="game-manifest-source-growth"
src/
  main.cpp
  scenes/
    MainScene.hpp
    MainScene.cpp
  systems/
    MovementSystem.hpp
    MovementSystem.cpp
```

The manifest must list every `.cpp` file compiled into the game executable.

```ini id="game-manifest-source-growth-example"
sources = [
  "src/main.cpp",
  "src/scenes/MainScene.cpp",
  "src/systems/MovementSystem.cpp",
]
```

Headers are not listed in `sources` unless the project has a specific reason to treat a file as a compilation input. Normal headers are found through `include_dirs`.

## Include directories

The generated game uses `src` as its include root.

```ini id="game-manifest-include-dirs"
include_dirs = [
  "src",
]
```

This allows headers inside the source tree to be included with stable project paths.

```cpp id="game-manifest-include-example"
#include <scenes/MainScene.hpp>
#include <systems/MovementSystem.hpp>
```

For a small generated game, using `src` is enough. If the project later grows a public header tree, add `include` deliberately.

```txt id="game-manifest-include-layout"
include/
  space_demo/
    scenes/
      MainScene.hpp

src/
  scenes/
    MainScene.cpp
```

Then update the manifest.

```ini id="game-manifest-include-update"
include_dirs = [
  "include",
  "src",
]
```

Keep include roots clear. A game project is easier to maintain when headers are reachable through predictable paths instead of many narrow include directories.

## Packages

The generated game loads the Vix package layer.

```ini id="game-manifest-packages"
packages = [
  "vix",
]
```

The `packages` field makes the package available to the generated build. The actual libraries linked into the game executable are selected by `links`.

This distinction matters. A package can expose several CMake targets, but the target only links the ones declared in `links`.

## Linked targets

The generated game links two Vix targets.

```ini id="game-manifest-links"
links = [
  "vix::game",
  "vix::io",
]
```

`vix::game` is the game runtime foundation. It is the target that makes the generated project a Vix game project rather than a general application.

`vix::io` provides IO support used by game runtime code and runtime resources.

A normal Vix application often links the base target instead.

```ini id="game-manifest-normal-app-link"
links = [
  "vix::vix",
]
```

A game should keep the game runtime targets unless the project is intentionally moving away from the Vix game layer. Removing `vix::game` while keeping `vix::game::App`, `GameRuntime`, or `Scene` in the source code will leave the target incorrectly linked.

## Runtime resources

The game template copies assets and package metadata beside the built executable.

```ini id="game-manifest-resources"
resources = [
  "assets=assets",
  "game.package.json=game.package.json",
]
```

These files are not C++ sources. They are runtime files. The executable may need them after compilation, so they must be present in the runtime output.

A generated runtime output can look like this:

```txt id="game-manifest-runtime-layout"
bin/
  space-demo
  assets/
  game.package.json
```

The resource entry uses the same `source=destination` shape as other `vix.app` projects.

```txt id="game-manifest-resource-shape"
source=destination
```

The source path is relative to the project root. The destination path is relative to the runtime output directory.

## Assets as resources

The generated asset directory is copied as a whole.

```ini id="game-manifest-assets-resource"
"assets=assets"
```

This means new files under `assets/` do not require a manifest change.

```txt id="game-manifest-assets-growth"
assets/
  sprites/
    player.png
  audio/
    theme.ogg
  maps/
    level01.json
```

The manifest already copies the directory. The project only needs a manifest update when the asset root itself changes or when another runtime directory outside `assets/` is introduced.

Do not add asset files to `sources`.

```ini id="game-manifest-wrong-assets"
# Wrong.
sources = [
  "src/main.cpp",
  "assets/sprites/player.png",
]
```

Assets belong in `resources`.

```ini id="game-manifest-correct-assets"
resources = [
  "assets=assets",
]
```

## Package file as a resource

The generated game package is copied beside the executable.

```ini id="game-manifest-package-resource"
"game.package.json=game.package.json"
```

The package file describes game metadata.

```json id="game-manifest-package-json"
{
  "name": "space-demo",
  "version": "0.1.0",
  "author": "",
  "entry_scene": "main",
  "asset_root": "assets",
  "output_dir": "dist",
  "scenes": ["main"],
  "assets": []
}
```

This file is not the C++ build manifest. It is part of the game runtime and tooling layer. The C++ executable is described by `vix.app`, while the game package describes the game itself.

Because tools or runtime code may need to read it, the generated manifest keeps it in the runtime output.

## Output directory

The generated game uses `bin` as its runtime output directory.

```ini id="game-manifest-output-dir"
output_dir = "bin"
```

This keeps the executable and runtime files together.

```txt id="game-manifest-bin-layout"
bin/
  space-demo
  assets/
  game.package.json
```

For game projects, this layout is practical. When something fails at runtime, the developer can inspect one directory and see whether the executable, assets, and package metadata are all present.

Do not confuse this field with `output_dir` inside `game.package.json`.

```json id="game-manifest-package-output-dir"
{
  "output_dir": "dist"
}
```

The manifest `output_dir` controls where the compiled target is placed inside the build output. The package `output_dir` is game metadata that can be used by export or packaging tooling.

## How Vix uses the manifest

When you run the build command, Vix reads `vix.app` and generates the internal CMake project it needs.

```bash id="game-manifest-build"
vix build
```

The generated CMake input is internal build infrastructure. The source of truth remains the root `vix.app`.

```txt id="game-manifest-generated-path"
.vix/generated/app/
```

Do not edit generated files to change the game target. Edit `vix.app`, then run the build again.

```bash id="game-manifest-rebuild"
vix build
```

## Adding a scene file

A common next step is moving the generated starter scene out of `main.cpp`.

```txt id="game-manifest-scene-files"
src/
  main.cpp
  scenes/
    MainScene.hpp
    MainScene.cpp
```

The header can declare the scene.

```cpp id="game-manifest-scene-header"
#pragma once

#include <vix/game/all.hpp>

class MainScene final : public vix::game::Scene
{
public:
  vix::game::GameBoolResult on_load() override;
  void on_update(const vix::game::Frame &frame) override;
};
```

The implementation owns the behavior.

```cpp id="game-manifest-scene-cpp"
#include <scenes/MainScene.hpp>

#include <vix/print.hpp>

vix::game::GameBoolResult MainScene::on_load()
{
  vix::print("Main scene loaded");
  return vix::game::Scene::on_load();
}

void MainScene::on_update(const vix::game::Frame &frame)
{
  vix::print("frame:", frame.index);
}
```

Then update the manifest.

```ini id="game-manifest-scene-source-update"
sources = [
  "src/main.cpp",
  "src/scenes/MainScene.cpp",
]
```

No manifest entry is needed for `MainScene.hpp` because it is reached through the include directory.

## Adding systems

As the game grows, systems can be split into their own files.

```txt id="game-manifest-systems-layout"
src/
  systems/
    MovementSystem.hpp
    MovementSystem.cpp
    RenderSystem.hpp
    RenderSystem.cpp
```

Add the implementation files to `sources`.

```ini id="game-manifest-systems-sources"
sources = [
  "src/main.cpp",
  "src/scenes/MainScene.cpp",
  "src/systems/MovementSystem.cpp",
  "src/systems/RenderSystem.cpp",
]
```

A good game manifest should stay honest. When a `.cpp` file is part of the executable, list it. When a file is a runtime asset, keep it in `resources`.

## Adding another runtime directory

Most game runtime files should live under `assets/`. When the project has a real reason to carry another directory, add it as a resource.

```txt id="game-manifest-extra-runtime-dir"
config/
  local.game.json
```

```ini id="game-manifest-extra-runtime-resource"
resources = [
  "assets=assets",
  "game.package.json=game.package.json",
  "config=config",
]
```

Keep this simple. A game project becomes harder to debug when runtime files are scattered across many unrelated directories.

## Changing the asset root

A project can change the asset root from `assets` to another name, but the package file and manifest should change together.

For example, with:

```txt id="game-manifest-content-root"
content/
  sprites/
  audio/
```

Update `game.package.json`.

```json id="game-manifest-content-package"
{
  "asset_root": "content"
}
```

Then update `vix.app`.

```ini id="game-manifest-content-resource"
resources = [
  "content=content",
  "game.package.json=game.package.json",
]
```

The source tree, game package, and runtime output should describe the same asset root. Changing only one side creates confusing runtime errors.

## Build workflow

A generated game is built and run from the project root.

```bash id="game-manifest-workflow"
vix build
vix run
```

After changing source files, build again.

```bash id="game-manifest-source-edit-workflow"
vix build
vix run
```

After adding assets under the existing `assets/` directory, the manifest usually does not need to change. Build or run again so the resource copy step refreshes the runtime output.

```bash id="game-manifest-asset-edit-workflow"
vix build
vix run
```

## Relationship with `vix.json`

The game manifest describes the C++ target. The project workflow belongs to `vix.json`.

```json id="game-manifest-vix-json"
{
  "tasks": {
    "dev": "vix run",
    "build": "vix build",
    "run": "vix run",
    "export": "vix run && vix build",
    "check": {
      "description": "Build and validate the game project",
      "command": "vix build"
    }
  }
}
```

Use `vix.app` for target fields such as sources, links, resources, and output directory. Use `vix.json` for task shortcuts and project workflow metadata.

```txt id="game-manifest-file-roles"
vix.app             C++ target and runtime resources
vix.json            project tasks and workflow metadata
game.package.json   game metadata
assets/             runtime assets
```

## Common mistakes

The most common mistake is treating `game.package.json` as if it controlled the C++ build. It does not. The C++ target is controlled by `vix.app`.

Another mistake is adding new `.cpp` files under `src/` and forgetting to list them in `sources`. The files exist, but they are not compiled into the executable until the manifest includes them.

A third mistake is putting assets in `sources`. Assets are runtime files and should be copied through `resources`.

A fourth mistake is changing the asset root in `game.package.json` but leaving the manifest resource entry unchanged. The game package, the source tree, and the runtime output should agree.

A fifth mistake is removing `vix::game` from `links` while still using the game runtime APIs. Keep the linked targets aligned with the code.

## Recommended rule

Keep the game manifest explicit. Use `sources` only for C++ implementation files, `include_dirs` for header roots, `links` for the Vix game targets, `resources` for assets and game metadata, and `output_dir = "bin"` for a predictable runtime layout. When the game grows, update the manifest deliberately so the build target always matches the source tree and runtime files.

## Next step

Continue with the game workflow to see how to build, run, add scenes, add assets, and keep the generated game project aligned as it grows.

[Game Workflow](/templates/game/assets-and-package)
