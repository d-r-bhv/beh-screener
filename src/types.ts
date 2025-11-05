export type Mode =
  | "online"
  | "inperson_external"
  | "inperson_shopperlab";

export interface StudySetup {
  mode: Mode;
  moderator: string;
  dates: string;
  locationOrPlatform: string;
  categoryName: string; // <-- plug-in term that flows into templates
  notes?: string;
}

export type QuestionType = "single" | "multi" | "open";

export interface Question {
  id: string;
  section: string;
  text: string;
  type: QuestionType;
  options?: string[];
  instructions?: string;
  tags?: string[];
  required?: boolean;
  // Optional show-if logic driven by setup/specs
  showIf?: (setup: StudySetup) => boolean;
}
