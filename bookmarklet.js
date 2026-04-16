(function(){
'use strict';
var old=document.getElementById('__mhg');if(old)old.remove();
var panel=document.createElement('div');
panel.id='__mhg';
panel.style.cssText='position:fixed;bottom:20px;right:20px;z-index:2147483647;background:#fff;border:1px solid #ccc;border-radius:10px;box-shadow:0 4px 24px rgba(0,0,0,.2);padding:16px 18px;font:14px/1.5 "Segoe UI",sans-serif;color:#222;min-width:300px;max-width:340px;';
panel.innerHTML=''
+'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'
+'<b style="font-size:15px">&#127795; GEDCOM Export <span style="font-size:11px;background:#01696f;color:#fff;border-radius:3px;padding:1px 6px">v15</span></b>'
+'<button id="__mhg_x" style="border:none;background:none;font-size:20px;cursor:pointer;color:#999">&#215;</button>'
+'</div>'
+'<div id="__mhg_s" style="font-size:13px;color:#555;background:#f5f5f3;border-radius:6px;padding:8px 10px;margin-bottom:10px;">&#9679; Инициализация&#8230;</div>'
+'<div style="background:#f5f5f3;border-radius:6px;padding:8px 12px;margin-bottom:10px;display:flex;gap:12px">'
+'<div><div style="font-size:11px;color:#999">Найдено</div><div id="__mhg_p" style="font-size:18px;font-weight:700;color:#01696f">0</div></div>'
+'<div><div style="font-size:11px;color:#999">Обработано</div><div id="__mhg_d" style="font-size:18px;font-weight:700;color:#888">0</div></div>'
+'<div><div style="font-size:11px;color:#999">Семей</div><div id="__mhg_f" style="font-size:18px;font-weight:700;color:#01696f">&#8212;</div></div>'
+'<div><div style="font-size:11px;color:#999">Очередь</div><div id="__mhg_q" style="font-size:18px;font-weight:700;color:#aaa">0</div></div>'
+'</div>'
+'<div style="height:5px;background:#e0e0e0;border-radius:3px;margin-bottom:10px;">'
+'<div id="__mhg_bar" style="height:5px;background:#01696f;border-radius:3px;width:0%;transition:width .4s"></div>'
+'</div>'
+'<div style="display:flex;gap:8px;margin-bottom:8px;">'
+'<button id="__mhg_pause" style="flex:1;padding:8px;background:#f0f0f0;color:#444;border:1px solid #ddd;border-radius:7px;font:600 13px sans-serif;cursor:pointer;">&#9646;&#9646; Пауза</button>'
+'<button id="__mhg_btn" style="flex:2;padding:8px;background:#bbb;color:#fff;border:none;border-radius:7px;font:600 13px sans-serif;cursor:not-allowed;" disabled>&#8675; Скачать GEDCOM</button>'
+'</div>'
+'<div id="__mhg_log" style="font-size:11px;color:#aaa;max-height:55px;overflow-y:auto;word-break:break-all;"></div>';
document.body.appendChild(panel);
document.getElementById('__mhg_x').onclick=function(){panel.remove();};
var btn=document.getElementById('__mhg_btn');
var pauseBtn=document.getElementById('__mhg_pause');
var stEl=document.getElementById('__mhg_s');
var logEl=document.getElementById('__mhg_log');
var barEl=document.getElementById('__mhg_bar');
var pEl=document.getElementById('__mhg_p');
var dEl=document.getElementById('__mhg_d');
var fEl=document.getElementById('__mhg_f');
var qEl=document.getElementById('__mhg_q');
function log(t){logEl.innerHTML+=t+'<br>';logEl.scrollTop=9999;}
function setStatus(t,c,bg){stEl.innerHTML=t;stEl.style.color=c||'#555';stEl.style.background=bg||'#f5f5f3';}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
var paused=false,pauseResolve=null;
function waitIfPaused(){if(!paused)return Promise.resolve();return new Promise(function(resolve){pauseResolve=resolve;});}
pauseBtn.onclick=function(){
  paused=!paused;
  if(paused){
    pauseBtn.innerHTML='&#9654; Продолжить';pauseBtn.style.background='#e8f5e9';pauseBtn.style.color='#2e7d32';pauseBtn.style.borderColor='#a5d6a7';
    setStatus('&#9646;&#9646; Пауза — можно скачать частичный GEDCOM','#b45309','#fff8e1');
    enableDownload();
  } else {
    pauseBtn.innerHTML='&#9646;&#9646; Пауза';pauseBtn.style.background='#f0f0f0';pauseBtn.style.color='#444';pauseBtn.style.borderColor='#ddd';
    setStatus('&#9679; Продолжаю&#8230;');
    if(pauseResolve){pauseResolve();pauseResolve=null;}
  }
};
function enableDownload(){btn.disabled=false;btn.style.background='#01696f';btn.style.cursor='pointer';btn.onclick=function(){doDownload();};}
function doDownload(){var fams=buildFamilies();var ged=buildGedcom(fams);var pc=Object.keys(personsMap).length;var fc=Object.keys(fams).length;var b=new Blob([ged],{type:'text/plain;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='myheritage_'+pc+'p_'+fc+'f.ged';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1000);log('&#8675; Скачано: '+pc+' персон, '+fc+' семей');}
function getSiteId(){var scripts=document.querySelectorAll('script:not([src])');for(var i=0;i<scripts.length;i++){var m=scripts[i].textContent.match(/(?:currentSiteId|siteId|siteID)\s*=\s*["']([A-Z0-9]{15,})["']/);if(m)return m[1];}return null;}
function getSeedIds(){var found=new Set();document.querySelectorAll('[id],[data-id],[data-individual-id]').forEach(function(el){var id=el.dataset.id||el.dataset.individualId||el.id;if(id&&/^\d{5,7}$/.test(id))found.add(id);});document.querySelectorAll('script:not([src])').forEach(function(s){var t=s.textContent,m,re;re=/(?:individualID|individual_id)[^\d]*(\d{5,7})/gi;while((m=re.exec(t))!==null)found.add(m[1]);re=/\b(150\d{4})\b/g;while((m=re.exec(t))!==null)found.add(m[1]);});document.querySelectorAll('[onclick],[href]').forEach(function(el){var s=(el.getAttribute('onclick')||'')+(el.getAttribute('href')||'');var m=s.match(/\b(150\d{4})\b/g);if(m)m.forEach(function(id){found.add(id);});});return Array.from(found);}
var personsMap={},lifeSpanMap={},childParents={},personSpouses={},personChildren={},queue=[],visited={},siteId=null,DELAY=400,BATCH=3;
var RE_SPOUSE=/муж|жена|супруг|spouse|husband|wife|partner/i,RE_CHILD=/ребён|ребенок|дочь|сын|child|son|daughter/i,RE_PARENT=/родитель|отец|мать|father|mother|parent/i;
function addToQueue(ids){ids.forEach(function(id){var s=String(id);if(s&&/^\d+$/.test(s)&&!visited[s]){visited[s]=true;queue.push(s);}});}
async function fetchPerson(id){var today=new Date().toISOString().slice(0,10);var url='/FP/API/FamilyTree/get-extended-card-content.php?allEventsForIndividual=1&clientDate='+today+'&dataLang=DF&facts=1&individualID='+id+'&lang=RU&relatives=1&s='+siteId;var retries=4;while(retries-->0){try{var r=await fetch(url,{credentials:'include'});if(r.status===429){log('429 — пауза 6с');await sleep(6000+Math.random()*3000);continue;}if(!r.ok)return null;return await r.json();}catch(e){return null;}}return null;}
function processPersonData(id,j){if(!j)return;personsMap[id]={id:id,fn:(j.firstName||'').trim(),ln:(j.lastName||'').trim(),g:j.gender||'U',ls:j.lifeSpan||'',facts:Array.isArray(j.facts)?j.facts:[]};var newIds=[];(j.relatives||[]).forEach(function(rel){var rid=String(rel.id||'');if(!rid||!/^\d+$/.test(rid))return;newIds.push(rid);if(rel.lifeSpan&&rel.lifeSpan.trim())lifeSpanMap[rid]=rel.lifeSpan.trim();var relation=rel.relation||rel.relationship||'';if(RE_SPOUSE.test(relation)){if(!personSpouses[id])personSpouses[id]=new Set();personSpouses[id].add(rid);if(!personSpouses[rid])personSpouses[rid]=new Set();personSpouses[rid].add(id);}else if(RE_CHILD.test(relation)){if(!personChildren[id])personChildren[id]=new Set();personChildren[id].add(rid);if(!childParents[rid])childParents[rid]=new Set();childParents[rid].add(id);}else if(RE_PARENT.test(relation)){if(!childParents[id])childParents[id]=new Set();childParents[id].add(rid);if(!personChildren[rid])personChildren[rid]=new Set();personChildren[rid].add(id);}});(j.facts||[]).forEach(function(f){if(f.relativeIndividualId)newIds.push(String(f.relativeIndividualId));});addToQueue(newIds);}
function buildFamilies(){var familiesMap={},processed=new Set();Object.keys(personSpouses).forEach(function(pid){personSpouses[pid].forEach(function(spid){var key=[pid,spid].sort().join('_');if(processed.has(key))return;processed.add(key);var pg=(personsMap[pid]||{}).g||'U',sg=(personsMap[spid]||{}).g||'U',h,w;if(pg==='M'){h=pid;w=spid;}else if(sg==='M'){h=spid;w=pid;}else if(pg==='F'){h=spid;w=pid;}else{h=pid;w=spid;}var c1=personChildren[pid]?Array.from(personChildren[pid]):[],c2=personChildren[spid]?Array.from(personChildren[spid]):[];var children=[];c1.forEach(function(cid){var cp=childParents[cid]||new Set();if(cp.has(pid)&&cp.has(spid))children.push(cid);});if(children.length===0){Array.from(new Set(c1.concat(c2))).forEach(function(cid){children.push(cid);});}familiesMap[key]={h:h,w:w,children:[...new Set(children)]};});});Object.keys(personChildren).forEach(function(pid){if(personSpouses[pid]&&personSpouses[pid].size>0)return;var key='solo_'+pid;if(familiesMap[key])return;var pg=(personsMap[pid]||{}).g||'U';familiesMap[key]={h:pg!=='F'?pid:null,w:pg==='F'?pid:null,children:Array.from(personChildren[pid])};});return familiesMap;}
async function runBFS(){var seeds=getSeedIds();if(seeds.length===0){setStatus('&#10060; ID не найдены','#c00','#ffeaea');return;}log('Стартовых ID: '+seeds.length);addToQueue(seeds);setStatus('&#9679; Обхожу дерево&#8230;');var processed=0;while(queue.length>0){await waitIfPaused();if(paused)continue;var batch=queue.splice(0,BATCH);for(var i=0;i<batch.length;i++){await waitIfPaused();var j=await fetchPerson(batch[i]);processPersonData(batch[i],j);processed++;await sleep(120);}var fams=buildFamilies();pEl.textContent=Object.keys(personsMap).length;dEl.textContent=processed;fEl.textContent=Object.keys(fams).length;qEl.textContent=queue.length;barEl.style.width=Math.min(95,Math.round(processed/Math.max(processed+queue.length,1)*100))+'%';if(!paused)setStatus('&#9679; '+processed+' обработано, в очереди: '+queue.length);enableDownload();await sleep(DELAY);}barEl.style.width='100%';var fams=buildFamilies();var pc=Object.keys(personsMap).length,fc=Object.keys(fams).length;pEl.textContent=pc;fEl.textContent=fc;qEl.textContent=0;setStatus('&#10003; Готово! '+pc+' персон, '+fc+' семей','#2e7d32','#e8f5e9');pauseBtn.disabled=true;pauseBtn.style.opacity='0.4';enableDownload();}
var MO={'янв':'JAN','фев':'FEB','мар':'MAR','апр':'APR','май':'MAY','мая':'MAY','июн':'JUN','июл':'JUL','авг':'AUG','сен':'SEP','окт':'OCT','ноя':'NOV','дек':'DEC'};
function parseDate(t){if(!t||!String(t).trim())return null;var s=String(t).trim();for(var k in MO)s=s.replace(new RegExp(k,'gi'),MO[k]);s=s.replace(/примерно|около/gi,'ABT').replace(/до\s+/gi,'BEF ').replace(/после\s+/gi,'AFT ').replace(/[^0-9A-Za-z ]/g,' ').replace(/\s+/g,' ').trim().toUpperCase();return s||null;}
function parseLifeSpan(ls){if(!ls)return{};var m=ls.match(/(\d{4})\s*[-\u2013]\s*(\d{4})/);if(m)return{birth:m[1],death:m[2]};m=ls.match(/^\s*(\d{4})\s*[-\u2013]\s*$/);if(m)return{birth:m[1]};m=ls.match(/^\s*(\d{4})\s*$/);if(m)return{birth:m[1]};return{};}
function stripHtml(h){return(h||'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();}
var FACT_TAGS={BIRT:'BIRT',DEAT:'DEAT',BURI:'BURI',CHR:'CHR',BAPM:'BAPM',MARR:'MARR',OCCU:'OCCU',RESI:'RESI',EMIG:'EMIG',IMMI:'IMMI',CENS:'CENS',GRAD:'GRAD'};
function buildGedcom(familiesMap){var now=new Date(),MN=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],today=('0'+now.getDate()).slice(-2)+' '+MN[now.getMonth()]+' '+now.getFullYear(),L=[];L.push('0 HEAD','1 SOUR MyHeritage','2 NAME MyHeritage','1 DATE '+today,'1 CHAR UTF-8','1 GEDC','2 VERS 5.5.1','2 FORM LINEAGE-LINKED');var famArr=Object.values(familiesMap),childFam={},spouseFam={};famArr.forEach(function(fam,i){(fam.children||[]).forEach(function(cid){if(!childFam[cid])childFam[cid]=[];childFam[cid].push('F'+(i+1));});if(fam.h){if(!spouseFam[fam.h])spouseFam[fam.h]=[];spouseFam[fam.h].push('F'+(i+1));}if(fam.w){if(!spouseFam[fam.w])spouseFam[fam.w]=[];spouseFam[fam.w].push('F'+(i+1));}});Object.values(personsMap).forEach(function(p){var id=String(p.id);L.push('0 @I'+id+'@ INDI');var fn=(p.fn||'').trim(),ln=(p.ln||'').trim();if(fn||ln){L.push('1 NAME '+fn+' /'+ln+'/');if(fn)L.push('2 GIVN '+fn);if(ln)L.push('2 SURN '+ln);}L.push('1 SEX '+(p.g==='M'?'M':p.g==='F'?'F':'U'));var hasBirth=false,hasDeath=false;(p.facts||[]).forEach(function(f){var tag=FACT_TAGS[(f.type||'').toUpperCase()];if(!tag||tag==='MARR')return;if(tag==='BIRT')hasBirth=true;if(tag==='DEAT')hasDeath=true;var d=parseDate(f.date||(f.year&&f.year>0?String(f.year):null)),pl=stripHtml(f.place||f.location||''),nt=(f.content||f.description||'').trim();if(tag==='OCCU'){L.push('1 OCCU'+(nt?' '+nt:''));if(d)L.push('2 DATE '+d);if(pl)L.push('2 PLAC '+pl);return;}L.push('1 '+tag);if(d)L.push('2 DATE '+d);if(pl)L.push('2 PLAC '+pl);});var ls=p.ls||lifeSpanMap[id]||'',ld=parseLifeSpan(ls);if(!hasBirth&&ld.birth){L.push('1 BIRT');L.push('2 DATE '+ld.birth);}if(!hasDeath&&ld.death){L.push('1 DEAT');L.push('2 DATE '+ld.death);}(childFam[id]||[]).forEach(function(fid){L.push('1 FAMC @'+fid+'@');});(spouseFam[id]||[]).forEach(function(fid){L.push('1 FAMS @'+fid+'@');});});famArr.forEach(function(fam,i){L.push('0 @F'+(i+1)+'@ FAM');if(fam.h)L.push('1 HUSB @I'+fam.h+'@');if(fam.w)L.push('1 WIFE @I'+fam.w+'@');(fam.children||[]).forEach(function(cid){L.push('1 CHIL @I'+cid+'@');});});L.push('0 TRLR');return L.join('\r\n');}
siteId=getSiteId();
if(!siteId){setStatus('&#10060; siteId не найден','#c00','#ffeaea');pauseBtn.disabled=true;}
else{log('site: '+siteId.slice(0,8)+'...');runBFS();}
})();
