import React, { useMemo, useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

/** =========================
 *  Brand constants
 *  ========================= */
const BRAND_LOGO_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAA8CAYAAABkq0kYAAAACXBIWXMAAAsSAAALEgHS3X78AAAAGXRFWHRTb2Z0d2FyZQBwYWludC5uZXQgNC4yLjEyqf7hAAAB3klEQVR4Xu3aS26DQBBF0f//q0p7mB2yG3kC3M1wq5yXx2lq4o3m3y0m8XoCqS2j7z4P8y6Q0QmZ4wCw5Lx0H7wJmVhQAAAAAAAAAAAAAAAAAAAAAAAD4Xx3o0w2n1b1bV6Gd3l1v0Wg0m1n2d7Xy9Z3Gk2jI8uBv1ctwqJtY8l4k2b7M3g5y5zq6h7mGHk2iK7bJq6h0Uj2k1nqf9e1f+akg1nE2X0f1QzA2HfLzqz8b3x9e2rWmJfHcJr6WwqY2n2QeQeK6m8+WmXG9c1m6mKQq6w0h9B2F+3Jz6yYq3h8m2m5YJXb5o8i0mJgqL1s7m6J2qf0O2Qk9mL7vZb3XyYc1sX3bW6fI0aYpZQq8Ywq6l8kq8dG3j5mVj2Jv9mTPbY1Vg7mVdY2o0fGg0i3gq3b8bY6b2m1gKX4h8m1c2o8kEoZ0z0H1o0kI6gq4t9m1t2o8kEoZ0z0H1o0kI6gq4t9m1t2o8kEoZ0z0H1o0kI6gq4t9m1t2o8kEoZ0z0H1o0kI6gp6zV2c0m+7k5zq6cXyT2cJq9Wf3vKyr7GJ8z7r9wqg1bYk0kqv7mFv2mWcYH3r9rj1x5b8s8w8f3l8YQfYgn6vKqU3iY3y8w2w2g0Gg2Gg0Gg2Gg0Gg2Gg0Gg2Gg0Gg2Gg0Gg+E8gC5o8l8n44yTg8v7Wk8c9Y7f0mF0AAAAAAAAAAAAAAAAAAAAAAAAgP8B2n3y1q3c7i0AAAAASUVORK5CYII=";
const BRAND_MAGENTA = "C000A3"; // hex without '#'
const BODY_FONT_SIZE = 22; // docx half-points (~11pt)
const H2_SIZE = 28;        // ~14pt

/** =========================
 *  Types / constants
 *  ========================= */
const MODE_ONLINE = "online" as const;
const MODE_INPERSON = "inperson" as const;

const TYPE_SINGLE = "single" as const;
const TYPE_MULTI = "multi" as const;
const TYPE_OPEN = "open" as const;

type QType = typeof TYPE_SINGLE | typeof TYPE_MULTI | typeof TYPE_OPEN;

type Q = {
  id: string;
  section: string; // visible in UI for grouping; not exported as a header
  text: string;
  type: QType;
  options?: string[];
  instructions?: string; // ALL CAPS in magenta on export
  tags?: string[];
};

const rid = () => Math.random().toString(36).slice(2, 9);

/** =========================
 *  Seed library
 *  ========================= */
const seedLibrary: Q[] = [
  {
    id: "q1",
    section: "Screen-in",
    text: "Which of the following best describes your role in household grocery shopping?",
    type: TYPE_SINGLE,
    options: ["I am the primary shopper", "I share responsibilities", "I am not involved"],
    instructions:
      "Confirm respondent is primary or shares responsibilities. If not involved, terminate.",
    tags: ["general", "shopping", "household"],
  },
  {
    id: "q2",
    section: "Category Usage",
    text: "How often do you purchase beverages for your household?",
    type: TYPE_SINGLE,
    options: ["Weekly or more", "Every 2–3 weeks", "Monthly", "Less often / never"],
    instructions:
      "Prioritize WEEKLY and EVERY 2–3 WEEKS for frequent users unless otherwise specified.",
    tags: ["beverages", "frequency", "usage"],
  },
  {
    id: "q3",
    section: "Category Usage",
    text: "Which of the following snack types do you purchase at least once a month?",
    type: TYPE_MULTI,
    options: [
      "Chips & crisps",
      "Cookies & biscuits",
      "Crackers",
      "Nuts & trail mix",
      "Candy",
      "None of the above",
    ],
    instructions:
      "Probe for typical brands. IF 'NONE', VERIFY RELEVANCE BEFORE CONTINUING.",
    tags: ["snacks", "purchase", "assortment"],
  },
];

/** =========================
 *  Pure helpers (testable)
 *  ========================= */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const parts = dataUrl.split(",");
  const base64 = parts[1] || "";
  const binaryString = typeof atob === "function" ? atob(base64) : "";
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}
export function updateOptionInList(options: string[] = [], index: number, value: string) {
  return options.map((o, i) => (i === index ? value : o));
}
export function addOptionToList(options: string[] = [], value = "New option") {
  return [...options, value];
}
export function removeOptionFromList(options: string[] = [], index: number) {
  return options.filter((_, i) => i !== index);
}
export function moveItem<T>(arr: T[], from: number, to: number) {
  const a = [...arr];
  if (to < 0 || to >= a.length || from < 0 || from >= a.length) return arr;
  const tmp = a[from];
  a[from] = a[to];
  a[to] = tmp;
  return a;
}
function moveToIndex<T>(arr: T[], fromIdx: number, toIdx: number) {
  const a = [...arr];
  if (toIdx < 0) toIdx = 0;
  if (toIdx >= a.length) toIdx = a.length - 1;
  const [item] = a.splice(fromIdx, 1);
  a.splice(toIdx, 0, item);
  return a;
}

/** =========================
 *  Component
 *  ========================= */
export default function ScreenerBuilderApp() {
  const [category, setCategory] = useState("Beverages");
  const [mode, setMode] = useState<typeof MODE_ONLINE | typeof MODE_INPERSON>(MODE_ONLINE);
  const [studyTitle, setStudyTitle] = useState("AG### | Project Name");
  const [moderator, setModerator] = useState("");
  const [dates, setDates] = useState("");
  const [location, setLocation] = useState("");
  const [frontMatter, setFrontMatter] = useState("");
  const [specs, setSpecs] = useState("");

  const [library, setLibrary] = useState<Q[]>(seedLibrary);
  const [builderQs, setBuilderQs] = useState<Q[]>([]);
  const [lastDownload, setLastDownload] = useState<{ url: string; name: string; kind: "docx" | "doc" } | null>(null);

  // inline edit state (single-question, in-place editor)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Q | null>(null);
  const questionTextRef = useRef<HTMLTextAreaElement | null>(null);

  const [docTitle] = useState("Behaviorally Screener – Draft");

  const suggested = useMemo(() => {
    const catKey = category.toLowerCase();
    const specTokens = specs.toLowerCase().split(/[^a-z0-9+]+/).filter(Boolean);
    return library
      .map((q) => ({
        q,
        score:
          ((q.tags || []).some((t) => t.includes(catKey)) ? 2 : 0) +
          specTokens.reduce((acc, tok) => acc + (q.text.toLowerCase().includes(tok) ? 1 : 0), 0),
      }))
      .filter((o) => o.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((o) => o.q)
      .slice(0, 12);
  }, [category, specs, library]);

  useEffect(() => {
    if (editingId && questionTextRef.current) {
      questionTextRef.current.focus();
      questionTextRef.current.select();
    }
  }, [editingId]);

  function addToBuild(srcQ: Q) {
    const clone = { ...srcQ, id: rid() };
    setBuilderQs((prev) => [...prev, clone]);
  }

  function addCustom() {
    const q: Q = {
      id: rid(),
      section: "Custom",
      text: "New question",
      type: TYPE_SINGLE,
      options: ["Option 1", "Option 2"],
      instructions: "ADD RECRUITER NOTES HERE.",
      tags: ["custom"],
    };
    setBuilderQs((p) => [...p, q]);
  }

  function removeFromBuild(id: string) {
    setBuilderQs((p) => p.filter((q) => q.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setDraft(null);
    }
  }

  // ----- Inline edit handlers -----
  function startEdit(q: Q) {
    setEditingId(q.id);
    setDraft(JSON.parse(JSON.stringify(q)));
  }
  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }
  function saveEdit() {
    if (!editingId || !draft) return;
    setBuilderQs((p) => p.map((q) => (q.id === editingId ? { ...q, ...draft } : q)));
    setEditingId(null);
    setDraft(null);
  }
  function updateDraft<K extends keyof Q>(key: K, value: Q[K]) {
    if (!draft) return;
    setDraft({ ...draft, [key]: value });
  }
  function updateDraftOption(idx: number, value: string) {
    if (!draft) return;
    const next = updateOptionInList(draft.options || [], idx, value);
    setDraft({ ...draft, options: next });
  }
  function addDraftOption() {
    if (!draft) return;
    const next = addOptionToList(draft.options || []);
    setDraft({ ...draft, options: next });
  }
  function removeDraftOption(idx: number) {
    if (!draft) return;
    const next = removeOptionFromList(draft.options || [], idx);
    setDraft({ ...draft, options: next });
  }

  function loadBehaviorallyStandard() {
    const standard: Q[] = [
      { id: rid(), section: "Introduction", type: TYPE_OPEN, text: "Recruiter Intro Script", options: [], instructions: "READ STANDARD INTRO; CONFIRM CONFIDENTIALITY; NOT A SALES CALL.", tags: ["standard"] },
      { id: rid(), section: "Eligibility", type: TYPE_SINGLE, text: "Record Gender", options: ["Male", "Female", "Non-binary", "Prefer to self-identify"], instructions: "APPLY GENDER QUOTAS PER SPECS.", tags: ["standard","gender"] },
      { id: rid(), section: "Eligibility", type: TYPE_SINGLE, text: "Have you participated in a market research group/interview before?", options: ["Yes", "No"], instructions: "IF YES, ASK RECENCY & FREQUENCY FOLLOW-UPS; TERMINATE IF TOO RECENT.", tags: ["standard","participation"] },
      { id: rid(), section: "Eligibility", type: TYPE_SINGLE, text: "How long ago did you participate?", options: ["Within the past 3 months", "3–6 months ago", "Longer than 6 months ago"], instructions: "TERMINATE IF WITHIN PAST 3 MONTHS (UNLESS OTHERWISE SPECIFIED).", tags: ["standard"] },
      { id: rid(), section: "Eligibility", type: TYPE_OPEN, text: "Approximately how many research sessions in the past year?", options: [], instructions: "TERMINATE IF >4 IN 12 MONTHS (UNLESS OTHERWISE SPECIFIED).", tags: ["standard"] },
      { id: rid(), section: "Screen-out", type: TYPE_MULTI, text: "Do you or anyone in your household work in any of the following?", options: ["Market research", "Advertising", "PR", "Media", "Graphic/Packaging design", "CPG manufacturing (category relevant)", "Other restricted"], instructions: "TERMINATE IF ANY RESTRICTED INDUSTRY SELECTED.", tags: ["standard","screenout"] },
      { id: rid(), section: "Eligibility", type: TYPE_OPEN, text: "What is your age?", options: [], instructions: "TERMINATE IF OUT OF RANGE PER SPEC (E.G., 18–54).", tags: ["standard","age"] },
      { id: rid(), section: "Household Shopping", type: TYPE_SINGLE, text: "How much of the household category shopping do you do?", options: ["All of it", "Half or more", "Less than half", "None"], instructions: "TERMINATE IF LESS THAN HALF.", tags: ["standard"] },
      { id: rid(), section: "Category Usage", type: TYPE_SINGLE, text: "How often do you purchase/consume this category?", options: ["Once a week","Every 2 weeks","Once a month","Every 2–3 months","Every 6 months","Once a year","Never"], instructions: "TERMINATE PER FREQUENCY THRESHOLDS IN SPEC.", tags: ["standard","usage"] },
      { id: rid(), section: "Brands", type: TYPE_MULTI, text: "Which brands have you purchased in the past 3 months? (Add list)", options: ["Brand A","Brand B","Brand C","Other"], instructions: "ADD MOST OFTEN AND REJECT FOLLOW-UPS; CLASSIFY USERS/NON-USERS.", tags: ["standard","brands"] },
      { id: rid(), section: "Articulation", type: TYPE_OPEN, text: "Tell me about your most recent experience in this category.", options: [], instructions: "ASSESS CLARITY & ENTHUSIASM; AVOID RELUCTANT/TIMID.", tags: ["standard","articulation"] },
      { id: rid(), section: "Demographics", type: TYPE_SINGLE, text: "Marital status", options: ["Married/living with someone","Single","Divorced/separated","Widowed"], instructions: "RECRUIT A MIX UNLESS SPECIFIED.", tags: ["standard","demo"] },
      { id: rid(), section: "Demographics", type: TYPE_SINGLE, text: "Ethnicity", options: ["White/Caucasian","Black/African American","Asian/Pacific Islander","Hispanic/Latino","Other"], instructions: "RECRUIT A MIX PER SPEC.", tags: ["standard","demo"] },
      { id: rid(), section: "Demographics", type: TYPE_SINGLE, text: "Education", options: ["Some HS or less","Completed HS","Some College/Technical","Completed College/Technical","Some Post-Grad or more"], instructions: "TERMINATE IF SOME HS OR LESS (TYPICAL).", tags: ["standard","demo"] },
      { id: rid(), section: "Employment", type: TYPE_MULTI, text: "Current employment status", options: ["Employed Full-Time","Employed Part-Time","Student","Homemaker","Retired","Currently Seeking Employment"], instructions: "AIM FOR MIX; OFTEN 80% FT. TERMINATE IF 'CURRENTLY SEEKING' AS REQUIRED.", tags: ["standard","employment"] },
      { id: rid(), section: "Employment", type: TYPE_OPEN, text: "Occupation / Industry (and spouse if married)", options: [], instructions: "CHECK AGAINST SCREEN-OUT LIST.", tags: ["standard","employment"] },
      { id: rid(), section: "Income", type: TYPE_SINGLE, text: "Total annual household income", options: ["< $30k","$30–44.9k","$45–59.9k","$60–74.9k","$75–99.9k","$100k+","Prefer not to say"], instructions: "RECRUIT MIX; ADJUST PER SPEC.", tags: ["standard","income"] },
      { id: rid(), section: "Logistics", type: TYPE_OPEN, text: "Device/Connection Check (Online only)", options: [], instructions: "ASK WEBCAM/LAPTOP, INTERNET SPEED, COMFORT WITH TECH – ONLINE ONLY.", tags: ["standard","device"] },
      { id: rid(), section: "Invitation", type: TYPE_OPEN, text: "Invitation & Incentive Script", options: [], instructions: "CONFIRM AVAILABILITY; INCENTIVE; EARLY ARRIVAL NOTE; RCDA/CONSENT.", tags: ["standard","invite"] },
    ];
    setBuilderQs(standard);
  }

  function shouldIncludeDeviceChecks() {
    return mode === MODE_ONLINE;
  }

  /** =========================
   *  CSV import (Section,Question,Type,Options,Instructions,Tags)
   *  ========================= */
  function importCSV(text: string) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const out: Q[] = [];
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const cells = raw.split(",").map((c) => c.trim().replace(/^\"|\"$/g, ""));
      const [section, question, type, opts, instr, tags] = [
        cells[0] || "Imported",
        cells[1] || "",
        (cells[2] || TYPE_SINGLE).toLowerCase(),
        cells[3] || "",
        cells[4] || "",
        cells[5] || "",
      ];
      const options = opts ? opts.split(";").map((s) => s.trim()).filter(Boolean) : [];
      const tagList = tags ? tags.split(";").map((s) => s.trim().toLowerCase()).filter(Boolean) : [];
      if (!question) continue;
      out.push({
        id: rid(),
        section,
        text: question,
        type: ([TYPE_SINGLE, TYPE_MULTI, TYPE_OPEN] as string[]).includes(type) ? (type as QType) : TYPE_SINGLE,
        options,
        instructions: instr,
        tags: tagList,
      });
    }
    if (out.length) setLibrary((p) => [...p, ...out]);
  }

  /** =========================
   *  Download helpers
   *  ========================= */
  function triggerDownload(blob: Blob, filename: string, kind: "docx" | "doc") {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;

      const supportsDownload = "download" in HTMLAnchorElement.prototype;
      if (!supportsDownload) {
        window.open(url, "_blank");
        setLastDownload((prev) => {
          if (prev?.url) URL.revokeObjectURL(prev.url);
          return { url, name: filename, kind };
        });
        return;
      }

      document.body.appendChild(a);
      a.click();
      a.remove();
      setLastDownload((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return { url, name: filename, kind };
      });
    } catch (e) {
      console.error("Download trigger failed", e);
    }
  }

  /** =========================
   *  Export to Word (.docx) with docx
   *  ========================= */
  async function exportToWord() {
    const { Document, Packer, Paragraph, HeadingLevel, TextRun, ImageRun } = await import("docx");

    const headerChildren: any[] = [];
    try {
      headerChildren.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: dataUrlToUint8Array(BRAND_LOGO_DATA_URL),
              transformation: { width: 200, height: 60 },
            }),
          ],
        })
      );
    } catch (e) {
      console.warn("Logo embed failed, continuing without logo", e);
    }

    try {
      const doc = new Document({
        styles: {
          paragraphStyles: [
            { id: "Title", name: "Title", basedOn: "Normal", run: { size: 32, bold: true, font: "Calibri" } },
            { id: "Heading2", name: "Heading 2", basedOn: "Normal", run: { size: H2_SIZE, bold: true, color: BRAND_MAGENTA, font: "Calibri" } },
            { id: "Body", name: "Body", basedOn: "Normal", run: { size: BODY_FONT_SIZE, font: "Calibri" } },
          ],
        },
        sections: [
          {
            properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
            children: [
              ...headerChildren,
              new Paragraph({ text: studyTitle || docTitle, heading: HeadingLevel.TITLE }),
              new Paragraph({ text: mode === MODE_ONLINE ? "Mode: Online" : "Mode: In-person" }),
              ...(frontMatter ? frontMatter.split(/\r?\n/).map((l) => new Paragraph({ text: l })) : []),
              new Paragraph({ text: "" }),
              moderator ? new Paragraph({ text: `Moderator: ${moderator}` }) : new Paragraph({ text: "" }),
              dates ? new Paragraph({ text: `Date(s): ${dates}` }) : new Paragraph({ text: "" }),
              location ? new Paragraph({ text: `Location/Platform: ${location}` }) : new Paragraph({ text: "" }),
              new Paragraph({ text: `Category: ${category}` }),
              specs ? new Paragraph({ text: specs }) : new Paragraph({ text: "" }),
              new Paragraph({ text: "" }),
              new Paragraph({ text: "Recruitment Screener (Behaviorally Standard)", heading: HeadingLevel.HEADING_2 }),

              // Questions
              ...builderQs
                .filter((q) => !(q.section === "Logistics" && !shouldIncludeDeviceChecks()))
                .flatMap((q, idx) => {
                  const parts: any[] = [];

                  parts.push(new Paragraph({ children: [new TextRun({ text: `${idx + 1}. ${q.text}` })] }));

                  if (q.type !== TYPE_OPEN && (q.options || []).length) {
                    const opts = q.options || [];
                    for (let i = 0; i < opts.length; i++) {
                      parts.push(new Paragraph({ children: [new TextRun({ text: `  ${String.fromCharCode(97 + i)}. ${opts[i]}` })] }));
                    }
                  }

                  if (q.instructions) {
                    parts.push(
                      new Paragraph({
                        children: [new TextRun({ text: (q.instructions || "").toUpperCase(), color: BRAND_MAGENTA, italics: true })],
                      })
                    );
                  }

                  parts.push(new Paragraph({ text: "" }));
                  return parts;
                }),
            ],
          },
        ],
      });

      let blob: Blob | null = null;
      try {
        if ((Packer as any).toBlob) {
          blob = await (Packer as any).toBlob(doc);
        } else if ((Packer as any).toBuffer) {
          const buffer = await (Packer as any).toBuffer(doc);
          blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
        }
      } catch (packErr) {
        console.error("docx pack failed, will fall back to .doc", packErr);
      }

      if (blob) {
        const name = `${(studyTitle || docTitle).replace(/[^a-z0-9-_]+/gi, "_")}.docx`;
        triggerDownload(blob, name, "docx");
        return;
      }

      exportAsHtmlDoc();
    } catch (err) {
      console.error("Export failed, using HTML fallback", err);
      exportAsHtmlDoc();
    }
  }

  /** =========================
   *  Export as HTML (.doc fallback)
   *  ========================= */
  function exportAsHtmlDoc() {
    const logoImg = `<img src="${BRAND_LOGO_DATA_URL}" style="max-height:64px"/>`;
    const html =
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${studyTitle || docTitle}</title></head><body>` +
      `${logoImg}` +
      `<h1>${studyTitle || docTitle}</h1>` +
      `<p>${mode === MODE_ONLINE ? "Mode: Online" : "Mode: In-person"}</p>` +
      (moderator ? `<p><strong>Moderator:</strong> ${moderator}</p>` : "") +
      (dates ? `<p><strong>Date(s):</strong> ${dates}</p>` : "") +
      (location ? `<p><strong>Location/Platform:</strong> ${location}</p>` : "") +
      `<p><strong>Category:</strong> ${category}</p>` +
      (specs ? `<p>${specs}</p>` : "") +
      `<h2 style="color:#${BRAND_MAGENTA}">Recruitment Screener (Behaviorally Standard)</h2>` +
      builderQs
        .filter((q) => !(q.section === "Logistics" && !shouldIncludeDeviceChecks()))
        .map((q, i) => {
          const opts = q.type !== TYPE_OPEN && (q.options || []).length ? `<ul>${(q.options || []).map((o: string) => `<li>${o}</li>`).join("")}</ul>` : "";
          const ri = q.instructions ? `<p style="color:#${BRAND_MAGENTA};font-style:italic">${(q.instructions || "").toUpperCase()}</p>` : "";
          return `<p><strong>${i + 1}. ${q.text}</strong></p>${opts}${ri}`;
        })
        .join("") +
      `</body></html>`;

    const blob = new Blob([html], { type: "application/msword" });
    const name = `${(studyTitle || docTitle).replace(/[^a-z0-9-_]+/gi, "_")}.doc`;
    triggerDownload(blob, name, "doc");
  }

  /** =========================
   *  Drag & Drop handler
   *  ========================= */
  function onDragEnd(result: DropResult) {
    const { source, destination } = result;
    if (!destination) return;
    if (source.index === destination.index) return;
    setBuilderQs((prev) => moveToIndex(prev, source.index, destination.index));
  }

  /** =========================
   *  UI
   *  ========================= */
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="font-semibold tracking-tight text-lg">Behaviorally Screener Builder</div>
          <div className="ml-auto flex items-center gap-2">
            <input
              className="px-2 py-1 border rounded w-[260px]"
              value={studyTitle}
              onChange={(e) => setStudyTitle(e.target.value)}
              placeholder="AG### | Project Name"
            />
            <button
              onClick={exportToWord}
              className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 shadow"
              title="Export to Word"
            >
              Export to Word
            </button>
          </div>
        </div>
        {lastDownload && (
          <div className="mx-auto max-w-7xl px-4 pb-3">
            <div className="text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded p-2">
              If your download didn’t start,{" "}
              <a className="underline" href={lastDownload.url} download={lastDownload.name} target="_blank" rel="noopener noreferrer">
                click here
              </a>{" "}
              to save the {lastDownload.kind.toUpperCase()} file, or{" "}
              <button className="underline" onClick={() => window.open(lastDownload.url, "_blank")}>
                open in a new tab
              </button>.
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-12 gap-4">
        {/* Left: Study Setup & Suggestions */}
        <section className="col-span-3 space-y-4">
          <div className="bg-white rounded-2xl shadow p-4 space-y-3">
            <h2 className="font-semibold">Study Setup</h2>

            <label className="block text-sm">Mode</label>
            <select className="w-full border rounded px-2 py-1" value={mode} onChange={(e) => setMode(e.target.value as any)}>
              <option value={MODE_ONLINE}>Online</option>
              <option value={MODE_INPERSON}>In-person</option>
            </select>

            <label className="block text-sm mt-2">Moderator</label>
            <input className="w-full border rounded px-2 py-1" value={moderator} onChange={(e) => setModerator(e.target.value)} placeholder="Moderator Name" />

            <label className="block text-sm mt-2">Date(s)</label>
            <input className="w-full border rounded px-2 py-1" value={dates} onChange={(e) => setDates(e.target.value)} placeholder="e.g., May 8–9, 2024" />

            <label className="block text-sm mt-2">Location / Platform</label>
            <input className="w-full border rounded px-2 py-1" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="ShopperLab Teaneck, NJ or Zoom" />

            <div className="mt-2 text-xs text-slate-500">Company logo is applied automatically to exports.</div>

            <label className="block text-sm mt-2">Front Matter (schedule, quotas, address)</label>
            <textarea className="w-full border rounded px-2 py-1 h-28" value={frontMatter} onChange={(e) => setFrontMatter(e.target.value)} placeholder={"Paste schedule, quotas, address block as in the template..."} />

            <label className="block text-sm mt-2">Category</label>
            <select className="w-full border rounded px-2 py-1" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Beverages</option>
              <option>Snacks</option>
              <option>Personal Care</option>
              <option>Household</option>
              <option>Other</option>
            </select>

            <label className="block text-sm mt-2">Specs / Notes</label>
            <textarea className="w-full border rounded px-2 py-1 h-20" value={specs} onChange={(e) => setSpecs(e.target.value)} placeholder="Targets, quotas, time frame, channels, etc." />

            <button className="px-3 py-2 rounded bg-slate-900 text-white w-full" onClick={loadBehaviorallyStandard}>
              Load Behaviorally Standard Order
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Suggested Questions</h2>
              <span className="text-xs text-slate-500">{suggested.length} shown</span>
            </div>
            <div className="text-xs text-slate-500">
              {mode === MODE_ONLINE ? "Online: device checks will be included" : "In-person: device checks will be omitted in export"}
            </div>
            <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
              {suggested.length === 0 && <div className="text-sm text-slate-500">No suggestions yet. Add specs or change category.</div>}
              {suggested.map((q) => (
                <div key={q.id} className="border rounded p-2">
                  <div className="text-sm font-medium">{q.section}</div>
                  <div className="text-sm">{q.text}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs text-slate-500 uppercase">{q.type}</div>
                    <button className="text-xs px-2 py-1 rounded bg-slate-900 text-white" onClick={() => addToBuild(q)}>
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-4 space-y-3">
            <h2 className="font-semibold">Import CSV to Library</h2>
            <p className="text-xs text-slate-600">Columns: Section, Question, Type(single|multi|open), Options(; separated), Instructions, Tags(; separated)</p>
            <textarea
              id="csv"
              className="w-full border rounded px-2 py-1 h-24"
              placeholder={'e.g.\nScreen-in,"Are you the primary grocery shopper?",single,"Yes;No","Terminate if No","general;shopping"'}
            />
            <button
              onClick={() => {
                const val = (document.getElementById("csv") as HTMLTextAreaElement).value;
                importCSV(val);
              }}
              className="mt-2 px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Add to Library
            </button>
          </div>
        </section>

        {/* Middle: Builder (drag & drop + quick-jump) */}
        <section className="col-span-9">
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Screener Builder</h2>
              <div className="flex items-center gap-2">
                <button onClick={addCustom} className="px-3 py-2 rounded bg-slate-900 text-white">
                  Add Custom
                </button>
              </div>
            </div>

            {builderQs.length === 0 ? (
              <div className="text-sm text-slate-500 mt-4">
                Use <strong>Load Behaviorally Standard Order</strong>, then tweak with <strong>Suggested</strong> or <strong>Library</strong>.
              </div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="builder-list">
                  {(dropProvided) => (
                    <ul ref={dropProvided.innerRef} {...dropProvided.droppableProps} className="mt-4 space-y-2">
                      {builderQs.map((q, i) => {
                        const isEditing = editingId === q.id;
                        return (
                          <Draggable draggableId={q.id} index={i} key={q.id}>
                            {(dragProvided) => (
                              <li
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                className={`border rounded p-3 ${isEditing ? "ring-2 ring-blue-400" : ""}`}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Drag handle */}
                                  <div
                                    {...dragProvided.dragHandleProps}
                                    className="cursor-grab select-none text-slate-400 pt-1"
                                    title="Drag to reorder"
                                  >
                                    ⋮⋮
                                  </div>

                                  <div className="text-slate-500 w-6 pt-1">{i + 1}.</div>

                                  <div className="flex-1">
                                    {!isEditing ? (
                                      <>
                                        <div className="text-xs uppercase tracking-wide text-slate-500">{q.section}</div>
                                        <div className="font-medium">{q.text}</div>
                                        <div className="text-xs text-slate-500 mt-1">Type: {q.type}</div>

                                        {q.type !== TYPE_OPEN && (q.options?.length ?? 0) > 0 && (
                                          <ul className="list-disc ml-6 text-sm mt-1">
                                            {(q.options || []).map((o: string, idx: number) => (
                                              <li key={idx}>{o}</li>
                                            ))}
                                          </ul>
                                        )}

                                        {q.instructions && (
                                          <div className="text-sm mt-2">
                                            <span className="text-[#C000A3] italic font-medium">
                                              {(q.instructions || "").toUpperCase()}
                                            </span>
                                          </div>
                                        )}

                                        {q.tags?.length ? (
                                          <div className="mt-2 flex flex-wrap gap-1">
                                            {q.tags.map((t: string, idx: number) => (
                                              <span key={idx} className="px-2 py-0.5 text-xs rounded-full bg-slate-100 border">
                                                {t}
                                              </span>
                                            ))}
                                          </div>
                                        ) : null}
                                      </>
                                    ) : (
                                      <>
                                        <label className="block text-xs uppercase text-slate-500">Section</label>
                                        <input className="w-full border rounded px-2 py-1" value={draft?.section || ""} onChange={(e) => updateDraft("section", e.target.value)} />

                                        <label className="block text-xs uppercase text-slate-500 mt-2">Question Text</label>
                                        <textarea
                                          className="w-full border rounded px-2 py-1 h-24"
                                          value={draft?.text || ""}
                                          onChange={(e) => updateDraft("text", e.target.value)}
                                          ref={questionTextRef}
                                        />

                                        <label className="block text-xs uppercase text-slate-500 mt-2">Type</label>
                                        <select
                                          className="w-full border rounded px-2 py-1"
                                          value={draft?.type || TYPE_SINGLE}
                                          onChange={(e) => updateDraft("type", e.target.value as QType)}
                                        >
                                          <option value={TYPE_SINGLE}>Single-select</option>
                                          <option value={TYPE_MULTI}>Multi-select</option>
                                          <option value={TYPE_OPEN}>Open-ended</option>
                                        </select>

                                        {draft?.type !== TYPE_OPEN && (
                                          <div className="border rounded p-2 mt-2">
                                            <div className="flex items-center justify-between">
                                              <div className="text-sm font-medium">Options</div>
                                              <button className="text-xs px-2 py-1 rounded bg-slate-900 text-white" onClick={addDraftOption}>
                                                Add
                                              </button>
                                            </div>
                                            <div className="space-y-1 mt-2">
                                              {(draft?.options || []).map((o: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                  <input className="flex-1 border rounded px-2 py-1" value={o} onChange={(e) => updateDraftOption(idx, e.target.value)} />
                                                  <button className="text-xs px-2 py-1 rounded bg-white border" onClick={() => removeDraftOption(idx)}>
                                                    Remove
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        <label className="block text-xs uppercase text-slate-500 mt-2">Recruiter Instructions</label>
                                        <textarea className="w-full border rounded px-2 py-1 h-24" value={draft?.instructions || ""} onChange={(e) => updateDraft("instructions", e.target.value)} />

                                        <label className="block text-xs uppercase text-slate-500 mt-2">Tags (; separated)</label>
                                        <input
                                          className="w-full border rounded px-2 py-1"
                                          value={(draft?.tags || []).join("; ")}
                                          onChange={(e) => updateDraft("tags", e.target.value.split(/;\s*/).filter(Boolean))}
                                        />
                                      </>
                                    )}
                                  </div>

                                  <div className="flex flex-col gap-1 items-end">
                                    {!isEditing ? (
                                      <>
                                        <button className="text-xs px-2 py-1 rounded bg-white border" onClick={() => startEdit(q)}>
                                          Edit
                                        </button>

                                        {/* Quick-jump: Move to position */}
                                        <div className="flex items-center gap-1">
                                          <span className="text-[11px] text-slate-500">Move to</span>
                                          <select
                                            className="text-xs border rounded px-1 py-0.5"
                                            value={i + 1}
                                            onChange={(e) => setBuilderQs((prev) => moveToIndex(prev, i, Number(e.target.value) - 1))}
                                          >
                                            {builderQs.map((_, n) => (
                                              <option key={n} value={n + 1}>
                                                {n + 1}
                                              </option>
                                            ))}
                                          </select>
                                        </div>

                                        {/* Nudges (optional) */}
                                        <button
                                          className="text-xs px-2 py-1 rounded bg-white border"
                                          onClick={() => setBuilderQs((prev) => moveToIndex(prev, i, i - 1))}
                                          disabled={i === 0}
                                          title={i === 0 ? "Already at top" : "Move up"}
                                        >
                                          ▲
                                        </button>
                                        <button
                                          className="text-xs px-2 py-1 rounded bg-white border"
                                          onClick={() => setBuilderQs((prev) => moveToIndex(prev, i, i + 1))}
                                          disabled={i === builderQs.length - 1}
                                          title={i === builderQs.length - 1 ? "Already at bottom" : "Move down"}
                                        >
                                          ▼
                                        </button>

                                        <button className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200" onClick={() => removeFromBuild(q.id)}>
                                          Remove
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button className="text-xs px-2 py-1 rounded bg-emerald-600 text-white" onClick={saveEdit}>
                                          Save
                                        </button>
                                        <button className="text-xs px-2 py-1 rounded bg-white border" onClick={cancelEdit}>
                                          Cancel
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </li>
                            )}
                          </Draggable>
                        );
                      })}
                      {dropProvided.placeholder}
                    </ul>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>

          {/* Library */}
          <div className="bg-white rounded-2xl shadow p-4 mt-4">
            <h2 className="font-semibold mb-2">Library (All)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[320px] overflow-auto pr-1">
              {library.map((q) => (
                <div key={q.id} className="border rounded p-2">
                  <div className="text-sm font-medium">{q.section}</div>
                  <div className="text-sm">{q.text}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs text-slate-500 uppercase">{q.type}</div>
                    <button className="text-xs px-2 py-1 rounded bg-slate-900 text-white" onClick={() => addToBuild(q)}>
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-2 text-xs text-slate-500">
        Prototype – internal Behaviorally use. Replace seed questions with your library.
      </footer>
    </div>
  );
}
