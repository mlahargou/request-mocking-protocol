/**
 * A module to replace placeholders {{var}} in the string.
 * Can be also used for objects within JSON.stringify replacer.
 * Supports type hints, see tests.
 */

/* eslint-disable visual/complexity */

export function cloneWithPlaceholders<T extends object>(
  obj: T,
  variables: Record<string, string> = {},
) {
  return JSON.parse(stringifyWithPlaceholders(obj, variables)) as T;
}

export function stringifyWithPlaceholders(obj: object, variables: Record<string, string> = {}) {
  return JSON.stringify(obj, (_, value) => {
    return typeof value === 'string'
      ? replacePlaceholders(value, variables, { useTypes: true })
      : value;
  });
}

type Result<T extends boolean> = T extends true ? string | number | boolean : string;
export function replacePlaceholders<T extends boolean = false>(
  value: string,
  variables: Record<string, string>,
  opts?: { useTypes?: T },
): Result<T> {
  if (Object.keys(variables).length === 0) return value;

  // Find all placeholder matches
  const matches = [...value.matchAll(/\{\{\s*(\w+)(?::\s*(number|boolean))?\s*\}\}/g)];
  const firstMatch = matches[0];

  // No placeholders found
  if (!firstMatch) return value;

  // Example: { value: '{{id}}' }
  const isOnlyPlaceholder = matches.length === 1 && value.trim() === firstMatch[0];

  // If the whole value is a single placeholder, apply type conversion
  // Multiple placeholders -> always replace with string
  return opts?.useTypes && isOnlyPlaceholder
    ? (replaceSinglePlaceholder(firstMatch, value, variables) as Result<T>)
    : replaceMultiplePlaceholders(matches, value, variables);
}

function replaceSinglePlaceholder(
  match: RegExpExecArray,
  value: string,
  variables: Record<string, string | undefined>,
) {
  const [, key, typeHint] = match;

  if (!key) return value;

  const replacement = variables[key];
  if (replacement === undefined) return value;

  if (typeHint === 'number') {
    const number = Number(replacement);
    if (!Number.isNaN(number)) return number;
  }

  if (typeHint === 'boolean') {
    if (replacement === '' || replacement.toLowerCase() === 'false') return false;
    return true;
  }

  return replacement ?? value;
}

function replaceMultiplePlaceholders(
  matches: RegExpMatchArray[],
  value: string,
  variables: Record<string, string>,
) {
  for (const [match, key] of matches) {
    if (!key || variables[key] === undefined) continue;
    value = value.replaceAll(match, variables[key]);
  }
  return value;
}
