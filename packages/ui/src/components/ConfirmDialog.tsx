import * as React from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
}

/** Replaces window.confirm/alert for destructive actions (excluir cargo,
 * excluir membro, ...) with something that respects the client's theme and
 * is actually testable/accessible, per docs/criterios-secoes.md ("ação
 * destrutiva pede confirmação"). */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
          }}
        />
        <AlertDialog.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-base)',
            padding: 24,
            width: '90vw',
            maxWidth: 420,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <AlertDialog.Title style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, margin: 0 }}>
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description
            style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 8, marginBottom: 20 }}
          >
            {description}
          </AlertDialog.Description>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <AlertDialog.Cancel asChild>
              <Button variant="ghost">{cancelLabel}</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
