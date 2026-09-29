# Extension Requirements

A Note extension runtime is an executable program controlled by Vix Note.

The runtime is not loaded into the Note process. Vix Note starts it as a child process, sends JSON through stdin, reads JSON from stdout, captures stderr separately, and converts the response into normal Note outputs.

This process boundary keeps the first extension API simple. Extension authors do not need to link against a Vix Note C ABI, and Vix Note does not need to trust native code inside its own address space.

## Package requirements

A runtime extension should normally be an `executable` package.

The package must install its command with CMake install rules and declare the expected command in `vix.json`:

```json
{
  "type": "executable",
  "bin": {
    "pyrelune": "pyrelune"
  }
}
```

After global installation, the command should exist under:

```txt
~/.vix/global/bin/
```

If the runtime needs helper scripts or data files, install them under the package prefix with CMake. For example, Pyrelune installs its Python runtime script under:

```txt
<prefix>/share/pyrelune/pyrelune-runtime.py
```

The runtime should resolve its own helper files relative to the real executable path, not only from `argv[0]`, because a command launched from `PATH` may receive only the command name.

## Protocol requirements

The runtime must read one JSON object from stdin and write one JSON object to stdout.

The response must include:

```txt
ok
```

When `protocol` is present in the response, it must be:

```txt
vix-note-extension-1
```

The current implementation accepts missing response `protocol` for compatibility, but extension authors should include it.

## Output requirements

Use `stdout` and `stderr` for simple text output.

```json
{
  "ok": true,
  "stdout": "5
",
  "stderr": ""
}
```

Use `outputs` when the runtime needs MIME-aware values:

```json
{
  "ok": true,
  "outputs": [
    { "mime": "application/json", "data": "{"value": 5}" }
  ]
}
```

The supported MIME types are:

```txt
text/plain
application/json
text/html
image/svg+xml
```

External HTML and SVG are treated as untrusted by the UI. Do not rely on arbitrary HTML execution.

## Error requirements

For structured runtime errors, return `ok: false` with an error object.

```json
{
  "protocol": "vix-note-extension-1",
  "ok": false,
  "error": {
    "code": "python_runtime_error",
    "message": "NameError: value is not defined",
    "details": ""
  }
}
```

The `message` should be useful on its own. The UI and kernel may surface it directly to the user.

## Process behavior

A runtime should be deterministic for one request. It should not wait for interactive input after stdin is closed. It should exit with code `0` after writing a valid response.

If the process exits with a non-zero code, Vix Note treats the execution as a process failure and attaches captured stderr. If stdout is not valid JSON, Vix Note reports an invalid JSON error. If execution exceeds the configured timeout or output size limit, Vix Note terminates the process and returns a diagnostic.

## Diagnostics

Use stderr for logs that help diagnose the runtime itself. Use JSON `error` for the notebook-facing failure. This keeps runtime logs available without forcing every internal log line to become a notebook diagnostic.

A broken extension should fail clearly. For example, if a helper script is missing, return a message that names the missing file and suggests reinstalling the package.
