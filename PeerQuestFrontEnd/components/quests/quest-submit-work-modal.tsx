import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, UploadCloud, FileText, Image as ImageIcon, CheckCircle2, Clock, AlertCircle } from "lucide-react";






interface QuestSubmitWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  questParticipantId?: number; // The participant record for this user/quest (optional)
  applicationId?: number; // The application record for this user/quest (optional)
  questTitle?: string;
  questSlug?: string;
  submissionStatus?: string;
  submissionTimestamp?: string;
  showToast?: (message: string, type?: string) => void;
}

export const QuestSubmitWorkModal: React.FC<QuestSubmitWorkModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  questParticipantId,
  applicationId,
  questTitle,
  questSlug,
  submissionStatus,
  submissionTimestamp,
  showToast,
}) => {

  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submissionsUsed, setSubmissionsUsed] = useState<number | null>(null);
  const [submissionLimit, setSubmissionLimit] = useState<number>(5);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const infoRef = useRef<HTMLDivElement | null>(null);

  // Optionally, you can pass submission status/timestamps as props
  // If provided, show them below the file upload

  if (!isOpen) return null;

  // Helper to fetch submission count
  const fetchSubmissionCount = useCallback(() => {
    if (questSlug) {
      import("@/lib/api/quests").then(({ QuestAPI }) => {
        QuestAPI.getSubmissionCount(questSlug).then(res => {
          setSubmissionsUsed(res.submissions_used);
          setSubmissionLimit(res.submission_limit);
        });
      });
    }
  }, [questSlug]);

  useEffect(() => {
    if (isOpen && questSlug) {
      fetchSubmissionCount();
    }
  }, [isOpen, questSlug, fetchSubmissionCount]);

  // Submission limit notice
  const submissionLimitNotice = (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 mb-4 flex items-center gap-2">
      <AlertCircle className="w-5 h-5 text-yellow-500" />
      <span>
        {submissionsUsed !== null
          ? `You have used ${submissionsUsed} out of ${submissionLimit} submissions for this quest.`
          : `You may submit up to ${submissionLimit} times for this quest. Further submissions will be blocked.`}
      </span>
    </div>
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArr = Array.from(e.target.files);
      // Prevent duplicate files by name and size
      setFiles((prev) => {
        const existing = new Set(prev.map(f => f.name + f.size));
        return [...prev, ...fileArr.filter(f => !existing.has(f.name + f.size))];
      });
      setErrors("");
    }
  };

  // Drag-and-drop handlers
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files);
      setFiles((prev) => {
        const existing = new Set(prev.map(f => f.name + f.size));
        return [...prev, ...dropped.filter(f => !existing.has(f.name + f.size))];
      });
      setErrors("");
    }
  }, []);
  // Remove a file from the list
  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors("");
    setSuccess(false);
    try {
      if (!questParticipantId && !applicationId) {
        setErrors("No participant or approved application found for submission.");
        setIsLoading(false);
        return;
      }
      if (questParticipantId && applicationId) {
        setErrors("Cannot submit with both participant and application. Please contact support.");
        setIsLoading(false);
        return;
      }
      // Use API helper
      const { QuestAPI } = await import("@/lib/api/quests");
      if (!questSlug) {
        setErrors("Quest slug is required for submission.");
        setIsLoading(false);
        return;
      }
      await QuestAPI.submitQuestWork({
        questSlug,
        ...(questParticipantId ? { questParticipantId } : {}),
        ...(applicationId ? { applicationId } : {}),
        description,
        link,
        files,
      });
      setDescription("");
      setLink("");
      setFiles([]);
      setSuccess(true);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for backend to update
      fetchSubmissionCount(); // <-- Refresh attempts after submit
      onSuccess();
      // Optionally, auto-close after a short delay
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      // Improved error handling
      let msg = "An error occurred. Please try again.";
      let isSubmissionCap = false;
      if (err?.backend) {
        // DRF ValidationError: { field: ["error"] }
        if (typeof err.backend === "object" && !Array.isArray(err.backend)) {
          // If 'detail' is present, show it
          if (typeof err.backend.detail === "string" && err.backend.detail.trim().length > 0) {
            msg = err.backend.detail;
          } else {
            // Show first field error if available
            const firstKey = Object.keys(err.backend)[0];
            let fieldMsg = "";
            if (firstKey && Array.isArray(err.backend[firstKey]) && err.backend[firstKey].length > 0) {
              fieldMsg = `${err.backend[firstKey][0]}`;
            } else if (typeof err.backend[firstKey] === "string") {
              fieldMsg = `${err.backend[firstKey]}`;
            } else {
              fieldMsg = JSON.stringify(err.backend);
            }
            // Custom friendly message for submission cap
            if (
              (firstKey === "non_field_errors" || firstKey === "detail") &&
              typeof fieldMsg === "string" &&
              fieldMsg.toLowerCase().includes("maximum of 5 submissions")
            ) {
              msg = "You have already submitted the maximum (5) times for this quest. No further submissions are allowed.";
              isSubmissionCap = true;
            } else {
              msg = `${firstKey}: ${fieldMsg}`;
            }
          }
        } else if (typeof err.backend === "string" && err.backend.trim().length > 0) {
          // Custom friendly message for submission cap (string case)
          if (err.backend.toLowerCase().includes("maximum of 5 submissions")) {
            msg = "You have already submitted the maximum (5) times for this quest. No further submissions are allowed.";
            isSubmissionCap = true;
          } else {
            msg = err.backend;
          }
        } else {
          msg = "Submission failed. The server did not return details. Please check your files and try again, or contact support if the problem persists.";
        }
      } else if (err?.message && typeof err.message === "string") {
        msg = err.message;
      } else if (err instanceof TypeError && err.message.includes('NetworkError')) {
        msg = "Network error: Please check your internet connection and try again.";
      }
      setErrors(msg);
      if (showToast) {
        showToast(msg, 'error');
      }
      // Remove console error for user-facing errors
      // if (process.env.NODE_ENV === 'development') {
      //   // For debugging only, uncomment if needed
      //   // console.error("Quest submission error:", err);
      // }
      // Scroll to info/error area if submission cap
      if (isSubmissionCap && infoRef.current) {
        infoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        infoRef.current.focus({ preventScroll: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 rounded-t-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <UploadCloud className="inline w-6 h-6 mr-1" /> Submit Completed Work
            </h2>
            {questTitle && <p className="text-white/90 mt-1">For: {questTitle}</p>}
          </div>
          <button onClick={onClose} className="text-white/90 hover:text-white p-2 hover:bg-white/10 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-amber-50">
          <div ref={infoRef} tabIndex={-1} aria-live="assertive">
            {submissionLimitNotice}
            {/* Submission status */}
            {(isLoading || errors || success) && (
              <div
                className={`rounded-lg p-3 mb-2 flex items-center gap-2
                  ${errors ? "bg-red-50 border border-red-200 text-red-600" : ""}
                  ${isLoading ? "bg-blue-50 border border-blue-200 text-blue-700" : ""}
                  ${success ? "bg-green-50 border border-green-200 text-green-700" : ""}
                `}
                style={errors && errors.includes('maximum (5) times') ? { fontWeight: 'bold', fontSize: '1.1em', outline: '2px solid #f59e42', outlineOffset: '2px' } : {}}
              >
                {isLoading ? (
                  <Clock className="w-5 h-5" />
                ) : errors ? (
                  <X className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
                {isLoading
                  ? "Submitting..."
                  : errors
                  ? errors
                  : "Submission successful!"}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-amber-800 mb-2">Text Description</label>
            <textarea
              className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-gray-900"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your work or add notes"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-amber-800 mb-2">Link (optional)</label>
            <input
              type="url"
              className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-gray-900"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Paste a link to your work (if any)"
            />
          </div>
          {/* Drag-and-drop file upload */}
          <div>
            <label className="block text-sm font-semibold text-amber-800 mb-2">Upload Files (images/docs, no size limit)</label>
            <div
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${dragActive ? "border-amber-500 bg-amber-100" : "border-amber-300 bg-white"}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={handleBrowseFiles}
            >
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 text-amber-400 mb-2" />
              <span className="text-amber-800 font-medium">Drag & drop files here, or <span className="underline">browse</span></span>
              <span className="text-xs text-amber-700 mt-1">Accepted: images, PDF, DOC, TXT</span>
            </div>
            {files.length > 0 && (
              <ul className="mt-3 grid grid-cols-1 gap-2">
                {files.map((file, idx) => {
                  const isImage = file.type.startsWith("image/");
                  return (
                    <li key={file.name + idx} className="flex items-center gap-3 bg-white border border-amber-200 rounded-lg p-2 relative group">
                      {isImage ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-10 h-10 object-cover rounded"
                          onLoad={e => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                        />
                      ) : (
                        <FileText className="w-8 h-8 text-amber-400" />
                      )}
                      <div className="flex-1">
                        <span className="block font-medium text-amber-900 text-sm">{file.name}</span>
                        <span className="block text-xs text-amber-700">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <button
                        type="button"
                        aria-label="Remove file"
                        className="absolute top-1 right-1 p-1 rounded-full bg-white border border-amber-200 text-amber-500 hover:bg-amber-100 hover:text-red-600 transition-opacity opacity-70 group-hover:opacity-100"
                        onClick={e => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {/* Show submission status/timestamp if available as props */}
          {submissionStatus && (
            <div className="text-xs text-gray-500 mt-2">
              Status: {submissionStatus}
              {submissionTimestamp && (
                <span> | Submitted: {new Date(submissionTimestamp).toLocaleString()}</span>
              )}
            </div>
          )}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-amber-500 border border-transparent rounded-lg hover:from-purple-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Submitting..." : "Submit Work"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestSubmitWorkModal;
