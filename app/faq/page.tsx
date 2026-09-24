import type { Metadata } from 'next';
import Markdown from 'react-markdown';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Header } from '@/components/header';
import faq from '@/content/faq.json';
export const metadata: Metadata = {
  alternates: { canonical: '/faq/' },
  title: 'FAQ — Colorado SAR Archive',
  description:
    'About the Colorado search and rescue incident archive, its sources, and its limitations.',
};
export default function FAQ() {
  return (
    <>
      <Header active="faq" />
      <main id="main-content" className="faq-main">
        <p className="eyebrow">ABOUT THE ARCHIVE</p>
        <h1>Frequently asked questions.</h1>
        <p className="lede">
          The context behind the records. This page is a work in progress.
        </p>
        {faq.filter((item) => (item.answer || '').trim()).map((item) => (
          <section className="faq-item" key={item.question}>
            <h2>{item.question}</h2>
            <div className="faq-answer">
              <Markdown skipHtml>{item.answer}</Markdown>
            </div>
          </section>
        ))}
        <section className="faq-item">
          <h2>Explore the project</h2>
          <p>
            <a
              href="https://github.com/dgriff03/colorado-sar-archive"
              target="_blank"
              rel="noreferrer"
            >
              View the public repository and contribution guide{' '}
              <ArrowUpRight size={15} className="inline" />
            </a>
          </p>
        </section>
        <a className="back" href="/">
          <ArrowLeft size={17} /> Back to the archive
        </a>
      </main>
    </>
  );
}

export const dynamic = 'force-static';
