import { promises as fs } from "fs";
import path from "path";

var config: any;

export async function initConfig() {
  const data = await fs.readFile(
    path.join(__dirname + "/../config.json"),
    "utf8"
  );
  config = JSON.parse(data);
  return config;
}

export function getConfig() {
  return config;
}

export function setConfig(path: string, val: string) {
  const splitPath = path.split(".").reverse();
  let ref = config;
  while (splitPath.length > 1) {
    const key = splitPath.pop();
    if (key) {
      if (!ref[key]) {
        ref[key] = {};
      }
      ref = ref[key];
    } else {
      return;
    }
  }

  const key = splitPath.pop();
  if (key) {
    ref[key] = val;
  }
}

export function saveConfig() {
  fs.writeFile(
    path.join(__dirname + "/../config.json"),
    JSON.stringify(config, null, 2)
  );
}
