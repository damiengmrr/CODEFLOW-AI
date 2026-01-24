import { NavLink } from "react-router-dom";
const links = [
  { label: "Login", to: "/login", icon: "●" },
  { label: "Profil", to: "/profil", icon: "●" },
  { label: "Paramètres", to: "/parametres", icon: "●" }
];
export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col w-60 border-r border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="h-14 flex items-center px-4 border-b border-slate-800">
        <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-brand-primary to-brand-accent mr-2" />
        <div>
          <div className="text-sm font-semibold tracking-tight">CODEFLOW UI</div>
          <div className="text-xs text-slate-400">Frontend généré</div>
        </div>
      </div>
      <nav className="flex-1 py-4 space-y-1 px-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${isActive
                ? "bg-slate-800 text-white"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white"}`
            }
          >
            <span className="text-xs">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
