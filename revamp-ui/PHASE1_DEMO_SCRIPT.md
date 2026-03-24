Phase 1 Demo Script

Purpose: Show Phase 1 canonical flows powered by token-driven UI kit in a single preview shell.

Overview:

- Flows included: Search/Discovery, Profile/Settings, Content Discovery, Notifications
- Visuals driven by design tokens (colors, spacing, elevations)
- Accessibility: keyboard nav, ARIA labels verified

Demo steps:

1. Open Phase 1 Preview shell (Phase1Preview component)
2. Interact with SearchDiscovery: type query, click Search, view results
3. Open ProfileSettings: modify Name and Email, click Save
4. Open ContentDiscovery: view recommended items
5. Open Notifications: verify dismiss buttons, verify visual tokens
6. Trigger Phase 2 migration note in design docs (if applicable)

Expected outcomes:

- All flows render without errors and comply with token-driven styles
- Keyboard navigation works across inputs and buttons
- Visual consistency across flows via tokens

Notes:

- Phase 1 pre-reqs: Storybook stories for new components should be present; Phase 1 Preview composes flows from Phase 1 components
- This script is a living document; update after rehearsal demos.
