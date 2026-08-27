import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { BsiItem, BsiReportMetadata, CategoryType, FormatType } from '../types/bsi';
import { SAMPLE_DATA } from './sampleData';
import { preloadItemImages, preloadTemplateAssets, renderCanvasReport } from './canvasRenderer';

interface ExportAllProgressCallback {
  (current: number, total: number, message: string): void;
}

/**
 * Generate 12 BSI Top10 PNG images (4 categories x 3 formats) and export as ZIP file
 */
export async function exportAll12ReportsZip(
  currentMetadata: BsiReportMetadata,
  currentItems: BsiItem[],
  onProgress?: ExportAllProgressCallback,
  categoryDataStore?: Record<CategoryType, BsiItem[]>
): Promise<void> {
  const categories: CategoryType[] = ['CAMPAIGNS', 'EVENTS', 'SHOWS', 'INFLUENCERS'];
  const formats: FormatType[] = ['CHART', 'TABLE', 'COMBINATION'];
  const totalTasks = categories.length * formats.length; // 12

  const zip = new JSZip();
  let completedCount = 0;

  // Preload official Buzzmetrics element templates
  const templateAssets = await preloadTemplateAssets();

  for (let cIdx = 0; cIdx < categories.length; cIdx++) {
    const category = categories[cIdx];
    const categoryItems =
      categoryDataStore?.[category] ||
      (category === currentMetadata.category ? currentItems : SAMPLE_DATA[category] || []);

    if (onProgress) {
      onProgress(completedCount, totalTasks, `Đang tải hình ảnh ${category}...`);
    }
    const loadedImages = await preloadItemImages(categoryItems);

    for (let fIdx = 0; fIdx < formats.length; fIdx++) {
      const format = formats[fIdx];
      completedCount++;

      if (onProgress) {
        onProgress(
          completedCount,
          totalTasks,
          `Đang render (${completedCount}/${totalTasks}): ${category} - ${format}...`
        );
      }

      const offscreenCanvas = document.createElement('canvas');
      const taskMetadata: BsiReportMetadata = {
        ...currentMetadata,
        category,
        format,
        highDpiScale: currentMetadata.highDpiScale || 2,
      };

      renderCanvasReport({
        canvas: offscreenCanvas,
        items: categoryItems,
        metadata: taskMetadata,
        loadedImages,
        templateAssets,
        scale: taskMetadata.highDpiScale,
      });

      const blob = await new Promise<Blob | null>((resolve) => {
        offscreenCanvas.toBlob((b) => resolve(b), 'image/png', 1.0);
      });

      if (blob) {
        const folderNameMap: Record<FormatType, string> = {
          CHART: 'Chart',
          TABLE: 'Table',
          COMBINATION: 'Combo',
        };
        const folderName = folderNameMap[format];
        const fileName = `BSI_TOP10_${category}_${folderName}_THANG_${currentMetadata.month}_${currentMetadata.year}.png`;
        zip.folder(folderName)?.file(fileName, blob);
      }
    }
  }

  if (onProgress) {
    onProgress(totalTasks, totalTasks, 'Đang nén file ZIP...');
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipFileName = `BSI_TOP10_Full_12_Reports_Thang_${currentMetadata.month}_${currentMetadata.year}.zip`;
  saveAs(zipBlob, zipFileName);
}
