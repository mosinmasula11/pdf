"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { formatIndianAmount, indianAmountWords } from "@/lib/indian-amount";
import { groupNumber } from "@/lib/number-format";
import { useCurrencyFormat } from "./CurrencyFormat";

export function IndianAmountInput({ id, label, initialValue, onChange, placeholder }: {
  id: string; label: string; initialValue: number; onChange: (value: number) => void; placeholder: string;
}) {
  const {currency}=useCurrencyFormat(true);
  const [value, setValue] = useState(() => formatIndianAmount(String(initialValue))!);
  const display=groupNumber(value.replace(/,/g,""),currency);
  const input = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (caret.current !== null) input.current?.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  });
  return <>
    <input ref={input} id={id} type="text" inputMode="decimal" aria-label={label}
      aria-describedby={`${id}-words`} value={display} placeholder={placeholder}
      onKeyDown={(event) => {
        const field = event.currentTarget;
        const start = field.selectionStart ?? 0;
        if (start !== field.selectionEnd) return;
        if (event.key === "Backspace" && display[start - 1] === ",") field.setSelectionRange(Math.max(0, start - 2), start);
        if (event.key === "Delete" && display[start] === ",") field.setSelectionRange(start, start + 2);
      }}
      onChange={(event) => {
        const raw = event.target.value;
        const formatted = formatIndianAmount(raw);
        if (formatted === null) return;
        const grouped=groupNumber(formatted.replace(/,/g,""),currency);
        const before = raw.slice(0, event.target.selectionStart ?? raw.length).replace(/[,₹\s]/g, "").length;
        let position = 0, seen = 0;
        while (position < grouped.length && seen < before) {
          if (grouped[position] !== ",") seen++;
          position++;
        }
        caret.current = position;
        setValue(formatted);
        onChange(Number(formatted.replace(/,/g, "")) || 0);
      }}
      className="w-full pl-8 pr-4 py-2.5 rounded-md border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500" />
    <span id={`${id}-words`} className="block text-xs font-medium text-violet-700 mt-1.5 break-words">{indianAmountWords(value)}</span>
  </>;
}
