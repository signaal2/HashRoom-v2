import { SUPABASE_URL, SUPABASE_KEY } from "./firebase.js";

const tg = window.Telegram?.WebApp;

tg?.ready();
tg?.expand();

const user = tg?.initDataUnsafe?.user;

const planData = {

  Basic: {
    price: 130,
    hashrate: 120,
    duration: 30,
    daily: "0.00031 BTC"
  },

  Starter: {
    price: 320,
    hashrate: 250,
    duration: 30,
    daily: "0.00081 BTC"
  },

  Pro: {
    price: 599,
    hashrate: 510,
    duration: 30,
    daily: "0.00150 BTC"
  },

  Advanced: {
    price: 540,
    hashrate: 250,
    duration: 60,
    daily: "0.00081 BTC"
  },

  Premium: {
    price: 860,
    hashrate: 510,
    duration: 60,
    daily: "0.00150 BTC"
  },

  Elite: {
    price: 860,
    hashrate: 250,
    duration: 90,
    daily: "0.00081 BTC"
  },

  VIP: {
    price: 1040,
    hashrate: 510,
    duration: 90,
    daily: "0.00150 BTC"
  }

};


const msg = document.getElementById("msg");

const headers = {

  apikey: SUPABASE_KEY,

  Authorization:
    `Bearer ${SUPABASE_KEY}`,

  "Content-Type":
    "application/json"

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


  const text =
    await response.text();


  let data = null;


  try {

    data =
      text ? JSON.parse(text) : null;

  } catch {

    data = text;

  }


  if (!response.ok) {

    throw new Error(

      data?.message ||
      data?.hint ||
      text ||
      `HTTP ${response.status}`

    );

  }


  return data;

}


async function submitPayment(plan) {

  if (!user?.id) {

    throw new Error(
      "Telegram user not detected"
    );

  }


  const info =
    planData[plan];


  if (!info) {

    throw new Error(
      "Invalid plan"
    );

  }


  await api(

    "payments",

    {

      method: "POST",

      headers: {

        Prefer:
          "return=minimal"

      },

      body: JSON.stringify({

        telegram_id:
          Number(user.id),

        username:
          user.username || "",

        first_name:
          user.first_name || "",

        plan:
          plan,

        price:
          info.price,

        status:
          "pending"

      })

    }

  );

}


document
  .querySelectorAll(".plan-buy")
  .forEach(button => {

    button.addEventListener(
      "click",
      async () => {

        const plan =
          button.dataset.plan;


        try {

          button.disabled =
            true;

          button.textContent =
            "Submitting...";


          await submitPayment(
            plan
          );


          msg.textContent =
            `${plan} payment request sent. Waiting for admin approval.`;

          msg.className =
            "ok";


        } catch (error) {

          console.error(
            "Payment error:",
            error
          );


          msg.textContent =
            "Error: " +
            error.message;

          msg.className =
            "bad";


        } finally {

          button.disabled =
            false;

          button.textContent =
            "BUY NOW";

        }

      }

    );

  });
