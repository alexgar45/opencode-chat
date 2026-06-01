import type { Model, ModelRef } from "../lib/types";
import { defaultModelLabel, findModelByKey } from "../lib/api";
import { useMemo } from "react";

type Props = {
  models: Model[];
  value: ModelRef | null;
  onChange: (value: ModelRef) => void;
};

export function ModelPicker({ models, value, onChange }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, Model[]>();
    for (const m of models) {
      const list = map.get(m.providerID) ?? [];
      list.push(m);
      map.set(m.providerID, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [models]);

  const current = findModelByKey(models, value);
  const currentLabel = defaultModelLabel(current);

  return (
    <label className="flex items-center gap-2 text-sm text-ink-soft">
      <span className="text-ink-mute">Model</span>
      <div className="relative">
        <select
          value={value ? `${value.providerID}/${value.modelID}` : ""}
          onChange={(e) => {
            const [providerID, ...rest] = e.target.value.split("/");
            if (providerID && rest.length > 0) {
              onChange({ providerID, modelID: rest.join("/") });
            }
          }}
          className="appearance-none bg-bg-card border border-border rounded-md pl-3 pr-8 py-1.5 text-ink text-sm focus:outline-none focus:border-accent cursor-pointer hover:border-border-strong"
        >
          {value && !current ? (
            <option value={`${value.providerID}/${value.modelID}`}>
              {value.providerID}/{value.modelID} (not found)
            </option>
          ) : null}
          {grouped.map(([providerID, list]) => (
            <optgroup key={providerID} label={list[0]?.providerName ?? providerID}>
              {list.map((m) => (
                <option
                  key={`${m.providerID}/${m.modelID}`}
                  value={`${m.providerID}/${m.modelID}`}
                >
                  {m.modelName}
                  {m.isDefault ? " · default" : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-mute"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      {current ? (
        <span className="text-ink-mute text-xs hidden md:inline">{currentLabel}</span>
      ) : null}
    </label>
  );
}
