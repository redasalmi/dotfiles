# Prompt Engineering Sources and Applied Decisions

This provenance file is intentionally separate so routine enhancement does not consume context.

**Last source verification:** 2026-08-16. Provider/model prompting guidance is fast-moving; re-verify it for model-specific revisions instead of assuming advice transfers between model generations.

## OpenAI and Codex

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
  - Separate instructions, examples, and context with clear Markdown or XML structure.
  - Define behavior, rules, examples, and supporting context according to need.
- [Reasoning best practices](https://developers.openai.com/api/docs/guides/reasoning-best-practices)
  - Use simple, direct prompts, explicit end goals and constraints, and clear delimiters.
  - Avoid chain-of-thought requests; try zero-shot first and add closely aligned examples only when needed.
- [Prompt guidance](https://developers.openai.com/api/docs/guides/prompt-guidance)
  - Repeated instructions, unnecessary examples, and irrelevant tools increase token cost and can reduce performance.
  - Preserve user-visible outcomes, success criteria, evidence/permission constraints, required output, and stop behavior while removing low-value detail.
- [Prompting for Codex](https://developers.openai.com/codex/prompting)
  - Useful task prompts identify goal, relevant context, output, and boundaries.
  - Use only the parts that help; start with the result and add boundaries where an unintended action would create work or risk.
- [ChatGPT Enterprise Prompting Guide](https://developers.openai.com/cookbook/examples/chatgpt/chatgpt_prompt_guide/chatgpt_prompt_guide)
  - Clarify the single output, audience, format, constraints, and what “good” means; use simple headings and iterate based on observed gaps.

**Applied:** use a lean goal/context/constraints/output structure, avoid chain-of-thought rituals, preserve only behavior-changing content, and add explicit permission boundaries for agentic side effects.

## Anthropic

- [Prompt engineering overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
  - Establish success criteria and a way to test them before tuning prompts; prompting is not the solution to every model/system failure.
- [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
  - Clear/direct instructions, relevant examples, role/context, and XML structure can improve reliability for complex inputs.
- [Reduce hallucinations](https://docs.anthropic.com/en/docs/test-and-evaluate/strengthen-guardrails/reduce-hallucinations)
  - Permit uncertainty, ground claims in provided material, and use quotes/citations when auditability matters.

**Applied:** add success criteria and grounding where useful, use XML only for genuinely complex boundaries, and never force unsupported certainty.

## Google

- [Prompt design strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies)
  - Give clear and specific instructions, relevant context, representative examples, and an explicit output format.
  - Break complex work into manageable goals and iterate prompts against results.
- [Gemini prompting guidance](https://ai.google.dev/gemini-api/docs/generate-content/gemini-3)
  - Modern reasoning models benefit from concise, precise instructions and can be hindered by verbose legacy prompt rituals.

**Applied:** make deliverables concrete, use examples selectively, and avoid “mega-prompt” ceremony.

## Pi and Agent Skills

- Pi [`skills.md`](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md) and the [Agent Skills specification](https://agentskills.io/specification)
  - Skills use progressive disclosure: short discovery metadata, focused instructions loaded on demand, and references loaded only when needed.

**Applied:** the skill keeps operational guidance in `SKILL.md` and provenance here, so source detail does not bloat every model turn. For Pi-specific prompts, use the installed Pi version's local documentation as authoritative when it differs from upstream.
