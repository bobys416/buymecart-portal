"use client";

import React, { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  FileText,
  HelpCircle,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { DocumentVerificationStatus, KYCDocumentItem } from "@/lib/onboarding/types";

interface KycDocumentUploadProps {
  document: KYCDocumentItem;
  onChange: (updated: KYCDocumentItem) => void;
  readOnly?: boolean;
  onPreview?: (doc: KYCDocumentItem) => void;
}

const statusBadgeConfig: Record<
  DocumentVerificationStatus,
  { label: string; className: string }
> = {
  "Not Uploaded": {
    label: "Not Uploaded",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  Uploaded: {
    label: "Uploaded",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  "Pending Review": {
    label: "Pending Review",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  Verified: {
    label: "Verified ✓",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  Rejected: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
  "Re-upload Required": {
    label: "Re-upload Required",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  Expired: {
    label: "Expired",
    className: "bg-slate-100 text-slate-500 border-slate-200",
  },
};

export function KycDocumentUpload({
  document,
  onChange,
  readOnly = false,
  onPreview,
}: KycDocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/webm",
  ];
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Validate MIME type
    if (!allowedMimeTypes.includes(file.type)) {
      setErrorMessage(
        "Invalid format. Permitted file types: PDF, JPEG, PNG, MP4, WebM."
      );
      return;
    }

    // Validate size limit
    if (file.size > maxSizeBytes) {
      setErrorMessage("File exceeds 10MB maximum statutory compliance limit.");
      return;
    }

    // Simulate progress bar for realistic feedback
    setUploadProgress(15);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 120);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(null);

      // Create preview object URL safely
      const previewUrl = URL.createObjectURL(file);

      onChange({
        ...document,
        status: "Uploaded",
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl: previewUrl,
        uploadedAt: new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }, 600);
  };

  const handleRemove = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    onChange({
      ...document,
      status: "Not Uploaded",
      fileName: undefined,
      fileSize: undefined,
      fileUrl: undefined,
      uploadedAt: undefined,
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const badge = statusBadgeConfig[document.status] || statusBadgeConfig["Not Uploaded"];

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 transition-all duration-200 hover:border-[#CBD5E1]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-[#101C32]">{document.label}</h4>
            {document.required ? (
              <span className="rounded bg-rose-50 px-1.5 py-0.2 font-mono text-[9px] font-bold text-rose-700 border border-rose-200">
                MANDATORY
              </span>
            ) : (
              <span className="rounded bg-slate-100 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-slate-500">
                OPTIONAL
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#64748B] mt-0.5">{document.description}</p>
        </div>

        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border shrink-0 ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Reviewer Remarks Banner if Re-upload or Rejected */}
      {document.reviewerRemarks && (
        <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-2.5 text-xs text-orange-900 flex items-start gap-2">
          <AlertCircle size={14} className="text-orange-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-[11px]">Compliance Officer Remark:</strong>
            <p className="text-[11px] mt-0.5">{document.reviewerRemarks}</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="mt-2 text-xs text-rose-600 font-medium flex items-center gap-1.5">
          <AlertCircle size={13} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload State / Selected File Card */}
      <div className="mt-3">
        {uploadProgress !== null ? (
          <div className="rounded-xl border border-[#16B8A6] bg-[#F5F7FA] p-3 text-xs">
            <div className="flex justify-between items-center mb-1 text-[11px] text-[#101C32] font-semibold">
              <span>Encrypting and uploading document...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#16B8A6] transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : document.fileName ? (
          <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3 text-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#101C32] text-[#16B8A6] shrink-0">
                <FileCheck size={16} />
              </div>
              <div className="truncate">
                <p className="font-bold text-[#101C32] truncate">{document.fileName}</p>
                <p className="text-[10px] text-[#64748B]">
                  {formatFileSize(document.fileSize)} · Uploaded {document.uploadedAt}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              {onPreview && document.fileUrl && (
                <button
                  type="button"
                  onClick={() => onPreview(document)}
                  className="rounded-lg p-1.5 text-[#64748B] hover:bg-white hover:text-[#101C32] transition"
                  title="Preview Document"
                >
                  <Eye size={14} />
                </button>
              )}

              {!readOnly && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg p-1.5 text-[#64748B] hover:bg-white hover:text-[#101C32] transition"
                    title="Re-upload"
                  >
                    <RefreshCw size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition"
                    title="Remove File"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          !readOnly && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4,.webm"
                onChange={handleFileSelected}
                className="hidden"
                id={`file-upload-${document.id}`}
              />
              <label
                htmlFor={`file-upload-${document.id}`}
                className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F5F7FA] p-4 text-center cursor-pointer hover:border-[#16B8A6] hover:bg-[#16B8A6]/5 transition group"
              >
                <Upload
                  size={20}
                  className="text-[#64748B] group-hover:text-[#16B8A6] transition"
                />
                <span className="mt-1.5 text-xs font-bold text-[#101C32] group-hover:text-[#16B8A6]">
                  Click to Upload or Drag File Here
                </span>
                <span className="text-[10px] text-[#64748B] mt-0.5">
                  PDF, JPEG, PNG, MP4 up to 10MB
                </span>
              </label>
            </div>
          )
        )}
      </div>
    </div>
  );
}
