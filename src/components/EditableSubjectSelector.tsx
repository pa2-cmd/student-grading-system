import { useState } from 'react';
import { DEFAULT_SUBJECTS } from '@/types/assessment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, X, Pencil, GripVertical, Check, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditableSubjectSelectorProps {
  selectedSubjects: string[];
  onUpdateSubjects: (subjects: string[]) => void;
}

export function EditableSubjectSelector({ selectedSubjects, onUpdateSubjects }: EditableSubjectSelectorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedName, setEditedName] = useState('');

  // Get available subjects from default list (not already selected)
  const availableSubjects = DEFAULT_SUBJECTS.filter(
    subject => !selectedSubjects.includes(subject)
  );

  const handleAddSubject = (subject: string) => {
    if (subject && !selectedSubjects.includes(subject)) {
      onUpdateSubjects([...selectedSubjects, subject]);
      setIsAdding(false);
      setCustomSubject('');
      toast.success(`Added "${subject}"`);
    }
  };

  const handleAddCustomSubject = () => {
    const trimmed = customSubject.trim();
    if (!trimmed) {
      toast.error('Please enter a subject name');
      return;
    }
    if (selectedSubjects.includes(trimmed)) {
      toast.error('This subject already exists');
      return;
    }
    handleAddSubject(trimmed);
  };

  const handleRemoveSubject = (subject: string) => {
    if (selectedSubjects.length > 1) {
      onUpdateSubjects(selectedSubjects.filter(s => s !== subject));
      toast.success(`Removed "${subject}"`);
    } else {
      toast.error('At least one subject is required');
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditedName(selectedSubjects[index]);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    
    const trimmed = editedName.trim();
    if (!trimmed) {
      toast.error('Subject name cannot be empty');
      return;
    }
    
    // Check for duplicates (excluding current)
    const otherSubjects = selectedSubjects.filter((_, i) => i !== editingIndex);
    if (otherSubjects.includes(trimmed)) {
      toast.error('This subject name already exists');
      return;
    }
    
    const newSubjects = [...selectedSubjects];
    const oldName = newSubjects[editingIndex];
    newSubjects[editingIndex] = trimmed;
    onUpdateSubjects(newSubjects);
    setEditingIndex(null);
    setEditedName('');
    toast.success(`Renamed "${oldName}" to "${trimmed}"`);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedName('');
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
          <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Assessment Subjects
          </h3>
          <p className="text-sm text-muted-foreground">
            Click to edit, drag to reorder. Add custom subjects as needed.
          </p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-background">
            <DialogHeader>
              <DialogTitle>Add Subject</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {availableSubjects.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Select from list:</p>
                  <Select onValueChange={handleAddSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a subject..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border z-50">
                      {availableSubjects.map(subject => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Add custom subject:</p>
                <div className="flex gap-2">
                  <Input
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="e.g., Moral Science, Drawing"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSubject()}
                  />
                  <Button onClick={handleAddCustomSubject} disabled={!customSubject.trim()}>
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selected subjects list */}
      <div className="flex flex-wrap gap-2">
        {selectedSubjects.map((subject, index) => (
          <div key={`${subject}-${index}`}>
            {editingIndex === index ? (
              <div className="flex items-center gap-1 bg-primary/10 border border-primary/30 rounded-lg px-2 py-1">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="h-7 w-32 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleSaveEdit}>
                  <Check className="h-3 w-3 text-green-600" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCancelEdit}>
                  <X className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ) : (
              <Badge
                variant="secondary"
                className="py-2 px-3 text-sm flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
              >
                <GripVertical className="h-3 w-3 text-muted-foreground cursor-move" />
                <span onClick={() => handleStartEdit(index)} className="hover:underline">
                  {subject.replace(' Skills', '').replace(' Usage', '')}
                </span>
                <button
                  onClick={() => handleStartEdit(index)}
                  className="ml-1 hover:text-primary/80 transition-colors"
                  title="Edit subject name"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                {selectedSubjects.length > 1 && (
                  <button
                    onClick={() => handleRemoveSubject(subject)}
                    className="hover:text-destructive transition-colors"
                    title="Remove subject"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            )}
          </div>
        ))}
      </div>

      {selectedSubjects.length === 0 && (
        <p className="text-sm text-muted-foreground italic mt-2">
          No subjects selected. Add at least one subject.
        </p>
      )}
    </div>
  );
}
