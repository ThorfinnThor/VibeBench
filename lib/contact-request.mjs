export const CONTACT_EMAIL = "info@vibefootprint.com";

/**
 * @param {{
 *   nameCompany: string;
 *   websiteUrl: string;
 *   reviewContext: string;
 *   websiteCount: string;
 *   targetDate?: string;
 *   decision: string;
 * }} request
 */
export function createContactMailto(request) {
  const websiteUrl = request.websiteUrl.trim();
  const body = [
    "Hello VibeFootprint,",
    "",
    "I would like to request a founding-customer audit.",
    "",
    `Name and company: ${request.nameCompany.trim()}`,
    `Website URL: ${websiteUrl}`,
    `Review context: ${request.reviewContext.trim()}`,
    `Number of websites: ${request.websiteCount.trim()}`,
    `Target date: ${request.targetDate?.trim() || "Not fixed yet"}`,
    "",
    "Decision I need to make:",
    request.decision.trim(),
    "",
    "I am requesting this audit in a business or self-employed capacity and confirm that I am authorized to have the public URL reviewed."
  ].join("\n");

  const query = new URLSearchParams({
    subject: `VibeFootprint customer beta — ${websiteUrl}`,
    body
  });

  return `mailto:${CONTACT_EMAIL}?${query.toString()}`;
}
