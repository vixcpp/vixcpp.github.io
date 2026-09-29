# Custom Providers

A custom provider lets an application decide where agent responses come from. The agent runtime does not need to know whether the response was produced by Ollama, a test backend, a local service, or another model integration. It only needs a `ModelProvider` that can receive a `ModelRequest` and return a `ModelResponse`.

This is useful because model integration should stay separate from the rest of the agent runtime. The agent opens the workspace, prepares context, applies permissions, handles tools, manages cache, and writes run history. The provider is responsible for generating a model response from the request it receives.

## Header

Custom providers use the lower-level agent runtime API:

```cpp
#include <vix/ai/agent/AgentRuntime.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

A custom provider file usually starts with:

```cpp
#include <memory>
#include <string_view>

#include <vix/ai/agent/AgentRuntime.hpp>
#include <vix/print.hpp>
```

## ModelProvider

A provider implements `vix::ai::agent::ModelProvider`.

A provider must expose a name, report whether it is local, report whether it is available, and generate a model response from a model request.

```cpp
class MyProvider final : public vix::ai::agent::ModelProvider
{
public:
  [[nodiscard]] std::string_view name() const noexcept override
  {
    return "my-provider";
  }

  [[nodiscard]] bool local() const noexcept override
  {
    return true;
  }

  [[nodiscard]] vix::ai::agent::AgentResult<bool> available() const override
  {
    return true;
  }

  [[nodiscard]] vix::ai::agent::AgentResult<vix::ai::agent::ModelResponse>
  generate(const vix::ai::agent::ModelRequest &request) override
  {
    vix::ai::agent::ModelResponse response;

    response.text = "Hello from my provider.";
    response.model = request.model;
    response.provider = "my-provider";
    response.status = vix::ai::agent::ModelResponseStatus::Completed;

    return response;
  }
};
```

The provider returns a `ModelResponse`, not an `AgentResponse`. The agent runtime receives the provider response and turns it into the final agent response after applying the rest of the runtime workflow.

## A simple echo provider

The smallest useful custom provider is an echo provider. It does not call a real model. It returns the prompt it received, which makes it useful for tests and examples.

```cpp
#include <memory>
#include <string_view>

#include <vix/ai/agent/AgentRuntime.hpp>
#include <vix/print.hpp>

namespace
{
  class EchoProvider final : public vix::ai::agent::ModelProvider
  {
  public:
    [[nodiscard]] std::string_view name() const noexcept override
    {
      return "echo";
    }

    [[nodiscard]] bool local() const noexcept override
    {
      return true;
    }

    [[nodiscard]] vix::ai::agent::AgentResult<bool> available() const override
    {
      return true;
    }

    [[nodiscard]] vix::ai::agent::AgentResult<vix::ai::agent::ModelResponse>
    generate(const vix::ai::agent::ModelRequest &request) override
    {
      vix::ai::agent::ModelResponse response;

      response.text = "Echo provider received: " + request.prompt;
      response.model = request.model;
      response.provider = "echo";
      response.status = vix::ai::agent::ModelResponseStatus::Completed;

      return response;
    }
  };
}

int main()
{
  vix::ai::agent::AgentConfig config;

  config.provider = "echo";
  config.model = "echo-model";

  config.allow_file_read = false;
  config.allow_process = false;
  config.allow_file_write = false;

  config.use_cache = false;
  config.persist_memory = false;

  auto provider = std::make_shared<EchoProvider>();

  vix::ai::agent::Agent agent(config, provider);

  vix::ai::agent::AgentRequest request;

  request.workspace = ".";
  request.input = "Hello custom provider.";
  request.mode = vix::ai::agent::AgentRequestMode::Chat;

  request.allow_tools = false;
  request.allow_file_read = false;
  request.allow_process = false;
  request.allow_file_write = false;
  request.use_cache = false;

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

This example is intentionally small. It shows the provider contract without introducing HTTP, JSON parsing, authentication, streaming, or tool calls.

## Injecting a provider

A custom provider is passed to the `Agent` constructor.

```cpp
auto provider = std::make_shared<EchoProvider>();

vix::ai::agent::Agent agent(config, provider);
```

The configuration still matters. It defines the model name, runtime permissions, cache behavior, run persistence, workspace limits, and tool limits. The provider controls how the model response is generated, but it does not replace the agent runtime policy.

## Provider availability

`available()` tells the caller whether the provider can be used.

```cpp
auto available = provider->available();

if (!available || !available.value())
{
  vix::print("Provider is not available.");
  return 1;
}
```

For a test provider, returning `true` is enough. For a real provider, this method can check whether a local service is running, whether a binary exists, whether a socket can be reached, or whether required configuration is present.

The goal is to fail early with a useful message before the agent prepares a full request.

## ModelRequest

The provider receives a `ModelRequest`.

```cpp
generate(const vix::ai::agent::ModelRequest &request)
```

A model request contains the model name, prompt, optional messages, timeout, stream preference, and provider-specific options.

```cpp
vix::print("Model:", request.model);
vix::print("Prompt:", request.prompt);
vix::print("Timeout:", request.timeout_ms, "ms");
```

Most simple providers only need `request.model` and `request.prompt`. More advanced providers may use messages, system prompts, options, or tool-related context prepared by the agent.

## ModelResponse

The provider returns a `ModelResponse`.

```cpp
vix::ai::agent::ModelResponse response;

response.text = "Generated text.";
response.model = request.model;
response.provider = "my-provider";
response.status = vix::ai::agent::ModelResponseStatus::Completed;
```

A successful response should set the text, model, provider, and status. If the provider has timing or usage data, it can fill those fields too.

```cpp
response.duration_ms = 42;
response.usage.prompt_tokens = 100;
response.usage.completion_tokens = 50;
```

The agent does not require every provider to expose the same metadata, but it should receive enough information to build a useful `AgentResponse`.

## Failed provider response

A provider can return an error when it cannot generate a response. The exact error helpers depend on the error style used in the module, but the important rule is simple: do not return a successful `ModelResponse` when the provider failed.

A failed provider request should be represented as an `AgentResult` error, so the caller receives a normal agent failure through `Agent::run`.

```cpp
auto result = agent.run(request);

if (!result)
{
  vix::print("Agent error:", result.error().message());
  return 1;
}
```

This keeps provider failures in the same result flow as workspace errors, configuration errors, tool errors, and model request failures.

## A provider for cache testing

A custom provider can make cache behavior visible. This provider increments a counter every time `generate()` is called.

```cpp
#include <memory>
#include <string_view>

#include <vix/ai/agent/AgentRuntime.hpp>
#include <vix/print.hpp>

namespace
{
  class CountingProvider final : public vix::ai::agent::ModelProvider
  {
  public:
    [[nodiscard]] std::string_view name() const noexcept override
    {
      return "counting";
    }

    [[nodiscard]] bool local() const noexcept override
    {
      return true;
    }

    [[nodiscard]] vix::ai::agent::AgentResult<bool> available() const override
    {
      return true;
    }

    [[nodiscard]] vix::ai::agent::AgentResult<vix::ai::agent::ModelResponse>
    generate(const vix::ai::agent::ModelRequest &request) override
    {
      ++calls_;

      vix::ai::agent::ModelResponse response;

      response.text = "This response was generated by the provider.";
      response.model = request.model;
      response.provider = "counting";
      response.status = vix::ai::agent::ModelResponseStatus::Completed;

      return response;
    }

    [[nodiscard]] int calls() const noexcept
    {
      return calls_;
    }

  private:
    int calls_{0};
  };
}

int main()
{
  vix::ai::agent::AgentConfig config;

  config.provider = "counting";
  config.model = "counting-model";

  config.allow_file_read = false;
  config.allow_process = false;
  config.allow_file_write = false;

  config.use_cache = true;
  config.cache_ttl_ms = 5 * 60 * 1000;
  config.persist_memory = true;

  auto provider = std::make_shared<CountingProvider>();

  vix::ai::agent::Agent agent(config, provider);

  vix::ai::agent::AgentRequest request;

  request.workspace = ".";
  request.input = "Explain local-first software in simple words.";
  request.mode = vix::ai::agent::AgentRequestMode::Explain;

  request.allow_tools = false;
  request.allow_file_read = false;
  request.allow_process = false;
  request.allow_file_write = false;
  request.use_cache = true;

  auto first = agent.run(request);

  if (!first)
  {
    vix::print("First run error:", first.error().message());
    return 1;
  }

  vix::print("First run:");
  vix::print(first.value().text);
  vix::print("From cache:", first.value().from_cache);
  vix::print("Provider calls:", provider->calls());
  vix::print();

  auto second = agent.run(request);

  if (!second)
  {
    vix::print("Second run error:", second.error().message());
    return 1;
  }

  vix::print("Second run:");
  vix::print(second.value().text);
  vix::print("From cache:", second.value().from_cache);
  vix::print("Provider calls:", provider->calls());

  return 0;
}
```

This kind of provider is useful because it makes runtime behavior measurable. If the second response comes from cache, the provider call count should not increase.

## Providers and tools

A provider may return tool calls in its `ModelResponse`, but it should not execute tools itself. Tool execution belongs to the agent runtime because the runtime owns the workspace boundary, permission checks, allowed programs, tool registry, and tool summaries.

A provider that wants the agent to run a tool returns a `ToolCall`:

```cpp
vix::ai::agent::ToolCall call;

call.id = "tool_echo_1";
call.name = "command.run";
call.reason = "Run a safe command to demonstrate command execution.";
```

The agent receives that tool call, executes the matching tool if it is allowed, appends the tool result to the model context, and calls the provider again for the final response.

## Custom provider with a tool call

The following provider requests `command.run` on the first call and returns a final response on the second call.

```cpp
#include <memory>
#include <string_view>

#include <vix/ai/agent/AgentRuntime.hpp>
#include <vix/json/json.hpp>
#include <vix/print.hpp>

namespace
{
  class CommandToolProvider final : public vix::ai::agent::ModelProvider
  {
  public:
    [[nodiscard]] std::string_view name() const noexcept override
    {
      return "command-tool-demo";
    }

    [[nodiscard]] bool local() const noexcept override
    {
      return true;
    }

    [[nodiscard]] vix::ai::agent::AgentResult<bool> available() const override
    {
      return true;
    }

    [[nodiscard]] vix::ai::agent::AgentResult<vix::ai::agent::ModelResponse>
    generate(const vix::ai::agent::ModelRequest &request) override
    {
      ++calls_;

      vix::ai::agent::ModelResponse response;

      response.model = request.model;
      response.provider = "command-tool-demo";
      response.status = vix::ai::agent::ModelResponseStatus::Completed;

      if (calls_ == 1)
      {
        vix::ai::agent::ToolCall call;

        call.id = "tool_echo_1";
        call.name = "command.run";
        call.reason = "Run a safe command to demonstrate the command tool.";
        call.arguments = vix::json::Json::object();
        call.arguments["program"] = "echo";
        call.arguments["args"] = vix::json::Json::array();
        call.arguments["args"].push_back("hello from command.run");
        call.arguments["working_directory"] = ".";

        response.text = "I need to run a safe command first.";
        response.tool_calls.push_back(std::move(call));

        return response;
      }

      response.text =
          "The command tool was executed successfully and its result was "
          "returned to the model context.";

      return response;
    }

  private:
    int calls_{0};
  };
}

int main()
{
  vix::ai::agent::AgentConfig config;

  config.provider = "command-tool-demo";
  config.model = "command-tool-demo-model";

  config.allow_file_read = false;
  config.allow_process = true;
  config.allow_file_write = false;

  config.allowed_programs = {"echo"};

  config.max_tool_output = 20'000;
  config.max_tool_rounds = 3;

  config.use_cache = false;
  config.persist_memory = true;

  auto provider = std::make_shared<CommandToolProvider>();

  vix::ai::agent::Agent agent(config, provider);

  vix::ai::agent::AgentRequest request;

  request.workspace = ".";
  request.mode = vix::ai::agent::AgentRequestMode::Run;
  request.input = "Demonstrate command.run with a safe command.";

  request.allow_tools = true;
  request.allow_file_read = false;
  request.allow_process = true;
  request.allow_file_write = false;
  request.use_cache = false;

  auto result = agent.run(request);

  if (!result)
  {
    vix::print("Agent error:", result.error().message());
    return 1;
  }

  const auto &response = result.value();

  vix::print(response.text);
  vix::print();

  vix::print("Tools used:", response.tools.size());

  for (const auto &tool : response.tools)
  {
    vix::print("-", tool.name, tool.ok ? "ok" : "failed");
  }

  return 0;
}
```

This example is useful for testing the tool loop without depending on the behavior of a real model. The provider deterministically asks for one safe command, then returns the final answer after the runtime has executed the tool.

## When to write a custom provider

Write a custom provider when the default Ollama provider is not the right boundary for your application. Common reasons include tests, demos, local services with a different API, project-specific model gateways, or providers that need special request formatting.

A custom provider should stay focused on model communication. It should not open arbitrary files, run commands, or write run history directly. Those responsibilities belong to the agent runtime.

## Common mistakes

### Returning a response without setting the status

A successful provider response should set a completed status.

```cpp
response.status = vix::ai::agent::ModelResponseStatus::Completed;
```

Without a clear status, the runtime cannot reliably know how to treat the provider response.

### Executing tools inside the provider

A provider should return tool calls, not execute them. The agent runtime owns tool execution because it has the permission checks and workspace boundary.

### Hiding provider failures inside normal text

Do not return `"error: failed"` as a successful model response when the provider failed. Return an error through `AgentResult` so the caller can handle it normally.

### Mixing provider identity

Set the provider name consistently.

```cpp
response.provider = "my-provider";
```

Provider identity is used for metadata and cache behavior. A provider should not change its name unpredictably between runs.

## Next step

Continue with the errors page to understand how agent failures are represented and handled through `AgentResult`.
