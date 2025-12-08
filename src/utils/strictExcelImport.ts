import * as XLSX from 'xlsx';
import { validateTemplate } from './excelTemplate';

/**
 * Strict imported student - exactly as read from Excel
 */
export interface StrictImportedStudent {
  serialNo: number;
  studentName: string;
  enrollmentNo: string;
}

/**
 * Strict import result - no auto-generation of names/enrollment
 */
export interface StrictExcelImportResult {
  students: StrictImportedStudent[];
  warnings: string[];
  totalRows: number;
  validRows: number;
  skippedRows: number;
}

/**
 * Find column index by checking exact header matches (case-insensitive)
 */
function findColumnIndex(headers: string[], validNames: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const normalized = headers[i].toLowerCase().trim();
    if (validNames.includes(normalized)) {
      return i;
    }
  }
  return -1;
}

/**
 * Strict Excel import - reads data EXACTLY as provided
 * 
 * RULES:
 * 1. Only accepts files with exact column names: S.No, Student Name, Enrollment No
 * 2. NEVER auto-generates Student Name or Enrollment No
 * 3. Only auto-generates S.No if column is empty
 * 4. Reads data exactly as written in the Excel file
 */
export async function strictImportStudents(file: File): Promise<StrictExcelImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Validate template format
        const validation = validateTemplate(workbook);
        
        if (!validation.isValid) {
          reject(new Error(validation.error || 'Invalid template format.'));
          return;
        }
        
        // Get worksheet (prefer StudentList, fallback to first sheet)
        const sheetName = workbook.SheetNames.find(
          name => name.toLowerCase() === 'studentlist'
        ) || workbook.SheetNames[0];
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length < 2) {
          reject(new Error('No data rows found. Please add student data below the headers.'));
          return;
        }
        
        // Get headers
        const headers = jsonData[0].map((h: any) => String(h || '').trim().toLowerCase());
        
        console.log('📊 Headers detected:', headers);
        
        // Find column indices
        const VALID_SERIAL_HEADERS = ['s.no', 's. no', 'sno', 's no', 'serial number', 'sr no', 'sr. no'];
        const VALID_NAME_HEADERS = ['student name', 'name', 'studentname'];
        const VALID_ENROLLMENT_HEADERS = ['enrollment no', 'enrollment number', 'enrolment no', 'enrolment', 'er no', 'er. no'];
        
        const serialColIndex = findColumnIndex(headers, VALID_SERIAL_HEADERS);
        const nameColIndex = findColumnIndex(headers, VALID_NAME_HEADERS);
        const enrollmentColIndex = findColumnIndex(headers, VALID_ENROLLMENT_HEADERS);
        
        console.log(`📍 Column indices - Serial: ${serialColIndex}, Name: ${nameColIndex}, Enrollment: ${enrollmentColIndex}`);
        
        const students: StrictImportedStudent[] = [];
        const warnings: string[] = [];
        let autoSerialCounter = 0;
        let skippedRows = 0;
        
        // Process data rows (skip header row)
        for (let rowIndex = 1; rowIndex < jsonData.length; rowIndex++) {
          const row = jsonData[rowIndex];
          
          // Skip completely empty rows
          const hasAnyData = row.some((cell: any) => 
            cell !== undefined && cell !== null && String(cell).trim() !== ''
          );
          if (!hasAnyData) continue;
          
          autoSerialCounter++;
          
          // Get values from exact columns
          const rawSerial = row[serialColIndex];
          const rawName = row[nameColIndex];
          const rawEnrollment = row[enrollmentColIndex];
          
          // --- Serial Number ---
          let serialNo: number;
          if (rawSerial !== undefined && rawSerial !== null && String(rawSerial).trim() !== '') {
            const parsed = parseInt(String(rawSerial));
            serialNo = isNaN(parsed) ? autoSerialCounter : parsed;
          } else {
            // Only auto-generate S.No if empty
            serialNo = autoSerialCounter;
          }
          
          // --- Student Name (REQUIRED - no auto-generation) ---
          const studentName = rawName !== undefined && rawName !== null 
            ? String(rawName).trim() 
            : '';
          
          if (!studentName) {
            warnings.push(`Row ${rowIndex + 1}: Student Name is empty → Row skipped`);
            skippedRows++;
            continue;
          }
          
          // --- Enrollment No (REQUIRED - no auto-generation) ---
          const enrollmentNo = rawEnrollment !== undefined && rawEnrollment !== null 
            ? String(rawEnrollment).trim() 
            : '';
          
          if (!enrollmentNo) {
            warnings.push(`Row ${rowIndex + 1}: Enrollment No is empty → Row skipped`);
            skippedRows++;
            continue;
          }
          
          students.push({
            serialNo,
            studentName,
            enrollmentNo,
          });
        }
        
        if (students.length === 0) {
          reject(new Error('No valid student data found. Ensure Student Name and Enrollment No are filled for each row.'));
          return;
        }
        
        console.log(`✅ Imported ${students.length} students`);
        if (warnings.length > 0) {
          console.log(`⚠️ Warnings:`, warnings);
        }
        
        resolve({
          students,
          warnings,
          totalRows: jsonData.length - 1,
          validRows: students.length,
          skippedRows,
        });
        
      } catch (error) {
        console.error('❌ Excel parse error:', error);
        reject(new Error('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}
