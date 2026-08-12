import { SUPABASE_URL, SUPABASE_KEY } from './firebase.js';

const tg = window.Telegram?.WebApp;
tg?.expand();

const user = tg?.initDataUnsafe?.user || { id: 0 };

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

const prices = {
  Basic: 100,
  Pro: 250,
  VIP: 500
};

async function api(path, options = {}) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${path}`,
    {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `HTTP ${response.status}`);
  }

  return text ? JSON.parse(text) : null;
}

function $(id) {
  return document.getElementById(id);
}

async function submitPayment() {
  try {
    if (!user.id) {
      throw new Error('Telegram user not detected');
    }

    const planElement = $('plan');

    if (!planElement) {
      throw new Error('Plan selector not found');
    }

    const plan = planElement.value;
    const price = prices[plan];

    if (!price) {
      throw new Error('Invalid plan');
    }

    await api('payments', {
      method: 'POST',
      headers: {
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        telegram_id: Number(user.id),
        username: user.username || null,
        first_name: user.first_name || null,
        plan: plan,
        price: price,
        status: 'pending'
      })
    });

    if ($('msg')) {
      $('msg').textContent =
        'Payment submitted. Waiting for admin approval.';
      $('msg').className = 'ok';
    }

  } catch (error) {
    console.error(error);

    if ($('msg')) {
      $('msg').textContent = 'Error: ' + error.message;
      $('msg').className = 'bad';
    }
  }
}

const buyButton = $('buy');

if (buyButton) {
  buyButton.addEventListener('click', submitPayment);
}
