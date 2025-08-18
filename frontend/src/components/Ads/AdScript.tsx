import React, { useEffect } from 'react';

interface AdScriptProps {
  clientId?: string;
}

const AdScript: React.FC<AdScriptProps> = ({ 
  clientId = process.env.REACT_APP_ADSENSE_CLIENT_ID || 'ca-pub-xxxxxxxxxxxxxxxxx' 
}) => {
  useEffect(() => {
    // Only load AdSense script if it hasn't been loaded yet
    if (typeof window !== 'undefined' && !document.querySelector('script[src*="adsbygoogle"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      
      // Add error handling
      script.onerror = () => {
        console.warn('AdSense script failed to load');
      };
      
      document.head.appendChild(script);
      
      // Initialize adsbygoogle array if it doesn't exist
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
    }
  }, [clientId]);

  return null; // This component doesn't render anything
};

export default AdScript;