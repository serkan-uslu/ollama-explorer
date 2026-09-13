import type { Capability, Complexity, Domain, SpeedTier, Model } from '@/lib/types/model';
import { normalizeCreatorOrg } from '@/lib/utils/normalize';
import type {
  FilterOptions,
  ParamSizeBucket,
  RamBucket,
  ContextWindowBucket,
} from '@/lib/types/filter';

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function deriveParamSizeBuckets(): ParamSizeBucket[] {
  return [
    { label: '≤ 1B', min: 0, max: 1 },
    { label: '1B – 4B', min: 1, max: 4 },
    { label: '4B – 14B', min: 4, max: 14 },
    { label: '14B – 35B', min: 14, max: 35 },
    { label: '35B+', min: 35, max: Infinity },
  ];
}

function deriveRamBuckets(): RamBucket[] {
  return [
    { label: '< 4 GB', min: 0, max: 4 },
    { label: '4 – 8 GB', min: 4, max: 8 },
    { label: '8 – 16 GB', min: 8, max: 16 },
    { label: '16 – 32 GB', min: 16, max: 32 },
    { label: '32 GB+', min: 32, max: Infinity },
  ];
}

function deriveContextWindowBuckets(): ContextWindowBucket[] {
  return [
    { label: '≤ 8K', min: 0, max: 8_001 },
    { label: '8K – 32K', min: 8_001, max: 32_001 },
    { label: '32K – 128K', min: 32_001, max: 128_001 },
    { label: '128K – 1M', min: 128_001, max: 1_000_001 },
    { label: '1M+', min: 1_000_001, max: Infinity },
  ];
}

export function deriveFilterOptions(models: Model[]): FilterOptions {
  return {
    capabilities: unique(models.flatMap((m) => m.capabilities)).sort() as Capability[],
    domains: unique(models.map((m) => m.domain).filter(Boolean)).sort() as Domain[],
    useCases: unique(models.flatMap((m) => m.use_cases)).sort(),
    complexities: unique(models.map((m) => m.complexity).filter(Boolean)).sort() as Complexity[],
    languages: unique(models.flatMap((m) => m.ai_languages).filter(Boolean)).sort(),
    speedTiers: unique(
      models.map((m) => m.speed_tier).filter((s): s is SpeedTier => s !== null),
    ).sort() as SpeedTier[],
    modelFamilies: unique(models.map((m) => m.model_family).filter((f): f is string => !!f)).sort(),
    creatorOrgs: unique(
      models.map((m) => normalizeCreatorOrg(m.creator_org)).filter((c): c is string => !!c),
    ).sort(),
    applications: unique(models.flatMap((m) => (m.applications ?? []).map((a) => a.name))).sort(),
    paramSizeBuckets: deriveParamSizeBuckets(),
    ramBuckets: deriveRamBuckets(),
    contextWindowBuckets: deriveContextWindowBuckets(),
  };
}
