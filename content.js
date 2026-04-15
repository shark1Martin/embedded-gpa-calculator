(function () {
  const OVERLAY_CLASS = "gpa-overlay-extension";
  let rafHandle = null;
  let overlayCounter = 0;

  const letterToPoint = {
    "A+": 4.0,
    A: 4.0,
    "A-": 3.7,
    "B+": 3.3,
    B: 3.0,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    "C-": 1.7,
    "D+": 1.3,
    D: 1.0,
    "D-": 0.7,
    F: 0
  };

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

    const normalizedLetter = grade.toUpperCase();
    return normalizedLetter in letterToPoint ? letterToPoint[normalizedLetter] : null;
  }

  function parseUnit(rawUnits) {
    const cleaned = rawUnits.trim().replace(/\u00a0/g, "");
    if (!cleaned) return null;
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

    const unitsIndex = headers.findIndex((value) => value === "units");
    const gradeIndex = headers.findIndex((value) => value === "grade");

    if (unitsIndex === -1 || gradeIndex === -1) return null;

    return {
      unitsIndex,
      gradeIndex
    };
  }

  function readRows(table, columns) {
    const rows = [];
    const bodyRows = table.querySelectorAll("tbody tr");

    for (const row of bodyRows) {
      const cells = row.querySelectorAll("td");
      if (
        cells.length <= Math.max(columns.unitsIndex, columns.gradeIndex)
      ) {
        continue;
      }

      const unitEl = cells[columns.unitsIndex];
      const gradeEl = cells[columns.gradeIndex];

      if (!unitEl || !gradeEl) continue;

      const unitValue = parseUnit(unitEl.textContent || "");
      const gradePoint = gradeToPoint(gradeEl.textContent || "");
      const rawGrade = (gradeEl.textContent || "").trim().replace(/\u00a0/g, "");

      if (unitValue == null || gradePoint == null) continue;

      rows.push({
        units: unitValue,
        gradePoint,
        rawGrade
      });
    }

    return rows;
  }

  function calculateGpa(rows) {
    let weightedTotal = 0;
    let totalUnits = 0;

    for (const row of rows) {
      weightedTotal += row.gradePoint * row.units;
      totalUnits += row.units;
    }

    if (totalUnits <= 0) {
      return null;
    }

    return {
      gpa: weightedTotal / totalUnits,
      totalUnits,
      countedCourses: rows.length
    };
  }

  function ensureOverlay(table) {
    const parent = table.parentNode;
    if (!parent) return null;

    const tableKey = table.dataset.gpaOverlayKey || table.id || `table-${overlayCounter++}`;
    table.dataset.gpaOverlayKey = tableKey;
    let overlay = parent.querySelector(
      `.${OVERLAY_CLASS}[data-gpa-table-key="${CSS.escape(tableKey)}"]`
    );

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = OVERLAY_CLASS;
      overlay.dataset.gpaTableKey = tableKey;
      parent.insertBefore(overlay, table);
    } else if (overlay.nextElementSibling !== table) {
      parent.insertBefore(overlay, table);
    }

    return overlay;
  }

  function renderOverlay(table, result) {
    const overlay = ensureOverlay(table);
    if (!overlay) return;

    if (!result) {
      overlay.innerHTML =
        '<div class="gpa-title">GPA Overlay</div><div class="gpa-empty">No posted numeric/letter grades found yet.</div>';
      return;
    }

    overlay.innerHTML = `
      <div class="gpa-title">Current GPA</div>
      <div class="gpa-value">${result.gpa.toFixed(2)} / 4.00</div>
      <div class="gpa-meta">Counted courses: ${result.countedCourses} | Total units: ${result.totalUnits.toFixed(2)}</div>
    `;
  }

  function findEligibleTables() {
    return Array.from(document.querySelectorAll("table")).filter((table) => {
      const columns = findColumnIndexes(table);
      return columns !== null;
    });
  }

  function update() {
    const tables = findEligibleTables();
    if (!tables.length) return;

    for (const table of tables) {
      const columns = findColumnIndexes(table);
      if (!columns) continue;
      const rows = readRows(table, columns);
      const result = calculateGpa(rows);
      renderOverlay(table, result);
    }
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
