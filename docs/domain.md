# Canonical domain: rescue.typetwo.dev

The website, copied incident links, MCP result links, documentation and canonical
metadata use `https://rescue.typetwo.dev`. The hosted MCP URL is
`https://rescue.typetwo.dev/api/mcp`; the human-readable guide is `/mcp/`.
Firebase project/site IDs remain `colorado-sar-archive`. A custom domain does not
require renaming the Firebase project or GitHub repository.

## Connect the domain

1. Open Firebase Hosting for `colorado-sar-archive` and choose **Add custom domain**.
2. Enter `rescue.typetwo.dev` as a serving domain, not a redirect to another site.
3. At the authoritative DNS provider for `typetwo.dev`, add the ownership and
   routing records **exactly as Firebase displays them**. Do not guess IPs or
   copy records from another project's configuration. Preserve unrelated DNS records.
4. Wait for Firebase to confirm the connection and provision its HTTPS certificate.
5. Verify HTTPS before announcing the domain or asking users to configure MCP.

Setup reference: https://firebase.google.com/docs/hosting/custom-domain

## Verify and publish

The source assumes the canonical domain; it does not imply that DNS or billing
has already been configured. Before announcing hosted MCP, enable Blaze and
complete the deployment in [hosting-mcp.md](hosting-mcp.md). Check all of:

- `/`, `/faq/`, `/mcp/` load over HTTPS.
- `/llms.txt`, `/data-guide.md`, `/faq/index.md`, `/mcp/index.md` return text.
- A copied incident URL starts with `https://rescue.typetwo.dev/` and reopens the same incident.
- An MCP client initializes at `/api/mcp` and can search/read/group accepted incidents.

The Firebase fallback hostnames remain available for diagnostics and are allowed
browser origins, but public links use the canonical domain. `lib/site.ts` supplies
the application/MCP origin. Set `NEXT_PUBLIC_SITE_URL` in `.env.local` (see `.env.example`) or the shell
and rebuild the website and MCP to override the default. Relative website navigation works on either hostname.

Google Analytics uses the same measurement ID; domain setup does not require a
new property. Update the web stream's website URL to the canonical domain in
Analytics Admin when the domain goes live.

## Agent documentation

`content/llms.txt` is a concise discovery guide. `content/data-guide.md` describes
fields and interpretation. `npm run docs:build` generates Markdown FAQ and MCP
pages and public discovery files from their existing sources, and runs automatically before site dev/build.
These generated copies stay out of Git. The export check requires every file.
Do not maintain duplicate FAQ answers or dump all incidents into llms.txt.
