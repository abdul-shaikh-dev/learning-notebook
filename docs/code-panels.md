# Code presentation

Shared code panels use locally bundled Highlight.js 11.11.1 (BSD-3-Clause). The browser never fetches a CDN or executes the examples. Vendored files come from @highlightjs/cdn-assets@11.11.1: highlight.min.js plus PowerShell and Dockerfile grammars. License: assets/vendor/highlight-LICENSE.txt.

The renderer preserves pre.textContent verbatim for copying and highlights escaped tokens. A conservative syntax classifier distinguishes source, terminal commands and structured data from prose/calculations. Plain text remains a labelled, copyable example. Folder layouts retain their existing presentation.

Authors can override detection with data-language on pre/code or a language-python (etc.) class on code. Supported labels include Python, C#, JavaScript, TypeScript, SQL, Terminal, PowerShell, YAML, JSON, HTML/XML, CSS, Dockerfile and TOML/INI. Use language-plaintext for explanatory output or pseudocode.

The panel provides keyboard scrolling, an optional Wrap lines toggle, copy status and a readable print layout. Use node tests/code-panels.cjs for highlighting, escaping, content preservation and classification checks.
