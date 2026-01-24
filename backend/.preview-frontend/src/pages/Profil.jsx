export default function Profil() {
  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
          Profil
        </h1>
        <p className="text-sm md:text-base text-slate-300 max-w-2xl">
          Informations personnelles et paramètres de compte
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Vue principale
          </p>
          <p className="text-xs text-slate-300">
            Utilise cette zone pour afficher tes données métier principales (tableaux, graphiques, formulaires...).
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Notes & raccourcis
          </p>
          <ul className="space-y-1 text-xs text-slate-300">
            <li>– Ajoute ici des raccourcis vers les actions importantes.</li>
            <li>– Affiche un résumé ou une TODO list rapide.</li>
            <li>– Connecte cette page à ton backend.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
