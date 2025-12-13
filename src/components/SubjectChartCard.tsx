import { SubjectMarksDetail } from '@/types/assessment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

interface SubjectChartCardProps {
  subject: string;
  marks: SubjectMarksDetail;
  compact?: boolean;
}

export function SubjectChartCard({ subject, marks, compact = false }: SubjectChartCardProps) {
  const data = [
    { name: 'Theory', value: marks.theory || 0, max: 80, fill: 'hsl(var(--primary))' },
    { name: 'Internal', value: marks.internal || 0, max: 20, fill: 'hsl(var(--accent))' },
  ];

  const total = (marks.theory || 0) + (marks.internal || 0);
  const percentage = total;
  
  const getGrade = () => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const getColorClass = () => {
    if (percentage >= 85) return 'text-skill-good';
    if (percentage >= 60) return 'text-skill-average';
    if (percentage >= 40) return 'text-orange-500';
    return 'text-skill-needs';
  };

  if (compact) {
    return (
      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm truncate mr-2">{subject}</span>
          <Badge variant="outline" className={getColorClass()}>
            {total}/100
          </Badge>
        </div>
        <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted">
          <div 
            className="bg-primary rounded-l" 
            style={{ width: `${(marks.theory / 80) * 80}%` }}
            title={`Theory: ${marks.theory}/80`}
          />
          <div 
            className="bg-accent" 
            style={{ width: `${(marks.internal / 20) * 20}%` }}
            title={`Internal: ${marks.internal}/20`}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Th: {marks.theory}/80</span>
          <span>IA: {marks.internal}/20</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium truncate">{subject}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getColorClass()}>{getGrade()}</Badge>
            <span className="text-lg font-bold">{total}/100</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 60, right: 20 }}>
              <XAxis type="number" domain={[0, 'dataMax']} hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                width={55}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded-lg p-2 shadow-lg text-sm">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-primary">{item.value} / {item.max}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2">
          <span>Theory: {marks.theory}/80</span>
          <span>Internal: {marks.internal}/20</span>
        </div>
      </CardContent>
    </Card>
  );
}
