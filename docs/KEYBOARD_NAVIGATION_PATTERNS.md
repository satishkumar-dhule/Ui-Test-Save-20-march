# Keyboard Navigation Patterns for DevPrep UI

**Date:** 2026-03-22  
**Author:** Robert Kim (ACCESSIBILITY_ENGINEER)  
**Purpose:** Comprehensive keyboard navigation patterns for WCAG 2.1 AA compliance

## 1. Tab Navigation (Basic)

### Standard Tab Order

```typescript
// Tab through interactive elements in DOM order
document.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    // Let browser handle tab navigation
    return;
  }
});
```

### Skip Navigation Link

```tsx
// Add to every page before main content
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// Target element
<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

### Focus Management

```typescript
// Utility to manage focus
export function manageFocus(element: HTMLElement | null) {
  if (!element) return;

  // Set tabindex for focusability
  element.setAttribute("tabindex", "-1");

  // Focus the element
  element.focus();

  // Optionally scroll into view
  element.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
```

## 2. Composite Widget Navigation

### Tabs Pattern

```tsx
function TabContainer() {
  const [activeTab, setActiveTab] = useState(0);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const tabCount = tabsRef.current.length;

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        const nextTab = (index + 1) % tabCount;
        setActiveTab(nextTab);
        tabsRef.current[nextTab]?.focus();
        break;

      case "ArrowLeft":
        e.preventDefault();
        const prevTab = (index - 1 + tabCount) % tabCount;
        setActiveTab(prevTab);
        tabsRef.current[prevTab]?.focus();
        break;

      case "Home":
        e.preventDefault();
        setActiveTab(0);
        tabsRef.current[0]?.focus();
        break;

      case "End":
        e.preventDefault();
        setActiveTab(tabCount - 1);
        tabsRef.current[tabCount - 1]?.focus();
        break;
    }
  };

  return (
    <div role="tablist" aria-label="Content tabs">
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={(el) => (tabsRef.current[index] = el)}
          role="tab"
          aria-selected={activeTab === index}
          aria-controls={`tabpanel-${tab.id}`}
          tabIndex={activeTab === index ? 0 : -1}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onClick={() => setActiveTab(index)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

### Menu Pattern

```tsx
function DropdownMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const menuItemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
        setTimeout(() => menuItemsRef.current[0]?.focus(), 0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          Math.min(prev + 1, menuItemsRef.current.length - 1),
        );
        menuItemsRef.current[activeIndex + 1]?.focus();
        break;

      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        menuItemsRef.current[activeIndex - 1]?.focus();
        break;

      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        menuItemsRef.current[0]?.focus();
        break;

      case "End":
        e.preventDefault();
        setActiveIndex(menuItemsRef.current.length - 1);
        menuItemsRef.current[menuItemsRef.current.length - 1]?.focus();
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        // Return focus to trigger button
        break;

      case "Enter":
      case " ":
        e.preventDefault();
        // Handle item selection
        break;
    }
  };

  return (
    <div onKeyDown={handleMenuKeyDown}>
      <button
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        Menu
      </button>

      {isOpen && (
        <div role="menu">
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              ref={(el) => (menuItemsRef.current[index] = el)}
              role="menuitem"
              tabIndex={activeIndex === index ? 0 : -1}
              onClick={() => handleItemClick(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Listbox Pattern

```tsx
function ChannelSelector() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const listboxRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleListboxKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setSelectedIndex((prev) => Math.min(prev + 1, channels.length - 1));
          optionRefs.current[selectedIndex + 1]?.focus();
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (isOpen) {
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          optionRefs.current[selectedIndex - 1]?.focus();
        }
        break;

      case "Home":
        e.preventDefault();
        if (isOpen) {
          setSelectedIndex(0);
          optionRefs.current[0]?.focus();
        }
        break;

      case "End":
        e.preventDefault();
        if (isOpen) {
          setSelectedIndex(channels.length - 1);
          optionRefs.current[channels.length - 1]?.focus();
        }
        break;

      case "Enter":
      case " ":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          // Select current item
          setIsOpen(false);
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  return (
    <div>
      <button
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="channel-label"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleListboxKeyDown}
      >
        {channels[selectedIndex]?.name}
      </button>

      {isOpen && (
        <div
          ref={listboxRef}
          role="listbox"
          aria-labelledby="channel-label"
          aria-activedescendant={`channel-option-${selectedIndex}`}
          tabIndex={-1}
          onKeyDown={handleListboxKeyDown}
        >
          {channels.map((channel, index) => (
            <div
              key={channel.id}
              ref={(el) => (optionRefs.current[index] = el)}
              role="option"
              id={`channel-option-${index}`}
              aria-selected={index === selectedIndex}
              tabIndex={index === selectedIndex ? 0 : -1}
              onClick={() => {
                setSelectedIndex(index);
                setIsOpen(false);
              }}
            >
              {channel.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 3. Modal Dialog Patterns

### Focus Trap Implementation

```typescript
export function trapFocus(element: HTMLElement): () => void {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  const focusableElements = Array.from(
    element.querySelectorAll<HTMLElement>(focusableSelectors)
  ).filter(el => {
    return el.offsetWidth > 0 && el.offsetHeight > 0;
  });

  if (focusableElements.length === 0) return () => {};

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown);

  // Focus first element
  firstElement.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

// Usage in modal component
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Setup focus trap
      const cleanup = trapFocus(modalRef.current!);

      return () => {
        cleanup();
        // Return focus
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}
```

### Modal with Focus Management

```tsx
function SearchModal({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Auto-focus input
      setTimeout(() => inputRef.current?.focus(), 0);

      // Setup focus trap
      const cleanup = trapFocus(modalRef.current!);
      return cleanup;
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-dialog-title"
      className="modal"
      onKeyDown={handleKeyDown}
    >
      <h2 id="search-dialog-title" className="sr-only">
        Search Content
      </h2>

      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        aria-label="Search query"
        aria-describedby="search-instructions"
      />

      <div id="search-instructions" className="sr-only">
        Type to search content. Use arrow keys to navigate results.
      </div>

      <button onClick={onClose} aria-label="Close search">
        ×
      </button>
    </div>
  );
}
```

## 4. Form Controls

### Radio Group Pattern

```tsx
function RadioGroup({ name, options, value, onChange }) {
  const [focusIndex, setFocusIndex] = useState(0);
  const radioRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        const nextIndex = (index + 1) % options.length;
        setFocusIndex(nextIndex);
        radioRefs.current[nextIndex]?.focus();
        onChange(options[nextIndex].value);
        break;

      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        const prevIndex = (index - 1 + options.length) % options.length;
        setFocusIndex(prevIndex);
        radioRefs.current[prevIndex]?.focus();
        onChange(options[prevIndex].value);
        break;
    }
  };

  return (
    <div role="radiogroup" aria-labelledby="group-label">
      <div id="group-label" className="sr-only">
        Select an option
      </div>

      {options.map((option, index) => (
        <label key={option.value} className="radio-label">
          <input
            ref={(el) => (radioRefs.current[index] = el)}
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            tabIndex={index === focusIndex ? 0 : -1}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
```

### Checkbox Group Pattern

```tsx
function CheckboxGroup({ checkboxes, values, onChange }) {
  const handleKeyDown = (e: React.KeyboardEvent, checkbox) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const newValues = values.includes(checkbox.value)
        ? values.filter((v) => v !== checkbox.value)
        : [...values, checkbox.value];
      onChange(newValues);
    }
  };

  return (
    <div role="group" aria-labelledby="checkbox-group-label">
      <div id="checkbox-group-label" className="sr-only">
        Select all that apply
      </div>

      {checkboxes.map((checkbox) => (
        <label key={checkbox.value} className="checkbox-label">
          <input
            type="checkbox"
            checked={values.includes(checkbox.value)}
            onChange={() => {
              const newValues = values.includes(checkbox.value)
                ? values.filter((v) => v !== checkbox.value)
                : [...values, checkbox.value];
              onChange(newValues);
            }}
            onKeyDown={(e) => handleKeyDown(e, checkbox)}
          />
          {checkbox.label}
        </label>
      ))}
    </div>
  );
}
```

## 5. Carousel/Slider Patterns

### Horizontal Scroll Navigation

```tsx
function HorizontalCarousel({ items }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  const scrollLeft = () => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollLeft();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollRight();
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll, { passive: true });
      checkScroll();
      return () => container.removeEventListener("scroll", checkScroll);
    }
  }, []);

  return (
    <div className="carousel-container">
      <button
        onClick={scrollLeft}
        disabled={!canScrollLeft}
        aria-label="Scroll left"
        className={!canScrollLeft ? "opacity-50" : ""}
      >
        ←
      </button>

      <div
        ref={containerRef}
        className="carousel-items"
        role="region"
        aria-label="Content carousel"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {items.map((item, index) => (
          <div key={item.id} className="carousel-item">
            {item.content}
          </div>
        ))}
      </div>

      <button
        onClick={scrollRight}
        disabled={!canScrollRight}
        aria-label="Scroll right"
        className={!canScrollRight ? "opacity-50" : ""}
      >
        →
      </button>
    </div>
  );
}
```

## 6. Accordion/Expandable Sections

```tsx
function Accordion({ items }) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const toggleItem = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    itemId: string,
  ) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        const nextIndex = Math.min(index + 1, items.length - 1);
        buttonRefs.current[nextIndex]?.focus();
        break;

      case "ArrowUp":
        e.preventDefault();
        const prevIndex = Math.max(index - 1, 0);
        buttonRefs.current[prevIndex]?.focus();
        break;

      case "Home":
        e.preventDefault();
        buttonRefs.current[0]?.focus();
        break;

      case "End":
        e.preventDefault();
        buttonRefs.current[items.length - 1]?.focus();
        break;

      case "Enter":
      case " ":
        e.preventDefault();
        toggleItem(itemId);
        break;
    }
  };

  return (
    <div className="accordion">
      {items.map((item, index) => {
        const isExpanded = expandedItems.includes(item.id);

        return (
          <div key={item.id} className="accordion-item">
            <h3>
              <button
                ref={(el) => (buttonRefs.current[index] = el)}
                id={`accordion-header-${item.id}`}
                aria-expanded={isExpanded}
                aria-controls={`accordion-panel-${item.id}`}
                onClick={() => toggleItem(item.id)}
                onKeyDown={(e) => handleKeyDown(e, index, item.id)}
              >
                {item.title}
                <span aria-hidden="true">{isExpanded ? "−" : "+"}</span>
              </button>
            </h3>

            <div
              id={`accordion-panel-${item.id}`}
              role="region"
              aria-labelledby={`accordion-header-${item.id}`}
              hidden={!isExpanded}
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

## 7. Tooltip/Popover Patterns

```tsx
function Tooltip({ children, content }) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 300);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && isVisible) {
      hideTooltip();
      triggerRef.current?.focus();
    }
  };

  return (
    <div className="tooltip-container">
      <button
        ref={triggerRef}
        aria-describedby={isVisible ? "tooltip" : undefined}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onKeyDown={handleKeyDown}
      >
        {children}
      </button>

      {isVisible && (
        <div ref={tooltipRef} id="tooltip" role="tooltip" className="tooltip">
          {content}
        </div>
      )}
    </div>
  );
}
```

## 8. Toast/Notification Patterns

```tsx
function Toast({ message, type, onClose }) {
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-focus for screen reader announcement
    if (toastRef.current) {
      toastRef.current.focus();
    }

    // Auto-close after delay
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      ref={toastRef}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      tabIndex={-1}
      className={`toast toast-${type}`}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        aria-label="Close notification"
        className="toast-close"
      >
        ×
      </button>
    </div>
  );
}
```

## 9. Table Navigation

```tsx
function DataTable({ data, columns }) {
  const [activeCell, setActiveCell] = useState({ row: 0, col: 0 });
  const tableRef = useRef<HTMLTableElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const { row, col } = activeCell;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        if (row > 0) {
          setActiveCell({ row: row - 1, col });
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        if (row < data.length - 1) {
          setActiveCell({ row: row + 1, col });
        }
        break;

      case "ArrowLeft":
        e.preventDefault();
        if (col > 0) {
          setActiveCell({ row, col: col - 1 });
        }
        break;

      case "ArrowRight":
        e.preventDefault();
        if (col < columns.length - 1) {
          setActiveCell({ row, col: col + 1 });
        }
        break;

      case "Home":
        e.preventDefault();
        setActiveCell({ row, col: 0 });
        break;

      case "End":
        e.preventDefault();
        setActiveCell({ row, col: columns.length - 1 });
        break;
    }
  };

  return (
    <table
      ref={tableRef}
      role="grid"
      aria-labelledby="table-caption"
      onKeyDown={handleKeyDown}
    >
      <caption id="table-caption" className="sr-only">
        Content data table
      </caption>

      <thead>
        <tr>
          {columns.map((col, colIndex) => (
            <th
              key={col.key}
              scope="col"
              aria-sort={col.sortable ? "none" : undefined}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={row.id}>
            {columns.map((col, colIndex) => (
              <td
                key={col.key}
                aria-selected={
                  activeCell.row === rowIndex && activeCell.col === colIndex
                }
                tabIndex={
                  activeCell.row === rowIndex && activeCell.col === colIndex
                    ? 0
                    : -1
                }
              >
                {row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## 10. Touch Target & Mobile Considerations

### Minimum Touch Target Size (44px)

```css
/* Ensure minimum touch target size */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* Add touch feedback */
.touch-feedback {
  transition: background-color 0.2s ease;
}

.touch-feedback:active {
  background-color: rgba(0, 0, 0, 0.1);
}

/* Disable double-tap zoom */
.touch-manipulation {
  touch-action: manipulation;
}
```

### Responsive Focus States

```css
/* Desktop: focus ring */
@media (hover: hover) and (pointer: fine) {
  :focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
}

/* Mobile: no focus ring, use touch feedback */
@media (hover: none) and (pointer: coarse) {
  :focus-visible {
    outline: none;
  }

  .touch-feedback:active {
    transform: scale(0.98);
  }
}
```

## 11. Reduced Motion Support

```css
/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .carousel {
    scroll-behavior: auto;
  }

  .modal {
    transition: none;
  }
}
```

## 12. High Contrast Mode Support

```css
/* High contrast mode adjustments */
@media (prefers-contrast: high) {
  :root {
    --ring: #000000;
    --border: #000000;
    --foreground: #000000;
    --background: #ffffff;
  }

  :focus-visible {
    outline: 3px solid #000000;
    outline-offset: 3px;
  }

  button {
    border: 2px solid currentColor;
  }

  .glass-vision {
    background: #ffffff;
    border: 2px solid #000000;
  }
}
```

## Testing Checklist

### Manual Testing

- [ ] Tab through all interactive elements
- [ ] Test with screen reader (NVDA, VoiceOver, JAWS)
- [ ] Test with keyboard only (no mouse)
- [ ] Test at 200% and 400% zoom
- [ ] Test with high contrast mode
- [ ] Test with reduced motion preference
- [ ] Test on mobile devices (touch targets)
- [ ] Test color contrast with tools

### Automated Testing

- [ ] Run axe-core accessibility tests
- [ ] Run Lighthouse audit
- [ ] Check with pa11y CLI
- [ ] Run jest-axe tests in unit tests
- [ ] Validate HTML with W3C validator

### Screen Reader Testing

- [ ] NVDA (Windows)
- [ ] VoiceOver (macOS/iOS)
- [ ] JAWS (Windows)
- [ ] TalkBack (Android)

## Resources

1. **WAI-ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apg/
2. **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
3. **A11y Project Checklist:** https://www.a11yproject.com/checklist/
4. **Inclusive Components:** https://inclusive-components.design/
5. **Deque University:** https://dequeuniversity.com/

---

**Note:** This document should be updated as new patterns are implemented and existing patterns are refined. All keyboard navigation should be tested with actual users and assistive technologies.
