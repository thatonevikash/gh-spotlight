export interface PrimerTheme {
  bgDefault: string;
  bgMuted: string;
  fgDefault: string;
  fgMuted: string;
  borderDefault: string;
  accent: string;
  success: string;
}
export const themes = {
  light: {
    bgDefault: "#ffffff",
    bgMuted: "#f6f8fa",
    fgDefault: "#1f2328",
    fgMuted: "#656d76",
    borderDefault: "#d1d9e0",
    accent: "#0969da",
    success: "#1f883d",
  },
  dark: {
    bgDefault: "#0d1117",
    bgMuted: "#161b22",
    fgDefault: "#e6edf3",
    fgMuted: "#8d96a0",
    borderDefault: "#30363d",
    accent: "#2f81f7",
    success: "#238636",
  },
  dark_dimmed: {
    bgDefault: "#22272e",
    bgMuted: "#2d333b",
    fgDefault: "#adbac7",
    fgMuted: "#768390",
    borderDefault: "#444c56",
    accent: "#539bf5",
    success: "#347d39",
  },
  light_high_contrast: {
    bgDefault: "#ffffff",
    bgMuted: "#e6eaef",
    fgDefault: "#010409",
    fgMuted: "#454c54",
    borderDefault: "#454c54",
    accent: "#023b95",
    success: "#04591f",
  },
  dark_high_contrast: {
    bgDefault: "#010409",
    bgMuted: "#151b23",
    fgDefault: "#ffffff",
    fgMuted: "#b7bdc8",
    borderDefault: "#b7bdc8",
    accent: "#74b9ff",
    success: "#2bd853",
  },
} as const satisfies Record<string, PrimerTheme>;
export type ThemeName = keyof typeof themes;
export const themeNames = Object.keys(themes) as ThemeName[];
export const themeLabels: Record<ThemeName, string> = {
  light: "Light",
  dark: "Dark",
  dark_dimmed: "Dark dimmed",
  light_high_contrast: "Light high contrast",
  dark_high_contrast: "Dark high contrast",
};
export function resolveTheme(name: ThemeName): PrimerTheme {
  return themes[name];
}
