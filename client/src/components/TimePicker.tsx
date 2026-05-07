// Two-dropdown duration picker (hours + minutes), modelled on the iOS timer.
// Stores a single nullable minute count: 0h 0m is treated as "no estimate" (null).

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, n) => n); // 0..23
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, n) => n); // 0..59

export function TimePicker({
  minutes,
  onChange,
  disabled,
  className,
}: {
  minutes: number | null;
  onChange: (next: number | null) => void;
  disabled?: boolean;
  className?: string;
}) {
  const total = minutes ?? 0;
  const h = Math.min(23, Math.floor(total / 60));
  const m = total % 60;

  function commit(nextH: number, nextM: number) {
    const sum = nextH * 60 + nextM;
    onChange(sum === 0 ? null : sum);
  }

  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <select
        value={h}
        onChange={(e) => commit(Number(e.target.value), m)}
        disabled={disabled}
        aria-label="Hours"
        className="rounded border px-1 py-1 text-xs"
      >
        {HOUR_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}h
          </option>
        ))}
      </select>
      <select
        value={m}
        onChange={(e) => commit(h, Number(e.target.value))}
        disabled={disabled}
        aria-label="Minutes"
        className="rounded border px-1 py-1 text-xs"
      >
        {MINUTE_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}m
          </option>
        ))}
      </select>
    </div>
  );
}
