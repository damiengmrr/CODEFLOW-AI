// import { useState } from "react";
// const theme = {
//   bgGradientMain:
//     "radial-gradient(circle at top, #020617 0, #020617 40%, #000 100%)",
//   textMain: "#e5f3ff",
//   headerBorder: "1px solid rgba(15,118,110,0.35)",
//   headerBg:
//     "linear-gradient(90deg, rgba(15,23,42,0.96), rgba(8,47,73,0.96))",
// };

// function App() {
//   const [prompt, setPrompt] = useState(
//     "Génère un backend pour une API de todo list avec utilisateurs, authentification JWT et base PostgreSQL"
//   );
//   const [mode, setMode] = useState("backend-simple");
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState("");
//   const [selectedFile, setSelectedFile] = useState(null);

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

//   const handleLoadFromHistory = (entry) => {
//     setPrompt(entry.prompt);
//     setMode(entry.mode);
//     setResult({ plan: entry.plan, files: entry.files });
//     setSelectedFile(null);
//     setShowRawResult(false);
//     setError("");
//   };

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
//     setSelectedFile(null);
//     setShowRawResult(false);

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

//       const entry = {
//         id: Date.now(),
//         createdAt: new Date().toLocaleTimeString(),
//         prompt,
//         mode,
//         plan: data.plan || null,
//         files: data.files || [],
//       };
//       setHistory((prev) => [entry, ...prev].slice(0, 15));
//     } catch (err) {
//       console.error(err);
//       setError(err.message || "Erreur inconnue");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const plan = result?.plan;
//   const files = result?.files || [];
//   const recentHistory = history.slice(0, 6);

//   const planSummary =
//     plan && `${plan.entities?.length || 0} entités · ${
//       plan.routes?.length || 0
//     } groupes de routes · ${files.length} fichiers`;

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background: theme.bgGradientMain,
//         color: theme.textMain,
//         fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
//       }}
//     >
//       {/* HEADER */}
//       <header
//         style={{
//           padding: "1rem 1.75rem",
//           borderBottom: theme.headerBorder,
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           position: "sticky",
//           top: 0,
//           backdropFilter: "blur(18px)",
//           background: theme.headerBg,
//           zIndex: 20,
//         }}
//       >
//         <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
//           <div
//             style={{
//               width: "40px",
//               height: "40px",
//               borderRadius: "12px",
//               background:
//                 "radial-gradient(circle at 30% 0%, #22c55e 0, #0ea5e9 40%, #0369a1 100%)",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               overflow: "hidden",
//               boxShadow: "0 0 0 1px rgba(15,118,110,0.5)",
//             }}
//           >
//             {/* Remplace le src par le chemin de ton vrai logo (ex: /codeflow-logo.png) */}
//             <img
//               src="/images/codeflow-logo.png"
//               alt="Logo CODEFLOW AI"
//               style={{
//                 width: "100%",
//                 height: "100%",
//                 objectFit: "contain",
//                 display: "block",
//               }}
//             />
//           </div>
//           <div>
//             <div
//               style={{
//                 fontSize: "0.75rem",
//                 opacity: 0.65,
//               }}
//             >
//               Pridano Labs
//             </div>
//             <h1
//               style={{
//                 margin: 0,
//                 fontSize: "1.35rem",
//                 fontWeight: 700,
//                 letterSpacing: "0.04em",
//               }}
//             >
//               CODEFLOW-AI
//             </h1>
//             <p
//               style={{
//                 margin: "0.2rem 0 0",
//                 fontSize: "0.8rem",
//                 opacity: 0.8,
//               }}
//             >
//               Ton IA pour générer des backends Node.js / Postgres prêts à être
//               collés dans VSCode.
//             </p>
//           </div>
//         </div>

//         <div
//           style={{
//             display: "flex",
//             gap: "0.4rem",
//             alignItems: "center",
//           }}
//         >
//           <span
//             style={{
//               fontSize: "0.8rem",
//               padding: "0.25rem 0.7rem",
//               borderRadius: "999px",
//               border: "1px solid rgba(148,163,184,0.45)",
//               opacity: 0.9,
//             }}
//           >
//             Mode : <strong>Backend</strong>
//           </span>
//         </div>
//       </header>

//       {/* MAIN LAYOUT */}
//       <main
//         style={{
//           padding: "1.5rem 1.2rem 2.5rem",
//           display: "flex",
//           justifyContent: "center",
//         }}
//       >
//         <div
//           style={{
//             width: "100%",
//             maxWidth: "1200px",
//             display: "flex",
//             gap: "1.5rem",
//           }}
//         >
//           {/* SIDEBAR */}
//           <aside
//             style={{
//               width: "250px",
//               flexShrink: 0,
//               display: "flex",
//               flexDirection: "column",
//               gap: "1rem",
//             }}
//           >
//             {/* Carte produit */}
//             <div
//               style={{
//                 borderRadius: "18px",
//                 border: "1px solid rgba(45,212,191,0.4)",
//                 background:
//                   "radial-gradient(circle at top,#022c22,#020617 60%)",
//                 padding: "0.9rem 1rem",
//                 boxShadow:
//                   "0 18px 60px rgba(6,95,70,0.7), 0 0 40px rgba(8,47,73,0.6)",
//               }}
//             >
//               <div
//                 style={{
//                   fontSize: "0.78rem",
//                   textTransform: "uppercase",
//                   letterSpacing: "0.14em",
//                   opacity: 0.7,
//                   marginBottom: "0.25rem",
//                 }}
//               >
//                 Flow backend
//               </div>
//               <p
//                 style={{
//                   margin: 0,
//                   fontSize: "0.86rem",
//                   opacity: 0.92,
//                 }}
//               >
//                 Décris ton API, CODEFLOW-AI sort le plan d&apos;archi +
//                 fichiers modèles (routes, modèles, services...).
//               </p>
//             </div>

//             {/* Visuels d'architecture (placeholders pour tes images) */}
//             <div
//               style={{
//                 borderRadius: "16px",
//                 border: "1px solid rgba(37,99,235,0.7)",
//                 background: "rgba(15,23,42,0.98)",
//                 padding: "0.7rem 0.8rem",
//                 display: "flex",
//                 flexDirection: "column",
//                 gap: "0.5rem",
//               }}
//             >
//               <div
//                 style={{
//                   fontSize: "0.8rem",
//                   opacity: 0.8,
//                   marginBottom: "0.1rem",
//                 }}
//               >
//                 Vue d&apos;ensemble backend
//               </div>

//               <div
//                 style={{
//                   borderRadius: "12px",
//                   overflow: "hidden",
//                   border: "1px solid rgba(148,163,184,0.4)",
//                   background: "rgba(15,23,42,0.95)",
//                 }}
//               >
//                 {/* Schéma global (image 1) */}
//                 {/* Remplace le src par ton image de type &quot;diagramme backend&quot; */}
//                 <img
//                   src="/images/backend-architecture-1.png"
//                   alt="Schéma d&apos;architecture backend"
//                   style={{
//                     width: "100%",
//                     height: "120px",
//                     objectFit: "cover",
//                     display: "block",
//                   }}
//                 />
//               </div>

//               <div
//                 style={{
//                   borderRadius: "12px",
//                   overflow: "hidden",
//                   border: "1px solid rgba(148,163,184,0.4)",
//                   background: "rgba(15,23,42,0.95)",
//                 }}
//               >
//                 {/* Schéma entités / routes (image 2) */}
//                 {/* Remplace le src par ton image de type &quot;User / Express / Booking / Routes&quot; */}
//                 <img
//                   src="/images/backend-architecture-2.png"
//                   alt="Diagramme entités et routes"
//                   style={{
//                     width: "100%",
//                     height: "120px",
//                     objectFit: "cover",
//                     display: "block",
//                   }}
//                 />
//               </div>
//             </div>

//             {/* Sélecteur de mode */}
//             <div
//               style={{
//                 borderRadius: "14px",
//                 border: "1px solid rgba(51,65,85,0.9)",
//                 background: "rgba(15,23,42,0.95)",
//                 padding: "0.85rem 0.9rem",
//                 display: "flex",
//                 flexDirection: "column",
//                 gap: "0.45rem",
//               }}
//             >
//               <div
//                 style={{
//                   fontSize: "0.8rem",
//                   opacity: 0.8,
//                   marginBottom: "0.15rem",
//                 }}
//               >
//                 Mode IA
//               </div>
//               <button
//                 type="button"
//                 onClick={() => handleModeChange("backend-simple")}
//                 style={{
//                   padding: "0.35rem 0.7rem",
//                   borderRadius: "999px",
//                   border:
//                     mode === "backend-simple"
//                       ? "1px solid rgba(34,197,94,0.9)"
//                       : "1px solid rgba(51,65,85,0.9)",
//                   background:
//                     mode === "backend-simple"
//                       ? "linear-gradient(135deg,#22c55e,#0ea5e9)"
//                       : "rgba(15,23,42,0.9)",
//                   fontSize: "0.78rem",
//                   fontWeight: 500,
//                   cursor: "pointer",
//                   color:
//                     mode === "backend-simple"
//                       ? "#ecfeff"
//                       : "rgba(226,232,240,0.9)",
//                   textAlign: "left",
//                 }}
//               >
//                 Backend simple
//                 <span style={{ opacity: 0.7, marginLeft: 4 }}>
//                   · Todo, CRUD, JWT...
//                 </span>
//               </button>
//               <button
//                 type="button"
//                 onClick={() => handleModeChange("full-project")}
//                 style={{
//                   padding: "0.35rem 0.7rem",
//                   borderRadius: "999px",
//                   border:
//                     mode === "full-project"
//                       ? "1px solid rgba(34,197,94,0.9)"
//                       : "1px solid rgba(51,65,85,0.9)",
//                   background:
//                     mode === "full-project"
//                       ? "linear-gradient(135deg,#22c55e,#0ea5e9)"
//                       : "rgba(15,23,42,0.9)",
//                   fontSize: "0.78rem",
//                   fontWeight: 500,
//                   cursor: "pointer",
//                   color:
//                     mode === "full-project"
//                       ? "#ecfeff"
//                       : "rgba(226,232,240,0.9)",
//                   textAlign: "left",
//                 }}
//               >
//                 Projet complet
//                 <span style={{ opacity: 0.7, marginLeft: 4 }}>
//                   · SaaS structuré
//                 </span>
//               </button>
//               <button
//                 type="button"
//                 onClick={() => handleModeChange("auto-dev")}
//                 style={{
//                   padding: "0.35rem 0.7rem",
//                   borderRadius: "999px",
//                   border:
//                     mode === "auto-dev"
//                       ? "1px solid rgba(34,197,94,0.9)"
//                       : "1px solid rgba(51,65,85,0.9)",
//                   background:
//                     mode === "auto-dev"
//                       ? "linear-gradient(135deg,#22c55e,#0ea5e9)"
//                       : "rgba(15,23,42,0.9)",
//                   fontSize: "0.78rem",
//                   fontWeight: 500,
//                   cursor: "pointer",
//                   color:
//                     mode === "auto-dev"
//                       ? "#ecfeff"
//                       : "rgba(226,232,240,0.9)",
//                   textAlign: "left",
//                 }}
//               >
//                 Mode auto-dev
//                 <span style={{ opacity: 0.7, marginLeft: 4 }}>
//                   · Archi plus avancée
//                 </span>
//               </button>
//             </div>

//             {/* Historique dans la sidebar */}
//             <div
//               style={{
//                 borderRadius: "14px",
//                 border: "1px solid rgba(30,64,175,0.7)",
//                 background: "rgba(15,23,42,0.96)",
//                 padding: "0.85rem 0.9rem",
//                 display: "flex",
//                 flexDirection: "column",
//                 gap: "0.45rem",
//                 flex: 1,
//                 minHeight: "0",
//               }}
//             >
//               <div
//                 style={{
//                   fontSize: "0.8rem",
//                   opacity: 0.8,
//                   marginBottom: "0.15rem",
//                   display: "flex",
//                   justifyContent: "space-between",
//                   alignItems: "center",
//                 }}
//               >
//                 <span>Historique</span>
//                 {history.length > 0 && (
//                   <span
//                     style={{
//                       fontSize: "0.7rem",
//                       opacity: 0.7,
//                     }}
//                   >
//                     {history.length} générations
//                   </span>
//                 )}
//               </div>

//               {recentHistory.length === 0 && (
//                 <p
//                   style={{
//                     margin: 0,
//                     fontSize: "0.78rem",
//                     opacity: 0.7,
//                   }}
//                 >
//                   Tes dernières générations apparaîtront ici, prêtes à être
//                   rechargées.
//                 </p>
//               )}

//               {recentHistory.length > 0 && (
//                 <ul
//                   style={{
//                     margin: 0,
//                     padding: 0,
//                     listStyle: "none",
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "0.4rem",
//                     fontSize: "0.78rem",
//                     maxHeight: "210px",
//                     overflow: "auto",
//                   }}
//                 >
//                   {recentHistory.map((entry) => (
//                     <li key={entry.id}>
//                       <button
//                         type="button"
//                         onClick={() => handleLoadFromHistory(entry)}
//                         style={{
//                           width: "100%",
//                           textAlign: "left",
//                           borderRadius: "10px",
//                           border: "1px solid rgba(51,65,85,0.95)",
//                           background: "rgba(15,23,42,0.98)",
//                           padding: "0.35rem 0.5rem",
//                           cursor: "pointer",
//                           color: "inherit",
//                           display: "flex",
//                           flexDirection: "column",
//                           gap: "0.1rem",
//                         }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                             gap: "0.25rem",
//                           }}
//                         >
//                           <span
//                             style={{
//                               opacity: 0.75,
//                             }}
//                           >
//                             {entry.mode}
//                           </span>
//                           <span
//                             style={{
//                               fontSize: "0.7rem",
//                               opacity: 0.65,
//                             }}
//                           >
//                             {entry.createdAt}
//                           </span>
//                         </div>
//                         <div
//                           style={{
//                             whiteSpace: "nowrap",
//                             overflow: "hidden",
//                             textOverflow: "ellipsis",
//                             opacity: 0.8,
//                           }}
//                         >
//                           {entry.prompt}
//                         </div>
//                       </button>
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </div>
//           </aside>

//           {/* MAIN COLUMN (CHAT + RESULTS) */}
//           <section
//             style={{
//               flex: 1,
//               display: "flex",
//               flexDirection: "column",
//               gap: "1rem",
//               minWidth: 0,
//             }}
//           >
//             {/* CHAT BLOCK */}
//             <section
//               style={{
//                 borderRadius: "18px",
//                 border: "1px solid rgba(30,64,175,0.7)",
//                 background:
//                   "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(8,47,73,0.95))",
//                 boxShadow:
//                   "0 22px 80px rgba(15,23,42,0.9), 0 0 50px rgba(56,189,248,0.2)",
//                 padding: "1rem 1.1rem 0.85rem",
//                 display: "flex",
//                 flexDirection: "column",
//                 gap: "0.75rem",
//               }}
//             >
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   alignItems: "baseline",
//                   gap: "0.75rem",
//                 }}
//               >
//                 <div>
//                   <h2
//                     style={{
//                       margin: 0,
//                       fontSize: "0.98rem",
//                     }}
//                   >
//                     Décris ton backend, CODEFLOW fait le reste.
//                   </h2>
//                   <p
//                     style={{
//                       margin: "0.2rem 0 0",
//                       fontSize: "0.8rem",
//                       opacity: 0.78,
//                     }}
//                   >
//                     Tu peux écrire en français ou anglais, décrire ton API, tes
//                     entités, ta stack...
//                   </p>
//                 </div>
//               </div>

//               {/* Zone "conversation" */}
//               <div
//                 style={{
//                   borderRadius: "12px",
//                   border: "1px solid rgba(30,64,175,0.7)",
//                   background:
//                     "radial-gradient(circle at top left,#020617,#020617)",
//                   padding: "0.75rem",
//                   maxHeight: "260px",
//                   overflow: "auto",
//                   display: "flex",
//                   flexDirection: "column",
//                   gap: "0.6rem",
//                 }}
//               >
//                 {recentHistory.length === 0 && (
//                   <p
//                     style={{
//                       margin: 0,
//                       fontSize: "0.8rem",
//                       opacity: 0.75,
//                     }}
//                   >
//                     Exemples : &quot;API de todo list avec utilisateurs et JWT&quot;,
//                     &quot;Backend e-commerce Node + Postgres&quot;,
//                     &quot;SaaS d&apos;abonnements avec rôles admin / user&quot;...
//                   </p>
//                 )}

//                 {recentHistory.length > 0 &&
//                   recentHistory.map((entry) => (
//                     <div
//                       key={entry.id}
//                       style={{
//                         display: "flex",
//                         flexDirection: "column",
//                         gap: "0.25rem",
//                       }}
//                     >
//                       {/* Message user */}
//                       <div
//                         style={{
//                           alignSelf: "flex-end",
//                           maxWidth: "80%",
//                           background:
//                             "linear-gradient(135deg,#0ea5e9,#22c55e)",
//                           borderRadius: "16px 16px 2px 16px",
//                           padding: "0.45rem 0.6rem",
//                           fontSize: "0.8rem",
//                           boxShadow: "0 8px 22px rgba(14,165,233,0.6)",
//                           color: "#e0f2fe",
//                         }}
//                       >
//                         <div
//                           style={{
//                             fontSize: "0.7rem",
//                             opacity: 0.8,
//                             marginBottom: "0.12rem",
//                           }}
//                         >
//                           Toi · {entry.createdAt}
//                         </div>
//                         <div
//                           style={{
//                             whiteSpace: "pre-wrap",
//                           }}
//                         >
//                           {entry.prompt}
//                         </div>
//                       </div>

//                       {/* Message IA */}
//                       <div
//                         style={{
//                           alignSelf: "flex-start",
//                           maxWidth: "82%",
//                           background: "rgba(15,23,42,0.98)",
//                           borderRadius: "16px 16px 16px 2px",
//                           padding: "0.45rem 0.6rem",
//                           fontSize: "0.8rem",
//                           border: "1px solid rgba(30,64,175,0.9)",
//                         }}
//                       >
//                         <div
//                           style={{
//                             fontSize: "0.7rem",
//                             opacity: 0.8,
//                             marginBottom: "0.12rem",
//                           }}
//                         >
//                           CODEFLOW-AI
//                         </div>
//                         <div
//                           style={{
//                             opacity: 0.92,
//                           }}
//                         >
//                           {entry.plan ? (
//                             <>
//                               Plan généré :{" "}
//                               <strong>
//                                 {entry.plan.stack || "Stack inconnue"}
//                               </strong>
//                               <br />
//                               <span
//                                 style={{
//                                   fontSize: "0.75rem",
//                                   opacity: 0.8,
//                                 }}
//                               >
//                                 {entry.plan.description}
//                               </span>
//                             </>
//                           ) : (
//                             <span style={{ opacity: 0.7 }}>
//                               Aucun plan détaillé enregistré pour cette
//                               génération.
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//               </div>

//               {/* Input + presets + bouton */}
//               <div
//                 style={{
//                   marginTop: "0.35rem",
//                   display: "flex",
//                   flexDirection: "column",
//                   gap: "0.45rem",
//                 }}
//               >
//                 <textarea
//                   value={prompt}
//                   onChange={(e) => setPrompt(e.target.value)}
//                   rows={3}
//                   placeholder="Décris le backend que tu veux générer..."
//                   style={{
//                     width: "100%",
//                     padding: "0.85rem 1rem",
//                     borderRadius: "999px",
//                     border: "1px solid rgba(51,65,85,0.95)",
//                     background:
//                       "radial-gradient(circle at top left,#020617,#000)",
//                     color: "#e5f3ff",
//                     resize: "none",
//                     fontSize: "0.9rem",
//                     boxSizing: "border-box",
//                     outline: "none",
//                   }}
//                 />

//                 <div
//                   style={{
//                     display: "flex",
//                     flexWrap: "wrap",
//                     gap: "0.5rem",
//                     alignItems: "center",
//                     justifyContent: "space-between",
//                   }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       gap: "0.4rem",
//                       fontSize: "0.75rem",
//                       flex: "1 1 auto",
//                     }}
//                   >
//                     <span style={{ opacity: 0.7, alignSelf: "center" }}>
//                       Presets :
//                     </span>
//                     <button
//                       type="button"
//                       onClick={() =>
//                         applyPresetPrompt(
//                           "Génère un backend pour une API de todo list avec utilisateurs, authentification JWT et base PostgreSQL"
//                         )
//                       }
//                       style={{
//                         padding: "0.25rem 0.7rem",
//                         borderRadius: "999px",
//                         border: "1px solid rgba(51,65,85,0.9)",
//                         background: "rgba(15,23,42,0.95)",
//                         cursor: "pointer",
//                         color: "rgba(226,232,240,0.95)",
//                       }}
//                     >
//                       Todo + JWT + Postgres
//                     </button>
//                     <button
//                       type="button"
//                       onClick={() =>
//                         applyPresetPrompt(
//                           "Génère un backend pour une API de blog avec gestion des articles, des commentaires et des utilisateurs, en Node.js + Express avec une base PostgreSQL."
//                         )
//                       }
//                       style={{
//                         padding: "0.25rem 0.7rem",
//                         borderRadius: "999px",
//                         border: "1px solid rgba(51,65,85,0.9)",
//                         background: "rgba(15,23,42,0.95)",
//                         cursor: "pointer",
//                         color: "rgba(226,232,240,0.95)",
//                       }}
//                     >
//                       API Blog
//                     </button>
//                     <button
//                       type="button"
//                       onClick={() =>
//                         applyPresetPrompt(
//                           "Génère un backend e-commerce avec gestion des produits, des utilisateurs, des paniers et des commandes, en Node.js + Express avec PostgreSQL."
//                         )
//                       }
//                       style={{
//                         padding: "0.25rem 0.7rem",
//                         borderRadius: "999px",
//                         border: "1px solid rgba(51,65,85,0.9)",
//                         background: "rgba(15,23,42,0.95)",
//                         cursor: "pointer",
//                         color: "rgba(226,232,240,0.95)",
//                       }}
//                     >
//                       API E-commerce
//                     </button>
//                     <button
//                       type="button"
//                       onClick={() =>
//                         applyPresetPrompt(
//                           "Tu es un expert en architectures SaaS. Génère le backend pour un SaaS d’abonnements mensuels (gestion des plans, clients, factures, rôles, webhooks de paiement, etc.) basé sur Node.js, Express et PostgreSQL."
//                         )
//                       }
//                       style={{
//                         padding: "0.25rem 0.7rem",
//                         borderRadius: "999px",
//                         border: "1px solid rgba(51,65,85,0.9)",
//                         background: "rgba(15,23,42,0.95)",
//                         cursor: "pointer",
//                         color: "rgba(226,232,240,0.95)",
//                       }}
//                     >
//                       SaaS abonnements
//                     </button>
//                   </div>

//                   <button
//                     onClick={handleGenerate}
//                     disabled={loading}
//                     style={{
//                       padding: "0.65rem 1.4rem",
//                       borderRadius: "999px",
//                       border: "none",
//                       background: loading
//                         ? "rgba(45,212,191,0.35)"
//                         : "linear-gradient(135deg,#22c55e,#0ea5e9)",
//                       color: "#ecfeff",
//                       cursor: loading ? "default" : "pointer",
//                       fontWeight: 600,
//                       fontSize: "0.9rem",
//                       boxShadow:
//                         "0 10px 30px rgba(34,197,94,0.55), 0 0 20px rgba(14,165,233,0.55)",
//                       transition:
//                         "transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease",
//                       flexShrink: 0,
//                     }}
//                   >
//                     {loading ? "Génération..." : "Générer 🔥"}
//                   </button>
//                 </div>

//                 {error && (
//                   <p
//                     style={{
//                       marginTop: "0.4rem",
//                       color: "#f97373",
//                       fontSize: "0.8rem",
//                       padding: "0.5rem 0.7rem",
//                       background: "rgba(127,29,29,0.35)",
//                       borderRadius: "999px",
//                     }}
//                   >
//                     ❌ {error}
//                   </p>
//                 )}

//               </div>
//             </section>

//             {/* RESULTS BLOCK */}
//             {result && (
//               <section
//                 style={{
//                   borderRadius: "18px",
//                   border: "1px solid rgba(30,64,175,0.85)",
//                   background: "rgba(15,23,42,0.98)",
//                   padding: "1rem 1.1rem 1rem",
//                   display: "flex",
//                   flexDirection: "column",
//                   gap: "0.9rem",
//                 }}
//               >
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "baseline",
//                     gap: "0.75rem",
//                   }}
//                 >
//                   <div>
//                     <h2
//                       style={{
//                         margin: 0,
//                         fontSize: "0.98rem",
//                       }}
//                     >
//                       Plan généré
//                     </h2>
//                     <p
//                       style={{
//                         margin: "0.25rem 0 0",
//                         fontSize: "0.8rem",
//                         opacity: 0.78,
//                       }}
//                     >
//                       Résumé de ce backend + fichiers models/routes/services à
//                       coller dans ton projet.
//                     </p>
//                   </div>
//                   {planSummary && (
//                     <span
//                       style={{
//                         fontSize: "0.75rem",
//                         opacity: 0.85,
//                         padding: "0.25rem 0.6rem",
//                         borderRadius: "999px",
//                         border: "1px solid rgba(148,163,184,0.7)",
//                       }}
//                     >
//                       {planSummary}
//                     </span>
//                   )}
//                 </div>

//                 {plan && (
//                   <>
//                     {/* Stack résumé */}
//                     <div
//                       style={{
//                         padding: "0.8rem 0.9rem",
//                         borderRadius: "10px",
//                         background:
//                           "radial-gradient(circle at top right,#0f172a,#020617)",
//                         border: "1px solid rgba(37,99,235,0.7)",
//                       }}
//                     >
//                       <div
//                         style={{
//                           fontSize: "0.8rem",
//                           opacity: 0.75,
//                         }}
//                       >
//                         Stack
//                       </div>
//                       <div
//                         style={{
//                           fontWeight: 600,
//                           fontSize: "0.95rem",
//                         }}
//                       >
//                         {plan.stack}
//                       </div>
//                       <p
//                         style={{
//                           margin: "0.4rem 0 0",
//                           fontSize: "0.85rem",
//                           opacity: 0.9,
//                         }}
//                       >
//                         {plan.description}
//                       </p>
//                     </div>

//                     {/* Entités */}
//                     <div
//                       style={{
//                         padding: "0.8rem 0.9rem",
//                         borderRadius: "10px",
//                         background: "#020617",
//                         border: "1px solid rgba(148,163,184,0.45)",
//                       }}
//                     >
//                       <h3
//                         style={{
//                           margin: 0,
//                           marginBottom: "0.4rem",
//                           fontSize: "0.9rem",
//                         }}
//                       >
//                         📚 Entités ({plan.entities?.length || 0})
//                       </h3>
//                       {(!plan.entities || plan.entities.length === 0) && (
//                         <p
//                           style={{
//                             fontSize: "0.8rem",
//                             opacity: 0.7,
//                             margin: 0,
//                           }}
//                         >
//                           Aucune entité détectée.
//                         </p>
//                       )}
//                       {plan.entities?.map((entity) => (
//                         <div
//                           key={entity.name}
//                           style={{
//                             marginTop: "0.4rem",
//                             padding: "0.45rem 0.6rem",
//                             borderRadius: "8px",
//                             background: "rgba(15,23,42,0.96)",
//                           }}
//                         >
//                           <div
//                             style={{
//                               fontWeight: 600,
//                               fontSize: "0.9rem",
//                             }}
//                           >
//                             {entity.name}
//                           </div>
//                           <ul
//                             style={{
//                               margin: "0.25rem 0 0",
//                               paddingLeft: "1.1rem",
//                               fontSize: "0.8rem",
//                             }}
//                           >
//                             {entity.fields?.map((field) => (
//                               <li key={field.name}>
//                                 <code>{field.name}</code> : {field.type}
//                                 {field.primary ? " · primary" : ""}
//                                 {field.unique ? " · unique" : ""}
//                                 {field.reference ? ` → ${field.reference}` : ""}
//                               </li>
//                             ))}
//                           </ul>
//                         </div>
//                       ))}
//                     </div>

//                     {/* Routes */}
//                     <div
//                       style={{
//                         padding: "0.8rem 0.9rem",
//                         borderRadius: "10px",
//                         background: "#020617",
//                         border: "1px solid rgba(56,189,248,0.55)",
//                       }}
//                     >
//                       <h3
//                         style={{
//                           margin: 0,
//                           marginBottom: "0.4rem",
//                           fontSize: "0.9rem",
//                         }}
//                       >
//                         🧭 Routes ({plan.routes?.length || 0} groupes)
//                       </h3>
//                       {(!plan.routes || plan.routes.length === 0) && (
//                         <p
//                           style={{
//                             fontSize: "0.8rem",
//                             opacity: 0.7,
//                             margin: 0,
//                           }}
//                         >
//                           Aucune route décrite.
//                         </p>
//                       )}
//                       {plan.routes?.map((routeGroup) => (
//                         <div
//                           key={routeGroup.name}
//                           style={{
//                             marginTop: "0.4rem",
//                             padding: "0.45rem 0.6rem",
//                             borderRadius: "8px",
//                             background: "rgba(8,47,73,0.96)",
//                           }}
//                         >
//                           <div
//                             style={{
//                               fontWeight: 600,
//                               fontSize: "0.9rem",
//                             }}
//                           >
//                             {routeGroup.name}{" "}
//                             <span
//                               style={{
//                                 opacity: 0.7,
//                                 fontSize: "0.75rem",
//                               }}
//                             >
//                               ({routeGroup.basePath})
//                             </span>
//                           </div>
//                           <ul
//                             style={{
//                               margin: "0.25rem 0 0",
//                               paddingLeft: "1.1rem",
//                               fontSize: "0.8rem",
//                             }}
//                           >
//                             {routeGroup.endpoints?.map((ep, idx) => (
//                               <li key={idx}>
//                                 <code>{ep.method}</code> {routeGroup.basePath}
//                                 {ep.path} →{" "}
//                                 <span style={{ opacity: 0.9 }}>
//                                   {ep.handler}
//                                 </span>
//                               </li>
//                             ))}
//                           </ul>
//                         </div>
//                       ))}
//                     </div>
//                   </>
//                 )}

//                 {/* Fichiers + preview */}
//                 <div
//                   style={{
//                     padding: "0.8rem 0.9rem",
//                     borderRadius: "10px",
//                     background: "#020617",
//                     border: "1px solid rgba(148,163,184,0.45)",
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "0.6rem",
//                   }}
//                 >
//                   <h3
//                     style={{
//                       margin: 0,
//                       fontSize: "0.9rem",
//                     }}
//                   >
//                     🗂 Fichiers générés ({files.length})
//                   </h3>
//                   {files.length === 0 && (
//                     <p
//                       style={{
//                         fontSize: "0.8rem",
//                         opacity: 0.7,
//                         margin: 0,
//                       }}
//                     >
//                       Aucun fichier n’a été renvoyé par l’API (mais le plan est
//                       prêt pour la génération côté backend).
//                     </p>
//                   )}

//                   <ul
//                     style={{
//                       margin: 0,
//                       paddingLeft: 0,
//                       listStyle: "none",
//                       fontSize: "0.8rem",
//                       maxHeight: "180px",
//                       overflow: "auto",
//                       display: "flex",
//                       flexDirection: "column",
//                       gap: "0.25rem",
//                     }}
//                   >
//                     {files.map((f) => {
//                       const ext = f.path.split(".").pop() || "";
//                       let typeLabel = "Fichier";
//                       if (f.path.includes("/models/")) typeLabel = "Model";
//                       else if (f.path.includes("/controllers/"))
//                         typeLabel = "Controller";
//                       else if (f.path.includes("/routes/")) typeLabel = "Route";
//                       else if (f.path.includes("/services/"))
//                         typeLabel = "Service";
//                       else if (f.path.includes("/config/")) typeLabel = "Config";
//                       else if (f.path.includes("server")) typeLabel = "Serveur";

//                       return (
//                         <li key={f.path}>
//                           <button
//                             type="button"
//                             onClick={() => setSelectedFile(f)}
//                             style={{
//                               width: "100%",
//                               textAlign: "left",
//                               background:
//                                 selectedFile?.path === f.path
//                                   ? "rgba(37,99,235,0.35)"
//                                   : "rgba(15,23,42,0.98)",
//                               borderRadius: "8px",
//                               border: "1px solid rgba(75,85,99,0.9)",
//                               padding: "0.35rem 0.55rem",
//                               cursor: "pointer",
//                               color: "inherit",
//                               display: "flex",
//                               alignItems: "center",
//                               justifyContent: "space-between",
//                               gap: "0.4rem",
//                               fontFamily:
//                                 "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
//                             }}
//                           >
//                             <span
//                               style={{
//                                 display: "flex",
//                                 alignItems: "center",
//                                 gap: "0.4rem",
//                               }}
//                             >
//                               <span
//                                 style={{
//                                   fontSize: "0.7rem",
//                                   padding: "0.1rem 0.45rem",
//                                   borderRadius: "999px",
//                                   border: "1px solid rgba(148,163,184,0.7)",
//                                   opacity: 0.9,
//                                 }}
//                               >
//                                 {typeLabel}
//                               </span>
//                               <span
//                                 style={{
//                                   fontSize: "0.8rem",
//                                 }}
//                               >
//                                 {f.path}
//                               </span>
//                             </span>
//                             <span
//                               style={{
//                                 fontSize: "0.7rem",
//                                 opacity: 0.7,
//                                 textTransform: "uppercase",
//                               }}
//                             >
//                               .{ext}
//                             </span>
//                           </button>
//                         </li>
//                       );
//                     })}
//                   </ul>

//                   {selectedFile && (
//                     <div
//                       style={{
//                         marginTop: "0.5rem",
//                         borderRadius: "8px",
//                         border: "1px solid rgba(148,163,184,0.7)",
//                         backgroundColor: "#020617",
//                         padding: "0.7rem",
//                         maxHeight: "260px",
//                         overflow: "auto",
//                       }}
//                     >
//                       <div
//                         style={{
//                           display: "flex",
//                           justifyContent: "space-between",
//                           alignItems: "center",
//                           marginBottom: "0.5rem",
//                           gap: "0.75rem",
//                         }}
//                       >
//                         <span
//                           style={{
//                             fontSize: "0.8rem",
//                             opacity: 0.85,
//                             fontFamily:
//                               "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
//                           }}
//                         >
//                           {selectedFile.path}
//                         </span>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "0.4rem",
//                           }}
//                         >
//                           <button
//                             type="button"
//                             onClick={handleCopySelectedFile}
//                             style={{
//                               padding: "0.25rem 0.7rem",
//                               borderRadius: "999px",
//                               border: "1px solid rgba(148,163,184,0.8)",
//                               background: "rgba(15,23,42,0.95)",
//                               cursor: "pointer",
//                               fontSize: "0.75rem",
//                               fontWeight: 500,
//                               color: "rgba(226,232,240,0.95)",
//                             }}
//                           >
//                             Copier le fichier
//                           </button>
//                           <span
//                             style={{
//                               fontSize: "0.7rem",
//                               opacity: 0.7,
//                             }}
//                           >
//                             ou ⌘A / Ctrl+A puis ⌘C / Ctrl+C
//                           </span>
//                         </div>
//                       </div>
//                       <pre
//                         style={{
//                           margin: 0,
//                           fontSize: "0.8rem",
//                           lineHeight: 1.4,
//                           whiteSpace: "pre",
//                           overflowX: "auto",
//                         }}
//                       >
//                         <code>{selectedFile.content}</code>
//                       </pre>
//                       {copyMessage && (
//                         <p
//                           style={{
//                             marginTop: "0.4rem",
//                             fontSize: "0.8rem",
//                             opacity: 0.9,
//                             color: "#a5b4fc",
//                           }}
//                         >
//                           {copyMessage}
//                         </p>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 {/* JSON brut */}
//                 <div
//                   style={{
//                     padding: "0.8rem 0.9rem",
//                     borderRadius: "10px",
//                     background: "#020617",
//                     border: "1px solid rgba(55,65,81,0.85)",
//                     marginTop: "0.1rem",
//                   }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                       gap: "0.75rem",
//                     }}
//                   >
//                     <h3
//                       style={{
//                         margin: 0,
//                         fontSize: "0.9rem",
//                       }}
//                     >
//                       🧪 JSON brut (debug)
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
//                           background: "rgba(15,23,42,0.95)",
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
//                           border: "1px solid rgba(34,197,94,0.9)",
//                           background: "rgba(6,95,70,0.9)",
//                           cursor: "pointer",
//                           fontSize: "0.75rem",
//                           fontWeight: 500,
//                           color: "#ecfeff",
//                         }}
//                       >
//                         Copier le JSON
//                       </button>
//                     </div>
//                   </div>
//                   {showRawResult && (
//                     <pre
//                       style={{
//                         margin: "0.5rem 0 0",
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
//                         marginTop: "0.4rem",
//                         fontSize: "0.8rem",
//                         opacity: 0.9,
//                         color: "#a5b4fc",
//                       }}
//                     >
//                       {rawCopyMessage}
//                     </p>
//                   )}
//                 </div>
//               </section>
//             )}
//           </section>
//         </div>
//       </main>
//     </div>
//   );
// }

// export default App;

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

        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding: "0.6rem 1.4rem",
            borderRadius: "999px",
            border: "none",
            background: loading
              ? "rgba(0,122,204,0.4)"
              : "linear-gradient(135deg,#22c55e,#0ea5e9)",
            color: "#ecfeff",
            cursor: loading ? "default" : "pointer",
            fontWeight: 600,
            fontSize: "0.9rem",
            boxShadow:
              "0 10px 30px rgba(34,197,94,0.55), 0 0 20px rgba(14,165,233,0.55)",
            flexShrink: 0,
          }}
        >
          {loading ? "Génération..." : "Générer 🔥"}
        </button>
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
                      <span>{group.folder}</span>
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
                          {item.name}
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
                      <textarea
                        value={currentContent}
                        onChange={(e) =>
                          setEditedFiles((prev) => ({
                            ...prev,
                            [currentFile.path]: e.target.value,
                          }))
                        }
                        spellCheck={false}
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          resize: "none",
                          color: "#d4d4d4",
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                          fontSize: "0.82rem",
                          lineHeight: 1.4,
                          whiteSpace: "pre",
                        }}
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