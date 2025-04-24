// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: clock;
// Medium Clock Widget

const W = 364;            // widget width
const H = 169;            // widget height
const R = H / 2;          // clock radius
const CX = W / 2;         // center x
const CY = H / 2;         // center y

// Colors
const BG1    = new Color('#000000'); // outer background
const BG2    = new Color('#000000'); // inner tint
const BEZEL  = new Color('#444446'); // fine inner ring
const TICK_M = new Color('#FFFFFF'); // major tick
const TICK_m = new Color('#6e6e70'); // minor tick
const HOUR_C = new Color('#FFFFFF'); // hour hand color
const MIN_C  = new Color('#0a84ff'); // minute hand color
const PIVOT  = new Color('#0a84ff'); // pivot highlight

if (config.runsInWidget) {
  let widget = await createClock();
  Script.setWidget(widget);
  Script.complete();
} else {
  let preview = await createClock();
  await preview.presentMedium();
}

async function createClock() {
  let w = new ListWidget();
  w.backgroundColor = BG1;

  let ctx = new DrawContext();
  ctx.size = new Size(W, H);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  // Outer fill
  ctx.setFillColor(BG1);
  ctx.fillRect(new Rect(0, 0, W, H));

  // Inner tint circle
  ctx.setFillColor(BG2);
  ctx.fillEllipse(
    new Rect(CX - R * 0.9, CY - R * 0.9, 2 * R * 0.9, 2 * R * 0.9)
  );

  // Fine bezel ring
  ctx.setStrokeColor(BEZEL);
  ctx.setLineWidth(2);
  ctx.strokeEllipse(
    new Rect(CX - R + 2, CY - R + 2, 2 * (R - 2), 2 * (R - 2))
  );

  // 12 ticks
  for (let i = 0; i < 12; i++) {
    let a = (i / 12) * 2 * Math.PI - Math.PI / 2;
    let major = i % 3 === 0;
    let len = major ? 14 : 8;
    let col = major ? TICK_M : TICK_m;
    let wth = major ? 2 : 1;

    let x0 = CX + (R - 10 - len) * Math.cos(a);
    let y0 = CY + (R - 10 - len) * Math.sin(a);
    let x1 = CX + (R - 10) * Math.cos(a);
    let y1 = CY + (R - 10) * Math.sin(a);

    drawLine(ctx, new Point(x0, y0), new Point(x1, y1), wth, col);
  }

  // Compute current time
  let now = new Date();
  let h = now.getHours() % 12;
  let m = now.getMinutes();

  // Draw hour hand
  let hourAngle = (h + m / 60) / 12 * 2 * Math.PI - Math.PI / 2;
  let hx = CX + (R * 0.5) * Math.cos(hourAngle);
  let hy = CY + (R * 0.5) * Math.sin(hourAngle);
  drawLine(ctx, new Point(CX, CY), new Point(hx, hy), 6, HOUR_C);
  roundCap(ctx, new Point(hx, hy), 6, HOUR_C);

  // Draw minute hand
  let minAngle = m / 60 * 2 * Math.PI - Math.PI / 2;
  let mx = CX + (R * 0.8) * Math.cos(minAngle);
  let my = CY + (R * 0.8) * Math.sin(minAngle);
  drawLine(ctx, new Point(CX, CY), new Point(mx, my), 4, MIN_C);
  roundCap(ctx, new Point(mx, my), 4, MIN_C);

  // Pivot dot
  ctx.setFillColor(PIVOT);
  ctx.fillEllipse(new Rect(CX - 5, CY - 5, 10, 10));

  w.backgroundImage = ctx.getImage();
  return w;
}

// Helper: draw a straight line via Path
function drawLine(ctx, from, to, width, color) {
  ctx.setStrokeColor(color);
  ctx.setLineWidth(width);
  let p = new Path();
  p.move(from);
  p.addLine(to);
  ctx.addPath(p);
  ctx.strokePath();
}

// Helper: draw a filled circle at end of line for a rounded cap
function roundCap(ctx, pt, diameter, color) {
  ctx.setFillColor(color);
  ctx.fillEllipse(new Rect(pt.x - diameter / 2, pt.y - diameter / 2, diameter, diameter));
}

// Helper: draw a straight rectangular hand with rounded ends
function drawRectHand(ctx, angle, length, width, color) {
  let cos = Math.cos(angle);
  let sin = Math.sin(angle);
  let half = width / 2;

  // Back‑offset point for round cap
  let bx = CX - cos * half;
  let by = CY - sin * half;

  // Tip point
  let tx = CX + cos * length;
  let ty = CY + sin * length;

  // Perpendicular vector
  let ux = sin * half;
  let uy = -cos * half;

  // Rectangle corners
  let p1 = new Point(bx + ux, by + uy);
  let p2 = new Point(tx + ux, ty + uy);
  let p3 = new Point(tx - ux, ty - uy);
  let p4 = new Point(bx - ux, by - uy);

  // Draw filled polygon
  let path = new Path();
  path.move(p1);
  path.addLine(p2);
  path.addLine(p3);
  path.addLine(p4);
  path.closeSubpath();

  ctx.setFillColor(color);
  ctx.addPath(path);
  ctx.fillPath();

  // Draw round caps at ends
  ctx.fillEllipse(new Rect(tx - half, ty - half, width, width));
  ctx.fillEllipse(new Rect(bx - half, by - half, width, width));
}
