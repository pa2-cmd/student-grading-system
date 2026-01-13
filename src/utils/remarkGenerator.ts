import { Student, SKILL_VALUES, getMaxPossibleScore } from '@/types/assessment';

interface RemarkGeneratorParams {
  student: Student;
  language: 'english' | 'hindi';
  selectedSubjects: string[];
}

const ENGLISH = {
  openers: {
    strong: [
      'shows confident progress',
      'is performing with consistency',
      'demonstrates a strong grasp of key skills',
    ],
    steady: [
      'is making steady progress',
      'is building skills step by step',
      'shows a positive learning attitude',
    ],
    support: [
      'is learning with determination',
      'is working hard and needs a little more guidance',
      'is developing and will benefit from focused practice',
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
    strong: ['बहुत अच्छी प्रगति कर रहे हैं', 'कौशल में मजबूत पकड़ दिखाते हैं', 'निरंतर अच्छा प्रदर्शन कर रहे हैं'],
    steady: ['निरंतर प्रगति कर रहे हैं', 'धीरे-धीरे कौशल मजबूत कर रहे हैं', 'सीखने में सकारात्मक रवैया दिखाते हैं'],
    support: ['मेहनत कर रहे हैं और थोड़ा मार्गदर्शन चाहिए', 'ध्यानपूर्वक अभ्यास से सुधार होगा', 'केंद्रित अभ्यास से काफी लाभ होगा'],
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

function displaySubject(subject: string, language: 'english' | 'hindi'): string {
  const hindiNames: Record<string, string> = {
    'Speaking & Listening Skills': 'बोलना और सुनना',
    'Writing Skills': 'लेखन कौशल',
    'Vocabulary': 'शब्द भंडार',
    'Grammar Usage': 'व्याकरण',
    'Reading Comprehension': 'पठन समझ',
    'Mathematics': 'गणित',
    'Science': 'विज्ञान',
    'Social Studies': 'सामाजिक अध्ययन',
    'Art & Craft': 'कला एवं शिल्प',
    'Physical Education': 'शारीरिक शिक्षा',
    'Music': 'संगीत',
    'Computer Science': 'कंप्यूटर विज्ञान',
  };

  if (language === 'hindi') return hindiNames[subject] || subject;
  return subject.replace(' Skills', '').replace(' Usage', '');
}

export async function generateRemark({ student, language, selectedSubjects }: RemarkGeneratorParams): Promise<string> {
  // Small delay for a natural feel
  await new Promise((resolve) => setTimeout(resolve, 250));
  return generateTeacherLikeRemark(student, language, selectedSubjects);
}

function generateTeacherLikeRemark(student: Student, language: 'english' | 'hindi', selectedSubjects: string[]): string {
  const dict = language === 'hindi' ? HINDI : ENGLISH;
  const name = student.name?.trim() || (language === 'hindi' ? 'छात्र/छात्रा' : 'The student');

  const rated = selectedSubjects
    .map((subject) => {
      const rating = student.subjectRatings?.[subject];
      return {
        subject,
        label: displaySubject(subject, language),
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
    parts.push(`${dict.connectors.strengths} ${joinList(strengths.slice(0, 3), language)}.`);
  }

  // Developing
  if (developing.length > 0) {
    parts.push(`${dict.connectors.developing} ${joinList(developing.slice(0, 2), language)}.`);
  }

  // Focus areas (be specific)
  if (focus.length > 0) {
    parts.push(`${dict.connectors.focus} ${joinList(focus.slice(0, 2), language)}.`);
  }

  // Unrated note (do not assume)
  if (unrated.length > 0) {
    parts.push(`${dict.connectors.unrated} ${joinList(unrated, language)}.`);
  }

  parts.push(pick(dict.closings));

  return parts.join(' ');
}

