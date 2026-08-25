import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { BsiItem, CategoryType } from '../types/bsi';
import { SAMPLE_DATA } from './sampleData';

/**
 * Normalizes header string to match keys
 */
function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s_\-%()]/g, '');
}

/**
 * Helper to clean numeric string from commas, percent signs, etc.
 */
function parseCleanNumber(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/,/g, '').replace(/%/g, '').trim();
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Helper to convert month number (1..12) to English Month Name
 */
function getEnglishMonthName(monthNum: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNum - 1] || 'January';
}

/**
 * Extract Google Sheet Document ID and GID from Google Sheets URL
 */
export function extractGoogleSheetIdAndGid(url: string): { sheetId: string | null; gid: string | null } {
  const sheetIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
  return {
    sheetId: sheetIdMatch ? sheetIdMatch[1] : null,
    gid: gidMatch ? gidMatch[1] : null,
  };
}

/**
 * Helper to clean up extra spaces, non-breaking spaces (\u00A0), multiple spaces between words,
 * and leading/trailing whitespace per line.
 */
export function cleanTextSpaces(val: any): string {
  if (val === undefined || val === null) return '';
  let str = String(val);

  // Convert non-breaking space (\u00A0) and tabs to standard space
  str = str.replace(/[\u00A0\t]/g, ' ');

  // If text has explicit '|' delimiter, preserve '|' for manual line breaks
  if (str.includes('|')) {
    const lines = str
      .split('|')
      .map((line) => line.replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    return lines.join(' | ');
  }

  // Single line / flattened text: convert all newlines to space, trim, and collapse consecutive spaces
  return str.replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Parse raw rows from Excel/CSV into BsiItem[] with optional Month and Year filtering
 */
export function parseBsiRows(rawData: any[], filterMonth?: string, filterYear?: string): BsiItem[] {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  const findVal = (row: any, possibleKeys: string[]): any => {
    for (const rawKey of Object.keys(row)) {
      const normKey = normalizeHeader(rawKey);
      for (const targetKey of possibleKeys) {
        if (normKey === normalizeHeader(targetKey)) {
          return row[rawKey];
        }
      }
    }
    return undefined;
  };

  let filteredRows = rawData;

  if (filterMonth && filterYear) {
    const targetYear = parseInt(filterYear, 10);
    const targetMonthNum = parseInt(filterMonth, 10);
    const targetMonthName = getEnglishMonthName(targetMonthNum).toLowerCase();

    const matched = rawData.filter((row) => {
      const rowYear = parseInt(findVal(row, ['year', 'nam']) || '0', 10);
      const rowMonthNum = parseInt(findVal(row, ['monthnum', 'month_num', 'month_', 'thangnum']) || '0', 10);
      const rowMonthStr = String(findVal(row, ['month', 'thang']) || '').trim().toLowerCase();

      if (rowYear > 0 && targetYear > 0 && rowYear !== targetYear) {
        return false;
      }

      if (rowMonthNum > 0 && targetMonthNum > 0) {
        if (rowMonthNum !== targetMonthNum) return false;
      } else if (rowMonthStr) {
        if (
          rowMonthStr !== `${targetMonthNum}` &&
          rowMonthStr !== filterMonth &&
          !rowMonthStr.includes(targetMonthName)
        ) {
          return false;
        }
      }

      return true;
    });

    filteredRows = matched;
  }

  const items: BsiItem[] = [];

  filteredRows.forEach((row, index) => {
    const brandVal = findVal(row, ['brand', 'brands', 'brandname', 'thuonghieu']);
    const campaignVal = findVal(row, ['campaign', 'campaigns']);
    const showVal = findVal(row, ['show', 'shows']);
    const eventVal = findVal(row, ['event', 'events']);
    const celebVal = findVal(row, ['celeb', 'celebs', 'influencer', 'influencers']);
    const rawName = campaignVal || showVal || eventVal || celebVal || findVal(row, ['name', 'ten', 'tendoituong']);
    const nameVal = rawName ? cleanTextSpaces(rawName) : `Object ${index + 1}`;
    const brandValClean = brandVal ? cleanTextSpaces(brandVal) : undefined;

    let bsiScoreVal = parseCleanNumber(findVal(row, ['bsireal', 'bsicfqu', 'bsiscore', 'bsi', 'score', 'diembsi']));
    let buzzVolumeVal = parseCleanNumber(findVal(row, ['buzzvolume', 'buzz', 'volume', 'thaoluan']));
    let qualifiedUserVal = parseCleanNumber(findVal(row, ['qualifieduser', 'quuser', 'qu', 'qualified']));
    let contentFromQuVal = parseCleanNumber(findVal(row, ['contentfromqu', 'contentfrom', 'contentqu', 'content']));
    
    let sentimentScoreVal = parseCleanNumber(findVal(row, ['sentimentscore', 'sentimentindex', 'sentiment']));
    if (sentimentScoreVal > 1 && sentimentScoreVal <= 100) sentimentScoreVal /= 100;
    if (sentimentScoreVal === 0) sentimentScoreVal = 1.0;

    let relevanceScoreVal = parseCleanNumber(findVal(row, ['relevancescore', 'relevancyscore', 'relevance']));
    if (relevanceScoreVal > 1 && relevanceScoreVal <= 100) relevanceScoreVal /= 100;

    let earnedMediaVal = parseCleanNumber(findVal(row, ['earnedmedia', 'earned', 'pearned']));
    if (earnedMediaVal > 0 && earnedMediaVal <= 1) earnedMediaVal *= 100;

    const imageUrlVal = findVal(row, ['imageurl', 'image', 'logo', 'url', 'avatar']) || undefined;

    items.push({
      rank: index + 1,
      name: nameVal,
      brandName: brandValClean,
      bsiScore: bsiScoreVal,
      buzzVolume: buzzVolumeVal,
      qualifiedUser: qualifiedUserVal,
      contentFromQu: contentFromQuVal,
      sentimentScore: sentimentScoreVal,
      relevanceScore: relevanceScoreVal,
      earnedMedia: earnedMediaVal,
      imageUrl: imageUrlVal,
    });
  });

  // Sort descending by BSI Score (real), then reassign ranks 1..10
  items.sort((a, b) => b.bsiScore - a.bsiScore);
  const top10 = items.slice(0, 10).map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  return top10;
}

export interface LiveGoogleSheetResult {
  allParsed: Partial<Record<CategoryType, BsiItem[]>>;
  syncedCategories: CategoryType[];
}

/**
 * Fetch and parse ALL 4 tabs (QU Campaigns, QU Celebs, QU Events, QU Shows) from Google Sheet directly
 */
export async function fetchGoogleSheetsAllTabsLive(
  url: string,
  filterMonth?: string,
  filterYear?: string
): Promise<LiveGoogleSheetResult> {
  const { sheetId, gid } = extractGoogleSheetIdAndGid(url);
  if (!sheetId) {
    throw new Error('URL Google Sheet không hợp lệ. Vui lòng kiểm tra lại link.');
  }

  const categoryTabMap: Record<CategoryType, string[]> = {
    CAMPAIGNS: ['QU Campaigns', 'Campaigns', 'QU_Campaigns', 'QUCampaigns'],
    INFLUENCERS: ['QU Celebs', 'Celebs', 'QU_Celebs', 'QUCelebs', 'Influencers', 'QU Influencers'],
    EVENTS: ['QU Events', 'Events', 'QU_Events', 'QUEvents'],
    SHOWS: ['QU Shows', 'Shows', 'QU_Shows', 'QUShows'],
  };

  const allParsed: Partial<Record<CategoryType, BsiItem[]>> = {};
  const syncedCategories: CategoryType[] = [];

  const categories = Object.keys(categoryTabMap) as CategoryType[];

  await Promise.all(
    categories.map(async (cat) => {
      const possibleTabs = categoryTabMap[cat];
      let csvText = '';

      for (const tabName of possibleTabs) {
        try {
          const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
          const resp = await fetch(gvizUrl);
          if (resp.ok) {
            const text = await resp.text();
            if (text && text.trim().length > 30 && !text.includes('<!DOCTYPE html>')) {
              csvText = text;
              break;
            }
          }
        } catch (e) {
          // ignore
        }
      }

      if (!csvText) {
        try {
          const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid ? `&gid=${gid}` : ''}`;
          const resp = await fetch(exportUrl);
          if (resp.ok) {
            const text = await resp.text();
            if (text && text.trim().length > 30 && !text.includes('<!DOCTYPE html>')) {
              csvText = text;
            }
          }
        } catch (e) {
          // ignore
        }
      }

      if (csvText) {
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        if (parsed.data && parsed.data.length > 0) {
          const bsiItems = parseBsiRows(parsed.data, filterMonth, filterYear);
          if (bsiItems.length > 0) {
            allParsed[cat] = bsiItems;
            syncedCategories.push(cat);
          }
        }
      }
    })
  );

  return { allParsed, syncedCategories };
}

/**
 * Fetch and parse Google Sheet directly from URL for specified month/year (Legacy single tab wrapper)
 */
export async function fetchGoogleSheetLive(
  url: string,
  filterMonth?: string,
  filterYear?: string
): Promise<BsiItem[]> {
  const result = await fetchGoogleSheetsAllTabsLive(url, filterMonth, filterYear);
  const firstFoundKey = Object.keys(result.allParsed)[0] as CategoryType | undefined;
  if (firstFoundKey && result.allParsed[firstFoundKey]) {
    return result.allParsed[firstFoundKey]!;
  }
  return [];
}

/**
 * Map sheet name to CategoryType
 */
function matchCategoryFromSheetName(sheetName: string): CategoryType | null {
  const norm = sheetName.trim().toUpperCase().replace(/[\s_\-%()]/g, '');
  if (norm.includes('CAMP')) return 'CAMPAIGNS';
  if (norm.includes('EVENT')) return 'EVENTS';
  if (norm.includes('SHOW')) return 'SHOWS';
  if (norm.includes('CELEB') || norm.includes('INFLUENCER')) return 'INFLUENCERS';
  return null;
}

export interface MultiSheetExcelResult {
  allParsed: Partial<Record<CategoryType, BsiItem[]>>;
  activeCategoryParsed: BsiItem[];
  totalParsedCount: number;
  matchedCategories: CategoryType[];
}

/**
 * Parse Excel (.xlsx, .xls) file with multi-sheet support for CAMPAIGNS, EVENTS, SHOWS, INFLUENCERS
 */
export async function parseExcelFileMultiSheet(
  file: File,
  activeCategory: CategoryType
): Promise<MultiSheetExcelResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const allParsed: Partial<Record<CategoryType, BsiItem[]>> = {};
        const matchedCategories: CategoryType[] = [];
        let totalParsedCount = 0;

        workbook.SheetNames.forEach((sheetName) => {
          const matchedCat = matchCategoryFromSheetName(sheetName);
          const worksheet = workbook.Sheets[sheetName];
          const rawJson = XLSX.utils.sheet_to_json(worksheet);
          const parsed = parseBsiRows(rawJson);

          if (parsed.length > 0) {
            if (matchedCat) {
              allParsed[matchedCat] = parsed;
              if (!matchedCategories.includes(matchedCat)) {
                matchedCategories.push(matchedCat);
              }
              totalParsedCount += parsed.length;
            }
          }
        });

        // Fallback if no sheet names matched category names:
        // Use the first sheet for activeCategory
        if (matchedCategories.length === 0 && workbook.SheetNames.length > 0) {
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawJson = XLSX.utils.sheet_to_json(worksheet);
          const parsed = parseBsiRows(rawJson);
          allParsed[activeCategory] = parsed;
          matchedCategories.push(activeCategory);
          totalParsedCount = parsed.length;
        }

        const activeCategoryParsed = allParsed[activeCategory] || [];

        resolve({
          allParsed,
          activeCategoryParsed,
          totalParsedCount,
          matchedCategories,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Legacy Parse Excel (.xlsx, .xls) file for a single active category
 */
export async function parseExcelFile(file: File): Promise<BsiItem[]> {
  const result = await parseExcelFileMultiSheet(file, 'CAMPAIGNS');
  return result.activeCategoryParsed;
}

/**
 * Parse CSV file
 */
export async function parseCsvFile(file: File): Promise<BsiItem[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsed = parseBsiRows(results.data);
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
}

/**
 * Download sample Excel Template containing 4 sheets (CAMPAIGNS, EVENTS, SHOWS, INFLUENCERS)
 */
export function downloadSampleExcelTemplate() {
  const workbook = XLSX.utils.book_new();

  const createSheetRows = (category: CategoryType) => {
    const list = SAMPLE_DATA[category] || [];
    return list.map((item) => ({
      Rank: item.rank,
      Brand: item.brandName || '',
      Name: item.name,
      'BSI (CFQU)': item.bsiScore,
      'Buzz Volume': item.buzzVolume,
      'QU User': item.qualifiedUser,
      'Content from QU': item.contentFromQu,
      'Sentiment Index': item.sentimentScore,
      'Relevancy Score': item.relevanceScore,
      '%Earned': `${item.earnedMedia}%`,
      Image_URL: item.imageUrl || '',
    }));
  };

  const categories: { key: CategoryType; sheetName: string }[] = [
    { key: 'CAMPAIGNS', sheetName: 'CAMPAIGNS' },
    { key: 'EVENTS', sheetName: 'EVENTS' },
    { key: 'SHOWS', sheetName: 'SHOWS' },
    { key: 'INFLUENCERS', sheetName: 'INFLUENCERS' },
  ];

  categories.forEach(({ key, sheetName }) => {
    const rows = createSheetRows(key);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  XLSX.writeFile(workbook, 'BSI_Top10_4Categories_Template_Buzzmetrics.xlsx');
}
