import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

interface PrivacyContextType {
  isPrivacyMode: boolean;
  isSecureMode: boolean;
  togglePrivacy: () => void;
  enableSecure: () => void;
  disableSecure: () => void;
  maskedContent: (content: string, maxLength?: number) => string;
}

const PrivacyContext = createContext<PrivacyContextType | null>(null);

const PRIVACY_KEY = 'vicoo_privacy_mode';

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isSecureMode, setIsSecureMode] = useState(false);

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem(PRIVACY_KEY);
    if (saved === 'true') {
      setIsPrivacyMode(true);
    }
  }, []);

  // Save preference
  useEffect(() => {
    localStorage.setItem(PRIVACY_KEY, String(isPrivacyMode));
  }, [isPrivacyMode]);

  // Keyboard shortcut: Cmd/Ctrl + Shift + P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        togglePrivacy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const togglePrivacy = useCallback(() => {
    setIsPrivacyMode((prev) => !prev);
  }, []);

  const enableSecure = useCallback(() => {
    setIsSecureMode(true);
  }, []);

  const disableSecure = useCallback(() => {
    setIsSecureMode(false);
  }, []);

  const maskedContent = useCallback(
    (content: string, maxLength: number = 100): string => {
      if (!isPrivacyMode && !isSecureMode) return content;

      // Show first and last 2 characters
      if (content.length <= 4) return '****';

      const first = content.slice(0, 2);
      const last = content.slice(-2);
      const middle = content.length > maxLength
        ? '*'.repeat(Math.min(content.length - 4, maxLength - 4))
        : '*'.repeat(content.length - 4);

      return `${first}${middle}${last}`;
    },
    [isPrivacyMode, isSecureMode]
  );

  const value = useMemo(
    () => ({
      isPrivacyMode,
      isSecureMode,
      togglePrivacy,
      enableSecure,
      disableSecure,
      maskedContent,
    }),
    [
      isPrivacyMode,
      isSecureMode,
      togglePrivacy,
      enableSecure,
      disableSecure,
      maskedContent,
    ]
  );

  return (
    <PrivacyContext.Provider value={value}>
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within PrivacyProvider');
  }
  return context;
};

// HOC for privacy-protected content
export const withPrivacy = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props) => {
    const { maskedContent } = usePrivacy();
    return <Component {...props} maskedContent={maskedContent} />;
  };
};

// Component for masking text
export const PrivacyText: React.FC<{
  children: string;
  maxLength?: number;
  className?: string;
}> = ({ children, maxLength, className = '' }) => {
  const { isPrivacyMode, maskedContent } = usePrivacy();

  if (!isPrivacyMode) {
    return <span className={className}>{children}</span>;
  }

  return <span className={className}>{maskedContent(children, maxLength)}</span>;
};

export default PrivacyContext;
