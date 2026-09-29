# Quick Start

The `agent` module provides a local-first AI agent runtime for Vix applications. It can ask a model a question, analyze a workspace, read project context when file access is allowed, and return a structured response that a C++ program can handle normally.

This page shows the smallest useful workflow: configure a local model, create an agent request, run it, and print the result. The example uses the public Vix AI aggregator header:

```cpp
#include <vix/ai.hpp>
```

The lower-level types remain under `vix::ai::agent`, because the quick start uses the explicit runtime API. This makes the permissions, workspace, provider, and request mode visible from the beginning.

## Requirements

The default local provider is Ollama. Start Ollama before running the example:

```bash
ollama serve
```

In another terminal, make sure a local model is available:

```bash
ollama pull llama3
```

On smaller machines, a lighter model can be easier to use during local testing:

```bash
ollama pull qwen2.5-coder:1.5b
```

## Create a first agent program

Create a file named `main.cpp`:

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
  request.input = "Explain this project in simple words.";
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

  vix::print(result.value().text);

  return 0;
}
```

This program uses Ollama as the model provider, treats the current directory as the workspace, and allows the agent to read safe project files. Process execution and file writing stay disabled. That is a good default for a first run because the agent can inspect project context without being allowed to execute commands or modify files.

## Run the example

From a Vix project, run the file with `vix run`:

```bash
vix run main.cpp
```

The first request can take more time if Ollama needs to load the model. If the model is slow on CPU, use a smaller model or increase the request timeout.

## Use a smaller local model

To use a lighter model, change the model name in the configuration:

```cpp
config.model = "qwen2.5-coder:1.5b";
```

A longer timeout can also help during local testing:

```cpp
config.timeout_ms = 120'000;
```

The full configuration then looks like this:

```cpp
vix::ai::agent::AgentConfig config;

config.provider = "ollama";
config.model = "qwen2.5-coder:1.5b";
config.model_url = "http://127.0.0.1:11434";

config.timeout_ms = 120'000;

config.allow_file_read = true;
config.allow_process = false;
config.allow_file_write = false;

config.use_cache = true;
config.persist_memory = true;
```

## Run a simple chat request

Use `Chat` mode when the request is a normal question and does not need project analysis.

```cpp
request.workspace = ".";
request.input = "Explain what local-first software means.";
request.mode = vix::ai::agent::AgentRequestMode::Chat;

request.allow_tools = false;
request.allow_file_read = false;
request.allow_process = false;
request.allow_file_write = false;
request.use_cache = true;
```

This form keeps the request focused on the prompt. The agent still uses the configured provider and model, but it does not need to scan or read project files.

## Analyze a workspace

Use `Analyze` mode when the model should reason about the current project.

```cpp
request.workspace = ".";
request.input = "Explain the most important files in this project.";
request.mode = vix::ai::agent::AgentRequestMode::Analyze;

request.allow_tools = true;
request.allow_file_read = true;
request.allow_process = false;
request.allow_file_write = false;
request.use_cache = true;
```

The workspace is important because it defines the boundary for file access and local agent data. The agent can prepare project context from files inside the workspace, but it should not silently read outside that boundary.

## Use the CLI for a quick check

The same runtime is available through the Vix CLI. Use `ask` for a normal prompt:

```bash
vix agent ask "Explain Vix.cpp in simple words"
```

Use `analyze` when the agent should inspect a workspace:

```bash
vix agent analyze .
```

Use `scan` when you only want to inspect what the agent sees from the workspace scan:

```bash
vix agent scan .
```

A slower local model can be given more time:

```bash
vix agent ask "Explain this code" --model qwen2.5-coder:1.5b --timeout 120000
```

Command execution is disabled unless it is explicitly allowed:

```bash
vix agent ask "Run vix tests if useful" --allow-process
```

Use `--allow-process` carefully. It enables the controlled `command.run` tool, but commands are still restricted by the agent configuration and the allowed program list.

## What happens during a run

A normal agent run follows a small sequence. The configuration is validated, the workspace is opened, the request is converted into a model request, and the model provider generates a response. If tools are allowed and the model requests a tool call, the agent executes the tool through the registered tool system and then sends the tool result back into the model context.

When memory persistence is enabled, the run is stored locally under the agent run directory. When cache is enabled, successful cacheable responses can be reused by later runs.

## Next step

Continue with the public API page to understand the main `Agent`, `AgentConfig`, `AgentRequest`, and `AgentResponse` types before moving into configuration, workspace access, and tools.
