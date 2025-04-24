// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: code-branch;
// GitHub-style Graph Widget

const WEEKS = 18;
const DAYS = 7;
const CELL_SIZE = 16;
const CELL_GAP = 4;
const PADDING = 20;
const MONTH_LABEL_HEIGHT = 28;
const LEFT_MARGIN = 45;
const DAY_LABEL_LEFT = LEFT_MARGIN - 24;
const COLORS = [
  "#151b22" // Color of no contributions 
];
const HIGHLIGHT_COLOR = "#239a3b"; // Color for highlighted days

const STORAGE_FILE = "contributions.json";

// Month and day labels
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

// --- Storage helpers ---
const fm = FileManager.iCloud();
const dir = fm.documentsDirectory();
const filePath = fm.joinPath(dir, STORAGE_FILE);

// Load contributions from file
function loadContributions() {
  if (fm.fileExists(filePath)) {
    if (fm.isFileStoredIniCloud(filePath) && !fm.isFileDownloaded(filePath)) {
      fm.downloadFileFromiCloud(filePath);
    }
    try {
      const data = fm.readString(filePath);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Error loading contributions:", e);
      return {};
    }
  }
  return {};
}

// Save contributions to file
function saveContributions(contributions) {
  try {
    fm.writeString(filePath, JSON.stringify(contributions));
  } catch (e) {
    console.error("Error saving contributions:", e);
  }
}

// Format date as YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// --- Prompt user to add/remove today's contribution ---
let contributions = loadContributions();
let today = new Date();
let todayKey = formatDate(today);

if (!config.runsInWidget) {
  let alert = new Alert();
  alert.title = "Toggle today's contribution";
  alert.message = contributions[todayKey]
    ? "Remove today's contribution highlight?"
    : "Add today's contribution highlight?";
  alert.addAction("Yes");
  alert.addCancelAction("No");
  let response = await alert.present();
  if (response === 0) {
    if (contributions[todayKey]) {
      delete contributions[todayKey];
    } else {
      contributions[todayKey] = true;
    }
    saveContributions(contributions);
  }
}

// --- Widget setup ---
let widget = new ListWidget();
widget.setPadding(PADDING, PADDING, PADDING, PADDING);
widget.backgroundColor = new Color("#000"); // Black background

// Draw grid
let width = WEEKS * (CELL_SIZE + CELL_GAP) + CELL_GAP + LEFT_MARGIN;
let height = DAYS * (CELL_SIZE + CELL_GAP) + CELL_GAP + MONTH_LABEL_HEIGHT;

let ctx = new DrawContext();
ctx.size = new Size(width, height);
ctx.opaque = false;
ctx.respectScreenScale = true;

// Color of background
ctx.setFillColor(new Color("#000"));
ctx.fillRect(new Rect(0, 0, width, height));

// --- Helper function for rounded rectangles ---
function fillRoundedRect(ctx, rect, radius) {
  const path = new Path();
  path.addRoundedRect(
    new Rect(rect.x, rect.y, rect.width, rect.height),
    radius,
    radius
  );
  ctx.addPath(path);
  ctx.fillPath();
}

// Calculate the date of the first cell (top-left)
let dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
let daysSinceMonday = (dayOfWeek + 6) % 7; // 0 if Monday, 6 if Sunday
let firstCellDate = new Date(today);
firstCellDate.setDate(today.getDate() - daysSinceMonday - (WEEKS - 1) * 7);

// --- Draw month labels (top) only if the 1st of the month is visible in this column ---
ctx.setFont(Font.mediumSystemFont(16));
ctx.setTextColor(new Color("#888"));
let lastLabeledMonth = -1;
for (let w = 0; w < WEEKS; w++) {
  let labelDrawn = false;
  for (let d = 0; d < DAYS; d++) {
    let cellDate = new Date(firstCellDate);
    cellDate.setDate(firstCellDate.getDate() + w * 7 + d);
    if (cellDate.getDate() === 1) {
      let month = cellDate.getMonth();
      if (month !== lastLabeledMonth) {
        let label = MONTH_LABELS[month];
        ctx.drawText(
          label,
          new Point(w * (CELL_SIZE + CELL_GAP) + CELL_GAP + LEFT_MARGIN, MONTH_LABEL_HEIGHT / 4)
        );
        lastLabeledMonth = month;
      }
      labelDrawn = true;
      break; // Only draw once per column
    }
  }
}

// Draw day labels (left)
ctx.setFont(Font.mediumSystemFont(16));
ctx.setTextColor(new Color("#888"));
for (let d = 0; d < DAYS; d++) {
  ctx.drawText(
    DAY_LABELS[d],
    new Point(DAY_LABEL_LEFT, d * (CELL_SIZE + CELL_GAP) + MONTH_LABEL_HEIGHT + 2)
  );
}

// Draw cells (as rounded squares)
for (let w = 0; w < WEEKS; w++) {
  for (let d = 0; d < DAYS; d++) {
    let x = w * (CELL_SIZE + CELL_GAP) + LEFT_MARGIN;
    let y = d * (CELL_SIZE + CELL_GAP) + MONTH_LABEL_HEIGHT;

    // Calculate the date for this cell
    let cellDate = new Date(firstCellDate);
    cellDate.setDate(firstCellDate.getDate() + w * 7 + d);
    let cellKey = formatDate(cellDate);

    // Debugging: Log the date for each cell
    console.log(`Cell [${w}, ${d}] Date: ${cellDate.toDateString()} Key: ${cellKey}`);

    // Highlight if in contributions
    let color = contributions[cellKey] ? HIGHLIGHT_COLOR : COLORS[0];

    ctx.setFillColor(new Color(color));
    fillRoundedRect(
      ctx,
      { x: x, y: y, width: CELL_SIZE, height: CELL_SIZE },
      CELL_SIZE / 4 // Adjust for more/less roundness
    );
  }
}

// Add image to widget
let img = ctx.getImage();
widget.addImage(img);

// Show widget
if (config.runsInWidget) {
  Script.setWidget(widget);
  Script.complete();
} else {
  widget.presentMedium();
}
Script.complete();
