#!/bin/bash
# Android Post-Init Script
# Run this after `tauri android init` to configure cleartext traffic (ws://) support

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ANDROID_APP_DIR="$PROJECT_ROOT/src-tauri/gen/android/app/src/main"

echo "Configuring Android for cleartext traffic (ws://) support..."

# 1. Create network_security_config.xml
mkdir -p "$ANDROID_APP_DIR/res/xml"
cat > "$ANDROID_APP_DIR/res/xml/network_security_config.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Allow cleartext (ws://) for local network connections -->
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
EOF
echo "Created: res/xml/network_security_config.xml"

# 2. Modify AndroidManifest.xml
MANIFEST="$ANDROID_APP_DIR/AndroidManifest.xml"
if [ -f "$MANIFEST" ]; then
    # Check if already configured
    if grep -q "networkSecurityConfig" "$MANIFEST"; then
        echo "AndroidManifest.xml already configured, skipping..."
    else
        # Add networkSecurityConfig and usesCleartextTraffic="true"
        sed -i.bak 's|android:usesCleartextTraffic="\${usesCleartextTraffic}"|android:networkSecurityConfig="@xml/network_security_config"\n        android:usesCleartextTraffic="true"|' "$MANIFEST"
        rm -f "$MANIFEST.bak"
        echo "Modified: AndroidManifest.xml"
    fi
else
    echo "Error: AndroidManifest.xml not found at $MANIFEST"
    echo "Please run 'tauri android init' first."
    exit 1
fi

# 3. Copy app icons if they exist
ICONS_SRC="$PROJECT_ROOT/src-tauri/icons/android"
ICONS_DST="$ANDROID_APP_DIR/res"
if [ -d "$ICONS_SRC" ]; then
    echo "Copying Android icons..."
    for dir in mipmap-hdpi mipmap-mdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi; do
        if [ -d "$ICONS_SRC/$dir" ]; then
            cp -r "$ICONS_SRC/$dir" "$ICONS_DST/"
        fi
    done
    echo "Icons copied."
fi

echo ""
echo "Done! Android is now configured for ws:// connections."
echo "You can build with: bun run tauri android build --target aarch64"
