import { Student, SkillRating, getMaxPossibleScore, ENGLISH_SKILLS } from '@/types/assessment';
import { SkillSelect } from './SkillSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Sparkles, Loader2, Pencil, Check, X, FileText } from 'lucide-react';
import { useState } from 'react';

interface StudentRowProps {
  student: Student;
  onUpdateStudent: (id: string, field: keyof Student, value: any) => void;
  onUpdateSubjectRating: (studentId: string, subject: string, rating: SkillRating) => void;
  onRemoveStudent: (id: string) => void;
  onGenerateRemark: (id: string) => void;
  onExportStudentPDF?: (student: Student) => void;
}

export function StudentRow({ 
  student, 
  onUpdateStudent,
  onUpdateSubjectRating,
  onRemoveStudent, 
  onGenerateRemark, 
  onExportStudentPDF,
}: StudentRowProps) {
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [editedRemark, setEditedRemark] = useState(student.remark);

  // Calculate max score based on fields that have actual values (not unselected)
  const maxPossibleScore = getMaxPossibleScore(student.subjectRatings);
  const totalSkills = ENGLISH_SKILLS.length;
  const ratedSkillsCount = Object.values(student.subjectRatings).filter(r => r !== undefined).length;
  
  // Show different display based on whether all skills are rated
  const hasUnratedSkills = ratedSkillsCount < totalSkills;
  
  const percentage = maxPossibleScore > 0 ? (student.total / maxPossibleScore) * 100 : 0;
  
  const getTotalClass = () => {
    if (hasUnratedSkills) return 'text-muted-foreground'; // Incomplete
    if (percentage >= 80) return 'text-skill-good font-bold';
    if (percentage >= 50) return 'text-skill-average font-bold';
    return 'text-skill-needs font-bold';
  };

  const handleSaveRemark = () => {
    onUpdateStudent(student.id, 'remark', editedRemark);
    setIsEditingRemark(false);
  };

  const handleCancelEdit = () => {
    setEditedRemark(student.remark);
    setIsEditingRemark(false);
  };

  const handleStartEdit = () => {
    setEditedRemark(student.remark);
    setIsEditingRemark(true);
  };

  const canRemove = true; // Can always remove students

  return (
    <tr className="animate-fade-in hover:bg-muted/50 transition-colors">
      {/* Serial Number */}
      <td className="text-center font-medium">{student.serialNo}</td>
      
      {/* Roll Number */}
      <td>
        <Input
          value={student.rollNumber}
          onChange={(e) => onUpdateStudent(student.id, 'rollNumber', e.target.value)}
          placeholder="Roll No"
          className="input-field w-full min-w-[80px]"
        />
      </td>
      
      {/* Student Name */}
      <td>
        <Input
          value={student.name}
          onChange={(e) => onUpdateStudent(student.id, 'name', e.target.value)}
          placeholder="Enter student name"
          className="input-field w-full min-w-[150px]"
        />
      </td>
      
      {/* English Skills Columns */}
      {ENGLISH_SKILLS.map(skill => (
        <td key={skill}>
          <SkillSelect
            value={student.subjectRatings?.[skill]}
            onChange={(value: SkillRating) => onUpdateSubjectRating(student.id, skill, value)}
          />
        </td>
      ))}
      
      {/* Total Score - Shows rated count if incomplete */}
      <td className={`text-center text-lg ${getTotalClass()}`}>
        {hasUnratedSkills ? (
          <span title={`${ratedSkillsCount}/${totalSkills} skills rated`}>
            {student.total}/{maxPossibleScore}
            <span className="text-xs block text-muted-foreground">({ratedSkillsCount}/{totalSkills})</span>
          </span>
        ) : (
          `${student.total}/${maxPossibleScore}`
        )}
      </td>
      
      {/* AI Remarks - Editable */}
      <td className="min-w-[420px]">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            {isEditingRemark ? (
              <Textarea
                value={editedRemark}
                onChange={(e) => setEditedRemark(e.target.value)}
                className="min-h-[80px] text-sm"
                placeholder="Enter remark..."
              />
            ) : student.remark ? (
              <p className="text-sm text-foreground leading-relaxed">{student.remark}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Click generate to create AI remark</p>
            )}
          </div>
          
          <div className="flex flex-col gap-1 shrink-0">
            {isEditingRemark ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveRemark}
                  className="h-8 w-8 p-0"
                >
                  <Check className="h-4 w-4 text-skill-good" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onGenerateRemark(student.id)}
                  disabled={student.isGeneratingRemark || !student.name}
                  title="Generate AI Remark"
                  className="h-8 w-8 p-0"
                >
                  {student.isGeneratingRemark ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
                {student.remark && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStartEdit}
                    title="Edit Remark"
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {onExportStudentPDF && student.name && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onExportStudentPDF(student)}
                    title="Export Student PDF"
                    className="h-8 w-8 p-0"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </td>
      
      {/* Delete Action */}
      <td className="text-center">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemoveStudent(student.id)}
          disabled={!canRemove}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}