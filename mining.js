import { SUPABASE_URL, SUPABASE_KEY } from './firebase.js';

const tg = window.Telegram?.WebApp;
tg?.expand();

const u = tg?.initDataUnsafe?.user;

const state = document.getElementById('state');

if (!u?.id) {
  state.textContent = 'Telegram user not detected.';
} else {

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`
  };

  fetch(
    `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${u.id}&select=approved,mining,plan`,
    { headers }
  )
    .then(async response => {
      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    })
    .then(data => {

      const user = data[0];

      if (!user) {
        state.textContent = 'User not found.';
        return;
      }

      if (!user.approved) {
        state.textContent = 'Waiting for admin approval.';
        return;
      }

      if (user.mining) {
        state.textContent =
          `Mining is active. Plan: ${user.plan || 'None'}`;
      } else {
        state.textContent =
          'Approved — mining is not active yet.';
      }

    })
    .catch(error => {
      console.error(error);
      state.textContent = 'Database error: ' + error.message;
    });
}
