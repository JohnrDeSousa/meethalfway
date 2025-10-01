import { useEffect } from 'react';

interface AdSenseProps {
  client?: string;
  slot?: string;
  format?: string;
  responsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
  adTest?: boolean;
}

export function AdSenseBanner({ 
  client = import.meta.env.VITE_ADSENSE_CLIENT || "ca-pub-0000000000000000",
  slot = "0000000000", 
  format = "auto",
  responsive = true,
  style = {},
  className = "",
  adTest = import.meta.env.DEV
}: AdSenseProps) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div className={`ad-container ${className}`} style={{ textAlign: 'center', margin: '20px 0', ...style }}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          ...style
        }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
        data-ad-test={adTest ? 'on' : undefined}
        data-testid={`ad-banner-${slot}`}
      />
    </div>
  );
}

export function AdSenseRectangle({ 
  client = import.meta.env.VITE_ADSENSE_CLIENT || "ca-pub-0000000000000000",
  slot = "0000000000",
  className = "",
  adTest = import.meta.env.DEV
}: AdSenseProps) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div className={`ad-container ${className}`} style={{ textAlign: 'center', margin: '20px 0' }}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'inline-block',
          width: '300px',
          height: '250px'
        }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-test={adTest ? 'on' : undefined}
        data-testid={`ad-rectangle-${slot}`}
      />
    </div>
  );
}

export function AdSenseLeaderboard({ 
  client = import.meta.env.VITE_ADSENSE_CLIENT || "ca-pub-0000000000000000",
  slot = "0000000000",
  className = "",
  adTest = import.meta.env.DEV
}: AdSenseProps) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div className={`ad-container ${className}`} style={{ textAlign: 'center', margin: '20px 0' }}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'inline-block',
          width: '728px',
          height: '90px'
        }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-test={adTest ? 'on' : undefined}
        data-testid={`ad-leaderboard-${slot}`}
      />
    </div>
  );
}

// Skyscraper ad for sidebar
export function AdSenseSkyscraper({ 
  client = import.meta.env.VITE_ADSENSE_CLIENT || "ca-pub-0000000000000000",
  slot = "0000000000",
  className = "",
  adTest = import.meta.env.DEV
}: AdSenseProps) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div className={`ad-container ${className}`} style={{ textAlign: 'center', margin: '20px 0' }}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'inline-block',
          width: '160px',
          height: '600px'
        }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-test={adTest ? 'on' : undefined}
        data-testid={`ad-skyscraper-${slot}`}
      />
    </div>
  );
}

// Declare window.adsbygoogle for TypeScript
declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}