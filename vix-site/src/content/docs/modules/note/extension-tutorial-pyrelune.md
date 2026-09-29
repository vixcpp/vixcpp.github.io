# Pyrelune Extension Tutorial

This tutorial shows the smallest useful workflow for a Vix Note runtime extension.

The example follows the Pyrelune shape: one executable package, one Python cell type, one one-shot JSON runtime. The important part is the package workflow, not the Python implementation.

## Package layout

A minimal extension repository can look like this:

```txt
pyrelune/
├── CMakeLists.txt
├── README.md
├── vix.json
├── src/
│   └── main.cpp
└── scripts/
    └── pyrelune-runtime.py
```

The executable is the Vix Note runtime entry point. Helper scripts are normal package files and should be installed by CMake.

## Manifest

The package is an ordinary executable package.

```json
{
  "namespace": "softadastra",
  "name": "pyrelune",
  "version": "0.1.1",
  "type": "executable",
  "license": "MIT",
  "description": "Python execution kernel for Vix Note.",
  "repository": "https://github.com/softadastra/pyrelune",
  "authors": [{ "name": "Softadastra" }],
  "keywords": ["note", "python", "kernel"],
  "bin": {
    "pyrelune": "pyrelune"
  },
  "extensions": {
    "note": {
      "api": "1",
      "capabilities": [
        "execute",
        "stdout",
        "stderr",
        "mime-output",
        "diagnostics"
      ],
      "cellTypes": [
        {
          "id": "python",
          "label": "Python",
          "language": "python",
          "aliases": ["py"],
          "executable": true,
          "commentLine": "#",
          "defaultSource": "# Write your explanation here.\n",
          "placeholder": "Write your Python code here."
        }
      ],
      "runtime": {
        "command": "pyrelune",
        "protocol": "vix-note-extension-1",
        "mode": "oneshot"
      }
    }
  }
}
```

Nothing in this manifest creates a second package type. `type` is still `executable`. The `extensions.note` object tells Vix Note that the installed command contributes a Python cell type.

## Install runtime files

CMake should install both the executable and any runtime files it needs.

```cmake
install(TARGETS pyrelune RUNTIME DESTINATION bin)
install(FILES scripts/pyrelune-runtime.py DESTINATION share/pyrelune)
```

Do not rely on the current working directory to find helper files. When a user runs `pyrelune` from `PATH`, `argv[0]` may be only `pyrelune`. Resolve helper files relative to the real executable path when possible, then fall back to development paths or an explicit environment override.

## Runtime behavior

The executable reads one JSON request from stdin and writes one JSON response to stdout.

Input:

```json
{
  "protocol": "vix-note-extension-1",
  "cellType": "python",
  "source": "print(2 + 3)",
  "workingDirectory": "/project"
}
```

Output:

```json
{
  "protocol": "vix-note-extension-1",
  "ok": true,
  "stdout": "5
"
}
```

For a handled language error, return `ok: false` with an error object instead of crashing the process.

## Publish

Create and push a tag that matches `vix.json`.

```bash
git tag v0.1.1
git push origin main
git push origin v0.1.1
vix publish 0.1.1
```

Use dry run while iterating on the manifest:

```bash
vix publish 0.1.1 --dry-run
```

Publish validates both the normal package metadata and the `extensions.note` metadata.

## Install and inspect

After the registry index is synced, users can find the extension:

```bash
vix registry sync
vix search python --extension note
```

Install it globally:

```bash
vix install -g softadastra/pyrelune
```

Inspect discovery:

```bash
vix note --list-extensions
```

Expected shape:

```txt
softadastra/pyrelune  0.1.1  available
```

The installed files should include the command and helper script:

```txt
~/.vix/global/bin/pyrelune
~/.vix/global/share/pyrelune/pyrelune-runtime.py
```

## Use in Vix Note

Start Vix Note:

```bash
vix note lesson.vixnote
```

The cell type picker should include Python. A Python cell is saved with `type` or legacy `kind` metadata equal to `python`, and the source is preserved even when the extension is not installed later.

A simple cell can be:

```python
a = 10
b = 5
print(a + b)
```

When the runtime is available and healthy, Run sends the cell source to `pyrelune` through the extension protocol and renders the returned outputs under the cell.
