import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = path.resolve("outputs/holdout_v0_1/blind_run_v0_1_2026-08-10");
const rawPath = path.join(outputDir, "vibebench_blind_holdout_raw_results_v0_1.json");
const metricsPath = path.join(outputDir, "vibebench_blind_holdout_metrics_v0_1.json");
const workbookPath = path.join(outputDir, "vibebench_blind_holdout_evaluation_v0_1.xlsx");
const previewDir = process.env.VIBEBENCH_EVAL_PREVIEW_DIR || "/private/tmp/vibebench-evaluation-preview";

const [raw, evaluation] = await Promise.all([
  fs.readFile(rawPath, "utf8").then(JSON.parse),
  fs.readFile(metricsPath, "utf8").then(JSON.parse)
]);
const rows = raw.flattenedResults;
const falsePositives = rows.filter((row) => row.label === "HUMAN" && row.technical_success && ["direct", "indicative"].includes(row.verdict));
const errors = rows.filter((row) => !row.technical_success);

const workbook = Workbook.create();
const summary = workbook.worksheets.add("Summary");
const strata = workbook.worksheets.add("Strata");
const results = workbook.worksheets.add("Results");
const falsePositiveSheet = workbook.worksheets.add("Human Indicative");
const errorsSheet = workbook.worksheets.add("Technical Errors");
const definitions = workbook.worksheets.add("Definitions");
for (const sheet of [summary, strata, results, falsePositiveSheet, errorsSheet, definitions]) sheet.showGridLines = false;

const black = "#111827";
const blue = "#2563EB";
const lime = "#D8FF3E";
const paleRed = "#FEE2E2";
const paleGreen = "#DCFCE7";
const paleYellow = "#FEF3C7";
const white = "#FFFFFF";
const titleFormat = { fill: black, font: { bold: true, color: white, size: 18 }, verticalAlignment: "center" };
const sectionFormat = { fill: blue, font: { bold: true, color: white }, verticalAlignment: "center" };
const headerFormat = { fill: black, font: { bold: true, color: white }, wrapText: true, verticalAlignment: "center" };

summary.getRange("A1:H1").merge();
summary.getRange("A1").values = [["VibeBench Blind Holdout · Evaluation v0.1"]];
summary.getRange("A2:H2").merge();
summary.getRange("A2").values = [["Frozen 100-site evaluation · primary rule: direct OR indicative = positive"]];
summary.getRange("A4:D4").values = [["Run metadata", "Value", "Integrity", "Value"]];
summary.getRange("A5:D10").values = [
  ["Run ID", evaluation.runId, "Scanner commit (short)", `commit ${evaluation.scannerCommit.slice(0, 12)}`],
  ["Started", evaluation.runStartedAt, "Completed", evaluation.runCompletedAt],
  ["Endpoint", "vibe-bench-cyan.vercel.app/api/scan", "Manifest SHA-256", `sha256:${evaluation.manifestSha256.slice(0, 16)}…`],
  ["Bootstrap", `${evaluation.bootstrap.replicates} stratified replicates`, "Seed", evaluation.bootstrap.seed],
  ["Raw result SHA-256", `sha256:${evaluation.rawResultsSha256.slice(0, 16)}…`, "Technical policy", "Errors excluded from classification"],
  ["Interpretation", "Curated evidence holdout", "Probability claim", "No calibrated authorship probability"]
];

summary.getRange("A12:D12").values = [["Technical execution", "Value", "Classification base", "Value"]];
summary.getRange("A13:D18").values = [
  ["Total samples", null, "Successful AI", null],
  ["Technical success", null, "Successful Human", null],
  ["Final errors", null, "Retried once", null],
  ["Success rate", null, "Median request", evaluation.technical.medianTotalDurationMs / 1000],
  ["AI success rate", null, "P95 request", evaluation.technical.p95TotalDurationMs / 1000],
  ["Human success rate", null, "Run status", raw.status]
];
summary.getRange("B13").formulas = [["=COUNTA('Results'!A2:A101)"]];
summary.getRange("B14").formulas = [["=SUM('Results'!G2:G101)"]];
summary.getRange("B15").formulas = [["=B13-B14"]];
summary.getRange("B16").formulas = [["=IFERROR(B14/B13,0)"]];
summary.getRange("B17").formulas = [["=IFERROR(D13/COUNTIF('Results'!B2:B101,\"AI\"),0)"]];
summary.getRange("B18").formulas = [["=IFERROR(D14/COUNTIF('Results'!B2:B101,\"HUMAN\"),0)"]];
summary.getRange("D13").formulas = [["=SUMIFS('Results'!G2:G101,'Results'!B2:B101,\"AI\")"]];
summary.getRange("D14").formulas = [["=SUMIFS('Results'!G2:G101,'Results'!B2:B101,\"HUMAN\")"]];
summary.getRange("D15").formulas = [["=COUNTIF('Results'!H2:H101,2)"]];

summary.getRange("A20:E20").values = [["Primary confusion matrix", "Predicted positive", "Predicted negative", "Total", "Rate"]];
summary.getRange("A21:E23").values = [["AI ground truth", null, null, null, null], ["Human ground truth", null, null, null, null], ["Total", null, null, null, null]];
summary.getRange("B21").formulas = [["=COUNTIFS('Results'!B2:B101,\"AI\",'Results'!G2:G101,1,'Results'!L2:L101,1)"]];
summary.getRange("C21").formulas = [["=COUNTIFS('Results'!B2:B101,\"AI\",'Results'!G2:G101,1,'Results'!L2:L101,0)"]];
summary.getRange("B22").formulas = [["=COUNTIFS('Results'!B2:B101,\"HUMAN\",'Results'!G2:G101,1,'Results'!L2:L101,1)"]];
summary.getRange("C22").formulas = [["=COUNTIFS('Results'!B2:B101,\"HUMAN\",'Results'!G2:G101,1,'Results'!L2:L101,0)"]];
summary.getRange("D21").formulas = [["=SUM(B21:C21)"]];
summary.getRange("D22").formulas = [["=SUM(B22:C22)"]];
summary.getRange("E21").formulas = [["=IFERROR(B21/D21,0)"]];
summary.getRange("E22").formulas = [["=IFERROR(B22/D22,0)"]];
summary.getRange("B23").formulas = [["=SUM(B21:B22)"]];
summary.getRange("C23").formulas = [["=SUM(C21:C22)"]];
summary.getRange("D23").formulas = [["=SUM(D21:D22)"]];

summary.getRange("A25:D25").values = [["Primary metric", "Point estimate", "95% CI lower", "95% CI upper"]];
const metricDefinitions = [
  ["Accuracy", "=(B21+C22)/D23", "accuracy"],
  ["Precision", "=IFERROR(B21/B23,0)", "precision"],
  ["Recall / sensitivity", "=IFERROR(B21/D21,0)", "recall"],
  ["Specificity", "=IFERROR(C22/D22,0)", "specificity"],
  ["False-positive rate", "=IFERROR(B22/D22,0)", "falsePositiveRate"],
  ["F1", "=IFERROR(2*B27*B28/(B27+B28),0)", "f1"]
];
summary.getRange("A26:D31").values = metricDefinitions.map(([label, , key]) => [label, null, evaluation.primaryIntervals[key].lower, evaluation.primaryIntervals[key].upper]);
metricDefinitions.forEach(([, formula], index) => summary.getRange(`B${26 + index}`).formulas = [[formula]]);

summary.getRange("F20:H20").values = [["Exploratory strict point", "Value", "Note"]];
summary.getRange("F21:H28").values = [
  ["TP", null, "Post-hoc"], ["FP", null, "Post-hoc"], ["TN", null, "Post-hoc"], ["FN", null, "Post-hoc"],
  ["Accuracy", null, "Not independently validated"], ["Precision", null, "Not independently validated"],
  ["Recall", null, "Not independently validated"], ["Specificity", null, "Not independently validated"]
];
summary.getRange("G21").formulas = [["=COUNTIFS('Results'!B2:B101,\"AI\",'Results'!G2:G101,1,'Results'!M2:M101,1)"]];
summary.getRange("G22").formulas = [["=COUNTIFS('Results'!B2:B101,\"HUMAN\",'Results'!G2:G101,1,'Results'!M2:M101,1)"]];
summary.getRange("G23").formulas = [["=COUNTIFS('Results'!B2:B101,\"HUMAN\",'Results'!G2:G101,1,'Results'!M2:M101,0)"]];
summary.getRange("G24").formulas = [["=COUNTIFS('Results'!B2:B101,\"AI\",'Results'!G2:G101,1,'Results'!M2:M101,0)"]];
summary.getRange("G25").formulas = [["=IFERROR((G21+G23)/(G21+G22+G23+G24),0)"]];
summary.getRange("G26").formulas = [["=IFERROR(G21/(G21+G22),0)"]];
summary.getRange("G27").formulas = [["=IFERROR(G21/(G21+G24),0)"]];
summary.getRange("G28").formulas = [["=IFERROR(G23/(G23+G22),0)"]];

summary.getRange("A33:H33").merge();
summary.getRange("A33").values = [["Key finding"]];
summary.getRange("A34:H36").merge();
summary.getRange("A34").values = [["Direct builder artifacts produced 0 Human direct verdicts on this holdout. All 9 primary false positives came from the broader indicative route. Treat direct evidence as high-confidence attribution; treat indicative output as non-attributive structure until a new rule is developed on Development data and validated on a fresh holdout."]];

const resultHeaders = ["Sample ID", "Label", "Stratum", "Builder", "Website type", "Target URL", "Technical success", "Attempts", "API status", "Total ms", "Verdict", "Primary positive", "Strict direct", "Direct evidence", "Stack signals", "Structural hints", "Error", "Resolved URL", "Target HTTP", "Analyzed at"];
const resultValues = rows.map((row) => [
  row.sample_id, row.label, row.target_group, row.builder, row.website_type, row.target_url,
  row.technical_success ? 1 : 0, row.attempts, row.final_response_status, row.total_duration_ms, row.verdict,
  row.technical_success && ["direct", "indicative"].includes(row.verdict) ? 1 : 0,
  row.technical_success && row.verdict === "direct" ? 1 : 0,
  row.direct_evidence.join("; "), row.stack_signals.join("; "), row.structural_hints.join("; "), row.error,
  row.resolved_url, row.target_http_status, row.analyzed_at
]);
results.getRange("A1:T101").values = [resultHeaders, ...resultValues];
results.freezePanes.freezeRows(1);
results.freezePanes.freezeColumns(3);
results.tables.add("A1:T101", true, "BlindResults");

const groupNames = Object.keys(evaluation.groups);
strata.getRange("A1:I1").merge();
strata.getRange("A1").values = [["Verdict distribution by frozen stratum"]];
strata.getRange("A3:I13").values = [["Stratum", "Total", "Success", "Direct", "Indicative", "Indeterminate", "Error", "Primary positive rate", "Interpretation"], ...groupNames.map((group) => [group, null, null, null, null, null, null, null, group.startsWith("AI_") ? "AI provenance stratum" : "Human control stratum"] )];
for (let row = 4; row <= 13; row += 1) {
  strata.getRange(`B${row}`).formulas = [[`=COUNTIF('Results'!C2:C101,A${row})`]];
  strata.getRange(`C${row}`).formulas = [[`=SUMIF('Results'!C2:C101,A${row},'Results'!G2:G101)`]];
  strata.getRange(`D${row}`).formulas = [[`=COUNTIFS('Results'!C2:C101,A${row},'Results'!K2:K101,"direct")`]];
  strata.getRange(`E${row}`).formulas = [[`=COUNTIFS('Results'!C2:C101,A${row},'Results'!K2:K101,"indicative")`]];
  strata.getRange(`F${row}`).formulas = [[`=COUNTIFS('Results'!C2:C101,A${row},'Results'!K2:K101,"indeterminate")`]];
  strata.getRange(`G${row}`).formulas = [[`=B${row}-C${row}`]];
  strata.getRange(`H${row}`).formulas = [[`=IFERROR((D${row}+E${row})/C${row},0)`]];
}

falsePositiveSheet.getRange("A1:F1").merge();
falsePositiveSheet.getRange("A1").values = [["Human controls classified as indicative"]];
falsePositiveSheet.getRange(`A3:F${3 + falsePositives.length}`).values = [["Sample ID", "URL", "Verdict", "Stack signals", "Structural hints", "Meaning"], ...falsePositives.map((row) => [row.sample_id, row.target_url, row.verdict, row.stack_signals.join("; "), row.structural_hints.join("; "), "Primary false positive; no direct builder artifact"] )];

errorsSheet.getRange("A1:G1").merge();
errorsSheet.getRange("A1").values = [["Technical failures after one allowed retry"]];
errorsSheet.getRange(`A3:G${3 + errors.length}`).values = [["Sample ID", "Label", "Stratum", "URL", "Attempts", "API status", "Final error"], ...errors.map((row) => [row.sample_id, row.label, row.target_group, row.target_url, row.attempts, row.final_response_status, row.error])];

definitions.getRange("A1:D1").merge();
definitions.getRange("A1").values = [["Definitions and interpretation boundaries"]];
definitions.getRange("A3:D15").values = [
  ["Term", "Definition", "Used as", "Boundary"],
  ["Direct", "Builder-specific public deployment artifact", "Primary positive", "Evidence, not authorship proof"],
  ["Indicative", "Multiple generic stack/structure signals", "Primary positive by preregistration", "No builder attribution"],
  ["Indeterminate", "Insufficient visible public evidence", "Primary negative", "Does not mean Human-made"],
  ["Technical error", "Request/API/safety failure after retry", "Excluded", "Reported separately"],
  ["Primary rule", "Direct OR indicative is positive", "Confirmatory", "Fixed before run"],
  ["Strict rule", "Direct only is positive", "Exploratory", "Selected after opening results"],
  ["Accuracy", "(TP + TN) / successful scans", "Primary metric", "Curated set only"],
  ["Precision", "TP / (TP + FP)", "Primary metric", "Depends on 50/50 sampling"],
  ["Recall", "TP / (TP + FN)", "Primary metric", "AI strata represented equally"],
  ["Specificity", "TN / (TN + FP)", "Primary metric", "Human strata represented equally"],
  ["95% interval", "10,000 deterministic stratified-bootstrap replicates", "Uncertainty", `Seed ${evaluation.bootstrap.seed}`],
  ["Reuse policy", "Do not tune v0.2 on these labels", "Governance", "A fresh holdout is required"]
];

summary.getRange("A1:H1").format = titleFormat;
summary.getRange("A2:H2").format = { fill: lime, font: { color: black, italic: true } };
for (const range of ["A4:D4", "A12:D12", "A20:E20", "A25:D25", "F20:H20", "A33:H33"]) summary.getRange(range).format = sectionFormat;
summary.getRange("A34:H36").format = { fill: paleYellow, font: { color: "#78350F", bold: true }, wrapText: true, verticalAlignment: "top" };
summary.getRange("B16:B18").format.numberFormat = "0.0%";
summary.getRange("D16:D17").format.numberFormat = "0.0 \"s\"";
summary.getRange("E21:E22").format.numberFormat = "0.0%";
summary.getRange("B26:D31").format.numberFormat = "0.0%";
summary.getRange("G25:G28").format.numberFormat = "0.0%";
summary.getRange("B21").format = { fill: paleGreen, font: { bold: true, color: "#166534" } };
summary.getRange("C22").format = { fill: paleGreen, font: { bold: true, color: "#166534" } };
summary.getRange("B22").format = { fill: paleRed, font: { bold: true, color: "#991B1B" } };
summary.getRange("C21").format = { fill: paleRed, font: { bold: true, color: "#991B1B" } };
summary.getRange("A4:H36").format.wrapText = true;
summary.getRange("B5:B10").format.horizontalAlignment = "left";
summary.getRange("D5:D10").format.horizontalAlignment = "left";
summary.getRange("B6").format.numberFormat = "yyyy-mm-dd hh:mm:ss";
summary.getRange("D6").format.numberFormat = "yyyy-mm-dd hh:mm:ss";

results.getRange("A1:T1").format = headerFormat;
results.getRange("A2:T101").format.verticalAlignment = "top";
results.getRange("D2:T101").format.wrapText = true;
results.getRange("T2:T101").format.numberFormat = "yyyy-mm-dd hh:mm:ss";
results.getRange("G2:G101").conditionalFormats.add("cellIs", { operator: "equalTo", formula: 0, format: { fill: paleRed, font: { color: "#991B1B", bold: true } } });
results.getRange("K2:K101").conditionalFormats.add("containsText", { text: "direct", format: { fill: paleGreen, font: { color: "#166534", bold: true } } });
results.getRange("K2:K101").conditionalFormats.add("containsText", { text: "indicative", format: { fill: paleYellow, font: { color: "#78350F", bold: true } } });
results.getRange("K2:K101").conditionalFormats.add("containsText", { text: "error", format: { fill: paleRed, font: { color: "#991B1B", bold: true } } });

strata.getRange("A1:I1").format = titleFormat;
strata.getRange("A1").format.rowHeight = 34;
strata.getRange("A3:I3").format = headerFormat;
strata.getRange("A4:I13").format.wrapText = true;
strata.getRange("H4:H13").format.numberFormat = "0.0%";
strata.getRange("H4:H13").conditionalFormats.add("colorScale", { colors: ["#FEE2E2", "#FEF3C7", "#DCFCE7"] });

for (const [sheet, titleRange, headerRange] of [[falsePositiveSheet, "A1:F1", `A3:F3`], [errorsSheet, "A1:G1", "A3:G3"], [definitions, "A1:D1", "A3:D3"]]) {
  sheet.getRange(titleRange).format = titleFormat;
  sheet.getRange(headerRange).format = headerFormat;
}
falsePositiveSheet.getRange(`A4:F${3 + falsePositives.length}`).format = { fill: paleYellow, wrapText: true, verticalAlignment: "top" };
errorsSheet.getRange(`A4:G${3 + errors.length}`).format = { fill: paleRed, wrapText: true, verticalAlignment: "top" };
definitions.getRange("A4:D15").format.wrapText = true;
definitions.getRange("A4:D15").format.verticalAlignment = "top";

summary.getRange("A1:H36").format.autofitColumns();
summary.getRange("A1:H36").format.autofitRows();
summary.getRange("A:A").format.columnWidth = 27;
summary.getRange("B:B").format.columnWidth = 30;
summary.getRange("C:C").format.columnWidth = 24;
summary.getRange("D:D").format.columnWidth = 30;
summary.getRange("E:E").format.columnWidth = 15;
summary.getRange("F:F").format.columnWidth = 26;
summary.getRange("G:G").format.columnWidth = 18;
summary.getRange("H:H").format.columnWidth = 25;
summary.getRange("A1").format.rowHeight = 34;
summary.getRange("A34:H36").format.rowHeight = 32;

strata.getRange("A1:I13").format.autofitColumns();
strata.getRange("A:A").format.columnWidth = 29;
strata.getRange("B:H").format.columnWidth = 16;
strata.getRange("I:I").format.columnWidth = 28;
results.getRange("A1:T101").format.autofitColumns();
for (const column of ["A", "B", "C", "D", "E", "G", "H", "I", "J", "K", "L", "M", "S", "T"]) results.getRange(`${column}:${column}`).format.columnWidth = 17;
results.getRange("A:A").format.columnWidth = 28;
results.getRange("C:C").format.columnWidth = 25;
results.getRange("F:F").format.columnWidth = 38;
results.getRange("N:R").format.columnWidth = 34;
results.getRange("1:1").format.rowHeight = 42;
falsePositiveSheet.getRange(`A1:F${3 + falsePositives.length}`).format.autofitColumns();
falsePositiveSheet.getRange("A:A").format.columnWidth = 28;
falsePositiveSheet.getRange("B:B").format.columnWidth = 38;
falsePositiveSheet.getRange("D:F").format.columnWidth = 38;
errorsSheet.getRange(`A1:G${3 + errors.length}`).format.autofitColumns();
errorsSheet.getRange("A:D").format.columnWidth = 28;
errorsSheet.getRange("D:D").format.columnWidth = 40;
errorsSheet.getRange("G:G").format.columnWidth = 48;
definitions.getRange("A1:D15").format.autofitColumns();
definitions.getRange("A:A").format.columnWidth = 24;
definitions.getRange("B:B").format.columnWidth = 48;
definitions.getRange("C:D").format.columnWidth = 32;
definitions.getRange("A1:D15").format.autofitRows();

await fs.mkdir(previewDir, { recursive: true });
const previews = [
  ["summary", "Summary", "A1:H36", 1.2],
  ["strata", "Strata", "A1:I13", 1.3],
  ["results", "Results", "A1:T12", 0.9],
  ["human-indicative", "Human Indicative", `A1:F${3 + falsePositives.length}`, 1.1],
  ["technical-errors", "Technical Errors", `A1:G${3 + errors.length}`, 1.2],
  ["definitions", "Definitions", "A1:D15", 1.2]
];
for (const [file, sheetName, range, scale] of previews) {
  const image = await workbook.render({ sheetName, range, scale, format: "png" });
  await fs.writeFile(path.join(previewDir, `${file}.png`), new Uint8Array(await image.arrayBuffer()));
}

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(workbookPath);

const checks = [];
checks.push(await workbook.inspect({ kind: "table", range: "Summary!A12:H31", include: "values,formulas", tableMaxRows: 20, tableMaxCols: 8, maxChars: 14000 }));
checks.push(await workbook.inspect({ kind: "table", range: "Strata!A3:I13", include: "values,formulas", tableMaxRows: 11, tableMaxCols: 9, maxChars: 12000 }));
checks.push(await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, summary: "formula error scan", maxChars: 4000 }));

const imported = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));
checks.push(await imported.inspect({ kind: "table", range: "Summary!A20:H31", include: "values,formulas", tableMaxRows: 12, tableMaxCols: 8, maxChars: 12000 }));
checks.push(await imported.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, summary: "exported formula error scan", maxChars: 4000 }));
const importedPreview = await imported.render({ sheetName: "Summary", range: "A1:H36", scale: 1.2, format: "png" });
await fs.writeFile(path.join(previewDir, "exported-summary.png"), new Uint8Array(await importedPreview.arrayBuffer()));

process.stdout.write(`${checks.map((check) => check.ndjson).join("\n")}\n`);
process.stdout.write(`Wrote ${workbookPath}\nPreviews ${previewDir}\n`);
await fs.rm(`${workbookPath}.inspect.ndjson`, { force: true });
