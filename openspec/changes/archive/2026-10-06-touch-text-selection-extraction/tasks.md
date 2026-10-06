# Tasks

## 1. Mobile & Touch Selection Support in ConstructionExtractor

- [x] 1.1 Add `selectionchange` document listener and container boundary checks in `src/components/ConstructionExtractor.jsx`, verifying that text selections inside the container update `selectedText` while selections outside or collapsed selections clear it
- [x] 1.2 Add touch event propagation protection on the extract trigger button and card in `src/components/ConstructionExtractor.jsx` to prevent touch taps from prematurely dismissing active selections
- [x] 1.3 Add unit tests in `src/__tests__/ConstructionExtractor.test.jsx` for document `selectionchange` events, touch selections, and multi-instance container isolation, verifying that `npm test src/__tests__/ConstructionExtractor.test.jsx` passes

## 2. Integration & Full Test Suite Verification

- [x] 2.1 Run the full test suite (`npm test`) to verify all components and workflows pass without regressions
