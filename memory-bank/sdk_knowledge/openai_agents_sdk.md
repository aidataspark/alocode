# OpenAI Agents SDK - Key Patterns & Reference

This document provides essential patterns, API details, and best practices for using the OpenAI Agents SDK, enabling Cline to generate accurate and idiomatic code.

## Core Concepts

The SDK revolves around a few key primitives:

*   **Agents**: LLMs equipped with instructions, a model, and tools.
*   **Handoffs**: Allow agents to delegate tasks to other specialized agents.
*   **Guardrails**: Validate inputs to or outputs from agents.
*   **Tools**: Functions or capabilities an agent can use (Python functions, hosted OpenAI tools, MCP tools, or other agents).
*   **Runner**: Executes agent workflows.

## 1. Defining an Agent

Agents are the fundamental building block.

```python
from agents import Agent, ModelSettings
from agents.extensions.models.litellm_model import LitellmModel # If using non-OpenAI models via LiteLLM

# Basic Agent
simple_agent = Agent(
    name="MyHelpfulAgent",
    instructions="You are a helpful assistant. Be concise.",
    model="gpt-4o" # OpenAI model
)

# Agent with specific model settings
detailed_agent = Agent(
    name="ResearcherAgent",
    instructions="You perform detailed research and provide summaries.",
    model="gpt-4o-mini",
    model_settings=ModelSettings(temperature=0.2, top_p=0.8)
)

# Agent using a non-OpenAI model via LiteLLM (ensure 'openai-agents[litellm]' is installed)
# Example: pip install "openai-agents[litellm]"
# Ensure API key for the respective model is set as an environment variable (e.g., ANTHROPIC_API_KEY)
claude_agent = Agent(
    name="ClaudeAssistant",
    instructions="You are an assistant powered by Claude.",
    model=LitellmModel(model="anthropic/claude-3-5-sonnet-20240620", api_key=None) # api_key=None will try to use env var
    # Or, explicitly: model=LitellmModel(model="anthropic/claude-3-5-sonnet-20240620", api_key="YOUR_ANTHROPIC_KEY_HERE")
)
```

**Key Agent Parameters:**
*   `name` (str): Name of the agent.
*   `instructions` (str | Callable): System prompt for the agent. Can be a string or a function `(context, agent) -> str`.
*   `model` (str | Model): Model name (e.g., "gpt-4o") or a `Model` instance.
*   `model_settings` (ModelSettings, optional): Configure temperature, top_p, etc.
*   `tools` (list, optional): List of tools the agent can use.
*   `handoffs` (list, optional): List of other `Agent` instances or `Handoff` objects this agent can delegate to.
*   `output_type` (Type, optional): Pydantic model or other type for structured output.
*   `mcp_servers` (list, optional): List of MCP server instances.

## 2. Defining Tools

Agents can use Python functions as tools.

```python
from agents import function_tool, RunContextWrapper # Assuming UserContext is defined
from typing import Any # Or your specific context type if not Any

# If you have a specific context class, e.g.:
# from dataclasses import dataclass
# @dataclass
# class UserContext:
#     user_id: str
#     session_id: str

@function_tool
async def get_weather(city: str, unit: str = "celsius") -> str:
    """
    Fetches the weather for a given city.

    Args:
        city: The city for which to fetch the weather.
        unit: Temperature unit ('celsius' or 'fahrenheit').
    """
    # In a real scenario, this would call a weather API
    if unit == "celsius":
        return f"The weather in {city} is 25°C and sunny."
    else:
        return f"The weather in {city} is 77°F and sunny."

# Tool using context (replace Any with your actual context type if defined)
@function_tool
def get_user_preference(wrapper: RunContextWrapper[Any], preference_key: str) -> str:
    """Gets a user preference from the context."""
    # Example: if wrapper.context is a dict:
    # user_id = wrapper.context.get("user_id", "unknown_user")
    # preference_value = f"Preference for {preference_key} for user {user_id} is X."
    # For this example, let's assume context is not used deeply.
    return f"Preference for {preference_key} is not set in context."

# Agent using these tools
tool_using_agent = Agent(
    name="ToolUser",
    instructions="Use tools to answer questions.",
    model="gpt-4o",
    tools=[get_weather, get_user_preference]
)
```
*   Use `@function_tool` decorator.
*   Docstrings are used for tool descriptions and argument descriptions.
*   Functions can be `async` or synchronous.
*   First argument can be `RunContextWrapper[YourContextType]` to access shared context.

**Hosted Tools (OpenAI specific, require `OpenAIResponsesModel`):**
*   `WebSearchTool()`
*   `FileSearchTool(vector_store_ids=["YOUR_VS_ID"])`
*   `ComputerTool()` (Beta)
*   `CodeInterpreterTool()`

```python
# from agents import WebSearchTool, FileSearchTool # If using OpenAI hosted tools
# hosted_tool_agent = Agent(
#     name="WebResearcher",
#     instructions="Use web search to find information.",
#     model="gpt-4o", # Ensure model supports hosted tools
#     tools=[WebSearchTool()]
# )
```

## 3. Handoffs (Delegating to other Agents)

One agent can hand off a task to another specialized agent.

```python
from agents import Agent, handoff
from agents.extensions.handoff_prompt import prompt_with_handoff_instructions # Recommended for handoff prompts

billing_agent = Agent(
    name="BillingAgent",
    instructions=prompt_with_handoff_instructions("You are a billing specialist."),
    model="gpt-3.5-turbo"
)

support_agent = Agent(
    name="SupportAgent",
    instructions=prompt_with_handoff_instructions("You are a general support agent. If the query is about billing, handoff to the BillingAgent."),
    model="gpt-4o-mini",
    handoffs=[billing_agent] # Simple handoff
    # Or, for more control:
    # handoffs=[handoff(agent=billing_agent, tool_name_override="transfer_to_billing_specialist")]
)
```
*   The `handoffs` parameter takes a list of `Agent` instances or `handoff()` objects.
*   Use `prompt_with_handoff_instructions` from `agents.extensions.handoff_prompt` for better LLM guidance.
*   Handoffs appear as tools to the LLM (e.g., `transfer_to_BillingAgent`).

## 4. Running Agents

Use the `Runner` class.

```python
from agents import Runner
import asyncio

async def run_my_agent_flow():
    # Assuming support_agent and billing_agent are defined as above
    # And simple_agent is also defined
    
    user_query = "I have a question about my invoice."
    
    # Run the support agent, which might handoff to billing_agent
    result = await Runner.run(support_agent, user_query)
    print(f"Final output for '{user_query}': {result.final_output}")

    another_query = "Tell me a joke."
    result_joke = await Runner.run(simple_agent, another_query)
    print(f"Final output for '{another_query}': {result_joke.final_output}")

if __name__ == "__main__":
    # Setup OPENAI_API_KEY environment variable before running
    # e.g., import os; os.environ["OPENAI_API_KEY"] = "sk-..."
    asyncio.run(run_my_agent_flow())
```
*   `Runner.run(starting_agent, input_data, context=None, run_config=None, max_turns=10)`
*   `input_data` can be a string or a list of message objects.
*   `context` can be any Python object shared across tool calls and hooks.
*   `RunResult.final_output` contains the agent's final response.
*   `RunResult.to_input_list()` can be used to get the full conversation history for subsequent turns.

## 5. Guardrails

Validate inputs or outputs.

```python
from agents import Agent, InputGuardrail, GuardrailFunctionOutput, Runner
from pydantic import BaseModel

class HomeworkCheckOutput(BaseModel):
    is_homework_request: bool
    reasoning: str

homework_detection_agent = Agent(
    name="HomeworkDetector",
    instructions="Determine if the user's query is a homework question.",
    output_type=HomeworkCheckOutput,
    model="gpt-3.5-turbo"
)

async def homework_input_guardrail(ctx, agent, input_data) -> GuardrailFunctionOutput:
    result = await Runner.run(homework_detection_agent, input_data, context=ctx.context)
    is_homework = result.final_output_as(HomeworkCheckOutput).is_homework_request
    return GuardrailFunctionOutput(
        output_info={"detected_as_homework": is_homework},
        tripwire_triggered=is_homework # Trigger if it IS homework
    )

main_agent_with_guardrail = Agent(
    name="TutorBot",
    instructions="Help users with their questions, but do not do their homework.",
    model="gpt-4o",
    input_guardrails=[InputGuardrail(guardrail_function=homework_input_guardrail)]
)

# To run and catch guardrail errors:
# try:
#     result = await Runner.run(main_agent_with_guardrail, "Solve 2x + 5 = 11 for x.")
#     print(result.final_output)
# except InputGuardrailTripwireTriggered as e:
#     print(f"Guardrail triggered: {e.message}")
#     print(f"Details: {e.output_info}")
```
*   Guardrail functions run in parallel.
*   `InputGuardrail` runs on initial user input for the first agent.
*   `OutputGuardrail` runs on the final output of the last agent.
*   If `tripwire_triggered` is true, an exception is raised (e.g., `InputGuardrailTripwireTriggered`).

## 6. Configuration

*   **API Keys:** Set `OPENAI_API_KEY` environment variable. For LiteLLM models, set respective keys (e.g., `ANTHROPIC_API_KEY`).
*   **Tracing:** Enabled by default. View traces at `https://platform.openai.com/traces`.
    *   Disable: `from agents import set_tracing_disabled; set_tracing_disabled(True)`
*   **LiteLLM Setup:**
    *   Install: `pip install "openai-agents[litellm]"`
    *   Use model prefix: `model="litellm/anthropic/claude-3-opus-20240229"`

## 7. MCP (Model Context Protocol) Integration

Agents can use tools from MCP servers.

```python
from agents import Agent
# Assuming mcp_server_instance is an initialized MCPServerStdio, MCPServerSse, etc.
# from agents.mcp import MCPServerStdio
# async with MCPServerStdio(params={"command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]}) as fs_mcp_server:
#     mcp_agent = Agent(
#         name="MCPAgent",
#         instructions="Use tools from the MCP server.",
#         model="gpt-4o",
#         mcp_servers=[fs_mcp_server] 
#     )
#     # ... run mcp_agent ...
```
*   Pass a list of MCP server instances to `Agent(mcp_servers=[...])`.
*   The SDK handles listing and calling tools from these servers.

This reference should be consulted by Cline when tasked with generating applications using the OpenAI Agents SDK.
