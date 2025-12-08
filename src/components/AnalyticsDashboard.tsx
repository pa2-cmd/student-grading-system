import { ClassAnalytics } from '@/types/assessment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Users, Award, AlertCircle, Calendar } from 'lucide-react';

interface AnalyticsDashboardProps {
  analytics: ClassAnalytics;
  selectedSubjects: string[];
}

export function AnalyticsDashboard({ analytics, selectedSubjects }: AnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class Average</p>
                <p className="text-2xl font-bold text-primary">{analytics.classAverage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-skill-good/10 to-skill-good/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-skill-good/20">
                <Award className="h-5 w-5 text-skill-good" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Performer</p>
                <p className="text-lg font-bold text-skill-good">
                  {analytics.topPerformers[0]?.name || '-'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {analytics.topPerformers[0]?.percentage || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-skill-needs/10 to-skill-needs/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-skill-needs/20">
                <AlertCircle className="h-5 w-5 text-skill-needs" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Needs Support</p>
                <p className="text-lg font-bold text-skill-needs">
                  {analytics.needsHelp.length} students
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <Calendar className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Attendance</p>
                <p className="text-2xl font-bold text-accent">{analytics.attendanceAverage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Subject Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedSubjects.slice(0, 6).map(subject => {
              const avg = analytics.subjectAverages[subject] || 0;
              return (
                <div key={subject} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate max-w-[60%]">{subject}</span>
                    <span className="font-medium">{avg}%</span>
                  </div>
                  <Progress 
                    value={avg} 
                    className="h-2"
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {analytics.gradeDistribution.map(({ grade, count }) => {
                const maxCount = Math.max(...analytics.gradeDistribution.map(g => g.count), 1);
                const height = (count / maxCount) * 100;
                return (
                  <div key={grade} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-primary/80 rounded-t transition-all"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <span className="text-xs font-medium mt-1">{grade}</span>
                    <span className="text-xs text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-skill-good" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.topPerformers.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-skill-good/5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-skill-good/20 text-skill-good text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="font-medium text-sm">{student.name}</span>
                  </div>
                  <span className="text-skill-good font-bold">{student.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Needs Help */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-skill-needs" />
              Students Needing Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.needsHelp.length > 0 ? (
                analytics.needsHelp.map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-skill-needs/5">
                    <span className="font-medium text-sm">{student.name}</span>
                    <span className="text-skill-needs font-bold">{student.percentage}%</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All students are performing well! 🎉
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
