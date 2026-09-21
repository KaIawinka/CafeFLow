import type { LucideIcon } from 'lucide-react';

interface SettingsToggleProps {
  checked: boolean;
  label: string;
  description?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function SettingsToggle({ checked, label, description, icon: Icon, disabled = false, onChange }: SettingsToggleProps) {
  return (
    <label className={`flex min-h-14 items-center justify-between gap-4 rounded-xl bg-[var(--muted)]/60 px-4 py-3 transition ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-[var(--muted)]'}`}>
      <span className="flex min-w-0 items-center gap-3">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-[var(--primary)]" />}
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[var(--card-foreground)]">{label}</span>
          {description && <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">{description}</span>}
        </span>
      </span>
      <span className="relative shrink-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="block h-6 w-11 rounded-full bg-[var(--border)] transition peer-checked:bg-[var(--primary)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ring)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--card)] after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition after:content-[''] peer-checked:after:translate-x-5" />
      </span>
    </label>
  );
}