# PeopleSoft GPA Overlay Extension

This Chrome/Edge extension reads course rows from a PeopleSoft grades table, calculates weighted GPA, and injects a GPA card directly above the active grades table.

## What it looks for

- Any table that has `Units` and `Grade` headers
- It reads each row's units and grade columns dynamically by header position

Blank grades are ignored until posted.

## GPA scale used (Western University scale 3 percentages)

Numeric grades are mapped to a 4.0 scale:

- 90-100 => 4.0
- 85-89 => 3.9
- 80-84 => 3.7
- 77-79 => 3.3
- 73-76 => 3.0
- 70-72 => 2.7
- 67-69 => 2.3
- 63-66 => 2.0
- 60-62 => 1.7
- 57-59 => 1.3
- 53-56 => 1.0
- 50-52 => 0.7
- <50 => 0.0

* GPA Scale is based off of this source: https://www.ouac.on.ca/guide/undergraduate-grade-conversion-table/*

Letter grades are also supported (`A+` through `F`) in case your portal uses letters.

## Install (Chrome or Edge)

1. Open extension page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `C:\Users\mmaka\PC\embedded-gpa-calculator`
5. Open your grades page and refresh.

The GPA card should appear above your grades grid.
