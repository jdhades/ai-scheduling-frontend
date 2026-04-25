---
description: Pre-delivery UI/UX checklist before marking a frontend task as done
---

Antes de dar por terminada una tarea de UI/frontend, recorré este checklist
contra el cambio que acabás de hacer. Para cada item, decidí explícitamente:
**OK / N/A / TODO** (con archivo:línea si TODO).

Reportá el resultado en formato markdown corto al final. No corras tests acá —
asumí que ya están verdes.

Referencia: [docs/design-system.md](../../docs/design-system.md). Si una regla
del checklist contradice algo del design-system, ganá el design-system y
actualizalo.

## Checklist

### Estados (cada listado/page)
- [ ] Loading state visible (`Loader2` spinner + texto)
- [ ] Empty state con mensaje "No hay X todavía."
- [ ] Error state con banner `border-error/40 bg-error/10`
- [ ] Botones de mutation: `disabled={isPending}` + texto "Guardando…"

### Texto largo
- [ ] Nombres / descripciones / IDs largos: `truncate` + `max-w-*` + `title=`
- [ ] Textareas multi-línea preview: `line-clamp-2/3`

### Responsive
- [ ] Probado mentalmente en `sm` (≥640) y `md` (≥768) — columnas secundarias `hidden sm:table-cell`
- [ ] Sin `overflow-x` salvo en contenedores explícitos (grids, code blocks)

### Forms
- [ ] Cada input tiene `<Label htmlFor>`
- [ ] Campos opcionales marcados "(opcional)" en `text-muted-foreground`
- [ ] Errores cerca del campo, no en alert global
- [ ] Submit del form también dispara con `Enter` (form `<form onSubmit>`, no botón suelto)

### Accesibilidad
- [ ] Botones icon-only tienen `title` o `aria-label`
- [ ] Color no es única señal (icono + texto en errores)
- [ ] Foco visible al tabular (no `outline-none` sin reemplazo)
- [ ] Tablas usan `<TableHead>` (renderiza `<th scope="col">`)

### Diseño
- [ ] Sin colores hex literal — solo tokens (`primary`, `error`, `surface-*`, `foreground`, `muted-foreground`)
- [ ] Spacing consistente: `space-y-4` entre secciones, `space-y-3` en forms
- [ ] Touch targets ≥44px en mobile (no `size="icon"` para acciones primarias móviles)
- [ ] Animaciones solo en `transform`/`opacity`, duración 150–300ms

### Patrones del proyecto
- [ ] CRUD inline: botones `Pencil` + `Trash2` alineados derecha, `data-testid="edit-<id>"` / `delete-<id>"`
- [ ] Confirms de delete: `window.confirm()` explicando "soft delete" si aplica
- [ ] Dialog reusa el patrón create+edit con `initial?: T | null`
- [ ] API hooks: `use<E>Query/Mutation` invalidan la list query en `onSuccess`

### Sanity final
- [ ] Probaste el feature en el browser, no solo en tests
- [ ] No quedaron `console.log` ni TODOs sin issue
- [ ] Sin warnings de React en consola al interactuar (key duplicada, controlled/uncontrolled, etc.)

## Reporte

Al terminar, devolvé:

```
## Preflight UI: <pantalla / componente>

✅ Pass: <N items>
⚠️ TODO: <item> — <archivo:línea>
🚫 N/A: <item> — <razón>
```

Si hay 0 TODOs, sumá una línea: "Listo para entregar." Si hay TODOs, no
declararlo terminado todavía.
