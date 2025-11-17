// import { useState } from "react";

// function App() {
//   const [prompt, setPrompt] = useState(
//     "Génère un backend pour une API de todo list avec utilisateurs, authentification JWT et base PostgreSQL"
//   );
//   const [mode, setMode] = useState("backend-simple");
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState("");
//   const [selectedFile, setSelectedFile] = useState(null);

//   // 🔥 Nouveaux états
//   const [history, setHistory] = useState([]);
//   const [copyMessage, setCopyMessage] = useState("");
//   const [showRawResult, setShowRawResult] = useState(false);
//   const [rawCopyMessage, setRawCopyMessage] = useState("");

//   const handleModeChange = (newMode) => {
//     setMode(newMode);
//     if (newMode === "backend-simple") {
//       setPrompt(
//         "Génère un backend pour une API de todo list avec utilisateurs, authentification JWT et base PostgreSQL"
//       );
//     } else if (newMode === "full-project") {
//       setPrompt(
//         "Tu es un architecte logiciel senior. Génère un projet complet (backend uniquement) pour un SaaS de gestion de tâches avec : API REST Node.js + Express, base PostgreSQL, authentification JWT, rôles utilisateur (admin / user), logs basiques et structure de dossiers propre."
//       );
//     } else if (newMode === "auto-dev") {
//       setPrompt(
//         "Tu es un architecte fullstack. Propose un backend complet et prêt pour la prod pour un SaaS moderne, avec : API REST organisée, base PostgreSQL, système d’authentification sécurisée (JWT + refresh), gestion des permissions par rôle, services métiers, séparation controllers/services/models, et tout ce qu’il faut pour un projet clean et scalable."
//       );
//     }
//   };

//   const applyPresetPrompt = (presetPrompt) => {
//     setPrompt(presetPrompt);
//   };

//   // 🕒 Recharger une génération précédente
//   const handleLoadFromHistory = (entry) => {
//     setPrompt(entry.prompt);
//     setMode(entry.mode);
//     setResult({ plan: entry.plan, files: entry.files });
//     setSelectedFile(null);
//   };

//   // 📋 Copier le contenu du fichier sélectionné
//   const handleCopySelectedFile = async () => {
//     if (!selectedFile?.content) return;
//     try {
//       await navigator.clipboard.writeText(selectedFile.content);
//       setCopyMessage("Code copié dans le presse-papiers ✅");
//       setTimeout(() => setCopyMessage(""), 2000);
//     } catch (err) {
//       console.error(err);
//       setCopyMessage(
//         "Impossible de copier automatiquement, utilise ⌘A / Ctrl+A puis ⌘C / Ctrl+C."
//       );
//       setTimeout(() => setCopyMessage(""), 3000);
//     }
//   };

//   const handleCopyRawResult = async () => {
//     if (!result) return;
//     try {
//       const jsonString = JSON.stringify(result, null, 2);
//       await navigator.clipboard.writeText(jsonString);
//       setRawCopyMessage("JSON copié dans le presse-papiers ✅");
//       setTimeout(() => setRawCopyMessage(""), 2000);
//     } catch (err) {
//       console.error(err);
//       setRawCopyMessage(
//         "Impossible de copier automatiquement, utilise ⌘A / Ctrl+A puis ⌘C / Ctrl+C."
//       );
//       setTimeout(() => setRawCopyMessage(""), 3000);
//     }
//   };

//   const handleGenerate = async () => {
//     setLoading(true);
//     setError("");
//     setResult(null);

//     try {
//       const response = await fetch("http://localhost:4000/api/generate", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ prompt }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || "Erreur lors de la génération");
//       }

//       setResult(data);

//       // 📝 Ajout dans l’historique (max 10 entrées)
//       const entry = {
//         id: Date.now(),
//         createdAt: new Date().toLocaleTimeString(),
//         prompt,
//         mode,
//         plan: data.plan || null,
//         files: data.files || [],
//       };
//       setHistory((prev) => [entry, ...prev].slice(0, 10));
//       setSelectedFile(null);
//     } catch (err) {
//       console.error(err);
//       setError(err.message || "Erreur inconnue");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const plan = result?.plan;
//   const files = result?.files || [];

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background: "#050509",
//         color: "white",
//         fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
//       }}
//     >
//       <header
//         style={{
//           padding: "1.5rem 2.5rem",
//           borderBottom: "1px solid rgba(255,255,255,0.05)",
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           position: "sticky",
//           top: 0,
//           backdropFilter: "blur(12px)",
//           background: "linear-gradient(90deg,#050509,#090922)",
//           zIndex: 10,
//         }}
//       >
//         <div>
//           <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>Pridano Labs</div>
//           <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>
//             🚀 CODEFLOW-AI — Backend Generator
//           </h1>
//         </div>
//         <span
//           style={{
//             fontSize: "0.8rem",
//             padding: "0.3rem 0.7rem",
//             borderRadius: "999px",
//             border: "1px solid rgba(255,255,255,0.2)",
//             opacity: 0.8,
//           }}
//         >
//           Mode: <strong>Backend</strong>
//         </span>
//       </header>

//       <main
//         style={{
//           padding: "2rem 2.5rem 3rem",
//           display: "grid",
//           gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.5fr)",
//           gap: "2rem",
//         }}
//       >
//         {/* Colonne gauche : zone de prompt */}
//         <section>
//           <h2 style={{ fontSize: "1rem", opacity: 0.8, marginBottom: "0.5rem" }}>
//             1. Décris le backend à générer
//           </h2>

//           {/* Sélecteur de mode */}
//           <div
//             style={{
//               display: "flex",
//               gap: "0.5rem",
//               marginBottom: "0.75rem",
//               flexWrap: "wrap",
//             }}
//           >
//             <button
//               type="button"
//               onClick={() => handleModeChange("backend-simple")}
//               style={{
//                 padding: "0.4rem 0.9rem",
//                 borderRadius: "999px",
//                 border:
//                   mode === "backend-simple"
//                     ? "1px solid rgba(129,140,248,0.9)"
//                     : "1px solid rgba(148,163,184,0.4)",
//                 background:
//                   mode === "backend-simple"
//                     ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
//                     : "transparent",
//                 fontSize: "0.8rem",
//                 fontWeight: 500,
//                 cursor: "pointer",
//                 color: mode === "backend-simple" ? "white" : "rgba(226,232,240,0.9)",
//               }}
//             >
//               Backend simple
//             </button>
//             <button
//               type="button"
//               onClick={() => handleModeChange("full-project")}
//               style={{
//                 padding: "0.4rem 0.9rem",
//                 borderRadius: "999px",
//                 border:
//                   mode === "full-project"
//                     ? "1px solid rgba(129,140,248,0.9)"
//                     : "1px solid rgba(148,163,184,0.4)",
//                 background:
//                   mode === "full-project"
//                     ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
//                     : "transparent",
//                 fontSize: "0.8rem",
//                 fontWeight: 500,
//                 cursor: "pointer",
//                 color: mode === "full-project" ? "white" : "rgba(226,232,240,0.9)",
//               }}
//             >
//               Projet complet
//             </button>
//             <button
//               type="button"
//               onClick={() => handleModeChange("auto-dev")}
//               style={{
//                 padding: "0.4rem 0.9rem",
//                 borderRadius: "999px",
//                 border:
//                   mode === "auto-dev"
//                     ? "1px solid rgba(129,140,248,0.9)"
//                     : "1px solid rgba(148,163,184,0.4)",
//                 background:
//                   mode === "auto-dev"
//                     ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
//                     : "transparent",
//                 fontSize: "0.8rem",
//                 fontWeight: 500,
//                 cursor: "pointer",
//                 color: mode === "auto-dev" ? "white" : "rgba(226,232,240,0.9)",
//               }}
//             >
//               Mode auto-dev
//             </button>
//           </div>

//           <textarea
//             value={prompt}
//             onChange={(e) => setPrompt(e.target.value)}
//             rows={8}
//             style={{
//               width: "100%",
//               padding: "1rem",
//               borderRadius: "12px",
//               border: "1px solid rgba(255,255,255,0.08)",
//               background:
//                 "radial-gradient(circle at top left, #1b1b2d, #050509 50%)",
//               color: "white",
//               resize: "vertical",
//               fontSize: "0.95rem",
//               boxSizing: "border-box",
//               outline: "none",
//             }}
//           />

//           {/* Presets rapides */}
//           <div
//             style={{
//               marginTop: "0.75rem",
//               display: "flex",
//               flexWrap: "wrap",
//               gap: "0.5rem",
//               fontSize: "0.8rem",
//             }}
//           >
//             <span style={{ opacity: 0.7, alignSelf: "center" }}>
//               Presets rapides :
//             </span>
//             <button
//               type="button"
//               onClick={() =>
//                 applyPresetPrompt(
//                   "Génère un backend pour une API de todo list avec utilisateurs, authentification JWT et base PostgreSQL"
//                 )
//               }
//               style={{
//                 padding: "0.35rem 0.8rem",
//                 borderRadius: "999px",
//                 border: "1px solid rgba(148,163,184,0.5)",
//                 background: "rgba(15,23,42,0.7)",
//                 cursor: "pointer",
//                 color: "rgba(226,232,240,0.95)",
//               }}
//             >
//               Todo + JWT + Postgres
//             </button>
//             <button
//               type="button"
//               onClick={() =>
//                 applyPresetPrompt(
//                   "Génère un backend pour une API de blog avec gestion des articles, des commentaires et des utilisateurs, en Node.js + Express avec une base PostgreSQL."
//                 )
//               }
//               style={{
//                 padding: "0.35rem 0.8rem",
//                 borderRadius: "999px",
//                 border: "1px solid rgba(148,163,184,0.5)",
//                 background: "rgba(15,23,42,0.7)",
//                 cursor: "pointer",
//                 color: "rgba(226,232,240,0.95)",
//               }}
//             >
//               API Blog
//             </button>
//             <button
//               type="button"
//               onClick={() =>
//                 applyPresetPrompt(
//                   "Génère un backend e-commerce avec gestion des produits, des utilisateurs, des paniers et des commandes, en Node.js + Express avec PostgreSQL."
//                 )
//               }
//               style={{
//                 padding: "0.35rem 0.8rem",
//                 borderRadius: "999px",
//                 border: "1px solid rgba(148,163,184,0.5)",
//                 background: "rgba(15,23,42,0.7)",
//                 cursor: "pointer",
//                 color: "rgba(226,232,240,0.95)",
//               }}
//             >
//               API E-commerce
//             </button>
//             <button
//               type="button"
//               onClick={() =>
//                 applyPresetPrompt(
//                   "Tu es un expert en architectures SaaS. Génère le backend pour un SaaS d’abonnements mensuels (gestion des plans, clients, factures, rôles, webhooks de paiement, etc.) basé sur Node.js, Express et PostgreSQL."
//                 )
//               }
//               style={{
//                 padding: "0.35rem 0.8rem",
//                 borderRadius: "999px",
//                 border: "1px solid rgba(148,163,184,0.5)",
//                 background: "rgba(15,23,42,0.7)",
//                 cursor: "pointer",
//                 color: "rgba(226,232,240,0.95)",
//               }}
//             >
//               SaaS abonnements
//             </button>
//           </div>

//           <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
//             <button
//               onClick={handleGenerate}
//               disabled={loading}
//               style={{
//                 padding: "0.75rem 1.5rem",
//                 borderRadius: "999px",
//                 border: "none",
//                 background: loading
//                   ? "rgba(99,102,241,0.4)"
//                   : "linear-gradient(135deg,#6366f1,#8b5cf6)",
//                 color: "white",
//                 cursor: loading ? "default" : "pointer",
//                 fontWeight: 600,
//                 fontSize: "0.95rem",
//                 boxShadow:
//                   "0 10px 30px rgba(79,70,229,0.5), 0 0 20px rgba(59,130,246,0.4)",
//                 transition: "transform 0.1s ease, box-shadow 0.1s ease",
//               }}
//             >
//               {loading ? "Génération en cours..." : "Générer 🔥"}
//             </button>

//             <div
//               style={{
//                 fontSize: "0.8rem",
//                 opacity: 0.7,
//                 alignSelf: "center",
//               }}
//             >
//               Le code sera écrit dans <code>backend/generated/&lt;nom-projet&gt;</code>
//             </div>
//           </div>

//           {error && (
//             <p
//               style={{
//                 marginTop: "1rem",
//                 color: "#f97373",
//                 fontSize: "0.9rem",
//                 padding: "0.75rem 1rem",
//                 background: "rgba(127,29,29,0.3)",
//                 borderRadius: "8px",
//               }}
//             >
//               ❌ {error}
//             </p>
//           )}
//         </section>

//         {/* Colonne droite : affichage du résultat */}
//         <section>
//           <h2 style={{ fontSize: "1rem", opacity: 0.8, marginBottom: "0.75rem" }}>
//             2. Plan généré par l’IA
//           </h2>

//           {!plan && !loading && (
//             <p style={{ opacity: 0.6, fontSize: "0.9rem" }}>
//               Lance une génération pour voir le plan détaillé du backend (entités,
//               routes, fichiers…).
//             </p>
//           )}

//           {plan && (
//             <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
//               {/* Résumé */}
//               <div
//                 style={{
//                   padding: "1rem",
//                   borderRadius: "12px",
//                   background:
//                     "radial-gradient(circle at top right,#1e1b4b,#020617)",
//                   border: "1px solid rgba(129,140,248,0.4)",
//                 }}
//               >
//                 <div
//                   style={{
//                     fontSize: "0.8rem",
//                     opacity: 0.7,
//                     marginBottom: "0.25rem",
//                   }}
//                 >
//                   Stack
//                 </div>
//                 <div style={{ fontWeight: 600 }}>{plan.stack}</div>
//                 <p
//                   style={{
//                     marginTop: "0.5rem",
//                     fontSize: "0.9rem",
//                     opacity: 0.9,
//                   }}
//                 >
//                   {plan.description}
//                 </p>
//               </div>

//               {/* Entités */}
//               <div
//                 style={{
//                   padding: "1rem",
//                   borderRadius: "12px",
//                   background: "#020617",
//                   border: "1px solid rgba(148,163,184,0.4)",
//                 }}
//               >
//                 <h3
//                   style={{
//                     margin: 0,
//                     marginBottom: "0.5rem",
//                     fontSize: "0.95rem",
//                   }}
//                 >
//                   📚 Entités ({plan.entities?.length || 0})
//                 </h3>
//                 {(!plan.entities || plan.entities.length === 0) && (
//                   <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>
//                     Aucune entité détectée.
//                   </p>
//                 )}
//                 {plan.entities?.map((entity) => (
//                   <div
//                     key={entity.name}
//                     style={{
//                       marginTop: "0.5rem",
//                       padding: "0.5rem 0.75rem",
//                       borderRadius: "8px",
//                       background: "rgba(15,23,42,0.8)",
//                     }}
//                   >
//                     <div style={{ fontWeight: 600 }}>{entity.name}</div>
//                     <ul
//                       style={{
//                         margin: "0.25rem 0 0",
//                         paddingLeft: "1.1rem",
//                         fontSize: "0.85rem",
//                       }}
//                     >
//                       {entity.fields?.map((field) => (
//                         <li key={field.name}>
//                           <code>{field.name}</code> : {field.type}
//                           {field.primary ? " · primary" : ""}
//                           {field.unique ? " · unique" : ""}
//                           {field.reference ? ` → ${field.reference}` : ""}
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 ))}
//               </div>

//               {/* Routes */}
//               <div
//                 style={{
//                   padding: "1rem",
//                   borderRadius: "12px",
//                   background: "#020617",
//                   border: "1px solid rgba(56,189,248,0.5)",
//                 }}
//               >
//                 <h3
//                   style={{
//                     margin: 0,
//                     marginBottom: "0.5rem",
//                     fontSize: "0.95rem",
//                   }}
//                 >
//                   🧭 Routes ({plan.routes?.length || 0} groupes)
//                 </h3>
//                 {plan.routes?.map((routeGroup) => (
//                   <div
//                     key={routeGroup.name}
//                     style={{
//                       marginTop: "0.5rem",
//                       padding: "0.5rem 0.75rem",
//                       borderRadius: "8px",
//                       background: "rgba(8,47,73,0.8)",
//                     }}
//                   >
//                     <div style={{ fontWeight: 600 }}>
//                       {routeGroup.name}{" "}
//                       <span style={{ opacity: 0.7, fontSize: "0.8rem" }}>
//                         ({routeGroup.basePath})
//                       </span>
//                     </div>
//                     <ul
//                       style={{
//                         margin: "0.25rem 0 0",
//                         paddingLeft: "1.1rem",
//                         fontSize: "0.85rem",
//                       }}
//                     >
//                       {routeGroup.endpoints?.map((ep, idx) => (
//                         <li key={idx}>
//                           <code>{ep.method}</code> {routeGroup.basePath}
//                           {ep.path} →{" "}
//                           <span style={{ opacity: 0.9 }}>{ep.handler}</span>
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 ))}
//               </div>

//               {/* Fichiers */}
//               <div
//                 style={{
//                   padding: "1rem",
//                   borderRadius: "12px",
//                   background: "#020617",
//                   border: "1px solid rgba(148,163,184,0.4)",
//                 }}
//               >
//                 <h3
//                   style={{
//                     margin: 0,
//                     marginBottom: "0.5rem",
//                     fontSize: "0.95rem",
//                   }}
//                 >
//                   🗂 Fichiers générés ({files.length})
//                 </h3>
//                 {files.length === 0 && (
//                   <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>
//                     Aucun fichier n’a été renvoyé par l’API (mais le plan est
//                     prêt pour la génération côté backend).
//                   </p>
//                 )}
//                 <ul
//                   style={{
//                     margin: 0,
//                     paddingLeft: "0",
//                     fontSize: "0.85rem",
//                     maxHeight: "220px",
//                     overflow: "auto",
//                     listStyle: "none",
//                   }}
//                 >
//                   {files.map((f) => (
//                     <li key={f.path} style={{ marginBottom: "0.25rem" }}>
//                       <button
//                         type="button"
//                         onClick={() => setSelectedFile(f)}
//                         style={{
//                           width: "100%",
//                           textAlign: "left",
//                           background:
//                             selectedFile?.path === f.path
//                               ? "rgba(37, 99, 235, 0.25)"
//                               : "transparent",
//                           borderRadius: "6px",
//                           border: "1px solid rgba(148,163,184,0.5)",
//                           padding: "0.3rem 0.5rem",
//                           cursor: "pointer",
//                           color: "inherit",
//                           fontFamily:
//                             "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
//                           fontSize: "0.8rem",
//                         }}
//                       >
//                         {f.path}
//                       </button>
//                     </li>
//                   ))}
//                 </ul>

//                 {selectedFile && (
//                   <div
//                     style={{
//                       marginTop: "0.75rem",
//                       borderRadius: "8px",
//                       border: "1px solid rgba(148,163,184,0.6)",
//                       backgroundColor: "#020617",
//                       padding: "0.75rem",
//                       maxHeight: "260px",
//                       overflow: "auto",
//                     }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         alignItems: "center",
//                         marginBottom: "0.5rem",
//                         gap: "0.75rem",
//                       }}
//                     >
//                       <span
//                         style={{
//                           fontSize: "0.8rem",
//                           opacity: 0.8,
//                           fontFamily:
//                             "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
//                         }}
//                       >
//                         {selectedFile.path}
//                       </span>
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           gap: "0.5rem",
//                         }}
//                       >
//                         <button
//                           type="button"
//                           onClick={handleCopySelectedFile}
//                           style={{
//                             padding: "0.3rem 0.8rem",
//                             borderRadius: "999px",
//                             border: "1px solid rgba(148,163,184,0.7)",
//                             background: "rgba(15,23,42,0.9)",
//                             cursor: "pointer",
//                             fontSize: "0.75rem",
//                             fontWeight: 500,
//                             color: "rgba(226,232,240,0.95)",
//                           }}
//                         >
//                           Copier le fichier
//                         </button>
//                         <span
//                           style={{
//                             fontSize: "0.75rem",
//                             opacity: 0.7,
//                           }}
//                         >
//                           Ou sélectionne tout (⌘A / Ctrl+A) puis copie (⌘C / Ctrl+C)
//                         </span>
//                       </div>
//                     </div>
//                     <pre
//                       style={{
//                         margin: 0,
//                         fontSize: "0.8rem",
//                         lineHeight: 1.4,
//                         whiteSpace: "pre",
//                         overflowX: "auto",
//                       }}
//                     >
//                       <code>{selectedFile.content}</code>
//                     </pre>
//                     {copyMessage && (
//                       <p
//                         style={{
//                           marginTop: "0.5rem",
//                           fontSize: "0.8rem",
//                           opacity: 0.85,
//                           color: "#a5b4fc",
//                         }}
//                       >
//                         {copyMessage}
//                       </p>
//                     )}
//                   </div>
//                 )}
//               </div>

//               {/* Historique des générations */}
//               {history.length > 0 && (
//                 <div
//                   style={{
//                     padding: "1rem",
//                     borderRadius: "12px",
//                     background: "#020617",
//                     border: "1px solid rgba(55,65,81,0.8)",
//                   }}
//                 >
//                   <h3
//                     style={{
//                       margin: 0,
//                       marginBottom: "0.5rem",
//                       fontSize: "0.95rem",
//                     }}
//                   >
//                     🕒 Historique des générations ({history.length})
//                   </h3>
//                   <ul
//                     style={{
//                       margin: 0,
//                       padding: 0,
//                       listStyle: "none",
//                       display: "flex",
//                       flexDirection: "column",
//                       gap: "0.5rem",
//                       fontSize: "0.8rem",
//                     }}
//                   >
//                     {history.map((entry) => (
//                       <li
//                         key={entry.id}
//                         style={{
//                           padding: "0.5rem 0.75rem",
//                           borderRadius: "8px",
//                           background: "rgba(15,23,42,0.9)",
//                           border: "1px solid rgba(75,85,99,0.8)",
//                         }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                             marginBottom: "0.25rem",
//                             gap: "0.5rem",
//                           }}
//                         >
//                           <span
//                             style={{
//                               opacity: 0.8,
//                             }}
//                           >
//                             {entry.createdAt} · {entry.mode}
//                           </span>
//                           <button
//                             type="button"
//                             onClick={() => handleLoadFromHistory(entry)}
//                             style={{
//                               padding: "0.25rem 0.7rem",
//                               borderRadius: "999px",
//                               border: "1px solid rgba(129,140,248,0.9)",
//                               background: "rgba(30,64,175,0.7)",
//                               cursor: "pointer",
//                               fontSize: "0.75rem",
//                               fontWeight: 500,
//                               color: "white",
//                             }}
//                           >
//                             Recharger
//                           </button>
//                         </div>
//                         <div
//                           style={{
//                             opacity: 0.8,
//                             whiteSpace: "nowrap",
//                             overflow: "hidden",
//                             textOverflow: "ellipsis",
//                           }}
//                         >
//                           {entry.prompt}
//                         </div>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}

//               {result && (
//                 <div
//                   style={{
//                     marginTop: "0.75rem",
//                     padding: "1rem",
//                     borderRadius: "12px",
//                     background: "#020617",
//                     border: "1px solid rgba(55,65,81,0.8)",
//                   }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                       marginBottom: "0.5rem",
//                       gap: "0.75rem",
//                     }}
//                   >
//                     <h3
//                       style={{
//                         margin: 0,
//                         fontSize: "0.95rem",
//                       }}
//                     >
//                       📦 Résultat JSON brut (debug)
//                     </h3>
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: "0.5rem",
//                       }}
//                     >
//                       <button
//                         type="button"
//                         onClick={() => setShowRawResult((prev) => !prev)}
//                         style={{
//                           padding: "0.25rem 0.7rem",
//                           borderRadius: "999px",
//                           border: "1px solid rgba(148,163,184,0.7)",
//                           background: "rgba(15,23,42,0.9)",
//                           cursor: "pointer",
//                           fontSize: "0.75rem",
//                           fontWeight: 500,
//                           color: "rgba(226,232,240,0.95)",
//                         }}
//                       >
//                         {showRawResult ? "Masquer" : "Afficher"}
//                       </button>
//                       <button
//                         type="button"
//                         onClick={handleCopyRawResult}
//                         style={{
//                           padding: "0.25rem 0.7rem",
//                           borderRadius: "999px",
//                           border: "1px solid rgba(129,140,248,0.9)",
//                           background: "rgba(30,64,175,0.7)",
//                           cursor: "pointer",
//                           fontSize: "0.75rem",
//                           fontWeight: 500,
//                           color: "white",
//                         }}
//                       >
//                         Copier le JSON
//                       </button>
//                     </div>
//                   </div>
//                   {showRawResult && (
//                     <pre
//                       style={{
//                         margin: 0,
//                         fontSize: "0.8rem",
//                         lineHeight: 1.4,
//                         whiteSpace: "pre",
//                         overflowX: "auto",
//                         maxHeight: "260px",
//                       }}
//                     >
//                       <code>{JSON.stringify(result, null, 2)}</code>
//                     </pre>
//                   )}
//                   {rawCopyMessage && (
//                     <p
//                       style={{
//                         marginTop: "0.5rem",
//                         fontSize: "0.8rem",
//                         opacity: 0.85,
//                         color: "#a5b4fc",
//                       }}
//                     >
//                       {rawCopyMessage}
//                     </p>
//                   )}
//                 </div>
//               )}
//             </div>
//           )}
//         </section>
//       </main>
//     </div>
//   );
// }

// export default App;

import { useState } from "react";

function App() {
  const [prompt, setPrompt] = useState(
    "Génère un backend pour une API de todo list avec utilisateurs, authentification JWT et base PostgreSQL"
  );
  const [mode, setMode] = useState("backend-simple");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  // 🔥 Nouveaux états
  const [history, setHistory] = useState([]);
  const [copyMessage, setCopyMessage] = useState("");
  const [showRawResult, setShowRawResult] = useState(false);
  const [rawCopyMessage, setRawCopyMessage] = useState("");

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

  // 🕒 Recharger une génération précédente
  const handleLoadFromHistory = (entry) => {
    setPrompt(entry.prompt);
    setMode(entry.mode);
    setResult({ plan: entry.plan, files: entry.files });
    setSelectedFile(null);
  };

  // 📋 Copier le contenu du fichier sélectionné
  const handleCopySelectedFile = async () => {
    if (!selectedFile?.content) return;
    try {
      await navigator.clipboard.writeText(selectedFile.content);
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

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setSelectedFile(null);
    setShowRawResult(false);

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

      // 📝 Ajout dans l’historique (max 10 entrées)
      const entry = {
        id: Date.now(),
        createdAt: new Date().toLocaleTimeString(),
        prompt,
        mode,
        plan: data.plan || null,
        files: data.files || [],
      };
      setHistory((prev) => [entry, ...prev].slice(0, 10));
    } catch (err) {
      console.error(err);
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const plan = result?.plan;
  const files = result?.files || [];
  const recentHistory = history.slice(0, 5);

  const planSummary =
    plan && `${plan.entities?.length || 0} entités · ${
      plan.routes?.length || 0
    } groupes de routes · ${files.length} fichiers`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #0b1120 0, #020617 45%, #000 100%)",
        color: "white",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid rgba(148,163,184,0.25)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          backdropFilter: "blur(18px)",
          background:
            "linear-gradient(90deg, rgba(15,23,42,0.9), rgba(2,6,23,0.95))",
          zIndex: 20,
        }}
      >
        <div>
          <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>Pridano Labs</div>
          <h1
            style={{
              margin: 0,
              fontSize: "1.4rem",
              fontWeight: 700,
              letterSpacing: "0.03em",
            }}
          >
            🚀 CODEFLOW-AI
          </h1>
          <p
            style={{
              margin: "0.2rem 0 0",
              fontSize: "0.8rem",
              opacity: 0.75,
            }}
          >
            Ton IA pour générer des backends Node.js / Postgres prêts à copier.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "0.4rem",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.8rem",
              padding: "0.25rem 0.7rem",
              borderRadius: "999px",
              border: "1px solid rgba(148,163,184,0.4)",
              opacity: 0.9,
            }}
          >
            Mode : <strong>Backend</strong>
          </span>
        </div>
      </header>

      {/* MAIN */}
      <main
        style={{
          padding: "1.5rem 0.75rem 3rem",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "960px",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {/* BLOC "CHAT" */}
          <section
            style={{
              borderRadius: "18px",
              border: "1px solid rgba(148,163,184,0.35)",
              background:
                "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(15,23,42,0.75))",
              boxShadow:
                "0 22px 80px rgba(15,23,42,0.9), 0 0 60px rgba(59,130,246,0.25)",
              padding: "1.25rem 1.35rem 1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {/* Modes (genre "system prompt") */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.4rem",
                marginBottom: "0.4rem",
              }}
            >
              <button
                type="button"
                onClick={() => handleModeChange("backend-simple")}
                style={{
                  padding: "0.25rem 0.8rem",
                  borderRadius: "999px",
                  border:
                    mode === "backend-simple"
                      ? "1px solid rgba(129,140,248,0.9)"
                      : "1px solid rgba(148,163,184,0.4)",
                  background:
                    mode === "backend-simple"
                      ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                      : "rgba(15,23,42,0.9)",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  color:
                    mode === "backend-simple"
                      ? "white"
                      : "rgba(226,232,240,0.9)",
                }}
              >
                Backend simple
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("full-project")}
                style={{
                  padding: "0.25rem 0.8rem",
                  borderRadius: "999px",
                  border:
                    mode === "full-project"
                      ? "1px solid rgba(129,140,248,0.9)"
                      : "1px solid rgba(148,163,184,0.4)",
                  background:
                    mode === "full-project"
                      ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                      : "rgba(15,23,42,0.9)",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  color:
                    mode === "full-project"
                      ? "white"
                      : "rgba(226,232,240,0.9)",
                }}
              >
                Projet complet
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("auto-dev")}
                style={{
                  padding: "0.25rem 0.8rem",
                  borderRadius: "999px",
                  border:
                    mode === "auto-dev"
                      ? "1px solid rgba(129,140,248,0.9)"
                      : "1px solid rgba(148,163,184,0.4)",
                  background:
                    mode === "auto-dev"
                      ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                      : "rgba(15,23,42,0.9)",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  color:
                    mode === "auto-dev" ? "white" : "rgba(226,232,240,0.9)",
                }}
              >
                Mode auto-dev
              </button>
            </div>

            {/* "Conversation" style ChatGPT */}
            <div
              style={{
                borderRadius: "12px",
                border: "1px solid rgba(30,64,175,0.6)",
                background:
                  "radial-gradient(circle at top left,#111827,#020617)",
                padding: "0.75rem",
                maxHeight: "250px",
                overflow: "auto",
              }}
            >
              {recentHistory.length === 0 && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.8rem",
                    opacity: 0.7,
                  }}
                >
                  Commence par décrire le backend que tu veux et CODEFLOW-AI te
                  renverra un plan + des fichiers prêts à copier.
                </p>
              )}

              {recentHistory.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  {recentHistory.map((entry) => (
                    <div key={entry.id} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {/* Message user */}
                      <div
                        style={{
                          alignSelf: "flex-end",
                          maxWidth: "80%",
                          background:
                            "linear-gradient(135deg,#4f46e5,#7c3aed)",
                          borderRadius: "16px 16px 2px 16px",
                          padding: "0.45rem 0.6rem",
                          fontSize: "0.8rem",
                          boxShadow:
                            "0 8px 20px rgba(79,70,229,0.6)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.7rem",
                            opacity: 0.75,
                            marginBottom: "0.15rem",
                          }}
                        >
                          Toi · {entry.createdAt}
                        </div>
                        <div
                          style={{
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {entry.prompt}
                        </div>
                      </div>

                      {/* Message IA */}
                      <div
                        style={{
                          alignSelf: "flex-start",
                          maxWidth: "82%",
                          background: "rgba(15,23,42,0.95)",
                          borderRadius: "16px 16px 16px 2px",
                          padding: "0.45rem 0.6rem",
                          fontSize: "0.8rem",
                          border: "1px solid rgba(55,65,81,0.9)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.7rem",
                            opacity: 0.75,
                            marginBottom: "0.15rem",
                          }}
                        >
                          CODEFLOW-AI
                        </div>
                        <div
                          style={{
                            opacity: 0.9,
                          }}
                        >
                          {entry.plan ? (
                            <>
                              Plan généré :{" "}
                              <strong>{entry.plan.stack || "Stack inconnue"}</strong>
                              <br />
                              <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                                {entry.plan.description}
                              </span>
                            </>
                          ) : (
                            <span style={{ opacity: 0.7 }}>
                              Aucun plan détaillé enregistré pour cette génération.
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleLoadFromHistory(entry)}
                          style={{
                            marginTop: "0.35rem",
                            padding: "0.15rem 0.55rem",
                            borderRadius: "999px",
                            border: "1px solid rgba(129,140,248,0.8)",
                            background: "rgba(30,64,175,0.7)",
                            cursor: "pointer",
                            fontSize: "0.7rem",
                            color: "white",
                          }}
                        >
                          Recharger ce résultat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Zone de saisie type "barre de chat" */}
            <div
              style={{
                marginTop: "0.35rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="Décris le backend que tu veux générer..."
                style={{
                  width: "100%",
                  padding: "0.8rem 0.9rem",
                  borderRadius: "999px",
                  border: "1px solid rgba(148,163,184,0.45)",
                  background:
                    "radial-gradient(circle at top left,#020617,#000)",
                  color: "white",
                  resize: "none",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />

              {/* Ligne presets + bouton Générer */}
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
                  <span style={{ opacity: 0.7, alignSelf: "center" }}>
                    Presets :
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      applyPresetPrompt(
                        "Génère un backend pour une API de todo list avec utilisateurs, authentification JWT et base PostgreSQL"
                      )
                    }
                    style={{
                      padding: "0.25rem 0.7rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(148,163,184,0.5)",
                      background: "rgba(15,23,42,0.9)",
                      cursor: "pointer",
                      color: "rgba(226,232,240,0.95)",
                    }}
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
                    style={{
                      padding: "0.25rem 0.7rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(148,163,184,0.5)",
                      background: "rgba(15,23,42,0.9)",
                      cursor: "pointer",
                      color: "rgba(226,232,240,0.95)",
                    }}
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
                    style={{
                      padding: "0.25rem 0.7rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(148,163,184,0.5)",
                      background: "rgba(15,23,42,0.9)",
                      cursor: "pointer",
                      color: "rgba(226,232,240,0.95)",
                    }}
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
                    style={{
                      padding: "0.25rem 0.7rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(148,163,184,0.5)",
                      background: "rgba(15,23,42,0.9)",
                      cursor: "pointer",
                      color: "rgba(226,232,240,0.95)",
                    }}
                  >
                    SaaS abonnements
                  </button>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  style={{
                    padding: "0.65rem 1.4rem",
                    borderRadius: "999px",
                    border: "none",
                    background: loading
                      ? "rgba(99,102,241,0.4)"
                      : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                    color: "white",
                    cursor: loading ? "default" : "pointer",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    boxShadow:
                      "0 10px 30px rgba(79,70,229,0.6), 0 0 20px rgba(59,130,246,0.5)",
                    transition: "transform 0.08s ease, box-shadow 0.08s ease",
                    flexShrink: 0,
                  }}
                >
                  {loading ? "Génération..." : "Générer 🔥"}
                </button>
              </div>

              {error && (
                <p
                  style={{
                    marginTop: "0.4rem",
                    color: "#f97373",
                    fontSize: "0.8rem",
                    padding: "0.5rem 0.7rem",
                    background: "rgba(127,29,29,0.35)",
                    borderRadius: "999px",
                  }}
                >
                  ❌ {error}
                </p>
              )}

              <p
                style={{
                  marginTop: "0.2rem",
                  fontSize: "0.75rem",
                  opacity: 0.7,
                }}
              >
                Le code complet sera aussi écrit dans{" "}
                <code style={{ opacity: 0.9 }}>
                  backend/generated/&lt;nom-projet&gt;
                </code>{" "}
                côté backend (via le script).
              </p>
            </div>
          </section>

          {/* BLOC RESULTATS */}
          {result && (
            <section
              style={{
                borderRadius: "18px",
                border: "1px solid rgba(55,65,81,0.85)",
                background: "rgba(15,23,42,0.96)",
                padding: "1.2rem 1.35rem 1.1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.9rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "1rem",
                    }}
                  >
                    📦 Plan généré
                  </h2>
                  <p
                    style={{
                      margin: "0.25rem 0 0",
                      fontSize: "0.8rem",
                      opacity: 0.75,
                    }}
                  >
                    Résumé de ce backend + fichiers prêts à être copiés dans ton
                    projet.
                  </p>
                </div>
                {planSummary && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      opacity: 0.8,
                      padding: "0.25rem 0.6rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(148,163,184,0.7)",
                    }}
                  >
                    {planSummary}
                  </span>
                )}
              </div>

              {plan && (
                <>
                  {/* Résumé stack */}
                  <div
                    style={{
                      padding: "0.8rem 0.9rem",
                      borderRadius: "10px",
                      background:
                        "radial-gradient(circle at top right,#1e1b4b,#020617)",
                      border: "1px solid rgba(129,140,248,0.5)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.8rem",
                        opacity: 0.7,
                      }}
                    >
                      Stack
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                      {plan.stack}
                    </div>
                    <p
                      style={{
                        margin: "0.4rem 0 0",
                        fontSize: "0.85rem",
                        opacity: 0.9,
                      }}
                    >
                      {plan.description}
                    </p>
                  </div>

                  {/* Entités */}
                  <div
                    style={{
                      padding: "0.8rem 0.9rem",
                      borderRadius: "10px",
                      background: "#020617",
                      border: "1px solid rgba(148,163,184,0.45)",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        marginBottom: "0.4rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      📚 Entités ({plan.entities?.length || 0})
                    </h3>
                    {(!plan.entities || plan.entities.length === 0) && (
                      <p
                        style={{
                          fontSize: "0.8rem",
                          opacity: 0.7,
                          margin: 0,
                        }}
                      >
                        Aucune entité détectée.
                      </p>
                    )}
                    {plan.entities?.map((entity) => (
                      <div
                        key={entity.name}
                        style={{
                          marginTop: "0.4rem",
                          padding: "0.45rem 0.6rem",
                          borderRadius: "8px",
                          background: "rgba(15,23,42,0.9)",
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                          {entity.name}
                        </div>
                        <ul
                          style={{
                            margin: "0.25rem 0 0",
                            paddingLeft: "1.1rem",
                            fontSize: "0.8rem",
                          }}
                        >
                          {entity.fields?.map((field) => (
                            <li key={field.name}>
                              <code>{field.name}</code> : {field.type}
                              {field.primary ? " · primary" : ""}
                              {field.unique ? " · unique" : ""}
                              {field.reference ? ` → ${field.reference}` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Routes */}
                  <div
                    style={{
                      padding: "0.8rem 0.9rem",
                      borderRadius: "10px",
                      background: "#020617",
                      border: "1px solid rgba(56,189,248,0.55)",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        marginBottom: "0.4rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      🧭 Routes ({plan.routes?.length || 0} groupes)
                    </h3>
                    {(!plan.routes || plan.routes.length === 0) && (
                      <p
                        style={{
                          fontSize: "0.8rem",
                          opacity: 0.7,
                          margin: 0,
                        }}
                      >
                        Aucune route décrite.
                      </p>
                    )}
                    {plan.routes?.map((routeGroup) => (
                      <div
                        key={routeGroup.name}
                        style={{
                          marginTop: "0.4rem",
                          padding: "0.45rem 0.6rem",
                          borderRadius: "8px",
                          background: "rgba(8,47,73,0.9)",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.9rem",
                          }}
                        >
                          {routeGroup.name}{" "}
                          <span
                            style={{
                              opacity: 0.7,
                              fontSize: "0.75rem",
                            }}
                          >
                            ({routeGroup.basePath})
                          </span>
                        </div>
                        <ul
                          style={{
                            margin: "0.25rem 0 0",
                            paddingLeft: "1.1rem",
                            fontSize: "0.8rem",
                          }}
                        >
                          {routeGroup.endpoints?.map((ep, idx) => (
                            <li key={idx}>
                              <code>{ep.method}</code> {routeGroup.basePath}
                              {ep.path} →{" "}
                              <span style={{ opacity: 0.9 }}>{ep.handler}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Fichiers + preview + copie */}
              <div
                style={{
                  padding: "0.8rem 0.9rem",
                  borderRadius: "10px",
                  background: "#020617",
                  border: "1px solid rgba(148,163,184,0.45)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "0.9rem",
                  }}
                >
                  🗂 Fichiers générés ({files.length})
                </h3>
                {files.length === 0 && (
                  <p
                    style={{
                      fontSize: "0.8rem",
                      opacity: 0.7,
                      margin: 0,
                    }}
                  >
                    Aucun fichier n’a été renvoyé par l’API (mais le plan est
                    prêt pour la génération côté backend).
                  </p>
                )}

                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 0,
                    listStyle: "none",
                    fontSize: "0.8rem",
                    maxHeight: "180px",
                    overflow: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  {files.map((f) => {
                    const ext = f.path.split(".").pop() || "";
                    let typeLabel = "Fichier";
                    if (f.path.includes("/models/")) typeLabel = "Model";
                    else if (f.path.includes("/controllers/"))
                      typeLabel = "Controller";
                    else if (f.path.includes("/routes/")) typeLabel = "Route";
                    else if (f.path.includes("/services/")) typeLabel = "Service";
                    else if (f.path.includes("/config/")) typeLabel = "Config";
                    else if (f.path.includes("server")) typeLabel = "Serveur";

                    return (
                      <li key={f.path}>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(f)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            background:
                              selectedFile?.path === f.path
                                ? "rgba(37,99,235,0.3)"
                                : "rgba(15,23,42,0.9)",
                            borderRadius: "8px",
                            border: "1px solid rgba(75,85,99,0.9)",
                            padding: "0.35rem 0.55rem",
                            cursor: "pointer",
                            color: "inherit",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.4rem",
                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.4rem",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.7rem",
                                padding: "0.1rem 0.45rem",
                                borderRadius: "999px",
                                border:
                                  "1px solid rgba(148,163,184,0.7)",
                                opacity: 0.9,
                              }}
                            >
                              {typeLabel}
                            </span>
                            <span
                              style={{
                                fontSize: "0.8rem",
                              }}
                            >
                              {f.path}
                            </span>
                          </span>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              opacity: 0.7,
                              textTransform: "uppercase",
                            }}
                          >
                            .{ext}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {selectedFile && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      borderRadius: "8px",
                      border: "1px solid rgba(148,163,184,0.7)",
                      backgroundColor: "#020617",
                      padding: "0.7rem",
                      maxHeight: "260px",
                      overflow: "auto",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                        gap: "0.75rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.8rem",
                          opacity: 0.85,
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                        }}
                      >
                        {selectedFile.path}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                        }}
                      >
                        <button
                          type="button"
                          onClick={handleCopySelectedFile}
                          style={{
                            padding: "0.25rem 0.7rem",
                            borderRadius: "999px",
                            border: "1px solid rgba(148,163,184,0.8)",
                            background: "rgba(15,23,42,0.95)",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            color: "rgba(226,232,240,0.95)",
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
                      </div>
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        fontSize: "0.8rem",
                        lineHeight: 1.4,
                        whiteSpace: "pre",
                        overflowX: "auto",
                      }}
                    >
                      <code>{selectedFile.content}</code>
                    </pre>
                    {copyMessage && (
                      <p
                        style={{
                          marginTop: "0.4rem",
                          fontSize: "0.8rem",
                          opacity: 0.9,
                          color: "#a5b4fc",
                        }}
                      >
                        {copyMessage}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* JSON brut + bouton copier */}
              <div
                style={{
                  padding: "0.8rem 0.9rem",
                  borderRadius: "10px",
                  background: "#020617",
                  border: "1px solid rgba(55,65,81,0.85)",
                  marginTop: "0.1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "0.9rem",
                    }}
                  >
                    🧪 JSON brut (debug)
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowRawResult((prev) => !prev)}
                      style={{
                        padding: "0.25rem 0.7rem",
                        borderRadius: "999px",
                        border: "1px solid rgba(148,163,184,0.7)",
                        background: "rgba(15,23,42,0.95)",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        color: "rgba(226,232,240,0.95)",
                      }}
                    >
                      {showRawResult ? "Masquer" : "Afficher"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyRawResult}
                      style={{
                        padding: "0.25rem 0.7rem",
                        borderRadius: "999px",
                        border: "1px solid rgba(129,140,248,0.9)",
                        background: "rgba(30,64,175,0.7)",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        color: "white",
                      }}
                    >
                      Copier le JSON
                    </button>
                  </div>
                </div>
                {showRawResult && (
                  <pre
                    style={{
                      margin: "0.5rem 0 0",
                      fontSize: "0.8rem",
                      lineHeight: 1.4,
                      whiteSpace: "pre",
                      overflowX: "auto",
                      maxHeight: "260px",
                    }}
                  >
                    <code>{JSON.stringify(result, null, 2)}</code>
                  </pre>
                )}
                {rawCopyMessage && (
                  <p
                    style={{
                      marginTop: "0.4rem",
                      fontSize: "0.8rem",
                      opacity: 0.9,
                      color: "#a5b4fc",
                    }}
                  >
                    {rawCopyMessage}
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;