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
        const parsed = JSON.parse(saved);
        // Ensure selectedSubjects exists for backward compatibility
        if (!parsed.selectedSubjects) {
          parsed.selectedSubjects = [
            'Speaking & Listening Skills',
            'Writing Skills',
            'Vocabulary',
            'Grammar Usage',
            'Reading Comprehension',
          ];
        }
        return parsed;
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

  const updateSelectedSubjects = useCallback((subjects: string[]) => {
    setData(prev => {
      // Update all existing students to have ratings for new subjects
      const updatedStudents = prev.students.map(student => {
        const newRatings: Record<string, SkillRating> = {};
        subjects.forEach(subject => {
          newRatings[subject] = student.subjectRatings[subject] || 'Good';
        });
        return {
          ...student,
          subjectRatings: newRatings,
          total: calculateTotal(newRatings),
        };
      });
      
      return {
        ...prev,
        selectedSubjects: subjects,
        students: updatedStudents,
      };
    });
  }, []);

  const addStudent = useCallback(() => {
    setData(prev => ({
      ...prev,
      students: [...prev.students, createEmptyStudent(prev.students.length + 1, prev.selectedSubjects)],
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
        
        // Recalculate total if subject ratings changed
        if (field === 'subjectRatings') {
          updated.total = calculateTotal(updated.subjectRatings);
        }
        
        return updated;
      }),
    }));
  }, []);

  const updateSubjectRating = useCallback((studentId: string, subject: string, rating: SkillRating) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(student => {
        if (student.id !== studentId) return student;
        
        const newRatings = { ...student.subjectRatings, [subject]: rating };
        return {
          ...student,
          subjectRatings: newRatings,
          total: calculateTotal(newRatings),
        };
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

  const importStudents = useCallback((students: Student[]) => {
    setData(prev => ({
      ...prev,
      students: students,
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
        // Ensure selectedSubjects exists
        if (!imported.selectedSubjects) {
          imported.selectedSubjects = [
            'Speaking & Listening Skills',
            'Writing Skills',
            'Vocabulary',
            'Grammar Usage',
            'Reading Comprehension',
          ];
        }
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
    updateSelectedSubjects,
    addStudent,
    removeStudent,
    updateStudent,
    updateSubjectRating,
    updateStudentRemark,
    importStudents,
    resetAll,
    exportJSON,
    importJSON,
  };
}
