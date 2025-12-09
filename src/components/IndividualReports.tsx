import { useState } from 'react';
import { Student, getGradeFromPercentage } from '@/types/assessment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileDown, 
  Search, 
  User, 
  Trophy, 
  TrendingUp, 
  Award,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { exportStudentPDF } from '@/utils/individualPdfExport';

interface IndividualReportsProps {
  students: Student[];
  selectedSubjects: string[];
  schoolName: string;
  className: string;
  section: string;
}

export function IndividualReports({ 
  students, 
  selectedSubjects,
  schoolName,
  className,
  section
}: IndividualReportsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'radar'>('bar');

  // Filter students with names and calculate positions
  const validStudents = students
    .filter(s => s.name.trim())
    .sort((a, b) => b.percentage - a.percentage)
    .map((student, index) => ({
      ...student,
      classPosition: index + 1
    }));

  const filteredStudents = validStudents.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.enrollmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportPDF = async (student: Student & { classPosition: number }) => {
    await exportStudentPDF({
      student,
      selectedSubjects,
      schoolName,
      className,
      section,
      totalStudents: validStudents.length
    });
  };

  const handleExportAllPDFs = async () => {
    for (const student of validStudents) {
      await exportStudentPDF({
        student,
        selectedSubjects,
        schoolName,
        className,
        section,
        totalStudents: validStudents.length
      });
    }
  };

  // Prepare chart data for selected student
  const getChartData = (student: Student) => {
    return selectedSubjects.map(subject => ({
      subject: subject.length > 10 ? subject.slice(0, 10) + '...' : subject,
      fullName: subject,
      marks: student.subjectMarks?.[subject] || 0,
      fullMarks: 100
    }));
  };

  const selectedStudentWithPosition = selectedStudent 
    ? validStudents.find(s => s.id === selectedStudent.id)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Individual Performance Reports</h2>
          <p className="text-muted-foreground">View and export individual student report cards</p>
        </div>
        <Button onClick={handleExportAllPDFs} className="gap-2" disabled={validStudents.length === 0}>
          <FileDown className="h-4 w-4" />
          Export All PDFs
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Students ({validStudents.length})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, enrollment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`flex items-center justify-between p-4 border-b cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedStudent?.id === student.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{student.name}</span>
                      {student.classPosition <= 3 && (
                        <Trophy className={`h-4 w-4 ${
                          student.classPosition === 1 ? 'text-yellow-500' :
                          student.classPosition === 2 ? 'text-gray-400' :
                          'text-amber-600'
                        }`} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{student.enrollmentNumber}</span>
                      <span>•</span>
                      <span>Rank #{student.classPosition}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={student.percentage >= 75 ? 'default' : student.percentage >= 50 ? 'secondary' : 'destructive'}>
                      {student.percentage}%
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
              {filteredStudents.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No students found
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Student Detail View */}
        <Card className="lg:col-span-2">
          {selectedStudentWithPosition ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedStudentWithPosition.name}</CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline">Enrollment: {selectedStudentWithPosition.enrollmentNumber}</Badge>
                      {selectedStudentWithPosition.rollNumber && (
                        <Badge variant="outline">Roll: {selectedStudentWithPosition.rollNumber}</Badge>
                      )}
                      <Badge variant="outline">Class: {className || '-'} {section}</Badge>
                    </div>
                  </div>
                  <Button onClick={() => handleExportPDF(selectedStudentWithPosition)} className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-primary/10 rounded-lg p-4 text-center">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{selectedStudentWithPosition.percentage}%</div>
                    <div className="text-sm text-muted-foreground">Average</div>
                  </div>
                  <div className="bg-accent/10 rounded-lg p-4 text-center">
                    <Award className="h-6 w-6 mx-auto mb-2 text-accent-foreground" />
                    <div className="text-2xl font-bold">{getGradeFromPercentage(selectedStudentWithPosition.percentage)}</div>
                    <div className="text-sm text-muted-foreground">Grade</div>
                  </div>
                  <div className="bg-secondary rounded-lg p-4 text-center">
                    <Trophy className="h-6 w-6 mx-auto mb-2 text-secondary-foreground" />
                    <div className="text-2xl font-bold">#{selectedStudentWithPosition.classPosition}</div>
                    <div className="text-sm text-muted-foreground">Class Rank</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <BookOpen className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{selectedSubjects.length}</div>
                    <div className="text-sm text-muted-foreground">Subjects</div>
                  </div>
                </div>

                {/* Chart Type Toggle */}
                <div className="flex justify-end mb-4">
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={chartType === 'bar' ? 'default' : 'outline'}
                      onClick={() => setChartType('bar')}
                    >
                      Bar Chart
                    </Button>
                    <Button 
                      size="sm" 
                      variant={chartType === 'radar' ? 'default' : 'outline'}
                      onClick={() => setChartType('radar')}
                    >
                      Radar Chart
                    </Button>
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="h-[300px] w-full">
                  {chartType === 'bar' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getChartData(selectedStudentWithPosition)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="subject" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-popover border rounded-lg p-3 shadow-lg">
                                  <p className="font-medium">{payload[0].payload.fullName}</p>
                                  <p className="text-primary font-bold">{payload[0].value} / 100</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="marks" 
                          fill="hsl(var(--primary))" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={getChartData(selectedStudentWithPosition)}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar
                          name="Marks"
                          dataKey="marks"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Marks Table */}
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Subject-wise Marks</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {selectedSubjects.map(subject => {
                      const marks = selectedStudentWithPosition.subjectMarks?.[subject] || 0;
                      return (
                        <div key={subject} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm font-medium truncate mr-2">{subject}</span>
                          <Badge variant={marks >= 75 ? 'default' : marks >= 50 ? 'secondary' : 'destructive'}>
                            {marks}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Remarks */}
                {selectedStudentWithPosition.remark && (
                  <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
                    <h4 className="font-semibold mb-2">Teacher's Remark</h4>
                    <p className="text-sm leading-relaxed">{selectedStudentWithPosition.remark}</p>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[600px] text-muted-foreground">
              <User className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg">Select a student to view details</p>
              <p className="text-sm">Click on a student from the list</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
