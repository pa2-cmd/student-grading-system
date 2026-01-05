import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, X, FileSpreadsheet } from 'lucide-react';
import { ExcelImportResult } from '@/utils/excelImport';

interface ExcelPreviewProps {
  result: ExcelImportResult;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExcelPreview({ result, onConfirm, onCancel }: ExcelPreviewProps) {
  const previewStudents = result.students.slice(0, 5);
  const hasMore = result.students.length > 5;
  
  // Columns are now required - Name and Enrollment must always be detected
  
  return (
    <Card className="border-2 border-primary/20 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-heading">Excel Preview</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Found {result.students.length} students. Review the detected columns before importing.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Header Row Info */}
        {result.headerRowIndex && (
          <div className="bg-primary/10 rounded-lg p-3 flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Header row detected at <strong>row {result.headerRowIndex}</strong>
          </div>
        )}

        {/* Detected Columns Info */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <p className="text-sm font-medium">Detected Columns:</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {result.detectedColumns.serialNo ? (
              <Badge variant="outline" className="gap-1 bg-skill-good-bg text-skill-good border-skill-good/30">
                <CheckCircle2 className="h-3 w-3" />
                S.No: "{result.detectedColumns.serialNo.header}"
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                S.No: Auto-generated
              </Badge>
            )}
            
            {result.detectedColumns.name ? (
              <Badge variant="outline" className="gap-1 bg-skill-good-bg text-skill-good border-skill-good/30">
                <CheckCircle2 className="h-3 w-3" />
                Name: "{result.detectedColumns.name.header}"
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Name: Auto-generated
              </Badge>
            )}
            
            {result.detectedColumns.enrollment ? (
              <Badge variant="outline" className="gap-1 bg-skill-good-bg text-skill-good border-skill-good/30">
                <CheckCircle2 className="h-3 w-3" />
                Enrollment: "{result.detectedColumns.enrollment.header}"
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Enrollment: Auto-generated
              </Badge>
            )}
          </div>
          
          {/* Detected Subjects */}
          {result.detectedSubjects && result.detectedSubjects.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Detected Subjects:</p>
              <div className="flex flex-wrap gap-1">
                {result.detectedSubjects.map((subject, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <div className="bg-skill-average-bg rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium text-skill-average">⚠️ Notes:</p>
            {result.warnings.map((warning, i) => (
              <p key={i} className="text-xs text-muted-foreground">• {warning}</p>
            ))}
          </div>
        )}

        {/* Preview Table */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="px-3 py-2 text-left font-medium">Roll No</th>
                <th className="px-3 py-2 text-left font-medium">Enrollment No</th>
                <th className="px-3 py-2 text-left font-medium">Student Name</th>
                <th className="px-3 py-2 text-left font-medium">Attendance</th>
                <th className="px-3 py-2 text-left font-medium">Subjects</th>
              </tr>
            </thead>
            <tbody>
              {previewStudents.map((student, idx) => (
                <tr key={idx} className="border-t border-border">
                  <td className="px-3 py-2 font-mono">{student.rollNumber || student.serialNo}</td>
                  <td className="px-3 py-2 font-mono text-xs">{student.enrollmentNumber || '—'}</td>
                  <td className="px-3 py-2">{student.name || '—'}</td>
                  <td className="px-3 py-2 text-xs">
                    {student.attendancePresent && student.attendanceTotal 
                      ? `${student.attendancePresent}/${student.attendanceTotal}`
                      : student.attendancePercentage 
                        ? `${student.attendancePercentage}%` 
                        : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {student.subjectMarks && Object.keys(student.subjectMarks).length > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {Object.keys(student.subjectMarks).slice(0, 3).join(', ')}
                        {Object.keys(student.subjectMarks).length > 3 && ` +${Object.keys(student.subjectMarks).length - 3} more`}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <p className="text-sm text-muted-foreground text-center">
            + {result.students.length - 5} more students
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Import {result.students.length} Students
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
