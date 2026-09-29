# `vix remove`

`vix remove` removes a resolved package entry from the current project's root `vix.lock`.

Use it when you intentionally want to remove locked project dependency state. The command can also delete the corresponding project-local dependency materialization with `--purge`.

```bash
vix remove gk/jwt
```

`vix remove` does not remove a package from the Vix Registry, uninstall a global package, or automatically remove every declaration that may still require the dependency.

## Basic workflow

Remove the locked dependency:

```bash
vix remove gk/jwt
```

Then make sure the dependency is no longer declared by the project or by an application module.

Regenerate dependency integration:

```bash
vix install
vix build
```

For broader validation:

```bash
vix check --tests
```

If a manifest still requires the dependency, a later `vix install` can resolve it again. Removing lock state and removing a dependency requirement are different operations.

## Usage

```bash
vix remove [@]namespace/name[@version]
vix remove [@]namespace/name[@version] --purge [-y]
```

## Basic examples

Remove a locked dependency:

```bash
vix remove gk/jwt
```

Scoped-style syntax:

```bash
vix remove @gk/jwt
```

Remove only when the locked version matches:

```bash
vix remove gk/jwt@1.0.0
```

Remove the lock entry and project-local dependency files:

```bash
vix remove gk/jwt --purge
```

Skip purge confirmation:

```bash
vix remove gk/jwt --purge -y
```

## What `vix remove` changes

Without `--purge`, the authoritative file changed by the command is:

```text
vix.lock
```

With `--purge`, the command can also remove:

```text
.vix/deps/<namespace>.<name>
```

For example:

```text
gk/jwt -> .vix/deps/gk.jwt
```

The dependency's source cache or Registry metadata is not removed.

## What `vix remove` does not change

`vix remove` does not currently remove the dependency requirement from:

```text
vix.json
vix.app
modules/<name>/vix.module
```

That distinction is important.

For example, if `vix.json` still contains:

```json
{
  "deps": [
    {
      "id": "gk/jwt",
      "version": "^1.0.0"
    }
  ]
}
```

then removing only the lock entry does not mean the project no longer requires `gk/jwt`.

Likewise, an application module may still own the requirement in:

```text
modules/auth/vix.module
```

Before running `vix install` again, make sure the dependency declaration that caused the requirement has also been removed when that is your intent.

## Package format

A package target uses:

```text
namespace/name
```

Examples:

```text
gk/jwt
gk/json
```

Scoped-style syntax is also accepted:

```text
@namespace/name
```

For example:

```bash
vix remove @gk/jwt
```

Both forms refer to the same dependency id:

```text
gk/jwt
```

## Version matching

A version can be included in the removal target:

```bash
vix remove gk/jwt@1.0.0
```

When a version is provided, Vix removes the dependency only when the locked entry matches that version.

The comparison can use the locked version or tag representation. A lock entry whose tag is:

```text
v1.0.0
```

can still match:

```bash
vix remove gk/jwt@1.0.0
```

Use a version-qualified remove when you want to avoid removing a different locked version accidentally.

## Lockfile requirement

`vix remove` operates on:

```text
vix.lock
```

If the lockfile is missing, the command cannot remove a locked dependency.

Restore the project lockfile from version control when appropriate, or rebuild valid dependency state through the normal dependency workflow.

For an existing project after clone:

```bash
vix install
```

For a dependency that has never been declared:

```bash
vix add <package>
```

## Remove from the lockfile

Run:

```bash
vix remove gk/jwt
```

The matching dependency is removed from the root lockfile.

After the change, the remaining entries still represent the exact locked dependency state that has not been removed.

A normal next step is:

```bash
vix install
```

This reconciles project-local dependency materialization and generated integration with the current manifests and lockfile.

## Removing dependency requirements

A lockfile entry and a dependency requirement are not the same thing.

The project may have a root Registry requirement in:

```text
vix.json
```

A `vix.app` project may also contain root build dependency declarations such as:

```toml
deps = [
  "gk/jwt@^1.0.0",
]

links = [
  "gk::jwt",
]
```

An application module can own Registry dependencies in:

```toml
[deps]
registry = [
  "gk/jwt@^1.0.0",
]

links = [
  "gk::jwt",
]
```

or direct Git dependencies in:

```toml
[dependencies.spdlog]
git = "https://github.com/gabime/spdlog"
tag = "v1.15.3"
target = "spdlog::spdlog"
```

If the dependency should disappear permanently from the project, remove the declaration from the manifest that owns it as well as any CMake link or source usage that depends on it.

Then run:

```bash
vix install
vix build
```

## Application module dependencies

Module-owned dependencies use the same root `vix.lock` as application-owned dependencies.

```text
vix.app
  |
  +-- auth
  |     |
  |     +-- modules/auth/vix.module
  |
  v
root vix.lock
```

There is no separate lockfile per module.

`vix remove` does not currently take a `--module` option. Removing a lock entry therefore does not identify or rewrite the module manifest that may own the dependency requirement.

For a module-owned Registry dependency, update the corresponding `vix.module` declaration when the module no longer needs the package.

For a module-owned direct Git dependency, remove the structured `[dependencies.<name>]` declaration from that module manifest when the dependency is no longer required.

After changing module dependency declarations:

```bash
vix modules check
vix install
vix build
```

## Shared dependencies

One locked dependency can satisfy requirements from more than one active owner.

For example:

```text
auth
  +-- gk/json

billing
  +-- gk/json
```

Removing the shared lock entry does not remove those requirements from either module.

If another active manifest still requires the dependency, `vix install` can resolve the dependency again because the active application graph still needs it.

Before removing shared dependency state permanently, inspect every owner that still declares the dependency.

## Purge project-local files

Use `--purge` when the project-local materialized dependency should also be deleted.

```bash
vix remove gk/jwt --purge
```

For:

```text
gk/jwt
```

the project-local path is:

```text
.vix/deps/gk.jwt
```

The general shape is:

```text
.vix/deps/<namespace>.<name>
```

Examples:

| Package        | Project-local directory  |
| -------------- | ------------------------ |
| `gk/jwt`       | `.vix/deps/gk.jwt`       |
| `gk/json`      | `.vix/deps/gk.json`      |
| `adastra/http` | `.vix/deps/adastra.http` |

## Purge confirmation

`--purge` deletes project-local files, so Vix asks for explicit confirmation.

The confirmation token is:

```text
DELETE
```

If the confirmation is not provided, the purge is cancelled.

For automation where the deletion is already intentional, use:

```bash
vix remove gk/jwt --purge -y
```

or:

```bash
vix remove gk/jwt --purge --yes
```

## What purge does not delete

`--purge` only targets the project-local dependency materialization under:

```text
.vix/deps/
```

It does not delete:

- the shared Git store
- Registry metadata
- globally installed packages
- dependency declarations in project manifests

This means another project can continue to reuse shared cached dependency data.

## Atomic removal

Project dependency mutations are published through one project mutation boundary.

For a normal removal, Vix prepares the new lockfile state before making it authoritative.

For a purge, project-local deletion is coordinated with the same mutation workflow rather than being treated as an unrelated best-effort cleanup.

If publication is interrupted, Vix can recover incomplete project mutation state before a later mutation proceeds.

This prevents a failed remove operation from silently leaving partially published authoritative dependency metadata.

Project mutations are also serialized so concurrent Vix commands do not overwrite the same project dependency state without coordination.

## After removing a dependency

The complete cleanup depends on where the dependency was declared.

For a root Registry dependency:

```text
vix.json
vix.lock
```

For a `vix.app` application that also links the package directly:

```text
vix.app
```

For a module-owned dependency:

```text
modules/<name>/vix.module
```

For a manual CMake project:

```text
CMakeLists.txt
```

Source code may also still contain includes or symbols from the dependency.

After cleanup:

```bash
vix install
vix build
vix check --tests
```

## Using remove with `vix.app`

If the application directly uses the package, remove obsolete root dependency declarations.

Before:

```toml
deps = [
  "gk/jwt@^1.0.0",
]

links = [
  "vix::vix",
  "gk::jwt",
]
```

After:

```toml
deps = [
]

links = [
  "vix::vix",
]
```

Then run:

```bash
vix install
vix build
```

If a module owns the dependency instead, change that module's `vix.module` rather than moving the dependency into the root application manifest.

## Using remove with CMake

For a CMake-first project, remove target links that are no longer needed.

Before:

```cmake
target_link_libraries(api PRIVATE
  gk::jwt
)
```

After cleanup, regenerate dependency integration if the project uses Vix-managed dependencies:

```bash
vix install
vix build
```

## Difference between `vix remove` and `vix uninstall`

| Command                  | Purpose                                                  |
| ------------------------ | -------------------------------------------------------- |
| `vix remove <pkg>`       | Remove locked dependency state from the current project. |
| `vix uninstall -g <pkg>` | Remove a globally installed package.                     |

Use `vix remove` for project dependency state.

Use `vix uninstall -g` for a package installed into the Vix-managed global prefix.

## Difference between remove and declaration cleanup

These operations affect different layers.

| Action                          | Effect                                                              |
| ------------------------------- | ------------------------------------------------------------------- |
| `vix remove <pkg>`              | Removes the matching root lock entry.                               |
| `vix remove <pkg> --purge`      | Removes the lock entry and project-local materialization.           |
| remove from `vix.json`          | Removes a root Registry requirement.                                |
| remove from `vix.app`           | Removes root application build declarations.                        |
| remove from `vix.module`        | Removes a module-owned dependency requirement.                      |
| remove CMake target linkage     | Removes manual build usage.                                         |
| delete `.vix/deps/...` manually | Deletes materialized files without changing authoritative metadata. |

Dependency cleanup is complete only when the project no longer declares or uses the dependency at the layers that apply to that project.

## Common workflows

### Remove locked state

```bash
vix remove gk/jwt
```

### Remove and purge local materialization

```bash
vix remove gk/jwt --purge -y
```

### Remove a root dependency completely

Remove the root requirement from the appropriate project manifest, then:

```bash
vix remove gk/jwt
vix install
vix build
```

### Remove a module-owned dependency completely

Remove the dependency declaration from:

```text
modules/<name>/vix.module
```

Then run:

```bash
vix modules check
vix install
vix build
```

If a matching direct lock entry still needs explicit cleanup, use `vix remove` according to the current lock state.

### Remove and validate

```bash
vix remove gk/jwt
vix install
vix check --tests
```

## Options

| Option       | Description                                                                 |
| ------------ | --------------------------------------------------------------------------- |
| `--purge`    | Delete project-local dependency files under `.vix/deps/<namespace>.<name>`. |
| `-y, --yes`  | Skip confirmation when using `--purge`.                                     |
| `-h, --help` | Show command help.                                                          |

## Commands reference

| Command                        | Description                                                     |
| ------------------------------ | --------------------------------------------------------------- |
| `vix remove gk/jwt`            | Remove `gk/jwt` from the root lockfile.                         |
| `vix remove @gk/jwt`           | Same operation using scoped-style syntax.                       |
| `vix remove gk/jwt@1.0.0`      | Remove only when the locked version matches.                    |
| `vix remove gk/jwt --purge`    | Remove lock state and ask before deleting project-local files.  |
| `vix remove gk/jwt --purge -y` | Remove lock state and project-local files without confirmation. |

## Common mistakes

### Removing only the lock entry while the dependency is still declared

If `vix.json`, `vix.app`, or a module manifest still requires the dependency, a later install can resolve it again.

Check the owning declaration before considering the dependency removed from the project.

### Expecting `vix remove` to remove a module declaration

`vix remove` has no module ownership selector.

For a module-owned dependency, update:

```text
modules/<name>/vix.module
```

and then validate the module graph.

### Expecting remove to unpublish a package

`vix remove` affects the current project only.

It does not remove anything from the Vix Registry.

### Expecting remove to uninstall a global package

Use:

```bash
vix uninstall -g gk/jwt
```

for a global installation.

### Forgetting build linkage

If the application or a module still links:

```text
gk::jwt
```

remove that obsolete link relationship when the dependency is no longer used.

For manual CMake projects, remove corresponding `target_link_libraries(...)` entries.

### Forgetting source usage

Remove includes and symbols that came from the dependency.

For example:

```cpp
#include <jwt/api.hpp>
```

Then validate:

```bash
vix build
vix check --tests
```

### Editing `vix.lock` manually

Do not manually edit the lockfile.

Use Vix dependency commands so lock state changes go through the same validation and project mutation behavior as other dependency operations.

## Troubleshooting

### Missing package id

Use:

```bash
vix remove namespace/name
```

Example:

```bash
vix remove gk/jwt
```

### Invalid package id

Valid forms include:

```bash
vix remove gk/jwt
vix remove @gk/jwt
vix remove gk/jwt@1.0.0
```

A package id must contain its namespace and name.

### Missing lockfile

If the project should already have dependency state, restore the committed `vix.lock`.

For a valid project whose manifests already declare dependencies, the normal materialization command is:

```bash
vix install
```

### Dependency not found in lock

Inspect the current dependency state:

```bash
vix list
```

The dependency may already be absent, may use a different id, or may be represented by a different current lock entry.

### Purge cancelled

Type exactly:

```text
DELETE
```

or, when intentional automation should skip confirmation:

```bash
vix remove gk/jwt --purge -y
```

### Project-local files cannot be deleted

Check filesystem permissions and ownership for the materialized dependency path.

After correcting the filesystem problem, retry the removal or cleanup.

## Best practices

Use `vix list` before removing dependency state when you are unsure of the current locked id or version.

Remove the dependency requirement from the manifest that owns it when the project should no longer resolve that dependency.

Do not create or edit per-module lockfiles. Module-owned dependencies share the root `vix.lock`.

Run `vix modules check` after changing module-owned dependency declarations.

Run `vix install` after dependency declaration or lock changes when project-local integration needs reconciliation.

Run `vix build` and tests before committing dependency removals.

Use `--purge` only when project-local materialized files should also be deleted.

Do not manually edit `vix.lock`.

## Related commands

| Command         | Purpose                                                                              |
| --------------- | ------------------------------------------------------------------------------------ |
| `vix add`       | Add or change a Vix Registry requirement.                                            |
| `vix install`   | Reconcile project manifests, locked dependency state, and materialized dependencies. |
| `vix update`    | Re-resolve existing root Registry dependencies.                                      |
| `vix outdated`  | Inspect outdated Registry dependencies.                                              |
| `vix modules`   | Manage and validate application modules.                                             |
| `vix list`      | Inspect project dependency state.                                                    |
| `vix uninstall` | Remove Vix itself or a globally installed package.                                   |
| `vix check`     | Validate the project after dependency changes.                                       |
| `vix build`     | Build after dependency cleanup.                                                      |

## Next step

Inspect the current dependency state before or after a removal.

[Open the `vix list` guide](/cli/list)
