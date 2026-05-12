import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileType } from 'lucide-react';
import { motion } from 'motion/react';

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  label?: string;
  mini?: boolean;
}

export default function Dropzone({ onFilesAdded, accept, maxFiles = 10, label = "Upload files", mini }: DropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesAdded(acceptedFiles);
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    multiple: maxFiles > 1
  } as any);

  if (mini) {
    return (
      <div 
        {...getRootProps()} 
        className="absolute inset-0 flex items-center justify-center cursor-pointer group"
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3 p-4">
          <div className={`p-4 rounded-2xl transition-all duration-300 ${isDragActive ? 'bg-brand-accent text-white scale-110 shadow-lg' : 'bg-gray-50 text-gray-400 group-hover:bg-brand-accent group-hover:text-white'}`}>
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary opacity-40 group-hover:opacity-100 transition-opacity">Add More</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      {...getRootProps()}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative group cursor-pointer border-2 border-dashed rounded-[2.5rem] p-8 md:p-16 transition-all duration-500 text-center
        ${isDragActive ? 'border-brand-accent bg-blue-50/50 scale-[0.99] shadow-inner' : 'border-gray-200 hover:border-brand-accent hover:bg-gray-50/50 bg-white shadow-sm hover:shadow-xl'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-6">
        <div className={`p-6 rounded-3xl transition-all duration-500 ${isDragActive ? 'bg-brand-accent text-white rotate-12' : 'bg-gray-50 text-brand-secondary group-hover:bg-brand-accent group-hover:text-white group-hover:-rotate-6'}`}>
          <Upload className="w-10 h-10" />
        </div>
        <div className="max-w-xs mx-auto space-y-2">
          <p className="text-xl md:text-2xl font-black text-brand-primary tracking-tight">
            {isDragActive ? 'Initialize Import' : 'Open Workspace'}
          </p>
          <p className="text-xs md:text-sm text-brand-secondary font-medium leading-relaxed opacity-60">
            {label || 'Select a PDF from your computer or drag and drop to start editing with high-precision tools.'}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100/80 px-4 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-200">
            <FileType className="w-3 h-3" /> PDF DOCUMENT
          </span>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-blue-50/50 px-4 py-2 text-[10px] font-black text-brand-accent uppercase tracking-widest border border-blue-100">
             <div className="w-1 h-1 rounded-full bg-brand-accent animate-pulse" />
             High Precision Injection
          </div>
        </div>
      </div>
      
      {/* Structural accent corners */}
      <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-gray-100 group-hover:border-brand-accent/20 transition-colors rounded-tl-lg" />
      <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-gray-100 group-hover:border-brand-accent/20 transition-colors rounded-br-lg" />
    </motion.div>
  );
}
