export function describeEvidenceCoverage({ assetCandidates, discoveredAssets = assetCandidates, fetchedAssets, truncatedAssets = 0, manifestLinked = false, manifestFetched = false }) {
  const candidates = Math.max(0, Number(assetCandidates) || 0);
  const discovered = Math.max(candidates, Number(discoveredAssets) || 0);
  const fetched = Math.max(0, Math.min(candidates, Number(fetchedAssets) || 0));
  const truncated = Math.max(0, Math.min(fetched, Number(truncatedAssets) || 0));
  const errors = candidates - fetched;
  const assetCoverage = candidates ? fetched / candidates : null;

  let level = "standard";
  if ((candidates >= 2 && fetched === 0) || (candidates >= 3 && assetCoverage < .5) || truncated > 0 || (manifestLinked && !manifestFetched && fetched === 0)) level = "limited";
  else if (fetched >= 2 && assetCoverage >= .75 && truncated === 0) level = "broad";

  const labels = { broad: "Breit", standard: "Standard", limited: "Begrenzt" };
  const summaries = {
    broad: discovered > candidates
      ? `HTML und ${fetched} von ${candidates} ausgewählten Same-Origin-Assets wurden ausgewertet; insgesamt wurden ${discovered} passende Assets gefunden.`
      : "HTML und mehrere öffentliche Same-Origin-Assets konnten ausgewertet werden.",
    standard: candidates === 0
      ? "Die Bewertung basiert auf dem öffentlichen HTML; keine passenden externen Same-Origin-Assets wurden gefunden."
      : "Das öffentliche HTML und ein Teil der gefundenen Same-Origin-Assets konnten ausgewertet werden.",
    limited: "Das öffentliche HTML wurde ausgewertet, aber relevante Same-Origin-Assets waren nur eingeschränkt lesbar."
  };

  return {
    level,
    label: labels[level],
    summary: summaries[level],
    affectsScore: false,
    scope: {
      html: "fetched",
      assetsDiscovered: discovered,
      assetsSelected: candidates,
      assetCandidates: candidates,
      assetsFetched: fetched,
      assetErrors: errors,
      truncatedAssets: truncated,
      manifestLinked: Boolean(manifestLinked),
      manifestFetched: Boolean(manifestFetched)
    }
  };
}
