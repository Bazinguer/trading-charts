# TypeScript Safety

## Zero Tolerance for `any`

- **NEVER** use `as any` - always define proper types
- **NEVER** use type assertions (`as X`) unless absolutely necessary with a comment explaining why
- Create interfaces/types for all API response shapes
- Use Zod schemas for runtime validation of API responses

```tsx
// WRONG
const data = response as any;
control: form.control as any,

// CORRECT
interface LeadResponse {
  id: string;
  name: string;
  phone: string;
}
const data: LeadResponse = response;
```

## Type Conventions

| Use | For |
|-----|-----|
| `interface` | Object shapes: `interface UserProps { ... }` |
| `type` | Unions/intersections: `type Status = 'active' \| 'inactive'` |
| `Record<string, T>` | Key-value maps (not `{ [key: string]: T }`) |

- Export types from the file that defines them
- Use `UUID` type when handling IDs (not plain `string`)
- Prefer discriminated unions over optional fields when states are exclusive
