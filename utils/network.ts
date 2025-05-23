export const isOnline = async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
      return navigator.onLine;
    }
  
    // Vérification plus robuste pour Node.js/Next.js
    try {
      await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors' });
      return true;
    } catch {
      return false;
    }
  };