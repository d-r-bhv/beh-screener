import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import { Question, StudySetup } from "./types";
import { substituteTokens } from "./utils/text";

// Brand styling
const MAGENTA = "C0007A";
const FONT = "Calibri";
const NORMAL_SIZE = 22; // 11pt
const SMALL_SIZE = 20;  // 10pt

function p(text: string, opts?: { bold?: boolean; italics?: boolean; magenta?: boolean; size?: number }) {
  const run = new TextRun({
    text,
    bold: opts?.bold,
    italics: opts?.italics,
    color: opts?.magenta ? MAGENTA : undefined,
    size: opts?.size ?? NORMAL_SIZE,
    font: FONT,
  });
  return new Paragraph({ spacing: { after: 120 }, children: [run] });
}

function heading(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { after: 120 },
  });
}

export async function exportToWord(opts: {
  setup: StudySetup;
  questions: Question[];
  filename?: string;
}) {
  const { setup, questions } = opts;
  const filename = opts.filename || "Behaviorally_Screener.docx";

  // Tokens used across the document
  const tokens = {
    categoryName: setup.categoryName || "",
  };

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header (simple text header — you can keep your existing logo/header if you already had it)
          heading("Behaviorally Screener"),
          p(`Mode: ${modeLabel(setup.mode)}  |  Moderator: ${setup.moderator || "—"}`),
          p(`Dates: ${setup.dates || "—"}  |  Location/Platform: ${setup.locationOrPlatform || "—"}`),
          p(`Category: ${setup.categoryName || "—"}`, { bold: true }),
          p(setup.notes ? `Notes: ${setup.notes}` : "", {}),

          heading("Screener"),
          ...questions.flatMap((q, idx) => renderQuestion(idx + 1, q, tokens)),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

function renderQuestion(n: number, q: Question, tokens: Record<string, string>) {
  const out: Paragraph[] = [];
  out.push(p(`${n}. ${substituteTokens(q.text, tokens)}`, { bold: true }));

  if (q.options && q.options.length) {
    q.options.forEach((opt, i) => {
      const label = String.fromCharCode(97 + i) + "."; // a., b., c.
      out.push(p(`   ${label} ${substituteTokens(opt, tokens)}`));
    });
  }

  if (q.instructions) {
    out.push(
      p(substituteTokens(q.instructions, tokens), {
        italics: true,
        magenta: true,
        size: SMALL_SIZE,
      })
    );
  }

  return out;
}

function modeLabel(mode: StudySetup["mode"]) {
  switch (mode) {
    case "online":
      return "Online (Virtual)";
    case "inperson_external":
      return "In-Person (External Facility)";
    case "inperson_shopperlab":
      return "In-Person (ShopperLab)";
    default:
      return "—";
  }
}
