export type Mode = "online" | "inperson_external" | "inperson_shopperlab";

export interface StudySetup {
  mode: Mode;
  moderator: string;
  dates: string;
  locationOrPlatform: string;
  categoryName: string;
  notes?: string;
}

export type QuestionType = "single" | "multi" | "open";

export interface OptionItem {
  text: string;
  qualifies?: boolean;   // shows magenta * in UI/export
  terminate?: boolean;   // selecting this ends screener
  skipToIdLabel?: string; // jump to this code if selected
}

export interface Question {
  id: string;           // internal key
  idLabel?: string;     // e.g., S_Gender, C_MyCode
  section: string;      // kept for grouping, not shown in editor
  text: string;
  type: QuestionType;
  options?: Array<OptionItem> | string[]; // backward compatible
  instructions?: string;
  tags?: string[];
  required?: boolean;
  showIf?: (setup: StudySetup) => boolean;
}
