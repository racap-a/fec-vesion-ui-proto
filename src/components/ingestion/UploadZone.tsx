import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, X } from 'lucide-react';
import { clsx } from 'clsx';

interface UploadZoneProps {
    onFileSelected: (file: File) => void;
    isProcessing: boolean;
    selectedFile: File | null;
    clearFile: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelected, isProcessing, selectedFile, clearFile }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles?.length > 0) {
            onFileSelected(acceptedFiles[0]);
        }
    }, [onFileSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/plain': ['.txt', '.csv'],
            'text/csv': ['.csv']
        },
        maxFiles: 1,
        disabled: isProcessing || !!selectedFile
    });

    if (selectedFile) {
        return (
            <div className="bg-blue-50 border-2 border-blue-200 border-dashed rounded-xl p-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="mx-auto w-16 h-16 bg-white text-blue-500 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <FileText size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{selectedFile.name}</h3>
                <p className="text-sm text-slate-500 mb-6">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to Upload</p>

                <button
                    onClick={clearFile}
                    disabled={isProcessing}
                    className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center justify-center gap-1 mx-auto"
                >
                    <X size={16} /> Remove File
                </button>
            </div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={clsx(
                "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer",
                isDragActive ? "border-brand-primary bg-brand-primary/5 scale-[1.02]" : "border-slate-300 hover:border-brand-primary hover:bg-slate-50 bg-slate-50/50",
                isProcessing && "opacity-50 cursor-not-allowed"
            )}
        >
            <input {...getInputProps()} />
            <div className="mx-auto w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:text-brand-primary transition-colors">
                <UploadCloud size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
                {isDragActive ? "Drop FEC file here..." : "Drag & Drop FEC File"}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Supports .txt and .csv files. Maximum size 500MB.
            </p>
        </div>
    );
};
