# Notebook flow and diagram audit — 30 September 2026

Reviewed all **16 paths and 371 lessons/introductions**: 347 programming/engineering lessons, 18 Finance lessons and six Finance introductions. Also reviewed supporting teaching/practice notes, Finance foundation explainers, advanced additions, the month-end case, and printable packs. This is a visual-representation audit of the existing material, not a new claim of production mastery or current regulatory certification.

Added **113 diagrams**: 104 across the general catalog and nine Finance maps. The notebook now has **129 Mermaid-backed concept diagrams**, alongside the existing 27 concrete interactive explorers. A diagram is added where relationships, decisions, dependencies or state transitions benefit from one. Code, commands, numerical fixtures, compact tables, equations and precise protocol examples remain text.

| Path | Lessons / introductions reviewed | Diagram definitions after audit |
|---|---:|---:|
| Agent Harnesses | 24 | 9 |
| AI Agents | 24 | 8 |
| Application Security | 21 | 8 |
| C# & .NET | 24 | 6 |
| Data Structures & Algorithms | 21 | 7 |
| Delivery & Operations | 24 | 9 |
| Design Patterns | 24 | 12 |
| Financial foundations | 24 | 9 |
| Git & Team Workflows | 20 | 6 |
| React | 22 | 5 |
| Kubernetes | 24 | 9 |
| Networking & the Web | 24 | 10 |
| Python | 23 | 9 |
| SQL Server | 24 | 7 |
| System Design | 24 | 8 |
| Testing & Debugging | 24 | 7 |

Detailed decisions: [language and application paths](visual-audit-languages.md), [systems paths](visual-audit-systems.md), [workflow paths](visual-audit-workflows.md), [Finance](visual-audit-finance.md).

## Presentation and preservation

- Explicit `textExampleSections` metadata identifies conceptual arrow/ASCII examples. Those examples gain a direct diagram jump and remain available under “Read the original flow as text.” No syntax-based automatic conversion is used.
- Mixed examples containing a real JSON envelope remain directly visible. Executable examples and commands are preserved.
- Existing interactive traces now remain visible when a lesson also has a diagram; previously the diagram suppressed the trace.
- Finance maps appear beside relevant lessons and in the complete handbook with expanded text alternatives. Sources and dated scope qualifications remain in the teaching.
- Standalone practice notes link to the matching notebook visual while retaining offline text traces. A Markdown file and practice ZIP do not execute the notebook renderer.
- Mermaid source/SVG downloads, keyboard scrolling, fit-to-screen, step highlights, text alternatives and printable content remain available. These new conceptual maps are static; the existing motion explorers retain opt-in playback and reduced-motion behavior.

## Independent review corrections

Corrected deferred LINQ execution, React state-to-input direction, local Unit of Work atomicity limitations, separate SQL orphan detection from raw payments, and separate async success/cancellation cleanup outcomes.

## Verification

All 120 general-course diagram routes and all nine Finance maps rendered in the browser at desktop and 390px phone width without page overflow. Finance's full handbook rendered all nine maps. Checked diagram stepping, flow jump controls, fit-to-screen and preserved text. Automated checks cover graph IDs/edges/step references, source escaping, original flow preservation, code visibility, Finance text alternatives, route/jump integrity and trace coexistence. The full notebook regression suite, reproducible practice bundles and production static build are required before publication.
