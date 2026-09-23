import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { BsiItem, BsiReportMetadata, CategoryType, FormatType, ComboVariantType } from '../types/bsi';
import { SAMPLE_DATA } from './sampleData';
import { preloadItemImages, preloadTemplateAssets, renderCanvasReport } from './canvasRenderer';

interface ExportAllProgressCallback {
  (current: number, total: number, message: string): void;
}

interface ExportTaskDef {
  format: FormatType;
  comboVariant?: ComboVariantType;
  folderName: string;
  nameSuffix: string;
}

/**
 * Generate full BSI Top10 PNG images (4 categories x 6 formats/variants = 24 images) and export as organized ZIP
 */
export async function exportAll12ReportsZip(
  currentMetadata: BsiReportMetadata,
  currentItems: BsiItem[],
  onProgress?: ExportAllProgressCallback,
  categoryDataStore?: Record<CategoryType, BsiItem[]>
): Promise<void> {
  const categories: CategoryType[] = ['CAMPAIGNS', 'EVENTS', 'SHOWS', 'INFLUENCERS'];
  const tasks: ExportTaskDef[] = [
    { format: 'CHART', folderName: '1_Chart_Don', nameSuffix: 'Chart' },
    { format: 'TABLE', folderName: '2_Table_Don', nameSuffix: 'Table' },
    { format: 'COMBINATION', comboVariant: 'DEFAULT', folderName: '3_Combo_Chuan_VN', nameSuffix: 'Combo_VN' },
    { format: 'COMBINATION', comboVariant: 'EN', folderName: '4_Combo_English_EN', nameSuffix: 'Combo_EN' },
    { format: 'COMBINATION', comboVariant: 'SOCIAL_FB', folderName: '5_Combo_Social_FB', nameSuffix: 'Combo_FB' },
    { format: 'COMBINATION', comboVariant: 'SOCIAL_LI', folderName: '6_Combo_Social_LinkedIn', nameSuffix: 'Combo_LI' },
  ];

  const totalTasks = categories.length * tasks.length; // 24
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

    for (let tIdx = 0; tIdx < tasks.length; tIdx++) {
      const task = tasks[tIdx];
      completedCount++;

      if (onProgress) {
        onProgress(
          completedCount,
          totalTasks,
          `Đang render (${completedCount}/${totalTasks}): ${category} - ${task.nameSuffix}...`
        );
      }

      const offscreenCanvas = document.createElement('canvas');
      const taskMetadata: BsiReportMetadata = {
        ...currentMetadata,
        category,
        format: task.format,
        comboVariant: task.comboVariant,
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
        const fileName = `BSI_TOP10_${category}_${task.nameSuffix}_THANG_${currentMetadata.month}_${currentMetadata.year}.png`;
        zip.folder(task.folderName)?.file(fileName, blob);
      }
    }
  }

  if (onProgress) {
    onProgress(totalTasks, totalTasks, 'Đang nén trọn bộ file ZIP...');
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipFileName = `BSI_TOP10_Full_Reports_Thang_${currentMetadata.month}_${currentMetadata.year}.zip`;
  saveAs(zipBlob, zipFileName);
}
