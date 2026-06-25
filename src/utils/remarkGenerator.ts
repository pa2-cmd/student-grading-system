import { 
  Student, 
  SKILL_VALUES, 
  getMaxPossibleScore, 
  getSkillsForSubject,
  getSkillDisplayName,
  SubjectType 
} from '@/types/assessment';

interface RemarkGeneratorParams {
  student: Student;
  language: 'english' | 'hindi';
  subject: SubjectType;
}

// ============================================================
// SUBJECT-SPECIFIC TEMPLATES
// ============================================================

const TEMPLATES = {
  English: {
    en: {
      name: 'English',
      openers: {
        strong: ['shows confident progress in English', 'demonstrates excellent English language skills', 'is performing with consistency in English'],
        steady: ['is making steady progress in English', 'is building English skills step by step', 'shows a positive learning attitude toward English'],
        support: ['is learning English with determination', 'is working hard and needs more guidance in English', 'is developing English skills and will benefit from focused practice'],
      },
    },
    hi: {
      name: 'अंग्रेजी',
      openers: {
        strong: ['अंग्रेजी में बहुत अच्छी प्रगति कर रहे हैं', 'अंग्रेजी कौशल में मजबूत पकड़ दिखाते हैं'],
        steady: ['अंग्रेजी में निरंतर प्रगति कर रहे हैं', 'धीरे-धीरे अंग्रेजी कौशल मजबूत कर रहे हैं'],
        support: ['अंग्रेजी में मेहनत कर रहे हैं और थोड़ा मार्गदर्शन चाहिए', 'केंद्रित अभ्यास से अंग्रेजी में काफी लाभ होगा'],
      },
    },
  },
  Maths: {
    en: {
      name: 'Mathematics',
      openers: {
        strong: ['shows strong mathematical aptitude', 'demonstrates excellent problem-solving skills in Maths', 'excels in mathematical concepts and applications'],
        steady: ['is making steady progress in Mathematics', 'shows consistent effort in learning mathematical concepts', 'is developing good mathematical foundations'],
        support: ['needs additional practice in mathematical concepts', 'would benefit from focused guidance in Mathematics', 'is working to strengthen mathematical understanding'],
      },
    },
    hi: {
      name: 'गणित',
      openers: {
        strong: ['गणित में बहुत अच्छी प्रगति दिखा रहे हैं', 'गणितीय अवधारणाओं में मजबूत पकड़ है'],
        steady: ['गणित में निरंतर प्रगति कर रहे हैं', 'गणितीय कौशल विकसित कर रहे हैं'],
        support: ['गणित में अतिरिक्त अभ्यास की आवश्यकता है', 'गणित में मार्गदर्शन से लाभ होगा'],
      },
    },
  },
  Science: {
    en: {
      name: 'Science',
      openers: {
        strong: ['shows excellent scientific understanding', 'demonstrates strong inquiry and reasoning in Science', 'excels in scientific concepts and observation'],
        steady: ['is making good progress in Science', 'shows curiosity and steady improvement in scientific concepts', 'is developing strong observational skills'],
        support: ['needs more practice in scientific concepts', 'would benefit from hands-on science activities', 'is working to build scientific reasoning skills'],
      },
    },
    hi: {
      name: 'विज्ञान',
      openers: {
        strong: ['विज्ञान में उत्कृष्ट समझ दिखा रहे हैं', 'वैज्ञानिक अवधारणाओं में मजबूत पकड़ है'],
        steady: ['विज्ञान में अच्छी प्रगति कर रहे हैं', 'वैज्ञानिक जिज्ञासा विकसित कर रहे हैं'],
        support: ['विज्ञान में अतिरिक्त अभ्यास की आवश्यकता है', 'प्रयोगात्मक गतिविधियों से लाभ होगा'],
      },
    },
  },
  'Social Science': {
    en: {
      name: 'Social Science',
      openers: {
        strong: ['shows excellent understanding of social concepts', 'demonstrates strong awareness of surroundings and society', 'excels in reasoning and explanation'],
        steady: ['is making good progress in Social Science', 'shows growing awareness of social and environmental issues', 'is developing good map and inquiry skills'],
        support: ['needs more practice in social concepts', 'would benefit from real-life connections in Social Science', 'is working to strengthen social awareness'],
      },
    },
    hi: {
      name: 'सामाजिक विज्ञान',
      openers: {
        strong: ['सामाजिक विज्ञान में उत्कृष्ट समझ दिखा रहे हैं', 'सामाजिक अवधारणाओं में मजबूत पकड़ है'],
        steady: ['सामाजिक विज्ञान में अच्छी प्रगति कर रहे हैं', 'सामाजिक जागरूकता विकसित कर रहे हैं'],
        support: ['सामाजिक विज्ञान में अतिरिक्त अभ्यास की आवश्यकता है', 'व्यावहारिक उदाहरणों से लाभ होगा'],
      },
    },
  },
};

const ENGLISH = {
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

export async function generateRemark({ student, language, subject }: RemarkGeneratorParams): Promise<string> {
  // Small delay for a natural feel
  await new Promise((resolve) => setTimeout(resolve, 250));
  return generateTeacherLikeRemark(student, language, subject);
}

function generateTeacherLikeRemark(student: Student, language: 'english' | 'hindi', subject: SubjectType): string {
  const dict = language === 'hindi' ? HINDI : ENGLISH;
  const subjectTemplate = TEMPLATES[subject]?.[language === 'hindi' ? 'hi' : 'en'] || TEMPLATES.English.en;
  const name = student.name?.trim() || (language === 'hindi' ? 'छात्र/छात्रा' : 'The student');
  const skills = getSkillsForSubject(subject);

  const rated = skills.map((skill) => {
    const rating = student.subjectRatings?.[skill];
    return {
      skill,
      label: getSkillDisplayName(skill),
      rating,
      value: (rating === undefined || rating === 'NA') ? undefined : SKILL_VALUES[rating],
    };
  });

  const strengths = rated.filter((s) => s.value === 2).map((s) => s.label);
  const developing = rated.filter((s) => s.value === 1).map((s) => s.label);
  const focus = rated.filter((s) => s.value === 0).map((s) => s.label);
  const unrated = rated.filter((s) => s.rating === undefined).map((s) => s.label);

  const maxScore = getMaxPossibleScore(student.subjectRatings);
  const percentage = maxScore > 0 ? (student.total / maxScore) * 100 : 0;

  const openerBucket = percentage >= 80 ? 'strong' : percentage >= 55 ? 'steady' : 'support';

  const parts: string[] = [];
  parts.push(`${name} ${pick(subjectTemplate.openers[openerBucket])}.`);

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
  language: 'english' | 'hindi',
  subject: SubjectType
): string {
  if (totalStudents === 0) {
    return language === 'hindi' 
      ? 'कक्षा में कोई छात्र डेटा उपलब्ध नहीं है।' 
      : 'No student data available for class analysis.';
  }

  const sortedSkills = Object.entries(skillAverages)
    .filter(([_, avg]) => avg > 0)
    .sort((a, b) => b[1] - a[1]);

  const strongSkills = sortedSkills.filter(([_, avg]) => avg >= 75).map(([skill]) => getSkillDisplayName(skill));
  const weakSkills = sortedSkills.filter(([_, avg]) => avg < 60).map(([skill]) => getSkillDisplayName(skill));

  const parts: string[] = [];
  const subjectName = language === 'hindi' 
    ? (TEMPLATES[subject]?.hi?.name || subject)
    : subject;

  if (language === 'hindi') {
    parts.push(`कक्षा में कुल ${totalStudents} छात्रों का ${subjectName} में आकलन किया गया।`);
    
    if (strongSkills.length > 0) {
      parts.push(`कक्षा की मुख्य ताकतें: ${joinList(strongSkills, language)}।`);
    }
    
    if (weakSkills.length > 0) {
      parts.push(`इन क्षेत्रों में अतिरिक्त ध्यान की आवश्यकता है: ${joinList(weakSkills, language)}।`);
    }
    
    parts.push(`प्रदर्शन वितरण: ${distribution.high} छात्र उत्कृष्ट (80%+), ${distribution.average} छात्र औसत (55-79%), ${distribution.low} छात्र सुधार की आवश्यकता (<55%)।`);
  } else {
    parts.push(`Class ${subject} assessment covers ${totalStudents} students.`);
    
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
