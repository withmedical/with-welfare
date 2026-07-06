const SUPABASE_URL="https://eqromjnhqkecmpkherjb.supabase.co/rest/v1/";
const SUPABASE_KEY="sb_publishable_trTC1dyramnwWtd4XV9eqw_zRWEAY47";
const supabase=window.supabase?window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY):null;
const app=document.getElementById("app");
const today=new Date().toISOString().slice(0,10);
const adminAccount={id:"admin", name:"김경진", role:"admin", loginId:"with1905", password:"withm*1905", dept:"관리자"};

const seed={
  settings:{bankName:"국민은행", bankAccount:"123456-01-789012", bankHolder:"주식회사 위드메디컬", nightlyPrice:270000, friendDiscountRate:50, annualNightLimit:10},
  rooms:[
    {id:"stella", name:"스텔라동", basePeople:5, maxPeople:8, address:"제주특별자치도 서귀포시 안덕면 사계북로41번길 27-45, 사계펜션"},
    {id:"solar", name:"솔라동", basePeople:5, maxPeople:8, address:"제주특별자치도 서귀포시 안덕면 사계북로41번길 27-45, 사계펜션"}
  ]
};

let dbUsers=[];
let dbReservations=[];
let session=JSON.parse(localStorage.getItem("with_session_v2")||"null");
let page="home", loginTab="user", adminTab="reservations", calDate=new Date();

// Supabase 실시간 동기화 함수
async function syncFromDB(){
  if(!supabase) return;
  const {data: uData}=await supabase.from("users").select("*");
  const {data: rData}=await supabase.from("reservations").select("*");
  if(uData) dbUsers=uData;
  if(rData) dbReservations=rData;
}

function money(n){return Number(n||0).toLocaleString()+"원";}
function toast(msg){const t=document.createElement("div");t.className="toast";t.innerText=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2300);}
function user(){if(!session)return null;if(session.role==="admin")return adminAccount;return dbUsers.find(u=>u.id===session.id);}
async function setPage(p){page=p; await syncFromDB(); render(); scrollTo(0,0);}
function logout(){session=null;localStorage.removeItem("with_session_v2");render();}

// 로그인 연동
async function loginUser(e){
  e.preventDefault();
  await syncFromDB();
  const f=new FormData(e.target);
  const u=dbUsers.find(x=>x.name===f.get("name")&&x.phone===f.get("phone")&&x.password===f.get("password"));
  if(!u)return toast("로그인 정보가 일치하지 않습니다.");
  if(u.status!=="가입승인")return toast("관리자 가입 승인 후 로그인 가능합니다.");
  session={id:u.id,role:"user"};
  localStorage.setItem("with_session_v2",JSON.stringify(session));
  render();
}

function loginAdmin(e){
  e.preventDefault();
  const f=new FormData(e.target);
  if(f.get("id")!==adminAccount.loginId||f.get("password")!==adminAccount.password)return toast("관리자 ID 또는 비밀번호가 일치하지 않습니다.");
  session={id:"admin",role:"admin"};
  localStorage.setItem("with_session_v2",JSON.stringify(session));
  render();
}

// 회원가입 - Supabase 연동 (오타 수정 및 구조 동기화)
async function signup(e){
  e.preventDefault();
  if(!supabase) return toast("데이터베이스 연결 실패");
  await syncFromDB();
  const f=new FormData(e.target);
  const phone=f.get("phone"), empNo=f.get("empNo");
  
  if(dbUsers.some(u=>u.phone===phone||u.empNo===empNo))return toast("이미 등록된 전화번호 또는 사원번호입니다.");
  
  const {error}=await supabase.from("users").insert([{
    name:f.get("name"),
    empNo,
    birth:f.get("birth"),
    phone,
    password:f.get("password"),
    role:"user",
    dept:f.get("dept")||"",
    status:"가입대기"
  }]);

  if(error) return toast("가입 실패: "+error.message);
  
  toast("회원가입 신청 완료. 관리자 승인 후 로그인 가능합니다.");
  loginTab="user";
  await syncFromDB();
  render();
}

function loginView(){app.innerHTML=`<div class="loginbox panel"><div class="brand"><div class="logo">W</div><div><b>WITH Welfare Mall</b><small>회원 승인형 복지몰</small></div></div><h1>복지몰 로그인</h1><div class="tabs"><button class="${loginTab==='user'?'active':''}" onclick="loginTab='user';render()">직원 로그인</button><button class="${loginTab==='signup'?'active':''}" onclick="loginTab='signup';render()">회원가입</button><button class="${loginTab==='admin'?'active':''}" onclick="loginTab='admin';render()">관리자</button></div>${loginTab==='user'?`<form class="form" onsubmit="loginUser(event)"><label class="wide">이름<input name="name" required></label><label class="wide">전화번호<input name="phone" placeholder="010-0000-0000" required></label><label class="wide">비밀번호<input type="password" name="password" required></label><button class="wide">직원 로그인</button></form>`:""}${loginTab==='signup'?`<form class="form" onsubmit="signup(event)"><label>이름<input name="name" required></label><label>사원번호<input name="empNo" required></label><label>생년월일<input type="date" name="birth" required></label><label>전화번호<input name="phone" required></label><label>부서<input name="dept"></label><label>비밀번호<input type="password" name="password" required></label><button class="wide">회원가입 신청</button></form>`:""}${loginTab==='admin'?`<form class="form" onsubmit="loginAdmin(event)"><label class="wide">관리자 ID<input name="id" value="with1905" required></label><label class="wide">비밀번호<input type="password" name="password" required></label><button class="wide">관리자 로그인</button></form>`:""}</div>`;}

function layout(content){const u=user(); if(!u) return ""; return `<div class="top"><div class="topin"><div class="brand"><div class="logo">W</div><div><b>WITH Welfare Mall</b><small>${u.name} · ${u.role==="admin"?"관리자":"임직원"}</small></div></div><div class="nav">${["home:홈","stay:숙소예약","notice:공지"].map(x=>{const[k,v]=x.split(":");return`<button class="${page===k?'active':''}" onclick="setPage('${k}')">${v}</button>`}).join("")}${u.role==="admin"?`<button class="${page==='admin'?'active':''}" onclick="setPage('admin')">관리자</button>`:""}<button class="gray" onclick="logout()">로그아웃</button></div></div></div><div class="wrap">${content}</div><div class="footer">WITH Welfare Mall · 제주 사계펜션 복지몰</div>`;}

function calcNights(a,b){return Math.max(0,Math.round((new Date(b)-new Date(a))/(1000*60*60*24)));}
function annualUsedNights(userId, year=2026){return dbReservations.filter(r=>r.user_id===userId&&r.status!=="반려"&&r.status!=="취소"&&String(r.checkin).slice(0,4)==String(year)).reduce((s,r)=>s+calcNights(r.checkin,r.checkout),0);}
function overlaps(aStart,aEnd,bStart,bEnd){return aStart<bEnd&&bStart<aEnd;}
function isRoomAvailable(roomId,checkin,checkout){return !dbReservations.some(r=>r.room===roomId&&r.status!=="취소"&&r.status!=="반려"&&overlaps(checkin,checkout,r.checkin,r.checkout));}

function home(){const u=user();return layout(`<section class="hero"><div><span class="badge">Company Welfare Platform</span><h1>회원 승인형 회사 복지몰</h1><p class="muted">Supabase 클라우드 데이터베이스와 안전하게 연동되어 창을 닫아도 정보가 유지됩니다.</p><button onclick="setPage('stay')">숙소 예약하기</button></div><div class="panel"><b>${u.name}님</b><p class="muted">${u.role==="admin"?"관리자":"임직원"} 계정</p><div class="grid2"><div><span class="muted">연간 사용 박수</span><div class="kpi">${u.role==="admin"?"-":annualUsedNights(u.id)}</div></div><div><span class="muted">연간 기준</span><div class="kpi">${seed.settings.annualNightLimit}박</div></div></div></div></section>`);}

function stay(){const u=user(); const used=u.role==="admin"?0:annualUsedNights(u.id);return layout(`<section class="section"><h2>제주 사계펜션 숙소 예약</h2><div class="grid2">${seed.rooms.map(r=>`<div class="card room-card"><div class="room-img ${r.id}">${r.name}</div><div class="room-body"><h3>${r.name}</h3><p class="muted">기본 ${r.basePeople}명 · 최대 ${r.maxPeople}명</p><button onclick="showReserve('${r.id}')">예약 신청</button></div></div>`).join("")}</div></section><section class="section panel"><div class="cal-head"><h2>예약 현황 캘린더</h2><div><button class="secondary" onclick="moveMonth(-1)">이전</button> <b>${calDate.getFullYear()}년 ${calDate.getMonth()+1}월</b> <button class="secondary" onclick="moveMonth(1)">다음</button></div></div>${calendar()}</section><section id="reserveForm" class="section"></section><section class="section"><h2>내 예약 현황</h2>${reservationTable(dbReservations.filter(r=>r.user_id===u.id),false)}</section>`);}
function moveMonth(n){calDate.setMonth(calDate.getMonth()+n);render();}
function calendar(){const y=calDate.getFullYear(),m=calDate.getMonth();const first=new Date(y,m,1);const start=new Date(y,m,1-first.getDay());let html=`<div class="calendar">${["일","월","화","수","목","금","토"].map(d=>`<div class="dow">${d}</div>`).join("")}`;for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const ds=d.toISOString().slice(0,10);const out=d.getMonth()!==m;const marks=[];dbReservations.filter(r=>r.status!=="취소"&&r.status!=="반려"&&ds>=r.checkin&&ds<r.checkout).forEach(r=>marks.push(`<span class="mark ${r.room}M">${r.room==='stella'?'스텔라':'솔라'} X</span>`));html+=`<div class="day ${out?'out':''}"><div class="daynum">${d.getDate()}</div>${marks.join("")}</div>`;}return html+"</div>";}

function showReserve(roomId){const r=seed.rooms.find(x=>x.id===roomId);document.getElementById("reserveForm").innerHTML=`<div class="panel"><h2>${r.name} 예약 신청</h2><form class="form" onsubmit="submitReservation(event,'${roomId}')"><label>체크인<input type="date" name="checkin" min="${today}" required></label><label>체크아웃<input type="date" name="checkout" min="${today}" required></label><label>상태 선택<select name="status"><option value="대기">대기</option><option value="승인">승인</option></select></label><div class="wide"><button>예약 신청 제출</button></div></form></div>`;document.getElementById("reserveForm").scrollIntoView({behavior:"smooth"});}

// 예약 제출 - Supabase 구조 동기화 (user_id, room 등)
async function submitReservation(e,roomId){
  e.preventDefault();
  if(!supabase) return;
  const f=new FormData(e.target);
  const checkin=f.get("checkin"),checkout=f.get("checkout");
  const nights=calcNights(checkin,checkout);
  
  if(nights<=0)return toast("체크아웃은 체크인 이후 날짜여야 합니다.");
  if(!isRoomAvailable(roomId,checkin,checkout))return toast("해당 기간은 이미 예약되어 있습니다.");

  const {error}=await supabase.from("reservations").insert([{
    user_id:user().id,
    room:roomId,
    checkin,
    checkout,
    status:f.get("status")||"대기"
  }]);

  if(error) return toast("예약 실패: "+error.message);
  toast("예약 신청이 완료되었습니다.");
  await syncFromDB();
  setPage("stay");
}

function reservationTable(rows,admin){if(!rows.length)return`<div class="panel empty">예약 내역이 없습니다.</div>`;return`<table class="table"><thead><tr><th>숙소</th><th>기간</th><th>상태</th><th>관리</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.room==='stella'?'스텔라동':'솔라동'}</td><td>${r.checkin} ~ ${r.checkout}</td><td><span class="status ${r.status}">${r.status}</span></td><td>${admin?adminButtons(r.id,r.status):userCancelButton(r.id,r.status)}</td></tr>`).join("")}</tbody></table>`;}
function userCancelButton(id,status){return status==="대기"||status==="승인"?`<button class="danger" onclick="userCancel('${id}')">취소</button>`:"-";}
async function userCancel(id){await supabase.from("reservations").update({status:"취소"}).eq("id",id); await syncFromDB(); toast("취소되었습니다."); render();}
function adminButtons(id,status){if(status!=="대기")return"-";return`<button onclick="setStatus('${id}','승인')">승인</button><button class="danger" onclick="setStatus('${id}','반려')">반려</button>`;}
async function setStatus(id,status){await supabase.from("reservations").update({status:status}).eq("id",id); await syncFromDB(); toast(`${status} 처리 완료`); render();}

function notice(){return layout(`<section class="section"><h2>공지사항</h2><div class="panel"><b>[안내] Supabase 클라우드 데이터베이스 전용 버전</b><p class="muted">이제 브라우저를 종료하셔도 임직원 가입 정보와 예약 달력이 완벽히 영구 저장됩니다.</p></div></section>`);}

// 관리자 화면 연동
function admin(){
  let body="";
  if(adminTab==="reservations") body=reservationTable(dbReservations,true);
  if(adminTab==="users") body=userAdmin();
  return layout(`<section class="section"><h2>관리자 페이지</h2><div class="admin-tabs"><button class="${adminTab==='reservations'?'active':''}" onclick="adminTab='reservations';render()">숙소 예약 관리</button><button class="${adminTab==='users'?'active':''}" onclick="adminTab='users';render()">회원 승인 관리</button></div>${body}</section>`);}

function userAdmin(){return`<table class="table"><thead><tr><th>이름</th><th>사원번호</th><th>전화번호</th><th>부서</th><th>상태</th><th>관리</th></tr></thead><tbody>${dbUsers.map(u=>`<tr><td>${u.name}</td><td>${u.empNo}</td><td>${u.phone}</td><td>${u.dept||""}</td><td><span class="status ${u.status}">${u.status}</span></td><td class="actions">${u.status==="가입대기"?`<button onclick="setUserStatus('${u.id}','가입승인')">승인</button><button class="danger" onclick="setUserStatus('${u.id}','가입반려')">반려</button>`:"-"}</td></tr>`).join("")}</tbody></table>`;}
async function setUserStatus(id,status){await supabase.from("users").update({status:status}).eq("id",id); await syncFromDB(); toast(status+" 처리 완료"); render();}

async function init(){await syncFromDB(); render();}
function render(){if(!session)return loginView(); if(page==="home")app.innerHTML=home(); if(page==="stay")app.innerHTML=stay(); if(page==="notice")app.innerHTML=notice(); if(page==="admin")app.innerHTML=admin();}

init();
