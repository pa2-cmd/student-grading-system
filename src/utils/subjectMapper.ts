/**
 * =============================================================
 * SUBJECT NAME STANDARDIZATION & MAPPING
 * =============================================================
 * 
 * Maps various Excel column names to standardized subject names
 * for consistent display across the application.
 */

export interface SubjectMapping {
  patterns: string[];
  displayName: string;
}

// Subject mappings - patterns are matched case-insensitively
export const SUBJECT_MAPPINGS: SubjectMapping[] = [
  // English
  {
    patterns: ['eng', 'english', 'english language', 'english lang', 'engl'],
    displayName: 'English',
  },
  // Hindi
  {
    patterns: ['hindi', 'hin', 'hnd'],
    displayName: 'Hindi',
  },
  // Mathematics
  {
    patterns: ['maths', 'math', 'mathematics', 'mth', 'arith', 'arithmetic'],
    displayName: 'Maths',
  },
  // Science
  {
    patterns: ['science', 'sci', 'sc', 'gen science', 'general science'],
    displayName: 'Science',
  },
  // Social Studies
  {
    patterns: ['sst', 'social studies', 'social science', 'ss', 's.st', 's st', 'social', 'soc studies'],
    displayName: 'SST',
  },
  // Computer
  {
    patterns: ['computer', 'comp', 'cs', 'computer science', 'it', 'information technology', 'comp sci'],
    displayName: 'Computer',
  },
  // General Knowledge
  {
    patterns: ['gk', 'g.k', 'g k', 'general knowledge', 'gen knowledge'],
    displayName: 'GK',
  },
  // Environmental Studies
  {
    patterns: ['evs', 'env', 'environmental', 'environmental studies', 'env studies', 'env. studies'],
    displayName: 'EVS',
  },
  // Sanskrit
  {
    patterns: ['sanskrit', 'sans', 'skt'],
    displayName: 'Sanskrit',
  },
  // Physics
  {
    patterns: ['physics', 'phy', 'phys'],
    displayName: 'Physics',
  },
  // Chemistry
  {
    patterns: ['chemistry', 'chem', 'che'],
    displayName: 'Chemistry',
  },
  // Biology
  {
    patterns: ['biology', 'bio', 'biol'],
    displayName: 'Biology',
  },
  // History
  {
    patterns: ['history', 'hist', 'his'],
    displayName: 'History',
  },
  // Geography
  {
    patterns: ['geography', 'geo', 'geog'],
    displayName: 'Geography',
  },
  // Civics
  {
    patterns: ['civics', 'civ', 'civic'],
    displayName: 'Civics',
  },
  // Art & Craft
  {
    patterns: ['art', 'craft', 'art & craft', 'art and craft', 'drawing', 'painting'],
    displayName: 'Art & Craft',
  },
  // Physical Education
  {
    patterns: ['pe', 'p.e', 'physical education', 'sports', 'games', 'phys ed'],
    displayName: 'Physical Education',
  },
  // Music
  {
    patterns: ['music', 'mus', 'vocal'],
    displayName: 'Music',
  },
  // Moral Science
  {
    patterns: ['moral', 'moral science', 'value', 'value education', 'value ed', 'ethics'],
    displayName: 'Moral Science',
  },
  // Economics
  {
    patterns: ['economics', 'eco', 'econ'],
    displayName: 'Economics',
  },
  // Commerce
  {
    patterns: ['commerce', 'comm', 'com'],
    displayName: 'Commerce',
  },
  // Accountancy
  {
    patterns: ['accountancy', 'accounts', 'acc', 'acct'],
    displayName: 'Accountancy',
  },
  // Business Studies
  {
    patterns: ['business', 'business studies', 'bs', 'bus studies'],
    displayName: 'Business Studies',
  },
  // French
  {
    patterns: ['french', 'fr', 'fra'],
    displayName: 'French',
  },
  // German
  {
    patterns: ['german', 'ger', 'deu'],
    displayName: 'German',
  },
  // Urdu
  {
    patterns: ['urdu', 'urd'],
    displayName: 'Urdu',
  },
];

/**
 * Normalize a string for comparison
 */
function normalize(str: string): string {
  return String(str || '').toLowerCase().trim().replace(/[.\-_]/g, '').replace(/\s+/g, ' ');
}

/**
 * Standardize a subject name from Excel to a clean display name
 * If no match is found, returns the original name (cleaned up)
 */
export function standardizeSubjectName(excelName: string): string {
  if (!excelName) return '';
  
  const normalized = normalize(excelName);
  
  // Check against all mappings
  for (const mapping of SUBJECT_MAPPINGS) {
    for (const pattern of mapping.patterns) {
      const normalizedPattern = normalize(pattern);
      
      // Exact match
      if (normalized === normalizedPattern) {
        return mapping.displayName;
      }
      
      // Starts with or ends with pattern
      if (normalized.startsWith(normalizedPattern) || 
          normalizedPattern.startsWith(normalized)) {
        return mapping.displayName;
      }
    }
  }
  
  // No match found - return cleaned up original
  // Capitalize first letter of each word
  return excelName
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Standardize multiple subject names
 */
export function standardizeSubjectNames(excelNames: string[]): string[] {
  return excelNames.map(name => standardizeSubjectName(name));
}

/**
 * Get all known standard subject names
 */
export function getStandardSubjectNames(): string[] {
  return SUBJECT_MAPPINGS.map(m => m.displayName);
}

/**
 * Check if a column name looks like a subject
 */
export function isLikelySubject(columnName: string): boolean {
  const normalized = normalize(columnName);
  
  // Check against known patterns
  for (const mapping of SUBJECT_MAPPINGS) {
    for (const pattern of mapping.patterns) {
      if (normalized.includes(normalize(pattern)) || 
          normalize(pattern).includes(normalized)) {
        return true;
      }
    }
  }
  
  return false;
}
