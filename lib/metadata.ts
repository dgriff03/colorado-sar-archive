import type { Metadata } from 'next';
import { SITE_URL } from './site';

export function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  const image = {
    url: `${SITE_URL}/colorado-mountains.webp`,
    width: 1920,
    height: 1275,
    alt: 'Hallett Peak reflected in Dream Lake, Rocky Mountain National Park',
  };
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: 'Colorado SAR Archive',
      locale: 'en_US',
      title,
      description,
      url: `${SITE_URL}${path}`,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}
