from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from .catalog import MinerError, crawl, load_baseline, migrate_legacy, write_baseline


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build the Ollama Explorer v2 catalog")
    parser.add_argument("--repo-root", type=Path, default=_repo_root())
    parser.add_argument("--base-url", default=os.getenv("OLLAMA_BASE_URL", "https://ollama.com"))
    parser.add_argument(
        "--request-delay",
        type=float,
        default=float(os.getenv("OLLAMA_REQUEST_DELAY", "0.5")),
    )
    parser.add_argument("--timeout", type=float, default=30)
    parser.add_argument("--max-drop-percent", type=float, default=10)
    parser.add_argument("--summary-file", type=Path)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--fail-on-partial",
        action="store_true",
        help=(
            "fail before writing when a model is quarantined or its last-known-good "
            "detail must be preserved after a fetch failure"
        ),
    )
    parser.add_argument(
        "--force-refresh",
        action="store_true",
        help="refetch all detail/tag pages after a parser change",
    )
    parser.add_argument(
        "--migrate-legacy",
        type=Path,
        metavar="PATH",
        help="convert an explicitly supplied legacy catalog without network access",
    )
    return parser


def _write_summary(markdown: str, explicit: Path | None) -> None:
    destinations = [explicit] if explicit else []
    github_summary = os.getenv("GITHUB_STEP_SUMMARY")
    if github_summary and Path(github_summary) not in destinations:
        destinations.append(Path(github_summary))
    for path in destinations:
        if path is None:
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("a", encoding="utf-8") as output:
            output.write(markdown)


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    root = args.repo_root.resolve()
    try:
        if args.migrate_legacy:
            legacy_path = args.migrate_legacy
            if not legacy_path.is_absolute():
                legacy_path = root / legacy_path
            baseline = migrate_legacy(legacy_path)
            if not args.dry_run:
                write_baseline(root, baseline)
            markdown = (
                "## Ollama catalog legacy migration\n\n"
                f"- Models: **{len(baseline.catalog.models)}**\n"
                f"- Legacy redirects: **{len(baseline.legacy_ids)}**\n"
                f"- Written: **{'no (dry run)' if args.dry_run else 'yes'}**\n"
            )
        else:
            if os.getenv("OLLAMA_CRAWL_AUTHORIZED", "").lower() != "true":
                raise MinerError(
                    "set OLLAMA_CRAWL_AUTHORIZED=true only after confirming source permission"
                )
            before = load_baseline(root)
            candidate, diff = crawl(
                repo_root=root,
                base_url=args.base_url,
                delay=args.request_delay,
                timeout=args.timeout,
                user_agent=os.getenv("OLLAMA_MINER_USER_AGENT", "ollama-explorer-catalog/2.0"),
                token=os.getenv("OLLAMA_MINER_TOKEN"),
                max_drop_percent=args.max_drop_percent,
                force_refresh=args.force_refresh,
            )
            if args.fail_on_partial and (diff.quarantined or diff.preserved):
                raise MinerError(
                    "partial refresh rejected: "
                    f"{len(diff.quarantined)} quarantined, "
                    f"{len(diff.preserved)} preserved after fetch failure"
                )
            changed = candidate.catalog != before.catalog or candidate.details != before.details
            output_missing = not (root / "public/data/variant-index.json").exists()
            if (changed or output_missing) and not args.dry_run:
                write_baseline(root, candidate)
            markdown = diff.markdown(len(candidate.catalog.models))
            wrote = not args.dry_run and (changed or output_missing)
            markdown += f"- Written: **{'yes' if wrote else 'no'}**\n"
        print(markdown, end="")
        _write_summary(markdown, args.summary_file)
        return 0
    except (MinerError, OSError, ValueError) as error:
        print(f"ollama-miner: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
