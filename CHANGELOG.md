# Change Log

All notable changes to the "pyformat" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.0.3] - 2026-11-17

- Security: upgrade `tmp` to 0.2.7 (fixes path traversal and symlink temporary-file advisories) and refresh all other dependencies to resolve Dependabot alerts.
- Fix: an absolute `python.pythonPath` is now used as-is instead of being joined onto the workspace folder path.

## [Unreleased]

- Initial release