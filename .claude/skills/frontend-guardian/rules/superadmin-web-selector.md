# SuperAdmin Web Selector - CRITICAL PATTERN

## The Problem

SuperAdmin is a global user with **NO `web_id` in their JWT token**. Any component that does:

```tsx
// WRONG - Returns undefined for SuperAdmin
const webId = currentUser.web_id;
```

...will break for SuperAdmin users. This was a recurring bug during development.

## The Solution

A `WebSelectorSidebar` component lets SuperAdmin choose which web/tenant to work with. The selected value flows through Zustand → API interceptor → backend.

### Data Flow

```
WebSelectorSidebar → useWebStore (Zustand) → sessionStorage.current_tenant
                              ↓
API Client Interceptor: reads useWebStore → adds ?web_id= to all requests
                              ↓
Backend: CurrentTenantOptional receives web_id via query param
```

### Key Files

- `dashboard/src/lib/web-store.ts` - Zustand store (single source of truth)
- `dashboard/src/components/superadmin/WebSelectorSidebar.tsx` - UI selector in sidebar
- `dashboard/src/lib/api-client.ts` - Interceptor that adds web_id automatically

### Rules

1. **ALWAYS** use `useWebStore()` to get the current tenant:
   ```tsx
   // CORRECT
   const { selectedWebId } = useWebStore();
   ```

2. **NEVER** read tenant from these sources:
   ```tsx
   // WRONG - all of these
   sessionStorage.getItem('current_tenant');
   currentUser.web_id;
   useTenant(); // DEPRECATED hook
   ```

3. **ALWAYS** consider that `selectedWebId` can be `null` (SuperAdmin hasn't selected a web yet):
   ```tsx
   // CORRECT - handle null case
   if (!selectedWebId) {
     return <SelectWebPrompt />;
   }
   ```

4. The API client interceptor handles adding `web_id` to requests **automatically**. You don't need to manually add it to API calls.

5. When creating new pages that need tenant context, check if the page works for both:
   - `client_admin` (has `web_id` in token, selector not shown)
   - `superadmin` (no `web_id`, must use selector)
