
"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderOpen,
  X,
  ShieldCheck,
} from "lucide-react";

export const FileUploadComponent = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const uploadFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setStatus("error");
      setErrorMessage("Only PDF files are allowed.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setStatus("error");
      setErrorMessage("File size must be less than 10 MB.");
      return;
    }

    setSelectedFile(file);
    setUploading(true);
    setStatus("idle");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/upload/pdf`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload PDF.");
      }

      setStatus("success");
    } catch (error) {
      console.error("Upload error:", error);
      setStatus("error");
      setErrorMessage("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!uploading) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setStatus("idle");
    setErrorMessage("");
  };

  const formatFileSize = (bytes: number) =>
    (bytes / (1024 * 1024)).toFixed(2) + " MB";

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-indigo-500/15 p-3">
          <FileText className="h-6 w-6 text-indigo-400" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">
            Upload Document
          </h2>
          <p className="text-sm text-slate-400">
            Add a PDF to your knowledge base
          </p>
        </div>

        <span className="ml-auto rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
          PDF only
        </span>
      </div>

      {/* Upload Area */}
      <div
        role="button"
        tabIndex={uploading ? -1 : 0}
        aria-disabled={uploading}
        onClick={() => {
          if (!uploading) fileInputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (
            !uploading &&
            (e.key === "Enter" || e.key === " ")
          ) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-10 text-center transition-all duration-300 ${
          isDragging
            ? "border-indigo-400 bg-indigo-500/15"
            : "border-slate-700 bg-slate-900/60 hover:border-indigo-500 hover:bg-indigo-500/5"
        } ${uploading ? "cursor-not-allowed opacity-70" : ""}`}
      >
        <div className="mb-4 rounded-2xl bg-indigo-500/15 p-4">
          {uploading ? (
            <Loader2 className="h-9 w-9 animate-spin text-indigo-400" />
          ) : (
            <UploadCloud className="h-9 w-9 text-indigo-400" />
          )}
        </div>

        <h3 className="text-base font-semibold text-white">
          {uploading
            ? "Uploading your document..."
            : "Drag & drop your PDF here"}
        </h3>

        <p className="mt-2 text-sm text-slate-400">
          {uploading
            ? "Please wait while your file uploads"
            : "or click below to browse files"}
        </p>

        <div className="mt-5 flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <FolderOpen className="h-4 w-4" />
              Choose PDF File
            </>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Maximum file size: 10 MB
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
      </div>

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="rounded-lg bg-red-500/10 p-3">
            <FileText className="h-6 w-6 text-red-400" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {selectedFile.name}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>

          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          ) : status === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : (
            <button
              type="button"
              onClick={removeFile}
              aria-label="Clear selected file"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {/* Success Message */}
      {status === "success" && (
        <div
          role="status"
          className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          PDF uploaded successfully! AI processing will continue in the background.
        </div>
      )}

      {/* Error Message */}
      {status === "error" && (
        <div
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        Your document will be processed for AI-powered search
      </div>
    </div>
  );
};
