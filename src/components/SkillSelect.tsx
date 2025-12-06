import { SkillRating, SKILL_OPTIONS, SKILL_VALUES } from '@/types/assessment';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SkillSelectProps {
  value: SkillRating;
  onChange: (value: SkillRating) => void;
  disabled?: boolean;
}

export function SkillSelect({ value, onChange, disabled }: SkillSelectProps) {
  const getSkillClass = (skill: SkillRating) => {
    switch (skill) {
      case 'Good':
        return 'text-skill-good bg-skill-good-bg';
      case 'Average':
        return 'text-skill-average bg-skill-average-bg';
      case 'Needs Improvement':
        return 'text-skill-needs bg-skill-needs-bg';
    }
  };

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={`w-full min-w-[140px] text-xs font-medium ${getSkillClass(value)} border-none`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-card border border-border shadow-lg z-50">
        {SKILL_OPTIONS.map((option) => (
          <SelectItem 
            key={option} 
            value={option}
            className={`text-xs font-medium cursor-pointer ${getSkillClass(option)} my-1 rounded-md`}
          >
            {option} ({SKILL_VALUES[option]})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
