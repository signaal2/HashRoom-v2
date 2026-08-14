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

    // 1. پیدا کردن پرداخت
    const payments = await api(
      `payments?id=eq.${paymentId}&select=*`
    );

    if (!payments.length) {
      alert("Payment not found");
      return;
    }

    const payment = payments[0];

    // جلوگیری از تأیید دوباره
    if (payment.status === "approved") {
      alert("This payment is already approved.");
      return;
    }

    // 2. پیدا کردن کاربر خریدار
    const users = await api(
      `users?telegram_id=eq.${payment.telegram_id}&select=*`
    );

    let user;

    if (users.length) {

      user = users[0];

    } else {

      // ساخت کاربر در صورت نبودن
      const created = await api(
        "users?select=*",
        {
          method: "POST",

          headers: {
            Prefer: "return=representation"
          },

          body: JSON.stringify({
            telegram_id: payment.telegram_id,
            username: payment.username || "",
            first_name: payment.first_name || "",
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


    // 3. فعال کردن پلن + تعیین زمان اولین برداشت
// اولین برداشت دقیقاً 7 روز بعد از تأیید فعال می‌شود.

const approvedAt = new Date();

const withdrawalAvailableAt = new Date(
  approvedAt.getTime() + 7 * 24 * 60 * 60 * 1000
);

await api(
  `users?id=eq.${user.id}`,
  {
    method: "PATCH",

    headers: {
      Prefer: "return=minimal"
    },

    body: JSON.stringify({
      approved: true,
      mining: true,
      plan: payment.plan,
      withdrawal_available_at:
        withdrawalAvailableAt.toISOString()
    })
  }
);
    // 4. تأیید پرداخت

    await api(
      `payments?id=eq.${paymentId}`,
      {
        method: "PATCH",

        headers: {
          Prefer: "return=minimal"
        },

        body: JSON.stringify({
          status: "approved",
          approved_at: new Date().toISOString()
        })
      }
    );


    // =====================================================
    // 5. REFERRAL REWARD
    // اگر خریدار معرف داشته باشد → 3 روز هدیه
    // =====================================================

    if (user.referrer) {

      const referrerRows = await api(
        `users?id=eq.${user.referrer}&select=*`
      );

      const referrer = referrerRows?.[0];

      if (referrer) {

        // بررسی می‌کنیم این پرداخت قبلاً پاداش داده یا نه

        const existingReward = await api(
          `referral_rewards?payment_id=eq.${paymentId}&select=id`
        );


        if (!existingReward?.length) {

          const now = new Date();

          let expiry;

          if (referrer.plan_expires_at) {

            expiry = new Date(
              referrer.plan_expires_at
            );

          } else {

            expiry = new Date();

          }


          // اگر پلن قبلی منقضی شده باشد
          // از همین لحظه 3 روز حساب می‌کنیم

          if (expiry < now) {
            expiry = new Date(now);
          }


          // اضافه کردن 3 روز

          expiry.setUTCDate(
            expiry.getUTCDate() + 3
          );


          // ذخیره تاریخ جدید

          await api(
            `users?id=eq.${referrer.id}`,
            {
              method: "PATCH",

              headers: {
                Prefer: "return=minimal"
              },

              body: JSON.stringify({
                plan_expires_at:
                  expiry.toISOString()
              })
            }
          );


          // ثبت پاداش
          // تا دوباره برای همین پرداخت داده نشود

          await api(
            "referral_rewards",
            {
              method: "POST",

              headers: {
                Prefer: "return=minimal"
              },

              body: JSON.stringify({
                payment_id: paymentId,
                referrer_id: referrer.id,
                referred_user_id: user.id,
                days_added: 3
              })
            }
          );

          console.log(
            "Referral reward: +3 days",
            referrer.id
          );
        }
      }
    }


    // 6. پایان

    alert(
      "Plan approved ✅\nMining activated.\nReferral reward checked."
    );

    loadPayments();

  } catch (error) {

    console.error(error);

    alert(
      "Approve Error:\n" +
      error.message
    );
  }
        }
