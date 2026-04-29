import React, { useState } from 'react';
import { Phone, Loader } from 'lucide-react';
import { ringCentralAPI } from '../../lib/ringCentralAPI';
import { useAuth } from '../../contexts/AuthContext';

interface ClickToCallProps {
  phoneNumber: string;
  contactName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button' | 'text';
}

export function ClickToCall({ phoneNumber, contactName, size = 'md', variant = 'icon' }: ClickToCallProps) {
  const { profile } = useAuth();
  const [calling, setCalling] = useState(false);

  if (!phoneNumber) return null;

  const handleCall = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!profile) {
      alert('Please log in to make calls');
      return;
    }

    setCalling(true);
    try {
      const credentials = await ringCentralAPI.getUserCredentials(profile.id);

      if (!credentials || !credentials.is_active) {
        if (confirm('RingCentral is not connected. Would you like to connect now?')) {
          window.location.hash = '#ringcentral-settings';
        }
        return;
      }

      await ringCentralAPI.makeCall(phoneNumber, profile.id);
      alert(`Calling ${contactName || phoneNumber}...`);
    } catch (error) {
      console.error('Error making call:', error);
      alert('Failed to initiate call. Please try again.');
    } finally {
      setCalling(false);
    }
  };

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleCall}
        disabled={calling}
        className={`${sizeClasses[size]} bg-green-100 hover:bg-green-200 text-green-700 rounded-full flex items-center justify-center transition-colors disabled:opacity-50`}
        title={`Call ${contactName || phoneNumber}`}
      >
        {calling ? (
          <Loader className={`${iconSizes[size]} animate-spin`} />
        ) : (
          <Phone className={iconSizes[size]
} />
        )}
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleCall}
        disabled={calling}
        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium disabled:opacity-50"
      >
        {calling ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Calling...
          </>
        ) : (
          <>
            <Phone className="w-4 h-4" />
            Call
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleCall}
      disabled={calling}
      className="text-green-600 hover:text-green-700 hover:underline inline-flex items-center gap-1 disabled:opacity-50"
    >
      <Phone className="w-3 h-3" />
      {calling ? 'Calling...' : phoneNumber}
    </button>
  );
}
