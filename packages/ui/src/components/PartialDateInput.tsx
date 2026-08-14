import * as React from 'react';
import type { DatePrecision, PartialDate } from '@studio/domain';

export interface PartialDateInputProps {
  label: string;
  value?: PartialDate;
  onChange: (value: PartialDate | undefined) => void;
}

const PRECISIONS: { value: DatePrecision; label: string }[] = [
  { value: 'year', label: 'Só o ano' },
  { value: 'month', label: 'Mês e ano' },
  { value: 'day', label: 'Data completa' },
];

/** "início na empresa não fique travado em mês, dia e ano, mas que possa ser
 * colocado só ano" — a single field whose precision the user picks, so the
 * stored value is only as specific as what was actually informed. */
export function PartialDateInput({ label, value, onChange }: PartialDateInputProps) {
  // Precision is tracked locally, not derived from `value?.precision`: with
  // no value yet, picking "Só o ano" must stick even though there's no year
  // typed yet — deriving it from `value` would snap back to 'day' the
  // instant emit() clears an incomplete value (year not typed yet).
  const [precision, setPrecision] = React.useState<DatePrecision>(value?.precision ?? 'day');
  const [year, month, day] = (value?.value ?? '').split('-');

  function emit(newYear: string, newMonth: string, newDay: string, newPrecision: DatePrecision) {
    if (!newYear) {
      onChange(undefined);
      return;
    }
    const y = newYear.padStart(4, '0');
    const m = newPrecision === 'year' ? '01' : (newMonth || '01').padStart(2, '0');
    const d = newPrecision === 'day' ? (newDay || '01').padStart(2, '0') : '01';
    onChange({ value: `${y}-${m}-${d}`, precision: newPrecision });
  }

  function handlePrecisionChange(newPrecision: DatePrecision) {
    setPrecision(newPrecision);
    emit(year ?? '', month ?? '', day ?? '', newPrecision);
  }

  // The visible <label> text names the whole field ("Data de nascimento"),
  // but it doesn't wrap either control — every control still needs its own
  // accessible name (aria-label) or a screen reader announces it as
  // unlabeled. Caught by an automated axe-core pass (Fase 7 QA gate).
  const groupId = React.useId();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label id={groupId} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <select
          value={precision}
          onChange={(e) => handlePrecisionChange(e.target.value as DatePrecision)}
          style={selectStyle}
          aria-label={`Precisão de ${label}`}
          aria-describedby={groupId}
        >
          {PRECISIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        {precision === 'day' && (
          <input
            type="date"
            value={value?.value ?? ''}
            onChange={(e) => emit(...(e.target.value.split('-') as [string, string, string]), 'day')}
            style={inputStyle}
            aria-label={label}
          />
        )}
        {precision === 'month' && (
          <input
            type="month"
            value={year && month ? `${year}-${month}` : ''}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-');
              emit(y ?? '', m ?? '', '', 'month');
            }}
            style={inputStyle}
            aria-label={label}
          />
        )}
        {precision === 'year' && (
          <input
            type="number"
            placeholder="ex.: 2014"
            min={1900}
            max={2100}
            value={year ?? ''}
            onChange={(e) => emit(e.target.value, '', '', 'year')}
            style={inputStyle}
            aria-label={label}
          />
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--font-size-sm)',
  flex: 1,
};

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--font-size-sm)',
};
