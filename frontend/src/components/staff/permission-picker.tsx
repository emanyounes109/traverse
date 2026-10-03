import { ALL_PERMISSIONS, PERMISSION_INFO } from "@/config/permissions";
import type { Permission } from "@/types/api";

type Props = {
  value: Permission[];
  onChange: (next: Permission[]) => void;
  disabled?: boolean;
};

export function PermissionPicker({ value, onChange, disabled = false }: Props) {
  const toggle = (permission: Permission) => {
    onChange(
      value.includes(permission) ? value.filter((p) => p !== permission) : [...value, permission]
    );
  };

  return (
    <ul className="space-y-0.5">
      {ALL_PERMISSIONS.map((permission) => {
        const info = PERMISSION_INFO[permission];

        return (
          <li key={permission}>
            <label className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 transition hover:bg-canvas">
              <input
                type="checkbox"
                checked={value.includes(permission)}
                disabled={disabled}
                onChange={() => toggle(permission)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />
              <span>
                <span className="block text-sm font-medium text-ink">{info.label}</span>
                <span className="block text-xs text-muted">{info.description}</span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}