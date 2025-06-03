# OpenAI Agents SDK - Advanced Examples & Architectural Patterns

This document provides advanced examples and architectural patterns for using the OpenAI Agents SDK, building upon the core concepts outlined in `openai_agents_sdk.md`. These examples are intended to guide Cline in designing and generating more complex, robust, and production-ready multi-agent applications.

## Example 1: Multi-Agent Financial Research Application

This example demonstrates a sophisticated financial research application built with multiple specialized agents orchestrated by a manager.

### Directory Structure:

```
./financial_research_project/
├── agents/
│   ├── __init__.py
│   ├── financials_agent.py
│   ├── planner_agent.py
│   ├── risk_agent.py
│   ├── search_agent.py
│   ├── verifier_agent.py
│   └── writer_agent.py
├── __init__.py
├── main.py
├── manager.py
└── printer.py
```

### File Contents:

---
**File: `agents/__init__.py`**
---
```python
# This file can be empty or used to export agent instances for easier access.
# For this example, it's kept empty.
```

---
**File: `agents/financials_agent.py`**
---
```python
from pydantic import BaseModel

from agents import Agent

# A sub-agent focused on analyzing a company's fundamentals.
FINANCIALS_PROMPT = (
    "You are a financial analyst focused on company fundamentals such as revenue, "
    "profit, margins and growth trajectory. Given a collection of web (and optional file) "
    "search results about a company, write a concise analysis of its recent financial "
    "performance. Pull out key metrics or quotes. Keep it under 2 paragraphs."
)


class AnalysisSummary(BaseModel):
    summary: str
    """Short text summary for this aspect of the analysis."""


financials_agent = Agent(
    name="FundamentalsAnalystAgent",
    instructions=FINANCIALS_PROMPT,
    output_type=AnalysisSummary,
)
```

---
**File: `agents/planner_agent.py`**
---
```python
from pydantic import BaseModel

from agents import Agent

# Generate a plan of searches to ground the financial analysis.
# For a given financial question or company, we want to search for
# recent news, official filings, analyst commentary, and other
# relevant background.
PROMPT = (
    "You are a financial research planner. Given a request for financial analysis, "
    "produce a set of web searches to gather the context needed. Aim for recent "
    "headlines, earnings calls or 10-K snippets, analyst commentary, and industry background. "
    "Output between 5 and 15 search terms to query for."
)


class FinancialSearchItem(BaseModel):
    reason: str
    """Your reasoning for why this search is relevant."""

    query: str
    """The search term to feed into a web (or file) search."""


class FinancialSearchPlan(BaseModel):
    searches: list[FinancialSearchItem]
    """A list of searches to perform."""


planner_agent = Agent(
    name="FinancialPlannerAgent",
    instructions=PROMPT,
    model="gpt-4o-mini", # Adjusted for potential cost/speed, can be gpt-4o or other
    output_type=FinancialSearchPlan,
)
```

---
**File: `agents/risk_agent.py`**
---
```python
from pydantic import BaseModel

from agents import Agent

# A sub-agent specializing in identifying risk factors or concerns.
RISK_PROMPT = (
    "You are a risk analyst looking for potential red flags in a company's outlook. "
    "Given background research, produce a short analysis of risks such as competitive threats, "
    "regulatory issues, supply chain problems, or slowing growth. Keep it under 2 paragraphs."
)


class AnalysisSummary(BaseModel): # Re-using the same AnalysisSummary from financials_agent
    summary: str
    """Short text summary for this aspect of the analysis."""


risk_agent = Agent(
    name="RiskAnalystAgent",
    instructions=RISK_PROMPT,
    output_type=AnalysisSummary,
)
```

---
**File: `agents/search_agent.py`**
---
```python
from agents import Agent, WebSearchTool # Assuming WebSearchTool is available and configured
from agents.model_settings import ModelSettings

# Given a search term, use web search to pull back a brief summary.
# Summaries should be concise but capture the main financial points.
INSTRUCTIONS = (
    "You are a research assistant specializing in financial topics. "
    "Given a search term, use web search to retrieve up-to-date context and "
    "produce a short summary of at most 300 words. Focus on key numbers, events, "
    "or quotes that will be useful to a financial analyst."
)

search_agent = Agent(
    name="FinancialSearchAgent",
    instructions=INSTRUCTIONS,
    tools=[WebSearchTool()], # Requires OpenAI model or compatible setup for hosted tools
    model_settings=ModelSettings(tool_choice="required"), # Ensures the tool is used
)
```

---
**File: `agents/verifier_agent.py`**
---
```python
from pydantic import BaseModel

from agents import Agent

# Agent to sanity-check a synthesized report for consistency and recall.
# This can be used to flag potential gaps or obvious mistakes.
VERIFIER_PROMPT = (
    "You are a meticulous auditor. You have been handed a financial analysis report. "
    "Your job is to verify the report is internally consistent, clearly sourced, and makes "
    "no unsupported claims. Point out any issues or uncertainties."
)


class VerificationResult(BaseModel):
    verified: bool
    """Whether the report seems coherent and plausible."""

    issues: str
    """If not verified, describe the main issues or concerns."""


verifier_agent = Agent(
    name="VerificationAgent",
    instructions=VERIFIER_PROMPT,
    model="gpt-4o",
    output_type=VerificationResult,
)
```

---
**File: `agents/writer_agent.py`**
---
```python
from pydantic import BaseModel

from agents import Agent

# Writer agent brings together the raw search results and optionally calls out
# to sub-analyst tools for specialized commentary, then returns a cohesive markdown report.
WRITER_PROMPT = (
    "You are a senior financial analyst. You will be provided with the original query and "
    "a set of raw search summaries. Your task is to synthesize these into a long-form markdown "
    "report (at least several paragraphs) including a short executive summary and follow-up "
    "questions. If needed, you can call the available analysis tools (e.g. fundamentals_analysis, "
    "risk_analysis) to get short specialist write-ups to incorporate."
)


class FinancialReportData(BaseModel):
    short_summary: str
    """A short 2-3 sentence executive summary."""

    markdown_report: str
    """The full markdown report."""

    follow_up_questions: list[str]
    """Suggested follow-up questions for further research."""


# Note: We will attach handoffs (as tools) to specialist analyst agents at runtime in the manager.
# This demonstrates how an agent can use other agents as tools.
writer_agent = Agent(
    name="FinancialWriterAgent",
    instructions=WRITER_PROMPT,
    model="gpt-4o", # Or a more advanced model like "gpt-4.5-preview" if available
    output_type=FinancialReportData,
)
```

---
**File: `__init__.py` (at project root)**
---
```python
# This file makes the directory a Python package.
# It can be empty.
```

---
**File: `main.py`**
---
```python
import asyncio
import os

# Ensure OPENAI_API_KEY is set in your environment for the SDK to work.
# from dotenv import load_dotenv
# load_dotenv() # If you are using a .env file

from .manager import FinancialResearchManager


# Entrypoint for the financial bot example.
# Run this as `python -m financial_research_project.main` from the parent directory
# or `python main.py` from within `financial_research_project`
# and enter a financial research query, for example:
# "Write up an analysis of Apple Inc.'s most recent quarter."
async def main() -> None:
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable not set.")
        print("Please set it before running the example.")
        return

    query = input("Enter a financial research query: ")
    mgr = FinancialResearchManager()
    await mgr.run(query)


if __name__ == "__main__":
    asyncio.run(main())
```

---
**File: `manager.py`**
---
```python
from __future__ import annotations

import asyncio
import time
from collections.abc import Sequence

from rich.console import Console

from agents import Runner, RunResult, custom_span, gen_trace_id, trace

# Assuming agents are in a sub-package 'agents' relative to this manager.py
from .agents.financials_agent import financials_agent, AnalysisSummary as FinancialsAnalysisSummary
from .agents.planner_agent import FinancialSearchItem, FinancialSearchPlan, planner_agent
from .agents.risk_agent import risk_agent, AnalysisSummary as RiskAnalysisSummary
from .agents.search_agent import search_agent
from .agents.verifier_agent import VerificationResult, verifier_agent
from .agents.writer_agent import FinancialReportData, writer_agent
from .printer import Printer


async def _summary_extractor(run_result: RunResult) -> str:
    """Custom output extractor for sub-agents that return an AnalysisSummary."""
    # The financial/risk analyst agents emit an AnalysisSummary with a `summary` field.
    # We want the tool call to return just that summary text so the writer can drop it inline.
    # This handles cases where AnalysisSummary might be imported from different modules.
    final_output = run_result.final_output
    if hasattr(final_output, 'summary'):
        return str(final_output.summary)
    # Fallback or error handling if summary attribute is not found
    return "Error: Could not extract summary."


class FinancialResearchManager:
    """
    Orchestrates the full flow: planning, searching, sub-analysis, writing, and verification.
    """

    def __init__(self) -> None:
        self.console = Console()
        self.printer = Printer(self.console)

    async def run(self, query: str) -> None:
        trace_id = gen_trace_id()
        with trace("Financial research trace", trace_id=trace_id):
            self.printer.update_item(
                "trace_id",
                f"View trace: https://platform.openai.com/traces/trace?trace_id={trace_id}",
                is_done=True,
                hide_checkmark=True,
            )
            self.printer.update_item("start", "Starting financial research...", is_done=True)
            
            search_plan = await self._plan_searches(query)
            if not search_plan.searches:
                self.printer.update_item("planning", "No search queries planned. Ending research.", is_done=True, hide_checkmark=False)
                self.printer.end()
                print("\n\nNo search queries were planned. Cannot proceed with research.")
                return

            search_results = await self._perform_searches(search_plan)
            if not search_results:
                self.printer.update_item("searching", "No search results obtained. Ending research.", is_done=True, hide_checkmark=False)
                self.printer.end()
                print("\n\nNo search results were obtained. Cannot proceed with research.")
                return

            report = await self._write_report(query, search_results)
            verification = await self._verify_report(report)

            final_report_summary = f"Report summary\n\n{report.short_summary}"
            self.printer.update_item("final_report", final_report_summary, is_done=True)

            self.printer.end()

        # Print to stdout
        print("\n\n=====REPORT=====\n\n")
        print(f"Report:\n{report.markdown_report}")
        print("\n\n=====FOLLOW UP QUESTIONS=====\n\n")
        print("\n".join(report.follow_up_questions))
        print("\n\n=====VERIFICATION=====\n\n")
        print(f"Verified: {verification.verified}")
        if not verification.verified:
            print(f"Issues: {verification.issues}")

    async def _plan_searches(self, query: str) -> FinancialSearchPlan:
        self.printer.update_item("planning", "Planning searches...")
        result = await Runner.run(planner_agent, f"Query: {query}")
        plan = result.final_output_as(FinancialSearchPlan)
        self.printer.update_item(
            "planning",
            f"Will perform {len(plan.searches)} searches",
            is_done=True,
        )
        return plan

    async def _perform_searches(self, search_plan: FinancialSearchPlan) -> Sequence[str]:
        with custom_span("Search the web"):
            self.printer.update_item("searching", "Searching...")
            tasks = [asyncio.create_task(self._search(item)) for item in search_plan.searches]
            results: list[str] = []
            num_completed = 0
            for task in asyncio.as_completed(tasks):
                result = await task
                if result is not None: # Filter out None results from failed searches
                    results.append(result)
                num_completed += 1
                self.printer.update_item(
                    "searching", f"Searching... {num_completed}/{len(tasks)} completed"
                )
            self.printer.mark_item_done("searching")
            return results

    async def _search(self, item: FinancialSearchItem) -> str | None:
        input_data = f"Search term: {item.query}\nReason: {item.reason}"
        try:
            # Ensure search_agent is configured with a tool like WebSearchTool
            result = await Runner.run(search_agent, input_data)
            return str(result.final_output)
        except Exception as e:
            self.printer.update_item(f"search_error_{item.query[:20]}", f"Search failed for '{item.query}': {e}", is_done=True, hide_checkmark=True)
            return None # Return None on failure to allow other searches to proceed

    async def _write_report(self, query: str, search_results: Sequence[str]) -> FinancialReportData:
        # Expose the specialist analysts as tools so the writer can invoke them inline
        # and still produce the final FinancialReportData output.
        fundamentals_tool = financials_agent.as_tool(
            tool_name="fundamentals_analysis",
            tool_description="Use to get a short write-up of key financial metrics based on provided search results.",
            custom_output_extractor=_summary_extractor,
        )
        risk_tool = risk_agent.as_tool(
            tool_name="risk_analysis",
            tool_description="Use to get a short write-up of potential red flags based on provided search results.",
            custom_output_extractor=_summary_extractor,
        )
        
        # Clone the writer_agent to attach these dynamically created tools
        writer_with_tools = writer_agent.clone(tools=[fundamentals_tool, risk_tool])
        
        self.printer.update_item("writing", "Thinking about report...")
        
        # Construct input for the writer agent. It needs the original query and search results.
        # The specialist tools (fundamentals_tool, risk_tool) will implicitly use the same search_results
        # if they are designed to take general context or if their prompts are general enough.
        # For more explicit control, the writer might need to pass specific snippets to these tools.
        # However, the current design of specialist agents takes "a collection of web search results".
        input_data_for_writer = (
            f"Original query: {query}\n\n"
            f"Summarized search results to synthesize:\n"
            f"{chr(10).join(search_results)}" # chr(10) is newline
        )
        
        result_stream = Runner.run_streamed(writer_with_tools, input_data_for_writer)
        
        update_messages = [
            "Planning report structure...",
            "Drafting executive summary...",
            "Incorporating search results...",
            "Calling specialist analyst tools (if needed)...",
            "Synthesizing analysis sections...",
            "Generating follow-up questions...",
            "Finalizing report...",
        ]
        last_update_time = time.time()
        next_message_idx = 0
        
        async for event in result_stream.stream_events():
            # This example just updates status periodically.
            # In a real app, you might parse `event` for more granular progress.
            if time.time() - last_update_time > 3 and next_message_idx < len(update_messages):
                self.printer.update_item("writing", update_messages[next_message_idx])
                next_message_idx += 1
                last_update_time = time.time()
        
        self.printer.mark_item_done("writing")
        return result_stream.final_output_as(FinancialReportData)

    async def _verify_report(self, report: FinancialReportData) -> VerificationResult:
        self.printer.update_item("verifying", "Verifying report...")
        # Pass the markdown report content to the verifier agent
        result = await Runner.run(verifier_agent, report.markdown_report)
        self.printer.mark_item_done("verifying")
        return result.final_output_as(VerificationResult)
```

---
**File: `printer.py`**
---
```python
from typing import Any

from rich.console import Console, Group
from rich.live import Live
from rich.spinner import Spinner


class Printer:
    """
    Simple wrapper to stream status updates. Used by the financial bot
    manager as it orchestrates planning, search and writing.
    """

    def __init__(self, console: Console) -> None:
        self.live = Live(console=console, refresh_per_second=12) # Increased refresh rate
        self.items: dict[str, tuple[str, bool]] = {} # item_id -> (content, is_done)
        self.hide_done_ids: set[str] = set()
        self.live.start(refresh=True)

    def end(self) -> None:
        self.flush() # Ensure final state is rendered
        self.live.stop()

    def hide_done_checkmark(self, item_id: str) -> None:
        self.hide_done_ids.add(item_id)
        self.flush()

    def update_item(
        self, item_id: str, content: str, is_done: bool = False, hide_checkmark: bool = False
    ) -> None:
        self.items[item_id] = (content, is_done)
        if hide_checkmark:
            self.hide_done_ids.add(item_id)
        self.flush()

    def mark_item_done(self, item_id: str) -> None:
        if item_id in self.items:
            self.items[item_id] = (self.items[item_id][0], True)
        else:
            # If item was never added, add it as done.
            self.items[item_id] = ("Completed", True)
        self.flush()

    def flush(self) -> None:
        renderables: list[Any] = []
        for item_id, (content, is_done) in self.items.items():
            if is_done:
                prefix = "✅ " if item_id not in self.hide_done_ids else ""
                renderables.append(prefix + content)
            else:
                renderables.append(Spinner("dots", text=" " + content)) # Added space for spinner
        if not self.live.is_started: # Check if live is started before updating
             self.live.start(refresh=True)
        self.live.update(Group(*renderables), refresh=True)

```

### Architectural Analysis & Key Patterns:

This financial research application showcases several important patterns for building with the OpenAI Agents SDK:

1.  **Manager/Orchestrator Pattern (`manager.py`):**
    *   A central `FinancialResearchManager` class is responsible for the end-to-end workflow.
    *   It defines the sequence of operations: planning -> searching -> writing (with sub-analysis) -> verification.
    *   This pattern is crucial for complex tasks that involve multiple steps and agents.

2.  **Agent Specialization (within `agents/` directory):**
    *   Each agent has a clearly defined role and expertise:
        *   `PlannerAgent`: Generates search queries.
        *   `SearchAgent`: Executes individual web searches.
        *   `FundamentalsAnalystAgent`: Analyzes financial fundamentals.
        *   `RiskAnalystAgent`: Identifies risks.
        *   `FinancialWriterAgent`: Synthesizes information into a report and can delegate to analyst agents.
        *   `VerificationAgent`: Audits the final report.
    *   This modularity makes the system easier to understand, maintain, and extend. Each agent focuses on a specific sub-problem.

3.  **Agent-as-Tool Pattern (`manager.py` -> `_write_report` method):**
    *   The `writer_agent` can leverage other specialized agents (`financials_agent`, `risk_agent`) as tools.
    *   This is achieved by using `agent_instance.as_tool(...)`.
    *   A `custom_output_extractor` can be provided to format the sub-agent's output appropriately for the calling agent (tool user).
    *   This allows for hierarchical agent structures where a primary agent delegates specific analytical tasks.

4.  **Structured Inputs and Outputs (Pydantic Models):**
    *   Most agents define an `output_type` using Pydantic models (e.g., `FinancialSearchPlan`, `AnalysisSummary`, `FinancialReportData`, `VerificationResult`).
    *   This ensures that agents produce predictable, parsable outputs, making inter-agent communication more reliable.
    *   The `Runner` automatically validates and deserializes these outputs.

5.  **Sequential and Parallel Execution (`manager.py`):**
    *   The overall workflow is largely sequential (plan then search then write).
    *   Within the search phase (`_perform_searches`), individual search queries are executed in parallel using `asyncio.gather` or `asyncio.as_completed` for efficiency.

6.  **Context and State Management:**
    *   The `manager.py` implicitly manages state by passing the output of one step as input to the next.
    *   For more complex state shared across non-sequential agent calls or tools, the `context` parameter of `Runner.run()` could be used (not explicitly shown in this example for inter-agent state, but `RunContextWrapper` in the base SDK docs illustrates tool context).

7.  **User Feedback and Progress Tracking (`printer.py`):**
    *   The `Printer` class (using `rich` library) provides real-time updates to the console about the application's progress.
    *   This is important for user experience in long-running agentic processes.
    *   The `Runner.run_streamed()` method is used with the `writer_agent` to allow for progress updates during its execution.

8.  **Error Handling and Resilience (Basic):**
    *   The `_search` method includes a `try-except` block to handle potential failures during individual web searches, allowing the overall process to continue with partial results.
    *   The `VerificationAgent` acts as a form of quality control.
    *   More sophisticated error handling (retries, alternative paths) could be added.

9.  **Tracing and Observability:**
    *   The SDK's built-in tracing (`gen_trace_id`, `trace` decorator, `custom_span`) is used to make the agent's operations observable on the OpenAI platform.

10. **Modularity and Reusability:**
    *   Agents are defined in separate files, promoting reusability.
    *   The `Printer` class is a reusable utility for UI updates.

### When to Use These Patterns:

*   **Complex Workflows:** If your application involves multiple distinct steps or requires different types of AI reasoning, use a manager/orchestrator and specialized agents.
*   **Delegation of Expertise:** If a primary agent needs to consult other "experts" for specific sub-tasks, use the agent-as-tool pattern.
*   **Reliable Data Exchange:** Always use Pydantic models for `output_type` when agents need to produce structured data for other agents or system components.
*   **Long-Running Tasks:** Implement progress tracking and consider streaming if agents perform lengthy operations.
*   **Efficiency:** Use `asyncio` for parallel execution of independent tasks (like multiple searches).

This example provides a solid foundation for Cline to understand how to structure and implement advanced multi-agent systems using the OpenAI Agents SDK.
