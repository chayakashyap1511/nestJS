import * as fs from 'fs';
import { existsSync } from 'fs';

export function deleteFile(filePath: string): void {
  if (filePath && existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting file ${filePath}: ${err.message}`);
      }
    });
  }
}
