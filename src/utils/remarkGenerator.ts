import { Student, SKILL_VALUES } from '@/types/assessment';

interface RemarkGeneratorParams {
  student: Student;
  language: 'english' | 'hindi';
  selectedSubjects: string[];
}

// Humanized phrase templates for warm, encouraging remarks
const ENGLISH_PHRASES = {
  excellent: [
    "is truly blossoming",
    "continues to shine brightly",
    "brings wonderful energy",
    "has made remarkable progress",
    "demonstrates outstanding dedication",
  ],
  good: [
    "is making steady progress",
    "shows consistent effort",
    "is developing beautifully",
    "brings enthusiasm to learning",
    "is on a wonderful journey",
  ],
  average: [
    "is growing each day",
    "shows promising potential",
    "is building a strong foundation",
    "continues to develop",
    "is making meaningful strides",
  ],
  needsSupport: [
    "is discovering their strengths",
    "is working with determination",
    "shows resilience in learning",
    "is on their own unique path",
    "continues to try with heart",
  ],
  strengthOpeners: [
    "It's wonderful to see",
    "We're so proud of",
    "What a joy to notice",
    "It's heartwarming to observe",
    "We celebrate",
  ],
  improvementOpeners: [
    "With a little more practice in",
    "We're confident that focusing on",
    "With gentle encouragement in",
    "As we work together on",
    "With continued support in",
  ],
  closings: [
    "Keep up the wonderful work!",
    "We believe in you!",
    "Your hard work is truly paying off!",
    "The future is bright!",
    "We're cheering you on!",
    "You're doing great!",
    "Every step forward counts!",
  ],
};

const HINDI_PHRASES = {
  excellent: [
    "शानदार प्रगति कर रहे हैं",
    "अद्भुत प्रदर्शन दिखा रहे हैं",
    "उत्कृष्ट समर्पण दिखाते हैं",
    "बहुत अच्छा काम कर रहे हैं",
    "हमें गर्वित कर रहे हैं",
  ],
  good: [
    "निरंतर प्रगति कर रहे हैं",
    "मेहनत से सीख रहे हैं",
    "सुंदर विकास दिखा रहे हैं",
    "उत्साह से पढ़ रहे हैं",
    "अच्छी राह पर हैं",
  ],
  average: [
    "हर दिन आगे बढ़ रहे हैं",
    "अच्छी क्षमता दिखाते हैं",
    "मजबूत नींव बना रहे हैं",
    "विकास की राह पर हैं",
    "सार्थक प्रयास कर रहे हैं",
  ],
  needsSupport: [
    "अपनी ताकत खोज रहे हैं",
    "लगन से मेहनत कर रहे हैं",
    "धीरे-धीरे सीख रहे हैं",
    "अपने तरीके से बढ़ रहे हैं",
    "दिल से प्रयास कर रहे हैं",
  ],
  strengthOpeners: [
    "खुशी की बात है कि",
    "हमें गर्व है कि",
    "यह देखकर अच्छा लगा कि",
    "सराहनीय है कि",
    "हम सराहना करते हैं कि",
  ],
  improvementOpeners: [
    "थोड़े और अभ्यास से",
    "हमें विश्वास है कि",
    "प्यार भरे प्रोत्साहन से",
    "मिलकर काम करने से",
    "निरंतर सहयोग से",
  ],
  closings: [
    "इसी तरह आगे बढ़ो!",
    "हमें तुम पर विश्वास है!",
    "तुम्हारी मेहनत रंग ला रही है!",
    "भविष्य उज्ज्वल है!",
    "हम तुम्हारे साथ हैं!",
    "बहुत अच्छे!",
    "हर कदम मायने रखता है!",
  ],
};

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getSubjectDisplayName(subject: string, language: 'english' | 'hindi'): string {
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
  
  if (language === 'hindi') {
    return hindiNames[subject] || subject;
  }
  return subject.toLowerCase().replace(' skills', '').replace(' usage', '');
}

export async function generateRemark({ student, language, selectedSubjects }: RemarkGeneratorParams): Promise<string> {
  // Simulate a brief delay for a more natural feel
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return generateHumanizedRemark(student, language, selectedSubjects);
}

function generateHumanizedRemark(
  student: Student,
  language: 'english' | 'hindi',
  selectedSubjects: string[]
): string {
  const phrases = language === 'hindi' ? HINDI_PHRASES : ENGLISH_PHRASES;
  const studentName = student.name || (language === 'hindi' ? 'छात्र' : 'The student');
  
  // Analyze skills
  const skills = selectedSubjects.map(subject => ({
    name: getSubjectDisplayName(subject, language),
    rating: student.subjectRatings[subject] || 'Good',
    value: SKILL_VALUES[student.subjectRatings[subject] || 'Good'],
  }));
  
  const strengths = skills.filter(s => s.value === 2).map(s => s.name);
  const averages = skills.filter(s => s.value === 1).map(s => s.name);
  const needsImprovement = skills.filter(s => s.value === 0).map(s => s.name);
  
  const maxScore = selectedSubjects.length * 2;
  const percentage = (student.total / maxScore) * 100;
  
  const remarkParts: string[] = [];
  
  // Opening based on overall performance
  if (percentage >= 90) {
    remarkParts.push(`${studentName} ${getRandomItem(phrases.excellent)}.`);
  } else if (percentage >= 70) {
    remarkParts.push(`${studentName} ${getRandomItem(phrases.good)}.`);
  } else if (percentage >= 50) {
    remarkParts.push(`${studentName} ${getRandomItem(phrases.average)}.`);
  } else {
    remarkParts.push(`${studentName} ${getRandomItem(phrases.needsSupport)}.`);
  }
  
  // Highlight strengths warmly
  if (strengths.length > 0) {
    const strengthList = strengths.length > 2 
      ? `${strengths.slice(0, -1).join(', ')} ${language === 'hindi' ? 'और' : 'and'} ${strengths[strengths.length - 1]}`
      : strengths.join(language === 'hindi' ? ' और ' : ' and ');
    
    remarkParts.push(`${getRandomItem(phrases.strengthOpeners)} ${language === 'hindi' ? 'उनकी' : 'their'} ${strengthList}${language === 'hindi' ? ' में प्रतिभा।' : ' skills.'}`);
  }
  
  // Gentle encouragement for areas needing improvement
  if (needsImprovement.length > 0 && needsImprovement.length <= 2) {
    const improvementList = needsImprovement.join(language === 'hindi' ? ' और ' : ' and ');
    remarkParts.push(`${getRandomItem(phrases.improvementOpeners)} ${improvementList}${language === 'hindi' ? ', और भी सुधार होगा।' : ', they will flourish even more.'}`);
  }
  
  // Warm closing
  remarkParts.push(getRandomItem(phrases.closings));
  
  return remarkParts.join(' ');
}
