import {SUPABASE_URL,SUPABASE_KEY} from './firebase.js';
const tg=window.Telegram?.WebApp;tg?.expand();const u=tg?.initDataUnsafe?.user||{id:0};
// Set your Telegram numeric ID here once.
const ADMIN_ID=0;
const h={apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'};
const $=x=>document.getElementById(x);
async function api(path,opt={}){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...opt,headers:{...h,...(opt.headers||{})}});const t=await r.text();if(!r.ok)throw Error(t);return t?JSON.parse(t):null}
async function load(){if(Number(u.id)!==ADMIN_ID){$('list').textContent='Not authorized';return}const rows=await api('purchase_requests?status=eq.pending&select=*');$('list').innerHTML=rows.length?'':'No pending requests';for(const x of rows){const d=document.createElement('div');d.className='item';d.innerHTML=`User ${x.user_id} — ${x.plan} — $${x.amount} <button data-id="${x.id}">Approve</button>`;d.querySelector('button').onclick=async()=>{await api(`purchase_requests?id=eq.${x.id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'approved'})});await api(`users?id=eq.${x.user_id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({approved:true,mining:true,plan:x.plan})});load()};$('list').appendChild(d)}}load();
