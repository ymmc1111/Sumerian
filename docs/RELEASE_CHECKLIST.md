# Release Checklist

## Pre-Release Tasks
- [ ] Verify version number in `package.json`
- [ ] Update `CHANGELOG.md` with new features and fixes
- [ ] Run all unit tests: `npm test`
- [ ] Run all E2E tests: `npx playwright test`
- [ ] Run linting: `npm run lint`
- [ ] Ensure all local changes are committed and pushed

## Build & Test
- [ ] Create production build for macOS: `npm run make`
- [ ] Create production build for Windows: `npm run make` (on Windows machine)
- [ ] Create production build for Linux: `npm run make` (on Linux machine)
- [ ] Install and run the production builds on target systems
- [ ] Verify Claude CLI integration works in production builds
- [ ] Verify Brave Mode functions correctly
- [ ] Check file system operations (read/write/delete) in production

## Distribution
- [ ] Upload artifacts to GitHub Releases
- [ ] Tag the commit with the version number (e.g., `v1.0.0`)
- [ ] Update documentation if necessary

## Post-Release
- [ ] Monitor for issues/feedback
- [ ] Prepare for next patch release
