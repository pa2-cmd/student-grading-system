import * as XLSX from 'xlsx';
import { Student, SkillRating, SKILL_OPTIONS } from '@/types/assessment';

export interface ImportResult {
  students: Student[];
  count: number;
}

export interface ValidationError {
  type: 'missing_columns' | 'invalid_columns' | 'structure_error';
  message: string;
  details?: string[];
}

// Exact required columns in order
const REQUIRED_COLUMNS = [
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

// Column name aliases for flexible matching
const COLUMN_ALIASES: Record<string, string[]> = {
  'S.No': ['s.no', 'sno', 's. no', 'serial', 'sr.no', 'sr no', 'sl.no', 'sl no', '#'],
  'Student Name': ['student name', 'name', 'student', 'studentname'],
  'Speaking & Listening Skills': ['speaking & listening skills', 'speaking and listening skills', 'speaking & listening', 'speaking/listening', 'speaking'],
  'Writing Skills': ['writing skills', 'writing', 'writingskills'],
  'Vocabulary': ['vocabulary', 'vocab'],
  'Grammar Usage': ['grammar usage', 'grammar', 'grammarusage'],
  'Reading Comprehension': ['reading comprehension', 'reading', 'readingcomprehension'],
  'Total': ['total', 'sum', 'score', 'total score'],
  'Remarks': ['remarks', 'remark', 'comment', 'comments', 'observation', 'observations']
};

function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim();
}

function matchColumn(headerName: string): string | null {
  const normalized = normalizeColumnName(headerName);
  
  for (const [standardName, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.includes(normalized) || normalizeColumnName(standardName) === normalized) {
      return standardName;
    }
  }
  return null;
}

function parseSkillValue(value: any): SkillRating | '' {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  
  const strValue = String(value).trim().toLowerCase();
  
  // Match exact values
  if (strValue === 'good' || strValue === '2') return 'Good';
  if (strValue === 'average' || strValue === 'avg' || strValue === '1') return 'Average';
  if (strValue === 'needs improvement' || strValue === 'ni' || strValue === '0') return 'Needs Improvement';
  
  return '';
}

function parseTotal(value: any): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  
  const num = Number(value);
  return isNaN(num) ? null : num;
}

export function validateAndParseFile(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with headers
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        if (rows.length < 2) {
          reject(new Error('File must contain a header row and at least one data row.'));
          return;
        }
        
        // Get header row
        const headerRow = rows[0].map(h => String(h || '').trim());
        
        // Validate and map columns
        const columnMapping: Record<string, number> = {};
        const unmappedHeaders: string[] = [];
        const foundColumns: string[] = [];
        
        headerRow.forEach((header, index) => {
          if (!header) return;
          
          const standardName = matchColumn(header);
          if (standardName) {
            columnMapping[standardName] = index;
            foundColumns.push(standardName);
          } else {
            unmappedHeaders.push(header);
          }
        });
        
        // Check for required columns (S.No and Student Name are mandatory)
        const mandatoryColumns = ['Student Name'];
        const missingMandatory = mandatoryColumns.filter(col => !foundColumns.includes(col));
        
        if (missingMandatory.length > 0) {
          reject(new Error(
            `Missing required column(s): ${missingMandatory.join(', ')}. ` +
            `Please ensure your file has the correct column headers.`
          ));
          return;
        }
        
        // Parse student data
        const students: Student[] = [];
        
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          // Get student name - skip if empty
          const nameIndex = columnMapping['Student Name'];
          const name = nameIndex !== undefined ? String(row[nameIndex] || '').trim() : '';
          
          if (!name) continue; // Skip rows without student names
          
          // Get serial number from sheet or auto-generate
          const serialIndex = columnMapping['S.No'];
          const serialFromSheet = serialIndex !== undefined ? Number(row[serialIndex]) : NaN;
          const serialNo = !isNaN(serialFromSheet) ? serialFromSheet : students.length + 1;
          
          // Get skill values - preserve blanks
          const speakingIndex = columnMapping['Speaking & Listening Skills'];
          const writingIndex = columnMapping['Writing Skills'];
          const vocabIndex = columnMapping['Vocabulary'];
          const grammarIndex = columnMapping['Grammar Usage'];
          const readingIndex = columnMapping['Reading Comprehension'];
          
          const speakingValue = speakingIndex !== undefined ? parseSkillValue(row[speakingIndex]) : '';
          const writingValue = writingIndex !== undefined ? parseSkillValue(row[writingIndex]) : '';
          const vocabValue = vocabIndex !== undefined ? parseSkillValue(row[vocabIndex]) : '';
          const grammarValue = grammarIndex !== undefined ? parseSkillValue(row[grammarIndex]) : '';
          const readingValue = readingIndex !== undefined ? parseSkillValue(row[readingIndex]) : '';
          
          // Get Total from sheet - DO NOT recalculate
          const totalIndex = columnMapping['Total'];
          const totalFromSheet = totalIndex !== undefined ? parseTotal(row[totalIndex]) : null;
          
          // Get Remarks from sheet - preserve verbatim
          const remarksIndex = columnMapping['Remarks'];
          const remarkFromSheet = remarksIndex !== undefined ? String(row[remarksIndex] || '').trim() : '';
          
          const student: Student = {
            id: crypto.randomUUID(),
            serialNo,
            name,
            speakingListening: speakingValue || 'Good',
            writing: writingValue || 'Good',
            vocabulary: vocabValue || 'Good',
            grammar: grammarValue || 'Good',
            reading: readingValue || 'Good',
            total: totalFromSheet !== null ? totalFromSheet : 10, // Use sheet value or default
            remark: remarkFromSheet,
            isGeneratingRemark: false,
            importedTotal: totalFromSheet !== null, // Track if total was imported
            importedRemark: remarkFromSheet !== '', // Track if remark was imported
          };
          
          students.push(student);
        }
        
        if (students.length === 0) {
          reject(new Error('No valid student data found in the file.'));
          return;
        }
        
        resolve({ students, count: students.length });
      } catch (error) {
        reject(new Error('Failed to parse file. Please ensure it is a valid CSV or Excel file with the correct structure.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

// Keep legacy function for backward compatibility
export function parseStudentFile(file: File): Promise<ImportResult> {
  return validateAndParseFile(file);
}
