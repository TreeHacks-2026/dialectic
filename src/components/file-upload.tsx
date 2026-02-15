"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, X } from "lucide-react";

const ACCEPTED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".txt", ".md"];

interface FileUploadProps {
  courseName: string;
  onUploadComplete: () => void;
}

export default function FileUpload({
  courseName,
  onUploadComplete,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAcceptedFile = (f: File) => {
    if (ACCEPTED_TYPES.includes(f.type)) return true;
    return ACCEPTED_EXTENSIONS.some((ext) =>
      f.name.toLowerCase().endsWith(ext)
    );
  };

  const handleFile = useCallback((f: File | null) => {
    setResult(null);
    if (f && !isAcceptedFile(f)) {
      setResult({
        success: false,
        message: "Only PDF, TXT, and MD files are supported.",
      });
      return;
    }
    setFile(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!file || !courseName.trim()) return;
    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("course_name", courseName.trim());

      const res = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setResult({
        success: true,
        message: `Uploaded successfully! ${data.chunks_indexed} chunks indexed.`,
      });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onUploadComplete();
    } catch (err) {
      setResult({
        success: false,
        message:
          err instanceof Error ? err.message : "Upload failed. Try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
          {file ? (
            <>
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setResult(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag and drop a file, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, TXT, or MD files
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
      />

      <Button
        onClick={handleUpload}
        disabled={!file || !courseName.trim() || uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Upload to Course
          </>
        )}
      </Button>

      {result && (
        <p
          className={`text-sm ${
            result.success ? "text-green-600" : "text-destructive"
          }`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
