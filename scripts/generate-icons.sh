#!/bin/bash
# Generate PWA and app icons from source image
# Uses ImageMagick with high-quality anti-aliasing

set -e

SOURCE="aerowork.png"
PUBLIC_DIR="public"
TAURI_ICONS_DIR="src-tauri/icons"

# Check if source exists
if [ ! -f "$SOURCE" ]; then
    echo "Error: Source image '$SOURCE' not found"
    exit 1
fi

echo "Generating icons from $SOURCE..."

# Function to resize with high-quality anti-aliasing
resize_icon() {
    local size=$1
    local output=$2

    # Use Lanczos filter for best quality downscaling with anti-aliasing
    # Ensure RGBA output for Tauri compatibility
    convert "$SOURCE" \
        -filter Lanczos \
        -resize "${size}x${size}" \
        -unsharp 0.25x0.25+8+0.065 \
        -colorspace sRGB \
        -type TrueColorAlpha \
        -depth 8 \
        -quality 100 \
        PNG32:"$output"

    echo "Created: $output (${size}x${size})"
}

# PWA Icons (public folder)
echo ""
echo "=== PWA Icons ==="
resize_icon 192 "$PUBLIC_DIR/pwa-192x192.png"
resize_icon 512 "$PUBLIC_DIR/pwa-512x512.png"

# Apple Touch Icon
resize_icon 180 "$PUBLIC_DIR/apple-touch-icon.png"

# Favicon
resize_icon 32 "$PUBLIC_DIR/favicon-32x32.png"
resize_icon 16 "$PUBLIC_DIR/favicon-16x16.png"

# Generate ICO file (multi-size)
echo ""
echo "=== Favicon ICO ==="
convert "$SOURCE" \
    -filter Lanczos \
    \( -clone 0 -resize 16x16 \) \
    \( -clone 0 -resize 32x32 \) \
    \( -clone 0 -resize 48x48 \) \
    -delete 0 \
    -quality 100 \
    "$PUBLIC_DIR/favicon.ico"
echo "Created: $PUBLIC_DIR/favicon.ico (16x16, 32x32, 48x48)"

# Tauri Icons
echo ""
echo "=== Tauri Icons ==="
mkdir -p "$TAURI_ICONS_DIR"

# Standard sizes for Tauri
resize_icon 32 "$TAURI_ICONS_DIR/32x32.png"
resize_icon 128 "$TAURI_ICONS_DIR/128x128.png"
resize_icon 256 "$TAURI_ICONS_DIR/128x128@2x.png"
resize_icon 512 "$TAURI_ICONS_DIR/icon.png"

# Windows Store logos
resize_icon 30 "$TAURI_ICONS_DIR/Square30x30Logo.png"
resize_icon 44 "$TAURI_ICONS_DIR/Square44x44Logo.png"
resize_icon 71 "$TAURI_ICONS_DIR/Square71x71Logo.png"
resize_icon 89 "$TAURI_ICONS_DIR/Square89x89Logo.png"
resize_icon 107 "$TAURI_ICONS_DIR/Square107x107Logo.png"
resize_icon 142 "$TAURI_ICONS_DIR/Square142x142Logo.png"
resize_icon 150 "$TAURI_ICONS_DIR/Square150x150Logo.png"
resize_icon 284 "$TAURI_ICONS_DIR/Square284x284Logo.png"
resize_icon 310 "$TAURI_ICONS_DIR/Square310x310Logo.png"
resize_icon 50 "$TAURI_ICONS_DIR/StoreLogo.png"

# Windows ICO
echo ""
echo "=== Windows ICO ==="
convert "$SOURCE" \
    -filter Lanczos \
    \( -clone 0 -resize 16x16 \) \
    \( -clone 0 -resize 32x32 \) \
    \( -clone 0 -resize 48x48 \) \
    \( -clone 0 -resize 64x64 \) \
    \( -clone 0 -resize 128x128 \) \
    \( -clone 0 -resize 256x256 \) \
    -delete 0 \
    -quality 100 \
    "$TAURI_ICONS_DIR/icon.ico"
echo "Created: $TAURI_ICONS_DIR/icon.ico (16-256px)"

# macOS ICNS (if iconutil is available)
if command -v iconutil &> /dev/null; then
    echo ""
    echo "=== macOS ICNS ==="
    ICONSET_DIR="$TAURI_ICONS_DIR/icon.iconset"
    mkdir -p "$ICONSET_DIR"

    resize_icon 16 "$ICONSET_DIR/icon_16x16.png"
    resize_icon 32 "$ICONSET_DIR/icon_16x16@2x.png"
    resize_icon 32 "$ICONSET_DIR/icon_32x32.png"
    resize_icon 64 "$ICONSET_DIR/icon_32x32@2x.png"
    resize_icon 128 "$ICONSET_DIR/icon_128x128.png"
    resize_icon 256 "$ICONSET_DIR/icon_128x128@2x.png"
    resize_icon 256 "$ICONSET_DIR/icon_256x256.png"
    resize_icon 512 "$ICONSET_DIR/icon_256x256@2x.png"
    resize_icon 512 "$ICONSET_DIR/icon_512x512.png"
    resize_icon 1024 "$ICONSET_DIR/icon_512x512@2x.png"

    iconutil -c icns "$ICONSET_DIR" -o "$TAURI_ICONS_DIR/icon.icns"
    rm -rf "$ICONSET_DIR"
    echo "Created: $TAURI_ICONS_DIR/icon.icns"
else
    echo ""
    echo "Note: iconutil not available (macOS only), skipping .icns generation"
fi

echo ""
echo "=== Done! ==="
echo "All icons generated successfully."
