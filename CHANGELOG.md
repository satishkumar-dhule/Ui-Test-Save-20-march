# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.0.0] - 2026-03-22

### Added

- Initial project setup with monorepo structure
- DevPrep application (`artifacts/devprep`)
- Content generation system (`content-gen`)
- E2E testing suite (`e2e`)
- Shared libraries (`lib/*`)
- Database layer with SQLite
- Redis caching with graceful degradation
- React Query data fetching
- Tailwind CSS styling system
- V2 documentation suite

### Features

- Content types: Questions, Flashcards, Exams, Voice, Coding
- Channel-based content organization
- User progress tracking
- Dashboard layout with widgets
- Theme system (Light, Dark, High Contrast)
- Performance monitoring utilities
- Lazy loading and code splitting

### Infrastructure

- Cloudflare Pages deployment
- Wrangler for deployment configuration
- Docker Compose for local development
- Bun as package manager
- TypeScript throughout
