// Lisible web : contrôle des mentions obligatoires d'une facture électronique française (réforme de septembre 2026).
// Branché sur viewer.js (window.LisibleCheck) : lit le XML CII (Factur-X) ou UBL, rien ne quitte le navigateur.
(function () {
  "use strict";
  const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // Premier descendant qui suit ce chemin de noms locaux, quel que soit le préfixe d'espace de noms.
  const local = (e) => (e.localName || e.nodeName).replace(/^.*:/, "");
  function find(node, ...path) {
    let cur = [node];
    for (const name of path) {
      const next = [];
      for (const n of cur) for (const e of n.querySelectorAll("*")) if (local(e) === name) next.push(e);
      if (!next.length) return null;
      cur = next;
    }
    return cur[0];
  }
  function all(node, name) { return [...node.querySelectorAll("*")].filter((e) => local(e) === name); }
  const txt = (n) => (n && n.textContent.trim()) || "";
  // 20261015 (CII) ou 2026-10-15 (UBL) → 15/10/2026.
  const day = (v) => v.replace(/^(\d{4})-?(\d{2})-?(\d{2})$/, "$3/$2/$1");

  function siren(party) {
    if (!party) return "";
    for (const e of [...all(party, "ID"), ...all(party, "GlobalID"), ...all(party, "CompanyID"), ...all(party, "EndpointID")]) {
      const v = txt(e).replace(/\s/g, ""), scheme = e.getAttribute("schemeID") || "";
      if (/^\d{9}$/.test(v) || (/^\d{14}$/.test(v) && /0009|SIRET/i.test(scheme))) return v.slice(0, 9);
      if (/^(0002|0009)$/.test(scheme) && /^\d{9,14}$/.test(v)) return v.slice(0, 9);
    }
    return "";
  }

  function check(doc) {
    const r = doc.documentElement, isUBL = /oasis/.test(`${r.namespaceURI} ${r.getAttribute("xmlns")}`);
    const seller = isUBL ? find(r, "AccountingSupplierParty") : find(r, "SellerTradeParty");
    const buyer = isUBL ? find(r, "AccountingCustomerParty") : find(r, "BuyerTradeParty");
    const sellerVat = isUBL ? txt(seller && find(seller, "PartyTaxScheme", "CompanyID")) : txt(seller && find(seller, "SpecifiedTaxRegistration", "ID"));
    const process = isUBL ? txt(find(r, "ProfileID")) : txt(find(r, "BusinessProcessSpecifiedDocumentContextParameter", "ID"));
    const shipTo = isUBL ? find(r, "Delivery", "Address") || find(r, "DeliveryLocation") : find(r, "ShipToTradeParty");
    const taxPoint = isUBL ? txt(find(r, "InvoicePeriod", "DescriptionCode")) : txt(find(r, "DueDateTypeCode"));
    const notes = [...all(r, "Content"), ...all(r, "Note"), ...all(r, "Description")].map(txt).join(" ").toLowerCase();
    const lines = isUBL ? all(r, "InvoiceLine").concat(all(r, "CreditNoteLine")) : all(r, "IncludedSupplyChainTradeLineItem");
    const rates = all(r, isUBL ? "Percent" : "RateApplicablePercent").map(txt);
    const exempt = all(r, isUBL ? "TaxExemptionReason" : "ExemptionReason").map(txt).join(" ").toLowerCase();
    const franchise = /293 ?b/.test(notes + " " + exempt);
    const dueDate = day(isUBL ? txt(find(r, "DueDate")) : txt(find(r, "SpecifiedTradePaymentTerms", "DueDateDateTime")));

    const ok = (label, detail) => ({ s: "ok", label, detail });
    const no = (label, detail) => ({ s: "no", label, detail });
    const info = (label, detail) => ({ s: "info", label, detail });
    const test = (cond, label, yes, nope) => (cond ? ok(label, yes) : no(label, nope));

    const sirenV = siren(seller), sirenA = siren(buyer);
    const number = isUBL ? txt(find(r, "ID")) : txt(find(r, "ExchangedDocument", "ID"));
    const nouvelles = [
      test(sirenA, "SIREN du client", sirenA, "Absent : obligatoire depuis la réforme pour un client entreprise."),
      test(/^[BSM]\d/i.test(process) || /^(B|S|M)\d?$/i.test(process), "Catégorie de l'opération (biens, services ou mixte)", process,
        "Absente : le cadre de facturation (B1, S1, M1…) indique s'il s'agit de biens, de services ou des deux."),
      shipTo ? ok("Adresse de livraison", "Présente") : info("Adresse de livraison", "Absente : obligatoire seulement si elle diffère de l'adresse du client."),
      taxPoint || /débits/.test(notes) ? ok("TVA sur les débits", taxPoint ? `Code ${taxPoint}` : "Mentionnée")
        : info("TVA sur les débits", "Non indiquée : obligatoire seulement si l'émetteur a opté pour le paiement de la TVA d'après les débits."),
    ];
    const classiques = [
      test(number, "Numéro de facture", number, "Absent."),
      test(isUBL ? txt(find(r, "IssueDate")) : txt(find(r, "IssueDateTime")), "Date d'émission", day(isUBL ? txt(find(r, "IssueDate")) : txt(find(r, "IssueDateTime"))), "Absente."),
      test(txt(seller && find(seller, isUBL ? "RegistrationName" : "Name")) || txt(seller && find(seller, "Name")), "Nom de l'émetteur", txt(seller && (find(seller, "RegistrationName") || find(seller, "Name"))), "Absent."),
      test(sirenV, "SIREN de l'émetteur", sirenV, "Absent."),
      franchise ? ok("Numéro de TVA de l'émetteur", "Franchise en base (article 293 B du CGI)")
        : test(sellerVat, "Numéro de TVA de l'émetteur", sellerVat, "Absent, et pas de mention « TVA non applicable, art. 293 B du CGI »."),
      test(txt(buyer && (find(buyer, "RegistrationName") || find(buyer, "Name"))), "Nom du client", txt(buyer && (find(buyer, "RegistrationName") || find(buyer, "Name"))), "Absent."),
      test(lines.length, "Lignes : désignation, quantité, prix", `${lines.length} ligne${lines.length > 1 ? "s" : ""}`, "Aucune ligne détaillée."),
      test(rates.length || franchise, "Taux de TVA", [...new Set(rates)].map((x) => x.replace(/\.0+$/, "").replace(".", ",") + " %").join(", ") || "Franchise", "Absent."),
      test(dueDate || /échéance|paiement à|jours/.test(notes), "Date ou délai de paiement", dueDate || "Dans les conditions de paiement", "Absent."),
      test(/pénalit/.test(notes), "Taux des pénalités de retard", "Mentionné", "Introuvable dans les notes ou conditions de paiement."),
      test(/40 ?(€|eur)|indemnité forfaitaire/.test(notes), "Indemnité forfaitaire de 40 € pour frais de recouvrement", "Mentionnée", "Introuvable : obligatoire entre professionnels."),
    ];
    const country = txt(seller && (find(seller, "CountryID") || find(seller, "IdentificationCode")));
    return { format: isUBL ? "UBL (Peppol)" : "CII (Factur-X)", foreign: country && country !== "FR" ? country : "", nouvelles, classiques };
  }

  function table(rows) {
    const mark = { ok: "✓", no: "✗", info: "–" };
    return `<table class="vf">${rows.map((x) => `<tr class="vf-${x.s}"><td>${mark[x.s]}</td><td>${esc(x.label)}<br><small>${esc(x.detail)}</small></td></tr>`).join("")}</table>`;
  }

  window.LisibleCheck = function (r) {
    const out = document.getElementById("vf-result");
    if (!out) return;
    if (r.kind !== "invoice" || !r.xml) {
      out.innerHTML = `<p class="vf-alerte">${r.kind === "pdf" ? "Ce PDF ne contient pas de facture électronique : c'est un PDF simple, qui ne vaudra plus facture électronique une fois l'obligation d'émission en vigueur pour son émetteur." : "Ce fichier n'est pas une facture électronique CII ou UBL."}</p>`;
      return;
    }
    const doc = new DOMParser().parseFromString(r.xml, "application/xml");
    if (/FatturaElettronica|Faktura/.test(local(doc.documentElement))) {
      out.innerHTML = `<p class="vf-alerte">Facture italienne ou polonaise : les mentions françaises ne s'y appliquent pas. Elle est affichée ci-dessous.</p>`;
      return;
    }
    const c = check(doc), missing = [...c.nouvelles, ...c.classiques].filter((x) => x.s === "no").length;
    out.innerHTML = `<div class="card"><h2 class="vf-titre">${missing ? `${missing} mention${missing > 1 ? "s" : ""} à vérifier` : "Toutes les mentions contrôlées sont présentes"}</h2>` +
      `<p class="lv-small">Format ${esc(c.format)}${r.pdf ? ", lu dans le PDF" : ""}.</p>` +
      (c.foreign ? `<p class="vf-alerte">Émetteur établi hors de France (${esc(c.foreign)}) : le SIREN et les mentions propres à la France ne le concernent pas.</p>` : "") +
      `<h3>Nouvelles mentions de 2026</h3>${table(c.nouvelles)}<h3>Mentions habituelles</h3>${table(c.classiques)}` +
      `<p class="lv-small">Contrôle automatique des données du XML, pas un avis juridique. Une mention peut figurer seulement sur le PDF ou sous un code que Lisible ne reconnaît pas.</p></div>`;
  };
})();
