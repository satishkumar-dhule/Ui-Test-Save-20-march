# Revamp UI Kit (Draft)

This directory contains a lightweight, token-driven UI kit to start the 30-person UI/UX revamp.

- Tokens: revamp-ui/design-tokens.json
- Global styles: revamp-ui/styles/global.css
- Core components: revamp-ui/src/Button.tsx
- Export: revamp-ui/index.js

Usage snippet:

```
import { Button } from 'revamp-ui';
<Button label="Get started" onClick={() => {}} />
```

This is a scaffold to bootstrap fast; we will integrate it with the main app via a persistent design system layer.
