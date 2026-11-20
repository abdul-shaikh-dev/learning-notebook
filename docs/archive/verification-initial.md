# Verification — 26 September 2026

- 53 focused arithmetic, content-completeness and local-link checks passed using `node verify.cjs`.
- JavaScript syntax checks passed.
- Browser checks exercised all seven labs, long/short signs, stale/missing evidence, recovery after a missing price, invalid same-source offsets, the three hierarchy outcomes, the uncertainty direction and capital-ratio calculation.
- Quiz feedback, completion persistence across reload, glossary search/no-result state and worked case answers were checked in the browser.
- The expanded handbook rendered all 18 lessons plus reference sections without browser errors.
- The narrow layout was inspected at a 390px viewport; no document-level horizontal overflow was observed. Navigation scrolls horizontally by design.
- The optional read-only lesson tool returned valid content and rejected an invalid lesson number.
- Independent review checked financial definitions, regulatory caveats, signs and example arithmetic. Two technical wording corrections were incorporated.

The browser checks used a local HTTP preview. The automated browser does not permit `file:` navigation, so direct double-click opening was not browser-tested. The delivered app uses local classic scripts and styles, without fetch, imports, remote fonts, remote images or external runtime dependencies. Source references need internet access; the learning content does not.

Print styles and a full expanded handbook are provided. No pre-rendered PDF is included. Browser storage availability and persistence can vary for local files; export/restore controls provide a portable backup route. Export/restore file-picker interaction was not part of the browser checks.

These checks validate the educational examples and interface, not a production valuation or regulatory implementation. The guide identifies its modelling simplifications and source editions.
