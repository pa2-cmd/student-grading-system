import { Student, SkillRating, MOOD_EMOJIS, SubjectMarksDetail, createEmptySubjectMarksDetail, Term, getGradeFromPercentage } from '@/types/assessment';
import { SkillSelect } from './SkillSelect';
import { StudentPerformanceChart } from './StudentPerformanceChart';
import { SubjectMarksInput } from './SubjectMarksInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2, Sparkles, Loader2, Pencil, Check, X, ChevronDown, ChevronUp, FileDown } from 'lucide-react';
import { useState } from 'react';
import { exportStudentPDF } from '@/utils/individualPdfExport';
import { toast } from 'sonner';

interface StudentRowProps {
  student: Student;
  selectedSubjects: string[];
  showMarks: boolean;
  showDetailedMarks?: boolean;
  onUpdateSubjectMark: (subject: string, marks: number) => void;
  onUpdateSubjectRating: (subject: string, value: SkillRating) => void;
  onUpdateSubjectMarksDetail?: (subject: string, marks: SubjectMarksDetail) => void;
  onUpdate: (updates: Partial<Student>) => void;
  onRemove: () => void;
  onGenerateRemark: () => void;
  canRemove: boolean;
  schoolName?: string;
  className?: string;
  section?: string;
  term?: Term;
  totalStudents?: number;
  classPosition?: number;
}

export function StudentRow({ 
  student, 
  selectedSubjects,
  showMarks,
  showDetailedMarks = false,
  onUpdateSubjectMark,
  onUpdateSubjectRating,
  onUpdateSubjectMarksDetail,
  onUpdate, 
  onRemove, 
  onGenerateRemark, 
  canRemove,
  schoolName = '',
  className = '',
  section = '',
  term = 'Term 1',
  totalStudents = 1,
  classPosition = 1,
}: StudentRowProps) {
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [editedRemark, setEditedRemark] = useState(student.remark);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!student.name.trim()) {
      toast.error('Please enter student name first');
      return;
    }
    
    setIsDownloading(true);
    try {
      await exportStudentPDF({
        student: { ...student, classPosition },
        selectedSubjects,
        schoolName,
        className,
        section,
        term,
        totalStudents,
      });
      toast.success(`Report downloaded for ${student.name}`);
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  // Calculate grand total from detailed marks
  const grandTotal = selectedSubjects.reduce((sum, subject) => {
    const detail = student.subjectMarksDetail?.[subject];
    if (detail) {
      return sum + (detail.total || 0);
    }
    return sum + (student.subjectMarks?.[subject] || 0);
  }, 0);

  const maxTotal = selectedSubjects.length * 100;
  const percentage = maxTotal > 0 ? Math.round((grandTotal / maxTotal) * 100) : 0;
  
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
        {/* Serial Number - Read-only (sticky) */}
        <td className="text-center font-medium text-muted-foreground sticky left-0 bg-background z-10">
          {student.serialNo}
        </td>
        
        {/* Roll Number - Separate from Enrollment */}
        <td>
          <Input
            value={student.rollNumber || ''}
            onChange={(e) => onUpdate({ rollNumber: e.target.value })}
            placeholder="Roll"
            className="input-field w-full min-w-[60px] text-center font-mono text-sm"
          />
        </td>
        
        {/* Enrollment Number - Separate from Roll */}
        <td>
          <Input
            value={student.enrollmentNumber || ''}
            onChange={(e) => onUpdate({ enrollmentNumber: e.target.value })}
            placeholder="Enroll No"
            className="input-field w-full min-w-[90px] text-center font-mono text-sm"
          />
        </td>
        
        {/* Student Name (sticky) */}
        <td className="sticky left-12 bg-background z-10">
          <Input
            value={student.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Enter student name"
            className="input-field w-full min-w-[140px]"
          />
        </td>
        
        {/* Attendance */}
        <td className="text-center">
          {student.attendanceTotal > 0 ? (
            <Badge variant="outline" className="text-xs font-mono">
              {student.attendancePresent}/{student.attendanceTotal}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </td>
        
        {/* Subject Marks/Ratings */}
        {selectedSubjects.map(subject => (
          <td key={subject}>
            {showMarks ? (
              showDetailedMarks ? (
                <SubjectMarksInput
                  subject={subject}
                  marks={student.subjectMarksDetail?.[subject] || createEmptySubjectMarksDetail()}
                  onUpdateMarks={(marks) => onUpdateSubjectMarksDetail?.(subject, marks)}
                  compact={true}
                />
              ) : (
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={student.subjectMarks?.[subject] ?? ''}
                  onChange={(e) => onUpdateSubjectMark(subject, parseInt(e.target.value) || 0)}
                  placeholder="0-100"
                  className="input-field w-full min-w-[70px] text-center"
                />
              )
            ) : (
              <SkillSelect
                value={student.subjectRatings?.[subject] || 'Good'}
                onChange={(value: SkillRating) => onUpdateSubjectRating(subject, value)}
              />
            )}
          </td>
        ))}
        
        {/* Grand Total */}
        <td className="text-center font-bold text-lg">
          <Badge variant="outline" className="text-base">
            {grandTotal}/{maxTotal}
          </Badge>
        </td>

        {/* Percentage */}
        <td className={`text-center text-lg ${getPercentageClass()}`}>
          {percentage}%
        </td>

        {/* Class Rank */}
        <td className="text-center">
          <Badge variant={classPosition <= 3 ? 'default' : 'secondary'} className="text-sm">
            #{classPosition}
          </Badge>
        </td>

        {/* Mood Emoji */}
        <td className="text-center text-2xl">
          {MOOD_EMOJIS[student.moodRating]}
        </td>
        
        {/* Remarks - Wider Column with wrapping */}
        <td className="min-w-[400px] max-w-[500px]">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              {isEditingRemark ? (
                <Textarea
                  value={editedRemark}
                  onChange={(e) => setEditedRemark(e.target.value)}
                  className="min-h-[100px] text-sm resize-y"
                  placeholder="Enter detailed remark..."
                />
              ) : student.remark ? (
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">{student.remark}</p>
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
                    title="Generate Remark"
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
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {/* Download Individual Report Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownloadPDF}
              disabled={isDownloading || !student.name.trim()}
              className="h-7 w-7 p-0 text-primary hover:text-primary hover:bg-primary/10"
              title="Download PDF Report"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
            </Button>
            {/* Performance Chart Button */}
            <StudentPerformanceChart 
              student={student} 
              selectedSubjects={selectedSubjects}
            />
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
          <td colSpan={selectedSubjects.length + 10} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Attendance */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Attendance</h4>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min={0}
                    value={student.attendancePresent || ''}
                    onChange={(e) => onUpdate({ attendancePresent: parseInt(e.target.value) || 0 })}
                    placeholder="Present"
                    className="input-field w-20"
                  />
                  <span>/</span>
                  <Input
                    type="number"
                    min={0}
                    value={student.attendanceTotal || ''}
                    onChange={(e) => onUpdate({ attendanceTotal: parseInt(e.target.value) || 0 })}
                    placeholder="Total"
                    className="input-field w-20"
                  />
                  <Badge variant="secondary">
                    {student.attendancePercentage || 0}%
                  </Badge>
                </div>
              </div>
              
              {/* Teacher Notes */}
              <div className="space-y-2 md:col-span-2">
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
                  <div className="flex flex-wrap gap-1 mt-2">
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
