import { Student, SkillRating } from '@/types/assessment';
import { SkillSelect } from './SkillSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Sparkles, Loader2 } from 'lucide-react';

interface StudentRowProps {
  student: Student;
  onUpdate: (field: keyof Student, value: any) => void;
  onRemove: () => void;
  onGenerateRemark: () => void;
  canRemove: boolean;
}

export function StudentRow({ student, onUpdate, onRemove, onGenerateRemark, canRemove }: StudentRowProps) {
  const getTotalClass = () => {
    if (student.total >= 8) return 'text-skill-good font-bold';
    if (student.total >= 5) return 'text-skill-average font-bold';
    return 'text-skill-needs font-bold';
  };

  return (
    <tr className="animate-fade-in hover:bg-muted/50 transition-colors">
      <td className="text-center font-medium">{student.serialNo}</td>
      <td>
        <Input
          value={student.name}
          onChange={(e) => onUpdate('name', e.target.value)}
          placeholder="Enter student name"
          className="input-field w-full min-w-[150px]"
        />
      </td>
      <td>
        <SkillSelect
          value={student.speakingListening}
          onChange={(value: SkillRating) => onUpdate('speakingListening', value)}
        />
      </td>
      <td>
        <SkillSelect
          value={student.writing}
          onChange={(value: SkillRating) => onUpdate('writing', value)}
        />
      </td>
      <td>
        <SkillSelect
          value={student.vocabulary}
          onChange={(value: SkillRating) => onUpdate('vocabulary', value)}
        />
      </td>
      <td>
        <SkillSelect
          value={student.grammar}
          onChange={(value: SkillRating) => onUpdate('grammar', value)}
        />
      </td>
      <td>
        <SkillSelect
          value={student.reading}
          onChange={(value: SkillRating) => onUpdate('reading', value)}
        />
      </td>
      <td className={`text-center text-lg ${getTotalClass()}`}>
        {student.total}/10
      </td>
      <td className="min-w-[250px]">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            {student.remark ? (
              <p className="text-sm text-foreground leading-relaxed">{student.remark}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Click generate to create AI remark</p>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onGenerateRemark}
            disabled={student.isGeneratingRemark || !student.name}
            className="shrink-0"
          >
            {student.isGeneratingRemark ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </Button>
        </div>
      </td>
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
