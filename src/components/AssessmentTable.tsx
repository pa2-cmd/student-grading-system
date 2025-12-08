import { Student, SkillRating } from '@/types/assessment';
import { StudentRow } from './StudentRow';

interface AssessmentTableProps {
  students: Student[];
  selectedSubjects: string[];
  onUpdateStudent: (id: string, field: keyof Student, value: any) => void;
  onUpdateSubjectRating: (studentId: string, subject: string, rating: SkillRating) => void;
  onRemoveStudent: (id: string) => void;
  onGenerateRemark: (id: string) => void;
}

export function AssessmentTable({
  students,
  selectedSubjects,
  onUpdateStudent,
  onUpdateSubjectRating,
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
              <th className="min-w-[100px]">Roll No</th>
              <th className="min-w-[180px]">Student Name</th>
              {selectedSubjects.map(subject => (
                <th key={subject} className="min-w-[140px]">
                  {subject.replace(' Skills', '').replace(' Usage', '')}
                </th>
              ))}
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
                selectedSubjects={selectedSubjects}
                onUpdateSubjectRating={(subject, rating) => onUpdateSubjectRating(student.id, subject, rating)}
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
