"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Video } from "lucide-react";
import { ApiClientError, apiClient } from "@/lib/api-client";
import { getStoredSession } from "@/lib/auth";

type Merchant = {
  id: string;
  login_id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  business_name?: string | null;
  territory?: string | null;
  parent_id?: string | null;
  role: string;
  status: string;
};

type KycDocument = {
  id: string;
  document_type: string;
  label: string;
  description?: string;
  required: boolean;
  status: string;
  original_filename?: string;
  file_size_bytes?: number;
  mime_type?: string;
  sha256_checksum?: string;
};

type Application = {
  id: string;
  application_number: string;
  status: string;
  target_merchant_id?: string | null;
  documents: KycDocument[];
  personal?: { full_name: string; email: string; rmn: string };
  business?: { shop_name?: string; business_name?: string; msme_udyam_number?: string };
};

type Paged<T> = { items: T[]; meta: { total_pages: number } };

const ACCEPTED_EVIDENCE = ".pdf,.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp,application/pdf";
const ACTIVE_DOSSIER = new Set(["DRAFT", "CORRECTION_REQUIRED", "UNDER_REVIEW"]);

function errorMessage(error: unknown) {
  if (error instanceof ApiClientError) return error.message;
  return "The KYC service could not complete this request. Please retry.";
}

export function MerchantKycDossier() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState("");
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingId, setUploadingId] = useState("");
  const [identity, setIdentity] = useState({ pan: "", aadhaarLastFour: "", msme: "" });
  const [bank, setBank] = useState({ holder: "", name: "", account: "", ifsc: "" });
  const [videoDuration, setVideoDuration] = useState(0);
  const [recording, setRecording] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [lastCapturedVideo, setLastCapturedVideo] = useState<File | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStartedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const session = typeof window !== "undefined" ? getStoredSession("admin") : null;
  const token = session?.accessToken;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) {
        setLoadingError("Your admin session is not connected to the KYC API. Sign in again to load merchants.");
        setLoading(false);
        return;
      }
      try {
        const [retailerPages, appPages] = await Promise.all([
          fetchPages<Merchant>("/retailers", token, "page_size"),
          fetchPages<Application>("/onboarding", token, "limit", { role: "RETAILER" }),
        ]);
        if (cancelled) return;
        setMerchants(retailerPages.flatMap((page) => page.items).filter((merchant) => merchant.status === "ACTIVE"));
        setApplications(appPages.flatMap((page) => page.items));
      } catch (loadError) {
        if (!cancelled) setLoadingError(errorMessage(loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [token]);

  async function fetchPages<T>(path: string, authToken: string, sizeKey: "limit" | "page_size", extra?: Record<string, string>) {
    const first = await apiClient.get<Paged<T>>(path, {
      token: authToken,
      params: { page: 1, [sizeKey]: 100, ...extra },
    });
    const pages = [first];
    for (let page = 2; page <= first.meta.total_pages; page += 1) {
      pages.push(await apiClient.get<Paged<T>>(path, { token: authToken, params: { page, [sizeKey]: 100, ...extra } }));
    }
    return pages;
  }

  const selectedMerchant = merchants.find((merchant) => merchant.id === selectedMerchantId) || null;
  const openDossier = applications.find(
    (item) => item.target_merchant_id === selectedMerchantId && ACTIVE_DOSSIER.has(item.status),
  ) || null;

  useEffect(() => {
    setApplication(openDossier);
    setError("");
    setNotice("");
    setLastCapturedVideo(null);
    if (openDossier?.documents) {
      const videoDoc = openDossier.documents.find((doc) => doc.document_type === "VKYC_VIDEO");
      setVideoDuration(videoDoc?.status === "UPLOADED" ? 0 : 0);
    }
  }, [openDossier]);

  useEffect(() => () => Object.values(previews).forEach((url) => URL.revokeObjectURL(url)), [previews]);

  async function createDossier() {
    if (!selectedMerchant || !token) return;
    setError("");
    setNotice("");
    if (!selectedMerchant.parent_id) {
      setError("This retailer has no assigned Area Distributor. Fix its hierarchy before starting a KYC dossier.");
      return;
    }
    if (!selectedMerchant.email || !selectedMerchant.phone) {
      setError("This merchant is missing a registered email or mobile number. Update the merchant profile before starting KYC.");
      return;
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(identity.pan.trim().toUpperCase())) {
      setError("Enter a valid 10-character PAN before creating the dossier.");
      return;
    }
    if (!/^\d{4}$/.test(identity.aadhaarLastFour)) {
      setError("Enter the last four Aadhaar digits.");
      return;
    }
    if (bank.account.trim().length < 6 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifsc.trim().toUpperCase())) {
      setError("Enter a valid bank account number and IFSC code.");
      return;
    }
    setBusy(true);
    try {
      const created = await apiClient.post<Application>("/onboarding", {
        applicant_role: "RETAILER",
        target_merchant_id: selectedMerchant.id,
        parent_distributor_id: selectedMerchant.parent_id,
        territory: selectedMerchant.territory,
        personal: { full_name: selectedMerchant.full_name, rmn: selectedMerchant.phone, email: selectedMerchant.email },
        business: { business_name: selectedMerchant.business_name, shop_name: selectedMerchant.business_name, msme_udyam_number: identity.msme || null },
        identity: { pan_number: identity.pan.trim().toUpperCase(), aadhaar_last_four: identity.aadhaarLastFour },
        bank: { account_holder_name: bank.holder || selectedMerchant.full_name, bank_name: bank.name, account_number: bank.account, ifsc_code: bank.ifsc.trim().toUpperCase() },
        video_kyc: { vkyc_duration_seconds: 0, vkyc_status: "Not Started", vkyc_consent_given: false },
      }, { token });
      setApplication(created);
      setApplications((items) => [created, ...items]);
      setNotice(`Draft ${created.application_number} saved. Upload the required evidence to continue.`);
    } catch (createError) {
      setError(errorMessage(createError));
    } finally {
      setBusy(false);
    }
  }

  async function uploadEvidence(doc: KycDocument, file: File) {
    if (!application || !token) return;
    setError("");
    setNotice("");
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
    setPreviews((existing) => {
      if (existing[doc.id]) URL.revokeObjectURL(existing[doc.id]);
      return { ...existing, [doc.id]: previewUrl };
    });
    setUploadingId(doc.id);
    try {
      const uploaded = await apiClient.uploadFile<KycDocument>(
        `/onboarding/${application.id}/documents/${doc.id}/upload`, file, file.name, "file", undefined, { token },
      );
      setApplication((current) => current ? {
        ...current,
        documents: current.documents.map((entry) => entry.id === uploaded.id ? uploaded : entry),
      } : current);
      setApplications((items) => items.map((entry) => entry.id === application.id ? {
        ...entry,
        documents: entry.documents.map((item) => item.id === uploaded.id ? uploaded : item),
      } : entry));
      if (doc.document_type === "VKYC_VIDEO") {
        setNotice("Video file saved to private storage. Duration and identity verification are pending server review.");
        setLastCapturedVideo(null);
      } else {
        setNotice(`${doc.label} saved to private storage.`);
      }
    } catch (uploadError) {
      setError(errorMessage(uploadError));
      setPreviews((existing) => {
        if (existing[doc.id]) URL.revokeObjectURL(existing[doc.id]);
        const next = { ...existing };
        delete next[doc.id];
        return next;
      });
    } finally {
      setUploadingId("");
    }
  }

  async function submitDossier() {
    if (!application || !token) return;
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const submitted = await apiClient.post<Application>(`/onboarding/${application.id}/submit`, undefined, { token });
      setApplication(submitted);
      setApplications((items) => items.map((item) => item.id === submitted.id ? submitted : item));
      setNotice(`${submitted.application_number} was submitted to the compliance queue. Approval and account activation remain separate steps.`);
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  async function startVideoRecording() {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setCameraError("Video capture is unavailable in this browser. Upload a recorded MP4 or WebM file instead.");
      videoInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      const mimeType = ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: BlobPart[] = [];
      recorderRef.current = recorder;
      recordingStartedRef.current = Date.now();
      setVideoDuration(0);
      setRecording(true);
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (timerRef.current) clearInterval(timerRef.current);
        const seconds = Math.floor((Date.now() - recordingStartedRef.current) / 1000);
        setVideoDuration(seconds);
        setRecording(false);
        if (seconds < 30) {
          setCameraError("The recording was shorter than 30 seconds and was not accepted as Video KYC evidence.");
          return;
        }
        const type = recorder.mimeType || "video/webm";
        setLastCapturedVideo(new File(chunks, `video-kyc-${Date.now()}.${type.includes("mp4") ? "mp4" : "webm"}`, { type }));
      };
      recorder.start();
      timerRef.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - recordingStartedRef.current) / 1000);
        setVideoDuration(seconds);
        if (seconds >= 30 && recorder.state === "recording") recorder.stop();
      }, 250);
    } catch {
      setCameraError("Camera or microphone permission was denied or unavailable. Check browser access or upload a video file.");
    }
  }

  const requiredMissing = application?.documents.filter((doc) => doc.required && doc.status === "NOT_UPLOADED") || [];
  const isReadOnly = application?.status === "UNDER_REVIEW";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
      <div className="border-b border-slate-100 pb-3">
        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">Merchant Channel KYC</span>
        <h2 className="mt-1 text-base font-bold text-navy">12-Point KYC Evidence & Video KYC</h2>
        <p className="text-xs text-slate-500">Evidence is stored privately and remains pending human compliance review until approved.</p>
      </div>

      {loading ? <p role="status" className="mt-5 text-sm text-slate-500">Loading authorized merchants…</p> : null}
      {loadingError ? <div role="alert" className="mt-5 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle size={16} />{loadingError}</div> : null}
      {!loading && !loadingError && merchants.length === 0 ? <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">No active merchants are available in your authorized hierarchy.</p> : null}

      {!loadingError && merchants.length > 0 ? <div className="mt-5 max-w-xl">
        <label htmlFor="target-merchant" className="block text-xs font-semibold text-slate-600">Select Target Merchant</label>
        <select id="target-merchant" value={selectedMerchantId} onChange={(event) => setSelectedMerchantId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm">
          <option value="">Choose an authorized active merchant…</option>
          {merchants.map((merchant) => <option key={merchant.id} value={merchant.id}>{merchant.business_name || merchant.full_name} ({merchant.phone || merchant.login_id})</option>)}
        </select>
      </div> : null}

      {selectedMerchant && !application ? <div className="mt-5 space-y-4 rounded-lg border border-slate-200 p-4">
        {openDossier === null && applications.some((item) => item.target_merchant_id === selectedMerchant.id && !ACTIVE_DOSSIER.has(item.status)) ? <p className="text-sm text-slate-600">The latest dossier for this merchant is already closed. A new dossier can be started.</p> : null}
        <p className="text-xs text-slate-600">Registered profile: <strong>{selectedMerchant.full_name}</strong> · {selectedMerchant.email || "No email"} · {selectedMerchant.phone || "No mobile"}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">PAN<input aria-label="PAN number" value={identity.pan} onChange={(e) => setIdentity({ ...identity, pan: e.target.value })} maxLength={10} className="mt-1 w-full rounded border p-2 uppercase" /></label>
          <label className="text-xs font-medium">Aadhaar last four digits<input aria-label="Aadhaar last four digits" value={identity.aadhaarLastFour} onChange={(e) => setIdentity({ ...identity, aadhaarLastFour: e.target.value.replace(/\D/g, "").slice(0, 4) })} inputMode="numeric" maxLength={4} className="mt-1 w-full rounded border p-2" /></label>
          <label className="text-xs font-medium">MSME / Udyam number (optional)<input aria-label="MSME Udyam number" value={identity.msme} onChange={(e) => setIdentity({ ...identity, msme: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
          <label className="text-xs font-medium">Bank name<input aria-label="Bank name" value={bank.name} onChange={(e) => setBank({ ...bank, name: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
          <label className="text-xs font-medium">Account holder<input aria-label="Bank account holder" value={bank.holder || selectedMerchant.full_name} onChange={(e) => setBank({ ...bank, holder: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
          <label className="text-xs font-medium">Bank account number<input aria-label="Bank account number" type="password" autoComplete="off" value={bank.account} onChange={(e) => setBank({ ...bank, account: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
          <label className="text-xs font-medium">IFSC code<input aria-label="IFSC code" value={bank.ifsc} onChange={(e) => setBank({ ...bank, ifsc: e.target.value.toUpperCase() })} maxLength={11} className="mt-1 w-full rounded border p-2 uppercase" /></label>
        </div>
        <button type="button" disabled={busy} onClick={() => void createDossier()} className="rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{busy ? "Starting dossier…" : "Start KYC dossier"}</button>
      </div> : null}

      {application ? <div className="mt-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm">
          <span><strong>{application.application_number}</strong> · {selectedMerchant?.business_name || selectedMerchant?.full_name}</span>
          <span className="rounded bg-white px-2 py-1 text-xs font-semibold">{application.status.replaceAll("_", " ")}</span>
        </div>
        {application.status === "CORRECTION_REQUIRED" ? <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">This dossier needs corrections. Replace any evidence marked for re-upload and resubmit.</p> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {application.documents.map((doc) => <EvidenceCard key={doc.id} doc={doc} disabled={isReadOnly || Boolean(uploadingId)} uploading={uploadingId === doc.id} preview={previews[doc.id]} onFile={(file) => void uploadEvidence(doc, file)} />)}
        </div>

        <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-bold">Biometric & Signature Capture</h3>
          <p className="mt-1 text-xs text-slate-600">The fingerprint scanner integration is not configured in this environment. Signature evidence may be uploaded below; no biometric capture or identity verification is claimed.</p>
          <p className="mt-2 text-xs font-semibold text-amber-800">Fingerprint status: NOT CONFIGURED</p>
        </section>

        {application.documents.some((doc) => doc.document_type === "VKYC_VIDEO") ? <section className="rounded-lg border border-sky-200 bg-sky-50 p-4">
          <div className="flex items-center gap-2"><Video size={18} /><h3 className="text-sm font-bold">30-Second Video KYC</h3></div>
          <p className="mt-1 text-xs text-slate-600">A real browser recording is required for capture. The server checksum is shown after private storage; duration parsing and identity/liveness verification are not configured.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" disabled={recording || isReadOnly} onClick={() => void startVideoRecording()} className="rounded bg-sky-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">{recording ? `Recording ${videoDuration}s / 30s` : "Start 30s Video Session"}</button>
            {recording ? <button type="button" onClick={() => recorderRef.current?.stop()} className="rounded border px-3 py-2 text-xs">Stop recording</button> : null}
            {lastCapturedVideo && videoDuration >= 30 ? <button type="button" disabled={Boolean(uploadingId) || isReadOnly} onClick={() => {
              const videoDoc = application.documents.find((doc) => doc.document_type === "VKYC_VIDEO");
              if (videoDoc) void uploadEvidence(videoDoc, lastCapturedVideo);
            }} className="rounded bg-slate-900 px-3 py-2 text-xs font-bold text-white">Save recorded video</button> : null}
            <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,.mp4,.webm" className="hidden" onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              const videoDoc = application.documents.find((doc) => doc.document_type === "VKYC_VIDEO");
              if (file && videoDoc) void uploadEvidence(videoDoc, file);
              event.currentTarget.value = "";
            }} />
          </div>
          {videoDuration > 0 ? <p className="mt-2 text-xs text-slate-600">Browser capture timer: {videoDuration} seconds. This is not an identity verification result.</p> : null}
          {cameraError ? <p role="alert" className="mt-2 text-xs text-rose-700">{cameraError}</p> : null}
        </section> : null}

        {error ? <div role="alert" className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle size={16} />{error}</div> : null}
        {notice ? <div role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800"><CheckCircle2 size={16} />{notice}</div> : null}
        {!isReadOnly ? <button type="button" disabled={busy || Boolean(uploadingId)} onClick={() => void submitDossier()} className="w-full rounded-lg bg-navy py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {busy ? "Submitting…" : "Submit Complete 12-Point Dossier"}
        </button> : <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Submitted and pending compliance review. Approval and account activation are separate.</p>}
        {requiredMissing.length > 0 && !isReadOnly ? <p className="text-xs text-slate-500">Required evidence remaining: {requiredMissing.map((doc) => doc.label).join(", ")}</p> : null}
      </div> : null}
      {error && !application ? <div role="alert" className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle size={16} />{error}</div> : null}
      {notice && !application ? <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p> : null}
    </div>
  );
}

function EvidenceCard({ doc, disabled, uploading, preview, onFile }: {
  doc: KycDocument;
  disabled: boolean;
  uploading: boolean;
  preview?: string;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isVideo = doc.document_type === "VKYC_VIDEO";
  return <div className="rounded-lg border border-dashed border-slate-300 p-3">
    <div className="flex items-start justify-between gap-2">
      <div><p className="text-xs font-bold text-slate-800">{doc.label}{doc.required ? " *" : ""}</p><p className="mt-1 text-[11px] text-slate-500">{doc.description}</p></div>
      <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${doc.status === "UPLOADED" || doc.status === "VERIFIED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{doc.status.replaceAll("_", " ")}</span>
    </div>
    {doc.original_filename ? <p className="mt-2 break-all text-[11px] text-slate-600">{doc.original_filename} · {doc.file_size_bytes ? `${Math.ceil(doc.file_size_bytes / 1024)} KB` : ""}</p> : null}
    {doc.sha256_checksum ? <p className="mt-1 break-all font-mono text-[10px] text-slate-500">Server SHA-256: {doc.sha256_checksum}</p> : null}
    {preview ? <img src={preview} alt={`${doc.label} local preview`} className="mt-2 max-h-32 rounded border object-contain" /> : null}
    <input ref={inputRef} type="file" accept={isVideo ? "video/mp4,video/webm,.mp4,.webm" : ACCEPTED_EVIDENCE} className="hidden" onChange={(event) => {
      const file = event.currentTarget.files?.[0];
      if (file) onFile(file);
      event.currentTarget.value = "";
    }} />
    <button type="button" disabled={disabled || uploading} onClick={() => inputRef.current?.click()} className="mt-3 rounded bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 disabled:opacity-50">
      {uploading ? <span className="flex items-center gap-1"><Loader2 className="animate-spin" size={12} />Uploading…</span> : doc.original_filename ? "Replace evidence" : "Choose file"}
    </button>
  </div>;
}
