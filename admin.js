import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL =
  "https://rcftsmwuynpqrrosfkap.supabase.co";

const SUPABASE_ANON_KEY =
  "کل anon key خودت را اینجا بگذار";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const paymentsDiv = document.getElementById("payments");

async function loadUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    paymentsDiv.innerHTML =
      `<p>Database Error: ${error.message}</p>`;
    return;
  }

  paymentsDiv.innerHTML = "";

  for (const user of data || []) {
    paymentsDiv.innerHTML += `
      <div class="card">
        <h3>${user.plan || "No Plan"}</h3>

        <p>
          User:
          <b>${user.username || user.first_name || user.id}</b>
        </p>

        <p>Balance: ${user.balance || 0}</p>
        <p>Approved: <b>${user.approved ? "YES" : "NO"}</b></p>
        <p>Mining: <b>${user.mining ? "ACTIVE" : "OFF"}</b></p>

        <button onclick="approveUser(${user.id})">
          Approve
        </button>

        <button onclick="rejectUser(${user.id})">
          Reject
        </button>
      </div>
    `;
  }
}

window.approveUser = async function (id) {
  try {
    const { error } = await supabase
      .from("users")
      .update({
        approved: true,
        mining: true
      })
      .eq("id", id);

    if (error) throw error;

    alert("Plan approved and mining started ✅");

    await loadUsers();

  } catch (error) {
    console.error(error);
    alert("Approve Error:\n" + error.message);
  }
};

window.rejectUser = async function (id) {
  try {
    const { error } = await supabase
      .from("users")
      .update({
        approved: false,
        mining: false
      })
      .eq("id", id);

    if (error) throw error;

    alert("User rejected");

    await loadUsers();

  } catch (error) {
    console.error(error);
    alert("Reject Error:\n" + error.message);
  }
};

loadUsers();
