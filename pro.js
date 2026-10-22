// Lisible Pro (web): several files at once, a summary table, CSV export for accounting and a ZIP
// of every document and attachment. One-time purchase; the licence key is checked against
// Lemon Squeezy's public licence API from the browser. Files never leave the browser, and the
// pages' Content-Security-Policy forbids any connection other than that licence API.
(function () {
  "use strict";
  const C = window.LISIBLE_PRO || {};
  const API = "https://api.lemonsqueezy.com/v1/licenses/";
  const STORE = "lisible-pro";
  const RECHECK = 7 * 24 * 3600 * 1000;

  const S = {
    en: { title: "Lisible Pro", lead: "For people who receive e-invoices by the dozen.", f1: "Open many files at once: .p7m, .xml, winmail.dat, .msg", f2: "One table with number, date, supplier, net, VAT and total", f3: "Export to CSV for Excel or your accountant", f4: "Download every document and attachment in one ZIP", once: "one-time payment, no subscription", buy: "Get Lisible Pro", have: "I already have a key", key: "Licence key", activate: "Activate", active: "Lisible Pro is active on this browser.", remove: "Remove the key", bad: "This key is not valid for Lisible Pro.", net: "Network error, try again.", files: "Files", file: "File", type: "Type", number: "Number", date: "Date", seller: "Supplier", netCol: "Net", vat: "VAT", total: "Total", cur: "Currency", csv: "Export CSV", zip: "Download all (ZIP)", reading: "Reading…", free: (n) => `You dropped ${n} files: the free version opens one at a time. Lisible Pro reads them all at once, with CSV and ZIP export.`, more: "See Lisible Pro", kinds: { invoice: "Invoice", mail: "E-mail", pdf: "PDF", xml: "XML", signed: "Signed file", unknown: "Unknown" } },
    fr: { title: "Lisible Pro", lead: "Pour ceux qui reçoivent des factures électroniques à la pelle.", f1: "Ouvre plusieurs fichiers d'un coup : .p7m, .xml, winmail.dat, .msg", f2: "Un tableau : numéro, date, fournisseur, HT, TVA, TTC", f3: "Export CSV pour Excel ou ton comptable", f4: "Tous les documents et pièces jointes dans un seul ZIP", once: "paiement unique, sans abonnement", buy: "Obtenir Lisible Pro", have: "J'ai déjà une clé", key: "Clé de licence", activate: "Activer", active: "Lisible Pro est actif sur ce navigateur.", remove: "Retirer la clé", bad: "Cette clé n'est pas valable pour Lisible Pro.", net: "Erreur réseau, réessaie.", files: "Fichiers", file: "Fichier", type: "Type", number: "Numéro", date: "Date", seller: "Fournisseur", netCol: "HT", vat: "TVA", total: "TTC", cur: "Devise", csv: "Exporter en CSV", zip: "Tout télécharger (ZIP)", reading: "Lecture…", free: (n) => `Tu as déposé ${n} fichiers : la version gratuite les ouvre un par un. Lisible Pro les lit tous d'un coup, avec export CSV et ZIP.`, more: "Voir Lisible Pro", kinds: { invoice: "Facture", mail: "E-mail", pdf: "PDF", xml: "XML", signed: "Fichier signé", unknown: "Inconnu" } },
    de: { title: "Lisible Pro", lead: "Für alle, die E-Rechnungen stapelweise bekommen.", f1: "Mehrere Dateien auf einmal öffnen: .p7m, .xml, winmail.dat, .msg", f2: "Eine Tabelle mit Nummer, Datum, Lieferant, Netto, USt. und Brutto", f3: "CSV-Export für Excel oder die Buchhaltung", f4: "Alle Dokumente und Anhänge in einem ZIP", once: "Einmalzahlung, kein Abo", buy: "Lisible Pro holen", have: "Ich habe schon einen Schlüssel", key: "Lizenzschlüssel", activate: "Aktivieren", active: "Lisible Pro ist in diesem Browser aktiv.", remove: "Schlüssel entfernen", bad: "Dieser Schlüssel gilt nicht für Lisible Pro.", net: "Netzwerkfehler, bitte erneut versuchen.", files: "Dateien", file: "Datei", type: "Typ", number: "Nummer", date: "Datum", seller: "Lieferant", netCol: "Netto", vat: "USt.", total: "Brutto", cur: "Währung", csv: "Als CSV exportieren", zip: "Alles herunterladen (ZIP)", reading: "Wird gelesen…", free: (n) => `Du hast ${n} Dateien abgelegt: Die Gratisversion öffnet sie einzeln. Lisible Pro liest alle auf einmal, mit CSV- und ZIP-Export.`, more: "Lisible Pro ansehen", kinds: { invoice: "Rechnung", mail: "E-Mail", pdf: "PDF", xml: "XML", signed: "Signierte Datei", unknown: "Unbekannt" } },
    it: { title: "Lisible Pro", lead: "Per chi riceve fatture elettroniche a decine.", f1: "Apri più file insieme: .p7m, .xml, winmail.dat, .msg", f2: "Una tabella con numero, data, fornitore, imponibile, IVA e totale", f3: "Esporta in CSV per Excel o il commercialista", f4: "Tutti i documenti e gli allegati in un solo ZIP", once: "pagamento unico, nessun abbonamento", buy: "Ottieni Lisible Pro", have: "Ho già una chiave", key: "Chiave di licenza", activate: "Attiva", active: "Lisible Pro è attivo in questo browser.", remove: "Rimuovi la chiave", bad: "Questa chiave non è valida per Lisible Pro.", net: "Errore di rete, riprova.", files: "File", file: "File", type: "Tipo", number: "Numero", date: "Data", seller: "Fornitore", netCol: "Imponibile", vat: "IVA", total: "Totale", cur: "Valuta", csv: "Esporta CSV", zip: "Scarica tutto (ZIP)", reading: "Lettura…", free: (n) => `Hai caricato ${n} file: la versione gratuita li apre uno alla volta. Lisible Pro li legge tutti insieme, con export CSV e ZIP.`, more: "Scopri Lisible Pro", kinds: { invoice: "Fattura", mail: "E-mail", pdf: "PDF", xml: "XML", signed: "File firmato", unknown: "Sconosciuto" } },
    pl: { title: "Lisible Pro", lead: "Dla tych, którzy dostają faktury elektroniczne dziesiątkami.", f1: "Otwieraj wiele plików naraz: .xml, .p7m, PDF, winmail.dat, .msg", f2: "Jedna tabela: numer, data, dostawca, netto, VAT, brutto", f3: "Eksport do CSV dla Excela lub księgowości", f4: "Wszystkie dokumenty i załączniki w jednym pliku ZIP", once: "jednorazowa płatność, bez subskrypcji", buy: "Kup Lisible Pro", have: "Mam już klucz", key: "Klucz licencyjny", activate: "Aktywuj", active: "Lisible Pro jest aktywne w tej przeglądarce.", remove: "Usuń klucz", bad: "Ten klucz nie jest ważny dla Lisible Pro.", net: "Błąd sieci, spróbuj ponownie.", files: "Pliki", file: "Plik", type: "Typ", number: "Numer", date: "Data", seller: "Dostawca", netCol: "Netto", vat: "VAT", total: "Brutto", cur: "Waluta", csv: "Eksportuj CSV", zip: "Pobierz wszystko (ZIP)", reading: "Odczytywanie…", free: (n) => `Dodano ${n} plików: wersja bezpłatna otwiera je po jednym. Lisible Pro odczyta wszystkie naraz, z eksportem CSV i ZIP.`, more: "Zobacz Lisible Pro", kinds: { invoice: "Faktura", mail: "E-mail", pdf: "PDF", xml: "XML", signed: "Plik podpisany", unknown: "Nieznany" } },
    nl: { title: "Lisible Pro", lead: "Voor wie e-facturen bij bosjes ontvangt.", f1: "Open meerdere bestanden tegelijk: .xml, .p7m, pdf, winmail.dat, .msg", f2: "Eén tabel met nummer, datum, leverancier, excl. btw, btw en totaal", f3: "Exporteer naar CSV voor Excel of je boekhouder", f4: "Alle documenten en bijlagen in één ZIP", once: "eenmalige betaling, geen abonnement", buy: "Lisible Pro kopen", have: "Ik heb al een sleutel", key: "Licentiesleutel", activate: "Activeren", active: "Lisible Pro is actief in deze browser.", remove: "Sleutel verwijderen", bad: "Deze sleutel is niet geldig voor Lisible Pro.", net: "Netwerkfout, probeer opnieuw.", files: "Bestanden", file: "Bestand", type: "Type", number: "Nummer", date: "Datum", seller: "Leverancier", netCol: "Excl. btw", vat: "Btw", total: "Totaal", cur: "Valuta", csv: "Exporteer CSV", zip: "Alles downloaden (ZIP)", reading: "Bezig met lezen…", free: (n) => `Je hebt ${n} bestanden toegevoegd: de gratis versie opent ze een voor een. Lisible Pro leest ze allemaal tegelijk, met CSV- en ZIP-export.`, more: "Bekijk Lisible Pro", kinds: { invoice: "Factuur", mail: "E-mail", pdf: "PDF", xml: "XML", signed: "Ondertekend bestand", unknown: "Onbekend" } },
  };

  // ---------- Licence ----------

  const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || null; } catch { return null; } };
  const save = (v) => { try { v ? localStorage.setItem(STORE, JSON.stringify(v)) : localStorage.removeItem(STORE); } catch { /* private mode */ } };
  const licensed = () => !!(load() || {}).ok;

  async function call(path, fields) {
    const res = await fetch(API + path, { method: "POST", headers: { Accept: "application/json" }, body: new URLSearchParams(fields) });
    return res.json();
  }
  const rightProduct = (meta) => !C.productId || String((meta || {}).product_id) === String(C.productId);

  async function activate(key) {
    // Only the key and a random label leave the browser: nothing that identifies the person or the device.
    const label = "web-" + [...crypto.getRandomValues(new Uint8Array(6))].map((b) => b.toString(16).padStart(2, "0")).join("");
    const r = await call("activate", { license_key: key, instance_name: label });
    if (!r.activated || !rightProduct(r.meta)) return false;
    save({ key, instance: r.instance && r.instance.id, ok: true, checked: Date.now() });
    return true;
  }

  // Re-checked once a week; a network failure keeps the licence (the files are read offline anyway).
  async function recheck() {
    const l = load();
    if (!l || !l.ok || Date.now() - (l.checked || 0) < RECHECK) return;
    try {
      const r = await call("validate", { license_key: l.key, instance_id: l.instance || "" });
      if (r.valid && rightProduct(r.meta)) save(Object.assign(l, { checked: Date.now() }));
      else if (r.valid === false) save(null);
    } catch { /* offline */ }
  }

  async function deactivate() {
    const l = load();
    if (l && l.instance) { try { await call("deactivate", { license_key: l.key, instance_id: l.instance }); } catch { /* keep going */ } }
    save(null);
  }

  // ---------- ZIP (stored, no compression: documents are already compressed or small) ----------

  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

  function zip(entries) {
    const enc = new TextEncoder(), parts = [], central = [];
    const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    let offset = 0;
    for (const e of entries) {
      const name = enc.encode(e.name), data = e.data, crc = crc32(data);
      const local = new DataView(new ArrayBuffer(30));
      [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, time, 2], [12, date, 2], [14, crc, 4], [18, data.length, 4], [22, data.length, 4], [26, name.length, 2], [28, 0, 2]].forEach(([o, v, n]) => (n === 4 ? local.setUint32(o, v, true) : local.setUint16(o, v, true)));
      const cd = new DataView(new ArrayBuffer(46));
      [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, time, 2], [14, date, 2], [16, crc, 4], [20, data.length, 4], [24, data.length, 4], [28, name.length, 2], [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2], [38, 0, 4], [42, offset, 4]].forEach(([o, v, n]) => (n === 4 ? cd.setUint32(o, v, true) : cd.setUint16(o, v, true)));
      parts.push(local.buffer, name, data);
      central.push(cd.buffer, name);
      offset += 30 + name.length + data.length;
    }
    const size = central.reduce((n, p) => n + (p.byteLength || p.length), 0);
    const end = new DataView(new ArrayBuffer(22));
    [[0, 0x06054b50, 4], [4, 0, 2], [6, 0, 2], [8, entries.length, 2], [10, entries.length, 2], [12, size, 4], [16, offset, 4], [20, 0, 2]].forEach(([o, v, n]) => (n === 4 ? end.setUint32(o, v, true) : end.setUint16(o, v, true)));
    return new Blob([...parts, ...central, end.buffer], { type: "application/zip" });
  }

  // ---------- Batch ----------

  function save_(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function csv(rows, t, L) {
    const sep = L === "en" ? "," : ";";
    const num = (v) => (v == null ? "" : L === "en" ? v.toFixed(2) : v.toFixed(2).replace(".", ","));
    const cell = (v) => { const s = String(v == null ? "" : v); return s.includes(sep) || /["\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const iso = (d) => (d ? d.toISOString().slice(0, 10) : "");
    const head = [t.file, t.type, t.number, t.date, t.seller, t.netCol, t.vat, t.total, t.cur];
    const lines = rows.map((r) => { const i = r.invoice || {}; return [r.file, t.kinds[r.kind] || r.kind, i.number, iso(i.date), (i.seller || {}).name, num(i.net), num(i.vatTotal != null ? i.vatTotal : (i.vat || []).reduce((n, v) => n + (v.amount || 0), 0) || null), num(i.gross), i.currency].map(cell).join(sep); });
    return new Blob(["﻿" + [head.map(cell).join(sep), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
  }

  // Every document worth keeping: what was inside a signature, and e-mail attachments.
  function zipEntries(rows, csvBlobBytes) {
    const seen = {}, out = [];
    const add = (name, data) => { let n = name || "document", k = 1; while (seen[n]) n = name.replace(/(\.[^.]*)?$/, `-${++k}$1`); seen[n] = 1; out.push({ name: n, data }); };
    rows.forEach((r) => {
      if (r.fromMail) return; // already added with the e-mail's attachments
      if (r.signature) add(r.name, r.content);
      if (r.kind === "mail") r.mail.attachments.forEach((a) => add(a.name, a.data));
    });
    add("lisible.csv", csvBlobBytes);
    return out;
  }

  async function batch(files) {
    const Lz = window.Lisible, t = S[Lz.L] || S.en, esc = Lz.esc;
    let box = document.getElementById("lv-batch");
    if (!box) { box = document.createElement("div"); box.id = "lv-batch"; document.getElementById("lv-result").before(box); }
    if (!licensed()) {
      Lz.handle(files[0]);
      box.innerHTML = C.checkout ? `<p class="lv-upsell">${esc(t.free(files.length))} <a href="#lv-pro">${esc(t.more)}</a></p>` : "";
      return;
    }
    box.innerHTML = `<p class="lv-small">${esc(t.reading)}</p>`;
    const rows = [];
    for (const f of files) {
      const r = await Lz.analyze(new Uint8Array(await f.arrayBuffer()), f.name);
      rows.push(r);
      // Invoices sent as e-mail attachments (winmail.dat, .msg) get their own row.
      if (r.kind === "mail") for (const a of r.mail.attachments.filter((x) => /\.(xml|p7m|pdf)$/i.test(x.name))) rows.push(Object.assign(await Lz.analyze(a.data, a.name), { fromMail: true }));
    }
    const money = (v, c) => (v == null ? "" : Lz.money(v, c));
    box.innerHTML = `<div class="lv-batch-head"><strong>${esc(t.files)} (${rows.length})</strong><span><button type="button" class="btn lv-csv">${esc(t.csv)}</button> <button type="button" class="btn lv-zip">${esc(t.zip)}</button></span></div>
      <div class="lv-table"><table><thead><tr><th>${esc(t.file)}</th><th>${esc(t.number)}</th><th>${esc(t.date)}</th><th>${esc(t.seller)}</th><th>${esc(t.total)}</th></tr></thead><tbody>${rows.map((r, k) => { const i = r.invoice || {}; return `<tr><td><a href="#" data-row="${k}">${esc(r.file)}</a><div class="lv-small">${esc(t.kinds[r.kind] || r.kind)}</div></td><td>${esc(i.number || "")}</td><td>${i.date ? esc(i.date.toISOString().slice(0, 10)) : ""}</td><td>${esc((i.seller || {}).name || "")}</td><td>${money(i.gross, i.currency)}</td></tr>`; }).join("")}</tbody></table></div>`;
    box.querySelectorAll("[data-row]").forEach((a) => a.addEventListener("click", (ev) => { ev.preventDefault(); Lz.display(rows[Number(a.getAttribute("data-row"))]); }));
    const csvBlob = () => csv(rows, t, Lz.L);
    box.querySelector(".lv-csv").onclick = () => save_(csvBlob(), "lisible.csv");
    box.querySelector(".lv-zip").onclick = async () => save_(zip(zipEntries(rows, new Uint8Array(await csvBlob().arrayBuffer()))), "lisible.zip");
    Lz.display(rows[0]);
  }

  // ---------- Offer block ----------

  function offer() {
    const Lz = window.Lisible, t = S[Lz.L] || S.en, esc = Lz.esc;
    const cta = document.querySelector(".lv-cta");
    if (!cta || !C.checkout) return; // nothing to sell until the store exists
    const box = document.createElement("section");
    box.id = "lv-pro"; box.className = "lv-pro";
    const draw = (msg) => {
      const l = load();
      box.innerHTML = l && l.ok
        ? `<h2>${esc(t.title)}</h2><p>${esc(t.active)} <span class="lv-mono">••••${esc(l.key.slice(-4))}</span></p><button type="button" class="btn lv-remove">${esc(t.remove)}</button>`
        : `<h2>${esc(t.title)}</h2><p>${esc(t.lead)}</p><ul><li>${esc(t.f1)}</li><li>${esc(t.f2)}</li><li>${esc(t.f3)}</li><li>${esc(t.f4)}</li></ul>
           <p class="lv-price"><strong>${esc(C.price || "19 €")}</strong> · ${esc(t.once)}</p>
           <a class="btn" href="${esc(C.checkout)}">${esc(t.buy)}</a>
           <details${msg ? " open" : ""}><summary>${esc(t.have)}</summary><form class="lv-key"><label>${esc(t.key)} <input name="key" autocomplete="off" required></label><button class="btn">${esc(t.activate)}</button></form>${msg ? `<p class="lv-error">${esc(msg)}</p>` : ""}</details>`;
      const form = box.querySelector(".lv-key");
      if (form) form.onsubmit = async (ev) => {
        ev.preventDefault();
        const key = form.key.value.trim();
        try { draw((await activate(key)) ? "" : t.bad); } catch { draw(t.net); }
      };
      const rm = box.querySelector(".lv-remove");
      if (rm) rm.onclick = async () => { await deactivate(); draw(); };
    };
    draw();
    cta.before(box);
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!window.Lisible || !document.getElementById("lv-file")) return;
    if (C.checkout || licensed()) {
      document.getElementById("lv-file").multiple = true;
      window.LisibleBatch = batch;
    }
    offer();
    recheck();
  });
})();
