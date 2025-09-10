import { Badge } from "@/components/ui/badge";
import type { DiffFile } from "@/lib/diff-parser";
import { cn } from "@/lib/utils";

interface DiffViewerProps {
  files: DiffFile[];
}

export const DiffViewer = ({ files }: DiffViewerProps) => {
  return (
    <div className="space-y-6">
      {files.map((file, fileIndex) => (
        <div key={fileIndex} className="border border-gray-200 rounded-lg overflow-hidden font-mono text-sm">
          {/* File Header */}
          <div className="flex items-center justify-between bg-gray-100 p-3 sm:p-4 border-b border-gray-200">
            <span className="font-semibold text-gray-800 break-all">{file.fileName}</span>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Badge variant="secondary" className="bg-green-100 text-green-800">+{file.added}</Badge>
              <Badge variant="secondary" className="bg-red-100 text-red-800">-{file.removed}</Badge>
            </div>
          </div>
          
          {/* Diff Content */}
          <pre className="p-0 text-xs sm:text-sm overflow-x-auto">
            {file.changes.map((line, lineIndex) => (
              <div
                key={lineIndex}
                className={cn(
                  "flex",
                  line.type === 'added' && "bg-green-50 text-green-900",
                  line.type === 'removed' && "bg-red-50 text-red-900",
                  line.type === 'unchanged' && "text-gray-600"
                )}
              >
                {/* Line Numbers */}
                <div className="flex-none w-14 sm:w-16 text-right px-2 sm:px-3 text-gray-400 bg-gray-50 border-r border-gray-200">
                  <span className="block">{line.oldLineNumber}</span>
                  <span className="block">{line.newLineNumber}</span>
                </div>
                {/* Line Content */}
                <div className="flex-1 px-2 sm:px-4 py-0.5 whitespace-pre-wrap break-all">
                  {line.content}
                </div>
              </div>
            ))}
          </pre>
        </div>
      ))}
    </div>
  );
};