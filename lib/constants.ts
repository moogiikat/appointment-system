/*
 * 店舗の所在地の選択肢。
 *
 * 元はウランバートルの9区だけだったが、UB 外の店舗（Дорнод アイマグ）が
 * 入ったため、区とアイマグを同じ一覧で扱っている。
 * 厳密には区（дүүрэг）とアイマグ（аймаг）は行政区分の階層が違うので、
 * 県外の店舗が増えるなら「アイマグ → сум」の2階層に作り直すべき。
 *
 * DB のカラム名は shops.district のままにしてある（スキーマ変更を避けるため）。
 */
export const LOCATIONS = [
  // Улаанбаатар хотын дүүргүүд
  'Багануур',
  'Багахангай',
  'Баянгол',
  'Баянзүрх',
  'Налайх',
  'Сонгинохайрхан',
  'Сүхбаатар',
  'Хан-Уул',
  'Чингэлтэй',
  // Аймгууд（店舗が入った順に追加する）
  'Дорнод',
] as const;

// Санал болгож буй ангилалууд (жишээ, чөлөөтэй ангилал нэмэх боломжтой)
export const SUGGESTED_CATEGORIES = [
  'Эмнэлэг',
  'Шүдний эмнэлэг',
  'Гоо сайхны газар',
  'Үс засалт',
  'Массаж, спа',
  'Рестораны',
  'Фитнес, спорт заал',
  'Авто засвар',
  'Бусад',
] as const;

/*
 * ангилал → EPARK のジャンル色。
 * 色は epark.jp の .genre_icon 定義（icon-016〜093）から取っている。
 * icon は lucide-react のコンポーネント名で、描画側で解決する。
 */
export const CATEGORY_STYLES: Record<string, { color: string; icon: string }> = {
  'Эмнэлэг': { color: '#ff7777', icon: 'Stethoscope' },
  'Шүдний эмнэлэг': { color: '#00aa66', icon: 'Smile' },
  'Гоо сайхны газар': { color: '#ff64b4', icon: 'Sparkles' },
  'Үс засалт': { color: '#9b2bb7', icon: 'Scissors' },
  'Массаж, спа': { color: '#995511', icon: 'Flower2' },
  'Рестораны': { color: '#ee6611', icon: 'UtensilsCrossed' },
  'Фитнес, спорт заал': { color: '#088fd5', icon: 'Dumbbell' },
  'Авто засвар': { color: '#2266aa', icon: 'Car' },
  'Бусад': { color: '#757575', icon: 'LayoutGrid' },
};

export const DEFAULT_CATEGORY_STYLE = { color: '#757575', icon: 'Store' };

export function categoryStyle(category?: string) {
  if (!category) return DEFAULT_CATEGORY_STYLE;
  return CATEGORY_STYLES[category] ?? DEFAULT_CATEGORY_STYLE;
}
