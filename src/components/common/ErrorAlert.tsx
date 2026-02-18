import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-700">{message}</p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="ml-3 inline-flex text-red-400 hover:text-red-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
