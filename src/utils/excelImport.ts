import * as XLSX from 'xlsx';
import { Student, SkillRating, SkillRatingOrUnselected, calculateTotal, SKILL_OPTIONS } from '@/types/assessment';

// ============================================================
// EXPECTED COLUMN HEADERS (STRICT MATCHING)
// ============================================================
const EXPECTED_HEADERS = [
  'S.No',
  'Roll No',
  'Student Name',
  'Speaking & Listening Skills',
  'Writing Skills',
  'Vocabulary',
  'Grammar Usage',
  'Reading Comprehension',
  'Total',
  'Remarks',
] as const;

// Required columns (must be present for valid import)
const REQUIRED_HEADERS = [
  'S.No',
  'Student Name',
] as const;

// Subject columns that map to skill ratings
const SUBJECT_HEADERS = [
  'Speaking & Listening Skills',
  'Writing Skills',
  'Vocabulary',
  'Grammar Usage',
  'Reading Comprehension',
] as const;

// ============================================================
// TYPES FOR IMPORT ANALYSIS
// ============================================================

export interface SheetAnalysisResult {
  success: boolean;
  headerRowIndex: number;
  dataStartRowIndex: number;
  columnMapping: Map<string, number>;
  detectedSubjects: string[];
  metadata: ExtractedMetadata;
  errors: string[];
  warnings: string[];
}

export interface ExtractedMetadata {
  schoolName?: string;
  className?: string;
  assessmentName?: string;
}

export interface ImportResult {
  success: boolean;
  students: Student[];
  metadata: ExtractedMetadata;
  detectedSubjects: string[];
  errors: string[];
  warnings: string[];
}

// ============================================================
// STEP 1: SHEET STRUCTURE ANALYSIS
// Scans the Excel sheet row-by-row to find the header row
// ============================================================

/**
 * Analyzes the Excel sheet structure to identify:
 * - The header row location (not always row 1)
 * - Column mapping for each expected header
 * - Metadata from rows above the header
 */
function analyzeSheetStructure(worksheet: XLSX.WorkSheet): SheetAnalysisResult {
  const result: SheetAnalysisResult = {
    success: false,
    headerRowIndex: -1,
    dataStartRowIndex: -1,
    columnMapping: new Map(),
    detectedSubjects: [],
    metadata: {},
    errors: [],
    warnings: [],
  };

  // Convert entire sheet to 2D array for analysis
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    defval: '',
    blankrows: true,
  }) as any[][];

  if (jsonData.length === 0) {
    result.errors.push('Excel file is empty');
    return result;
  }

  // --------------------------------------------------------
  // Scan row-by-row to find the header row
  // --------------------------------------------------------
  let headerRowIndex = -1;
  let columnMapping = new Map<string, number>();

  for (let rowIndex = 0; rowIndex < jsonData.length; rowIndex++) {
    const row = jsonData[rowIndex];
    const { isHeaderRow, mapping, matchedHeaders } = checkIfHeaderRow(row);

    if (isHeaderRow) {
      headerRowIndex = rowIndex;
      columnMapping = mapping;
      
      // Log detected subjects
      result.detectedSubjects = SUBJECT_HEADERS.filter(
        subject => mapping.has(subject)
      );
      
      // Check for any missing required headers
      const missingRequired = REQUIRED_HEADERS.filter(
        header => !mapping.has(header)
      );
      
      if (missingRequired.length > 0) {
        result.errors.push(
          `Missing required columns: ${missingRequired.join(', ')}`
        );
        return result;
      }

      // Warn about missing optional subject columns
      const missingSubjects = SUBJECT_HEADERS.filter(
        subject => !mapping.has(subject)
      );
      if (missingSubjects.length > 0) {
        result.warnings.push(
          `Some subject columns not found: ${missingSubjects.join(', ')}. ` +
          `These will show as unselected.`
        );
      }

      break;
    }
  }

  if (headerRowIndex === -1) {
    result.errors.push(
      'Could not find header row. Expected headers: ' +
      EXPECTED_HEADERS.slice(0, 5).join(', ') + '...'
    );
    return result;
  }

  // --------------------------------------------------------
  // STEP 2: Extract metadata from rows above header
  // --------------------------------------------------------
  result.metadata = extractMetadata(jsonData.slice(0, headerRowIndex));

  // --------------------------------------------------------
  // Set results
  // --------------------------------------------------------
  result.success = true;
  result.headerRowIndex = headerRowIndex;
  result.dataStartRowIndex = headerRowIndex + 1; // First row after header
  result.columnMapping = columnMapping;

  return result;
}

/**
 * Checks if a row matches the expected header pattern
 * Uses strict matching after trimming whitespace
 */
function checkIfHeaderRow(row: any[]): {
  isHeaderRow: boolean;
  mapping: Map<string, number>;
  matchedHeaders: string[];
} {
  const mapping = new Map<string, number>();
  const matchedHeaders: string[] = [];

  // Normalize and check each cell in the row
  for (let colIndex = 0; colIndex < row.length; colIndex++) {
    const cellValue = String(row[colIndex] || '').trim();
    
    // Check if this cell matches any expected header (exact match after trim)
    for (const expectedHeader of EXPECTED_HEADERS) {
      if (cellValue.toLowerCase() === expectedHeader.toLowerCase()) {
        mapping.set(expectedHeader, colIndex);
        matchedHeaders.push(expectedHeader);
        break;
      }
    }
  }

  // Consider it a header row if we find at least S.No and Student Name
  const hasRequiredHeaders = REQUIRED_HEADERS.every(
    header => mapping.has(header)
  );
  
  // Also require at least one subject column OR the header row must have most columns
  const hasEnoughColumns = matchedHeaders.length >= 3;

  return {
    isHeaderRow: hasRequiredHeaders && hasEnoughColumns,
    mapping,
    matchedHeaders,
  };
}

// ============================================================
// STEP 2: METADATA EXTRACTION
// Attempts to extract school name, class, etc. from rows above header
// ============================================================

/**
 * Extracts metadata from rows above the detected header row
 * Only extracts if labels are explicitly present
 */
function extractMetadata(metadataRows: any[][]): ExtractedMetadata {
  const metadata: ExtractedMetadata = {};

  for (const row of metadataRows) {
    // Join all non-empty cells to analyze the row content
    const rowText = row
      .filter(cell => cell !== null && cell !== undefined && cell !== '')
      .map(cell => String(cell).trim())
      .join(' ')
      .toLowerCase();

    // Skip empty rows
    if (!rowText) continue;

    // Look for school name patterns
    if (!metadata.schoolName) {
      // Check for explicit "school" label or common school name patterns
      if (rowText.includes('school') || rowText.includes('academy') || 
          rowText.includes('institute') || rowText.includes('college')) {
        // Get the first non-empty cell(s) as school name
        const schoolName = row
          .filter(cell => cell !== null && cell !== undefined && cell !== '')
          .map(cell => String(cell).trim())
          .join(' ')
          .trim();
        if (schoolName) {
          metadata.schoolName = schoolName;
        }
      }
    }

    // Look for class/section patterns
    if (!metadata.className) {
      const classMatch = rowText.match(/class[:\s]*([ivxlcdm\d]+[-\s]?[a-z]?)/i) ||
                        rowText.match(/grade[:\s]*(\d+[-\s]?[a-z]?)/i) ||
                        rowText.match(/section[:\s]*([a-z])/i);
      if (classMatch) {
        metadata.className = classMatch[1].trim().toUpperCase();
      }
    }

    // Look for assessment/term patterns
    if (!metadata.assessmentName) {
      const assessmentMatch = rowText.match(/(term|assessment|exam|test)[:\s]*([^\n,]+)/i) ||
                             rowText.match(/(unit|periodic|quarterly|half.?yearly|annual)[:\s]*(test|exam|assessment)?/i);
      if (assessmentMatch) {
        metadata.assessmentName = assessmentMatch[0].trim();
      }
    }
  }

  return metadata;
}

// ============================================================
// STEP 3: DATA IMPORT - MARKS IMPORT LOGIC (CRITICAL)
// Handles existing marks, blank values, and NA entries
// ============================================================

/**
 * Parses a skill rating value from Excel cell
 * 
 * CRITICAL RULES:
 * - If value EXISTS: Import exactly as-is (Good/Average/Needs Improvement)
 * - If value is BLANK or NA: Return undefined (unselected state)
 * - Never auto-fill blank values
 * - Never convert blank to zero or default
 */
function parseSkillRating(value: any): SkillRatingOrUnselected {
  // BLANK / NA values → undefined (unselected)
  if (value === null || value === undefined || value === '') return undefined;

  // Numbers must be preserved (0 is valid)
  if (typeof value === 'number' && !Number.isNaN(value)) {
    if (value >= 2) return 'Good';
    if (value === 1) return 'Average';
    if (value === 0) return 'Needs Improvement';
    return undefined;
  }

  const raw = String(value).trim();
  const stringValue = raw.toLowerCase();

  // Explicit NA/blank markers
  if (
    stringValue === 'na' ||
    stringValue === 'n/a' ||
    stringValue === '-' ||
    stringValue === 'blank' ||
    stringValue === 'nil'
  ) {
    return undefined;
  }

  // Handle exported format like "Good (2)" / "Average (1)" / "Needs Improvement (0)"
  // and other mixed text like "Good-2".
  const numInText = raw.match(/\b([0-2])\b/);
  if (numInText) {
    const n = Number(numInText[1]);
    if (n === 2) return 'Good';
    if (n === 1) return 'Average';
    if (n === 0) return 'Needs Improvement';
  }

  // Text categories (accept common synonyms; NEVER treat as empty)
  if (stringValue.includes('good') || stringValue.includes('strong')) return 'Good';
  if (stringValue.includes('average') || stringValue.includes('avg') || stringValue.includes('develop')) return 'Average';
  if (
    stringValue.includes('needs') ||
    stringValue.includes('improvement') ||
    stringValue.includes('poor') ||
    stringValue.includes('bad') ||
    stringValue.includes('weak')
  ) {
    return 'Needs Improvement';
  }

  // Pure numeric strings
  if (stringValue === '2') return 'Good';
  if (stringValue === '1') return 'Average';
  if (stringValue === '0') return 'Needs Improvement';

  // Unknown value → keep unselected (user can correct)
  return undefined;
}

/**
 * Imports student data from the Excel sheet using the analysis results
 */
function importStudentData(
  worksheet: XLSX.WorkSheet,
  analysis: SheetAnalysisResult
): ImportResult {
  const result: ImportResult = {
    success: false,
    students: [],
    metadata: analysis.metadata,
    detectedSubjects: analysis.detectedSubjects,
    errors: [],
    warnings: analysis.warnings,
  };

  if (!analysis.success) {
    result.errors = analysis.errors;
    return result;
  }

  // Convert sheet to array, starting from data rows
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    defval: '',
    blankrows: true,
  }) as any[][];

  const { columnMapping, dataStartRowIndex, detectedSubjects } = analysis;

  // --------------------------------------------------------
  // Process each data row (starting right after header)
  // --------------------------------------------------------
  for (let rowIndex = dataStartRowIndex; rowIndex < jsonData.length; rowIndex++) {
    const row = jsonData[rowIndex];

    // Check for empty row (end of data)
    const isEmptyRow = row.every(
      cell => cell === null || cell === undefined || String(cell).trim() === ''
    );
    if (isEmptyRow) {
      // Stop at first completely empty row
      break;
    }

    // Get S.No column value (preserve as-is from sheet)
    const sNoColIndex = columnMapping.get('S.No')!;
    const sNoValue = row[sNoColIndex];
    
    // Skip if S.No is empty (likely a formatting row)
    if (sNoValue === null || sNoValue === undefined || String(sNoValue).trim() === '') {
      continue;
    }

    // Get student name
    const nameColIndex = columnMapping.get('Student Name')!;
    const studentName = String(row[nameColIndex] || '').trim();

    // Skip if name is empty
    if (!studentName) {
      result.warnings.push(`Row ${rowIndex + 1}: Skipped row with empty student name`);
      continue;
    }

    // --------------------------------------------------------
    // STEP 4: Preserve S.No exactly as in sheet (0 is valid)
    // --------------------------------------------------------
    const parsedSerial = typeof sNoValue === 'number' ? sNoValue : Number(String(sNoValue).trim());
    const serialNo = Number.isNaN(parsedSerial)
      ? rowIndex - dataStartRowIndex + 1
      : parsedSerial;

    // --------------------------------------------------------
    // STEP 5: Strict column mapping for subject ratings
    // Import marks exactly as-is, preserve blanks as undefined
    // --------------------------------------------------------
    const subjectRatings: Record<string, SkillRatingOrUnselected> = {};

    for (const subject of detectedSubjects) {
      const colIndex = columnMapping.get(subject);
      if (colIndex !== undefined) {
        const cellValue = row[colIndex];
        // Parse value - blank/NA becomes undefined (unselected)
        subjectRatings[subject] = parseSkillRating(cellValue);
      } else {
        // Column not in sheet - default to undefined (unselected)
        subjectRatings[subject] = undefined;
      }
    }

    // Also check for subjects in the full list that might be in the sheet
    for (const subject of SUBJECT_HEADERS) {
      if (subjectRatings[subject] === undefined && columnMapping.has(subject)) {
        const colIndex = columnMapping.get(subject)!;
        subjectRatings[subject] = parseSkillRating(row[colIndex]);
      }
    }

    // Get existing remark if present (import full string as-is)
    const remarkColIndex = columnMapping.get('Remarks');
    const existingRemark = remarkColIndex !== undefined
      ? String(row[remarkColIndex] ?? '').trim()
      : '';

    // Roll No (if present) must be imported exactly; otherwise keep blank
    const rollNoColIndex = columnMapping.get('Roll No');
    const rollNumber = rollNoColIndex !== undefined
      ? String(row[rollNoColIndex] ?? '').trim()
      : '';

    // Create student object
    const student: Student = {
      id: crypto.randomUUID(),
      serialNo,
      name: studentName,
      rollNumber,
      subjectRatings,
      total: calculateTotal(subjectRatings),
      remark: existingRemark,
      isGeneratingRemark: false,
    };

    result.students.push(student);
  }

  if (result.students.length === 0) {
    result.errors.push('No valid student data found after header row');
    return result;
  }

  result.success = true;
  return result;
}

// ============================================================
// MAIN EXPORT FUNCTION
// ============================================================

/**
 * Imports students from an Excel file with intelligent structure analysis
 * 
 * Features:
 * - Automatically detects header row location (not always row 1)
 * - Extracts metadata from rows above header (school name, class, etc.)
 * - Strict column mapping (no guessing or alternate names)
 * - Preserves S.No exactly as in sheet
 * - Handles variable metadata rows, merged cells, empty rows
 * 
 * @param file - The Excel file to import
 * @returns Promise with import results including students, metadata, and any errors/warnings
 */
export async function importStudentsFromExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // STEP 1: Analyze sheet structure
        const analysis = analyzeSheetStructure(worksheet);

        if (!analysis.success) {
          resolve({
            success: false,
            students: [],
            metadata: {},
            detectedSubjects: [],
            errors: analysis.errors,
            warnings: analysis.warnings,
          });
          return;
        }

        // STEPS 2-5: Import student data using strict column mapping
        const importResult = importStudentData(worksheet, analysis);

        resolve(importResult);
      } catch (error) {
        resolve({
          success: false,
          students: [],
          metadata: {},
          detectedSubjects: [],
          errors: ['Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.'],
          warnings: [],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        students: [],
        metadata: {},
        detectedSubjects: [],
        errors: ['Failed to read the file'],
        warnings: [],
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

// ============================================================
// LEGACY SUPPORT: Simple import for basic Excel files
// (Kept for backward compatibility with simpler import scenarios)
// ============================================================

export interface ImportedStudent {
  name: string;
  rollNumber: string;
  className?: string;
}

/**
 * Creates Student objects from imported data
 * Used when converting simple import data to full Student objects
 */
export function createStudentsFromImport(
  importedStudents: ImportedStudent[],
  selectedSubjects: string[]
): Student[] {
  return importedStudents.map((imported, index) => {
    const subjectRatings: Record<string, SkillRating> = {};
    selectedSubjects.forEach(subject => {
      subjectRatings[subject] = 'Good';
    });

    return {
      id: crypto.randomUUID(),
      serialNo: index + 1,
      name: imported.name,
      rollNumber: imported.rollNumber,
      subjectRatings,
      total: calculateTotal(subjectRatings),
      remark: '',
      isGeneratingRemark: false,
    };
  });
}
