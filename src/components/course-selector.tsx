"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface Course {
  name: string;
  doc_count: number;
}

interface CourseSelectorProps {
  selectedCourse: string;
  onSelect: (course: string) => void;
}

export default function CourseSelector({
  selectedCourse,
  onSelect,
}: CourseSelectorProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
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
    };
    fetchCourses();
  }, []);

  return (
    <div className="flex items-center gap-3">
      <select
        value={selectedCourse}
        onChange={(e) => onSelect(e.target.value)}
        disabled={loading}
        className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">All Courses</option>
        {courses.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name} ({c.doc_count} docs)
          </option>
        ))}
      </select>

      <Button variant="outline" size="sm" asChild>
        <Link href="/upload">
          <Upload className="h-4 w-4 mr-1" />
          Upload Docs
        </Link>
      </Button>
    </div>
  );
}
