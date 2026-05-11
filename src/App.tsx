/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import ImageToPdf from './components/ImageToPdf';
import PdfEditor from './components/PdfEditor';
import AiTools from './components/AiTools';
import { AppView } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('convert');

  const renderView = () => {
    switch (currentView) {
      case 'convert': return <ImageToPdf />;
      case 'edit': return <PdfEditor />;
      case 'ai-tools': return <AiTools />;
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-surface-bg text-brand-primary">
      {/* Navigation Sidebar */}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Content Area */}
      <main className="flex-1 px-8 lg:px-12 py-10 h-screen overflow-auto">
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

