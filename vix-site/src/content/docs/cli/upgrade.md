# vix upgrade

`vix upgrade` updates the local Vix environment.

It can upgrade the `vix` CLI itself, install or upgrade SDK profiles, and upgrade globally installed packages from the Vix registry. The command is intentionally centered on the developer machine, not on one project directory. Use it when the local Vix installation needs to move to a newer release, when a project needs a native SDK profile that is not installed yet, or when a global package should be refreshed.

```bash id="u1q29a"
vix upgrade
```

In the normal Vix workflow, the CLI is the bootstrap. SDK profiles provide the native development layer used by `vix build`, `vix run`, and `vix dev`. `vix upgrade` is the command that keeps both layers current.

## What it upgrades

`vix upgrade` has three modes.

```txt id="g0fuw1"
vix upgrade                  upgrade the Vix CLI
vix upgrade --sdk web        install or upgrade a SDK profile
vix upgrade -g gk/jwt        upgrade a globally installed package
```

The default mode is the CLI upgrade. SDK mode is selected with `--sdk`. Global package mode is selected with `-g` or `--global`.

## Upgrade the CLI

Run `vix upgrade` without extra mode flags to upgrade the CLI.

```bash id="wwq2qy"
vix upgrade
```

This resolves the latest release, downloads the CLI asset for the current platform, verifies it, and replaces the local `vix` binary.

Check the installed version after the upgrade:

```bash id="o73ket"
vix --version
```

Then inspect the environment:

```bash id="k80rmt"
vix doctor
```

This is the usual flow after updating the command-line tool.

```bash id="pqrslc"
vix upgrade
vix --version
vix doctor
```

## Install a specific CLI version

Use a release tag when the machine should install a specific version instead of the latest release.

```bash id="x1n6q9"
vix upgrade v2.7.0
```

The explicit option form is also accepted.

```bash id="uw0sxy"
vix upgrade --version v2.7.0
```

This is useful for release testing, reproducing a build environment, or moving a machine to the same version used by the rest of a team.

## Check before upgrading

Use `--check` when you only want to know whether an update is available.

```bash id="os4jld"
vix upgrade --check
```

This does not install anything. It resolves the target version and compares it with the current CLI version when the local version can be detected.

For a scripted environment:

```bash id="q6apef"
vix upgrade --check --json
```

Use `--check` when the command should report state without changing the filesystem.

## Dry run

Use `--dry-run` when you want to see the upgrade plan without downloading or installing files.

```bash id="awvqgr"
vix upgrade --dry-run
```

For a specific version:

```bash id="rl1n62"
vix upgrade --version v2.7.0 --dry-run
```

Dry run is useful before changing a production machine, a CI image, or a development environment that needs to stay stable.

## JSON output

Use `--json` when the command is called from scripts or automation.

```bash id="d8haxw"
vix upgrade --check --json
```

```bash id="pcoxpy"
vix upgrade --dry-run --json
```

```bash id="vcq1md"
vix upgrade --sdk web --json
```

JSON output is designed for machines. Human progress output is suppressed so scripts do not need to parse styled terminal text.

## Verbose output

Use `--verbose` when you need more diagnostic information.

```bash id="kr2jv4"
vix upgrade --verbose
```

Verbose output is useful when a download fails, when a platform asset is missing, when a permission issue prevents replacement, or when you need to understand which command is being executed under the hood.

You can combine it with dry run:

```bash id="dryo1h"
vix upgrade --dry-run --verbose
```

## SDK profiles

Use `--sdk` to install or upgrade a Vix SDK profile.

```bash id="yhu91w"
vix upgrade --sdk web
```

SDK profiles are the native Vix module sets used by projects. A backend service, a database project, a desktop shell, a P2P node, a game project, and an agent workflow do not need the same native modules. Profiles make that difference explicit while keeping the project workflow centered on the CLI.

After a profile is installed, build and run normally:

```bash id="m7lbaf"
vix build
vix run
vix dev
```

The project does not need a manual SDK path in normal Vix workflows. The CLI resolves the installed SDK profile from the local Vix environment.

## Install the default SDK

When `--sdk` is used without a profile, Vix installs or upgrades the `default` SDK profile.

```bash id="xhp99s"
vix upgrade --sdk
```

This is equivalent to:

```bash id="kh6hb3"
vix upgrade --sdk default
```

Use the default profile for normal Vix.cpp projects, local development, and first-time setup when the project does not need a specialized module family yet.

## List SDK profiles

Use `--sdk list` to see which SDK profile assets are available for the current release and platform.

```bash id="zrkwv3"
vix upgrade --sdk list
```

This command does not install a profile. It checks the release assets and prints the profiles that can be installed.

Use JSON output when another tool needs to consume the result.

```bash id="e32lsh"
vix upgrade --sdk list --json
```

## Inspect a SDK profile

Use `--sdk info` before installing a profile.

```bash id="iqxvmy"
vix upgrade --sdk info web
```

The profile information shows the profile description, included modules, system dependencies, notes, and documentation link. This is the safest way to confirm whether a machine needs `web`, `data`, `desktop`, `p2p`, `game`, `agent`, or `all`.

The shortcut form is also available:

```bash id="kzmp3w"
vix upgrade --sdk-info web
```

You can also write:

```bash id="pz7oyc"
vix upgrade --sdk web --info
```

Use this command before installing a large profile, especially `desktop`, `game`, or `all`, because those profiles may require additional system libraries.

## Available SDK profiles

```txt id="m52ww5"
default   normal Vix.cpp projects and local development
web       HTTP, middleware, WebSocket, validation, crypto, WebRPC, requests
data      database, ORM, KV, and cache workflows
desktop   desktop apps with the Vix UI desktop shell
p2p       peer-to-peer networking and local-first systems
game      game and realtime rendering workflows
agent     agent tooling and controlled automation workflows
all       complete SDK profile
```

The `all` profile is a complete SDK profile. It is not a shortcut that installs every smaller profile one by one.

## Install one SDK profile

Install a profile by name:

```bash id="s391ke"
vix upgrade --sdk web
```

Install a specific version of a profile:

```bash id="fg5mah"
vix upgrade --sdk web --version v2.7.0
```

After installation, inspect the profile again:

```bash id="aufysb"
vix upgrade --sdk info web
```

Then verify that the environment is healthy:

```bash id="bfu3ww"
vix doctor
```

## Install multiple SDK profiles

A machine can have more than one SDK profile installed.

```bash id="s5r2fn"
vix upgrade --sdk web data desktop
```

Comma-separated profiles are also accepted:

```bash id="h4ai0b"
vix upgrade --sdk web,data,desktop
```

This is useful when one development machine is used for several kinds of projects. For example, the same machine may build a backend API with the `web` profile and a database tool with the `data` profile.

When a single project uses modules from multiple profiles, install the exact profiles that provide those modules. For example, a backend that links both `vix::db` and `vix::websocket` should install `data` and `web`.

```bash id="sdk-web-data-project"
vix upgrade --sdk web data
```

During `vix build`, Vix detects the required `vix::*` targets, selects the installed provider profiles, and generates a composed SDK package for the project. The project does not need to install the heavier `all` profile just to combine `web` and `data`.

Profiles composed for one build must have the same Vix version. Upgrade them together when the project depends on more than one profile.

Install multiple profiles for a specific version:

```bash id="kgnex2"
vix upgrade --sdk web data --version v2.7.0
```

## Where SDK profiles are installed

SDK profiles are installed under the Vix home directory.

```txt id="w5txna"
~/.vix/sdk/<profile>/<version>/
```

Each profile can also have a `current` pointer and metadata file.

```txt id="g61hww"
~/.vix/sdk/web/current
~/.vix/sdk/web/current.json
```

This lets the CLI resolve the active profile version without asking the user to pass a path every time.

## Verify a SDK profile

After installing a profile, run a simple check.

```bash id="ldp5om"
cat > main.cpp <<'CPP'
#include <vix.hpp>

int main()
{
  vix::print("Hello from Vix.cpp");
  return 0;
}
CPP

vix run main.cpp
```

Expected output:

```txt id="mhdr9d"
Hello from Vix.cpp
```

For a profile-specific module, use a small file that includes the module you need. For example, after installing the `web` profile:

```bash id="e1hmak"
cat > main.cpp <<'CPP'
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

int main()
{
  auto response = vix::requests::get("https://example.com/");

  vix::print("status:", response.status_code());
  return 0;
}
CPP

vix run main.cpp
```

If this compiles and runs, the CLI can find the installed SDK profile.

## Global package upgrades

Use `-g` or `--global` to upgrade a package that is already installed globally.

```bash id="lom1u6"
vix upgrade -g gk/jwt
```

Scoped package syntax is accepted:

```bash id="cgc3t9"
vix upgrade -g @gk/jwt
```

Install a specific package version:

```bash id="m3ey96"
vix upgrade -g gk/jwt@1.0.0
```

Global package upgrades use the local registry index and the global package manifest under the Vix home directory. The command resolves the package from the registry, checks the currently installed global package, then refreshes it when the target commit is different.

A global package must already be installed globally. If the package is not known in the global manifest, the command reports that the global package is not installed.

## Check a global package

Use `--check` to inspect the target without installing.

```bash id="n1zljz"
vix upgrade -g gk/jwt --check
```

Use `--dry-run` to preview the upgrade plan.

```bash id="vhze6v"
vix upgrade -g gk/jwt --dry-run
```

Use JSON for scripts:

```bash id="h3jsab"
vix upgrade -g gk/jwt --check --json
```

## Registry state for global packages

Global package upgrades depend on the local registry index.

If a package cannot be found, sync the registry first:

```bash id="uqo7uw"
vix registry sync
```

Then try again:

```bash id="wdkg2s"
vix upgrade -g gk/jwt
```

This keeps global package upgrades tied to the same registry workflow used by normal Vix package management.

## Verification

CLI and SDK upgrades use GitHub Releases.

The downloaded artifact is verified with SHA-256. On Unix systems, minisign verification is also used when `minisign` is available. If the checksum cannot be verified, the upgrade should not continue.

This gives the command a clear rule: downloaded release assets must be checked before they are installed.

## Environment variables

`vix upgrade` supports a small set of environment overrides.

```txt id="uedhzm"
VIX_REPO       override the GitHub repository used for CLI and SDK upgrades
VIX_CLI_PATH   override current Vix binary path detection
```

The default repository is:

```txt id="tyem50"
vixcpp/vix
```

A maintainer can point upgrade checks to another repository when testing release assets.

```bash id="pkr1ll"
VIX_REPO=my-org/vix vix upgrade --check
```

Use `VIX_CLI_PATH` when the command needs to detect or replace a specific local binary.

```bash id="kfqnnt"
VIX_CLI_PATH="$HOME/.local/bin/vix" vix upgrade --check
```

Most users should not need these variables.

## Common workflows

Update the CLI:

```bash id="v58r8j"
vix upgrade
vix --version
vix doctor
```

Check first, then upgrade:

```bash id="vq5wme"
vix upgrade --check
vix upgrade
```

Preview a CLI upgrade:

```bash id="zss9xq"
vix upgrade --dry-run
```

Install the Web SDK:

```bash id="cg81ff"
vix upgrade --sdk web
vix upgrade --sdk info web
```

Install SDK profiles for a multi-project machine:

```bash id="klyim2"
vix upgrade --sdk web data desktop
```

Install a specific release:

```bash id="papc56"
vix upgrade --version v2.7.0
vix upgrade --sdk web --version v2.7.0
```

Upgrade a global package:

```bash id="a9p0x3"
vix upgrade -g gk/jwt
```

## Common mistakes

### Confusing `upgrade` and `update`

`vix upgrade` changes the local Vix environment: the CLI, SDK profiles, or globally installed packages.

Project dependencies are handled by the project dependency workflow.

```bash id="zy5c59"
vix update
```

Use `upgrade` for the toolchain environment. Use `update` when a project dependency graph needs to move to newer package versions.

### Installing only the CLI

The CLI gives you the command surface, but SDK profiles provide the native Vix layer used by project builds.

```bash id="dx6cwv"
vix upgrade --sdk web
```

Install the profile that matches the modules used by the project.

### Using the default SDK for web modules

The default SDK is the base profile. It does not include the web module family.

If the project uses `vix::requests`, WebSocket, middleware, validation, crypto, or WebRPC, install the web profile.

```bash id="yl7qoj"
vix upgrade --sdk web
```

### Installing `all` by default

The full SDK works, but it is usually more than a normal project needs.

```bash id="yeglbm"
vix upgrade --sdk all
```

For a backend or API, use `web`.

```bash id="f9z6aj"
vix upgrade --sdk web
```

For database or ORM work, use `data`.

```bash id="smm841"
vix upgrade --sdk data
```

Use `all` when the machine really needs the complete platform.

### Expecting `--sdk list` to install anything

This command only lists available SDK assets.

```bash id="scjp0e"
vix upgrade --sdk list
```

Install a profile explicitly:

```bash id="wy6qib"
vix upgrade --sdk web
```

### Upgrading a global package that is not installed globally

`vix upgrade -g` upgrades a globally installed package. It does not silently create a new global install when the package is missing from the global manifest.

Check your global packages first with the package listing workflow, then upgrade the package name that is actually installed.

```bash id="kvsd32"
vix list -g
vix upgrade -g gk/jwt
```

### Ignoring permissions

If the CLI was installed into a system location, the upgrade may need permissions that match that installation.

For user installs, prefer a user-writable location such as:

```txt id="qj19ve"
~/.local/bin/vix
```

If an upgrade fails with a permission error, fix the install location or run the command with the permissions required by that location.

## Troubleshooting

### `vix upgrade --check` cannot resolve the latest release

The command needs network access to GitHub Releases.

Try a specific version:

```bash id="h5yf4u"
vix upgrade --version v2.7.0 --dry-run
```

Then run the upgrade when the network path is working.

### SDK profile is unknown

Check the profile name.

```bash id="jls6iv"
vix upgrade --sdk list
```

Supported profile names are:

```txt id="q2ntly"
default
web
data
desktop
p2p
game
agent
all
```

### SDK asset is not available

SDK profiles are release assets. Availability depends on the release and platform.

Check the current release first:

```bash id="z6pg83"
vix upgrade --sdk list
```

Then inspect the profile:

```bash id="q4nf15"
vix upgrade --sdk info web
```

Use a specific release if needed:

```bash id="a99w9e"
vix upgrade --sdk web --version v2.7.0
```

### Package cannot be found for global upgrade

Refresh the registry index:

```bash id="nx702c"
vix registry sync
```

Then retry:

```bash id="niqn7w"
vix upgrade -g gk/jwt
```

### Need machine-readable failure output

Add `--json`.

```bash id="gm2cay"
vix upgrade --sdk web --json
```

The command returns structured error information instead of styled human output.

## Command summary

```bash id="pz20ml"
vix upgrade
vix upgrade vX.Y.Z
vix upgrade --version vX.Y.Z

vix upgrade --check
vix upgrade --dry-run
vix upgrade --json
vix upgrade --verbose

vix upgrade --sdk
vix upgrade --sdk default
vix upgrade --sdk web
vix upgrade --sdk list
vix upgrade --sdk info web
vix upgrade --sdk-info web
vix upgrade --sdk web --version vX.Y.Z
vix upgrade --sdk web data desktop
vix upgrade --sdk web,data,desktop

vix upgrade -g gk/jwt
vix upgrade -g gk/jwt@1.0.0
vix upgrade -g @gk/jwt
```

## Options

| Option                 | Meaning                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `-g, --global`         | Upgrade a globally installed package                             |
| `--sdk [profile]`      | Install or upgrade a Vix SDK profile                             |
| `--sdk list`           | List SDK profile assets available in the current release         |
| `--sdk info [profile]` | Show modules, system dependencies, notes, and docs for a profile |
| `--sdk-info <profile>` | Shortcut for `vix upgrade --sdk info <profile>`                  |
| `--version <tag>`      | Use a specific release tag                                       |
| `--check`              | Check the target version without installing                      |
| `--dry-run`            | Simulate without changing files                                  |
| `--json`               | Print machine-readable JSON output                               |
| `--verbose`            | Print diagnostic details                                         |
| `-h, --help`           | Show command help                                                |

## Next step

Use `vix uninstall` when you need to remove the CLI, remove SDK profiles, or remove globally installed packages from the local machine.

[Open the uninstall guide](/cli/uninstall)
