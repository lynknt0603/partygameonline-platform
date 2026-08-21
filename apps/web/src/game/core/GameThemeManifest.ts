export interface GameThemeManifest {
  id: string;
  name: string;
  prefersDarkCanvas?: boolean;
  hudVariant?: "platform" | "game";
  className?: string;
}
