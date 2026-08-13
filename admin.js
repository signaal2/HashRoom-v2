const SUPABASE_URL =
  "https://rcftsmwuynpqrrosfkap.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_xHnveIjt43xV1tA4683_HA_qZ8sS2PC";

const list = document.getElementById("list");

async function api(path, options = {}) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${path}`,
    {
      ...options,
      headers: {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
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

async function loadPayments() {
  try {
    const payments = await api(
      "payments?select=*&order=created_at.desc"
    );

    list.innerHTML = "";

    if (!payments || !payments.length) {
      list.innerHTML = "<p>No payment requests.</p>";
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
          ${payment.username ? " @" + payment.username : ""}
        </p>

        <p>Telegram ID: ${payment.telegram_id}</p>

        <p>Price: ${payment.price} USDT</p>

        <p>
          Status:
          <b>${payment.status}</b>
        </p>

        <button
          class="approve-btn"
          data-id="${payment.id}"
          ${payment.status !== "pending" ? "disabled" : ""}>
          Approve
        </button>

        <button
          class="reject-btn"
          data-id="${payment.id}"
          ${payment.status !== "pending" ? "disabled" : ""}>
          Reject
        </button>
      `;

      list.appendChild(card);
    });

    document.querySelectorAll(".approve-btn").forEach(button => {
      button.onclick = () => {
        approvePayment(button.dataset.id);
      };
    });

    document.querySelectorAll(".reject-btn").forEach(button => {
      button.onclick = () => {
        rejectPayment(button.dataset.id);
      };
    });

  } catch (error) {
    console.error(error);

    list.innerHTML = `
      <p style="color:red">
        Error: ${error.message}
      </p>
    `;
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

    const users = await api(
      `users?telegram_id=eq.${payment.telegram_id}&select=*`
    );

    let user;

    if (users.length) {
      user = users[0];

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

    } else {
      const created = await api(
        "users?select=*",
        {
          method: "POST",
          headers: {
            Prefer: "return=representation"
          },
          body: JSON.stringify({
            telegram_id: payment.telegram_id,
            username: payment.username || null,
            first_name: payment.first_name || null,
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

    await loadPayments();

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

    await loadPayments();

  } catch (error) {
    console.error(error);

    alert(
      "Reject Error:\n" +
      error.message
    );
  }
}

loadPayments();

setInterval(loadPayments, 10000);
