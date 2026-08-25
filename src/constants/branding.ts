import { CategoryType } from '../types/bsi';

export const BUZZ_COLORS = {
  primaryOrange: '#E68228',
  lightOrange: '#E69650',
  sandyOrange: '#FABE8C',
  darkBlue: '#125876',
  grey: '#969696',
  darkGrey: '#5F5F5F',
  deepGrey: '#333333',
  white: '#FFFFFF',
  cardBackground: '#FFFFFF',
  lightBg: '#F8FAFC',
  borderOrange: '#E68228',
};

export const CATEGORY_CONFIG: Record<CategoryType, { titleBadge: string; objectName: string }> = {
  CAMPAIGNS: {
    titleBadge: 'BSI TOP10 CAMPAIGNS',
    objectName: 'CHIẾN DỊCH',
  },
  EVENTS: {
    titleBadge: 'BSI TOP10 EVENTS',
    objectName: 'SỰ KIỆN',
  },
  SHOWS: {
    titleBadge: 'BSI TOP10 SHOWS',
    objectName: 'CHƯƠNG TRÌNH',
  },
  INFLUENCERS: {
    titleBadge: 'BSI TOP10 INFLUENCERS',
    objectName: 'NGƯỜI ẢNH HƯỞNG',
  },
};
