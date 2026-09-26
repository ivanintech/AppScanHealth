import { Play, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";

export const Learn = () => {
  const courses = [
    {
      id: 1,
      title: "Supplements 101: Understanding the Basics",
      lessons: 6,
      completed: 0,
      duration: "32m",
      image: "/placeholder.svg",
      featured: true,
    },
    {
      id: 2,
      title: "Decoding Supplement Labels: A Beginner's Guide",
      lessons: 7,
      completed: 0,
      duration: "28m",
      image: "/placeholder.svg",
    },
    {
      id: 3,
      title: "Choosing Quality Supplements: Spotting Red Flags",
      lessons: 6,
      completed: 0,
      duration: "35m",
      image: "/placeholder.svg",
    },
    {
      id: 4,
      title: "Essential Vitamins & Minerals: Your Guide to Nutritional Needs",
      lessons: 7,
      completed: 0,
      duration: "42m",
      image: "/placeholder.svg",
    },
    {
      id: 5,
      title: "Safe Supplement Practices: Dosage & Usage Guidelines",
      lessons: 5,
      completed: 0,
      duration: "25m",
      image: "/placeholder.svg",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Learn</h1>
          <p className="text-muted-foreground">
            Master supplements with expert-curated lessons
          </p>
        </div>

        {/* Featured Course */}
        {courses[0] && (
          <Card className="mb-6 overflow-hidden shadow-card">
            <CardContent className="p-0">
              <div className="aspect-video bg-wellness-bg relative">
                <img 
                  src={courses[0].image} 
                  alt={courses[0].title}
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-xs text-white/80 uppercase tracking-wide">NEXT UP</span>
                  <h3 className="text-lg font-bold text-white mb-2">{courses[0].title}</h3>
                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    <span>{courses[0].completed} of {courses[0].lessons} lessons</span>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>{Math.round((courses[0].completed / courses[0].lessons) * 100)}%</span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="w-12 h-12 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary fill-current" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>Continue • {courses[0].duration}</span>
                  <button className="text-primary hover:underline">▲</button>
                </div>
                <Progress value={(courses[0].completed / courses[0].lessons) * 100} className="h-1" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course List */}
        <div className="space-y-4">
          {courses.slice(1).map((course) => (
            <Card key={course.id} className="shadow-card hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-wellness-bg rounded-lg flex-shrink-0 flex items-center justify-center">
                    <img 
                      src={course.image} 
                      alt={course.title}
                      className="w-10 h-10 object-cover opacity-60"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span>{course.lessons} lessons</span>
                      <span>• {course.completed} completed</span>
                    </div>
                    <Progress value={(course.completed / course.lessons) * 100} className="h-1" />
                  </div>
                  <div className="flex flex-col items-end justify-between py-1">
                    <div className="text-right text-sm">
                      <div className="text-primary font-bold">
                        {Math.round((course.completed / course.lessons) * 100)}%
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{course.duration}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
