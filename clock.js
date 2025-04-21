// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: magic;
// Medium Widget, refreshes every minute

const W = 364;      // widget width
const H = 169;      // widget height
const CLOCK = H;    // square clock size = widget height

// Colors
const BG_COL   = new Color('#000000'); // background color
const BORDER   = new Color('#FFFFFF'); // border color
const TICK_COL = new Color('#FFFFFF'); // ticks color
const HOUR_COL = new Color('#FFFFFF'); // hour hand color 
const MIN_COL  = new Color('#FFFFFF'); // minute hand color

if (config.runsInWidget) {
  let widget = await makeClock();
  widget.refreshAfterDate = new Date(Date.now() + 60_000);
  Script.setWidget(widget);
  Script.complete();
} else {
  let preview = await makeClock();
  await preview.presentMedium();
}

async function makeClock() {
  let w = new ListWidget();
  w.backgroundColor = BG_COL;

  let ctx = new DrawContext();
  ctx.size = new Size(W, H);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  // Fill background
  ctx.setFillColor(BG_COL);
  ctx.fillRect(new Rect(0, 0, W, H));

  // Draw square border
  const ox = (W - CLOCK) / 2;
  const oy = (H - CLOCK) / 2;
  ctx.setStrokeColor(BORDER);
  ctx.setLineWidth(4);
  ctx.strokeRect(new Rect(ox, oy, CLOCK, CLOCK));

  // Draw 12 tick marks
  const cx = W / 2;
  const cy = H / 2;
  const r  = CLOCK / 2;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
    const major = i % 3 === 0;
    const len   = major ? 12 : 6;
    const lw    = major ? 3 : 1.5;
    const x0    = cx + (r - len) * Math.cos(angle);
    const y0    = cy + (r - len) * Math.sin(angle);
    const x1    = cx + r * Math.cos(angle);
    const y1    = cy + r * Math.sin(angle);

    drawLine(ctx, new Point(x0, y0), new Point(x1, y1), lw, TICK_COL);
  }

  // Get current time
  const now = new Date();
  const h   = now.getHours() % 12;
  const m   = now.getMinutes();

  // Draw hour hand
  drawLine(
    ctx,
    new Point(cx, cy),
    new Point(
      cx + (r * 0.5) * Math.cos((h + m / 60) / 12 * 2 * Math.PI - Math.PI/2),
      cy + (r * 0.5) * Math.sin((h + m / 60) / 12 * 2 * Math.PI - Math.PI/2)
    ),
    6,
    HOUR_COL
  );

  // Draw minute hand
  drawLine(
    ctx,
    new Point(cx, cy),
    new Point(
      cx + (r * 0.75) * Math.cos(m / 60 * 2 * Math.PI - Math.PI/2),
      cy + (r * 0.75) * Math.sin(m / 60 * 2 * Math.PI - Math.PI/2)
    ),
    4,
    MIN_COL
  );

  // Center pivot dot (white)
  ctx.setFillColor(BORDER);
  ctx.fillEllipse(new Rect(cx - 4, cy - 4, 8, 8));

  w.backgroundImage = ctx.getImage();
  return w;
}

// Helper: draw a line via explicit Path
function drawLine(ctx, from, to, width, color) {
  ctx.setStrokeColor(color);
  ctx.setLineWidth(width);
  let p = new Path();
  p.move(from);
  p.addLine(to);
  ctx.addPath(p);
  ctx.strokePath();
}
