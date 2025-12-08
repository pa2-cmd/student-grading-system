import * as XLSX from 'xlsx';

/**
 * Creates and downloads the official student import template
 * Sheet name: StudentList
 * Headers: S.No | Student Name | Enrollment No
 * 50 empty rows below headers
 * @param classSection - Optional class-section string for the filename
 */
export function downloadStudentTemplate(classSection?: string): void {
  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Create header row with EXACT column names
  const headers = ['S.No', 'Student Name', 'Enrollment No'];
  
  // Create data array: headers + 50 empty rows
  const data: (string | number | null)[][] = [headers];
  
  // Add 50 empty rows (with S.No pre-filled for convenience)
  for (let i = 1; i <= 50; i++) {
    data.push([i, null, null]);
  }
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 8 },   // S.No
    { wch: 30 },  // Student Name
    { wch: 20 },  // Enrollment No
  ];
  
  // Add worksheet to workbook with exact sheet name
  XLSX.utils.book_append_sheet(workbook, worksheet, 'StudentList');
  
  // Generate filename with class-section
  const sanitizedClassSection = classSection 
    ? classSection.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').trim()
    : '';
  const filename = sanitizedClassSection 
    ? `student-grading-${sanitizedClassSection}.xlsx`
    : 'student-grading-template.xlsx';
  
  // Download the file
  XLSX.writeFile(workbook, filename);
}

/**
 * Strict template validation result
 */
export interface TemplateValidationResult {
  isValid: boolean;
  error?: string;
  sheetFound: boolean;
  columnsFound: {
    serialNo: boolean;
    studentName: boolean;
    enrollmentNo: boolean;
  };
}

/**
 * Validates if an Excel file matches the strict template format
 * Returns detailed validation result
 */
export function validateTemplate(workbook: XLSX.WorkBook): TemplateValidationResult {
  const result: TemplateValidationResult = {
    isValid: false,
    sheetFound: false,
    columnsFound: {
      serialNo: false,
      studentName: false,
      enrollmentNo: false,
    },
  };
  
  // Check for StudentList sheet (case-insensitive)
  const sheetName = workbook.SheetNames.find(
    name => name.toLowerCase() === 'studentlist'
  );
  
  if (!sheetName) {
    // Also accept first sheet if StudentList not found
    const firstSheet = workbook.SheetNames[0];
    if (!firstSheet) {
      result.error = 'No sheets found in the Excel file.';
      return result;
    }
    // Continue with first sheet
    result.sheetFound = true;
  } else {
    result.sheetFound = true;
  }
  
  const worksheet = workbook.Sheets[sheetName || workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  if (jsonData.length < 1) {
    result.error = 'Excel file is empty. Please use the official template.';
    return result;
  }
  
  // Get headers from first row
  const headers = jsonData[0].map((h: any) => String(h || '').trim().toLowerCase());
  
  // Check for EXACT column names (case-insensitive)
  const VALID_SERIAL_HEADERS = ['s.no', 's. no', 'sno', 's no', 'serial number', 'sr no', 'sr. no'];
  const VALID_NAME_HEADERS = ['student name', 'name', 'studentname'];
  const VALID_ENROLLMENT_HEADERS = ['enrollment no', 'enrollment number', 'enrolment no', 'enrolment', 'er no', 'er. no'];
  
  result.columnsFound.serialNo = headers.some(h => 
    VALID_SERIAL_HEADERS.includes(h)
  );
  result.columnsFound.studentName = headers.some(h => 
    VALID_NAME_HEADERS.includes(h)
  );
  result.columnsFound.enrollmentNo = headers.some(h => 
    VALID_ENROLLMENT_HEADERS.includes(h)
  );
  
  // Build error message for missing columns
  const missingColumns: string[] = [];
  if (!result.columnsFound.serialNo) missingColumns.push('S.No');
  if (!result.columnsFound.studentName) missingColumns.push('Student Name');
  if (!result.columnsFound.enrollmentNo) missingColumns.push('Enrollment No');
  
  if (missingColumns.length > 0) {
    result.error = `Please use the official template. Download it and fill your data.\n\nMissing columns: ${missingColumns.join(', ')}`;
    return result;
  }
  
  result.isValid = true;
  return result;
}
