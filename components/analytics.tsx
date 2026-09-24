'use client';
import { useEffect } from 'react';
import config from '@/config/analytics.json';
/** Google owns page_view emission, including history navigation. Do not also
 * emit manual page_view events: enhanced measurement is enabled on this stream. */
export function Analytics() {
  useEffect(() => {
    if (
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
    };
    if (document.getElementById('sar-google-analytics')) return;
    win.dataLayer = win.dataLayer || [];
    win.gtag = function () {
      win.dataLayer!.push(arguments);
    };
    win.gtag('js', new Date());
    win.gtag('config', config.measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      allow_enhanced_conversions: false,
    });
    const script = document.createElement('script');
    script.id = 'sar-google-analytics';
    script.async = true;
    script.src =
      'https://www.googletagmanager.com/gtag/js?id=' +
      encodeURIComponent(config.measurementId);
    document.head.appendChild(script);
  }, []);
  return null;
}
