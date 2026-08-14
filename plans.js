import {
  SUPABASE_URL,
  SUPABASE_KEY
} from "./firebase.js";

const tg = window.Telegram?.WebApp;

tg?.ready();
tg?.expand();

const user = tg?.initDataUnsafe?.user || null;

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


/* ==============================
   WALLET ADDRESSES
============================== */

const USDT_ADDRESS =
  "0x9D378cC1F4Ee18690eE591c203Ee63ff66903974";

const BTC_ADDRESS =
  "bc1qxqa5cd2vha50ytwfkcycq0nf9uh8w3cku4x48m";


const msg =
  document.getElementById("msg");


const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};


/* ==============================
   SUPABASE API
============================== */

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


/* ==============================
   MESSAGE
============================== */

function showMessage(
  text,
  type = ""
) {

  if (!msg) return;

  msg.textContent = text;
  msg.className = type;

}


/* ==============================
   COPY ADDRESS
============================== */

async function copyAddress(
  address,
  button
) {

  try {

    await navigator.clipboard.writeText(
      address
    );

    const old =
      button.textContent;

    button.textContent =
      "Copied ✓";

    setTimeout(() => {
      button.textContent = old;
    }, 1500);

  } catch {

    button.textContent =
      "Copy failed";

  }

}


/* ==============================
   PAYMENT MODAL
============================== */

function showPaymentModal(plan) {

  const info =
    planData[plan];

  if (!info) return;


  const oldModal =
    document.getElementById(
      "hashroomPaymentModal"
    );

  if (oldModal) {
    oldModal.remove();
  }


  const modal =
    document.createElement("div");

  modal.id =
    "hashroomPaymentModal";


  modal.innerHTML = `

    <div class="hr-modal-overlay">

      <div class="hr-payment-box">

        <button
          class="hr-close"
          id="hrClose">
          ×
        </button>

        <h2>
          💳 ${plan} Plan
        </h2>

        <p class="hr-price">
          Amount:
          <strong>
            $${info.price} USDT
          </strong>
        </p>

        <div class="hr-warning">
          Send exactly
          <strong>$${info.price} USDT</strong>
          to one of the addresses below.
        </div>


        <div class="hr-wallet">

          <div class="hr-wallet-title">
            USDT BEP20
          </div>

          <div class="hr-address">
            ${USDT_ADDRESS}
          </div>

          <button
            class="hr-copy"
            id="copyUsdt">
            Copy
          </button>

        </div>


        <div class="hr-wallet">

          <div class="hr-wallet-title">
            BTC
          </div>

          <div class="hr-address">
            ${BTC_ADDRESS}
          </div>

          <button
            class="hr-copy"
            id="copyBtc">
            Copy
          </button>

        </div>


        <p class="hr-note">
          After completing the payment,
          press the button below.
          Your request will be sent to the admin
          for verification.
        </p>


        <button
          id="hrPaid"
          class="hr-paid">
          ✅ I've Paid
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  document.getElementById(
    "hrClose"
  ).onclick = () => {

    modal.remove();

  };


  document.getElementById(
    "copyUsdt"
  ).onclick = function () {

    copyAddress(
      USDT_ADDRESS,
      this
    );

  };


  document.getElementById(
    "copyBtc"
  ).onclick = function () {

    copyAddress(
      BTC_ADDRESS,
      this
    );

  };


  document.getElementById(
    "hrPaid"
  ).onclick = async () => {

    const button =
      document.getElementById(
        "hrPaid"
      );

    try {

      if (!user?.id) {

        throw new Error(
          "Please open HashRoom inside Telegram."
        );

      }


      button.disabled = true;

      button.textContent =
        "Sending...";


      await submitPayment(
        plan
      );


      modal.remove();


      showMessage(
        `${plan} payment request sent. Waiting for admin approval.`,
        "ok"
      );


    } catch (error) {

      console.error(
        "Payment error:",
        error
      );


      button.disabled = false;

      button.textContent =
        "✅ I've Paid";


      showMessage(
        "Error: " +
        error.message,
        "bad"
      );

    }

  };

}


/* ==============================
   SUBMIT PAYMENT
============================== */

async function submitPayment(
  plan
) {

  if (!user?.id) {

    throw new Error(
      "Telegram user not detected."
    );

  }


  const info =
    planData[plan];


  if (!info) {

    throw new Error(
      "Invalid plan."
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


/* ==============================
   BUY NOW BUTTONS
============================== */

const buttons =
  document.querySelectorAll(
    ".plan-buy"
  );


buttons.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        const plan =
          button.getAttribute(
            "data-plan"
          );

        showMessage(
          "",
          ""
        );

        showPaymentModal(
          plan
        );

      }
    );

  }
);


console.log(
  "HashRoom Plans loaded."
);

console.log(
  "BUY NOW buttons:",
  buttons.length
);
