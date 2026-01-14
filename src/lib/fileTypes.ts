import type { FileType } from "@/stores/fileStore";

// Text file extensions
const TEXT_EXTENSIONS = new Set([
  // Programming languages
  "js", "jsx", "ts", "tsx", "mjs", "cjs",
  "py", "pyw", "pyi",
  "rb", "rake", "gemspec",
  "rs",
  "go",
  "java", "kt", "kts", "scala",
  "swift",
  "c", "cpp", "cc", "cxx", "h", "hpp", "hxx",
  "cs",
  "php",
  "pl", "pm",
  "lua",
  "r",
  "m", "mm", // Objective-C
  "asm", "s",
  "v", "vh", "sv", "svh", // Verilog/SystemVerilog
  "vhd", "vhdl",
  "zig",
  "nim",
  "cr", // Crystal
  "ex", "exs", // Elixir
  "erl", "hrl", // Erlang
  "hs", "lhs", // Haskell
  "ml", "mli", // OCaml
  "fs", "fsi", "fsx", // F#
  "clj", "cljs", "cljc", "edn", // Clojure
  "lisp", "cl", "el", // Lisp
  "scm", "ss", // Scheme
  "dart",
  "groovy", "gvy", "gy", "gsh",
  "ps1", "psm1", "psd1", // PowerShell

  // Web
  "html", "htm", "xhtml",
  "css", "scss", "sass", "less", "styl",
  "vue", "svelte", "astro",

  // Data/Config
  "json", "jsonc", "json5",
  "xml", "xsl", "xslt", "xsd", "dtd",
  "yaml", "yml",
  "toml",
  "ini", "cfg", "conf", "config",
  "env", "env.local", "env.development", "env.production",
  "properties",
  "plist",

  // Markup/Docs
  "md", "markdown", "mdx",
  "rst", "rest",
  "tex", "latex",
  "adoc", "asciidoc",
  "org",
  "txt", "text",
  "log",

  // Scripts/Shell
  "sh", "bash", "zsh", "fish", "ksh", "csh", "tcsh",
  "bat", "cmd",
  "awk", "sed",

  // Database
  "sql", "mysql", "pgsql", "sqlite",
  "prisma",

  // Build/DevOps
  "dockerfile",
  "makefile", "mk",
  "cmake",
  "gradle",
  "rake",
  "vagrantfile",
  "jenkinsfile",
  "bazel", "bzl",

  // Other text
  "csv", "tsv",
  "graphql", "gql",
  "proto", // Protocol Buffers
  "thrift",
  "avsc", // Avro
  "lock", // package-lock, yarn.lock, etc.
  "editorconfig",
  "gitignore", "gitattributes", "gitmodules",
  "npmrc", "nvmrc", "yarnrc",
  "eslintrc", "prettierrc", "stylelintrc",
  "babelrc",
]);

// Image file extensions
const IMAGE_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "bmp", "ico", "svg",
  "tiff", "tif", "avif", "heic", "heif",
]);

// PDF extension
const PDF_EXTENSIONS = new Set(["pdf"]);

// Get file extension from path
export function getFileExtension(path: string): string {
  const name = path.split("/").pop() || "";

  // Handle special filenames without extension
  const lowerName = name.toLowerCase();
  if (lowerName === "dockerfile" || lowerName === "makefile" ||
      lowerName === "vagrantfile" || lowerName === "jenkinsfile" ||
      lowerName === "rakefile" || lowerName === "gemfile" ||
      lowerName === "procfile" || lowerName === "brewfile") {
    return lowerName;
  }

  // Handle dotfiles
  if (name.startsWith(".") && !name.includes(".", 1)) {
    return name.slice(1).toLowerCase(); // .gitignore -> gitignore
  }

  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ext;
}

// Determine file type from path
export function getFileType(path: string): FileType {
  const ext = getFileExtension(path);

  if (TEXT_EXTENSIONS.has(ext)) {
    return "text";
  }

  if (IMAGE_EXTENSIONS.has(ext)) {
    return "image";
  }

  if (PDF_EXTENSIONS.has(ext)) {
    return "pdf";
  }

  return "binary";
}

// Get MIME type from extension
export function getMimeType(path: string): string {
  const ext = getFileExtension(path);

  const mimeTypes: Record<string, string> = {
    // Images
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    ico: "image/x-icon",
    tiff: "image/tiff",
    tif: "image/tiff",
    avif: "image/avif",
    heic: "image/heic",
    heif: "image/heif",

    // PDF
    pdf: "application/pdf",

    // Text
    html: "text/html",
    htm: "text/html",
    css: "text/css",
    js: "application/javascript",
    json: "application/json",
    xml: "application/xml",
    txt: "text/plain",
    md: "text/markdown",
    csv: "text/csv",
  };

  return mimeTypes[ext] || "application/octet-stream";
}

// Check if file is likely text (for force edit feature)
export function isLikelyTextContent(content: string): boolean {
  if (!content || content.length === 0) return true;

  // Check first 1000 characters for binary indicators
  const sample = content.slice(0, 1000);

  // Count null bytes and other control characters
  let binaryCount = 0;
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i);
    // Null byte or other control chars (except common ones like newline, tab, carriage return)
    if (code === 0 || (code < 32 && code !== 9 && code !== 10 && code !== 13)) {
      binaryCount++;
    }
  }

  // If more than 10% binary characters, probably not text
  return binaryCount / sample.length < 0.1;
}

// Format file size for display
export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null) return "Unknown";

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// Format timestamp for display
export function formatModifiedDate(timestamp?: number): string {
  if (!timestamp) return "Unknown";

  const date = new Date(timestamp * 1000); // Assuming Unix timestamp in seconds
  return date.toLocaleString();
}

// Map file extensions to Prism language identifiers (for mobile syntax highlighting)
export function getLanguageFromPath(path: string): string {
  const ext = getFileExtension(path);

  const languageMap: Record<string, string> = {
    js: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    pyw: "python",
    pyi: "python",
    rb: "ruby",
    rake: "ruby",
    rs: "rust",
    go: "go",
    java: "java",
    kt: "kotlin",
    kts: "kotlin",
    scala: "scala",
    swift: "swift",
    c: "c",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    h: "c",
    hpp: "cpp",
    hxx: "cpp",
    cs: "csharp",
    php: "php",
    pl: "perl",
    pm: "perl",
    lua: "lua",
    r: "r",
    html: "html",
    htm: "html",
    xhtml: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",
    json: "json",
    jsonc: "json",
    json5: "json5",
    xml: "xml",
    xsl: "xml",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    markdown: "markdown",
    mdx: "mdx",
    sql: "sql",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    fish: "bash",
    ps1: "powershell",
    dockerfile: "docker",
    toml: "toml",
    ini: "ini",
    cfg: "ini",
    vue: "vue",
    svelte: "svelte",
    graphql: "graphql",
    gql: "graphql",
    proto: "protobuf",
    makefile: "makefile",
    cmake: "cmake",
    gradle: "groovy",
    groovy: "groovy",
    dart: "dart",
    zig: "zig",
    nim: "nim",
    ex: "elixir",
    exs: "elixir",
    erl: "erlang",
    hs: "haskell",
    ml: "ocaml",
    fs: "fsharp",
    clj: "clojure",
    lisp: "lisp",
    tex: "latex",
    latex: "latex",
  };

  return languageMap[ext] || "text";
}

// Map file extensions to Monaco editor language identifiers
export function getMonacoLanguage(path: string): string {
  const ext = getFileExtension(path);

  const languageMap: Record<string, string> = {
    js: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    pyw: "python",
    pyi: "python",
    rb: "ruby",
    rake: "ruby",
    rs: "rust",
    go: "go",
    java: "java",
    kt: "kotlin",
    kts: "kotlin",
    scala: "scala",
    swift: "swift",
    c: "c",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    h: "c",
    hpp: "cpp",
    hxx: "cpp",
    cs: "csharp",
    php: "php",
    pl: "perl",
    pm: "perl",
    lua: "lua",
    r: "r",
    html: "html",
    htm: "html",
    xhtml: "html",
    css: "css",
    scss: "scss",
    sass: "scss",
    less: "less",
    json: "json",
    jsonc: "json",
    json5: "json",
    xml: "xml",
    xsl: "xml",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    markdown: "markdown",
    mdx: "markdown",
    sql: "sql",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    fish: "shell",
    ps1: "powershell",
    dockerfile: "dockerfile",
    toml: "ini",
    ini: "ini",
    cfg: "ini",
    vue: "html",
    svelte: "html",
    graphql: "graphql",
    gql: "graphql",
    makefile: "makefile",
    cmake: "cmake",
    gradle: "groovy",
    groovy: "groovy",
    dart: "dart",
    ex: "elixir",
    exs: "elixir",
    hs: "haskell",
    ml: "fsharp",
    fs: "fsharp",
    fsx: "fsharp",
    clj: "clojure",
    tex: "latex",
    latex: "latex",
  };

  return languageMap[ext] || "plaintext";
}
