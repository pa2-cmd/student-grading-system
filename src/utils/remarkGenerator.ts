import { Student, SKILL_VALUES, getMaxPossibleScore, ENGLISH_SKILLS } from '@/types/assessment';

interface RemarkGeneratorParams {
  student: Student;
  language: 'english' | 'hindi';
}

const ENGLISH = {
  openers: {
    strong: [
      'shows confident progress in English',
      'demonstrates excellent English language skills',
      'is performing with consistency in English',
    ],
    steady: [
      'is making steady progress in English',
      'is building English skills step by step',
      'shows a positive learning attitude toward English',
    ],
    support: [
      'is learning English with determination',
      'is working hard and needs more guidance in English',
      'is developing English skills and will benefit from focused practice',
    ],
  },
  closings: [
    'Keep practising regularly and you will see quick improvement.',
    'With consistent effort, excellent progress is expected.',
    'Continue the good work and stay confident.',
  ],
  connectors: {
    strengths: ['Strong areas include', 'The student does well in', 'Key strengths are'],
    developing: ['Developing well in', 'Making progress in', 'Showing improvement in'],
    focus: ['Needs more practice in', 'Should focus more on', 'Would benefit from extra practice in'],
    unrated: ['Some skills are not yet recorded:', 'Ratings are pending for:', 'Not assessed yet:'],
  },
};

const HINDI = {
  openers: {
    strong: ['अंग्रेजी में बहुत अच्छी प्रगति कर रहे हैं', 'अंग्रेजी कौशल में मजबूत पकड़ दिखाते हैं', 'अंग्रेजी में निरंतर अच्छा प्रदर्शन कर रहे हैं'],
    steady: ['अंग्रेजी में निरंतर प्रगति कर रहे हैं', 'धीरे-धीरे अंग्रेजी कौशल मजबूत कर रहे हैं', 'अंग्रेजी सीखने में सकारात्मक रवैया दिखाते हैं'],
    support: ['अंग्रेजी में मेहनत कर रहे हैं और थोड़ा मार्गदर्शन चाहिए', 'ध्यानपूर्वक अभ्यास से अंग्रेजी में सुधार होगा', 'केंद्रित अभ्यास से अंग्रेजी में काफी लाभ होगा'],
  },
  closings: ['नियमित अभ्यास जारी रखें, निश्चित ही सुधार होगा।', 'लगातार मेहनत से बहुत अच्छी प्रगति होगी।', 'इसी तरह प्रयास करते रहें।'],
  connectors: {
    strengths: ['मजबूत पक्ष हैं', 'इन क्षेत्रों में अच्छा हैं', 'मुख्य ताकतें हैं'],
    developing: ['इनमें प्रगति दिख रही है', 'इनमें सुधार हो रहा है', 'इन क्षेत्रों में अच्छा विकास है'],
    focus: ['इन पर अधिक अभ्यास की आवश्यकता है', 'इन पर अधिक ध्यान दें', 'इनमें अतिरिक्त अभ्यास से लाभ होगा'],
    unrated: ['कुछ कौशल अभी दर्ज नहीं हैं:', 'इनके लिए रेटिंग लंबित है:', 'अभी आकलन नहीं हुआ:'],
  },
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function joinList(items: string[], language: 'english' | 'hindi'): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return language === 'hindi' ? `${items[0]} और ${items[1]}` : `${items[0]} and ${items[1]}`;
  const last = items[items.length - 1];
  const rest = items.slice(0, -1).join(', ');
  return language === 'hindi' ? `${rest} और ${last}` : `${rest}, and ${last}`;
}

function displaySkill(skill: string, language: 'english' | 'hindi'): string {
  const hindiNames: Record<string, string> = {
    'Speaking & Listening Skills': 'बोलना और सुनना',
    'Writing Skills': 'लेखन कौशल',
    'Vocabulary': 'शब्द भंडार',
    'Grammar Usage': 'व्याकरण',
    'Reading Comprehension': 'पठन समझ',
  };

  if (language === 'hindi') return hindiNames[skill] || skill;
  return skill.replace(' Skills', '').replace(' Usage', '');
}

export async function generateRemark({ student, language }: RemarkGeneratorParams): Promise<string> {
  // Small delay for a natural feel
  await new Promise((resolve) => setTimeout(resolve, 250));
  return generateTeacherLikeRemark(student, language);
}

function generateTeacherLikeRemark(student: Student, language: 'english' | 'hindi'): string {
  const dict = language === 'hindi' ? HINDI : ENGLISH;
  const name = student.name?.trim() || (language === 'hindi' ? 'छात्र/छात्रा' : 'The student');

  const rated = ENGLISH_SKILLS.map((skill) => {
    const rating = student.subjectRatings?.[skill];
    return {
      skill,
      label: displaySkill(skill, language),
      rating,
      value: rating === undefined ? undefined : SKILL_VALUES[rating],
    };
  });

  const strengths = rated.filter((s) => s.value === 2).map((s) => s.label);
  const developing = rated.filter((s) => s.value === 1).map((s) => s.label);
  const focus = rated.filter((s) => s.value === 0).map((s) => s.label);
  const unrated = rated.filter((s) => s.value === undefined).map((s) => s.label);

  const maxScore = getMaxPossibleScore(student.subjectRatings);
  const percentage = maxScore > 0 ? (student.total / maxScore) * 100 : 0;

  const openerBucket = percentage >= 80 ? 'strong' : percentage >= 55 ? 'steady' : 'support';

  const parts: string[] = [];
  parts.push(`${name} ${pick(dict.openers[openerBucket])}.`);

  // Strengths (prioritize 1-3 skills)
  if (strengths.length > 0) {
    parts.push(`${pick(dict.connectors.strengths)} ${joinList(strengths.slice(0, 3), language)}.`);
  }

  // Developing
  if (developing.length > 0) {
    parts.push(`${pick(dict.connectors.developing)} ${joinList(developing.slice(0, 2), language)}.`);
  }

  // Focus areas (be specific)
  if (focus.length > 0) {
    parts.push(`${pick(dict.connectors.focus)} ${joinList(focus.slice(0, 2), language)}.`);
  }

  // Unrated note (do not assume)
  if (unrated.length > 0) {
    parts.push(`${pick(dict.connectors.unrated)} ${joinList(unrated, language)}.`);
  }

  parts.push(pick(dict.closings));

  return parts.join(' ');
}

// ============================================================
// CLASS-LEVEL AI INSIGHTS
// ============================================================

export function generateClassInsights(
  skillAverages: Record<string, number>,
  distribution: { high: number; average: number; low: number },
  totalStudents: number,
  language: 'english' | 'hindi'
): string {
  if (totalStudents === 0) {
    return language === 'hindi' 
      ? 'कक्षा में कोई छात्र डेटा उपलब्ध नहीं है।' 
      : 'No student data available for class analysis.';
  }

  const sortedSkills = Object.entries(skillAverages)
    .filter(([_, avg]) => avg > 0)
    .sort((a, b) => b[1] - a[1]);

  const strongSkills = sortedSkills.filter(([_, avg]) => avg >= 75).map(([skill]) => displaySkill(skill, language));
  const weakSkills = sortedSkills.filter(([_, avg]) => avg < 60).map(([skill]) => displaySkill(skill, language));

  const parts: string[] = [];

  if (language === 'hindi') {
    parts.push(`कक्षा में कुल ${totalStudents} छात्रों का आकलन किया गया।`);
    
    if (strongSkills.length > 0) {
      parts.push(`कक्षा की मुख्य ताकतें: ${joinList(strongSkills, language)}।`);
    }
    
    if (weakSkills.length > 0) {
      parts.push(`इन क्षेत्रों में अतिरिक्त ध्यान की आवश्यकता है: ${joinList(weakSkills, language)}।`);
    }
    
    parts.push(`प्रदर्शन वितरण: ${distribution.high} छात्र उत्कृष्ट (80%+), ${distribution.average} छात्र औसत (55-79%), ${distribution.low} छात्र सुधार की आवश्यकता (<55%)।`);
  } else {
    parts.push(`Class assessment covers ${totalStudents} students.`);
    
    if (strongSkills.length > 0) {
      parts.push(`Class strengths: ${joinList(strongSkills, language)}.`);
    }
    
    if (weakSkills.length > 0) {
      parts.push(`Areas needing attention: ${joinList(weakSkills, language)}.`);
    }
    
    parts.push(`Performance distribution: ${distribution.high} students performing excellently (80%+), ${distribution.average} students at average level (55-79%), ${distribution.low} students need improvement (<55%).`);
  }

  return parts.join(' ');
}
