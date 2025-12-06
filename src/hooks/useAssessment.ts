import { useState, useEffect, useCallback } from 'react';
import { 
  AssessmentData, 
  Student, 
  SkillRating, 
  calculateTotal, 
  createEmptyStudent, 
  getDefaultAssessmentData,
  SKILL_VALUES 
} from '@/types/assessment';

const STORAGE_KEY = 'assessment-data';

export function useAssessment() {
  const [data, setData] = useState<AssessmentData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return getDefaultAssessmentData();
      }
    }
    return getDefaultAssessmentData();
  });

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const updateSchoolInfo = useCallback((field: 'schoolName' | 'className' | 'totalStrength', value: string | number) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleLanguage = useCallback(() => {
    setData(prev => ({
      ...prev,
      language: prev.language === 'english' ? 'hindi' : 'english',
    }));
  }, []);

  const addStudent = useCallback(() => {
    setData(prev => ({
      ...prev,
      students: [...prev.students, createEmptyStudent(prev.students.length + 1)],
    }));
  }, []);

  const removeStudent = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      students: prev.students
        .filter(s => s.id !== id)
        .map((s, index) => ({ ...s, serialNo: index + 1 })),
    }));
  }, []);

  const updateStudent = useCallback((id: string, field: keyof Student, value: any) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(student => {
        if (student.id !== id) return student;
        
        const updated = { ...student, [field]: value };
        
        // Recalculate total if a skill field changed
        if (['speakingListening', 'writing', 'vocabulary', 'grammar', 'reading'].includes(field)) {
          updated.total = calculateTotal(updated);
        }
        
        return updated;
      }),
    }));
  }, []);

  const updateStudentRemark = useCallback((id: string, remark: string, isGenerating: boolean = false) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(student => 
        student.id === id 
          ? { ...student, remark, isGeneratingRemark: isGenerating }
          : student
      ),
    }));
  }, []);

  const resetAll = useCallback(() => {
    setData(getDefaultAssessmentData());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const importJSON = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setData(imported);
      } catch (error) {
        console.error('Failed to import JSON:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  return {
    data,
    updateSchoolInfo,
    toggleLanguage,
    addStudent,
    removeStudent,
    updateStudent,
    updateStudentRemark,
    resetAll,
    exportJSON,
    importJSON,
  };
}
