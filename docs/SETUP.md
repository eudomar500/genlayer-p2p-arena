# Setup & first push

This guide takes you from cloning the repo to a working local development environment, and from a fresh clone to your first push to GitHub.

## 1. First push to GitHub (if you are the repo creator)

If you received this codebase as a folder (not as a clone), do this first.

### 1.1 Create the empty repo on GitHub

1. Go to https://github.com/new
2. Repository name: `genlayer-p2p-arena` (or your preferred name)
3. Set to **Private**
4. **Do not** initialize with README, .gitignore, or LICENSE -- we already have those
5. Click "Create repository"

GitHub will show you the empty repo URL, something like:
`https://github.com/YOUR_USERNAME/genlayer-p2p-arena.git`

### 1.2 Initialize and push from your local machine

```bash
cd /path/to/genlayer-p2p-arena   # where the folder is on your machine

# Initialize git
git init
git branch -M main

# Stage everything (the .gitignore already excludes secrets and build artifacts)
git add .

# First commit
git commit -m "Initial commit: project structure, Trade contract, docs, threat model"

# Connect to GitHub (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/genlayer-p2p-arena.git

# Push
git push -u origin main
```

If you use SSH instead of HTTPS, replace the remote URL with:
`git@github.com:YOUR_USERNAME/genlayer-p2p-arena.git`

### 1.3 Verify

Visit your repo URL on GitHub. You should see:
- Top-level `README.md` rendering with the project description
- `LICENSE`, `Taskfile.yaml`, `.gitignore` in root
- `contracts/Trade.py` in the contracts folder
- `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/FUTURE_FIAT_ESCROW.md` in docs

If the `.env` file shows up in your push, **stop, delete the file from the repo, and rotate any keys it may have contained**. Then re-push without it.

## 2. Local development environment

For new contributors (or you on a fresh machine).

### 2.1 Prerequisites

- Python 3.11+ (3.12 recommended)
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Task ([installation](https://taskfile.dev/installation/))
- Docker (for GenLayer Studio)

### 2.2 Install dependencies

```bash
git clone https://github.com/YOUR_USERNAME/genlayer-p2p-arena.git
cd genlayer-p2p-arena

task setup
```

This will:
- Install Python deps from `requirements.txt` (GenLayer SDK, test framework, etc.)
- Install Node deps in `frontend/`
- Install the GenLayer CLI globally (`npm install -g genlayer`)

### 2.3 Configure environment

```bash
cp .env.example .env
# Edit .env and set GENLAYER_NETWORK=localnet (the default)
```

For local development on Studio, you don't need a private key -- the built-in faucet provides funded accounts.

### 2.4 Start GenLayer Studio

```bash
task studio:up
```

This launches a local GenLayer network on Docker. The Studio UI is available at http://localhost:8080 by default.

### 2.5 Deploy and demo

```bash
task deploy:local       # deploys both factories to local Studio
task demo:happy-path    # runs an end-to-end trade with no dispute
```

The script will print the addresses of the deployed factories and the resulting Trade contract. Open the Studio UI to inspect the contract state visually.

## 3. VPS deployment (Contabo or similar)

If you're running the local development environment on your VPS (instead of your laptop), the steps are nearly identical with two notes:

1. **Docker for Studio.** Make sure Docker is installed and the user has permissions: `sudo usermod -aG docker $USER`.
2. **Port exposure.** If you want to access the Studio UI from your local browser, either tunnel via SSH (`ssh -L 8080:localhost:8080 user@vps`) or configure UFW to allow port 8080.

## 4. Daily workflow

```bash
# Pull latest
git pull

# Make changes to contracts...

# Lint and test before committing
task lint
task test
task test:security

# Format
task format

# Commit
git add .
git commit -m "feat: add reputation scoring to factory"
git push
```

## Troubleshooting

**`pnpm: command not found`** -> `npm install -g pnpm`

**`task: command not found`** -> Install Task from https://taskfile.dev/installation/

**`genlayer: command not found`** -> `task setup:genlayer` or manually `npm install -g genlayer`

**Studio won't start** -> Make sure Docker is running. Try `task studio:reset` to wipe state.

**Tests fail with `ModuleNotFoundError: genlayer`** -> Run `task setup:python`. If that fails, check your Python version is ≥3.11 with `python3 --version`.

**Integration tests timeout** -> LLM inference is slow. Increase test timeout in `pytest.ini` or run individual tests with `pytest tests/integration/test_x.py -v --timeout 300`.
