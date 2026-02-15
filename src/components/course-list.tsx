"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

interface Course {
  name: string;
  doc_count: number;
}

interface CourseListProps {
  refreshKey: number;
}

export default function CourseList({ refreshKey }: CourseListProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          No courses yet. Create one above and upload documents.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {courses.map((course) => (
        <Card key={course.name}>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {course.name}
              </CardTitle>
              <Badge variant="secondary">
                {course.doc_count} document{course.doc_count !== 1 ? "s" : ""}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-xs text-muted-foreground">
              {course.doc_count === 0
                ? "Upload documents to start using this course with the AI tutor."
                : "Ready for AI tutoring sessions."}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
