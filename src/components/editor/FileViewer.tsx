import { useMemo, useState, useCallback } from "react";
import { useFileStore, useActiveFile, type OpenFile } from "@/stores/fileStore";
import { Button } from "@/components/ui/button";
import * as fileService from "@/services/fileService";
import { formatFileSize, formatModifiedDate } from "@/lib/fileTypes";
import { FileQuestion, FileCode, Download } from "lucide-react";
import { CodeEditor } from "./CodeEditor";

// Image viewer for desktop
function ImageViewer({ file }: { file: OpenFile }) {
  const dataUrl = useMemo(() => {
    if (!file.content) return null;
    const mimeType = file.mimeType || "image/png";
    return `data:${mimeType};base64,${file.content}`;
  }, [file.content, file.mimeType]);

  const handleDownload = useCallback(() => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [dataUrl, file.name]);

  if (!dataUrl) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Unable to load image</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <span className="text-sm text-muted-foreground">
          {file.name} • {formatFileSize(file.size)}
        </span>
        <Button variant="ghost" size="sm" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
      {/* Image display */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto bg-muted/50">
        <img
          src={dataUrl}
          alt={file.name}
          className="max-w-full max-h-full object-contain shadow-lg"
          style={{ imageRendering: "auto" }}
        />
      </div>
    </div>
  );
}

// PDF viewer for desktop
function PdfViewer({ file }: { file: OpenFile }) {
  const dataUrl = useMemo(() => {
    if (!file.content) return null;
    return `data:application/pdf;base64,${file.content}`;
  }, [file.content]);

  const handleDownload = useCallback(() => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [dataUrl, file.name]);

  if (!dataUrl) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Unable to load PDF</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <span className="text-sm text-muted-foreground">
          {file.name} • {formatFileSize(file.size)}
        </span>
        <Button variant="ghost" size="sm" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
      {/* PDF display */}
      <iframe
        src={dataUrl}
        className="flex-1 w-full border-0"
        title={file.name}
      />
    </div>
  );
}

// Binary file info viewer for desktop
function BinaryViewer({ file, onForceEdit }: { file: OpenFile; onForceEdit: () => void }) {
  const handleDownload = useCallback(async () => {
    try {
      // Read file as binary for download
      const result = await fileService.readFileBinary(file.path);
      const byteString = atob(result.content);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: file.mimeType || "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download file:", error);
    }
  }, [file.path, file.name, file.mimeType]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <FileQuestion className="w-20 h-20 text-muted-foreground/40 mb-6" />
      <h3 className="text-xl font-medium mb-2">{file.name}</h3>
      <p className="text-muted-foreground mb-6">
        This file type cannot be previewed as text
      </p>

      <div className="bg-muted rounded-lg p-6 w-full max-w-md mb-8">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-left">
            <span className="text-muted-foreground">File Size</span>
            <p className="font-medium">{formatFileSize(file.size)}</p>
          </div>
          <div className="text-left">
            <span className="text-muted-foreground">Last Modified</span>
            <p className="font-medium">{formatModifiedDate(file.modified)}</p>
          </div>
          <div className="text-left col-span-2">
            <span className="text-muted-foreground">MIME Type</span>
            <p className="font-medium">{file.mimeType || "Unknown"}</p>
          </div>
          <div className="text-left col-span-2">
            <span className="text-muted-foreground">Path</span>
            <p className="font-medium text-xs truncate">{file.path}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        <Button variant="secondary" onClick={onForceEdit}>
          <FileCode className="w-4 h-4 mr-2" />
          Force Edit as Text
        </Button>
      </div>
    </div>
  );
}

export function FileViewer() {
  const activeFile = useActiveFile();
  const updateFileContent = useFileStore((state) => state.updateFileContent);
  const [forceTextEdit, setForceTextEdit] = useState<string | null>(null);

  const handleForceEdit = useCallback(async () => {
    if (!activeFile) return;
    try {
      const result = await fileService.readFile(activeFile.path);
      updateFileContent(activeFile.path, result.content);
      setForceTextEdit(activeFile.path);
    } catch (error) {
      console.error("Failed to read file as text:", error);
    }
  }, [activeFile, updateFileContent]);

  if (!activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/20">
        <div className="text-center">
          <p className="text-lg mb-2">No file open</p>
          <p className="text-sm">Double-click a file in the explorer to open it</p>
        </div>
      </div>
    );
  }

  const fileType = activeFile.fileType || "text";
  const isForceEditing = forceTextEdit === activeFile.path;

  // Text files or force editing - use Monaco editor
  if (isForceEditing || fileType === "text") {
    return <CodeEditor />;
  }

  // Image files
  if (fileType === "image") {
    return <ImageViewer file={activeFile} />;
  }

  // PDF files
  if (fileType === "pdf") {
    return <PdfViewer file={activeFile} />;
  }

  // Binary/unknown files
  return <BinaryViewer file={activeFile} onForceEdit={handleForceEdit} />;
}
