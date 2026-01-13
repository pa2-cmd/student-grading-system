// Skill ratings - undefined means "unselected" (blank/NA from Excel)
export type SkillRating = 'Good' | 'Average' | 'Needs Improvement';
export type SkillRatingOrUnselected = SkillRating | undefined;
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
  // Dynamic subject ratings - key is subject name, value is rating (undefined = unselected)
  subjectRatings: Record<string, SkillRatingOrUnselected>;
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

/**
 * Calculates total from subject ratings
 * ONLY counts fields with valid ratings (ignores undefined/unselected)
 */
export function calculateTotal(subjectRatings: Record<string, SkillRatingOrUnselected>): number {
  return Object.values(subjectRatings).reduce((sum, rating) => {
    // Ignore blank/unselected fields - they don't count toward total
    if (rating === undefined || rating === null) return sum;
    return sum + SKILL_VALUES[rating];
  }, 0);
}

/**
 * Gets the maximum possible score based on fields that have values
 * Only counts fields with actual ratings, not unselected ones
 */
export function getMaxPossibleScore(subjectRatings: Record<string, SkillRatingOrUnselected>): number {
  return Object.values(subjectRatings).filter(rating => rating !== undefined && rating !== null).length * 2;
}

/**
 * Creates a new empty student with unselected ratings
 * New students default to undefined (unselected) state for manual entry
 */
export function createEmptyStudent(serialNo: number, selectedSubjects: string[]): Student {
  const subjectRatings: Record<string, SkillRatingOrUnselected> = {};
  selectedSubjects.forEach(subject => {
    subjectRatings[subject] = 'Good'; // Default to Good for manually added students
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
