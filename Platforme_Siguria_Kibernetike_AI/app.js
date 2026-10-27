const lessons = [
  {id:1,title:"Fjalëkalime të sigurta",icon:"⌑",time:"5 min",level:"Fillestar",short:"Krijo fjalëkalime të forta dhe unike.",body:"Fjalëkalimi është një nga shtresat e para të mbrojtjes së llogarisë. Përdor fjalëkalime të gjata dhe unike, pa e ripërdorur të njëjtin në faqe të ndryshme.",points:["Përdor fraza të gjata që është e vështirë të hamendësohen.","Mos përdor emrin, datëlindjen ose fjalë të zakonshme.","Përdor menaxher fjalëkalimesh për t’i ruajtur në mënyrë të sigurt.","Aktivizo verifikimin me shumë faktorë (MFA) kur ofrohet."]},
  {id:2,title:"Phishing dhe mashtrimet",icon:"✉",time:"7 min",level:"Fillestar",short:"Dallo mesazhet dhe lidhjet e dyshimta.",body:"Phishing-u është përpjekje për të mashtruar dikë që të zbulojë të dhëna, të hapë një skedar ose të kryejë një veprim. Mesazhet shpesh krijojnë urgjencë ose imitojnë organizata të njohura.",points:["Kontrollo adresën e dërguesit dhe domenin e faqes.","Mos hap bashkëngjitje të papritura.","Mos dërgo fjalëkalime ose kode verifikimi në përgjigje të një mesazhi.","Nëse ke dyshime, kontakto organizatën përmes faqes së saj zyrtare."]},
  {id:3,title:"Privatësia në internet",icon:"◇",time:"6 min",level:"Fillestar",short:"Kontrollo informacionin që ndan online.",body:"Informacioni i publikuar online mund të kopjohet dhe të shpërndahet më tej. Cilësimet e privatësisë ndihmojnë në kufizimin e asaj që shohin të tjerët, por nuk e zëvendësojnë kujdesin.",points:["Publiko vetëm informacionin që je rehat ta bësh publik.","Kontrollo lejet e aplikacioneve dhe cilësimet e profilit.","Mos publiko dokumente, adresa ose të dhëna personale pa arsye.","Përdor Wi-Fi publik me kujdes, sidomos për veprime të ndjeshme."]},
  {id:4,title:"Malware dhe përditësimet",icon:"↻",time:"8 min",level:"Mesatar",short:"Kupto programet keqdashëse dhe si të mbrohesh.",body:"Malware është softuer i krijuar për të dëmtuar pajisjet, për të vjedhur të dhëna ose për të fituar qasje pa leje. Përditësimet mbyllin dobësi dhe ulin rrezikun e shfrytëzimit të tyre.",points:["Instalo programe nga burime zyrtare.","Mbaj sistemin dhe aplikacionet të përditësuara.","Mos çaktivizo mbrojtjen për të instaluar skedarë të panjohur.","Mbaj kopje rezervë të skedarëve të rëndësishëm."]},
  {id:5,title:"Verifikimi me shumë faktorë",icon:"✓",time:"4 min",level:"Fillestar",short:"Shto një shtresë tjetër mbrojtjeje për llogaritë.",body:"MFA kërkon dy ose më shumë mënyra verifikimi. Nëse dikush mëson fjalëkalimin, faktori shtesë mund ta vështirësojë hyrjen e paautorizuar.",points:["Aktivizo MFA për email-in dhe llogaritë kryesore.","Mos ia trego askujt kodet njëpërdorimëshe.","Ruaj kodet rezervë në një vend të sigurt.","Refuzo kërkesat e hyrjes që nuk i ke nisur vetë."]}
];

const quizQuestions = [
  {q:"Cila është praktika më e mirë për fjalëkalimet?",a:["Përdor të njëjtin fjalëkalim kudo","Përdor fjalëkalime të gjata dhe unike","Përdor vetëm datëlindjen","Ndaje fjalëkalimin me shokun"],correct:1,why:"Fjalëkalimet e gjata dhe unike kufizojnë dëmin nëse një llogari komprometohet."},
  {q:"Çfarë duhet të bësh kur merr një email të papritur që kërkon hyrje urgjente në llogari?",a:["Kliko menjëherë lidhjen","Dërgo kodin e verifikimit","Kontrollo dërguesin dhe hap faqen zyrtare veçmas","Përgjigju me fjalëkalimin"],correct:2,why:"Urgjenca dhe kërkesat për të dhëna mund të jenë shenja phishing-u. Verifiko përmes kanaleve zyrtare."},
  {q:"Çfarë është MFA?",a:["Një lloj virusi","Një shtresë shtesë verifikimi","Një kopje rezervë","Një shfletues interneti"],correct:1,why:"Autentifikimi me shumë faktorë kërkon më shumë se një faktor për të verifikuar identitetin."},
  {q:"Pse janë të rëndësishme përditësimet e sistemit?",a:["E bëjnë fjalëkalimin publik","Mbyllin dobësi të njohura dhe përmirësojnë sigurinë","Heqin nevojën për kopje rezervë","E bëjnë çdo email të sigurt"],correct:1,why:"Përditësimet shpesh përfshijnë rregullime sigurie për dobësitë e njohura."},
  {q:"Çfarë duhet të bësh me një bashkëngjitje të papritur nga një dërgues i panjohur?",a:["Hape për të parë çfarë ka","Dërgoja të gjitha kontakteve","Mos e hap pa verifikuar dërguesin dhe përmbajtjen","Çaktivizo antivirusin"],correct:2,why:"Bashkëngjitjet e dyshimta mund të përmbajnë malware. Verifiko para se t’i hapësh."}
];

const titles={dashboard:"Përshëndetje, mirë se erdhe!",lessons:"Mësimet e tua",quiz:"Kuizi i sigurisë",assistant:"Pyet mentoren",safety:"Këshilla sigurie"};
function readProgress(key,fallback){try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback}catch{return fallback}}
let activeUser=readProgress("cyberedu_session",null);
const progressPrefix=()=>`cyberedu_profile_${activeUser?.email||"guest"}_`;
let completed=readProgress(progressPrefix()+"completed",[]);if(!Array.isArray(completed))completed=[];
let totalScore=Number(readProgress(progressPrefix()+"score",0))||0,currentQuestion=0,quizScore=0,answered=false;

function updateDashboard(){
  const nextLesson=lessons.find(lesson=>!completed.includes(lesson.id));
  const continueLabel=document.getElementById("continue-label");
  if(continueLabel)continueLabel.textContent=nextLesson?`Vazhdo me: ${nextLesson.title}`:"I përfundove të gjitha mësimet! Rilexoji";
  document.getElementById("completed-count").textContent=completed.length;
  document.getElementById("score-count").textContent=totalScore;
  document.getElementById("level-count").textContent=completed.length>=4?"I avancuar":completed.length>=2?"Në zhvillim":"Fillestar";
  const pct=Math.round(completed.length/lessons.length*100);
  document.getElementById("progress-percent").textContent=pct+"%";
  document.getElementById("progress-bar").style.width=pct+"%";
  document.getElementById("progress-label").textContent=`${completed.length} nga ${lessons.length} mësime të përfunduara`;
}
function saveProgress(){try{localStorage.setItem(progressPrefix()+"completed",JSON.stringify(completed));localStorage.setItem(progressPrefix()+"score",String(totalScore))}catch{}updateDashboard()}
function lessonCard(lesson){const done=completed.includes(lesson.id);return `<article class="lesson-card" data-lesson="${lesson.id}" tabindex="0" role="button" aria-label="Hap mësimin: ${lesson.title}"><div class="lesson-icon">${lesson.icon}</div><h3>${lesson.title}${done?" ✓":""}</h3><p>${lesson.short}</p><div class="lesson-meta"><span>◷ ${lesson.time} lexim</span><span class="tag ${done?"done":""}">${done?"Përfunduar":lesson.level}</span></div></article>`}
function renderLessons(){
  const suggested=[...lessons.filter(lesson=>!completed.includes(lesson.id)),...lessons.filter(lesson=>completed.includes(lesson.id))];
  document.getElementById("featured-lessons").innerHTML=suggested.slice(0,3).map(lessonCard).join("");
  document.getElementById("all-lessons").innerHTML=lessons.map(lessonCard).join("");
  document.querySelectorAll("[data-lesson]").forEach(card=>{const open=()=>{if(card.closest("#featured-lessons"))showView("lessons");openLesson(Number(card.dataset.lesson))};card.addEventListener("click",open);card.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();open()}})});
}
function openLesson(id){
  const lesson=lessons.find(item=>item.id===id);if(!lesson)return;
  const detail=document.getElementById("lesson-detail");detail.classList.remove("hidden");
  detail.innerHTML=`<div class="lesson-detail-top"><span class="section-kicker">MËSIMI · ${lesson.time.toUpperCase()}</span><button class="detail-close" type="button" aria-label="Mbyll mësimin">Mbyll <span aria-hidden="true">×</span></button></div><h2>${lesson.icon} ${lesson.title}</h2><p>${lesson.body}</p><h3>Pikat kryesore</h3><ul>${lesson.points.map(point=>`<li>${point}</li>`).join("")}</ul><button class="primary-btn" id="mark-complete">${completed.includes(id)?"Mësimi u përfundua ✓":"E lexova, shënoje si të përfunduar"}</button>`;
  detail.querySelector(".detail-close").addEventListener("click",()=>detail.classList.add("hidden"));
  document.getElementById("mark-complete").addEventListener("click",()=>{if(!completed.includes(id)){completed.push(id);saveProgress();renderLessons();openLesson(id)}});
  detail.scrollIntoView({behavior:"smooth",block:"start"});
}
function showView(name){
  if(!titles[name])return;
  document.querySelectorAll(".view").forEach(view=>view.classList.toggle("active",view.id===name));
  document.querySelectorAll(".nav-link").forEach(button=>{const active=button.dataset.view===name;button.classList.toggle("active",active);if(active)button.setAttribute("aria-current","page");else button.removeAttribute("aria-current")});
  document.getElementById("page-title").textContent=titles[name];
  if(name!=="lessons")document.getElementById("lesson-detail").classList.add("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll("[data-view]").forEach(button=>button.addEventListener("click",()=>showView(button.dataset.view)));
document.querySelectorAll("[data-go]").forEach(button=>button.addEventListener("click",()=>showView(button.dataset.go)));

function startQuiz(){currentQuestion=0;quizScore=0;renderQuestion()}
function renderQuestion(){
  const box=document.getElementById("quiz-container");
  if(currentQuestion>=quizQuestions.length){totalScore+=quizScore;saveProgress();box.innerHTML=`<div class="quiz-start"><div class="quiz-big-icon">★</div><h2>Kuizi përfundoi!</h2><p>Rezultati yt: <b>${quizScore} / ${quizQuestions.length}</b>. ${quizScore>=4?"Shkëlqyeshëm! Vazhdo kështu.":"Vazhdo të mësosh dhe provo përsëri."}</p><button class="primary-btn" id="restart-quiz">Provo përsëri <span>↻</span></button></div>`;document.getElementById("restart-quiz").onclick=startQuiz;return}
  answered=false;const question=quizQuestions[currentQuestion];
  const progress=((currentQuestion+1)/quizQuestions.length)*100;
  box.innerHTML=`<div class="question-top"><span>Pyetja ${currentQuestion+1} nga ${quizQuestions.length}</span><span>Pikët: ${quizScore}</span></div><div class="quiz-progress" role="progressbar" aria-label="Përparimi i kuizit" aria-valuemin="0" aria-valuemax="${quizQuestions.length}" aria-valuenow="${currentQuestion+1}"><span style="width:${progress}%"></span></div><h3>${question.q}</h3><p class="answer-hint">Zgjidh përgjigjen që të duket më e saktë.</p><div class="answers">${question.a.map((answer,index)=>`<button class="answer-btn" data-answer="${index}">${String.fromCharCode(65+index)}. ${answer}</button>`).join("")}</div><div id="explanation-slot" aria-live="polite"></div><div class="quiz-actions"><button class="primary-btn hidden" id="next-question">${currentQuestion===quizQuestions.length-1?"Shiko rezultatin":"Vazhdo te pyetja tjetër →"}</button></div>`;
  box.querySelectorAll("[data-answer]").forEach(button=>button.onclick=()=>chooseAnswer(Number(button.dataset.answer)));
}
function chooseAnswer(index){
  if(answered)return;answered=true;const question=quizQuestions[currentQuestion];if(index===question.correct)quizScore++;
  document.querySelectorAll("[data-answer]").forEach((button,i)=>{button.disabled=true;if(i===question.correct)button.classList.add("correct");else if(i===index)button.classList.add("wrong")});
  document.getElementById("explanation-slot").innerHTML=`<div class="explanation"><b>${index===question.correct?"Saktë!":"Jo kësaj here."}</b> ${question.why}</div>`;
  const next=document.getElementById("next-question");next.classList.remove("hidden");next.onclick=()=>{currentQuestion++;renderQuestion()};
}
document.getElementById("start-quiz").onclick=startQuiz;

const answers=[
  {keys:["phishing","email i rrem","mesazh i dyshimt","lidhje e dyshimt"],text:"Phishing-u është mashtrim që synon të të bëjë të japësh të dhëna ose të hapësh përmbajtje të rrezikshme. Kontrollo dërguesin dhe domenin, mos vepro nën presion dhe hyr në llogari përmes faqes zyrtare."},
  {keys:["fjalëkalim","fjalekalim","password"],text:"Përdor një fjalëkalim të gjatë dhe unik për secilën llogari. Një menaxher fjalëkalimesh mund të ndihmojë. Aktivizo MFA dhe mos i ndaj kodet e verifikimit."},
  {keys:["mfa","dy hapa","autentifikim","verifikim"],text:"MFA do të thotë autentifikim me shumë faktorë. Ai kërkon një faktor shtesë përveç fjalëkalimit, si një aplikacion autentifikimi ose çelës sigurie."},
  {keys:["malware","virus","ransomware"],text:"Malware është softuer keqdashës që mund të vjedhë të dhëna ose të dëmtojë pajisjen. Përditëso sistemin, instalo programe nga burime zyrtare dhe mos hap skedarë të dyshimtë."},
  {keys:["privatësi","privatesi","rrjete sociale","të dhëna personale"],text:"Kufizo informacionin personal që publikon, kontrollo cilësimet e privatësisë dhe lejet e aplikacioneve. Mbaj mend se çdo gjë e publikuar mund të kopjohet."},
  {keys:["mashtrim","siguri online","mbrohem"],text:"Për t’u mbrojtur: përdor fjalëkalime unike, aktivizo MFA, përditëso pajisjet, kontrollo lidhjet para se t’i hapësh dhe ruaj kopje rezervë të skedarëve."}
];
function assistantReply(question){
  const normalized=question.toLocaleLowerCase("sq").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  if(/kam klikuar|klikova|e hapa|u hakova|me vodhen|komprometuar/.test(normalized))return "Vepro shpejt, por pa panik: ndrysho fjalëkalimin nga faqja ose aplikacioni zyrtar, dil nga sesionet e tjera, aktivizo MFA dhe njofto shërbimin përkatës. Nëse përdore të njëjtin fjalëkalim diku tjetër, ndryshoje edhe atje.";
  const found=answers.find(answer=>answer.keys.some(key=>normalized.includes(key.normalize("NFD").replace(/[\u0300-\u036f]/g,""))));
  if(found)return found.text;
  if(/femije|prind|shkolle|nxenes|moshe/.test(normalized))return "Për fëmijët dhe nxënësit, nisni me rregulla të thjeshta: mos ndani fjalëkalime e kode, kërkoni ndihmë nga një i rritur kur diçka duket e çuditshme dhe mendoni para se të postoni të dhëna personale.";
  if(/pershendetje|tung|miremengjes|faleminderit/.test(normalized))return "Përshëndetje! Jam këtu për pyetje rreth fjalëkalimeve, mesazheve të dyshimta, privatësisë, MFA-së dhe pajisjeve. Çfarë po të shqetëson?";
  if(normalized.includes("cfare eshte")||normalized.includes("cfare do te thote"))return "Mund të të shpjegoj phishing-un, fjalëkalimet, MFA-në, malware-in ose privatësinë. Shkruaj një nga këto tema, ose zgjidh një sugjerim sipër.";
  return "Kjo është një demo mësimore me përgjigje të përgatitura, ndaj mund të mos kuptoj çdo pyetje. Provo të pyesësh për phishing-un, fjalëkalimet, MFA-në, privatësinë ose çfarë të bësh pasi ke hapur një lidhje të dyshimtë.";
}
function addMessage(text,who){const message=document.createElement("div");message.className="message "+who;message.textContent=text;const box=document.getElementById("chat-messages");box.appendChild(message);box.scrollTop=box.scrollHeight}
function sendQuestion(question){if(!question.trim())return;addMessage(question.trim(),"user");window.setTimeout(()=>addMessage(assistantReply(question),"assistant"),260)}
document.getElementById("chat-form").addEventListener("submit",event=>{event.preventDefault();const input=document.getElementById("chat-input");sendQuestion(input.value);input.value="";input.focus()});
document.querySelectorAll("[data-prompt]").forEach(button=>button.addEventListener("click",()=>sendQuestion(button.dataset.prompt)));

let authMode="login";
const authForm=document.getElementById("auth-form");
function setAuthMode(mode){
  authMode=mode;
  const registering=mode==="register";
  document.getElementById("name-field").classList.toggle("hidden",!registering);
  document.getElementById("auth-name").required=registering;
  document.getElementById("auth-password").autocomplete=registering?"new-password":"current-password";
  document.getElementById("auth-eyebrow").textContent=registering?"HAPË PROFILIN TËND":"MIRË SE U KTHEVE";
  document.getElementById("auth-title").textContent=registering?"Krijo profilin tënd":"Hyr në llogarinë tënde";
  document.getElementById("auth-subtitle").textContent=registering?"Ruaj përparimin dhe vazhdo kur të duash.":"Vazhdo rrugëtimin tënd drejt sigurisë digjitale.";
  document.getElementById("auth-submit-text").textContent=registering?"Krijo profilin":"Hyr në llogari";
  document.querySelectorAll("[data-auth-mode]").forEach(tab=>tab.classList.toggle("active",tab.dataset.authMode===mode));
  document.getElementById("auth-error").textContent="";
}
document.querySelectorAll("[data-auth-mode]").forEach(tab=>tab.addEventListener("click",()=>setAuthMode(tab.dataset.authMode)));
document.getElementById("toggle-password").addEventListener("click",event=>{
  const input=document.getElementById("auth-password"),button=event.currentTarget;
  const visible=input.type==="password";
  input.type=visible?"text":"password";
  button.textContent=visible?"Fsheh":"Shfaq";
  button.setAttribute("aria-label",visible?"Fsheh fjalëkalimin":"Shfaq fjalëkalimin");
  button.setAttribute("aria-pressed",String(visible));
});
async function hashPassword(password,salt){
  if(!globalThis.crypto?.subtle)throw new Error("Shfletuesi nuk e mbështet ruajtjen e sigurt të demonstrimit. Hape me Chrome ose Edge të përditësuar.");
  const data=new TextEncoder().encode(`${salt}:${password}`);
  const digest=await crypto.subtle.digest("SHA-256",data);
  return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("");
}
function getProfiles(){const profiles=readProgress("cyberedu_profiles",[]);return Array.isArray(profiles)?profiles:[]}
function startSession(profile){
  activeUser={name:profile.name,email:profile.email};
  try{localStorage.setItem("cyberedu_session",JSON.stringify(activeUser))}catch{}
  completed=readProgress(progressPrefix()+"completed",[]);if(!Array.isArray(completed))completed=[];
  totalScore=Number(readProgress(progressPrefix()+"score",0))||0;
  document.getElementById("profile-name").textContent=activeUser.name;
  document.getElementById("profile-avatar").textContent=(activeUser.name.trim()[0]||"S").toLocaleUpperCase("sq");
  document.getElementById("page-title").textContent=`Përshëndetje, ${activeUser.name.split(/\s+/)[0]}!`;
  document.body.classList.add("authenticated");
  renderLessons();updateDashboard();
}
authForm.addEventListener("submit",async event=>{
  event.preventDefault();
  const error=document.getElementById("auth-error");error.textContent="";
  const submit=authForm.querySelector("[type='submit']");
  const submitText=document.getElementById("auth-submit-text");
  submit.disabled=true;submitText.textContent=authMode==="register"?"Po krijohet profili…":"Po kontrollohet…";
  const email=document.getElementById("auth-email").value.trim().toLocaleLowerCase("en-US");
  const password=document.getElementById("auth-password").value;
  const profiles=getProfiles();
  try{
    if(authMode==="register"){
      const name=document.getElementById("auth-name").value.trim();
      if(profiles.some(profile=>profile.email===email)){error.textContent="Ky email ka profil. Zgjidh “Hyr” ose përdor një email tjetër.";return}
      const salt=Array.from(crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,"0")).join("");
      const profile={name,email,salt,passwordHash:await hashPassword(password,salt)};
      profiles.push(profile);localStorage.setItem("cyberedu_profiles",JSON.stringify(profiles));startSession(profile);
    }else{
      const profile=profiles.find(item=>item.email===email);
      if(!profile){error.textContent="Nuk u gjet profil me këtë email në këtë shfletues. Zgjidh “Krijo profil” nëse je përdorues/e e re.";return}
      if(await hashPassword(password,profile.salt)!==profile.passwordHash){error.textContent="Fjalëkalimi nuk përputhet. Provo përsëri.";return}
      startSession(profile);
    }
  }catch(cause){error.textContent=cause?.message||"Nuk mundëm ta hapim profilin. Provo përsëri."}
  finally{submit.disabled=false;submitText.textContent=authMode==="register"?"Krijo profilin":"Hyr në llogari"}
});
document.getElementById("logout-button").addEventListener("click",()=>{
  try{localStorage.removeItem("cyberedu_session")}catch{}
  activeUser=null;document.body.classList.remove("authenticated");
  document.getElementById("auth-form").reset();setAuthMode("login");
});
if(activeUser?.email){
  const savedProfile=getProfiles().find(profile=>profile.email===activeUser.email);
  if(savedProfile)startSession(savedProfile);else{activeUser=null;try{localStorage.removeItem("cyberedu_session")}catch{}}
}
renderLessons();updateDashboard();
