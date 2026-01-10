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
 * Non-repeating subject dropdown with Select.Item empty value crash fix
 * - Never renders SelectItem with empty value
 * - Uses internal non-empty IDs
 * - Filters invalid values before rendering
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

  // CRITICAL: Filter out any empty or invalid values - never render empty SelectItem
  const validSubjects = availableSubjects.filter(s => 
    s !== null && 
    s !== undefined && 
    typeof s === 'string' && 
    s.trim() !== ''
  );

  // Initialize with undefined, not empty string
  const selectValue = value && value.trim() !== '' ? value : undefined;

  return (
    <Select 
      value={selectValue} 
      onValueChange={(newValue) => {
        // Only call onChange with valid non-empty values
        if (newValue && newValue.trim() !== '') {
          onChange(newValue);
        }
      }}
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
            // NEVER use empty value - use subject name as value
            <SelectItem key={`subject-${subject}`} value={subject}>
              {subject}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
