# API Reference

This page is a compact reference for the main public types in the `agent` module. It is meant for lookup after the main concepts are already clear.

The stable runtime surface is centered on:

```cpp
Agent::run(const AgentRequest &request)
```

An agent run is configured through `AgentConfig`, described through `AgentRequest`, executed by `Agent`, and returned as an `AgentResponse`.

## Header

Use the public Vix AI aggregator in normal application code:

```cpp
#include <vix/ai.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

For lower-level runtime code, direct agent headers can also be used:

```cpp
#include <vix/ai/agent/AgentRuntime.hpp>
```

## Namespace

The lower-level agent runtime lives in:

```cpp
namespace vix::ai::agent
```

Most runtime types on this page are under that namespace.

## Agent

`Agent` is the main runtime object. It receives an `AgentRequest`, prepares the run, calls the configured provider, executes allowed tools when needed, and returns an `AgentResponse`.

```cpp
vix::ai::agent::Agent agent(config);

auto result = agent.run(request);
```

### Constructors

```cpp
Agent(const AgentConfig &config);
```

Creates an agent from a configuration. When the provider is `ollama`, the runtime can create the default Ollama provider from the configuration.

```cpp
Agent(
    const AgentConfig &config,
    std::shared_ptr<ModelProvider> provider);
```

Creates an agent with an injected provider. This is useful for tests, custom providers, and advanced integrations.

### Main operation

```cpp
AgentResult<AgentResponse> run(const AgentRequest &request);
```

Runs one agent request.

Example:

```cpp
auto result = agent.run(request);

if (!result)
{
  vix::print("Agent error:", result.error().message());
  return 1;
}

vix::print(result.value().text);
```

### Tools

```cpp
ToolRegistry &tools();
```

Returns the tool registry used by the agent. Advanced code can use this to register custom tools.

```cpp
auto err = agent.tools().add(std::make_shared<MyTool>());

if (err)
{
  vix::print("Tool error:", err.message());
}
```

## AgentConfig

`AgentConfig` controls the runtime policy of an agent instance.

```cpp
vix::ai::agent::AgentConfig config;
```

### Provider fields

| Field       | Type          | Purpose                                                         |
| ----------- | ------------- | --------------------------------------------------------------- |
| `provider`  | `std::string` | Provider name, usually `ollama`.                                |
| `model`     | `std::string` | Model name passed to the provider.                              |
| `model_url` | `std::string` | Provider endpoint, usually `http://127.0.0.1:11434` for Ollama. |

Example:

```cpp
config.provider = "ollama";
config.model = "llama3";
config.model_url = "http://127.0.0.1:11434";
```

### Timeout fields

| Field             | Type    | Purpose                                 |
| ----------------- | ------- | --------------------------------------- |
| `timeout_ms`      | integer | Model request timeout in milliseconds.  |
| `tool_timeout_ms` | integer | Tool execution timeout in milliseconds. |

Example:

```cpp
config.timeout_ms = 120'000;
config.tool_timeout_ms = 30'000;
```

### Workspace and context limits

| Field               | Type    | Purpose                                              |
| ------------------- | ------- | ---------------------------------------------------- |
| `max_files`         | integer | Maximum number of files collected by a project scan. |
| `max_file_size`     | integer | Maximum file size accepted for agent context.        |
| `max_context_chars` | integer | Maximum prepared context size.                       |
| `max_tool_output`   | integer | Maximum output returned by a tool.                   |
| `max_tool_rounds`   | integer | Maximum number of model/tool loop rounds.            |

Example:

```cpp
config.max_files = 2'000;
config.max_file_size = 512 * 1024;
config.max_context_chars = 120'000;
config.max_tool_output = 20'000;
config.max_tool_rounds = 3;
```

### Permission fields

| Field              | Type            | Purpose                                                     |
| ------------------ | --------------- | ----------------------------------------------------------- |
| `allow_file_read`  | `bool`          | Allows the runtime to read safe files inside the workspace. |
| `allow_process`    | `bool`          | Allows controlled command execution.                        |
| `allow_file_write` | `bool`          | Reserved for file-writing capability. Disabled by default.  |
| `allowed_programs` | list of strings | Programs allowed by `command.run`.                          |

Example:

```cpp
config.allow_file_read = true;
config.allow_process = false;
config.allow_file_write = false;
```

Command execution requires an allowlist:

```cpp
config.allow_process = true;

config.allowed_programs = {
    "vix",
    "cmake",
    "ninja",
    "git",
    "echo"
};
```

### Cache and persistence fields

| Field            | Type    | Purpose                                                       |
| ---------------- | ------- | ------------------------------------------------------------- |
| `use_cache`      | `bool`  | Enables local response cache when the request also allows it. |
| `cache_ttl_ms`   | integer | Cache time-to-live in milliseconds.                           |
| `persist_memory` | `bool`  | Enables local run history and memory persistence.             |
| `offline`        | `bool`  | Describes the local-first runtime policy.                     |

Example:

```cpp
config.use_cache = true;
config.cache_ttl_ms = 5 * 60 * 1000;
config.persist_memory = true;
config.offline = true;
```

## AgentConfigLoader

`AgentConfigLoader` builds an `AgentConfig` from environment variables.

```cpp
auto config = vix::ai::agent::AgentConfigLoader::from_environment();
```

The default prefix is:

```text
VIX_AGENT_
```

Common variables:

```text
VIX_AGENT_PROVIDER
VIX_AGENT_MODEL
VIX_AGENT_MODEL_URL
VIX_AGENT_MEMORY_DIR
VIX_AGENT_CACHE_DIR
VIX_AGENT_RUNS_DIR
VIX_AGENT_LOGS_DIR
VIX_AGENT_TIMEOUT_MS
VIX_AGENT_MAX_FILES
VIX_AGENT_MAX_FILE_SIZE
VIX_AGENT_MAX_TOOL_OUTPUT
VIX_AGENT_MAX_CONTEXT_CHARS
VIX_AGENT_OFFLINE
VIX_AGENT_ALLOW_PROCESS
VIX_AGENT_ALLOW_FILE_READ
VIX_AGENT_ALLOW_FILE_WRITE
VIX_AGENT_USE_CACHE
VIX_AGENT_PERSIST_MEMORY
```

Example:

```cpp
auto config = vix::ai::agent::AgentConfigLoader::from_environment();

config.model = "qwen2.5-coder:1.5b";
config.timeout_ms = 120'000;
```

## AgentConfigValidator

`AgentConfigValidator` validates an agent configuration before a run.

```cpp
auto err = vix::ai::agent::AgentConfigValidator::validate(config);

if (err)
{
  vix::print("Invalid config:", err.message());
  return 1;
}
```

Validation is useful when configuration is loaded from the environment, command-line flags, or project files.

## AgentRequest

`AgentRequest` describes one agent run.

```cpp
vix::ai::agent::AgentRequest request;
```

### Main fields

| Field            | Type               | Purpose                                             |
| ---------------- | ------------------ | --------------------------------------------------- |
| `workspace`      | `std::string`      | Workspace directory for the run.                    |
| `input`          | `std::string`      | Main user prompt or instruction.                    |
| `context`        | `std::string`      | Optional extra context supplied by the application. |
| `mode`           | `AgentRequestMode` | High-level request mode.                            |
| `model_override` | `std::string`      | Optional model override for one request.            |
| `timeout_ms`     | integer            | Optional request timeout.                           |

Example:

```cpp
request.workspace = ".";
request.input = "Explain this project in simple words.";
request.mode = vix::ai::agent::AgentRequestMode::Analyze;
request.timeout_ms = 120'000;
```

### Permission fields

| Field              | Type   | Purpose                                        |
| ------------------ | ------ | ---------------------------------------------- |
| `allow_tools`      | `bool` | Allows the model/tool loop for this request.   |
| `allow_file_read`  | `bool` | Allows file-reading tools for this request.    |
| `allow_process`    | `bool` | Allows command execution for this request.     |
| `allow_file_write` | `bool` | Allows file-writing capability when supported. |
| `use_cache`        | `bool` | Allows cache for this request.                 |

Example:

```cpp
request.allow_tools = true;
request.allow_file_read = true;
request.allow_process = false;
request.allow_file_write = false;
request.use_cache = true;
```

The request can restrict the configuration for one run. It should not be used to bypass a capability disabled in `AgentConfig`.

## AgentRequestMode

`AgentRequestMode` gives the request a high-level purpose.

```cpp
request.mode = vix::ai::agent::AgentRequestMode::Run;
request.mode = vix::ai::agent::AgentRequestMode::Analyze;
request.mode = vix::ai::agent::AgentRequestMode::Explain;
request.mode = vix::ai::agent::AgentRequestMode::Chat;
```

| Mode      | Purpose                                    |
| --------- | ------------------------------------------ |
| `Run`     | General agent task.                        |
| `Analyze` | Analyze a workspace or project.            |
| `Explain` | Explain a concept, file, API, or behavior. |
| `Chat`    | Normal prompt without project analysis.    |

## AgentResponse

`AgentResponse` is returned by `Agent::run`.

```cpp
const auto &response = result.value();
```

### Fields

| Field         | Type          | Purpose                               |
| ------------- | ------------- | ------------------------------------- |
| `text`        | `std::string` | Final response text.                  |
| `run_id`      | `std::string` | Local run identifier.                 |
| `provider`    | `std::string` | Provider that produced the response.  |
| `model`       | `std::string` | Model used for the response.          |
| `from_cache`  | `bool`        | Whether the response came from cache. |
| `duration_ms` | integer       | Run duration in milliseconds.         |
| `tools`       | list          | Tool summaries from the run.          |

Example:

```cpp
vix::print(response.text);
vix::print("Run id:", response.run_id);
vix::print("Provider:", response.provider);
vix::print("Model:", response.model);
vix::print("From cache:", response.from_cache);
vix::print("Duration:", response.duration_ms, "ms");
```

Tool summaries:

```cpp
vix::print("Tools used:", response.tools.size());

for (const auto &tool : response.tools)
{
  vix::print("-", tool.name, tool.ok ? "ok" : "failed");
}
```

## AgentResult

Agent operations return `AgentResult<T>`.

```cpp
auto result = agent.run(request);
```

Always check the result before reading the value.

```cpp
if (!result)
{
  vix::print("Agent error:", result.error().message());
  return 1;
}

vix::print(result.value().text);
```

`AgentResult<T>` follows the Vix result style and carries structured errors instead of forcing failures into response text.

## AgentWorkspace

`AgentWorkspace` represents the local boundary of a run.

```cpp
auto workspace = vix::ai::agent::AgentWorkspace::open(".", config);

if (!workspace)
{
  vix::print("Workspace error:", workspace.error().message());
  return 1;
}
```

The workspace is used for path resolution, project scanning, file tools, command working directories, cache, run history, and local agent data.

Default local directories:

```text
.vix/agent/memory
.vix/agent/cache
.vix/agent/runs
.vix/agent/logs
```

## FileScanPolicy

`FileScanPolicy` decides which files are useful and safe for agent context.

```cpp
vix::ai::agent::FileScanPolicy policy(config);
```

It applies file limits, filters common generated directories, and rejects unsupported or unsafe files.

Common ignored paths include:

```text
.git
.vix
.cache
.idea
.vscode
build
build-ninja
cmake-build-debug
cmake-build-release
node_modules
vendor
dist
out
target
__pycache__
```

## ProjectScanner

`ProjectScanner` scans a workspace using a `FileScanPolicy`.

```cpp
vix::ai::agent::ProjectScanner scanner(workspace.value(), policy);

auto scan = scanner.scan();
```

Example:

```cpp
if (!scan)
{
  vix::print("Scan error:", scan.error().message());
  return 1;
}

vix::print("Workspace:", scan.value().root);
vix::print("Files:", scan.value().files.size());
vix::print("Skipped:", scan.value().skipped);
vix::print("Truncated:", scan.value().truncated ? "yes" : "no");
```

## FileReader

`FileReader` reads safe text files from a workspace.

```cpp
vix::ai::agent::FileReader reader(workspace.value(), policy);
```

It is used by the `file.read` tool. Paths are resolved through the workspace and checked by policy before content is returned.

## ModelProvider

`ModelProvider` is the interface for model backends.

```cpp
class MyProvider final : public vix::ai::agent::ModelProvider
{
public:
  [[nodiscard]] std::string_view name() const noexcept override;
  [[nodiscard]] bool local() const noexcept override;

  [[nodiscard]] vix::ai::agent::AgentResult<bool>
  available() const override;

  [[nodiscard]] vix::ai::agent::AgentResult<vix::ai::agent::ModelResponse>
  generate(const vix::ai::agent::ModelRequest &request) override;
};
```

Providers should generate model responses. They should not execute local tools directly.

## ModelRequest

`ModelRequest` is sent from the agent runtime to a provider.

Important fields include:

| Field           | Purpose                    |
| --------------- | -------------------------- |
| `model`         | Model name.                |
| `prompt`        | Prepared prompt text.      |
| `system_prompt` | Optional system prompt.    |
| `messages`      | Optional message list.     |
| `max_tokens`    | Optional generation limit. |
| `timeout_ms`    | Request timeout.           |
| `stream`        | Stream preference.         |
| `options`       | Provider-specific options. |

Simple provider usage:

```cpp
vix::ai::agent::ModelResponse response;

response.text = "Generated response.";
response.model = request.model;
response.provider = "my-provider";
response.status = vix::ai::agent::ModelResponseStatus::Completed;
```

## ModelResponse

`ModelResponse` is returned by a provider.

Important fields include:

| Field         | Purpose                                    |
| ------------- | ------------------------------------------ |
| `text`        | Generated text.                            |
| `model`       | Model name.                                |
| `provider`    | Provider name.                             |
| `status`      | Response status.                           |
| `error`       | Provider error text when applicable.       |
| `duration_ms` | Provider duration.                         |
| `usage`       | Token or usage information when available. |
| `tool_calls`  | Tool calls requested by the model.         |
| `raw`         | Raw provider data when useful.             |

A successful response should set:

```cpp
response.text = "Hello from provider.";
response.model = request.model;
response.provider = "my-provider";
response.status = vix::ai::agent::ModelResponseStatus::Completed;
```

## ModelResponseStatus

`ModelResponseStatus` describes the provider response state.

Common successful status:

```cpp
response.status = vix::ai::agent::ModelResponseStatus::Completed;
```

A provider should not return a successful-looking response when generation failed. Provider failures should be returned through `AgentResult`.

## OllamaProvider

`OllamaProvider` is the default local model provider.

```cpp
vix::ai::agent::AgentConfig config;

config.provider = "ollama";
config.model = "llama3";
config.model_url = "http://127.0.0.1:11434";

auto provider =
    std::make_shared<vix::ai::agent::OllamaProvider>(config);
```

Check availability:

```cpp
auto available = provider->available();

if (!available || !available.value())
{
  vix::print("Ollama is not available.");
  vix::print("Start it with: ollama serve");
  return 1;
}
```

The provider sends requests to:

```text
POST /api/generate
```

## Tool

`Tool` is the interface for runtime tools.

```cpp
class MyTool final : public vix::ai::agent::Tool
{
public:
  [[nodiscard]] std::string_view name() const noexcept override;
  [[nodiscard]] std::string_view description() const noexcept override;

  [[nodiscard]] vix::ai::agent::AgentResult<vix::ai::agent::ToolResult>
  run(const vix::ai::agent::ToolCall &call) override;
};
```

Tools should be small, explicit, and tied to the permissions of the application that registers them.

## ToolRegistry

`ToolRegistry` stores tools by name.

```cpp
auto err = agent.tools().add(std::make_shared<MyTool>());

if (err)
{
  vix::print("Tool error:", err.message());
}
```

The agent uses the registry when a provider response contains tool calls.

## ToolCall

`ToolCall` represents one requested tool operation.

Important fields include:

| Field       | Purpose                            |
| ----------- | ---------------------------------- |
| `id`        | Tool call identifier.              |
| `name`      | Tool name.                         |
| `reason`    | Optional reason for the call.      |
| `arguments` | JSON arguments passed to the tool. |

Example:

```cpp
vix::ai::agent::ToolCall call;

call.id = "tool_echo_1";
call.name = "command.run";
call.reason = "Run a safe command.";
```

With arguments:

```cpp
call.arguments = vix::json::Json::object();
call.arguments["program"] = "echo";
call.arguments["args"] = vix::json::Json::array();
call.arguments["args"].push_back("hello");
call.arguments["working_directory"] = ".";
```

## ToolResult

`ToolResult` represents the result of a tool call.

Important fields include:

| Field         | Purpose                     |
| ------------- | --------------------------- |
| `id`          | Tool call id.               |
| `name`        | Tool name.                  |
| `ok`          | Whether the tool succeeded. |
| `output`      | Tool output.                |
| `error`       | Tool error message.         |
| `duration_ms` | Tool duration.              |
| `data`        | Optional structured data.   |

A tool can return success:

```cpp
return vix::ai::agent::ToolResult::success(
    call.id,
    "test.echo",
    "echo");
```

Or failure:

```cpp
return vix::ai::agent::ToolResult::failure(
    call.id,
    "test.echo",
    "tool failed");
```

## FileReadTool

`FileReadTool` implements:

```text
file.read
```

Expected arguments:

```json
{
  "path": "src/main.cpp"
}
```

It reads a safe text file inside the workspace. The path is resolved through `AgentWorkspace` and checked by `FileScanPolicy`.

## CommandTool

`CommandTool` implements:

```text
command.run
```

Expected arguments:

```json
{
  "program": "vix",
  "args": ["build"],
  "working_directory": "."
}
```

Command execution requires:

```cpp
config.allow_process = true;
request.allow_process = true;
request.allow_tools = true;
```

It also requires the program to be present in `config.allowed_programs`.

```cpp
config.allowed_programs = {
    "vix",
    "cmake",
    "ninja",
    "git",
    "echo"
};
```

The working directory must stay inside the workspace.

## AgentRunStore

`AgentRunStore` writes local run history under the workspace.

Default run directory:

```text
.vix/agent/runs/<run_id>/
```

A run may include:

```text
run.json
prompt.txt
model_response.json
tools.json
response.json
response.txt
error.json
```

Most applications do not need to call `AgentRunStore` directly. It is used by the runtime when persistence is enabled.

```cpp
config.persist_memory = true;
```

## AgentRunTimer

`AgentRunTimer` measures run duration and timestamps for agent execution. It is used internally by the runtime and run history.

Most applications read timing through `AgentResponse`:

```cpp
vix::print("Duration:", response.duration_ms, "ms");
```

## AgentId

`AgentId` creates identifiers used by agent runs and tool calls.

Common ids include:

```text
run id
tool call id
operation id
```

Most applications use the returned `response.run_id` rather than creating ids manually.

## AgentFingerprint

`AgentFingerprint` creates hashes used for cache keys and fingerprints.

Common uses include:

```text
file fingerprint
prompt fingerprint
model response cache key
tool cache key
```

This is part of the cache and run-history infrastructure. Applications usually do not need it unless they are extending the runtime.

## Error names

Agent-specific error names include:

```text
empty_input
invalid_workspace
path_outside_workspace
model_unavailable
model_request_failed
model_response_invalid
tool_not_found
tool_not_allowed
tool_failed
tool_timeout
memory_unavailable
memory_write_failed
memory_read_failed
config_invalid
internal_failure
```

Always read the error message from the result:

```cpp
if (!result)
{
  vix::print("Agent error:", result.error().message());
  return 1;
}
```

## Complete example

The following example shows the core public runtime workflow.

```cpp
#include <vix/ai.hpp>
#include <vix/print.hpp>

int main()
{
  vix::ai::agent::AgentConfig config;

  config.provider = "ollama";
  config.model = "llama3";
  config.model_url = "http://127.0.0.1:11434";

  config.timeout_ms = 120'000;

  config.allow_file_read = true;
  config.allow_process = false;
  config.allow_file_write = false;

  config.use_cache = true;
  config.persist_memory = true;

  auto err = vix::ai::agent::AgentConfigValidator::validate(config);

  if (err)
  {
    vix::print("Invalid config:", err.message());
    return 1;
  }

  vix::ai::agent::Agent agent(config);

  vix::ai::agent::AgentRequest request;

  request.workspace = ".";
  request.input = "Explain the structure of this project.";
  request.mode = vix::ai::agent::AgentRequestMode::Analyze;

  request.allow_tools = true;
  request.allow_file_read = true;
  request.allow_process = false;
  request.allow_file_write = false;
  request.use_cache = true;
  request.timeout_ms = config.timeout_ms;

  auto result = agent.run(request);

  if (!result)
  {
    vix::print("Agent error:", result.error().message());
    return 1;
  }

  const auto &response = result.value();

  vix::print(response.text);
  vix::print();
  vix::print("Run id:", response.run_id);
  vix::print("Provider:", response.provider);
  vix::print("Model:", response.model);
  vix::print("From cache:", response.from_cache);
  vix::print("Duration:", response.duration_ms, "ms");

  return 0;
}
```

## Next step

Use this page as a lookup reference while reading the more detailed pages for configuration, workspace, model providers, tools, cache, errors, and CMake integration.
