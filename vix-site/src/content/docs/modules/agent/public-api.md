# Public API

The public API of the `agent` module is intentionally small. The stable entry point is the agent runtime call that receives an explicit request and returns an explicit response:

```cpp
Agent::run(const AgentRequest &request)
```

This shape is important because an agent run is not only a model prompt. A run also depends on a workspace, a model provider, permissions, request mode, cache behavior, and optional tools. Keeping those decisions inside `AgentConfig` and `AgentRequest` makes the runtime easier to understand and safer to use from C++.

For normal Vix code, include the public AI aggregator:

```cpp
#include <vix/ai.hpp>
```

The aggregator exposes the AI module through the Vix public header layout. Direct runtime headers are still available for advanced code, examples, tests, and integrations that want to include only the agent runtime surface.

## Main types

The core public workflow uses four main types:

| Type                            | Purpose                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| `vix::ai::agent::AgentConfig`   | Configures the provider, model, workspace limits, permissions, cache, and local run behavior. |
| `vix::ai::agent::Agent`         | Runs agent requests using the configured runtime.                                             |
| `vix::ai::agent::AgentRequest`  | Describes one prompt, workspace, mode, permission set, and cache preference.                  |
| `vix::ai::agent::AgentResponse` | Contains the final text, run metadata, model information, cache status, and tool summaries.   |

The public API follows the same pattern as many Vix modules: configure the runtime, create a request, call the operation, check the result, then use the returned value.

## Header

Use the public aggregator in normal application code:

```cpp
#include <vix/ai.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

A complete program usually starts like this:

```cpp
#include <vix/ai.hpp>
#include <vix/print.hpp>
```

The direct runtime header can be used when a file only needs the agent runtime types:

```cpp
#include <vix/ai/agent/AgentRuntime.hpp>
```

The documentation uses `<vix/ai.hpp>` for public examples and keeps `AgentRuntime.hpp` for lower-level pages where the runtime internals are the main topic.

## AgentConfig

`AgentConfig` controls the runtime. It defines the provider, the model, the local endpoint, the workspace limits, and the permissions that the agent can use.

```cpp
vix::ai::agent::AgentConfig config;

config.provider = "ollama";
config.model = "llama3";
config.model_url = "http://127.0.0.1:11434";

config.allow_file_read = true;
config.allow_process = false;
config.allow_file_write = false;

config.use_cache = true;
config.persist_memory = true;
```

The configuration is the global permission boundary for the agent instance. A request can restrict these permissions further, but it should not be treated as a way to bypass the configuration. For example, if `config.allow_process` is `false`, a request should not be able to turn process execution into an available capability.

## Agent

`Agent` owns the runtime behavior for one configured agent instance. It validates the configuration, opens the workspace for a request, prepares model context, optionally runs controlled tools, and returns an `AgentResponse`.

```cpp
vix::ai::agent::Agent agent(config);
```

The stable call is:

```cpp
auto result = agent.run(request);
```

The return type is an agent result. Always check it before reading the response.

```cpp
auto result = agent.run(request);

if (!result)
{
  vix::print("Agent error:", result.error().message());
  return 1;
}

vix::print(result.value().text);
```

This style keeps errors in the normal Vix result flow instead of forcing every agent failure into exceptions or raw strings.

## AgentRequest

`AgentRequest` represents one user request. It contains the prompt, the workspace, the request mode, permission flags, and cache preference.

```cpp
vix::ai::agent::AgentRequest request;

request.workspace = ".";
request.input = "Explain this project in simple words.";
request.mode = vix::ai::agent::AgentRequestMode::Analyze;

request.allow_tools = true;
request.allow_file_read = true;
request.allow_process = false;
request.allow_file_write = false;
request.use_cache = true;
```

The request is where a program describes what it wants the agent to do for this specific run. The configuration describes what the agent is allowed to do in general, while the request describes what is allowed for this operation.

## AgentRequestMode

`AgentRequestMode` gives the request a high-level purpose. It does not replace the prompt, but it gives the runtime and model context a clearer direction.

```cpp
request.mode = vix::ai::agent::AgentRequestMode::Run;
request.mode = vix::ai::agent::AgentRequestMode::Analyze;
request.mode = vix::ai::agent::AgentRequestMode::Explain;
request.mode = vix::ai::agent::AgentRequestMode::Chat;
```

Use `Chat` for a normal question, `Analyze` when the request should reason about a workspace, `Explain` when the user wants an explanation, and `Run` for a general agent task.

## AgentResponse

`AgentResponse` contains the final text and metadata about the run.

```cpp
const auto &response = result.value();

vix::print(response.text);
vix::print("Run id:", response.run_id);
vix::print("Provider:", response.provider);
vix::print("Model:", response.model);
vix::print("From cache:", response.from_cache);
vix::print("Duration:", response.duration_ms, "ms");
```

When tools are used, the response also contains tool summaries. This allows a program to show what happened during the run without parsing the model text.

```cpp
vix::print("Tools used:", response.tools.size());

for (const auto &tool : response.tools)
{
  vix::print("-", tool.name, tool.ok ? "ok" : "failed");
}
```

## Complete example

This example uses the public Vix AI aggregator, configures Ollama, analyzes the current workspace, and prints the final response.

```cpp
#include <vix/ai.hpp>
#include <vix/print.hpp>

int main()
{
  vix::ai::agent::AgentConfig config;

  config.provider = "ollama";
  config.model = "llama3";
  config.model_url = "http://127.0.0.1:11434";

  config.allow_file_read = true;
  config.allow_process = false;
  config.allow_file_write = false;

  config.use_cache = true;
  config.persist_memory = true;

  vix::ai::agent::Agent agent(config);

  vix::ai::agent::AgentRequest request;

  request.workspace = ".";
  request.input = "Explain the most important files in this project.";
  request.mode = vix::ai::agent::AgentRequestMode::Analyze;

  request.allow_tools = true;
  request.allow_file_read = true;
  request.allow_process = false;
  request.allow_file_write = false;
  request.use_cache = true;

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

This is the main public workflow. It is explicit enough to show the important decisions, but still small enough to use in examples, tools, and local applications.

## Configuration validation

A configuration can be validated before creating or running an agent request.

```cpp
auto err = vix::ai::agent::AgentConfigValidator::validate(config);

if (err)
{
  vix::print("Invalid config:", err.message());
  return 1;
}
```

Validation is useful for command-line tools and applications that build configuration from environment variables, user input, or project files. It lets the program fail early with a clear error instead of discovering the problem during the model request.

## Environment configuration

`AgentConfigLoader` can create a configuration from environment variables.

```cpp
auto config = vix::ai::agent::AgentConfigLoader::from_environment();
```

This is useful for CLI tools and local developer workflows where the provider, model, endpoint, cache behavior, or permission defaults should be controlled outside the program.

A program can still override specific fields after loading the environment configuration:

```cpp
auto config = vix::ai::agent::AgentConfigLoader::from_environment();

config.model = "qwen2.5-coder:1.5b";
config.timeout_ms = 120'000;
config.allow_process = false;
```

## Result handling

Agent operations return `AgentResult<T>`, which follows the Vix result style. The caller checks whether the operation succeeded before using the value.

```cpp
auto result = agent.run(request);

if (!result)
{
  const auto &err = result.error();

  vix::print("error:", err.message());
  return 1;
}

vix::print(result.value().text);
```

This is especially important for agent code because failures can come from several places: invalid configuration, invalid workspace, unavailable model provider, model request failure, tool failure, cache problems, or local filesystem errors.

## Stable surface

The current stable surface is intentionally centered on:

```cpp
Agent::run(const AgentRequest &request)
```

Helpers such as `chat()`, `analyze()`, `explain()`, or `run_with_tools()` should not be treated as stable public APIs unless they are added explicitly later. Keeping the first stable surface small makes it easier to evolve the module without promising shortcuts too early.

## Next step

Continue with the configuration page to understand the fields that control providers, model settings, workspace limits, permissions, cache behavior, and local run persistence.
