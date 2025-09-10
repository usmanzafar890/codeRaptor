// src/lib/diff-parser.ts

export type DiffLine = {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
};

export type DiffFile = {
  fileName: string;
  added: number;
  removed: number;
  changes: DiffLine[];
};

/**
 * Parses a raw git diff string into a structured array of files and their changes.
 */
export function parseGitDiff(diffText: string): DiffFile[] {
  const files: DiffFile[] = [];
  const lines = diffText.split('\n');
  let currentFile: DiffFile | null = null;
  let oldLineNum = 0;
  let newLineNum = 0;
  
  for (const line of lines) {
    // New file header
    if (line.startsWith('diff --git')) {
      if (currentFile) {
        files.push(currentFile);
      }
      
      const fileNameMatch = line.match(/a\/(.*) b\/(.*)/);
      const fileName: string = (fileNameMatch && fileNameMatch[2]) ? fileNameMatch[2] : 'Unknown File';
      
      currentFile = {
        fileName,
        added: 0,
        removed: 0,
        changes: [],
      };
      
    } else if (line.startsWith('--- a/')) {
        // We can capture the original file path here if needed
    } else if (line.startsWith('+++ b/')) {
        // We can capture the new file path here if needed
    } else if (line.startsWith('@@')) {
      const hunkHeaderMatch = line.match(/@@ -(\d+),\d+ \+(\d+),\d+ @@/);
      if (hunkHeaderMatch) {
        oldLineNum = parseInt(hunkHeaderMatch[1]!, 10);
        newLineNum = parseInt(hunkHeaderMatch[2]!, 10);
      }
    } else if (currentFile) {
      if (line.startsWith('+')) {
        currentFile.changes.push({
          type: 'added',
          content: line,
          oldLineNumber: null,
          newLineNumber: newLineNum++,
        });
        currentFile.added++;
      } else if (line.startsWith('-')) {
        currentFile.changes.push({
          type: 'removed',
          content: line,
          oldLineNumber: oldLineNum++,
          newLineNumber: null,
        });
        currentFile.removed++;
      } else if (line.startsWith(' ')) {
        currentFile.changes.push({
          type: 'unchanged',
          content: line,
          oldLineNumber: oldLineNum++,
          newLineNumber: newLineNum++,
        });
      }
    }
  }

  // Push the last file after the loop ends
  if (currentFile) {
    files.push(currentFile);
  }

  return files;
}