import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Header,
  ImageRun,
} from "docx";
import { Question, StudySetup } from "./types";
import { substituteTokens } from "./utils/text";

/**
 * ===== HOW TO USE THE LOGO =====
 * Put your logo file at: public/behaviorally-logo.png
 * If deploying under GitHub Pages, the runtime URL will be:
 *   `${location.origin}${import.meta.env.BASE_URL || "/"}behaviorally-logo.png`
 * The helper below fetches it and embeds it in the Word header on every page.
 */

async function fetchLogoBytes(): Promise<Uint8Array | null> {
  try {
    const base = (import.meta as any)?.env?.BASE_URL || "/";
    const url = `${location.origin}${base}behaviorally-logo.png`;
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) return null;
    const buf = await resp.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

// Brand styling
const MAGENTA = "C0007A";
const FONT = "Calibri";
const SIZE_BODY = 22;  // 11pt
const SIZE_SMALL = 20; // 10pt

// Paragraph helpers
function p(
  children: (TextRun | string)[],
  opts?: { spacingAfter?: number }
) {
  const runs = children.map((c) =>
    typeof c === "string" ? new TextRun({ text: c, font: FONT, size: SIZE_BODY }) : c
  );
  return new Paragraph({
    spacing: { after: opts?.spacingAfter ?? 160 }, // ~8pt after, similar to examples
    children: runs,
  });
}

function heading(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { after: 200 },
  });
}

// Styled runs
function runBody(text: string) {
  return new TextRun({ text, font: FONT, size: SIZE_BODY });
}
function runBold(text: string) {
  return new TextRun({ text, font: FONT, size: SIZE_BODY, bold: true });
}
function runInstr(text: string) {
  return new TextRun({ text, font: FONT, size: SIZE_SMALL, italics: true, color: MAGENTA });
}

// Fallback mapping for standard question codes if idLabel isn't set yet.
// (This lets you get standardized labels *now* without having to update the entire library at once.)
const STANDARD_ID_MAP: Record<string, string> = {
  intro_read: "S_Intro",
  gender: "S_Gender",
  research_participation: "S_PastPar",
  industry_exclusions: "S_IndustryExcl",
  age: "S_Age",
  hh_shopping_role: "S_HHGrocery",
  brand_decider: "S_BrandDecider",
  category_usage: "S_CategoryUsage",
  brand_grid: "S_BrandGrid",
  articulation: "S_Articulation",
  marital_status: "S_Marital",
  children_hh: "S_KidsInHH",
  ethnicity: "S_Ethnicity",
  education: "S_Education",
  employment_status: "S_Employment",
  occupation_checks: "S_OccupationChecks",
  income: "S_Income",
  vision_colorblind: "S_VisionColor",
  invitation: "S_Invitation",
  rcda: "S_RCDA",
  // ShopperLab / Online extras
  met_ok: "S_MET_OK",
  met_vision_devices: "S_MET_Devices",
  met_four_feet: "S_MET_4ft",
  met_eye_conditions: "S_MET_Eyes",
  met_mobility: "S_MET_Mobility",
  met_rubber_allergy: "S_MET_Rubber",
  met_recruiter_read: "S_MET_Read",
  tech_devices: "S_TechDevices",
  tech_comfort: "S_TechComfort",
  tech_rules: "S_TechRules",
  arrival_reminder: "S_FacilityArrival",
};

// Main export
export async function exportToWord(opts: {
  setup: StudySetup;
  questions: Question[];
  filename?: string;
}) {
  const { setup, questions } = opts;
  const filename = opts.filename || "Behaviorally_Screener.docx";

  const tokens = { categoryName: setup.categoryName || "" };

  // Try to get logo
  const logo = await fetchLogoBytes();
  const header = new Header({
    children: [
      new Paragraph({
        children: logo
          ? [
              new ImageRun({
                data: logo,
                transformation: {
                  width: 190, // tweak to taste
                  height: 36,
                },
              }),
            ]
          : [runBold("Behaviorally")],
        spacing: { after: 200 },
      }),
    ],
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT,
            size: SIZE_BODY,
          },
          paragraph: {
            spacing: { after: 160 },
          },
        },
      },
    },
    sections: [
      {
        headers: { default: header },
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5" margins
          },
        },
        children: [
          heading("Screener"),
          p([runBold(`Mode: `), runBody(modeLabel(setup.mode)), runBody("   |   "), runBold("Moderator: "), runBody(setup.moderator || "—")]),
          p([runBold(`Dates: `), runBody(setup.dates || "—"), runBody("   |   "), runBold("Location/Platform: "), runBody(setup.locationOrPlatform || "—")]),
          p([runBold(`Category: `), runBody(setup.categoryName || "—")]),
          setup.notes ? p([runBody(`Notes: ${setup.notes}`)]) : new Paragraph({}), // blank line if no notes

          // Render questions
          ...questions.flatMap((q) => renderQuestion(q, tokens)),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, filename);
}

// ===== Question rendering (no numbering, label is bold) =====
function renderQuestion(q: Question, tokens: Record<string, string>) {
  const out: Paragraph[] = [];

  const labelText = (q.idLabel && q.idLabel.trim().length > 0)
    ? q.idLabel.trim()
    : STANDARD_ID_MAP[q.id] || ""; // fallback mapping for standards

  const questionLine: (TextRun | string)[] = [];
  if (labelText) {
    questionLine.push(runBold(`[${labelText}] `));
  }
  questionLine.push(runBody(substituteTokens(q.text, tokens)));

  out.push(p(questionLine));

  // Options (a., b., c.)
  if (q.options?.length) {
    q.options.forEach((opt, i) => {
      const label = String.fromCharCode(97 + i) + "."; // a., b., c.
      out.push(
        p([runBody(`   ${label} `), runBody(substituteTokens(opt, tokens))], {
          spacingAfter: 80, // tighter after options
        })
      );
    });
  }

  // Recruiter instructions (magenta, italics, smaller)
  if (q.instructions) {
    out.push(
      p([runInstr(substituteTokens(q.instructions, tokens))], {
        spacingAfter: 200,
      })
    );
  }

  return out;
}

// ===== Helpers =====
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

// dependency-free download helper
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
