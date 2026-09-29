export type Availability = 'local' | 'cloud' | 'both';
export type ModelStatus = 'active' | 'unlisted';
export type ModelCategory =
  | 'chat'
  | 'coding'
  | 'vision'
  | 'tools'
  | 'reasoning'
  | 'embedding'
  | 'audio';

export interface ModelParameter {
  raw: string;
  total_billion: number | null;
  active_billion: number | null;
}

export interface Variant {
  ref: string;
  tag: string;
  digest: string | null;
  availability: Exclude<Availability, 'both'>;
  download_size_bytes: number | null;
  parameter: ModelParameter | null;
  quantization: string | null;
  context_window: number | null;
  input_modalities: string[];
  source_updated_at: string | null;
  is_default: boolean;
}

export type VariantSummary = Variant;

export interface ModelSummary {
  slug: string;
  name: string;
  description: string;
  source_url: string;
  status: ModelStatus;
  availability: Availability;
  capabilities: string[];
  applications: string[];
  /** Deterministic task categories derived from source capabilities, applications and variants. */
  categories: ModelCategory[];
  /** Deterministic aggregate values across every exported variant. */
  input_modalities: string[];
  quantizations: string[];
  local_variant_count: number;
  cloud_variant_count: number;
  pulls: number | null;
  tag_count: number;
  source_updated_at: string | null;
  parameter_sizes: string[];
  min_download_size_bytes: number | null;
  max_download_size_bytes: number | null;
  max_context_window: number | null;
  default_variant: VariantSummary | null;
  smallest_local_variant: VariantSummary | null;
  cloud_variant: VariantSummary | null;
  family: string | null;
  license: string | null;
}

export interface ModelDetail extends ModelSummary {
  variants: Variant[];
}

export interface Catalog {
  schema_version: 2;
  generated_at: string;
  source: {
    name: 'ollama';
    url: string;
    model_count: number;
  };
  models: ModelSummary[];
}

export type LegacyIdMap = Record<string, string>;

export type BrowseSort = 'relevance' | 'popular' | 'updated' | 'smallest' | 'context' | 'name';
