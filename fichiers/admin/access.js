// Codes -> permissions (droits orthogonaux)
const ACCESS_PROFILES = {
  "a": { label: "Roger", perms: ["1", "2", "3"] },
  "b": { label: "Marc", perms: ["5"] },
  "c": { label: "Manager", perms: ["2", "6"] },
  "d": { label: "Boss", perms: ["*"] }, // tout
  "e": { label: "Supra Boss", perms: ["*"] }, // tout
};

function getSession() {
  try {
    return JSON.parse(localStorage.getItem("portal_session") || "null") || {
      label: "Public",
      perms: ["1"], // ✅ public = page 1 uniquement
    };
  } catch {
    return { label: "Public", perms: ["1"] };
  }
}

function setSession(session) {
  localStorage.setItem("portal_session", JSON.stringify(session));
  location.reload();
}

function logout() {
  localStorage.removeItem("portal_session");
  location.reload();
}

function hasPerm(perm) {
  const { perms } = getSession();
  if (!perm) return true;
  if (perms.includes("*")) return true;
  return perms.includes(perm);
}

function hasAnyPerm(perms) {
  if (!perms || perms.length === 0) return true;
  return perms.some((p) => hasPerm(p));
}

// ---------- UI: top bar + modal ----------

function ensureTopBar() {
  if (document.getElementById("portalTopBar")) return;

  const bar = document.createElement("div");
  bar.id = "portalTopBar";
  bar.style.cssText = `
    position: sticky; top: 0; z-index: 9999;
    display: flex; gap: 12px; align-items: center; justify-content: space-between;
    padding: 10px 14px;
    background: rgba(255,255,255,.92);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid rgba(0,0,0,.08);
    font-family: Arial, sans-serif;
  `;

  const left = document.createElement("div");
  left.style.cssText = `display:flex;gap:10px;align-items:center;`;

  const badge = document.createElement("span");
  badge.id = "portalRoleBadge";
  badge.style.cssText = `
    padding: 4px 10px; border-radius: 999px;
    border: 1px solid rgba(0,0,0,.15);
    font-size: 12px;
  `;

  const codeBtn = document.createElement("button");
  codeBtn.type = "button";
  codeBtn.textContent = "Entrer un code";
  codeBtn.style.cssText = `padding:6px 10px; cursor:pointer;`;
  codeBtn.addEventListener("click", () => openCodeModal());

  left.appendChild(badge);
  left.appendChild(codeBtn);

  const right = document.createElement("div");
  right.style.cssText = `display:flex;gap:10px;align-items:center;`;

  const logoutBtn = document.createElement("button");
  logoutBtn.type = "button";
  logoutBtn.textContent = "Déconnexion";
  logoutBtn.style.cssText = `padding:6px 10px; cursor:pointer;`;
  logoutBtn.addEventListener("click", logout);

  right.appendChild(logoutBtn);

  bar.appendChild(left);
  bar.appendChild(right);

  document.body.prepend(bar);
  refreshTopBar();
}

function refreshTopBar() {
  const badge = document.getElementById("portalRoleBadge");
  if (!badge) return;
  const s = getSession();
  badge.textContent = `Accès : ${s.label} `;
}

function openCodeModal(requiredPerm = null) {
  document.getElementById("portalCodeOverlay")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "portalCodeOverlay";
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(0,0,0,.45);
    display: grid; place-items: center;
    font-family: Arial, sans-serif;
  `;

  const card = document.createElement("div");
  card.style.cssText = `
    width: min(420px, calc(100vw - 40px));
    background: white; border-radius: 10px;
    padding: 18px;
    box-shadow: 0 10px 30px rgba(0,0,0,.25);
  `;

  const title = document.createElement("div");
  title.style.cssText = `font-size: 16px; font-weight: 700; margin-bottom: 6px;`;
  title.textContent = "Accès par code";

  const hint = document.createElement("div");
  hint.style.cssText = `font-size: 13px; opacity: .8; margin-bottom: 12px;`;
  hint.textContent = requiredPerm ? `Accès requis : page ${requiredPerm}` : `Entre un code d'accès`;

  const row = document.createElement("div");
  row.style.cssText = `display:flex; gap:10px; align-items:center;`;

  const input = document.createElement("input");
  input.type = "password";
  input.placeholder = "Code";
  input.style.cssText = `flex:1; padding:10px; border-radius:8px; border:1px solid rgba(0,0,0,.2);`;

  const ok = document.createElement("button");
  ok.type = "button";
  ok.textContent = "Valider";
  ok.style.cssText = `padding:10px 12px; cursor:pointer;`;

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Annuler";
  cancel.style.cssText = `padding:10px 12px; cursor:pointer; opacity:.8;`;

  const msg = document.createElement("div");
  msg.style.cssText = `margin-top:10px; font-size:13px; color:#b00020; min-height: 18px;`;

  function validate() {
    const code = input.value.trim();
    const profile = ACCESS_PROFILES[code];
    if (!profile) {
      msg.textContent = "Code invalide";
      return;
    }
    if (requiredPerm && !(profile.perms.includes("*") || profile.perms.includes(requiredPerm))) {
      msg.textContent = "Code correct mais ne donne pas accès à cette page";
      return;
    }
    setSession({ label: profile.label, perms: profile.perms });
  }

  ok.addEventListener("click", validate);

  // ✅ Entrée pour valider
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") validate();
    if (e.key === "Escape") overlay.remove();
  });

  cancel.addEventListener("click", () => overlay.remove());

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  row.appendChild(input);
  row.appendChild(ok);
  row.appendChild(cancel);

  card.appendChild(title);
  card.appendChild(hint);
  card.appendChild(row);
  card.appendChild(msg);

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  input.focus();
}

// ---------- Masquage + protection ----------

// Masque les éléments annotés data-perm="2" etc
function applyPermVisibility() {
  document.querySelectorAll("[data-perm]").forEach((el) => {
    const list = (el.getAttribute("data-perm") || "")
      .split(",").map(s => s.trim()).filter(Boolean);
    if (!hasAnyPerm(list)) el.style.display = "none";
  });
}

// Protège une page entière par permission unique (ex: protectPagePerm("6"))
function protectPagePerm(requiredPerm) {
  ensureTopBar();
  if (!hasPerm(requiredPerm)) {
    openCodeModal(requiredPerm);
    document.body.style.visibility = "hidden";

    const obs = new MutationObserver(() => {
      if (!document.getElementById("portalCodeOverlay")) {
        document.body.style.visibility = "visible";
        obs.disconnect();
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ensureTopBar();
  applyPermVisibility();
});