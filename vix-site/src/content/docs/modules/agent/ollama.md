# Ollama

Ollama is the default local model provider used by the `agent` module. It lets a Vix program send an agent request to a model running on the developer machine instead of depending on a remote model service.

This fits the direction of the agent module because the runtime is designed around local-first workflows. The agent opens a workspace, prepares context, applies permissions, and then asks the configured provider to generate a response. With Ollama, that provider is a local HTTP endpoint, usually running at `http://127.0.0.1:11434`.

## Header

Use the public Vix AI aggregator in normal application code:

```cpp
#include <vix/ai.hpp>
```

For examples that create an `OllamaProvider` directly:

```cpp
#include <vix/ai/agent/AgentRuntime.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Local setup

Start Ollama before running an agent program:

```bash
ollama serve
```

In another terminal, pull the model you want to use:

```bash
ollama pull llama3
```

For smaller machines, a lighter local model can be easier to test with:

```bash
ollama pull qwen2.5-coder:1.5b
```

Once the model is available, a Vix agent program can use it through the Ollama provider.

## Basic configuration

The Ollama provider is selected through `AgentConfig`.

```cpp
vix::ai::agent::AgentConfig config;

config.provider = "ollama";
config.model = "llama3";
config.model_url = "http://127.0.0.1:11434";
```

`provider` selects the provider implementation. `model` is the model name sent to Ollama. `model_url` is the local Ollama endpoint.

A normal local analysis configuration also sets permissions and cache behavior:

```cpp
config.allow_file_read = true;
config.allow_process = false;
config.allow_file_write = false;

config.use_cache = true;
config.persist_memory = true;
```

This allows the agent to read safe project context while keeping command execution and file writing disabled.

## Run an agent request with Ollama

The most common workflow is to configure Ollama, create an agent, build a request, and call `Agent::run`.

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
  request.timeout_ms = config.timeout_ms;

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

This example uses Ollama as the model provider and analyzes the current workspace. File reading is allowed because the task needs project context. Process execution remains disabled because the agent does not need to run local commands for a first analysis.

## Check whether Ollama is available

When a program wants a clear error before starting a full agent run, it can create the provider directly and call `available()`.

```cpp
#include <memory>

#include <vix/ai/agent/AgentRuntime.hpp>
#include <vix/print.hpp>

int main()
{
  vix::ai::agent::AgentConfig config;

  config.provider = "ollama";
  config.model = "llama3";
  config.model_url = "http://127.0.0.1:11434";

  auto provider =
      std::make_shared<vix::ai::agent::OllamaProvider>(config);

  auto available = provider->available();

  if (!available || !available.value())
  {
    vix::print("Ollama is not available.");
    vix::print("Start it with: ollama serve");
    return 1;
  }

  vix::print("Ollama is available.");

  return 0;
}
```

This check is useful in examples, CLI commands, and local tools. It gives the user a direct message when Ollama is not running or not available in the current environment.

## Endpoint

The default endpoint is:

```text
http://127.0.0.1:11434
```

Configure it with:

```cpp
config.model_url = "http://127.0.0.1:11434";
```

The endpoint should include the scheme. A bare host and port is not enough.

```cpp
config.model_url = "127.0.0.1:11434";
```

Use the full HTTP endpoint instead:

```cpp
config.model_url = "http://127.0.0.1:11434";
```

The provider trims trailing slashes from the endpoint before building the request URL, so both of these forms point to the same local service:

```cpp
config.model_url = "http://127.0.0.1:11434";
config.model_url = "http://127.0.0.1:11434/";
```

## Generate endpoint

The provider sends model requests to the Ollama generate endpoint:

```text
POST /api/generate
```

The request body contains the model, prompt, stream flag, and optional model options.

A simplified payload has this shape:

```json
{
  "model": "llama3",
  "prompt": "Explain this project in simple words.",
  "stream": false
}
```

When a system prompt is present, it is sent as `system`. When `max_tokens` is set on the model request, the provider maps it to Ollama's `num_predict` option.

```json
{
  "model": "llama3",
  "prompt": "Explain this project in simple words.",
  "stream": false,
  "options": {
    "num_predict": 512
  }
}
```

Most applications do not need to build this payload manually. The provider builds it from the `ModelRequest` created by the agent runtime.

## Model selection

The model comes from `AgentConfig` by default.

```cpp
config.model = "llama3";
```

For a lighter model:

```cpp
config.model = "qwen2.5-coder:1.5b";
```

A request can also override the configured model for one run:

```cpp
request.model_override = "qwen2.5-coder:1.5b";
```

Use a request-level override when the application has a real reason to choose a model per operation. For most programs, keeping the model in the configuration is easier to understand.

## Timeout

Local model calls can take time, especially on the first request or on CPU-only machines. Use `timeout_ms` to make that behavior explicit.

```cpp
config.timeout_ms = 120'000;
```

A request can also carry a timeout:

```cpp
request.timeout_ms = config.timeout_ms;
```

For command-line tools, this maps naturally to a `--timeout` option. For applications, it lets the program decide how long a local model request may run before it is treated as failed.

## Response handling

Ollama returns JSON. The provider reads the generated text from the `response` field and records the model, duration, and token counters when they are present.

At the agent level, the caller receives an `AgentResponse`:

```cpp
const auto &response = result.value();

vix::print(response.text);
vix::print("Provider:", response.provider);
vix::print("Model:", response.model);
vix::print("Duration:", response.duration_ms, "ms");
```

The caller should use the `AgentResponse` instead of depending on the raw Ollama JSON. The provider keeps backend-specific parsing inside the model provider layer, while the agent returns a stable Vix response shape.

## Using Ollama from the CLI

The `vix agent` command can use Ollama through the same configuration fields.

Ask a normal question:

```bash
vix agent ask "Explain what local-first software means"
```

Analyze the current project:

```bash
vix agent analyze .
```

Select a model:

```bash
vix agent ask "Explain this project" --model qwen2.5-coder:1.5b
```

Use another endpoint:

```bash
vix agent ask "Explain this project" --model-url http://127.0.0.1:11434
```

Give the local model more time:

```bash
vix agent analyze . --model qwen2.5-coder:1.5b --timeout 120000
```

The CLI also reads agent configuration from environment variables, then applies command-line options on top of those values.

## Environment variables

Ollama settings can be provided through the agent environment configuration.

```bash
export VIX_AGENT_PROVIDER=ollama
export VIX_AGENT_MODEL=llama3
export VIX_AGENT_MODEL_URL=http://127.0.0.1:11434
export VIX_AGENT_TIMEOUT_MS=120000
```

Then load the configuration in C++:

```cpp
auto config = vix::ai::agent::AgentConfigLoader::from_environment();
```

The program can still override fields after loading from the environment:

```cpp
auto config = vix::ai::agent::AgentConfigLoader::from_environment();

config.model = "qwen2.5-coder:1.5b";
config.timeout_ms = 120'000;
```

## Cache behavior

Ollama responses can be cached by the agent runtime when both the configuration and the request allow cache.

```cpp
config.use_cache = true;
request.use_cache = true;
```

The cache is local to the workspace. It is useful when the same prompt and context are repeated during development. Responses involving tools are not stored as plain cached model responses, because tool execution is part of the run and should not be silently skipped.

Disable cache when you want a fresh model call every time:

```cpp
config.use_cache = false;
request.use_cache = false;
```

## Common mistakes

### Ollama is not running

Start the local service before running the program:

```bash
ollama serve
```

Then make sure the model exists locally:

```bash
ollama pull llama3
```

A stopped service or missing model should be handled as a provider availability problem.

### The endpoint is missing the scheme

Use a full HTTP endpoint:

```cpp
config.model_url = "http://127.0.0.1:11434";
```

Do not use a bare address:

```cpp
config.model_url = "127.0.0.1:11434";
```

### The timeout is too small

Local models can be slow to start. Increase the timeout during local testing:

```cpp
config.timeout_ms = 120'000;
```

For CLI usage:

```bash
vix agent analyze . --timeout 120000
```

### The prompt expects project context but file reading is disabled

A workspace analysis request needs file access when the model is expected to reason about project files.

```cpp
config.allow_file_read = true;

request.allow_tools = true;
request.allow_file_read = true;
```

For normal chat, file reading can stay disabled. For project analysis, enable it deliberately.

## Complete example

This example checks that Ollama is available, then runs an analysis request with the injected provider.

```cpp
#include <memory>

#include <vix/ai/agent/AgentRuntime.hpp>
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

  auto provider =
      std::make_shared<vix::ai::agent::OllamaProvider>(config);

  auto available = provider->available();

  if (!available || !available.value())
  {
    vix::print("Ollama is not available.");
    vix::print("Start it with: ollama serve");
    return 1;
  }

  vix::ai::agent::Agent agent(config, provider);

  vix::ai::agent::AgentRequest request;

  request.workspace = ".";
  request.input =
      "Look at this project structure and explain the most important files.";
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
  vix::print("Provider:", response.provider);
  vix::print("Model:", response.model);
  vix::print("From cache:", response.from_cache);
  vix::print("Duration:", response.duration_ms, "ms");

  return 0;
}
```

This form is useful when the program wants to check provider availability before running the agent. Simpler applications can create `Agent` from the configuration and let the runtime create the default Ollama provider.

## Next step

Continue with the tools page to understand how model-requested tool calls are controlled by the agent runtime instead of being executed directly by the provider.
