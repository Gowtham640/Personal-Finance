import { Transaction, TransactionType } from "./types";

export type CategoryMapping = Record<string, string>;

export const commonMerchantCategories: CategoryMapping = {
  zepto: "Grocery",
  swiggy: "Food",
  zomato: "Food",
  boomyshow: "Entertainment",
  netflix: "Entertainment",
  uber: "Transport",
  ola: "Transport",
  amazon: "Shopping",
  flipkart: "Shopping",
  salary: "Income",
  "hdfc credit": "Income",
};

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function displayLabel(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(" ");
}

class TrieNode {
  children = new Map<string, TrieNode>();
  values = new Map<string, { label: string; frequency: number }>();
}

export class MerchantTrie {
  private readonly root = new TrieNode();

  add(value: string, label?: string) {
    const source = value.trim();
    const merchant = (label ?? source).trim();
    if (!source || !merchant) return;
    const normalizedSource = normalize(source);
    const normalizedMerchant = normalize(merchant);
    let node = this.root;
    for (const character of normalizedSource) {
      node = node.children.get(character) ?? this.createChild(node, character);
      const existing = node.values.get(normalizedMerchant);
      node.values.set(normalizedMerchant, {
        label: existing?.label ?? merchant,
        frequency: (existing?.frequency ?? 0) + 1,
      });
    }
  }

  suggest(prefix: string, limit = 5) {
    const normalizedPrefix = normalize(prefix);
    if (!normalizedPrefix) return [];
    let node: TrieNode | undefined = this.root;
    for (const character of normalizedPrefix) {
      node = node.children.get(character);
      if (!node) return [];
    }
    return [...node.values.values()]
      .sort((left, right) => {
        const leftExact = normalize(left.label) === normalizedPrefix ? 0 : 1;
        const rightExact = normalize(right.label) === normalizedPrefix ? 0 : 1;
        return leftExact - rightExact
          || right.frequency - left.frequency
          || left.label.localeCompare(right.label);
      })
      .map((entry) => entry.label)
      .slice(0, limit);
  }

  private createChild(node: TrieNode, character: string) {
    const child = new TrieNode();
    node.children.set(character, child);
    return child;
  }
}

function indexMerchant(trie: MerchantTrie, value: string, label?: string) {
  const merchant = (label ?? value).trim();
  const source = value.trim();
  if (!source || !merchant) return;
  trie.add(source, merchant);
  for (const word of source.split(/[\s/_-]+/)) {
    if (word.length >= 2 && normalize(word) !== normalize(source)) trie.add(word, merchant);
  }
}

export function buildMerchantTrie(transactions: Transaction[], learnedMerchants: readonly string[] = []) {
  const trie = new MerchantTrie();
  Object.keys(commonMerchantCategories).forEach((merchant) => indexMerchant(trie, merchant, displayLabel(merchant)));
  learnedMerchants.forEach((merchant) => indexMerchant(trie, merchant, displayLabel(merchant)));
  transactions.forEach((transaction) => {
    const merchant = transaction.merchant?.trim() || transaction.description?.trim();
    if (merchant) indexMerchant(trie, merchant);
  });
  return trie;
}

export function categorySuggestion(
  merchant: string,
  amount: number,
  type: TransactionType,
  learned: CategoryMapping,
) {
  const normalizedMerchant = normalize(merchant);
  const mappings = { ...commonMerchantCategories, ...learned };
  if (normalizedMerchant && mappings[normalizedMerchant]) return mappings[normalizedMerchant];

  const matchingKeyword = Object.keys(mappings)
    .filter((keyword) => normalizedMerchant.includes(normalize(keyword)))
    .sort((left, right) => right.length - left.length)[0];
  if (matchingKeyword) return mappings[matchingKeyword];

  if (type === "debit" && amount > 5000) return "Bills/Rent";
  if (type === "debit" && amount > 0 && amount < 100) return "Misc";
  return null;
}

export function categoryFrequency(transactions: Transaction[]) {
  return transactions.reduce<Record<string, number>>((frequency, transaction) => {
    if (transaction.excludedFromCashFlow) return frequency;
    if (transaction.category) frequency[transaction.category] = (frequency[transaction.category] ?? 0) + 1;
    return frequency;
  }, {});
}

export function orderedCategorySuggestions(
  frequency: Record<string, number>,
  mappedCategory: string | null,
  categories: readonly string[],
) {
  const frequent = Object.entries(frequency)
    .sort(([, left], [, right]) => right - left)
    .map(([category]) => category);
  return [...new Set([mappedCategory, ...frequent.slice(0, 2), ...categories].filter(Boolean) as string[])];
}

export function normalizeMerchant(value: string) {
  return normalize(value);
}
