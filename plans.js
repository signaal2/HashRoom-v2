import {SUPABASE_URL,SUPABASE_KEY} from './firebase.js';
const tg=window.Telegram?.WebApp;tg?.expand();const u=tg?.initDataUnsafe?.user||{id:0};
const h={apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'};
const prices={Basic:100,Pro:250,VIP:500};
async function api(path,opt={}){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...opt,headers:{...h,...(opt.headers||{})}});const t=await r.text();if(!r.ok)throw Error(t);return t?JSON.parse(t):null}
$('buy').onclick=async()=>{try{const plan=$('plan').value;await api('purchase_requests',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({user_id:Number(u.id),plan,amount:prices[plan],status:'pending'})});$('msg').textContent='Payment request sent. Waiting for admin approval.';$('msg').className='ok'}catch(e){$('msg').textContent='Error: '+e.message;$('msg').className='bad'}};
function $(x){return document.getElementById(x)}
