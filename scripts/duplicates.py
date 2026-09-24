"""Conservative duplicate candidates, never automatic merges or deletions.

Date buckets keep routine comparisons local. Uncommon shared source URLs also
catch date disagreements. Common annual-report URLs alone are not evidence.
"""
import datetime
import difflib
import html
import json
import os
import re
import unicodedata
from collections import defaultdict
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


def normalize(value):
    value = unicodedata.normalize('NFKD', str(value or '')).casefold()
    return ' '.join(re.findall(r'\w+', value, flags=re.UNICODE))


def sources(record):
    result = set()
    for raw in (record.get('source_urls') or '').split('|'):
        try:
            url = urlsplit(raw.strip())
            if url.scheme.lower() not in ('http', 'https') or not url.hostname:
                continue
            # Preserve meaningful query values (e.g. report/article IDs).
            query = [(k, v) for k, v in parse_qsl(url.query, keep_blank_values=True)
                     if not k.lower().startswith('utm_') and k.lower() not in ('fbclid', 'gclid')]
            host = url.netloc.lower().removeprefix('www.')
            result.add(urlunsplit(('https', host, url.path.rstrip('/') or '/', urlencode(sorted(query)), '')))
        except ValueError:
            continue
    return result


def fingerprint(record):
    """Identical submitted content, excluding IDs and empty optional fields."""
    content = {}
    for key, value in record.items():
        if key in ('id', 'legacy_id') or value is None or value == '':
            continue
        if key == 'source_urls':
            content[key] = sorted(sources(record))
        elif isinstance(value, str):
            content[key] = ' '.join(value.casefold().split())
        else:
            content[key] = value
    return json.dumps(content, sort_keys=True, ensure_ascii=False)


def features(record):
    title = normalize(record['summary'])
    places = {normalize(record.get(k)) for k in ('location', 'place', 'peak')}
    places -= {'', 'unknown', 'not recorded', 'colorado'}
    return {'day': datetime.date.fromisoformat(record['date']).toordinal(),
            'title': title, 'tokens': set(title.split()), 'places': places,
            'county': normalize(record.get('county')), 'sources': sources(record),
            'fingerprint': fingerprint(record),
            'agency': normalize(record.get('responding_agency')),
            'missions': set(re.findall(r'(?:mission\s+|\()(\d{2}-\d{2,3})(?=\)|\b)', record['summary'], re.I))}


def compare(left, right, common_sources=frozenset()):
    if left['fingerprint'] == right['fingerprint']:
        return 'identical', ['Identical submitted content apart from IDs/empty fields']
    # Distinct explicit mission numbers from the same agency are evidence of
    # separate events, even when template titles and places are almost identical.
    if (left['agency'] and left['agency'] == right['agency'] and
            left['missions'] and right['missions'] and not left['missions'] & right['missions']):
        return None
    days = abs(left['day'] - right['day'])
    common_source = bool((left['sources'] & right['sources']) - common_sources)
    place_match = bool(left['places'] & right['places'])
    county_match = bool(left['county'] and left['county'] == right['county'])
    union = left['tokens'] | right['tokens']
    overlap = len(left['tokens'] & right['tokens']) / max(1, len(union))
    # Avoid expensive sequence matching for unrelated titles.
    similarity = difflib.SequenceMatcher(None, left['title'], right['title'], autojunk=False).ratio() if overlap >= .2 else 0
    reasons = []
    if days <= 3 and (similarity >= .82 or overlap >= .65) and (county_match or place_match or not left['county'] or not right['county']):
        reasons.append('Very similar titles within 3 days')
    elif days <= 3 and place_match and (similarity >= .7 or overlap >= .5):
        reasons.append('Same named place and similar titles within 3 days')
    elif days <= 1 and county_match and overlap >= .48:
        reasons.append('Same county and overlapping descriptions within 1 day')
    if common_source and ((days <= 3 and (place_match or overlap >= .25)) or similarity >= .72 or (place_match and overlap >= .3)):
        reasons.append('Shared source URL' + (' with a date disagreement' if days > 3 else ' within 3 days'))
    if not reasons:
        return None
    return 'review', reasons


def find_candidates(accepted, pending, all_records=False):
    entries = accepted + pending
    features_list = [features(record) for _, record in entries]
    pending_ids = {record['id'] for _, record in pending}
    by_day, by_source, by_fingerprint = defaultdict(list), defaultdict(list), defaultdict(list)
    for index, feature in enumerate(features_list):
        by_day[feature['day']].append(index)
        by_fingerprint[feature['fingerprint']].append(index)
        for source in feature['sources']:
            by_source[source].append(index)
    common_sources = {url for url, indexes in by_source.items()
                      if len(indexes) > 10 or re.search(r'/(category|tag|page)/|missions.website|narrativesummary', url, re.I)}
    pairs = set()
    for index, (_, record) in enumerate(entries):
        if not all_records and record['id'] not in pending_ids:
            continue
        feature = features_list[index]
        neighbors = set(by_fingerprint[feature['fingerprint']])
        for day in range(feature['day'] - 3, feature['day'] + 4):
            neighbors.update(by_day[day])
        for source in feature['sources']:
            # Annual summaries link many different incidents. Use local date
            # comparisons for those, rather than an all-to-all comparison.
            if len(by_source[source]) <= 10:
                neighbors.update(by_source[source])
        for other in neighbors:
            if index != other:
                pairs.add(tuple(sorted((index, other))))
    result = []
    for i, j in sorted(pairs):
        match = compare(features_list[i], features_list[j], common_sources)
        if match:
            a, b = entries[i], entries[j]
            level, reasons = match
            result.append({'level': level,
                           'priority': 100 if level == 'identical' else (90 if 'Very similar' in reasons[0] else 80 if len(reasons) > 1 else 60),
                           'blocking': level == 'identical' and bool({a[1]['id'], b[1]['id']} & pending_ids),
                           'reasons': reasons,
                           'left': {'path': str(a[0]), **a[1]},
                           'right': {'path': str(b[0]), **b[1]}})
    return sorted(result, key=lambda r: (not r['blocking'], -r['priority'], r['left']['date'], r['left']['id'], r['right']['id']))


def ensure_no_identical_submissions(accepted, pending):
    # Linear preflight: no fuzzy scan needed for routine data generation.
    seen = {}
    for _, record in accepted:
        seen.setdefault(fingerprint(record), record['id'])
    for path, record in pending:
        key = fingerprint(record)
        if key in seen:
            raise ValueError(f'{path}: identical submission to {seen[key]}; update the existing incident instead')
        seen[key] = record['id']


def markdown_report(candidates, root, all_records=False):
    def escape(value):
        return html.escape(str(value or '')).replace('|', '&#124;').replace('\n', ' ')
    lines = ['# Duplicate review', '',
             f'{len(candidates)} candidate pairs. Scope: ' + ('entire archive and pending queue.' if all_records else 'pending vs. archive and other pending submissions.'), '',
             'Candidates are leads, not confirmed duplicates. Only identical pending content blocks checks. Never merge or delete automatically.', '']
    for number, match in enumerate(candidates, 1):
        lines += [f"## {number}. {'BLOCKED' if match['blocking'] else 'Review'}", '', '; '.join(match['reasons']), '']
        for side in ('left', 'right'):
            r = match[side]
            path = r['path']
            from pathlib import Path
            try: path = str(Path(path).relative_to(root))
            except ValueError: pass
            lines += [f"**{escape(r['id'])}** · {escape(r['date'])} · {escape(r.get('location'))} · {escape(r.get('county'))}", '',
                      escape(r['summary']), '', f"File: `{path}`", '',
                      f"[Search archive record]({os.environ.get('NEXT_PUBLIC_SITE_URL', 'https://rescue.typetwo.dev').rstrip('/')}/?incident={r['id']})", '',
                      'Sources: ' + escape(r.get('source_urls')), '']
    if not candidates:
        lines += ['No candidates found. Different wording, incorrect dates, and missing sources can still hide duplicates.']
    return '\n'.join(lines) + '\n'
