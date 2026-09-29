# vix update

`vix update` re-resolves existing Vix Registry dependencies for a project or updates one global package.

Use it when you intentionally want newer Registry versions. Project updates are prepared in memory and published atomically so `vix.json` and `vix.lock` do not end up describing different dependency states.

```bash
vix update
```

`vix up` is an alias for `vix update`.

```bash
vix up
```

## Overview

`vix update` is the command for refreshing dependency versions.

It can update:

- all project dependencies
- one project dependency
- several project dependencies
- one global package with `-g` or `--global`

In project mode, the dependencies selected for update come from:

```text
vix.json
```

The exact resolved application state remains in:

```text
vix.lock
```

Module-owned dependencies declared in `vix.module` are not direct update targets of `vix update <package>`. Their active requirements can still participate in the application dependency constraints that must remain compatible.

In global mode, it reuses the global install path:

```txt
vix install -g <package>
```

## Usage

```bash
vix update
vix up
vix update [@]namespace/name[@version]
vix up [@]namespace/name[@version]
vix update [options]
vix up [options]
vix update -g [@]namespace/name[@version]
```

## Basic examples

```bash
# Update all project dependencies
vix update

# Alias
vix up

# Update one dependency to latest
vix update gk/jwt

# Scoped-style syntax
vix update @gk/jwt

# Update one dependency to a new range
vix update gk/jwt@^1.2.0

# Update several dependencies
vix update gk/jwt gk/pdf

# Update and install immediately
vix update --install

# Preview without changing files
vix update --dry-run

# JSON output
vix update --json

# Update one global package
vix update -g gk/jwt
```

## What it does

In project mode, `vix update` performs one project mutation:

```text
read vix.json and vix.lock
        |
        v
select root Registry requirements to update
        |
        v
resolve requested updates in memory
        |
        v
validate resulting dependency state
        |
        v
publish vix.json + vix.lock together
        |
        +-- optional: run vix install
```

If you pass a new explicit range, the corresponding requirement in `vix.json` changes only if the complete update can be resolved successfully.

```bash
vix update gk/jwt@^1.2.0
```

For example:

```json
{
  "deps": [
    {
      "id": "gk/jwt",
      "version": "^1.2.0"
    }
  ]
}
```

Vix resolves all requested package updates before publishing either authoritative file. If one package fails to resolve, a multi-package update does not leave earlier packages committed while later ones fail.

The root manifest and lockfile are staged and committed through the same project mutation boundary. Project mutation locking also prevents concurrent Vix dependency commands from silently overwriting each other's metadata.

With `--install`, the metadata update is completed first. Vix then releases the project mutation lock before invoking the normal install workflow, avoiding a nested mutation lock.

## Project mode

Run:

```bash
vix update
```

This updates the root Registry dependencies already declared in `vix.json`.

Important rule:

```text
vix update changes existing root Registry requirements.
It does not add a new dependency.
```

If a Registry dependency is not already in `vix.json`, add it first:

```bash
vix add <package>
```

If the dependency belongs to one application module, manage that declaration with the module workflow instead:

```bash
vix add <package> --module <name>
```

Direct Git dependencies use `vix install <git-url>` rather than `vix update`.

## Project dependency source

`vix update` reads declared dependencies from:

```txt
vix.json
```

Current format:

```json
{
  "deps": [
    {
      "id": "gk/jwt",
      "version": "^1.0.0"
    },
    {
      "id": "gk/pdf",
      "version": "1.0.0"
    }
  ]
}
```

Each root Registry dependency must have:

```text
id
version
```

`vix update` selects update targets from this root list. Registry requirements stored in `modules/<name>/vix.module` are not implicitly rewritten by this command.

## Lockfile source

`vix update` also reads:

```txt
vix.lock
```

It uses the lockfile to know the previous exact resolved state before computing the update.

If `vix.lock` is missing, Vix reports an error:

```txt
update failed: vix.lock not found
```

Fix:

```bash
vix install
```

or, if dependencies were never resolved:

```bash
vix add <package>
```

## Update all dependencies

Run:

```bash
vix update
```

When no package is specified, Vix updates every root Registry dependency from `vix.json`.

All selected updates are resolved before the new manifest and lockfile are published. If one selected package cannot be resolved, Vix does not commit a partially updated subset.

Important behavior:

```txt
vix update without explicit versions resolves latest available versions.
```

It does not simply reuse the old requested range when deciding the update target.

Example output shape:

```txt
Update
updating gk/jwt...
Add
id: gk/jwt
version: 1.3.0
tag: v1.3.0
commit: ...

resolving project dependencies...
✔ added: gk/jwt@1.3.0
✔ lock:  /home/user/api/vix.lock
✔ deps:  2

✔ gk/jwt: 1.2.0 -> 1.3.0
✔ processed 1 package(s), changed 1
⚠ Run: vix install to regenerate dependencies
```

## Update one dependency

Run:

```bash
vix update gk/jwt
```

This updates `gk/jwt` to the latest available version.

The dependency must already exist in `vix.json`.

If it does not, Vix reports:

```txt
dependency not found in vix.json: gk/jwt
```

Fix:

```bash
vix add gk/jwt
```

## Update one dependency to a new range

Run:

```bash
vix update gk/jwt@^1.2.0
```

This updates the requested version in `vix.json`, then rewrites `vix.lock`.

Use this when you intentionally want to change the version requirement.

## Update several dependencies

Run:

```bash
vix update gk/jwt gk/pdf
```

Vix updates only those root dependencies.

Duplicate targets are de-duplicated internally. The selected updates are resolved as one mutation, so a failure in one target does not publish successful changes for the others.

## Scoped-style syntax

Both forms are accepted:

```bash
vix update gk/jwt
vix update @gk/jwt
```

Both refer to:

```txt
gk/jwt
```

You can also include a version range:

```bash
vix update @gk/jwt@^1.2.0
```

## Dry run

Use:

```bash
vix update --dry-run
```

Dry run previews the selected update targets without publishing changes to `vix.json` or `vix.lock`.

Examples:

```bash
vix update --dry-run
vix update gk/jwt --dry-run
vix update gk/jwt gk/pdf --dry-run
```

Output shape:

```txt
Update
checking gk/jwt...
✔ gk/jwt: 1.2.0 -> latest
✔ processed 1 package(s), changed 0
```

Dry run does not resolve and write a new lockfile.

It is mainly a safe preview of the update targets.

## JSON output

Use:

```bash
vix update --json
```

Example output shape:

```json
{
  "command": "update",
  "dry_run": false,
  "install_after": false,
  "updated": [
    {
      "spec": "gk/jwt",
      "id": "gk/jwt",
      "before": "1.2.0",
      "after": "1.3.0",
      "changed": true
    }
  ]
}
```

Use JSON output for:

- scripts
- CI
- dashboards
- dependency reports
- automation

## JSON dry run

```bash
vix update --dry-run --json
```

Example shape:

```json
{
  "command": "update",
  "dry_run": true,
  "install_after": false,
  "updated": [
    {
      "spec": "gk/jwt",
      "id": "gk/jwt",
      "before": "1.2.0",
      "after": "1.2.0",
      "changed": false
    }
  ]
}
```

## Install after update

Use:

```bash
vix update --install
```

After the dependency metadata update succeeds, Vix runs:

```bash
vix install
```

The project mutation lock is released before this install phase begins. This keeps update atomic while allowing `vix install` to use its own normal mutation and recovery rules.

The install phase then reconciles cached dependency materialization and generated CMake integration with the newly committed lock state.

Examples:

```bash
vix update --install
vix update gk/jwt --install
vix update gk/jwt gk/pdf --install
```

Without `--install`, Vix prints:

```txt
Run: vix install to regenerate dependencies
```

## Global update

Use `-g` or `--global`:

```bash
vix update -g gk/jwt
vix update --global gk/jwt
vix update -g @gk/jwt
vix update -g gk/jwt@1.0.0
```

Global update does not use `vix.lock`.

It reuses:

```bash
vix install -g <package>
```

So this:

```bash
vix update -g gk/jwt
```

behaves like a global reinstall/update from the registry.

## Global mode rules

Global mode requires one package spec.

Wrong:

```bash
vix update -g
```

Correct:

```bash
vix update -g gk/jwt
```

If the package is missing, Vix reports:

```txt
missing package spec
Example: vix update -g @gk/jwt
```

## Difference between `vix update`, `vix add`, and `vix install`

| Command                                 | Purpose                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `vix add <pkg>`                         | Add or change a root Vix Registry requirement.                                  |
| `vix add <pkg> --module <name>`         | Add or change a module-owned Registry requirement.                              |
| `vix update`                            | Re-resolve existing root Registry dependencies from `vix.json`.                 |
| `vix install`                           | Materialize the dependency state described by project manifests and `vix.lock`. |
| `vix install <git-url>`                 | Add a direct Git dependency.                                                    |
| `vix install <git-url> --module <name>` | Add a direct Git dependency owned by one module.                                |

Use `vix update` for intentional Registry version refreshes of dependencies already declared in the root `vix.json`.

Use `vix add` when a Registry requirement is new or its declaration belongs to one module.

Use `vix install` after cloning a project because a normal install preserves the exact locked dependency state.

```bash
git clone https://github.com/example/api.git
cd api

vix install
```

Do not use `vix update` as the normal install step after clone.

## Difference between `vix update` and `vix outdated`

| Command        | Purpose                                         |
| -------------- | ----------------------------------------------- |
| `vix outdated` | Report dependencies behind the registry latest. |
| `vix update`   | Re-resolve and rewrite dependency state.        |

Use `vix outdated` to inspect.

Use `vix update` to change files.

## Files changed

A project update can change:

```text
vix.json
vix.lock
```

`vix.json` changes when an explicit requested range is changed, for example:

```bash
vix update gk/jwt@^1.2.0
```

`vix.lock` records the newly resolved exact dependency state.

These files are not published one by one as independent successful operations. Vix stages the project update and commits the authoritative files together. If the update fails before commit, the previous bytes remain authoritative.

`--dry-run` does not change either file.

Module manifests are not rewritten by `vix update`.

## Interaction with application modules

`vix update` does not rewrite module-owned dependency declarations.

For example, this requirement remains owned by `auth`:

```toml
[deps]
registry = [
  "gk/jwt@^1.0.0",
]
```

in:

```text
modules/auth/vix.module
```

When active application and module requirements refer to the same dependency, the resulting project dependency state must remain compatible. An update should not silently choose a version that violates another active owner.

If a module-owned requirement itself needs to change, use the module dependency workflow:

```bash
vix add gk/jwt@^1.2.0 --module auth
```

For direct Git dependencies, use `vix install <git-url>` with the appropriate revision selector.

## Registry requirement

`vix update` resolves packages from the local registry index.

If the registry is not synced, update can fail during package resolution.

Run:

```bash
vix registry sync
vix update
```

## Full project update workflow

Use update as an intentional dependency maintenance operation, not as the normal build or clone path.

Check outdated packages:

```bash
vix registry sync
vix outdated
```

Update and install:

```bash
vix update --install
```

Validate:

```bash
vix build --build-target all
vix tests
```

or:

```bash
vix check --tests
```

## Safe update workflow

```bash
vix registry sync
vix outdated
vix update --dry-run
vix update --install
vix check --tests
```

For production applications:

```bash
vix registry sync
vix outdated
vix update --dry-run
vix update --install
vix build --preset release
vix tests --preset release
```

Review both `vix.json` and `vix.lock` before committing the update.

## CI usage

A CI job should usually install locked dependencies:

```bash
vix install
vix check --tests
```

Use `vix update` in dependency-maintenance workflows, not normal CI build workflows. Normal CI should consume the committed lock state with `vix install`.

Example dependency maintenance job:

```bash
vix registry sync
vix outdated --json
vix update --dry-run --json
```

If you intentionally want a bot or script to update:

```bash
vix registry sync
vix update --install
vix check --tests
```

## Options

| Option         | Description                                             |
| -------------- | ------------------------------------------------------- |
| `-g, --global` | Update one global package.                              |
| `--dry-run`    | Show what would be updated without changing `vix.lock`. |
| `--json`       | Print machine-readable JSON output.                     |
| `--install`    | Run `vix install` after update.                         |
| `-h, --help`   | Show command help.                                      |

## Commands reference

| Command                    | Description                                            |
| -------------------------- | ------------------------------------------------------ |
| `vix update`               | Update all project dependencies.                       |
| `vix up`                   | Alias for `vix update`.                                |
| `vix update <pkg>`         | Update one existing project dependency to latest.      |
| `vix update <pkg>@<range>` | Update one existing project dependency to a new range. |
| `vix update <pkg> <pkg>`   | Update several existing project dependencies.          |
| `vix update --dry-run`     | Preview update targets.                                |
| `vix update --json`        | Print JSON output.                                     |
| `vix update --install`     | Update, then install.                                  |
| `vix update -g <pkg>`      | Update one global package.                             |

## Common workflows

### Update all dependencies

```bash
vix registry sync
vix update
vix install
vix check --tests
```

### Update and install immediately

```bash
vix registry sync
vix update --install
vix check --tests
```

### Update one dependency

```bash
vix update gk/jwt
vix install
vix build
```

### Update one dependency to a new range

```bash
vix update gk/jwt@^1.2.0
vix install
vix check --tests
```

### Update several dependencies

```bash
vix update gk/jwt gk/pdf --install
vix check --tests
```

### Preview updates

```bash
vix update --dry-run
```

### Use JSON output

```bash
vix update --json
```

### Update a global package

```bash
vix registry sync
vix update -g gk/jwt
```

## Common mistakes

### Expecting update to add new dependencies

Wrong:

```bash
vix update gk/jwt
```

when `gk/jwt` is not in `vix.json`.

Correct:

```bash
vix add gk/jwt
```

### Running update after clone

Wrong:

```bash
git clone https://github.com/example/api.git
cd api
vix update
```

Correct:

```bash
git clone https://github.com/example/api.git
cd api
vix install
```

Use install after clone because it preserves exact locked versions.

### Forgetting to install after update

Wrong:

```bash
vix update
vix build
```

Better:

```bash
vix update --install
vix build
```

or:

```bash
vix update
vix install
vix build
```

### Expecting `vix update` to rewrite module-owned requirements

`vix update` selects root Registry dependencies from `vix.json`.

For a module-owned Registry requirement, change the module declaration with:

```bash
vix add gk/jwt@^1.2.0 --module auth
```

For a module-owned direct Git dependency, use `vix install <git-url> --module auth` with the desired selector.

### Updating blindly before release

Before a release, preview and validate:

```bash
vix outdated
vix update --dry-run
vix update --install
vix check --tests
```

### Expecting dry run to rewrite lockfile

`--dry-run` does not change files.

Use normal update when you want to rewrite `vix.lock`.

### Expecting global update to use project lockfile

Global update does not use:

```txt
vix.lock
```

It reuses global install logic:

```bash
vix install -g <package>
```

## Troubleshooting

### `vix.lock not found`

Create or restore the lockfile.

If the project has dependencies:

```bash
vix install
```

If dependencies were never added:

```bash
vix add <package>
```

### Dependency not found in `vix.json`

The package is not declared in the project manifest.

Add it first:

```bash
vix add gk/jwt
```

### Invalid package spec

Valid:

```bash
vix update gk/jwt
vix update @gk/jwt
vix update gk/jwt@^1.2.0
```

Invalid:

```bash
vix update jwt
vix update @/jwt
vix update gk/jwt@
```

### Registry not synced

Run:

```bash
vix registry sync
```

Then:

```bash
vix update
```

### No dependencies to update

If `vix.json` has no `deps`, Vix prints:

```txt
no dependencies to update
```

Add a dependency first:

```bash
vix add gk/jwt
```

### `vix update --json` shows empty list

This means no dependencies were selected or declared.

Check:

```bash
vix list
```

or inspect:

```txt
vix.json
```

### One package in a multi-package update fails

A multi-package update is resolved before publication.

If one selected package cannot be resolved, correct the failing requirement and run the update again. Earlier selected packages are not supposed to remain committed as a partial successful update.

### Install after update failed

Run install manually to see the failure:

```bash
vix install
```

Common causes:

- registry not synced
- package checkout failed
- integrity mismatch
- generated dependency integration failed

## Best practices

Use `vix outdated` before `vix update`.

Use `vix update --dry-run` before large dependency changes.

Use `vix update --install` when you want the project materialized immediately after the metadata update.

Treat `vix update` as a root Registry dependency maintenance command. Use `vix add --module` for module-owned Registry requirements and `vix install <git-url>` for direct Git dependencies.

Run tests after updating.

Commit both `vix.json` and `vix.lock`.

Do not edit `vix.lock` manually.

Use `vix install` after cloning a project.

Use global update only for global packages.

## Related commands

| Command             | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| `vix outdated`      | Check which Registry dependencies are outdated.                 |
| `vix install`       | Materialize locked dependencies or add a direct Git dependency. |
| `vix add`           | Add or change a Registry requirement.                           |
| `vix modules`       | Manage and validate application modules.                        |
| `vix remove`        | Remove a dependency.                                            |
| `vix list`          | List dependency state.                                          |
| `vix registry sync` | Refresh the Registry index.                                     |
| `vix check`         | Validate after updating.                                        |
| `vix build`         | Build after dependency changes.                                 |
| `vix tests`         | Run tests after dependency changes.                             |

## Next step

Check outdated dependencies before updating.

[Open the vix outdated guide](/cli/outdated)
