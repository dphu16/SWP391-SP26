import React from"react";

interface DeleteConfirmationProps {
 isOpen: boolean;
 onCancel: () => void;
 onConfirm: () => void;
 title?: string;
 message?: string;
 isDeleting?: boolean;
}

export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
 isOpen,
 onCancel,
 onConfirm,
 title ="Delete Record",
 message ="Are you sure you want to delete this record? This action cannot be undone.",
 isDeleting = false,
}) => {
 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
 <div className="bg-white rounded-2xl shadow-xl border border-border-light w-full max-w-md overflow-hidden animate-slide-up">
 <div className="p-6">
 <h3 className="text-lg font-bold text-text-primary-light mb-2">{title}</h3>
 <p className="text-sm text-text-secondary-light">{message}</p>
 </div>
 <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50">
 <button
 onClick={onCancel}
 disabled={isDeleting}
 className="px-4 py-2 text-sm font-semibold rounded-xl border border-border-light text-text-secondary-light hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
 >
 Cancel
 </button>
 <button
 onClick={onConfirm}
 disabled={isDeleting}
 className="px-4 py-2 text-sm font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
 >
 {isDeleting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
 {isDeleting ?"Deleting...":"Delete"}
 </button>
 </div>
 </div>
 </div>
 );
};
