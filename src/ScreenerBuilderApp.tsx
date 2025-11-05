import React, { useMemo, useState } from "react";
import { buildStandardQuestions } from "./questionLibrary";
import { exportToWord } from "./exportToWord";
import { Mode, Question, StudySetup } from "./types";
import { withCategory } from "./utils/text";

const modes: { value: Mode; label: string }[] = [
  { value: "online", label: "Online (Virtual)" },
  { value: "inperson_external", label: "In-Person (External Facility)" },
  { value: "inperson_shopperlab", label: "In-Person (ShopperLab)" },
];

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

  const standard = useMemo(() => buildStandardQuestions(setup.mode), [setup.mode]);

  const loadStandard = () => {
    setBuild(standard);
    setView("builder");
  };

  const exportDoc = async () => {
    await exportToWord({ setup, questions: build });
  };

  const addCustom = () => {
    const q: Question = {
      id: `custom_${Date.now()}`,
      section: "Custom",
      text: "New question about {{categoryName}}…",
      type: "open",
      options: [],
      instructions: "",
      tags: ["custom"],
    };
    setBuild((prev) => [...prev, q]);
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

  // ---------------- SETUP VIEW -----------------
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
                placeholder='e.g., "dry shampoo", "frozen novelties", "refrigerated liquid coffee creamer"'
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

  // ---------------- BUILDER VIEW -----------------
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 relative">
      {/* Floating Back Button */}
      <button
        onClick={() => setShowConfirm(true)}
        className="fixed bottom-5 left-5 bg-white border border-gray-300 shadow-lg text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 z-50"
      >
        ← Back
      </button>

      {/* Confirmation Modal */}
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

      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Behaviorally Screener Builder</h1>

        <div className="flex flex-wrap gap-3 mb-4">
          <button
            className="px-4 py-2 rounded bg-gray-200"
            onClick={addCustom}
          >
            Add Custom Question
          </button>
          <button
            className="px-4 py-2 rounded bg-fuchsia-700 text-white"
            onClick={exportDoc}
            disabled={!build.length}
          >
            Export to Word (.docx)
          </button>
        </div>

        {/* Builder Cards */}
        <div className="bg-white rounded-2xl shadow p-4">
          {!build.length && (
            <p className="text-sm text-gray-500">
              Click <strong>Load Behaviorally Standard Order</strong> on the setup page to start.
            </p>
          )}
          <ul className="space-y-4">
            {build.map((q, idx) => (
              <li key={q.id} className="border rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">{q.section}</div>
                    <input
                      className="w-full text-base font-semibold border rounded p-2"
                      value={q.text}
                      onChange={(e) => updateQ(q.id, { text: e.target.value })}
                    />
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
                    <div className="mt-2">
                      <div className="text-sm text-gray-500 mb-1">Recruiter Instructions</div>
                      <textarea
                        className="w-full border rounded p-2"
                        value={q.instructions || ""}
                        onChange={(e) => updateQ(q.id, { instructions: e.target.value })}
                      />
                    </div>
                    <div className="mt-3 text-xs text-gray-600">
                      <div className="font-semibold">Preview with Category:</div>
                      <div className="mt-1">
                        <span className="font-medium">Q{idx + 1}.</span>{" "}
                        {withCategory(q.text, setup.categoryName || "").trim() || "—"}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
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
                    <button
                      className="px-3 py-1 rounded bg-red-600 text-white"
                      onClick={() => removeQ(q.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500">Type</label>
                    <select
                      className="mt-1 w-full border rounded p-2"
                      value={q.type}
                      onChange={(e) => updateQ(q.id, { type: e.target.value as Question["type"] })}
                    >
                      <option value="single">single</option>
                      <option value="multi">multi</option>
                      <option value="open">open</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id={`req-${q.id}`}
                      type="checkbox"
                      className="mt-6"
                      checked={!!q.required}
                      onChange={(e) => updateQ(q.id, { required: e.target.checked })}
                    />
                    <label htmlFor={`req-${q.id}`} className="mt-6 text-sm">
                      Required
                    </label>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
