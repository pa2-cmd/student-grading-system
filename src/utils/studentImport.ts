import * as XLSX from 'xlsx';
import { Student, createEmptyStudent } from '@/types/assessment';

export interface ImportResult {
  students: Student[];
  count: number;
}

export function parseStudentFile(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON - each row as an array
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // Extract student names from the first column (skip header if present)
        const names: string[] = [];
        
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (row && row.length > 0) {
            // Try first column for name
            let name = String(row[0] || '').trim();
            
            // Skip common header names
            if (name && !isHeaderRow(name)) {
              names.push(name);
            }
          }
        }
        
        // Create students from names
        const students: Student[] = names.map((name, index) => ({
          ...createEmptyStudent(index + 1),
          name,
        }));
        
        resolve({ students, count: students.length });
      } catch (error) {
        reject(new Error('Failed to parse file. Please ensure it is a valid CSV or Excel file.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

function isHeaderRow(value: string): boolean {
  const headerKeywords = [
    'name', 'student', 'students', 'student name', 'studentname',
    's.no', 'sno', 'sr.no', 'serial', 'roll', 'roll no', 'rollno',
    'sl.no', 'slno', '#', 'no.', 'number'
  ];
  return headerKeywords.includes(value.toLowerCase());
}
