import React from 'react';

interface SectionBoxProps {
  title: string;
  number: number;
  children: React.ReactNode;
  className?: string;
  actionButton?: React.ReactNode;
}

export const SectionBox: React.FC<SectionBoxProps> = ({ title, number, children, className = "", actionButton }) => {
  return (
    <div className={`flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm h-full overflow-hidden ${className}`}>
      <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
            {number}
          </span>
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">{title}</h2>
        </div>
        {actionButton && <div>{actionButton}</div>}
      </div>
      <div className="p-4 flex-1 overflow-auto relative">
        {children}
      </div>
    </div>
  );
};