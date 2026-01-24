export default function Topbar() {
  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <p className="text-xs text-slate-300">
          Interface React générée automatiquement par <span className="font-semibold text-slate-50">CODEFLOW-AI</span>
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <span>Structure prête à connecter à ton backend.</span>
      </div>
    </header>
  );
}
