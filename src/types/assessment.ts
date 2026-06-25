// Multi-Subject Assessment Tool
// Supports: English, Maths, Science, Social Science
// Skill ratings - undefined means "unselected" (blank/NA from Excel)
export type SkillRating = 'Good' | 'Average' | 'Needs Improvement' | 'NA';
export type SkillRatingOrUnselected = SkillRating | undefined;
export type SkillValue = 2 | 1 | 0;

// Subject Types
export type SubjectType = 'English' | 'Maths' | 'Science' | 'Social Science';

export const SUBJECTS: SubjectType[] = ['English', 'Maths', 'Science', 'Social Science'];

// ============================================================
// SUBJECT SKILL MATRICES
// ============================================================

export const ENGLISH_SKILLS = [
  'Speaking & Listening Skills',
  'Writing Skills',
  'Vocabulary',
  'Grammar Usage',
  'Reading Comprehension',
] as const;

export const MATHS_SKILLS = [
  'Conceptual Understanding',
  'Problem Solving Skills',
  'Calculation Accuracy',
  'Real Life Application',
  'Maths Vocabulary',
  'Data Handling',
  'Geometry Skills',
  'Algebra Skills',
] as const;

export const SCIENCE_SKILLS = [
  'Concept Clarity',
  'Science Vocabulary',
  'Observational Skills',
  'Inquiry Based Questioning',
  'Real Life Application',
  'Reasoning',
  'Innovative Ideas',
] as const;

export const SOCIAL_SCIENCE_SKILLS = [
  'Awareness Of Surrounding',
  'Concept Clarity',
  'Social Science Vocabulary',
  'Ability To Explain',
  'Inquiry Based Questioning',
  'Real Life Application',
  'Reasoning',
  'Map Skills',
] as const;

// Type aliases
export type EnglishSkill = typeof ENGLISH_SKILLS[number];
export type MathsSkill = typeof MATHS_SKILLS[number];
export type ScienceSkill = typeof SCIENCE_SKILLS[number];
export type SocialScienceSkill = typeof SOCIAL_SCIENCE_SKILLS[number];

// Get skills array for a subject
export function getSkillsForSubject(subject: SubjectType): readonly string[] {
  switch (subject) {
    case 'English':
      return ENGLISH_SKILLS;
    case 'Maths':
      return MATHS_SKILLS;
    case 'Science':
      return SCIENCE_SKILLS;
    case 'Social Science':
      return SOCIAL_SCIENCE_SKILLS;
    default:
      return ENGLISH_SKILLS;
  }
}

// Get display name for skill headers (shorter versions)
export function getSkillDisplayName(skill: string): string {
  const displayNames: Record<string, string> = {
    // English
    'Speaking & Listening Skills': 'Speaking & Listening',
    'Writing Skills': 'Writing',
    'Grammar Usage': 'Grammar',
    'Reading Comprehension': 'Reading',
    // Maths
    'Conceptual Understanding': 'Conceptual',
    'Problem Solving Skills': 'Problem Solving',
    'Calculation Accuracy': 'Calculation',
    'Real Life Application': 'Real Life App.',
    'Maths Vocabulary': 'Maths Vocab',
    'Data Handling': 'Data Handling',
    'Geometry Skills': 'Geometry',
    'Algebra Skills': 'Algebra',
    // Science
    'Concept Clarity': 'Concepts',
    'Science Vocabulary': 'Sci. Vocab',
    'Observational Skills': 'Observation',
    'Inquiry Based Questioning': 'Inquiry',
    'Innovative Ideas': 'Innovation',
    // Social Science
    'Awareness Of Surrounding': 'Awareness',
    'Social Science Vocabulary': 'SS Vocab',
    'Ability To Explain': 'Explanation',
    'Map Skills': 'Map Skills',
  };
  return displayNames[skill] || skill;
}

// ============================================================
// STUDENT & ASSESSMENT DATA TYPES
// ============================================================

export interface Student {
  id: string;
  serialNo: number;
  name: string;
  // Skill ratings - key is skill name, value is rating (undefined = unselected)
  subjectRatings: Record<string, SkillRatingOrUnselected>;
  total: number;
  remark: string;
  isGeneratingRemark: boolean;
}

export interface AssessmentData {
  schoolName: string;
  className: string;
  section: string;
  totalStrength: number;
  subject: SubjectType;
  students: Student[];
  language: 'english' | 'hindi';
}

export const SKILL_VALUES: Record<SkillRating, SkillValue> = {
  'Good': 2,
  'Average': 1,
  'Needs Improvement': 0,
  'NA': 0,
};

export const SKILL_OPTIONS: SkillRating[] = ['Good', 'Average', 'Needs Improvement', 'NA'];

// ============================================================
// CALCULATION FUNCTIONS
// ============================================================

/**
 * Calculates total from skill ratings
 * ONLY counts fields with valid ratings (ignores undefined/unselected)
 */
export function calculateTotal(subjectRatings: Record<string, SkillRatingOrUnselected>): number {
  return Object.values(subjectRatings).reduce((sum, rating) => {
    // Ignore blank/unselected fields and NA - they don't count toward total
    if (rating === undefined || rating === null || rating === 'NA') return sum;
    return sum + SKILL_VALUES[rating];
  }, 0);
}

/**
 * Gets the maximum possible score based on fields that have values
 * Only counts fields with actual ratings, not unselected ones or NA
 */
export function getMaxPossibleScore(subjectRatings: Record<string, SkillRatingOrUnselected>): number {
  return Object.values(subjectRatings).filter(rating => rating !== undefined && rating !== null && rating !== 'NA').length * 2;
}

/**
 * Creates a new empty student with default ratings for the given subject
 */
export function createEmptyStudent(serialNo: number, subject: SubjectType): Student {
  const skills = getSkillsForSubject(subject);
  const subjectRatings: Record<string, SkillRatingOrUnselected> = {};
  skills.forEach(skill => {
    subjectRatings[skill] = 'Good'; // Default to Good for manually added students
  });
  
  return {
    id: crypto.randomUUID(),
    serialNo,
    name: '',
    subjectRatings,
    total: skills.length * 2, // All "Good" = 2 points each
    remark: '',
    isGeneratingRemark: false,
  };
}

export function getDefaultAssessmentData(): AssessmentData {
  return {
    schoolName: '',
    className: '',
    section: '',
    totalStrength: 0,
    subject: 'English',
    students: [],
    language: 'english',
  };
}

// ============================================================
// CLASS PERFORMANCE STATISTICS
// ============================================================

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

export function calculateClassPerformance(students: Student[], subject: SubjectType): ClassPerformanceStats {
  const skills = getSkillsForSubject(subject);
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
  skills.forEach(skill => {
    skillTotals[skill] = { sum: 0, count: 0 };
  });

  let totalScoreSum = 0;
  let totalMaxSum = 0;
  let high = 0, avg = 0, low = 0;
  let activeStudentCount = 0;

  validStudents.forEach(student => {
    const maxScore = getMaxPossibleScore(student.subjectRatings);
    if (maxScore === 0) return; // Skip students with no assessed skills (e.g. all NA)

    activeStudentCount++;
    const percentage = (student.total / maxScore) * 100;

    if (percentage >= 80) high++;
    else if (percentage >= 55) avg++;
    else low++;

    totalScoreSum += student.total;
    totalMaxSum += maxScore;

    skills.forEach(skill => {
      const rating = student.subjectRatings[skill];
      if (rating !== undefined && rating !== 'NA') {
        skillTotals[skill].sum += SKILL_VALUES[rating];
        skillTotals[skill].count++;
      }
    });
  });

  const skillAverages: Record<string, number> = {};
  skills.forEach(skill => {
    const { sum, count } = skillTotals[skill];
    skillAverages[skill] = count > 0 ? (sum / count / 2) * 100 : 0; // Convert to percentage
  });

  return {
    skillAverages,
    overallAverage: totalMaxSum > 0 ? (totalScoreSum / totalMaxSum) * 100 : 0,
    totalStudents: activeStudentCount,
    distribution: { high, average: avg, low },
  };
}
