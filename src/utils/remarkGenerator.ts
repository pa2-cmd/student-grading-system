import { Student, SKILL_VALUES } from '@/types/assessment';

interface RemarkGeneratorParams {
  student: Student;
  language: 'english' | 'hindi';
  supabaseUrl?: string;
  supabaseKey?: string;
}

export async function generateRemark({ student, language, supabaseUrl, supabaseKey }: RemarkGeneratorParams): Promise<string> {
  // If no Supabase connection, use local generation
  if (!supabaseUrl || !supabaseKey) {
    return generateLocalRemark(student, language);
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-remark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        studentName: student.name,
        speakingListening: student.speakingListening,
        writing: student.writing,
        vocabulary: student.vocabulary,
        grammar: student.grammar,
        reading: student.reading,
        total: student.total,
        language,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate remark');
    }

    const data = await response.json();
    return data.remark;
  } catch (error) {
    console.error('AI generation failed, using local fallback:', error);
    return generateLocalRemark(student, language);
  }
}

function generateLocalRemark(student: Student, language: 'english' | 'hindi'): string {
  const skills = [
    { name: language === 'hindi' ? 'बोलना और सुनना' : 'speaking & listening', rating: student.speakingListening, value: SKILL_VALUES[student.speakingListening] },
    { name: language === 'hindi' ? 'लेखन' : 'writing', rating: student.writing, value: SKILL_VALUES[student.writing] },
    { name: language === 'hindi' ? 'शब्द भंडार' : 'vocabulary', rating: student.vocabulary, value: SKILL_VALUES[student.vocabulary] },
    { name: language === 'hindi' ? 'व्याकरण' : 'grammar', rating: student.grammar, value: SKILL_VALUES[student.grammar] },
    { name: language === 'hindi' ? 'पठन समझ' : 'reading comprehension', rating: student.reading, value: SKILL_VALUES[student.reading] },
  ];

  const strengths = skills.filter(s => s.value === 2).map(s => s.name);
  const averages = skills.filter(s => s.value === 1).map(s => s.name);
  const needsImprovement = skills.filter(s => s.value === 0).map(s => s.name);

  if (language === 'hindi') {
    return generateHindiRemark(student, strengths, averages, needsImprovement);
  }

  return generateEnglishRemark(student, strengths, averages, needsImprovement);
}

function generateEnglishRemark(
  student: Student,
  strengths: string[],
  averages: string[],
  needsImprovement: string[]
): string {
  const remarks: string[] = [];

  if (student.total >= 9) {
    remarks.push(`${student.name || 'The student'} demonstrates exceptional performance across all language skills.`);
  } else if (student.total >= 7) {
    remarks.push(`${student.name || 'The student'} shows strong overall performance in language skills.`);
  } else if (student.total >= 5) {
    remarks.push(`${student.name || 'The student'} demonstrates satisfactory progress in language development.`);
  } else {
    remarks.push(`${student.name || 'The student'} requires additional support in language skill development.`);
  }

  if (strengths.length > 0) {
    remarks.push(`Shows excellent ability in ${strengths.join(' and ')}.`);
  }

  if (averages.length > 0 && averages.length <= 2) {
    remarks.push(`Displays developing competence in ${averages.join(' and ')}.`);
  }

  if (needsImprovement.length > 0) {
    remarks.push(`Needs focused practice in ${needsImprovement.join(' and ')} to reach full potential.`);
  }

  if (student.total >= 8) {
    remarks.push('Keep up the excellent work!');
  } else if (student.total >= 5) {
    remarks.push('With continued effort, further improvement is expected.');
  } else {
    remarks.push('Regular practice and dedicated support will help improve performance.');
  }

  return remarks.join(' ');
}

function generateHindiRemark(
  student: Student,
  strengths: string[],
  averages: string[],
  needsImprovement: string[]
): string {
  const remarks: string[] = [];

  if (student.total >= 9) {
    remarks.push(`${student.name || 'छात्र'} सभी भाषा कौशलों में उत्कृष्ट प्रदर्शन दिखाता है।`);
  } else if (student.total >= 7) {
    remarks.push(`${student.name || 'छात्र'} भाषा कौशलों में अच्छा प्रदर्शन दिखाता है।`);
  } else if (student.total >= 5) {
    remarks.push(`${student.name || 'छात्र'} भाषा विकास में संतोषजनक प्रगति दिखाता है।`);
  } else {
    remarks.push(`${student.name || 'छात्र'} को भाषा कौशल विकास में अतिरिक्त सहायता की आवश्यकता है।`);
  }

  if (strengths.length > 0) {
    remarks.push(`${strengths.join(' और ')} में उत्कृष्ट क्षमता दिखाता है।`);
  }

  if (averages.length > 0 && averages.length <= 2) {
    remarks.push(`${averages.join(' और ')} में विकासशील योग्यता प्रदर्शित करता है।`);
  }

  if (needsImprovement.length > 0) {
    remarks.push(`पूर्ण क्षमता तक पहुंचने के लिए ${needsImprovement.join(' और ')} में अभ्यास की आवश्यकता है।`);
  }

  if (student.total >= 8) {
    remarks.push('इसी तरह बेहतरीन काम जारी रखें!');
  } else if (student.total >= 5) {
    remarks.push('निरंतर प्रयास से और सुधार की उम्मीद है।');
  } else {
    remarks.push('नियमित अभ्यास और समर्पित सहायता से प्रदर्शन में सुधार होगा।');
  }

  return remarks.join(' ');
}
