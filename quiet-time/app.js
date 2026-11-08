const $=s=>document.querySelector(s), app=$('#app');const storage={get(k){try{return JSON.parse(localStorage.getItem('lg-'+k))}catch{return null}},set(k,v){localStorage.setItem('lg-'+k,JSON.stringify(v))}};
const sites={murdoku:'https://murdoku.com/',nyt:'https://www.nytimes.com/crosswords',murdle:'https://murdle.com/','little-daily':'https://thelittledaily.com/'};
// timer-only activities: done away from the screen, timed by the quiet session itself
const timerPages={'mary-oliver':'mary oliver time','stretching':'stretching time','coloring':'coloring time'};
const sessionChoices=[['sudoku','sudoku'],['minesweeper','minesweeper'],['solitaire','solitaire'],['tumble','tumble'],['garden','data garden'],['history','the history paper'],['write','just write'],...Object.entries(timerPages)];
let quiet=storage.get('quiet-session');
function activeQuiet(){if(!quiet)return false;if(quiet.pausedLeft!=null)return true;if(Date.now()>=quiet.until){if(timerPages[quiet.page])storage.set('timer-done',quiet.page);quiet=null;storage.set('quiet-session',null);return false}return true}
function sessionRemaining(){if(!activeQuiet())return '';let secs=Math.ceil((quiet.pausedLeft??quiet.until-Date.now())/1000);return Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0')}
function sessionPanel(){
 if(activeQuiet())return `<div class="session-panel active-session" aria-live="polite"><span>quiet session · <strong id="sessionClock">${sessionRemaining()}</strong></span><button class="textbtn" id="earlyEnd" type="button">finish early</button></div>`;
 return `<section class="session-panel"><div class="session-fields"><span class="session-label">quiet session</span><label for="sessionActivity">activity<select id="sessionActivity" class="pill">${sessionChoices.map(([id,n])=>`<option value="${id}">${n}</option>`).join('')}</select></label><label for="sessionLength">time<select id="sessionLength" class="pill"><option value="15">15 min</option><option value="30" selected>30 min</option><option value="45">45 min</option><option value="60">60 min</option></select></label><button class="primary" id="startSession" type="button">begin</button></div></section>`;
}
function attachSessionControls(){let start=$('#startSession');if(start)start.onclick=()=>{const page=$('#sessionActivity').value;const minutes=Number($('#sessionLength').value);quiet={page,until:Date.now()+minutes*60000};storage.set('quiet-session',quiet);go(page)};let end=$('#earlyEnd');if(end)end.onclick=requestEarlyEnd;let hd=$('#sessionClock');if(hd)hd.textContent=sessionRemaining()}
function requestEarlyEnd(){if(!activeQuiet())return;const existing=$('#quietExitDialog');if(existing){existing.remove();return}const mask=document.createElement('div');mask.id='quietExitDialog';mask.className='session-modal';mask.innerHTML=`<div class="session-dialog" role="dialog" aria-modal="true" aria-labelledby="sessionDialogTitle"><h2 id="sessionDialogTitle">leave this quiet moment?</h2><p>you can leave at any time, with a brief pause before switching.</p><p id="exitCountdown" aria-live="polite">you can end the session in 8 seconds.</p><div class="controls"><button class="pill" id="stayQuiet">stay here</button><button class="primary" id="confirmQuietExit" disabled>finish early</button></div></div>`;document.body.append(mask);$('#stayQuiet').onclick=()=>mask.remove();const until=Date.now()+8000;function step(){if(!mask.isConnected)return;let remaining=Math.ceil((until-Date.now())/1000),button=$('#confirmQuietExit');if(remaining<=0){$('#exitCountdown').textContent='you can leave whenever you choose.';button.disabled=false}else{$('#exitCountdown').textContent=`you can end the session in ${remaining} seconds.`;setTimeout(step,200)}}step();$('#confirmQuietExit').onclick=()=>{quiet=null;storage.set('quiet-session',null);mask.remove();go('home')};}
// the homepage collection: [heading, [[id, name, kind]]]; kind sets the card colour
const collection=[
 ['games',[['sudoku','sudoku','games'],['minesweeper','minesweeper','games'],['solitaire','solitaire','games'],['murdoku','murdoku','games'],['nyt','nyt games','games'],['murdle','murdle','games'],['little-daily','the little daily','games'],['tumble','tumble','games']]],
 ['words',[['write','just write','writing']]],
 ['explore',[['garden','data garden','learning'],['history','the history paper','reading']]],
 ['away from the screen',[['mary-oliver','mary oliver time','timer'],['stretching','stretching time','timer'],['coloring','coloring time','timer']]]
];
const names=Object.fromEntries(collection.flatMap(([,items])=>items.map(([id,n])=>[id,n])));
// simple cream line icons for the cards (stroke and fill come from the card's text colour)
const icons={
 sudoku:`<rect x="8" y="8" width="32" height="32" rx="4"/><path d="M18.7 8v32M29.3 8v32M8 18.7h32M8 29.3h32"/>`,
 minesweeper:`<circle cx="24" cy="24" r="9"/><path d="M24 8v5M24 35v5M8 24h5M35 24h5M12.7 12.7l3.5 3.5M31.8 31.8l3.5 3.5M12.7 35.3l3.5-3.5M31.8 16.2l3.5-3.5"/>`,
 solitaire:`<rect x="7" y="12" width="20" height="28" rx="3" transform="rotate(-10 17 26)"/><rect x="21" y="9" width="20" height="28" rx="3"/><path d="M31 18l3.5 5-3.5 5-3.5-5z" class="solid"/>`,
 murdoku:`<path d="M7 7h24v24H7zM15 7v24M23 7v24M7 15h24M7 23h24"/><circle cx="33" cy="33" r="6"/><path d="M37.5 37.5l4.5 4.5"/>`,
 nyt:`<rect x="8" y="8" width="32" height="32" rx="3"/><path d="M16 8v32M24 8v32M32 8v32M8 16h32M8 24h32M8 32h32"/><path d="M16 8h8v8h-8zM32 24h8v8h-8zM8 32h8v8H8z" class="solid"/>`,
 murdle:`<circle cx="24" cy="24" r="16"/><circle cx="24" cy="20" r="4"/><path d="M22 23.5l-2 8.5h8l-2-8.5"/>`,
 write:`<path d="M8 14h22M8 22h16M8 30h10"/><path d="M24 39l2-7 12-12 5 5-12 12z"/>`,
 history:`<path d="M9 10h26v28a3 3 0 0 0 3 3H12a3 3 0 0 1-3-3z"/><path d="M35 18h4v20a3 3 0 0 1-3 3"/><path d="M14 16h16M14 22h7M14 27h7M14 32h16"/><rect x="24" y="21" width="6" height="7" class="solid"/>`,
 'little-daily':`<path d="M6 34h36M13 34a11 11 0 0 1 22 0M24 11v6M11 19l4 4M37 19l-4 4M15 40h18"/>`,
 tumble:`<circle cx="29" cy="10" r="4"/><path d="M27 16l-5 10 6 5-2 10M22 26l-7 4-3 8M24 19l8 4 5-3M17 20l7-4"/><path d="M6 42h36"/>`,
 garden:`<path d="M8 40h32"/><path d="M14 40V26M24 40V18M34 40V30"/><circle cx="14" cy="22" r="4"/><circle cx="24" cy="13" r="5" class="solid"/><circle cx="34" cy="26" r="4"/>`,
 'mary-oliver':`<path d="M10 38C10 21 21 10 39 10c0 18-11 28-29 28zM10 38l17-17"/>`,
 stretching:`<path d="M8 36a16 16 0 0 1 32 0M15 36a9 9 0 0 1 18 0M22 36a2 2 0 0 1 4 0"/>`,
 coloring:`<path d="M24 8a16 16 0 1 0 0 32c3 0 4-2 3-4s0-4 3-4h4a6 6 0 0 0 6-6c0-10-7-18-16-18z"/><circle cx="15" cy="23" r="2" class="solid"/><circle cx="20" cy="15" r="2" class="solid"/><circle cx="29" cy="14" r="2" class="solid"/>`
};
function go(page='home'){if(activeQuiet()&&page!==quiet.page){requestEarlyEnd();return}history.replaceState(null,'','#'+page);render(page)}
function render(page=(location.hash.slice(1).split('?')[0]||'home')){
 if(activeQuiet()&&page!==quiet.page){history.replaceState(null,'','#'+quiet.page);page=quiet.page}
 document.body.classList.remove('home-page');
 if(storage.get('timer-done')&&storage.get('timer-done')!==page)storage.set('timer-done',null);
 if(page==='home')home();
 else if(page==='sudoku')drawSudoku();
 else if(page==='solitaire')drawSolitaire();
 else if(page==='minesweeper')drawMinesweeper();
 else if(page==='tumble')drawTumble();
 else if(page==='garden')drawGarden();
 else if(page==='history')drawHistory();
 else if(page==='write')drawWrite();
 else if(sites[page])external(page);
 else if(timerPages[page])drawTimer(page);
 else home();
 if(activeQuiet()&&!timerPages[page])app.insertAdjacentHTML('afterbegin',sessionPanel());
 attachSessionControls();scrollTo({top:0,behavior:'instant'});
}
function home(){
 document.body.classList.add('home-page');
 app.innerHTML=`<h1 class="home-title">quiet time</h1>${collection.map(([heading,items])=>`<section class="shelf"><h2 class="shelf-title">${heading}</h2><div class="shelf-grid">${items.map(([id,n,kind])=>{const inner=`<svg class="activity-icon" viewBox="0 0 48 48" aria-hidden="true">${icons[id]}</svg><span class="activity-name">${n}</span>`;return sites[id]?`<a class="activity kind-${kind}" href="${sites[id]}" target="_blank" rel="noopener noreferrer" data-site="${id}">${inner}</a>`:`<button class="activity kind-${kind}" data-page="${id}" type="button">${inner}</button>`}).join('')}</div></section>`).join('')}${sessionPanel()}`;
 app.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>go(b.dataset.page));
 // outside sites open in their own tab, but never past a quiet session: leaving goes through the same early-exit pause
 app.querySelectorAll('[data-site]').forEach(a=>a.onclick=e=>{if(activeQuiet()){e.preventDefault();requestEarlyEnd()}});
 attachSessionControls();
}
function layout(title,subtitle,content){
 app.innerHTML=`<section class="view"><button class="back" id="back">home</button><div class="viewhead"><h2>${title.toLowerCase()}</h2></div>${content}</section>`;
 $('#back').onclick=()=>go('home');
}
function external(page){
 layout(names[page],'',`<div class="external-single"><a class="primary external-link" href="${sites[page]}" target="_blank" rel="noopener noreferrer">open ${names[page]}</a></div>`);
}
// timer activities: one screen, reused by each timer page. The countdown is the quiet session's own
// timestamp (shown in #sessionClock, updated by the shared interval), so there is a single source of truth.
const ambDefaults={color:'amber',mode:matchMedia('(prefers-reduced-motion: reduce)').matches?'still':'waves',intensity:'low',showTime:true};
let amb={...ambDefaults,...(storage.get('ambience')||{})};
const ambOptions=[['color','color',[['amber','warm amber'],['rose','rose'],['sage','sage'],['lavender','lavender']]],['mode','light',[['still','still'],['breathing','breathing'],['waves','waves']]],['intensity','glow',[['off','off'],['low','low'],['medium','medium'],['high','high']]],['showTime','timer',[[true,'shown'],[false,'hidden']]]];
let timerPeekTimeout=null;
function applyAmbient(){const a=$('#ambient'),stage=$('#timerStage');if(a){a.dataset.color=amb.color;a.dataset.mode=amb.mode;a.dataset.intensity=amb.intensity}if(stage)stage.classList.toggle('time-hidden',!amb.showTime);document.querySelectorAll('[data-amb]').forEach(b=>b.setAttribute('aria-pressed',String(amb[b.dataset.amb]===JSON.parse(b.dataset.val))))}
function drawTimer(page){
 const running=activeQuiet()&&quiet.page===page,paused=running&&quiet.pausedLeft!=null,done=!running&&storage.get('timer-done')===page;
 let length=storage.get('timer-length')||30,body;
 if(running)body=`<div class="timer-time" aria-live="off"><span id="sessionClock">${sessionRemaining()}</span></div><button class="timer-peek" id="timerPeek" type="button">show time</button><div class="controls timer-controls"><button class="pill" id="timerPause" type="button">${paused?'resume':'pause'}</button><button class="pill" id="earlyEnd" type="button">finish early</button></div>`;
 else if(done)body=`<div class="timer-time timer-finished">time's up</div><div class="controls timer-controls"><button class="pill" id="timerAgain" type="button">again</button><button class="pill" id="timerHome" type="button">home</button></div>`;
 else body=`<div class="controls timer-lengths" role="group" aria-label="length">${[15,30,45,60].map(m=>`<button class="pill" data-min="${m}" type="button" aria-pressed="${m===length}">${m} min</button>`).join('')}</div><button class="primary" id="timerStart" type="button">begin</button>`;
 layout(timerPages[page],'',`<section class="timer-stage" id="timerStage"><div class="ambient" id="ambient" aria-hidden="true"><span class="glow"></span><span class="glow"></span><span class="glow"></span></div>${body}</section><details class="light-settings"><summary>light</summary>${ambOptions.map(([key,label,vals])=>`<div class="light-row"><span>${label}</span><div class="controls" role="group" aria-label="${label}">${vals.map(([v,n])=>`<button class="pill" type="button" data-amb="${key}" data-val='${JSON.stringify(v)}' aria-pressed="false">${n}</button>`).join('')}</div></div>`).join('')}</details>`);
 applyAmbient();
 document.querySelectorAll('[data-amb]').forEach(b=>b.onclick=()=>{amb[b.dataset.amb]=JSON.parse(b.dataset.val);storage.set('ambience',amb);applyAmbient()});
 document.querySelectorAll('[data-min]').forEach(b=>b.onclick=()=>{length=+b.dataset.min;document.querySelectorAll('[data-min]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))});
 const start=$('#timerStart');if(start)start.onclick=()=>{storage.set('timer-length',length);quiet={page,until:Date.now()+length*60000};storage.set('quiet-session',quiet);go(page)};
 const pause=$('#timerPause');if(pause)pause.onclick=()=>{if(!activeQuiet())return;if(quiet.pausedLeft!=null){quiet.until=Date.now()+quiet.pausedLeft;quiet.pausedLeft=null;pause.textContent='pause'}else{quiet.pausedLeft=Math.max(0,quiet.until-Date.now());pause.textContent='resume'}storage.set('quiet-session',quiet);$('#sessionClock').textContent=sessionRemaining()};
 const peek=()=>{const stage=$('#timerStage');if(!stage||amb.showTime)return;stage.classList.add('peek');clearTimeout(timerPeekTimeout);timerPeekTimeout=setTimeout(()=>stage.classList.remove('peek'),6000)};
 $('#timerStage').onclick=e=>{if(!e.target.closest('button')||e.target.id==='timerPeek')peek()};
 const again=$('#timerAgain');if(again)again.onclick=()=>{storage.set('timer-done',null);drawTimer(page)};
 const homeBtn=$('#timerHome');if(homeBtn)homeBtn.onclick=()=>{storage.set('timer-done',null);go('home')};
}
document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('tab-hidden',document.hidden);const c=$('#sessionClock');if(c&&!document.hidden)activeQuiet()?c.textContent=sessionRemaining():render()});

// Sudoku: generate a valid completed grid by permutations of a pattern and remove clues while preserving unique solution.
let sdk=null;const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function sudokuFull(){let pattern=(r,c)=>(r*3+Math.floor(r/3)+c)%9;let group=()=>shuffle([0,1,2]);let rows=shuffle([0,1,2]).flatMap(g=>group().map(r=>g*3+r)),cols=shuffle([0,1,2]).flatMap(g=>group().map(c=>g*3+c)),nums=shuffle([1,2,3,4,5,6,7,8,9]);return rows.flatMap(r=>cols.map(c=>nums[pattern(r,c)]))}
function candidates(board,i){let used=new Set;let r=Math.floor(i/9),c=i%9;for(let n=0;n<9;n++){used.add(board[r*9+n]);used.add(board[n*9+c]);used.add(board[(Math.floor(r/3)*3+Math.floor(n/3))*9+Math.floor(c/3)*3+n%3])}return [1,2,3,4,5,6,7,8,9].filter(v=>!used.has(v))}
function countSolutions(board,limit=2){let choice=-1,opts=null;for(let i=0;i<81;i++)if(!board[i]){let o=candidates(board,i);if(!o.length)return 0;if(!opts||o.length<opts.length){opts=o;choice=i;if(o.length===1)break}}if(choice===-1)return 1;let count=0;for(let v of opts){board[choice]=v;count+=countSolutions(board,limit);if(count>=limit)break}board[choice]=0;return count}
function newSudoku(level='easy'){let full=sudokuFull(),puzzle=[...full],target={easy:40,medium:32,hard:27}[level],order=shuffle([...Array(81).keys()]);for(let i of order){if(puzzle.filter(Boolean).length<=target)break;let old=puzzle[i];puzzle[i]=0;if(countSolutions([...puzzle])!==1)puzzle[i]=old}sdk={full,puzzle,values:[...puzzle],notes:{},selected:0,noteMode:false,level,mistakes:false,message:''};saveSudoku()}
function saveSudoku(){storage.set('sudoku',sdk)}
function drawSudoku(){sdk=storage.get('sudoku')||null;if(!sdk)newSudoku();layout('sudoku','',`<div class="sudoku-wrap"><div class="sudoku-board" id="board" role="grid" aria-label="sudoku grid"></div><div class="side"><div class="controls"><select id="level" class="pill" aria-label="difficulty"><option value="easy">gentle</option><option value="medium">thoughtful</option><option value="hard">a challenge</option></select><button class="pill" id="new">new puzzle</button></div><div class="numgrid" id="numbers">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-n="${n}">${n}</button>`).join('')}</div><div class="controls"><button class="pill" id="notes">pencil: off</button><button class="pill" id="erase">erase</button><button class="pill" id="hint">hint</button></div><div class="controls"><button class="pill" id="check">check</button><button class="pill" id="reset">reset entries</button></div><p class="feedback" id="feedback" aria-live="polite"></p></div></div>`);$('#level').value=sdk.level;$('#level').onchange=e=>{if(confirm('start a new '+e.target.value+' puzzle?')){newSudoku(e.target.value);drawSudoku()}else e.target.value=sdk.level};$('#new').onclick=()=>{newSudoku(sdk.level);drawSudoku()};$('#numbers').onclick=e=>{const b=e.target.closest('[data-n]');if(b)placeNumber(+b.dataset.n)};$('#notes').onclick=()=>{sdk.noteMode=!sdk.noteMode;saveSudoku();updateSudoku()};$('#erase').onclick=()=>placeNumber(0);$('#hint').onclick=()=>{let i=sdk.selected;if(sdk.puzzle[i]){sdk.message='that number is already given.'}else{sdk.values[i]=sdk.full[i];delete sdk.notes[i];sdk.message='a little nudge in the right direction.'}saveSudoku();updateSudoku()};$('#check').onclick=()=>{sdk.mistakes=true;sdk.message=sdk.values.every((v,i)=>v===sdk.full[i])?'the puzzle is complete!':'incorrect entries are shown in rose.';saveSudoku();updateSudoku()};$('#reset').onclick=()=>{if(confirm('clear your entries for this puzzle?')){sdk.values=[...sdk.puzzle];sdk.notes={};sdk.message='';sdk.mistakes=false;saveSudoku();updateSudoku()}};updateSudoku()}
function updateSudoku(){let board=$('#board');if(!board)return;board.innerHTML=sdk.values.map((n,i)=>{let row=Math.floor(i/9),col=i%9,sel=Math.floor(sdk.selected/9),scol=sdk.selected%9,peer=row===sel||col===scol||(Math.floor(row/3)===Math.floor(sel/3)&&Math.floor(col/3)===Math.floor(scol/3));let cls=[sdk.puzzle[i]?'given':'',i===sdk.selected?'selected':peer?'peer':'',sdk.mistakes&&n&&n!==sdk.full[i]?'error':''].join(' ');return `<button class="cell ${cls}" role="gridcell" aria-label="row ${row+1} column ${col+1} ${n||'blank'}" data-i="${i}">${n|| (sdk.notes[i]?`<span class="notes">${Object.keys(sdk.notes[i]).sort().join(' ')}</span>`:'')}</button>`}).join('');board.onclick=e=>{let b=e.target.closest('[data-i]');if(b){sdk.selected=+b.dataset.i;saveSudoku();updateSudoku()}};$('#notes').textContent='pencil: '+(sdk.noteMode?'on':'off');$('#notes').classList.toggle('active',sdk.noteMode);$('#feedback').textContent=sdk.message||''}
function placeNumber(n){let i=sdk.selected;if(sdk.puzzle[i])return;if(sdk.noteMode&&n){sdk.notes[i]??={};sdk.notes[i][n]?delete sdk.notes[i][n]:sdk.notes[i][n]=true}else{sdk.values[i]=n;delete sdk.notes[i]}sdk.mistakes=false;sdk.message=sdk.values.every((v,i)=>v===sdk.full[i])?'lovely work — you finished the puzzle!':'';saveSudoku();updateSudoku()}
document.addEventListener('keydown',e=>{if(!$('#board')||!sdk)return;if(/^[1-9]$/.test(e.key)){placeNumber(+e.key);return}if(e.key==='Backspace'||e.key==='Delete'){placeNumber(0);return}let dir={ArrowLeft:-1,ArrowRight:1,ArrowUp:-9,ArrowDown:9}[e.key];if(dir){e.preventDefault();let n=sdk.selected+dir;if(n>=0&&n<81){sdk.selected=n;saveSudoku();updateSudoku()}}});
// Klondike Solitaire: five difficulty levels (draw one or three, limited passes, open empty columns), click to select movable tableau runs, waste cards and foundations.
let sol=null;const suits=['♠','♥','♣','♦'];const red=s=>s==='♥'||s==='♦';const color=c=>red(c.suit)?'red':'black';function deck(){return suits.flatMap(suit=>Array.from({length:13},(_,i)=>({suit,rank:i+1,up:false,id:suit+(i+1)})))}
const SOL_LEVELS={
 breezy:{title:'breezy · draw 1, any card fills a space',draw:1,passes:Infinity,anyEmpty:true,undo:true},
 gentle:{title:'gentle · draw 1',draw:1,passes:Infinity,anyEmpty:false,undo:true},
 thoughtful:{title:'thoughtful · draw 3',draw:3,passes:Infinity,anyEmpty:false,undo:true},
 tricky:{title:'tricky · draw 3, three passes',draw:3,passes:3,anyEmpty:false,undo:true},
 challenging:{title:'a challenge · draw 3, one pass, no undo',draw:3,passes:1,anyEmpty:false,undo:false}};
const solLevel=()=>SOL_LEVELS[sol?.level]||SOL_LEVELS.gentle;
function newSol(level=sol?.level){level=SOL_LEVELS[level]?level:'gentle';storage.set('sol-undo',null);let d=shuffle(deck()),cols=Array.from({length:7},()=>[]);for(let i=0;i<7;i++)for(let j=0;j<=i;j++){let c=d.pop();c.up=j===i;cols[i].push(c)}sol={cols,stock:d,waste:[],found:[[],[],[],[]],selected:null,moves:0,message:'',level,pass:1};saveSol()}
function saveSol(){storage.set('solitaire',sol)}
function cardLabel(c){return 'a23456789jqk'[c.rank-1]||'10'}function rankText(r){return r===1?'A':r===11?'J':r===12?'Q':r===13?'K':String(r)}
// card faces: classic pip layouts for numbers, a small framed figure for jacks, queens and kings
const pipLayouts={1:[[50,70]],2:[[50,34],[50,106]],3:[[50,34],[50,70],[50,106]],4:[[37,34],[63,34],[37,106],[63,106]],5:[[37,34],[63,34],[50,70],[37,106],[63,106]],6:[[37,34],[63,34],[37,70],[63,70],[37,106],[63,106]],7:[[37,34],[63,34],[50,52],[37,70],[63,70],[37,106],[63,106]],8:[[37,34],[63,34],[50,52],[37,70],[63,70],[50,88],[37,106],[63,106]],9:[[37,34],[63,34],[37,58],[63,58],[50,70],[37,82],[63,82],[37,106],[63,106]],10:[[37,34],[63,34],[50,47],[37,58],[63,58],[37,82],[63,82],[50,93],[37,106],[63,106]]};
const courtHats={11:'<path d="M37 47q13-15 26 0z" fill="currentColor"/><path d="M60 40q9-9 13 1" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',12:'<path d="M39 46l3-8 4 5 4-7 4 7 4-5 3 8z" fill="#d8b46a"/><circle cx="50" cy="38" r="2" fill="currentColor"/>',13:'<path d="M37 47l1-13 6 6 6-9 6 9 6-6 1 13z" fill="#d8b46a"/>'};
function cardFace(c){
 if(c.rank>10)return `<svg class="face-art" viewBox="0 0 100 140" aria-hidden="true"><rect x="25" y="22" width="50" height="96" rx="6" fill="currentColor" fill-opacity=".08" stroke="currentColor" stroke-opacity=".45"/><path d="M30 118v-18q0-19 20-21q20 2 20 21v18z" fill="currentColor"/><path d="M42 80l8 12 8-12" fill="none" stroke="#f7efdc" stroke-width="2.5"/><circle cx="50" cy="60" r="12" fill="#f1dcc4"/><path d="M38 58q1-12 12-12t12 12q-5-6-12-6t-12 6z" fill="#6b4f3c"/>${courtHats[c.rank]}<text x="50" y="112" font-size="13" text-anchor="middle" fill="#f7efdc">${c.suit}</text></svg>`;
 const big=c.rank===1;
 return `<svg class="face-art" viewBox="0 0 100 140" aria-hidden="true">${pipLayouts[c.rank].map(([x,y])=>`<text x="${x}" y="${y}" font-size="${big?46:20}" text-anchor="middle" dominant-baseline="central" fill="currentColor"${y>70?` transform="rotate(180 ${x} ${y})"`:''}>${c.suit}</text>`).join('')}</svg>`;
}
function cardHTML(c,loc,index=0,offset=0){if(!c)return '';return `<div class="card ${c.up?(red(c.suit)?'red':''):'down'} ${sol.selected&&sol.selected.loc===loc&&index>=sol.selected.index?'picked':''}" data-loc="${loc}" data-index="${index}" style="top:${offset}px" aria-label="${c.up?rankText(c.rank)+' of '+c.suit:'face down'}">${c.up?`<span class="idx tl">${rankText(c.rank)}<span>${c.suit}</span></span>${cardFace(c)}<span class="idx br">${rankText(c.rank)}<span>${c.suit}</span></span>`:''}</div>`}
function drawSolitaire(){sol=storage.get('solitaire');if(!sol)newSol();sol.level=SOL_LEVELS[sol.level]?sol.level:'gentle';sol.pass??=1;layout('solitaire','',`<div class="controls" style="margin-bottom:15px"><select class="pill" id="solLevel" aria-label="difficulty">${Object.entries(SOL_LEVELS).map(([id,l])=>`<option value="${id}">${l.title}</option>`).join('')}</select><button class="pill" id="newSol">new game</button><button class="pill" id="undoSol">undo move</button><span class="tag" id="moveCount"></span></div><section class="sol-wrap"><div class="sol-top"><div class="sol-slot"><div class="sol-pile" id="stock" aria-label="stock"></div><div class="sol-pile" id="waste" data-drop="waste"></div></div><div class="sol-slot" id="foundations"></div></div><div class="sol-table" id="columns"></div><div class="sol-info" id="solInfo" aria-live="polite"></div></section>`);$('.sol-wrap').onpointerdown=solDragStart;$('.sol-wrap').addEventListener('click',e=>{if(solJustDragged){e.stopPropagation();solJustDragged=false}},true);$('#solLevel').value=sol.level;$('#solLevel').onchange=e=>{if(confirm('start a new '+e.target.value+' game?')){newSol(e.target.value);updateSol()}else e.target.value=sol.level};$('#newSol').onclick=()=>{if(confirm('start a new game?')){newSol();updateSol()}};$('#undoSol').onclick=()=>{if(!solLevel().undo)return;const prev=storage.get('sol-undo');if(prev){sol=prev;saveSol();updateSol();storage.set('sol-undo',null)}};updateSol()}
function updateSol(){if(!$('#columns'))return;const lv=solLevel(),canRecycle=sol.pass<lv.passes;$('#stock').innerHTML=sol.stock.length?`<div class="card down"></div>`:sol.waste.length&&canRecycle?'<span class="empty">↻</span>':'';const fan=sol.waste.slice(-lv.draw),w0=sol.waste.length-fan.length;$('#waste').innerHTML=fan.map((c,k)=>k===fan.length-1?cardHTML(c,'waste',w0+k).replace('style="','style="left:'+k*22+'%;'):cardHTML(c,'',w0+k).replace('style="','style="left:'+k*22+'%;')).join('');$('#undoSol').hidden=!lv.undo;$('#foundations').innerHTML=sol.found.map((f,i)=>`<div class="sol-pile" data-drop="f${i}">${f.length?cardHTML(f.at(-1),'f'+i,f.length-1):`<span class="empty">A</span>`}</div>`).join('');$('#columns').innerHTML=sol.cols.map((col,i)=>`<div class="sol-col" data-drop="t${i}">${col.map((c,j)=>cardHTML(c,'t'+i,j,j*25)).join('')}</div>`).join('');$('#moveCount').textContent=sol.moves+' moves'+(lv.passes<Infinity?' · pass '+Math.min(sol.pass,lv.passes)+' of '+lv.passes:'');$('#solInfo').textContent=sol.message;$('#stock').onclick=()=>{if(!sol.stock.length&&!sol.waste.length)return;if(!sol.stock.length&&!canRecycle){sol.message='no passes left through the stock — keep going with what is on the table.';saveSol();updateSol();return}rememberSol();if(sol.stock.length){for(let k=0;k<lv.draw&&sol.stock.length;k++){let c=sol.stock.pop();c.up=true;sol.waste.push(c)}}else{sol.stock=sol.waste.reverse().map(c=>({...c,up:false}));sol.waste=[];sol.pass++}sol.message='';sol.selected=null;sol.moves++;saveSol();updateSol()};$('#waste').onclick=e=>selectSol('waste',sol.waste.length-1);$('#foundations').onclick=e=>{let p=e.target.closest('[data-drop]');if(p)clickSol(p.dataset.drop)};$('#columns').onclick=e=>{let c=e.target.closest('.card'),p=e.target.closest('[data-drop]');if(!p)return;if(sol.selected){clickSol(p.dataset.drop);return}if(c)selectSol(p.dataset.drop,+c.dataset.index);else clickSol(p.dataset.drop)}}
function selectSol(loc,index){let cards=getPile(loc);if(!cards||!cards[index]?.up)return;sol.selected={loc,index};sol.message='';saveSol();updateSol()}
function getPile(loc){return loc==='waste'?sol.waste:loc[0]==='t'?sol.cols[+loc.slice(1)]:loc[0]==='f'?sol.found[+loc.slice(1)]:null}
function rememberSol(){if(solLevel().undo)storage.set('sol-undo',structuredClone(sol))}
// drag and drop: pick up a face-up card (and everything on top of it), drop it on any pile; clicking still works too.
let solDrag=null,solJustDragged=false;
function solDragStart(e){if(e.button>0)return;const card=e.target.closest('.card');if(!card||card.classList.contains('down')||!card.dataset.loc)return;solDrag={loc:card.dataset.loc,index:+card.dataset.index,x:e.clientX,y:e.clientY,ghost:null}}
document.addEventListener('pointermove',e=>{
 if(!solDrag)return;
 if(!solDrag.ghost){
   if(Math.hypot(e.clientX-solDrag.x,e.clientY-solDrag.y)<6)return;
   const cards=[...document.querySelectorAll(`.card[data-loc="${solDrag.loc}"]`)].filter(c=>+c.dataset.index>=solDrag.index);if(!cards.length){solDrag=null;return}
   const first=cards[0].getBoundingClientRect(),ghost=document.createElement('div');ghost.className='sol-ghost';ghost.style.width=first.width+'px';
   cards.forEach(c=>{const r=c.getBoundingClientRect(),copy=c.cloneNode(true);copy.style.top=(r.top-first.top)+'px';copy.classList.remove('picked');ghost.append(copy);c.classList.add('lifted')});
   solDrag.ghost=ghost;solDrag.dx=solDrag.x-first.left;solDrag.dy=solDrag.y-first.top;document.body.append(ghost);
 }
 e.preventDefault();solDrag.ghost.style.left=(e.clientX-solDrag.dx)+'px';solDrag.ghost.style.top=(e.clientY-solDrag.dy)+'px';
});
document.addEventListener('pointerup',e=>{
 if(!solDrag)return;const drag=solDrag;solDrag=null;
 if(!drag.ghost&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6)return;
 drag.ghost?.remove();solJustDragged=true;setTimeout(()=>solJustDragged=false,0);
 const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-drop]');
 if(target&&target.dataset.drop!==drag.loc){sol.selected={loc:drag.loc,index:drag.index};clickSol(target.dataset.drop)}else updateSol();
});
document.addEventListener('pointercancel',()=>{if(solDrag?.ghost){solDrag.ghost.remove();updateSol()}solDrag=null});
function clickSol(dest){if(!sol.selected){let pile=getPile(dest);if(pile?.length&&pile.at(-1).up)selectSol(dest,pile.length-1);return}let {loc,index}=sol.selected;if(loc===dest){sol.selected=null;saveSol();updateSol();return}let src=getPile(loc),dst=getPile(dest),moving=src.slice(index);if(!moving.length)return;let valid=false;if(dest[0]==='t'){valid=(!dst.length&&(moving[0].rank===13||solLevel().anyEmpty))||(dst.length&&dst.at(-1).up&&dst.at(-1).rank===moving[0].rank+1&&color(dst.at(-1))!==color(moving[0]))}else if(dest[0]==='f'&&moving.length===1){valid=(!dst.length&&moving[0].rank===1)||(dst.length&&dst.at(-1).suit===moving[0].suit&&dst.at(-1).rank+1===moving[0].rank)}if(valid){rememberSol();dst.push(...src.splice(index));if(loc[0]==='t'&&src.length)src.at(-1).up=true;sol.moves++;sol.message=sol.found.every(f=>f.length===13)?'you won! a lovely little victory.':'a lovely move.'}else sol.message='that move does not fit just yet.';sol.selected=null;saveSol();updateSol()}

// an in-app forward-only writing space: local only, not affiliated with justwrite.page.
let writeDraft='';
function saveWrite(){storage.set('write-draft',writeDraft)}
function writeCount(s){return (s.trim().match(/\S+/g)||[]).length}
function exportWriting(text,filename='quiet-time-writing.txt'){
 const blob=new Blob([text],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function drawWrite(){
 writeDraft=storage.get('write-draft')||'';
 layout('just write','',`<section class="writing-space"><textarea id="writeEditor" class="write-editor" aria-label="write without editing" placeholder="just start writing…" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off"></textarea><div class="write-tools"><span id="writeCount" class="write-count" aria-live="polite">0 words</span><div class="controls"><button class="pill" id="copyWrite" type="button">copy</button><button class="pill" id="saveWrite" type="button">save .txt</button><button class="pill" id="newWrite" type="button">new page</button></div></div><details class="write-past"><summary>previous pages</summary><div id="writeArchive"></div></details><p class="write-original"><a href="https://www.justwrite.page/" target="_blank" rel="noopener noreferrer">open the original just write</a></p></section>`);
 const editor=$('#writeEditor');
 editor.value=writeDraft;
 function toEnd(){editor.setSelectionRange(editor.value.length,editor.value.length)}
 function renderCount(){$('#writeCount').textContent=writeCount(writeDraft)+' words'}
 renderCount();
 editor.addEventListener('beforeinput',e=>{
   const t=e.inputType||'';
   if(t.startsWith('delete')||t.includes('History')||t.startsWith('history')||t==='insertReplacementText'||t==='insertFromDrop'||(editor.selectionStart!==writeDraft.length||editor.selectionEnd!==writeDraft.length)){
     e.preventDefault();toEnd();
   }
 });
 editor.addEventListener('keydown',e=>{
   if(e.metaKey||e.ctrlKey){
     if(['z','x','a'].includes(e.key.toLowerCase())){e.preventDefault();toEnd();}
     return;
   }
   if(['Backspace','Delete','ArrowLeft','ArrowUp','Home','PageUp'].includes(e.key)){
     e.preventDefault();toEnd();
   }
 });
 editor.addEventListener('click',toEnd);
 editor.addEventListener('focus',toEnd);
 editor.addEventListener('input',()=>{
   if(editor.value.startsWith(writeDraft)){
     writeDraft=editor.value;saveWrite();renderCount();
   }else{editor.value=writeDraft;}
   toEnd();
 });
 $('#copyWrite').onclick=async()=>{
   try{await navigator.clipboard.writeText(writeDraft);$('#copyWrite').textContent='copied';}
   catch{editor.focus();editor.select();document.execCommand('copy');toEnd();}
 };
 $('#saveWrite').onclick=()=>exportWriting(writeDraft);
 $('#newWrite').onclick=()=>{
   if(!writeDraft.trim()){editor.focus();return;}
   if(!confirm('save this page and begin a new one?'))return;
   let archive=storage.get('write-archive')||[];
   archive.unshift({date:new Date().toISOString(),text:writeDraft});
   storage.set('write-archive',archive);
   writeDraft='';saveWrite();editor.value='';renderCount();renderWriteArchive();editor.focus();
 };
 function renderWriteArchive(){
   const archive=storage.get('write-archive')||[];
   const host=$('#writeArchive');host.replaceChildren();
   if(!archive.length){const p=document.createElement('p');p.textContent='no previous pages';host.append(p);return;}
   archive.forEach((entry,i)=>{
     const item=document.createElement('div');item.className='write-entry';
     const label=document.createElement('span');
     label.textContent=new Date(entry.date).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
     const copy=document.createElement('button');copy.className='pill';copy.textContent='save .txt';
     copy.onclick=()=>exportWriting(entry.text,'quiet-time-page-'+(i+1)+'.txt');
     item.append(label,copy);host.append(item);
   });
 }
 renderWriteArchive();
 editor.focus();
}

$('#homeBtn').onclick=()=>go('home');window.addEventListener('hashchange',()=>render());render();setInterval(()=>{const c=$('#sessionClock');if(!c)return;if(activeQuiet())c.textContent=sessionRemaining();else render()},1000);if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
