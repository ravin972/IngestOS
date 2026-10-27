"""IngestOS Polars-backed AST Rule Validation Engine.

Architectural Invariants:
1. "Clean Rows Never Touch Disk" - valid rows are kept in-memory.
2. "Ephemeral Quarantine DLQ" - malformed rows are isolated into quarantine records with AST violations.
"""

import io
import re
import time
from typing import Any, Dict, List, Optional, Tuple, Union

import polars as pl


class ValidationResult:
    """Holds the deterministic results of AST rule validation."""

    def __init__(
        self,
        total_rows: int,
        valid_rows: List[Dict[str, Any]],
        quarantine_records: List[Dict[str, Any]],
        parse_time_ms: float,
    ):
        self.total_rows = total_rows
        self.valid_rows = valid_rows
        self.quarantine_records = quarantine_records
        self.parse_time_ms = parse_time_ms

    @property
    def valid_rows_count(self) -> int:
        return len(self.valid_rows)

    @property
    def quarantined_rows_count(self) -> int:
        return len(self.quarantine_records)


def validate_row_against_ast(
    row: Dict[str, Any],
    row_index: int,
    columns_spec: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Validate a single raw row dictionary against AST column specifications.

    Returns quarantine record dict if violations exist, else None.
    """
    violations: List[Dict[str, Any]] = []

    for col_name, rule in columns_spec.items():
        if not isinstance(rule, dict):
            continue

        raw_val = row.get(col_name)
        val_str = "" if raw_val is None else str(raw_val).strip()

        # Check Required
        if rule.get("required", False):
            if raw_val is None or val_str == "":
                violations.append({
                    "rule_id": rule.get("error_code", "ERR_REQUIRED_FIELD"),
                    "column": col_name,
                    "reason": rule.get("error_message", f"Column '{col_name}' is required."),
                    "value": raw_val,
                })
                continue

        # If value is empty and not required, skip further checks on this column
        if val_str == "":
            continue

        # Check Type
        col_type = str(rule.get("type", "")).lower()
        parsed_num: Optional[float] = None

        if col_type in ("integer", "int"):
            try:
                int(val_str)
                parsed_num = float(val_str)
            except ValueError:
                violations.append({
                    "rule_id": rule.get("error_code", "ERR_TYPE_INTEGER"),
                    "column": col_name,
                    "reason": rule.get("error_message", f"Column '{col_name}' must be an integer."),
                    "value": raw_val,
                })
                continue
        elif col_type in ("float", "number", "decimal"):
            try:
                parsed_num = float(val_str)
            except ValueError:
                violations.append({
                    "rule_id": rule.get("error_code", "ERR_TYPE_FLOAT"),
                    "column": col_name,
                    "reason": rule.get("error_message", f"Column '{col_name}' must be a numeric float."),
                    "value": raw_val,
                })
                continue

        # Check Numeric Bounds (min / max)
        if parsed_num is not None:
            if "min" in rule and parsed_num < float(rule["min"]):
                violations.append({
                    "rule_id": rule.get("error_code", "ERR_MIN_VALUE"),
                    "column": col_name,
                    "reason": rule.get("error_message", f"Column '{col_name}' value must be >= {rule['min']}."),
                    "value": raw_val,
                })
            if "max" in rule and parsed_num > float(rule["max"]):
                violations.append({
                    "rule_id": rule.get("error_code", "ERR_MAX_VALUE"),
                    "column": col_name,
                    "reason": rule.get("error_message", f"Column '{col_name}' value must be <= {rule['max']}."),
                    "value": raw_val,
                })

        # Check Regex AST Pattern
        if "regex" in rule:
            pattern = rule["regex"]
            try:
                if not re.search(pattern, val_str):
                    violations.append({
                        "rule_id": rule.get("error_code", "ERR_REGEX_MISMATCH"),
                        "column": col_name,
                        "reason": rule.get("error_message", f"Column '{col_name}' does not match pattern {pattern}."),
                        "value": raw_val,
                    })
            except re.error:
                # Malformed regex in rule ignored safely
                pass

    if violations:
        return {
            "row_index": row_index,
            "raw_payload": row,
            "validation_errors": violations,
            "is_resolved": False,
        }
    return None


def execute_validation_pipeline(
    raw_buffer: Union[bytes, io.BytesIO],
    rules_json: Optional[Dict[str, Any]] = None,
) -> ValidationResult:
    """Execute high-performance Polars ingestion and AST contract evaluation.

    Reads incoming CSV buffer, evaluates schema rules, separates valid in-memory rows
    from quarantined invalid records.
    """
    start_time = time.perf_counter()

    if isinstance(raw_buffer, bytes):
        buffer = io.BytesIO(raw_buffer)
    else:
        buffer = raw_buffer

    # Read CSV with string type preservation to safely inspect malformed formats without crash
    try:
        df = pl.read_csv(
            buffer,
            infer_schema_length=0,
            ignore_errors=True,
            truncate_ragged_lines=True,
        )
    except Exception:
        # Fallback for empty or corrupt files
        return ValidationResult(
            total_rows=0,
            valid_rows=[],
            quarantine_records=[],
            parse_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
        )

    records = df.to_dicts()
    total_rows = len(records)

    columns_spec = {}
    if rules_json:
        if "columns" in rules_json and isinstance(rules_json["columns"], dict):
            columns_spec = rules_json["columns"]
        elif isinstance(rules_json, dict):
            columns_spec = rules_json

    valid_rows: List[Dict[str, Any]] = []
    quarantine_records: List[Dict[str, Any]] = []

    for idx, row in enumerate(records, start=1):
        if not columns_spec:
            # If no rules contract specified, all rows pass into memory stream
            valid_rows.append(row)
            continue

        quarantine_item = validate_row_against_ast(row, idx, columns_spec)
        if quarantine_item:
            quarantine_records.append(quarantine_item)
        else:
            valid_rows.append(row)

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return ValidationResult(
        total_rows=total_rows,
        valid_rows=valid_rows,
        quarantine_records=quarantine_records,
        parse_time_ms=duration_ms,
    )
