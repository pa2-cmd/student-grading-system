import { Student } from '@/types/assessment';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getGradeFromPercentage } from '@/types/assessment';

interface StudentPerformanceChartProps {
  student: Student;
  selectedSubjects: string[];
}

export function StudentPerformanceChart({ student, selectedSubjects }: StudentPerformanceChartProps) {
  // Prepare data for charts
  const chartData = selectedSubjects.map(subject => ({
    subject: subject.length > 10 ? subject.substring(0, 10) + '...' : subject,
    fullName: subject,
    marks: student.subjectMarks?.[subject] ?? 0,
    fullMark: 100,
  }));

  const hasMarks = chartData.some(d => d.marks > 0);
  const average = hasMarks 
    ? Math.round(chartData.reduce((sum, d) => sum + d.marks, 0) / chartData.length)
    : 0;
  const total = chartData.reduce((sum, d) => sum + d.marks, 0);
  const grade = getGradeFromPercentage(average);

  // Get performance category colors
  const getBarColor = (marks: number) => {
    if (marks >= 90) return 'hsl(var(--skill-good))';
    if (marks >= 75) return 'hsl(142, 70%, 45%)';
    if (marks >= 60) return 'hsl(var(--skill-average))';
    if (marks >= 40) return 'hsl(45, 80%, 45%)';
    return 'hsl(var(--skill-needs))';
  };

  const CustomBar = (props: any) => {
    const { x, y, width, height, payload } = props;
    return (
      <rect 
        x={x} 
        y={y} 
        width={width} 
        height={height} 
        fill={getBarColor(payload.marks)} 
        rx={4}
      />
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          title="View Performance Chart"
          disabled={!hasMarks}
        >
          <BarChart3 className="h-3 w-3" />
          Chart
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <span>Performance: {student.name || 'Student'}</span>
            <Badge variant="secondary" className="text-sm">
              Enrollment: {student.enrollmentNumber}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-primary">{average}%</p>
              <p className="text-sm text-muted-foreground">Average</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-accent">{total}</p>
              <p className="text-sm text-muted-foreground">Total Marks</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: getBarColor(average) }}>{grade}</p>
              <p className="text-sm text-muted-foreground">Grade</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{selectedSubjects.length}</p>
              <p className="text-sm text-muted-foreground">Subjects</p>
            </div>
          </div>

          {/* Charts */}
          <Tabs defaultValue="bar" className="w-full">
            <TabsList className="grid grid-cols-2 w-48 mx-auto">
              <TabsTrigger value="bar">Bar Chart</TabsTrigger>
              <TabsTrigger value="radar">Radar Chart</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bar" className="mt-4">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="subject" 
                      angle={-45} 
                      textAnchor="end" 
                      height={60}
                      tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                    />
                    <Tooltip 
                      formatter={(value: number, name, props) => [
                        `${value} marks`, 
                        props.payload.fullName
                      ]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="marks" 
                      shape={<CustomBar />}
                      name="Marks"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="radar" className="mt-4">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                    <PolarGrid className="stroke-border" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Radar 
                      name="Marks" 
                      dataKey="marks" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.5}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>

          {/* Subject-wise Breakdown */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Subject-wise Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {chartData.map(({ fullName, marks }) => (
                <div 
                  key={fullName} 
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border"
                >
                  <span className="text-sm truncate flex-1">{fullName}</span>
                  <Badge 
                    variant="secondary"
                    style={{ 
                      backgroundColor: `${getBarColor(marks)}20`,
                      color: getBarColor(marks)
                    }}
                  >
                    {marks}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
