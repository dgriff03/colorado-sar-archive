"""Source restrictions and reviewed publication exclusions (stdlib only).

MD5 values are lookup fingerprints, not encryption or proof of anonymity.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit, urlunsplit


def normalize_domain(value):
    value = unquote(value.strip(), errors='strict').lower().rstrip('.')
    if value.startswith('www.'):
        value = value[4:]
    value = value.encode('idna').decode('ascii')
    if len(value) > 253 or '.' not in value or any(not re.fullmatch(r'[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?', label) for label in value.split('.')):
        raise ValueError('Expected a domain such as example.org (no scheme, port or path)')
    return value


def normalize_url(value):
    u = urlsplit(value.strip())
    if u.scheme.lower() not in ('http', 'https') or not u.hostname or u.username or u.password:
        raise ValueError('Expected an HTTP(S) source URL without credentials')
    host = normalize_domain(u.hostname)
    port = u.port
    if port and (u.scheme.lower(), port) not in [('http', 80), ('https', 443)]:
        host += ':' + str(port)
    # HTTP/HTTPS and fragments identify the same source for exclusion purposes.
    # Keep path case and query intact to distinguish reports on the same site.
    return urlunsplit(('https', host, u.path or '/', u.query, ''))


def fingerprint(value):
    return hashlib.md5(value.encode('utf-8'), usedforsecurity=False).hexdigest()


def domain_suffixes(host):
    labels = normalize_domain(host).split('.')
    return ['.'.join(labels[i:]) for i in range(len(labels)-1)]


def read_policy(root):
    domain_path = root/'config/disallowed-domains.json'
    excluded_path = root/'config/exclusions.json'
    domains = json.loads(domain_path.read_text()) if domain_path.exists() else []
    excluded = json.loads(excluded_path.read_text()) if excluded_path.exists() else {}
    if not isinstance(domains, list) or any(not isinstance(d, str) for d in domains):
        raise ValueError('disallowed-domains.json must contain a list of domain strings')
    normalized = {normalize_domain(d) for d in domains}
    if len(normalized) != len(domains):
        raise ValueError('Duplicate normalized disallowed domain')
    if not isinstance(excluded, dict) or set(excluded) - {'incident_ids','domain_md5','url_md5'}:
        raise ValueError('Invalid exclusion configuration keys')
    for key in ['incident_ids', 'domain_md5', 'url_md5']:
        values = excluded.get(key, [])
        if not isinstance(values, list) or any(not isinstance(v, str) for v in values) or len(set(values)) != len(values):
            raise ValueError(f'{key} must be a list of unique strings')
        pattern = r'(legacy-\d{6}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})' if key == 'incident_ids' else r'[0-9a-f]{32}'
        if any(not re.fullmatch(pattern,v) for v in values):
            raise ValueError(f'Invalid {key} entry')
    from id_aliases import id_aliases
    aliases=id_aliases(root)
    result=dict(disallowed=normalized, **{key:set(excluded.get(key, [])) for key in ['incident_ids','domain_md5','url_md5']})
    result['incident_ids'].update(aliases[old] for old in excluded.get('incident_ids', []) if old in aliases)
    return result


def urls(record):
    return [u.strip() for u in (record.get('source_urls') or '').split('|') if u.strip()]


def source_match(url, policy):
    normalized = normalize_url(url)
    host = urlsplit(normalized).hostname
    suffixes = domain_suffixes(host)
    if any(s in policy['disallowed'] for s in suffixes):
        return 'disallowed source domain'
    if any(fingerprint(s) in policy['domain_md5'] for s in suffixes):
        return 'excluded source domain'
    if fingerprint(normalized) in policy['url_md5']:
        return 'excluded source URL'
    return None


def exclusion_reason(record, policy):
    if record['id'] in policy['incident_ids']:
        return 'excluded incident ID'
    for url in urls(record):
        try:
            reason = source_match(url, policy)
        except (ValueError, UnicodeError):
            # Legacy import may contain malformed links; existing validation
            # handles new submissions. Such URLs cannot match a valid domain.
            continue
        if reason:
            return reason
    return None


def publication_records(root, accepted):
    from merges import incident_merges
    from id_aliases import id_aliases
    records = [r for _, r in accepted]
    merges = incident_merges(root, records)
    policy = read_policy(root)
    aliases=id_aliases(root)
    excluded = {r['id'] for r in records if exclusion_reason(r, policy)}
    excluded.update(aliases[old] for old in policy['incident_ids'] if old in aliases)
    # Removing any member removes the whole confirmed duplicate family;
    # neither an old alias nor the surviving ID can restore the same content.
    removed_targets = {merges[ident]['into'] if ident in merges else ident for ident in excluded}
    allowed_merges = {old:entry for old,entry in merges.items() if entry['into'] not in removed_targets}
    published = [r for r in records if r['id'] not in merges and r['id'] not in removed_targets]
    published_ids={r['id'] for r in published}
    for old, target in aliases.items():
        canonical=merges[target]['into'] if target in merges else target
        if canonical in published_ids:
            allowed_merges[old]=dict(into=canonical,reason='Compatibility alias from original import ID to UUID')
    return published, allowed_merges


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('kind', choices=['domain','url'])
    parser.add_argument('value', help='Domain or source URL to fingerprint; does not edit files')
    args=parser.parse_args()
    try:
        print(fingerprint(normalize_domain(args.value) if args.kind=='domain' else normalize_url(args.value)))
    except (ValueError, UnicodeError) as exc:
        raise SystemExit(str(exc))
