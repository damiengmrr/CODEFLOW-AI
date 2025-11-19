import Editor from "@monaco-editor/react";
import { useState } from "react";

const theme = {
  bodyBg: "#0b0f19",
  vscodeBg: "#1e1e1e",
  titlebarBg: "#3c3c3c",
  sidebarBg: "#252526",
  editorBg: "#1e1e1e",
  border: "#333333",
  accent: "#007acc",
  accentSoft: "rgba(0,122,204,0.4)",
  textMain: "#f5f5f5",
  textMuted: "#9ca3af",
};

const fileIconPaths = {
  folder: "/icons/folder.svg",
  js: "/icons/file-js.svg",
  json: "/icons/file-json.svg",
  md: "/icons/file-md.svg",
  env: "/icons/file-env.svg",
  config: "/icons/file-config.svg",
  routes: "/icons/file-routes.svg",
  controllers: "/icons/file-controller.svg",
  services: "/icons/file-service.svg",
  models: "/icons/file-model.svg",
  default: "/icons/file-default.svg",
};

function App() {
  const [prompt, setPrompt] = useState(
    "Génère un backend pour une API de todo list avec utilisateurs, authentification JWT et base PostgreSQL"
  );
  const [mode, setMode] = useState("backend-simple");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [selectedFilePath, setSelectedFilePath] = useState("");
  const [editedFiles, setEditedFiles] = useState({});
  const [copyMessage, setCopyMessage] = useState("");
  const [showRawResult, setShowRawResult] = useState(false);
  const [rawCopyMessage, setRawCopyMessage] = useState("");
  const [zipLoading, setZipLoading] = useState(false);
  const [zipMessage, setZipMessage] = useState("");
  const [aiEditing, setAiEditing] = useState(false);
  const [aiEditMessage, setAiEditMessage] = useState("");

  const hasResult = !!result;
  const plan = result?.plan;
  const files = result?.files || [];

  // 🔁 Helpers
  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === "backend-simple") {
      setPrompt(
        "Génère un backend pour une API de todo list avec utilisateurs, authentification JWT et base PostgreSQL"
      );
    } else if (newMode === "full-project") {
      setPrompt(
        "Tu es un architecte logiciel senior. Génère un projet complet (backend uniquement) pour un SaaS de gestion de tâches avec : API REST Node.js + Express, base PostgreSQL, authentification JWT, rôles utilisateur (admin / user), logs basiques et structure de dossiers propre."
      );
    } else if (newMode === "auto-dev") {
      setPrompt(
        "Tu es un architecte fullstack. Propose un backend complet et prêt pour la prod pour un SaaS moderne, avec : API REST organisée, base PostgreSQL, système d’authentification sécurisée (JWT + refresh), gestion des permissions par rôle, services métiers, séparation controllers/services/models, et tout ce qu’il faut pour un projet clean et scalable."
      );
    }
  };

  const applyPresetPrompt = (presetPrompt) => {
    setPrompt(presetPrompt);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setSelectedFilePath("");
    setShowRawResult(false);
    setCopyMessage("");
    setRawCopyMessage("");

    try {
      const response = await fetch("http://localhost:4000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la génération");
      }

      setResult(data);
      const entry = {
        id: Date.now(),
        createdAt: new Date().toLocaleTimeString(),
        prompt,
        mode,
        plan: data.plan || null,
        files: data.files || [],
      };
      setHistory((prev) => [entry, ...prev].slice(0, 15));

      if (data.files && data.files.length > 0) {
        setSelectedFilePath(data.files[0].path);
      }
      setEditedFiles({});
    } catch (err) {
      console.error(err);
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    setZipMessage("");
    try {
      setZipLoading(true);
      const response = await fetch("http://localhost:4000/api/generate/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Erreur lors de la génération du ZIP");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      const safeSlug = (prompt || "codeflow-backend")
        .slice(0, 40)
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, "-");

      a.href = url;
      a.download = `${safeSlug || "codeflow-backend"}-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setZipMessage("Archive ZIP téléchargée ✅");
      setTimeout(() => setZipMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setZipMessage(
        err?.message || "Erreur pendant le téléchargement du ZIP"
      );
    } finally {
      setZipLoading(false);
    }
  };

  const handleLoadFromHistory = (entry) => {
    setPrompt(entry.prompt);
    setMode(entry.mode);
    setResult({ plan: entry.plan, files: entry.files });
    setSelectedFilePath(entry.files?.[0]?.path || "");
    setEditedFiles({});
    setError("");
    setShowRawResult(false);
    setCopyMessage("");
    setRawCopyMessage("");
  };

  const handleCopyCurrentFile = async () => {
    const current = getCurrentFile();
    if (!current) return;
    const content = editedFiles[current.path] ?? current.content;
    try {
      await navigator.clipboard.writeText(content);
      setCopyMessage("Code copié dans le presse-papiers ✅");
      setTimeout(() => setCopyMessage(""), 2000);
    } catch (err) {
      console.error(err);
      setCopyMessage(
        "Impossible de copier automatiquement, utilise ⌘A / Ctrl+A puis ⌘C / Ctrl+C."
      );
      setTimeout(() => setCopyMessage(""), 3000);
    }
  };

  const handleCopyRawResult = async () => {
    if (!result) return;
    try {
      const jsonString = JSON.stringify(result, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setRawCopyMessage("JSON copié dans le presse-papiers ✅");
      setTimeout(() => setRawCopyMessage(""), 2000);
    } catch (err) {
      console.error(err);
      setRawCopyMessage(
        "Impossible de copier automatiquement, utilise ⌘A / Ctrl+A puis ⌘C / Ctrl+C."
      );
      setTimeout(() => setRawCopyMessage(""), 3000);
    }
  };

  // Helper: get icon for a file type (for Explorer sidebar)
  const getFileIcon = (path, name) => {
    const lowerPath = path.toLowerCase();
    const lowerName = (name || "").toLowerCase();

    if (lowerPath.endsWith(".json")) return fileIconPaths.json;
    if (lowerPath.endsWith(".md")) return fileIconPaths.md;
    if (lowerPath.endsWith(".env")) return fileIconPaths.env;

    if (lowerPath.includes("/config/") || lowerName.includes("config")) {
      return fileIconPaths.config;
    }
    if (lowerPath.includes("/routes/") || lowerName.includes("route")) {
      return fileIconPaths.routes;
    }
    if (lowerPath.includes("/controllers/") || lowerName.includes("controller")) {
      return fileIconPaths.controllers;
    }
    if (lowerPath.includes("/services/") || lowerName.includes("service")) {
      return fileIconPaths.services;
    }
    if (lowerPath.includes("/models/") || lowerName.includes("model")) {
      return fileIconPaths.models;
    }

    if (
      lowerPath.endsWith(".js") ||
      lowerPath.endsWith(".jsx") ||
      lowerPath.endsWith(".ts") ||
      lowerPath.endsWith(".tsx")
    ) {
      return fileIconPaths.js;
    }

    return fileIconPaths.default;
  };

  // 🗂 Construire une vue "Explorateur de fichiers" à partir des paths
  const buildFileGroups = () => {
    const groups = {};
    files.forEach((f) => {
      const parts = f.path.split("/");
      const top = parts[0] || "";
      const rest = parts.slice(1).join("/") || parts[0];
      if (!groups[top]) {
        groups[top] = [];
      }
      groups[top].push({
        name: rest,
        path: f.path,
      });
    });
    return Object.entries(groups).map(([folder, items]) => ({
      folder,
      items,
    }));
  };

  const fileGroups = buildFileGroups();

  const getCurrentFile = () => {
    if (!files.length) return null;
    const found =
      files.find((f) => f.path === selectedFilePath) || files[0] || null;
    return found;
  };

  const handleAiEdit = async () => {
    if (!result || !files.length) {
      setError(
        "Aucun backend généré pour le moment. Commence par générer un projet."
      );
      return;
    }

    const targetFile = currentFile;
    if (!targetFile) {
      setError("Sélectionne d'abord un fichier à modifier.");
      return;
    }

    setAiEditing(true);
    setAiEditMessage("");
    setError("");

    try {
      const body = {
        prompt,
        mode: "edit-file",
        targetFilePath: targetFile.path,
        files: files.map((f) => ({
          path: f.path,
          content: editedFiles[f.path] ?? f.content,
        })),
      };

      const response = await fetch("http://localhost:4000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la modification IA");
      }

      if (Array.isArray(data.files) && data.files.length > 0) {
        setResult((prev) => ({
          ...prev,
          plan: data.plan || prev?.plan || null,
          files: data.files,
        }));
      } else if (data.updatedFile && data.updatedFile.path) {
        const updatedFiles = files.map((f) =>
          f.path === data.updatedFile.path
            ? { ...f, content: data.updatedFile.content }
            : f
        );
        setResult((prev) => ({
          ...prev,
          plan: data.plan || prev?.plan || null,
          files: updatedFiles,
        }));
      } else {
        setAiEditMessage(
          "Modification effectuée, mais aucun fichier mis à jour n'a été renvoyé."
        );
        setTimeout(() => setAiEditMessage(""), 3000);
        return;
      }

      setEditedFiles({});
      setSelectedFilePath(targetFile.path);
      setAiEditMessage("Fichier mis à jour par l'IA ✅");
      setTimeout(() => setAiEditMessage(""), 2500);
    } catch (err) {
      console.error(err);
      setError(
        err?.message || "Erreur inconnue lors de la modification avec l'IA"
      );
    } finally {
      setAiEditing(false);
    }
  };

  const currentFile = getCurrentFile();
  const currentContent = currentFile
    ? editedFiles[currentFile.path] ?? currentFile.content
    : "";

  const planSummary =
    plan &&
    `${plan.entities?.length || 0} entités · ${
      plan.routes?.length || 0
    } groupes de routes · ${files.length} fichiers`;

  // 🧩 Composant de zone de chat (utilisé avant résultat + en bas de l'UI VSCode)
  const renderChatInput = ({ compact = false } = {}) => (
    <div
      style={{
        marginTop: compact ? "0.35rem" : "0.6rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.45rem",
      }}
    >
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={compact ? 2 : 3}
        placeholder="Décris le backend que tu veux générer..."
        style={{
          width: "100%",
          padding: compact ? "0.7rem 0.9rem" : "0.85rem 1rem",
          borderRadius: compact ? "999px" : "999px",
          border: `1px solid ${theme.border}`,
          background:
            "radial-gradient(circle at top left,#111827,#020617 60%)",
          color: theme.textMain,
          resize: "none",
          fontSize: "0.9rem",
          boxSizing: "border-box",
          outline: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.4rem",
            fontSize: "0.75rem",
            flex: "1 1 auto",
          }}
        >
          <span style={{ opacity: 0.7, alignSelf: "center" }}>＋ Presets :</span>
          <button
            type="button"
            onClick={() =>
              applyPresetPrompt(
                "Génère un backend pour une API de todo list avec utilisateurs, authentification JWT et base PostgreSQL"
              )
            }
            style={presetChipStyle}
          >
            Todo + JWT + Postgres
          </button>
          <button
            type="button"
            onClick={() =>
              applyPresetPrompt(
                "Génère un backend pour une API de blog avec gestion des articles, des commentaires et des utilisateurs, en Node.js + Express avec une base PostgreSQL."
              )
            }
            style={presetChipStyle}
          >
            API Blog
          </button>
          <button
            type="button"
            onClick={() =>
              applyPresetPrompt(
                "Génère un backend e-commerce avec gestion des produits, des utilisateurs, des paniers et des commandes, en Node.js + Express avec PostgreSQL."
              )
            }
            style={presetChipStyle}
          >
            API E-commerce
          </button>
          <button
            type="button"
            onClick={() =>
              applyPresetPrompt(
                "Tu es un expert en architectures SaaS. Génère le backend pour un SaaS d’abonnements mensuels (gestion des plans, clients, factures, rôles, webhooks de paiement, etc.) basé sur Node.js, Express et PostgreSQL."
              )
            }
            style={presetChipStyle}
          >
            SaaS abonnements
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleGenerate}
            disabled={loading || aiEditing}
            style={{
              padding: "0.6rem 1.4rem",
              borderRadius: "999px",
              border: "none",
              background: loading
                ? "rgba(0,122,204,0.4)"
                : "linear-gradient(135deg,#22c55e,#0ea5e9)",
              color: "#ecfeff",
              cursor: loading || aiEditing ? "default" : "pointer",
              fontWeight: 600,
              fontSize: "0.9rem",
              boxShadow:
                "0 10px 30px rgba(34,197,94,0.55), 0 0 20px rgba(14,165,233,0.55)",
            }}
          >
            {loading ? "Génération..." : "Générer 🔥"}
          </button>

          {hasResult && currentFile && (
            <button
              type="button"
              onClick={handleAiEdit}
              disabled={aiEditing || loading}
              style={{
                padding: "0.6rem 1.1rem",
                borderRadius: "999px",
                border: `1px solid ${theme.accent}`,
                background: aiEditing
                  ? "rgba(0,122,204,0.4)"
                  : "rgba(15,23,42,0.95)",
                color: aiEditing ? "#9ca3af" : "#e5e7eb",
                cursor: aiEditing || loading ? "default" : "pointer",
                fontWeight: 500,
                fontSize: "0.85rem",
              }}
            >
              {aiEditing ? "Modification..." : "Modifier ce fichier avec l'IA"}
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={zipLoading || loading || aiEditing}
            style={{
              padding: "0.6rem 1.1rem",
              borderRadius: "999px",
              border: `1px solid ${theme.border}`,
              background: zipLoading
                ? "rgba(15,23,42,0.8)"
                : "rgba(15,23,42,0.95)",
              color: zipLoading ? "#9ca3af" : "#e5e7eb",
              cursor: zipLoading || loading || aiEditing ? "default" : "pointer",
              fontWeight: 500,
              fontSize: "0.85rem",
            }}
          >
            {zipLoading ? "Préparation du ZIP..." : "Exporter en .zip"}
          </button>
        </div>
      </div>

      {error && (
        <p
          style={{
            marginTop: "0.3rem",
            color: "#f97373",
            fontSize: "0.8rem",
            padding: "0.45rem 0.7rem",
            background: "rgba(127,29,29,0.35)",
            borderRadius: "999px",
          }}
        >
          ❌ {error}
        </p>
      )}
      {zipMessage && (
        <p
          style={{
            marginTop: "0.25rem",
            color: "#a5b4fc",
            fontSize: "0.8rem",
            padding: "0.4rem 0.7rem",
            background: "rgba(30,64,175,0.35)",
            borderRadius: "999px",
          }}
        >
          {zipMessage}
        </p>
      )}
      {aiEditMessage && (
        <p
          style={{
            marginTop: "0.25rem",
            color: "#a5b4fc",
            fontSize: "0.8rem",
            padding: "0.4rem 0.7rem",
            background: "rgba(30,64,175,0.35)",
            borderRadius: "999px",
          }}
        >
          {aiEditMessage}
        </p>
      )}
    </div>
  );

  const presetChipStyle = {
    padding: "0.25rem 0.7rem",
    borderRadius: "999px",
    border: `1px solid ${theme.border}`,
    background: "rgba(15,23,42,0.95)",
    cursor: "pointer",
    color: "rgba(226,232,240,0.95)",
  };

  const recentHistory = history.slice(0, 6);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bodyBg,
        color: theme.textMain,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* TOP BAR (style un peu VSCode) */}
      <header
        style={{
          height: "52px",
          background:
            "linear-gradient(90deg,#020617,#020617 40%,#0b1120 100%)",
          borderBottom: `1px solid ${theme.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {/* Logo slot */}
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              overflow: "hidden",
              background:
                "radial-gradient(circle at 30% 0,#22c55e,#0ea5e9 40%,#0369a1 100%)",
              boxShadow: "0 0 0 1px rgba(34,197,94,0.45)",
            }}
          >
            {/* Remplace par /images/codeflow-logo.png dans public/ */}
            <img
              src="/images/codeflow-logo.png"
              alt="CODEFLOW-AI Logo"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: theme.textMuted,
              }}
            >
              Pridano Labs
            </div>
            <div
              style={{
                fontWeight: 600,
                fontSize: "0.95rem",
                letterSpacing: "0.06em",
              }}
            >
              CODEFLOW-AI
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.78rem",
              padding: "0.2rem 0.8rem",
              borderRadius: "999px",
              border: `1px solid ${theme.border}`,
              color: theme.textMuted,
            }}
          >
            Mode : <strong style={{ color: theme.textMain }}>Backend</strong>
          </span>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      {!hasResult ? (
        // 👇 Vue "ChatGPT" avant première génération
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "2rem 1.2rem 2.4rem",
          }}
        >
          <div
            style={{
              maxWidth: 860,
              width: "100%",
              borderRadius: 18,
              border: `1px solid ${theme.border}`,
              background:
                "radial-gradient(circle at top,#020617,#020617 55%,#000 100%)",
              padding: "1.3rem 1.4rem 1.1rem",
              boxShadow:
                "0 24px 80px rgba(15,23,42,0.9), 0 0 40px rgba(37,99,235,0.3)",
              display: "flex",
              flexDirection: "column",
              gap: "0.9rem",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  marginBottom: "0.25rem",
                }}
              >
                Décris ton backend, CODEFLOW génère les fichiers.
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  color: theme.textMuted,
                }}
              >
                Comme un chat avec un architecte backend : tu expliques, il te
                renvoie un plan + du code prêt à coller.
              </p>
            </div>

            {/* Mini "historique" en haut */}
            {recentHistory.length > 0 && (
              <div
                style={{
                  borderRadius: 10,
                  border: `1px solid ${theme.border}`,
                  background:
                    "linear-gradient(130deg,rgba(15,23,42,0.95),rgba(15,23,42,0.85))",
                  padding: "0.6rem 0.7rem",
                  maxHeight: 180,
                  overflow: "auto",
                }}
              >
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: theme.textMuted,
                    marginBottom: "0.25rem",
                  }}
                >
                  Tes dernières générations
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                  }}
                >
                  {recentHistory.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => handleLoadFromHistory(entry)}
                      style={{
                        textAlign: "left",
                        borderRadius: 8,
                        border: `1px solid ${theme.border}`,
                        background: "rgba(15,23,42,0.9)",
                        padding: "0.35rem 0.55rem",
                        cursor: "pointer",
                        color: theme.textMain,
                        fontSize: "0.78rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "0.3rem",
                        }}
                      >
                        <span style={{ opacity: 0.8 }}>{entry.mode}</span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            opacity: 0.65,
                          }}
                        >
                          {entry.createdAt}
                        </span>
                      </div>
                      <div
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          opacity: 0.85,
                        }}
                      >
                        {entry.prompt}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input principal */}
            {renderChatInput({ compact: false })}
          </div>
        </main>
      ) : (
        // 👇 Vue "éditeur VSCode" après génération
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#111827",
          }}
        >
          {/* Barre style VSCode (onglets / info projet) */}
          <div
            style={{
              height: 32,
              background: theme.titlebarBg,
              borderBottom: `1px solid ${theme.border}`,
              display: "flex",
              alignItems: "center",
              padding: "0 0.8rem",
              fontSize: "0.78rem",
              color: "#d4d4d4",
              gap: "0.7rem",
            }}
          >
            <span
              style={{
                padding: "0.15rem 0.5rem",
                borderRadius: 4,
                background: "#2d2d2d",
                border: "1px solid #3f3f3f",
              }}
            >
              plan.json
            </span>
            {currentFile && (
              <span
                style={{
                  padding: "0.15rem 0.5rem",
                  borderRadius: 4,
                  background: "#252526",
                  border: "1px solid #3f3f3f",
                }}
              >
                {currentFile.path}
              </span>
            )}
            {planSummary && (
              <span
                style={{
                  marginLeft: "auto",
                  opacity: 0.8,
                }}
              >
                {planSummary}
              </span>
            )}
          </div>

          {/* Zone centrale : Sidebar + Éditeur */}
          <div
            style={{
              flex: 1,
              display: "flex",
              minHeight: 0,
            }}
          >
            {/* EXPLORATEUR DE FICHIERS */}
            <aside
              style={{
                width: 260,
                background: theme.sidebarBg,
                borderRight: `1px solid ${theme.border}`,
                color: "#d4d4d4",
                fontSize: "0.8rem",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <div
                style={{
                  padding: "0.45rem 0.65rem",
                  borderBottom: `1px solid ${theme.border}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "0.72rem",
                  color: "#9ca3af",
                }}
              >
                Explorer
              </div>

              <div
                style={{
                  padding: "0.45rem 0.65rem",
                  borderBottom: `1px solid ${theme.border}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.3rem",
                }}
              >
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  <button
                    type="button"
                    onClick={() => handleModeChange("backend-simple")}
                    style={{
                      flex: 1,
                      padding: "0.25rem 0.3rem",
                      borderRadius: 4,
                      border:
                        mode === "backend-simple"
                          ? `1px solid ${theme.accent}`
                          : `1px solid ${theme.border}`,
                      background:
                        mode === "backend-simple"
                          ? "rgba(0,122,204,0.3)"
                          : "transparent",
                      color: "#e5e7eb",
                      fontSize: "0.72rem",
                      cursor: "pointer",
                    }}
                  >
                    Backend simple
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange("full-project")}
                    style={{
                      flex: 1,
                      padding: "0.25rem 0.3rem",
                      borderRadius: 4,
                      border:
                        mode === "full-project"
                          ? `1px solid ${theme.accent}`
                          : `1px solid ${theme.border}`,
                      background:
                        mode === "full-project"
                          ? "rgba(0,122,204,0.3)"
                          : "transparent",
                      color: "#e5e7eb",
                      fontSize: "0.72rem",
                      cursor: "pointer",
                    }}
                  >
                    Projet complet
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleModeChange("auto-dev")}
                  style={{
                    padding: "0.25rem 0.3rem",
                    borderRadius: 4,
                    border:
                      mode === "auto-dev"
                        ? `1px solid ${theme.accent}`
                        : `1px solid ${theme.border}`,
                    background:
                      mode === "auto-dev"
                        ? "rgba(0,122,204,0.3)"
                        : "transparent",
                    color: "#e5e7eb",
                    fontSize: "0.72rem",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  Mode auto-dev
                </button>
              </div>

              <div
                style={{
                  flex: 1,
                  overflow: "auto",
                  padding: "0.4rem 0.3rem 0.6rem 0.3rem",
                }}
              >
                {fileGroups.length === 0 && (
                  <p
                    style={{
                      padding: "0.4rem 0.6rem",
                      color: "#9ca3af",
                    }}
                  >
                    Aucun fichier généré. Relance une génération.
                  </p>
                )}

                {fileGroups.map((group) => (
                  <div key={group.folder}>
                    <div
                      style={{
                        padding: "0.15rem 0.4rem",
                        color: "#9ca3af",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.7rem",
                          opacity: 0.8,
                        }}
                      >
                        ▾
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <img
                          src={fileIconPaths.folder}
                          alt="Dossier"
                          style={{ width: 14, height: 14, display: "block" }}
                        />
                        <span>{group.folder}</span>
                      </div>
                    </div>
                    {group.items.map((item) => {
                      const isSelected = currentFile?.path === item.path;
                      return (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => setSelectedFilePath(item.path)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            background: isSelected
                              ? "#37373d"
                              : "transparent",
                            color: "#e5e7eb",
                            padding: "0.15rem 0.4rem 0.15rem 1.25rem",
                            cursor: "pointer",
                            fontSize: "0.78rem",
                          }}
                        >
                          <span style={{ marginRight: "0.35rem", display: "inline-flex", alignItems: "center" }}>
                            <img
                              src={getFileIcon(item.path, item.name)}
                              alt={item.name}
                              style={{ width: 14, height: 14, display: "block" }}
                            />
                          </span>
                          <span>{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Historique compact */}
              <div
                style={{
                  borderTop: `1px solid ${theme.border}`,
                  padding: "0.4rem 0.5rem",
                  fontSize: "0.72rem",
                  color: "#9ca3af",
                }}
              >
                <div
                  style={{
                    marginBottom: "0.2rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Historique
                </div>
                {recentHistory.length === 0 && (
                  <div style={{ opacity: 0.7 }}>Aucune génération encore.</div>
                )}
                {recentHistory.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                      maxHeight: 90,
                      overflow: "auto",
                    }}
                  >
                    {recentHistory.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => handleLoadFromHistory(entry)}
                        style={{
                          textAlign: "left",
                          borderRadius: 4,
                          border: "none",
                          background: "transparent",
                          padding: "0.15rem 0.1rem",
                          cursor: "pointer",
                          color: "#e5e7eb",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {entry.prompt}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            {/* ÉDITEUR PRINCIPAL */}
            <section
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: theme.vscodeBg,
                color: "#d4d4d4",
                minWidth: 0,
              }}
            >
              {/* Bandeau résumé plan */}
              {plan && (
                <div
                  style={{
                    padding: "0.5rem 0.85rem",
                    borderBottom: `1px solid ${theme.border}`,
                    background: "#252526",
                    fontSize: "0.8rem",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                  }}
                >
                  <div>
                    <strong>{plan.stack}</strong>
                    <span style={{ opacity: 0.8, marginLeft: 6 }}>
                      – {plan.description}
                    </span>
                  </div>
                </div>
              )}

              {/* Code editor + JSON debug */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  minHeight: 0,
                }}
              >
                {/* Zone éditeur fichier */}
                <div
                  style={{
                    flex: 3,
                    borderRight: `1px solid ${theme.border}`,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      padding: "0.45rem 0.85rem",
                      borderBottom: `1px solid ${theme.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.78rem",
                    }}
                  >
                    <span>{currentFile?.path || "Aucun fichier sélectionné"}</span>
                    {currentFile && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.45rem",
                        }}
                      >
                        <button
                          type="button"
                          onClick={handleCopyCurrentFile}
                          style={{
                            padding: "0.22rem 0.7rem",
                            borderRadius: 999,
                            border: `1px solid ${theme.border}`,
                            background: "#2d2d2d",
                            color: "#e5e7eb",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                          }}
                        >
                          Copier le fichier
                        </button>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            opacity: 0.7,
                          }}
                        >
                          ou ⌘A / Ctrl+A puis ⌘C / Ctrl+C
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newPath = prompt("Nom du nouveau fichier (ex: services/newFile.js)");
                            if (!newPath) return;
                            if (files.some((f) => f.path === newPath)) {
                              alert("Un fichier avec ce nom existe déjà.");
                              return;
                            }
                            const newFile = { path: newPath, content: "" };
                            setResult((prev) => ({
                              ...prev,
                              files: [...prev.files, newFile],
                            }));
                            setSelectedFilePath(newPath);
                          }}
                          style={{
                            padding: "0.22rem 0.7rem",
                            borderRadius: 999,
                            border: `1px solid ${theme.border}`,
                            background: "#2d2d2d",
                            color: "#e5e7eb",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                          }}
                        >
                          Nouveau fichier
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!currentFile) return;
                            const newName = prompt("Nouveau nom du fichier :", currentFile.path);
                            if (!newName) return;
                            if (files.some((f) => f.path === newName)) {
                              alert("Un fichier existe déjà avec ce nom.");
                              return;
                            }
                            const updatedFiles = files.map((file) =>
                              file.path === currentFile.path
                                ? { ...file, path: newName }
                                : file
                            );
                            setResult((prev) => ({
                              ...prev,
                              files: updatedFiles,
                            }));
                            setSelectedFilePath(newName);
                          }}
                          style={{
                            padding: "0.22rem 0.7rem",
                            borderRadius: 999,
                            border: `1px solid ${theme.border}`,
                            background: "#2d2d2d",
                            color: "#e5e7eb",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                          }}
                        >
                          Renommer
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!currentFile) return;
                            if (!confirm("Supprimer ce fichier ?")) return;
                            const updatedFiles = files.filter(
                              (file) => file.path !== currentFile.path
                            );
                            setResult((prev) => ({
                              ...prev,
                              files: updatedFiles,
                            }));
                            setSelectedFilePath(updatedFiles[0]?.path || "");
                          }}
                          style={{
                            padding: "0.22rem 0.7rem",
                            borderRadius: 999,
                            border: `1px solid #7f1d1d`,
                            background: "#7f1d1d55",
                            color: "#e5e7eb",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                          }}
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      background: theme.editorBg,
                      padding: "0.5rem 0.6rem",
                      overflow: "auto",
                    }}
                  >
                    {currentFile ? (
                      <Editor
                        height="100%"
                        width="100%"
                        theme="vs-dark"
                        defaultLanguage="javascript"
                        value={currentContent}
                        onChange={(value) =>
                          setEditedFiles((prev) => ({
                            ...prev,
                            [currentFile.path]: value ?? "",
                          }))
                        }
                      />
                    ) : (
                      <p
                        style={{
                          color: "#9ca3af",
                          fontSize: "0.85rem",
                        }}
                      >
                        Aucun fichier disponible. Génére un backend pour voir les
                        fichiers ici.
                      </p>
                    )}
                    {copyMessage && (
                      <p
                        style={{
                          marginTop: "0.4rem",
                          fontSize: "0.8rem",
                          color: "#a5b4fc",
                        }}
                      >
                        {copyMessage}
                      </p>
                    )}
                  </div>
                </div>

                {/* Panneau JSON / debug */}
                <div
                  style={{
                    flex: 2,
                    display: "flex",
                    flexDirection: "column",
                    background: "#1b1b1f",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      padding: "0.45rem 0.85rem",
                      borderBottom: `1px solid ${theme.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.78rem",
                    }}
                  >
                    <span>JSON brut (debug)</span>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.4rem",
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setShowRawResult((prev) => !prev)}
                        style={{
                          padding: "0.18rem 0.6rem",
                          borderRadius: 999,
                          border: `1px solid ${theme.border}`,
                          background: "#2d2d2d",
                          color: "#e5e7eb",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                        }}
                      >
                        {showRawResult ? "Masquer" : "Afficher"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyRawResult}
                        style={{
                          padding: "0.18rem 0.6rem",
                          borderRadius: 999,
                          border: `1px solid ${theme.accent}`,
                          background: "rgba(0,122,204,0.5)",
                          color: "#e5e7eb",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                        }}
                      >
                        Copier le JSON
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: "0.5rem 0.7rem",
                      overflow: "auto",
                    }}
                  >
                    {showRawResult ? (
                      <pre
                        style={{
                          margin: 0,
                          fontSize: "0.78rem",
                          lineHeight: 1.4,
                          whiteSpace: "pre",
                          color: "#e5e7eb",
                        }}
                      >
                        <code>{JSON.stringify(result, null, 2)}</code>
                      </pre>
                    ) : (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.8rem",
                          color: "#9ca3af",
                        }}
                      >
                        Clique sur &quot;Afficher&quot; pour voir le JSON brut
                        renvoyé par l&apos;API (plan + fichiers).
                      </p>
                    )}
                    {rawCopyMessage && (
                      <p
                        style={{
                          marginTop: "0.4rem",
                          fontSize: "0.8rem",
                          color: "#a5b4fc",
                        }}
                      >
                        {rawCopyMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* BARRE D'ENTRÉE EN BAS (style ChatGPT) */}
              <div
                style={{
                  borderTop: `1px solid ${theme.border}`,
                  padding: "0.6rem 0.9rem 0.8rem",
                  background: "#111827",
                }}
              >
                {renderChatInput({ compact: true })}
              </div>
            </section>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;