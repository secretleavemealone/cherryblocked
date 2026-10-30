const modalBackdrop=document.getElementById('modalBackdrop');
const modalTitle=document.getElementById('modalTitle');
const modalDescription=document.getElementById('modalDescription');
const modalContent=document.getElementById('modalContent');
let gameCleanup=null;

const panels={
  home:{title:'Welcome home',description:'What do you want to do?',content:'<div class="modal-links"><button data-panel="games">🎮 Browse games</button><button data-panel="chat">💬 Open community chat</button></div>'},
  games:{title:'Game Garden',description:'Little games, right inside CherryBlocked. More can be added any time.',content:'<div class="game-list game-grid"><button class="game-item" data-game="2048"><span>🔢</span><span><strong>2048</strong><small>Combine tiles and reach 2048.</small></span><b>▶</b></button><button class="game-item" data-game="snake"><span>🐍</span><span><strong>Snake</strong><small>Collect fruit and don't hit yourself.</small></span><b>▶</b></button><button class="game-item" data-game="reaction"><span>⚡</span><span><strong>Reaction Time</strong><small>Test how quickly you can react.</small></span><b>▶</b></button></div><p class="small-note">Games run on this page. Personal bests are saved on this device.</p>'},
  chat:{title:'Community Chat',description:'A live shared chat needs a database and authentication connection.',content:'<div class="chat-placeholder"><div class="chat-icon">💬</div><strong>Community chat setup</strong><p>This is a placeholder for now. To let visitors share messages with each other, we still need to connect a real-time chat backend.</p></div>'},
  settings:{title:'Settings',description:'Personalize your experience on this device.',content:'<label class="setting-row">Reduce motion <input id="reduceMotion" type="checkbox"></label><label class="setting-row">Dim background <input id="dimBg" type="checkbox"></label><button class="primary-button" id="saveSettings" type="button">Save preferences</button>'}
};
function stopGame(){if(gameCleanup){gameCleanup();gameCleanup=null;}}
function openPanel(name){
  stopGame();const panel=panels[name];if(!panel)return;
  modalTitle.textContent=panel.title;modalDescription.textContent=panel.description;modalContent.innerHTML=panel.content;modalBackdrop.hidden=false;
  document.querySelectorAll('[data-panel]').forEach(button=>button.classList.toggle('active',button.dataset.panel===name));
  if(name==='settings'){document.getElementById('reduceMotion').checked=localStorage.getItem('cb-reduce-motion')==='1';document.getElementById('dimBg').checked=localStorage.getItem('cb-dim-bg')==='1';}
}
function closePanel(){stopGame();modalBackdrop.hidden=true;}
function best(key,value){const old=Number(localStorage.getItem(key)||0);if(value>old)localStorage.setItem(key,String(value));return Math.max(old,value);}
function showGame(title,desc,html){stopGame();modalTitle.textContent=title;modalDescription.textContent=desc;modalContent.innerHTML='<button class="game-back" data-panel="games">← All games</button>'+html;}
function start2048(){
 showGame('2048','Use arrow keys (or swipe) to combine matching tiles.','<div class="game-toolbar"><span>Score: <b id="gScore">0</b></span><span>Best: <b id="gBest">0</b></span><button class="primary-button" id="gRestart">Restart</button></div><div id="board2048" class="board2048" role="grid" aria-label="2048 game board"></div><p class="small-note">Arrow keys move the tiles. On phones, swipe the board.</p>');
 const boardEl=document.getElementById('board2048'),scoreEl=document.getElementById('gScore'),bestEl=document.getElementById('gBest');let board,score=0,over=false;
 function init(){board=Array(16).fill(0);score=0;over=false;spawn();spawn();render();}
 function spawn(){const empty=board.map((v,i)=>v===0?i:-1).filter(i=>i>=0);if(empty.length)board[empty[Math.floor(Math.random()*empty.length)]]=Math.random()<.9?2:4;}
 function render(){boardEl.innerHTML=board.map(v=>'<div class="tile tile-'+(v||0)+'">'+(v||'')+'</div>').join('');scoreEl.textContent=score;bestEl.textContent=best('cb-best-2048',score);if(!movesPossible())over=true;if(over){boardEl.insertAdjacentHTML('beforeend','<div class="game-overlay"><strong>Game over</strong><button class="primary-button" id="gAgain">Play again</button></div>');}}
 function movesPossible(){if(board.some(v=>v===0))return true;for(let r=0;r<4;r++)for(let c=0;c<4;c++){let i=r*4+c;if(c<3&&board[i]===board[i+1]||r<3&&board[i]===board[i+4])return true;}return false;}
 function move(dir){if(over)return;let changed=false;for(let line=0;line<4;line++){let ids=[];for(let k=0;k<4;k++){if(dir==='left')ids.push(line*4+k);if(dir==='right')ids.push(line*4+(3-k));if(dir==='up')ids.push(k*4+line);if(dir==='down')ids.push((3-k)*4+line);}let vals=ids.map(i=>board[i]).filter(v=>v);let merged=[];for(let i=0;i<vals.length;i++){if(vals[i]===vals[i+1]){merged.push(vals[i]*2);score+=vals[i]*2;i++;}else merged.push(vals[i]);}while(merged.length<4)merged.push(0);ids.forEach((id,i)=>{if(board[id]!==merged[i])changed=true;board[id]=merged[i];});}if(changed){spawn();render();}}
 const keyHandler=e=>{const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};if(map[e.key]&&modalBackdrop.hidden===false&&document.getElementById('board2048')){e.preventDefault();move(map[e.key]);}};
 document.addEventListener('keydown',keyHandler);let touch=null;const ts=e=>{touch=[e.changedTouches[0].clientX,e.changedTouches[0].clientY];};const te=e=>{if(!touch)return;let dx=e.changedTouches[0].clientX-touch[0],dy=e.changedTouches[0].clientY-touch[1];if(Math.max(Math.abs(dx),Math.abs(dy))>25)move(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));touch=null;};boardEl.addEventListener('touchstart',ts,{passive:true});boardEl.addEventListener('touchend',te,{passive:true});const clickHandler=e=>{if(e.target.closest('#gRestart')||e.target.closest('#gAgain'))init();};modalContent.addEventListener('click',clickHandler);gameCleanup=()=>{document.removeEventListener('keydown',keyHandler);modalContent.removeEventListener('click',clickHandler);};init();
}
function startSnake(){
 showGame('Snake','Use arrow keys or WASD. Eat the fruit and avoid the walls and your tail.','<div class="game-toolbar"><span>Score: <b id="snakeScore">0</b></span><span>Best: <b id="snakeBest">0</b></span><button class="primary-button" id="snakeRestart">Restart</button></div><canvas id="snakeCanvas" class="snake-canvas" width="400" height="400" aria-label="Snake game"></canvas><p class="small-note">Arrow keys / WASD to steer. On mobile, swipe.</p>');
 const canvas=document.getElementById('snakeCanvas'),ctx=canvas.getContext('2d');let snake,dir,next,food,score,timer,dead,touch;
 function init(){clearInterval(timer);snake=[{x:8,y:10},{x:7,y:10},{x:6,y:10}];dir={x:1,y:0};next={x:1,y:0};food={x:14,y:10};score=0;dead=false;placeFood();draw();timer=setInterval(tick,115);}
 function placeFood(){do{food={x:Math.floor(Math.random()*20),y:Math.floor(Math.random()*20)}}while(snake.some(p=>p.x===food.x&&p.y===food.y));}
 function draw(){ctx.fillStyle='#21152a';ctx.fillRect(0,0,400,400);ctx.strokeStyle='#ffffff0b';for(let i=0;i<=20;i++){ctx.beginPath();ctx.moveTo(i*20,0);ctx.lineTo(i*20,400);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*20);ctx.lineTo(400,i*20);ctx.stroke();}ctx.fillStyle='#ffb8e1';ctx.beginPath();ctx.arc(food.x*20+10,food.y*20+10,7,0,Math.PI*2);ctx.fill();snake.forEach((p,i)=>{ctx.fillStyle=i?'#f184c6':'#ffd5ef';ctx.beginPath();ctx.roundRect(p.x*20+2,p.y*20+2,16,16,5);ctx.fill();});document.getElementById('snakeScore').textContent=score;document.getElementById('snakeBest').textContent=best('cb-best-snake',score);if(dead){ctx.fillStyle='#170d20d9';ctx.fillRect(0,0,400,400);ctx.fillStyle='white';ctx.textAlign='center';ctx.font='bold 28px sans-serif';ctx.fillText('Game over!',200,190);ctx.font='15px sans-serif';ctx.fillText('Press Restart to try again',200,220);}}
 function tick(){if(dead)return;dir=next;const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};if(head.x<0||head.x>=20||head.y<0||head.y>=20||snake.some((p,i)=>i<snake.length-1&&p.x===head.x&&p.y===head.y)){dead=true;clearInterval(timer);draw();return;}snake.unshift(head);if(head.x===food.x&&head.y===food.y){score+=10;placeFood();}else snake.pop();draw();}
 const kh=e=>{const m={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]};let v=m[e.key];if(v&&document.getElementById('snakeCanvas')){e.preventDefault();if(v[0]!==-dir.x||v[1]!==-dir.y)next={x:v[0],y:v[1]};}};
 document.addEventListener('keydown',kh);const click=e=>{if(e.target.closest('#snakeRestart'))init();};modalContent.addEventListener('click',click);const ts=e=>{touch=[e.changedTouches[0].clientX,e.changedTouches[0].clientY];};const te=e=>{if(!touch)return;let dx=e.changedTouches[0].clientX-touch[0],dy=e.changedTouches[0].clientY-touch[1];if(Math.max(Math.abs(dx),Math.abs(dy))>20){let v=Math.abs(dx)>Math.abs(dy)?[dx>0?1:-1,0]:[0,dy>0?1:-1];if(v[0]!==-dir.x||v[1]!==-dir.y)next={x:v[0],y:v[1]};}touch=null;};canvas.addEventListener('touchstart',ts,{passive:true});canvas.addEventListener('touchend',te,{passive:true});gameCleanup=()=>{clearInterval(timer);document.removeEventListener('keydown',kh);modalContent.removeEventListener('click',click);};init();
}
function startReaction(){
 showGame('Reaction Time','Wait until the box turns green, then click as fast as you can.','<div class="reaction-wrap"><div id="reactionBox" class="reaction-box">Press start when ready</div><button id="reactionStart" class="primary-button">Start test</button><p id="reactionResult" class="reaction-result">Best: '+(localStorage.getItem('cb-best-reaction')?localStorage.getItem('cb-best-reaction')+' ms':'not yet')+'</p></div>');
 const box=document.getElementById('reactionBox'),start=document.getElementById('reactionStart'),result=document.getElementById('reactionResult');let state='idle',timeout=null,stamp=0;
 function reset(){clearTimeout(timeout);state='idle';box.className='reaction-box';box.textContent='Press start when ready';start.disabled=false;}
 start.addEventListener('click',()=>{clearTimeout(timeout);state='waiting';box.className='reaction-box waiting';box.textContent='Wait for green…';start.disabled=true;timeout=setTimeout(()=>{state='go';stamp=performance.now();box.className='reaction-box go';box.textContent='CLICK NOW!';},1000+Math.random()*3000);});
 box.addEventListener('click',()=>{if(state==='waiting'){clearTimeout(timeout);state='early';box.className='reaction-box early';box.textContent='Too soon!';start.disabled=false;}else if(state==='go'){const ms=Math.round(performance.now()-stamp),old=Number(localStorage.getItem('cb-best-reaction')||0);if(!old||ms<old)localStorage.setItem('cb-best-reaction',String(ms));state='done';box.className='reaction-box';box.textContent=ms+' ms';result.textContent='Your time: '+ms+' ms · Best: '+localStorage.getItem('cb-best-reaction')+' ms';start.disabled=false;}});
 start.addEventListener('click',()=>{if(state==='early'||state==='done')reset();});gameCleanup=()=>clearTimeout(timeout);
}
document.addEventListener('click',function(event){
 const game=event.target.closest('[data-game]');if(game){const g=game.dataset.game;if(g==='2048')start2048();if(g==='snake')startSnake();if(g==='reaction')startReaction();return;}
 const panel=event.target.closest('[data-panel]');if(panel){event.preventDefault();openPanel(panel.dataset.panel);return;}
 if(event.target.closest('#closeModal')){closePanel();return;}
 if(event.target===modalBackdrop){closePanel();return;}
 if(event.target.closest('#saveSettings')){
  const reduce=document.getElementById('reduceMotion').checked,dim=document.getElementById('dimBg').checked;
  localStorage.setItem('cb-reduce-motion',reduce?'1':'0');localStorage.setItem('cb-dim-bg',dim?'1':'0');
  const backdrop=document.querySelector('.backdrop'),veil=document.querySelector('.veil');if(backdrop)backdrop.style.animation=reduce?'none':'';if(veil)veil.style.opacity=dim?'0.8':'';
  modalDescription.textContent='Preferences saved on this device.';
 }
});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closePanel();});
