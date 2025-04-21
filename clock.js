// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: magic;
// Medium Widget, auto‑refresh every minute

const W = 364;
const H = 169;
const CLOCK = H;
const BACK = new Color('#000000');
const MAJOR_TICK = new Color('#FFFFFF');
const MINOR_TICK = new Color('#6E6E70');
const HOUR_COL   = new Color('#FFFFFF');
const MIN_COL    = new Color('#0A84FF');
const PIVOT_COL  = new Color('#0A84FF');

if (config.runsInWidget) {
  let w = await createWidget();
  // refresh next minute
  w.refreshAfterDate = new Date(Date.now() + 60_000);
  Script.setWidget(w);
  Script.complete();
} else {
  let preview = await createWidget();
  await preview.presentMedium();
}

async function createWidget() {
  let widget = new ListWidget();
  widget.backgroundColor = BACK;

  // set up drawing context
  let ctx = new DrawContext();
  ctx.size = new Size(W, H);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  // fill background
  ctx.setFillColor(BACK);
  ctx.fillRect(new Rect(0, 0, W, H));

  // draw 12 ticks (no square border)
  const cx = W / 2;
  const cy = H / 2;
  const r  = CLOCK / 2;
  for (let i = 0; i < 12; i++) {
    let angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
    let isMajor = i % 3 === 0;
    let len     = isMajor ? 14 : 8;
    let col     = isMajor ? MAJOR_TICK : MINOR_TICK;
    let wth     = isMajor ? 2.5 : 1;

    let x0 = cx + (r - len) * Math.cos(angle);
    let y0 = cy + (r - len) * Math.sin(angle);
    let x1 = cx + r * Math.cos(angle);
    let y1 = cy + r * Math.sin(angle);

    drawLine(ctx, new Point(x0, y0), new Point(x1, y1), wth, col);
  }

  // compute current time
  let now = new Date();
  let h = now.getHours() % 12;
  let m = now.getMinutes();

  // draw hour hand (short, thick, white)
  let hourAngle = (h + m / 60) / 12 * 2 * Math.PI - Math.PI / 2;
  let hx = cx + (r * 0.5) * Math.cos(hourAngle);
  let hy = cy + (r * 0.5) * Math.sin(hourAngle);
  drawLine(ctx, new Point(cx, cy), new Point(hx, hy), 6, HOUR_COL);
  roundCap(ctx, new Point(hx, hy), 6, HOUR_COL);

  // draw minute hand (longer, thinner, accent blue)
  let minAngle = m / 60 * 2 * Math.PI - Math.PI / 2;
  let mx = cx + (r * 0.8) * Math.cos(minAngle);
  let my = cy + (r * 0.8) * Math.sin(minAngle);
  drawLine(ctx, new Point(cx, cy), new Point(mx, my), 4, MIN_COL);
  roundCap(ctx, new Point(mx, my), 4, MIN_COL);

  // pivot dot
  ctx.setFillColor(PIVOT_COL);
  ctx.fillEllipse(new Rect(cx - 5, cy - 5, 10, 10));

  widget.backgroundImage = ctx.getImage();
  return widget;
}

// draw a straight line via Path
function drawLine(ctx, from, to, width, color) {
  ctx.setStrokeColor(color);
  ctx.setLineWidth(width);
  let p = new Path();
  p.move(from);
  p.addLine(to);
  ctx.addPath(p);
  ctx.strokePath();
}

// draw a filled circle at end of line for a rounded cap
function roundCap(ctx, pt, diameter, color) {
  ctx.setFillColor(color);
  ctx.fillEllipse(new Rect(pt.x - diameter/2, pt.y - diameter/2,
                           diameter, diameter));
}
