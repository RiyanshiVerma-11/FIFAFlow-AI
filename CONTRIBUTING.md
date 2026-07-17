# Contributing to FIFAFlow AI

Thank you for your interest in contributing to the **FIFAFlow AI** platform — a GenAI-enabled solution for FIFA World Cup 2026 stadium operations.

## Getting Started

1. **Fork & Clone** the repository.
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Insert your **Google Gemini API key** in `.env`.
4. Launch with Docker Compose:
   ```bash
   docker-compose up --build
   ```

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `backend/app/core/` | Configuration, database, security, event engine, observability |
| `backend/app/models/` | SQLAlchemy ORM model definitions |
| `backend/app/schemas/` | Pydantic request/response validation schemas |
| `backend/app/services/` | Gemini AI, route optimization, telemetry simulator |
| `backend/app/routes/` | FastAPI REST endpoint handlers |
| `frontend/src/` | React + TypeScript UI with Vite |
| `tests/` | Pytest test suite |

## Code Style Guidelines

- **Python**: Follow PEP 8. Use type hints on all function signatures. Add docstrings to all public modules, classes, and functions.
- **TypeScript/React**: Use functional components with hooks. Maintain proper `aria-*` attributes for accessibility.
- **Commits**: Use conventional commit messages (e.g., `feat:`, `fix:`, `test:`, `docs:`).

## Running Tests

```bash
# Backend tests
cd backend
pip install -r requirements.txt
pytest ../tests/ -v

# Frontend type checking
cd frontend
npm run build
```

## Submitting Changes

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes with tests.
3. Ensure all tests pass.
4. Submit a Pull Request with a clear description.

## Reporting Issues

Open a GitHub Issue with:
- Steps to reproduce
- Expected vs. actual behavior
- Environment details (OS, Python version, Docker version)

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
