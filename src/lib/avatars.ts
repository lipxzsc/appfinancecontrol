// Avatares predefinidos (emoji). Guardamos apenas o emoji em profiles.avatar_url
// prefixado com "emoji:" pra diferenciar de URLs reais no futuro.
export const AVATAR_PRESETS = [
  "🦊", "🐼", "🐱", "🐶", "🦁", "🐯",
  "🐨", "🐸", "🐵", "🦉", "🐰", "🐻",
  "🐧", "🦄", "🐙", "🐝", "🐳", "🦖",
] as const;

export type AvatarPreset = (typeof AVATAR_PRESETS)[number];

export function parseAvatar(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("emoji:")) return value.slice(6);
  return value; // URL crua (ex.: vindo do Google)
}

export function serializeEmojiAvatar(emoji: string): string {
  return `emoji:${emoji}`;
}

export function isEmojiAvatar(value: string | null | undefined): boolean {
  return !!value && value.startsWith("emoji:");
}