// A derived search vocabulary, not corrections to reported agency text.
// Only recognized organizations are suggested; all original text stays searchable.
type AgencyRule = { name: string; pattern: RegExp; aliases: string[] };
const rules: AgencyRule[] = [];
function add(name: string, aliases: string[], pattern?: RegExp) {
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  rules.push({
    name,
    aliases: [name, ...aliases],
    pattern:
      pattern ||
      new RegExp(`\\b(?:${[name, ...aliases].map(escape).join('|')})\\b`, 'i'),
  });
}
add('Alpine Rescue Team', ['ART']);
add('Rocky Mountain Rescue Group', ['RMRG']);
add('Summit County Rescue Group', [
  'Summit County SAR',
  'Summit County Search and Rescue',
  'SCRG',
]);
add('Mountain Rescue Aspen', ['MRA']);
add('Ouray Mountain Rescue Team', ['Ouray Mountain Rescue']);
add('Vail Mountain Rescue Group', ['Vail Mountain Rescue']);
add('Crested Butte Search and Rescue', [
  'Crested Butte SAR',
  'Crested Butte Mountain Rescue Team',
]);
add('Western Mountain Rescue Team', [
  'Western State Mountain Rescue',
  'Western State College SAR',
  'Western State Colorado University SAR',
]);
add(
  'Rocky Mountain National Park',
  ['RMNP'],
  /\b(?:RMNP|Rocky Mountain National Park)\b/i,
);
add('National Park Service', ['NPS']);
add('Search and Rescue Dogs of Colorado', ['SARDOC']);
add('Colorado Parks and Wildlife', ['CPW']);
add('Colorado 4x4 Rescue and Recovery', ['Colorado 4x4 Rescue & Recovery']);
add('Flight for Life', [
  'Flight for Life Colorado',
  'St. Anthony Flight for Life',
]);
add('Colorado Army National Guard', []);
add('Colorado National Guard', []);
add('High Altitude Army National Guard Aviation Training Site', ['HAATS']);
add('Alamosa Volunteer Search and Rescue', ['Alamosa Volunteer SAR', 'AVSAR']);
const counties = [
  'Adams',
  'Alamosa',
  'Arapahoe',
  'Archuleta',
  'Baca',
  'Bent',
  'Boulder',
  'Broomfield',
  'Chaffee',
  'Cheyenne',
  'Clear Creek',
  'Conejos',
  'Costilla',
  'Crowley',
  'Custer',
  'Delta',
  'Denver',
  'Dolores',
  'Douglas',
  'Eagle',
  'El Paso',
  'Elbert',
  'Fremont',
  'Garfield',
  'Gilpin',
  'Grand',
  'Gunnison',
  'Hinsdale',
  'Huerfano',
  'Jackson',
  'Jefferson',
  'Kiowa',
  'Kit Carson',
  'La Plata',
  'Lake',
  'Larimer',
  'Las Animas',
  'Lincoln',
  'Logan',
  'Mesa',
  'Mineral',
  'Moffat',
  'Montezuma',
  'Montrose',
  'Morgan',
  'Otero',
  'Ouray',
  'Park',
  'Phillips',
  'Pitkin',
  'Prowers',
  'Pueblo',
  'Rio Blanco',
  'Rio Grande',
  'Routt',
  'Saguache',
  'San Juan',
  'San Miguel',
  'Sedgwick',
  'Summit',
  'Teller',
  'Washington',
  'Weld',
  'Yuma',
];
for (const county of counties) {
  if (county !== 'Summit') {
    const aliases = [`${county} County SAR`];
    if (county === 'Grand') aliases.push('GCSAR');
    if (county === 'Saguache') aliases.push('SAGSAR');
    add(
      `${county} County Search and Rescue`,
      aliases,
      county === 'Chaffee'
        ? /\bChaffee County (?:SAR|Search and Rescue)\b(?!\s*(?:[-–]\s*)?(?:North|South)\b)/i
        : undefined,
    );
  }
  add(
    `${county} County Sheriff's Office`,
    [`${county} County Sheriff`, `${county} County SO`],
    new RegExp(
      `\\b${county} County (?:Sheriff(?:['’]s)?(?: (?:Office|Department))?|SO)\\b`,
      'i',
    ),
  );
}
for (const direction of ['North', 'South'])
  add(
    `Chaffee County Search and Rescue ${direction}`,
    [`Chaffee County SAR ${direction}`],
    new RegExp(
      `\\bChaffee County (?:SAR|Search and Rescue)\\s*(?:[-–]\\s*)?${direction}\\b`,
      'i',
    ),
  );
for (const name of [
  'Nederland Fire Protection District',
  'Colorado Springs Fire Department',
  'Inter-Canyon Fire',
  'Indian Hills Fire',
  'Evergreen Fire Rescue',
  'Boulder Emergency Squad',
  'Lake County Search and Rescue',
  'La Plata County Search and Rescue',
]) {
  if (!rules.some((r) => r.name === name)) add(name, []);
}
export function agencyNames(value?: string | null): string[] {
  if (!value?.trim()) return [];
  const names = rules.filter((r) => r.pattern.test(value)).map((r) => r.name);
  // A named park already identifies its parent service; do not add a duplicate suggestion.
  return names.filter(
    (n) =>
      n !== 'National Park Service' ||
      !names.includes('Rocky Mountain National Park'),
  );
}
export function agencyQuery(value: string): string {
  const query = value.trim().toLowerCase();
  return (
    rules
      .find((r) => r.aliases.some((a) => a.toLowerCase() === query))
      ?.name.toLowerCase() || query
  );
}
export function agencySuggestions(
  values: (string | null | undefined)[],
): string[] {
  return [...new Set(values.flatMap(agencyNames))].sort((a, b) =>
    a.localeCompare(b),
  );
}
