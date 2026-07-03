// app.js
const app = document.getElementById("app");
const today = new Date().toISOString().slice(0, 10);
const adminAccount = { id: "admin", name: "김경진", role: "admin", loginId: "with1905", password: "withm*1905", dept: "관리자" };

const seed = {
  users: [
    { id: "u1", name: "홍길동", empNo: "2026001", birth: "1990-01-01", phone: "010-1111-2222", password: "1234", role: "user", dept: "개발팀", status: "가입승인", createdAt: "2026-07-03" }
  ],
  settings: { bankName: "국민은행", bankAccount: "123456-01-789012", bankHolder: "주식회사 위드메디컬", nightlyPrice: 270000, friendDiscountRate: 50, annualNightLimit: 10 },
  rooms: [
    { id: "stella", name: "스텔라동", basePeople: 5, maxPeople: 8, address: "제주특별자치도 서귀포시 안덕면 사계북로41번길 27-45, 사계펜션" },
    { id: "solar", name: "솔라동", basePeople: 5, maxPeople: 8, address: "제주특별자치도 서귀포시 안덕면 사계북로41번길 27-45, 사계펜션" }
  ],
  reservations: [],
  condolences: [],
  events: [
    { id: 1, title: "하계 워크숍", date: "2026-07-19", limit: 40, memo: "전사 워크숍 참석 신청" },
    { id: 2, title: "가족 초청 행사", date: "2026-09-12", limit: 60, memo: "임직원 가족 초청 행사" }
  ],
  eventApplications: [],
  discounts: [
    { id: 1, category: "건강검진", title: "제휴 병원 건강검진", rate: "30% 할인", method: "임직원 확인 후 예약" },
    { id: 2, category: "리조트", title: "전국 제휴 리조트", rate: "임직원가", method: "복지몰 신청 후 예약코드 발급" },
    { id: 3, category: "렌터카", title: "제주 렌터카 제휴", rate: "최대 25% 할인", method: "제휴 링크 이용" },
    { id: 4, category: "쇼핑", title: "생활용품 특가몰", rate: "월별 특가", method: "임직원 인증 후 이용" }
  ],
  vacationSupport: [],
  notices: [
    { id: 1, title: "제주 사계펜션 예약 운영 안내", important: true, body: "스텔라동, 솔라동은 각각 기본 5인 기준입니다. 직원당 연간 10박 기준으로 운영합니다.", views: 0 },
    { id: 2, title: "지인 이용 시 50% 할인 금액 입금 안내", important: true, body: "지인 이용은 1박 270,000원 기준 50% 할인 금액을 회사 지정 계좌로 이체합니다.", views: 0 }
  ]
};

let state = load();
let session = JSON.parse(localStorage.getItem("with_session_v2") || "null");
let page = "home", loginTab = "user", adminTab = "reservations", calDate = new Date();

function load() {
  const s = localStorage.getItem("with_welfare_v2");
  if (s) {
    try {
      return JSON.parse(s);
    } catch (e) {
      console.error("데이터 파싱 에러, 기본 데이터로 복구합니다.", e);
    }
  }
  localStorage.setItem("with_welfare_v2", JSON.stringify(seed));
  return JSON.parse(JSON.stringify(seed));
}

function save() {
  localStorage.setItem("with_welfare_v2", JSON.stringify(state));
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function money(n) { return Number(n || 0).toLocaleString() + "원"; }
function toast(msg) { const t = document.createElement("div"); t.className = "toast"; t.innerText = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2300); }
function user() { if (!session) return null; if (session.role === "admin") return adminAccount; return state.users.find(u => u.id === session.id); }
function setPage(p) { page = p; render(); scrollTo(0, 0); }
function logout() { session = null; localStorage.removeItem("with_session_v2"); render(); }

function loginUser(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const u = state.users.find(x => x.name === f.get("name") && x.phone === f.get("phone") && x.password === f.get("password"));
  if (!u) return toast("로그인 정보가 일치하지 않습니다.");
  if (u.status !== "가입승인") return toast("관리자 가입 승인 후 로그인 가능합니다.");
  session = { id: u.id, role: "user" };
  localStorage.setItem("with_session_v2", JSON.stringify(session));
  render();
}

function loginAdmin(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  if (f.get("id") !== adminAccount.loginId || f.get("password") !== adminAccount.password) return toast("관리자 ID 또는 비밀번호가 일치하지 않습니다.");
  session = { id: "admin", role: "admin" };
  localStorage.setItem("with_session_v2", JSON.stringify(session));
  render();
}

function signup(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const phone = f.get("phone"), empNo = f.get("empNo");
  if (state.users.some(u => u.phone === phone || u.empNo === empNo)) return toast("이미 등록된 전화번호 또는 사원번호입니다.");
  
  state.users.push({
    id: uid(),
    name: f.get("name"),
    empNo,
    birth: f.get("birth"),
    phone,
    password: f.get("password"),
    role: "user",
    dept: f.get("dept") || "",
    status: "가입대기",
    createdAt: new Date().toLocaleString()
  });
  
  save(); 
  toast("회원가입 신청 완료. 관리자 승인 후 로그인 가능합니다.");
  loginTab = "user";
  render();
}

function loginView() { app.innerHTML = `<div class="loginbox panel"><div class="brand"><div class="logo">W</div><div><b>WITH Welfare Mall</b><small>회원 승인형 복지몰</small></div></div><h1>복지몰 로그인</h1><div class="tabs"><button class="${loginTab === 'user' ? 'active' : ''}" onclick="loginTab='user';render()">직원 로그인</button><button class="${loginTab === 'signup' ? 'active' : ''}" onclick="loginTab='signup';render()">회원가입</button><button class="${loginTab === 'admin' ? 'active' : ''}" onclick="loginTab='admin';render()">관리자</button></div>${loginTab === 'user' ? `<form class="form" onsubmit="loginUser(event)"><label class="wide">이름<input name="name" required></label><label class="wide">전화번호<input name="phone" placeholder="010-0000-0000" required></label><label class="wide">비밀번호<input type="password" name="password" required></label><button class="wide">직원 로그인</button></form><p class="muted">데모 직원: 홍길동 / 010-1111-2222 / 1234</p>` : ""}${loginTab === 'signup' ? `<form class="form" onsubmit="signup(event)"><label>이름<input name="name" required></label><label>사원번호<input name="empNo" required></label><label>생년월일<input type="date" name="birth" required></label><label>전화번호<input name="phone" required></label><label>부서<input name="dept"></label><label>비밀번호<input type="password" name="password" required></label><button class="wide">회원가입 신청</button></form>` : ""}${loginTab === 'admin' ? `<form class="form" onsubmit="loginAdmin(event)"><label class="wide">관리자 ID<input name="id" value="with1905" required></label><label class="wide">비밀번호<input type="password" name="password" required></label><button class="wide">관리자 로그인</button></form><p class="muted">관리자 성명: 김경진</p>` : ""}</div>`; }
function layout(content) { const u = user(); return `<div class="top"><div class="topin"><div class="brand"><div class="logo">W</div><div><b>WITH Welfare Mall</b><small>${u.name} · ${u.role === "admin" ? "관리자" : "임직원"}</small></div></div><div class="nav">${["home:홈", "stay:숙소예약", "family:경조사", "event:행사", "discount:할인", "vacation:국가휴가지원", "notice:공지"].map(x => { const [k, v] = x.split(":"); return `<button class="${page === k ? 'active' : ''}" onclick="setPage('${k}')">${v}</button>` }).join("")}${u.role === "admin" ? `<button class="${page === 'admin' ? 'active' : ''}" onclick="setPage('admin')">관리자</button>` : ""}<button class="gray" onclick="logout()">로그아웃</button></div></div></div><div class="wrap">${content}</div><div class="footer">WITH Welfare Mall · 제주 사계펜션 복지몰</div>`; }

function calcNights(a, b) { return Math.max(0, Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24))); }
function annualUsedNights(userId, year = new Date().getFullYear()) { return state.reservations.filter(r => r.userId === userId && r.status !== "반려" && r.status !== "취소" && String(r.checkin).slice(0, 4) == String(year)).reduce((s, r) => s + calcNights(r.checkin, r.checkout), 0); }
function overlaps(aStart, aEnd, bStart, bEnd) { return aStart < bEnd && bStart < aEnd; }
function isRoomAvailable(roomId, checkin, checkout) { return !state.reservations.some(r => r.roomId === roomId && r.status !== "취소" && r.status !== "반려" && overlaps(checkin, checkout, r.checkin, r.checkout)); }
function calcPrice(useType, nights) { if (useType === "지인") return Math.round(state.settings.nightlyPrice * (state.settings.friendDiscountRate / 100)) * nights; return 0; }

function home() { const u = user(); return layout(`<section class="hero"><div><span class="badge">Company Welfare Platform</span><h1>회원 승인형 회사 복지몰</h1><p class="muted">직원 회원가입 승인, 제주 사계펜션 예약 캘린더, 연간 10박 제한, 본인/직계가족 무료 및 지인 50% 할인 결제 안내를 반영했습니다.</p><button onclick="setPage('stay')">숙소 예약하기</button> <button class="secondary" onclick="setPage('vacation')">국가 휴가 지원 신청</button></div><div class="panel"><b>${u.name}님</b><p class="muted">${u.role === "admin" ? "관리자" : "임직원"} 계정</p><div class="grid2"><div><span class="muted">연간 사용 박수</span><div class="kpi">${u.role === "admin" ? "-" : annualUsedNights(u.id)}</div></div><div><span class="muted">연간 기준</span><div class="kpi">${state.settings.annualNightLimit}박</div></div></div></div></section>`); }
function stay() { const u = user(); const used = u.role === "admin" ? 0 : annualUsedNights(u.id); return layout(`<section class="section"><h2>제주 사계펜션 숙소 예약</h2><p class="muted">스텔라동 / 솔라동 2개 동 운영 · 각 동 기본 5명 · 추가 인원 입력 가능 · 직원당 연간 ${state.settings.annualNightLimit}박 기준</p><div class="grid2">${state.rooms.map(r => `<div class="card room-card"><div class="room-img ${r.id}">${r.name}</div><div class="room-body"><h3>${r.name}</h3><p class="muted">기본 ${r.basePeople}명 · 최대 ${r.maxPeople}명</p><button onclick="showReserve('${r.id}')">예약 신청</button></div></div>`).join("")}</div></section><section class="section panel"><div class="cal-head"><h2>예약 현황 캘린더</h2><div><button class="secondary" onclick="moveMonth(-1)">이전</button> <b>${calDate.getFullYear()}년 ${calDate.getMonth() + 1}월</b> <button class="secondary" onclick="moveMonth(1)">다음</button></div></div>${calendar()}</section><section id="reserveForm" class="section"></section><section class="section"><h2>내 예약 현황</h2><p class="muted">올해 사용/신청 박수: ${used}박 / ${state.settings.annualNightLimit}박</p>${reservationTable(state.reservations.filter(r => r.userId === u.id), false)}</section>`); }
function moveMonth(n) { calDate.setMonth(calDate.getMonth() + n); render(); }
function calendar() { const y = calDate.getFullYear(), m = calDate.getMonth(); const first = new Date(y, m, 1); const start = new Date(y, m, 1 - first.getDay()); let html = `<div class="calendar">${["일", "월", "화", "수", "목", "금", "토"].map(d => `<div class="dow">${d}</div>`).join("")}`; for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); const ds = d.toISOString().slice(0, 10); const out = d.getMonth() !== m; const marks = []; state.reservations.filter(r => r.status !== "취소" && r.status !== "반려" && ds >= r.checkin && ds < r.checkout).forEach(r => marks.push(`<span class="mark ${r.roomId}M">${r.roomName} X</span>`)); html += `<div class="day ${out ? 'out' : ''}"><div class="daynum">${d.getDate()}</div>${marks.join("")}</div>`; } return html + "</div>"; }

function showReserve(roomId) { const r = state.rooms.find(x => x.id === roomId); document.getElementById("reserveForm").innerHTML = `<div class="panel"><h2>${r.name} 예약 신청</h2><form class="form" oninput="updateEstimate(this)" onsubmit="submitReservation(event,'${roomId}')"><label>체크인<input type="date" name="checkin" min="${today}" required></label><label>체크아웃<input type="date" name="checkout" min="${today}" required></label><label>이용 구분<select name="useType" required><option>본인 사용</option><option>직계가족</option><option>지인</option></select></label><label>이용 인원<input type="number" name="people" min="1" max="${r.maxPeople}" value="${r.basePeople}" required></label><label>연락처<input name="phone" value="${user().phone || ''}" required></label><label>입금자명<input name="payer" placeholder="지인 이용 시 입력"></label><label class="wide">요청사항<textarea name="memo"></textarea></label><div class="wide pricebox" id="estimate">본인 및 직계가족은 무료입니다.</div><div class="wide"><button>예약 신청 제출</button></div></form></div>`; document.getElementById("reserveForm").scrollIntoView({ behavior: "smooth" }); }
function updateEstimate(form) { const nights = calcNights(form.checkin.value, form.checkout.value); const useType = form.useType.value; const price = calcPrice(useType, nights); const txt = useType === "지인" ? `지인 이용: 1박 ${money(state.settings.nightlyPrice)} 기준 ${state.settings.friendDiscountRate}% 할인 적용 · 예상 입금액 ${money(price)} · 입금계좌 ${state.settings.bankName} ${state.settings.bankAccount} ${state.settings.bankHolder}` : `본인 및 직계가족은 무료입니다. 예상 ${nights || 0}박`; document.getElementById("estimate").innerText = txt; }
function submitReservation(e, roomId) { e.preventDefault(); const f = new FormData(e.target); const checkin = f.get("checkin"), checkout = f.get("checkout"), people = Number(f.get("people")), useType = f.get("useType"); const room = state.rooms.find(r => r.id === roomId); const nights = calcNights(checkin, checkout); if (nights <= 0) return toast("체크아웃은 체크인 이후 날짜여야 합니다."); if (people > room.maxPeople) return toast(`${room.name} 최대 인원은 ${room.maxPeople}명입니다.`); if (!isRoomAvailable(roomId, checkin, checkout)) return toast("해당 기간은 이미 예약되어 있습니다."); const used = annualUsedNights(user().id, checkin.slice(0, 4)); if (used + nights > state.settings.annualNightLimit) return toast(`직원당 연간 ${state.settings.annualNightLimit}박 기준을 초과합니다. 현재 ${used}박 사용/신청 중입니다.`); const amount = calcPrice(useType, nights); state.reservations.push({ id: uid(), userId: user().id, userName: user().name, dept: user().dept || "", roomId, roomName: room.name, checkin, checkout, nights, people, extraPeople: Math.max(0, people - room.basePeople), useType, amount, bankInfo: `${state.settings.bankName} ${state.settings.bankAccount} ${state.settings.bankHolder}`, phone: f.get("phone"), payer: f.get("payer"), memo: f.get("memo"), status: "대기", createdAt: new Date().toLocaleString() }); save(); toast("예약 신청이 접수되었습니다."); setPage("stay"); }
function reservationTable(rows, admin) { if (!rows.length) return `<div class="panel empty">예약 내역이 없습니다.</div>`; return `<table class="table"><thead><tr><th>숙소</th><th>신청자</th><th>기간</th><th>구분/금액</th><th>인원</th><th>상태</th><th>관리</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.roomName}</td><td>${r.userName}<br><span class="muted">${r.dept || ""}</span></td><td>${r.checkin} ~ ${r.checkout}<br><b>${r.nights || calcNights(r.checkin, r.checkout)}박</b></td><td>${r.useType || "-"}<br>${r.amount ? `<b>${money(r.amount)}</b><br><span class="muted">${r.bankInfo || ""}</span>` : "무료"}</td><td>${r.people}명${r.extraPeople ? `<br><span class="muted">추가 ${r.extraPeople}명</span>` : ""}</td><td><span class="status ${r.status}">${r.status}</span></td><td class="actions">${admin ? adminButtons("reservations", r.id, r.status) : userCancelButton("reservations", r.id, r.status)}</td></tr>`).join("")}</tbody></table>`; }
function userCancelButton(type, id, status) { return status === "대기" || status === "승인" ? `<button class="danger" onclick="userCancel('${type}','${id}')">취소</button>` : "-"; }
function userCancel(type, id) { state[type].find(x => x.id === id).status = "취소"; save(); toast("취소 처리되었습니다."); render(); }
function adminButtons(type, id, status) { if (status !== "대기") return "-"; return `<button onclick="setStatus('${type}','${id}','승인')">승인</button><button class="danger" onclick="setStatus('${type}','${id}','반려')">반려</button>`; }
function setStatus(type, id, status) { state[type].find(x => x.id === id).status = status; save(); toast(`${status} 처리되었습니다.`); render(); }

function family() { return layout(`<section class="section"><h2>경조사 신청</h2><div class="panel"><form class="form" onsubmit="submitCondolence(event)"><label>구분<select name="type" required><option>결혼</option><option>출산</option><option>장례</option><option>생일</option><option>기타</option></select></label><label>발생일<input type="date" name="date" required></label><label>연락처<input name="phone" value="${user().phone || ''}" required></label><label>증빙자료명<input name="file" placeholder="청첩장.pdf 등"></label><label class="wide">상세 내용<textarea name="memo" required></textarea></label><button class="wide">신청 제출</button></form></div></section><section class="section"><h2>내 신청 현황</h2>${genericTable(state.condolences.filter(x => x.userId === user().id), "condolences", false)}</section>`); }
function submitCondolence(e) { e.preventDefault(); const f = new FormData(e.target); state.condolences.push({ id: uid(), userId: user().id, userName: user().name, dept: user().dept, type: f.get("type"), date: f.get("date"), phone: f.get("phone"), file: f.get("file"), memo: f.get("memo"), status: "대기", createdAt: new Date().toLocaleString() }); save(); toast("경조사 신청 접수"); setPage("family"); }

function eventPage() { return layout(`<section class="section"><h2>사내 행사 신청</h2><div class="grid2">${state.events.map(ev => { const cnt = state.eventApplications.filter(a => a.eventId === ev.id && a.status !== "취소").length; const applied = state.eventApplications.find(a => a.eventId === ev.id && a.userId === user().id && a.status !== "취소"); return `<div class="card"><span class="badge">${ev.date}</span><h3>${ev.title}</h3><p class="muted">${ev.memo}</p><p>신청 ${cnt}/${ev.limit}명</p>${applied ? `<button class="gray" disabled>신청 완료</button>` : `<button onclick="applyEvent(${ev.id})">참석 신청</button>`}</div>` }).join("")}</div></section>`); }
function applyEvent(id) { const ev = state.events.find(e => e.id === id); const cnt = state.eventApplications.filter(a => a.eventId === id && a.status !== "취소").length; if (cnt >= ev.limit) return toast("마감되었습니다."); state.eventApplications.push({ id: uid(), eventId: id, type: ev.title, date: ev.date, userId: user().id, userName: user().name, dept: user().dept, status: "승인", createdAt: new Date().toLocaleString() }); save(); toast("행사 신청 완료"); render(); }
function discount() { return layout(`<section class="section"><h2>제휴 할인 안내</h2><div class="grid4">${state.discounts.map(d => `<div class="card"><span class="badge">${d.category}</span><h3>${d.title}</h3><p>${d.rate}</p><p class="muted">${d.method}</p><button onclick="toast('실제 구축 시 제휴 링크 또는 쿠폰 발급으로 연결됩니다.')">이용하기</button></div>`).join("")}</div></section>`); }
function vacation() { return layout(`<section class="section"><h2>국가 휴가 지원 사업 신청 접수</h2><div class="panel"><form class="form" onsubmit="submitVacation(event)"><label>신청자명<input name="name" value="${user().name}" required></label><label>부서<input name="dept" value="${user().dept || ''}" required></label><label>연락처<input name="phone" value="${user().phone || ''}" required></label><label>첨부파일명<input name="file" placeholder="신청서.pdf"></label><label class="wide">신청 사유<textarea name="reason" required></textarea></label><label class="wide"><input type="checkbox" name="agree" required> 개인정보 수집 및 이용 동의</label><button class="wide">신청 접수</button></form></div></section><section class="section"><h2>내 신청 현황</h2>${genericTable(state.vacationSupport.filter(x => x.userId === user().id), "vacationSupport", false)}</section>`); }
function submitVacation(e) { e.preventDefault(); const f = new FormData(e.target); state.vacationSupport.push({ id: uid(), userId: user().id, userName: f.get("name"), dept: f.get("dept"), type: "국가 휴가 지원 사업", date: today, phone: f.get("phone"), file: f.get("file"), memo: f.get("reason"), status: "대기", createdAt: new Date().toLocaleString() }); save(); toast("신청 접수 완료"); setPage("vacation"); }
function notice() { return layout(`<section class="section"><h2>공지사항</h2><div class="panel">${state.notices.map(n => `<div class="notice"><div><b>${n.important ? "[중요] " : ""}${n.title}</b><p class="muted">${n.body}</p></div><div class="muted">조회 ${n.views}</div></div>`).join("")}</div></section>`); }
function genericTable(rows, type, admin) { if (!rows.length) return `<div class="panel empty">신청 내역이 없습니다.</div>`; return `<table class="table"><thead><tr><th>구분</th><th>신청자</th><th>일자</th><th>첨부</th><th>상태</th><th>관리</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.type}</td><td>${r.userName}<br><span class="muted">${r.dept || ""}</span></td><td>${r.date}</td><td>${r.file || "-"}</td><td><span class="status ${r.status}">${r.status}</span></td><td>${admin ? adminButtons(type, r.id, r.status) : userCancelButton(type, r.id, r.status)}</td></tr>`).join("")}</tbody></table>`; }

function admin() { const tabs = [["reservations", "숙소 예약"], ["users", "회원 승인"], ["settings", "숙소/계좌 설정"], ["discounts", "할인관리"], ["condolences", "경조사"], ["eventApplications", "행사"], ["vacationSupport", "국가휴가"], ["stats", "통계"]]; let body = ""; if (adminTab === "reservations") body = reservationTable(state.reservations, true); if (adminTab === "users") body = userAdmin(); if (adminTab === "settings") body = settingsAdmin(); if (adminTab === "discounts") body = discountAdmin(); if (adminTab === "condolences") body = genericTable(state.condolences, "condolences", true); if (adminTab === "eventApplications") body = genericTable(state.eventApplications, "eventApplications", false); if (adminTab === "vacationSupport") body = genericTable(state.vacationSupport, "vacationSupport", true); if (adminTab === "stats") body = stats(); return layout(`<section class="section"><h2>관리자 페이지</h2><p class="muted">관리자: 김경진 / ID with1905</p><div class="admin-tabs">${tabs.map(t => `<button class="${adminTab === t[0] ? 'active' : ''}" onclick="adminTab='${t[0]}';render()">${t[1]}</button>`).join("")}<button class="secondary" onclick="exportCSV()">Excel용 CSV</button><button class="danger" onclick="resetData()">초기화</button></div>${body}</section>`); }
function userAdmin() { return `<table class="table"><thead><tr><th>이름</th><th>사원번호</th><th>생년월일</th><th>전화번호</th><th>부서</th><th>상태</th><th>관리</th></tr></thead><tbody>${state.users.map(u => `<tr><td>${u.name}</td><td>${u.empNo}</td><td>${u.birth}</td><td>${u.phone}</td><td>${u.dept || ""}</td><td><span class="status ${u.status}">${u.status}</span></td><td class="actions">${u.status === "가입대기" ? `<button onclick="setUserStatus('${u.id}','가입승인')">승인</button><button class="danger" onclick="setUserStatus('${u.id}','가입반려')">반려</button>` : "-"}</td></tr>`).join("")}</tbody></table>`; }

function setUserStatus(id, status) {
  const targetUser = state.users.find(u => u.id === id);
  if (targetUser) {
    targetUser.status = status;
    save(); 
    toast(status + " 처리 완료");
  } else {
    toast("해당 사용자를 찾을 수 없습니다.");
  }
  render();
}

function discountAdmin() { return `<div class="panel"><h3>할인 등록</h3><form class="form" onsubmit="addDiscount(event)"><label>카테고리<input name="category" required></label><label>제목<input name="title" required></label><label>할인 내용<input name="rate" required></label><label>이용 방법<input name="method" required></label><button class="wide">등록</button></form><table class="table"><thead><tr><th>카테고리</th><th>제목</th><th>할인</th><th>방법</th><th>관리</th></tr></thead><tbody>${state.discounts.map(d => `<tr><td>${d.category}</td><td>${d.title}</td><td>${d.rate}</td><td>${d.method}</td><td><button class="danger" onclick="deleteDiscount(${d.id})">삭제</button></td></tr>`).join("")}</tbody></table></div>`; }
function addDiscount(e) { e.preventDefault(); const f = new FormData(e.target); state.discounts.push({ id: Date.now(), category: f.get("category"), title: f.get("title"), rate: f.get("rate"), method: f.get("method") }); save(); toast("등록되었습니다."); render(); }
function deleteDiscount(id) { if (!confirm("삭제하시겠습니까?")) return; state.discounts = state.discounts.filter(d => d.id !== id); save(); toast("삭제되었습니다."); render(); }

function settingsAdmin() { const s = state.settings; return `<div class="panel"><form class="form" onsubmit="saveSettings(event)"><label>은행명<input name="bankName" value="${s.bankName}" required></label><label>계좌번호<input name="bankAccount" value="${s.bankAccount}" required></label><label>예금주<input name="bankHolder" value="${s.bankHolder}" required></label><label>지인 기준 1박 금액<input type="number" name="nightlyPrice" value="${s.nightlyPrice}" required></label><label>지인 할인율 %<input type="number" name="friendDiscountRate" value="${s.friendDiscountRate}" required></label><label>직원당 연간 박수 기준<input type="number" name="annualNightLimit" value="${s.annualNightLimit}" required></label><button class="wide">설정 저장</button></form></div>`; }
function saveSettings(e) { e.preventDefault(); const f = new FormData(e.target); state.settings = { bankName: f.get("bankName"), bankAccount: f.get("bankAccount"), bankHolder: f.get("bankHolder"), nightlyPrice: Number(f.get("nightlyPrice")), friendDiscountRate: Number(f.get("friendDiscountRate")), annualNightLimit: Number(f.get("annualNightLimit")) }; save(); toast("설정 저장 완료"); render(); }
function stats() { return `<div class="grid4"><div class="card"><span class="muted">회원 대기</span><div class="kpi">${state.users.filter(u => u.status === "가입대기").length}</div></div><div class="card"><span class="muted">숙소 예약</span><div class="kpi">${state.reservations.length}</div></div><div class="card"><span class="muted">예약 대기</span><div class="kpi">${state.reservations.filter(r => r.status === "대기").length}</div></div><div class="card"><span class="muted">지인 결제 예정</span><div class="kpi">${money(state.reservations.reduce((s, r) => s + (r.status !== "반려" && r.status !== "취소" ? Number(r.amount || 0) : 0), 0))}</div></div></div>`; }
function exportCSV() { const rows = [["구분", "신청자", "부서", "내용", "일자", "박수", "금액", "상태"]]; state.reservations.forEach(r => rows.push(["숙소예약", r.userName, r.dept, r.roomName, `${r.checkin}~${r.checkout}`, r.nights, r.amount || 0, r.status])); state.condolences.forEach(r => rows.push(["경조사", r.userName, r.dept, r.type, r.date, "", 0, r.status])); state.vacationSupport.forEach(r => rows.push(["국가휴가", r.userName, r.dept, r.type, r.date, "", 0, r.status])); const csv = "\ufeff" + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n"); const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "welfare_export.csv"; a.click(); }
function resetData() { if (!confirm("데모 데이터를 초기화할까요?")) return; localStorage.removeItem("with_welfare_v2"); localStorage.removeItem("with_session_v2"); state = load(); session = null; toast("초기화되었습니다."); render(); }
function render() { if (!session) return loginView(); if (page === "home") app.innerHTML = home(); if (page === "stay") app.innerHTML = stay(); if (page === "family") app.innerHTML = family(); if (page === "event") app.innerHTML = eventPage(); if (page === "discount") app.innerHTML = discount(); if (page === "vacation") app.innerHTML = vacation(); if (page === "notice") app.innerHTML = notice(); if (page === "admin") app.innerHTML = admin(); }
render();
