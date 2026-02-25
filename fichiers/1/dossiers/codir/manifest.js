// AUTO-GENERATED
// Pattern: Codir-CCRN-YYYY-MM
// Intervalle: 2023-04 → 2026-01 inclus
// Compatible file://
// Doit rester dans le même dossier que codir.html

(function () {
  const startYear = 2023;
  const startMonth = 4;

  const endYear = 2026;
  const endMonth = 1;

  const items = [];

  let y = startYear;
  let m = startMonth;

  while (y < endYear || (y === endYear && m <= endMonth)) {
    const mm = String(m).padStart(2, '0');

    const baseName = `Codir-CCRN-${y}-${mm}`;

    items.push({
      base: baseName,
      label: `CODIR ${y}-${mm}`
    });

    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  // Tri décroissant par défaut (plus récent en premier)
  items.reverse();

  window.CODIR_MANIFEST = items;
})();