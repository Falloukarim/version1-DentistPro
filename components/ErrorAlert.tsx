import React from 'react';

interface ErrorAlertProps {
  message: string;
  onClose: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose }) => {
  return (
    <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md shadow-sm">
      <div className="flex justify-between items-center">
        <p className="font-medium">{message}</p>
        <button 
          onClick={onClose}
          className="text-red-700 hover:text-red-900 font-bold text-xl focus:outline-none"
          aria-label="Fermer l'alerte"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default ErrorAlert;