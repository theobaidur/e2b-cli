/**
 * Steps
 * 1. Load json data from ../data/bn.json
 *    Its a list of objects with the following properties
 *     - en: english word
 *     - bn: bangla word
 *     - bn_syns: bangla synonyms
 *     - en_syns: english synonyms
 *     - pron: pronunciation
 *
 * 2. Extract all english words, order the words alphabetically, and save them to ../data/en/en.json
 * 3. Group the words by first letter and save each group to ../data/en/[first-letter].json
 *
 *
 */

import * as fs from "fs";
import * as path from "path";
import { ListItem } from "./types";

const dataPath = path.join(__dirname, "../data/bn.json");
const enPath = path.join(__dirname, "../data/en/en.json");
const enDir = path.join(__dirname, "../data/en");

// make sure en dir exists
// if not, create it
if (!fs.existsSync(enDir)) {
  fs.mkdirSync(enDir, { recursive: true });
}

const data: ListItem[] = require(dataPath);

const enWords = data.map((d) => d.en).sort();
fs.writeFileSync(enPath, JSON.stringify(enWords, null, 2));

const enWordsByFirstLetter = data.reduce((acc, word) => {
  const firstLetter = word.en[0];
  if (acc[firstLetter]) {
    acc[firstLetter].push(word);
  } else {
    acc[firstLetter] = [word];
  }
  return acc;
}, {} as Record<string, ListItem[]>);

Object.keys(enWordsByFirstLetter).forEach((firstLetter) => {
  const filePath = path.join(enDir, `${firstLetter}.json`);
  fs.writeFileSync(
    filePath,
    JSON.stringify(enWordsByFirstLetter[firstLetter], null, 2)
  );
});
