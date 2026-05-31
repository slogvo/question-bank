export type QuestionType = "multiple-choice" | "checkboxes" | "true-false" | "short-answer";

export interface Option {
  id: string;
  optionText: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  questionText: string;
  questionType: QuestionType;
  options: Option[];
  explanation: string;
  correctShortAnswer?: string;
}

export interface Lesson {
  id: string;
  name: string;
  description?: string;
  materialText?: string;
  questions: Question[];
}

export interface Chapter {
  id: string;
  name: string;
  description?: string;
  lessons: Lesson[];
  questions: Question[];
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  chapters: Chapter[];
  questions: Question[];
}
