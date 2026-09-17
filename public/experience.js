// Progressive enhancement only: form, scan, evidence and source links work without this file.
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const scene = $("signalScene");
  const referenceGlyph = $("heroReference").innerHTML;
  let frame = 0;
  function resetDepth() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    scene.style.removeProperty("--tilt-x");
    scene.style.removeProperty("--tilt-y");
    document.querySelectorAll(".image-well").forEach((el) => {
      el.style.removeProperty("--image-x");
      el.style.removeProperty("--image-y");
    });
  }
  document.addEventListener(
    "pointermove",
    (event) => {
      if (reduce.matches || !fine.matches || document.hidden || frame) return;
      const target = event.target.closest("#signalScene, .image-well");
      if (!target) return;
      const x = event.clientX,
        y = event.clientY;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = target.getBoundingClientRect();
        const dx = Math.max(
          -1,
          Math.min(1, ((x - rect.left) / rect.width) * 2 - 1),
        );
        const dy = Math.max(
          -1,
          Math.min(1, ((y - rect.top) / rect.height) * 2 - 1),
        );
        const prefix = target === scene ? "--tilt" : "--image";
        target.style.setProperty(`${prefix}-x`, `${-dy * 3}deg`);
        target.style.setProperty(`${prefix}-y`, `${dx * 4}deg`);
      });
    },
    { passive: true },
  );
  document.addEventListener(
    "pointerout",
    (event) => {
      const target = event.target.closest("#signalScene, .image-well");
      if (target && !target.contains(event.relatedTarget)) resetDepth();
    },
    { passive: true },
  );
  reduce.addEventListener("change", resetDepth);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) resetDepth();
  });
  function goToForm() {
    $("scanTitle").focus({ preventScroll: true });
    $("scanTitle").scrollIntoView({
      behavior: reduce.matches ? "instant" : "smooth",
      block: "start",
    });
  }
  document.querySelector("[data-start]").addEventListener("click", (event) => {
    event.preventDefault();
    goToForm();
  });
  $("heroExample").addEventListener("click", () => {
    $("loadDemoBtn").click();
    goToForm();
  });

  // Only propagate an image that the existing preview has successfully loaded.
  const previewObserver = new MutationObserver(() => {
    const img = $("imagePreview").querySelector("img");
    document.querySelector(".photo-input").dataset.ready = String(Boolean(img));
    if (!img) {
      $("heroReference").innerHTML = referenceGlyph;
      $("heroReferenceName").textContent = "Your product, at the center.";
      return;
    }
    const clone = img.cloneNode();
    clone.alt = "";
    $("heroReference").replaceChildren(clone);
    $("heroReferenceName").textContent =
      $("productName").value.trim() || "Your product reference";
  });
  previewObserver.observe($("imagePreview"), { childList: true });
  $("productName").addEventListener("input", () => {
    if ($("heroReference").querySelector("img"))
      $("heroReferenceName").textContent =
        $("productName").value.trim() || "Your product reference";
  });
  const states = [$("loading"), $("resultsSection")];
  const stateObserver = new MutationObserver((entries) => {
    for (const { target } of entries) {
      if (target.hidden) continue;
      target.classList.remove("reveal-section");
      if (!reduce.matches)
        requestAnimationFrame(() => target.classList.add("reveal-section"));
      if (target === $("loading")) {
        let img = $("imagePreview").querySelector("img");
        // A URL may have changed just before submit, before the preview debounce.
        // Never animate an old reference as though it belongs to the new scan.
        try {
          if (img?.src !== new URL($("officialImageUrl").value.trim()).href)
            img = null;
        } catch {
          img = null;
        }
        if (img) {
          const clone = img.cloneNode();
          clone.alt = "";
          $("scanReference").replaceChildren(clone);
        } else $("scanReference").textContent = "Product reference";
      }
    }
  });
  states.forEach((el) =>
    stateObserver.observe(el, {
      attributes: true,
      attributeFilter: ["hidden"],
    }),
  );
  const detailObserver = new MutationObserver(() => {
    if (reduce.matches) return;
    $("evidencePanel").classList.remove("is-changing");
    requestAnimationFrame(() =>
      $("evidencePanel").classList.add("is-changing"),
    );
  });
  detailObserver.observe($("evidencePanel"), { childList: true });
})();
