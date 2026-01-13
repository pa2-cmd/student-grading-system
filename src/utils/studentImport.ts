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
    .replace(/[\r\n\t]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if a value should be treated as blank/NA
function isBlankOrNA(value: any): boolean {
  if (value === null || value === undefined) return true;
  const str = String(value).trim().toUpperCase();
  return str === '' || str === 'NA' || str === 'N/A';
}

// Parse skill value
function parseSkillValue(value: any): SkillRating {
  if (isBlankOrNA(value)) return 'Good';
  
  const strValue = String(value).trim().toLowerCase();
  
  if (strValue === 'good' || strValue === '2') return 'Good';
  if (strValue === 'average' || strValue === 'avg' || strValue === '1') return 'Average';
  if (strValue === 'needs improvement' || strValue === 'ni' || strValue === '0') return 'Needs Improvement';
  
  if (value === 'Good') return 'Good';
  if (value === 'Average') return 'Average';
  if (value === 'Needs Improvement') return 'Needs Improvement';
  
  return 'Good';
}

// Parse total
function parseTotal(value: any): number | null {
  if (isBlankOrNA(value)) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

// Parse S.No - PRESERVE EXACTLY AS-IS
function parseSerialNo(value: any): number | string | null {
  // If blank/undefined/null, return null (keep blank)
  if (value === null || value === undefined || String(value).trim() === '') {
    return null;
  }
  
  // Try to parse as number first
  const num = Number(value);
  if (!isNaN(num)) {
    return num;
  }
  
  // Otherwise preserve as string (handles non-numeric S.No)
  return String(value).trim();
}

// Find header row - match by column names
function findHeaderRow(rows: any[][]): { rowIndex: number; mapping: Record<string, number> } | null {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const normalizedHeaders = row.map(normalizeHeader);
    const mapping: Record<string, number> = {};
    
    for (const reqHeader of REQUIRED_HEADERS) {
      const index = normalizedHeaders.findIndex(h => h === reqHeader);
      if (index !== -1) {
        mapping[reqHeader] = index;
      }
    }
    
    // Valid header row if we find "Student Name"
    if (mapping['Student Name'] !== undefined) {
      return { rowIndex: i, mapping };
    }
  }
  
  return null;
}

export function validateAndParseFile(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        let sheetName = workbook.SheetNames[0];
        if (workbook.SheetNames.includes('Assessment')) {
          sheetName = 'Assessment';
        }
        const sheet = workbook.Sheets[sheetName];
        
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
        
        if (rows.length < 1) {
          reject(new Error('File is empty.'));
          return;
        }
        
        // Find header row
        const headerResult = findHeaderRow(rows);
        
        if (!headerResult) {
          const firstRowHeaders = rows[0]?.map(normalizeHeader).filter(h => h) || [];
          reject(new Error(
            `Header mismatch: Could not find "Student Name" column.\n` +
            `Found headers: ${firstRowHeaders.length > 0 ? firstRowHeaders.join(', ') : '(none)'}\n` +
            `Required: ${REQUIRED_HEADERS.join(', ')}`
          ));
          return;
        }
        
        const { rowIndex: headerRowIndex, mapping } = headerResult;
        
        if (mapping['Student Name'] === undefined) {
          reject(new Error(`Header mismatch: Missing required column "Student Name"`));
          return;
        }
        
        // Parse data starting IMMEDIATELY after header row (no skipping)
        const students: Student[] = [];
        const dataStartRow = headerRowIndex + 1;
        
        for (let i = dataStartRow; i < rows.length; i++) {
          const row = rows[i];
          
          // Skip completely empty rows only
          if (!row || row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
            continue;
          }
          
          // Get student name
          const nameValue = row[mapping['Student Name']];
          const name = nameValue !== null && nameValue !== undefined 
            ? String(nameValue).trim() 
            : '';
          
          // Skip if name is blank/NA
          if (!name || isBlankOrNA(nameValue)) continue;
          
          // S.No: PRESERVE EXACTLY from sheet - DO NOT auto-generate
          const serialNoValue = mapping['S.No'] !== undefined ? row[mapping['S.No']] : null;
          const serialNo = parseSerialNo(serialNoValue);
          
          // Skills
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
          
          // Total - preserve from sheet
          const totalValue = mapping['Total'] !== undefined ? row[mapping['Total']] : undefined;
          const totalFromSheet = parseTotal(totalValue);
          const hasImportedTotal = totalFromSheet !== null;
          
          // Calculate default total if not provided
          const calculatedTotal = 
            (speakingListening === 'Good' ? 2 : speakingListening === 'Average' ? 1 : 0) +
            (writing === 'Good' ? 2 : writing === 'Average' ? 1 : 0) +
            (vocabulary === 'Good' ? 2 : vocabulary === 'Average' ? 1 : 0) +
            (grammar === 'Good' ? 2 : grammar === 'Average' ? 1 : 0) +
            (reading === 'Good' ? 2 : reading === 'Average' ? 1 : 0);
          
          // Remarks - preserve verbatim
          const remarksValue = mapping['Remarks'] !== undefined ? row[mapping['Remarks']] : undefined;
          const remark = remarksValue !== null && remarksValue !== undefined && !isBlankOrNA(remarksValue)
            ? String(remarksValue).trim()
            : '';
          const hasImportedRemark = remark !== '';
          
          const student: Student = {
            id: crypto.randomUUID(),
            serialNo, // Preserved exactly from sheet
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

export function parseStudentFile(file: File): Promise<ImportResult> {
  return validateAndParseFile(file);
}
