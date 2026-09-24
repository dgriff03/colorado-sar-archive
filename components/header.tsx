import { Mountain, ArrowUpRight } from 'lucide-react';
export function Header({ active = 'explore' }: { active?: string }) {
  return (
    <header className="site-header">
      <a className="brand" href="/">
        <span className="brand-icon">
          <Mountain size={26} />
        </span>
        <span>
          COLORADO <b>SAR</b>
          <small>THE INCIDENT ARCHIVE</small>
        </span>
      </a>
      <nav aria-label="Main navigation">
        <a aria-current={active === 'explore' ? 'page' : undefined} href="/">
          Explore
        </a>
        <a aria-current={active === 'faq' ? 'page' : undefined} href="/faq/">
          FAQ
        </a>
        <a
          className="repo-link"
          href="https://github.com/dgriff03/colorado-sar-archive"
          target="_blank"
          rel="noreferrer"
        >
          Contribute <ArrowUpRight size={15} />
        </a>
      </nav>
    </header>
  );
}
