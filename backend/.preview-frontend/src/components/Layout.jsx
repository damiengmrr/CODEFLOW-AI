import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
export default function Layout({ children }) {
  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        <main className="flex-1 overflow-auto p-6 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-900">
          <div className="max-w-6xl mx-auto space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
