import { Injectable, Logger } from '@nestjs/common';
import { PersistenceStore, StoreData } from './store.interface';
import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_PATH = path.join(process.cwd(), 'data', 'state.json');

@Injectable()
export class JsonStore implements PersistenceStore {
  private readonly logger = new Logger(JsonStore.name);
  private readonly filePath: string;

  constructor() {
    this.filePath = process.env.DEVSIM_DATA_PATH || DEFAULT_PATH;
  }

  async load(): Promise<StoreData | null> {
    try {
      if (!fs.existsSync(this.filePath)) {
        this.logger.log(`No data file found at ${this.filePath}, starting fresh`);
        return null;
      }
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const data = JSON.parse(raw) as StoreData;
      this.logger.log(`Loaded state from ${this.filePath}`);
      return data;
    } catch (err) {
      this.logger.warn(`Failed to load state: ${err}`);
      return null;
    }
  }

  async save(data: StoreData): Promise<void> {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const json = JSON.stringify(data, null, 2);
      fs.writeFileSync(this.filePath, json, 'utf-8');
    } catch (err) {
      this.logger.error(`Failed to save state: ${err}`);
    }
  }
}
