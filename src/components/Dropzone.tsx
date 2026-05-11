import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileType } from 'lucide-react';
import { motion } from 'motion/react';

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  label?: string;
}

export default function Dropzone({ onFilesAdded, accept, maxFiles = 10, label = "Upload files" }: DropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesAdded(acceptedFiles);
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    multiple: maxFiles > 1
  } as any);

  return (
    <motion.div
      {...getRootProps()}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-12 transition-all duration-300 text-center
        ${isDragActive ? 'border-brand-accent bg-blue-50' : 'border-surface-border hover:border-brand-secondary bg-white'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <div className={`p-4 rounded-full transition-colors ${isDragActive ? 'bg-brand-accent text-white' : 'bg-gray-100 text-brand-secondary group-hover:text-brand-primary'}`}>
          <Upload className="w-8 h-8" />
        </div>
        <div>
          <p className="text-lg font-medium text-brand-primary">{label}</p>
          <p className="text-sm text-brand-secondary mt-1">Drag & drop or click to browse</p>
        </div>
        <div className="flex gap-2 mt-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
            <FileType className="w-3 h-3" /> PDF
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
             Images
          </span>
        </div>
      </div>
    </motion.div>
  );
}
