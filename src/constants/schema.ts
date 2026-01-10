/**
 * =============================================================
 * MARKMASTER SCHEMA - EXACT HEADER DEFINITIONS
 * =============================================================
 * 
 * This file is the SINGLE SOURCE OF TRUTH for all column headers.
 * DO NOT modify these values without updating ALL dependent files.
 */

// Exact column headers in exact order from reference sheet
export const EXACT_HEADERS = [
  'Sr. No.',
  'Enrollment No.',
  'Name',
  'Father Name',
  'Mother Name',
  'DOB',
  'Gender',
  // Subject columns follow dynamically
] as const;

// Subject definitions with Theory (Th) + Oral (Or) groups
export const SUBJECT_DEFINITIONS = [
  { abbrev: 'Mths', full: 'Mathematics', theoryMax: 80, oralMax: 20, total: 100 },
  { abbrev: 'Eng', full: 'English', theoryMax: 80, oralMax: 20, total: 100 },
  { abbrev: 'Hin', full: 'Hindi', theoryMax: 80, oralMax: 20, total: 100 },
  { abbrev: 'Sc', full: 'Science', theoryMax: 80, oralMax: 20, total: 100 },
  { abbrev: 'Ssc', full: 'Social Studies', theoryMax: 80, oralMax: 20, total: 100 },
  { abbrev: 'Sans', full: 'Sanskrit', theoryMax: 80, oralMax: 20, total: 100 },
  { abbrev: 'Comp', full: 'Computer Science', theoryMax: 60, oralMax: 40, total: 100 },
  { abbrev: 'Fr', full: 'French', theoryMax: 80, oralMax: 20, total: 100 },
  // Single column subjects (Theory only)
  { abbrev: 'Draw', full: 'Drawing', theoryMax: 100, oralMax: 0, total: 100 },
  { abbrev: 'H&PE', full: 'Health & PE', theoryMax: 100, oralMax: 0, total: 100 },
  { abbrev: 'VDMATVS', full: 'Value Education', theoryMax: 100, oralMax: 0, total: 100 },
] as const;

// Final columns after subjects - exact order
export const FINAL_HEADERS = [
  'Max Grand Total',
  'Grand Total Obtained',
  '% Marks',
  'Remarks',
  'Grade',
  'Attendance',
] as const;

// Get subject header based on type
export function getSubjectHeaders(abbrev: string, theoryMax: number, oralMax: number): string[] {
  if (oralMax === 0) {
    // Single column subject
    return [`${abbrev} Th (${theoryMax})`];
  }
  // Grouped subject: Theory, Oral, Total
  return [
    `${abbrev} Th (${theoryMax})`,
    `${abbrev} Or (${oralMax})`,
    `Total of ${abbrev} 100`,
  ];
}

// Subject abbreviation mapping (bidirectional)
export const SUBJECT_ABBREV_TO_FULL: Record<string, string> = {
  'Mths': 'Mathematics',
  'Eng': 'English',
  'Hin': 'Hindi',
  'Sc': 'Science',
  'Ssc': 'Social Studies',
  'Sans': 'Sanskrit',
  'Comp': 'Computer Science',
  'Fr': 'French',
  'Draw': 'Drawing',
  'H&PE': 'Health & PE',
  'VDMATVS': 'Value Education',
};

export const SUBJECT_FULL_TO_ABBREV: Record<string, string> = Object.fromEntries(
  Object.entries(SUBJECT_ABBREV_TO_FULL).map(([k, v]) => [v, k])
);

// Check if a subject has grouped marks (Theory + Oral)
export function isGroupedSubject(abbrev: string): boolean {
  const def = SUBJECT_DEFINITIONS.find(s => s.abbrev === abbrev);
  return def ? def.oralMax > 0 : false;
}

// Get subject definition
export function getSubjectDefinition(abbrevOrFull: string) {
  return SUBJECT_DEFINITIONS.find(
    s => s.abbrev === abbrevOrFull || s.full === abbrevOrFull
  );
}
