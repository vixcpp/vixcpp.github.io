# Assets and Package

The game template creates two runtime pieces that are specific to game projects: the `assets/` directory and the `game.package.json` file. They are not compiled as C++ source code, but they are part of the game at runtime.

The asset directory contains files the game loads while running. The package file describes game-level metadata such as the entry scene, asset root, scene list, and output directory. Together, they give the project a clear runtime shape beside the C++ executable.

```txt id="game-assets-package-map"
assets/             runtime game files
game.package.json   game metadata
vix.app             C++ target and resource copying
src/                C++ game source
```

## Asset directory

Generated game projects use:

```txt id="game-assets-dir"
assets/
```

This directory is the default asset root. It can contain sprites, audio files, maps, level data, configuration files, exported metadata, shaders, fonts, or any other file the game needs while running.

```txt id="game-assets-layout"
assets/
  sprites/
    player.png
    enemy.png
  audio/
    theme.ogg
  maps/
    level01.json
  fonts/
    main.ttf
```

Assets are runtime files. They should not be placed in `sources` inside `vix.app`, because the C++ compiler does not compile them. They should stay under `assets/` and be copied as resources.

## Resource copying

The generated game manifest copies the asset directory beside the built executable.

```ini id="game-assets-resources"
resources = [
  "assets=assets",
  "game.package.json=game.package.json",
]
```

This matters because the game does not run from the project root after it is built. It runs from the build output. If assets are not copied there, the source tree may look correct while the running executable still cannot find its runtime files.

A typical runtime output looks like this:

```txt id="game-assets-runtime-output"
bin/
  space-demo
  assets/
    sprites/
    audio/
    maps/
  game.package.json
```

The source path is on the left side of the resource entry. The destination path is on the right side.

```txt id="game-assets-resource-shape"
source=destination
```

For the generated game template, the source and destination are intentionally the same:

```ini id="game-assets-same-destination"
"assets=assets"
```

That keeps the runtime layout simple.

## Adding assets

When new files are added under the existing `assets/` directory, the manifest does not need to change.

```txt id="game-assets-add-files"
assets/
  sprites/player.png
  audio/theme.ogg
  maps/level01.json
```

The whole directory is already declared as a resource.

```ini id="game-assets-existing-resource"
resources = [
  "assets=assets",
]
```

A manifest change is only needed when the asset root itself changes or when the project adds another runtime directory outside `assets/`.

For example, this would require a new resource entry:

```txt id="game-assets-extra-dir"
config/
  game.local.json
```

```ini id="game-assets-extra-resource"
resources = [
  "assets=assets",
  "game.package.json=game.package.json",
  "config=Config",
]
```

Keep additional runtime directories rare. A game project is easier to debug when most runtime files live under one asset root.

## Game package file

The generated package file lives at the project root.

```txt id="game-package-file"
game.package.json
```

A generated package looks like this:

```json id="game-package-json"
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

This file describes the game as a game. It is different from `vix.app`, which describes the C++ target that must be compiled.

```txt id="game-package-vs-vix-app"
game.package.json  -> game metadata
vix.app            -> C++ build target, links, resources, output directory
```

The package file can be used by game runtime tools, asset export tools, editor tooling, or project checks. It gives the game layer a stable place to describe information that does not belong in C++ build configuration.

## Package fields

The generated package keeps a small set of fields.

```json id="game-package-fields"
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

`name` is the game name. It should normally match the project name unless the project has a reason to expose a different display name.

`version` is the game package version. It is game metadata, not the Vix CLI version.

`author` is left empty by the template so the project owner can fill it.

`entry_scene` is the scene the game considers the starting scene.

`asset_root` tells tools where assets live.

`output_dir` gives game tooling a default export destination.

`scenes` lists known scenes.

`assets` can hold explicit asset entries when the project starts tracking assets through metadata instead of only through the filesystem.

## Entry scene

The generated game uses `main` as its entry scene.

```json id="game-package-entry-scene"
{
  "entry_scene": "main",
  "scenes": ["main"]
}
```

The generated C++ code also creates and activates a scene named `main`.

```cpp id="game-package-main-scene-cpp"
auto scene = app.scenes().create<MainScene>("main");

auto active = app.scenes().set_active("main");
```

These two parts should stay aligned. If the package says the entry scene is `menu`, the C++ startup code or the runtime loading flow should also know how to create and activate `menu`.

A project with multiple scenes can update the package like this:

```json id="game-package-multiple-scenes"
{
  "entry_scene": "menu",
  "scenes": ["menu", "level01", "level02"]
}
```

The package should describe the game’s intended scene structure. The C++ source should implement the runtime behavior that makes those scenes real.

## Asset root

The generated package uses:

```json id="game-package-asset-root"
{
  "asset_root": "assets"
}
```

This matches the generated project layout.

```txt id="game-package-asset-root-layout"
assets/
```

It also matches the resource declaration in `vix.app`.

```ini id="game-package-asset-root-resource"
resources = [
  "assets=assets",
]
```

Keep these values aligned. When `asset_root` says `assets`, the project should keep game assets under `assets/`, and the manifest should copy that directory into the runtime output.

## Output directory in the package

The package contains:

```json id="game-package-output-dir"
{
  "output_dir": "dist"
}
```

This is game-level metadata. It can be used by export tools or packaging workflows.

Do not confuse it with `output_dir` in `vix.app`.

```ini id="game-vix-app-output-dir"
output_dir = "bin"
```

The manifest `output_dir` controls where the compiled target is placed inside the build output. The package `output_dir` describes a game/export output path from the game metadata point of view.

```txt id="game-package-output-difference"
vix.app output_dir      -> where the executable is placed
game.package output_dir -> where game export tooling may write output
```

Keeping the names understood prevents confusion when the project starts adding build and export workflows.

## Explicit asset list

The generated package starts with an empty asset list.

```json id="game-package-assets-empty"
{
  "assets": []
}
```

That is fine for a starter project. The filesystem already contains the asset root, and the manifest copies it as a runtime directory.

As the project grows, the package can begin tracking assets explicitly.

```json id="game-package-assets-filled"
{
  "assets": [
    {
      "id": "player",
      "path": "sprites/player.png",
      "type": "image"
    },
    {
      "id": "theme",
      "path": "audio/theme.ogg",
      "type": "audio"
    }
  ]
}
```

The paths should be written relative to the asset root when the project follows that convention.

```txt id="game-package-asset-path-rule"
asset_root = assets
asset path = sprites/player.png
full file  = assets/sprites/player.png
```

Do not rush into a large asset manifest before the project needs it. For a small game, the asset directory and package metadata can stay simple.

## Relationship with `vix.app`

The package file does not replace the manifest.

`vix.app` still owns the C++ target shape.

```ini id="game-package-vix-app-example"
name = "space-demo"
type = "executable"
standard = "c++20"

sources = [
  "src/main.cpp",
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

The package file is copied as a resource because the game may need to read it at runtime or because game tools expect it beside the executable.

```ini id="game-package-copy-resource"
"game.package.json=game.package.json"
```

If the package file is removed from `resources`, the source tree may still contain it, but the runtime output may not.

## Runtime layout

A clean game runtime output keeps the executable, assets, and package metadata together.

```txt id="game-package-runtime-layout"
bin/
  space-demo
  assets/
    sprites/
    audio/
    maps/
  game.package.json
```

This layout is useful during development because the game can load files using predictable relative paths.

A source tree can be organized for development, while the runtime output is organized for execution.

```txt id="game-package-source-vs-runtime"
source tree:
  src/
  assets/
  game.package.json
  vix.app

runtime output:
  bin/
    space-demo
    assets/
    game.package.json
```

`vix.app` is what connects those two worlds.

## Loading assets from C++

The generated starter does not load real assets yet. It only starts the runtime and prints frame updates. When a real game starts loading assets, use paths that match the runtime layout.

For example, a file under:

```txt id="game-package-player-asset"
assets/sprites/player.png
```

should be loadable at runtime through a path relative to the executable’s working directory or runtime asset root, depending on the game API used by the project.

```txt id="game-package-runtime-path-example"
assets/sprites/player.png
```

The important point is not the exact loading API on this page. The important point is that the file must exist in the runtime output, not only in the project source tree.

## Changing the asset root

A project can choose another asset root, but the package and manifest should change together.

For example:

```txt id="game-package-content-root"
content/
  sprites/
  audio/
```

Update the package.

```json id="game-package-content-root-json"
{
  "asset_root": "content"
}
```

Update the resource declaration.

```ini id="game-package-content-root-resource"
resources = [
  "content=content",
  "game.package.json=game.package.json",
]
```

Then keep C++ loading paths consistent with the new runtime layout.

Do not change only one side. If `game.package.json` says `content` but `vix.app` still copies `assets`, the game metadata and runtime output no longer describe the same project.

## Export workflows

The generated package contains an `output_dir` field because game projects often need export or packaging steps later.

```json id="game-package-export-dir"
{
  "output_dir": "dist"
}
```

A generated `vix.json` can include an export task.

```json id="game-package-export-task"
{
  "tasks": {
    "export": "vix run && vix build"
  }
}
```

This starter export command is intentionally simple. A real game can replace it with a stronger workflow when export tooling exists: building the game, preparing assets, writing metadata, copying files, and producing a release directory.

A future export output may look like this:

```txt id="game-package-dist-layout"
dist/
  space-demo
  assets/
  game.package.json
```

Keep export behavior in project tasks or dedicated tooling. Do not overload `game.package.json` with build commands, and do not put export-only logic into the C++ manifest.

## Versioning the package

The package version starts at:

```json id="game-package-version"
{
  "version": "0.1.0"
}
```

This version describes the game package. It can be updated when the game changes in a way that matters for testing, export, distribution, or saved content compatibility.

It does not need to match the Vix version. It can follow the project’s own release rhythm.

## Common mistakes

The most common mistake is treating assets as source files.

```ini id="game-package-wrong-assets-sources"
# Wrong.
sources = [
  "src/main.cpp",
  "assets/sprites/player.png",
]
```

Assets should be copied as resources.

```ini id="game-package-correct-assets-resources"
resources = [
  "assets=assets",
]
```

Another mistake is editing `game.package.json` and expecting it to change the C++ build. The package describes game metadata. The C++ build is controlled by `vix.app`.

A third mistake is changing the asset root in the package without changing the resource entry in the manifest. The package, source tree, and runtime output should describe the same asset root.

A fourth mistake is removing `game.package.json` from resources. If runtime tools or the game itself need the package file, it must be copied beside the executable.

## Recommended rule

Keep assets under one clear asset root, keep game metadata in `game.package.json`, and keep build wiring in `vix.app`. When assets are added under `assets/`, the existing resource declaration is enough. When the asset root changes, update both the package file and the manifest. When game metadata changes, update the package file without confusing it with the C++ target manifest.

## Next step

Continue with the game manifest to understand how the template links `vix::game` and `vix::io`, copies runtime resources, and shapes the build output.

[Game Manifest](/templates/game/manifest)
