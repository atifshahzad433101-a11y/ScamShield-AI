let overviewChart = null, analyticsChart = null;
const $ = id => document.getElementById(id);
function navigate(page){
 document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
 document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
 $('page-'+page).classList.add('active');
 const titles={overview:'Security overview',scanner:'AI Message Scanner',analytics:'Security analytics',history:'Detection history'};
 $('page-title').textContent=titles[page]; $('crumb-page').textContent=titles[page];
 if(page==='analytics') refresh();
 if(page==='history') loadHistory();
}
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.go)));
$('message-input').addEventListener('input',e=>$('char-count').textContent=e.target.value.length+' characters');
async function refresh(){
 const r=await fetch('/api/stats'); const d=await r.json();
 $('total').textContent=d.total; $('scams').textContent=d.scams; $('legit').textContent=d.legitimate; $('share').innerHTML=d.scam_share+'<span class="unit">%</span>';
 $('a-total').textContent=d.total; $('a-scams').textContent=d.scams; $('a-legit').textContent=d.legitimate; $('a-share').textContent=d.scam_share+'%';
 $('chart-empty').style.display=d.total?'none':'grid';
 const config={type:'doughnut',data:{labels:['Potential scam','Legitimate'],datasets:[{data:[d.scams,d.legitimate],backgroundColor:['#ff647c','#42d6a0'],borderColor:'#101a2b',borderWidth:5,hoverOffset:7}]},options:{responsive:true,maintainAspectRatio:false,cutout:'72%',plugins:{legend:{position:'bottom',labels:{color:'#aab9ca',usePointStyle:true,boxWidth:7,padding:20,font:{size:10}}}}}};
 if(overviewChart)overviewChart.destroy(); overviewChart=new Chart($('overviewChart'),config);
 if(analyticsChart)analyticsChart.destroy(); analyticsChart=new Chart($('analyticsChart'),config);
 const list=$('recent-list'); list.innerHTML='';
 if(!d.history.length)list.innerHTML='<div class="empty-state">No scans yet. Your recent activity will appear here.</div>';
 d.history.forEach(x=>{const scam=x.prediction==='SCAM';list.innerHTML+=`<div class="recent-row"><div class="mini-status ${scam?'scam':'legit'}">${scam?'!':'✓'}</div><div class="recent-text"><b>${escapeHtml(x.message)}</b><small>${x.date}</small></div><span class="badge ${scam?'scam':'legit'}">${x.prediction}</span></div>`});
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
$('scan-btn').addEventListener('click',async()=>{
 const message=$('message-input').value.trim(); $('scan-error').textContent=''; $('result-box').className='result-box hidden';
 if(!message){$('scan-error').textContent='Please enter a message first.';return;}
 $('scan-btn').disabled=true;$('scan-btn').textContent='Analyzing message...';
 try{
  const r=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message})});const d=await r.json();
  if(!r.ok)throw new Error(d.error||'Analysis failed');
  const scam=d.prediction==='SCAM';const box=$('result-box');box.className='result-box '+(scam?'scam':'legit');
  box.innerHTML=`<h3>${scam?'⚠ Potential scam detected':'✓ Classified as legitimate'}</h3><p>${scam?'The trained AI model classified this message as a potential scam. Do not share OTPs, passwords or banking details.':'The trained AI model classified this message as legitimate. Still verify the sender before trusting requests for sensitive information.'}</p><div class="result-meta"><span>Prediction: <b>${d.prediction}</b></span><span>Model confidence: <b>${d.confidence===null?'N/A':d.confidence+'%'}</b></span><span>Keyword flags: <b>${d.keywords.length?escapeHtml(d.keywords.join(', ')):'None found'}</b></span></div>`;
  await refresh();
 }catch(e){$('scan-error').textContent=e.message;}
 finally{$('scan-btn').disabled=false;$('scan-btn').innerHTML='⌕ &nbsp; Analyze message <span>→</span>';}
});
async function loadHistory(){
 const r=await fetch('/api/history');const rows=await r.json();$('history-count').textContent=rows.length+' records';
 const body=$('history-body');body.innerHTML='';
 if(!rows.length){body.innerHTML='<tr><td colspan="4" class="empty-state">No message records yet.</td></tr>';return;}
 rows.forEach(x=>{const scam=x.prediction==='SCAM';body.innerHTML+=`<tr><td title="${escapeHtml(x.message)}">${escapeHtml(x.message)}</td><td><span class="badge ${scam?'scam':'legit'}">${x.prediction}</span></td><td>${x.confidence===null?'N/A':x.confidence+'%'}</td><td>${x.date}</td></tr>`});
}
$('clear-btn').addEventListener('click',async()=>{if(confirm('Clear all scan history for this browser session?')){await fetch('/api/clear',{method:'POST'});await loadHistory();await refresh();}});
refresh();
