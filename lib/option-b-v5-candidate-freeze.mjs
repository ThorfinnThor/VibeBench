export function selectFrozenCandidateConfiguration(selectionAudit, configurations) {
  const counts = new Map();
  for (const row of selectionAudit) {
    const id = row.selected_by_inner_cv?.configuration_id;
    const threshold = row.selected_by_inner_cv?.threshold;
    if (!configurations.some((configuration) => configuration.id === id) || !Number.isFinite(threshold)) throw new Error("Invalid nested-selection audit row.");
    if (!counts.has(id)) counts.set(id, { id, count: 0, thresholds: [] });
    counts.get(id).count += 1;
    counts.get(id).thresholds.push(threshold);
  }
  const selected = [...counts.values()].sort((left, right) => right.count - left.count || left.id.localeCompare(right.id))[0];
  if (!selected) throw new Error("No nested selections are available for candidate freeze.");
  const thresholds = [...selected.thresholds].sort((left, right) => left - right);
  const middle = Math.floor(thresholds.length / 2);
  const threshold = thresholds.length % 2 ? thresholds[middle] : (thresholds[middle - 1] + thresholds[middle]) / 2;
  return { configuration: configurations.find(({ id }) => id === selected.id), threshold, selection_count: selected.count, total_outer_folds: selectionAudit.length, rule: "modal configuration across outer-fold inner selections; lexicographic tie-break; median selected threshold for that configuration" };
}
