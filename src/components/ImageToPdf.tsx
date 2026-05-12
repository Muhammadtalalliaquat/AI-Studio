import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { FileCode, Trash2, Download, Printer } from 'lucide-react';
import Dropzone from './Dropzone';

interface ImageFile {
  file: File;
  preview: string;
}

export default function ImageToPdf() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [orientation, setOrientation] = useState<'p' | 'l' | 'auto'>('auto');

  const onFilesAdded = (files: File[]) => {
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const generatePdf = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);

    try {
      // Initialize with user preference or first image ratio
      const pdf = new jsPDF({
        orientation: orientation === 'auto' ? 'p' : orientation,
        unit: 'mm',
        format: 'a4'
      });
      
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const imgData = await getBase64(img.file);
        
        const imgElement = new Image();
        imgElement.src = img.preview;
        
        await new Promise((resolve) => {
          imgElement.onload = () => {
            let pageWidth = pdf.internal.pageSize.getWidth();
            let pageHeight = pdf.internal.pageSize.getHeight();
            const imgRatio = imgElement.width / imgElement.height;

            // Handle Auto Orientation
            if (orientation === 'auto') {
              if (imgRatio > 1) { // Landscape image
                pdf.addPage('a4', 'l');
              } else { // Portrait image
                pdf.addPage('a4', 'p');
              }
              // If it's the first image, the extra first blank page needs handling
              if (i === 0) {
                 pdf.deletePage(1);
              }
              pageWidth = pdf.internal.pageSize.getWidth();
              pageHeight = pdf.internal.pageSize.getHeight();
            } else if (i > 0) {
              pdf.addPage('a4', orientation);
            }
            
            let width = pageWidth;
            let height = pageWidth / imgRatio;
            
            if (height > pageHeight) {
              height = pageHeight;
              width = pageHeight * imgRatio;
            }
            
            pdf.addImage(imgData, 'JPEG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height);
            resolve(null);
          };
        });
      }

      pdf.save('studio-collection.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Image compiler</h2>
          <p className="text-brand-secondary mt-2">Convert your photos and designs into high-quality PDFs.</p>
        </div>
        
        {images.length > 0 && (
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex bg-white p-1 rounded-xl border border-surface-border shadow-sm">
              <button 
                onClick={() => setOrientation('p')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${orientation === 'p' ? 'bg-brand-accent text-white' : 'text-brand-secondary hover:text-brand-primary'}`}
              >
                Portrait
              </button>
              <button 
                onClick={() => setOrientation('l')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${orientation === 'l' ? 'bg-brand-accent text-white' : 'text-brand-secondary hover:text-brand-primary'}`}
              >
                Landscape
              </button>
              <button 
                onClick={() => setOrientation('auto')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${orientation === 'auto' ? 'bg-brand-accent text-white' : 'text-brand-secondary hover:text-brand-primary'}`}
              >
                Auto-Detect
              </button>
            </div>
            
            <button
              onClick={generatePdf}
              disabled={isGenerating}
              className="w-full md:w-auto bg-brand-accent text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? 'Compiling...' : <><Download className="w-5 h-5" /> Export PDF</>}
            </button>
          </div>
        )}
      </div>

      {images.length === 0 ? (
        <Dropzone 
          onFilesAdded={onFilesAdded} 
          accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
          label="Drop images to convert"
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          <AnimatePresence mode="popLayout">
            {images.map((img, idx) => (
              <motion.div
                key={img.preview}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group aspect-[3/4] bg-white rounded-3xl overflow-hidden shadow-sm ring-1 ring-gray-200"
              >
                <img src={img.preview} className="w-full h-full object-cover" alt={`preview-${idx}`} />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                  <button 
                    onClick={() => removeImage(idx)}
                    className="p-3 bg-red-500 text-white rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/20">
                  Page {idx + 1}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          <div className="aspect-[3/4] rounded-3xl overflow-hidden relative border-2 border-dashed border-gray-200 hover:border-brand-accent hover:bg-blue-50/50 transition-all group p-1">
            <Dropzone 
               onFilesAdded={onFilesAdded} 
               accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
               mini
            />
          </div>
        </div>
      )}
    </div>
  );
}
