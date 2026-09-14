export interface Item {
  id: string;
  vi: string;
  en: string;
  category: string;
  /** Path to the item's artwork. Omitted for items rendered as a plain color swatch. */
  image?: string;
  /** Hex color to render as a swatch instead of an image (used by the "color" category). */
  swatch?: string;
}
