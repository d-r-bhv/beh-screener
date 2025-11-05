import React, { useMemo, useRef, useState } from "react";
import { buildStandardQuestions } from "./questionLibrary";
import { exportToWord } from "./exportToWord";
import { Mode, Question, StudySetup } from "./types";
import { substituteTokens } from "./utils/text";

const modes: { value: Mode; label: string }[] = [
  { value: "online", label: "Online (Virtual)" },
  { value: "inperson_external", label: "In-Person (External Facility)" },
  { value: "inperson_shopperlab", label: "In-Person (ShopperLab)" },
];

const MAGENTA = "#C0007A";

export default function ScreenerBuilderApp() {
  const [setup, setSetup] = useState<StudySetup>({
    mode: "online",
    moderator: "",
    dates: "",
    locationOrPlatform: "",
    categoryName: "",
    notes: "",
  });

  const [build, setBuild] = useState<Question[]>([]);
  const [view, setView] = useState<"setup" | "builder">("setup");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number>(-1);
  const questionRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const standard = useMemo(() => buildStandardQuestions(setup.mode), [setup.mode]);

  const loadStandard = () => {
    setBuild(standard);
    setView("builder");
  };

  const exportDoc = async () => {
    await exportToWord({ setup, questions: build });
  };

  const addCustom = (position: number) => {
    const ts = Date.now();
    const q: Question = {
      id: `custom_${ts}`,
      idLabel: `C_${ts}`,
      section: "Custom",
      text: "New question about {{categoryName}}…",
      type: "open",
      options: [],
      instructions: "",
      tags: ["custom"],
    };
    setBuild((prev) => {
      const next = [...prev];
      const insertAt = position < 0 ? next.length : Math.min(position, next.length);
      next.splice(insertAt, 0, q);
      return next;
    });
    setTimeout(() => {
      const el = questionRefs.current[q.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  const updateQ = (id: string, patch: Partial<Question>) => {
    setBuild((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const removeQ = (id: string) => {
    setBuild((prev) => prev.filter((q) => q.id !== id));
  };

  const move = (id: string, dir: -1 | 1) => {
    setBuild((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const moveToIndex = (id: string, index: number) => {
    setBuild((prev) => {
      const next = [...prev];
      const currentIdx = next.findIndex((q) => q.id === id);
      if (currentIdx === -1 || index === currentIdx) return prev;
      const [item] = next.splice(currentIdx, 1);
      next.splice(index, 0, item);
      return next;
    });
  };

  // ---------- SETUP VIEW ----------
  if (view === "setup") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Behaviorally Screener Setup</h1>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Mode</label>
              <select
                className="mt-1 w-full border rounded p-2"
                value={setup.mode}
                onChange={(e) => setSetup((s) => ({ ...s, mode: e.target.value as Mode }))}
              >
                {modes.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Moderator</label>
              <input
                className="mt-1 w-full border rounded p-2"
                value={setup.moderator}
                onChange={(e) => setSetup((s) => ({ ...s, moderator: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Dates</label>
              <input
                className="mt-1 w-full border rounded p-2"
                value={setup.dates}
                onChange={(e) => setSetup((s) => ({ ...s, dates: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Location / Platform</label>
              <input
                className="mt-1 w-full border rounded p-2"
                value={setup.locationOrPlatform}
                onChange={(e) => setSetup((s) => ({ ...s, locationOrPlatform: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">
                Category name (as it should appear in screener text)
              </label>
              <input
                className="mt-1 w-full border rounded p-2"
                placeholder='e.g., "dry shampoo", "frozen novelties"'
                value={setup.categoryName}
                onChange={(e) => setSetup((s) => ({ ...s, categoryName: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">
                This will plug into questions wherever <code>{"{{categoryName}}"}</code> appears.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Notes / Specs</label>
              <textarea
                className="mt-1 w-full border rounded p-2 h-20"
                value={setup.notes}
                onChange={(e) => setSetup((s) => ({ ...s, notes: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                className="px-5 py-3 rounded bg-black text-white hover:bg-gray-800"
                onClick={loadStandard}
              >
                Load Behaviorally Standard Order →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- BUILDER VIEW ----------
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 relative">
      {/* Floating Leave button */}
      <button
        onClick={() => setShowConfirm(true)}
        className="fixed bottom-5 left-5 bg-white border border-gray-300 shadow-lg text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 z-50"
      >
        ← Leave
      </button>

      {/* Floating Add button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-5 right-5 bg-fuchsia-700 text-white px-4 py-2 rounded-xl shadow-lg hover:bg-fuchsia-800 z-50"
      >
        + Add Custom Question
      </button>

      {/* Leave confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full text-center">
            <p className="text-lg font-semibold mb-4">
              Are you sure you want to leave this page and abandon this screener?
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => setShowConfirm(false)}
              >
                No
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  setShowConfirm(false);
                  setView("setup");
                  setBuild([]);
                }}
              >
                Yes, leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add custom question modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full text-center">
            <p className="text-lg font-semibold mb-4">
              Where would you like to insert this question?
            </p>
            <select
              className="border rounded p-2 w-full mb-4"
              value={insertIndex}
              onChange={(e) => setInsertIndex(Number(e.target.value))}
            >
              <option value={-1}>At end</option>
              {build.map((_, i) => (
                <option key={i} value={i + 1}>
                  After Question {i + 1}
                </option>
              ))}
            </select>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-fuchsia-700 text-white hover:bg-fuchsia-800"
                onClick={() => {
                  setShowAddModal(false);
                  addCustom(insertIndex);
                }}
              >
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Behaviorally Screener Builder</h1>

        <button
          className="px-4 py-2 rounded bg-fuchsia-700 text-white mb-4"
          onClick={exportDoc}
          disabled={!build.length}
        >
          Export to Word (.docx)
        </button>

        <div className="bg-white rounded-2xl shadow p-4">
          <ul className="space-y-4">
            {build.map((q, idx) => {
              const idLabel = q.idLabel || "";
              const text = substituteTokens(q.text, { categoryName: setup.categoryName || "" });

              return (
                <li
                  key={q.id}
                  ref={(el) => (questionRefs.current[q.id] = el)}
                  className="relative border rounded-xl p-4"
                  style={{ fontFamily: 'Calibri, Arial, sans-serif' }}
                >
                  {/* Question number (UI only) */}
                  <div className="absolute top-2 left-3 text-xs font-medium text-gray-400">
                    Q{idx + 1}
                  </div>

                  <div className="flex items-start justify-between gap-4 mt-3">
                    <div className="flex-1">
                      {/* DOC-LIKE PREVIEW (WYSIWYG) */}
                      <div className="mb-3">
                        <div className="text-[11pt] leading-[1.35]">
                          {/* [idLabel] bold, then question */}
                          <span className="font-bold">
                            {idLabel ? `[${idLabel}] ` : ""}
                          </span>
                          <span>{text}</span>
                        </div>

                        {/* Options list */}
                        {q.options?.length ? (
                          <div className="mt-1 pl-6 text-[11pt] leading-[1.35]">
                            {q.options.map((opt, i) => {
                              const letter = String.fromCharCode(97 + i) + ".";
                              return (
                                <div key={i} className="mt-[2px]">
                                  <span>{letter}&nbsp;</span>
                                  <span>{substituteTokens(opt, { categoryName: setup.categoryName || "" })}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}

                        {/* Recruiter instructions */}
                        {q.instructions ? (
                          <div className="mt-2 text-[10pt] italic" style={{ color: MAGENTA }}>
                            {substituteTokens(q.instructions, { categoryName: setup.categoryName || "" })}
                          </div>
                        ) : null}
                      </div>

                      {/* EDIT FIELDS */}
                      <div className="text-sm text-gray-500 mb-1">Section</div>
                      <input
                        className="w-full border rounded p-2 mb-2"
                        value={q.section}
                        onChange={(e) => updateQ(q.id, { section: e.target.value })}
                      />

                      {/* Code (read-only for standards, editable for customs) */}
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-xs font-semibold text-gray-500">Code:</label>
                        <input
                          className={`text-xs border rounded p-1 w-40 ${
                            idLabel.startsWith("C_") ? "bg-white" : "bg-gray-100 cursor-not-allowed"
                          }`}
                          value={idLabel}
                          onChange={(e) =>
                            idLabel.startsWith("C_") &&
                            updateQ(q.id, { idLabel: e.target.value })
                          }
                          readOnly={!idLabel.startsWith("C_")}
                        />
                      </div>

                      <div className="text-sm text-gray-500 mb-1">Question wording</div>
                      <input
                        className="w-full border rounded p-2"
                        value={q.text}
                        onChange={(e) => updateQ(q.id, { text: e.target.value })}
                      />

                      {/* Options edit */}
                      {q.options && q.options.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm text-gray-500 mb-1">Options</div>
                          {q.options.map((opt, i) => (
                            <input
                              key={i}
                              className="w-full border rounded p-2 mb-1"
                              value={opt}
                              onChange={(e) => {
                                const next = [...(q.options || [])];
                                next[i] = e.target.value;
                                updateQ(q.id, { options: next });
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Instructions edit */}
                      <div className="mt-2">
                        <div className="text-sm text-gray-500 mb-1">Recruiter Instructions</div>
                        <textarea
                          className="w-full border rounded p-2"
                          value={q.instructions || ""}
                          onChange={(e) => updateQ(q.id, { instructions: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Right-hand controls */}
                    <div className="flex flex-col items-end gap-2">
                      <button
                        className="px-3 py-1 rounded bg-gray-100"
                        onClick={() => move(q.id, -1)}
                      >
                        ▲
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-gray-100"
                        onClick={() => move(q.id, 1)}
                      >
                        ▼
                      </button>
                      <select
                        className="border rounded p-1 text-sm"
                        value={idx}
                        onChange={(e) => moveToIndex(q.id, Number(e.target.value))}
                      >
                        {build.map((_, i) => (
                          <option key={i} value={i}>
                            Pos {i + 1}
                          </option>
                        ))}
                      </select>
                      <button
                        className="px-3 py-1 rounded bg-red-600 text-white"
                        onClick={() => removeQ(q.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
