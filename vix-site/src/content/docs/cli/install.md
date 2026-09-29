# `vix install`

`vix install` prepares the dependencies required by a Vix project. It uses exact locked revisions when they already exist, reconciles Git dependencies declared by the application and its enabled modules, reuses cached checkouts, verifies dependency integrity, and generates the CMake integration used by the project build.

The normal project workflow is:

```bash
vix install
vix build
```

When the project is already up to date, running `vix install` again does not contact Git remotes or recreate dependency integration unnecessarily.

## Install project dependencies

Run the command from the project directory:

```bash
vix install
```

For an existing project with a valid lockfile, Vix installs the exact dependency revisions recorded in `vix.lock`. This is the path normally used after cloning a project and in CI.

```bash
git clone https://github.com/example/app.git
cd app

vix install
vix build
```

The lockfile is the reproducible dependency state of the project. A dependency pinned to a commit remains on that commit until the project dependency declaration intentionally changes.

## Add a Git dependency

A Git dependency can be installed directly from its repository:

```bash
vix install https://github.com/fmtlib/fmt \
  --tag 11.2.0 \
  --target fmt::fmt
```

Vix adds the dependency to `vix.app`, resolves the requested revision to an exact commit, records that resolution in `vix.lock`, stores the checkout in the Git cache, and makes the dependency available to the project build.

A typical declaration looks like this:

```toml
[dependencies.fmt]
git = "https://github.com/fmtlib/fmt"
tag = "11.2.0"
target = "fmt::fmt"
```

You can also write the declaration yourself and run:

```bash
vix install
```

If no lock entry exists for that Git dependency, Vix resolves it and creates the required lock state.

## Install a Git dependency for one application module

A Git dependency can belong to one application module instead of the application target itself.

```bash
vix install https://github.com/gabime/spdlog \
  --tag v1.15.3 \
  --target spdlog::spdlog \
  --module auth
```

The short form is:

```bash
vix install https://github.com/gabime/spdlog \
  --tag v1.15.3 \
  --target spdlog::spdlog \
  -m auth
```

Vix records the declaration in that module's `vix.module` file instead of adding it to the root `vix.app`.

```toml
[dependencies.spdlog]
git = "https://github.com/gabime/spdlog"
tag = "v1.15.3"
target = "spdlog::spdlog"
```

The dependency still participates in the application's single dependency graph. Its exact resolved revision is stored in the root `vix.lock`, and its checkout uses the same shared Vix Git cache as other project dependencies.

```text
vix.app
   |
   +-- module auth
   |      |
   |      +-- modules/auth/vix.module
   |             |
   |             +-- spdlog
   |
   v
root vix.lock
```

`--module` controls dependency ownership and CMake linkage. It does not create a private lockfile, private cache, or vendor directory inside the module.

The target module must already be declared and enabled in `vix.app`, and its `vix.module` must be valid. Vix validates those conditions before attempting Git resolution. An unknown, disabled, missing, or invalid module is rejected without contacting the requested repository.

Installing a module dependency validates the dependency and module structure without requiring the application to be build-complete. Build-specific requirements, such as application source files, are still validated by `vix build`.

### Module dependency isolation

A target declared by one module is linked to that module, not automatically to the application target or sibling modules.

For example:

```text
auth
   +-- spdlog::spdlog

billing
   +-- no spdlog dependency
```

If another active module declares the same compatible Git dependency, Vix can reuse the same resolved dependency and cached checkout while preserving both module owners.

### Module dependency conflicts

All active application and module requirements participate in the same dependency constraint set. Vix rejects incompatible requirements instead of letting the last declaration win.

For example, if `auth` requires one revision of a repository and `billing` requires a different incompatible revision of the same repository, installation fails before the new module declaration or lock state is published.

The same rule applies when the application itself and a module request incompatible revisions. Conflicting CMake configuration for the same effective Git dependency is also rejected when the dependency cannot be represented safely in one CMake graph.

Repository-root dependencies treat an omitted subdirectory and `subdirectory = "."` as the same source location for conflict analysis.

## How manifest and lock state work together

For Git dependencies declared in `vix.app` or by enabled application modules, `vix install` reconciles the desired dependency state with the root `vix.lock`.

If a declaration has not changed, Vix preserves the existing exact commit and does not resolve the repository again. If a new dependency is added, only that dependency needs resolution. If the Git URL, tag, branch, revision, or source subdirectory changes, Vix resolves the affected dependency while keeping unrelated locked dependencies unchanged.

Module-owned requirements are combined with application-owned requirements before resolution. Compatible owners share one exact dependency state. Incompatible active requirements fail before the new authoritative metadata is published.

A change that only affects CMake integration, such as a dependency CMake option, does not require a new Git revision.

This means a project can evolve without turning every install into a full dependency re-resolution.

```text
vix.app + enabled module manifests
   |
   v
collect active dependency requirements
   |
   v
compare with root vix.lock
   |
   +-- unchanged -> preserve exact lock entry
   +-- new       -> resolve dependency
   +-- changed   -> resolve affected dependency
   +-- conflict  -> fail before publication
   +-- removed   -> remove safe direct dependency state
   |
   v
materialize exact locked state
```

Older lock entries that do not contain enough ownership information may be retained when a manifest entry is removed. Vix prefers preserving an uncertain entry over removing a dependency that may still be required transitively.

## Revision selection

A Git dependency can select a tag, branch, or revision.

### Tag

```toml
[dependencies.json]
git = "https://github.com/nlohmann/json.git"
tag = "v3.12.0"
target = "nlohmann_json::nlohmann_json"
```

### Branch

```toml
[dependencies.parser]
git = "https://github.com/company/parser.git"
branch = "dev"
target = "company::parser"
```

### Revision

```toml
[dependencies.parser]
git = "https://github.com/company/parser.git"
rev = "a1b2c3d4e5f6"
target = "company::parser"
```

Tags and branches are resolved to exact commits before they are written to `vix.lock`. Once locked, a normal install uses that exact commit instead of asking the remote for a newer value.

Use only one revision selector for a dependency.

## CMake dependencies

Vix supports Git-hosted CMake projects that can be consumed with `add_subdirectory()` and expose usable CMake targets.

For example:

```toml
[dependencies.spdlog]
git = "https://github.com/gabime/spdlog"
tag = "v1.15.3"
target = "spdlog::spdlog"

[dependencies.spdlog.cmake]
SPDLOG_BUILD_TESTS = false
SPDLOG_BUILD_EXAMPLE = false
SPDLOG_BUILD_BENCH = false
```

Then:

```bash
vix install
vix build
```

The CMake options are applied before the dependency is added to the project build. The target itself remains responsible for its normal CMake usage requirements, including include directories, compile definitions, compile features, and transitive link dependencies.

This behavior is covered by deterministic compatibility tests for interface libraries, static and shared libraries, alias targets, nested subdirectories, generated headers, CMake options, compile features, transitive dependencies, and public or private compile definitions.

Vix does not claim that an arbitrary C++ repository can be installed automatically. Meson, Autotools, Bazel, raw Makefiles, and custom build systems are outside the current Git dependency compatibility guarantee.

## Monorepos

If the CMake project is not at the repository root, select its subdirectory:

```toml
[dependencies.parser]
git = "https://github.com/company/monorepo.git"
tag = "v2.0.0"
subdirectory = "libs/parser"
target = "company::parser"
```

The equivalent command is:

```bash
vix install https://github.com/company/monorepo.git \
  --tag v2.0.0 \
  --name parser \
  --subdirectory libs/parser \
  --target company::parser
```

## Header-only dependencies

A repository that does not provide a CMake target can be installed explicitly as header-only:

```bash
vix install https://github.com/example/headers.git \
  --tag v1.0.0 \
  --header-only \
  --include include
```

The corresponding declaration is:

```toml
[dependencies.headers]
git = "https://github.com/example/headers.git"
tag = "v1.0.0"
header_only = true
include = "include"
```

Vix exposes the configured include directory through the generated project integration.

## Lockfile and reproducibility

`vix.lock` records the exact dependency state used by the project. Git entries include the resolved commit and integrity information, along with build integration metadata such as targets, include directories, subdirectories, and CMake options when applicable.

Application modules do not have separate lockfiles. A Git dependency declared in `modules/<name>/vix.module` is still pinned in the root `vix.lock`, so the application has one reproducible dependency state.

Commit the lockfile:

```bash
git add vix.lock
git commit
```

A normal install should not move an unchanged dependency to another commit.

Use `vix update` when you intentionally want registry dependencies to be resolved again. For direct Git dependencies, change the selector in `vix.app` or install the desired Git revision explicitly.

## Cache behavior

Vix keeps dependency sources outside the project so repeated installs can reuse them. Module-owned Git dependencies use the same cache as root Git dependencies, so ownership does not create duplicate repository storage.

Direct Git dependencies are stored under:

```text
~/.vix/cache/git/
```

Registry-backed Git checkouts use:

```text
~/.vix/store/git/
```

The project receives links or copies under:

```text
.vix/deps/
```

and the generated CMake integration is written to:

```text
.vix/vix_deps.cmake
```

Do not edit `.vix/vix_deps.cmake` manually. It is generated from dependency state.

### Warm installs

If the exact checkout already exists in the cache but project integration has been removed, `vix install` can rebuild `.vix/deps` and `.vix/vix_deps.cmake` without resolving the dependency remotely.

### No-op installs

When the application or module declaration, lockfile, cache, dependency links, and generated CMake integration already match, the command returns without remote Git resolution:

```text
✔ Dependencies already up to date
```

Correct dependency links are left untouched and an identical `.vix/vix_deps.cmake` is not rewritten.

Vix still performs the integrity checks required by the current lock state. A no-op install therefore means no dependency state needs to change, not that Vix trusts the existence of a directory without verification.

## Integrity verification

Git dependency lock entries can contain a content hash. Vix verifies the cached checkout before using it.

If the checkout has been modified or corrupted, installation fails instead of silently building different contents under the same lock entry.

A recovery path is:

```bash
vix store gc
vix install
```

Do not disable or bypass an integrity failure without understanding why the cached dependency changed.

## Failure behavior

Direct Git installation protects dependency declarations and lock state from partial publication. Root-owned Git installation preserves the previous `vix.app` and `vix.lock` state when resolution, validation, materialization, or metadata publication fails.

For a module-owned Git dependency, the same guarantee applies to `modules/<name>/vix.module` and the root `vix.lock`. A failed installation restores the previous manifest bytes, and a lockfile that did not exist before the operation is not left behind.

Project metadata mutations are serialized so two Vix commands cannot silently overwrite each other's dependency state. If an interruption occurs while multiple metadata files are being published, Vix recovers incomplete transaction state before the next project mutation.

Manifest reconciliation also prepares changed lock state before publishing it. If a newly added dependency cannot be resolved, existing valid lock entries remain unchanged.

Generated project integration can be repaired by running `vix install` again after the underlying failure has been corrected.

## Registry dependencies

Registry packages are normally added with `vix add`:

```bash
vix registry sync
vix add gk/json@^1.0.0
vix install
```

When a registry package belongs to one application module, use `vix add --module`:

```bash
vix add gk/jwt@^1.0.0 --module auth
vix install
```

`vix add --module` changes the module's registry dependency declaration. `vix install <git-url> --module` is the corresponding workflow for a direct Git dependency.

For registry dependency ranges, `vix install` uses the resolved entries in `vix.lock`. It does not act like `vix update` and does not choose newer registry versions during a normal install.

Use:

```bash
vix outdated
vix update
```

when you intentionally want to inspect or resolve newer registry versions.

## Global packages

`vix install` can also install one registry package into the Vix-managed user prefix:

```bash
vix install -g gk/jwt
```

A specific version or supported range can be requested:

```bash
vix install -g gk/jwt@1.0.0
vix install -g gk/jwt@^1.0.0
```

Scoped-style syntax is also accepted:

```bash
vix install -g @gk/jwt
```

Global install resolves the package from the registry, prepares its dependencies, builds it with CMake when needed, runs its CMake install rules, and records the installed files.

The default prefix is:

```text
~/.vix/global/
```

with state such as:

```text
~/.vix/global/
├── bin/
├── include/
├── lib/
├── share/
└── installed.json
```

Set `VIX_GLOBAL_PREFIX` when a different global Vix prefix is required.

Global installation is separate from project dependency state. Installing a library with `-g` does not add it to the current project's `vix.lock`.

## Git progress

When a direct Git dependency requires remote work, Vix reports the operation phase as soon as resolution or connection begins instead of remaining silent until the transfer is already underway.

When Git provides measurable object progress, Vix reports that real Git phase, such as receiving objects. The percentage describes Git's reported object progress and is not presented as a fabricated overall install percentage.

Interactive terminals can update the current progress line. Redirected output and non-interactive environments use stable log lines without terminal cursor-control sequences. A warm no-op install does not start progress output when no remote work is required.

## Security

A Git dependency is source code from another repository. CMake configure and build logic can execute code on the local machine.

Review repositories you do not trust before installing them.

## Git options

| Option                 | Purpose                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| `--name <name>`        | Set the dependency name stored in the owning manifest.               |
| `--tag <tag>`          | Resolve a Git tag.                                                   |
| `--branch <branch>`    | Resolve a Git branch to an exact commit.                             |
| `--rev <commit>`       | Use a specific revision or commit.                                   |
| `--target <target>`    | Select the CMake target used by the project or owning module.        |
| `--subdirectory <dir>` | Select a CMake project inside a monorepo.                            |
| `--module <name>`      | Declare the direct Git dependency in one enabled application module. |
| `-m <name>`            | Short form of `--module <name>`.                                     |
| `--header-only`        | Treat the repository as a header-only dependency.                    |
| `--include <dir>`      | Set the include directory for a header-only dependency.              |

Global mode uses:

```bash
vix install -g <package>
vix install --global <package>
```

`vix i` is an alias for `vix install`. `vix deps` is deprecated.

## Common workflows

### After cloning a project

```bash
git clone https://github.com/example/app.git
cd app

vix install
vix build
```

### Declare a Git dependency in `vix.app`

```toml
[dependencies.spdlog]
git = "https://github.com/gabime/spdlog"
tag = "v1.15.3"
target = "spdlog::spdlog"

[dependencies.spdlog.cmake]
SPDLOG_BUILD_TESTS = false
SPDLOG_BUILD_EXAMPLE = false
SPDLOG_BUILD_BENCH = false
```

Then:

```bash
vix install
vix build
```

### Install a Git dependency from the command line

```bash
vix install https://github.com/nlohmann/json.git \
  --tag v3.12.0 \
  --target nlohmann_json::nlohmann_json

vix build
```

### Install a Git dependency for one module

```bash
vix install https://github.com/gabime/spdlog \
  --tag v1.15.3 \
  --target spdlog::spdlog \
  --module auth

vix modules check
vix build
```

The dependency declaration is stored in `modules/auth/vix.module`, while its exact revision remains part of the root `vix.lock`.

### Restore project integration from cache

If `.vix/deps` or `.vix/vix_deps.cmake` was removed but the locked checkout is still cached:

```bash
vix install
```

Vix recreates the missing project integration from the cached exact revision.

### CI

For a project whose dependency state is already committed:

```bash
vix install
vix build --build-target all
vix tests
```

Registry-backed projects may need `vix registry sync` before operations that require registry resolution. A locked install that can be satisfied from local state does not need to resolve unchanged Git dependencies remotely.

## Troubleshooting

### Git revision cannot be resolved

Check that the repository and selector are valid, then correct the `tag`, `branch`, or `rev` in `vix.app` and run:

```bash
vix install
```

### Integrity check fails

A cached checkout no longer matches the content recorded by the lockfile. Remove stale cache state through the Vix store workflow and install again:

```bash
vix store gc
vix install
```

### CMake target is not available

Make sure the dependency exposes the target written in the owning manifest:

```toml
target = "library::library"
```

For a monorepo, also verify that `subdirectory` points to the CMake project that defines the target.

### Module dependency cannot be installed

For `vix install <git-url> --module <name>`, verify that the module:

- is declared in `vix.app`
- is enabled
- has an accessible module directory
- has a valid `vix.module`

Vix validates these conditions before attempting Git resolution.

### Git dependency requirements conflict

If two active owners request incompatible revisions or incompatible CMake configuration for the same effective Git dependency, Vix rejects the change instead of choosing one declaration.

Keep the application and module requirements compatible, then run the install again.

## Related commands

| Command        | Purpose                                                     |
| -------------- | ----------------------------------------------------------- |
| `vix add`      | Add a registry dependency to the project or one module.     |
| `vix modules`  | Create, inspect, enable, disable, and validate app modules. |
| `vix update`   | Intentionally resolve newer registry dependency versions.   |
| `vix outdated` | Check for newer registry dependency versions.               |
| `vix remove`   | Remove a project dependency.                                |
| `vix list`     | Inspect project dependency state.                           |
| `vix store`    | Manage local dependency storage.                            |
| `vix build`    | Build the project after dependencies are ready.             |
| `vix run`      | Run an existing build or a C++ source file.                 |
