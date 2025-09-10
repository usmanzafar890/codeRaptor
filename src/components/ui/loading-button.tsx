'use client';

import { Button } from '@/components/ui/button';
import { LoaderCircleIcon } from 'lucide-react';

interface LoadingButtonProps {
  isLoading: boolean;
  loadingText?: string;
  defaultText: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export default function LoadingButton({
  isLoading,
  loadingText = 'Loading...',
  defaultText,
  onClick,
  disabled = false,
  type = 'button',
  className = ''
}: LoadingButtonProps) {
  return (
    <Button 
      variant="default" 
      disabled={isLoading || disabled}
      onClick={onClick}
      type={type}
      className={className}
    >
      {isLoading ? <LoaderCircleIcon className="animate-spin size-4" /> : null}
      {isLoading ? loadingText : defaultText}
    </Button>
  );
}
