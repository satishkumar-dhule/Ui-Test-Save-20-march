# TASK TRACKER - Omni Search Feature

**Project**: DevPrep Website  
**Feature**: Omni Search (Global Search Across All Content)  
**Date**: 2026-03-19

---

## Agent Team Structure

| Agent Type        | Instance Count | Responsibilities                               |
| ----------------- | -------------- | ---------------------------------------------- |
| UI Agent          | 2              | Search UI component, modal, keyboard shortcuts |
| API Agent         | 2              | Search backend endpoint, filtering logic       |
| Integration Agent | 2              | Wire up search to app, state management        |

---

## Tasks

### Phase 1: UI Implementation (UI Agent x2)

- [x] **T1.1**: Create SearchModal component with input, results list, filters
- [x] **T1.2**: Add keyboard shortcut (Cmd/Ctrl+K) to open search
- [x] **T1.3**: Implement search input with debounced query
- [x] **T1.4**: Create result cards for each content type (flashcards, questions, coding, etc.)
- [x] **T1.5**: Add category filters (All, Flashcards, Questions, Coding, Voice, Exams)

### Phase 2: API Implementation (API Agent x2)

- [x] **T2.1**: Add GET /search endpoint in api-server
- [x] **T2.2**: Implement search query across all content tables
- [x] **T2.3**: Add content type filtering
- [x] **T2.4**: Add pagination to search results
- [x] **T2.5**: Update OpenAPI spec with search endpoint

### Phase 3: Integration (Integration Agent x2)

- [x] **T3.1**: Connect SearchModal to API endpoint
- [x] **T3.2**: Add search state management (React Query)
- [x] **T3.3**: Integrate search modal into App.tsx layout
- [x] **T3.4**: Add search analytics tracking
- [x] **T3.5**: Test full search flow

---

## Search Feature Requirements

### Functional Requirements

1. Global search accessible via keyboard shortcut (Cmd/Ctrl+K)
2. Search across: flashcards, questions, coding challenges, voice practice, exams
3. Real-time search with debounce (300ms)
4. Filter by content type
5. Display results with content type icon, title, and preview
6. Navigate to result on selection

### UI Requirements

- Modal overlay with search input at top
- Results list with categorized sections
- Loading state while searching
- Empty state when no results
- Keyboard navigation (arrow keys, enter to select)

### API Requirements

- Endpoint: GET /api/search?q={query}&type={contentType}&limit={limit}&offset={offset}
- Returns: Array of results with type, id, title, preview
- Support fuzzy search

---

## Status Log

| Date       | Agent               | Task                   | Status      |
| ---------- | ------------------- | ---------------------- | ----------- |
| 2026-03-19 | UI Agent 1          | T1.1, T1.3, T1.4, T1.5 | ✅ Complete |
| 2026-03-19 | UI Agent 2          | T1.2                   | ✅ Complete |
| 2026-03-19 | API Agent 1         | T2.1, T2.2, T2.3, T2.4 | ✅ Complete |
| 2026-03-19 | API Agent 2         | T2.5                   | ✅ Complete |
| 2026-03-19 | Integration Agent 1 | T3.1, T3.2, T3.3       | ✅ Complete |
| 2026-03-19 | Integration Agent 2 | T3.4, T3.5             | ✅ Complete |

---

## Files Created

| File                                             | Agent                   |
| ------------------------------------------------ | ----------------------- |
| artifacts/devprep/src/types/search.ts            | UI Agent 1              |
| artifacts/devprep/src/components/SearchModal.tsx | UI Agent 1              |
| artifacts/devprep/src/hooks/useSearchShortcut.ts | UI Agent 2              |
| artifacts/api-server/src/routes/search.ts        | API Agent 1             |
| artifacts/api-server/src/routes/index.ts         | API Agent 1             |
| lib/api-spec/openapi.yaml                        | API Agent 2             |
| artifacts/devprep/src/App.tsx                    | Integration Agent 1 & 2 |
| artifacts/devprep/src/hooks/useAnalytics.ts      | Integration Agent 2     |

---

## Search Component Spec

### SearchModal Props

```typescript
interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (result: SearchResult) => void;
}
```

### SearchResult Type

```typescript
interface SearchResult {
  id: string;
  type: "question" | "flashcard" | "coding" | "voice" | "exam";
  title: string;
  preview: string;
  channelId: string;
  tags: string[];
}
```

### Keyboard Shortcuts

| Shortcut      | Action                    |
| ------------- | ------------------------- |
| Ctrl/Cmd + K  | Open search modal         |
| Escape        | Close modal               |
| Arrow Up/Down | Navigate results          |
| Enter         | Select highlighted result |

---

## API Endpoint Spec

### GET /api/search

**Query Parameters:**

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| q         | string | Yes      | Search query                   |
| type      | string | No       | Filter by content type         |
| limit     | number | No       | Max results (default: 20)      |
| offset    | number | No       | Pagination offset (default: 0) |

**Response:**

```json
{
  "ok": true,
  "data": [
    {
      "id": "q1",
      "type": "question",
      "title": "What is JavaScript?",
      "preview": "JavaScript is a high-level, interpreted...",
      "channelId": "javascript",
      "tags": ["javascript", "basics"]
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

---

## Testing Checklist

### Unit Tests

- [ ] SearchModal renders correctly when open
- [ ] SearchModal hides when closed
- [ ] Debounce delays API call by 300ms
- [ ] Results display correctly
- [ ] Empty state shows when no results
- [ ] Loading state shows during search

### Integration Tests

- [ ] Search endpoint returns results
- [ ] Search filters by content type
- [ ] Pagination works correctly
- [ ] Keyboard shortcuts function

### E2E Tests

- [ ] User can open search with Ctrl+K
- [ ] User can type query and see results
- [ ] User can click result to navigate
- [ ] User can close modal with Escape

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-03-19  
**Status:** Complete
