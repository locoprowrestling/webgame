#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHEET_H = 96;
const FRAME_COUNT = 10;

function readPngSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') {
    throw new Error(`${filePath} is not a PNG`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

const charactersModule = await import(pathToFileURL(path.join(ROOT, 'src/characters.js')));
const failures = [];

for (const character of charactersModule.CHARACTERS) {
  const sheetPath = path.join(ROOT, 'Assets/players-web/spritesheets', `${character.id}.png`);
  const { width, height } = readPngSize(sheetPath);
  const expectedWidth = character.sheetW * FRAME_COUNT;
  const ok = width === expectedWidth && height === SHEET_H;
  const status = ok ? 'OK' : 'FAIL';
  console.log(`${status} ${character.id}: ${width}x${height}, expected ${expectedWidth}x${SHEET_H}`);
  if (!ok) {
    failures.push(character.id);
  }
}

if (failures.length) {
  console.error(`\nInvalid spritesheets: ${failures.join(', ')}`);
  process.exit(1);
}
