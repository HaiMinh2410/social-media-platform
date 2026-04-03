"use client";

import React, { useState } from "react";
import { MediaUploader } from "@/components/media/media-uploader";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, ExternalLink, ImageIcon, CheckCircle } from "lucide-react";

export default function TestMediaPage() {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-8 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <DashboardHeader 
        title="Test Media Upload" 
        description="Demo page for testing Supabase Storage & Pipeline (T025)" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900 overflow-hidden group">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-xl flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-500" />
              Media Uploader
            </CardTitle>
            <CardDescription>
              Tải ảnh hoặc video lên Supabase Storage bucket 'media'.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <MediaUploader 
              onUploadComplete={(url) => setUploadedUrl(url)} 
              maxSizeMB={5}
            />
          </CardContent>
        </Card>

        {uploadedUrl ? (
          <Card className="border-0 shadow-xl shadow-emerald-100/50 dark:shadow-none dark:bg-slate-900 animate-in fade-in slide-in-from-right-4 duration-500 bg-emerald-50/10">
            <CardHeader className="bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-100/50 dark:border-emerald-800/50">
              <CardTitle className="text-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle className="w-5 h-5" />
                Upload Successful
              </CardTitle>
              <CardDescription>
                File đã được lưu trữ thành công. Bạn có thể truy cập qua URL công khai.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 flex flex-col gap-6">
              <div className="rounded-2xl overflow-hidden border-2 border-emerald-100 shadow-lg bg-white p-2">
                {uploadedUrl.match(/\.(mp4|webm|mov|quicktime)/i) ? (
                  <video src={uploadedUrl} controls className="w-full h-auto rounded-xl" />
                ) : (
                  <img src={uploadedUrl} alt="Uploaded" className="w-full h-auto rounded-xl object-contain max-h-[300px]" />
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Public URL</label>
                <div className="flex gap-2">
                  <input 
                    readOnly 
                    value={uploadedUrl} 
                    className="flex-1 bg-slate-100 dark:bg-slate-800 p-2 text-sm rounded border border-slate-200 dark:border-slate-700 font-mono"
                  />
                  <Button variant="outline" size="icon" onClick={() => window.open(uploadedUrl, "_blank")}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => setUploadedUrl(null)}
              >
                Tải lên một file khác
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 gap-4 opacity-50 grayscale">
            <ImageIcon className="w-24 h-24" />
            <p className="font-medium">Chưa có file nào được tải lên.</p>
          </div>
        )}
      </div>
    </div>
  );
}
