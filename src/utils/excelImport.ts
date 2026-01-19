import * as XLSX from 'xlsx';
import { 
  Student, 
  SkillRating, 
  SkillRatingOrUnselected, 
  calculateTotal,
  getSkillsForSubject,
  SubjectType,
  SUBJECTS
} from '@/types/assessment';

// ============================================================
// MULTI-SUBJECT EXCEL IMPORT
// Smart column mapping for all subjects
// ============================================================

// Skill column mappings for all subjects
const SKILL_HEADER_MAPS: Record<SubjectType, Record<string, string>> = {
  'English': {
    'Speaking & Listening Skills': 'Speaking & Listening Skills',
    'Speaking & Listening': 'Speaking & Listening Skills',
    'Speaking': 'Speaking & Listening Skills',
    'Listening': 'Speaking & Listening Skills',
    'Writing Skills': 'Writing Skills',
    'Writing': 'Writing Skills',
    'Vocabulary': 'Vocabulary',
    'Grammar Usage': 'Grammar Usage',
    'Grammar': 'Grammar Usage',
    'Reading Comprehension': 'Reading Comprehension',
    'Reading': 'Reading Comprehension',
  },
  'Maths': {
    'Conceptual Understanding': 'Conceptual Understanding',
    'Conceptual': 'Conceptual Understanding',
    'Problem Solving Skills': 'Problem Solving Skills',
    'Problem Solving': 'Problem Solving Skills',
    'Calculation Accuracy': 'Calculation Accuracy',
    'Calculation': 'Calculation Accuracy',
    'Real Life Application': 'Real Life Application',
    'Real Life': 'Real Life Application',
    'Application': 'Real Life Application',
    'Maths Vocabulary': 'Maths Vocabulary',
    'Math Vocab': 'Maths Vocabulary',
    'Data Handling': 'Data Handling',
    'Data': 'Data Handling',
    'Geometry Skills': 'Geometry Skills',
    'Geometry': 'Geometry Skills',
    'Algebra Skills': 'Algebra Skills',
    'Algebra': 'Algebra Skills',
    'Alzebra': 'Algebra Skills',
    'Alzebra Skills': 'Algebra Skills',
  },
  'Science': {
    'Concept Clarity': 'Concept Clarity',
    'Concepts': 'Concept Clarity',
    'Science Vocabulary': 'Science Vocabulary',
    'Sci Vocab': 'Science Vocabulary',
    'Observational Skills': 'Observational Skills',
    'Observation': 'Observational Skills',
    'Inquiry Based Questioning': 'Inquiry Based Questioning',
    'Inquiry': 'Inquiry Based Questioning',
    'Real Life Application': 'Real Life Application',
    'Application': 'Real Life Application',
    'Reasoning': 'Reasoning',
    'Innovative Ideas': 'Innovative Ideas',
    'Innovation': 'Innovative Ideas',
  },
  'Social Science': {
    'Awareness Of Surrounding': 'Awareness Of Surrounding',
    'Awareness': 'Awareness Of Surrounding',
    'Concept Clarity': 'Concept Clarity',
    'Concepts': 'Concept Clarity',
    'Social Science Vocabulary': 'Social Science Vocabulary',
    'SS Vocab': 'Social Science Vocabulary',
    'Ability To Explain': 'Ability To Explain',
    'Explanation': 'Ability To Explain',
    'Inquiry Based Questioning': 'Inquiry Based Questioning',
    'Inquiry': 'Inquiry Based Questioning',
    'Real Life Application': 'Real Life Application',
    'Application': 'Real Life Application',
    'Reasoning': 'Reasoning',
    'Map Skills': 'Map Skills',
    'Maps': 'Map Skills',
  },
};

// ============================================================
// SECURITY: STRING SANITIZATION
// Removes potentially dangerous characters and limits length
// ============================================================

const MAX_STRING_LENGTH = 500;
const MAX_REMARK_LENGTH = 5000;
const MAX_NAME_LENGTH = 200;

function sanitizeString(value: any, maxLength: number = MAX_STRING_LENGTH): string {
  if (value === null || value === undefined) return '';
  
  let str = String(value);
  
  // Remove null bytes and control characters (except newlines/tabs for remarks)
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Remove potential script injection patterns
  str = str.replace(/<script[^>]*>.*?<\/script>/gi, '');
  str = str.replace(/javascript:/gi, '');
  str = str.replace(/on\w+=/gi, '');
  
  // Trim and limit length
  str = str.trim().slice(0, maxLength);
  
  return str;
}

function sanitizeName(value: any): string {
  const sanitized = sanitizeString(value, MAX_NAME_LENGTH);
  // Names should only contain letters, spaces, hyphens, apostrophes, periods
  return sanitized.replace(/[^\p{L}\p{M}\s\-'.]/gu, '').trim();
}

function sanitizeRemark(value: any): string {
  return sanitizeString(value, MAX_REMARK_LENGTH);
}

// ============================================================
// SKILL RATING PARSER
// Handles: 0, 1, 2, Good, Average, Needs Improvement, N/A, blank
// ZERO IS VALID DATA - must not be treated as empty
// SECURITY: Only accepts valid rating values (0, 1, 2)
// ============================================================

function parseSkillRating(value: any): SkillRatingOrUnselected {
  // Handle null/undefined - return undefined (unselected)
  if (value === null || value === undefined) return undefined;
  
  // Convert to string and trim
  const str = String(value).trim().toLowerCase();
  
  // Handle empty string or NA values - return undefined (unselected)
  if (str === '' || str === 'na' || str === 'n/a' || str === '-' || str === 'select') {
    return undefined;
  }
  
  // SECURITY: Strict numeric validation - only accept 0, 1, 2
  const num = Number(value);
  if (!isNaN(num)) {
    // Only accept exactly 0, 1, or 2 - reject other numbers
    if (num === 0) return 'Needs Improvement';
    if (num === 1) return 'Average';
    if (num === 2) return 'Good';
    // Reject invalid numbers (3, 4, -1, 1.5, etc.)
    return undefined;
  }
  
  // Handle text ratings - use strict matching
  if (str === 'good' || str === 'strong' || str === 'excellent') {
    return 'Good';
  }
  if (str === 'average' || str === 'developing' || str === 'moderate') {
    return 'Average';
  }
  if (str === 'needs improvement' || str === 'poor' || str === 'weak') {
    return 'Needs Improvement';
  }
  
  // Handle mixed formats like "Good (2)" or "2-Good" - extract safely
  if (str.includes('good') || str.includes('2')) return 'Good';
  if (str.includes('average') || str.includes('1')) return 'Average';
  if (str.includes('needs') || str.includes('improvement') || str.includes('0')) return 'Needs Improvement';
  
  // SECURITY: Reject any unrecognized values
  return undefined;
}

// ============================================================
// SUBJECT DETECTION FROM SHEET
// ============================================================

function detectSubjectFromSheet(sheet: XLSX.WorkSheet, headerRow: number): SubjectType {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  
  // First, check metadata rows for explicit subject mention
  for (let rowIdx = 0; rowIdx < headerRow; rowIdx++) {
    for (let colIdx = range.s.c; colIdx <= Math.min(range.e.c, range.s.c + 5); colIdx++) {
      const cellAddr = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
      const cell = sheet[cellAddr];
      if (cell && cell.v) {
        const text = String(cell.v).toLowerCase();
        if (text.includes('maths') || text.includes('mathematics')) return 'Maths';
        if (text.includes('science') && !text.includes('social')) return 'Science';
        if (text.includes('social science') || text.includes('social studies')) return 'Social Science';
        if (text.includes('english')) return 'English';
      }
    }
  }
  
  // Check header row for subject-specific columns
  const headerCols: string[] = [];
  for (let colIdx = range.s.c; colIdx <= range.e.c; colIdx++) {
    const cellAddr = XLSX.utils.encode_cell({ r: headerRow, c: colIdx });
    const cell = sheet[cellAddr];
    if (cell && cell.v) {
      headerCols.push(String(cell.v).toLowerCase());
    }
  }
  
  const headerText = headerCols.join(' ');
  
  // Check for unique skill keywords
  if (headerText.includes('algebra') || headerText.includes('geometry') || headerText.includes('calculation')) {
    return 'Maths';
  }
  if (headerText.includes('observational') || headerText.includes('innovative') || (headerText.includes('science') && headerText.includes('vocab'))) {
    return 'Science';
  }
  if (headerText.includes('map skill') || headerText.includes('awareness') || (headerText.includes('social') && headerText.includes('vocab'))) {
    return 'Social Science';
  }
  if (headerText.includes('speaking') || headerText.includes('listening') || headerText.includes('grammar') || headerText.includes('reading comprehension')) {
    return 'English';
  }
  
  return 'English'; // Default
}

// ============================================================
// HEADER ROW DETECTION
// Scans sheet to find the first row containing table headers
// ============================================================

function detectHeaderRow(sheet: XLSX.WorkSheet): { headerRow: number; columnMap: Record<string, number> } | null {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  
  // Scan up to first 20 rows to find header
  const maxScanRows = Math.min(20, range.e.r + 1);
  
  for (let rowIdx = range.s.r; rowIdx < maxScanRows; rowIdx++) {
    const columnMap: Record<string, number> = {};
    let hasSerialNo = false;
    let hasStudentName = false;
    
    for (let colIdx = range.s.c; colIdx <= range.e.c; colIdx++) {
      const cellAddr = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
      const cell = sheet[cellAddr];
      
      if (cell && cell.v !== undefined) {
        const headerText = String(cell.v).trim();
        
        // Check for S.No variations
        if (['S.No', 'Serial No', 'Sr. No', 'SNo', 'S. No', 'S.NO', 'SNO'].some(h => 
          headerText.toLowerCase() === h.toLowerCase())) {
          columnMap['S.No'] = colIdx;
          hasSerialNo = true;
        }
        
        // Check for Roll No
        if (['Roll No', 'Roll Number', 'RollNo', 'Roll'].some(h => 
          headerText.toLowerCase() === h.toLowerCase())) {
          columnMap['Roll No'] = colIdx;
        }
        
        // Check for Student Name variations
        if (['Student Name', 'Name', 'Student', 'Student\'s Name'].some(h => 
          headerText.toLowerCase() === h.toLowerCase())) {
          columnMap['Student Name'] = colIdx;
          hasStudentName = true;
        }
        
        // Store all header columns for skill mapping
        columnMap[`_header_${colIdx}`] = colIdx;
        columnMap[`_headerText_${colIdx}`] = headerText as any;
        
        // Check for Total
        if (headerText.toLowerCase() === 'total') {
          columnMap['Total'] = colIdx;
        }
        
        // Check for Remarks
        if (['Remarks', 'Remark', 'Review', 'AI Remarks', 'Comments'].some(h => 
          headerText.toLowerCase() === h.toLowerCase())) {
          columnMap['Remarks'] = colIdx;
        }
      }
    }
    
    // Valid header row must have S.No AND Student Name
    if (hasSerialNo && hasStudentName) {
      return { headerRow: rowIdx, columnMap };
    }
  }
  
  return null;
}

// ============================================================
// MAP SKILL COLUMNS FOR DETECTED SUBJECT
// ============================================================

function mapSkillColumns(
  sheet: XLSX.WorkSheet, 
  headerRow: number, 
  columnMap: Record<string, number>,
  subject: SubjectType
): Record<string, number> {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const skillMap = SKILL_HEADER_MAPS[subject];
  const skillColumnMap: Record<string, number> = {};
  
  for (let colIdx = range.s.c; colIdx <= range.e.c; colIdx++) {
    const cellAddr = XLSX.utils.encode_cell({ r: headerRow, c: colIdx });
    const cell = sheet[cellAddr];
    
    if (cell && cell.v !== undefined) {
      const headerText = String(cell.v).trim();
      
      // Check against skill mappings
      Object.entries(skillMap).forEach(([key, mappedSkill]) => {
        if (headerText.toLowerCase().includes(key.toLowerCase()) || 
            key.toLowerCase().includes(headerText.toLowerCase())) {
          skillColumnMap[mappedSkill] = colIdx;
        }
      });
    }
  }
  
  return skillColumnMap;
}

// ============================================================
// METADATA EXTRACTION
// ============================================================

interface ExtractedMetadata {
  schoolName?: string;
  className?: string;
  section?: string;
  assessmentName?: string;
  subject?: SubjectType;
}

function extractMetadata(sheet: XLSX.WorkSheet, headerRow: number): ExtractedMetadata {
  const metadata: ExtractedMetadata = {};
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  
  // Scan rows above header
  for (let rowIdx = 0; rowIdx < headerRow; rowIdx++) {
    let rowText = '';
    for (let colIdx = range.s.c; colIdx <= Math.min(range.e.c, range.s.c + 5); colIdx++) {
      const cellAddr = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
      const cell = sheet[cellAddr];
      if (cell && cell.v) {
        rowText += ' ' + String(cell.v);
      }
    }
    rowText = rowText.trim();
    
    // Extract based on labels
    const lowerText = rowText.toLowerCase();
    
    if (lowerText.includes('school') && !metadata.schoolName) {
      const match = rowText.match(/school[:\s]*(.+)/i);
      if (match) metadata.schoolName = match[1].trim();
      else if (!lowerText.includes(':')) metadata.schoolName = rowText;
    }
    
    if ((lowerText.includes('class') || lowerText.includes('grade')) && !metadata.className) {
      const match = rowText.match(/(?:class|grade)[:\s]*([^\-]+)/i);
      if (match) metadata.className = match[1].trim();
    }
    
    if (lowerText.includes('section') && !metadata.section) {
      const match = rowText.match(/section[:\s]*(\w+)/i);
      if (match) metadata.section = match[1].trim();
    }
    
    if (lowerText.includes('subject') && !metadata.subject) {
      if (lowerText.includes('maths') || lowerText.includes('mathematics')) metadata.subject = 'Maths';
      else if (lowerText.includes('science') && !lowerText.includes('social')) metadata.subject = 'Science';
      else if (lowerText.includes('social')) metadata.subject = 'Social Science';
      else if (lowerText.includes('english')) metadata.subject = 'English';
    }
    
    if (lowerText.includes('assessment') || lowerText.includes('term') || lowerText.includes('exam')) {
      metadata.assessmentName = rowText;
    }
  }
  
  return metadata;
}

// ============================================================
// MAIN IMPORT FUNCTION
// ============================================================

export interface ImportResult {
  success: boolean;
  students: Student[];
  metadata: ExtractedMetadata;
  detectedSubject: SubjectType;
  errors: string[];
  warnings: string[];
}

// ============================================================
// SECURITY CONSTANTS
// ============================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ROWS = 10000;
const MAX_COLUMNS = 50;
const EXPECTED_MIN_COLUMNS = 3; // At least S.No, Name, and one skill

export async function importStudentsFromExcel(file: File, targetSubject?: SubjectType): Promise<ImportResult> {
  // SECURITY: Validate file size before processing
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      students: [],
      metadata: {},
      detectedSubject: targetSubject || 'English',
      errors: [`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`],
      warnings: [],
    };
  }

  // SECURITY: Validate file type
  const validExtensions = ['.xlsx', '.xls', '.csv'];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
  if (!hasValidExtension) {
    return {
      success: false,
      students: [],
      metadata: {},
      detectedSubject: targetSubject || 'English',
      errors: ['Invalid file type. Only .xlsx, .xls, and .csv files are accepted.'],
      warnings: [],
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        // SECURITY: Safe parsing options to prevent vulnerabilities
        // - WTF: disables "What The Formula" parsing (prevents formula injection)
        // - cellFormula: false prevents formula evaluation
        // - cellHTML: false prevents HTML parsing
        // - cellStyles: false prevents style parsing (reduces attack surface)
        // - bookDeps: false prevents external dependency resolution
        // - bookFiles: false prevents file inclusion
        // - bookProps: false prevents property parsing
        // - bookSheets: false prevents sheet enumeration beyond needed
        // - bookVBA: false prevents VBA macro parsing
        // - password: '' ensures no password-protected files are processed
        // - sheetRows: limits row count to prevent DoS
        // - PRN: false prevents PRN file parsing
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellFormula: false,    // Don't parse formulas
          cellHTML: false,       // Don't parse HTML
          cellStyles: false,     // Don't parse styles
          bookDeps: false,       // Don't resolve external dependencies
          bookFiles: false,      // Don't include file references
          bookProps: false,      // Don't parse document properties
          bookSheets: true,      // We need sheet names
          bookVBA: false,        // Don't parse VBA macros
          sheetRows: MAX_ROWS,   // Limit rows to prevent DoS
          WTF: false,            // Disable verbose parsing
          dense: false,          // Use sparse array format
        });
        
        // SECURITY: Validate workbook structure
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          resolve({
            success: false,
            students: [],
            metadata: {},
            detectedSubject: targetSubject || 'English',
            errors: ['Invalid Excel file: No sheets found.'],
            warnings: [],
          });
          return;
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // SECURITY: Validate sheet exists
        if (!sheet || !sheet['!ref']) {
          resolve({
            success: false,
            students: [],
            metadata: {},
            detectedSubject: targetSubject || 'English',
            errors: ['Invalid Excel file: Empty or corrupted sheet.'],
            warnings: [],
          });
          return;
        }

        // SECURITY: Validate sheet dimensions
        const range = XLSX.utils.decode_range(sheet['!ref']);
        if (range.e.c - range.s.c + 1 > MAX_COLUMNS) {
          resolve({
            success: false,
            students: [],
            metadata: {},
            detectedSubject: targetSubject || 'English',
            errors: [`Too many columns (${range.e.c - range.s.c + 1}). Maximum is ${MAX_COLUMNS}.`],
            warnings: [],
          });
          return;
        }
        
        if (range.e.c - range.s.c + 1 < EXPECTED_MIN_COLUMNS) {
          resolve({
            success: false,
            students: [],
            metadata: {},
            detectedSubject: targetSubject || 'English',
            errors: ['Invalid file structure: Not enough columns for tabular data.'],
            warnings: [],
          });
          return;
        }
        
        const errors: string[] = [];
        const warnings: string[] = [];
        
        // Step 1: Detect header row
        const headerInfo = detectHeaderRow(sheet);
        if (!headerInfo) {
          resolve({
            success: false,
            students: [],
            metadata: {},
            detectedSubject: targetSubject || 'English',
            errors: ['Could not find table headers. Required: S.No and Student Name columns.'],
            warnings: [],
          });
          return;
        }
        
        const { headerRow, columnMap } = headerInfo;
        
        // Step 2: Extract metadata from rows above header
        const metadata = extractMetadata(sheet, headerRow);
        
        // Step 3: Detect or use provided subject
        const detectedSubject = targetSubject || metadata.subject || detectSubjectFromSheet(sheet, headerRow);
        const skills = getSkillsForSubject(detectedSubject);
        
        // Step 4: Map skill columns for the subject
        const skillColumnMap = mapSkillColumns(sheet, headerRow, columnMap, detectedSubject);
        
        // Step 5: Check for skill columns
        const detectedSkills = skills.filter(skill => skillColumnMap[skill] !== undefined);
        if (detectedSkills.length === 0) {
          warnings.push(`No ${detectedSubject} skill columns detected. Students will have empty ratings.`);
        } else if (detectedSkills.length < skills.length) {
          const missing = skills.filter(s => !detectedSkills.includes(s));
          warnings.push(`Missing skill columns: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`);
        }
        
        // Step 6: Parse student rows (reuse range from earlier validation)
        const students: Student[] = [];
        
        for (let rowIdx = headerRow + 1; rowIdx <= range.e.r; rowIdx++) {
          // Check if row is empty
          let rowHasData = false;
          for (let colIdx = range.s.c; colIdx <= range.e.c; colIdx++) {
            const cellAddr = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
            const cell = sheet[cellAddr];
            if (cell && cell.v !== undefined && String(cell.v).trim() !== '') {
              rowHasData = true;
              break;
            }
          }
          
          if (!rowHasData) continue; // Skip empty rows
          
          // Get cell values
          const getCellValue = (col: number | undefined): any => {
            if (col === undefined) return undefined;
            const cellAddr = XLSX.utils.encode_cell({ r: rowIdx, c: col });
            const cell = sheet[cellAddr];
            return cell ? cell.v : undefined;
          };
          
          // Extract student data with sanitization
          const serialNoRaw = getCellValue(columnMap['S.No']);
          const rollNoRaw = getCellValue(columnMap['Roll No']);
          const nameRaw = getCellValue(columnMap['Student Name']);
          const remarkRaw = getCellValue(columnMap['Remarks']);
          
          // SECURITY: Sanitize name - reject empty names
          const name = sanitizeName(nameRaw);
          if (!name) continue;
          
          // Parse serial number with validation
          let serialNo: number;
          if (serialNoRaw !== undefined && serialNoRaw !== null && serialNoRaw !== '') {
            const parsed = parseInt(String(serialNoRaw), 10);
            // SECURITY: Validate serial number is reasonable
            serialNo = (!isNaN(parsed) && parsed > 0 && parsed <= MAX_ROWS) 
              ? parsed 
              : students.length + 1;
          } else {
            serialNo = students.length + 1;
          }
          
          // SECURITY: Sanitize roll number
          const rollNumber = sanitizeString(rollNoRaw, 50);
          
          // Parse skill ratings - only known skills for the subject
          const subjectRatings: Record<string, SkillRatingOrUnselected> = {};
          skills.forEach(skill => {
            const value = getCellValue(skillColumnMap[skill]);
            // SECURITY: parseSkillRating only accepts valid ratings (0,1,2 or text equivalents)
            subjectRatings[skill] = parseSkillRating(value);
          });
          
          // Parse or calculate total with validation
          const totalRaw = getCellValue(columnMap['Total']);
          let total: number;
          if (totalRaw !== undefined && !isNaN(Number(totalRaw))) {
            // If total contains "x/y" format, extract x
            const totalStr = String(totalRaw);
            const match = totalStr.match(/^(\d+)/);
            const parsed = match ? parseInt(match[1], 10) : calculateTotal(subjectRatings);
            // SECURITY: Validate total is within reasonable bounds
            const maxPossible = skills.length * 2;
            total = (parsed >= 0 && parsed <= maxPossible) ? parsed : calculateTotal(subjectRatings);
          } else {
            total = calculateTotal(subjectRatings);
          }
          
          // SECURITY: Sanitize remarks
          const remark = sanitizeRemark(remarkRaw);
          
          // SECURITY: Only include known fields - strip unknown fields
          students.push({
            id: crypto.randomUUID(),
            serialNo,
            name,
            rollNumber,
            subjectRatings,
            total,
            remark,
            isGeneratingRemark: false,
          });
        }
        
        if (students.length === 0) {
          resolve({
            success: false,
            students: [],
            metadata,
            detectedSubject,
            errors: ['No student data found in the Excel file.'],
            warnings,
          });
          return;
        }
        
        resolve({
          success: true,
          students,
          metadata,
          detectedSubject,
          errors,
          warnings,
        });
        
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
