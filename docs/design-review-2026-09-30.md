# Learning Notebook — design review and implementation

Reviewed the library → Kubernetes overview → visual lesson journey, with desktop, 820px tablet and 390px phone previews. The existing site was functional but visually repetitive, with an undifferentiated overview and interactive examples buried below setup material.

1. **Library — improved.** More distinct typography, folded-tab feature panel with real lesson links, and a direct map jump. The existing map, filters, list view, resume state and backup workflow remain. This is a personal notebook, not a promotional course marketplace.

2. **Course overview — improved.** The course cover now shows a three-stage route and progress beside its description. Each stage button moves focus and scrolls to its curriculum section. A visual-exploration shelf exposes the existing interactive lessons. Files remain directly available.

3. **Reading — improved.** Desktop section navigation links explanations, interactive exploration, practice and checkpoints. Phone navigation collapses to avoid displacing the title. Section jumps move focus. Long code and diagrams scroll locally.

4. **Responsive and accessibility checks — passed within scope.** No page-wide overflow in sampled desktop/tablet/phone views. Stage, map and lesson jumps exercised; visual entry link checked. Representative new text contrast pairs measured 5.92:1–12.89:1. Native buttons, details, progress and existing labels retained. Browser error log empty. Complete notebook verification checks 18,595 links and all generated routes and jump targets. This is not a screen-reader certification or an exhaustive audit of every original page.

## Direction and research

Physical scene: a developer returning to personal study in a short evening break, on a laptop at a desk or a phone nearby; the page should be inviting but comfortable for sustained reading. Restrained green neutrals, forest ink, pale leaf surfaces and small lime accents; system sans for controls/body, Georgia for cover and reading titles. No external font dependency, generated decorative imagery, or animation that blocks reading.

Inspected [roadmap.sh](https://roadmap.sh/) for direct topic discovery and learning routes and [Brilliant](https://brilliant.org/) for foregrounding a concrete concept. The notebook keeps its own content, composition, personal progress and file workflow. No competitor assets copied.

The dedicated financial course retains its existing bespoke layout. The revised cover, reading rail and interactive shelf apply to the generic course renderer.
