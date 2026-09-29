# vix uninstall

`vix uninstall` removes parts of the local Vix environment.

It can remove the Vix CLI, remove globally installed packages, and, starting with Vix.cpp `v2.7.1`, remove SDK profiles installed with `vix upgrade --sdk`.

```bash id="egow0a"
vix uninstall
```

Use this command when a machine needs a clean Vix setup, when an SDK profile is no longer needed, or when a global package should be removed from the local Vix registry store.

## What it removes

`vix uninstall` has three main modes.

```txt id="r1b179"
vix uninstall                 remove the Vix CLI
vix uninstall --sdk web       remove an SDK profile
vix uninstall -g gk/jwt       remove a globally installed package
```

The default mode removes the CLI. SDK mode is selected with `--sdk`. Global package mode is selected with `-g` or `--global`.

SDK profile removal is available from `v2.7.1`.

## Remove the CLI

Run `vix uninstall` without a mode flag to remove the Vix CLI from the detected install location.

```bash id="gdyqdm"
vix uninstall
```

The command checks known candidate paths, removes the first matching CLI binary, removes install metadata, and prints a short hint to refresh the shell command cache.

```bash id="tpnkzt"
hash -r
```

Restart the terminal if the shell still sees the old `vix` command after removal.

## Preview before removing

Use `--dry-run` when you want to see what would be removed without changing the filesystem.

```bash id="g9tsvx"
vix uninstall --dry-run
```

This is the safest command to run before removing the CLI, an SDK profile, or a global package.

```bash id="fmrtnk"
vix uninstall --sdk web --dry-run
vix uninstall -g gk/jwt --dry-run
```

## JSON output

Use `--json` when the command is called from scripts or automation.

```bash id="p6y43x"
vix uninstall --dry-run --json
```

For SDK removal:

```bash id="t24cil"
vix uninstall --sdk web --json
```

For global packages:

```bash id="tcfkiw"
vix uninstall -g gk/jwt --json
```

JSON output reports the target kind, removed paths, dry-run state, and errors in a machine-readable format.

## Verbose output

Use `--verbose` when you need more detail about what the uninstall command is checking.

```bash id="mzc0wf"
vix uninstall --verbose
```

This is useful when the command cannot find the expected binary, when a path is not writable, or when the CLI was installed in a non-standard location.

## Remove all detected CLI paths

By default, `vix uninstall` stops after removing the first detected CLI binary.

Use `--all` when you want it to try every detected CLI path.

```bash id="hodykd"
vix uninstall --all
```

This is useful when the machine has more than one `vix` binary in different locations.

## Include system paths

Use `--system` to include common system locations such as `/usr/local/bin` and `/usr/bin`.

```bash id="ll87lz"
vix uninstall --all --system
```

On Unix systems, system locations may require elevated permissions. When a system path cannot be removed, the command prints the path so it can be removed manually with the correct permissions.

## Remove from a specific path

Use `--path` when you know the exact binary to remove.

```bash id="n8rajc"
vix uninstall --path /home/user/.local/bin/vix
```

Use `--prefix` when Vix was installed under a known prefix.

```bash id="gkqdwg"
vix uninstall --prefix /home/user/.local
```

This removes:

```txt id="mblo4w"
/home/user/.local/bin/vix
```

These options are useful for custom installs and CI images.

## Purge local Vix data

Use `--purge` when you want to remove the local Vix data directory after removing the CLI.

```bash id="wfbpwa"
vix uninstall --purge
```

This removes the local Vix store under:

```txt id="hm87f8"
~/.vix
```

Use this carefully. The local store can contain SDK profiles, registry cache, global packages, and other Vix-managed local data.

Preview first:

```bash id="k3p3rq"
vix uninstall --purge --dry-run
```

## Remove an SDK profile

SDK profile removal is available starting with Vix.cpp `v2.7.1`.

Use `--sdk` with a profile name.

```bash id="crw4jw"
vix uninstall --sdk web
```

This removes the selected SDK profile directory from the local Vix SDK store.

```txt id="f1m6fs"
~/.vix/sdk/web
```

The supported SDK profile names are:

```txt id="tjj1gb"
default
web
data
desktop
p2p
game
agent
all
```

The `all` profile is a profile name. Removing it removes the installed `all` SDK profile.

```bash id="rvjsnb"
vix uninstall --sdk all
```

This is different from `--sdk-all`, which removes all known SDK profiles.

## Remove one SDK version

Use `--version` when you only want to remove one installed version from a profile.

```bash id="w6yfkl"
vix uninstall --sdk web --version v2.7.0
```

When the removed version is also the current version for that profile, the command also removes the profile’s current metadata and current pointer.

This is useful when a machine keeps several SDK versions and only one old version should be removed.

## Remove multiple SDK profiles

You can pass multiple SDK profiles after `--sdk`.

```bash id="m86jio"
vix uninstall --sdk web data desktop
```

Comma-separated profiles are also accepted.

```bash id="n2m3sc"
vix uninstall --sdk web,data,desktop
```

Use this when one machine has several SDK profiles installed and only some of them should be removed.

## List installed SDK profiles

Use `--sdk-list` to see the SDK profiles installed on the machine.

```bash id="bks3ke"
vix uninstall --sdk-list
```

JSON output is also available.

```bash id="jwa0za"
vix uninstall --sdk-list --json
```

The list shows each installed profile, its current version when metadata is available, and its local path.

## Remove all SDK profiles

Use `--sdk-all` to remove all known SDK profiles.

```bash id="m1pop9"
vix uninstall --sdk-all
```

Preview first:

```bash id="c70i55"
vix uninstall --sdk-all --dry-run
```

This removes the known SDK profile directories under `~/.vix/sdk`.

It is not the same as:

```bash id="n5imvk"
vix uninstall --sdk all
```

`--sdk all` removes the `all` profile. `--sdk-all` removes all known SDK profiles.

## Remove a global package

Use `-g` or `--global` to remove a globally installed package.

```bash id="n68abh"
vix uninstall -g gk/jwt
```

The long form is also accepted.

```bash id="b1jajt"
vix uninstall --global gk/jwt
```

The package must exist in the global package manifest. The command removes the installed package files and updates the global manifest.

If the package is not found, the command reports that it is not installed globally.

## Global package paths

Global package installs are tracked under the local Vix global store.

```txt id="cbxv9r"
~/.vix/global
~/.vix/global/installed.json
```

The uninstall command uses this manifest to find the installed package path. This keeps global package removal tied to the Vix registry workflow instead of guessing paths manually.

## Common workflows

Remove the CLI:

```bash id="t6zooa"
vix uninstall
hash -r
```

Preview CLI removal:

```bash id="lhklle"
vix uninstall --dry-run
```

Remove the CLI and local Vix data:

```bash id="qbbawe"
vix uninstall --purge
```

Remove an SDK profile:

```bash id="s51n1b"
vix uninstall --sdk web
```

Remove one SDK version:

```bash id="wv52hf"
vix uninstall --sdk web --version v2.7.0
```

List installed SDK profiles:

```bash id="d23irs"
vix uninstall --sdk-list
```

Remove all SDK profiles:

```bash id="omwj79"
vix uninstall --sdk-all
```

Remove a global package:

```bash id="h586ce"
vix uninstall -g gk/jwt
```

Use JSON output:

```bash id="k4ngyd"
vix uninstall --sdk web --json
```

## Common mistakes

### Expecting SDK uninstall before v2.7.1

SDK profile removal is available from `v2.7.1`.

```bash id="yxyfui"
vix uninstall --sdk web
```

On older versions, upgrade the CLI first.

```bash id="ihaw28"
vix upgrade
```

Then run the SDK uninstall command again.

### Confusing `--sdk all` and `--sdk-all`

This removes the `all` SDK profile:

```bash id="iwiuwp"
vix uninstall --sdk all
```

This removes all known SDK profiles:

```bash id="seqse9"
vix uninstall --sdk-all
```

Use `--dry-run` when the difference matters.

```bash id="oq4doy"
vix uninstall --sdk-all --dry-run
```

### Removing the CLI when you only wanted to remove an SDK

This removes the CLI:

```bash id="mr6mhd"
vix uninstall
```

This removes an SDK profile:

```bash id="jf9dm9"
vix uninstall --sdk web
```

Always include `--sdk` when the target is an SDK profile.

### Using `--purge` too early

`--purge` removes the local Vix data directory after removing the CLI.

```bash id="lpf6uo"
vix uninstall --purge
```

This is useful for a clean reset, but it is stronger than removing one SDK profile or one global package. Use a targeted command when only one part should be removed.

```bash id="xauu80"
vix uninstall --sdk web
vix uninstall -g gk/jwt
```

### Forgetting to refresh the shell

After removing the CLI, some shells may still cache the old command path.

```bash id="h914la"
hash -r
```

Restart the terminal if the shell still finds `vix`.

### Removing from a system path without permissions

If Vix was installed in `/usr/local/bin` or another system path, the uninstall command may not have permission to remove it.

Use `--dry-run` first:

```bash id="zxx2k2"
vix uninstall --all --system --dry-run
```

Then remove the path with the correct permissions if needed.

## Troubleshooting

### `vix` is still found after uninstall

Check where the shell is finding it.

```bash id="jbb2gp"
command -v vix
```

Then remove that path explicitly.

```bash id="p195mq"
vix uninstall --path /path/to/vix
```

If the CLI is already removed and only the old shell cache remains, refresh the shell.

```bash id="fbv1wz"
hash -r
```

### SDK profile is not found

List installed SDK profiles.

```bash id="anwj9w"
vix uninstall --sdk-list
```

Then remove the profile name shown by the list.

```bash id="m3i5y4"
vix uninstall --sdk web
```

### Unsupported SDK profile

Use one of the supported profile names.

```txt id="jnpe84"
default
web
data
desktop
p2p
game
agent
all
```

For all profiles, use:

```bash id="cgwkfh"
vix uninstall --sdk-all
```

### Global package is not found

The global package must exist in the Vix global manifest.

Check the package name used during global install, then remove that exact package id.

```bash id="bkd6gv"
vix uninstall -g gk/jwt
```

### Need machine-readable output

Add `--json`.

```bash id="g328oh"
vix uninstall --sdk-list --json
vix uninstall --sdk web --json
vix uninstall -g gk/jwt --json
```

## Command summary

```bash id="ugmwib"
vix uninstall
vix uninstall --dry-run
vix uninstall --json
vix uninstall --verbose

vix uninstall --purge
vix uninstall --all
vix uninstall --all --system
vix uninstall --prefix /path/to/prefix
vix uninstall --path /path/to/vix

vix uninstall --sdk default
vix uninstall --sdk web
vix uninstall --sdk web --version v2.7.0
vix uninstall --sdk web data desktop
vix uninstall --sdk web,data,desktop
vix uninstall --sdk-list
vix uninstall --sdk-all

vix uninstall -g gk/jwt
vix uninstall --global gk/jwt
```

## Options

| Option               | Meaning                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `--purge`            | Remove `~/.vix` after removing the CLI                                  |
| `--all`              | Try every detected CLI path instead of stopping after the first removal |
| `--system`           | Include common system locations such as `/usr/local/bin` and `/usr/bin` |
| `--prefix <dir>`     | Remove `<dir>/bin/vix`                                                  |
| `--path <file>`      | Remove a specific Vix binary                                            |
| `--sdk <profile>`    | Remove one SDK profile                                                  |
| `--sdk-list`         | List installed SDK profiles                                             |
| `--sdk-all`          | Remove all known SDK profiles                                           |
| `--version <tag>`    | Remove one SDK version from the selected profile                        |
| `-g, --global <pkg>` | Remove a globally installed package                                     |
| `--dry-run`          | Print what would be removed without changing the filesystem             |
| `--json`             | Print machine-readable output                                           |
| `--verbose`          | Print debug information                                                 |
| `-h, --help`         | Show command help                                                       |

## Next step

Use `vix upgrade` when you need to reinstall the CLI, reinstall an SDK profile, or move the local Vix environment to a newer release.

[Open the upgrade guide](/cli/upgrade)
