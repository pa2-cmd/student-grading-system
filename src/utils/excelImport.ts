import * as XLSX from 'xlsx';
import { Student, createEmptyStudent } from '@/types/assessment';

export interface ImportedStudent {
  name: string;
  rollNumber: string;
  className?: string;
}

/**
 * Parses an Excel file and extracts student data
 * Supports columns: Name, Roll Number/Roll No, Class (optional)
 */
export async function importStudentsFromExcel(file: File): Promise<ImportedStudent[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length < 2) {
          reject(new Error('Excel file must have at least a header row and one data row'));
          return;
        }
        
        // Find column indices (case-insensitive)
        const headerRow = jsonData[0].map((h: any) => String(h || '').toLowerCase().trim());
        
        const nameColIndex = findColumnIndex(headerRow, ['name', 'student name', 'student', 'full name']);
        const rollColIndex = findColumnIndex(headerRow, ['roll', 'roll no', 'roll number', 'rollno', 'roll no.', 'sr no', 'sr. no', 'serial']);
        const classColIndex = findColumnIndex(headerRow, ['class', 'grade', 'section', 'class/section']);
        
        if (nameColIndex === -1) {
          reject(new Error('Could not find a "Name" column in the Excel file. Please ensure your file has a column named "Name" or "Student Name".'));
          return;
        }
        
        // Extract student data from remaining rows
        const students: ImportedStudent[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const name = String(row[nameColIndex] || '').trim();
          
          if (name) {
            students.push({
              name,
              rollNumber: rollColIndex !== -1 ? String(row[rollColIndex] || '').trim() : String(i),
              className: classColIndex !== -1 ? String(row[classColIndex] || '').trim() : undefined,
            });
          }
        }
        
        if (students.length === 0) {
          reject(new Error('No valid student data found in the Excel file'));
          return;
        }
        
        resolve(students);
      } catch (error) {
        reject(new Error('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

function findColumnIndex(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => h.includes(name));
    if (index !== -1) return index;
  }
  return -1;
}

/**
 * Converts imported student data to Student objects
 */
export function createStudentsFromImport(
  importedStudents: ImportedStudent[],
  selectedSubjects: string[]
): Student[] {
  return importedStudents.map((imported, index) => {
    const student = createEmptyStudent(index + 1, selectedSubjects);
    return {
      ...student,
      name: imported.name,
      rollNumber: imported.rollNumber,
    };
  });
}
