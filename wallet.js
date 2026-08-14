import {
  SUPABASE_URL,
  SUPABASE_KEY
} from "./firebase.js";

const tg = window.Telegram?.WebApp;

tg?.ready();
tg?.expand();

const u =
  tg?.initDataUnsafe?.user || { id: 0 };

const h = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

const $ = x =>
  document.getElementById(x);


async function getUser() {

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${Number(u.id)}&select=withdrawal_available_at,approved,mining,plan`,
    {
      headers: h
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      text || "Could not load user"
    );
  }

  const rows =
    text ? JSON.parse(text) : [];

  return rows[0] || null;
}


$("withdraw").onclick = async () => {

  try {

    const amount =
      Number($("amount").value);

    const address =
      $("address").value.trim();


    if (!address || amount <= 0) {

      throw Error(
        "Enter a valid address and amount"
      );

    }


    /*
      بررسی زمان اولین برداشت
    */

    const user =
      await getUser();


    if (!user) {

      throw Error(
        "User account not found."
      );

    }


    if (!user.approved) {

      throw Error(
        "Your plan has not been approved yet."
      );

    }


    if (!user.withdrawal_available_at) {

      throw Error(
        "Withdrawal date has not been set yet. Please wait for admin approval."
      );

    }


    const availableAt =
      new Date(
        user.withdrawal_available_at
      );

    const now =
      new Date();


    /*
      هنوز 7 روز کامل نشده
    */

    if (now < availableAt) {

      const remaining =
        availableAt.getTime() -
        now.getTime();


      const days =
        Math.ceil(
          remaining /
          (1000 * 60 * 60 * 24)
        );


      throw Error(
        `🔒 First withdrawal will be available in ${days} day(s).`
      );

    }


    /*
      7 روز کامل شده
      ثبت درخواست برداشت
    */

    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/withdrawals`,
        {
          method: "POST",

          headers: {
            ...h,
            Prefer: "return=minimal"
          },

          body: JSON.stringify({
            user_id: Number(u.id),
            amount: amount,
            address: address,
            status: "pending"
          })
        }
      );


    const text =
      await response.text();


    if (!response.ok) {

      throw Error(
        text ||
        "Withdrawal request failed"
      );

    }


    $("msg").textContent =
      "Withdrawal request sent to admin.";

    $("msg").className =
      "ok";


  } catch (e) {

    console.error(
      "Withdrawal error:",
      e
    );


    $("msg").textContent =
      e.message;

    $("msg").className =
      "bad";

  }

};
