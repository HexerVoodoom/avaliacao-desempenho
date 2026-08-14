import * as React from 'react';
import { exportSnapshot, importSnapshot } from '@studio/local-store';
import { Button } from '@studio/ui';

/** Arquivo > Salvar / Carregar. There's no backend today (docs/PLANO.md §7),
 * so a downloaded JSON snapshot of every localStorage collection is the only
 * way to keep or hand off data between sessions/browsers. */
export function FileMenu() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  function handleSave() {
    const snapshot = exportSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = snapshot.exportedAt.slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `avaliacao-desempenho-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleLoadClick() {
    setError(null);
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const snapshot = JSON.parse(text);
      importSnapshot(snapshot);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o arquivo.');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <Button variant="ghost" onClick={handleSave} style={{ justifyContent: 'flex-start', flex: 1 }}>
          Salvar
        </Button>
        <Button variant="ghost" onClick={handleLoadClick} style={{ justifyContent: 'flex-start', flex: 1 }}>
          Carregar
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {error && (
        <div style={{ fontSize: 12, color: 'var(--color-danger)' }}>{error}</div>
      )}
    </div>
  );
}
