import { Student, SkillRating, SubjectMarksDetail, Term } from '@/types/assessment';
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
  onUpdateSubjectMarksDetail?: (studentId: string, subject: string, marks: SubjectMarksDetail) => void;
  onRemoveStudent: (id: string) => void;
  onGenerateRemark: (id: string) => void;
  schoolName?: string;
  className?: string;
  section?: string;
  term?: Term;
}

export function AssessmentTable({
  students,
  selectedSubjects,
  onUpdateStudent,
  onUpdateSubjectMark,
  onUpdateSubjectRating,
  onUpdateSubjectMarksDetail,
  onRemoveStudent,
  onGenerateRemark,
  schoolName = '',
  className = '',
  section = '',
  term = 'Term 1',
}: AssessmentTableProps) {
  const [showMarks, setShowMarks] = useState(true);
  const [showDetailedMarks, setShowDetailedMarks] = useState(false);

  return (
    <div className="card-elevated overflow-hidden">
      {/* Table Controls */}
      <div className="flex items-center justify-between p-4 border-b border-border flex-wrap gap-4">
        <h3 className="font-heading font-semibold">Student Records - {term}</h3>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Label htmlFor="show-marks" className="text-sm text-muted-foreground">Ratings</Label>
            <Switch
              id="show-marks"
              checked={showMarks}
              onCheckedChange={setShowMarks}
            />
            <Label htmlFor="show-marks" className="text-sm text-muted-foreground">Marks</Label>
          </div>
          {showMarks && (
            <div className="flex items-center gap-2">
              <Label htmlFor="detailed-marks" className="text-sm text-muted-foreground">Simple</Label>
              <Switch
                id="detailed-marks"
                checked={showDetailedMarks}
                onCheckedChange={setShowDetailedMarks}
              />
              <Label htmlFor="detailed-marks" className="text-sm text-muted-foreground">Theory+IA</Label>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="assessment-table">
          <thead>
            <tr>
              {/* EXACT HEADERS FROM SCHEMA - NON-NEGOTIABLE */}
              <th className="w-12 text-center sticky left-0 bg-background z-10">Sr. No.</th>
              <th className="w-24 text-center">Enrollment No.</th>
              <th className="min-w-[150px] sticky left-12 bg-background z-10">Name</th>
              <th className="w-16 text-center">Gender</th>
              {selectedSubjects.map(subject => (
                <th key={subject} className={`text-center ${showDetailedMarks ? 'min-w-[180px]' : 'min-w-[90px]'}`}>
                  <div className="flex flex-col items-center">
                    <span>{subject.length > 12 ? subject.substring(0, 10) + '...' : subject}</span>
                    {showDetailedMarks && (
                      <span className="text-xs text-muted-foreground font-normal">(Th+Or=100)</span>
                    )}
                  </div>
                </th>
              ))}
              <th className="w-28 text-center">Max Grand Total</th>
              <th className="w-32 text-center">Grand Total Obtained</th>
              <th className="w-20 text-center">% Marks</th>
              <th className="min-w-[400px]">Remarks</th>
              <th className="w-16 text-center">Grade</th>
              <th className="w-24 text-center">Attendance</th>
              <th className="w-28 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students
              .map((student, _, arr) => {
                // Calculate class position based on percentage
                const sortedByPercentage = [...arr]
                  .filter(s => s.name.trim())
                  .sort((a, b) => b.percentage - a.percentage);
                const position = sortedByPercentage.findIndex(s => s.id === student.id) + 1;
                return { student, position: position || arr.length };
              })
              .map(({ student, position }) => (
              <StudentRow
                key={student.id}
                student={student}
                selectedSubjects={selectedSubjects}
                showMarks={showMarks}
                showDetailedMarks={showDetailedMarks}
                onUpdateSubjectMark={(subject, marks) => onUpdateSubjectMark(student.id, subject, marks)}
                onUpdateSubjectRating={(subject, rating) => onUpdateSubjectRating(student.id, subject, rating)}
                onUpdateSubjectMarksDetail={(subject, marks) => onUpdateSubjectMarksDetail?.(student.id, subject, marks)}
                onUpdate={(updates) => onUpdateStudent(student.id, updates)}
                onRemove={() => onRemoveStudent(student.id)}
                onGenerateRemark={() => onGenerateRemark(student.id)}
                canRemove={students.length > 1}
                schoolName={schoolName}
                className={className}
                section={section}
                term={term}
                totalStudents={students.filter(s => s.name.trim()).length}
                classPosition={position}
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
