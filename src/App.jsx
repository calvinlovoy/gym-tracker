import { useState, useEffect } from "react";

const DATA_VERSION = 4;
const SEQUENCE = ["pull", "push", "legs"];

const INITIAL_PROGRAM = {
  pull: {
    label: "PULL", color: "#00AA66",
    exercises: [
      { id: "deadlift", name: "Deadlift",           sets: 3, reps: "4–6",   weight: 265, unit: "lbs", note: "" },
      { id: "row",      name: "Barbell Row",         sets: 3, reps: "6–8",   weight: 155, unit: "lbs", note: "" },
      { id: "pullup",   name: "Pull-ups",            sets: 3, reps: "8–10",  weight: 0,   unit: "bw",  note: "" },
      { id: "facepull", name: "Face Pulls",          sets: 3, reps: "15–20", weight: 55,  unit: "lbs", note: "" },
      { id: "curl",     name: "Barbell Curl",        sets: 3, reps: "10–12", weight: 75,  unit: "lbs", note: "" },
    ],
  },
  push: {
    label: "PUSH", color: "#0066FF",
    exercises: [
      { id: "bp",       name: "Barbell Bench Press", sets: 3, reps: "6–8",   weight: 175, unit: "lbs", note: "" },
      { id: "ohp",      name: "Overhead Press",      sets: 3, reps: "8–10",  weight: 110, unit: "lbs", note: "" },
      { id: "incdb",    name: "Incline DB Press",    sets: 3, reps: "10–12", weight: 50,  unit: "lbs", note: "" },
      { id: "laterals", name: "Lateral Raises",      sets: 3, reps: "12–15", weight: 25,  unit: "lbs", note: "" },
      { id: "triceppd", name: "Tricep Pushdown",     sets: 3, reps: "12–15", weight: 90,  unit: "lbs", note: "" },
    ],
  },
  legs: {
    label: "LEGS", color: "#CC2200",
    exercises: [
      { id: "squat",    name: "Back Squat",          sets: 3, reps: "6–8",   weight: 225, unit: "lbs", note: "" },
      { id: "rdl",      name: "Romanian Deadlift",   sets: 3, reps: "8–10",  weight: 175, unit: "lbs", note: "" },
      { id: "legpress", name: "Leg Press",           sets: 3, reps: "10–12", weight: 350, unit: "lbs", note: "" },
      { id: "legcurl",  name: "Leg Curl",            sets: 3, reps: "12–15", weight: 110, unit: "lbs", note: "" },
      { id: "calf",     name: "Standing Calf Raise", sets: 3, reps: "15–20", weight: 175, unit: "lbs", note: "" },
    ],
  },
};

function loadStored(key, fallback) {
  try {
    const v = parseInt(localStorage.getItem("ppl_version") || "0");
    if (v < DATA_VERSION) return fallback;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function getDateStr() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function shouldIncreaseWeight(logs, targetMax) {
  if (!logs || logs.length === 0) return false;
  return logs.every(s => s.completed && s.repsHit !== "" && parseInt(s.repsHit) >= targetMax);
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const fieldInput = (extra = {}) => ({
  border: "1px solid #e0e0e0", borderRadius: "3px", padding: "6px 10px",
  fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#111",
  background: "#fafafa", outline: "none", boxSizing: "border-box", width: "100%",
  ...extra,
});

const adjBtn = {
  width: "30px", height: "30px", border: "1px solid #ddd", borderRadius: "3px",
  background: "#f5f5f5", cursor: "pointer", fontSize: "16px", color: "#333",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: "'DM Sans', sans-serif", lineHeight: 1,
};

const smallCtrl = {
  width: "22px", height: "19px", border: "1px solid #e8e8e8", borderRadius: "2px",
  background: "#fafafa", cursor: "pointer", fontSize: "11px", color: "#888",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
  fontFamily: "'DM Sans', sans-serif", lineHeight: 1,
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ currentDay, nextDay, program, onConfirm, onCancel }) {
  const next = program[nextDay];
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
    }} onClick={onCancel}>
      <div style={{
        background: "#fff", borderRadius: "8px", padding: "32px", maxWidth: "340px", width: "100%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.2)", textAlign: "center",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>✓</div>
        <div style={{ fontFamily: "'Epilogue', sans-serif", fontSize: "20px", color: "#111", fontWeight: 600, marginBottom: "8px" }}>
          Session Complete!
        </div>
        <div style={{ fontSize: "13px", color: "#888", lineHeight: 1.6, marginBottom: "24px" }}>
          Great work. Your next session will be{" "}
          <span style={{ color: next.color, fontWeight: 600 }}>{next.label} DAY</span>.
        </div>
        <button onClick={onConfirm} style={{
          width: "100%", padding: "12px", border: "none", borderRadius: "4px",
          background: next.color, color: "#fff", fontFamily: "'DM Sans', sans-serif",
          fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em", cursor: "pointer",
          marginBottom: "10px",
        }}>
          ADVANCE TO {next.label} DAY
        </button>
        <button onClick={onCancel} style={{
          width: "100%", padding: "10px", border: "1px solid #e0e0e0", borderRadius: "4px",
          background: "#fff", color: "#888", fontFamily: "'DM Sans', sans-serif",
          fontSize: "12px", cursor: "pointer",
        }}>
          Not yet
        </button>
      </div>
    </div>
  );
}

// ─── Exercise Editor Modal ────────────────────────────────────────────────────
function ExerciseEditorModal({ dayKey, program, onSave, onClose }) {
  const [exercises, setExercises] = useState(JSON.parse(JSON.stringify(program[dayKey].exercises)));
  const { label, color } = program[dayKey];

  const update = (i, field, val) =>
    setExercises(exs => exs.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  const remove = (i) => setExercises(exs => exs.filter((_, idx) => idx !== i));
  const move = (i, dir) => setExercises(exs => {
    const next = [...exs]; const j = i + dir;
    if (j < 0 || j >= next.length) return exs;
    [next[i], next[j]] = [next[j], next[i]]; return next;
  });
  const add = () => setExercises(exs => [...exs, {
    id: `ex_${Date.now()}`, name: "", sets: 3, reps: "8–10", weight: 45, unit: "lbs", note: ""
  }]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      overflowY: "auto", padding: "24px 12px",
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: "6px", width: "100%", maxWidth: "580px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)", padding: "28px",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: "#aaa" }}>EDIT EXERCISES</div>
            <div style={{ fontFamily: "'Epilogue', sans-serif", fontSize: "20px", color, marginTop: "2px", fontWeight: 500 }}>
              {label} DAY
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", color: "#bbb", cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        {exercises.map((ex, i) => (
          <div key={ex.id} style={{
            borderBottom: "1px solid #f0f0f0", paddingBottom: "14px", marginBottom: "14px",
          }}>
            {/* Exercise name + reorder/delete */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
              <input value={ex.name} onChange={e => update(i, "name", e.target.value)} placeholder="Exercise name" style={{ ...fieldInput(), flex: 1 }} />
              <button onClick={() => move(i, -1)} style={smallCtrl} title="Move up">↑</button>
              <button onClick={() => move(i, 1)}  style={smallCtrl} title="Move down">↓</button>
              <button onClick={() => remove(i)}   style={{ ...smallCtrl, color: "#d44" }} title="Remove">×</button>
            </div>
            {/* Sets / Reps / Weight / Unit in a wrapping row */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "52px", flex: "1 1 52px" }}>
                <label style={{ fontSize: "10px", letterSpacing: "0.08em", color: "#aaa" }}>SETS</label>
                <input
                  type="text" inputMode="numeric"
                  value={ex._setsRaw !== undefined ? ex._setsRaw : String(ex.sets)}
                  onChange={e => update(i, "_setsRaw", e.target.value)}
                  onBlur={e => {
                    const parsed = Math.min(10, Math.max(1, parseInt(e.target.value) || 1));
                    setExercises(exs => exs.map((ex2, idx) => idx === i ? { ...ex2, sets: parsed, _setsRaw: undefined } : ex2));
                  }}
                  style={fieldInput({ textAlign: "center" })}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "80px", flex: "2 1 80px" }}>
                <label style={{ fontSize: "10px", letterSpacing: "0.08em", color: "#aaa" }}>REPS</label>
                <input value={ex.reps} onChange={e => update(i, "reps", e.target.value)} placeholder="8–12" style={fieldInput({ textAlign: "center" })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "80px", flex: "2 1 80px" }}>
                <label style={{ fontSize: "10px", letterSpacing: "0.08em", color: "#aaa" }}>WEIGHT</label>
                <input
                  type="text" inputMode="decimal"
                  value={ex.unit === "bw" ? "" : (ex._weightRaw !== undefined ? ex._weightRaw : String(ex.weight))}
                  onChange={e => update(i, "_weightRaw", e.target.value)}
                  onBlur={e => {
                    const parsed = Math.max(0, parseFloat(e.target.value) || 0);
                    setExercises(exs => exs.map((ex2, idx) => idx === i ? { ...ex2, weight: parsed, _weightRaw: undefined } : ex2));
                  }}
                  disabled={ex.unit === "bw"} placeholder={ex.unit === "bw" ? "BW" : ""}
                  style={fieldInput({ textAlign: "center", opacity: ex.unit === "bw" ? 0.35 : 1 })}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "72px", flex: "1 1 72px" }}>
                <label style={{ fontSize: "10px", letterSpacing: "0.08em", color: "#aaa" }}>UNIT</label>
                <select value={ex.unit} onChange={e => update(i, "unit", e.target.value)} style={fieldInput({ padding: "6px 4px" })}>
                  <option value="lbs">lbs</option>
                  <option value="kg">kg</option>
                  <option value="bw">BW</option>
                </select>
              </div>
            </div>
          </div>
        ))}

        <button onClick={add} style={{
          width: "100%", padding: "10px", marginTop: "4px", marginBottom: "22px",
          border: `1px dashed ${color}77`, borderRadius: "4px", background: "transparent",
          color, fontFamily: "'DM Sans', sans-serif", fontSize: "12px", letterSpacing: "0.08em", cursor: "pointer",
        }}>+ ADD EXERCISE</button>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", border: "1px solid #e0e0e0", borderRadius: "3px", background: "#fff", color: "#555", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", letterSpacing: "0.08em", cursor: "pointer" }}>CANCEL</button>
          <button onClick={() => onSave(exercises)} style={{ padding: "9px 22px", border: "none", borderRadius: "3px", background: color, color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", letterSpacing: "0.08em", cursor: "pointer", fontWeight: 600 }}>SAVE</button>
        </div>
      </div>
    </div>
  );
}

// ─── Set Row ──────────────────────────────────────────────────────────────────
function SetRow({ setNum, log, onUpdate }) {
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
      <span style={{ fontSize: "11px", color: "#888", width: "46px", flexShrink: 0 }}>SET {setNum}</span>
      <input
        type="number" placeholder="reps" min="0"
        value={log.repsHit ?? ""}
        onChange={e => onUpdate({ ...log, repsHit: e.target.value === "" ? "" : parseInt(e.target.value) })}
        style={{ width: "58px", border: "1px solid #e0e0e0", borderRadius: "3px", padding: "5px 8px", fontSize: "12px", color: "#111", background: "#fafafa", outline: "none", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}
      />
      <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
        <input type="checkbox" checked={log.completed ?? false} onChange={e => onUpdate({ ...log, completed: e.target.checked })} style={{ accentColor: "#0066FF", width: "14px", height: "14px" }} />
        <span style={{ fontSize: "11px", color: "#aaa" }}>done</span>
      </label>
    </div>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────
function ExerciseCard({ exercise, dayColor, sessionLogs, onLogsChange, onWeightChange, onNoteChange, isPR }) {
  const [expanded, setExpanded] = useState(false);
  const baseLogs = sessionLogs || [];
  const logs = Array.from({ length: exercise.sets }, (_, i) =>
    baseLogs[i] ?? { completed: false, repsHit: "" }
  );
  const targetMax = parseInt((exercise.reps.split("–")[1] || exercise.reps).replace(/\D/g, "") || "99");
  const showIncrease = shouldIncreaseWeight(logs, targetMax);
  const allDone = logs.length > 0 && logs.every(s => s.completed);

  return (
    <div style={{
      border: `1px solid ${allDone ? dayColor + "33" : "#e8e8e8"}`,
      borderLeft: `3px solid ${allDone ? dayColor : "#e0e0e0"}`,
      borderRadius: "4px", marginBottom: "10px",
      background: allDone ? dayColor + "05" : "#fff",
      transition: "all 0.2s ease", overflow: "hidden",
    }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontSize: "15px", fontWeight: 500, color: "#111" }}>{exercise.name}</span>
            {isPR && <span style={{ background: "#FFD700", color: "#000", fontSize: "9px", padding: "2px 5px", borderRadius: "2px", letterSpacing: "0.08em", fontWeight: 700 }}>PR</span>}
            {showIncrease && <span style={{ background: "#0066FF", color: "#fff", fontSize: "9px", letterSpacing: "0.1em", padding: "2px 6px", borderRadius: "2px", fontWeight: 600 }}>↑ INCREASE</span>}
          </div>
          <div style={{ marginTop: "4px", display: "flex", gap: "14px" }}>
            <span style={{ fontSize: "11px", color: "#777" }}>{exercise.sets} × {exercise.reps}</span>
            <span style={{ fontSize: "11px", color: "#777" }}>{exercise.unit === "bw" ? "Bodyweight" : `${exercise.weight} ${exercise.unit}`}</span>
          </div>
        </div>
        <span style={{ fontSize: "11px", color: "#bbb", marginLeft: "8px", marginTop: "2px" }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px solid #f0f0f0" }}>
          {exercise.unit !== "bw" && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px", marginBottom: "14px" }}>
              <span style={{ fontSize: "11px", color: "#888", letterSpacing: "0.05em" }}>WEIGHT</span>
              <button onClick={() => onWeightChange(Math.max(0, exercise.weight - 5))} style={adjBtn}>−</button>
              <span style={{ fontSize: "13px", color: "#111", minWidth: "76px", textAlign: "center", fontWeight: 500 }}>{exercise.weight} {exercise.unit}</span>
              <button onClick={() => onWeightChange(exercise.weight + 5)} style={adjBtn}>+</button>
            </div>
          )}
          <div style={{ marginBottom: "12px", marginTop: exercise.unit === "bw" ? "12px" : 0 }}>
            {logs.map((log, i) => (
              <SetRow key={i} setNum={i + 1} log={log} onUpdate={updated => { const next = [...logs]; next[i] = updated; onLogsChange(next); }} />
            ))}
          </div>
          <textarea
            placeholder="Session note…" value={exercise.note}
            onChange={e => onNoteChange(e.target.value)} rows={2}
            style={{ width: "100%", border: "1px solid #e8e8e8", borderRadius: "3px", padding: "8px 10px", fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#555", background: "#fafafa", resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }}
          />
        </div>
      )}
    </div>
  );
}

// ─── PR Modal ─────────────────────────────────────────────────────────────────
function PRModal({ prs, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "6px", padding: "32px", maxWidth: "380px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: "#aaa", marginBottom: "16px" }}>PERSONAL RECORDS</div>
        {Object.keys(prs).length === 0
          ? <p style={{ fontSize: "12px", color: "#bbb", margin: 0 }}>No PRs logged yet.</p>
          : Object.entries(prs).map(([name, w]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f0f0f0", padding: "8px 0" }}>
              <span style={{ fontFamily: "'Epilogue', sans-serif", fontSize: "14px", color: "#333" }}>{name}</span>
              <span style={{ fontSize: "12px", color: "#0066FF", fontWeight: 500 }}>{w}</span>
            </div>
          ))}
        <button onClick={onClose} style={{ marginTop: "20px", width: "100%", padding: "10px", border: "1px solid #e0e0e0", borderRadius: "3px", fontFamily: "'DM Sans', sans-serif", fontSize: "11px", letterSpacing: "0.08em", background: "#fff", cursor: "pointer", color: "#555" }}>CLOSE</button>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [program,     setProgram]     = useState(() => loadStored("ppl_program", INITIAL_PROGRAM));
  const [sessionLogs, setSessionLogs] = useState(() => loadStored("ppl_session_logs", {}));
  const [prs,         setPrs]         = useState(() => loadStored("ppl_prs", {}));
  // currentDayIdx = index into SEQUENCE: 0=pull, 1=push, 2=legs
  const [currentDayIdx, setCurrentDayIdx] = useState(() => loadStored("ppl_current_day_idx", 0));
  const [viewTab,     setViewTab]     = useState(null); // null = show current day
  const [showPRs,     setShowPRs]     = useState(false);
  const [editingDay,  setEditingDay]  = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    localStorage.setItem("ppl_version", String(DATA_VERSION));
    localStorage.setItem("ppl_program", JSON.stringify(program));
  }, [program]);
  useEffect(() => { localStorage.setItem("ppl_session_logs", JSON.stringify(sessionLogs)); }, [sessionLogs]);
  useEffect(() => { localStorage.setItem("ppl_prs", JSON.stringify(prs)); }, [prs]);
  useEffect(() => { localStorage.setItem("ppl_current_day_idx", JSON.stringify(currentDayIdx)); }, [currentDayIdx]);

  const currentDayKey = SEQUENCE[currentDayIdx];
  const nextDayKey    = SEQUENCE[(currentDayIdx + 1) % SEQUENCE.length];
  const activeTab     = viewTab || currentDayKey; // viewing tab (may differ from current day)
  const day           = program[activeTab];
  const isCurrentDay  = activeTab === currentDayKey;

  function advanceDay() {
    setCurrentDayIdx(i => (i + 1) % SEQUENCE.length);
    setSessionLogs({});       // clear logs for fresh session
    setViewTab(null);         // jump back to the new current day
    setShowConfirm(false);
  }

  function updateExerciseWeight(exIdx, weight) {
    const ex = day.exercises[exIdx];
    const label = `${weight} ${ex.unit}`;
    if (!prs[ex.name] || weight > parseFloat(prs[ex.name])) setPrs(p => ({ ...p, [ex.name]: label }));
    setProgram(p => { const c = JSON.parse(JSON.stringify(p)); c[activeTab].exercises[exIdx].weight = weight; return c; });
  }

  function updateNote(exIdx, note) {
    setProgram(p => { const c = JSON.parse(JSON.stringify(p)); c[activeTab].exercises[exIdx].note = note; return c; });
  }

  function updateLogs(exIdx, logs) {
    setSessionLogs(s => ({ ...s, [`${activeTab}_${exIdx}`]: logs }));
  }

  function saveEdits(dayKey, exercises) {
    const oldExercises = program[dayKey].exercises;
    setProgram(p => { const c = JSON.parse(JSON.stringify(p)); c[dayKey].exercises = exercises; return c; });
    // Clear logs for any exercise whose set count changed so the checklist rebuilds correctly
    setSessionLogs(s => {
      const next = { ...s };
      exercises.forEach((ex, i) => {
        const old = oldExercises[i];
        if (!old || old.sets !== ex.sets) {
          delete next[`${dayKey}_${i}`];
        }
      });
      return next;
    });
    setEditingDay(null);
  }

  const isPRExercise = ex => prs[ex.name] && prs[ex.name] === `${ex.weight} ${ex.unit}`;

  const completedCount = day.exercises.filter((_, i) => {
    const logs = sessionLogs[`${activeTab}_${i}`] || [];
    return logs.length > 0 && logs.every(l => l.completed);
  }).length;
  const allDone = completedCount === day.exercises.length && day.exercises.length > 0;

  const dayColor = day.color;

  return (
    <div style={{ minHeight: "100vh", background: "#F7F7F5", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Epilogue:wght@400;500;600&display=swap" rel="stylesheet" />

      {showPRs    && <PRModal prs={prs} onClose={() => setShowPRs(false)} />}
      {editingDay && <ExerciseEditorModal dayKey={editingDay} program={program} onSave={exs => saveEdits(editingDay, exs)} onClose={() => setEditingDay(null)} />}
      {showConfirm && <ConfirmModal currentDay={currentDayKey} nextDay={nextDayKey} program={program} onConfirm={advanceDay} onCancel={() => setShowConfirm(false)} />}

      {/* ── Hero banner ── */}
      <div style={{ background: dayColor, padding: "28px 24px 24px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "11px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.65)", marginBottom: "6px" }}>
                {isCurrentDay ? "TODAY'S SESSION" : "VIEWING"}
              </div>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontSize: "42px", fontWeight: 600, color: "#fff", lineHeight: 1, letterSpacing: "-0.01em" }}>
                {day.label}
              </div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", marginTop: "6px" }}>
                {getDateStr()}
              </div>
            </div>
            <button onClick={() => setShowPRs(true)} style={{
              border: "1px solid rgba(255,255,255,0.35)", borderRadius: "3px", padding: "7px 12px",
              background: "rgba(255,255,255,0.12)", cursor: "pointer", fontSize: "10px",
              letterSpacing: "0.12em", color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans', sans-serif",
            }}>PR BOARD</button>
          </div>

          {/* Next day preview */}
          {isCurrentDay && (
            <div style={{ marginTop: "16px", fontSize: "11px", color: "rgba(255,255,255,0.55)", letterSpacing: "0.05em" }}>
              Next → <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{program[nextDayKey].label} DAY</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8e8e8", padding: "0 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex" }}>
          {SEQUENCE.map(t => (
            <button key={t} onClick={() => setViewTab(t === currentDayKey ? null : t)} style={{
              flex: 1, padding: "12px 0", border: "none",
              borderBottom: activeTab === t ? `2px solid ${program[t].color}` : "2px solid transparent",
              background: "transparent", fontFamily: "'DM Sans', sans-serif", fontSize: "11px",
              letterSpacing: "0.12em", color: activeTab === t ? program[t].color : "#aaa",
              cursor: "pointer", fontWeight: activeTab === t ? 600 : 400, transition: "all 0.15s",
            }}>
              {t.toUpperCase()}
              {t === currentDayKey && <span style={{ marginLeft: "5px", fontSize: "8px", verticalAlign: "middle" }}>●</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px 24px 80px" }}>

        {/* Progress + edit row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#aaa", marginBottom: "5px" }}>SESSION PROGRESS</div>
            <div style={{ height: "3px", width: "150px", background: "#e8e8e8", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", background: dayColor, borderRadius: "2px", transition: "width 0.4s ease", width: `${day.exercises.length ? (completedCount / day.exercises.length) * 100 : 0}%` }} />
            </div>
            <div style={{ fontSize: "10px", color: "#aaa", marginTop: "4px" }}>{completedCount}/{day.exercises.length} exercises</div>
          </div>
          <button onClick={() => setEditingDay(activeTab)} style={{
            border: `1px solid ${dayColor}55`, borderRadius: "3px", padding: "7px 14px",
            background: "#fff", color: dayColor, fontFamily: "'DM Sans', sans-serif",
            fontSize: "11px", letterSpacing: "0.1em", cursor: "pointer", fontWeight: 500,
          }}>✎ EDIT</button>
        </div>

        {/* Exercise cards */}
        {day.exercises.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#bbb", fontSize: "13px" }}>
            No exercises yet.{" "}
            <span onClick={() => setEditingDay(activeTab)} style={{ color: dayColor, cursor: "pointer", fontWeight: 500 }}>Add some →</span>
          </div>
        ) : day.exercises.map((ex, i) => (
          <ExerciseCard
            key={ex.id} exercise={ex} dayColor={dayColor}
            sessionLogs={sessionLogs[`${activeTab}_${i}`]}
            onLogsChange={logs => updateLogs(i, logs)}
            onWeightChange={w => updateExerciseWeight(i, w)}
            onNoteChange={note => updateNote(i, note)}
            isPR={isPRExercise(ex)}
          />
        ))}

        {/* Complete Session button — only on current day */}
        {isCurrentDay && (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!allDone}
            style={{
              width: "100%", padding: "14px", marginTop: "12px",
              border: "none", borderRadius: "4px", cursor: allDone ? "pointer" : "not-allowed",
              background: allDone ? dayColor : "#e8e8e8",
              color: allDone ? "#fff" : "#bbb",
              fontFamily: "'DM Sans', sans-serif", fontSize: "13px",
              fontWeight: 600, letterSpacing: "0.08em",
              transition: "all 0.2s ease",
            }}
          >
            {allDone ? `✓ COMPLETE ${day.label} SESSION` : `COMPLETE ALL EXERCISES TO FINISH`}
          </button>
        )}

        {/* Progression guide */}
        <div style={{ marginTop: "24px", border: "1px solid #ebebeb", borderRadius: "4px", padding: "16px", background: "#fff" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: "#aaa", marginBottom: "10px" }}>PROGRESSION GUIDE</div>
          <p style={{ fontSize: "11px", color: "#777", lineHeight: 1.7, margin: 0 }}>
            When you complete all sets at the <strong style={{ color: "#333" }}>top of the rep range</strong>, increase weight by <strong style={{ color: "#333" }}>5 lbs</strong> next session. A blue{" "}
            <span style={{ background: "#0066FF", color: "#fff", fontSize: "9px", padding: "1px 5px", borderRadius: "2px" }}>↑ INCREASE</span>{" "}
            badge appears on qualifying exercises.
          </p>
        </div>
      </div>
    </div>
  );
}
