const SUPABASE_URL =
  "https://rcftsmwuynpqrrosfkap.supabase.co";

const SUPABASE_KEY = "sb_publishable_xHnveIjt43xV1tA4683_HA_qZ8sS2PC";

const tg = window.Telegram?.WebApp;

tg?.ready();
tg?.expand();

const user = tg?.initDataUnsafe?.user;

if (!user) {
  alert("Please open HashRoom inside Telegram.");
  throw new Error("Telegram user not found");
}

const params = new URLSearchParams(window.location.search);
const planId = params.get("plan");

const plans = {
  basic: {
    name: "Basic",
    price: 130
  },

  starter: {
    name: "Starter",
    price: 320
  },

  pro: {
    name: "Pro",
    price: 590
  },

  advanced: {
    name: "Advanced",
    price: 540
  },

  premium: {
    name: "Premium",
    price: 860
  },

  elite: {
    name: "Elite",
    price: 860
  },

  vip: {
    name: "VIP",
    price: 1040
  }
};

const plan = plans[planId];

if (!plan) {
  alert("Plan not found.");
  throw new Error("Invalid plan");
}


/*
--------------------------------
نمایش اطلاعات پلن
--------------------------------
*/

const planNameEl =
  document.getElementById("planName");

const planPriceEl =
  document.getElementById("planPrice");

if (planNameEl) {
  planNameEl.textContent = plan.name;
}

if (planPriceEl) {
  planPriceEl.textContent =
    `${plan.price} USDT`;
}


/*
--------------------------------
دکمه پرداخت
--------------------------------
*/

const paidBtn =
  document.getElementById("paidBtn");

if (!paidBtn) {
  console.error("paidBtn not found");
} else {

  paidBtn.addEventListener(
    "click",
    async () => {

      paidBtn.disabled = true;
      paidBtn.textContent = "Sending...";

      try {

        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/payments`,
          {
            method: "POST",

            headers: {
              apikey: SUPABASE_KEY,

              Authorization:
                `Bearer ${SUPABASE_KEY}`,

              "Content-Type":
                "application/json",

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
                plan.name,

              price:
                plan.price,

              status:
                "pending"

            })
          }
        );


        if (!response.ok) {

          const errorText =
            await response.text();

          throw new Error(errorText);
        }


        /*
        --------------------------------
        درخواست با موفقیت ثبت شد
        --------------------------------
        */

        paidBtn.textContent =
          "Payment Submitted ✓";

        alert(
          "Payment request submitted successfully.\n\n" +
          "Please wait for admin approval."
        );


      } catch (error) {

        console.error(
          "Payment error:",
          error
        );

        alert(
          "Payment request failed:\n\n" +
          error.message
        );

        paidBtn.disabled = false;

        paidBtn.textContent =
          "I've Paid";
      }

    }
  );

}
