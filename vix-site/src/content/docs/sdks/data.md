# Data SDK

The `data` SDK is the Vix.cpp profile for persistence-oriented projects.

Install it when a project needs database access, ORM workflows, key-value storage, or cache support. The profile includes the common Vix foundation, then adds the modules used to store, query, migrate, cache, and organize application data.

```bash id="m1n8sz"
vix upgrade --sdk data
```

After the profile is installed, the development workflow stays the same. You still use `vix build`, `vix run`, and `vix dev`. The CLI resolves the installed SDK profile when it builds or runs the project.

## Install the Data SDK

Install the CLI first if it is not already installed.

Linux and macOS:

```bash id="xg5f6j"
curl -fsSL https://vixcpp.com/install.sh | bash
```

Windows PowerShell:

```powershell id="t07kw4"
irm https://vixcpp.com/install.ps1 | iex
```

Then install the data profile:

```bash id="tef4vw"
vix upgrade --sdk data
```

Inspect the profile before installing it:

```bash id="z73qgs"
vix upgrade --sdk info data
```

Use this command when you want to see the modules, notes, version information, and system dependencies for the current release.

## What the Data SDK includes

The data profile includes the common Vix foundation.

```txt id="c8r7ei"
common foundation
  cli
  core
  json
  error
  path
  fs
  io
  env
  os
  utils
  log
  async
  time
  process
  threadpool
  template
  ui
  note
```

It then adds the data-oriented modules.

```txt id="pfigyo"
data
  db
  orm
  kv
  cache
```

This makes the profile suitable for applications that need database access, migration workflows, lightweight key-value storage, and cache-backed application behavior.

## When to use it

Use the Data SDK when the project’s main work is around stored application state.

That includes backend applications with database models, tools that manage local SQLite state, services that need migrations, projects that use the Vix ORM workflow, and applications that need KV or cache modules as part of their runtime.

```bash id="f9c8b2"
vix upgrade --sdk data
```

The default SDK is enough for the base Vix workflow, but it does not include the data module family. When a project starts using `db`, `orm`, `kv`, or `cache`, install the data profile.

## Use it with a project

A normal data-oriented project workflow looks like this:

```bash id="d2bvdf"
vix new api
cd api
vix install
vix dev
```

Build without running:

```bash id="tl9oyq"
vix build
```

Run manually:

```bash id="z5py0c"
vix run
```

Start the development loop:

```bash id="gow5l2"
vix dev
```

The SDK profile stays behind the CLI workflow. You install the profile once, then work with the project through Vix commands.

## Build a data project

Use `vix build` when you only want to compile the project.

```bash id="cp475c"
vix build
```

Use verbose output when you need more detail from the Vix build workflow.

```bash id="mfhmxq"
vix build -v
```

Use a release build when preparing an optimized binary.

```bash id="vxak4c"
vix build --preset release
```

If the project needs SQLite-related build support, enable it through the CLI.

```bash id="cdytw8"
vix build --with-sqlite
```

For MySQL-related support:

```bash id="vecv1n"
vix build --with-mysql
```

Release examples:

```bash id="r6u6sq"
vix build --preset release --with-sqlite
vix build --preset release --with-mysql
```

The build command detects the project, resolves the local Vix environment, and uses the installed SDK profile during the build.

## Database command workflow

The Data SDK is closely related to the database commands exposed by the Vix CLI.

Use `vix db` for database inspection and operational workflows such as status checks, migrations, and backups.

```bash id="py46jr"
vix db status
vix db migrate
vix db backup
```

Use `vix orm` for ORM migration workflows.

```bash id="n3pcyo"
vix orm status
vix orm migrate
```

When generating a migration, the command should be run from the project where the schema and migration directory belong.

```bash id="eer7o2"
vix orm makemigrations --new ./schema.new.json --dir ./migrations --name add_users
```

The exact workflow depends on the project structure, but the important point is simple: data projects should stay inside the Vix command surface. The SDK gives the machine the native data modules, and the CLI gives the project a consistent way to build, run, inspect, and migrate.

## Cache and KV workflows

The data profile includes both `kv` and `cache`.

Use `kv` when the project needs simple key-value storage behavior. Use `cache` when the project needs a cache layer around data that can be recomputed, restored, or refreshed. These modules belong in the data profile because they are part of how applications keep state close to the runtime without turning every project into a full database application.

```txt id="bgj1r6"
kv
cache
```

The module-specific pages should be used for API-level examples. This page only explains which SDK profile provides the native modules.

## Verify the installation

After installing the data profile, inspect it:

```bash id="u3c8ou"
vix upgrade --sdk info data
```

Check the environment:

```bash id="bc1sos"
vix doctor
```

Print Vix paths and local state:

```bash id="o5u11u"
vix info
```

Then run a small file to confirm that the CLI and SDK are usable.

```bash id="cotzhr"
cat > main.cpp <<'CPP'
#include <vix.hpp>

int main()
{
  vix::print("Hello from the Vix Data SDK");
  return 0;
}
CPP

vix run main.cpp
```

Expected output:

```txt id="ke61bw"
Hello from the Vix Data SDK
```

If this compiles and runs, the CLI can find the installed SDK profile.

## Update the Data SDK

Install or update the latest data profile:

```bash id="lx5wzh"
vix upgrade --sdk data
```

Preview the update without changing files:

```bash id="flshv9"
vix upgrade --sdk data --dry-run
```

Install a specific version:

```bash id="ig5hrv"
vix upgrade --sdk data --version v2.7.0
```

Use JSON output for scripts:

```bash id="h3k7z8"
vix upgrade --sdk data --json
```

## Remove the Data SDK

Remove the data profile when it is no longer needed:

```bash id="gpq89a"
vix uninstall --sdk data
```

Preview the removal first:

```bash id="bofxq0"
vix uninstall --sdk data --dry-run
```

Remove a specific version:

```bash id="h7hvnx"
vix uninstall --sdk data --version v2.7.0
```

List installed SDK profiles known to the uninstall command:

```bash id="mm6jm8"
vix uninstall --sdk-list
```

## System dependencies

The data profile may require native libraries used by its modules, especially when the project uses a database backend such as SQLite or MySQL.

Check the current release information before installing or debugging the profile.

```bash id="g7oxao"
vix upgrade --sdk info data
```

Install the system packages shown by that command for your operating system. The SDK profile gives Vix the native data module layer, but the operating system still needs the database libraries and development packages those modules depend on.

## When the Data SDK is not enough

The data profile is focused on persistence and cache workflows. If the project also moves into another domain, install the matching profile beside it.

For backend, WebSocket, WebRPC, middleware, validation, crypto, or outgoing HTTP requests:

```bash id="qg8klm"
vix upgrade --sdk web
```

For P2P nodes, local-first sync, or peer networking:

```bash id="m3fzzc"
vix upgrade --sdk p2p
```

For desktop applications:

```bash id="u4eecq"
vix upgrade --sdk desktop
```

For game-oriented workflows:

```bash id="s7u5wt"
vix upgrade --sdk game
```

For agent tooling:

```bash id="tccp2g"
vix upgrade --sdk agent
```

A machine can have multiple SDK profiles installed. Use the smallest set that matches the projects you are actively building.

## Common mistakes

### Using the default SDK for data modules

The default profile is the base development layer. It does not include the data module family.

If the project uses `db`, `orm`, `kv`, or `cache`, install the data profile.

```bash id="g7xci4"
vix upgrade --sdk data
```

### Installing the full SDK for one data project

The full SDK works, but it is usually more than a normal data project needs.

```bash id="wsfgoi"
vix upgrade --sdk all
```

For database, ORM, KV, and cache work, use the data profile.

```bash id="tx1f8x"
vix upgrade --sdk data
```

This keeps setup smaller and avoids unrelated dependencies.

### Forgetting database build options

Installing the Data SDK gives Vix the data modules, but a project may still need database-specific build options depending on the backend it uses.

For SQLite:

```bash id="s4ijzr"
vix build --with-sqlite
```

For MySQL:

```bash id="p3zvx9"
vix build --with-mysql
```

Use the option that matches the project instead of enabling every database backend by default.

### Passing runtime arguments to `vix build`

`vix build` compiles only. It does not start the app.

```bash id="oq1kqv"
vix build
```

Use `vix run` when you want to run the program.

```bash id="muq0uj"
vix run --run --port 8080
```

### Running database commands outside the project

Database and ORM commands usually depend on project files, environment, or migration directories.

Wrong:

```bash id="v05b8c"
vix orm status
```

Correct:

```bash id="h36gmb"
cd api
vix orm status
```

Keep data commands close to the project they operate on.

## Daily workflow

A typical data project workflow looks like this:

```bash id="u4o616"
vix new api
cd api
vix install
vix dev
```

Check database state when needed:

```bash id="igxyy5"
vix db status
vix orm status
```

Before committing:

```bash id="wy2ji2"
vix fmt --check
vix check --tests
```

Before release:

```bash id="h8ea5i"
vix build --preset release
vix tests --preset release
```

When the project uses a specific database backend, build with the matching backend option.

```bash id="ch5qwx"
vix build --preset release --with-sqlite
```

The data SDK stays behind the CLI workflow. Once installed, the profile gives Vix the native modules needed for database, ORM, KV, and cache projects.

## Next step

Continue with the Desktop SDK when the project needs the Vix desktop shell and UI WebView support.

[Open the Desktop SDK guide](/sdks/desktop)
