import Link from "next/link";

export default function LegalFooterLinks() {
  return <>
    <Link href="/contact">Customer beta</Link>
    <Link href="/imprint">Impressum</Link>
    <Link href="/privacy">Datenschutz</Link>
    <Link href="/terms">Nutzungsbedingungen</Link>
  </>;
}
