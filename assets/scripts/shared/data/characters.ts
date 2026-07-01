import { GENERATED_CHARACTERS } from "./characters.generated";
import type { Character, CharacterDifficulty, CharacterRole } from "../types";

export type CharacterImplementationMode = "data_driven" | "code_driven";
export type CharacterSkillPresetId =
  | "basic_damage"
  | "no_damage"
  | "fixed_damage"
  | "damage_bonus"
  | "heal_self"
  | "shield_self";
export type CharacterAvailabilityMode = "classic" | "duo" | "pve" | "roguelite";

export interface EditableCharacterAvailability {
  classic: boolean;
  duo: boolean;
  pve: boolean;
  roguelite: boolean;
  hidden?: boolean;
}

export interface EditableCharacterImplementation {
  mode: CharacterImplementationMode;
  handlerId?: string;
}

export interface EditableDiceFace {
  roll: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  description: string;
  presetId?: CharacterSkillPresetId;
  params?: Record<string, unknown>;
}

export interface EditableCharacter {
  id: string;
  name: string;
  title?: string;
  description: string;
  maxHp: number;
  avatarUrl?: string;
  spriteUrl?: string;
  tags: string[];
  difficulty: CharacterDifficulty;
  sortOrder: number;
  availability: EditableCharacterAvailability;
  implementation: EditableCharacterImplementation;
  diceFaces: EditableDiceFace[];
  role?: CharacterRole;
  shortDescription?: string;
  fullDescription?: string[];
  isImplemented?: boolean;
}

export const CHARACTER_SKILL_PRESET_IDS: readonly CharacterSkillPresetId[] = [
  "basic_damage",
  "no_damage",
  "fixed_damage",
  "damage_bonus",
  "heal_self",
  "shield_self",
];

export const FALLBACK_EDITABLE_CHARACTERS: readonly EditableCharacter[] = GENERATED_CHARACTERS;

export function toRuntimeCharacter(character: EditableCharacter): Character {
  const fullDescription = character.fullDescription?.length
    ? character.fullDescription
    : character.diceFaces
        .slice()
        .sort((a, b) => a.roll - b.roll)
        .map((face) => `${face.roll}. ${face.name}: ${face.description}`);

  return {
    id: character.id,
    name: character.name,
    title: character.title,
    maxHp: character.maxHp,
    description: fullDescription.length > 0 ? fullDescription : [character.description],
    difficulty: character.difficulty,
    role: character.role,
    tags: [...character.tags],
    shortDescription: character.shortDescription ?? character.description,
    fullDescription,
    isImplemented: character.isImplemented ?? character.implementation.mode === "code_driven",
    isHidden: character.availability.hidden === true,
    avatarUrl: character.avatarUrl,
    spriteUrl: character.spriteUrl,
    availability: { ...character.availability },
    implementation: { ...character.implementation },
    diceFaces: character.diceFaces.map((face) => ({ ...face, params: face.params ? { ...face.params } : undefined })),
    sortOrder: character.sortOrder,
  };
}

export const GENERATED_RUNTIME_CHARACTERS: readonly Character[] = FALLBACK_EDITABLE_CHARACTERS.map(toRuntimeCharacter);
