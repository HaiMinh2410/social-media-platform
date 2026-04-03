"use client";

import React, { useState, useRef } from "react";
import { uploadMediaAction } from "@/app/(dashboard)/actions/media";
import { Upload, X, FileImage, FileVideo, CheckCircle2, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";

interface MediaUploaderProps {
  onUploadComplete?: (url: string) => void;
  maxSizeMB?: number;
  allowedTypes?: string[];
  className?: string;
}

/**
 * Premium MediaUploader component with drop-zone and preview.
 * Integrated with Supabase Storage via Server Actions.
 */
export function MediaUploader({ 
  onUploadComplete, 
  maxSizeMB = 20, 
  allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/quicktime", "video/webm"],
  className = ""
}: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    // Validate size
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size exceeds ${maxSizeMB}MB limit.`);
      return;
    }

    // Validate type
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("This file type is not permitted.");
      return;
    }

    setFile(selectedFile);
    
    // Create preview if it's an image
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data, error } = await uploadMediaAction(formData);

      if (error) {
        toast.error(error);
      } else if (data) {
        toast.success("Tải lên media thành công!");
        onUploadComplete?.(data.url);
        // Reset state
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err) {
      toast.error("Đã xảy ra lỗi không xác định.");
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={`media-uploader w-full max-w-md mx-auto ${className}`}>
      <div 
        className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 p-8 flex flex-col items-center justify-center cursor-pointer min-h-[220px] 
          ${dragActive ? "border-blue-500 bg-blue-50/50 scale-[1.02]" : "border-slate-300 hover:border-slate-400 bg-slate-50/10"}
          ${file ? "border-emerald-500 bg-emerald-50/5" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept={allowedTypes.join(",")} 
          onChange={handleInputChange} 
        />

        {file ? (
          <div className="w-full flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            {preview ? (
              <div className="relative group w-full max-w-[180px] aspect-square rounded-xl overflow-hidden shadow-lg">
                <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                <button 
                  onClick={clearFile}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative group p-6 bg-slate-100 dark:bg-slate-800 rounded-xl flex flex-col items-center gap-2 max-w-[180px]">
                {file.type.startsWith("video/") ? (
                  <FileVideo className="w-12 h-12 text-slate-500" />
                ) : (
                  <FileImage className="w-12 h-12 text-slate-500" />
                )}
                <span className="text-xs font-medium truncate w-full text-center">{file.name}</span>
                <button 
                  onClick={clearFile}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full border-2 border-white shadow-md shadow-red-500/20"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpload();
              }}
              disabled={isUploading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold transition-all shadow-md
                ${isUploading ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"}
              `}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tải lên...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận tải lên</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600 mb-2 group-hover:scale-110 transition-transform">
              <ImagePlus className="w-8 h-8" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">Kéo thả hoặc Click để chọn file</p>
              <p className="text-sm text-slate-500 mt-1">Hỗ trợ Ảnh và Video (Tối đa {maxSizeMB}MB)</p>
            </div>
            <button className="mt-2 py-2 px-6 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-slate-900/10">
              Chọn từ máy tính
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
