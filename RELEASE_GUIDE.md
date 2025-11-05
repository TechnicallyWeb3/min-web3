# Release Guide for Min Browser

This guide explains how to publish a new release of Min Browser.

## Prerequisites

1. **Update Version Number**
   - Edit `package.json` and update the `version` field (currently `1.33.1`)
   - Follow [semantic versioning](https://semver.org/):
     - `MAJOR.MINOR.PATCH` (e.g., `1.33.1` → `1.33.2` for patch, `1.34.0` for minor, `2.0.0` for major)

2. **Commit Changes**
   ```bash
   git add package.json
   git commit -m "Bump version to X.Y.Z"
   git tag vX.Y.Z
   git push origin master
   git push origin vX.Y.Z
   ```

## Release Methods

### Method 1: Using GitHub Actions (Recommended)

The project has a GitHub Actions workflow that builds packages for all platforms automatically.

1. **Trigger the Workflow**
   - Go to your GitHub repository
   - Navigate to **Actions** tab
   - Select **Build Package** workflow
   - Click **Run workflow**
   - Select the branch (usually `master` or `main`)
   - Click **Run workflow**

2. **Wait for Builds to Complete**
   - The workflow builds packages for:
     - Linux (Debian .deb)
     - Linux (RedHat .rpm)
     - Windows (.zip and .exe)
     - macOS Intel (.zip)
     - macOS ARM (.zip)

3. **Download Artifacts**
   - Once builds complete, download artifacts from the Actions run
   - Each platform will have its own artifact file

4. **Create GitHub Release**
   - Go to **Releases** → **Draft a new release**
   - Tag: `vX.Y.Z` (must match the version in package.json)
   - Title: `vX.Y.Z` or a descriptive title
   - Description: Add release notes describing changes
   - Upload all the build artifacts
   - Click **Publish release**

### Method 2: Manual Build (Local)

Build packages locally for specific platforms:

#### For Windows:
```bash
npm run buildWindows
```
Output: `dist/app/Min-vX.Y.Z-windows.zip` and installer in `dist/app/min-installer/`

#### For macOS Intel:
```bash
npm run buildMacIntel
```
Output: `dist/app/Min-vX.Y.Z-darwin-x64.zip`

#### For macOS ARM:
```bash
npm run buildMacArm
```
Output: `dist/app/Min-vX.Y.Z-darwin-arm64.zip`

#### For Linux Debian:
```bash
npm run buildDebian
```
Output: `dist/app/min-X.Y.Z-amd64.deb`

#### For Linux RedHat:
```bash
npm run buildRedhat
```
Output: `dist/app/min-X.Y.Z-x86_64.rpm`

#### For Linux AppImage:
```bash
npm run buildAppImage
```
Output: `dist/app/Min-vX.Y.Z.AppImage`

#### Build All Platforms:
```bash
npm run buildAll
```
**Note:** This requires running on different operating systems for each platform.

## Release Checklist

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` (if you have one) with release notes
- [ ] Test the application thoroughly
- [ ] Commit and tag the version
- [ ] Push commits and tags to GitHub
- [ ] Build packages (via GitHub Actions or manually)
- [ ] Create GitHub release with all artifacts
- [ ] Write release notes describing:
  - New features
  - Bug fixes
  - Breaking changes (if any)
  - Known issues

## Platform-Specific Requirements

### Windows
- Requires Visual Studio installed
- May need: `npm config set msvs_version 2019` (or appropriate version)

### macOS
- Requires Xcode and command-line tools
- May need to set SDK: `export SDKROOT=/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX11.1.sdk`

### Linux
- Standard build tools should be sufficient

## Post-Release

After publishing:
1. Verify all download links work
2. Update website/documentation if needed
3. Announce the release (Discord, social media, etc.)

## Troubleshooting

- **Build fails**: Check that all dependencies are installed (`npm install`)
- **Version mismatch**: Ensure version in `package.json` matches the git tag
- **Missing artifacts**: Re-run the build for that specific platform

