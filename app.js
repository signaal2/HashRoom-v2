import { SUPABASE_URL, SUPABASE_KEY } from "./firebase.js";

const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe.user;

const balanceEl = document.getElementById("balance");
const planEl = document.getElementById("plan");
const startBtn = document.getElementById("startBtn");

let balance = 0;
let mining = false;

async function getUser() {

const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`,{

headers:{
apikey:SUPABASE_KEY,
Authorization:`Bearer ${SUPABASE_KEY}`
}

});

const data = await res.json();

if(data.length==0){

await fetch(`${SUPABASE_URL}/rest/v1/users`,{

method:"POST",

headers:{
apikey:SUPABASE_KEY,
Authorization:`Bearer ${SUPABASE_KEY}`,
"Content-Type":"application/json",
Prefer:"return=minimal"
},

body:JSON.stringify({

id:user.id,

username:user.username||"",

first_name:user.first_name,

balance:0,

approved:false,

mining:false,

plan:"",

referrals:0

})

});

return getUser();

}

return data[0];

}

async function save(obj){

await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`,{

method:"PATCH",

headers:{
apikey:SUPABASE_KEY,
Authorization:`Bearer ${SUPABASE_KEY}`,
"Content-Type":"application/json"
},

body:JSON.stringify(obj)

});

}

async function load(){

const u=await getUser();

balance=u.balance||0;

balanceEl.innerHTML=balance.toFixed(8)+" BTC";

planEl.innerHTML=u.plan||"No Plan";

if(u.approved){

startBtn.disabled=false;

}else{

startBtn.disabled=true;

startBtn.innerHTML="Waiting Admin";

}

if(u.mining){

startMining();

}

}

async function startMining(){

if(mining)return;

mining=true;

startBtn.innerHTML="⛏ Mining...";

setInterval(async()=>{

balance+=0.00000001;

balanceEl.innerHTML=balance.toFixed(8)+" BTC";

await save({

balance,

mining:true

});

},2000);

}

startBtn.onclick=async()=>{

if(mining)return;

await save({mining:true});

startMining();

};

load();
