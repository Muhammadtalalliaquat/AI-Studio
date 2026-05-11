import { FileImage, FileText, Sparkles, LayoutDashboard } from 'lucide-react';
import { AppView } from '../types';
import { motion } from 'motion/react';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const items = [
    { id: 'convert' as AppView, icon: FileImage, label: 'Image to PDF' },
    { id: 'edit' as AppView, icon: FileText, label: 'Edit PDF' },
    { id: 'ai-tools' as AppView, icon: Sparkles, label: 'AI Assistant' },
  ];

  return (
    <div className="w-64 border-r border-surface-border bg-white flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-brand-accent p-2 rounded-lg">
          <LayoutDashboard className="text-white w-6 h-6" />
        </div>
        <h1 className="font-bold text-xl tracking-tight">AI Studio</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {items.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group
                ${isActive ? 'text-brand-accent bg-blue-50' : 'text-brand-secondary hover:text-brand-primary hover:bg-gray-50'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 w-1 h-6 bg-brand-accent rounded-r-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-surface-border">
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary mb-1">Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-brand-primary">AI Models Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
