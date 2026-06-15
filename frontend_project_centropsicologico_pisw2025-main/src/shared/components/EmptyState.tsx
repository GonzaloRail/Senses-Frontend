import React from 'react';
import { FileX, Inbox, Search, FolderOpen, Database, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: 'inbox' | 'search' | 'folder' | 'file' | 'database' | 'alert' | React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({
  title = "No hay contenido disponible",
  description = "No se encontraron elementos para mostrar.",
  icon = 'inbox',
  action,
  className = ""
}: EmptyStateProps) => {
  const getIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }

    const iconProps = { className: "w-16 h-16 text-gray-400", strokeWidth: 1.5 };

    switch (icon) {
      case 'search':
        return <Search {...iconProps} />;
      case 'folder':
        return <FolderOpen {...iconProps} />;
      case 'file':
        return <FileX {...iconProps} />;
      case 'database':
        return <Database {...iconProps} />;
      case 'alert':
        return <AlertCircle {...iconProps} />;
      case 'inbox':
      default:
        return <Inbox {...iconProps} />;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="text-center max-w-md">
        <div className="flex flex-row items-center justify-center gap-2">
          {getIcon()}
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
        </div>
        <p className="text-gray-500 mb-6">
          {description}
        </p>
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};
