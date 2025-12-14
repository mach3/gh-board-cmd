#!/usr/bin/env node

const cp = require("node:child_process");
const fs = require("node:fs");
const process = require("node:process");
const { parseArgs } = require("node:util");

const HELP_MESSAGE = `
Usage: gh-board <owner> <project> [options]

GitHub Project のボード情報を取得して表示する

Arguments:
  owner                  オーナー名（ユーザー名または組織名）
  project                プロジェクト番号

Options:
  -s, --save <file>      取得したデータをJSONファイルに保存
  -l, --load <file>      JSONファイルからデータを読み込み
  -h, --help             ヘルプを表示

Examples:
  gh-board myorg 1
  gh-board myorg 1 --save data.json
  gh-board myorg 1 --load data.json
`.trim();

function showHelp() {
  console.log(HELP_MESSAGE);
}

const {
  options,
  positional: [owner, project],
} = (() => {
  const args = parseArgs({
    args: process.argv.slice(2),
    options: {
      save: {
        type: "string",
        short: "s",
      },
      load: {
        type: "string",
        short: "l",
      },
      help: {
        type: "boolean",
        short: "h",
      },
    },
    allowPositionals: true,
  });
  if (args.values.help) {
    showHelp();
    process.exit(0);
  }
  if (args.positionals.length < 2) {
    showHelp();
    process.exit(1);
  }
  return {
    options: args.values,
    positional: args.positionals,
  };
})();

async function exec(command) {
  return new Promise((resolve, reject) => {
    cp.exec(command, (error, stdout, _stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(JSON.parse(stdout));
    });
  });
}

function loadFromFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

function saveToFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

async function load() {
  if (options.load) {
    return loadFromFile(options.load);
  }
  const fieldListRes = await exec(
    `gh project field-list ${project} --owner ${owner} --format json`,
  );
  const statusList = fieldListRes.fields
    .find((f) => f.name === "Status")
    .options.filter((s) => !["Backlog", "Done"].includes(s.name));
  const initialRes = await exec(
    `gh project item-list ${project} --owner ${owner} --limit 1 --format json`,
  );
  const limit = initialRes.totalCount;
  const allItemsRes = await exec(
    `gh project item-list ${project} --owner ${owner} --limit ${limit} --format json`,
  );
  const data = statusList.map((status) => {
    return {
      status: status.name,
      items: allItemsRes.items
        .filter((item) => {
          return /[A-Z]+-\d+/.test(item.title) && item.status === status.name;
        })
        .sort((a, b) => {
          if (a.title < b.title) return -1;
          return 0;
        }),
    };
  });
  if (options.save) {
    saveToFile(options.save, data);
  }
  return data;
}

function mapStatusLabel(statusName) {
  switch (true) {
    case /To do/i.test(statusName):
      return "todo";
    case /In progress/i.test(statusName):
      return "wip";
    case /Review/i.test(statusName):
      return "in review";
    case /QA/i.test(statusName):
      return "qa";
    case /Wait/i.test(statusName):
      return "wait:";
    default:
      return "unknown";
  }
}

function parseFixVersion(milestone) {
  if (milestone) {
    const m = milestone.title.match(/(v\d+\.\d+)/);
    return m ? m[1] : undefined;
  }
}

function parsePriorityLabel(labels) {
  if (!labels) return;
  const pattern = /(low|high)/i;
  const m = JSON.stringify(labels).match(pattern);
  return m ? m[1] : undefined;
}

async function main() {
  const data = await load();
  const out = [];

  data.forEach((lane) => {
    const statusLabel = mapStatusLabel(lane.status);
    out.push(`## ${lane.status} (${lane.items.length})`);
    out.push("");
    lane.items.forEach((it) => {
      const fixVersion = parseFixVersion(it.milestone);
      const priority = parsePriorityLabel(it.labels);
      out.push(
        `- [${statusLabel}] ${priority ? `${priority} ` : ""}${it.title}${fixVersion ? ` (${fixVersion})` : ""}`,
      );
    });
    out.push("");
    out.push("");
  });

  console.log(out.join("\n"));
}

main();
