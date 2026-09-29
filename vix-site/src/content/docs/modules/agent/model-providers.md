# Model Providers

Model providers are the bridge between the Vix agent runtime and the model that produces a response. The agent does not hard-code all model behavior into `Agent` itself. Instead, it builds a `ModelRequest`, sends it to a `ModelProvider`, and receives a `ModelResponse`.

This separation matters because the agent runtime has responsibilities that are different from the model backend. The runtime opens the workspace, prepares context, applies permissions, handles tools, stores run history, and manages cache. The provider is responsible for turning the prepared model request into a model response. Keeping those roles separate makes the module easier to test and easier to extend.

## Header

For normal application code, use the public Vix AI aggregator:

```cpp
#include <vix/ai.hpp>
```

For code that works directly with providers and lower-level runtime types:

```cpp
#include <vix/ai/agent/AgentRuntime.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Provider role

A model provider implements the model-facing part of the agent runtime. It tells the agent its name, whether it is local, whether it is available, and how to generate a response from a `ModelRequest`.

The current built-in provider is `OllamaProvider`. It is local-first and uses the configured Ollama endpoint to generate responses.

```cpp
config.provider = "ollama";
config.model = "llama3";
config.model_url = "http://127.0.0.1:11434";
```

The provider abstraction allows the rest of the agent runtime to stay focused on the agent workflow instead of depending directly on one model backend.

## ModelProvider

`ModelProvider` is the interface implemented by model backends.

A provider exposes four main operations:

| Operation           | Purpose                                             |
| ------------------- | --------------------------------------------------- |
| `name()`            | Returns the provider name, such as `ollama`.        |
| `local()`           | Tells whether the provider is local.                |
| `available()`       | Checks whether the provider can be used.            |
| `generate(request)` | Sends a model request and returns a model response. |

The agent uses the configured provider when it runs a request. If no provider was injected manually and the configuration uses `ollama`, the runtime creates an `OllamaProvider` from the agent configuration.

## ModelRequest

`ModelRequest` is the request sent to the provider. It is built from the higher-level `AgentRequest` after the agent has applied request mode, workspace context, and tool context.

A model request may contain a direct prompt:

```cpp
vix::ai::agent::ModelRequest request;

request.model = "llama3";
request.prompt = "Explain what this project does.";
request.timeout_ms = 120'000;
```

It may also contain messages when the runtime needs a conversation-style request or when tool results are appended back into the model context.

```cpp
vix::ai::agent::ModelMessage message;

message.role = vix::ai::agent::ModelMessageRole::User;
message.content = "Explain the project structure.";

request.messages.push_back(message);
```

The provider decides how to convert that request into the format expected by the backend. `OllamaProvider`, for example, can build a prompt from messages when a direct prompt is not provided.

## ModelResponse

`ModelResponse` is the provider-level response. It contains the generated text, model name, provider name, status, duration, usage information, optional raw data, and optional tool calls.

```cpp
auto generated = provider->generate(request);

if (!generated)
{
  vix::print("Model error:", generated.error().message());
  return 1;
}

const auto &response = generated.value();

vix::print(response.text);
vix::print("Provider:", response.provider);
vix::print("Model:", response.model);
vix::print("Duration:", response.duration_ms, "ms");
```

The agent later converts the provider response into an `AgentResponse`. That final agent response includes the text, run id, provider, model, cache status, tool summaries, and metadata useful to the caller.

## Ollama provider

`OllamaProvider` is the default local provider. It uses the model name and endpoint from `AgentConfig`.

```cpp
vix::ai::agent::AgentConfig config;

config.provider = "ollama";
config.model = "llama3";
config.model_url = "http://127.0.0.1:11434";
```

A provider can be created directly:

```cpp
auto provider =
    std::make_shared<vix::ai::agent::OllamaProvider>(config);
```

Before running an agent request, you can check whether Ollama is available:

```cpp
auto available = provider->available();

if (!available || !available.value())
{
  vix::print("Ollama is not available.");
  vix::print("Start it with: ollama serve");
  return 1;
}
```

This is useful in examples and command-line tools because it gives the user a clear failure before the agent starts preparing a full request.

## Ollama endpoint

The Ollama provider sends requests to the local generate endpoint:

```text
POST /api/generate
```

A normal local endpoint is:

```text
http://127.0.0.1:11434
```

The provider validates the endpoint before sending the request. The endpoint must start with `http://` or `https://`.

```cpp
config.model_url = "http://127.0.0.1:11434";
```

For local development, start Ollama and pull the model first:

```bash
ollama serve
ollama pull llama3
```

Then run the Vix program that uses the agent.

## Selecting a model

The model name comes from `AgentConfig` by default.

```cpp
config.model = "llama3";
```

A request can override the configured model when one run needs a different model.

```cpp
request.model_override = "qwen2.5-coder:1.5b";
```

Use model overrides when the application has a good reason to choose a model per request. For simple applications, keep the model in the configuration so the runtime policy stays easy to understand.

## Timeout

The provider uses the request timeout when it is set. Otherwise, it uses the timeout from `AgentConfig`.

```cpp
config.timeout_ms = 120'000;
request.timeout_ms = config.timeout_ms;
```

Local models can be slow on the first request, especially when the model is loaded into memory. A clear timeout makes the behavior predictable for CLI commands and local tools.

## Use Ollama with Agent

The most common workflow is to configure Ollama, create an agent, and run an `AgentRequest`.

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

This form is useful when you want to check provider availability before the agent run begins. If you do not need that check, the agent can create the default Ollama provider from the configuration.

## Injecting a provider

A provider can be injected into the agent constructor.

```cpp
auto provider =
    std::make_shared<vix::ai::agent::OllamaProvider>(config);

vix::ai::agent::Agent agent(config, provider);
```

This is useful for tests and advanced integrations. A test can inject a provider that returns a fixed response. A tool can inject a provider with a custom HTTP client. A future integration can implement `ModelProvider` for another backend while keeping the rest of the agent runtime unchanged.

## Provider responses and tools

A provider can return normal text, but it may also return tool calls when the model wants the agent to execute a tool. The agent runtime receives those tool calls, runs them through the registered `ToolRegistry`, appends the tool results to the model context, and asks the provider for a final response.

This means providers should not execute local tools directly. Tool execution belongs to the agent runtime because the runtime owns permissions, workspace boundaries, allowed commands, and tool summaries.

## Cache and providers

The cache is built around the provider name, model, prompt, and prepared context. This is why provider identity matters. Two providers may receive similar prompts, but they should not share a cache entry as if they were the same model backend.

```cpp
config.use_cache = true;
request.use_cache = true;
```

Only cacheable successful responses are stored. Responses involving tools are not cached as plain model responses because tool execution represents work that should not be silently skipped on a later run.

## Common mistakes

### Forgetting to start Ollama

If the default provider is Ollama, the local service must be running.

```bash
ollama serve
```

Pull the model before using it:

```bash
ollama pull llama3
```

A missing model or stopped service should be handled as a provider availability problem, not as an agent logic problem.

### Using an invalid endpoint

The Ollama endpoint should include the scheme.

```cpp
config.model_url = "http://127.0.0.1:11434";
```

Do not use a bare host and port as the endpoint.

```cpp
config.model_url = "127.0.0.1:11434";
```

The provider expects an HTTP endpoint.

### Putting provider logic into Agent

`Agent` should coordinate the run. Provider-specific transport and response parsing belong in a `ModelProvider`. Keeping this separation makes the runtime easier to test and keeps provider changes from leaking into workspace, tool, cache, or run history code.

## Next step

Continue with the Ollama page to see the default local provider in more detail, including setup, endpoint configuration, model selection, and practical local troubleshooting.
