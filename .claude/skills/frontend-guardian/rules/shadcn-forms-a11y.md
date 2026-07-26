# shadcn/ui, Forms, i18n & Accessibility

## shadcn/ui Conventions

- `forwardRef` for all reusable components
- `cva()` (class-variance-authority) for variant definitions
- `cn()` from `@/lib/cn` for className merging
- `Slot` from Radix for `asChild` pattern
- Set `displayName` for debugging
- **NEVER** modify files in `components/ui/` directly - create wrappers in `components/` or `features/`

### Reference

- `components/ui/button.tsx` - CVA + forwardRef pattern

## Forms

- **ALWAYS** use React Hook Form + Zod for form validation
- Use `zodResolver` for schema-based validation
- Create reusable form section components (<200 LOC each)
- Show field-level errors, not just form-level

```tsx
const formSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
})

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
})
```

## i18n

- **NEVER** hardcode user-facing text strings
- Use `useTranslation()` and keys from `locales/{lang}/common.json`
- Medical-specific terms should be in translation files, not in components

```tsx
// WRONG
<Button>Save changes</Button>

// CORRECT
const { t } = useTranslation();
<Button>{t('common.save')}</Button>
```

## Accessibility

- Use Radix UI primitives (accessible by default)
- Add `aria-label` for icon-only buttons
- Ensure keyboard navigation works
- Use semantic HTML (`<nav>`, `<main>`, `<section>`, `<article>`)

```tsx
// WRONG
<button onClick={onClose}>
  <X className="h-4 w-4" />
</button>

// CORRECT
<button onClick={onClose} aria-label={t('common.close')}>
  <X className="h-4 w-4" />
</button>
```
