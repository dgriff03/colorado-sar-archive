import { siteDocumentation } from '@/lib/site';
import { pageMetadata } from '@/lib/metadata';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Markdown from 'react-markdown';
import { Header } from '@/components/header';
export const metadata = pageMetadata(
  'Connect Claude or Codex — Colorado SAR Archive',
  'Connect to the hosted read-only Colorado SAR MCP server for incident search, source details and grouped counts.',
  '/mcp/',
);

export default function MCPGuide() {
  const guide = siteDocumentation(
    readFileSync(join(process.cwd(), 'docs/mcp.md'), 'utf8'),
  );
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
