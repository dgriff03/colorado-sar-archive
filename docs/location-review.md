# Location consolidation report

Generated with `python3 scripts/location-report.py`. Counts describe archive records, not distinct rescues.

3,718 incidents retained; 958 receive a different browsing label. Distinct location groups decrease from 2,593 reported labels to 2,202 browsing labels (case and outer whitespace normalized).

Mappings are exact and county-scoped. Original locations, source notes and IDs remain unchanged. An area can include routes, summit, slopes or lake approaches. This is not geocoding.

| Reviewed browsing area | Records | Reported labels |
| --- | ---: | ---: |
| St. Mary's Glacier / Lake area | 109 | 17 |
| Mount Bierstadt | 187 | 19 |
| Summit Lake (Mount Blue Sky) | 27 | 11 |
| Torreys Peak | 60 | 20 |
| Longs Peak | 51 | 44 |
| Mount Blue Sky | 74 | 15 |
| Sawtooth Ridge (Bierstadt / Blue Sky) | 20 | 13 |
| Bierstadt / Blue Sky area | 11 | 6 |
| Grays / Torreys area | 47 | 10 |
| Grays Peak | 14 | 4 |
| Quandary Peak | 32 | 19 |
| Capitol Peak | 15 | 12 |
| Crestone Needle | 20 | 8 |
| Crestone Peak | 9 | 5 |
| Mount Sneffels | 12 | 9 |
| Humboldt Peak | 5 | 3 |
| Mount Princeton | 5 | 3 |
| Mount Elbert | 4 | 4 |
| Mount Massive | 3 | 3 |
| La Plata Peak | 4 | 3 |
| Mount of the Holy Cross | 10 | 9 |
| Snowmass Mountain | 5 | 5 |
| Maroon Peak | 10 | 7 |
| North Maroon Peak | 7 | 2 |
| Pyramid Peak | 4 | 4 |
| Mount Sherman | 3 | 3 |
| Mount Falcon Park | 25 | 5 |
| Chief Mountain | 30 | 8 |
| Mount Spaulding | 11 | 4 |
| Mount Goliath | 6 | 6 |
| Mount Sniktau | 5 | 2 |
| Mount Trelease | 7 | 4 |
| Square Top Mountain | 4 | 3 |
| Greyrock Mountain | 12 | 6 |
| Bergen Peak | 8 | 3 |
| Lookout Mountain | 14 | 5 |
| Jones Pass | 38 | 6 |
| Berthoud Pass | 37 | 17 |
| Loveland Pass | 46 | 5 |
| Chicago Lakes | 26 | 13 |
| Echo Lake | 30 | 3 |
| Herman Gulch / Lake | 31 | 9 |
| Loch Lomond | 11 | 5 |
| Silver Dollar Lake | 8 | 3 |
| Butler Gulch | 9 | 2 |
| Guanella Pass | 12 | 5 |
| Deer Creek Canyon Park | 22 | 5 |
| Fall River Reservoir | 6 | 2 |
| Waldorf Mine | 8 | 3 |
| Watrous Gulch | 3 | 2 |
| Barbour Forks | 5 | 3 |
| Manitou Incline | 9 | 5 |
| Seven Bridges Trail | 3 | 2 |
| Eleven Mile Reservoir | 3 | 2 |
| Eldorado Canyon | 51 | 43 |
| First Flatiron | 11 | 6 |
| Second Flatiron | 8 | 6 |
| Third Flatiron | 7 | 5 |

## Decisions and exclusions

- **St. Mary's Glacier / Lake area** (Clear Creek): Lake, glacier, trail and immediately surrounding area are one browsing area; source wording remains in location.
- **Mount Bierstadt** (Clear Creek, Park): Mountain, summit, slopes, trail and trailhead reports. Multi-mountain and Sawtooth reports are excluded.
- **Summit Lake (Mount Blue Sky)** (Clear Creek): Summit Lake and immediate trail/area reports in Clear Creek County, including historical Mount Evans labels. Other counties and Camp Rock excluded.
- **Torreys Peak** (Clear Creek, Clear Creek County): Torreys Peak includes Kelso Ridge, summit, faces and named couloirs. Preserve reported route names; exclude shared Grays/Torreys and Grizzly areas. Clear Creek County is a legacy county spelling.
- **Longs Peak** (Boulder, Larimer, not recorded): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Mount Blue Sky** (Clear Creek): Direct mountain, face, ridge and Black Wall reports; historical Evans labels share the Blue Sky group. Keep Summit Lake, Chicago Lakes, Goliath, roads, labs, ranches and wilderness-wide reports separate.
- **Sawtooth Ridge (Bierstadt / Blue Sky)** (Clear Creek): Explicit Sawtooth route/area reports; retain both mountains in the display name rather than assign the connecting route to only one peak.
- **Bierstadt / Blue Sky area** (Clear Creek): Joint two-mountain reports remain a shared area; normalize mountain abbreviations and historical Evans naming without assigning a single peak.
- **Grays / Torreys area** (Clear Creek): Joint Grays/Torreys reports, shared saddle, approach and trailhead. Keep individual Grays and Torreys groups separate.
- **Grays Peak** (Clear Creek, not recorded): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Quandary Peak** (Summit): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Capitol Peak** (Pitkin, Pitkin County): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Crestone Needle** (Custer, Saguache, not recorded): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Crestone Peak** (Custer, Saguache, not recorded): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Mount Sneffels** (Ouray, Ouray County): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Humboldt Peak** (Custer): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Mount Princeton** (Chaffee): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Mount Elbert** (Lake): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Mount Massive** (Lake): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **La Plata Peak** (Chaffee, Lake): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Mount of the Holy Cross** (Eagle): Mountain-specific names, slopes, summit and explicitly associated Cross Creek/Bowl of Tears reports. Do not include the whole Holy Cross Wilderness.
- **Snowmass Mountain** (Pitkin, Gunnison): Explicit Snowmass Mountain records only; exclude ski resort, village, lake, wilderness and the Snowmass-Hagerman traverse.
- **Maroon Peak** (Pitkin): Maroon/South Maroon labels and explicitly named routes. North Maroon and the connecting ridge remain separate.
- **North Maroon Peak** (Pitkin, Pitkin County): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Pyramid Peak** (Pitkin): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Mount Sherman** (Park): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Mount Falcon Park** (Jefferson): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Chief Mountain** (Clear Creek): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Mount Spaulding** (Clear Creek): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Mount Goliath** (Clear Creek): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Mount Sniktau** (Clear Creek): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Mount Trelease** (Clear Creek): Mountain-specific labels and explicitly nearby Pat’s Knob report. Loveland Ski Area remains separate even where Trelease is mentioned.
- **Square Top Mountain** (Clear Creek): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Greyrock Mountain** (Larimer, Larimer County): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Bergen Peak** (Jefferson): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Lookout Mountain** (Jefferson): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Jones Pass** (Clear Creek, Grand): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Berthoud Pass** (Clear Creek, Grand, not recorded): Pass, explicitly named local runs, chutes and Current/Currant Creek areas. Separate named nearby mountains, Berthoud Falls and other drainages.
- **Loveland Pass** (Clear Creek, not recorded): Pass and explicitly associated Seven Sisters/Sheep Creek reports. Do not fold Loveland ski area, nearby named peaks or highway segments into the pass.
- **Chicago Lakes** (Clear Creek): Upper/lower lake, trail and area reports share a lakes-area group. Other Evans/Blue Sky landmarks stay separate.
- **Echo Lake** (Clear Creek): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Herman Gulch / Lake** (Clear Creek): Herman/Hermans/Herman’s Gulch and associated lake labels form one trail/lake browsing area. Exclude Citadel and Woods Mountain even when described relative to the gulch.
- **Loch Lomond** (Clear Creek): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Silver Dollar Lake** (Clear Creek): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Butler Gulch** (Clear Creek): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Guanella Pass** (Clear Creek): Pass, summit, winter gate and explicitly named pass trailhead. Separately named lakes, mountains, mines and trails remain distinct.
- **Deer Creek Canyon Park** (Jefferson): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Fall River Reservoir** (Clear Creek): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Waldorf Mine** (Clear Creek): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Watrous Gulch** (Clear Creek): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Barbour Forks** (Clear Creek, not recorded): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Manitou Incline** (El Paso): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Seven Bridges Trail** (El Paso, El Paso County): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Eleven Mile Reservoir** (Park): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Eldorado Canyon** (Boulder): Explicit Eldorado Canyon/State Park climbing walls, routes and trails roll up to the canyon. Preserve the particular climb in reported location.
- **First Flatiron** (Boulder): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Second Flatiron** (Boulder): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.
- **Third Flatiron** (Boulder): Explicitly named mountain/area, including its named routes and immediate features. Preserve reported location; exclude neighboring mountains and multi-area reports.

## Remaining work

Unlisted names remain as reported. Generic county-wide locations, unclear nearby-area reports, and multi-mountain traverses need more evidence before assignment to a single mountain. No incident duplicates were merged or deleted. See [location curation](locations.md) for the review process.
