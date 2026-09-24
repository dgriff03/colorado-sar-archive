'use client';
import { agencySuggestions } from '@/lib/agencies';
import { detailLabels } from '@/lib/detail';
import { SITE_URL } from '@/lib/site';
import { useEffect, useMemo, useState, useDeferredValue } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  MapPin,
  SlidersHorizontal,
  X,
  Download,
  Mountain,
  ChevronLeft,
  ChevronRight,
  List,
  Table2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { flushSync } from 'react-dom';
import { registerArchiveTool } from '@/lib/webmcp';
import { IncidentTags } from '@/components/incident-tags';
import { Header } from '@/components/header';
import { useExplorer } from '@/hooks/use-explorer';
import {
  aggregateIncidents,
  inGroup,
  dimensions,
  dimensionLabels,
  explorerUrl,
  type Dimension,
} from '@/lib/explorer';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import { Empty, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import type { Incident } from '@/lib/types';
import {
  createSearch,
  displayValue,
  MAX_QUERY_LENGTH,
  defaults,
  label,
  formatDate,
  sourceLinks,
  type Filters,
} from '@/lib/search';
function Picker({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="picker">
      <label>{title}</label>
      <Select value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger aria-label={title}>
          <SelectValue>
            {options.find((o) => o.value === value)?.label || value}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem value={o.value} key={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export default function Home() {
  const [records, setRecords] = useState<Incident[]>([]),
    [status, setStatus] = useState('loading');
  const {
    state,
    ready,
    navigate,
    openIncident,
    closeIncident,
    resolveIncident,
  } = useExplorer();
  const { filters, page, selected, view, by, then, drill } = state;
  const [detail, setDetail] = useState<Incident | null>(null),
    [detailError, setDetailError] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const choices = (key: keyof Incident) =>
    [
      ...new Set(
        records
          .map((r) => r[key])
          .filter((v) => typeof v === 'string' && v.trim()) as string[],
      ),
    ].sort();
  const agencies = useMemo(
    () => agencySuggestions(records.map((r) => r.responding_agency)),
    [records],
  );
  const detailLevels = useMemo(
    () =>
      [
        ...new Set(
          records.flatMap((r) =>
            r.detail_score == null || String(r.detail_score).trim() === ''
              ? []
              : [String(r.detail_score).trim()],
          ),
        ),
      ].sort(),
    [records],
  );
  const locations = useMemo(
    () =>
      [
        ...new Set(
          records
            .flatMap((r) => [
              r.location_group,
              r.location,
              r.peak,
              r.place,
              r.county,
            ])
            .filter(Boolean) as string[],
        ),
      ].sort(),
    [records],
  );
  const suggestions = useMemo(
    () =>
      locations
        .filter((x) => x.toLowerCase().includes(filters.location.toLowerCase()))
        .slice(0, 30),
    [locations, filters.location],
  );
  const deferred = useDeferredValue(filters),
    search = useMemo(() => createSearch(records), [records]);
  const baseResults = useMemo(() => search(deferred), [search, deferred]);
  const results = useMemo(
    () =>
      view === 'incidents' && drill.length
        ? baseResults.filter((r) => inGroup(r, drill))
        : baseResults,
    [baseResults, drill, view],
  );
  const groupFields = useMemo(
    () => (then === 'none' ? [by] : [by, then]),
    [by, then],
  );
  const groups = useMemo(
    () => aggregateIncidents(baseResults, groupFields),
    [baseResults, groupFields],
  );
  const setPage = (value: number) => navigate({ page: value });
  async function copyIncident() {
    try {
      await navigator.clipboard.writeText(
        new URL(location.pathname + location.search, SITE_URL).href,
      );
      setCopyStatus('Copied');
    } catch {
      setCopyStatus('Copy the URL from your address bar');
    }
  }
  const years = useMemo(
    () => [...new Set(records.map((r) => r.date.slice(0, 4)))].sort().reverse(),
    [records],
  );
  const types = useMemo(
    () =>
      [
        ...new Set(
          records.map((r) => r.incident_type).filter(Boolean) as string[],
        ),
      ].sort(),
    [records],
  );
  const countByYear = useMemo(
    () =>
      years
        .slice()
        .reverse()
        .map((y) => ({
          year: y,
          count: records.filter((r) => r.date.startsWith(y)).length,
        })),
    [years, records],
  );
  const maxCount = Math.max(1, ...countByYear.map((y) => y.count));
  function update(key: keyof Filters, value: string) {
    navigate(
      {
        filters: {
          ...filters,
          [key]: value,
          ...(key === 'q'
            ? { sort: value.trim() ? 'relevance' : 'newest' }
            : {}),
        },
        page: 1,
      },
      ['q', 'location', 'agency'].includes(key) ? 'replace' : 'push',
    );
  }
  function clear() {
    navigate({ filters: defaults, page: 1, drill: [] });
  }
  useEffect(() => {
    const ctrl = new AbortController();
    fetch('/data/incidents.json', { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((r) => {
        setRecords(r as Incident[]);
        setStatus('loaded');
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setStatus('error');
      });
    return () => ctrl.abort();
  }, []);
  useEffect(() => {
    setDetail(null);
    setCopyStatus('');
    setDetailError(false);
    if (!selected) return;
    const ctrl = new AbortController();
    fetch('/data/incidents/' + encodeURIComponent(selected) + '.json', {
      signal: ctrl.signal,
    })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((r) => {
        if (ctrl.signal.aborted) return;
        const incident = r as Incident;
        setDetail(incident);
        if (incident.id !== selected) resolveIncident(incident.id);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setDetailError(true);
      });
    return () => ctrl.abort();
  }, [selected, resolveIncident]);
  useEffect(() => {
    if (status !== 'loaded') return;
    const ctx = (
      document as unknown as {
        modelContext?: Parameters<typeof registerArchiveTool>[0];
      }
    ).modelContext;
    return registerArchiveTool(ctx, search, (f) =>
      flushSync(() => {
        navigate({
          filters: f,
          page: 1,
          drill: [],
          selected: null,
          view: 'incidents',
        });
      }),
    );
  }, [search, status, navigate]);
  useEffect(() => {
    if (!ready) return;
    document.title = selected
      ? `${detail?.summary.slice(0, 100) || 'Incident ' + selected} — Colorado SAR Archive`
      : `${view === 'groups' ? 'Group & count' : 'Explore incidents'} — Colorado SAR Archive`;
  }, [ready, selected, detail, view]);
  const active =
    Object.entries(filters).some(
      ([k, v]) => k !== 'sort' && v !== defaults[k as keyof Filters],
    ) || drill.length > 0;
  const pages = Math.max(
      1,
      Math.ceil((view === 'groups' ? groups.length : results.length) / 20),
    ),
    safePage = Math.min(page, pages);
  return (
    <>
      <Header />
      <main id="main-content" className="archive">
        <section className="intro">
          <div className="intro-photo" aria-hidden="true" />
          <div>
            <p className="eyebrow">
              <span /> PUBLIC RECORD • COLORADO BACKCOUNTRY
            </p>
            <h1>Every rescue has a story.</h1>
            <p className="intro-copy">
              Explore search and rescue incidents across Colorado.
              <br className="desktop-break" /> Find the places, circumstances,
              and source reports behind the record.
            </p>
          </div>
          <div className="archive-stat">
            <strong>
              {status === 'loaded' ? records.length.toLocaleString() : '—'}
            </strong>
            <span>INCIDENTS IN THE ARCHIVE</span>
            <small>
              {years.length
                ? `${years.at(-1)} — ${years[0]}`
                : 'Loading archive'}
            </small>
          </div>
        </section>
        <div className="workspace">
          <aside className={'filters ' + (filtersOpen ? 'filters-open' : '')}>
            <button
              className="mobile-filter-toggle"
              aria-expanded={filtersOpen}
              aria-controls="filter-controls"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal size={17} />{' '}
              {filtersOpen ? 'Hide filters' : 'Show filters'}
              {active ? ' · active' : ''}
            </button>
            <div id="filter-controls" className="filter-controls">
              <div className="filter-title">
                <SlidersHorizontal size={17} />
                <h2>Refine the archive</h2>
              </div>
              <label className="field-label" htmlFor="location">
                Location
              </label>
              <div className="input-wrap">
                <MapPin size={17} />
                <input
                  id="location"
                  list="locations"
                  maxLength={300}
                  value={filters.location}
                  onChange={(e) => update('location', e.target.value)}
                  placeholder="Peak, trail, or county"
                />
              </div>
              <datalist id="locations">
                {suggestions.map((x) => (
                  <option key={x} value={x} />
                ))}
              </datalist>
              <p className="field-hint">
                Suggestions come from the archive. Mt / Mount are matched alike.
              </p>
              <Picker
                title="Year"
                value={filters.year}
                onChange={(v) => update('year', v)}
                options={[
                  { value: 'all', label: 'All years' },
                  ...years.map((y) => ({ value: y, label: y })),
                ]}
              />
              <fieldset className="type-options">
                <legend>Incident types · select any</legend>
                {types.map((t) => (
                  <label key={t}>
                    <input
                      type="checkbox"
                      checked={
                        filters.type !== 'all' &&
                        filters.type.split(',').includes(t)
                      }
                      onChange={(e) => {
                        const selected = new Set(
                          filters.type === 'all' ? [] : filters.type.split(','),
                        );
                        if (e.target.checked) selected.add(t);
                        else selected.delete(t);
                        update('type', [...selected].sort().join(',') || 'all');
                      }}
                    />
                    {label(t)}
                  </label>
                ))}
                <p className="field-hint">No selection includes all types.</p>
              </fieldset>
              <Picker
                title="Outcome"
                value={filters.outcome}
                onChange={(v) => update('outcome', v)}
                options={[
                  { value: 'all', label: 'All outcomes' },
                  { value: '__missing__', label: 'Not recorded' },
                  ...choices('outcome').map((v) => ({
                    value: v,
                    label: label(v),
                  })),
                ]}
              />
              <label className="field-label" htmlFor="agency">
                Responding agency
              </label>
              <input
                className="filter-input"
                id="agency"
                list="agencies"
                maxLength={300}
                value={filters.agency}
                onChange={(e) => update('agency', e.target.value)}
                placeholder="Agency or SAR team"
              />
              <datalist id="agencies">
                {agencies.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <p className="field-hint">
                Suggestions combine known agency aliases. You can also search
                the original agency text.
              </p>
              <Picker
                title="Detail level"
                value={filters.detail}
                onChange={(v) => update('detail', v)}
                options={[
                  { value: 'all', label: 'All detail levels' },
                  { value: '__missing__', label: 'Not recorded' },
                  ...detailLevels.map((v) => ({
                    value: v,
                    label: detailLabels[v] || label(v),
                  })),
                ]}
              />
              <div className="date-filters">
                <label>
                  From
                  <input
                    type="date"
                    value={filters.from}
                    onChange={(e) => update('from', e.target.value)}
                  />
                </label>
                <label>
                  Through
                  <input
                    type="date"
                    value={filters.to}
                    onChange={(e) => update('to', e.target.value)}
                  />
                </label>
              </div>
              {filters.from && filters.to && filters.from > filters.to && (
                <p role="alert" className="field-hint">
                  Start date must be on or before the end date.
                </p>
              )}
              <fieldset className="type-options month-options">
                <legend>Months · select any</legend>
                {Array.from({ length: 12 }, (_, i) => {
                  const value = String(i + 1).padStart(2, '0');
                  return (
                    <label key={value}>
                      <input
                        type="checkbox"
                        checked={
                          filters.month !== 'all' &&
                          filters.month.split(',').includes(value)
                        }
                        onChange={(e) => {
                          const selected = new Set(
                            filters.month === 'all'
                              ? []
                              : filters.month.split(','),
                          );
                          if (e.target.checked) selected.add(value);
                          else selected.delete(value);
                          update(
                            'month',
                            [...selected].sort().join(',') || 'all',
                          );
                        }}
                      />
                      {new Date(2000, i, 1).toLocaleString('en-US', {
                        month: 'long',
                      })}
                    </label>
                  );
                })}
                <p className="field-hint">No selection includes all months.</p>
              </fieldset>
              <p className="field-hint">
                Dates, year and month filters intersect. Use a date range for a
                season spanning two years.
              </p>
              <Picker
                title="Setting"
                value={filters.setting}
                onChange={(v) => update('setting', v)}
                options={[
                  { value: 'all', label: 'All settings' },
                  ...choices('setting').map((v) => ({
                    value: v,
                    label: label(v),
                  })),
                ]}
              />
              <Picker
                title="Place type"
                value={filters.placeType}
                onChange={(v) => update('placeType', v)}
                options={[
                  { value: 'all', label: 'All place types' },
                  ...choices('place_type').map((v) => ({
                    value: v,
                    label: label(v),
                  })),
                ]}
              />
              {active && (
                <button className="clear-button" onClick={clear}>
                  <X size={14} /> Clear all filters
                </button>
              )}
              <div className="coverage">
                <p className="eyebrow">THE RECORD OVER TIME</p>
                <div
                  className="histogram"
                  aria-label="Recorded incidents by year"
                >
                  {countByYear.map((y) => (
                    <button
                      key={y.year}
                      title={`${y.year}: ${y.count} incidents`}
                      aria-label={`Filter to ${y.year}, ${y.count} incidents`}
                      className={filters.year === y.year ? 'chosen' : ''}
                      onClick={() =>
                        update('year', filters.year === y.year ? 'all' : y.year)
                      }
                      style={{
                        height: `${Math.max(4, (y.count / maxCount) * 78)}px`,
                      }}
                    />
                  ))}
                </div>
                <div className="axis">
                  <span>{years.at(-1)}</span>
                  <span>{years[0]}</span>
                </div>
                <p>
                  Counts reflect this collection, not all rescues. Coverage
                  varies by year and agency.
                </p>
              </div>
              <a className="download" href="/data/colorado-sar.db" download>
                <Download size={17} />
                <span>
                  Download SQLite<small>Full archive · open format</small>
                </span>
                <ArrowUpRight size={16} />
              </a>
            </div>
          </aside>
          <section className="results" aria-label="Incident search">
            <div className="searchbar">
              <Search size={21} />
              <input
                aria-label="Search titles and notes"
                placeholder="Search titles and notes…"
                maxLength={MAX_QUERY_LENGTH}
                value={filters.q}
                onChange={(e) => update('q', e.target.value)}
              />
              {filters.q && (
                <button
                  aria-label="Clear search"
                  onClick={() => update('q', '')}
                >
                  <X size={17} />
                </button>
              )}
              <span className="fuzzy-label">
                {filters.q.trim().length > 32 ? 'ALL WORDS' : 'FUZZY SEARCH'}
              </span>
            </div>
            <Tabs
              value={view}
              onValueChange={(value) =>
                navigate({
                  view: value as 'incidents' | 'groups',
                  drill: [],
                  page: 1,
                })
              }
            >
              <div className="view-switcher">
                <TabsList aria-label="Archive view">
                  <TabsTrigger value="incidents">
                    <List size={16} /> Incidents
                  </TabsTrigger>
                  <TabsTrigger value="groups">
                    <Table2 size={16} /> Group & count
                  </TabsTrigger>
                </TabsList>
                <span className="view-hint">
                  Explore the records. Find the patterns.
                </span>
              </div>
              <TabsContent value={view}>
                {view === 'groups' && (
                  <div className="group-controls">
                    <Picker
                      title="Group by"
                      value={by}
                      onChange={(v) =>
                        navigate({
                          by: v as Dimension,
                          then: then === v ? 'none' : then,
                          drill: [],
                          page: 1,
                        })
                      }
                      options={dimensions.map((d) => ({
                        value: d,
                        label: dimensionLabels[d],
                      }))}
                    />
                    <span className="group-plus">+</span>
                    <Picker
                      title="Then by (optional)"
                      value={then}
                      onChange={(v) =>
                        navigate({
                          then: v as Dimension | 'none',
                          drill: [],
                          page: 1,
                        })
                      }
                      options={[
                        { value: 'none', label: 'No second field' },
                        ...dimensions
                          .filter((d) => d !== by)
                          .map((d) => ({
                            value: d,
                            label: dimensionLabels[d],
                          })),
                      ]}
                    />
                    <p>
                      Counts reflect uneven source coverage, not geographic
                      risk.
                      <br />
                      More records do not mean a place is more dangerous. Click
                      a group to inspect its records.
                    </p>
                  </div>
                )}
                {view === 'incidents' && drill.length > 0 && (
                  <div className="group-breadcrumb">
                    <button
                      onClick={() =>
                        navigate({ view: 'groups', drill: [], page: 1 })
                      }
                    >
                      <ChevronLeft size={16} /> All groups
                    </button>
                    <span>
                      {drill
                        .map(
                          (g) =>
                            `${dimensionLabels[g.field]}: ${g.value || 'Not recorded'}`,
                        )
                        .join(' · ')}
                    </span>
                    <button
                      className="clear-group"
                      aria-label="Clear group filter"
                      onClick={() => navigate({ drill: [], page: 1 })}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                <div className="results-toolbar">
                  <p aria-live="polite">
                    {status === 'loaded' ? (
                      <>
                        <b>{results.length.toLocaleString()}</b>{' '}
                        {active ? 'matching' : 'recorded'} incidents
                        {view === 'groups'
                          ? ` across ${groups.length.toLocaleString()} groups`
                          : ''}
                      </>
                    ) : status === 'error' ? (
                      'Archive unavailable'
                    ) : (
                      'Loading incidents…'
                    )}
                  </p>
                  {view === 'groups' ? (
                    <span className="count-order">Count ↓ Highest first</span>
                  ) : (
                    <Picker
                      title="Sort"
                      value={filters.sort}
                      onChange={(v) => update('sort', v)}
                      options={[
                        { value: 'newest', label: 'Newest first' },
                        { value: 'oldest', label: 'Oldest first' },
                        ...(filters.q
                          ? [{ value: 'relevance', label: 'Best match' }]
                          : []),
                      ]}
                    />
                  )}
                </div>
                {status === 'error' ? (
                  <Empty>
                    <EmptyTitle>Couldn’t load the archive</EmptyTitle>
                    <EmptyDescription>
                      Check your connection and try again.
                    </EmptyDescription>
                    <button
                      className="action"
                      onClick={() => location.reload()}
                    >
                      Try again
                    </button>
                  </Empty>
                ) : status === 'loading' ? (
                  <div className="loading-list">
                    {[1, 2, 3, 4].map((n) => (
                      <Skeleton key={n} className="h-36 w-full" />
                    ))}
                  </div>
                ) : results.length === 0 ? (
                  <Empty className="empty-state">
                    <Mountain size={36} />
                    <EmptyTitle>No incidents found</EmptyTitle>
                    <EmptyDescription>
                      Try a broader place name, a shorter title search, or fewer
                      filters.
                    </EmptyDescription>
                    <button className="action" onClick={clear}>
                      Reset filters
                    </button>
                  </Empty>
                ) : view === 'groups' ? (
                  <Table className="group-table">
                    <TableHeader>
                      <TableRow>
                        {groupFields.map((f) => (
                          <TableHead key={f} scope="col">
                            {dimensionLabels[f]}
                          </TableHead>
                        ))}
                        <TableHead
                          scope="col"
                          aria-sort="descending"
                          className="count-cell"
                        >
                          Incidents ↓
                        </TableHead>
                        <TableHead scope="col">
                          <span className="sr-only">Open group</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groups
                        .slice((safePage - 1) * 20, safePage * 20)
                        .map((group) => {
                          const target = {
                            ...state,
                            view: 'incidents' as const,
                            drill: group.values,
                            page: 1,
                          };
                          return (
                            <TableRow
                              key={group.key}
                              onClick={() => navigate(target)}
                            >
                              {group.labels.map((text, i) => (
                                <TableCell key={groupFields[i]}>
                                  {i === 0 ? (
                                    <a
                                      href={explorerUrl(target)}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (
                                          !e.metaKey &&
                                          !e.ctrlKey &&
                                          !e.shiftKey &&
                                          !e.altKey
                                        ) {
                                          e.preventDefault();
                                          navigate(target);
                                        }
                                      }}
                                    >
                                      {['outcome', 'incident_type'].includes(
                                        groupFields[i],
                                      )
                                        ? label(text)
                                        : text}
                                    </a>
                                  ) : (
                                    <span className="group-secondary">
                                      {['outcome', 'incident_type'].includes(
                                        groupFields[i],
                                      )
                                        ? label(text)
                                        : text}
                                    </span>
                                  )}
                                </TableCell>
                              ))}
                              <TableCell className="count-cell">
                                <div
                                  className="count-bar"
                                  style={
                                    {
                                      '--bar': `${(group.count / Math.max(1, groups[0]?.count || 1)) * 100}%`,
                                    } as React.CSSProperties
                                  }
                                >
                                  <b>{group.count.toLocaleString()}</b>
                                </div>
                              </TableCell>
                              <TableCell>
                                <ArrowRight size={17} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="incident-list">
                    {results
                      .slice((safePage - 1) * 20, safePage * 20)
                      .map((r) => (
                        <article key={r.id} className="incident">
                          <div className="incident-date">
                            <span>{formatDate(r.date).split(',')[0]}</span>
                            <small>{r.date.slice(0, 4)}</small>
                          </div>
                          <div className="incident-main">
                            <div className="incident-tags">
                              <span
                                className={
                                  'type-tag ' +
                                  (r.incident_type === 'avalanche'
                                    ? 'amber'
                                    : '')
                                }
                              >
                                {label(r.incident_type)}
                              </span>
                              <IncidentTags incident={r} />
                              <span>{r.county || 'County not recorded'}</span>
                            </div>
                            <a
                              className="incident-title"
                              href={explorerUrl({ ...state, selected: r.id })}
                              onClick={(e) => {
                                if (
                                  !e.metaKey &&
                                  !e.ctrlKey &&
                                  !e.shiftKey &&
                                  !e.altKey
                                ) {
                                  e.preventDefault();
                                  openIncident(r.id);
                                }
                              }}
                            >
                              {r.summary}
                            </a>
                            <div className="incident-context">
                              <span>
                                People involved: {displayValue(r.victims)}
                              </span>
                              <span>
                                Agency: {displayValue(r.responding_agency)}
                              </span>
                            </div>
                            <div className="incident-location">
                              <MapPin size={14} />
                              <span>
                                {r.location ||
                                  r.place ||
                                  'Location not recorded'}
                              </span>
                            </div>
                          </div>
                          <button
                            className="open-incident"
                            aria-label={`Read incident from ${r.date}`}
                            onClick={() => openIncident(r.id)}
                          >
                            <ArrowRight size={20} />
                          </button>
                        </article>
                      ))}
                  </div>
                )}
                {status === 'loaded' && results.length > 0 && (
                  <Pagination className="pager">
                    <PaginationContent>
                      <PaginationItem>
                        <button
                          disabled={safePage === 1}
                          onClick={() => setPage(safePage - 1)}
                        >
                          <ChevronLeft size={16} /> Previous
                        </button>
                      </PaginationItem>
                      <PaginationItem>
                        <span>
                          Page {safePage} of {pages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <button
                          disabled={safePage === pages}
                          onClick={() => setPage(safePage + 1)}
                        >
                          Next <ChevronRight size={16} />
                        </button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </TabsContent>
            </Tabs>
          </section>
        </div>
        <footer className="site-footer">
          <span>
            Colorado SAR Archive{' '}
            <a className="photo-credit" href="/IMAGE-CREDITS.md">
              Landscape: NPS / public domain
            </a>
          </span>
          <p>
            An independent historical collection. For an emergency, call 911.
          </p>
          <a href="/faq/">
            About the data <ArrowUpRight size={14} />
          </a>
        </footer>
      </main>
      <Sheet open={!!selected} onOpenChange={(v) => !v && closeIncident()}>
        <SheetContent className="incident-sheet">
          <SheetHeader>
            <p className="eyebrow">INCIDENT RECORD</p>
            <SheetTitle>
              {detail ? formatDate(detail.date) : 'Incident details'}
            </SheetTitle>
            <SheetDescription>
              {detail
                ? `${detail.county || 'County not recorded'} · ${label(detail.incident_type)}`
                : 'Source report and incident context'}
            </SheetDescription>
            {detail && (
              <div
                className="incident-tags"
                aria-label="Incident outcome and detail level"
              >
                <IncidentTags incident={detail} />
              </div>
            )}
            <button className="share-incident" onClick={copyIncident}>
              {copyStatus === 'Copied' ? (
                <Check size={15} />
              ) : (
                <Copy size={15} />
              )}{' '}
              {copyStatus || 'Copy incident link'}
            </button>
            <span className="sr-only" role="status">
              {copyStatus}
            </span>
          </SheetHeader>
          {detail ? (
            <div className="detail-body">
              <h2>{detail.summary}</h2>
              {(detail.location || detail.place || detail.peak) && (
                <p>
                  <a
                    className="map-search-link"
                    href={
                      'https://www.google.com/maps/search/?api=1&query=' +
                      encodeURIComponent(
                        [
                          detail.location || detail.place || detail.peak,
                          detail.county,
                          'Colorado',
                        ]
                          .filter(Boolean)
                          .join(', '),
                      )
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Find reported place on a map{' '}
                    <ExternalLink size={14} className="inline" />
                  </a>
                  <small className="field-hint">
                    Place-name search only; not a verified incident coordinate.
                  </small>
                </p>
              )}
              <dl className="detail-grid">
                {[
                  ['Reported location', detail.location],
                  ['Location group', detail.location_group],
                  ['County', detail.county],
                  ['Incident type', label(detail.incident_type)],
                  ['Recorded outcome', label(detail.outcome)],
                  ['People involved', detail.victims],
                  ['Responding agency', detail.responding_agency],
                  ['Place', detail.place],
                  ['Peak', detail.peak],
                  ['Setting', detail.setting],
                  ['Place type', detail.place_type],
                  ['Source detail score', detail.detail_score],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt>{k}</dt>
                    <dd>{displayValue(v)}</dd>
                  </div>
                ))}
              </dl>
              <section>
                <h3>Notes & context</h3>
                <p>{detail.notes || 'No additional notes recorded.'}</p>
                <p className="data-note">
                  Outcomes and details may be incomplete or inferred. Check the
                  original source and notes before drawing conclusions.
                </p>
              </section>
              <section>
                <h3>Original sources</h3>
                {sourceLinks(detail.source_urls).length ? (
                  sourceLinks(detail.source_urls).map((url, i) => (
                    <a
                      className="source-link"
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer nofollow ugc"
                    >
                      <span>
                        {new URL(url).hostname}
                        <small>Source {i + 1}</small>
                      </span>
                      <ExternalLink size={16} />
                    </a>
                  ))
                ) : (
                  <p>No source link recorded.</p>
                )}
              </section>
              <div className="record-id">Record {detail.id}</div>
            </div>
          ) : detailError ? (
            <Empty>
              <EmptyTitle>Incident unavailable</EmptyTitle>
              <EmptyDescription>
                This record may have moved. Close this panel and search the
                archive.
              </EmptyDescription>
            </Empty>
          ) : (
            <Skeleton className="m-6 h-80" />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export const dynamic = 'force-static';
