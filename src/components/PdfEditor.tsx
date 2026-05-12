import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Type, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Settings2, 
  Baseline, 
  Bold, 
  Palette,
  Trash2,
  MousePointer,
  Square,
  Loader2,
  Check,
  Plus,
  Hand
} from 'lucide-react';
import Dropzone from './Dropzone';

// High-reliability worker URL
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Annotation {
  id: string;
  text: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  pageIndex: number;
  fontSize: number;
  color: string;
  bgColor: string | null;
  isBold: boolean;
  fontFamily: string;
}

const FONTS = [
  { name: 'Modern Sans', value: 'Helvetica', css: '"Inter", sans-serif' },
  { name: 'Classic Serif', value: 'TimesRoman', css: '"Times New Roman", serif' },
  { name: 'Precision Mono', value: 'Courier', css: '"JetBrains Mono", monospace' },
];

const COLORS = [
  { name: 'Black', value: '#000000', rgb: [0, 0, 0] },
  { name: 'Blue', value: '#1D4ED8', rgb: [0.11, 0.3, 0.85] },
  { name: 'Red', value: '#DC2626', rgb: [0.86, 0.15, 0.15] },
  { name: 'Green', value: '#059669', rgb: [0.02, 0.59, 0.41] },
  { name: 'White', value: '#FFFFFF', rgb: [1, 1, 1] },
];

export default function PdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<'text' | 'select'>('text');
  
  // Selection & Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [containerWidth, setContainerWidth] = useState(800);
  
  // Tool Inspector Defaults
  const [currentFontSize, setCurrentFontSize] = useState(16);
  const [currentTextColor, setCurrentTextColor] = useState(COLORS[0]);
  const [currentBgColor, setCurrentBgColor] = useState<string | null>(null);
  const [currentFont, setCurrentFont] = useState(FONTS[0]);
  const [isBold, setIsBold] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const editorParentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editorParentRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Leave some padding
        setContainerWidth(Math.floor(entry.contentRect.width - 24));
      }
    });

    resizeObserver.observe(editorParentRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Sync Settings to selected annotation
  useEffect(() => {
    if (editingId) {
      const activeAnno = annotations.find(a => a.id === editingId);
      if (activeAnno) {
        setCurrentFontSize(activeAnno.fontSize);
        const colorObj = COLORS.find(c => c.value === activeAnno.color);
        if (colorObj) setCurrentTextColor(colorObj);
        setCurrentBgColor(activeAnno.bgColor);
        setIsBold(activeAnno.isBold);
        const fontObj = FONTS.find(f => f.value === activeAnno.fontFamily);
        if (fontObj) setCurrentFont(fontObj);
      }
    }
  }, [editingId]);

  // Update selected annotation when settings change
  useEffect(() => {
    if (editingId) {
      setAnnotations(prev => prev.map(a => {
        if (a.id === editingId) {
          return {
            ...a,
            fontSize: currentFontSize,
            color: currentTextColor.value,
            bgColor: currentBgColor,
            isBold: isBold,
            fontFamily: currentFont.value
          };
        }
        return a;
      }));
    }
  }, [currentFontSize, currentTextColor, currentBgColor, isBold, currentFont, editingId]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  const onFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setIsLoading(true);
      setFile(files[0]);
      setAnnotations([]);
      setPageNumber(1);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (editingId) {
      finishEditing();
      return;
    }

    if (activeTool !== 'text' || !containerRef.current) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('.annotation-node') || target.closest('button')) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newId = Math.random().toString(36).substr(2, 9);
    const newAnno: Annotation = {
      id: newId,
      text: '',
      x,
      y: y - 1, 
      pageIndex: pageNumber - 1,
      fontSize: currentFontSize,
      color: currentTextColor.value,
      bgColor: currentBgColor,
      isBold: isBold,
      fontFamily: currentFont.value
    };

    setAnnotations(prev => [...prev, newAnno]);
    setEditingId(newId);
    setEditingText('');
  };

  const finishEditing = () => {
    if (!editingId) return;
    
    setAnnotations(prev => prev.map(a => {
      if (a.id === editingId) {
        return { ...a, text: editingText };
      }
      return a;
    }).filter(a => a.text.trim() !== '' || a.id !== editingId));
    
    setEditingId(null);
    setEditingText('');
  };

  const handleClose = () => {
    setFile(null);
    setAnnotations([]);
    setPageNumber(1);
    setEditingId(null);
    setEditingText('');
    setActiveTool('text');
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditingText('');
    }
  };

  const handleDragEnd = (id: string, _: any, info: any) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Use info.point (absolute coordinates) and convert to percentage relative to container
    const newX = ((info.point.x - rect.left) / rect.width) * 100;
    const newY = ((info.point.y - rect.top) / rect.height) * 100;
    
    setAnnotations(prev => prev.map(anno => {
      if (anno.id === id) {
        return { 
          ...anno, 
          x: Math.max(0, Math.min(95, newX)), 
          y: Math.max(0, Math.min(98, newY)) 
        };
      }
      return anno;
    }));
  };

  const exportPdf = async () => {
    if (!file) return;
    setIsSaving(true);
    finishEditing();

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer);
      
      // Embed all possible fonts to avoid repeated embedding
      const fonts: Record<string, any> = {
        'Helvetica': await pdfDoc.embedFont(StandardFonts.Helvetica),
        'Helvetica-Bold': await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        'Courier': await pdfDoc.embedFont(StandardFonts.Courier),
        'Courier-Bold': await pdfDoc.embedFont(StandardFonts.CourierBold),
        'TimesRoman': await pdfDoc.embedFont(StandardFonts.TimesRoman),
        'TimesRoman-Bold': await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
      };

      const pages = pdfDoc.getPages();

      for (const anno of annotations) {
        if (!anno.text.trim()) continue;
        
        const page = pages[anno.pageIndex];
        const { width, height } = page.getSize();
        
        const pdfX = (anno.x / 100) * width;
        const pdfY = height - ((anno.y / 100) * height) - (anno.fontSize * 0.9);

        const colorObj = COLORS.find(c => c.value === anno.color) || COLORS[0];
        const [r, g, b]: any = colorObj.rgb;

        const fontKey = anno.isBold ? `${anno.fontFamily}-Bold` : anno.fontFamily;
        const selectedFont = fonts[fontKey] || fonts['Helvetica'];

        if (anno.bgColor) {
          const bgObj = COLORS.find(c => c.value === anno.bgColor);
          if (bgObj) {
            const [br, bg, bb]: any = bgObj.rgb;
            const textWidth = selectedFont.widthOfTextAtSize(anno.text, anno.fontSize);
            page.drawRectangle({
              x: pdfX - 4,
              y: pdfY - 4,
              width: textWidth + 8,
              height: anno.fontSize + 8,
              color: rgb(br, bg, bb),
            });
          }
        }

        page.drawText(anno.text, {
          x: pdfX,
          y: pdfY,
          size: anno.fontSize,
          font: selectedFont,
          color: rgb(r, g, b),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `architect_pro_${Date.now()}.pdf`;
      link.click();
    } catch (err) {
      console.error('Export Error:', err);
      alert('Export failed. This PDF might be protected or incompatible with high-precision injection.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full gap-4 md:gap-5 pb-6 md:pb-10 px-4 md:px-0">
      {/* Structural Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 md:p-5 rounded-3xl md:rounded-[2.5rem] border border-surface-border shadow-sm gap-4 md:gap-5 mt-4 md:mt-0">
        <div className="flex items-center gap-4 md:gap-5 w-full md:w-auto">
           <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-accent rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/10 shrink-0">
              <Plus className="w-5 h-5 md:w-6 md:h-6" />
           </div>
           <div className="min-w-0">
             <h2 className="text-lg md:text-xl font-bold text-brand-primary tracking-tight truncate">PDF Architect Pro</h2>
             <p className="text-[8px] md:text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] truncate">Multi-Layer Precision Studio</p>
           </div>
        </div>

        {file && (
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 md:gap-3 w-full md:w-auto">
             <div className="flex bg-gray-100 p-1 rounded-xl md:rounded-2xl border border-gray-200">
                <button 
                  onClick={() => { finishEditing(); setActiveTool('text'); }}
                  className={`flex items-center gap-2 px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition-all ${activeTool === 'text' ? 'bg-white text-brand-accent shadow-sm' : 'text-brand-secondary hover:text-brand-primary'}`}
                >
                  <Type className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">ADD</span> TEXT
                </button>
                <button 
                  onClick={() => { finishEditing(); setActiveTool('select'); }}
                  className={`flex items-center gap-2 px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition-all ${activeTool === 'select' ? 'bg-white text-brand-accent shadow-sm' : 'text-brand-secondary hover:text-brand-primary'}`}
                >
                  <MousePointer className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">ARRANGE</span>
                </button>
             </div>
             
             <div className="w-px h-6 md:h-8 bg-gray-200 mx-1 md:mx-3 hidden sm:block" />

             <div className="flex gap-2">
               <button
                onClick={handleClose}
                className="bg-white border border-red-100 text-red-500 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold hover:bg-red-50 transition-all active:scale-95"
              >
                Close
              </button>
              <button
                onClick={exportPdf}
                disabled={isSaving || annotations.length === 0}
                className="bg-brand-primary text-white px-4 md:px-8 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Download className="w-3 h-3 md:w-4 md:h-4" />}
                <span className="hidden sm:inline">SAVE AS</span> PDF
              </button>
             </div>
          </div>
        )}
      </div>

      {!file ? (
        <Dropzone 
          onFilesAdded={onFilesAdded} 
          accept={{ 'application/pdf': ['.pdf'] }}
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 flex-1 min-h-0">
          {/* Main Visual Editor */}
          <div 
            ref={editorParentRef}
            className="flex-1 bg-gray-50 rounded-3xl md:rounded-[4rem] p-4 md:p-8 lg:p-14 overflow-auto flex flex-col items-center shadow-inner relative border border-gray-100"
          >
            {isLoading && (
              <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-brand-accent animate-spin" />
                <h3 className="text-lg md:text-xl font-bold text-brand-primary tracking-tight text-center px-4">Initializing Document Engine...</h3>
              </div>
            )}

            <div 
              ref={containerRef}
              onClick={handleCanvasClick}
              className={`relative bg-white shadow-2xl transition-all duration-500 ring-1 ring-black/5 ${activeTool === 'text' ? 'cursor-crosshair' : 'cursor-default'}`}
              style={{ flexShrink: 0 }}
            >
              <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
                <Page 
                  pageNumber={pageNumber} 
                  renderTextLayer={false} 
                  renderAnnotationLayer={false}
                  width={Math.max(200, containerWidth)}
                />
              </Document>

              {/* Enhanced Annotation Overlay */}
              <div className="absolute inset-0 pointer-events-none overflow-visible">
                <AnimatePresence>
                {annotations
                  .filter(a => a.pageIndex === pageNumber - 1)
                  .map(anno => (
                    <motion.div
                      key={anno.id}
                      drag={activeTool === 'select' && !editingId}
                      dragMomentum={false}
                      onDragEnd={(e, info) => handleDragEnd(anno.id, e, info)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`annotation-node absolute rounded-lg transition-all pointer-events-auto group ${activeTool === 'select' ? 'cursor-grab active:cursor-grabbing ring-2 ring-transparent hover:ring-brand-accent' : 'cursor-text'} ${editingId === anno.id ? 'z-[100]' : 'z-10'}`}
                      style={{ 
                        left: `${anno.x}%`, 
                        top: `${anno.y}%`,
                        fontSize: (anno.fontSize * (containerWidth / 850)),
                        color: anno.color,
                        fontFamily: (FONTS.find(f => f.value === anno.fontFamily) || FONTS[0]).css,
                        fontWeight: anno.isBold ? 'bold' : 'normal',
                        backgroundColor: anno.bgColor || (editingId === anno.id ? 'white' : 'transparent'),
                        padding: editingId === anno.id ? '12px' : '2px 4px',
                        boxShadow: editingId === anno.id ? '0 40px 80px rgba(0,0,0,0.2)' : 'none'
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingId(anno.id);
                        setEditingText(anno.text);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // In Arrange mode, we don't start editing on simple click to avoid collision with drag
                        if (activeTool === 'select') return;
                        if (editingId !== anno.id) {
                          setEditingId(anno.id);
                          setEditingText(anno.text);
                        }
                      }}
                    >
                      {editingId === anno.id ? (
                        <div className="flex flex-col gap-3 min-w-[260px]">
                           <textarea
                            ref={inputRef}
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                finishEditing();
                              }
                            }}
                            className="w-full bg-transparent border-none outline-none resize-none text-inherit font-black h-auto p-0 min-h-[3em]"
                            placeholder="Type annotation..."
                            autoFocus
                          />
                          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                             <button 
                               onClick={(e) => { e.stopPropagation(); finishEditing(); }}
                               className="px-4 py-1.5 bg-brand-accent text-white rounded-xl text-[9px] font-black tracking-widest uppercase hover:bg-brand-primary active:scale-95 transition-all"
                             >
                               Save Label
                             </button>
                             <button 
                               onClick={(e) => { e.stopPropagation(); deleteAnnotation(anno.id); }}
                               className="px-4 py-1.5 bg-red-50 text-red-500 rounded-xl text-[9px] font-black tracking-widest uppercase hover:bg-red-500 hover:text-white active:scale-95 transition-all"
                             >
                               Remove
                             </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <span className="whitespace-pre-wrap">{anno.text || 'Untitled Note'}</span>
                          
                          {/* Arrange Mode Toolset */}
                          {activeTool === 'select' && (
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none scale-90 group-hover:scale-100">
                               <div className="bg-brand-primary text-white text-[9px] font-black px-3 py-1.5 rounded-full whitespace-nowrap shadow-2xl uppercase tracking-[0.2em] flex items-center gap-2">
                                  <Hand className="w-3.5 h-3.5" /> Drag Any Direction
                               </div>
                               <button 
                                  onClick={(e) => { e.stopPropagation(); setEditingId(anno.id); setEditingText(anno.text); }}
                                  className="pointer-events-auto bg-brand-accent text-white p-2 rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all"
                               >
                                  <Type className="w-4 h-4" />
                               </button>
                               <button 
                                  onClick={(e) => { e.stopPropagation(); deleteAnnotation(anno.id); }}
                                  className="pointer-events-auto bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-700 active:scale-90 transition-all"
                               >
                                  <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                          )}
                          
                          {activeTool === 'text' && (
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-brand-accent text-white text-[9px] font-black px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap uppercase tracking-widest pointer-events-none">
                               Click to Edit
                             </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {activeTool === 'text' && !editingId && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-2xl px-10 py-4 rounded-full text-white text-[10px] font-black uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl border border-white/20">
                  Select Text Area on Page
                </div>
              )}
            </div>

            {/* Navigation Deck */}
            <div className="mt-8 md:mt-12 flex items-center gap-2 md:gap-5 bg-white/90 backdrop-blur-2xl px-4 md:px-12 py-3 md:py-5 rounded-full border border-gray-100 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-700">
              <button 
                disabled={pageNumber <= 1}
                onClick={() => { finishEditing(); setPageNumber(p => p - 1); }}
                className="p-2 md:p-3 transition-all hover:bg-gray-100 rounded-full disabled:opacity-10 active:scale-90"
              >
                <ChevronLeft className="w-6 h-6 md:w-10 md:h-10 text-brand-primary" />
              </button>
              <div className="text-center px-4 md:px-12 border-x border-gray-100">
                <p className="text-xl md:text-3xl font-black text-brand-primary leading-none mb-1 tracking-tighter whitespace-nowrap">
                  {pageNumber} <span className="text-gray-300 mx-1 md:mx-2">/</span> {numPages}
                </p>
                <p className="font-black text-[8px] md:text-[11px] text-brand-secondary uppercase tracking-[0.25em] whitespace-nowrap">Document Page</p>
              </div>
              <button 
                disabled={pageNumber >= numPages}
                onClick={() => { finishEditing(); setPageNumber(p => p + 1); }}
                className="p-2 md:p-3 transition-all hover:bg-gray-100 rounded-full disabled:opacity-10 active:scale-90"
              >
                <ChevronRight className="w-6 h-6 md:w-10 md:h-10 text-brand-primary" />
              </button>
            </div>
          </div>

          {/* Right Control Hub */}
          <div className="w-full lg:w-96 flex flex-col gap-4 md:gap-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[3.5rem] border border-surface-border shadow-sm space-y-8 md:space-y-10">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-brand-secondary">Tool Settings</h3>
                <Settings2 className="w-4 h-4 text-brand-secondary" />
              </div>
              
              <div className="space-y-8 md:space-y-10">
                {/* Font Deck */}
                <div className="space-y-3 md:space-y-4">
                  <label className="text-[9px] md:text-[10px] font-black text-brand-secondary uppercase tracking-widest flex items-center gap-2">
                     <Type className="w-4 h-4" /> Typography Style
                  </label>
                  <div className="flex flex-col gap-2">
                    {FONTS.map(f => (
                      <button
                        key={f.value}
                        onClick={() => setCurrentFont(f)}
                        className={`w-full px-5 py-3 rounded-2xl text-[11px] font-black transition-all border-2 text-left flex items-center justify-between ${currentFont.value === f.value ? 'bg-brand-primary text-white border-brand-primary shadow-lg' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'}`}
                        style={{ fontFamily: f.css }}
                      >
                        {f.name}
                        {currentFont.value === f.value && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Deck */}
                <div className="space-y-3 md:space-y-4">
                  <label className="text-[9px] md:text-[10px] font-black text-brand-secondary uppercase tracking-widest flex items-center gap-2">
                     <Baseline className="w-4 h-4" /> Font Size: {currentFontSize}pt
                  </label>
                  <div className="grid grid-cols-4 gap-2 md:gap-3">
                    {[12, 18, 24, 38].map(s => (
                      <button
                        key={s}
                        onClick={() => setCurrentFontSize(s)}
                        className={`py-3 md:py-4 rounded-2xl md:rounded-3xl text-[10px] md:text-[11px] font-black transition-all border-2 ${currentFontSize === s ? 'bg-brand-primary text-white border-brand-primary shadow-xl' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setIsBold(!isBold)}
                  className={`w-full flex items-center justify-center gap-3 md:gap-4 p-4 md:p-5 rounded-2xl md:rounded-[2.5rem] text-[10px] md:text-xs font-black border-2 transition-all ${isBold ? 'bg-brand-accent text-white border-brand-accent shadow-2xl shadow-blue-500/20' : 'bg-white border-gray-100 text-brand-secondary'}`}
                >
                  <Bold className="w-5 h-5 md:w-6 md:h-6" /> BOLD TYPOGRAPHY
                </button>

                {/* Color Deck */}
                <div className="space-y-3 md:space-y-4">
                   <label className="text-[9px] md:text-[10px] font-black text-brand-secondary uppercase tracking-widest flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Color Palette
                  </label>
                  <div className="flex justify-between p-2 md:p-3 bg-gray-50 rounded-2xl md:rounded-[2.5rem] border border-gray-100 box-content">
                    {COLORS.slice(0, 4).map(c => (
                      <button
                        key={c.value}
                        onClick={() => setCurrentTextColor(c)}
                        className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl border-4 transition-all hover:scale-110 active:scale-95 ${currentTextColor.value === c.value ? 'border-white ring-2 ring-brand-accent shadow-2xl' : 'border-transparent opacity-40 hover:opacity-100'}`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                </div>

                {/* Whiteout / BG Deck */}
                <div className="space-y-3 md:space-y-4">
                   <label className="text-[9px] md:text-[10px] font-black text-brand-secondary uppercase tracking-widest flex items-center gap-2">
                    <Square className="w-4 h-4" /> Backdrop Layer
                  </label>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <button
                      onClick={() => setCurrentBgColor(null)}
                      className={`py-4 md:py-5 rounded-2xl md:rounded-[2rem] text-[9px] md:text-[10px] font-black transition-all border-2 ${currentBgColor === null ? 'bg-brand-primary text-white border-brand-primary shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                    >
                      NATURAL
                    </button>
                    <button
                      onClick={() => setCurrentBgColor('#FFFFFF')}
                      className={`py-4 md:py-5 rounded-2xl md:rounded-[2rem] text-[9px] md:text-[10px] font-black transition-all border-2 ${currentBgColor === '#FFFFFF' ? 'bg-white text-brand-primary border-brand-primary shadow-2xl' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                    >
                      WHITEOUT (REDACT)
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
