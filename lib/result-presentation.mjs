const verdictPresentations = {
  direct: {
    eyebrow: "Direkte Evidenz",
    title: "Sichtbares Builder-Artefakt",
    summary: "Die geladene Website enthält mindestens einen konkreten, öffentlich sichtbaren Marker eines AI-Builders.",
    status: "Builder-Marker",
    claim: "Der gefundene Marker und seine Quelle dürfen konkret benannt werden.",
    boundary: "Das beweist weder Autorenschaft noch, wie viel der Website mit AI erstellt wurde."
  },
  indicative: {
    eyebrow: "Struktureller Kontext",
    title: "Allgemeine Strukturmuster",
    summary: "Mehrere moderne Stack- und DOM-Muster sind sichtbar. Diese Muster kommen auch häufig auf menschlich entwickelten Websites vor.",
    status: "Keine Attribution",
    claim: "Die beobachtete technische Ähnlichkeit darf als Kontext beschrieben werden.",
    boundary: "Dieses Ergebnis darf nicht als AI- oder Vibe-Coding-Zuordnung verwendet werden."
  },
  indeterminate: {
    eyebrow: "Keine direkte Evidenz",
    title: "Keine belastbare Zuordnung",
    summary: "Im begrenzten öffentlichen Scan war kein ausreichend konkretes Builder-Artefakt sichtbar.",
    status: "Offenes Ergebnis",
    claim: "Es darf festgehalten werden, dass öffentlich keine direkte Evidenz gefunden wurde.",
    boundary: "Das bedeutet nicht, dass die Website menschlich erstellt wurde oder ohne AI entstanden ist."
  }
};

const fallbackError = {
  code: "scan_failed",
  title: "Technischer Scan fehlgeschlagen",
  summary: "Die Website konnte nicht vollständig und sicher untersucht werden. Es liegt kein Klassifikationsergebnis vor.",
  action: "URL prüfen und später erneut versuchen.",
  retryable: true,
  responseStatus: 500
};

export function getVerdictPresentation(level) {
  return verdictPresentations[level] || verdictPresentations.indeterminate;
}

export function classifyScanError(error) {
  const message = error instanceof Error ? error.message : String(error || "");
  if (/Ungültige JSON-Anfrage/i.test(message)) {
    return { code: "invalid_request", title: "Anfrage nicht gültig", summary: "Die Scan-Anfrage konnte nicht als gültiges JSON verarbeitet werden.", action: "Seite neu laden und den Scan erneut starten.", retryable: false, responseStatus: 400 };
  }
  if (/gültige öffentliche URL|invalid url/i.test(message)) {
    return { code: "invalid_url", title: "URL nicht gültig", summary: "Die Eingabe ist keine gültige öffentliche Website-URL.", action: "Eine vollständige Domain wie example.com eingeben.", retryable: false, responseStatus: 400 };
  }
  if (/Nur öffentliche HTTP|öffentlichen Standardports|unsupported protocol/i.test(message)) {
    return { code: "unsupported_protocol", title: "Protokoll nicht unterstützt", summary: "VibeBench kann ausschließlich öffentliche HTTP- und HTTPS-Websites untersuchen.", action: "Eine URL mit http:// oder https:// verwenden.", retryable: false, responseStatus: 400 };
  }
  if (/Lokale und private|lokale oder private|private Adresse|nicht öffentliche Adresse|reservierte.*Adresse/i.test(message)) {
    return { code: "private_address", title: "Private Adresse blockiert", summary: "Lokale und private Netzwerkziele werden aus Sicherheitsgründen nicht geladen.", action: "Eine öffentlich erreichbare Website verwenden.", retryable: false, responseStatus: 400 };
  }

  const status = Number(message.match(/HTTP\s+(\d{3})/i)?.[1] || 0);
  if ([401, 403].includes(status)) {
    return { code: "access_blocked", title: "Website blockiert den Scan", summary: `Die Zielseite verweigert den öffentlichen Abruf (HTTP ${status}). Das ist kein Klassifikationsergebnis.`, action: "Die URL kann nur bewertet werden, wenn die Website den begrenzten öffentlichen Abruf erlaubt.", retryable: false, responseStatus: 422 };
  }
  if (status === 404) {
    return { code: "not_found", title: "Seite nicht gefunden", summary: "Die Zielseite antwortet mit HTTP 404. Es konnte kein Website-Inhalt untersucht werden.", action: "Zielpfad und Domain prüfen.", retryable: false, responseStatus: 422 };
  }
  if (status === 429) {
    return { code: "target_rate_limited", title: "Website begrenzt Abrufe", summary: "Die Zielseite antwortet mit HTTP 429. Es liegt kein Klassifikationsergebnis vor.", action: "Nach einer Pause erneut versuchen.", retryable: true, responseStatus: 422 };
  }
  if (status >= 500) {
    return { code: "target_unavailable", title: "Website derzeit nicht verfügbar", summary: `Die Zielseite antwortet mit HTTP ${status}. Der Scan konnte nicht abgeschlossen werden.`, action: "Später erneut versuchen.", retryable: true, responseStatus: 422 };
  }
  if (status) {
    return { code: "target_http_error", title: "Website nicht scanbar", summary: `Die Zielseite antwortet mit HTTP ${status}. Es liegt kein Klassifikationsergebnis vor.`, action: "URL und öffentliche Erreichbarkeit prüfen.", retryable: false, responseStatus: 422 };
  }
  if (/HTML-Antwort.*zu groß|HTML-Seite.*zu groß|Schnellscan zu groß/i.test(message)) {
    return { code: "html_too_large", title: "HTML über dem Sicherheitslimit", summary: "Die HTML-Antwort überschreitet das 1,5-MB-Limit des sicheren Schnellscans. Es liegt kein Klassifikationsergebnis vor.", action: "Für diese URL ist mit dem aktuellen Schnellscan kein vollständiges Ergebnis möglich.", retryable: false, responseStatus: 422 };
  }
  if (/keine HTML-Seite|keine HTML/i.test(message)) {
    return { code: "not_html", title: "Keine HTML-Website", summary: "Die URL liefert keinen unterstützten HTML-Inhalt. Es konnte keine Website analysiert werden.", action: "Eine öffentliche HTML-Seite statt einer Datei oder API verwenden.", retryable: false, responseStatus: 422 };
  }
  if (/Weiterleitung|redirect/i.test(message)) {
    return { code: "redirect_failed", title: "Weiterleitung nicht sicher auflösbar", summary: "Die Weiterleitungskette konnte innerhalb der Sicherheitsregeln nicht abgeschlossen werden.", action: "Wenn möglich direkt die endgültige öffentliche URL verwenden.", retryable: false, responseStatus: 422 };
  }
  if (/timeout|timed out|aborted due to timeout/i.test(message)) {
    return { code: "target_timeout", title: "Website antwortet zu langsam", summary: "Die Zielseite hat nicht innerhalb des begrenzten Zeitfensters geantwortet. Es liegt kein Klassifikationsergebnis vor.", action: "Später erneut versuchen.", retryable: true, responseStatus: 422 };
  }
  if (/ENOTFOUND|EAI_AGAIN|DNS|getaddrinfo/i.test(message)) {
    return { code: "dns_failed", title: "Domain nicht auflösbar", summary: "Die Domain konnte nicht zuverlässig in eine öffentliche Netzwerkadresse aufgelöst werden.", action: "Schreibweise der Domain prüfen oder später erneut versuchen.", retryable: true, responseStatus: 422 };
  }
  return fallbackError;
}
