# Western GPA Calculator — Chrome / Edge Extension

A lightweight browser extension for Western University students that calculates your weighted GPA and average directly on the Student Center grades page.

## Features

- Displays **GPA (Scale 3)**, **weighted average %**, **course count**, and **total credits** in a single banner above your grades table
- Automatically recalculates when you switch terms or years
- Only runs on `student.uwo.ca` — zero impact on other sites
- No data is collected, stored, or sent anywhere — everything runs locally in your browser

## GPA Scale (Western — Scale 3, Percentages)

| Percentage | GPA |
|------------|-----|
| 90–100     | 4.0 |
| 85–89      | 3.9 |
| 80–84      | 3.7 |
| 77–79      | 3.3 |
| 73–76      | 3.0 |
| 70–72      | 2.7 |
| 67–69      | 2.3 |
| 63–66      | 2.0 |
| 60–62      | 1.7 |
| 57–59      | 1.3 |
| 53–56      | 1.0 |
| 50–52      | 0.7 |
| Below 50   | 0.0 |

Based on the [OUAC undergraduate grade conversion table](https://www.ouac.on.ca/guide/undergraduate-grade-conversion-table/).

## Install

1. Download or clone this repository
2. Open your browser's extension page:
   - **Chrome:** `chrome://extensions`
   - **Edge:** `edge://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the folder you downloaded
5. Go to your [Student Center grades page](https://student.uwo.ca) and refresh

The GPA banner will appear between the term selector and your grades table.

## Updating

After pulling new changes or editing files, go to your browser's extension page and click **Reload** on the extension card, then refresh the grades page.

## How It Works

- Detects the grades table by looking for columns headed **Units** and **Grade**
- Reads each row's credits and numeric grade
- Computes weighted GPA and weighted average percentage (only rows with posted grades are counted)
- Injects a single overlay banner directly above the grades table

## Contributing

Pull requests and issues are welcome. If you'd like to add support for other Ontario universities or grading scales, open an issue to discuss the approach.

## License

MIT
