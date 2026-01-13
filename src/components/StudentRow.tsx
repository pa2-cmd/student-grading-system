import { Student, SkillRating, getMaxPossibleScore } from '@/types/assessment';
import { SkillSelect } from './SkillSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Sparkles, Loader2, Pencil, Check, X } from 'lucide-react';
import { useState } from 'react';

interface StudentRowProps {
  student: Student;
  selectedSubjects: string[];
  onUpdateSubjectRating: (subject: string, value: SkillRating) => void;
  onUpdate: (field: keyof Student, value: any) => void;
  onRemove: () => void;
  onGenerateRemark: () => void;
  canRemove: boolean;
}

export function StudentRow({ 
  student, 
  selectedSubjects,
  onUpdateSubjectRating,
  onUpdate, 
  onRemove, 
  onGenerateRemark, 
  canRemove 
}: StudentRowProps) {
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [editedRemark, setEditedRemark] = useState(student.remark);

  // Calculate max score based on fields that have actual values (not unselected)
  const maxPossibleScore = getMaxPossibleScore(student.subjectRatings);
  const totalSelectedSubjects = selectedSubjects.length;
  const ratedSubjectsCount = Object.values(student.subjectRatings).filter(r => r !== undefined).length;
  
  // Show different display based on whether all subjects are rated
  const hasUnratedSubjects = ratedSubjectsCount < totalSelectedSubjects;
  
  const percentage = maxPossibleScore > 0 ? (student.total / maxPossibleScore) * 100 : 0;
  
  const getTotalClass = () => {
    if (hasUnratedSubjects) return 'text-muted-foreground'; // Incomplete
    if (percentage >= 80) return 'text-skill-good font-bold';
    if (percentage >= 50) return 'text-skill-average font-bold';
    return 'text-skill-needs font-bold';
  };

  const handleSaveRemark = () => {
    onUpdate('remark', editedRemark);
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

  return (
    <tr className="animate-fade-in hover:bg-muted/50 transition-colors">
      {/* Serial Number */}
      <td className="text-center font-medium">{student.serialNo}</td>
      
      {/* Roll Number */}
      <td>
        <Input
          value={student.rollNumber}
          onChange={(e) => onUpdate('rollNumber', e.target.value)}
          placeholder="Roll No"
          className="input-field w-full min-w-[80px]"
        />
      </td>
      
      {/* Student Name */}
      <td>
        <Input
          value={student.name}
          onChange={(e) => onUpdate('name', e.target.value)}
          placeholder="Enter student name"
          className="input-field w-full min-w-[150px]"
        />
      </td>
      
      {/* Dynamic Subject Columns - Pass undefined for unselected state */}
      {selectedSubjects.map(subject => (
        <td key={subject}>
          <SkillSelect
            value={student.subjectRatings?.[subject]}
            onChange={(value: SkillRating) => onUpdateSubjectRating(subject, value)}
          />
        </td>
      ))}
      
      {/* Total Score - Shows rated count if incomplete */}
      <td className={`text-center text-lg ${getTotalClass()}`}>
        {hasUnratedSubjects ? (
          <span title={`${ratedSubjectsCount}/${totalSelectedSubjects} subjects rated`}>
            {student.total}/{maxPossibleScore}
            <span className="text-xs block text-muted-foreground">({ratedSubjectsCount}/{totalSelectedSubjects})</span>
          </span>
        ) : (
          `${student.total}/${maxPossibleScore}`
        )}
      </td>
      
      {/* AI Remarks - Editable */}
      <td className="min-w-[280px]">
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
                  onClick={onGenerateRemark}
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
          onClick={onRemove}
          disabled={!canRemove}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
