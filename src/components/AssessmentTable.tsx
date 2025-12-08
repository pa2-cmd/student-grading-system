import { Student, SkillRating } from '@/types/assessment';
import { StudentRow } from './StudentRow';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface AssessmentTableProps {
  students: Student[];
  selectedSubjects: string[];
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
  onUpdateSubjectMark: (studentId: string, subject: string, marks: number) => void;
  onUpdateSubjectRating: (studentId: string, subject: string, rating: SkillRating) => void;
  onRemoveStudent: (id: string) => void;
  onGenerateRemark: (id: string) => void;
}

export function AssessmentTable({
  students,
  selectedSubjects,
  onUpdateStudent,
  onUpdateSubjectMark,
  onUpdateSubjectRating,
  onRemoveStudent,
  onGenerateRemark,
}: AssessmentTableProps) {
  const [showMarks, setShowMarks] = useState(true);

  return (
    <div className="card-elevated overflow-hidden">
      {/* Table Controls */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-heading font-semibold">Student Records</h3>
        <div className="flex items-center gap-2">
          <Label htmlFor="show-marks" className="text-sm text-muted-foreground">Ratings</Label>
          <Switch
            id="show-marks"
            checked={showMarks}
            onCheckedChange={setShowMarks}
          />
          <Label htmlFor="show-marks" className="text-sm text-muted-foreground">Marks</Label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="assessment-table">
          <thead>
            <tr>
              <th className="w-12 text-center">S.No</th>
              <th className="w-20 text-center">Roll</th>
              <th className="min-w-[150px]">Student Name</th>
              {selectedSubjects.map(subject => (
                <th key={subject} className="min-w-[90px] text-center">
                  {subject.length > 12 ? subject.substring(0, 10) + '...' : subject}
                </th>
              ))}
              <th className="w-24 text-center">Score</th>
              <th className="w-16 text-center">Mood</th>
              <th className="min-w-[250px]">AI Remarks</th>
              <th className="w-20 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                selectedSubjects={selectedSubjects}
                showMarks={showMarks}
                onUpdateSubjectMark={(subject, marks) => onUpdateSubjectMark(student.id, subject, marks)}
                onUpdateSubjectRating={(subject, rating) => onUpdateSubjectRating(student.id, subject, rating)}
                onUpdate={(updates) => onUpdateStudent(student.id, updates)}
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
          <p>No students added yet. Click "Add Student" or import from Excel to begin.</p>
        </div>
      )}
    </div>
  );
}
