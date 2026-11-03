const $=s=>document.querySelector(s), app=$('#app');const storage={get(k){try{return JSON.parse(localStorage.getItem('lg-'+k))}catch{return null}},set(k,v){localStorage.setItem('lg-'+k,JSON.stringify(v))}};
const links=[['murdoku','https://murdoku.com/'],['nyt games','https://www.nytimes.com/crosswords']];
const sessionChoices=[['sudoku','sudoku'],['minesweeper','minesweeper'],['solitaire','solitaire'],['write','just write']];
let quiet=storage.get('quiet-session');
function activeQuiet(){if(!quiet)return false;if(Date.now()>=quiet.until){quiet=null;storage.set('quiet-session',null);return false}return true}
function sessionRemaining(){if(!activeQuiet())return '';let secs=Math.ceil((quiet.until-Date.now())/1000);return Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0')}
function sessionPanel(){
 if(activeQuiet())return `<div class="session-panel active-session" aria-live="polite"><span>quiet session · <strong id="sessionClock">${sessionRemaining()}</strong></span><button class="textbtn" id="earlyEnd" type="button">finish early</button></div>`;
 return `<section class="session-panel"><div class="session-fields"><span class="session-label">quiet session</span><label for="sessionActivity">activity<select id="sessionActivity" class="pill">${sessionChoices.map(([id,n])=>`<option value="${id}">${n}</option>`).join('')}</select></label><label for="sessionLength">time<select id="sessionLength" class="pill"><option value="15">15 min</option><option value="30" selected>30 min</option><option value="45">45 min</option><option value="60">60 min</option></select></label><button class="primary" id="startSession" type="button">begin</button></div></section>`;
}
function attachSessionControls(){let start=$('#startSession');if(start)start.onclick=()=>{const page=$('#sessionActivity').value;const minutes=Number($('#sessionLength').value);quiet={page,until:Date.now()+minutes*60000};storage.set('quiet-session',quiet);go(page)};let end=$('#earlyEnd');if(end)end.onclick=requestEarlyEnd;let hd=$('#sessionClock');if(hd)hd.textContent=sessionRemaining()}
function requestEarlyEnd(){if(!activeQuiet())return;const existing=$('#quietExitDialog');if(existing){existing.remove();return}const mask=document.createElement('div');mask.id='quietExitDialog';mask.className='session-modal';mask.innerHTML=`<div class="session-dialog" role="dialog" aria-modal="true" aria-labelledby="sessionDialogTitle"><h2 id="sessionDialogTitle">leave this quiet moment?</h2><p>you can leave at any time, with a brief pause before switching.</p><p id="exitCountdown" aria-live="polite">you can end the session in 8 seconds.</p><div class="controls"><button class="pill" id="stayQuiet">stay here</button><button class="primary" id="confirmQuietExit" disabled>finish early</button></div></div>`;document.body.append(mask);$('#stayQuiet').onclick=()=>mask.remove();const until=Date.now()+8000;function step(){if(!mask.isConnected)return;let remaining=Math.ceil((until-Date.now())/1000),button=$('#confirmQuietExit');if(remaining<=0){$('#exitCountdown').textContent='you can leave whenever you choose.';button.disabled=false}else{$('#exitCountdown').textContent=`you can end the session in ${remaining} seconds.`;setTimeout(step,200)}}step();$('#confirmQuietExit').onclick=()=>{quiet=null;storage.set('quiet-session',null);mask.remove();go('home')};}
const tiles=[['sudoku','sudoku'],['minesweeper','minesweeper'],['murdoku','murdoku'],['nyt','nyt games'],['solitaire','solitaire'],['write','just write']];
// little drawings for the home tiles, built from simple shapes in the garden palette
const tileArt={
 sudoku:`<rect x="20" y="8" width="26" height="26" rx="6" fill="#d5a2b2"/><rect x="50" y="8" width="26" height="26" rx="6" fill="#ffffff14"/><rect x="80" y="8" width="26" height="26" rx="6" fill="#ffffff14"/><rect x="20" y="38" width="26" height="26" rx="6" fill="#ffffff14"/><rect x="50" y="38" width="26" height="26" rx="6" fill="#a9c29a"/><rect x="80" y="38" width="26" height="26" rx="6" fill="#ffffff14"/><rect x="20" y="68" width="26" height="26" rx="6" fill="#ffffff14"/><rect x="50" y="68" width="26" height="26" rx="6" fill="#ffffff14"/><rect x="80" y="68" width="26" height="26" rx="6" fill="#e3c27e"/>`,
 minesweeper:`<circle cx="30" cy="22" r="9" fill="#ffffff14"/><circle cx="58" cy="22" r="9" fill="#ffffff14"/><circle cx="86" cy="22" r="9" fill="#a9c29a"/><circle cx="30" cy="50" r="9" fill="#ffffff14"/><circle cx="58" cy="50" r="16" fill="#d5a2b2"/><circle cx="86" cy="50" r="9" fill="#ffffff14"/><circle cx="30" cy="78" r="9" fill="#e3c27e"/><circle cx="58" cy="78" r="9" fill="#ffffff14"/><circle cx="86" cy="78" r="9" fill="#ffffff14"/>`,
 murdoku:`<circle cx="52" cy="50" r="32" fill="#ffffff14"/><circle cx="74" cy="40" r="24" fill="#d5a2b2" fill-opacity=".85"/><circle cx="44" cy="62" r="14" fill="#e3c27e"/><circle cx="96" cy="78" r="6" fill="#a9c29a"/>`,
 nyt:`<rect x="18" y="10" width="40" height="40" rx="8" fill="#efe6cf"/><rect x="62" y="10" width="40" height="40" rx="8" fill="#ffffff14"/><rect x="18" y="54" width="40" height="40" rx="8" fill="#ffffff14"/><rect x="62" y="54" width="40" height="40" rx="8" fill="#a9c29a"/><circle cx="82" cy="30" r="9" fill="#d5a2b2"/>`,
 solitaire:`<rect x="26" y="16" width="44" height="64" rx="8" fill="#a9c29a" transform="rotate(-14 48 48)"/><rect x="40" y="14" width="44" height="64" rx="8" fill="#e3c27e"/><rect x="54" y="16" width="44" height="64" rx="8" fill="#efe6cf" transform="rotate(14 76 48)"/><circle cx="80" cy="50" r="8" fill="#d5a2b2"/>`,
 write:`<path d="M14 28c14-12 26 12 40 0s26 12 40 0s14 6 14 6" fill="none" stroke="#efe6cf" stroke-width="7" stroke-linecap="round"/><path d="M14 52c14-12 26 12 40 0s26 12 40 0" fill="none" stroke="#a9c29a" stroke-width="7" stroke-linecap="round"/><path d="M14 76c14-12 26 12 40 0" fill="none" stroke="#d5a2b2" stroke-width="7" stroke-linecap="round"/><circle cx="72" cy="76" r="5" fill="#e3c27e"/>`
};
function go(page='home'){if(activeQuiet()&&page!==quiet.page){requestEarlyEnd();return}history.replaceState(null,'','#'+page);render(page)}
function render(page=(location.hash.slice(1).split('?')[0]||'home')){
 if(activeQuiet()&&page!==quiet.page){history.replaceState(null,'','#'+quiet.page);page=quiet.page}
 document.body.classList.remove('home-page');
 if(page==='home')home();
 else if(page==='sudoku')drawSudoku();
 else if(page==='solitaire')drawSolitaire();
 else if(page==='minesweeper')drawMinesweeper();
 else if(page==='write')drawWrite();
 else if(page==='murdoku'||page==='nyt')external(page);
 else home();
 if(activeQuiet())app.insertAdjacentHTML('afterbegin',sessionPanel());
 attachSessionControls();scrollTo({top:0,behavior:'instant'});
}
function home(){
 document.body.classList.add('home-page');
 app.innerHTML=`<h1 class="home-title">quiet time</h1><section class="tiles">${tiles.map(([id,n])=>`<button class="tile tile-${id}" data-page="${id}" type="button"><svg class="tile-art" viewBox="0 0 120 100" aria-hidden="true">${tileArt[id]}</svg><span class="name">${n}</span></button>`).join('')}</section>${sessionPanel()}`;
 app.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{
   if(b.dataset.page==='nyt'||b.dataset.page==='murdoku'){
     const target=b.dataset.page==='nyt'?links[1][1]:links[0][1];
     window.open(target,'_blank','noopener,noreferrer');
   }else go(b.dataset.page);
 });
 attachSessionControls();
}
function layout(title,subtitle,content){
 app.innerHTML=`<section class="view"><button class="back" id="back">home</button><div class="viewhead"><h2>${title.toLowerCase()}</h2></div>${content}</section>`;
 $('#back').onclick=()=>go('home');
}
function external(page){
 const destination=page==='nyt'?links[1]:links[0];
 layout(destination[0],'',`<div class="external-single"><a class="primary external-link" href="${destination[1]}" target="_blank" rel="noopener noreferrer">open ${destination[0]}</a></div>`);
}
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
// Klondike Solitaire: draw-one, click to select movable tableau runs, waste cards and foundations.
let sol=null;const suits=['♠','♥','♣','♦'];const red=s=>s==='♥'||s==='♦';const color=c=>red(c.suit)?'red':'black';function deck(){return suits.flatMap(suit=>Array.from({length:13},(_,i)=>({suit,rank:i+1,up:false,id:suit+(i+1)})))}
function newSol(){let d=shuffle(deck()),cols=Array.from({length:7},()=>[]);for(let i=0;i<7;i++)for(let j=0;j<=i;j++){let c=d.pop();c.up=j===i;cols[i].push(c)}sol={cols,stock:d,waste:[],found:[[],[],[],[]],selected:null,moves:0,message:''};saveSol()}
function saveSol(){storage.set('solitaire',sol)}
function cardLabel(c){return 'a23456789jqk'[c.rank-1]||'10'}function rankText(r){return r===1?'A':r===11?'J':r===12?'Q':r===13?'K':String(r)}
function cardHTML(c,loc,index=0,offset=0){if(!c)return '';return `<div class="card ${c.up?(red(c.suit)?'red':''):'down'} ${sol.selected&&sol.selected.loc===loc&&index>=sol.selected.index?'picked':''}" data-loc="${loc}" data-index="${index}" style="top:${offset}px" aria-label="${c.up?rankText(c.rank)+' of '+c.suit:'face down'}">${c.up?`<span class="idx tl">${rankText(c.rank)}<span>${c.suit}</span></span><span class="pip${c.rank>10||c.rank===1?' face':''}">${c.rank>10?rankText(c.rank)+c.suit:c.suit}</span><span class="idx br">${rankText(c.rank)}<span>${c.suit}</span></span>`:''}</div>`}
function drawSolitaire(){sol=storage.get('solitaire');if(!sol)newSol();layout('solitaire','',`<div class="controls" style="margin-bottom:15px"><button class="pill" id="newSol">new game</button><button class="pill" id="undoSol">undo move</button><span class="tag" id="moveCount"></span></div><section class="sol-wrap"><div class="sol-top"><div class="sol-slot"><div class="sol-pile" id="stock" aria-label="stock"></div><div class="sol-pile" id="waste" data-drop="waste"></div></div><div class="sol-slot" id="foundations"></div></div><div class="sol-table" id="columns"></div><div class="sol-info" id="solInfo" aria-live="polite"></div></section>`);$('.sol-wrap').onpointerdown=solDragStart;$('.sol-wrap').addEventListener('click',e=>{if(solJustDragged){e.stopPropagation();solJustDragged=false}},true);$('#newSol').onclick=()=>{if(confirm('start a new game?')){newSol();updateSol()}};$('#undoSol').onclick=()=>{const prev=storage.get('sol-undo');if(prev){sol=prev;saveSol();updateSol();storage.set('sol-undo',null)}};updateSol()}
function updateSol(){if(!$('#columns'))return;$('#stock').innerHTML=sol.stock.length?`<div class="card down"></div>`:sol.waste.length?'↻':'';$('#waste').innerHTML=sol.waste.length?cardHTML(sol.waste.at(-1),'waste',sol.waste.length-1):'';$('#foundations').innerHTML=sol.found.map((f,i)=>`<div class="sol-pile" data-drop="f${i}">${f.length?cardHTML(f.at(-1),'f'+i,f.length-1):`<span class="empty">A</span>`}</div>`).join('');$('#columns').innerHTML=sol.cols.map((col,i)=>`<div class="sol-col" data-drop="t${i}">${col.map((c,j)=>cardHTML(c,'t'+i,j,j*25)).join('')}</div>`).join('');$('#moveCount').textContent=sol.moves+' moves';$('#solInfo').textContent=sol.message;$('#stock').onclick=()=>{rememberSol();if(sol.stock.length){let c=sol.stock.pop();c.up=true;sol.waste.push(c)}else if(sol.waste.length){sol.stock=sol.waste.reverse().map(c=>({...c,up:false}));sol.waste=[]}sol.selected=null;sol.moves++;saveSol();updateSol()};$('#waste').onclick=e=>selectSol('waste',sol.waste.length-1);$('#foundations').onclick=e=>{let p=e.target.closest('[data-drop]');if(p)clickSol(p.dataset.drop)};$('#columns').onclick=e=>{let c=e.target.closest('.card'),p=e.target.closest('[data-drop]');if(!p)return;if(sol.selected){clickSol(p.dataset.drop);return}if(c)selectSol(p.dataset.drop,+c.dataset.index);else clickSol(p.dataset.drop)}}
function selectSol(loc,index){let cards=getPile(loc);if(!cards||!cards[index]?.up)return;sol.selected={loc,index};sol.message='';saveSol();updateSol()}
function getPile(loc){return loc==='waste'?sol.waste:loc[0]==='t'?sol.cols[+loc.slice(1)]:loc[0]==='f'?sol.found[+loc.slice(1)]:null}
function rememberSol(){storage.set('sol-undo',structuredClone(sol))}
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
function clickSol(dest){if(!sol.selected){let pile=getPile(dest);if(pile?.length&&pile.at(-1).up)selectSol(dest,pile.length-1);return}let {loc,index}=sol.selected;if(loc===dest){sol.selected=null;saveSol();updateSol();return}let src=getPile(loc),dst=getPile(dest),moving=src.slice(index);if(!moving.length)return;let valid=false;if(dest[0]==='t'){valid=(!dst.length&&moving[0].rank===13)||(dst.length&&dst.at(-1).up&&dst.at(-1).rank===moving[0].rank+1&&color(dst.at(-1))!==color(moving[0]))}else if(dest[0]==='f'&&moving.length===1){valid=(!dst.length&&moving[0].rank===1)||(dst.length&&dst.at(-1).suit===moving[0].suit&&dst.at(-1).rank+1===moving[0].rank)}if(valid){rememberSol();dst.push(...src.splice(index));if(loc[0]==='t'&&src.length)src.at(-1).up=true;sol.moves++;sol.message=sol.found.every(f=>f.length===13)?'you won! a lovely little victory.':'a lovely move.'}else sol.message='that move does not fit just yet.';sol.selected=null;saveSol();updateSol()}

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
