import * as fs from "fs";
import * as path from "path";
import { ListItem } from "./types";

const masterList: {
  [key: string]: ListItem;
} = {};

const addToList = (en: any, bn: any, synonyms_en?: string[]) => {
  en = en?.replace(/"/g, "")?.trim()?.toLowerCase();
  bn = bn?.replace(/"/g, "")?.trim();
  bn = bn?.replace(/\(.*\)/, "")?.trim();

  // if en doesn't starts with a-z, 0-9, skip
  if (!en?.match(/^[a-z0-9]/)) {
    return;
  }

  if (bn === "null") return;
  if (!(en && bn)) return;

  if (!masterList[en]) {
    masterList[en] = {
      en,
      bn,
      synonyms_bn: [],
      synonyms_en: [],
    };
  } else {
    // split bn by comman

    if (bn) {
      const bnList = bn.split(",");
      bnList?.forEach((bnItem: string) => {
        bnItem = bnItem?.trim();
        if (
          bnItem &&
          !masterList[en]?.synonyms_bn?.includes(bnItem) &&
          bnItem !== masterList[en]?.bn
        ) {
          masterList[en]?.synonyms_bn?.push(bnItem);
        }
      });
    }
    if (synonyms_en && masterList[en]) {
      synonyms_en?.forEach((enItem: string) => {
        enItem = enItem?.trim();
        if (
          enItem &&
          !masterList[en]?.synonyms_en?.includes(enItem) &&
          enItem !== masterList[en]?.en
        ) {
          masterList[en]?.synonyms_en?.push(enItem);
        }
      });
    }
  }
};

{
  /**
   * 1. Read the data from ../data/list1.txt
   *    - Each line is a string
   *    - Each string is in "|en|bn" format
   * 2. Convert each string to an object with "en" and "bn" properties
   * 3. Add each object to the masterList
   */

  const dataPath = path.join(__dirname, "..", "data", "list1.txt");
  const data = fs.readFileSync(dataPath, "utf-8");
  // split data by new line
  const lines = data.split(/\r?\n/);

  lines.forEach((line) => {
    const [_, en, bn] = line.split("|");
    addToList(en, bn);
  });
}

{
  /**
   * Steps:
   * 1. Read the data from ../data/list2.csv
   *    - Its a csv file
   *    - First column is "en", second column is "bn"
   * 2. Convert each row to an object with "en" and "bn" properties
   * 3. Add each object to the masterList
   * */

  const dataPath = path.join(__dirname, "..", "data", "list2.csv");
  const data = fs.readFileSync(dataPath, "utf-8");
  // split data by new line
  const lines = data.split(/\r?\n/);

  lines.forEach((line) => {
    // split line by comma but ignore comma inside double quotes
    let [en, bn] = line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
    addToList(en, bn);
  });
}

{
  /**
   * Steps:
   * 1. Read the data from ../data/list3.csv
   *    - Its a csv file
   *    - First column is id, second column is "en", third column is "bn"
   * 2. Convert each row to an object with "en" and "bn" properties
   * 3. Add each object to the masterList
   * */

  const dataPath = path.join(__dirname, "..", "data", "list3.csv");
  const data = fs.readFileSync(dataPath, "utf-8");
  // split data by new line
  const lines = data.split(/\r?\n/);

  lines.forEach((line) => {
    // split line by semicolon but ignore semicolon inside double quotes
    let [id, en, bn, pron_bn] = line.split(/;(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);

    // remove double quotes
    en = en?.replace(/"/g, "")?.toLowerCase()?.trim();
    bn = bn?.replace(/"/g, "")?.trim();
    addToList(en, bn);
  });
}

{
  /**
   * Steps:
   * 1. Read the data from ../data/list4.xml
   *    - Its a xml file
   *    - Each word is in <row> tag
   *    - Each <row> has <field> tags in it
   *    - the <field> with name="en_word" is "en"
   *    - the <field> with name="bn_word" is "bn"
   * 2. Add each object to the masterList
   **/

  const dataPath = path.join(__dirname, "..", "data", "list4.xml");
  const data = fs.readFileSync(dataPath, "utf-8");

  data.split(/<row>/).forEach((row, index) => {
    let en = row.match(/<field name="en_word">(.*)<\/field>/)?.[1];
    let bn = row.match(/<field name="bn_word">(.*)<\/field>/)?.[1];

    // remove double quotes
    en = en?.replace(/"/g, "")?.toLowerCase()?.trim();
    bn = bn?.replace(/"/g, "")?.trim();

    addToList(en, bn);
  });
}

{
  const dataPath = path.join(__dirname, "..", "data", "list5.json");
  const data: any[] = require(dataPath);

  data.forEach((item) => {
    const en = item.en;
    const bn = item.bn;
    const bn_syns = item.bn_syns;
    const en_syns = item.en_syns;
    addToList(en, bn, en_syns);
    if (Array.isArray(bn_syns)) {
      bn_syns.forEach((syn) => {
        addToList(en, syn);
      });
    }
  });
}

{
  const dataPath = path.join(__dirname, "..", "data", "list6.json");
  const data: any[] = require(dataPath);

  data.forEach((item) => {
    const en = item.en;
    const bn = item.bn;
    addToList(en, bn);
  });
}

{
  const dataPath = path.join(__dirname, "..", "data", "list7.json");
  const data: any = require(dataPath);

  for (const en in data) {
    const syn = data[en];
    const list = [];
    for (const s in syn) {
      list.push(...syn[s]);
    }
    addToList(en, masterList[en]?.bn, list);
  }
}

const outputDir = path.join(__dirname, "..", "data", "en");

// create output directory if not exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// clear output directory
fs.readdirSync(outputDir).forEach((file) => {
  fs.unlinkSync(path.join(outputDir, file));
});

const allEnglishWords = Object.keys(masterList).sort();
console.log("Writing to files...");

// write to file
const filePath = path.join(outputDir, "words.json");
console.log(`Total words: ${allEnglishWords.length}`);
fs.writeFileSync(filePath, JSON.stringify(allEnglishWords, null, 2));

const numberKey = "number";
const specialKey = "special";

// group by first letter
const groupedWords = Object.values(masterList).reduce((acc, word) => {
  let firstLetter = word.en[0];
  if (firstLetter.match(/[0-9]/)) {
    firstLetter = numberKey;
  } else if (!firstLetter.match(/[a-z]/)) {
    firstLetter = specialKey;
  }
  if (!acc[firstLetter]) {
    acc[firstLetter] = [];
  }
  acc[firstLetter].push(word);
  return acc;
}, {} as { [key: string]: ListItem[] });

// write each group to a file
Object.keys(groupedWords).forEach((letter) => {
  const filePath = path.join(outputDir, `${letter}.json`);
  const words = groupedWords[letter];
  console.log(`${letter}: ${words.length}`);
  fs.writeFileSync(filePath, JSON.stringify(words, null, 2));
});

// also write all words to a file
const masterPath = path.join(outputDir, "all.json");
fs.writeFileSync(masterPath, JSON.stringify(masterList, null, 2));
