/* ===== Anu & Abe invitation — script.js ===== */

/* ---------- EDIT THESE ---------- */
const CONFIG = {
  // Ceremony start, Philippine Time (UTC+8). Change here if the date moves.
  ceremonyStart: '2026-12-23T13:00:00+08:00',
  partyEnd:      '2026-12-23T19:00:00+08:00',

  venueName: 'Fontera Garden Suites',
  venueAddress: 'Punta Baja Rd., Quezon, Palawan',

  // Optional: exact coordinates make Maps/Waze pins more precise.
  // Leave as null to search by name + address.
  venueLat: null,
  venueLng: null,

  // Google Form for RSVPs (1 person = 1 pass)
  rsvpUrl: 'https://forms.gle/AGPDteM3wepLPLMa6'
};
/* -------------------------------- */

const $ = (s, el = document) => el.querySelector(s);
const venueQuery = `${CONFIG.venueName}, ${CONFIG.venueAddress}`;
const hasCoords = CONFIG.venueLat != null && CONFIG.venueLng != null;
const destParam = hasCoords ? `${CONFIG.venueLat},${CONFIG.venueLng}` : venueQuery;

/* ---------- Intro / envelope ---------- */
const intro = $('#intro');
function openInvitation() {
  intro.classList.add('open');
  document.body.classList.remove('locked');
  try { sessionStorage.setItem('invOpened', '1'); } catch (e) {}
  setTimeout(() => intro.remove(), 1000);
}
let alreadyOpened = false;
try { alreadyOpened = sessionStorage.getItem('invOpened') === '1'; } catch (e) {}
if (alreadyOpened) {
  intro.remove();
  document.body.classList.remove('locked');
} else {
  $('#openBtn').addEventListener('click', openInvitation);
}

/* ---------- Nav ---------- */
const nav = $('#nav');
const navLinks = $('#navLinks');
const navToggle = $('#navToggle');
function onScroll() { nav.classList.toggle('solid', window.scrollY > 60); }
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

function setMenu(open) {
  navLinks.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('menu-open', open);
}
navToggle.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
navLinks.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

/* ---------- Countdown ---------- */
const target = new Date(CONFIG.ceremonyStart).getTime();
const cd = { d: $('#cd-d'), h: $('#cd-h'), m: $('#cd-m'), s: $('#cd-s') };
function tick() {
  let diff = target - Date.now();
  if (diff <= 0) {
    $('#countdown').innerHTML = '<p class="script" style="font-size:2.4rem">Today is the day!</p>';
    clearInterval(timer);
    return;
  }
  const d = Math.floor(diff / 864e5); diff -= d * 864e5;
  const h = Math.floor(diff / 36e5);  diff -= h * 36e5;
  const m = Math.floor(diff / 6e4);   diff -= m * 6e4;
  const s = Math.floor(diff / 1e3);
  cd.d.textContent = d;
  cd.h.textContent = String(h).padStart(2, '0');
  cd.m.textContent = String(m).padStart(2, '0');
  cd.s.textContent = String(s).padStart(2, '0');
}
const timer = setInterval(tick, 1000);
tick();

/* ---------- Location ---------- */
const mapUrl = hasCoords
  ? `https://www.google.com/maps/search/?api=1&query=${destParam}`
  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueQuery)}`;
$('#openMap').href = mapUrl;
$('#openWaze').href = hasCoords
  ? `https://waze.com/ul?ll=${destParam}&navigate=yes`
  : `https://waze.com/ul?q=${encodeURIComponent(venueQuery)}&navigate=yes`;

if (hasCoords) {
  $('#mapFrame').src = `https://www.google.com/maps?q=${destParam}&z=16&output=embed`;
}

function directionsUrl(origin) {
  const base = 'https://www.google.com/maps/dir/?api=1&travelmode=driving';
  const dest = '&destination=' + encodeURIComponent(destParam);
  return base + dest + (origin ? '&origin=' + encodeURIComponent(origin) : '');
}

const geoMsg = $('#geoMsg');
$('#dirMe').addEventListener('click', () => {
  // Open the tab synchronously (avoids popup blockers), then point it at the route.
  const win = window.open('', '_blank');
  const go = url => { win ? (win.location.href = url) : (window.location.href = url); };

  if (!navigator.geolocation) {
    geoMsg.textContent = 'Location is not available on this device — opening the venue map instead.';
    return go(directionsUrl(null));
  }
  geoMsg.textContent = 'Finding your location…';
  navigator.geolocation.getCurrentPosition(
    pos => {
      geoMsg.textContent = 'Opening directions from your location.';
      go(directionsUrl(`${pos.coords.latitude},${pos.coords.longitude}`));
    },
    () => {
      geoMsg.textContent = 'We couldn’t get your location (permission off?). Opening the venue map — you can enter your starting point there.';
      go(directionsUrl(null));
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
});

/* ---------- RSVP ---------- */
$('#rsvpBtn').href = CONFIG.rsvpUrl;

/* ---------- Add to calendar (.ics) ---------- */
function icsDate(iso) { return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
$('#addCal').addEventListener('click', () => {
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Anu and Abe//Wedding//EN', 'BEGIN:VEVENT',
    'UID:anu-abe-wedding-2026@invitation',
    'DTSTAMP:' + icsDate(new Date().toISOString()),
    'DTSTART:' + icsDate(CONFIG.ceremonyStart),
    'DTEND:' + icsDate(CONFIG.partyEnd),
    'SUMMARY:Anu & Abe\'s Wedding',
    'LOCATION:' + venueQuery.replace(/,/g, '\\,'),
    'DESCRIPTION:1:00 PM Ceremony\\n2:00 PM Photos\\n3:00 PM Reception\\n4:00 PM Dinner\\n5-7:00 PM Party',
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = 'anu-abe-wedding.ics';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

/* ---------- Scroll reveal ---------- */
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .12 });
  reveals.forEach(el => io.observe(el));
} else {
  reveals.forEach(el => el.classList.add('in'));
}
