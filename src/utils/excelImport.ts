import * as XLSX from 'xlsx';
import { 
  Student, 
  SkillRating, 
  SkillRatingOrUnselected, 
  calculateTotal,
  ENGLISH_SKILLS 
} from '@/types/assessment';

// ============================================================
// ENGLISH ASSESSMENT - EXCEL IMPORT
// Strict column mapping for English-only assessment
// ============================================================

// Expected headers for the English assessment table
const EXPECTED_HEADERS = [
  'S.No', 'Serial No', 'Sr. No', 'SNo',
  'Roll No', 'Roll Number', 'RollNo',
  'Student Name', 'Name', 'Student',
  'Speaking & Listening Skills', 'Speaking', 'Listening', 'Speaking & Listening',
  'Writing Skills', 'Writing',
  'Vocabulary',
  'Grammar Usage', 'Grammar',
  'Reading Comprehension', 'Reading',
  'Total',
  'Remarks', 'Remark', 'Review', 'AI Remarks'
] as const;

// Required headers (must be present)
const REQUIRED_HEADERS = ['S.No', 'Serial No', 'Sr. No', 'SNo', 'Student Name', 'Name', 'Student'];

// English skill columns mapping
const SKILL_HEADER_MAP: Record<string, string> = {
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
};

// ============================================================
// SKILL RATING PARSER
// Handles: 0, 1, 2, Good, Average, Needs Improvement, N/A, blank
// ZERO IS VALID DATA - must not be treated as empty
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
  
  // Handle numeric values (0, 1, 2) - ZERO IS VALID
  const num = Number(value);
  if (!isNaN(num)) {
    if (num === 0) return 'Needs Improvement';
    if (num === 1) return 'Average';
    if (num === 2) return 'Good';
  }
  
  // Handle text ratings
  if (str.includes('good') || str.includes('strong') || str.includes('excellent')) {
    return 'Good';
  }
  if (str.includes('average') || str.includes('developing') || str.includes('moderate')) {
    return 'Average';
  }
  if (str.includes('needs') || str.includes('improvement') || str.includes('poor') || str.includes('weak')) {
    return 'Needs Improvement';
  }
  
  // Handle mixed formats like "Good (2)" or "2-Good"
  if (str.includes('2')) return 'Good';
  if (str.includes('1')) return 'Average';
  if (str.includes('0')) return 'Needs Improvement';
  
  return undefined;
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
        
        // Check for English skill headers
        Object.entries(SKILL_HEADER_MAP).forEach(([key, mappedSkill]) => {
          if (headerText.toLowerCase().includes(key.toLowerCase()) || 
              key.toLowerCase().includes(headerText.toLowerCase())) {
            columnMap[mappedSkill] = colIdx;
          }
        });
        
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
// METADATA EXTRACTION
// Extracts school name, class, section from rows above header
// ============================================================

interface ExtractedMetadata {
  schoolName?: string;
  className?: string;
  section?: string;
  assessmentName?: string;
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
  errors: string[];
  warnings: string[];
}

export async function importStudentsFromExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const errors: string[] = [];
        const warnings: string[] = [];
        
        // Step 1: Detect header row
        const headerInfo = detectHeaderRow(sheet);
        if (!headerInfo) {
          resolve({
            success: false,
            students: [],
            metadata: {},
            errors: ['Could not find table headers. Required: S.No and Student Name columns.'],
            warnings: [],
          });
          return;
        }
        
        const { headerRow, columnMap } = headerInfo;
        
        // Step 2: Extract metadata from rows above header
        const metadata = extractMetadata(sheet, headerRow);
        
        // Step 3: Check for English skill columns
        const detectedSkills = ENGLISH_SKILLS.filter(skill => columnMap[skill] !== undefined);
        if (detectedSkills.length === 0) {
          warnings.push('No English skill columns detected. Students will have empty ratings.');
        } else if (detectedSkills.length < ENGLISH_SKILLS.length) {
          const missing = ENGLISH_SKILLS.filter(s => !detectedSkills.includes(s));
          warnings.push(`Missing skill columns: ${missing.join(', ')}`);
        }
        
        // Step 4: Parse student rows
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
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
          
          // Extract student data
          const serialNoRaw = getCellValue(columnMap['S.No']);
          const rollNoRaw = getCellValue(columnMap['Roll No']);
          const nameRaw = getCellValue(columnMap['Student Name']);
          const remarkRaw = getCellValue(columnMap['Remarks']);
          
          // Skip if no name
          const name = nameRaw ? String(nameRaw).trim() : '';
          if (!name) continue;
          
          // Parse serial number - preserve exactly as in sheet (including 0)
          let serialNo: number;
          if (serialNoRaw !== undefined && serialNoRaw !== null && serialNoRaw !== '') {
            serialNo = parseInt(String(serialNoRaw), 10);
            if (isNaN(serialNo)) serialNo = students.length + 1;
          } else {
            serialNo = students.length + 1;
          }
          
          // Parse roll number
          const rollNumber = rollNoRaw !== undefined && rollNoRaw !== null 
            ? String(rollNoRaw).trim() 
            : '';
          
          // Parse skill ratings
          const subjectRatings: Record<string, SkillRatingOrUnselected> = {};
          ENGLISH_SKILLS.forEach(skill => {
            const value = getCellValue(columnMap[skill]);
            subjectRatings[skill] = parseSkillRating(value);
          });
          
          // Parse or calculate total
          const totalRaw = getCellValue(columnMap['Total']);
          let total: number;
          if (totalRaw !== undefined && !isNaN(Number(totalRaw))) {
            // If total contains "x/y" format, extract x
            const totalStr = String(totalRaw);
            const match = totalStr.match(/^(\d+)/);
            total = match ? parseInt(match[1], 10) : calculateTotal(subjectRatings);
          } else {
            total = calculateTotal(subjectRatings);
          }
          
          // Parse remarks
          const remark = remarkRaw ? String(remarkRaw).trim() : '';
          
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
            errors: ['No student data found in the Excel file.'],
            warnings,
          });
          return;
        }
        
        resolve({
          success: true,
          students,
          metadata,
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
