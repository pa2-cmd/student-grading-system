import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_SUBJECTS } from '@/types/assessment';

interface SubjectDropdownProps {
  value: string;
  onChange: (subject: string) => void;
  usedSubjects: string[];
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Non-repeating subject dropdown
 * Once a subject is selected in one column, it's removed from other dropdowns
 */
export function SubjectDropdown({
  value,
  onChange,
  usedSubjects,
  placeholder = 'Select subject',
  disabled = false,
}: SubjectDropdownProps) {
  // Available subjects = all subjects minus used ones (except current value)
  const availableSubjects = DEFAULT_SUBJECTS.filter(
    subject => !usedSubjects.includes(subject) || subject === value
  );

  // Filter out any empty or invalid values
  const validSubjects = availableSubjects.filter(s => s && s.trim() !== '');

  return (
    <Select 
      value={value || undefined} 
      onValueChange={onChange} 
      disabled={disabled}
    >
      <SelectTrigger className="w-full min-w-[120px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-popover border border-border z-50 max-h-[200px]">
        {validSubjects.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No subjects available
          </div>
        ) : (
          validSubjects.map((subject) => (
            <SelectItem key={subject} value={subject}>
              {subject}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
