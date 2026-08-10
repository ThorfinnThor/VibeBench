import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { CANDIDATE_TRAINING, classificationMetrics, scoreCandidate, seededRandom, shuffled, trainCandidate } from "../lib/development-v0_2-candidate.mjs";

const matrixPath = path.resolve("outputs/development_v0_2/vibebench_development_v0_2_feature_matrix.json");
const evaluationPath = path.resolve("outputs/development_v0_2/vibebench_development_v0_2_candidate_evaluation.json");
const modelPath = path.resolve("outputs/development_v0_2/vibebench_development_v0_2_candidate_model.json");
const reportPath = path.resolve("outputs/VIBEBENCH_DEVELOPMENT_V0_2_CANDIDATE_80_80_2026-08-10.md");
const targetPrecision = 0.8;
const targetRecall = 0.8;

const matrixText = await readFile(matrixPath, "utf8");
const matrix = JSON.parse(matrixText);
const rows = matrix.rows || [];
if (matrix.holdout_used !== false || rows.length !== 40 || rows.filter((row) => row.target === 1).length !== 20) {
  throw new Error("Candidate evaluation requires the leakage-safe 40-row matrix balanced 20/20.");
}

const leaveOneOutPredictions = [];
for (let index = 0; index < rows.length; index += 1) {
  const trainingRows = rows.filter((_, rowIndex) => rowIndex !== index);
  const model = trainCandidate(trainingRows);
  leaveOneOutPredictions.push({
    sample_id: rows[index].sample_id,
    target_group: rows[index].target_group,
    label: rows[index].label,
    target: rows[index].target,
    probability: scoreCandidate(model, rows[index].features),
    predicted_positive: scoreCandidate(model, rows[index].features) >= CANDIDATE_TRAINING.threshold
  });
}
const primaryMetrics = classificationMetrics(leaveOneOutPredictions);

function stratifiedFolds(seed, count = 5) {
  const random = seededRandom(seed);
  const folds = Array.from({ length: count }, () => []);
  for (const group of [...new Set(rows.map((row) => row.target_group))]) {
    shuffled(rows.filter((row) => row.target_group === group), random).forEach((row, index) => folds[index % count].push(row));
  }
  return folds;
}

const repeated = [];
for (let seed = 1; seed <= 100; seed += 1) {
  const folds = stratifiedFolds(seed);
  const predictions = [];
  for (let fold = 0; fold < folds.length; fold += 1) {
    const testRows = folds[fold];
    const trainingRows = folds.flatMap((items, index) => index === fold ? [] : items);
    const model = trainCandidate(trainingRows);
    for (const row of testRows) predictions.push({ target: row.target, probability: scoreCandidate(model, row.features) });
  }
  repeated.push({ seed, ...classificationMetrics(predictions) });
}

function distribution(key) {
  const values = repeated.map((row) => row[key]).sort((a, b) => a - b);
  const at = (quantile) => values[Math.floor(quantile * (values.length - 1))];
  return { minimum: values[0], p10: at(0.1), median: at(0.5), p90: at(0.9), maximum: values.at(-1) };
}

const fullModel = trainCandidate(rows);
const gatePassed = primaryMetrics.precision >= targetPrecision && primaryMetrics.recall >= targetRecall;
const evaluation = {
  schema_version: "v0.2-development-candidate-evaluation",
  generated_at: new Date().toISOString(),
  status: gatePassed ? "DEVELOPMENT_GATE_PASSED" : "DEVELOPMENT_GATE_FAILED",
  purpose: "Cross-validated Development-only candidate selection; not an independent holdout result or product claim.",
  holdout_used: false,
  production_rule_change_authorized: false,
  new_holdout_required: true,
  matrix: path.relative(process.cwd(), matrixPath),
  matrix_sha256: createHash("sha256").update(matrixText).digest("hex"),
  target: { precision: targetPrecision, recall: targetRecall },
  model_specification: {
    family: "L2-regularized logistic regression",
    feature_scope: "Portable stack flags and log1p page/asset structure metrics only",
    prohibited: matrix.prohibited_features,
    ...CANDIDATE_TRAINING
  },
  primary_protocol: "Deterministic leave-one-project-out cross-validation across all 40 independent project families.",
  primary_metrics: primaryMetrics,
  primary_predictions: leaveOneOutPredictions,
  stability_protocol: "100 deterministic, target-group-stratified 5-fold assignments; fixed model and threshold, no fold-specific tuning.",
  stability: {
    assignments: repeated.length,
    assignments_meeting_80_80: repeated.filter((row) => row.precision >= targetPrecision && row.recall >= targetRecall).length,
    precision: distribution("precision"),
    recall: distribution("recall"),
    accuracy: distribution("accuracy")
  },
  caveats: [
    "The same 40-row Development corpus was used during feature research; cross-validation reduces but cannot eliminate selection optimism.",
    "Mature Human controls are generally larger than the new AI deployments, so structure-size coefficients may drift on a new population.",
    "Only a new untouched holdout can produce official v0.2 precision and recall."
  ]
};
const model = {
  ...fullModel,
  trained_at: new Date().toISOString(),
  status: "FROZEN_CANDIDATE_NOT_FOR_PRODUCTION",
  training_rows: rows.length,
  training_matrix_sha256: evaluation.matrix_sha256,
  holdout_used: false,
  production_rule_change_authorized: false
};

const pct = (value) => `${(100 * value).toFixed(1)} %`;
const report = `# VibeBench Development v0.2 candidate · 80/80 gate

Stand: 2026-08-10

Status: **${gatePassed ? "DEVELOPMENT-GATE BESTANDEN" : "DEVELOPMENT-GATE NICHT BESTANDEN"} · keine unabhängige Validierung**

## Primärer Cross-Validation-Befund

| Kennzahl | Ergebnis | Ziel |
|---|---:|---:|
| Precision | ${pct(primaryMetrics.precision)} | ≥ ${pct(targetPrecision)} |
| Recall | ${pct(primaryMetrics.recall)} | ≥ ${pct(targetRecall)} |
| Accuracy | ${pct(primaryMetrics.accuracy)} | — |
| Specificity | ${pct(primaryMetrics.specificity)} | — |
| F1 | ${pct(primaryMetrics.f1)} | — |

Confusion Matrix: TP ${primaryMetrics.tp}, FP ${primaryMetrics.fp}, TN ${primaryMetrics.tn}, FN ${primaryMetrics.fn}.

Das primäre Protokoll ist Leave-one-project-out-Cross-Validation über 40
eindeutige Projektfamilien. Für jede Vorhersage wurde das Modell ohne die
betreffende Seite neu trainiert.

## Modellgrenze

Der Kandidat verwendet ausschließlich erkannte Stack-Signale und logarithmierte
HTML-/Asset-Strukturmetriken. Hostname, URL, Provenienz, Builder-Label,
Hosting-Header und direkte Builder-Marker sind als Features ausgeschlossen.

Er ist Development-only. Die 40 Seiten wurden während der Featureforschung
verwendet; Cross-Validation verhindert direktes Training auf der Testzeile,
kann aber die vorangegangene Featureauswahl nicht ungeschehen machen.

## Stabilität

Bei 100 festen, nach den vier Akquisitionsgruppen stratifizierten
5-Fold-Zuordnungen erreichten ${evaluation.stability.assignments_meeting_80_80}/100
Läufe beide 80-%-Ziele. Median Precision ${pct(evaluation.stability.precision.median)},
Median Recall ${pct(evaluation.stability.recall.median)}. Die Minima lagen bei
${pct(evaluation.stability.precision.minimum)} beziehungsweise
${pct(evaluation.stability.recall.minimum)}; die kleine Stichprobe bleibt damit
eine relevante Unsicherheit.

## Methodische Entscheidung

- Der Kandidat wird mit Featureliste, Standardisierung, Koeffizienten,
  Regularisierung und Schwelle eingefroren.
- Er ersetzt die Produktionsregel noch nicht.
- Der abgeschlossene v0.1-Holdout bleibt unberührt.
- Offizielle neue Precision/Recall entstehen erst auf einem neuen, ungeöffneten
  und vor dem Lauf eingefrorenen Bestätigungs-Holdout.

## Nächste To-dos

1. Kandidatenartefakte und Hashes einfrieren.
2. Einen neuen, builder- und website-type-stratifizierten Holdout akquirieren.
3. Scan-/Retry-/Fehlerprotokoll vor dem ersten Request sperren.
4. Kandidat genau einmal auswerten und 80/80 als externes Gate prüfen.

## Empfohlener nächster Schritt

Jetzt keine weiteren Gewichte auf Development nachjustieren. Den Kandidaten
einfrieren und einen frischen Bestätigungs-Holdout aufbauen; nur dessen Ergebnis
darf als neue VibeBench-Precision und -Recall bezeichnet werden.
`;

await mkdir(path.dirname(evaluationPath), { recursive: true });
await Promise.all([
  writeFile(evaluationPath, `${JSON.stringify(evaluation, null, 2)}\n`, "utf8"),
  writeFile(modelPath, `${JSON.stringify(model, null, 2)}\n`, "utf8"),
  writeFile(reportPath, report, "utf8")
]);
process.stdout.write(`${JSON.stringify({ evaluation: path.relative(process.cwd(), evaluationPath), model: path.relative(process.cwd(), modelPath), report: path.relative(process.cwd(), reportPath), status: evaluation.status, primary_metrics: primaryMetrics, stability: evaluation.stability }, null, 2)}\n`);
if (!gatePassed) process.exitCode = 1;
