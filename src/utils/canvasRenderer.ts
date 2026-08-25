import { BsiItem, BsiReportMetadata } from '../types/bsi';
import { BUZZ_COLORS, CATEGORY_CONFIG } from '../constants/branding';
import { cleanTextSpaces } from './excelParser';

interface RenderOptions {
  canvas: HTMLCanvasElement;
  items: BsiItem[];
  metadata: BsiReportMetadata;
  loadedImages?: Record<number, HTMLImageElement>;
  templateAssets?: Record<string, HTMLImageElement>;
  scale?: number; // e.g., 1 for preview, 2 for high-DPI export
}

let globalTemplateAssetsCache: Record<string, HTMLImageElement> | null = null;

/**
 * Preload official Buzzmetrics element PNGs (H1, H2, H3, logo) with memory cache
 */
export const preloadTemplateAssets = async (forceReload = false): Promise<Record<string, HTMLImageElement>> => {
  if (globalTemplateAssetsCache && !forceReload) {
    return globalTemplateAssetsCache;
  }
  const assets: Record<string, HTMLImageElement> = {};
  const cacheBuster = forceReload ? `?t=${Date.now()}` : '';
  const rawBase = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.BASE_URL) || './';
  const baseUrl = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

  const assetMap: Record<string, string> = {
    H1: `${baseUrl}assets/H1.png${cacheBuster}`,
    H2: `${baseUrl}assets/H2.png${cacheBuster}`,
    H3: `${baseUrl}assets/H3.png${cacheBuster}`,
    logo: `${baseUrl}assets/logo.png${cacheBuster}`,
    TABLE_CAMPAIGNS: `${baseUrl}assets/TABLE TEMPLATE/BSITOP10_Ver2025_TABLE-CAMP-TEMPLATE.png${cacheBuster}`,
    TABLE_EVENTS: `${baseUrl}assets/TABLE TEMPLATE/BSITOP10_Ver2025_TABLE-EVENT-TEMPLATE.png${cacheBuster}`,
    TABLE_INFLUENCERS: `${baseUrl}assets/TABLE TEMPLATE/BSITOP10_Ver2025_TABLE-INFLUENCERS-TEMPLATE.png${cacheBuster}`,
    TABLE_CELEBS: `${baseUrl}assets/TABLE TEMPLATE/BSITOP10_Ver2025_TABLE-INFLUENCERS-TEMPLATE.png${cacheBuster}`,
    TABLE_SHOWS: `${baseUrl}assets/TABLE TEMPLATE/BSITOP10_Ver2025_TABLE-SHOWS-TEMPLATE.png${cacheBuster}`,
    COMBO_CAMPAIGNS: `${baseUrl}assets/TABLE TEMPLATE/ChartCombo/CAMP.png${cacheBuster}`,
    COMBO_EVENTS: `${baseUrl}assets/TABLE TEMPLATE/ChartCombo/EVENT.png${cacheBuster}`,
    COMBO_INFLUENCERS: `${baseUrl}assets/TABLE TEMPLATE/ChartCombo/CELEB.png${cacheBuster}`,
    COMBO_CELEBS: `${baseUrl}assets/TABLE TEMPLATE/ChartCombo/CELEB.png${cacheBuster}`,
    COMBO_SHOWS: `${baseUrl}assets/TABLE TEMPLATE/ChartCombo/SHOW.png${cacheBuster}`,
    COMBO_TEMPLATE: `${baseUrl}assets/TABLE TEMPLATE/ChartCombo/CAMP.png${cacheBuster}`,
  };

  const promises = Object.entries(assetMap).map(([name, url]) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        assets[name] = img;
        resolve();
      };
      img.onerror = () => {
        const altUrl = url.includes('%20') ? url.replace(/%20/g, ' ') : url.replace(/ /g, '%20');
        const img2 = new Image();
        img2.crossOrigin = 'anonymous';
        img2.onload = () => {
          assets[name] = img2;
          resolve();
        };
        img2.onerror = () => {
          console.error(`Failed to load template asset: ${name} from both ${url} and ${altUrl}`);
          resolve();
        };
        img2.src = altUrl;
      };
      img.src = url;
    });
  });
  await Promise.all(promises);
  globalTemplateAssetsCache = assets;
  return assets;
};

/**
 * Ensure Inter & SVN fonts are loaded before Canvas rendering
 */
export const ensureFontsLoaded = async () => {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await Promise.all([
        document.fonts.load('bold 92px "Inter"'),
        document.fonts.load('bold 84px "Inter"'),
        document.fonts.load('bold 72px "Inter"'),
        document.fonts.load('bold 70px "Inter"'),
        document.fonts.load('bold 68px "Inter"'),
        document.fonts.load('bold 58px "Inter"'),
        document.fonts.load('bold 55px "Inter"'),
        document.fonts.load('bold 54px "Inter"'),
        document.fonts.load('bold 52px "Inter"'),
        document.fonts.load('bold 50px "Inter"'),
        document.fonts.load('bold 48px "Inter"'),
        document.fonts.load('bold 46px "Inter"'),
        document.fonts.load('bold 42px "Inter"'),
        document.fonts.load('bold 40px "Inter"'),
        document.fonts.load('bold 39px "Inter"'),
        document.fonts.load('bold 38px "Inter"'),
        document.fonts.load('bold 37px "Inter"'),
        document.fonts.load('bold 36px "Inter"'),
        document.fonts.load('bold 35px "Inter"'),
        document.fonts.load('bold 32px "Inter"'),
        document.fonts.load('bold 30px "Inter"'),
        document.fonts.load('bold 28px "Inter"'),
        document.fonts.load('bold 27px "Inter"'),
        document.fonts.load('900 32px "Inter"'),
        document.fonts.load('800 40px "Inter"'),
        document.fonts.load('800 37px "Inter"'),
        document.fonts.load('800 32px "Inter"'),
        document.fonts.load('600 58px "Inter"'),
        document.fonts.load('600 55px "Inter"'),
        document.fonts.load('600 46px "Inter"'),
        document.fonts.load('600 37px "Inter"'),
        document.fonts.load('600 24px "Inter"'),
      ]);
    } catch (e) {
      console.warn('Font load check:', e);
    }
  }
};

/**
 * Format helper for integers / counts with thousands comma ',' (e.g. 142,580 or 16,415)
 */
function formatThousands(val: number): string {
  if (isNaN(val)) return '0';
  return Math.round(val).toLocaleString('en-US');
}

/**
 * Format BSI score with thousands comma ',' and max 1 decimal place if float
 */
function formatBsiScore(val: number): string {
  if (isNaN(val)) return '0';
  if (Number.isInteger(val)) {
    return val.toLocaleString('en-US');
  }
  return val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/**
 * Format Index Score (Sentiment Index & Relevancy Score) with 2 decimal places after '.' (e.g. 1.00, 0.99, 0.56)
 */
function formatIndexScore(val: number): string {
  if (isNaN(val)) return '0.00';
  let num = val;
  if (num > 1 && num <= 100) num /= 100;
  return num.toFixed(2);
}

/**
 * Format Earned Media percentage with 1 decimal place after '.' (e.g., 60.7%, 93.2%, 60.0%)
 */
function formatEarnedPercent(val: number): string {
  if (isNaN(val)) return '0.0%';
  let pct = val;
  if (pct <= 1) pct *= 100;
  return `${pct.toFixed(1)}%`;
}

/**
 * Preload circular images for ranks 1..10
 */
export const preloadItemImages = async (items: BsiItem[]): Promise<Record<number, HTMLImageElement>> => {
  const images: Record<number, HTMLImageElement> = {};
  const promises = items.map((item) => {
    return new Promise<void>((resolve) => {
      const src = item.croppedImageData || item.imageUrl;
      if (!src) {
        resolve();
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        images[item.rank] = img;
        resolve();
      };
      img.onerror = () => {
        resolve();
      };
      img.src = src;
    });
  });
  await Promise.all(promises);
  return images;
};

/**
 * Helper to draw rounded rectangle
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | { tl: number; tr: number; br: number; bl: number }
) {
  let r = typeof radius === 'number' ? { tl: radius, tr: radius, br: radius, bl: radius } : radius;
  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + width - r.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r.tr);
  ctx.lineTo(x + width, y + height - r.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r.br, y + height);
  ctx.lineTo(x + r.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(x, y, x + r.tl, y);
  ctx.closePath();
}

/**
 * Helper to wrap text into multiple lines with manual break (| or \n) support and smart phrase wrapping
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = 5
): string[] {
  if (!text) return [];

  const cleaned = cleanTextSpaces(text);

  // If text contains explicit newlines '\n' (from Excel Alt+Enter), handle line breaks
  if (cleaned.includes('\n')) {
    const manualLines = cleaned
      .split('\n')
      .map((l) => l.replace(/[ \t]+/g, ' ').trim())
      .filter(Boolean);
    return manualLines.slice(0, maxLines);
  }

  const words = cleaned.split(/\s+/);
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = `${currentLine} ${word}`;
    const width = ctx.measureText(testLine).width;
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length > maxLines) {
    return lines.slice(0, maxLines);
  }
  return lines;
}

/**
 * Helper to safely draw a line of text bounded within maxWidth to prevent horizontal overlap onto adjacent columns
 */
function drawTextLineBounded(
  ctx: CanvasRenderingContext2D,
  line: string,
  x: number,
  y: number,
  maxWidth: number,
  baseFontSize: number = 32
) {
  if (!line) return;
  const metrics = ctx.measureText(line);
  if (metrics.width > maxWidth) {
    ctx.save();
    const scaledSize = Math.max(Math.floor(baseFontSize * (maxWidth / metrics.width)), 16);
    ctx.font = `bold ${scaledSize}px "Inter", "Inter", "SVN-Mont", sans-serif`;
    ctx.fillText(line, x, y);
    ctx.restore();
  } else {
    ctx.fillText(line, x, y);
  }
}

/**
 * Convert numeric month to English Month name for BSI logo
 */
function getEnglishMonth(monthStr: string): string {
  const m = parseInt(monthStr, 10);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[m - 1] || 'June';
}

/**
 * Draw Circular Avatar Image with Double Ring Border (3000x2000 / 3000x2500 scale)
 */
function drawAvatar(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  x: number,
  y: number,
  radius: number,
  rank: number,
  name: string
) {
  ctx.save();

  // 1. White circular background base
  ctx.beginPath();
  ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
  ctx.fillStyle = BUZZ_COLORS.white;
  ctx.fill();

  // 2. Outer thin orange concentric circle
  ctx.beginPath();
  ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
  ctx.strokeStyle = '#E68228';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 3. Inner thin orange concentric circle
  ctx.beginPath();
  ctx.arc(x, y, radius + 1.5, 0, Math.PI * 2);
  ctx.strokeStyle = '#E68228';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();

  if (img) {
    ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);

    ctx.fillStyle = '#E68228';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 36px "Inter", "SVN-Jeko", sans-serif';
    const initial = name.trim().charAt(0).toUpperCase() || `${rank}`;
    ctx.fillText(initial, x, y);
  }

  ctx.restore();
}

/**
 * Vector Drawer for Table Header Icons
 */
function drawTableHeaderIcon(ctx: CanvasRenderingContext2D, type: string, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = BUZZ_COLORS.white;
  ctx.strokeStyle = BUZZ_COLORS.white;
  ctx.lineWidth = 3;

  if (type === 'bsiLogo') {
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fillStyle = BUZZ_COLORS.white;
    ctx.fill();

    ctx.fillStyle = '#E96825';
    ctx.font = '900 13px "Inter", "SVN-Jeko", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BSI', x, y - 5);
    ctx.font = 'bold 8px "Inter", "SVN-Jeko", sans-serif';
    ctx.fillText('TOP 10', x, y + 6);
  } else if (type === 'buzzVolume') {
    ctx.beginPath();
    ctx.arc(x, y - 3, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - 5, y - 3, 2, 0, Math.PI * 2);
    ctx.arc(x, y - 3, 2, 0, Math.PI * 2);
    ctx.arc(x + 5, y - 3, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'qualifiedUser') {
    ctx.beginPath();
    ctx.arc(x, y - 3, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 3); ctx.lineTo(x - 6, y - 2);
    ctx.moveTo(x, y + 3); ctx.lineTo(x, y - 6);
    ctx.moveTo(x + 6, y + 3); ctx.lineTo(x + 6, y - 3);
    ctx.stroke();
  } else if (type === 'contentFromQu') {
    ctx.beginPath();
    ctx.arc(x - 3, y - 4, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 3); ctx.lineTo(x + 11, y + 10);
    ctx.stroke();
  } else if (type === 'sentimentScore') {
    ctx.beginPath();
    ctx.arc(x - 5, y - 4, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 5, y + 3, 8, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === 'relevanceScore') {
    ctx.beginPath();
    ctx.arc(x, y - 3, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - 3, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'earnedMedia') {
    ctx.beginPath();
    ctx.arc(x - 6, y, 4, 0, Math.PI * 2);
    ctx.arc(x + 5, y - 6, 4, 0, Math.PI * 2);
    ctx.arc(x + 5, y + 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 6, y); ctx.lineTo(x + 5, y - 6);
    ctx.moveTo(x - 6, y); ctx.lineTo(x + 5, y + 6);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Top Right BSI Logo Badge Drawer
 */
function drawTopRightLogo(
  ctx: CanvasRenderingContext2D,
  width: number,
  metadata: BsiReportMetadata,
  templateAssets?: Record<string, HTMLImageElement>,
  overrideSpecs?: { diameter: number; top?: number; right?: number; centerX?: number; centerY?: number }
) {
  const monthStr = metadata.month.padStart(2, '0');
  const engMonth = getEnglishMonth(monthStr);

  const logoD = overrideSpecs ? overrideSpecs.diameter : 410;
  let centerX = 2758;
  let centerY = 350;

  if (overrideSpecs) {
    if (overrideSpecs.centerX !== undefined && overrideSpecs.centerY !== undefined) {
      centerX = overrideSpecs.centerX;
      centerY = overrideSpecs.centerY;
    } else if (overrideSpecs.top !== undefined && overrideSpecs.right !== undefined) {
      centerX = width - overrideSpecs.right - logoD / 2;
      centerY = overrideSpecs.top + logoD / 2;
    }
  }

  const logoX = centerX - logoD / 2;
  const logoY = centerY - logoD / 2;

  const logoImg = templateAssets ? templateAssets['logo'] : undefined;

  if (logoImg) {
    ctx.drawImage(logoImg, 638, 83, 2628, 2628, logoX, logoY, logoD, logoD);

    ctx.save();
    ctx.fillStyle = '#E96825';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    // Font size 32px/36px, moved +23px right and +4px down for Chart format
    const pillFontSize = engMonth.length > 6 ? 32 : 36;
    ctx.font = `bold ${pillFontSize}px "Inter", "SVN-Mont", sans-serif`;
    ctx.fillText(`${engMonth} ${metadata.year}`, logoX + logoD * 0.72 + 23, centerY + logoD * 0.235 + 4);
    ctx.restore();
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, logoD / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#E96825';
    ctx.shadowColor = 'rgba(233, 104, 37, 0.3)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    ctx.fill();

    ctx.fillStyle = BUZZ_COLORS.white;
    ctx.font = `bold ${Math.round(logoD * 0.054)}px "Inter", "SVN-Mont", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BUZZMETRICS', centerX, centerY - logoD * 0.22);

    ctx.font = `900 ${Math.round(logoD * 0.20)}px "Inter", "Inter", "SVN-Mont", sans-serif`;
    ctx.fillText('BSI', centerX, centerY - logoD * 0.07);

    ctx.font = `bold ${Math.round(logoD * 0.088)}px "Inter", "Inter", "SVN-Mont", sans-serif`;
    ctx.fillText('TOP 10', centerX, centerY + logoD * 0.07);

    const pillW = logoD * 0.58;
    const pillH = logoD * 0.12;
    const pillX = centerX - pillW / 2;
    const pillY = centerY + logoD * 0.17;

    ctx.fillStyle = BUZZ_COLORS.white;
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fill();

    ctx.fillStyle = '#E96825';
    ctx.font = `bold ${Math.round(logoD * 0.063)}px "Inter", "Inter", "SVN-Mont", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${engMonth} ${metadata.year}`, centerX, pillY + pillH / 2);
    ctx.restore();
  }
}

/**
 * Render canvas to PNG Blob for export & ZIP bundling
 */
export const renderCanvasToBlob = async (
  canvas: HTMLCanvasElement,
  items: BsiItem[],
  metadata: BsiReportMetadata,
  templateAssets?: Record<string, HTMLImageElement>
): Promise<Blob> => {
  const assets = templateAssets && Object.keys(templateAssets).length > 0 ? templateAssets : (await preloadTemplateAssets());
  const loadedImages = await preloadItemImages(items);
  await renderCanvas({ canvas, items, metadata, loadedImages, templateAssets: assets, scale: 1 });

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
    }, 'image/png');
  });
};

/**
 * Trigger download of canvas as PNG file
 */
export const downloadCanvasImage = (canvas: HTMLCanvasElement, filename: string) => {
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
};

export const renderCanvasReport = async (options: RenderOptions): Promise<void> => renderCanvas(options);

/**
 * Core Canvas Renderer supporting Chart, Table & Combination formats with high-DPI scaling
 */
export const renderCanvas = async (options: RenderOptions): Promise<void> => {
  const { canvas, items, metadata, loadedImages = {}, templateAssets = {}, scale = 1 } = options;

  let baseWidth = 3000;
  let baseHeight = 2000;

  if (metadata.format === 'TABLE') {
    baseWidth = 4000;
    baseHeight = 2099;
  } else if (metadata.format === 'COMBINATION') {
    baseWidth = 3000;
    baseHeight = 2400;
  }

  const renderWidth = baseWidth * scale;
  const renderHeight = baseHeight * scale;

  canvas.width = renderWidth;
  canvas.height = renderHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.scale(scale, scale);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, baseWidth, baseHeight);

  if (metadata.format === 'CHART') {
    renderChartFormat(ctx, items, baseWidth, baseHeight, metadata, loadedImages, templateAssets);
  } else if (metadata.format === 'TABLE') {
    renderTableFormat(ctx, items, baseWidth, baseHeight, metadata, templateAssets);
  } else if (metadata.format === 'COMBINATION') {
    renderCombinationFormat(ctx, items, baseWidth, baseHeight, metadata, loadedImages, templateAssets);
  }

  ctx.restore();
};

/**
 * Render DẠNG 1: BSI TOP10 CHART (3000x2000)
 */
function renderChartFormat(
  ctx: CanvasRenderingContext2D,
  items: BsiItem[],
  width: number,
  height: number,
  metadata: BsiReportMetadata,
  loadedImages: Record<number, HTMLImageElement>,
  templateAssets: Record<string, HTMLImageElement>
) {
  const catConfig = CATEGORY_CONFIG[metadata.category];
  const titleText = catConfig.titleBadge;
  const monthStr = metadata.month.padStart(2, '0');

  const frameX = 100;
  const frameY = 278;
  const frameW = 2765;
  const frameH = 1542;
  const frameRadius = 60;
  const strokeWidth = 5;

  ctx.save();
  ctx.strokeStyle = '#E68228';
  ctx.lineWidth = strokeWidth;
  drawRoundedRect(ctx, frameX, frameY, frameW, frameH, frameRadius);
  ctx.stroke();
  ctx.restore();

  // 1. TÊN BSI - BUZZMETRICS SOCIAL INDEX (Font: SVN-Mont Weight 700 / Bold, Size 46px - Tăng 15%, giảm weight 1 bậc)
  const textCenterY = 1050;
  const gapHeight = 920;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(frameX - strokeWidth - 2, textCenterY - gapHeight / 2, strokeWidth * 2 + 4, gapHeight);

  ctx.save();
  ctx.translate(frameX, textCenterY);
  ctx.rotate(-Math.PI / 2);
  ctx.font = 'bold 46px "Inter", "SVN-Mont", sans-serif';
  ctx.fillStyle = '#E68228';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '3px';
  ctx.fillText('BSI - BUZZMETRICS SOCIAL INDEX', 0, 0);
  ctx.restore();

  // 2. TITLE CHÍNH (Badge tiêu đề cam ở giữa: Size 92px, Khung thu ngắn 5% mỗi bên -> 1420px)
  const badgeW = 1420;
  const badgeH = 170;
  const badgeX = 1480 - badgeW / 2;
  const badgeY = 190;
  const badgeRadius = 24;

  ctx.save();
  const grad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY);
  grad.addColorStop(0, '#F16522');
  grad.addColorStop(1, '#FF7E36');

  ctx.fillStyle = grad;
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeRadius);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = BUZZ_COLORS.white;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 92px "Inter", "SVN-Mont", sans-serif';
  ctx.fillText(titleText, 1480, badgeY + badgeH / 2);

  // 3. TITLE PHỤ (Dòng 1 Size 55px, Dòng 2 Size 46px - Giảm weight 1 mức ngoại trừ Tên Hạng Mục)
  const subX = 1480;
  const subY = 395;

  const part1 = '10 ';
  const part2 = catConfig.objectName;
  const part3 = ' NỔI BẬT TRÊN SOCIAL MEDIA';

  ctx.font = '600 55px "Inter", "SVN-Mont", sans-serif';
  const w1 = ctx.measureText(part1).width;
  const w3 = ctx.measureText(part3).width;

  ctx.font = 'bold 55px "Inter", "SVN-Mont", sans-serif';
  const w2 = ctx.measureText(part2).width;

  const totalW = w1 + w2 + w3;
  let startX = subX - totalW / 2;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#1A1A1A';

  ctx.font = '600 55px "Inter", "SVN-Mont", sans-serif';
  ctx.fillText(part1, startX, subY);
  startX += w1;

  ctx.font = 'bold 55px "Inter", "SVN-Mont", sans-serif';
  ctx.fillText(part2, startX, subY);
  startX += w2;

  ctx.font = '600 55px "Inter", "SVN-Mont", sans-serif';
  ctx.fillText(part3, startX, subY);

  // Subtitle Dòng 2: THÁNG MM/YYYY (Weight 600, Size 46px)
  ctx.textAlign = 'center';
  ctx.font = '600 46px "Inter", "SVN-Mont", sans-serif';
  ctx.fillStyle = '#333333';
  ctx.fillText(`THÁNG ${monthStr}/${metadata.year}`, subX, subY + 68);

  // 4. THỜI GIAN Logo (Font: SVN-Mont Weight 700, Size 38px, moved right 18px)
  drawTopRightLogo(ctx, width, metadata, templateAssets, { diameter: 410, centerX: 2758, centerY: 380 });

  const chartLeft = 240;
  const chartRight = 2720;
  const chartWidth = chartRight - chartLeft;

  const top10 = items.slice(0, 10);
  const maxScore = Math.max(...top10.map((i) => i.bsiScore), 100);
  const colCount = top10.length;

  const colGap = chartWidth / colCount;
  const barWidth = Math.min(colGap * 0.72, 175);
  const avatarRadius = 85; // Set avatar radius to 85px as requested
  const barRadius = 24;
  const wrapWidth = 175; // 175px wrap width for font 32px/30px in 248px column

  // Calculate max lines across 10 items for Chart format
  const maxChartLines = Math.max(
    ...top10.map((item) => {
      ctx.font = 'bold 32px "Inter", "Inter", "SVN-Mont", sans-serif';
      return wrapText(ctx, item.name, wrapWidth, 6).length;
    }),
    1
  );

  let chartTop = 565;
  let chartBottom = 1655;
  let itemNameFontSize = 32;
  let lineStepY = 37;

  if (maxChartLines >= 5) {
    chartTop = 490;
    chartBottom = 1570; // Co ngắn chiều cao cột & đẩy toàn bộ chart lên trên để nhường không gian cho 5-6 dòng
    itemNameFontSize = 30; // Giảm xuống 30px (không nhỏ hơn 30px)
    lineStepY = 34;
  } else if (maxChartLines === 4) {
    chartBottom = 1618;
    itemNameFontSize = 32;
    lineStepY = 37;
  }

  const chartHeight = chartBottom - chartTop;

  top10.forEach((item, idx) => {
    const centerX = chartLeft + idx * colGap + colGap / 2;
    const scoreRatio = maxScore > 0 ? (item.bsiScore / maxScore) : 0;
    const maxBarH = chartHeight - avatarRadius * 2 - 60;
    const rawBarH = scoreRatio * maxBarH;
    const displayBarH = Math.max(rawBarH, 18);

    const barX = centerX - barWidth / 2;
    const barY = chartBottom - displayBarH;

    ctx.fillStyle = '#E68228';
    drawRoundedRect(ctx, barX, barY, barWidth, displayBarH, { tl: Math.min(barRadius, displayBarH / 2), tr: Math.min(barRadius, displayBarH / 2), br: 0, bl: 0 });
    ctx.fill();

    // 5. SỐ ĐIỂM BSI (Font: Inter 36px)
    ctx.save();
    ctx.font = '800 36px "Inter", "SVN-Mont", sans-serif';
    ctx.textAlign = 'center';

    const scoreStr = formatBsiScore(item.bsiScore);
    let avatarY: number;

    if (rawBarH >= 87) {
      ctx.fillStyle = BUZZ_COLORS.white;
      ctx.textBaseline = 'bottom';
      ctx.fillText(scoreStr, centerX, barY + displayBarH - 14);
      avatarY = barY - avatarRadius - 32;
    } else {
      ctx.fillStyle = '#E68228';
      ctx.textBaseline = 'bottom';
      ctx.fillText(scoreStr, centerX, barY - 8);
      avatarY = barY - avatarRadius - 68;
    }
    ctx.restore();

    drawAvatar(ctx, loadedImages[item.rank], centerX, avatarY, avatarRadius, item.rank, item.name);

    // 6. TÊN CAMPAIGNS / EVENTS / SHOWS / CELEBS (Hỗ trợ 5-6 dòng, font 30px khi 5-6 dòng, đẩy chart lên trên)
    ctx.font = `bold ${itemNameFontSize}px "Inter", "Inter", "SVN-Mont", sans-serif`;
    ctx.fillStyle = '#1A1A1A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const lines = wrapText(ctx, item.name, wrapWidth, 6);
    lines.forEach((line, lIdx) => {
      drawTextLineBounded(ctx, line, centerX, chartBottom + 16 + lIdx * lineStepY, colGap - 16, itemNameFontSize);
    });
  });
}

/**
 * Helper to draw multi-line centered text inside table rows with proper line-height spacing
 */
function drawMultiLineTextCentered(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  rowY: number,
  fontSize: number
) {
  if (!lines || lines.length === 0) return;
  const lineStep = Math.round(fontSize * 1.15);

  if (lines.length === 1) {
    ctx.fillText(lines[0], x, rowY);
  } else if (lines.length === 2) {
    ctx.fillText(lines[0], x, rowY - lineStep / 2);
    ctx.fillText(lines[1], x, rowY + lineStep / 2);
  } else if (lines.length === 3) {
    ctx.fillText(lines[0], x, rowY - lineStep);
    ctx.fillText(lines[1], x, rowY);
    ctx.fillText(lines[2], x, rowY + lineStep);
  } else if (lines.length >= 4) {
    const validLines = lines.slice(0, 4);
    ctx.fillText(validLines[0], x, rowY - lineStep * 1.5);
    ctx.fillText(validLines[1], x, rowY - lineStep * 0.5);
    ctx.fillText(validLines[2], x, rowY + lineStep * 0.5);
    ctx.fillText(validLines[3], x, rowY + lineStep * 1.5);
  }
}

/**
 * Render DẠNG 2: BSI TOP10 TABLE (4000x2099 - Standard 4K Ver 2025 Table Template)
 */
function renderTableFormat(
  ctx: CanvasRenderingContext2D,
  items: BsiItem[],
  width: number,
  height: number,
  metadata: BsiReportMetadata,
  templateAssets?: Record<string, HTMLImageElement>
) {
  const catConfig = CATEGORY_CONFIG[metadata.category];
  const monthStr = metadata.month.padStart(2, '0');
  const engMonth = getEnglishMonth(monthStr);

  const templateKey = `TABLE_${metadata.category}`;
  let templateImg = templateAssets ? templateAssets[templateKey] : undefined;
  if (!templateImg && templateAssets) {
    templateImg = templateAssets.TABLE_CAMPAIGNS || templateAssets.TABLE_INFLUENCERS || templateAssets.TABLE_EVENTS || templateAssets.TABLE_SHOWS;
  }

  if (templateImg) {
    ctx.drawImage(templateImg, 0, 0, 4000, 2099);

    // 1. Draw Top-Left Date Badge Text inside the template orange badge slot (SHOWS | JUNE 2026)
    ctx.save();
    ctx.fillStyle = BUZZ_COLORS.white;
    ctx.font = 'bold 70px "Inter", "Inter", "SVN-Mont", sans-serif';
    ctx.textBaseline = 'middle';

    // Left part: Category Name right-aligned to X=625
    ctx.textAlign = 'right';
    ctx.fillText(metadata.category, 625, 172);

    // Right part: Month Year left-aligned to X=720
    ctx.textAlign = 'left';
    ctx.fillText(`${engMonth.toUpperCase()} ${metadata.year}`, 720, 172);

    ctx.restore();

    // 2. Draw Top-Right Logo Badge Month/Year Pill Text
    ctx.save();
    ctx.fillStyle = '#E68228';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const pillFontSize = engMonth.length > 6 ? 24 : 26;
    ctx.font = `bold ${pillFontSize}px "Inter", "Inter", "SVN-Mont", sans-serif`;
    ctx.fillText(`${engMonth} ${metadata.year}`, 3863, 249);
    ctx.restore();
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    drawTopRightLogo(ctx, width, metadata, templateAssets, { diameter: 280, top: 30, right: 80 });

    const badgeX = 0;
    const badgeY = 91;
    const badgeW = 1435;
    const badgeH = 258;

    ctx.save();
    ctx.fillStyle = '#E68228';
    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, { tl: 0, tr: 80, br: 80, bl: 0 });
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = BUZZ_COLORS.white;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 52px "Inter", "Inter", "SVN-Mont", sans-serif';
    ctx.fillText(
      `${metadata.category}    |    ${engMonth.toUpperCase()} ${metadata.year}`,
      badgeX + badgeW / 2,
      badgeY + badgeH / 2
    );
  }

  // Row Y center positions for ranks 1 through 10 in 4000x2099 resolution
  const rowCenterY = [685.5, 832.5, 979.5, 1126.5, 1273.5, 1420.5, 1567.5, 1714.5, 1861.5, 2008.5];
  const top10 = items.slice(0, 10);

  // Check max line count needed across items (including manual line breaks \n or |)
  const maxItemLinesCount = Math.max(
    ...top10.map((i) => {
      ctx.font = 'bold 36px "Inter", "Inter", "SVN-Mont", sans-serif';
      return wrapText(ctx, i.name || '', 690, 4).length;
    }),
    1
  );

  // Single Name column (EVENTS / SHOWS / INFLUENCERS)
  let uniformTableFontSize = 44;
  if (maxItemLinesCount >= 3) {
    uniformTableFontSize = 36;
  } else if (maxItemLinesCount === 2) {
    uniformTableFontSize = 40;
  }

  // CAMPAIGNS column font size
  let uniformCampFontSize = 36;
  if (maxItemLinesCount >= 3) {
    uniformCampFontSize = 32;
  } else if (maxItemLinesCount === 2) {
    uniformCampFontSize = 36;
  }

  top10.forEach((item, rIdx) => {
    const rowY = rowCenterY[rIdx] || (685.5 + rIdx * 147);

    // 1. Rank Number (Draw only if fallback mode without template image, to avoid duplicate numbers)
    if (!templateImg) {
      ctx.save();
      ctx.fillStyle = '#E68228';
      ctx.font = 'bold 42px "Inter", "Inter", "SVN-Mont", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${item.rank}`, 176.5, rowY);
      ctx.restore();
    }

    // 2. Category Item Name & Brand Columns
    if (metadata.category === 'CAMPAIGNS') {
      // BRAND column (X = 227 to 677, width = 450px)
      ctx.save();
      ctx.fillStyle = '#1A1A1A';
      ctx.font = 'bold 36px "Inter", "Inter", "SVN-Mont", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      const brandLines = wrapText(ctx, item.brandName || '', 380, 3);
      drawMultiLineTextCentered(ctx, brandLines, 265, rowY, 36);
      ctx.restore();

      // CAMPAIGNS column (X = 677 to 1437, width = 760px)
      ctx.save();
      ctx.fillStyle = '#1A1A1A';
      ctx.font = `bold ${uniformCampFontSize}px "Inter", "Inter", "SVN-Mont", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      const campLines = wrapText(ctx, item.name, 690, 4);
      drawMultiLineTextCentered(ctx, campLines, 715, rowY, uniformCampFontSize);
      ctx.restore();
    } else {
      // Single Name column (EVENTS / SHOWS / INFLUENCERS)
      ctx.save();
      ctx.fillStyle = '#1A1A1A';
      ctx.font = `bold ${uniformTableFontSize}px "Inter", "Inter", "SVN-Mont", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      const lines = wrapText(ctx, item.name, 1060, 4);
      drawMultiLineTextCentered(ctx, lines, 310, rowY, uniformTableFontSize);
      ctx.restore();
    }

    // 3. Metric Columns (+1pt data text size)
    const metricValues = [
      { x: 1612.5, val: formatBsiScore(item.bsiScore), font: 'bold 39px "Inter", "Inter", "SVN-Mont", sans-serif', color: '#1A1A1A' },
      { x: 1968.0, val: formatThousands(item.buzzVolume), font: '600 37px "Inter", "Inter", "SVN-Mont", sans-serif', color: '#333333' },
      { x: 2328.5, val: formatThousands(item.qualifiedUser), font: '600 37px "Inter", "Inter", "SVN-Mont", sans-serif', color: '#333333' },
      { x: 2689.5, val: formatThousands(item.contentFromQu), font: '600 37px "Inter", "Inter", "SVN-Mont", sans-serif', color: '#333333' },
      { x: 3050.5, val: formatIndexScore(item.sentimentScore), font: '600 37px "Inter", "Inter", "SVN-Mont", sans-serif', color: '#333333' },
      { x: 3412.0, val: formatIndexScore(item.relevanceScore), font: '600 37px "Inter", "Inter", "SVN-Mont", sans-serif', color: '#333333' },
      { x: 3772.5, val: formatEarnedPercent(item.earnedMedia), font: '600 37px "Inter", "Inter", "SVN-Mont", sans-serif', color: '#333333' },
    ];

    metricValues.forEach((col) => {
      ctx.save();
      ctx.fillStyle = col.color;
      ctx.font = col.font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(col.val, col.x, rowY);
      ctx.restore();
    });
  });
}

/**
 * Render DẠNG 3: BSI TOP10 COMBINATION (TRENDLINE DIRECTLY PLOTS contentFromQu)
 */
function renderCombinationFormat(
  ctx: CanvasRenderingContext2D,
  items: BsiItem[],
  width: number,
  height: number,
  metadata: BsiReportMetadata,
  loadedImages: Record<number, HTMLImageElement>,
  templateAssets: Record<string, HTMLImageElement>
) {
  const catConfig = CATEGORY_CONFIG[metadata.category];
  const titleText = catConfig.titleBadge;
  const monthStr = metadata.month.padStart(2, '0');
  const engMonth = getEnglishMonth(monthStr);

  const comboKey = `COMBO_${metadata.category}`;
  const comboImg = templateAssets[comboKey] || templateAssets['COMBO_TEMPLATE'];

  if (comboImg) {
    ctx.drawImage(comboImg, 0, 0, 3000, 2400);

    // Subtitle Section (center X = 1500) - Tăng 3pt size Dòng 1 font 55px, Dòng 2 font 55px (bằng size dòng 1) + tăng khoảng cách Y=435
    ctx.save();
    ctx.textBaseline = 'top';

    const subLine1Part1 = '10 ';
    const subLine1Part2 = `${catConfig.objectName.toUpperCase()}`;
    const subLine1Part3 = ' NỔI BẬT TRÊN SOCIAL MEDIA';

    ctx.font = '600 58px "Inter", "SVN-Mont", sans-serif';
    const w1 = ctx.measureText(subLine1Part1).width;
    ctx.font = 'bold 58px "Inter", "SVN-Mont", sans-serif';
    const w2 = ctx.measureText(subLine1Part2).width;
    ctx.font = '600 58px "Inter", "SVN-Mont", sans-serif';
    const w3 = ctx.measureText(subLine1Part3).width;
    const totalW = w1 + w2 + w3;

    const startX = 1500 - totalW / 2;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1A1A1A';

    ctx.font = '600 58px "Inter", "SVN-Mont", sans-serif';
    ctx.fillText(subLine1Part1, startX, 342);

    ctx.font = 'bold 58px "Inter", "SVN-Mont", sans-serif';
    ctx.fillText(subLine1Part2, startX + w1, 342);

    ctx.font = '600 58px "Inter", "SVN-Mont", sans-serif';
    ctx.fillText(subLine1Part3, startX + w1 + w2, 342);

    // Dòng 2: THÁNG MM/YYYY (Tăng 3pt size tiêu đề phụ thành 58px)
    ctx.textAlign = 'center';
    ctx.font = '600 58px "Inter", "SVN-Mont", sans-serif';
    ctx.fillStyle = '#333333';
    ctx.fillText(`THÁNG ${monthStr}/${metadata.year}`, 1500, 438);

    ctx.restore();

    // Top-Right Logo Badge Month/Year Pill Text (Right-aligned inside white pill at X=2825, Y=392)
    ctx.save();
    ctx.fillStyle = '#E68228';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const pillFontSize = engMonth.length > 6 ? 30 : 32;
    ctx.font = `bold ${pillFontSize}px "Inter", "Inter", "SVN-Mont", sans-serif`;
    ctx.fillText(`${engMonth} ${metadata.year}`, 2825, 392);
    ctx.restore();
  } else {
    // Fallback: draw background vector frames programmatically
    const topFrameX = 100;
    const topFrameY = 250;
    const topFrameW = 2765;
    const topFrameH = 1380;
    const frameRadius = 60;
    const strokeWidth = 5;

    ctx.save();
    ctx.strokeStyle = '#E68228';
    ctx.lineWidth = strokeWidth;
    drawRoundedRect(ctx, topFrameX, topFrameY, topFrameW, topFrameH, frameRadius);
    ctx.stroke();
    ctx.restore();

    // Top Frame Left Edge Vertical Text: "BSI - BUZZMETRICS SOCIAL INDEX"
    const topTextCenterY = 940;
    const topGapHeight = 580;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(topFrameX - strokeWidth - 2, topTextCenterY - topGapHeight / 2, strokeWidth * 2 + 4, topGapHeight);

    ctx.save();
    ctx.translate(topFrameX, topTextCenterY);
    ctx.rotate(-Math.PI / 2);
    ctx.font = 'bold 24px "Inter", "Inter", "SVN-Mont", sans-serif';
    ctx.fillStyle = '#E68228';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '3px';
    ctx.fillText('BSI - BUZZMETRICS SOCIAL INDEX', 0, 0);
    ctx.restore();

    // Bottom Frame Left Edge Vertical Text: "CONTENT FROM QU" & "THẢO LUẬN TỪ NGƯỜI DÙNG CHẤT LƯỢNG"
    const botFrameX = 100;
    const botFrameY = 1700;
    const botFrameW = 2765;
    const botFrameH = 680;

    ctx.save();
    ctx.strokeStyle = '#E68228';
    ctx.lineWidth = strokeWidth;
    drawRoundedRect(ctx, botFrameX, botFrameY, botFrameW, botFrameH, frameRadius);
    ctx.stroke();
    ctx.restore();

    const botTextCenterY = 2040;
    const botGapHeight = 540;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(botFrameX - strokeWidth - 2, botTextCenterY - botGapHeight / 2, strokeWidth * 2 + 4, botGapHeight);

    ctx.save();
    ctx.translate(botFrameX, botTextCenterY);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 24px "Inter", "Inter", "SVN-Mont", sans-serif';
    ctx.fillStyle = '#E68228';
    ctx.fillText('CONTENT FROM QU', 0, -14);

    ctx.font = '500 20px "Inter", "Inter", "SVN-Mont", sans-serif';
    ctx.fillStyle = '#E68228';
    ctx.fillText('THẢO LUẬN TỪ NGƯỜI DÙNG CHẤT LƯỢNG', 0, 16);
    ctx.restore();

    const badgeW = 1400;
    const badgeH = 160;
    const badgeX = 1480 - badgeW / 2;
    const badgeY = 170;
    const badgeRadius = 24;

    ctx.save();
    const grad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY);
    grad.addColorStop(0, '#F16522');
    grad.addColorStop(1, '#FF7E36');

    ctx.fillStyle = grad;
    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeRadius);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = BUZZ_COLORS.white;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 50px "Inter", "Inter", "SVN-Mont", sans-serif';
    ctx.fillText(titleText, 1480, badgeY + badgeH / 2);

    const subX = 1480;
    const subY = 360;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.font = 'bold 39px "Inter", "Inter", "SVN-Mont", sans-serif';
    ctx.fillStyle = '#1A1A1A';
    ctx.fillText(`10 ${catConfig.objectName} NỔI BẬT TRÊN SOCIAL MEDIA`, subX, subY);

    ctx.font = '600 33px "Inter", "Inter", "SVN-Mont", sans-serif';
    ctx.fillStyle = '#333333';
    ctx.fillText(`THÁNG ${monthStr}/${metadata.year}`, subX, subY + 48);

    drawTopRightLogo(ctx, width, metadata, templateAssets, { diameter: 410, centerX: 2758, centerY: 350 });
  }

  // Top Chart Bar Ranking Layout (Dynamic chartBottom shrinking to keep font size FIXED at 32px / 30px)
  const chartLeft = 335;
  const chartRight = 2665;
  const chartW = chartRight - chartLeft;
  const colCount = 10;
  const colGap = chartW / colCount;
  const barWidth = 163; // +5% larger bar width (163px)
  const avatarRadius = 84; // +5% larger avatar radius (84px)

  const top10 = items.slice(0, 10);
  const maxScore = Math.max(...top10.map((i) => i.bsiScore), 100);

  // 1. Calculate max line count across all 10 items using FIXED 32px font size and wrapWidth 165px
  const wrapWidth = 165; // Cố định 165px cho font 32px/30px để tự động ngắt dòng trong cột 233px
  const maxComboLineCount = Math.max(
    ...top10.map((item) => {
      ctx.font = 'bold 32px "Inter", "Inter", "SVN-Mont", sans-serif';
      return wrapText(ctx, item.name, wrapWidth, 6).length;
    }),
    1
  );

  // 2. Adjust chartBottom & font size dynamically:
  // If 5-6 lines: shrink bar chart height by 110px (chartBottom = 1240px) & font size = 30px
  // If 4 lines: shrink bar chart height by 74px (chartBottom = 1276px) & font size = 32px
  // If 3 lines: shrink bar chart height by 37px (chartBottom = 1313px) & font size = 32px
  // If 1-2 lines: standard chartBottom at 1350px & font size = 32px
  let chartTop = 510;
  let chartBottom = 1350;
  let comboNameFontSize = 32;
  let comboLineStepY = 37;

  if (maxComboLineCount >= 5) {
    chartTop = 480;
    chartBottom = 1240; // Co ngắn chiều cao biểu đồ cột và đẩy chart lên trên để chừa space cho 5-6 dòng
    comboNameFontSize = 30; // Giảm xuống 30px theo yêu cầu (không nhỏ hơn 30px)
    comboLineStepY = 34;
  } else if (maxComboLineCount === 4) {
    chartBottom = 1276;
    comboNameFontSize = 32;
    comboLineStepY = 37;
  } else if (maxComboLineCount === 3) {
    chartBottom = 1313;
    comboNameFontSize = 32;
    comboLineStepY = 37;
  }

  const chartH = chartBottom - chartTop;
  const comboStartY = chartBottom + 12;

  const columnCentersX: number[] = [];

  top10.forEach((item, idx) => {
    const centerX = chartLeft + idx * colGap + colGap / 2;
    columnCentersX.push(centerX);

    const scoreRatio = maxScore > 0 ? (item.bsiScore / maxScore) : 0;
    const maxBarH = chartH - avatarRadius * 2 - 60;
    const rawBarH = scoreRatio * maxBarH;
    const displayBarH = Math.max(rawBarH, 18);

    const barX = centerX - barWidth / 2;
    const barY = chartBottom - displayBarH;

    ctx.fillStyle = '#E68228';
    drawRoundedRect(ctx, barX, barY, barWidth, displayBarH, { tl: Math.min(24, displayBarH / 2), tr: Math.min(24, displayBarH / 2), br: 0, bl: 0 });
    ctx.fill();

    ctx.save();
    ctx.font = 'bold 36px "Inter", "SVN-Mont", sans-serif';
    ctx.textAlign = 'center';

    const scoreStr = formatBsiScore(item.bsiScore);
    let avatarY: number;

    if (rawBarH >= 74) {
      ctx.fillStyle = BUZZ_COLORS.white;
      ctx.textBaseline = 'bottom';
      ctx.fillText(scoreStr, centerX, barY + displayBarH - 14);
      avatarY = barY - avatarRadius - 32;
    } else {
      ctx.fillStyle = '#E68228';
      ctx.textBaseline = 'bottom';
      ctx.fillText(scoreStr, centerX, barY - 8);
      avatarY = barY - avatarRadius - 68;
    }
    ctx.restore();

    drawAvatar(ctx, loadedImages[item.rank], centerX, avatarY, avatarRadius, item.rank, item.name);

    // TÊN CAMPAIGNS / EVENTS / SHOWS / CELEBS (Hỗ trợ 5-6 dòng, font 30px khi 5-6 dòng, đẩy chart lên trên)
    ctx.font = `bold ${comboNameFontSize}px "Inter", "Inter", "SVN-Mont", sans-serif`;
    ctx.fillStyle = '#1A1A1A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const lines = wrapText(ctx, item.name, wrapWidth, 6);
    lines.forEach((line, lIdx) => {
      drawTextLineBounded(ctx, line, centerX, comboStartY + lIdx * comboLineStepY, colGap - 12, comboNameFontSize);
    });
  });

  // Bottom Chart Line Trend inside lower frame (trendTop=1840, trendBottom=2260)
  const trendTop = 1840;
  const trendBottom = 2260;
  const trendH = trendBottom - trendTop;

  const quValues = top10.map((item) => (item.comboLineValue !== undefined ? item.comboLineValue : (item.contentFromQu || 0)));
  const maxQu = Math.max(...quValues, 1000);
  const minQu = Math.min(...quValues, 0);
  const rangeQu = maxQu - minQu || 1;

  const nodePoints: { x: number; y: number; val: number }[] = [];

  top10.forEach((item, idx) => {
    const centerX = columnCentersX[idx] || (chartLeft + idx * colGap + colGap / 2);
    const val = item.comboLineValue !== undefined ? item.comboLineValue : (item.contentFromQu || 0);
    const ratio = (val - minQu) / rangeQu;
    const paddingY = 40;
    const posY = trendBottom - paddingY - ratio * (trendH - paddingY * 2);
    nodePoints.push({ x: centerX, y: posY, val });
  });

  // Draw Connected Straight Line Segments (LineWidth 6pt for bolder look (+2pt))
  if (nodePoints.length > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(nodePoints[0].x, nodePoints[0].y);

    for (let i = 1; i < nodePoints.length; i++) {
      ctx.lineTo(nodePoints[i].x, nodePoints[i].y);
    }

    ctx.strokeStyle = '#E68228';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();

    // Draw Data Nodes (Full Solid Orange Fill #E68228) & Alternating Value Labels (40px Bold)
    nodePoints.forEach((pt, i) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#E68228';
      ctx.fill();

      const isAbove = i % 2 === 0;
      const labelY = isAbove ? pt.y - 36 : pt.y + 36;

      ctx.font = 'bold 40px "Inter", "Inter", "SVN-Mont", sans-serif';
      ctx.fillStyle = '#1A1A1A';
      ctx.textAlign = 'center';
      ctx.textBaseline = isAbove ? 'bottom' : 'top';
      ctx.fillText(formatThousands(pt.val), pt.x, labelY);
    });
  }
}

