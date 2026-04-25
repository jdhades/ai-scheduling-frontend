# Design System — AI Scheduling Frontend

Sistema de diseño tailored al proyecto. Inspirado en `ui-ux-pro-max` skill pero
sin dependencias externas. Fuente de verdad para reglas visuales y de
interacción. Si una regla no aplica a un caso real, actualizar este doc.

Stack: React 19 + Vite + Tailwind v4 (`@theme` en `src/index.css`) + shadcn-style
primitives propios en `src/components/ui/`.

---

## 1. Tokens (definidos en `src/index.css`)

### Colores

Tema oscuro único (no hay light mode hoy). **Usá los tokens, nunca hex literal.**

| Token | Hex | Uso |
|---|---|---|
| `background` / `surface` | `#0c1324` | Fondo de página |
| `surface-low` | `#151b2d` | Cards, tablas, panels |
| `surface-container` | `#191f31` | Overlay sobre cards (popover, hover de row) |
| `surface-highest` | `#2e3447` | Borders por defecto, scrollbar thumb |
| `primary` | `#c0c1ff` | Acento principal (links, focus rings, botón primary) |
| `primary-container` | `#8083ff` | Fondo de botón primary |
| `secondary` | `#44e2cd` | Acento secundario (chips, badges activos) |
| `error` | `#ffb4ab` | Errores, destructive actions |
| `foreground` | `#f8fafc` | Texto principal |
| `muted-foreground` | `#94a3b8` | Texto secundario, placeholders, "—" |

**Contraste WCAG AA:**
- `foreground` sobre `background`: ✓ ratio ~14:1.
- `muted-foreground` sobre `background`: ✓ ratio ~5.5:1 (cumple AA para texto normal ≥16px).
- `muted-foreground` sobre `surface-low`: ✓ ratio ~5.1:1.
- **Evitar** `muted-foreground` sobre `surface-container` para texto <14px — ratio cae a ~4.4:1.

### Tipografía

- Sans: `Inter` (400/500/600/700) — todo el body.
- Mono: `JetBrains Mono` — IDs, código, timestamps.
- Tamaños base: `text-sm` (14px) por defecto en cells/labels, `text-base` (16px) en form inputs, `text-xl` (20px) en page headers.
- **Body text mínimo 14px** (Tailwind `text-sm`). Inputs **siempre 16px** para evitar zoom en iOS.
- **Line-height**: usar defaults de Tailwind (`leading-normal` = 1.5). Para párrafos largos, `leading-relaxed` (1.625).

### Spacing y radii

- Stack vertical entre secciones: `space-y-4` (16px).
- Stack vertical dentro de form: `space-y-3` (12px).
- Padding de cells: el del primitive `Table` (no override).
- Radii: `rounded-md` (12px) por defecto, `rounded-lg` (16px) para cards grandes, `rounded-sm` (8px) para chips/badges.

---

## 2. Layout & Responsive

- **Mobile-first.** Empezar sin breakpoint, agregar `sm:` (≥640px), `md:` (≥768px), `lg:` (≥1024px) según hagan falta.
- **Tablas anchas**: ocultar columnas secundarias en móvil con `hidden sm:table-cell` o `hidden md:table-cell`. Mantener visible solo lo identificatorio (nombre, acciones).
- **Sidebar**: collapsa en móvil (estado controlado por `AppLayout`).
- **No horizontal scroll** salvo dentro de un contenedor con `overflow-x-auto` explícito (ej. ScheduleGrid).
- Container width: sin `max-w` global — cada page decide. Para detail pages tipo formulario, `max-w-2xl mx-auto`.

---

## 3. Texto largo

Patrón estándar para nombres, descripciones, IDs externos:

```tsx
<TableCell className="max-w-[16rem] truncate" title={value}>
  {value}
</TableCell>
```

- Truncar con `truncate` + `max-w-[<rem>]`.
- **Siempre** poner `title={value}` para tooltip nativo accesible.
- Para textareas multilínea preview, `line-clamp-2` o `line-clamp-3`.

---

## 4. Estados obligatorios

Toda página de listado debe manejar las 4 instancias:

| Estado | Patrón |
|---|---|
| **Loading** | `<Loader2 className="w-4 h-4 animate-spin" />` + "Cargando…" centrado en una row de la tabla |
| **Empty** | Mensaje en `text-muted-foreground py-8 text-center` — "No hay X todavía." con CTA de creación si aplica |
| **Error** | Banner en `rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error` |
| **Success** | Toast (TODO: instalar sonner cuando lo pidamos) — por ahora, refresh de la query sirve de feedback implícito |

---

## 5. Touch & interacción

- Touch target mínimo: **44×44px** efectivo. Los `Button size="icon"` (h-8 w-8 = 32px) **fallan** este mínimo — sólo usarlos en desktop. Para mobile, `size="default"`.
- Spacing entre targets táctiles: ≥8px (`gap-2` en flex).
- Focus visible: confiar en el ring del primitive (`focus-visible:ring-2 focus-visible:ring-primary`). **Nunca** `outline-none` sin reemplazo.
- Loading feedback en mutations: botón disabled + texto "Guardando…" mientras `isPending`.

---

## 6. Animación

- Transiciones de estado: `transition-colors`, `transition-opacity` — duración default de Tailwind (150ms) está bien.
- **Solo animar** `transform` y `opacity` (GPU-friendly). Evitar animar `width`, `height`, `top`.
- Range duración: 150–300ms para micro-interacciones, 200–400ms para entrada de dialogs.
- Respetar `prefers-reduced-motion`: si agregamos animación custom, envolverla en `motion-safe:`.

---

## 7. Forms

- **Label visible siempre** (no placeholder-as-label). Usar `<Label htmlFor={id}>`.
- Required: marcar visualmente solo si es ambiguo. Default: todos los campos sin "(opcional)" son requeridos.
- Campos opcionales: poner "(opcional)" en gris dentro del label, ej. `<Label>ID externo <span className="text-muted-foreground">(opcional)</span></Label>`.
- **Error messages**: cerca del campo, `text-sm text-error`, no en alerts globales.
- **Validación**: validar al submit, no on-blur agresivo. Mensaje único por campo.
- **Disable** todos los inputs + el submit cuando `submitting` esté true. Texto del botón pasa a "Guardando…".

---

## 8. Accesibilidad — checklist mínimo

- Todo botón sin texto visible necesita `title` o `aria-label`.
- Toda imagen no decorativa necesita `alt`.
- Diálogos usan el primitive `<Dialog>` de `@radix-ui` (ya manejan `Esc`, focus trap, scroll lock).
- Tablas: usar `<TableHead>` para headers — el primitive renderiza `<th scope="col">`.
- Color **nunca** es la única señal: errores con icono + texto, no solo color rojo.
- Keyboard: probar `Tab` por toda la página antes de cerrar un PR. Si algo no es alcanzable, agregar `tabIndex={0}`.

---

## 9. Patterns que ya usamos (consistencia)

- **Listado + detalle**: nombre como `<Link>` que navega a `/<group>/<entity>/:id`.
- **CRUD inline**: botones icon-only `Pencil` (editar), `Trash2` (eliminar) en columna `Acciones` alineados a la derecha. Confirm via `window.confirm()` para deletes (TODO: reemplazar por dialog cuando agreguemos toasts).
- **Dialog único create+edit**: un componente con prop `initial?: T | null`. Si está, modo edición.
- **API hooks**: nombres `use<Entity>Query`, `useCreate<Entity>Mutation`, `useUpdate<Entity>Mutation`, `useDelete<Entity>Mutation`. Invalidan la query list en `onSuccess`.

---

## 10. Anti-patterns

- ❌ Color hex literal en JSX/CSS (siempre usar tokens).
- ❌ `<button>` HTML directo (usar primitive `<Button>`).
- ❌ Placeholders como labels.
- ❌ Tablas con scroll horizontal en móvil sin ocultar columnas.
- ❌ Texto largo sin truncate + tooltip.
- ❌ Botones sin estado loading/disabled durante mutations.
- ❌ `outline-none` sin reemplazo de focus visible.
- ❌ `animate-` sobre `width`/`height` en listas largas.
- ❌ Mensajes de error solo en consola (deben ser visibles al user).
- ❌ Estado vacío sin mensaje (usuario ve tabla vacía y duda si cargó).
