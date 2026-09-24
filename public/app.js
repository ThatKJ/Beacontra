(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const state = {
    data: null,
    input: null,
    resultInput: null,
    selected: 0,
    busy: false,
    previewVersion: 0,
  };
  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  const escape = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const safeUrl = (value) => {
    try {
      const u = new URL(value);
      return ["https:", "http:"].includes(u.protocol) &&
        !u.username &&
        !u.password
        ? u.href
        : "";
    } catch {
      return "";
    }
  };
  const usable = (value) =>
    value && !["unknown", "n/a"].includes(String(value).toLowerCase());
  const price = (r) =>
    Number.isFinite(r.listing.extractedPrice) && r.listing.extractedPrice > 0
      ? money(r.listing.extractedPrice)
      : usable(r.listing.price)
        ? r.listing.price
        : "Not listed";
  const records = (r) =>
    ["exact_matches", "visual_matches", "products"].flatMap((type) =>
      (r.lensEvidence?.details?.[type] || []).map((item) => ({
        ...item,
        kind:
          type === "exact_matches"
            ? "Exact-image result"
            : type === "products"
              ? "Product result"
              : "Related image",
      })),
    );
  const priority = (r) =>
    ({
      review_urgently: ["High priority", "rust"],
      review: ["Review", "amber"],
      monitor: ["Monitor", ""],
      likely_genuine: ["Low priority", ""],
    })[r.recommendation] || ["Unspecified", ""];
  const badge = (text, tone = "") =>
    `<span class="badge ${tone}">${escape(text)}</span>`;
  const image = (url, alt, lazy = true) =>
    safeUrl(url)
      ? `<img src="${escape(safeUrl(url))}" alt="${escape(alt)}" ${lazy ? 'loading="lazy"' : ""} decoding="async" referrerpolicy="no-referrer">`
      : '<span class="image-fallback">Photo not available</span>';
  const link = (url, text, cls = "") =>
    safeUrl(url)
      ? `<a class="${cls}" href="${escape(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${escape(text)} <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>`
      : "";
  function wireImages(root) {
    root.querySelectorAll("img").forEach((img) => {
      const fail = () => {
        const span = document.createElement("span");
        span.className = "image-fallback";
        span.textContent = "Photo unavailable";
        img.replaceWith(span);
      };
      img.addEventListener("error", fail, { once: true });
      if (img.complete && !img.naturalWidth) fail();
    });
  }
  function announce(text) {
    $("announcement").textContent = text;
  }
  function visual(r) {
    const count = records(r).length;
    const type = r.visualSignal?.anomalyType;
    if (type === "not_verified")
      return {
        title: "Not checked",
        text: "This listing was outside the scan’s visual-check limit.",
        note: "No visual conclusion is available.",
        tone: "",
      };
    if (count)
      return {
        title: `${count} Lens results`,
        text: "Related source records returned for this listing photo.",
        note: "Related images do not establish a match to your reference or product authenticity.",
        tone: "teal",
      };
    if (type === "unavailable")
      return {
        title: "Unavailable",
        text: "No usable visual evidence is available for this listing.",
        note: "The response does not distinguish an empty search from a failed check.",
        tone: "",
      };
    return {
      title: "No source records",
      text: "No visual source records were returned for review.",
      note: "Absence of evidence is not an image mismatch.",
      tone: "",
    };
  }
  function delta(r) {
    const reference = state.input?.mrp;
    const p = r.listing.extractedPrice;
    if (!(reference > 0 && p > 0)) return "";
    const change = ((p - reference) / reference) * 100;
    return `${Math.abs(change).toFixed(1).replace(/\.0$/, "")}% ${change < 0 ? "below" : change > 0 ? "above" : "from"} ${money(reference)} reference`;
  }
  function deltaShort(r) {
    const reference = state.input?.mrp;
    const p = r.listing.extractedPrice;
    if (!(reference > 0 && p > 0)) return "";
    const change = ((p - reference) / reference) * 100;
    const rounded = Math.abs(change).toFixed(0);
    return {
      change,
      text: `${change < 0 ? "−" : change > 0 ? "+" : "="}${rounded}% vs MRP`,
    };
  }
  function renderReference() {
    const product = state.input?.productName || "your product";
    const media = $("railMedia");
    media.innerHTML = image(state.input?.officialImageUrl || "", `Reference photo for ${product}`, false);
    wireImages(media);
    $("railProduct").textContent = state.input?.productName || "—";
    const ref = state.input?.mrp;
    $("railMrp").textContent = ref > 0 ? money(ref) : "Not supplied";
    const results = state.data?.results || [];
    const prioritized = results.filter((r) =>
      ["review", "review_urgently"].includes(r.recommendation),
    ).length;
    const withEvidence = results.filter((r) => records(r).length).length;
    $("railMeta").textContent =
      `${String(results.length).padStart(2, "0")} LISTINGS · ${prioritized} PRIORITIZED · ${withEvidence} WITH LENS RECORDS · VISUAL CHECKS CAPPED AT 10`;
    updateRail();
  }
  function updateRail() {
    const r = state.data?.results?.[state.selected];
    $("railPrice").textContent = r ? price(r) : "—";
    $("railSource").textContent = r?.listing.source
      ? usable(r.listing.source)
        ? r.listing.source
        : "Source not supplied"
      : "Google Shopping";
  }
  function sellerInfo(r) {
    const name = usable(r.listing.seller)
      ? r.listing.seller
      : "Seller not supplied";
    const hasList = state.input?.knownAuthorizedSellers?.length;
    return {
      name,
      observation: !hasList
        ? "No authorized-seller list supplied."
        : r.sellerSignal?.isAuthorized
          ? "Name matches your supplied seller list."
          : "Name not matched to your seller list.",
      note: "Shopping may report a marketplace name rather than the individual seller.",
    };
  }
  function reason(r) {
    const reasons = [];
    if (r.priceSignal?.isAnomalous) reasons.push("Price deviation");
    if (r.sellerSignal?.isAnomalous) reasons.push("Seller-name signal");
    if (r.visualSignal?.isAnomalous) reasons.push("Visual-source signal");
    return reasons.join(" · ") || "No elevated signals in this scan";
  }
  function comparison(r) {
    return `<div class="comparison"><figure class="photo-frame"><figcaption>Genuine product <span>Your reference</span></figcaption><div class="image-well">${image(state.input.officialImageUrl, `Reference photo for ${state.input.productName}`, false)}</div></figure><figure class="photo-frame"><figcaption>Discovered listing <span>${escape(r.listing.source || "Source not supplied")}</span></figcaption><div class="image-well">${image(r.listing.thumbnail, r.listing.title, false)}</div></figure></div><p class="visual-caption">Compare the packaging, variant and product details. This side-by-side view is for your judgment, not an automated similarity measurement.</p>`;
  }
  function signal(label, value, observation, note, status, tone = "") {
    return `<section class="signal"><h3 class="eyebrow">${label}</h3><p class="signal-value">${escape(value)}</p><p class="signal-observation">${escape(observation)}</p><p class="signal-context">${escape(note)}</p>${badge(status, tone)}</section>`;
  }
  function renderDetail() {
    const r = state.data.results[state.selected];
    $("evidencePanel").dataset.ref = r
      ? `LISTING ${String(state.selected + 1).padStart(2, "0")} · EVIDENCE REVIEW`
      : "EVIDENCE REVIEW";
    if (!r) {
      $("evidencePanel").innerHTML =
        '<div class="empty"><h2 id="detailTitle">A clearer search starts with a specific product.</h2><p>No listings with usable prices were returned. Try the exact model name, or remove extra search terms.</p><button class="button secondary" data-edit>Edit product</button></div>';
      updateRail();
      return;
    }
    const v = visual(r),
      s = sellerInfo(r),
      matches = records(r),
      p = priority(r);
    const hasPrice =
      Number.isFinite(r.listing.extractedPrice) && r.listing.extractedPrice > 0;
    const priceObservation = !hasPrice
      ? "No usable listing price supplied."
      : delta(r) ||
        (state.input.expectedPriceRange
          ? `Expected range: ${money(state.input.expectedPriceRange.min)}–${money(state.input.expectedPriceRange.max)}`
          : "No reference price supplied.");
    const urls = [
      ...new Map(
        matches.filter((m) => safeUrl(m.link)).map((m) => [safeUrl(m.link), m]),
      ).values(),
    ];
    $("evidencePanel").innerHTML =
      `<div class="detail-top"><p class="eyebrow">Listing ${state.selected + 1} <span aria-hidden="true">/</span> Evidence review</p>${badge(...p)}</div><h2 id="detailTitle" class="detail-title" tabindex="-1">${escape(r.listing.title || "Untitled listing")}</h2><div class="detail-meta"><span>${escape(r.listing.source || "Source not supplied")}</span><span>Discovered with Google Shopping</span></div><div class="compare-heading"><h3>The photos, side by side</h3><button class="text-button" id="expandComparison" type="button">Expand comparison ↗</button></div>${comparison(r)}<div class="signals">${signal("01 · Price", price(r), priceObservation, "Discounts can be legitimate. Check the exact variant and offer terms.", hasPrice && r.priceSignal?.isAnomalous ? "Price signal" : "Context", hasPrice && r.priceSignal?.isAnomalous ? "amber" : "")}${signal("02 · Seller / source", s.name, s.observation, s.note, "Name-based context")}${signal("03 · Visual", v.title, v.text, v.note, matches.length ? "Google Lens evidence" : "Inconclusive", v.tone)}</div><div class="priority-strip"><span class="priority-number">${Number.isFinite(r.compositeScore) ? escape(r.compositeScore) : "—"}</span><div><h3>Review Priority Score</h3><p>${escape(reason(r))}. A deterministic ranking heuristic, not a probability of counterfeit status.</p></div></div><details class="sources"><summary>Explore source evidence <span>${matches.length} Lens records</span></summary><p class="hint">Google Lens results relate to the discovered listing photo. Source names and related images do not verify authenticity.</p><ul class="source-list">${urls
        .slice(0, 8)
        .map(
          (m) =>
            `<li>${link(m.link, m.source || m.title || "Open source")}<small>${escape(m.kind)}</small></li>`,
        )
        .join(
          "",
        )}</ul>${!urls.length ? '<p class="hint">No linked visual source records available.</p>' : ""}${urls.length > 8 ? `<p class="hint">Showing the first 8 of ${urls.length} unique linked sources.</p>` : ""}<details><summary>How the service interpreted this evidence</summary><p class="hint">${escape(r.visualSignal?.anomalyType === "no_evidence" && matches.length ? "The service did not establish a reference match, despite returning related records. Review the sources above; no mismatch is established." : r.visualSignal?.anomalyType === "unavailable" ? v.text : r.visualSignal?.details || "No interpretation available.")}</p></details></details><div class="detail-action"><p>Next: check the product variant and seller details at the source.</p>${link(r.listing.productLink, "Open listing", "button primary") || '<span class="hint">Listing link unavailable</span>'}</div>`;
    wireImages($("evidencePanel"));
    updateRail();
    $("expandComparison").addEventListener("click", () => {
      $("dialogContent").innerHTML =
        `<div class="dialog-provenance">${badge($("dataBadge").textContent, state.data.dataSource === "fixture" ? "amber" : ["live", "cache"].includes(state.data.dataSource) ? "teal" : "")}<span>Source evidence via SerpApi</span></div><p class="muted" style="margin-bottom:18px">${escape(r.listing.title)}</p>${comparison(r)}<div class="priority-strip">${badge(...p)}<p>${escape(price(r))} · ${escape(delta(r) || "No reference price")} · ${escape(v.title)}</p></div>`;
      wireImages($("dialogContent"));
      $("comparisonDialog").showModal();
    });
  }
  function renderQueue() {
    const filter = $("queueFilter").value;
    const visible = state.data.results
      .map((r, i) => ({ r, i }))
      .filter(
        ({ r }) =>
          filter === "all" ||
          (filter === "priority"
            ? ["review", "review_urgently"].includes(r.recommendation)
            : records(r).length > 0),
      );
    $("queueCount").textContent = visible.length;
    $("resultsList").innerHTML = visible.length
      ? visible
          .map(({ r, i }) => {
            const dl = deltaShort(r);
            const cnt = records(r).length;
            const vtype = r.visualSignal?.anomalyType;
            const chips = [badge(...priority(r))];
            if (dl)
              chips.push(
                `<span class="qi-chip ${dl.change < 0 ? "warn" : ""}">${escape(dl.text)}</span>`,
              );
            if (cnt > 0)
              chips.push(`<span class="qi-chip good">${cnt} lens records</span>`);
            else if (vtype === "not_verified")
              chips.push(`<span class="qi-chip">Not checked</span>`);
            else if (vtype === "unavailable")
              chips.push(`<span class="qi-chip">Unavailable</span>`);
            else chips.push(`<span class="qi-chip">No source records</span>`);
            if (!usable(r.listing.seller))
              chips.push(`<span class="qi-chip">Seller not supplied</span>`);
            const ref = state.input?.mrp;
            const p = r.listing.extractedPrice;
            const viz =
              p > 0 && ref > 0
                ? `<span class="qi-viz" aria-hidden="true"><span class="qi-viz-fill ${p > ref ? "mid" : ""}" style="width:${Math.max(2, Math.min(100, (p / ref) * 100)).toFixed(0)}%"></span></span>`
                : "";
            return `<button class="queue-item" data-index="${i}" type="button" aria-pressed="${state.selected === i}" aria-controls="evidencePanel"><span class="qi-rank">${String(i + 1).padStart(2, "0")}</span><span class="qi-thumb queue-thumb">${image(r.listing.thumbnail, "")}</span><span class="qi-main"><span class="qi-source">${escape(r.listing.source || "Source not supplied")} <span class="qi-meta">via Google Shopping</span></span><span class="qi-title">${escape(r.listing.title || "Untitled listing")}</span><span class="qi-signals">${chips.join("")}</span></span><span class="qi-values"><span class="qi-price">${escape(price(r))}</span>${dl ? `<span class="qi-delta ${dl.change < 0 ? "warn" : ""}">${escape(dl.text)}</span>` : ""}${viz}</span><span class="qi-view" aria-hidden="true">→</span></button>`;
          })
          .join("")
      : `<div class="empty"><h3>${filter === "all" ? "No listings found" : "No listings in this view"}</h3><p>${filter === "priority" ? "No listings meet the service’s review threshold. Low priority does not establish authenticity." : filter === "visual" ? "No linked or structured Lens evidence was returned in this scan." : "Try a more specific product name."}</p>${filter !== "all" ? '<button class="button secondary" data-clear-filter>Show all listings</button>' : ""}</div>`;
    wireImages($("resultsList"));
    if (visible.length && !visible.some(({ i }) => i === state.selected))
      state.selected = visible[0].i;
    $("resultsList")
      .querySelectorAll("[data-index]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(Number(button.dataset.index) === state.selected),
        ),
      );
    renderDetail();
  }
  function renderResults(data, input) {
    state.data = data;
    state.input = input;
    state.resultInput = input;
    state.selected = 0;
    $("queueFilter").value = "all";
    $("home").hidden = true;
    $("resultsSection").hidden = false;
    $("errorPanel").hidden = true;
    $("resultsProduct").textContent = input.productName;
    const source = data.dataSource;
    $("dataBadge").className =
      `badge ${source === "fixture" ? "amber" : source === "live" || source === "cache" ? "teal" : ""}`;
    $("dataBadge").textContent =
      source === "fixture"
        ? "FIXTURE MODE · Sample data"
        : source === "cache"
          ? "CACHED LIVE RESULT"
          : source === "live"
            ? "SERPAPI RESULT · Live API mode"
            : "PROVENANCE UNAVAILABLE";
    const time = new Date(data.createdAt);
    $("resultsMeta").textContent =
      `${Number.isNaN(time.getTime()) ? "" : `Scan created ${time.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · `}${source === "fixture" ? "Synthetic fixtures, not current marketplace evidence." : source === "cache" ? "Previously retrieved evidence; not a new live search." : source === "live" ? "Search responses may be cached." : "The response did not identify its data origin."} Visual analysis is bounded to the top 10 candidates to control API usage.`;
    const results = data.results;
    const sources = new Set(results.map((r) => r.listing.source).filter(usable))
      .size;
    const prioritized = results.filter((r) =>
      ["review", "review_urgently"].includes(r.recommendation),
    ).length;
    const withEvidence = results.filter((r) => records(r).length).length;
    $("metrics").innerHTML = [
      [results.length, "Listings in your queue"],
      [prioritized, "Prioritized for review"],
      [sources, "Sources represented"],
      [withEvidence, "Listings with Lens records"],
    ]
      .map(
        ([n, label]) =>
          `<div class="metric"><strong>${n}</strong><span>${label}</span></div>`,
      )
      .join("");
    const skipped = results.filter(
      (r) => r.visualSignal?.anomalyType === "not_verified",
    ).length;
    const unavailable = results.filter(
      (r) => r.visualSignal?.anomalyType === "unavailable",
    ).length;
    $("coverage").textContent =
      `${withEvidence} of ${results.length} listings have returned visual source records. ${skipped ? `${skipped} not visually checked (scan limit). ` : ""}${unavailable ? `${unavailable} without usable visual evidence. ` : ""}Missing evidence is inconclusive.`;
    renderReference();
    renderQueue();
    $("resultsTitle").focus();
    announce(`${results.length} listings ready for review.`);
  }
  function edit() {
    $("resultsSection").hidden = true;
    $("errorPanel").hidden = true;
    $("home").hidden = false;
    $("productName").focus();
  }
  function readInput() {
    const mrp = $("mrp").value ? Number($("mrp").value) : undefined;
    const min = $("minPrice").value,
      max = $("maxPrice").value;
    $("maxPrice").setCustomValidity(
      (min || max) && (!min || !max || Number(max) < Number(min))
        ? "Enter both prices, with maximum at least equal to minimum."
        : "",
    );
    $("productName").setCustomValidity(
      $("productName").value.trim() ? "" : "Enter a product name.",
    );
    $("officialImageUrl").setCustomValidity(
      safeUrl($("officialImageUrl").value.trim())
        ? ""
        : "Use a public http or https image link.",
    );
    if (!$("maxPrice").validity.valid || !$("minPrice").validity.valid)
      document.querySelector(".context").open = true;
    if (!$("scanForm").reportValidity()) return null;
    const payload = {
      productName: $("productName").value.trim(),
      officialImageUrl: $("officialImageUrl").value.trim(),
      mrp,
      expectedPriceRange:
        min && max ? { min: Number(min), max: Number(max) } : undefined,
      knownAuthorizedSellers: $("authorizedSellers")
        .value.split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    
    const file = $("imageFile")?.files?.[0];
    if (file) {
      payload.imageFile = file;
    }
    return payload;
  }
  async function scan(input) {
    if (state.busy) return;
    state.busy = true;
    state.input = input;
    $("fields").disabled = true;
    $("home").hidden = true;
    $("resultsSection").hidden = true;
    $("errorPanel").hidden = true;
    $("loading").hidden = false;
    $("loadingProduct").textContent = input.productName;
    $("loadingTitle").focus();
    $("elapsed").textContent = "0s elapsed";
    $("loadingNote").textContent =
      "The scan is running. Results arrive together when processing finishes; these are workflow steps, not live stage indicators.";
    const started = Date.now();
    const controller = new AbortController();
    const timer = setInterval(() => {
      const seconds = Math.floor((Date.now() - started) / 1000);
      $("elapsed").textContent = `${seconds}s elapsed`;
      if (seconds >= 30)
        $("loadingNote").textContent =
          "Still waiting for search and image responses. Visual checks can take a few minutes. You do not need to start another scan.";
    }, 1000);
    const timeout = setTimeout(() => controller.abort(), 240000);
    try {
      let fetchOptions = {
        method: "POST",
        signal: controller.signal,
      };

      if (input.imageFile) {
        const formData = new FormData();
        formData.append("productName", input.productName);
        if (input.officialImageUrl) formData.append("officialImageUrl", input.officialImageUrl);
        if (input.mrp) formData.append("mrp", input.mrp);
        formData.append("imageFile", input.imageFile);
        
        // Preview local image
        input.officialImageUrl = URL.createObjectURL(input.imageFile);
        fetchOptions.body = formData;
      } else {
        fetchOptions.headers = { "Content-Type": "application/json" };
        fetchOptions.body = JSON.stringify(input);
      }

      const response = await fetch("/api/beacontra/scan", fetchOptions);
      if (!response.ok) {
        let serverError;
        try {
          const errData = await response.json();
          serverError = errData.error;
        } catch {
          // ignore parsing error
        }
        const error = new Error(serverError || "request");
        error.status = response.status;
        throw error;
      }
      const payload = await response.json();
      if (!Array.isArray(payload.data?.results)) throw new Error("response");
      renderResults(payload.data, input);
    } catch (error) {
      $("errorPanel").hidden = false;
      $("returnBtn").hidden = !state.data;
      $("errorMessage").textContent =
        error.name === "AbortError"
          ? "The scan took longer than expected. Your product details are saved. The server may still be processing; wait a moment before retrying."
          : error.status === 429
            ? "The search service is at its request limit. Wait a little before retrying; your product details are saved."
            : [401, 403].includes(error.status)
              ? "The search service could not authorize this request. Check the server’s SerpApi configuration before retrying."
              : error.message !== "request" && error.message !== "response"
                ? error.message
                : "Marketplace search is temporarily unavailable. Your product details are saved — retry, or edit the product and image link.";
      $("retryBtn").focus();
    } finally {
      clearInterval(timer);
      clearTimeout(timeout);
      state.busy = false;
      $("fields").disabled = false;
      $("loading").hidden = true;
    }
  }
  function preview() {
    const version = ++state.previewVersion;
    const url = safeUrl($("officialImageUrl").value.trim());
    $("removeImage").hidden = !$("officialImageUrl").value;
    $("imageStatus").className = "hint";
    $("imagePreview").innerHTML = "<span>Your genuine<br>product photo</span>";
    if (!url) {
      $("imageStatus").textContent = $("officialImageUrl").value
        ? "Enter a valid public image link."
        : "";
      return;
    }
    $("imageStatus").textContent = "Loading preview…";
    const img = new Image();
    img.alt = "Preview of your genuine product photo";
    img.referrerPolicy = "no-referrer";
    img.onload = () => {
      if (version !== state.previewVersion) return;
      $("imagePreview").replaceChildren(img);
      $("imageStatus").textContent =
        "Photo ready. Change the link to replace it.";
    };
    img.onerror = () => {
      if (version !== state.previewVersion) return;
      $("imageStatus").className = "hint error";
      $("imageStatus").textContent =
        "Preview unavailable. Check the link or use another image.";
    };
    img.src = url;
  }
  let previewTimer;
  $("officialImageUrl").addEventListener("input", () => {
    $("officialImageUrl").setCustomValidity("");
    ++state.previewVersion;
    clearTimeout(previewTimer);
    previewTimer = setTimeout(preview, 450);
  });
  $("productName").addEventListener("input", () =>
    $("productName").setCustomValidity(""),
  );
  for (const id of ["minPrice", "maxPrice"])
    $(id).addEventListener("input", () => $("maxPrice").setCustomValidity(""));
  $("removeImage").addEventListener("click", () => {
    $("officialImageUrl").value = "";
    preview();
    $("officialImageUrl").focus();
  });
  $("loadDemoBtn").addEventListener("click", () => {
    $("productName").value = "boAt Airdopes 141";
    $("officialImageUrl").value =
      "https://www.boat-lifestyle.com/cdn/shop/files/AD141-FI_Black06_600x.jpg";
    for (const id of ["mrp", "minPrice", "maxPrice", "authorizedSellers"])
      $(id).value = "";
    $("productName").setCustomValidity("");
    $("officialImageUrl").setCustomValidity("");
    $("maxPrice").setCustomValidity("");
    preview();
    announce(
      "Product example loaded. Add your own reference price and seller context if known.",
    );
  });
  $("scanForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = readInput();
    if (input) scan(input);
  });
  $("retryBtn").addEventListener("click", () => scan(state.input));
  $("editBtn").addEventListener("click", edit);
  $("newScanBtn").addEventListener("click", edit);
  $("returnBtn").addEventListener("click", () =>
    renderResults(state.data, state.resultInput),
  );
  $("queueFilter").addEventListener("change", () => {
    renderQueue();
    announce(`${$("queueCount").textContent} listings in this view.`);
  });
  $("resultsList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-index]");
    if (button) {
      state.selected = Number(button.dataset.index);
      $("resultsList")
        .querySelectorAll("[data-index]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      renderDetail();
      announce(`Selected listing ${state.selected + 1}.`);
      if (matchMedia("(max-width: 600px)").matches) $("detailTitle").focus();
    }
    if (event.target.closest("[data-clear-filter]")) {
      $("queueFilter").value = "all";
      renderQueue();
    }
  });
  $("evidencePanel").addEventListener("click", (event) => {
    if (event.target.closest("[data-edit]")) edit();
  });
  $("closeDialog").addEventListener("click", () =>
    $("comparisonDialog").close(),
  );
  $("comparisonDialog").addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const controls = [
      ...event.currentTarget.querySelectorAll(
        'button, a[href], input, select, [tabindex="0"]',
      ),
    ];
    const first = controls[0],
      last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  $("comparisonDialog").addEventListener("click", (event) => {
    if (event.target === $("comparisonDialog")) {
      const r = event.target.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        event.target.close();
    }
  });
})();
