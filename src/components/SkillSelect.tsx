import { SkillRating, SkillRatingOrUnselected, SKILL_OPTIONS, SKILL_VALUES } from '@/types/assessment';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SkillSelectProps {
  // Value can be undefined (unselected/blank state)
  value: SkillRatingOrUnselected;
  onChange: (value: SkillRating) => void;
  disabled?: boolean;
}

/**
 * Skill rating dropdown with support for unselected state
 * - Shows "Select" placeholder when value is undefined (blank/NA from Excel)
 * - All imported values are editable
 * - Unselected fields don't count toward totals
 */
export function SkillSelect({ value, onChange, disabled }: SkillSelectProps) {
  const getSkillClass = (skill: SkillRating | undefined) => {
    if (skill === undefined) {
      // Unselected state - neutral styling with visual distinction
      return 'text-muted-foreground bg-muted/50 border-dashed';
    }
    switch (skill) {
      case 'Good':
        return 'text-skill-good bg-skill-good-bg';
      case 'Average':
        return 'text-skill-average bg-skill-average-bg';
      case 'Needs Improvement':
        return 'text-skill-needs bg-skill-needs-bg';
      case 'NA':
        return 'text-muted-foreground bg-muted/50 border-dashed';
    }
  };

  // Use empty string for undefined to properly show placeholder
  const selectValue = value ?? '';

  return (
    <Select 
      value={selectValue} 
      onValueChange={(val) => onChange(val as SkillRating)} 
      disabled={disabled}
    >
      <SelectTrigger 
        className={`w-full min-w-[140px] text-xs font-medium ${getSkillClass(value)} ${!value ? 'border border-dashed' : 'border-none'}`}
      >
        <SelectValue placeholder="Select" />
      </SelectTrigger>
      <SelectContent className="bg-card border border-border shadow-lg z-50">
        {SKILL_OPTIONS.map((option) => (
          <SelectItem 
            key={option} 
            value={option}
            className={`text-xs font-medium cursor-pointer ${getSkillClass(option)} my-1 rounded-md`}
          >
            {option} {option !== 'NA' ? `(${SKILL_VALUES[option]})` : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
