const SUPABASE_URL =
  "https://rcftsmwuynpqrrosfkap.supabase.co";

const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";

const paymentsDiv = document.getElementById("payments");

async function api(path, options = {}) {

  const response = await fetch(
    SUPABASE_URL + "/rest/v1/" + path,
    {
      ...options,

      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  if (response.status === 204) return null;

  return response.json();
}

async function loadPayments() {

  try {

    const payments = await api(
      "payments?select=*&order=created_at.desc"
    );

    paymentsDiv.innerHTML = "";

    if (!payments.length) {
      paymentsDiv.innerHTML =
        "<p>No payment requests.</p>";
      return;
    }

    payments.forEach(payment => {

      const card = document.createElement("div");

      card.className = "card";

      card.innerHTML = `
        <h3>${payment.plan}</h3>

        <p>
          User:
          ${payment.first_name || ""}
          ${payment.username ? "@" + payment.username : ""}
        </p>

        <p>Telegram ID: ${payment.telegram_id}</p>

        <p>Price: ${payment.price} USDT</p>

        <p>Status:
          <b>${payment.status}</b>
        </p>

        <button
          ${payment.status !== "pending" ? "disabled" : ""}
          data-id="${payment.id}"
          class="approve-btn">
          Approve
        </button>

        <button
          ${payment.status !== "pending" ? "disabled" : ""}
          data-id="${payment.id}"
          class="reject-btn">
          Reject
        </button>
      `;

      paymentsDiv.appendChild(card);
    });

    document.querySelectorAll(".approve-btn")
      .forEach(btn => {
        btn.onclick = () =>
          approvePayment(btn.dataset.id);
      });

    document.querySelectorAll(".reject-btn")
      .forEach(btn => {
        btn.onclick = () =>
          rejectPayment(btn.dataset.id);
      });

  } catch (error) {

    console.error(error);

    paymentsDiv.innerHTML =
      `<p>Error: ${error.message}</p>`;
  }
}

async function approvePayment(paymentId) {

  try {

    const payments = await api(
      `payments?id=eq.${paymentId}&select=*`
    );

    if (!payments.length) {
      alert("Payment not found");
      return;
    }

    const payment = payments[0];

    /*
      پیدا کردن کاربر واقعی با telegram_id
    */

    const users = await api(
      `users?telegram_id=eq.${payment.telegram_id}&select=*`
    );

    let user;

    if (users.length) {

      user = users[0];

    } else {

      const created = await api(
        "users?select=*",
        {
          method: "POST",

          body: JSON.stringify({
            telegram_id: payment.telegram_id,
            username: payment.username,
            first_name: payment.first_name,
            balance: 0,
            approved: true,
            mining: true,
            plan: payment.plan,
            referrals: 0,
            referral_earned: 0
          })
        }
      );

      user = created[0];
    }

    /*
      فعال کردن Mining
    */

    await api(
      `users?id=eq.${user.id}`,
      {
        method: "PATCH",

        body: JSON.stringify({
          approved: true,
          mining: true,
          plan: payment.plan
        })
      }
    );

    /*
      تایید پرداخت
    */

    await api(
      `payments?id=eq.${paymentId}`,
      {
        method: "PATCH",

        body: JSON.stringify({
          status: "approved",
          approved_at: new Date().toISOString()
        })
      }
    );

    alert("Plan approved ✅\nMining activated.");

    loadPayments();

  } catch (error) {

    console.error(error);

    alert(
      "Approve Error:\n" +
      error.message
    );
  }
}

async function rejectPayment(paymentId) {

  try {

    await api(
      `payments?id=eq.${paymentId}`,
      {
        method: "PATCH",

        body: JSON.stringify({
          status: "rejected"
        })
      }
    );

    alert("Payment rejected.");

    loadPayments();

  } catch (error) {

    alert(
      "Reject Error:\n" +
      error.message
    );
  }
}

loadPayments();

setInterval(loadPayments, 10000);
