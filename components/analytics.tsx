'use client';
import { useEffect } from 'react';
import config from '@/config/analytics.json';
import { analyticsPage } from '@/lib/analytics';
export function Analytics() {
  useEffect(() => {
    // send_page_view:false alone does not disable enhanced measurement.
    // Fail closed until the account-side setting has been disabled and verified.
    if (
      !config.enabled ||
      !config.enhancedMeasurementDisabled ||
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1' ||
      navigator.doNotTrack === '1' ||
      (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl
    )
      return;
    const win = window as Window & {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
      sarLastPage?: string;
    };
    const initialized = !!document.getElementById('sar-google-analytics');
    if (!initialized) {
      win.dataLayer = win.dataLayer || [];
      win.gtag = function () {
        win.dataLayer!.push(arguments);
      };
      win.gtag('js', new Date());
      win.gtag('config', config.measurementId, {
        send_page_view: false,
        ...analyticsPage(location.href),
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        allow_enhanced_conversions: false,
      });
    }
    const track = () => {
      const page = analyticsPage(location.href);
      if (page.page_location === win.sarLastPage) return;
      win.sarLastPage = page.page_location;
      win.gtag!('event', 'page_view', page);
    };
    track();
    window.addEventListener('popstate', track);
    window.addEventListener('sar:navigation', track);
    if (!initialized) {
      const script = document.createElement('script');
      script.id = 'sar-google-analytics';
      script.async = true;
      script.src =
        'https://www.googletagmanager.com/gtag/js?id=' +
        encodeURIComponent(config.measurementId);
      document.head.appendChild(script);
    }
    return () => {
      window.removeEventListener('popstate', track);
      window.removeEventListener('sar:navigation', track);
    };
  }, []);
  return null;
}
