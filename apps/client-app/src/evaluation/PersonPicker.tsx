import * as React from 'react';
import type { Member, Role } from '@studio/domain';

interface PersonPickerProps {
  label: string;
  members: Member[];
  roleById: Map<string, Role>;
  selectedId: string;
  onSelect: (memberId: string) => void;
}

function displayName(m: Member, roleById: Map<string, Role>) {
  const role = roleById.get(m.roleId)?.name ?? 'sem cargo';
  return `${m.firstName} ${m.lastName ?? ''}`.trim() + ` — ${role}`;
}

/** Search-first person picker, per docs/criterios-secoes.md ("Avaliações"):
 * "Seleção de avaliador/avaliado funciona tanto por busca direta da pessoa
 * quanto por filtro de cargo". A plain <select> doesn't scale past a
 * handful of names on a tablet with no physical keyboard — this is a
 * minimal WAI-ARIA combobox (listbox popup, aria-activedescendant) so
 * typing filters the list live, while still composing with the role
 * filter that already exists on the avaliado(a) field. */
export function PersonPicker({ label, members, roleById, selectedId, onSelect }: PersonPickerProps) {
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listId = React.useId();
  const selected = members.find((m) => m.id === selectedId);

  React.useEffect(() => {
    // Keep the visible text in sync when selection changes from outside
    // (e.g. the role filter shrinking the list clears an out-of-scope pick).
    if (selected) setQuery(displayName(selected, roleById));
    else if (!open) setQuery('');
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!open) return members;
    if (!q || (selected && displayName(selected, roleById).toLowerCase() === q)) return members;
    return members.filter((m) => displayName(m, roleById).toLowerCase().includes(q));
  }, [members, query, open, selected, roleById]);

  function commit(member: Member) {
    onSelect(member.id);
    setQuery(displayName(member, roleById));
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      setActiveIndex(0);
      return;
    }
    if (!open) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[activeIndex]) commit(filtered[activeIndex]);
        break;
      case 'Escape':
        setOpen(false);
        if (selected) setQuery(displayName(selected, roleById));
        break;
      default:
        break;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', position: 'relative' }}>
      <label htmlFor={`${listId}-input`}>{label}</label>
      <input
        id={`${listId}-input`}
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && filtered[activeIndex] ? `${listId}-opt-${filtered[activeIndex].id}` : undefined}
        placeholder="Buscar por nome..."
        style={inputStyle}
        value={query}
        onFocus={() => {
          setOpen(true);
          setActiveIndex(0);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(0);
          if (selectedId) onSelect('');
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Let a click on an option register before we close/reset.
          window.setTimeout(() => {
            setOpen(false);
            if (selected) setQuery(displayName(selected, roleById));
            else setQuery('');
          }, 120);
        }}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 10,
            margin: '2px 0 0',
            padding: 4,
            listStyle: 'none',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {filtered.length === 0 && (
            <li style={{ padding: '8px 10px', color: 'var(--color-text-muted)' }}>Nenhuma pessoa encontrada.</li>
          )}
          {filtered.map((m, index) => (
            <li
              key={m.id}
              id={`${listId}-opt-${m.id}`}
              role="option"
              aria-selected={m.id === selectedId}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commit(m)}
              style={{
                padding: '8px 10px',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: 'var(--color-text-primary)',
                background: index === activeIndex ? 'var(--color-surface-muted)' : 'transparent',
              }}
            >
              {displayName(m, roleById)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  minHeight: 44,
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--font-size-sm)',
  fontFamily: 'inherit',
  color: 'var(--color-text-primary)',
  background: 'var(--color-surface)',
};
