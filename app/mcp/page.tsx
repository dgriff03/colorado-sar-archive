import type { Metadata } from 'next';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Markdown from 'react-markdown';
import { Header } from '@/components/header';
export const metadata: Metadata = {
  alternates: { canonical: '/mcp/' },
  title: 'Connect Claude or Codex — Colorado SAR Archive',
  description:
    'Connect to the hosted read-only Colorado SAR MCP server for incident search, source details and grouped counts.',
};
export default function MCPGuide() {
  const guide = readFileSync(join(process.cwd(), 'docs/mcp.md'), 'utf8');
  return (
    <>
      <Header active="mcp" />
      <main id="main-content" className="faq-main mcp-guide">
        <p className="eyebrow">SEARCH WITH YOUR ASSISTANT</p>
        <Markdown skipHtml>{guide}</Markdown>
      </main>
    </>
  );
}
export const dynamic = 'force-static';
