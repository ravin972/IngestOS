export interface SchemaPreset {
  name: string;
  version: string;
  description: string;
  rules_json: {
    columns: Record<
      string,
      {
        type: string;
        required?: boolean;
        regex?: string;
        min?: number;
        max?: number;
        error_code?: string;
        error_message?: string;
      }
    >;
  };
}

export interface IngestionJob {
  job_id: string;
  user_id?: string | null;
  contract_id?: string | null;
  filename: string;
  total_rows: number;
  valid_rows: number;
  quarantined_rows: number;
  parse_time_ms: number;
  status: "PROCESSING" | "COMPLETED" | "FAILED" | "PURGED";
  expires_at: string;
  created_at: string;
}

export interface ValidationError {
  rule_id: string;
  column: string;
  reason: string;
  value: any;
}

export interface QuarantineRecord {
  record_id: string;
  job_id: string;
  row_index: number;
  raw_payload: Record<string, any>;
  validation_errors: ValidationError[];
  is_resolved: boolean;
  resolved_value?: Record<string, any> | null;
  expires_at: string;
  updated_at: string;
}

export interface WebhookSink {
  sink_id: string;
  user_id: string;
  target_url: string;
  hmac_secret: string;
  retry_policy: string;
  dlq_enabled: boolean;
  created_at: string;
}

export interface HealthTelemetry {
  status: string;
  engine: string;
  runtime: string;
  timestamp: string;
}
