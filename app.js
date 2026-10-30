const modalBackdrop=document.getElementById('modalBackdrop');
const modalTitle=document.getElementById('modalTitle');
const modalDescription=document.getElementById('modalDescription');
const modalContent=document.getElementById('modalContent');

const panels={
  home:{title:'Welcome home',description:'What do you want to do?',content:'<div class="modal-links"><button data-panel="games">🎮 Browse games</button><button data-panel="chat">💬 Open community chat</button></div>'},
  games:{title:'Game Garden',description:'Pick a game and start playing.',content:'<div class="game-list"><a class="game-item" href="https://2048game.com/" target="_blank" rel="noopener noreferrer"><span>🔢</span><span><strong>2048</strong><small>Slide, match, and reach 2048.</small></span><b>↗</b></a><a class="game-item" href="https://tetris.com/play-tetris" target="_blank" rel="noopener noreferrer"><span>🧱</span><span><strong>Tetris</strong><small>Stack blocks and clear lines.</small></span><b>↗</b></a><a class="game-item" href="https://poki.com/" target="_blank" rel="noopener noreferrer"><span>🕹️</span><span><strong>Poki</strong><small>Browse a big collection of browser games.</small></span><b>↗</b></a><a class="game-item" href="https://www.crazygames.com/" target="_blank" rel="noopener noreferrer"><span>🎯</span><span><strong>CrazyGames</strong><small>Explore more free online games.</small></span><b>↗</b></a></div><p class="small-note">Games open in a new tab.</p>'},
  chat:{title:'Community Chat',description:'Chat is part of CherryBlocked. A live shared chat needs a database and authentication connection.',content:'<div class="chat-placeholder"><div class="chat-icon">💬</div><strong>Community chat setup</strong><p>The chat screen is ready to be connected to a real-time chat backend. Messages cannot be shared between visitors until that connection is configured.</p></div>'},
  settings:{title:'Settings',description:'Personalize your experience on this device.',content:'<label class="setting-row">Reduce motion <input id="reduceMotion" type="checkbox"></label><label class="setting-row">Dim background <input id="dimBg" type="checkbox"></label><button class="primary-button" id="saveSettings" type="button">Save preferences</button>'}
};
function openPanel(name){
  const panel=panels[name];if(!panel)return;
  modalTitle.textContent=panel.title;modalDescription.textContent=panel.description;modalContent.innerHTML=panel.content;modalBackdrop.hidden=false;
  document.querySelectorAll('[data-panel]').forEach(button=>button.classList.toggle('active',button.dataset.panel===name));
  if(name==='settings'){document.getElementById('reduceMotion').checked=localStorage.getItem('cb-reduce-motion')==='1';document.getElementById('dimBg').checked=localStorage.getItem('cb-dim-bg')==='1';}
}
function closePanel(){modalBackdrop.hidden=true;}
document.addEventListener('click',function(event){
  const panel=event.target.closest('[data-panel]');if(panel){event.preventDefault();openPanel(panel.dataset.panel);return;}
  if(event.target.closest('#closeModal')){closePanel();return;}
  if(event.target===modalBackdrop){closePanel();return;}
  if(event.target.closest('#saveSettings')){
    const reduce=document.getElementById('reduceMotion').checked;
    const dim=document.getElementById('dimBg').checked;
    localStorage.setItem('cb-reduce-motion',reduce?'1':'0');
    localStorage.setItem('cb-dim-bg',dim?'1':'0');
    document.querySelector('.backdrop').style.animation=reduce?'none':'';
    document.querySelector('.veil').style.opacity=dim?'0.8':'';
    modalDescription.textContent='Preferences saved on this device.';
  }
});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closePanel();});
