# JavaScript Mastery for FAANG Interviews

A production-grade open-source book repository for mastering JavaScript deeply enough to explain, implement, debug, and defend it in senior engineering interviews.

This repository is designed as a real book project, not a notes dump. The source of truth is Markdown in `docs/`; examples live in `code/`; Mermaid diagrams live in `diagrams/`; publishable artifacts are generated into `website/`, `pdf/`, and `epub/`.

## Who This Book Is For

- Software engineers preparing for FAANG-style interviews.
- Backend, frontend, and full-stack developers who use JavaScript in production.
- University students who want rigorous explanations beyond syntax.
- Self learners who want a structured path from fundamentals to system-level JavaScript reasoning.

## Current Writing Status

The book is produced chapter by chapter. Volume 1 has eleven chapters with all eleven sections, through Modules and Execution Modes. Volume 2 now has four chapters with all eleven sections. The latest is [Chapter 4: Classes and Object Creation Patterns](docs/volume-2/chapter-04/01-introduction.md). The next planned chapter is **Descriptors, Immutability, and Proxies**.

| Area | Status |
| --- | --- |
| Repository structure | Complete |
| Build configuration | Complete |
| Book production standard | Complete |
| Six-volume table of contents | Complete |
| Volume 1, Chapters 1–11 | All eleven sections authored per chapter |
| Volume 2, Chapter 1: Lexical Scope and Closures | All eleven sections authored |
| Volume 2, Chapter 2: `this`, Call, Apply, and Bind | All eleven sections authored |
| Volume 2, Chapter 3: Prototypes and Inheritance | All eleven sections authored |
| Volume 2, Chapter 4: Classes and Object Creation Patterns | All eleven sections authored |
| Volume 2, Chapter 5: Descriptors, Immutability, and Proxies | Next planned chapter |
| Remaining Volume 2 chapters and Volumes 3–6 | Planned |
| Executable examples and Mermaid diagrams | Available alongside authored material |
| PDF/EPUB/website scripts | Ready |

## Volumes

1. JavaScript Fundamentals
2. Advanced JavaScript
3. Asynchronous JavaScript
4. Browser APIs and DOM
5. JavaScript Interview Mastery
6. Real World Projects

See [Table of Contents](docs/table-of-contents.md) for the full planned structure.

## Repository Layout

```text
javascript-mastery-book/
  docs/                  Book source
  code/                  Executable examples
  diagrams/              Mermaid diagrams
  cheatsheets/           Revision sheets
  interview-questions/   Interview question banks
  projects/              Production project specifications
  appendix/              Glossary and references
  scripts/               Build and validation scripts
  website/               Generated website output
  pdf/                   Generated PDF output
  epub/                  Generated EPUB output
```

## Local Development

Install dependencies:

```bash
npm install
```

Run the documentation website:

```bash
npm run docs:dev
```

Validate JavaScript examples:

```bash
npm run examples:test
npm run examples:validator:test
npm run docs:examples:test
```

Build all publishable formats:

```bash
npm run build:all
```

## Writing Rule

Every chapter must include introduction, objectives, prerequisites, theory, internals, memory diagrams, flowcharts, execution steps, production examples, interview explanation, mistakes, edge cases, performance notes, security notes, best practices, exercises, solutions, MCQs, revision sheet, summary, references, and further reading.

Nothing should be merged as a placeholder. A planned chapter is listed in the table of contents; a chapter file is created only when the chapter is ready to be written properly.
