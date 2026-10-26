'use strict';
(function(){
 const tabs=Array.from(document.querySelectorAll('[data-panel]'));
 const panels=Array.from(document.querySelectorAll('[role="tabpanel"]'));
 function selectPanel(index,focus){tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;});if(focus)tabs[index].focus();}
 tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>selectPanel(index,false));tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();let next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;selectPanel(next,true);});});
 document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.view==='traffic')selectPanel(0,false);if(button.dataset.view==='park')selectPanel(1,false);}));
 const status=document.getElementById('office-status');
 if(window.Office&&Office.onReady){Office.onReady(info=>{if(info.host===Office.HostType.PowerPoint){status.textContent='Smart City 3D · PowerPoint · Componente V1.0';document.documentElement.dataset.officeHost='PowerPoint';}else{status.textContent='Smart City 3D · Anteprima del componente';}}).catch(()=>{status.textContent='Smart City 3D · Inizializzazione di Office non disponibile';});}
})();
