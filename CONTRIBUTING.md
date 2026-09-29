# Contributing to Ollama Explorer

Thank you for your interest in contributing to Ollama Explorer! We welcome contributions from everyone.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Guidelines](#coding-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

---

## 🤝 Code of Conduct

Please be respectful and constructive in all interactions. We aim to maintain a welcoming and inclusive community.

---

## 💡 How Can I Contribute?

### Reporting Bugs

1. Check [existing issues](https://github.com/serkan-uslu/ollama-explorer/issues) to avoid duplicates
2. Use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) template
3. Provide clear steps to reproduce
4. Include screenshots if applicable

### Suggesting Features

1. Check [existing feature requests](https://github.com/serkan-uslu/ollama-explorer/issues?q=is%3Aissue+label%3Aenhancement)
2. Use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) template
3. Explain the use case and motivation
4. Consider proposing alternative solutions

### Submitting Code

1. Look for [Good First Issues](https://github.com/serkan-uslu/ollama-explorer/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
2. Fork the repository
3. Create a feature branch
4. Make your changes
5. Submit a pull request

---

## 🛠 Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/serkan-uslu/ollama-explorer.git
cd ollama-explorer

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command          | Description               |
| ---------------- | ------------------------- |
| `npm run dev`    | Start development server  |
| `npm run build`  | Build for production      |
| `npm run start`  | Start production server   |
| `npm run lint`   | Run ESLint                |
| `npm run format` | Format code with Prettier |

---

## 📁 Project Structure

```
ollama-explorer/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── models/             # Model pages
│   └── opengraph-image.tsx # OG image generator
│
├── components/
│   ├── ui/atoms/           # Basic UI elements
│   ├── ui/molecules/       # Composite components
│   ├── features/           # Feature components
│   └── templates/          # Layout templates
│
├── lib/
│   ├── data/               # Data access layer
│   ├── types/              # TypeScript types
│   ├── hooks/              # Custom React hooks
│   └── utils/              # Utility functions
│
└── public/
    └── data/               # Schema-v2 catalog and per-model detail files
```

### Component Architecture

We follow **Atomic Design** principles:

- **Atoms**: Basic UI elements (Button, Input, Badge)
- **Molecules**: Composite components (SearchInput, FilterChip)
- **Organisms**: Complex components (ModelFilters, ModelCard)
- **Templates**: Layout templates (BrowseLayout, DetailLayout)
- **Pages**: Complete page compositions

**Rule**: Components may only import from the same or lower levels.

---

## 📐 Coding Guidelines

### TypeScript

- Use TypeScript for all new files
- Define proper types in `lib/types/`
- Avoid `any` - use proper typing or `unknown`
- Enable strict mode in `tsconfig.json`

### React & Next.js

- Use functional components with hooks
- Prefer Server Components by default
- Use `'use client'` only when necessary
- Follow App Router conventions
- Use `<Link>` for internal navigation

### Styling

- Use Tailwind CSS utility classes
- Follow existing color palette and spacing
- Use `cn()` utility for conditional classes
- Maintain responsive design (mobile-first)

### Code Style

- Use Prettier for formatting (`npm run format`)
- Follow ESLint rules (`npm run lint`)
- Write self-documenting code
- Comment complex logic only
- Keep functions small and focused

### File Naming

- Components: PascalCase (e.g., `ModelCard.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Hooks: camelCase with `use` prefix (e.g., `useFilters.ts`)
- Types: PascalCase (e.g., `Model.ts`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `MAX_RESULTS`)

### Performance

- Use static generation where possible
- Implement proper loading states
- Optimize images and assets
- Use React.memo for expensive renders
- Implement debouncing for search/filter inputs

---

## 📝 Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples

```bash
feat(filters): add model family filter

Fixes #123

feat(models): add source-backed modality filter
feat(ui): improve mobile filter responsiveness

fix(search): correct Fuse.js scoring algorithm
fix(types): resolve Model interface conflicts

docs(readme): update setup instructions
docs(miner): clarify authorized refresh workflow
```

### Commit Hooks

This project uses Husky + lint-staged to enforce code quality:

```bash
# Runs before each commit
- Prettier format
- ESLint fix
- Type check
```

---

## 🔀 Pull Request Process

### Before Submitting

1. **Update documentation** if you've changed functionality
2. **Add tests** for new features or bug fixes
3. **Update types** if you've changed interfaces
4. **Run linter** and fix any issues (`npm run format && npm run lint`)
5. **Test locally** (`npm run dev`)
6. **Rebase** your branch on the latest `main`

### Submitting a PR

1. Use the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md)
2. Fill in all applicable sections
3. Link related issues
4. Add screenshots for UI changes
5. Request review from maintainers

### PR Review Process

1. Automated checks must pass
2. At least one maintainer approval required
3. Address review comments promptly
4. Keep the PR focused and small if possible
5. Squash commits if needed before merge

### Getting Feedback

- Be responsive to review comments
- Ask questions if anything is unclear
- Suggest alternatives if you disagree
- Keep the discussion constructive

---

## 🐛 Reporting Issues

### Before Reporting

1. Search [existing issues](https://github.com/serkan-uslu/ollama-explorer/issues)
2. Check if it's a known limitation
3. Try to reproduce in a clean environment
4. Gather relevant information

### Issue Template

Use the appropriate template:

- **Bug Report**: For reproducible bugs
- **Feature Request**: For new functionality
- **Question**: For general inquiries

### Providing Good Bug Reports

A good bug report includes:

- **Clear title** summarizing the issue
- **Steps to reproduce** the bug
- **Expected behavior**
- **Actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, browser, version)
- **Additional context** (logs, error messages)

---

## 🎯 Areas Where We Need Help

We're looking for contributions in these areas:

### High Priority

- 📊 **Source accuracy**
  - Reproducible parser fixtures for Ollama index, detail, and tag pages
  - Corrections backed by an official source URL
  - Catalog invariants, fail-closed checks, and deterministic output

- 🎨 **Discovery UX**
  - Keyboard and screen-reader fixes
  - Clearer task, availability, memory, and variant selection
  - Mobile behavior that preserves desktop search and sort semantics

- ⚡ **Performance**
  - Keep detail records out of client JavaScript
  - Reduce bundle size and improve Core Web Vitals with measured evidence

### Documentation and tests

- Explain source provenance, unknown values, and memory-estimate limits
- Add focused regressions for search, filters, URLs, redirects, and command copy
- Keep feature claims aligned with [`FEATURES.md`](FEATURES.md)

Benchmarks, local Ollama integration, license normalization, history, favorites, semantic search,
public APIs, accounts, localization, and additional registries are deferred. Propose them only with
the evidence and entry conditions listed on the roadmap. AI enrichment, a runtime backend, a vector
database, a new orchestrator, ratings/reviews, and list virtualization are currently out of scope.

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

## 💬 Questions?

- Open a [Discussion](https://github.com/serkan-uslu/ollama-explorer/discussions)
- Ask in a [GitHub Issue](https://github.com/serkan-uslu/ollama-explorer/issues)
- Check existing [Documentation](README.md)

---

**Happy Contributing! 🚀**
