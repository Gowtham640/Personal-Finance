const GROUP_COLORS = [
  "#FF9F0A",
  "#64D2FF",
  "#BF5AF2",
  "#30D158",
  "#FF453A",
  "#FFD60A",
  "#AC8E68",
  "#0A84FF",
] as const;

export function groupColor(groupId: string) {
  let hash = 0;
  for (const character of groupId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return GROUP_COLORS[hash % GROUP_COLORS.length];
}
