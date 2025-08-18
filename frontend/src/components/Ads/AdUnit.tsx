import React, { useEffect, useRef } from 'react';

interface AdUnitProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  style?: React.CSSProperties;
  className?: string;
  responsive?: boolean;
}

const AdUnit: React.FC<AdUnitProps> = ({
  adSlot,
  adFormat = 'auto',
  style = {},
  className = '',
  responsive = true
}) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // Check if AdSense script is loaded
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        // Push ad to AdSense queue
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  // Default styles for different ad formats
  const getDefaultStyle = () => {
    const baseStyle: React.CSSProperties = {
      display: 'block',
      textAlign: 'center',
      margin: '1rem auto',
      ...style
    };

    switch (adFormat) {
      case 'rectangle':
        return {
          ...baseStyle,
          width: '336px',
          height: '280px'
        };
      case 'vertical':
        return {
          ...baseStyle,
          width: '160px',
          height: '600px'
        };
      case 'horizontal':
        return {
          ...baseStyle,
          width: '728px',
          height: '90px'
        };
      default:
        return baseStyle;
    }
  };

  return (
    <div 
      ref={adRef}
      className={`ad-container ${className}`}
      style={{
        margin: '1rem 0',
        padding: '1rem',
        background: 'var(--gray-50)',
        border: '1px solid var(--gray-200)',
        borderRadius: 'var(--border-radius-md)',
        textAlign: 'center'
      }}
    >
      {/* AdSense Ad Unit */}
      <ins
        className="adsbygoogle"
        style={getDefaultStyle()}
        data-ad-client={process.env.REACT_APP_ADSENSE_CLIENT_ID || 'ca-pub-xxxxxxxxxxxxxxxxx'}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
      
      {/* Fallback content when ads are blocked or not loaded */}
      <noscript>
        <div style={{
          padding: '2rem',
          background: 'var(--gray-100)',
          borderRadius: 'var(--border-radius-md)',
          color: 'var(--gray-600)',
          fontSize: '0.875rem'
        }}>
          <div style={{ marginBottom: '0.5rem' }}>🐾 펫플레이스를 지원해주세요</div>
          <div>광고를 표시하여 서비스 운영에 도움을 주고 있습니다</div>
        </div>
      </noscript>
    </div>
  );
};

export default AdUnit;