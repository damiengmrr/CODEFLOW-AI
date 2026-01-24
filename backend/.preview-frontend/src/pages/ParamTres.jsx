import { useState } from "react";

export default function ParamTres() {
  const [profile, setProfile] = useState({
    name: "Damien Gamarra",
    email: "you@example.com",
    role: "Administrateur",
  });

  const [settings, setSettings] = useState({
    emailNotifs: true,
    pushNotifs: false,
    weeklyReport: true,
  });

  function handleProfileChange(e) {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  }

  function handleToggle(name) {
    setSettings((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  function handleSave(e) {
    e.preventDefault();
    // Ici tu peux brancher ton backend pour persister les préférences
    console.log("Profil sauvegardé", profile);
    console.log("Paramètres sauvegardés", settings);
  }

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
          Paramètres
        </h1>
        <p className="text-sm md:text-base text-slate-300 max-w-2xl">
          Préférences de compte et notifications
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <form
          onSubmit={handleSave}
          className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-4"
        >
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Profil
            </p>
            <p className="text-xs text-slate-400">
              Met à jour ton identité visible dans l’espace d’administration.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-300" htmlFor="name">
                Nom complet
              </label>
              <input
                id="name"
                name="name"
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                value={profile.name}
                onChange={handleProfileChange}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300" htmlFor="email">
                Adresse e-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                value={profile.email}
                onChange={handleProfileChange}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300" htmlFor="role">
                Rôle
              </label>
              <input
                id="role"
                name="role"
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                value={profile.role}
                onChange={handleProfileChange}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-brand-primary px-4 py-2 text-xs font-medium text-white shadow hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              Sauvegarder les modifications
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Notifications
            </p>
            <p className="text-xs text-slate-400">
              Choisis comment et quand tu veux être notifié.
            </p>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleToggle("emailNotifs")}
              className="flex w-full items-center justify-between rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-left text-xs text-slate-100 hover:border-slate-500"
            >
              <span>Notifications par e-mail</span>
              <span
                className={
                  "inline-flex h-4 w-7 items-center rounded-full border text-[10px] " +
                  (settings.emailNotifs
                    ? "border-emerald-400 bg-emerald-500/20 justify-end"
                    : "border-slate-600 bg-slate-800 justify-start")
                }
              >
                <span className="h-3 w-3 rounded-full bg-white" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleToggle("pushNotifs")}
              className="flex w-full items-center justify-between rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-left text-xs text-slate-100 hover:border-slate-500"
            >
              <span>Notifications push</span>
              <span
                className={
                  "inline-flex h-4 w-7 items-center rounded-full border text-[10px] " +
                  (settings.pushNotifs
                    ? "border-emerald-400 bg-emerald-500/20 justify-end"
                    : "border-slate-600 bg-slate-800 justify-start")
                }
              >
                <span className="h-3 w-3 rounded-full bg-white" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleToggle("weeklyReport")}
              className="flex w-full items-center justify-between rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-left text-xs text-slate-100 hover:border-slate-500"
            >
              <span>Rapport hebdomadaire par e-mail</span>
              <span
                className={
                  "inline-flex h-4 w-7 items-center rounded-full border text-[10px] " +
                  (settings.weeklyReport
                    ? "border-emerald-400 bg-emerald-500/20 justify-end"
                    : "border-slate-600 bg-slate-800 justify-start")
                }
              >
                <span className="h-3 w-3 rounded-full bg-white" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
