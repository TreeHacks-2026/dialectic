"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import FileUpload from "@/components/file-upload";
import CourseList from "@/components/course-list";
import { ArrowLeft, Plus } from "lucide-react";

export default function UploadPage() {
  const [newCourseName, setNewCourseName] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [courseMessage, setCourseMessage] = useState<{
    success: boolean;
    text: string;
  } | null>(null);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courses, setCourses] = useState<{ name: string; doc_count: number }[]>(
    []
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    }
  };

  const handleCreateCourse = async () => {
    const name = newCourseName.trim();
    if (!name) return;
    setCreatingCourse(true);
    setCourseMessage(null);

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create course");
      }

      setCourseMessage({ success: true, text: `Course "${name}" created!` });
      setNewCourseName("");
      setSelectedCourse(name);
      setRefreshKey((k) => k + 1);
      await fetchCourses();
    } catch (err) {
      setCourseMessage({
        success: false,
        text: err instanceof Error ? err.message : "Failed to create course",
      });
    } finally {
      setCreatingCourse(false);
    }
  };

  // Fetch courses on mount for the upload selector
  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tutor">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            Course Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Create courses and upload learning materials
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Create Course */}
        <Card>
          <CardHeader>
            <CardTitle>Create Course</CardTitle>
            <CardDescription>
              Create a new course to organize your learning materials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="course-name" className="sr-only">
                  Course Name
                </Label>
                <Input
                  id="course-name"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="e.g., Intro to Machine Learning"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateCourse();
                  }}
                  disabled={creatingCourse}
                />
              </div>
              <Button
                onClick={handleCreateCourse}
                disabled={!newCourseName.trim() || creatingCourse}
              >
                {creatingCourse ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create
              </Button>
            </div>
            {courseMessage && (
              <p
                className={`text-sm ${
                  courseMessage.success ? "text-green-600" : "text-destructive"
                }`}
              >
                {courseMessage.text}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upload Files */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>
              Upload PDF, TXT, or Markdown files to a course. Documents will be
              chunked and indexed for the AI tutor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="upload-course">Course</Label>
              <select
                id="upload-course"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
              >
                <option value="">Select a course...</option>
                {courses.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCourse ? (
              <FileUpload
                courseName={selectedCourse}
                onUploadComplete={() => setRefreshKey((k) => k + 1)}
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Select or create a course to upload documents.
              </p>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Course List */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Your Courses</h2>
          <CourseList refreshKey={refreshKey} />
        </div>

        {/* Back to tutor link */}
        <div className="text-center pb-8">
          <Button variant="outline" asChild>
            <Link href="/tutor">Back to AI Tutor</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
