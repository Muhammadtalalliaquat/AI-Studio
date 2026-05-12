/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ImageToPdf from './components/ImageToPdf';
import PdfEditor from './components/PdfEditor';
import AiTools from './components/AiTools';
import { AppView } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('convert');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'convert': return <ImageToPdf />;
      case 'edit': return <PdfEditor />;
      case 'ai-tools': return <AiTools />;
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-surface-bg text-brand-primary overflow-hidden">
      {/* Mobile Hamburger Header (Only on mobile) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-surface-border px-4 flex items-center justify-between z-[60]">
        <div className="flex items-center gap-2">
           <div className="bg-brand-accent p-1.5 rounded-lg">
             <Menu className="text-white w-5 h-5" />
           </div>
           <span className="font-black text-sm uppercase tracking-widest text-brand-primary">Studio</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className={`
        fixed lg:sticky top-0 left-0 h-screen transition-transform duration-300 ease-in-out z-[80] lg:z-10
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar 
          currentView={currentView} 
          onViewChange={(view) => {
            setCurrentView(view);
            setIsSidebarOpen(false);
          }} 
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 px-4 md:px-8 lg:px-12 py-20 lg:py-10 h-screen overflow-auto">
        <div className="max-w-7xl mx-auto h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Background Accents for Professional Look */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-accent/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-blue-400/5 blur-[100px] rounded-full" />
      </div>
    </div>
  );
}

