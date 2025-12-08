// ============================================
// TYPES FOR COMPLETE STUDENT GRADING SYSTEM
// ============================================

export type SkillRating = 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';
export type SkillValue = 4 | 3 | 2 | 1;
export type MoodRating = 'excellent' | 'good' | 'neutral' | 'needs-support';
export type Language = 'english' | 'hindi' | 'marathi' | 'tamil' | 'telugu' | 'bengali' | 'gujarati';

// Subject available for selection
export const DEFAULT_SUBJECTS = [
  'English',
  'Hindi',
  'Mathematics',
  'Science',
  'Social Studies',
  'Computer Science',
  'Art & Craft',
  'Physical Education',
  'Music',
  'Speaking & Listening',
  'Writing Skills',
  'Vocabulary',
  'Grammar',
  'Reading Comprehension',
  'Environmental Studies',
  'General Knowledge',
] as const;

// Learning skills that can be assessed
export const LEARNING_SKILLS = [
  'Creativity',
  'Teamwork',
  'Discipline',
  'Focus',
  'Problem Solving',
  'Communication',
  'Leadership',
  'Time Management',
] as const;

export const SKILL_VALUES: Record<SkillRating, SkillValue> = {
  'Excellent': 4,
  'Good': 3,
  'Average': 2,
  'Needs Improvement': 1,
};

export const SKILL_OPTIONS: SkillRating[] = ['Excellent', 'Good', 'Average', 'Needs Improvement'];

export const MOOD_EMOJIS: Record<MoodRating, string> = {
  'excellent': '😊',
  'good': '🙂',
  'neutral': '😐',
  'needs-support': '🙁',
};

export const LANGUAGES: { value: Language; label: string; nativeLabel: string }[] = [
  { value: 'english', label: 'English', nativeLabel: 'English' },
  { value: 'hindi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { value: 'marathi', label: 'Marathi', nativeLabel: 'मराठी' },
  { value: 'tamil', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { value: 'telugu', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { value: 'bengali', label: 'Bengali', nativeLabel: 'বাংলা' },
  { value: 'gujarati', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
];

// Student data structure
export interface Student {
  id: string;
  serialNo: number; // Primary identifier from Excel (not editable)
  enrollmentNumber: string; // Unique student ID for reports (editable)
  name: string;
  rollNumber: string;
  photo?: string; // Base64 or URL
  
  // Subject marks (percentage or grade)
  subjectMarks: Record<string, number>; // 0-100
  subjectRatings: Record<string, SkillRating>;
  
  // Attendance
  attendancePresent: number;
  attendanceTotal: number;
  attendancePercentage: number;
  
  // Behavior & Learning Skills
  behaviorNotes: string;
  learningSkills: Record<string, SkillRating>;
  moodRating: MoodRating;
  
  // Generated content
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
  remark: string;
  teacherNotes: string; // Custom notes from teacher
  
  // State
  isGeneratingRemark: boolean;
  total: number;
  percentage: number;
}

// Comment library item
export interface SavedComment {
  id: string;
  text: string;
  category: 'strength' | 'improvement' | 'general' | 'encouragement';
  usageCount: number;
  createdAt: string;
}

// School branding settings
export interface SchoolBranding {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  principalName: string;
  principalSignature: string; // Base64
  teacherSignature: string; // Base64
  address: string;
  contactNumber: string;
  email: string;
  website: string;
}

// Report settings
export interface ReportSettings {
  showEmoji: boolean;
  showAttendance: boolean;
  showBehavior: boolean;
  showLearningSkills: boolean;
  showPhoto: boolean;
  showSignatures: boolean;
  showStrengthsWeaknesses: boolean;
  showNextSteps: boolean;
}

// Main assessment data
export interface AssessmentData {
  schoolName: string;
  className: string;
  section: string;
  academicYear: string;
  term: string;
  totalStrength: number;
  students: Student[];
  language: Language;
  selectedSubjects: string[];
  
  // Enhanced features
  commentLibrary: SavedComment[];
  branding: SchoolBranding;
  reportSettings: ReportSettings;
}

// Analytics data
export interface ClassAnalytics {
  classAverage: number;
  subjectAverages: Record<string, number>;
  topPerformers: { name: string; percentage: number }[];
  needsHelp: { name: string; percentage: number }[];
  attendanceAverage: number;
  gradeDistribution: { grade: string; count: number }[];
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function calculateTotal(subjectRatings: Record<string, SkillRating>): number {
  if (!subjectRatings || Object.keys(subjectRatings).length === 0) return 0;
  return Object.values(subjectRatings).reduce((sum, rating) => {
    return sum + (SKILL_VALUES[rating] || 0);
  }, 0);
}

export function calculatePercentage(subjectMarks: Record<string, number>): number {
  const marks = Object.values(subjectMarks).filter(m => m !== undefined && m !== null);
  if (marks.length === 0) return 0;
  return Math.round(marks.reduce((sum, m) => sum + m, 0) / marks.length);
}

export function getGradeFromPercentage(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

export function getMoodFromPerformance(percentage: number): MoodRating {
  if (percentage >= 80) return 'excellent';
  if (percentage >= 60) return 'good';
  if (percentage >= 40) return 'neutral';
  return 'needs-support';
}

export function createEmptyStudent(serialNo: number, selectedSubjects: string[]): Student {
  const subjectRatings: Record<string, SkillRating> = {};
  const subjectMarks: Record<string, number> = {};
  const learningSkills: Record<string, SkillRating> = {};
  
  selectedSubjects.forEach(subject => {
    subjectRatings[subject] = 'Good';
    subjectMarks[subject] = 75;
  });
  
  LEARNING_SKILLS.forEach(skill => {
    learningSkills[skill] = 'Good';
  });
  
  // Auto-generate enrollment number if not provided (format: ENR-001)
  const enrollmentNumber = `ENR-${String(serialNo).padStart(3, '0')}`;
  
  return {
    id: crypto.randomUUID(),
    serialNo,
    enrollmentNumber,
    name: '',
    rollNumber: '',
    photo: '',
    subjectMarks,
    subjectRatings,
    attendancePresent: 0,
    attendanceTotal: 0,
    attendancePercentage: 0,
    behaviorNotes: '',
    learningSkills,
    moodRating: 'good',
    strengths: [],
    improvements: [],
    nextSteps: [],
    remark: '',
    teacherNotes: '',
    isGeneratingRemark: false,
    total: selectedSubjects.length * 3,
    percentage: 75,
  };
}

export function getDefaultBranding(): SchoolBranding {
  return {
    logoUrl: '',
    primaryColor: '#2962ff',
    secondaryColor: '#1e3a5f',
    principalName: '',
    principalSignature: '',
    teacherSignature: '',
    address: '',
    contactNumber: '',
    email: '',
    website: '',
  };
}

export function getDefaultReportSettings(): ReportSettings {
  return {
    showEmoji: true,
    showAttendance: true,
    showBehavior: true,
    showLearningSkills: true,
    showPhoto: false,
    showSignatures: true,
    showStrengthsWeaknesses: true,
    showNextSteps: true,
  };
}

// Comment tone options for report generation
export type CommentTone = 'encouraging' | 'formal' | 'warm' | 'strict' | 'balanced';

export const COMMENT_TONES: { value: CommentTone; label: string; description: string }[] = [
  { value: 'encouraging', label: 'Encouraging', description: 'Positive and motivating feedback' },
  { value: 'formal', label: 'Formal', description: 'Professional and structured remarks' },
  { value: 'warm', label: 'Warm', description: 'Friendly and caring tone' },
  { value: 'strict', label: 'Strict', description: 'Direct and improvement-focused' },
  { value: 'balanced', label: 'Balanced', description: 'Mix of praise and constructive feedback' },
];

export function getDefaultAssessmentData(): AssessmentData {
  const defaultSubjects = ['English', 'Hindi', 'Mathematics', 'Science', 'Social Studies'];
  
  return {
    schoolName: '',
    className: '',
    section: '',
    academicYear: `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`,
    term: 'Term 1',
    totalStrength: 0,
    students: [createEmptyStudent(1, defaultSubjects)],
    language: 'english',
    selectedSubjects: defaultSubjects,
    commentLibrary: [],
    branding: getDefaultBranding(),
    reportSettings: getDefaultReportSettings(),
  };
}

// Calculate class analytics
export function calculateClassAnalytics(students: Student[], selectedSubjects: string[]): ClassAnalytics {
  const validStudents = students.filter(s => s.name.trim());
  
  if (validStudents.length === 0) {
    return {
      classAverage: 0,
      subjectAverages: {},
      topPerformers: [],
      needsHelp: [],
      attendanceAverage: 0,
      gradeDistribution: [],
    };
  }
  
  // Class average
  const classAverage = Math.round(
    validStudents.reduce((sum, s) => sum + s.percentage, 0) / validStudents.length
  );
  
  // Subject averages
  const subjectAverages: Record<string, number> = {};
  selectedSubjects.forEach(subject => {
    const marks = validStudents.map(s => s.subjectMarks[subject] || 0);
    subjectAverages[subject] = Math.round(marks.reduce((a, b) => a + b, 0) / marks.length);
  });
  
  // Sort by percentage
  const sorted = [...validStudents].sort((a, b) => b.percentage - a.percentage);
  
  // Top 5 performers
  const topPerformers = sorted.slice(0, 5).map(s => ({
    name: s.name,
    percentage: s.percentage,
  }));
  
  // Bottom 5 needing help
  const needsHelp = sorted.slice(-5).reverse().map(s => ({
    name: s.name,
    percentage: s.percentage,
  }));
  
  // Attendance average
  const attendanceAverage = Math.round(
    validStudents.reduce((sum, s) => sum + s.attendancePercentage, 0) / validStudents.length
  );
  
  // Grade distribution
  const grades: Record<string, number> = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
  validStudents.forEach(s => {
    const grade = getGradeFromPercentage(s.percentage);
    grades[grade]++;
  });
  const gradeDistribution = Object.entries(grades).map(([grade, count]) => ({ grade, count }));
  
  return {
    classAverage,
    subjectAverages,
    topPerformers,
    needsHelp,
    attendanceAverage,
    gradeDistribution,
  };
}
