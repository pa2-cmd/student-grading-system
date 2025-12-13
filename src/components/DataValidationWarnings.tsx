import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Student } from '@/types/assessment';

interface DataValidationWarningsProps {
  students: Student[];
  className?: string;
}

interface ValidationWarning {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  affectedStudents?: string[];
}

export function DataValidationWarnings({ students, className }: DataValidationWarningsProps) {
  const warnings: ValidationWarning[] = [];

  // Check for identical Roll and Enrollment numbers
  const identicalRollEnrollment = students.filter(
    s => s.rollNumber && s.enrollmentNumber && 
        s.rollNumber.trim() === s.enrollmentNumber.trim()
  );
  if (identicalRollEnrollment.length > 0) {
    warnings.push({
      type: 'warning',
      title: 'Identical Roll & Enrollment Numbers',
      message: 'Roll Number and Enrollment Number appear identical for some students. Please verify these are correct.',
      affectedStudents: identicalRollEnrollment.map(s => s.name || `S.No ${s.serialNo}`),
    });
  }

  // Check for missing Roll Numbers
  const missingRoll = students.filter(s => s.name && !s.rollNumber);
  if (missingRoll.length > 0) {
    warnings.push({
      type: 'info',
      title: 'Missing Roll Numbers',
      message: `${missingRoll.length} student(s) are missing Roll Numbers.`,
      affectedStudents: missingRoll.slice(0, 5).map(s => s.name),
    });
  }

  // Check for missing Enrollment Numbers
  const missingEnrollment = students.filter(s => s.name && !s.enrollmentNumber);
  if (missingEnrollment.length > 0) {
    warnings.push({
      type: 'warning',
      title: 'Missing Enrollment Numbers',
      message: `${missingEnrollment.length} student(s) are missing Enrollment Numbers.`,
      affectedStudents: missingEnrollment.slice(0, 5).map(s => s.name),
    });
  }

  // Check for missing Attendance data
  const missingAttendance = students.filter(
    s => s.name && (!s.attendanceTotal || s.attendanceTotal === 0)
  );
  if (missingAttendance.length > 0 && missingAttendance.length < students.length) {
    warnings.push({
      type: 'info',
      title: 'Missing Attendance Data',
      message: `${missingAttendance.length} student(s) have no attendance records.`,
    });
  }

  // Check for marks that don't add up correctly (theory + internal != total)
  const marksIssues: string[] = [];
  students.forEach(student => {
    if (student.subjectMarksDetail) {
      Object.entries(student.subjectMarksDetail).forEach(([subject, detail]) => {
        if (detail.theory + detail.internal !== detail.total && detail.total > 0) {
          marksIssues.push(`${student.name}: ${subject}`);
        }
      });
    }
  });
  if (marksIssues.length > 0) {
    warnings.push({
      type: 'error',
      title: 'Marks Calculation Mismatch',
      message: 'Some subject totals do not match Theory + Internal Assessment.',
      affectedStudents: marksIssues.slice(0, 5),
    });
  }

  if (warnings.length === 0) return null;

  return (
    <div className={className}>
      <div className="space-y-3">
        {warnings.map((warning, index) => (
          <Alert
            key={index}
            variant={warning.type === 'error' ? 'destructive' : 'default'}
            className={
              warning.type === 'warning' 
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' 
                : warning.type === 'info'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                : ''
            }
          >
            {warning.type === 'error' && <AlertCircle className="h-4 w-4" />}
            {warning.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
            {warning.type === 'info' && <Info className="h-4 w-4 text-blue-600" />}
            <AlertTitle className={
              warning.type === 'warning' ? 'text-amber-800 dark:text-amber-200' :
              warning.type === 'info' ? 'text-blue-800 dark:text-blue-200' : ''
            }>
              {warning.title}
            </AlertTitle>
            <AlertDescription className={
              warning.type === 'warning' ? 'text-amber-700 dark:text-amber-300' :
              warning.type === 'info' ? 'text-blue-700 dark:text-blue-300' : ''
            }>
              <p>{warning.message}</p>
              {warning.affectedStudents && warning.affectedStudents.length > 0 && (
                <p className="mt-1 text-xs opacity-80">
                  Affected: {warning.affectedStudents.join(', ')}
                  {warning.affectedStudents.length < 
                    (warning.type === 'warning' ? identicalRollEnrollment.length : 0) && 
                    '...'}
                </p>
              )}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
}
