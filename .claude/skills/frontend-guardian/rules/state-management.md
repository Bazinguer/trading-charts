# State Management

## Single Source of Truth for Tenant

- **ONLY** use `useWebStore` (Zustand) for tenant/web selection
- **NEVER** access `sessionStorage.getItem('current_tenant')` directly
- **NEVER** use `useTenant()` hook (DEPRECATED)
- The API client interceptor reads from `useWebStore` automatically

See `rules/superadmin-web-selector.md` for the complete SuperAdmin pattern.

## Server State vs UI State

```tsx
// Server state → TanStack Query (ALWAYS)
const { data: leads } = useQuery({
  queryKey: ['leads', widgetId],
  queryFn: () => apiClient.get('/api/v1/leads'),
})

// UI state → Zustand (ONLY for global UI state)
const { theme, setTheme } = useThemeStore()
const { selectedWebId } = useWebStore()

// Local UI state → useState (for component-scoped state)
const [isOpen, setIsOpen] = useState(false)
```

**NEVER** mix server + UI state in the same context/store:

```tsx
// WRONG
interface WidgetContextState {
  widgets: Widget[];      // Server state!
  selectedWidget: Widget; // UI state!
  isLoading: boolean;     // Server state!
}
```

## TanStack Query Patterns

- Specific `queryKey` with all dependencies: `['leads', widgetId, filters]`
- `useMutation` for all write operations
- Invalidate specific queries: `['leads', widgetId]` not `['leads']`
- `staleTime` for data that doesn't change often
- `enabled: !!widgetId` to prevent queries with undefined params

## Reference Implementations

- `features/auth/context/AuthContext.tsx` - Auth with TanStack Query
- `lib/web-store.ts` - Zustand store (single source of truth)
- `lib/api-client.ts` - API client with interceptors
