# vix agent

`vix agent` runs the Vix AI agent from the command line. It gives a project a local-first assistant that can answer a prompt, analyze a workspace, or scan the files that would be visible to the agent runtime.

The command is built on the same agent module used from C++. It uses a configured model provider, opens a workspace, applies the agent permissions, and returns a response with normal Vix CLI output. The default workflow is local and uses Ollama, so the command is useful for inspecting a project without sending the workspace to a remote model service.

## Usage

```bash
vix agent ask <prompt> [options]
vix agent analyze [workspace] [prompt] [options]
vix agent scan [workspace] [options]
```

Use `ask` for a normal prompt, `analyze` when the agent should reason about a project directory, and `scan` when you only want to see what the agent can collect from the workspace before a model request is made.

## Local setup

The default provider is Ollama. Start Ollama before running the command:

```bash
ollama serve
```

In another terminal, pull a model:

```bash
ollama pull llama3
```

For smaller machines, a lighter model can be more practical:

```bash
ollama pull qwen2.5-coder:1.5b
```

Then run the agent command with that model:

```bash
vix agent ask "Explain Vix.cpp" --model qwen2.5-coder:1.5b --timeout 120000
```

## Ask a question

`ask` sends a normal prompt to the agent.

```bash
vix agent ask "Explain Vix.cpp in simple words"
```

This mode is useful for direct questions that do not need a full project analysis. The command still uses the agent configuration, provider, timeout, cache, and memory settings.

A prompt can contain several words without extra quoting rules beyond normal shell quoting:

```bash
vix agent ask "Explain what local-first software means"
```

When the prompt itself starts with a dash, use `--` before the prompt so the parser treats the rest as positional text:

```bash
vix agent ask -- "--version is a command-line flag. Explain this idea."
```

## Analyze a workspace

`analyze` asks the agent to inspect and explain a workspace.

```bash
vix agent analyze .
```

If no prompt is provided, Vix uses a default analysis instruction:

```text
Analyze this project and explain the most important parts.
```

A custom prompt can be passed after the workspace:

```bash
vix agent analyze . "Explain the module layout and the build flow"
```

The analysis mode adds project-oriented context to the request. It asks the agent to focus on real repository structure, modules, folders, build system, CLI commands, runtime components, and how the pieces fit together.

## Scan a workspace

`scan` opens the workspace and applies the agent file scan policy without asking the model to generate an answer.

```bash
vix agent scan .
```

Use this command when you want to verify what the agent can see before running `analyze`. The scan output shows the workspace, the number of accepted files, how many entries were skipped, whether the result was truncated, and the accepted file list.

Scan another project directory:

```bash
vix agent scan ./examples/demo
```

This is a good first diagnostic when an analysis result feels incomplete. It helps confirm that the command is using the workspace you intended.

## Workspace

The workspace is the directory the agent uses as its local boundary. By default, it is the current directory:

```bash
vix agent analyze .
```

You can also pass it with `--workspace` or `-w`:

```bash
vix agent ask "Explain this project" --workspace .
vix agent ask "Explain this project" -w .
```

For `analyze` and `scan`, the workspace can also be the first positional argument:

```bash
vix agent analyze ./apps/api
vix agent scan ./apps/api
```

Use an explicit workspace path when the command may be launched from a directory that is not the project root.

## Provider, model, and endpoint

The command loads agent configuration from the environment first, then applies command-line options on top of it.

Select the provider:

```bash
vix agent ask "Explain this project" --provider ollama
```

Select the model:

```bash
vix agent ask "Explain this project" --model llama3
```

Use a lighter model:

```bash
vix agent ask "Explain this project" --model qwen2.5-coder:1.5b
```

Set the provider endpoint:

```bash
vix agent ask "Explain this project" --model-url http://127.0.0.1:11434
```

For Ollama, the endpoint should include the scheme:

```text
http://127.0.0.1:11434
```

## Timeout

Local models can be slow on the first request, especially when the model is loaded into memory. Use `--timeout` to give the model more time.

```bash
vix agent ask "Explain Vix.cpp" --timeout 120000
```

The value is in milliseconds. For a slower CPU-only model, a larger value can be useful:

```bash
vix agent analyze . --model qwen2.5-coder:1.5b --timeout 300000
```

## File reading

Workspace file reading is enabled by default for the command.

Disable file reading for one run:

```bash
vix agent analyze . --no-file-read
```

This is useful when you want the model to answer from the prompt and general context only. For project analysis, file reading is usually useful because the agent needs repository context to produce a grounded answer.

## Command execution

Command execution is disabled by default. Enable it only when the task needs safe local command output.

```bash
vix agent ask "Run vix tests if useful" --allow-process
```

When process execution is allowed, the command configures a small allowed program list for the agent runtime:

```text
vix
cmake
ninja
git
ls
cat
echo
```

The command still runs through the controlled `command.run` tool. The working directory must stay inside the workspace, and dangerous commands remain blocked by the runtime.

Use this capability carefully. A normal explanation or project summary usually does not need process execution.

## Cache

Cache is enabled by default.

Disable cache for one run:

```bash
vix agent ask "Explain this project" --no-cache
```

This is useful when testing prompts, checking provider behavior, or debugging tool usage. A cache hit means the answer was reused from local cache, so disabling cache forces a fresh provider request.

## Run history and memory

Run history and memory persistence are enabled by default.

Disable them for one run:

```bash
vix agent ask "Explain this project" --no-memory
```

When persistence is enabled, the agent can write local run data under the workspace agent directories, such as:

```text
.vix/agent/runs/<run_id>/
```

This makes local debugging easier because a run can be inspected after the command finishes.

## Environment configuration

`vix agent` uses the same environment configuration as the C++ agent runtime.

Common variables include:

```text
VIX_AGENT_PROVIDER
VIX_AGENT_MODEL
VIX_AGENT_MODEL_URL
VIX_AGENT_TIMEOUT_MS
VIX_AGENT_ALLOW_PROCESS
VIX_AGENT_ALLOW_FILE_READ
VIX_AGENT_ALLOW_FILE_WRITE
VIX_AGENT_USE_CACHE
VIX_AGENT_PERSIST_MEMORY
```

Example:

```bash
export VIX_AGENT_PROVIDER=ollama
export VIX_AGENT_MODEL=llama3
export VIX_AGENT_MODEL_URL=http://127.0.0.1:11434
export VIX_AGENT_TIMEOUT_MS=120000
```

Then run:

```bash
vix agent ask "Explain local-first software"
```

Command-line options override the loaded environment values for the current run.

## Output behavior

`vix agent` prints a task-style header with the provider, model, timeout, workspace, and endpoint when available. During execution, it shows whether the task completed or failed.

A successful request prints the model response. When metadata is available, it can also show details such as the run id, cache status, and tool count.

A failed request prints the agent error. If the provider is Ollama, the command can also show hints for common local model problems, such as increasing the timeout or trying a lighter model.

## Options

| Option                   | Description                                                   |
| ------------------------ | ------------------------------------------------------------- |
| `-w, --workspace <path>` | Workspace directory.                                          |
| `--provider <name>`      | Model provider. Defaults to `VIX_AGENT_PROVIDER` or `ollama`. |
| `--model <name>`         | Model name. Defaults to `VIX_AGENT_MODEL` or `llama3`.        |
| `--model-url <url>`      | Model endpoint. Defaults to `VIX_AGENT_MODEL_URL`.            |
| `--timeout <ms>`         | Model request timeout in milliseconds.                        |
| `--allow-process`        | Allows the controlled `command.run` tool.                     |
| `--no-file-read`         | Disables workspace file reading.                              |
| `--no-cache`             | Disables local cache for the run.                             |
| `--no-memory`            | Disables run history and memory persistence.                  |
| `-h, --help`             | Shows command help.                                           |

## Examples

Ask a simple question:

```bash
vix agent ask "Explain Vix.cpp in simple words"
```

Ask with a longer timeout:

```bash
vix agent ask "Explain Vix.cpp" --timeout 120000
```

Use a lighter local model:

```bash
vix agent ask "Explain this code" --model qwen2.5-coder:1.5b --timeout 120000
```

Analyze the current project:

```bash
vix agent analyze .
```

Analyze another workspace:

```bash
vix agent analyze ./apps/api
```

Analyze with a custom prompt:

```bash
vix agent analyze . "Explain the build system and the main modules"
```

Scan the current workspace:

```bash
vix agent scan .
```

Scan another workspace:

```bash
vix agent scan ./examples/demo
```

Run with cache disabled:

```bash
vix agent analyze . --no-cache
```

Run without file reading:

```bash
vix agent analyze . --no-file-read
```

Allow safe command execution:

```bash
vix agent ask "Run vix tests if useful" --allow-process
```

## Troubleshooting

### Ollama is not available

Start Ollama:

```bash
ollama serve
```

Make sure the selected model exists locally:

```bash
ollama pull llama3
```

Then run the command again.

### The model is slow

Increase the timeout:

```bash
vix agent ask "Explain Vix.cpp" --timeout 300000
```

Use a lighter model when testing on a smaller machine:

```bash
ollama pull qwen2.5-coder:1.5b
vix agent ask "Explain Vix.cpp" --model qwen2.5-coder:1.5b --timeout 120000
```

### The analysis does not see the expected files

Run a scan first:

```bash
vix agent scan .
```

If the scan is using the wrong directory, pass the workspace explicitly:

```bash
vix agent scan ./apps/api
vix agent analyze ./apps/api
```

### The answer looks reused

Disable cache for the run:

```bash
vix agent analyze . --no-cache
```

This forces the command to ask the provider again instead of reusing a cached response.

### The model should not read files

Disable file reading:

```bash
vix agent analyze . --no-file-read
```

This keeps the request closer to a prompt-only answer.

### A command was not executed

Command execution is disabled unless `--allow-process` is present.

```bash
vix agent ask "Run vix tests if useful" --allow-process
```

Even with this flag, the command must still be allowed by the runtime and must run inside the workspace.

## Next step

Use `vix agent scan` first to understand the workspace view, then use `vix agent analyze` when you want the model to explain the project with local context.
