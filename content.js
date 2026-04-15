(function () {
  const OVERLAY_ID = "gpa-overlay-extension";
  let rafHandle = null;

  function gradeToPoint(rawGrade) {
    const grade = rawGrade.trim().replace(/\u00a0/g, "");
    if (!grade) return null;

    // Western University scale 3 (percentage) conversion.
    if (/^\d+(\.\d+)?$/.test(grade)) {
      const numericGrade = Number(grade);
      if (numericGrade >= 90) return 4.0;
      if (numericGrade >= 85) return 3.9;
      if (numericGrade >= 80) return 3.7;
      if (numericGrade >= 77) return 3.3;
      if (numericGrade >= 73) return 3.0;
      if (numericGrade >= 70) return 2.7;
      if (numericGrade >= 67) return 2.3;
      if (numericGrade >= 63) return 2.0;
      if (numericGrade >= 60) return 1.7;
      if (numericGrade >= 57) return 1.3;
      if (numericGrade >= 53) return 1.0;
      if (numericGrade >= 50) return 0.7;
      return 0;
    }

    return null;
  }

  function parseCredits(raw) {
    const cleaned = raw.trim().replace(/\u00a0/g, "");
    if (!cleaned) return null;
    const value = Number(cleaned);
    return Number.isFinite(value) ? value : null;
  }

  function parseNumericGrade(rawGrade) {
    const cleaned = rawGrade.trim().replace(/\u00a0/g, "");
    if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
    const value = Number(cleaned);
    return Number.isFinite(value) ? value : null;
  }

  function normalizeHeader(text) {
    return text.trim().replace(/\s+/g, " ").toLowerCase();
  }

  function findColumnIndexes(table) {
    const headerRow = Array.from(table.querySelectorAll("tr")).find((row) =>
      row.querySelectorAll("th").length > 0
    );
    if (!headerRow) return null;

    const headers = Array.from(headerRow.querySelectorAll("th")).map((th) =>
      normalizeHeader(th.textContent || "")
    );

    const creditsIndex = headers.findIndex((value) => value === "units");
    const gradeIndex = headers.findIndex((value) => value === "grade");

    if (creditsIndex === -1 || gradeIndex === -1) return null;

    return {
      creditsIndex,
      gradeIndex
    };
  }

  function getBodyRows(table) {
    return Array.from(table.querySelectorAll("tbody tr"));
  }

  function readRows(table, columns) {
    const rows = [];
    const bodyRows = getBodyRows(table);

    for (const row of bodyRows) {
      const cells = row.querySelectorAll("td");
      if (
        cells.length <= Math.max(columns.creditsIndex, columns.gradeIndex)
      ) {
        continue;
      }

      const creditEl = cells[columns.creditsIndex];
      const gradeEl = cells[columns.gradeIndex];

      if (!creditEl || !gradeEl) continue;

      const rawGrade = (gradeEl.textContent || "").trim().replace(/\u00a0/g, "");
      const credits = parseCredits(creditEl.textContent || "");
      const gradePoint = gradeToPoint(rawGrade);
      const numericGrade = parseNumericGrade(rawGrade);

      if (credits == null || gradePoint == null) continue;

      rows.push({
        credits,
        gradePoint,
        numericGrade,
        rawGrade
      });
    }

    return rows;
  }

  function calculateGpa(rows) {
    let weightedTotal = 0;
    let totalCredits = 0;
    let weightedPercentTotal = 0;
    let percentCredits = 0;

    for (const row of rows) {
      weightedTotal += row.gradePoint * row.credits;
      totalCredits += row.credits;
      if (row.numericGrade != null) {
        weightedPercentTotal += row.numericGrade * row.credits;
        percentCredits += row.credits;
      }
    }

    if (totalCredits <= 0) {
      return null;
    }

    return {
      gpa: weightedTotal / totalCredits,
      weightedAveragePercent:
        percentCredits > 0 ? weightedPercentTotal / percentCredits : null,
      totalCredits,
      countedCourses: rows.length
    };
  }

  function ensureOverlay(table) {
    removeLegacyOverlays();

    const parent = table.parentNode;
    if (!parent) return null;

    let overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = OVERLAY_ID;
      parent.insertBefore(overlay, table);
    } else if (overlay.parentNode !== parent || overlay.nextElementSibling !== table) {
      parent.insertBefore(overlay, table);
    }

    return overlay;
  }

  function removeLegacyOverlays() {
    const legacy = document.querySelectorAll(".gpa-overlay-extension");
    for (const node of legacy) {
      node.remove();
    }
  }

  function renderOverlay(table, result) {
    const overlay = ensureOverlay(table);
    if (!overlay) return;

    if (!result) {
      overlay.innerHTML =
        '<div class="gpa-row"><span class="gpa-kv"><strong>GPA:</strong> N/A</span><span class="gpa-kv">Weight Average: N/A</span><span class="gpa-kv">Courses: 0</span><span class="gpa-kv">Credits: 0.00</span></div>';
      return;
    }

    const averageText =
      result.weightedAveragePercent == null
        ? "N/A"
        : `${result.weightedAveragePercent.toFixed(2)}%`;

    overlay.innerHTML = `
      <div class="gpa-row">
        <span class="gpa-kv"><strong>GPA:</strong> ${result.gpa.toFixed(2)} / 4.00</span>
        <span class="gpa-kv">Weighted Average: ${averageText}</span>
        <span class="gpa-kv">Courses: ${result.countedCourses}</span>
        <span class="gpa-kv">Credits: ${result.totalCredits.toFixed(2)}</span>
      </div>
    `;
  }

  function isElementVisible(element) {
    const styles = window.getComputedStyle(element);
    if (styles.display === "none" || styles.visibility === "hidden") return false;
    if (element.closest('[aria-hidden="true"]')) return false;
    return element.getClientRects().length > 0;
  }

  function findEligibleTables() {
    return Array.from(document.querySelectorAll("table"))
      .map((table) => {
        const columns = findColumnIndexes(table);
        if (!columns) return null;
        const bodyRowCount = getBodyRows(table).length;
        if (!bodyRowCount) return null;
        const parsedRows = readRows(table, columns);
        return {
          table,
          columns,
          bodyRowCount,
          parsedRowsCount: parsedRows.length,
          visible: isElementVisible(table)
        };
      })
      .filter(Boolean);
  }

  function findTermAnchor() {
    const selects = Array.from(document.querySelectorAll("select"));
    return (
      selects.find((select) => {
        const idNameLabel = [
          select.id || "",
          select.name || "",
          select.getAttribute("aria-label") || ""
        ]
          .join(" ")
          .toLowerCase();
        if (idNameLabel.includes("term")) return true;

        const localText = (
          select.closest("tr, div, td, form")?.textContent || ""
        ).toLowerCase();
        return localText.includes("select term");
      }) || null
    );
  }

  function selectPrimaryTable(candidates) {
    if (!candidates.length) return null;

    const termAnchor = findTermAnchor();
    if (termAnchor && isElementVisible(termAnchor)) {
      const anchorRect = termAnchor.getBoundingClientRect();
      const positioned = candidates
        .map((candidate) => {
          const tableRect = candidate.table.getBoundingClientRect();
          const distanceFromTerm = tableRect.top - anchorRect.bottom;
          return {
            ...candidate,
            distanceFromTerm
          };
        })
        .filter((candidate) => candidate.distanceFromTerm >= -4)
        .sort((a, b) => a.distanceFromTerm - b.distanceFromTerm);

      if (positioned.length) {
        return positioned[0];
      }
    }

    return candidates.sort((a, b) => {
      const visibleDelta = Number(b.visible) - Number(a.visible);
      if (visibleDelta !== 0) return visibleDelta;

      const parsedDelta = b.parsedRowsCount - a.parsedRowsCount;
      if (parsedDelta !== 0) return parsedDelta;

      return b.bodyRowCount - a.bodyRowCount;
    })[0];
  }

  function clearOverlayIfAny() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) overlay.remove();
  }

  function update() {
    const candidates = findEligibleTables();
    const target = selectPrimaryTable(candidates);
    if (!target) {
      clearOverlayIfAny();
      return;
    }

    const rows = readRows(target.table, target.columns);
    const result = calculateGpa(rows);
    renderOverlay(target.table, result);
  }

  function scheduleUpdate() {
    if (rafHandle !== null) return;
    rafHandle = window.requestAnimationFrame(() => {
      rafHandle = null;
      update();
    });
  }

  const observer = new MutationObserver(() => {
    scheduleUpdate();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  update();
})();
