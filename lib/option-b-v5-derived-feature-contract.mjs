/*
 * v5 keeps the frozen public-surface feature shape until Feature Contract v2
 * is authorized. This is a separate namespace so later feature work cannot
 * silently mutate v4 artifacts or the production contract.
 */
import {
  OPTION_B_V4_DERIVED_FEATURES,
  deriveOptionBV4Features,
  assertOptionBV4DerivedFeatures
} from "./option-b-v4-derived-feature-contract.mjs";

export const OPTION_B_V5_DERIVED_FEATURE_SCHEMA = "vibebench.option_b.v5_derived_feature_contract.v1";
export const OPTION_B_V5_DERIVED_FEATURES = Object.freeze([...OPTION_B_V4_DERIVED_FEATURES]);

export function deriveOptionBV5Features(payload) {
  return deriveOptionBV4Features(payload);
}

export function assertOptionBV5DerivedFeatures(features) {
  return assertOptionBV4DerivedFeatures(features);
}
