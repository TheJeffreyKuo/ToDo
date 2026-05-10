import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

// Wheel-style time picker (hours + minutes), iOS-timer flavored.
// Trigger renders a compact button showing the current value; clicking opens a popover with
// two scroll-snap wheel columns. Selecting either column commits a new total via onChange.
// Storage stays as a single nullable minute count: 0h 0m maps to "no estimate" (null).

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, n) => n);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, n) => n);

const ITEM_HEIGHT = 32;
const VISIBLE_ROWS = 5; // odd: highlighted item is in the middle
const PAD_HEIGHT = ((VISIBLE_ROWS - 1) / 2) * ITEM_HEIGHT;
const CONTAINER_HEIGHT = VISIBLE_ROWS * ITEM_HEIGHT;

function WheelColumn({
  values,
  value,
  onChange,
  suffix,
  ariaLabel,
}: {
  values: number[];
  value: number;
  onChange: (next: number) => void;
  suffix: string;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  const lastEmittedRef = useRef<number>(value);

  // Programmatic scroll on value change. useLayoutEffect avoids a flash of the wrong row at mount.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = values.indexOf(value);
    if (idx < 0) return;
    const target = idx * ITEM_HEIGHT;
    if (Math.abs(el.scrollTop - target) > 1) {
      el.scrollTop = target;
    }
    lastEmittedRef.current = value;
  }, [value, values]);

  function handleScroll() {
    const el = ref.current;
    if (!el) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const idx = Math.round(el.scrollTop / ITEM_HEIGHT);
      const next = values[idx];
      if (next === undefined) return;
      if (next === lastEmittedRef.current) return;
      lastEmittedRef.current = next;
      onChange(next);
    }, 90);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const delta = e.key === "ArrowUp" ? -1 : 1;
    const currentIdx = values.indexOf(value);
    if (currentIdx < 0) return;
    const nextIdx = Math.max(0, Math.min(values.length - 1, currentIdx + delta));
    const next = values[nextIdx];
    if (next === undefined || next === value) return;
    onChange(next);
  }

  function handleItemClick(n: number) {
    if (n === value) return;
    onChange(n);
  }

  return (
    <div
      className="relative overflow-hidden rounded-md border border-zinc-200 bg-white"
      style={{ width: 64, height: CONTAINER_HEIGHT }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 z-10 border-y border-zinc-300 bg-zinc-50"
        style={{ top: PAD_HEIGHT, height: ITEM_HEIGHT }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-white to-transparent"
        style={{ height: PAD_HEIGHT }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-white to-transparent"
        style={{ height: PAD_HEIGHT }}
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        role="spinbutton"
        aria-label={ariaLabel}
        aria-valuemin={values[0]}
        aria-valuemax={values[values.length - 1]}
        aria-valuenow={value}
        tabIndex={0}
        className="relative z-0 h-full overflow-y-scroll outline-none [-ms-overflow-style:none] [scrollbar-width:none] focus:ring-2 focus:ring-zinc-300 [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: "y mandatory", scrollPaddingTop: PAD_HEIGHT }}
      >
        <div style={{ height: PAD_HEIGHT }} aria-hidden="true" />
        {values.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => handleItemClick(n)}
            className={`flex w-full items-center justify-center text-sm tabular-nums ${
              n === value ? "font-semibold text-zinc-900" : "text-zinc-500"
            }`}
            style={{ height: ITEM_HEIGHT, scrollSnapAlign: "start" }}
            tabIndex={-1}
          >
            {n}
            <span className="ml-0.5 text-xs">{suffix}</span>
          </button>
        ))}
        <div style={{ height: PAD_HEIGHT }} aria-hidden="true" />
      </div>
    </div>
  );
}

function formatDisplay(minutes: number | null): string {
  if (minutes === null || minutes === 0) return "Set time";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

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
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function onDocMouseDown(e: MouseEvent) {
      const w = wrapperRef.current;
      if (!w) return;
      if (!w.contains(e.target as Node)) setIsOpen(false);
    }
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const total = minutes ?? 0;
  const h = Math.min(23, Math.floor(total / 60));
  const m = total % 60;
  const isEmpty = minutes === null || minutes === 0;

  function commit(nextH: number, nextM: number) {
    const sum = nextH * 60 + nextM;
    onChange(sum === 0 ? null : sum);
  }

  return (
    <div ref={wrapperRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Estimated time"
        className={`rounded-md px-2 py-1 text-xs tabular-nums transition-colors disabled:opacity-50 ${
          isEmpty
            ? "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            : "border border-zinc-200 text-zinc-900 hover:bg-zinc-50"
        }`}
      >
        {formatDisplay(minutes)}
      </button>
      {isOpen && (
        <div
          role="dialog"
          aria-label="Pick estimated time"
          className="absolute left-0 top-full z-30 mt-1 flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg"
        >
          <WheelColumn
            values={HOUR_OPTIONS}
            value={h}
            onChange={(next) => commit(next, m)}
            suffix="h"
            ariaLabel="Hours"
          />
          <WheelColumn
            values={MINUTE_OPTIONS}
            value={m}
            onChange={(next) => commit(h, next)}
            suffix="m"
            ariaLabel="Minutes"
          />
          <div className="flex flex-col gap-1 ml-1">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className="rounded border px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded bg-zinc-900 px-2 py-1 text-xs text-white hover:bg-zinc-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
