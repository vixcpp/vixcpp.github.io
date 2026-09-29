# Extension Protocol

The external Note runtime protocol is JSON over stdin and stdout.

Vix Note starts the runtime process, writes one request JSON object to stdin, closes stdin, reads stdout, captures stderr separately, and expects one response JSON object. The implemented mode is `oneshot`.

## Request

A request has this shape:

```json
{
  "protocol": "vix-note-extension-1",
  "requestId": "document-id:cell-python",
  "cellId": "cell-python",
  "cellType": "python",
  "source": "print(2 + 3)",
  "executionCount": 0,
  "workingDirectory": "/project",
  "documentPath": "/project/lesson.vixnote",
  "extensionId": "softadastra/pyrelune",
  "extensionVersion": "0.1.1"
}
```

`protocol` identifies the protocol version. `requestId` is useful for logs. `cellId` and `cellType` identify the cell being executed. `source` is the exact cell source. `executionCount` is the current cell execution count before the new result is applied. `workingDirectory` is the project-aware working directory selected by Vix Note. `documentPath` is the current note path when available. `extensionId` and `extensionVersion` identify the package runtime being used.

The runtime should ignore fields it does not understand so the protocol can grow without breaking older runtimes.

## Successful response

The simplest successful response uses stdout:

```json
{
  "protocol": "vix-note-extension-1",
  "ok": true,
  "stdout": "5
",
  "stderr": ""
}
```

Vix Note converts `stdout` to a normal stdout output and `stderr` to a stderr output.

## MIME outputs

A runtime can return structured outputs:

```json
{
  "protocol": "vix-note-extension-1",
  "ok": true,
  "outputs": [
    {
      "mime": "text/plain",
      "data": "5
"
    },
    {
      "mime": "application/json",
      "data": "{"value":5}"
    }
  ]
}
```

Supported MIME types are:

```txt
text/plain
application/json
text/html
image/svg+xml
```

`text/plain` is rendered as text. `application/json` is displayed as structured text when the UI can parse it. External `text/html` and `image/svg+xml` are considered untrusted and should not be used as an automatic script or style injection mechanism.

## Error response

Use `ok: false` for language-level or runtime-level errors that were handled by the extension.

```json
{
  "protocol": "vix-note-extension-1",
  "ok": false,
  "error": {
    "code": "python_runtime_error",
    "message": "NameError: value is not defined",
    "details": "Traceback omitted"
  }
}
```

Vix Note reads `error.message` as the user-facing failure message. `code` and `details` are useful for future diagnostics and for tools that inspect raw outputs.

## Process failures

If the process exits non-zero, times out, emits too much output, or writes invalid JSON, Vix Note creates a failure result itself. In those cases the runtime response may not be available.

A runtime should therefore prefer returning a structured `ok: false` response for expected language errors and reserve non-zero process exits for broken runtime conditions.

## Compatibility notes

The current implementation is available on Unix-like platforms. The external process runner reports that it is not implemented on Windows yet.

The response `protocol` field is currently tolerated when absent, but extension authors should include it. If it is present and does not equal `vix-note-extension-1`, Vix Note rejects the response.
