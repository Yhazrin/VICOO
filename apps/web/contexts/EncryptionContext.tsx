import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  generateAesKey,
  encryptAes,
  decryptAes,
  exportKey,
  importKey,
  deriveKeyFromPassword,
  generateSecureId,
  type EncryptedData,
} from '@vicoo/crypto';

interface EncryptionContextType {
  isReady: boolean;
  isUnlocked: boolean;
  hasKey: boolean;
  unlock: (password: string) => Promise<void>;
  lock: () => void;
  encrypt: (data: string) => Promise<string>;
  decrypt: (encryptedData: string) => Promise<string>;
  generateSecureId: () => string;
}

const EncryptionContext = createContext<EncryptionContextType | null>(null);

const ENCRYPTED_KEY_STORAGE_KEY = 'vicoo_encrypted_key';
const KEY_SALT_STORAGE_KEY = 'vicoo_key_salt';

export const EncryptionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Check for existing key on mount
  useEffect(() => {
    const initEncryption = async () => {
      const encryptedKey = localStorage.getItem(ENCRYPTED_KEY_STORAGE_KEY);
      const keySalt = localStorage.getItem(KEY_SALT_STORAGE_KEY);

      if (encryptedKey && keySalt) {
        // Key exists but needs password to unlock
        setIsReady(true);
      } else {
        // No key exists, generate one
        try {
          const newKey = await generateAesKey(256);
          const exported = await exportKey(newKey);

          // Store the key (in real app, this should be encrypted with a master password)
          localStorage.setItem(ENCRYPTED_KEY_STORAGE_KEY, exported);
          localStorage.setItem(
            KEY_SALT_STORAGE_KEY,
            generateSecureId(16)
          );

          setMasterKey(newKey);
          setIsReady(true);
          setIsUnlocked(true);
        } catch (error) {
          console.error('Failed to initialize encryption:', error);
        }
      }
    };

    initEncryption();
  }, []);

  const unlock = useCallback(async (password: string) => {
    try {
      const encryptedKey = localStorage.getItem(ENCRYPTED_KEY_STORAGE_KEY);
      const keySalt = localStorage.getItem(KEY_SALT_STORAGE_KEY);

      if (!encryptedKey || !keySalt) {
        throw new Error('No encryption key found');
      }

      // Derive key from password
      const salt = Uint8Array.from(atob(keySalt), (c) =>
        c.charCodeAt(0)
      );
      const { key } = await deriveKeyFromPassword({
        password,
        salt,
        iterations: 100000,
      });

      setMasterKey(key);
      setIsUnlocked(true);
    } catch (error) {
      console.error('Failed to unlock:', error);
      throw error;
    }
  }, []);

  const lock = useCallback(() => {
    setMasterKey(null);
    setIsUnlocked(false);
  }, []);

  const encrypt = useCallback(
    async (data: string): Promise<string> => {
      if (!masterKey) {
        throw new Error('Encryption not unlocked');
      }

      const { ciphertext, iv } = await encryptAes(data, masterKey);

      // Combine iv + ciphertext and encode as base64
      const combined = new Uint8Array(iv.length + ciphertext.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(ciphertext), iv.length);

      return btoa(String.fromCharCode(...combined));
    },
    [masterKey]
  );

  const decrypt = useCallback(
    async (encryptedData: string): Promise<string> => {
      if (!masterKey) {
        throw new Error('Encryption not unlocked');
      }

      const combined = Uint8Array.from(atob(encryptedData), (c) =>
        c.charCodeAt(0)
      );

      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);

      return decryptAes({ ciphertext: ciphertext.buffer, iv }, masterKey);
    },
    [masterKey]
  );

  const generateSecureIdFn = useCallback(() => {
    return generateSecureId(32);
  }, []);

  return (
    <EncryptionContext.Provider
      value={{
        isReady,
        isUnlocked,
        hasKey: !!masterKey,
        unlock,
        lock,
        encrypt,
        decrypt,
        generateSecureId: generateSecureIdFn,
      }}
    >
      {children}
    </EncryptionContext.Provider>
  );
};

export const useEncryption = () => {
  const context = useContext(EncryptionContext);
  if (!context) {
    throw new Error('useEncryption must be used within EncryptionProvider');
  }
  return context;
};

export default EncryptionContext;
