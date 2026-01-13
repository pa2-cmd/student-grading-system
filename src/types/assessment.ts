export type SkillRating = 'Good' | 'Average' | 'Needs Improvement';
export type SkillValue = 2 | 1 | 0;

export interface Student {
  id: string;
  serialNo: number | string | null; // Preserve exact S.No from import (can be any value)
  name: string;
  speakingListening: SkillRating;
  writing: SkillRating;
  vocabulary: SkillRating;
  grammar: SkillRating;
  reading: SkillRating;
  total: number;
  remark: string;
  isGeneratingRemark: boolean;
  importedTotal?: boolean;
  importedRemark?: boolean;
}

export interface AssessmentData {
  schoolName: string;
  className: string;
  totalStrength: number;
  students: Student[];
  language: 'english' | 'hindi';
}

export const SKILL_VALUES: Record<SkillRating, SkillValue> = {
  'Good': 2,
  'Average': 1,
  'Needs Improvement': 0,
};

export const SKILL_OPTIONS: SkillRating[] = ['Good', 'Average', 'Needs Improvement'];

export function calculateTotal(student: Omit<Student, 'total' | 'remark' | 'isGeneratingRemark' | 'id' | 'serialNo'>): number {
  return (
    SKILL_VALUES[student.speakingListening] +
    SKILL_VALUES[student.writing] +
    SKILL_VALUES[student.vocabulary] +
    SKILL_VALUES[student.grammar] +
    SKILL_VALUES[student.reading]
  );
}

export function createEmptyStudent(serialNo: number | string | null): Student {
  return {
    id: crypto.randomUUID(),
    serialNo,
    name: '',
    speakingListening: 'Good',
    writing: 'Good',
    vocabulary: 'Good',
    grammar: 'Good',
    reading: 'Good',
    total: 10,
    remark: '',
    isGeneratingRemark: false,
  };
}

export function getDefaultAssessmentData(): AssessmentData {
  return {
    schoolName: 'Cambridge Court High School',
    className: '',
    totalStrength: 0,
    students: [createEmptyStudent(1)],
    language: 'english',
  };
}
