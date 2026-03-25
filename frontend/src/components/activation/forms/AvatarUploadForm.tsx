import React, { useRef, useState } from "react";

interface AvatarUploadFormProps {
  avatarFile: File | null;
  setAvatarFile: (file: File | null) => void;
  errors: Record<string, string>;
}

const AvatarUploadForm: React.FC<AvatarUploadFormProps> = ({
  avatarFile,
  setAvatarFile,
  errors,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <label className="text-sm font-semibold text-[#164E63] text-center w-full">
          Profile Picture (Optional)
        </label>
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-50 border-2 border-dashed border-cyan-400 cursor-pointer hover:border-cyan-600 transition-colors flex items-center justify-center group"
        >
          {preview ? (
            <img src={preview} alt="Avatar preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-cyan-500 group-hover:text-cyan-700 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mb-1">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-sm font-medium">Upload</span>
            </div>
          )}
        </div>
        
        <p className="text-[13px] text-gray-500 font-medium">
          Supports JPG, JPEG, PNG (Max 2MB)
        </p>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/jpg"
          className="hidden"
        />

        {errors.avatarFile && (
          <p className="text-sm text-rose-600 font-medium mt-1">{errors.avatarFile}</p>
        )}
      </div>
    </div>
  );
};

export default AvatarUploadForm;
