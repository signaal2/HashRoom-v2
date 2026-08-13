import { SUPABASE_URL, SUPABASE_KEY } from "./firebase.js";

const tg = window.Telegram?.WebApp;

tg?.ready();
tg?.expand();

const u = tg?.initDataUnsafe?.user;

const linkEl = document.getElementById("link");
const countEl = document.getElementById("count");
const copyBtn = document.getElementById("copy");

if (!u?.id) {
  if (linkEl) linkEl.textContent = "Open HashRoom inside Telegram";
  if (countEl) countEl.textContent = "Telegram user not detected";
} else {

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`
  };

  const link =
    `https://t.me/HashRoom_bot?startapp=ref_${u.id}`;

  if (linkEl) {
    linkEl.textContent = link;
  }

  try {

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${u.id}&select=referrals`,
      {
        headers
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();

    if (countEl) {
      countEl.textContent =
        `Referrals: ${data[0]?.referrals || 0}`;
    }

  } catch (error) {

    console.error(error);

    if (countEl) {
      countEl.textContent =
        "Referrals: 0";
    }
  }

  copyBtn?.addEventListener("click", async () => {

    try {

      await navigator.clipboard.writeText(link);

      copyBtn.textContent = "Copied ✓";

      setTimeout(() => {
        copyBtn.textContent = "Copy";
      }, 1500);

    } catch {

      alert(link);
    }
  });
}
