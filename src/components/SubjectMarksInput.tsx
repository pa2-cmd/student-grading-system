import { SubjectMarksDetail } from '@/types/assessment';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SubjectMarksInputProps {
  subject: string;
  marks: SubjectMarksDetail;
  onUpdateMarks: (marks: SubjectMarksDetail) => void;
  compact?: boolean;
}

export function SubjectMarksInput({ 
  subject, 
  marks, 
  onUpdateMarks,
  compact = false 
}: SubjectMarksInputProps) {
  const handleTheoryChange = (value: number) => {
    const theory = Math.min(80, Math.max(0, value || 0));
    const total = theory + (marks.internal || 0);
    onUpdateMarks({ ...marks, theory, total });
  };

  const handleInternalChange = (value: number) => {
    const internal = Math.min(20, Math.max(0, value || 0));
    const total = (marks.theory || 0) + internal;
    onUpdateMarks({ ...marks, internal, total });
  };

  const total = (marks.theory || 0) + (marks.internal || 0);
  
  const getColorClass = () => {
    if (total >= 85) return 'bg-skill-good text-white';
    if (total >= 60) return 'bg-skill-average text-white';
    if (total >= 40) return 'bg-orange-500 text-white';
    return 'bg-skill-needs text-white';
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                max={80}
                value={marks.theory || ''}
                onChange={(e) => handleTheoryChange(parseInt(e.target.value))}
                className="input-field w-12 text-center text-xs px-1"
                placeholder="Th"
              />
              <span className="text-muted-foreground text-xs">+</span>
              <Input
                type="number"
                min={0}
                max={20}
                value={marks.internal || ''}
                onChange={(e) => handleInternalChange(parseInt(e.target.value))}
                className="input-field w-10 text-center text-xs px-1"
                placeholder="IA"
              />
              <span className="text-muted-foreground text-xs">=</span>
              <Badge className={`${getColorClass()} min-w-[36px] justify-center text-xs`}>
                {total}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-popover border">
            <p className="text-sm">{subject}</p>
            <p className="text-xs text-muted-foreground">
              Theory (80) + Internal (20) = {total}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2 rounded-lg bg-muted/30">
      <span className="text-xs font-medium text-muted-foreground truncate" title={subject}>
        {subject.length > 12 ? subject.slice(0, 10) + '...' : subject}
      </span>
      <div className="flex items-center gap-1">
        <div className="flex-1">
          <Input
            type="number"
            min={0}
            max={80}
            value={marks.theory || ''}
            onChange={(e) => handleTheoryChange(parseInt(e.target.value))}
            className="input-field w-full text-center text-sm h-8"
            placeholder="Theory"
          />
          <span className="text-[10px] text-muted-foreground text-center block">Th(80)</span>
        </div>
        <div className="flex-1">
          <Input
            type="number"
            min={0}
            max={20}
            value={marks.internal || ''}
            onChange={(e) => handleInternalChange(parseInt(e.target.value))}
            className="input-field w-full text-center text-sm h-8"
            placeholder="IA"
          />
          <span className="text-[10px] text-muted-foreground text-center block">IA(20)</span>
        </div>
        <div className="flex flex-col items-center">
          <Badge className={`${getColorClass()} h-8 min-w-[40px] flex items-center justify-center`}>
            {total}
          </Badge>
          <span className="text-[10px] text-muted-foreground">Total</span>
        </div>
      </div>
    </div>
  );
}
