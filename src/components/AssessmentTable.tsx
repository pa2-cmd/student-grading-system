import { Student, SkillRating } from '@/types/assessment';
import { StudentRow } from './StudentRow';

interface AssessmentTableProps {
  students: Student[];
  onUpdateStudent: (id: string, field: keyof Student, value: any) => void;
  onRemoveStudent: (id: string) => void;
  onGenerateRemark: (id: string) => void;
}

export function AssessmentTable({
  students,
  onUpdateStudent,
  onRemoveStudent,
  onGenerateRemark,
}: AssessmentTableProps) {
  return (
    <div className="card-elevated overflow-hidden">
      <div className="overflow-x-auto">
        <table className="assessment-table">
          <thead>
            <tr>
              <th className="w-16 text-center">S.No</th>
              <th className="min-w-[180px]">Student Name</th>
              <th className="min-w-[150px]">Speaking & Listening</th>
              <th className="min-w-[150px]">Writing Skills</th>
              <th className="min-w-[150px]">Vocabulary</th>
              <th className="min-w-[150px]">Grammar Usage</th>
              <th className="min-w-[150px]">Reading Comprehension</th>
              <th className="w-20 text-center">Total</th>
              <th className="min-w-[280px]">AI Remarks</th>
              <th className="w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                onUpdate={(field, value) => onUpdateStudent(student.id, field, value)}
                onRemove={() => onRemoveStudent(student.id)}
                onGenerateRemark={() => onGenerateRemark(student.id)}
                canRemove={students.length > 1}
              />
            ))}
          </tbody>
        </table>
      </div>

      {students.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          <p>No students added yet. Click "Add Student" to begin.</p>
        </div>
      )}
    </div>
  );
}
