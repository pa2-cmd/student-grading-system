import { Student, SkillRating, SubjectType, getSkillsForSubject, getSkillDisplayName } from '@/types/assessment';
import { StudentRow } from './StudentRow';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AssessmentTableProps {
  students: Student[];
  subject: SubjectType;
  onUpdateStudent: (id: string, field: keyof Student, value: any) => void;
  onUpdateSubjectRating: (studentId: string, subject: string, rating: SkillRating) => void;
  onRemoveStudent: (id: string) => void;
  onGenerateRemark: (id: string) => void;
  onExportStudentPDF?: (student: Student) => void;
}

export function AssessmentTable({
  students,
  subject,
  onUpdateStudent,
  onUpdateSubjectRating,
  onRemoveStudent,
  onGenerateRemark,
  onExportStudentPDF,
}: AssessmentTableProps) {
  const skills = getSkillsForSubject(subject);
  
  return (
    <div className="card-elevated overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-16 text-center font-semibold">S.No</TableHead>
              <TableHead className="min-w-[180px] font-semibold">Student Name</TableHead>
              {skills.map(skill => (
                <TableHead key={skill} className="min-w-[120px] font-semibold text-xs">
                  {getSkillDisplayName(skill)}
                </TableHead>
              ))}
              <TableHead className="w-20 text-center font-semibold">Total</TableHead>
              <TableHead className="min-w-[420px] font-semibold">AI Remarks</TableHead>
              <TableHead className="w-24 text-center font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                subject={subject}
                onUpdateStudent={onUpdateStudent}
                onUpdateSubjectRating={onUpdateSubjectRating}
                onRemoveStudent={onRemoveStudent}
                onGenerateRemark={onGenerateRemark}
                onExportStudentPDF={onExportStudentPDF}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      
      {students.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No students added yet. Click "Add Student" to begin.</p>
        </div>
      )}
    </div>
  );
}
