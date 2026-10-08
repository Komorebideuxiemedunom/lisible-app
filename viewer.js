// Lisible web: reads signed .p7m files and XML e-invoices in the browser. Nothing is uploaded.
(function () {
  "use strict";
  const L = (document.documentElement.lang || "en").slice(0, 2);
  const T = {
    en: { invoice: "Invoice", credit: "Credit note", number: "Number", date: "Date", due: "Due", from: "From", to: "To", items: "Items", totals: "Totals", net: "Net", vat: "VAT", total: "Total", pay: "To pay", payment: "Payment", signed: "Digitally signed file", by: "Signed by", on: "on", notInvoice: "This XML is not an invoice format Lisible knows. Its content:", notRead: "This file could not be read. Is it a .p7m, .xml or Factur-X .pdf?", inner: "Download the document inside", pdfNote: "This PDF is shown below. Factur-X/ZUGFeRD data inside PDFs is read by the Lisible app.", withholding: "Withholding tax", paid: "Already paid", lines: "Items total", discount: "Discount", charge: "Charge", attachments: "Attachments", noAttachments: "No attachment in this file.", openHere: "open here" },
    fr: { invoice: "Facture", credit: "Avoir", number: "Numéro", date: "Date", due: "Échéance", from: "Émetteur", to: "Destinataire", items: "Lignes", totals: "Totaux", net: "HT", vat: "TVA", total: "TTC", pay: "À payer", payment: "Paiement", signed: "Fichier signé numériquement", by: "Signé par", on: "le", notInvoice: "Ce XML n'est pas un format de facture connu de Lisible. Son contenu :", notRead: "Ce fichier n'a pas pu être lu. Est-ce un .p7m, un .xml ou un PDF Factur-X ?", inner: "Télécharger le document contenu", pdfNote: "Le PDF est affiché ci-dessous. Les données Factur-X d'un PDF sont lues par l'app Lisible.", withholding: "Retenue à la source", paid: "Déjà payé", lines: "Lignes", discount: "Remise", charge: "Frais", attachments: "Pièces jointes", noAttachments: "Aucune pièce jointe dans ce fichier.", openHere: "ouvrir ici" },
    de: { invoice: "Rechnung", credit: "Gutschrift", number: "Nummer", date: "Datum", due: "Fällig", from: "Von", to: "An", items: "Positionen", totals: "Summen", net: "Netto", vat: "USt.", total: "Brutto", pay: "Zu zahlen", payment: "Zahlung", signed: "Digital signierte Datei", by: "Signiert von", on: "am", notInvoice: "Diese XML-Datei ist kein Rechnungsformat, das Lisible kennt. Inhalt:", notRead: "Diese Datei konnte nicht gelesen werden. Ist es eine .p7m-, .xml- oder ZUGFeRD-PDF-Datei?", inner: "Enthaltenes Dokument herunterladen", pdfNote: "Das PDF wird unten angezeigt. ZUGFeRD-Daten in PDFs liest die Lisible-App.", withholding: "Quellensteuer", paid: "Bereits bezahlt", lines: "Positionen", discount: "Rabatt", charge: "Zuschlag", attachments: "Anhänge", noAttachments: "Keine Anhänge in dieser Datei.", openHere: "hier öffnen" },
    it: { invoice: "Fattura", credit: "Nota di credito", number: "Numero", date: "Data", due: "Scadenza", from: "Cedente", to: "Cessionario", items: "Righe", totals: "Totali", net: "Imponibile", vat: "IVA", total: "Totale", pay: "Da pagare", payment: "Pagamento", signed: "File firmato digitalmente", by: "Firmato da", on: "il", notInvoice: "Questo XML non è un formato di fattura noto a Lisible. Contenuto:", notRead: "Impossibile leggere questo file. È un .p7m, un .xml o un PDF?", inner: "Scarica il documento contenuto", pdfNote: "Il PDF è mostrato qui sotto.", withholding: "Ritenuta d'acconto", paid: "Già pagato", lines: "Righe", discount: "Sconto", charge: "Maggiorazione", attachments: "Allegati", noAttachments: "Nessun allegato in questo file.", openHere: "apri qui" },
  }[L] || {};
  const LOCALE = { en: "en-GB", fr: "fr-FR", de: "de-DE", it: "it-IT" }[L] || "en-GB";

  // ---------- ASN.1 / CMS (signed .p7m) ----------
  function readTLV(b, p) {
    if (p + 2 > b.length) return null;
    const tag = b[p];
    let q = p + 1;
    if ((tag & 0x1f) === 0x1f) { while (b[q] & 0x80) q++; q++; }
    let len = b[q++];
    let indefinite = false;
    if (len === 0x80) { indefinite = true; len = -1; }
    else if (len & 0x80) {
      const n = len & 0x7f; len = 0;
      for (let i = 0; i < n; i++) len = len * 256 + b[q++];
    }
    return { tag, start: p, hdr: q, len, indefinite, constructed: (tag & 0x20) !== 0 };
  }
  // Children of a constructed node; returns [nodes, endOffset].
  function children(b, node) {
    const out = [];
    let p = node.hdr;
    const end = node.indefinite ? b.length : node.hdr + node.len;
    while (p < end) {
      if (node.indefinite && b[p] === 0 && b[p + 1] === 0) return [out, p + 2];
      const c = readTLV(b, p);
      if (!c) break;
      c.end = c.constructed && c.indefinite ? children(b, c)[1] : c.hdr + c.len;
      out.push(c);
      p = c.end;
    }
    return [out, end];
  }
  function kids(b, n) { return children(b, n)[0]; }
  function octets(b, n) { // OCTET STRING, possibly constructed (BER)
    if (!n.constructed) return b.subarray(n.hdr, n.hdr + n.len);
    const parts = kids(b, n).map((c) => octets(b, c));
    const total = parts.reduce((a, x) => a + x.length, 0);
    const r = new Uint8Array(total); let o = 0;
    parts.forEach((x) => { r.set(x, o); o += x.length; });
    return r;
  }
  function oid(b, n) {
    const v = b.subarray(n.hdr, n.hdr + n.len);
    const parts = [Math.floor(v[0] / 40), v[0] % 40];
    let x = 0;
    for (let i = 1; i < v.length; i++) { x = x * 128 + (v[i] & 0x7f); if (!(v[i] & 0x80)) { parts.push(x); x = 0; } }
    return parts.join(".");
  }
  function text(b, n) { return new TextDecoder().decode(b.subarray(n.hdr, n.hdr + n.len)); }
  function walk(b, n, visit, depth) {
    if ((depth || 0) > 40) return;
    visit(n);
    if (n.constructed) kids(b, n).forEach((c) => walk(b, c, visit, (depth || 0) + 1));
  }
  function openP7M(bytes) {
    let b = bytes;
    // Base64 (PEM or bare) instead of DER.
    const head = new TextDecoder().decode(b.subarray(0, 64));
    if (/^\s*(-----BEGIN|MI)/.test(head)) {
      try {
        const s = new TextDecoder().decode(b).replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
        b = Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
      } catch (e) { return null; }
    }
    if (b[0] !== 0x30) return null;
    const root = readTLV(b, 0); if (!root) return null;
    const [ct, wrapped] = kids(b, root);
    if (!ct || ct.tag !== 0x06 || oid(b, ct) !== "1.2.840.113549.1.7.2" || !wrapped) return null;
    const signedData = kids(b, wrapped)[0];
    const sd = kids(b, signedData);
    const encap = sd[2]; if (!encap) return null;
    const ec = kids(b, encap);
    if (!ec[1]) return null;
    const contentNode = kids(b, ec[1])[0];
    const content = octets(b, contentNode);
    // Signers: common names in the certificates, signing time in the signed attributes.
    const signers = []; let time = null;
    walk(b, signedData, (n) => {
      if (n.tag === 0x06 && oid(b, n) === "2.5.4.3") {
        const v = readTLV(b, n.hdr + n.len);
        if (v) { const name = text(b, v); if (!signers.includes(name)) signers.push(name); }
      }
      if (n.tag === 0x06 && oid(b, n) === "1.2.840.113549.1.9.5" && !time) {
        const set = readTLV(b, n.hdr + n.len); const t = set && readTLV(b, set.hdr);
        if (t && (t.tag === 0x17 || t.tag === 0x18)) time = asn1Time(text(b, t), t.tag === 0x17);
      }
    });
    // Certificates also carry the issuers' names: keep the subject (usually the first found per cert) only once.
    return { content, signers: signers.filter((s) => !/\b(CA|Certification|Authority|Root|Qualified)\b/i.test(s)).slice(0, 3), time };
  }
  function asn1Time(s, utc) {
    const m = utc ? s.match(/^(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)/) : s.match(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)/);
    if (!m) return null;
    const y = utc ? (Number(m[1]) < 50 ? 2000 : 1900) + Number(m[1]) : Number(m[1]);
    return new Date(Date.UTC(y, Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])));
  }

  // ---------- XML helpers (namespaces ignored, like the app) ----------
  const ch = (n, name) => n && Array.from(n.children).find((c) => c.localName === name);
  const chs = (n, name) => (n ? Array.from(n.children).filter((c) => c.localName === name) : []);
  const at = (n, ...path) => { let x = n; for (const p of path) x = ch(x, p); return x; };
  const s = (n, ...path) => { const x = at(n, ...path); const v = x && x.textContent.trim(); return v || null; };
  const num = (v) => (v == null || v === "" ? null : Number(v));
  const sum = (a) => (a.length ? a.reduce((x, y) => x + y, 0) : null);
  function date(v) {
    if (!v) return null;
    if (/^\d{8}$/.test(v)) v = v.slice(0, 4) + "-" + v.slice(4, 6) + "-" + v.slice(6, 8);
    const d = new Date(v.slice(0, 10) + "T12:00:00Z");
    return isNaN(d) ? null : d;
  }

  function parseInvoice(doc) {
    const r = doc.documentElement;
    switch (r.localName) {
      case "CrossIndustryInvoice": case "CrossIndustryDocument": return cii(r);
      case "Invoice": case "CreditNote": return ubl(r);
      case "FatturaElettronica": return fattura(r);
      case "Faktura": return ksef(r);
      default: return null;
    }
  }
  function base(format) { return { format, credit: false, currency: "EUR", seller: {}, buyer: {}, lines: [], vat: [], adjustments: [], notes: [] }; }

  function cii(r) {
    const i = base("CII · Factur-X · ZUGFeRD · XRechnung");
    const d = ch(r, "ExchangedDocument") || ch(r, "HeaderExchangedDocument");
    i.number = s(d, "ID"); i.credit = ["381", "261", "396"].includes(s(d, "TypeCode"));
    i.date = date(s(d, "IssueDateTime", "DateTimeString"));
    i.notes = chs(d, "IncludedNote").map((n) => s(n, "Content")).filter(Boolean);
    const t = ch(r, "SupplyChainTradeTransaction") || ch(r, "SpecifiedSupplyChainTradeTransaction");
    const a = ch(t, "ApplicableHeaderTradeAgreement") || ch(t, "ApplicableSupplyChainTradeAgreement");
    const party = (p) => {
      const ad = ch(p, "PostalTradeAddress");
      return { name: s(p, "Name"), address: [s(ad, "LineOne"), s(ad, "LineTwo"), [s(ad, "PostcodeCode"), s(ad, "CityName")].filter(Boolean).join(" ")].filter(Boolean), country: s(ad, "CountryID"), vat: s(p, "SpecifiedTaxRegistration", "ID") };
    };
    i.seller = party(ch(a, "SellerTradeParty")); i.buyer = party(ch(a, "BuyerTradeParty"));
    i.buyerRef = s(a, "BuyerReference");
    chs(t, "IncludedSupplyChainTradeLineItem").forEach((it) => {
      if (!ch(it, "SpecifiedTradeProduct")) return;
      const del = ch(it, "SpecifiedLineTradeDelivery") || ch(it, "SpecifiedSupplyChainTradeDelivery");
      const ag = ch(it, "SpecifiedLineTradeAgreement") || ch(it, "SpecifiedSupplyChainTradeAgreement");
      const st = ch(it, "SpecifiedLineTradeSettlement") || ch(it, "SpecifiedSupplyChainTradeSettlement");
      const sm = ch(st, "SpecifiedTradeSettlementLineMonetarySummation") || ch(st, "SpecifiedTradeSettlementMonetarySummation");
      const tax = ch(st, "ApplicableTradeTax");
      const q = ch(del, "BilledQuantity");
      i.lines.push({ name: s(it, "SpecifiedTradeProduct", "Name") || "—", qty: num(q && q.textContent.trim()), unit: q && q.getAttribute("unitCode"), price: num(s(ag, "NetPriceProductTradePrice", "ChargeAmount")), net: num(s(sm, "LineTotalAmount")), rate: num(s(tax, "RateApplicablePercent") || s(tax, "ApplicablePercent")) });
    });
    const se = ch(t, "ApplicableHeaderTradeSettlement") || ch(t, "ApplicableSupplyChainTradeSettlement");
    i.currency = s(se, "InvoiceCurrencyCode") || i.currency;
    i.vat = chs(se, "ApplicableTradeTax").map((x) => ({ rate: num(s(x, "RateApplicablePercent") || s(x, "ApplicablePercent")), base: num(s(x, "BasisAmount")), amount: num(s(x, "CalculatedAmount")) }));
    i.adjustments = chs(se, "SpecifiedTradeAllowanceCharge").map((x) => ({ reason: s(x, "Reason"), amount: num(s(x, "ActualAmount")), charge: (s(x, "ChargeIndicator", "Indicator") || s(x, "ChargeIndicator")) === "true" })).filter((x) => x.amount != null);
    const sm = ch(se, "SpecifiedTradeSettlementHeaderMonetarySummation") || ch(se, "SpecifiedTradeSettlementMonetarySummation");
    i.linesTotal = num(s(sm, "LineTotalAmount"));
    i.net = num(s(sm, "TaxBasisTotalAmount") || s(sm, "LineTotalAmount"));
    const vt = chs(sm, "TaxTotalAmount").find((x) => !x.getAttribute("currencyID") || x.getAttribute("currencyID") === i.currency);
    i.vatTotal = num(vt && vt.textContent.trim());
    i.gross = num(s(sm, "GrandTotalAmount")); i.due = num(s(sm, "DuePayableAmount"));
    i.prepaid = num(s(sm, "TotalPrepaidAmount")) || null;
    i.dueDate = date(s(se, "SpecifiedTradePaymentTerms", "DueDateDateTime", "DateTimeString"));
    i.terms = s(se, "SpecifiedTradePaymentTerms", "Description");
    const pm = chs(se, "SpecifiedTradeSettlementPaymentMeans").find((x) => ch(x, "PayeePartyCreditorFinancialAccount")) || ch(se, "SpecifiedTradeSettlementPaymentMeans");
    i.iban = s(pm, "PayeePartyCreditorFinancialAccount", "IBANID");
    return i;
  }

  function ubl(r) {
    const i = base("UBL · Peppol · XRechnung");
    i.credit = r.localName === "CreditNote" || s(r, "InvoiceTypeCode") === "381";
    i.number = s(r, "ID"); i.date = date(s(r, "IssueDate")); i.dueDate = date(s(r, "DueDate") || s(r, "PaymentMeans", "PaymentDueDate"));
    i.currency = s(r, "DocumentCurrencyCode") || i.currency;
    i.notes = chs(r, "Note").map((n) => n.textContent.trim()).filter(Boolean);
    i.buyerRef = s(r, "BuyerReference");
    const party = (p) => {
      const ad = ch(p, "PostalAddress");
      return { name: s(p, "PartyName", "Name") || s(p, "PartyLegalEntity", "RegistrationName"), address: [s(ad, "StreetName"), s(ad, "AdditionalStreetName"), [s(ad, "PostalZone"), s(ad, "CityName")].filter(Boolean).join(" ")].filter(Boolean), country: s(ad, "Country", "IdentificationCode"), vat: s(p, "PartyTaxScheme", "CompanyID") };
    };
    i.seller = party(at(r, "AccountingSupplierParty", "Party")); i.buyer = party(at(r, "AccountingCustomerParty", "Party"));
    const lineName = r.localName === "CreditNote" ? "CreditNoteLine" : "InvoiceLine";
    const qName = lineName === "CreditNoteLine" ? "CreditedQuantity" : "InvoicedQuantity";
    chs(r, lineName).forEach((l) => {
      const q = ch(l, qName);
      i.lines.push({ name: s(l, "Item", "Name") || s(l, "Item", "Description") || "—", qty: num(q && q.textContent.trim()), unit: q && q.getAttribute("unitCode"), price: num(s(l, "Price", "PriceAmount")), net: num(s(l, "LineExtensionAmount")), rate: num(s(l, "Item", "ClassifiedTaxCategory", "Percent")) });
    });
    const tt = chs(r, "TaxTotal").find((x) => ch(x, "TaxSubtotal")) || ch(r, "TaxTotal");
    i.vatTotal = num(s(tt, "TaxAmount"));
    i.vat = chs(tt, "TaxSubtotal").map((x) => ({ rate: num(s(x, "TaxCategory", "Percent")), base: num(s(x, "TaxableAmount")), amount: num(s(x, "TaxAmount")) }));
    i.adjustments = chs(r, "AllowanceCharge").map((x) => ({ reason: s(x, "AllowanceChargeReason"), amount: num(s(x, "Amount")), charge: s(x, "ChargeIndicator") === "true" })).filter((x) => x.amount != null);
    const m = ch(r, "LegalMonetaryTotal");
    i.linesTotal = num(s(m, "LineExtensionAmount"));
    i.net = num(s(m, "TaxExclusiveAmount") || s(m, "LineExtensionAmount"));
    i.gross = num(s(m, "TaxInclusiveAmount")); i.due = num(s(m, "PayableAmount"));
    i.prepaid = num(s(m, "PrepaidAmount")) || null;
    i.iban = s(r, "PaymentMeans", "PayeeFinancialAccount", "ID");
    i.terms = s(r, "PaymentTerms", "Note");
    return i;
  }

  function fattura(r) {
    const i = base("FatturaPA");
    const h = ch(r, "FatturaElettronicaHeader");
    const party = (p) => {
      const reg = ch(p, "DatiAnagrafici"); const an = ch(reg, "Anagrafica"); const sede = ch(p, "Sede");
      const name = s(an, "Denominazione") || [s(an, "Nome"), s(an, "Cognome")].filter(Boolean).join(" ");
      const iva = ch(reg, "IdFiscaleIVA");
      return { name: name || null, address: [[s(sede, "Indirizzo"), s(sede, "NumeroCivico")].filter(Boolean).join(" "), [s(sede, "CAP"), s(sede, "Comune"), s(sede, "Provincia") && "(" + s(sede, "Provincia") + ")"].filter(Boolean).join(" ")].filter(Boolean), country: s(sede, "Nazione"), vat: iva ? (s(iva, "IdPaese") || "") + (s(iva, "IdCodice") || "") : s(reg, "CodiceFiscale") };
    };
    i.seller = party(ch(h, "CedentePrestatore")); i.buyer = party(ch(h, "CessionarioCommittente"));
    const body = ch(r, "FatturaElettronicaBody"); if (!body) return i;
    const g = at(body, "DatiGenerali", "DatiGeneraliDocumento");
    i.number = s(g, "Numero"); i.date = date(s(g, "Data")); i.currency = s(g, "Divisa") || i.currency;
    i.credit = s(g, "TipoDocumento") === "TD04";
    i.gross = num(s(g, "ImportoTotaleDocumento"));
    i.notes = chs(g, "Causale").map((n) => n.textContent.trim()).filter(Boolean);
    const beni = ch(body, "DatiBeniServizi");
    chs(beni, "DettaglioLinee").forEach((l) => i.lines.push({ name: s(l, "Descrizione") || "—", qty: num(s(l, "Quantita")), unit: s(l, "UnitaMisura"), price: num(s(l, "PrezzoUnitario")), net: num(s(l, "PrezzoTotale")), rate: num(s(l, "AliquotaIVA")) }));
    i.vat = chs(beni, "DatiRiepilogo").map((x) => ({ rate: num(s(x, "AliquotaIVA")), base: num(s(x, "ImponibileImporto")), amount: num(s(x, "Imposta")) }));
    i.linesTotal = sum(i.lines.map((l) => l.net).filter((x) => x != null));
    i.adjustments = chs(g, "DatiCassaPrevidenziale").map((x) => ({ reason: "Cassa previdenziale " + (s(x, "AlCassa") || "") + " %", amount: num(s(x, "ImportoContributoCassa")), charge: true })).filter((x) => x.amount != null);
    i.withholding = sum(chs(g, "DatiRitenuta").map((x) => num(s(x, "ImportoRitenuta"))).filter((x) => x != null));
    i.net = sum(i.vat.map((v) => v.base).filter((x) => x != null)); i.vatTotal = sum(i.vat.map((v) => v.amount).filter((x) => x != null));
    if (i.gross == null && i.net != null && i.vatTotal != null) i.gross = i.net + i.vatTotal;
    const pay = at(body, "DatiPagamento", "DettaglioPagamento");
    i.dueDate = date(s(pay, "DataScadenzaPagamento")); i.due = num(s(pay, "ImportoPagamento")) ?? i.gross; i.iban = s(pay, "IBAN");
    return i;
  }

  function ksef(r) {
    const i = base("KSeF");
    const party = (p) => { const id = ch(p, "DaneIdentyfikacyjne"); const ad = ch(p, "Adres"); return { name: s(id, "Nazwa"), address: [s(ad, "AdresL1"), s(ad, "AdresL2")].filter(Boolean), country: s(ad, "KodKraju"), vat: s(id, "NIP") && "PL" + s(id, "NIP") }; };
    i.seller = party(ch(r, "Podmiot1")); i.buyer = party(ch(r, "Podmiot2"));
    const fa = ch(r, "Fa"); if (!fa) return i;
    i.currency = s(fa, "KodWaluty") || "PLN"; i.date = date(s(fa, "P_1")); i.number = s(fa, "P_2");
    i.credit = (s(fa, "RodzajFaktury") || "").startsWith("KOR"); i.gross = num(s(fa, "P_15")); i.due = i.gross;
    chs(fa, "FaWiersz").forEach((l) => i.lines.push({ name: s(l, "P_7") || "—", qty: num(s(l, "P_8B")), unit: s(l, "P_8A"), price: num(s(l, "P_9A")), net: num(s(l, "P_11")), rate: num(s(l, "P_12")) }));
    [["1", 23], ["2", 8], ["3", 5], ["4", null], ["5", null], ["6_1", 0], ["6_2", 0], ["6_3", 0], ["7", null]].forEach(([k, rate]) => {
      const b = num(s(fa, "P_13_" + k)), a = num(s(fa, "P_14_" + k));
      if (b != null || a != null) i.vat.push({ rate, base: b, amount: a });
    });
    i.net = sum(i.vat.map((v) => v.base).filter((x) => x != null)); i.vatTotal = sum(i.vat.map((v) => v.amount).filter((x) => x != null));
    i.iban = s(fa, "Platnosc", "RachunekBankowy", "NrRB"); i.dueDate = date(s(fa, "Platnosc", "TerminPlatnosci", "Termin"));
    return i;
  }


  // ---------- winmail.dat (TNEF) ----------
  const u16 = (b, p) => b[p] | (b[p + 1] << 8);
  const u32 = (b, p) => (b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24)) >>> 0;
  function decode(bytes, cp) {
    const label = { 1252: "windows-1252", 1250: "windows-1250", 1251: "windows-1251", 65001: "utf-8", 28591: "iso-8859-1", 932: "shift_jis", 936: "gbk" }[cp] || "windows-1252";
    let t; try { t = new TextDecoder(label).decode(bytes); } catch (e) { t = new TextDecoder().decode(bytes); }
    return t.replace(/\0+$/, "");
  }
  const utf16 = (bytes) => new TextDecoder("utf-16le").decode(bytes).replace(/\0+$/, "");
  function mapi(b) {
    const out = {}; if (b.length < 4) return out;
    const count = u32(b, 0); let p = 4; const pad = (n) => (n + 3) & ~3;
    for (let k = 0; k < Math.min(count, 10000); k++) {
      if (p + 4 > b.length) break;
      const type = u16(b, p), id = u16(b, p + 2); p += 4;
      if (id >= 0x8000) { if (p + 20 > b.length) break; const kind = u32(b, p + 16); p += 20; if (kind === 0) p += 4; else { const l = u32(b, p); p += 4 + pad(l); } }
      const base = type & 0x0fff, multi = (type & 0x1000) !== 0, variable = [0x1e, 0x1f, 0x102, 0x0d].includes(base);
      const fixed = [2, 3, 4, 0x0a, 0x0b].includes(base) ? 4 : [5, 6, 7, 0x14, 0x40].includes(base) ? 8 : base === 0x48 ? 16 : 0;
      const items = [];
      if (variable || multi) {
        if (p + 4 > b.length) break; const n = u32(b, p); p += 4;
        for (let j = 0; j < Math.min(n, 10000); j++) {
          if (variable) { if (p + 4 > b.length) break; const l = u32(b, p); p += 4; if (p + l > b.length) { p = b.length; break; } let it = b.subarray(p, p + l); if (base === 0x0d && it.length >= 16) it = it.subarray(16); items.push(it); p += pad(l); }
          else { if (!fixed || p + fixed > b.length) break; items.push(b.subarray(p, p + fixed)); p += pad(fixed); }
        }
      } else { if (!fixed || p + fixed > b.length) break; items.push(b.subarray(p, p + fixed)); p += pad(fixed); }
      out[id] = { type, data: items };
    }
    return out;
  }
  const mstr = (props, id, cp) => { const v = props[id]; if (!v || !v.data[0]) return null; const b = v.type & 0x0fff; const t = b === 0x1f ? utf16(v.data[0]) : b === 0x1e ? decode(v.data[0], cp) : null; return t || null; };
  const mbin = (props, id) => { const v = props[id]; return v && [0x102, 0x0d].includes(v.type & 0x0fff) ? v.data[0] : null; };
  function openTNEF(b) {
    if (b.length < 6 || u32(b, 0) !== 0x223e9f78) return null;
    const msg = { subject: null, from: null, to: null, text: null, html: null, attachments: [] };
    let cur = null, cp = null, p = 6;
    const flush = () => { if (cur && cur.data && cur.data.length) msg.attachments.push(cur); cur = null; };
    while (p + 9 <= b.length) {
      const level = b[p], attr = u32(b, p + 1), len = u32(b, p + 5), start = p + 9;
      if (start + len > b.length) break;
      const v = b.subarray(start, start + len); p = start + len + 2; const id = attr & 0xffff;
      if (id === 0x9002) { flush(); cur = { name: "attachment", data: null }; }
      else if (level === 2 && id === 0x8010) { cur = cur || { name: "attachment", data: null }; cur.name = decode(v, cp); }
      else if (level === 2 && id === 0x800f) { cur = cur || { name: "attachment", data: null }; cur.data = v; }
      else if (level === 2 && id === 0x9005) { const pr = mapi(v); const long = mstr(pr, 0x3707, cp); if (long && cur) cur.name = long; if (cur && !(cur.data && cur.data.length)) { const c = mbin(pr, 0x3701); if (c) cur.data = c; } }
      else if (level === 1 && id === 0x9007) cp = u32(v, 0);
      else if (level === 1 && id === 0x8004) msg.subject = decode(v, cp);
      else if (level === 1 && id === 0x800c) msg.text = decode(v, cp);
      else if (level === 1 && id === 0x9003) {
        const pr = mapi(v);
        msg.subject = mstr(pr, 0x0037, cp) || msg.subject;
        const name = mstr(pr, 0x0c1a, cp) || mstr(pr, 0x0042, cp); if (name) { const a = mstr(pr, 0x5d01, cp); msg.from = a && a !== name ? name + " <" + a + ">" : name; }
        msg.to = mstr(pr, 0x0e04, cp) || msg.to;
        msg.text = mstr(pr, 0x1000, cp) || msg.text;
        const h = mbin(pr, 0x1013); if (h) msg.html = decode(h, cp); else msg.html = mstr(pr, 0x1013, cp) || msg.html;
      }
    }
    flush();
    return msg;
  }
  function renderEmail(m) {
    const atts = m.attachments.map((a, k) => `<li><a download="${esc(a.name)}" href="${URL.createObjectURL(new Blob([a.data]))}">${esc(a.name)}</a> <span class="lv-small">${Math.max(1, Math.round(a.data.length / 1024))} KB</span>${/\.(xml|p7m|p7s)$/i.test(a.name) ? ` · <a href="#" data-att="${k}">${esc(T.openHere)}</a>` : ""}</li>`).join("");
    const body = m.text ? `<div class="lv-body">${esc(m.text).replace(/\n/g, "<br>")}</div>` : m.html ? `<div class="lv-body">${esc(m.html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, "&").replace(/\u200b/g, "").trim()).replace(/\n/g, "<br>")}</div>` : "";
    return `<div class="lv-invoice"><div class="lv-head"><h2>${esc(m.subject || "winmail.dat")}</h2><span class="lv-small">${esc(m.format || "Outlook winmail.dat")}</span></div>
      <table class="lv-meta">${m.from ? `<tr><td>${esc(T.from)}</td><td>${esc(m.from)}</td></tr>` : ""}${m.to ? `<tr><td>${esc(T.to)}</td><td>${esc(m.to)}</td></tr>` : ""}</table>
      <h3>${esc(T.attachments)} (${m.attachments.length})</h3>${atts ? `<ul>${atts}</ul>` : `<p>${esc(T.noAttachments)}</p>`}${body}</div>`;
  }


  // ---------- Outlook .msg (Compound File Binary + MAPI properties) ----------
  function openCFB(b) {
    const sig = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
    if (b.length < 512 || sig.some((v, i) => b[i] !== v)) return null;
    const shift = u16(b, 0x1e); if (shift < 9 || shift > 12 || u16(b, 0x20) !== 6) return null;
    const ss = 1 << shift, mss = 64, cutoff = u32(b, 0x38);
    const off = (sec) => (sec + 1) * ss;
    const fatSecs = [];
    for (let i = 0; i < 109; i++) { const x = u32(b, 0x4c + i * 4); if (x < 0xfffffffa) fatSecs.push(x); }
    let difat = u32(b, 0x44), g = 0;
    while (difat < 0xfffffffa && g++ < 10000) { const base = off(difat), per = ss / 4 - 1; for (let i = 0; i < per; i++) { const x = u32(b, base + i * 4); if (x < 0xfffffffa) fatSecs.push(x); } difat = u32(b, base + per * 4); }
    const fat = [];
    for (const sec of fatSecs) { const base = off(sec); if (base + ss > b.length) return null; for (let i = 0; i < ss / 4; i++) fat.push(u32(b, base + i * 4)); }
    const chain = (start, table, size, base, src) => {
      const parts = []; let sec = start, n = 0;
      while (sec !== 0xfffffffe && sec < 0xfffffffa && n++ < 1000000) { const st = base(sec); if (st < 0 || st + size > src.length) break; parts.push(src.subarray(st, st + size)); if (sec >= table.length) break; sec = table[sec]; }
      const out = new Uint8Array(parts.reduce((a, x) => a + x.length, 0)); let o = 0; parts.forEach((x) => { out.set(x, o); o += x.length; }); return out;
    };
    const dir = chain(u32(b, 0x30), fat, ss, off, b);
    const entries = [];
    for (let p = 0; p + 128 <= dir.length; p += 128) {
      const nl = Math.max(0, Math.min(64, u16(dir, p + 64)) - 2);
      entries.push({ name: new TextDecoder("utf-16le").decode(dir.subarray(p, p + nl)), type: dir[p + 66], left: u32(dir, p + 68), right: u32(dir, p + 72), child: u32(dir, p + 76), start: u32(dir, p + 116), size: u32(dir, p + 120) });
    }
    if (!entries[0] || entries[0].type !== 5) return null;
    const words = (x) => { const r = []; for (let i = 0; i + 3 < x.length; i += 4) r.push(u32(x, i)); return r; };
    const miniFat = words(chain(u32(b, 0x3c), fat, ss, off, b));
    const mini = chain(entries[0].start, fat, ss, off, b).subarray(0, entries[0].size);
    return {
      root: entries[0],
      children(st) { const out = [], stack = [st.child], seen = new Set(); while (stack.length) { const id = stack.pop(); if (id === 0xffffffff || id >= entries.length || seen.has(id)) continue; seen.add(id); const e = entries[id]; out.push(e); stack.push(e.left, e.right); } return out; },
      read(e) { if (e.type !== 2) return new Uint8Array(0); const raw = e.size < cutoff ? chain(e.start, miniFat, mss, (x) => x * mss, mini) : chain(e.start, fat, ss, off, b); return raw.subarray(0, e.size); },
    };
  }
  function msgProps(f, storage, header) {
    const streams = {}, fixed = {};
    f.children(storage).forEach((c) => {
      if (c.type !== 2) return;
      if (c.name.startsWith("__substg1.0_")) streams[c.name.slice(12).toUpperCase()] = c;
      if (c.name === "__properties_version1.0") { const raw = f.read(c); for (let p = header; p + 16 <= raw.length; p += 16) fixed[u16(raw, p + 2)] = { type: u16(raw, p), v: raw.subarray(p + 8, p + 16) }; }
    });
    const cpv = fixed[0x3fde] || fixed[0x3ffd]; const cp = cpv ? u32(cpv.v, 0) : null;
    const hex = (id) => id.toString(16).toUpperCase().padStart(4, "0");
    return {
      has: (id) => Object.keys(streams).some((k) => k.startsWith(hex(id))) || !!fixed[id],
      str(id) { const a = streams[hex(id) + "001F"]; if (a) return utf16(f.read(a)) || null; const c = streams[hex(id) + "001E"]; return c ? decode(f.read(c), cp) || null : null; },
      bin(id) { const e = streams[hex(id) + "0102"]; return e ? f.read(e) : null; },
      int(id) { const v = fixed[id]; return v && (v.type === 3 || v.type === 2) ? u32(v.v, 0) | 0 : null; },
      cp,
    };
  }
  function openMSG(b) {
    const f = openCFB(b); if (!f) return null;
    const pr = msgProps(f, f.root, 32);
    if (!(pr.has(0x0037) || pr.has(0x1000) || pr.has(0x0c1a))) return null;
    const m = { subject: pr.str(0x0037), from: null, to: null, text: pr.str(0x1000), html: null, attachments: [], format: "Outlook .msg" };
    const name = pr.str(0x0c1a) || pr.str(0x0042) || "", addr = pr.str(0x5d01) || ((pr.str(0x0c1f) || "").includes("@") ? pr.str(0x0c1f) : "");
    m.from = [name, addr && addr !== name ? "<" + addr + ">" : ""].filter(Boolean).join(" ") || null;
    const to = [];
    f.children(f.root).filter((e) => e.type === 1 && e.name.startsWith("__recip_version1.0_")).forEach((st) => {
      const r = msgProps(f, st, 8); const n = r.str(0x3001) || "", a = r.str(0x39fe) || ((r.str(0x3003) || "").includes("@") ? r.str(0x3003) : "");
      if (r.int(0x0c15) !== 3 && r.int(0x0c15) !== 2) to.push(a && a !== n ? (n ? n + " <" + a + ">" : a) : n);
    });
    m.to = to.filter(Boolean).join(", ") || pr.str(0x0e04);
    const h = pr.bin(0x1013); m.html = h ? decode(h, pr.cp) : pr.str(0x1013);
    f.children(f.root).filter((e) => e.type === 1 && e.name.startsWith("__attach_version1.0_")).forEach((st) => {
      const a = msgProps(f, st, 8); const data = a.bin(0x3701); if (!data) return;
      m.attachments.push({ name: a.str(0x3707) || a.str(0x3704) || a.str(0x3001) || "attachment", data });
    });
    m.attachments.sort((x, y) => x.name.localeCompare(y.name, undefined, { numeric: true }));
    return m;
  }

  // ---------- Rendering ----------
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const money = (v, cur) => (v == null ? "—" : new Intl.NumberFormat(LOCALE, { style: "currency", currency: /^[A-Z]{3}$/.test(cur) ? cur : "EUR" }).format(v));
  const day = (d) => (d ? d.toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "—");
  const pct = (v) => (v == null ? "" : new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 }).format(v) + " %");
  const UNITS = { HUR: "h", DAY: { en: "d", fr: "j", de: "Tg.", it: "gg" }, MON: { en: "mo", fr: "mois", de: "Mon.", it: "mesi" }, C62: { en: "pcs", fr: "pce", de: "Stk.", it: "pz" }, H87: { en: "pcs", fr: "pce", de: "Stk.", it: "pz" }, EA: { en: "pcs", fr: "pce", de: "Stk.", it: "pz" }, KGM: "kg", MTR: "m", MTK: "m²", LTR: "l", KWH: "kWh", XPP: { en: "pcs", fr: "pce", de: "Stk.", it: "pz" } };
  const unit = (u) => { const m = UNITS[(u || "").toUpperCase()]; return m == null ? u : typeof m === "string" ? m : m[L] || m.en; };
  const iban = (v) => esc(v.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim());

  function party(title, p) {
    return `<div class="lv-party"><div class="lv-label">${esc(title)}</div><strong>${esc(p.name || "—")}</strong>${(p.address || []).map((a) => `<div>${esc(a)}</div>`).join("")}${p.country ? `<div>${esc(p.country)}</div>` : ""}${p.vat ? `<div class="lv-mono">${esc(p.vat)}</div>` : ""}</div>`;
  }
  function render(i) {
    const c = i.currency;
    const row = (k, v, b) => `<tr${b ? ' class="lv-bold"' : ""}><td>${esc(k)}</td><td>${v}</td></tr>`;
    let totals = "";
    if (i.adjustments.length) {
      if (i.linesTotal != null) totals += row(T.lines, money(i.linesTotal, c));
      i.adjustments.forEach((a) => (totals += row(a.reason || (a.charge ? T.charge : T.discount), money(a.charge ? a.amount : -a.amount, c))));
    }
    totals += row(T.net, money(i.net, c));
    i.vat.forEach((v) => (totals += row(`${T.vat} ${pct(v.rate)}${v.base != null ? " / " + money(v.base, c) : ""}`, money(v.amount, c))));
    if (!i.vat.length && i.vatTotal != null) totals += row(T.vat, money(i.vatTotal, c));
    totals += row(T.total, money(i.gross, c), true);
    const paid = i.prepaid ?? (i.withholding == null && i.gross != null && i.due != null && Math.abs(i.gross - i.due) > 0.004 ? i.gross - i.due : null);
    if (i.withholding != null) totals += row(T.withholding, money(-i.withholding, c));
    if (paid != null) totals += row(T.paid, money(-paid, c));
    if (i.withholding != null || paid != null) totals += row(T.pay, money(i.due, c), true);
    const lines = i.lines.map((l) => `<tr><td><strong>${esc(l.name)}</strong><div class="lv-small">${[l.qty != null ? pct(l.qty).replace(" %", "") + (l.unit ? " " + esc(unit(l.unit)) : "") : "", l.price != null ? "× " + money(l.price, c) : "", l.rate != null ? T.vat + " " + pct(l.rate) : ""].filter(Boolean).join(" · ")}</div></td><td>${money(l.net, c)}</td></tr>`).join("");
    return `<div class="lv-invoice">
      <div class="lv-head"><h2>${esc(i.credit ? T.credit : T.invoice)}</h2><span class="lv-small">${esc(i.format)}</span></div>
      <table class="lv-meta">${row(T.number, esc(i.number || "—"))}${row(T.date, day(i.date))}${i.dueDate ? row(T.due, day(i.dueDate)) : ""}</table>
      <div class="lv-pay"><span>${esc(T.pay)}</span><strong>${money(i.due ?? i.gross, c)}</strong></div>
      <div class="lv-parties">${party(T.from, i.seller)}${party(T.to, i.buyer)}</div>
      ${lines ? `<h3>${esc(T.items)}</h3><table class="lv-lines">${lines}</table>` : ""}
      <h3>${esc(T.totals)}</h3><table class="lv-totals">${totals}</table>
      ${i.iban ? `<h3>${esc(T.payment)}</h3><p class="lv-mono">IBAN ${iban(i.iban)}</p>${i.terms ? `<p>${esc(i.terms)}</p>` : ""}` : ""}
      ${i.notes.length ? `<div class="lv-notes">${i.notes.map((n) => `<p>${esc(n)}</p>`).join("")}</div>` : ""}
    </div>`;
  }

  function show(html) { const out = document.getElementById("lv-result"); out.innerHTML = html; out.scrollIntoView({ behavior: "smooth", block: "start" }); }

  function handle(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result);
      let content = bytes, signature = null, name = file.name;
      for (let k = 0; k < 3; k++) { // .p7m.p7m
        const env = openP7M(content);
        if (!env) break;
        signature = signature || env; content = env.content; name = name.replace(/\.p7[ms]$/i, "");
      }
      let html = "";
      if (signature) {
        html += `<div class="lv-signed"><strong>${esc(T.signed)}</strong>${signature.signers.length ? `<div>${esc(T.by)} ${esc(signature.signers.join(", "))}${signature.time ? " " + esc(T.on) + " " + signature.time.toLocaleString(LOCALE) : ""}</div>` : ""}</div>`;
        const url = URL.createObjectURL(new Blob([content]));
        html += `<p><a download="${esc(name)}" href="${url}">${esc(T.inner)} (${esc(name)})</a></p>`;
      }
      const mail = !signature && (openTNEF(content) || openMSG(content));
      if (mail) {
        show(renderEmail(mail));
        document.querySelectorAll("[data-att]").forEach((a) => a.addEventListener("click", (ev) => {
          ev.preventDefault(); const att = mail.attachments[Number(a.getAttribute("data-att"))];
          handle(new File([att.data], att.name));
        }));
        return;
      }
      const head = new TextDecoder().decode(content.subarray(0, 1024));
      if (head.includes("%PDF")) {
        const url = URL.createObjectURL(new Blob([content], { type: "application/pdf" }));
        show(html + `<p>${esc(T.pdfNote)}</p><iframe class="lv-pdf" src="${url}"></iframe>`);
        return;
      }
      const xmlText = new TextDecoder().decode(content).replace(/^﻿/, "");
      if (xmlText.trim().startsWith("<")) {
        const doc = new DOMParser().parseFromString(xmlText, "application/xml");
        if (!doc.querySelector("parsererror")) {
          const inv = parseInvoice(doc);
          if (inv && (inv.number || inv.gross != null || inv.seller.name || inv.lines.length)) { show(html + render(inv)); return; }
          show(html + `<p>${esc(T.notInvoice)}</p><pre class="lv-xml">${esc(xmlText.slice(0, 20000))}</pre>`);
          return;
        }
      }
      show(html || `<p class="lv-error">${esc(T.notRead)}</p>`);
    };
    reader.readAsArrayBuffer(file);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("lv-file"), drop = document.getElementById("lv-drop");
    input.addEventListener("change", () => input.files[0] && handle(input.files[0]));
    ["dragover", "dragenter"].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.add("lv-over"); }));
    ["dragleave", "drop"].forEach((e) => drop.addEventListener(e, () => drop.classList.remove("lv-over")));
    drop.addEventListener("drop", (ev) => { ev.preventDefault(); const f = ev.dataTransfer.files[0]; if (f) handle(f); });
    document.querySelectorAll("[data-sample]").forEach((a) => a.addEventListener("click", async (ev) => {
      ev.preventDefault();
      const res = await fetch(a.getAttribute("data-sample"));
      handle(new File([await res.blob()], a.getAttribute("data-sample").split("/").pop()));
    }));
  });
})();
