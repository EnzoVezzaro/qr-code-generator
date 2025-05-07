import React, { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './button'; // Assuming button component exists

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm space-y-0">
      <div className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end p-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
