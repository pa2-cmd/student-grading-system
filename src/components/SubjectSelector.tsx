import { useState } from 'react';
import { DEFAULT_SUBJECTS } from '@/types/assessment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X, GripVertical } from 'lucide-react';

interface SubjectSelectorProps {
  selectedSubjects: string[];
  onUpdateSubjects: (subjects: string[]) => void;
}

export function SubjectSelector({ selectedSubjects, onUpdateSubjects }: SubjectSelectorProps) {
  const [isAdding, setIsAdding] = useState(false);

  // Get available subjects (not already selected)
  const availableSubjects = DEFAULT_SUBJECTS.filter(
    subject => !selectedSubjects.includes(subject)
  );

  const handleAddSubject = (subject: string) => {
    if (subject && !selectedSubjects.includes(subject)) {
      onUpdateSubjects([...selectedSubjects, subject]);
      setIsAdding(false);
    }
  };

  const handleRemoveSubject = (subject: string) => {
    if (selectedSubjects.length > 1) {
      onUpdateSubjects(selectedSubjects.filter(s => s !== subject));
    }
  };

  const handleMoveSubject = (index: number, direction: 'up' | 'down') => {
    const newSubjects = [...selectedSubjects];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < newSubjects.length) {
      [newSubjects[index], newSubjects[newIndex]] = [newSubjects[newIndex], newSubjects[index]];
      onUpdateSubjects(newSubjects);
    }
  };

  return (
    <div className="card-elevated mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-semibold text-foreground">Assessment Subjects</h3>
          <p className="text-sm text-muted-foreground">
            Select and arrange subjects for assessment. Each subject uses Good (2), Average (1), Needs Improvement (0) scoring.
          </p>
        </div>
        
        {availableSubjects.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="gap-2"
            disabled={isAdding}
          >
            <Plus className="h-4 w-4" />
            Add Subject
          </Button>
        )}
      </div>

      {/* Selected subjects list */}
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedSubjects.map((subject, index) => (
          <Badge
            key={subject}
            variant="secondary"
            className="py-2 px-3 text-sm flex items-center gap-2 bg-primary/10 text-primary border border-primary/20"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground cursor-move" />
            <span>{subject.replace(' Skills', '').replace(' Usage', '')}</span>
            {selectedSubjects.length > 1 && (
              <button
                onClick={() => handleRemoveSubject(subject)}
                className="ml-1 hover:text-destructive transition-colors"
                title="Remove subject"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>

      {/* Add subject dropdown */}
      {isAdding && availableSubjects.length > 0 && (
        <div className="flex items-center gap-2">
          <Select onValueChange={handleAddSubject}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a subject to add..." />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              {availableSubjects.map(subject => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsAdding(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      {availableSubjects.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          All available subjects have been added.
        </p>
      )}
    </div>
  );
}
