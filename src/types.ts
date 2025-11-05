export type Mode =
  | "online"
  | "inperson_external"
  | "inperson_shopperlab";

export interface StudySetup {
  mode: Mode;
  moderator: string;
  dates: string;
  locationOrPlatform: string;
  categoryName: string;
  notes?: string;
}

export type QuestionType = "single" | "multi" | "open";

export interface Question {
  id: string;              // internal unique key (for React/state)
  idLabel?: string;        // human-readable screener code, e.g. S_Gender, C_Custom1
  section: string;
  text: string;
  type: QuestionType;
  options?: string[];
  instructions?: string;
  tags?: string[];
  required?: boolean;
  showIf?: (setup: StudySetup) => boolean;
}
