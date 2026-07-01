import {
  FALLBACK_EDITABLE_CHARACTERS,
  toRuntimeCharacter,
  type EditableCharacter,
} from "./data/characters";
import type { Character } from "./types";

function sortRuntimeCharacters(items: readonly Character[]): Character[] {
  return [...items].sort((a, b) => {
    const sortA = typeof a.sortOrder === "number" ? a.sortOrder : Number.MAX_SAFE_INTEGER;
    const sortB = typeof b.sortOrder === "number" ? b.sortOrder : Number.MAX_SAFE_INTEGER;
    return sortA - sortB || a.name.localeCompare(b.name);
  });
}

function buildCharacterMap(items: readonly EditableCharacter[]): Record<string, Character> {
  return Object.fromEntries(items.map((item) => [item.id, toRuntimeCharacter(item)]));
}

export const characters: Record<string, Character> = buildCharacterMap(FALLBACK_EDITABLE_CHARACTERS);
export const characterList: Character[] = sortRuntimeCharacters(Object.values(characters));

export function replaceRuntimeCharacters(items: readonly EditableCharacter[]): void {
  for (const key of Object.keys(characters)) {
    delete characters[key];
  }

  for (const item of items) {
    characters[item.id] = toRuntimeCharacter(item);
  }

  characterList.splice(0, characterList.length, ...sortRuntimeCharacters(Object.values(characters)));
}
