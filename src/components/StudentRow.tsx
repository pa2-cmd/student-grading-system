import { Student, SkillRating, SKILL_OPTIONS, MOOD_EMOJIS, LEARNING_SKILLS } from '@/types/assessment';
import { SkillSelect } from './SkillSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Sparkles, Loader2, Pencil, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface StudentRowProps {
  student: Student;
  selectedSubjects: string[];
  showMarks: boolean;
  onUpdateSubjectMark: (subject: string, marks: number) => void;
  onUpdateSubjectRating: (subject: string, value: SkillRating) => void;
  onUpdate: (updates: Partial<Student>) => void;
  onRemove: () => void;
  onGenerateRemark: () => void;
  canRemove: boolean;
}

export function StudentRow({ 
  student, 
  selectedSubjects,
  showMarks,
  onUpdateSubjectMark,
  onUpdateSubjectRating,
  onUpdate, 
  onRemove, 
  onGenerateRemark, 
  canRemove 
}: StudentRowProps) {
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [editedRemark, setEditedRemark] = useState(student.remark);
  const [isExpanded, setIsExpanded] = useState(false);

  const maxScore = selectedSubjects.length * 4;
  const percentage = student.percentage || 0;
  
  const getPercentageClass = () => {
    if (percentage >= 80) return 'text-skill-good font-bold';
    if (percentage >= 60) return 'text-skill-average font-bold';
    if (percentage >= 40) return 'text-orange-500 font-bold';
    return 'text-skill-needs font-bold';
  };

  const handleSaveRemark = () => {
    onUpdate({ remark: editedRemark });
    setIsEditingRemark(false);
  };

  const handleCancelEdit = () => {
    setEditedRemark(student.remark);
    setIsEditingRemark(false);
  };

  return (
    <>
      <tr className="animate-fade-in hover:bg-muted/50 transition-colors">
        {/* Serial Number - Read-only (from Excel) */}
        <td className="text-center font-medium text-muted-foreground">
          {student.serialNo}
        </td>
        
        {/* Enrollment Number - Editable */}
        <td>
          <Input
            value={student.enrollmentNumber || ''}
            onChange={(e) => onUpdate({ enrollmentNumber: e.target.value })}
            placeholder="ENR-001"
            className="input-field w-full min-w-[90px] text-center font-mono text-sm"
          />
        </td>
        
        {/* Roll Number */}
        <td>
          <Input
            value={student.rollNumber}
            onChange={(e) => onUpdate({ rollNumber: e.target.value })}
            placeholder="Roll"
            className="input-field w-full min-w-[60px] text-center"
          />
        </td>
        
        {/* Student Name */}
        <td>
          <Input
            value={student.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Enter student name"
            className="input-field w-full min-w-[140px]"
          />
        </td>
        
        {/* Subject Marks/Ratings */}
        {selectedSubjects.map(subject => (
          <td key={subject}>
            {showMarks ? (
              <Input
                type="number"
                min={0}
                max={100}
                value={student.subjectMarks?.[subject] ?? ''}
                onChange={(e) => onUpdateSubjectMark(subject, parseInt(e.target.value) || 0)}
                placeholder="0-100"
                className="input-field w-full min-w-[70px] text-center"
              />
            ) : (
              <SkillSelect
                value={student.subjectRatings?.[subject] || 'Good'}
                onChange={(value: SkillRating) => onUpdateSubjectRating(subject, value)}
              />
            )}
          </td>
        ))}
        
        {/* Percentage/Total */}
        <td className={`text-center text-lg ${getPercentageClass()}`}>
          {percentage}%
          <span className="text-xs text-muted-foreground ml-1 font-normal">
            ({student.total}/{maxScore})
          </span>
        </td>

        {/* Mood Emoji */}
        <td className="text-center text-2xl">
          {MOOD_EMOJIS[student.moodRating]}
        </td>
        
        {/* AI Remarks - Editable */}
        <td className="min-w-[250px]">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              {isEditingRemark ? (
                <Textarea
                  value={editedRemark}
                  onChange={(e) => setEditedRemark(e.target.value)}
                  className="min-h-[60px] text-sm"
                  placeholder="Enter remark..."
                />
              ) : student.remark ? (
                <p className="text-sm text-foreground leading-relaxed line-clamp-3">{student.remark}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Click ✨ to generate</p>
              )}
            </div>
            
            <div className="flex flex-col gap-1 shrink-0">
              {isEditingRemark ? (
                <>
                  <Button size="sm" variant="outline" onClick={handleSaveRemark} className="h-7 w-7 p-0">
                    <Check className="h-3 w-3 text-skill-good" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-7 w-7 p-0">
                    <X className="h-3 w-3 text-destructive" />
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
                    className="h-7 w-7 p-0"
                  >
                    {student.isGeneratingRemark ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                  </Button>
                  {student.remark && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditedRemark(student.remark); setIsEditingRemark(true); }}
                      title="Edit Remark"
                      className="h-7 w-7 p-0"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </td>
        
        {/* Actions */}
        <td className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 w-7 p-0"
              title="Expand details"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onRemove}
              disabled={!canRemove}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
      
      {/* Expanded Details Row */}
      {isExpanded && (
        <tr className="bg-muted/30">
          <td colSpan={selectedSubjects.length + 7} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Attendance */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Attendance</h4>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={student.attendancePresent || ''}
                    onChange={(e) => onUpdate({ attendancePresent: parseInt(e.target.value) || 0 })}
                    placeholder="Present"
                    className="input-field w-20"
                  />
                  <span className="self-center">/</span>
                  <Input
                    type="number"
                    min={0}
                    value={student.attendanceTotal || ''}
                    onChange={(e) => onUpdate({ attendanceTotal: parseInt(e.target.value) || 0 })}
                    placeholder="Total"
                    className="input-field w-20"
                  />
                  <Badge variant="secondary" className="self-center">
                    {student.attendancePercentage || 0}%
                  </Badge>
                </div>
              </div>
              
              {/* Teacher Notes */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Teacher Notes / Behavior</h4>
                <Textarea
                  value={student.teacherNotes || ''}
                  onChange={(e) => onUpdate({ teacherNotes: e.target.value })}
                  placeholder="Add your personal notes about this student..."
                  className="min-h-[60px] text-sm"
                />
              </div>
              
              {/* Strengths & Improvements */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Analysis</h4>
                {student.strengths?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {student.strengths.map((s, i) => (
                      <Badge key={i} className="bg-skill-good-bg text-skill-good text-xs">{s}</Badge>
                    ))}
                  </div>
                )}
                {student.improvements?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {student.improvements.map((s, i) => (
                      <Badge key={i} className="bg-skill-needs-bg text-skill-needs text-xs">{s}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
