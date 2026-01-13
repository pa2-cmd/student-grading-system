import * as XLSX from 'xlsx';
import { Student, SkillRating } from '@/types/assessment';

export interface ImportResult {
  students: Student[];
  count: number;
}

// Exact required column headers
const REQUIRED_HEADERS = [
  'S.No',
  'Student Name',
  'Speaking & Listening Skills',
  'Writing Skills',
  'Vocabulary',
  'Grammar Usage',
  'Reading Comprehension',
  'Total',
  'Remarks'
];

// Normalize header: trim, remove invisible chars, normalize unicode spaces
function normalizeHeader(header: any): string {
  if (header === null || header === undefined) return '';
  return String(header)
    .replace(/[\r\n\t]/g, '') // Remove line breaks and tabs
    .replace(/\u00A0/g, ' ')  // Replace non-breaking space with regular space
    .replace(/\s+/g, ' ')     // Collapse multiple spaces
    .trim();
}

// Check if a value should be treated as blank/NA
function isBlankOrNA(value: any): boolean {
  if (value === null || value === undefined) return true;
  const str = String(value).trim().toUpperCase();
  return str === '' || str === 'NA' || str === 'N/A';
}

// Parse skill value - preserve NA as empty, map valid values
function parseSkillValue(value: any): SkillRating {
  if (isBlankOrNA(value)) {
    return 'Good'; // Default for blank/NA
  }
  
  const strValue = String(value).trim().toLowerCase();
  
  if (strValue === 'good' || strValue === '2') return 'Good';
  if (strValue === 'average' || strValue === 'avg' || strValue === '1') return 'Average';
  if (strValue === 'needs improvement' || strValue === 'ni' || strValue === '0') return 'Needs Improvement';
  
  // If exact match with proper case
  if (value === 'Good') return 'Good';
  if (value === 'Average') return 'Average';
  if (value === 'Needs Improvement') return 'Needs Improvement';
  
  return 'Good'; // Default fallback
}

// Parse total - preserve as-is, handle NA/blank
function parseTotal(value: any): number | null {
  if (isBlankOrNA(value)) {
    return null;
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
}

// Find header row in sheet (first row with recognizable headers)
function findHeaderRow(rows: any[][]): { rowIndex: number; mapping: Record<string, number> } | null {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const normalizedHeaders = row.map(normalizeHeader);
    const mapping: Record<string, number> = {};
    let matchCount = 0;
    
    // Try to match each required header
    for (const reqHeader of REQUIRED_HEADERS) {
      const index = normalizedHeaders.findIndex(h => h === reqHeader);
      if (index !== -1) {
        mapping[reqHeader] = index;
        matchCount++;
      }
    }
    
    // If we found at least Student Name, consider it a valid header row
    if (mapping['Student Name'] !== undefined) {
      return { rowIndex: i, mapping };
    }
  }
  
  return null;
}

export interface ValidationError {
  column?: string;
  message: string;
}

export function validateAndParseFile(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet (or 'Assessment' sheet if exists)
        let sheetName = workbook.SheetNames[0];
        if (workbook.SheetNames.includes('Assessment')) {
          sheetName = 'Assessment';
        }
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to array of arrays
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
        
        if (rows.length < 1) {
          reject(new Error('File is empty.'));
          return;
        }
        
        // Find header row
        const headerResult = findHeaderRow(rows);
        
        if (!headerResult) {
          // Provide specific error about what headers were found
          const firstRowHeaders = rows[0]?.map(normalizeHeader).filter(h => h) || [];
          reject(new Error(
            `Header mismatch: Could not find "Student Name" column.\n` +
            `Found headers: ${firstRowHeaders.length > 0 ? firstRowHeaders.join(', ') : '(none)'}\n` +
            `Required: ${REQUIRED_HEADERS.join(', ')}`
          ));
          return;
        }
        
        const { rowIndex: headerRowIndex, mapping } = headerResult;
        
        // Check which required columns are missing
        const missingColumns = REQUIRED_HEADERS.filter(h => mapping[h] === undefined);
        const foundColumns = REQUIRED_HEADERS.filter(h => mapping[h] !== undefined);
        
        // Student Name is mandatory
        if (mapping['Student Name'] === undefined) {
          reject(new Error(`Header mismatch: Missing required column "Student Name"`));
          return;
        }
        
        // Parse student data starting after header row
        const students: Student[] = [];
        
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          // Get student name
          const nameValue = row[mapping['Student Name']];
          const name = nameValue !== null && nameValue !== undefined 
            ? String(nameValue).trim() 
            : '';
          
          if (!name || isBlankOrNA(nameValue)) continue; // Skip rows without names
          
          // Get serial number
          const serialValue = mapping['S.No'] !== undefined ? row[mapping['S.No']] : undefined;
          const serialFromSheet = serialValue !== undefined ? Number(serialValue) : NaN;
          const serialNo = !isNaN(serialFromSheet) && serialFromSheet > 0 ? serialFromSheet : students.length + 1;
          
          // Get skill values
          const speakingListening = mapping['Speaking & Listening Skills'] !== undefined
            ? parseSkillValue(row[mapping['Speaking & Listening Skills']])
            : 'Good';
          const writing = mapping['Writing Skills'] !== undefined
            ? parseSkillValue(row[mapping['Writing Skills']])
            : 'Good';
          const vocabulary = mapping['Vocabulary'] !== undefined
            ? parseSkillValue(row[mapping['Vocabulary']])
            : 'Good';
          const grammar = mapping['Grammar Usage'] !== undefined
            ? parseSkillValue(row[mapping['Grammar Usage']])
            : 'Good';
          const reading = mapping['Reading Comprehension'] !== undefined
            ? parseSkillValue(row[mapping['Reading Comprehension']])
            : 'Good';
          
          // Get Total - preserve from sheet, don't recalculate
          const totalValue = mapping['Total'] !== undefined ? row[mapping['Total']] : undefined;
          const totalFromSheet = parseTotal(totalValue);
          const hasImportedTotal = totalFromSheet !== null;
          
          // Get Remarks - preserve verbatim
          const remarksValue = mapping['Remarks'] !== undefined ? row[mapping['Remarks']] : undefined;
          const remark = remarksValue !== null && remarksValue !== undefined && !isBlankOrNA(remarksValue)
            ? String(remarksValue).trim()
            : '';
          const hasImportedRemark = remark !== '';
          
          // Calculate default total if not provided
          const skillValues = { speakingListening, writing, vocabulary, grammar, reading };
          const calculatedTotal = 
            (speakingListening === 'Good' ? 2 : speakingListening === 'Average' ? 1 : 0) +
            (writing === 'Good' ? 2 : writing === 'Average' ? 1 : 0) +
            (vocabulary === 'Good' ? 2 : vocabulary === 'Average' ? 1 : 0) +
            (grammar === 'Good' ? 2 : grammar === 'Average' ? 1 : 0) +
            (reading === 'Good' ? 2 : reading === 'Average' ? 1 : 0);
          
          const student: Student = {
            id: crypto.randomUUID(),
            serialNo,
            name,
            speakingListening,
            writing,
            vocabulary,
            grammar,
            reading,
            total: hasImportedTotal ? totalFromSheet : calculatedTotal,
            remark,
            isGeneratingRemark: false,
            importedTotal: hasImportedTotal,
            importedRemark: hasImportedRemark,
          };
          
          students.push(student);
        }
        
        if (students.length === 0) {
          reject(new Error('No valid student data found. Ensure there are rows with student names below the header row.'));
          return;
        }
        
        resolve({ students, count: students.length });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        reject(new Error(`Failed to parse file: ${message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file. Please try again.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

// Legacy function for backward compatibility
export function parseStudentFile(file: File): Promise<ImportResult> {
  return validateAndParseFile(file);
}
