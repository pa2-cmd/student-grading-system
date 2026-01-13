export type SkillRating = 'Good' | 'Average' | 'Needs Improvement';
export type SkillValue = 2 | 1 | 0;

// Default subjects available for selection
export const DEFAULT_SUBJECTS = [
  'Speaking & Listening Skills',
  'Writing Skills',
  'Vocabulary',
  'Grammar Usage',
  'Reading Comprehension',
  'Mathematics',
  'Science',
  'Social Studies',
  'Art & Craft',
  'Physical Education',
  'Music',
  'Computer Science',
] as const;

export interface Student {
  id: string;
  serialNo: number;
  name: string;
  rollNumber: string;
  // Dynamic subject ratings - key is subject name, value is rating
  subjectRatings: Record<string, SkillRating>;
  total: number;
  remark: string;
  isGeneratingRemark: boolean;
}

export interface AssessmentData {
  schoolName: string;
  className: string;
  totalStrength: number;
  students: Student[];
  language: 'english' | 'hindi';
  // Selected subjects for the assessment (ordered)
  selectedSubjects: string[];
}

export const SKILL_VALUES: Record<SkillRating, SkillValue> = {
  'Good': 2,
  'Average': 1,
  'Needs Improvement': 0,
};

export const SKILL_OPTIONS: SkillRating[] = ['Good', 'Average', 'Needs Improvement'];

export function calculateTotal(subjectRatings: Record<string, SkillRating>): number {
  return Object.values(subjectRatings).reduce((sum, rating) => sum + SKILL_VALUES[rating], 0);
}

export function createEmptyStudent(serialNo: number, selectedSubjects: string[]): Student {
  const subjectRatings: Record<string, SkillRating> = {};
  selectedSubjects.forEach(subject => {
    subjectRatings[subject] = 'Good';
  });
  
  return {
    id: crypto.randomUUID(),
    serialNo,
    name: '',
    rollNumber: '',
    subjectRatings,
    total: selectedSubjects.length * 2, // All "Good" = 2 points each
    remark: '',
    isGeneratingRemark: false,
  };
}

export function getDefaultAssessmentData(): AssessmentData {
  const defaultSubjects = [
    'Speaking & Listening Skills',
    'Writing Skills',
    'Vocabulary',
    'Grammar Usage',
    'Reading Comprehension',
  ];
  
  return {
    schoolName: 'Cambridge Court High School',
    className: '',
    totalStrength: 0,
    students: [createEmptyStudent(1, defaultSubjects)],
    language: 'english',
    selectedSubjects: defaultSubjects,
  };
}
