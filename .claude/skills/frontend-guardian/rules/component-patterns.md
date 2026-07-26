# Component Patterns

## Size Limits

- **MAX 300 LOC** per component file. If larger, decompose into sub-components
- **MAX 5 props** per component. If more, use composition or context
- Pages are **thin wrappers**: layout + feature components, no business logic

### Known violations to fix

| Component | LOC | Location |
|-----------|-----|----------|
| ClinicForm | 1156 | `features/clinics/components/` |
| BranchesConfigTab | 1124 | `features/widget/components/tabs/` |
| BrandingTab | 1052 | `features/widget/components/tabs/` |
| TreatmentForm | 1038 | `features/medical/components/` |
| PromotionForm | 1019 | `features/medical/components/` |

### Composition Pattern

```tsx
// CORRECT: Small, composable sections
function ClinicForm() {
  return (
    <form>
      <ClinicBasicInfoSection />
      <ClinicAddressSection />
      <ClinicHoursSection />
    </form>
  )
}

// WRONG: 1000+ line monolith with mixed concerns
```

### Page Pattern

```tsx
// CORRECT: Page = layout + feature components
export function LeadsPage() {
  return (
    <div className="space-y-6">
      <LeadsHeader />
      <LeadsFilters />
      <LeadsTable />
    </div>
  )
}

// WRONG: Page with 15 useStates, queries, mutations, business logic
```

### Props

- Use TypeScript interfaces for all props (no inline types for complex shapes)
- Destructure props in function signature
- If >5 props, rethink composition

## Loading / Error / Empty States

Every data-fetching component MUST handle:
- **Loading**: Skeleton or spinner
- **Error**: Error message with retry option
- **Empty**: Meaningful empty state message
- **Disabled**: During mutations, disable submit buttons
