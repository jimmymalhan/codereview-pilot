# Agent Orchestration Skill

**Purpose:** Offer a reusable process for designing and validating multi-agent workflows, ensuring safety, clarity, and efficiency.

## When to use
- Creating a new multi-agent pipeline
- Modifying existing agent delegation rules
- Troubleshooting agent confusion or loops

## Process
1. **Define Roles**
   - List each agent and its responsibility.  
   - Specify inputs and outputs for the agent.  
   - Document how agents hand off tasks (memory, messages, tool results).
2. **Memory & State**
   - Decide what information is stored in shared memory.  
   - Set retention policies and cleaning steps.  
   - Avoid storing unnecessary data that could cause confusion.
3. **Tool Usage**
   - Assign tools only when needed; minimize scope.  
   - Make sure each tool call has clear expectations and error handling.
4. **Retry & Failure Handling**
   - Establish how agents retry failed subtasks.  
   - Create timeouts or maximum attempt counts.  
   - Decide who notifies humans when retries fail.
5. **Human Override**
   - Provide a mechanism to stop or redirect agents (e.g., a review checkpoint).  
   - Document conditions that trigger human intervention.
6. **Proof & Testing**
   - Write tests that simulate inter-agent communication.  
   - Include failure-injection tests for network errors or tool failures.  
   - Capture logs of agent interactions for debugging.

## Verification
- `agentic-ai-engineer` confirms the workflow is logically sound.  
- `qa-engineer` and `test-automation-engineer` ensure tests cover coordination cases.  
- `code-reviewer` checks for unnecessary complexity or duplication.  

## Learning
- If agents become stuck or miscommunicate, add checks to prevent recurrence and document the fix in `docs/PROJECT_STATUS.md`.
