import React, { useState } from 'react';


interface BanAppealFormProps {
  onSubmit: (email: string, reason: string, files: File[]) => void;
  submitting: boolean;
  error?: string;
  onClose?: () => void;
}



export const BanAppealForm: React.FC<BanAppealFormProps> = ({ onSubmit, submitting, error, onClose }) => {
  const [email, setEmail] = useState('');
  const [appealReason, setAppealReason] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [showFileError, setShowFileError] = useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    if (files.length + selected.length > 3) {
      setShowFileError('You can upload up to 3 files.');
      return;
    }
    setFiles(prev => [...prev, ...selected].slice(0, 3));
    setShowFileError('');
    e.target.value = '';
  };

  const handleRemoveFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setShowFileError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <form
        onSubmit={e => {
          e.preventDefault();
          onSubmit(email, appealReason, files);
        }}
        className="relative flex flex-col items-center bg-[#2C1A1D] rounded-2xl shadow-2xl p-8 w-full max-w-md border-2 border-[#CDAA7D]"
      >
        <button
          type="button"
          className="absolute top-4 right-4 text-[#CDAA7D] hover:text-red-400 text-xl font-bold focus:outline-none"
          onClick={() => {
            if (typeof onClose === 'function') onClose?.();
          }}
          tabIndex={0}
        >
          ×
        </button>
        <h2 className="text-2xl font-extrabold mb-4 text-[#CDAA7D]">Appeal Ban</h2>
        <input
          type="email"
          className="w-full p-3 rounded border border-[#CDAA7D] bg-[#3B2326] text-[#F4F0E6] mb-4 focus:outline-none focus:ring-2 focus:ring-[#CDAA7D]"
          placeholder="Enter your account email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <textarea
          className="w-full p-3 rounded border border-[#CDAA7D] bg-[#3B2326] text-[#F4F0E6] mb-4 focus:outline-none focus:ring-2 focus:ring-[#CDAA7D]"
          rows={5}
          placeholder="Explain why you believe this ban should be lifted..."
          value={appealReason}
          onChange={e => setAppealReason(e.target.value)}
          required
        />
        <div className="w-full mb-4">
          <label className="block text-[#CDAA7D] font-semibold mb-2">Evidence (optional, up to 3 files):</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 bg-[#CDAA7D] text-[#2C1A1D] rounded-lg font-semibold hover:bg-[#B89A6D] focus:outline-none"
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= 3 || submitting}
            >
              {files.length >= 3 ? 'Max Files Reached' : 'Choose File(s)'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              disabled={files.length >= 3 || submitting}
              className="hidden"
            />
          </div>
          {showFileError && <div className="text-red-400 text-xs mt-1">{showFileError}</div>}
          {files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {files.map((file, idx) => (
                <li key={idx} className="flex items-center justify-between text-xs text-[#F4F0E6] bg-[#3B2326] border border-[#CDAA7D] rounded px-2 py-1">
                  <span>{file.name}</span>
                  <button
                    type="button"
                    className="ml-2 text-red-400 hover:text-red-600 font-bold"
                    onClick={() => handleRemoveFile(idx)}
                    disabled={submitting}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && <div className="text-red-400 mb-2">{error}</div>}
        <div className="flex w-full gap-3 mt-2">
          <button
            type="button"
            className="flex-1 px-4 py-2 border border-[#CDAA7D] rounded-lg text-[#CDAA7D] hover:bg-[#CDAA7D] hover:text-[#2C1A1D] font-semibold"
            onClick={() => {
              if (typeof onClose === 'function') onClose?.();
            }}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-[#CDAA7D] text-[#2C1A1D] rounded-lg font-semibold hover:bg-[#B89A6D]"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Appeal'}
          </button>
        </div>
      </form>
    </div>
  );
};
