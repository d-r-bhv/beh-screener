import { Mode, Question } from "./types";

// Shared constants for recruiter instruction formatting (magenta, caps handled in export)
const MAGENTA_INSTR = (s: string) => s; // render style is applied during export

// ----- Universal Standard Questions (always loaded; some may be info-only) -----
export const universalStandardQuestions: Question[] = [
  {
    id: "intro_read",
    section: "Introduction",
    text:
      "Hello, my name is ___________ from ____________, a market research firm. We are conducting a survey today on various products. This is not an attempt to sell you anything. We are interested in your opinions. Would you spare a few minutes to answer some questions? All your answers will be kept confidential.",
    type: "open",
    instructions: MAGENTA_INSTR("RECRUITER READ ONLY."),
    tags: ["intro", "universal"],
    required: true,
  },
  {
    id: "gender",
    section: "Demographics",
    text: "Record gender.",
    type: "single",
    options: [
      "Male",
      "Female",
      "Non-binary",
      "Gender non-conforming",
      "Gender fluid",
      "Prefer to self-identify",
      "Prefer not to answer",
    ],
    tags: ["demographics", "gender", "quota", "universal"],
    required: true,
  },
  {
    id: "research_participation",
    section: "Disqualification",
    text: "Have you ever participated in a market research discussion group or individual interview?",
    type: "single",
    options: ["Yes", "No"],
    instructions: MAGENTA_INSTR(
      "IF YES: How long ago? (Within past 3 months = TERMINATE; >4 sessions in past year = TERMINATE)"
    ),
    tags: ["experience", "dq", "universal"],
    required: true,
  },
  {
    id: "industry_exclusions",
    section: "Disqualification",
    text:
      "Do you or does anyone in your family currently work for or have ever worked for any of the following? (READ LIST)",
    type: "multi",
    options: [
      "Market research firm",
      "A marketing or research department of a company (including in-store sampling firms/promotional agencies, etc.)",
      "Advertising agency",
      "Public relations firm",
      "A media company such as radio, newspaper, TV, magazine, etc.",
      "A graphic or packaging design firm",
      "Art or design-related fields such as art teachers, interior designers, architects, commercial photography, printing, etc.",
      "A company involved in the manufacturing, distribution, or sale of any products in this category",
    ],
    instructions: MAGENTA_INSTR("IF YES TO ANY: TERMINATE."),
    tags: ["dq", "industry", "universal"],
    required: true,
  },
  {
    id: "age",
    section: "Demographics",
    text: "What is your age? RECORD BELOW.",
    type: "open",
    tags: ["demographics", "age", "quota", "universal"],
    required: true,
  },
  {
    id: "hh_shopping_role",
    section: "Household",
    text: "How much of the household’s grocery shopping do you, yourself, do?",
    type: "single",
    options: ["All of it", "Half of it or more", "Less than half of it", "None of it"],
    instructions: MAGENTA_INSTR("IF 'Less than half' or 'None': TERMINATE."),
    tags: ["household", "shopping", "universal"],
    required: true,
  },
  {
    id: "brand_decider",
    section: "Household",
    text: "Which is most accurate about who decides what brands of {{categoryName}} to buy in your household?",
    type: "single",
    options: ["I am the primary decision maker", "I am a joint decision maker", "I am not involved"],
    instructions: MAGENTA_INSTR("IF 'Not involved': TERMINATE."),
    tags: ["household", "decision", "universal"],
  },
  {
    id: "category_usage",
    section: "Category",
    text:
      "Which, if any, of the following types of {{categoryName}} have you purchased and personally used in the past [timeframe]? (READ LIST.)",
    type: "multi",
    options: ["[Study-specific category list]"],
    instructions: MAGENTA_INSTR("IF 'None of the above': TERMINATE."),
    tags: ["category", "usage", "universal"],
  },
  {
    id: "brand_grid",
    section: "Brands",
    text:
      "Thinking about {{categoryName}} brands: Which are you AWARE of? Which have you PURCHASED in the past [timeframe]? Which ONE do you purchase MOST OFTEN? Which would you NOT CONSIDER in the future?",
    type: "open",
    instructions: MAGENTA_INSTR("Use brand grid (Aware / P[timeframe] / Most Often / Would Not Consider)."),
    tags: ["brands", "grid", "universal"],
  },
  {
    id: "articulation",
    section: "Articulation",
    text:
      "Imagine it is the year 2050. What would grocery stores be like? How would they be different from the ones you see today? How might shopping be any different?",
    type: "open",
    instructions: MAGENTA_INSTR(
      "SCREEN FOR QUALITY OF RESPONSE & INTEREST IN THE CATEGORY. RECRUIT THOSE WHO ARTICULATE FEELINGS AND OPINIONS; DO NOT RECRUIT THOSE WHO ARE RELUCTANT OR TIMID."
    ),
    tags: ["articulation", "universal"],
  },
  {
    id: "marital_status",
    section: "Demographics",
    text: "What is your current marital status?",
    type: "single",
    options: ["Married or living with someone", "Single", "Divorced or separated", "Widowed"],
    tags: ["demographics", "marital", "universal"],
  },
  {
    id: "children_hh",
    section: "Household",
    text: "Do you have any children under the age of 18 currently living in your household?",
    type: "single",
    options: ["Yes", "No"],
    tags: ["household", "children", "universal"],
  },
  {
    id: "ethnicity",
    section: "Demographics",
    text: "Which of the following best describes your ethnicity?",
    type: "single",
    options: [
      "Caucasian/White",
      "African American / Black",
      "Asian/Pacific Islander",
      "Hispanic/Latino",
      "Other",
      "Prefer not to answer",
    ],
    tags: ["demographics", "ethnicity", "quota", "universal"],
  },
  {
    id: "education",
    section: "Demographics",
    text: "What is the last level of education that you completed?",
    type: "single",
    options: [
      "Some High School or less",
      "Completed High School",
      "Some College or Technical School",
      "Completed College/Technical School",
      "Some Post-Graduate Study or more",
    ],
    instructions: MAGENTA_INSTR("Often: TERMINATE if 'Some High School or less' unless study specifies otherwise."),
    tags: ["demographics", "education", "universal"],
  },
  {
    id: "employment_status",
    section: "Demographics",
    text: "What is your current employment status?",
    type: "multi",
    options: [
      "Employed Full-Time",
      "Employed Part-Time",
      "Full-Time Homemaker",
      "Part or Full-Time Student",
      "Retired",
      "Currently Seeking Employment",
    ],
    instructions: MAGENTA_INSTR("Often: TERMINATE if Currently Seeking Employment."),
    tags: ["demographics", "employment", "universal"],
  },
  {
    id: "occupation_checks",
    section: "Demographics",
    text:
      "ASK IF EMPLOYED: What is your occupation? In what kind of business? ASK IF MARRIED: Spouse’s occupation/business? ASK ALL: Previous occupation/business?",
    type: "open",
    instructions: MAGENTA_INSTR(
      "CHECK AGAINST INDUSTRY EXCLUSIONS. TERMINATE if related to MR/Advertising/PR/Media/Design/etc."
    ),
    tags: ["demographics", "employment", "universal"],
  },
  {
    id: "income",
    section: "Demographics",
    text: "What is your total annual household income?",
    type: "single",
    options: [
      "Less than $30,000",
      "$30,000 - $44,999",
      "$45,000 - $59,999",
      "$60,000 - $74,999",
      "$75,000 - $99,999",
      "$100,000 or more",
    ],
    instructions: MAGENTA_INSTR("Threshold varies by study; apply study-specific termination."),
    tags: ["demographics", "income", "quota", "universal"],
  },
  {
    id: "vision_colorblind",
    section: "Logistics",
    text:
      "During the discussion you will be asked to visually evaluate some concepts. Are you colorblind or do you have any eyesight or reading problems that would prevent you from being able to do this?",
    type: "single",
    options: ["Yes", "No"],
    instructions: MAGENTA_INSTR("IF YES: TERMINATE."),
    tags: ["logistics", "vision", "universal"],
  },
  {
    id: "invitation",
    section: "Invitation",
    text:
      "IF QUALIFIED: You are eligible to participate in a market research discussion on consumer products. This is not an attempt to sell you anything. The discussion will last about [X] minutes and for your time you will receive $______. May we count on your attendance?",
    type: "single",
    options: ["Yes", "No"],
    tags: ["invitation", "universal"],
  },
  {
    id: "rcda",
    section: "Consent",
    text:
      "Respondent Confidentiality Disclosure Agreement (RCDA) — confidentiality, photo/video release, IP, data privacy, limitation of liability.",
    type: "open",
    instructions: MAGENTA_INSTR("Use standard Behaviorally RCDA text (in-person: onsite; online: emailed/e-signed)."),
    tags: ["consent", "rcda", "universal"],
  },
];

// ----- Conditional Blocks -----

// ShopperLab MET (mobile eye-tracking) block
export const shopperLabMETBlock: Question[] = [
  {
    id: "met_ok",
    section: "ShopperLab / MET",
    text:
      "During the interview you will be asked to wear a set of non-prescription eyeglasses (mobile eye-tracking). Is this OK?",
    type: "single",
    options: ["Yes", "No"],
    instructions: MAGENTA_INSTR("IF NO: TERMINATE."),
    tags: ["shopperlab", "met", "dq"],
    required: true,
  },
  {
    id: "met_vision_devices",
    section: "ShopperLab / MET",
    text:
      "Which of the following do you ever wear while shopping in a grocery store? (READ LIST.)",
    type: "single",
    options: [
      "Only glasses or reading glasses",
      "Only contact lenses",
      "Either glasses or contact lenses",
      "Neither glasses nor contact lenses",
    ],
    instructions: MAGENTA_INSTR(
      "IF 'Only glasses/reading glasses': TERMINATE. If 'Only contacts' or 'Either': ask respondent to wear NON-COLORED contacts on study day."
    ),
    tags: ["shopperlab", "met", "dq"],
  },
  {
    id: "met_four_feet",
    section: "ShopperLab / MET",
    text: "Do you have issues seeing objects from 4 feet away?",
    type: "single",
    options: ["Yes", "No"],
    instructions: MAGENTA_INSTR("IF YES: TERMINATE."),
    tags: ["shopperlab", "met", "dq"],
  },
  {
    id: "met_eye_conditions",
    section: "ShopperLab / MET",
    text:
      "Do you have any eyesight problems (e.g., current/reoccurring eye injuries, colorblindness, pink eye, astigmatism, strabismus, etc.)?",
    type: "single",
    options: ["Yes", "No"],
    instructions: MAGENTA_INSTR("IF YES: TERMINATE."),
    tags: ["shopperlab", "met", "dq"],
  },
  {
    id: "met_mobility",
    section: "ShopperLab / MET",
    text:
      "Do you currently use a wheelchair, motorized scooter, walker, or any other type of walking assistance device while shopping?",
    type: "single",
    options: ["Yes", "No"],
    instructions: MAGENTA_INSTR("IF YES: TERMINATE."),
    tags: ["shopperlab", "met", "dq"],
  },
  {
    id: "met_rubber_allergy",
    section: "ShopperLab / MET",
    text: "Are you allergic to rubber?",
    type: "single",
    options: ["Yes", "No"],
    instructions: MAGENTA_INSTR("IF YES: TERMINATE."),
    tags: ["shopperlab", "met", "dq"],
  },
  {
    id: "met_recruiter_read",
    section: "ShopperLab / MET",
    text:
      "RECRUITER READ: Please refrain from eye makeup and colored contacts on the day of research (no tinted/colored contacts, eye shadow, liner, mascara, eyelash extensions).",
    type: "open",
    instructions: MAGENTA_INSTR("RECRUITER READ ONLY."),
    tags: ["shopperlab", "met"],
  },
];

// Online tech-check block
export const onlineTechCheckBlock: Question[] = [
  {
    id: "tech_devices",
    section: "Online / Tech",
    text:
      "Which devices do you own and use regularly? (Smartphone; Tablet; Laptop with webcam and mouse; Desktop with webcam and mouse; Smart Watch)",
    type: "multi",
    instructions: MAGENTA_INSTR("ALL RESPONDENTS MUST HAVE A LAPTOP OR DESKTOP WITH WEBCAM."),
    tags: ["online", "tech", "dq"],
  },
  {
    id: "tech_comfort",
    section: "Online / Tech",
    text:
      "Which best describes your comfort using a computer or laptop?",
    type: "single",
    options: [
      "Very comfortable — typically use one daily",
      "Somewhat comfortable — use a few times a week",
      "Not comfortable — rarely use one",
    ],
    instructions: MAGENTA_INSTR("TERMINATE if not 'Very comfortable'."),
    tags: ["online", "tech", "dq"],
  },
  {
    id: "tech_rules",
    section: "Online / Tech",
    text:
      "RECRUITER READ: You are required to join from your laptop or desktop computer (no phones/tablets). Join 15 minutes early for tech checks. Stay on camera; avoid multitasking.",
    type: "open",
    instructions: MAGENTA_INSTR("RECRUITER READ ONLY."),
    tags: ["online", "tech"],
  },
];

// External facility – arrival reminder (kept minimal; vision check is already universal)
export const externalFacilityBlock: Question[] = [
  {
    id: "arrival_reminder",
    section: "Facility",
    text:
      "As a courtesy to other participants, please arrive 15 minutes early so we can begin on time.",
    type: "open",
    instructions: MAGENTA_INSTR("RECRUITER READ ONLY."),
    tags: ["facility", "logistics"],
  },
];

// Factory to assemble the full standard list based on setup
export function buildStandardQuestions(mode: Mode): Question[] {
  const base = [...universalStandardQuestions];

  if (mode === "inperson_shopperlab") {
    base.splice(1, 0, ...shopperLabMETBlock); // insert MET early, after intro
  } else if (mode === "online") {
    base.splice(1, 0, ...onlineTechCheckBlock);
  } else if (mode === "inperson_external") {
    base.splice(1, 0, ...externalFacilityBlock);
  }

  return base;
}
