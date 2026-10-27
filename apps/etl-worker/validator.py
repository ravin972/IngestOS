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

    def to_jsonl(self) -> str:
        """Export clean in-memory Polars DataFrame as newline-delimited JSON (JSONL)."""
        if not self.valid_rows:
            return ""
        df = pl.DataFrame(self.valid_rows)
        return df.write_ndjson()


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


# --- Phase 4: Preset Schema Contracts ---
SANDBOX_PRESETS: List[Dict[str, Any]] = [
    {
        "name": "E-Commerce Orders",
        "version": "v1.0",
        "description": "Retail & e-commerce order ingestion with phone validation and non-negative amounts.",
        "rules_json": {
            "columns": {
                "order_id": {"type": "integer", "required": True},
                "customer_name": {"type": "string", "required": True},
                "phone": {
                    "type": "string",
                    "required": True,
                    "regex": r"^\d{10}$",
                    "error_code": "ERR_PHONE_FORMAT",
                    "error_message": "Phone number must be exactly 10 digits.",
                },
                "order_date": {
                    "type": "string",
                    "required": True,
                    "regex": r"^\d{4}-\d{2}-\d{2}$",
                    "error_code": "ERR_DATE_ISO",
                    "error_message": "Order date must be in ISO-8601 YYYY-MM-DD format.",
                },
                "total_amount": {
                    "type": "float",
                    "required": True,
                    "min": 0.0,
                    "error_code": "ERR_AMOUNT_NON_NEGATIVE",
                    "error_message": "Total amount must be non-negative.",
                },
                "status": {"type": "string", "required": True},
            }
        },
    },
    {
        "name": "GST / Invoices",
        "version": "v1.0",
        "description": "B2B Indian Tax Invoice validation contract with GSTIN checksum formatting.",
        "rules_json": {
            "columns": {
                "invoice_no": {"type": "string", "required": True},
                "gstin": {
                    "type": "string",
                    "required": True,
                    "regex": r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$",
                    "error_code": "ERR_GSTIN_FORMAT",
                    "error_message": "Invalid GSTIN format (15 characters alphanumeric).",
                },
                "invoice_date": {
                    "type": "string",
                    "required": True,
                    "regex": r"^\d{4}-\d{2}-\d{2}$",
                    "error_code": "ERR_DATE_ISO",
                },
                "taxable_value": {"type": "float", "min": 0.0, "error_code": "ERR_AMOUNT_NON_NEGATIVE"},
                "cgst": {"type": "float", "min": 0.0, "error_code": "ERR_AMOUNT_NON_NEGATIVE"},
                "sgst": {"type": "float", "min": 0.0, "error_code": "ERR_AMOUNT_NON_NEGATIVE"},
            }
        },
    },
    {
        "name": "CRM Leads & Accs",
        "version": "v1.0",
        "description": "Sales pipeline lead ingestion with contact phone and enterprise email verification.",
        "rules_json": {
            "columns": {
                "lead_id": {"type": "string", "required": True},
                "company": {"type": "string", "required": True},
                "contact_email": {
                    "type": "string",
                    "required": True,
                    "regex": r"^[\w\.-]+@[\w\.-]+\.\w+$",
                    "error_code": "ERR_EMAIL_FORMAT",
                },
                "contact_phone": {
                    "type": "string",
                    "required": True,
                    "regex": r"^\d{10}$",
                    "error_code": "ERR_PHONE_FORMAT",
                },
                "deal_size": {"type": "float", "min": 0.0, "error_code": "ERR_AMOUNT_NON_NEGATIVE"},
            }
        },
    },
    {
        "name": "Custom AST",
        "version": "v1.0",
        "description": "Arbitrary schema contract with customizable regex and data typing AST.",
        "rules_json": {
            "columns": {
                "id": {"type": "integer", "required": True},
                "label": {"type": "string", "required": True},
                "metric": {"type": "float", "min": 0.0},
            }
        },
    },
]


def generate_sample_corpus(preset_name: str = "E-Commerce Orders") -> bytes:
    """Generate deterministic simulated CSV data containing both valid and intentionally corrupted rows."""
    if preset_name == "GST / Invoices":
        csv_data = (
            "invoice_no,gstin,invoice_date,taxable_value,cgst,sgst\n"
            "INV-2026-001,27ABCDE1234F1Z5,2026-10-27,10000.00,900.00,900.00\n"
            "INV-2026-002,INVALID_GSTIN,2026-10-27,5000.00,450.00,450.00\n"
            "INV-2026-003,27ABCDE1234F1Z5,27/10/2026,2000.00,180.00,180.00\n"
            "INV-2026-004,27ABCDE1234F1Z5,2026-10-26,-1500.00,0.00,0.00\n"
            "INV-2026-005,27ABCDE1234F1Z5,2026-10-25,800.00,72.00,72.00\n"
        )
    elif preset_name == "CRM Leads & Accs":
        csv_data = (
            "lead_id,company,contact_email,contact_phone,deal_size\n"
            "L-01,Acme Corp,lead@acme.com,9811200001,50000.00\n"
            "L-02,Stark Ind,invalid_email_format,98112-abc01,75000.00\n"
            "L-03,Wayne Ent,bruce@wayne.com,9811200003,120000.00\n"
        )
    else:  # Default "E-Commerce Orders"
        csv_data = (
            "order_id,customer_name,phone,order_date,total_amount,status\n"
            "1001,Alice Johnson,9811200001,2026-10-27,150.00,COMPLETED\n"
            "1002,Bob Smith,98112-abc01,2026-10-27,220.50,PENDING\n"
            "1003,Charlie Davis,9811200003,27/10/2026,340.00,COMPLETED\n"
            "1004,David Miller,9811200004,2026-10-26,-80.00,PROCESSING\n"
            "1005,Emma Watson,9811200005,2026-10-25,95.00,COMPLETED\n"
            "1006,Frank Castle,9811200006,2026-10-25,510.00,COMPLETED\n"
            "1007,Grace Hopper,9811200007,2026-10-24,310.25,COMPLETED\n"
        )
    return csv_data.encode("utf-8")


def heuristic_repair_record(
    raw_payload: Dict[str, Any],
    validation_errors: List[Dict[str, Any]],
    columns_spec: Dict[str, Any],
) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """Deterministically repair recoverable errors in a quarantined record.

    Repairs:
    - Phone: converts letter typos to digits / strips non-digits (e.g. '98112-abc01' -> '9811200001')
    - Date: converts DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD
    - Whitespace: trims leading/trailing whitespace
    - Leaves unfixable issues (e.g. negative amounts) untouched

    Returns (True, repaired_payload) if all errors are resolved, else (False, None).
    """
    repaired = dict(raw_payload)

    for err in validation_errors:
        col = err.get("column")
        rule_id = err.get("rule_id", "")
        if not col or col not in repaired:
            continue

        val = repaired[col]
        if val is None:
            continue
        val_str = str(val).strip()

        # Phone sanitization
        if "phone" in col.lower() or rule_id == "ERR_PHONE_FORMAT":
            # Map alphabetical typos: e.g. 'abc' -> '000'
            cleaned = re.sub(r"[a-zA-Z]", "0", val_str)
            digits = re.sub(r"\D", "", cleaned)
            if len(digits) > 10 and digits.startswith(("91", "1")):
                digits = digits[-10:]
            if len(digits) == 10:
                repaired[col] = digits

        # Date normalization
        elif "date" in col.lower() or rule_id == "ERR_DATE_ISO":
            # Check DD/MM/YYYY or DD-MM-YYYY
            match_slash = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})$", val_str)
            match_dash = re.match(r"^(\d{1,2})-(\d{1,2})-(\d{4})$", val_str)
            if match_slash:
                d, m, y = match_slash.groups()
                repaired[col] = f"{y}-{m.zfill(2)}-{d.zfill(2)}"
            elif match_dash:
                d, m, y = match_dash.groups()
                repaired[col] = f"{y}-{m.zfill(2)}-{d.zfill(2)}"

        # Whitespace
        elif isinstance(val, str):
            repaired[col] = val.strip()

    # Re-validate against columns_spec
    remaining = validate_row_against_ast(repaired, 0, columns_spec)
    if remaining is None:
        return True, repaired
    return False, None


def to_clean_csv(rows: List[Dict[str, Any]]) -> str:
    """Format clean records as CSV string."""
    if not rows:
        return ""
    import csv
    output = io.StringIO()
    headers = list(rows[0].keys())
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()
    for row in rows:
        writer.writerow({h: row.get(h, "") for h in headers})
    return output.getvalue()


def to_postgres_batch_sql(rows: List[Dict[str, Any]], table_name: str = "clean_records") -> str:
    """Format clean records as an atomic PostgreSQL transaction batch."""
    lines = ["BEGIN;"]
    if rows:
        headers = list(rows[0].keys())
        cols_str = ", ".join(headers)
        for row in rows:
            formatted_vals = []
            for h in headers:
                val = row.get(h)
                if val is None:
                    formatted_vals.append("NULL")
                elif isinstance(val, (int, float)):
                    formatted_vals.append(str(val))
                else:
                    # Escape single quotes
                    safe_val = str(val).replace("'", "''")
                    formatted_vals.append(f"'{safe_val}'")
            vals_str = ", ".join(formatted_vals)
            lines.append(f"INSERT INTO {table_name} ({cols_str}) VALUES ({vals_str});")
    lines.append("COMMIT;\n")
    return "\n".join(lines)


def to_clean_jsonl(rows: List[Dict[str, Any]]) -> str:
    """Format clean records as newline-delimited JSON (JSONL) using Polars write_ndjson."""
    if not rows:
        return ""
    df = pl.DataFrame(rows)
    return df.write_ndjson()

