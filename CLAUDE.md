# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is GoTTY?

GoTTY is a command-line tool that turns your CLI tools into web applications. It uses xterm.js for the web-based terminal and WebSocket for real-time communication between the browser and the command.

## Common Commands

```bash
# Build the binary
make

# Build with development mode (enables webpack development mode)
DEV=1 make

# Build frontend assets only
make assets

# Run tests (includes go fmt check + go test)
make test

# Run a single test
go test -v ./path/to/package -run TestName

# Clean build artifacts
make clean
```

## Architecture

GoTTY has a simple architecture with three main components:

### Backend (Go)
- **`main.go`**: Entry point, CLI argument parsing using urfave/cli, signal handling
- **`server/`**: HTTP server that serves static files and handles WebSocket connections for terminal I/O
- **`backend/localcommand`**: Executes the target command with a PTY, handles process lifecycle
- **`webtty/`**: Terminal protocol handling - encodes/decodes messages between WebSocket and PTY

### Frontend (TypeScript/React + xterm.js)
- **`js/src/`**: TypeScript source files
- **`js/src/webtty.tsx`**: WebSocket client that connects to the server
- **`js/src/xterm.tsx`**: Terminal UI using xterm.js
- **`resources/`**: Source files for static assets (CSS, fonts, index.html)

### Asset Pipeline
- Frontend assets are built with webpack in `js/` directory
- Built assets are copied to `bindata/` directory
- `bindata/bindata.go` embeds all static files into the binary using go-bindata

## Configuration

- Default config file: `~/.gotty`
- Repository contains an example config at [`.gotty`](.gotty)
- All config options can be overridden via CLI flags

## Key Design Notes

- Each client connection spawns a new process with the given command
- WebSocket is used for bidirectional communication between browser and server
- The server uses gorilla/websocket for WebSocket handling
- PTY (pseudo-terminal) is created using the creack/pty library