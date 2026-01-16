// English Assessment Tool - ONLY for English subject
// Skill ratings - undefined means "unselected" (blank/NA from Excel)
export type SkillRating = 'Good' | 'Average' | 'Needs Improvement';
export type SkillRatingOrUnselected = SkillRating | undefined;
export type SkillValue = 2 | 1 | 0;

// Fixed English assessment skills - NO OTHER SUBJECTS ALLOWED
export const ENGLISH_SKILLS = [
  'Speaking & Listening Skills',
  'Writing Skills',
  'Vocabulary',
  'Grammar Usage',
  'Reading Comprehension',
] as const;

export type EnglishSkill = typeof ENGLISH_SKILLS[number];

export interface Student {
  id: string;
  serialNo: number;
  name: string;
  rollNumber: string;
  // Skill ratings - key is skill name, value is rating (undefined = unselected)
  subjectRatings: Record<string, SkillRatingOrUnselected>;
  total: number;
  remark: string;
  isGeneratingRemark: boolean;
}

export interface AssessmentData {
  schoolName: string;
  className: string;
  section: string; // NEW: Section field
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

/**
 * Calculates total from skill ratings
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
 * Creates a new empty student with unselected ratings for English skills
 */
export function createEmptyStudent(serialNo: number): Student {
  const subjectRatings: Record<string, SkillRatingOrUnselected> = {};
  ENGLISH_SKILLS.forEach(skill => {
    subjectRatings[skill] = 'Good'; // Default to Good for manually added students
  });
  
  return {
    id: crypto.randomUUID(),
    serialNo,
    name: '',
    rollNumber: '',
    subjectRatings,
    total: ENGLISH_SKILLS.length * 2, // All "Good" = 2 points each
    remark: '',
    isGeneratingRemark: false,
  };
}

export function getDefaultAssessmentData(): AssessmentData {
  return {
    schoolName: 'Cambridge Court High School',
    className: '',
    section: '',
    totalStrength: 0,
    students: [createEmptyStudent(1)],
    language: 'english',
  };
}

/**
 * Calculate class performance statistics for English skills
 */
export interface ClassPerformanceStats {
  skillAverages: Record<string, number>;
  overallAverage: number;
  totalStudents: number;
  distribution: {
    high: number; // 80%+
    average: number; // 55-79%
    low: number; // <55%
  };
}

export function calculateClassPerformance(students: Student[]): ClassPerformanceStats {
  const validStudents = students.filter(s => s.name.trim());
  
  if (validStudents.length === 0) {
    return {
      skillAverages: {},
      overallAverage: 0,
      totalStudents: 0,
      distribution: { high: 0, average: 0, low: 0 },
    };
  }

  const skillTotals: Record<string, { sum: number; count: number }> = {};
  ENGLISH_SKILLS.forEach(skill => {
    skillTotals[skill] = { sum: 0, count: 0 };
  });

  let totalScoreSum = 0;
  let totalMaxSum = 0;
  let high = 0, avg = 0, low = 0;

  validStudents.forEach(student => {
    const maxScore = getMaxPossibleScore(student.subjectRatings);
    const percentage = maxScore > 0 ? (student.total / maxScore) * 100 : 0;

    if (percentage >= 80) high++;
    else if (percentage >= 55) avg++;
    else low++;

    totalScoreSum += student.total;
    totalMaxSum += maxScore;

    ENGLISH_SKILLS.forEach(skill => {
      const rating = student.subjectRatings[skill];
      if (rating !== undefined) {
        skillTotals[skill].sum += SKILL_VALUES[rating];
        skillTotals[skill].count++;
      }
    });
  });

  const skillAverages: Record<string, number> = {};
  ENGLISH_SKILLS.forEach(skill => {
    const { sum, count } = skillTotals[skill];
    skillAverages[skill] = count > 0 ? (sum / count / 2) * 100 : 0; // Convert to percentage
  });

  return {
    skillAverages,
    overallAverage: totalMaxSum > 0 ? (totalScoreSum / totalMaxSum) * 100 : 0,
    totalStudents: validStudents.length,
    distribution: { high, average: avg, low },
  };
}
