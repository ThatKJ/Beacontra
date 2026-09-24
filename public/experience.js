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
  function resetMagnetic(el) {
    el.style.removeProperty("--mx");
    el.style.removeProperty("--my");
  }
  document.addEventListener(
    "pointermove",
    (event) => {
      if (reduce.matches || !fine.matches || document.hidden || frame) return;
      const target = event.target.closest(
        "#signalScene, .image-well, .magnetic",
      );
      if (!target) return;
      if (target === scene && scene.closest(".hero")?.classList.contains("is-locked"))
        return;
      const x = event.clientX,
        y = event.clientY;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = target.getBoundingClientRect();
        if (target.classList.contains("magnetic")) {
          const mx = (x - (rect.left + rect.width / 2)) * 0.28;
          const my = (y - (rect.top + rect.height / 2)) * 0.28;
          target.style.setProperty("--mx", `${mx.toFixed(1)}px`);
          target.style.setProperty("--my", `${my.toFixed(1)}px`);
          return;
        }
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
      const target = event.target.closest(
        "#signalScene, .image-well, .magnetic",
      );
      if (!target || target.contains(event.relatedTarget)) return;
      if (target.classList.contains("magnetic")) resetMagnetic(target);
      else resetDepth();
    },
    { passive: true },
  );
  function resetAllMagnetic() {
    document.querySelectorAll(".magnetic").forEach(resetMagnetic);
  }
  reduce.addEventListener("change", () => {
    resetDepth();
    resetAllMagnetic();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      resetDepth();
      resetAllMagnetic();
    }
  });

  // Custom cursor: subtle dot + ring, desktop fine-pointer only. Its own rAF
  // flag — the tilt/magnetic listener above only fires when hovering specific
  // targets, but the cursor has to track pointer position everywhere.
  let cursorDot = null,
    cursorRing = null,
    cursorFrame = 0;
  function createCursor() {
    if (cursorDot) return;
    cursorDot = document.createElement("div");
    cursorDot.id = "cursorDot";
    cursorDot.setAttribute("aria-hidden", "true");
    cursorRing = document.createElement("div");
    cursorRing.id = "cursorRing";
    cursorRing.setAttribute("aria-hidden", "true");
    document.body.append(cursorDot, cursorRing);
  }
  function destroyCursor() {
    cursorDot?.remove();
    cursorRing?.remove();
    cursorDot = cursorRing = null;
    delete document.documentElement.dataset.cursor;
  }
  function syncCursor() {
    if (reduce.matches || !fine.matches) destroyCursor();
    else createCursor();
  }
  syncCursor();
  reduce.addEventListener("change", syncCursor);
  fine.addEventListener("change", syncCursor);
  document.addEventListener(
    "pointermove",
    (event) => {
      if (!cursorDot || document.hidden || cursorFrame) return;
      const x = event.clientX,
        y = event.clientY;
      const hover = event.target.closest(
        ".cta, .magnetic, .image-well, .en-node-signal, .queue-item",
      );
      cursorFrame = requestAnimationFrame(() => {
        cursorFrame = 0;
        if (!cursorDot) return;
        cursorDot.style.setProperty("--cx", `${x}px`);
        cursorDot.style.setProperty("--cy", `${y}px`);
        cursorRing.style.setProperty("--cx", `${x}px`);
        cursorRing.style.setProperty("--cy", `${y}px`);
        cursorDot.classList.add("is-active");
        cursorRing.classList.add("is-active");
        document.documentElement.dataset.cursor = !hover
          ? ""
          : hover.matches(".cta, .magnetic")
            ? "cta"
            : hover.matches(".image-well")
              ? "image"
              : "evidence";
      });
    },
    { passive: true },
  );
  document.addEventListener(
    "pointerleave",
    () => {
      cursorDot?.classList.remove("is-active");
      cursorRing?.classList.remove("is-active");
    },
    { passive: true },
  );
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cursorDot?.classList.remove("is-active");
      cursorRing?.classList.remove("is-active");
    }
  });
  // Suppress the cursor while a real form control is focused or the
  // comparison dialog is open, so it never fights native focus/validation
  // affordances. Neither the dialog's own controls nor the form are inputs
  // that overlap, so a shared toggle is safe here.
  function setCursorSuppressed(on) {
    document.documentElement.classList.toggle("cursor-suppress", on);
  }
  document.addEventListener("focusin", (event) => {
    if (event.target.matches("input, textarea, select, [contenteditable]"))
      setCursorSuppressed(true);
  });
  document.addEventListener("focusout", (event) => {
    if (event.target.matches("input, textarea, select, [contenteditable]"))
      setCursorSuppressed(false);
  });
  const dialog = $("comparisonDialog");
  new MutationObserver(() =>
    setCursorSuppressed(dialog.hasAttribute("open")),
  ).observe(dialog, { attributes: true, attributeFilter: ["open"] });

  function goToForm() {
    $("scanTitle").focus({ preventScroll: true });
    $("scanTitle").scrollIntoView({
      behavior: reduce.matches ? "instant" : "smooth",
      block: "start",
    });
  }
  document.querySelectorAll("[data-start]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.preventDefault();
      goToForm();
    }),
  );
  for (const id of ["heroExample", "ctaExample"]) {
    $(id)?.addEventListener("click", () => {
      $("loadDemoBtn").click();
      goToForm();
    });
  }

  // Header state, mobile nav and scroll-linked pipeline (throttled to one rAF/scroll).
  const header = $("siteHeader");
  const navToggle = $("navToggle");
  const siteNav = $("siteNav");
  function setNav(open) {
    navToggle.setAttribute("aria-expanded", String(open));
    siteNav.classList.toggle("open", open);
  }
  navToggle.addEventListener("click", () =>
    setNav(navToggle.getAttribute("aria-expanded") !== "true"),
  );
  siteNav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => setNav(false)),
  );
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      navToggle.getAttribute("aria-expanded") === "true"
    ) {
      setNav(false);
      navToggle.focus();
    }
  });
  addEventListener("resize", () => {
    if (matchMedia("(min-width: 901px)").matches) setNav(false);
    paintPipeline();
  });

  const pipeline = document.querySelector("[data-pipeline]");
  function paintPipeline() {
    if (!pipeline) return;
    const rect = pipeline.getBoundingClientRect();
    const vh = innerHeight;
    const span = rect.height - vh * 0.65;
    const p = Math.min(1, Math.max(0, (vh * 0.8 - rect.top) / span));
    pipeline.querySelector(".pipeline-fill").style.width =
      `${Math.round(p * 100)}%`;
    const stages = pipeline.querySelectorAll(".ps-stage");
    stages.forEach((stage) => {
      const i = Number(stage.dataset.step || 1);
      const lo = (i - 1) / stages.length;
      const hi = i / stages.length;
      stage.classList.toggle("is-done", p >= hi);
      stage.classList.toggle("is-active", p >= lo && p < hi);
    });
  }
  // Continuous scroll-linked choreography for the hero only, gated behind its
  // own IntersectionObserver so onScrollFrame doesn't run getBoundingClientRect()
  // for a section nowhere near the viewport on every scroll frame.
  const heroInView = new Set();
  const heroObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries)
            entry.isIntersecting
              ? heroInView.add(entry.target.id)
              : heroInView.delete(entry.target.id);
        },
        { rootMargin: "20% 0px 20% 0px", threshold: 0 },
      )
    : null;
  heroObserver?.observe($("top"));
  // #home can be hidden/re-shown (edit() in app.js) at any scroll position,
  // independent of actual scrolling — reset the lock so a stale dimmed state
  // from before never persists into a fresh view of the hero.
  new MutationObserver(() => {
    if ($("home").hidden) return;
    $("top").style.setProperty("--hero-lock", 0);
    $("top").classList.remove("is-locked");
  }).observe($("home"), { attributes: true, attributeFilter: ["hidden"] });
  function paintHeroLock() {
    if (!heroObserver || !heroInView.has("top")) return;
    const hero = $("top");
    const rect = hero.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -rect.top / (rect.height * 0.6)));
    hero.style.setProperty("--hero-lock", p.toFixed(3));
    hero.classList.toggle("is-locked", p > 0.55);
  }

  let scrollTick = false;
  function onScrollFrame() {
    scrollTick = false;
    header.classList.toggle("scrolled", scrollY > 12);
    paintPipeline();
    paintHeroLock();
  }
  addEventListener(
    "scroll",
    () => {
      if (!scrollTick) {
        scrollTick = true;
        requestAnimationFrame(onScrollFrame);
      }
    },
    { passive: true },
  );
  onScrollFrame();

  const spyLinks = document.querySelectorAll(".site-nav a[data-spy]");
  const spySections = [...spyLinks]
    .map((a) => $(a.dataset.spy))
    .filter(Boolean);
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          for (const a of spyLinks)
            a.classList.toggle("is-active", a.dataset.spy === entry.target.id);
        }
      },
      { rootMargin: "-38% 0px -55% 0px", threshold: 0 },
    );
    spySections.forEach((section) => spy.observe(section));
  }

  // Section-entry reveals: a generic [data-reveal] trigger observed once each,
  // separate from the scroll-tick below since IntersectionObserver doesn't run
  // on every scroll frame — this costs nothing in onScrollFrame.
  const revealObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.15 },
      )
    : null;
  document.querySelectorAll("[data-reveal]").forEach((el, i) => {
    el.style.setProperty("--i", i % 6);
    if (revealObserver) revealObserver.observe(el);
    else el.classList.add("is-visible");
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