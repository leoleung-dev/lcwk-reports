# Codex Agent Guide

## Documentation hygiene
- After every change, update documentation in `documentations/` (usually `documentations/overview.md`) to reflect new routes, APIs, data tables, or workflows.
- Mention the doc updates explicitly in the final response.

## Schema changes
- Whenever you change the database schema, include a copy/paste SQL block for *only the new additions* that I can run in a SQL editor.
- Present it as a short "schema add-ons" section in your final response.
- Also record the change in `documentations/overview.md` under the data model or a schema add-ons section.
