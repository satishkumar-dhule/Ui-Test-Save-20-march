# Keyboard Navigation Patterns v2

## Overview

Comprehensive keyboard navigation patterns for all UI components following WAI-ARIA Authoring Practices 1.2.

---

## General Principles

### Tab Navigation

1. **Tab key**: Move focus forward through interactive elements
2. **Shift+Tab**: Move focus backward through interactive elements
3. **Tabindex order**: Follows DOM order (no positive tabindex values)
4. **Skip links**: First focusable elements on page

### Focus Visibility

All interactive elements must have visible focus indicators:

```css
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}
```

---

## Button

### Standard Button

**Role**: `button`

**Keyboard Interactions**:

| Key | Action |
|-----|--------|
| Enter | Activate button |
| Space | Activate button |

**Implementation**:

```tsx
<button type="button">
  Click me
</button>
```

### Toggle Button

**Role**: `button`  
**Required**: `aria-pressed`

**Keyboard Interactions**:

| Key | Action |
|-----|--------|
| Enter | Toggle state |
| Space | Toggle state |

**Implementation**:

```tsx
<button 
  type="button"
  aria-pressed={isPressed}
  onClick={() => setIsPressed(!isPressed)}
>
  {isPressed ? 'On' : 'Off'}
</button>
```

### Icon Button

**Keyboard Interactions**:

| Key | Action |
|-----|--------|
| Enter | Activate |
| Space | Activate |

**Implementation**:

```tsx
<button type="button" aria-label="Close dialog">
  <CloseIcon aria-hidden="true" />
</button>
```

---

## Link

**Role**: `link` (implicit)

**Keyboard Interactions**:

| Key | Action |
|-----|--------|
| Enter | Navigate to link |

**Implementation**:

```tsx
<a href="/path">Link text</a>
```

---

## Checkbox

**Role**: `checkbox` (implicit)

**Keyboard Interactions**:

| Key | Action |
|-----|--------|
| Space | Toggle checked/unchecked |

**Implementation**:

```tsx
<label>
  <input type="checkbox" />
  Label text
</label>
```

### Indeterminate Checkbox

**Required**: `aria-checked="mixed"`

```tsx
<input
  type="checkbox"
  aria-checked={isIndeterminate ? 'mixed' : ischecked}
  onChange={handleChange}
/>
```

---

## Radio Group

**Role**: `radiogroup` or `group`

**Keyboard Interactions**:

| Key | Action |
|-----|--------|
| Arrow Up/Left | Select previous radio |
| Arrow Down/Right | Select next radio |
| Space | Select current radio |

**Implementation**:

```tsx
<div role="radiogroup" aria-labelledby="group-label">
  <div id="group-label">Choose option:</div>
  
  <label>
    <input type="radio" name="option" value="1" />
    Option 1
  </label>
  
  <label>
    <input type="radio" name="option" value="2" />
    Option 2
  </label>
</div>
```

---

## Text Input

**Keyboard Interactions**:

| Key | Action |
|-----|--------|
| Character keys | Insert text |
| Backspace | Delete character |
| Delete | Delete character |
| Arrow keys | Move cursor |
| Home | Move to start |
| End | Move to end |

**Implementation**:

```tsx
<label htmlFor="input-id">Label</label>
<input id="input-id" type="text" />
```

---

## Select (Dropdown)

**Keyboard Interactions**:

| Key | Action |
|-----|--------|
| Enter | Open dropdown |
| Space | Open dropdown |
| Arrow Down | Select next option |
| Arrow Up | Select previous option |
| Enter | Select option |
| Escape | Close dropdown |

**Implementation**:

```tsx
<label htmlFor="select-id">Choose option</label>
<select id="select-id">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

---

## Tabs

**Role**: `tablist`, `tab`, `tabpanel`

**Keyboard Interactions**:

| Key | Action |
|-----|--------|
| Arrow Left | Select previous tab |
| Arrow Right | Select next tab |
| Home | Select first tab |
| End | Select last tab |
| Enter | Activate tab (if needed) |
| Space | Activate tab (if needed) |
| Delete | Delete tab (if allowed) |

**Implementation**:

```tsx
<div role="tablist" aria-label="Content tabs">
  <button
    role="tab"
    aria-selected={activeTab === 0}
    aria-controls="panel-0"
    id="tab-0"
  >
    Tab 1
  </button>
  
  <button
    role="tab"
    aria-selected={activeTab === 1}
    aria-controls="panel-1"
    id="tab-1"
    tabIndex={activeTab === 1 ? 0 : -1}
  >
    Tab 2
  </button>
</div>

<div
  role="tabpanel"
  id="panel-0"
  aria-labelledby="tab-0"
  hidden={activeTab !== 0}
>
  Content 1
</div>

<div
  role="tabpanel"
  id="panel-1"
  aria-labelledby="tab-1"
  hidden={activeTab !== 1}
>
  Content 2
</div>
```

---

## Menu / Menu Bar

**Role**: `menu`, `menuitem`, `menubar`

**Keyboard Interactions**:

| Key | Action |
|-----|--------|
| Arrow Down | Select next item |
| Arrow Up | Select previous item |
| Arrow Right | Open submenu |
| Arrow Left | Close submenu |
| Home | Select first item |
| End | Select last item |
| Enter | Activate item |
| Space | Activate item |
| Escape | Close menu |

**Implementation**:

```tsx
<div role="menu" aria-label="Actions">
  <button role="menuitem">Action 1</button>
  <button role="menuitem">Action 2</button>
  
  <div role="menuitem" aria-haspopup="true" aria-expanded={isOpen}>
    More Actions
    <div role="menu">
      <button role="menuitem">Sub Action 1</button>
      <button role="menuitem">Sub Action 2</button>
    </div>
  </div>
</div>
```

---

## Dialog / Modal

**Role**: `dialog` or `alertdialog`

**Keyboard Interactions**:

| Key | Action |
|-----|--------|
| Tab | Navigate forward within dialog |
| Shift+Tab | Navigate backward within dialog |
| Escape | Close dialog (if allowed) |

**Implementation**:

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-desc"
>
  <h2 id="dialog-title">Dialog Title</h2>
  <p id="dialog-desc">Description text</p>
  
  <button>OK</button>
  <button>Cancel</button>
</div>
```

**Focus Management**:

1. Move focus to dialog when opened
2. Trap focus within dialog
3. Return focus to trigger element on close

---

## Disclosure / Accordion

**Role**: `button` (expanded triggers)

**Keyboard Interactions**:

| Key | Action |
|-----|--------|
| Enter | Toggle disclosure |
| Space | Toggle disclosure |

**Implementation**:

```tsx
<h3>
  <button
    aria-expanded={isOpen}
    aria-controls="content-1"
  >
    Section Title
  </button>
</h3>

<div id="content-1" hidden={!isOpen}>
  Content here
</div>
```

---

## Tooltip

**Role**: `tooltip`

**Keyboard Interactions**:

| Key | Action |
|-----|--------|
| Focus trigger | Show tooltip |
| Blur trigger | Hide tooltip |
| Escape | Hide tooltip |

**Implementation**:

```tsx
<div className="tooltip-container">
  <button
    aria-describedby="tooltip-1"
    onFocus={() => setShowTooltip(true)}
    onBlur={() => setShowTooltip(false)}
  >
    Hover or focus me
  </button>
  
  <div
    id="tooltip-1"
    role="tooltip"
    hidden={!showTooltip}
  >
    Tooltip content
  </div>
</div>
```

---

## Listbox

**Role**: `listbox`, `option`

**Keyboard Interactions**:

| Key | Action |
|-----|--------|
| Arrow Down | Select next option |
| Arrow Up | Select previous option |
| Home | Select first option |
| End | Select last option |
| Enter | Select option |
| Space | Select option |
| Shift+Arrow | Extend selection |
| Ctrl+Arrow | Move focus without selection |

**Implementation**:

```tsx
<div
  role="listbox"
  aria-label="Choose items"
  aria-multiselectable="true"
>
  <div role="option" aria-selected="true">Option 1</div>
  <div role="option" aria-selected="false">Option 2</div>
  <div role="option" aria-selected="false">Option 3</div>
</div>
```

---

## Combobox

**Role**: `combobox`, `listbox`

**Keyboard Interactions**:

| Key | Action |
|-----|--------|
| Arrow Down | Open listbox / select next |
| Arrow Up | Select previous |
| Enter | Select option |
| Escape | Close listbox |
| Home | Move to start |
| End | Move to end |

**Implementation**:

```tsx
<div role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
  <input
    type="text"
    aria-autocomplete="list"
    aria-controls="listbox-1"
    aria-activedescendant={activeId}
  />
  
  <div id="listbox-1" role="listbox" hidden={!isOpen}>
    <div id="option-1" role="option">Option 1</div>
    <div id="option-2" role="option">Option 2</div>
  </div>
</div>
```

---

## Tree View

**Role**: `tree`, `treeitem`, `group`

**Keyboard Interactions**:

| Key | Action |
|-----|--------|
| Arrow Down | Select next item |
| Arrow Up | Select previous item |
| Arrow Right | Expand node |
| Arrow Left | Collapse node / move to parent |
| Home | Select first item |
| End | Select last item |
| Enter | Activate item |
| Space | Select item |

**Implementation**:

```tsx
<div role="tree" aria-label="File tree">
  <div role="treeitem" aria-expanded="true">
    Folder 1
    <div role="group">
      <div role="treeitem">File 1</div>
      <div role="treeitem">File 2</div>
    </div>
  </div>
  <div role="treeitem">File 3</div>
</div>
```

---

## Carousel

**Role**: `region` with `aria-roledescription="carousel"`

**Keyboard Interactions**:

| Key | Action |
|-----|--------|
| Tab | Navigate to carousel controls |
| Arrow Left | Previous slide |
| Arrow Right | Next slide |

**Implementation**:

```tsx
<div
  role="region"
  aria-roledescription="carousel"
  aria-label="Featured content"
>
  <div aria-live="polite">
    <div>Slide 1 content</div>
  </div>
  
  <button aria-label="Previous slide">←</button>
  <button aria-label="Next slide">→</button>
  
  <div role="tablist" aria-label="Slide navigation">
    <button role="tab" aria-selected="true" aria-label="Slide 1">•</button>
    <button role="tab" aria-selected="false" aria-label="Slide 2">•</button>
  </div>
</div>
```

---

## Table

**Role**: `table`, `row`, `cell`, `columnheader`, `rowheader`

**Keyboard Interactions**:

| Key | Action |
|-----|--------|
| Tab | Navigate to table |
| Arrow keys | Navigate cells |

**Implementation**:

```tsx
<table role="table" aria-label="Data table">
  <thead>
    <tr role="row">
      <th role="columnheader">Header 1</th>
      <th role="columnheader">Header 2</th>
    </tr>
  </thead>
  <tbody>
    <tr role="row">
      <td role="cell">Cell 1</td>
      <td role="cell">Cell 2</td>
    </tr>
  </tbody>
</table>
```

---

## Slider / Range

**Role**: `slider`

**Keyboard Interactions**:

| Key | Action |
|-----|--------|
| Arrow Right/Up | Increase value |
| Arrow Left/Down | Decrease value |
| Home | Set to minimum |
| End | Set to maximum |
| Page Up | Increase by large step |
| Page Down | Decrease by large step |

**Implementation**:

```tsx
<input
  type="range"
  role="slider"
  aria-label="Volume"
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={50}
  min={0}
  max={100}
  value={50}
  onChange={handleChange}
/>
```

---

## Progress / Loading

**Role**: `progressbar`

**Keyboard Interactions**: None (informational)

**Implementation**:

```tsx
<div
  role="progressbar"
  aria-valuenow={75}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Loading progress"
>
  75% complete
</div>
```

---

## Alert

**Role**: `alert` (for immediate attention)

**Keyboard Interactions**: None

**Implementation**:

```tsx
<div role="alert">
  Error message that requires attention
</div>
```

---

## Status / Live Region

**Role**: `status`

**Keyboard Interactions**: None

**Implementation**:

```tsx
<div role="status" aria-live="polite">
  Status update message
</div>
```

---

## Skip Links

**Implementation**:

```tsx
<nav aria-label="Skip links">
  <a href="#main-content" className="skip-link">
    Skip to main content
  </a>
  <a href="#navigation" className="skip-link">
    Skip to navigation
  </a>
</nav>
```

**CSS**:

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px 16px;
  z-index: 9999;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 0;
}
```

---

## Utilities

### Creating Roving Tabindex

```typescript
import { createRovingTabIndex } from '@/utils/a11y-v2';

const roving = createRovingTabIndex(container, '[role="option"]', {
  horizontal: false,
  vertical: true,
  wrap: true,
  onSelect: (item, index) => {
    console.log(`Selected item ${index}`);
  },
});

// Cleanup
roving.destroy();
```

### Creating Focus Trap

```typescript
import { createFocusTrap } from '@/utils/a11y-v2';

const cleanup = createFocusTrap(modalElement);

// Cleanup when modal closes
cleanup();
```

### Creating Keyboard Shortcuts

```typescript
import { createKeyboardShortcuts } from '@/utils/a11y-v2';

const cleanup = createKeyboardShortcuts({
  'ctrl+s': (event) => {
    event.preventDefault();
    saveDocument();
  },
  'escape': () => {
    closeModal();
  },
});

// Cleanup
cleanup();
```

---

## Testing

### Manual Testing Checklist

- [ ] All interactive elements reachable via Tab
- [ ] Tab order follows visual order
- [ ] Focus indicator visible on all elements
- [ ] All functionality available via keyboard
- [ ] No keyboard traps
- [ ] Skip links work correctly
- [ ] Modal focus contained
- [ ] Modal focus returns on close
- [ ] Custom keyboard shortcuts documented

### Automated Testing

```typescript
import { runAccessibilityAudit } from '@/utils/a11y-testing';

const report = runAccessibilityAudit(document.body);
console.log('Audit Score:', report.summary.score);
console.log('Issues:', report.categories.focusManagement.issues);
```

---

## Resources

- [WAI-ARIA Authoring Practices 1.2](https://www.w3.org/WAI/ARIA/apg/patterns/)
- [ARIA Practices - Keyboard](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
- [Inclusive Components](https://inclusive-components.design/)

---

**Maintained by**: ACCESSIBILITY_CHAMPION (Chris Lee)  
**Last Updated**: 2026-03-22