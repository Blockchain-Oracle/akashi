"""Registry of per-service schema specs + the `akashi-schemas` entry point."""

from pathlib import Path

from akashi_code.models import (
    CheckRequest,
    Diagnostic,
    PackageQuery,
    PackageResult,
    PackagesRequest,
    SymbolQuery,
    SymbolResult,
    SymbolsQuery,
    VersionsQuery,
    VersionsResult,
)
from akashi_code.router import router as code_router
from akashi_core.constants.app import SERVICE_CODE
from akashi_core.schema.cli import SchemaSpec, write_all

REPO_ROOT = Path(__file__).resolve().parents[4]
CARDS_DIR = REPO_ROOT / "cards"

SPECS = [
    SchemaSpec(
        service_id=SERVICE_CODE,
        title="Akashi Code Reality Check",
        results=[PackageResult, VersionsResult, SymbolResult, Diagnostic],
        requests=[PackageQuery, PackagesRequest, VersionsQuery, SymbolQuery, SymbolsQuery, CheckRequest],
        router=code_router,
    ),
]


def main() -> None:
    write_all(SPECS, CARDS_DIR)


if __name__ == "__main__":
    main()
