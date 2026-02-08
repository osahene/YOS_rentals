"use client";

import React from "react";
import {
  AlertTriangle,
  UserX,
  AlertCircle,
  Trash2,
  CheckCircle,
} from "lucide-react";

interface ActionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionType: 'suspend' | 'terminate' | 'delete' | 'reactivate';
  reason: string;
  onReasonChange: (reason: string) => void;
}

export default function ActionConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  reason,
  onReasonChange,
}: ActionConfirmationModalProps) {
  if (!isOpen) return null;

  const getActionConfig = () => {
    switch (actionType) {
      case 'suspend':
        return {
          title: 'Suspend Staff Member',
          description: 'This will temporarily suspend the staff member. They will not be able to access the system until reactivated.',
          icon: AlertCircle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          confirmText: 'Suspend',
          confirmColor: 'bg-yellow-600 hover:bg-yellow-700',
        };
      case 'terminate':
        return {
          title: 'Terminate Staff Member',
          description: 'This will permanently terminate the staff member. This action cannot be undone.',
          icon: UserX,
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          confirmText: 'Terminate',
          confirmColor: 'bg-red-600 hover:bg-red-700',
          requireReason: true,
        };
      case 'delete':
        return {
          title: 'Delete Staff Record',
          description: 'This will permanently delete the staff member from the system. This action cannot be undone.',
          icon: Trash2,
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          confirmText: 'Delete Permanently',
          confirmColor: 'bg-red-600 hover:bg-red-700',
          requireReason: true,
        };
      case 'reactivate':
        return {
          title: 'Reactivate Staff Member',
          description: 'This will reactivate the suspended staff member and restore their access to the system.',
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          confirmText: 'Reactivate',
          confirmColor: 'bg-green-600 hover:bg-green-700',
        };
      default:
        return {
          title: 'Confirm Action',
          description: 'Are you sure you want to proceed?',
          icon: AlertTriangle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          confirmText: 'Confirm',
          confirmColor: 'bg-blue-600 hover:bg-blue-700',
        };
    }
  };

  const config = getActionConfig();
  const Icon = config.icon;

  const handleConfirm = () => {
    if (config.requireReason && !reason.trim()) {
      alert('Please provide a reason for this action.');
      return;
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
          {/* Header */}
          <div className={`p-6 rounded-t-xl ${config.bgColor}`}>
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${config.color} bg-white/20`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {config.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {config.description}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {config.requireReason && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for {actionType === 'terminate' ? 'Termination' : 'Deletion'}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => onReasonChange(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
                  placeholder="Please provide a reason for this action..."
                  rows={3}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This reason will be recorded in the staff member's history.
                </p>
              </div>
            )}

            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2 shrink-0 mt-0.5" />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Important:</strong> {actionType === 'terminate' 
                    ? 'Terminated staff members cannot be reactivated without administrative approval.'
                    : actionType === 'delete'
                    ? 'Deleted records cannot be recovered. Make sure you have backups if needed.'
                    : 'Please review this action carefully before proceeding.'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 text-white rounded-lg ${config.confirmColor}`}
            >
              {config.confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}