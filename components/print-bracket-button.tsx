"use client";

export function PrintBracketButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print-hide rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      Print Bracket
    </button>
  );
}
