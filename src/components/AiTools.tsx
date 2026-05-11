import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Document, Page, pdfjs } from 'react-pdf';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Brain, FileText, Send, Loader2, AlertCircle } from 'lucide-react';
import Dropzone from './Dropzone';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function AiTools() {
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const onFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResponse('');
      setError('');
    }
  };

  const extractText = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    // Extract first 5 pages for context (to avoid token limits)
    const pagesToRead = Math.min(pdf.numPages, 5);
    for (let i = 1; i <= pagesToRead; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }
    return fullText;
  };

  const runAiCommand = async (type: 'summarize' | 'query') => {
    if (!file) return;
    setIsLoading(true);
    setError('');

    try {
      const pdfText = await extractText(file);
      const prompt = type === 'summarize' 
        ? `Summarize the following PDF content concisely. Focus on key themes and action items: \n\n ${pdfText}`
        : `Based on the following PDF content, answer this question: "${query}" \n\n Content: \n ${pdfText}`;

      const resNodes = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional PDF analyst assistant. Provide clear, well-formatted markdown responses. If the information isn't in the provided text, say so."
        }
      });

      setResponse(resNodes.text || 'No response generated.');
    } catch (err: any) {
      console.error(err);
      setError('AI request failed. Please check your connection or file size.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI PDF Intelligence</h2>
        <p className="text-brand-secondary mt-2">Summarize, query, and unlock insights from any document instantly.</p>
      </div>

      {!file ? (
        <Dropzone 
          onFilesAdded={onFilesAdded} 
          accept={{ 'application/pdf': ['.pdf'] }}
          label="Analyze PDF with AI"
        />
      ) : (
        <div className="space-y-6">
          {/* File Card */}
          <div className="bg-white border border-surface-border p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-xl text-brand-accent">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-sm text-brand-primary">{file.name}</p>
                <p className="text-xs text-brand-secondary">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready for analysis</p>
              </div>
            </div>
            <button 
              onClick={() => setFile(null)}
              className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Change File
            </button>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
               disabled={isLoading}
               onClick={() => runAiCommand('summarize')}
               className="bg-white border-2 border-surface-border hover:border-brand-accent p-6 rounded-3xl text-left group transition-all"
            >
              <Brain className="w-8 h-8 text-brand-secondary group-hover:text-brand-accent mb-4 transition-colors" />
              <h3 className="font-bold text-brand-primary mb-1">Summarize</h3>
              <p className="text-xs text-brand-secondary">Get the key takeaways and bullet points from this document.</p>
            </button>
            <div className="bg-white border border-surface-border p-6 rounded-3xl flex flex-col gap-3">
              <h3 className="font-bold text-sm uppercase tracking-wider text-brand-secondary mb-1">Ask PDF</h3>
              <div className="relative">
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. What is the contract end date?"
                  className="w-full bg-gray-50 border border-surface-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all pr-12"
                />
                <button 
                  disabled={isLoading || !query}
                  onClick={() => runAiCommand('query')}
                  className="absolute right-2 top-1.5 p-1.5 bg-brand-accent text-white rounded-lg disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Result Area */}
          <AnimatePresence mode="wait">
            {(isLoading || response || error) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white border border-surface-border rounded-3xl p-8 shadow-sm min-h-[200px] relative overflow-hidden"
              >
                {isLoading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
                    <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
                    <p className="text-sm font-medium text-brand-secondary">AI is reading your document...</p>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-3 text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                {response && !isLoading && (
                  <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-brand-primary prose-li:text-brand-primary">
                     <div className="flex items-center gap-2 mb-6 p-2 rounded-lg bg-gray-50 border border-gray-100 w-fit">
                        <Sparkles className="w-4 h-4 text-brand-accent" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-brand-secondary">AI Generated Insights</span>
                     </div>
                     <div className="whitespace-pre-wrap text-sm leading-relaxed text-brand-primary">
                       {response}
                     </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
