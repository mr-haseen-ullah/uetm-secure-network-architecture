/* ======================================
   UETM Secure Network Architecture
   Interactive Campus Blueprint Engine
   ====================================== */

// ========== LOADING SCREEN ==========
(function initLoading() {
    const bar = document.getElementById('loadingBar');
    const pct = document.getElementById('loadingPercent');
    const screen = document.getElementById('loadingScreen');
    const app = document.getElementById('app');
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 12 + 3;
        if (progress > 100) progress = 100;
        bar.style.width = progress + '%';
        pct.textContent = Math.floor(progress) + '%';
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                screen.classList.add('fade-out');
                app.classList.remove('hidden');
                setTimeout(() => { screen.style.display = 'none'; }, 600);
            }, 400);
        }
    }, 120);
})();

// ========== CLOCK ==========
function updateClock() {
    const now = new Date();
    document.getElementById('navClock').textContent =
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}
setInterval(updateClock, 1000);
updateClock();

// ========== NAVIGATION TABS ==========
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
            if (v.id === `view-${tab.dataset.view}`) v.classList.add('active');
        });
    });
});

// ====================================================================
//  CAMPUS BLUEPRINT MAP — Drawn like the HomeCore Hub floorplan image
//  Based on UET Mardan real campus layout (34.1990°N, 72.0194°E)
//  Campus faces Charsadda Road on the south side (Main Gate)
// ====================================================================

const canvas = document.getElementById('floorplanCanvas');
const ctx = canvas.getContext('2d');

// Canvas sizing — logical coordinate space
const CW = 1100;
const CH = 750;

// Use ResizeObserver to render at a super high backing resolution.
// Setting a high scale factor (at least 3.5x display size or devicePixelRatio * 2)
// ensures crystal-clear rendering even when the user zooms in deep.
function resizeCanvas() {
    const container = document.getElementById('canvasContainer');
    if (!container) return;
    const displayWidth = container.clientWidth;
    const displayHeight = Math.round(displayWidth * (CH / CW));
    
    // Scale backing store by 3.5x or double devicePixelRatio to keep it extremely crisp
    const scaleFactor = Math.max(3.5, (window.devicePixelRatio || 1) * 2);
    const backingW = Math.round(displayWidth * scaleFactor);
    const backingH = Math.round(displayHeight * scaleFactor);
    
    // Only resize if dimensions actually changed to avoid flicker
    if (canvas.width !== backingW || canvas.height !== backingH) {
        canvas.width = backingW;
        canvas.height = backingH;
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
    }
    // Scale all drawing into our logical CW×CH coordinate space
    const scaleX = backingW / CW;
    const scaleY = backingH / CH;
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
}

resizeCanvas();
// ResizeObserver fires on zoom, window resize, and layout changes
const canvasObserver = new ResizeObserver(() => resizeCanvas());
canvasObserver.observe(document.getElementById('canvasContainer'));
window.addEventListener('resize', resizeCanvas);

// ===================================================================
//  BUILDING DEFINITIONS — rectangles placed to mimic actual campus
//  UET Mardan Layout (approx from satellite imagery):
//  - Main Gate at bottom center (south)
//  - Admin Block near gate
//  - Left wing: SE + Telecom, CS
//  - Center: Admin, Library, Mosque, Server Room
//  - Right wing: EE, Civil, Mechanical
//  - Far back (north): Hostels, Cafeteria, Sports
//  - Roads connecting buildings
// ===================================================================

const buildings = {
    // format: { x, y, w, h, label, zone, color }
    // Coordinates are in the 1100x750 canvas space

    // ---- BOUNDARY ----
    boundary: { x: 50, y: 30, w: 1000, h: 680, label: '', zone: 'boundary' },

    // ---- SOUTH: Main Gate & Admin ----
    mainGate:   { x: 480, y: 670, w: 140, h: 40, label: 'MAIN GATE', zone: 'perimeter', color: '#22d3ee' },
    adminBlock: { x: 440, y: 560, w: 220, h: 65, label: 'ADMIN BLOCK', zone: 'admin', color: '#8b5cf6',
        details: 'VC Office • Registrar • Finance • HR\nVLAN 100 — 10.100.0.0/24\n802.1X + Biometric Access' },
    guardRoom:  { x: 410, y: 670, w: 60, h: 40, label: 'GUARD', zone: 'perimeter', color: '#64748b' },

    // ---- LEFT WING (West): Computing Departments ----
    seBlock:    { x: 80, y: 280, w: 180, h: 100, label: 'SOFTWARE\nENGINEERING', zone: 'computing', color: '#3b82f6',
        details: 'Labs 1-4 (120 workstations)\nFaculty Offices + Chairman\nVLAN 10-12 — 10.10.0.0/22\nManaged PoE Switches' },
    csBlock:    { x: 80, y: 140, w: 180, h: 100, label: 'COMPUTER\nSCIENCE', zone: 'computing', color: '#3b82f6',
        details: 'Labs 1-4 (150 workstations + GPU)\nFaculty Offices + Chairman\nVLAN 20-22 — 10.20.0.0/22\nThin Clients + RADIUS' },
    telecomBlock: { x: 80, y: 410, w: 180, h: 80, label: 'TELECOM\nENGINEERING', zone: 'computing', color: '#6366f1',
        details: 'Telecom Labs + Research\nFaculty Offices\nVLAN 60-62 — 10.60.0.0/22\nRF Shielded Lab' },

    // ---- RIGHT WING (East): Engineering Departments ----
    eeBlock:    { x: 840, y: 140, w: 180, h: 100, label: 'ELECTRICAL\nENGINEERING', zone: 'engineering', color: '#f59e0b',
        details: 'Power Systems + Electronics Labs\nPLC/SCADA Training\nVLAN 30-32 — 10.30.0.0/22\nIsolated SCADA VLAN' },
    civilBlock: { x: 840, y: 280, w: 180, h: 100, label: 'CIVIL\nENGINEERING', zone: 'engineering', color: '#f59e0b',
        details: 'Structural + Survey Labs\nCAD Workstations\nVLAN 40-42 — 10.40.0.0/22\nHeavy-Load Computing' },
    mechBlock:  { x: 840, y: 410, w: 180, h: 80, label: 'MECHANICAL\nENGINEERING', zone: 'engineering', color: '#f59e0b',
        details: 'CNC Lab + Workshop\nIoT Sensors + Actuators\nVLAN 50-52 — 10.50.0.0/22\nOT Network Isolated' },

    // ---- CENTER: Core Infrastructure ----
    serverRoom: { x: 470, y: 300, w: 160, h: 60, label: 'SERVER ROOM\n& NOC', zone: 'core', color: '#ef4444',
        details: 'Core Switch L3 (Catalyst 9500)\nNGFW Firewall (Firepower 2110)\nRADIUS + AD Server\nVLAN 1 — 10.0.0.0/24\nBiometric + CCTV Access' },
    library:    { x: 470, y: 200, w: 160, h: 60, label: 'CENTRAL\nLIBRARY', zone: 'academic', color: '#10b981',
        details: 'Digital Resources + Wi-Fi Zone\nVLAN 70 — 10.70.0.0/24\nContent Filtering Active\nBandwidth QoS Priority' },
    examHall:   { x: 470, y: 400, w: 160, h: 60, label: 'EXAMINATION\nHALL & VAULT', zone: 'admin', color: '#8b5cf6',
        details: 'Air-Gapped Exam Servers\nEncrypted Storage (AES-256)\nVLAN 200 — 10.200.0.0/28\nAudit Logging + DLP' },

    // ---- CENTER: Additional Facilities ----
    mosque:     { x: 340, y: 200, w: 100, h: 70, label: 'MOSQUE', zone: 'facility', color: '#64748b',
        details: 'Guest Wi-Fi Only\nVLAN 999 — Captive Portal\nBandwidth Throttled' },
    seminarHall:{ x: 340, y: 400, w: 100, h: 60, label: 'SEMINAR\nHALL', zone: 'academic', color: '#10b981',
        details: 'Conference + Video Conf.\nVLAN 101 — 10.100.1.0/24\nGuest Portal Access\nQoS for Streaming' },
    aiCenter:   { x: 660, y: 200, w: 140, h: 60, label: 'CENTER OF\nART. INTELLIGENCE', zone: 'computing', color: '#3b82f6',
        details: 'GPU Cluster + Research\nVLAN 80 — 10.80.0.0/24\nHigh-Bandwidth Trunk\nIsolated Research VLAN' },
    naturalSci: { x: 660, y: 300, w: 140, h: 60, label: 'NATURAL SCI.\n& HUMANITIES', zone: 'academic', color: '#10b981',
        details: 'Classrooms + Faculty\nVLAN 90 — 10.90.0.0/24\nWi-Fi Coverage' },

    // ---- NORTH: Residential & Amenities ----
    boysHostel1:{ x: 100, y: 50, w: 150, h: 65, label: 'BOYS HOSTEL 1', zone: 'residential', color: '#f43f5e',
        details: 'Untrusted Zone\nVLAN 999 — 192.168.1.0/24\nCaptive Portal + Throttle\nIsolated from Campus LAN' },
    boysHostel2:{ x: 290, y: 50, w: 150, h: 65, label: 'BOYS HOSTEL 2', zone: 'residential', color: '#f43f5e',
        details: 'Untrusted Zone\nVLAN 999 — 192.168.2.0/24\nCaptive Portal + Throttle\nIsolated from Campus LAN' },
    girlsHostel:{ x: 660, y: 50, w: 150, h: 65, label: 'GIRLS HOSTEL', zone: 'residential', color: '#f43f5e',
        details: 'Untrusted Zone\nVLAN 999 — 192.168.3.0/24\nCaptive Portal + Throttle\nSeparate AP Controller' },
    cafeteria:  { x: 480, y: 55, w: 140, h: 55, label: 'CAFETERIA', zone: 'facility', color: '#64748b',
        details: 'Guest Wi-Fi Only\nVLAN 999 — Captive Portal\nNo Campus LAN Access' },
    parking:    { x: 850, y: 520, w: 170, h: 60, label: 'PARKING &\nSPORTS GROUND', zone: 'facility', color: '#64748b',
        details: 'CCTV Coverage Only\nVLAN 998 — Security Cameras\nNVR in Server Room' },
    staffRes:   { x: 850, y: 50, w: 150, h: 65, label: 'STAFF\nRESIDENCE', zone: 'residential', color: '#f43f5e',
        details: 'Faculty Housing\nVLAN 150 — 10.150.0.0/24\nVPN Access to Campus\nWPA3 Enterprise' },
};

// ===== NETWORK DEVICE POSITIONS (icons placed on buildings) =====
const devices = {
    // Core
    coreSwitch: { x: 530, y: 320, label: 'Core Switch L3', building: 'serverRoom', icon: '🖧', status: 'online',
        subnet: '10.0.0.0/8', desc: 'Cisco Catalyst 9500 — 40Gbps backplane, inter-VLAN routing hub' },
    ngfw:       { x: 510, y: 340, label: 'NGFW Firewall', building: 'serverRoom', icon: '🔥', status: 'online',
        subnet: 'DMZ 172.16.0.0/24', desc: 'Cisco Firepower 2110 — DPI, IPS, SSL decryption' },
    radius:     { x: 560, y: 340, label: 'RADIUS Server', building: 'serverRoom', icon: '🔐', status: 'online',
        subnet: '10.0.0.5', desc: 'FreeRADIUS + Active Directory — 802.1X backend' },

    // Gateway
    pernGw:     { x: 550, y: 660, label: 'HEC PERN', building: 'mainGate', icon: '🌐', status: 'online',
        subnet: 'Public IP Pool', desc: 'Pakistan Education & Research Network — 1Gbps fiber uplink' },
    guardCam:   { x: 435, y: 685, label: 'CCTV + Barrier', building: 'guardRoom', icon: '📹', status: 'online',
        subnet: 'VLAN 998', desc: 'IP camera system + automated barrier control' },

    // SE
    seSwitch:   { x: 170, y: 310, label: 'SE L2 Switch', building: 'seBlock', icon: '🖧', status: 'online',
        subnet: 'VLAN 10', desc: 'Catalyst 2960 — 48-port PoE, access layer for SE labs' },
    seAP:       { x: 140, y: 350, label: 'SE Wi-Fi AP', building: 'seBlock', icon: '📶', status: 'online',
        subnet: 'VLAN 11', desc: 'Cisco 9120AXi — WPA3 Enterprise, faculty coverage' },

    // CS
    csSwitch:   { x: 170, y: 170, label: 'CS L2 Switch', building: 'csBlock', icon: '🖧', status: 'online',
        subnet: 'VLAN 20', desc: 'Catalyst 2960 — 48-port, access layer for CS labs' },
    csAP:       { x: 140, y: 210, label: 'CS Wi-Fi AP', building: 'csBlock', icon: '📶', status: 'online',
        subnet: 'VLAN 21', desc: 'Cisco 9120AXi — WPA3, faculty + lab coverage' },

    // Telecom
    telSwitch:  { x: 170, y: 440, label: 'Telecom Switch', building: 'telecomBlock', icon: '🖧', status: 'online',
        subnet: 'VLAN 60', desc: 'Managed switch for telecom labs + RF lab' },

    // EE
    eeSwitch:   { x: 930, y: 170, label: 'EE L2 Switch', building: 'eeBlock', icon: '🖧', status: 'online',
        subnet: 'VLAN 30', desc: 'Industrial-grade switch for SCADA + power labs' },
    eeAP:       { x: 900, y: 210, label: 'EE Wi-Fi AP', building: 'eeBlock', icon: '📶', status: 'standby',
        subnet: 'VLAN 31', desc: 'Wi-Fi AP — standby mode during lab hours' },

    // Civil
    civilSwitch:{ x: 930, y: 310, label: 'Civil Switch', building: 'civilBlock', icon: '🖧', status: 'online',
        subnet: 'VLAN 40', desc: 'Access switch for Civil dept CAD workstations' },

    // Mech
    mechSwitch: { x: 930, y: 440, label: 'Mech Switch', building: 'mechBlock', icon: '🖧', status: 'standby',
        subnet: 'VLAN 50', desc: 'OT switch — CNC machines + IoT sensors' },

    // Library
    libAP:      { x: 550, y: 220, label: 'Library AP', building: 'library', icon: '📶', status: 'online',
        subnet: 'VLAN 70', desc: 'High-density AP for student Wi-Fi zone' },

    // Exam
    examSrv:    { x: 530, y: 425, label: 'Exam Server', building: 'examHall', icon: '🖥️', status: 'online',
        subnet: 'VLAN 200', desc: 'Air-gapped exam data server — encrypted AES-256' },

    // AI Center
    aiGPU:      { x: 720, y: 225, label: 'GPU Cluster', building: 'aiCenter', icon: '⚡', status: 'online',
        subnet: 'VLAN 80', desc: 'NVIDIA DGX cluster — isolated research VLAN' },

    // Admin
    adminAP:    { x: 530, y: 580, label: 'Admin AP', building: 'adminBlock', icon: '📶', status: 'online',
        subnet: 'VLAN 100', desc: 'Admin Wi-Fi — WPA3, biometric-gated rooms' },

    // Hostels
    hostel1AP:  { x: 175, y: 75, label: 'Hostel 1 AP', building: 'boysHostel1', icon: '📶', status: 'alert',
        subnet: 'VLAN 999', desc: 'Untrusted zone — captive portal, bandwidth throttled' },
    hostel2AP:  { x: 365, y: 75, label: 'Hostel 2 AP', building: 'boysHostel2', icon: '📶', status: 'alert',
        subnet: 'VLAN 999', desc: 'Untrusted zone — isolated from campus LAN' },
    girlsAP:    { x: 735, y: 75, label: 'Girls Hostel AP', building: 'girlsHostel', icon: '📶', status: 'alert',
        subnet: 'VLAN 999', desc: 'Separate AP controller — untrusted zone' },
    staffAP:    { x: 925, y: 75, label: 'Staff AP', building: 'staffRes', icon: '📶', status: 'online',
        subnet: 'VLAN 150', desc: 'Faculty VPN zone — WPA3 Enterprise' },

    // Parking
    parkCam:    { x: 935, y: 545, label: 'CCTV System', building: 'parking', icon: '📹', status: 'online',
        subnet: 'VLAN 998', desc: 'IP cameras — NVR in server room' },
};

// Fiber trunk connections (thick blue dashed)
const fiberTrunks = [
    ['pernGw', 'ngfw'],
    ['ngfw', 'coreSwitch'],
    ['coreSwitch', 'radius'],
];

// VLAN links from core switch to each department switch/AP
const vlanLinks = [
    ['coreSwitch', 'seSwitch'],
    ['coreSwitch', 'csSwitch'],
    ['coreSwitch', 'telSwitch'],
    ['coreSwitch', 'eeSwitch'],
    ['coreSwitch', 'civilSwitch'],
    ['coreSwitch', 'mechSwitch'],
    ['coreSwitch', 'libAP'],
    ['coreSwitch', 'examSrv'],
    ['coreSwitch', 'aiGPU'],
    ['coreSwitch', 'adminAP'],
    ['coreSwitch', 'hostel1AP'],
    ['coreSwitch', 'hostel2AP'],
    ['coreSwitch', 'girlsAP'],
    ['coreSwitch', 'staffAP'],
    ['coreSwitch', 'parkCam'],
    ['coreSwitch', 'guardCam'],
    // Intra-building links
    ['seSwitch', 'seAP'],
    ['csSwitch', 'csAP'],
    ['eeSwitch', 'eeAP'],
];

// ===== STATE =====
let selectedDeviceKey = 'coreSwitch';
let hoveredDeviceKey = null;
let hoveredBuildingKey = null;
let trafficPackets = [];
let ripplePhase = 0;
let packetCounter = 0;
let threatCounter = 0;

// ===== ZONE COLORS =====
const zoneColors = {
    perimeter:   { fill: 'rgba(34, 211, 238, 0.03)', stroke: 'rgba(34, 211, 238, 0.25)' },
    admin:       { fill: 'rgba(139, 92, 246, 0.04)', stroke: 'rgba(139, 92, 246, 0.3)' },
    computing:   { fill: 'rgba(59, 130, 246, 0.04)', stroke: 'rgba(59, 130, 246, 0.3)' },
    engineering: { fill: 'rgba(245, 158, 11, 0.04)', stroke: 'rgba(245, 158, 11, 0.3)' },
    core:        { fill: 'rgba(239, 68, 68, 0.05)', stroke: 'rgba(239, 68, 68, 0.4)' },
    academic:    { fill: 'rgba(16, 185, 129, 0.04)', stroke: 'rgba(16, 185, 129, 0.25)' },
    residential: { fill: 'rgba(244, 63, 94, 0.04)', stroke: 'rgba(244, 63, 94, 0.25)' },
    facility:    { fill: 'rgba(100, 116, 139, 0.03)', stroke: 'rgba(100, 116, 139, 0.2)' },
    boundary:    { fill: 'transparent', stroke: 'rgba(59, 130, 246, 0.15)' },
};

// ===== SIDEBAR ZONE BREAKDOWN (HomeCore style) =====
const zoneBreakdown = [
    { name: 'Computing Departments', count: '3 buildings • 9 VLANs', devices: ['seSwitch', 'seAP', 'csSwitch', 'csAP', 'telSwitch', 'aiGPU'] },
    { name: 'Engineering Departments', count: '3 buildings • 9 VLANs', devices: ['eeSwitch', 'eeAP', 'civilSwitch', 'mechSwitch'] },
    { name: 'Core Infrastructure', count: '1 building • Critical', devices: ['coreSwitch', 'ngfw', 'radius'] },
    { name: 'Admin & Academic', count: '4 buildings • 5 VLANs', devices: ['adminAP', 'libAP', 'examSrv'] },
    { name: 'Residential Zones', count: '4 buildings • Untrusted', devices: ['hostel1AP', 'hostel2AP', 'girlsAP', 'staffAP'] },
    { name: 'Perimeter & Facilities', count: '3 zones', devices: ['pernGw', 'guardCam', 'parkCam'] },
];

function buildDeptSidebar() {
    const container = document.getElementById('deptList');
    container.innerHTML = '';
    zoneBreakdown.forEach(zone => {
        const group = document.createElement('div');
        group.className = 'dept-group';
        group.innerHTML = `
            <div class="dept-group-header">
                <span class="dept-group-name">${zone.name}</span>
                <span class="dept-group-meta">${zone.count}</span>
            </div>
            <div class="dept-group-nodes">
                ${zone.devices.map(key => {
                    const d = devices[key];
                    return `<button class="dept-node-btn${selectedDeviceKey === key ? ' active' : ''}" data-key="${key}">
                        <span class="dept-node-dot ${d.status}"></span>${d.label}
                    </button>`;
                }).join('')}
            </div>
        `;
        group.querySelectorAll('.dept-node-btn').forEach(btn => {
            btn.addEventListener('click', () => selectDevice(btn.dataset.key));
        });
        container.appendChild(group);
    });
}

function selectDevice(key) {
    selectedDeviceKey = key;
    document.querySelectorAll('.dept-node-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.key === key);
    });
    addEventLog('info', `Focused: ${devices[key].label}`);
}

buildDeptSidebar();

// ===== EVENT LOG =====
const eventLogContainer = document.getElementById('eventLog');
const eventMessages = [
    { type: 'success', msg: 'NGFW rule update applied — 24 ACL entries refreshed' },
    { type: 'info', msg: 'RADIUS auth: faculty@se.uetm.edu.pk → VLAN 11' },
    { type: 'warning', msg: 'Bandwidth threshold on Hostel 1 AP — 94% utilized' },
    { type: 'danger', msg: 'Port scan blocked: 192.168.1.47 → 10.0.0.1' },
    { type: 'info', msg: 'VLAN 10 trunk negotiated on SE Switch Gi0/1' },
    { type: 'success', msg: 'IPSec tunnel to HEC PERN re-established' },
    { type: 'warning', msg: 'Duplicate IP in VLAN 50 — 10.50.0.102' },
    { type: 'danger', msg: 'DNS tunneling attempt blocked — exfil vector' },
    { type: 'info', msg: 'STP topology change on VLAN 20' },
    { type: 'success', msg: 'TLS cert renewed: exam-portal.uetm.edu.pk' },
    { type: 'warning', msg: 'DHCP pool 80% on VLAN 999 (Hostel)' },
    { type: 'danger', msg: 'SSH brute-force on 10.0.0.1 — 23 failures' },
    { type: 'success', msg: 'Rogue AP scan complete — no threats found' },
    { type: 'info', msg: 'Backup completed: Exam Vault → NAS replica' },
];

function addEventLog(type, msg) {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    const iconMap = { info: 'fa-circle-info', success: 'fa-circle-check', warning: 'fa-triangle-exclamation', danger: 'fa-circle-xmark' };
    const entry = document.createElement('div');
    entry.className = 'event-entry';
    entry.innerHTML = `<span class="event-time">${time}</span><span class="event-icon ${type}"><i class="fa-solid ${iconMap[type]}"></i></span><span class="event-msg">${msg}</span>`;
    eventLogContainer.insertBefore(entry, eventLogContainer.firstChild);
    if (eventLogContainer.children.length > 30) eventLogContainer.removeChild(eventLogContainer.lastChild);
}

setInterval(() => {
    const evt = eventMessages[Math.floor(Math.random() * eventMessages.length)];
    addEventLog(evt.type, evt.msg);
}, 4500);
addEventLog('success', 'Campus network blueprint initialized');
addEventLog('info', `${Object.keys(devices).length} devices reporting status`);

// ===== STATS =====
function updateStats() {
    document.getElementById('statNodes').textContent = Object.keys(devices).length;
    document.getElementById('statSubnets').textContent = '35';
    document.getElementById('statPackets').textContent = Math.floor(packetCounter * 0.2 + Math.random() * 60);
    document.getElementById('statThreats').textContent = threatCounter;
}
setInterval(updateStats, 1500);
updateStats();

// ===== CANVAS MOUSE INTERACTION =====
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = CW / rect.width;
    const sy = CH / rect.height;
    const mx = (e.clientX - rect.left) * sx;
    const my = (e.clientY - rect.top) * sy;

    // Check devices first
    hoveredDeviceKey = null;
    for (const key of Object.keys(devices)) {
        const d = devices[key];
        const dx = mx - d.x, dy = my - d.y;
        if (dx * dx + dy * dy < 350) { hoveredDeviceKey = key; break; }
    }

    // Check buildings
    hoveredBuildingKey = null;
    if (!hoveredDeviceKey) {
        for (const key of Object.keys(buildings)) {
            if (key === 'boundary') continue;
            const b = buildings[key];
            if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                hoveredBuildingKey = key;
                break;
            }
        }
    }

    const tooltip = document.getElementById('nodeTooltip');
    if (hoveredDeviceKey) {
        canvas.style.cursor = 'pointer';
        const d = devices[hoveredDeviceKey];
        const statusColor = d.status === 'online' ? '#10b981' : d.status === 'standby' ? '#f59e0b' : '#ef4444';
        tooltip.classList.remove('hidden');
        tooltip.querySelector('.tooltip-title').textContent = d.label;
        tooltip.querySelector('.tooltip-status-dot').style.background = statusColor;
        tooltip.querySelector('.tooltip-body').innerHTML = `<div>${d.subnet}</div><div style="margin-top:4px">${d.desc}</div>`;
        const tx = Math.min((e.clientX - rect.left) + 16, rect.width - 220);
        const ty = Math.min((e.clientY - rect.top) - 10, rect.height - 100);
        tooltip.style.left = tx + 'px'; tooltip.style.top = ty + 'px';
    } else if (hoveredBuildingKey && buildings[hoveredBuildingKey].details) {
        canvas.style.cursor = 'pointer';
        const b = buildings[hoveredBuildingKey];
        tooltip.classList.remove('hidden');
        tooltip.querySelector('.tooltip-title').textContent = b.label.replace(/\n/g, ' ');
        tooltip.querySelector('.tooltip-status-dot').style.background = b.color;
        tooltip.querySelector('.tooltip-body').innerHTML = b.details.split('\n').map(l => `<div>${l}</div>`).join('');
        const tx = Math.min((e.clientX - rect.left) + 16, rect.width - 220);
        const ty = Math.min((e.clientY - rect.top) - 10, rect.height - 120);
        tooltip.style.left = tx + 'px'; tooltip.style.top = ty + 'px';
    } else {
        canvas.style.cursor = 'default';
        tooltip.classList.add('hidden');
    }
});

canvas.addEventListener('click', () => {
    if (hoveredDeviceKey) selectDevice(hoveredDeviceKey);
});

canvas.addEventListener('mouseleave', () => {
    hoveredDeviceKey = null;
    hoveredBuildingKey = null;
    document.getElementById('nodeTooltip').classList.add('hidden');
});

// ===== TRAFFIC SIMULATION =====
function spawnTraffic() {
    const r = Math.random;
    if (r() < 0.04) addPacket('pernGw', 'ngfw', '#22d3ee', false);
    if (r() < 0.04) addPacket('ngfw', 'coreSwitch', '#3b82f6', false);
    if (r() < 0.025) addPacket('coreSwitch', 'seSwitch', '#6366f1', false);
    if (r() < 0.025) addPacket('coreSwitch', 'csSwitch', '#6366f1', false);
    if (r() < 0.02) addPacket('coreSwitch', 'eeSwitch', '#f59e0b', false);
    if (r() < 0.02) addPacket('coreSwitch', 'civilSwitch', '#f59e0b', false);
    if (r() < 0.02) addPacket('coreSwitch', 'adminAP', '#8b5cf6', false);
    if (r() < 0.02) addPacket('coreSwitch', 'examSrv', '#8b5cf6', false);
    if (r() < 0.02) addPacket('coreSwitch', 'aiGPU', '#3b82f6', false);
    if (r() < 0.02) addPacket('coreSwitch', 'libAP', '#10b981', false);
    if (r() < 0.015) addPacket('hostel1AP', 'coreSwitch', '#ef4444', true);
    if (r() < 0.01) addPacket('hostel2AP', 'coreSwitch', '#ef4444', true);
    if (r() < 0.015) addPacket('coreSwitch', 'staffAP', '#6366f1', false);
}

function addPacket(src, dst, color, threat) {
    trafficPackets.push({
        sx: devices[src].x, sy: devices[src].y,
        tx: devices[dst].x, ty: devices[dst].y,
        progress: 0, speed: 0.005 + Math.random() * 0.007,
        color, threat, trail: []
    });
    packetCounter++;
    if (threat) threatCounter++;
}

// ===== MAIN DRAW =====
function drawFrame() {
    // Re-apply transform each frame to stay crisp after zoom/resize
    resizeCanvas();
    ctx.clearRect(0, 0, CW, CH);
    ripplePhase += 0.012;

    // 1. Background grid
    ctx.strokeStyle = 'rgba(21, 34, 56, 0.15)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < CW; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke(); }
    for (let y = 0; y < CH; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke(); }

    // 2. Road markings (paths between buildings)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.06)';
    ctx.lineWidth = 20;
    // Main vertical road
    ctx.beginPath(); ctx.moveTo(550, 680); ctx.lineTo(550, 120); ctx.stroke();
    // Horizontal road
    ctx.beginPath(); ctx.moveTo(80, 330); ctx.lineTo(1020, 330); ctx.stroke();
    // Road labels
    ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MAIN CHARSADDA ROAD', 550, 718);
    ctx.save();
    ctx.translate(40, 400);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('INTERNAL CAMPUS ROAD', 0, 0);
    ctx.restore();

    // 3. Buildings — filled rectangles like the HomeCore floor plan
    Object.keys(buildings).forEach(key => {
        const b = buildings[key];
        const zc = zoneColors[b.zone] || zoneColors.facility;
        const isHovered = hoveredBuildingKey === key;

        ctx.fillStyle = isHovered ? zc.fill.replace(/[\d.]+\)$/, '0.12)') : zc.fill;
        ctx.strokeStyle = isHovered ? zc.stroke.replace(/[\d.]+\)$/, '0.7)') : zc.stroke;
        ctx.lineWidth = key === 'boundary' ? 2 : (isHovered ? 2 : 1);

        if (key === 'boundary') {
            ctx.setLineDash([8, 6]);
        }

        ctx.beginPath();
        const r = key === 'boundary' ? 12 : 4;
        ctx.roundRect(b.x, b.y, b.w, b.h, r);
        if (key !== 'boundary') ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        // Building labels
        if (b.label) {
            const lines = b.label.split('\n');
            ctx.fillStyle = isHovered ? 'rgba(255,255,255,0.9)' : 'rgba(148, 163, 184, 0.6)';
            ctx.font = `${isHovered ? 'bold ' : ''}${key === 'mainGate' ? '10' : '8'}px "JetBrains Mono", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const cx = b.x + b.w / 2;
            const cy = b.y + b.h / 2;
            lines.forEach((line, i) => {
                ctx.fillText(line, cx, cy + (i - (lines.length - 1) / 2) * 12);
            });
        }

        // Zone label in corner (small)
        if (key !== 'boundary' && key !== 'mainGate' && key !== 'guardRoom') {
            ctx.fillStyle = zc.stroke.replace(/[\d.]+\)$/, '0.35)');
            ctx.font = '6px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(b.zone.toUpperCase(), b.x + 4, b.y + 10);
        }
    });

    // 4. Network links
    // Fiber trunks
    fiberTrunks.forEach(([a, b]) => {
        const da = devices[a], db = devices[b];
        ctx.beginPath();
        ctx.moveTo(da.x, da.y);
        ctx.lineTo(db.x, db.y);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    });

    // VLAN links
    vlanLinks.forEach(([a, b]) => {
        const da = devices[a], db = devices[b];
        const isActive = selectedDeviceKey === a || selectedDeviceKey === b;
        ctx.beginPath();
        ctx.moveTo(da.x, da.y);
        ctx.lineTo(db.x, db.y);
        ctx.strokeStyle = isActive ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.08)';
        ctx.lineWidth = isActive ? 1.5 : 0.7;
        ctx.setLineDash([2, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    });

    // Highlight selected device link
    vlanLinks.forEach(([a, b]) => {
        if (a === selectedDeviceKey || b === selectedDeviceKey) {
            const da = devices[a], db = devices[b];
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(da.x, da.y);
            ctx.lineTo(db.x, db.y);
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.restore();
        }
    });

    // 5. Traffic packets
    for (let i = trafficPackets.length - 1; i >= 0; i--) {
        const p = trafficPackets[i];
        p.progress += p.speed;
        const cx = p.sx + (p.tx - p.sx) * p.progress;
        const cy = p.sy + (p.ty - p.sy) * p.progress;

        p.trail.push({ x: cx, y: cy });
        if (p.trail.length > 5) p.trail.shift();

        p.trail.forEach((pt, idx) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = (idx + 1) / p.trail.length * 0.25;
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        ctx.beginPath();
        ctx.arc(cx, cy, p.threat ? 3.5 : 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        if (p.threat && p.progress > 0.7) {
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 10;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        if (p.progress >= 1) {
            if (p.threat) {
                ctx.save();
                ctx.fillStyle = '#ef4444';
                ctx.font = 'bold 7px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('🛡 BLOCKED', devices.ngfw.x, devices.ngfw.y - 18);
                ctx.restore();
            }
            trafficPackets.splice(i, 1);
        }
    }

    // 6. Core switch ripple
    const rr = (Math.sin(ripplePhase * 2) * 0.5 + 0.5) * 40 + 10;
    ctx.beginPath();
    ctx.arc(devices.coreSwitch.x, devices.coreSwitch.y, rr, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(59, 130, 246, ${0.15 * (1 - rr / 50)})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 7. Device icons
    Object.keys(devices).forEach(key => {
        const d = devices[key];
        const isSelected = selectedDeviceKey === key;
        const isHovered = hoveredDeviceKey === key;
        const isHL = isSelected || isHovered;

        const statusColor = d.status === 'online' ? '#10b981' : d.status === 'standby' ? '#f59e0b' : '#ef4444';

        // Selection halo
        if (isHL) {
            ctx.beginPath();
            ctx.arc(d.x, d.y, 16, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
            ctx.strokeStyle = `rgba(59, 130, 246, ${isSelected ? 0.6 : 0.3})`;
            ctx.lineWidth = 1.5;
            ctx.fill();
            ctx.stroke();
        }

        // Device dot
        ctx.beginPath();
        ctx.arc(d.x, d.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = isHL ? 'rgba(10, 17, 34, 0.95)' : 'rgba(10, 17, 34, 0.8)';
        ctx.strokeStyle = isHL ? statusColor : 'rgba(30, 41, 59, 0.5)';
        ctx.lineWidth = isHL ? 2 : 1;
        ctx.fill();
        ctx.stroke();

        // Icon
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(d.icon, d.x, d.y);

        // Status dot
        ctx.beginPath();
        ctx.arc(d.x + 7, d.y - 7, 3, 0, Math.PI * 2);
        ctx.fillStyle = statusColor;
        ctx.fill();
        ctx.strokeStyle = '#04080f';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    });

    // 8. Campus title
    ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('UET MARDAN — CAMPUS NETWORK BLUEPRINT', CW - 60, CH - 10);
}

// ===== ANIMATION LOOP =====
function mainLoop() {
    spawnTraffic();
    drawFrame();
    requestAnimationFrame(mainLoop);
}
mainLoop();

// ========== SECURITY LAYERS ==========
const layerData = {
    perimeter: {
        title: '🔴 Perimeter Security Layer', color: '#ef4444',
        desc: 'The outermost defense ring protecting the campus network boundary from external threats.',
        items: [
            'Next-Generation Firewall (NGFW) at HEC PERN edge — Cisco Firepower 2110',
            'Intrusion Prevention System (IPS) with Snort/Suricata signatures',
            'DDoS mitigation with rate-limiting and traffic scrubbing',
            'Geo-IP blocking for known threat-origin countries',
            'BGP route filtering and anti-spoofing (uRPF) on uplink',
            'DMZ for public-facing services (web server, DNS, email relay)'
        ]
    },
    network: {
        title: '🟡 Network Security Layer', color: '#f59e0b',
        desc: 'Controls traffic flow between VLANs and prevents lateral movement within the campus.',
        items: [
            '35+ VLANs for micro-segmentation of departments, labs, and admin',
            'Inter-VLAN ACLs on L3 Core Switch — deny-all-except policies',
            'Private VLANs (PVLAN) for hostel/guest isolation',
            'DHCP snooping and Dynamic ARP Inspection (DAI)',
            'Port security with MAC address limiting on access switches',
            '802.1X Network Access Control with RADIUS backend'
        ]
    },
    host: {
        title: '🔵 Host Security Layer', color: '#3b82f6',
        desc: 'Protects individual endpoints — workstations, servers, and IoT devices.',
        items: [
            'Endpoint Detection & Response (EDR) — CrowdStrike Falcon agents',
            'Host-based firewall (Windows Defender Firewall with GPO)',
            'Automated patch management via WSUS/SCCM',
            'USB and removable media restrictions via Group Policy',
            'Application whitelisting on examination and admin machines',
            'Hardened OS images for lab workstations (CIS Benchmarks)'
        ]
    },
    application: {
        title: '🟣 Application Security Layer', color: '#8b5cf6',
        desc: 'Secures web apps, portals, and services that faculty, students, and staff interact with.',
        items: [
            'TLS 1.3 enforced on all internal web applications (LMS, exam portal)',
            'Web Application Firewall (WAF) — ModSecurity on Apache/Nginx',
            'OWASP Top 10 hardening for university portals',
            'Content Security Policy (CSP) headers on all web services',
            'API rate limiting and token-based authentication (OAuth 2.0)',
            'Regular vulnerability scanning with Nessus/OpenVAS'
        ]
    },
    data: {
        title: '🟢 Data Security Layer', color: '#10b981',
        desc: 'The innermost ring protecting critical assets — exam data, student records, research.',
        items: [
            'AES-256 encryption at rest for exam databases and student records',
            'TLS 1.3 encryption in transit for all sensitive data flows',
            'Role-Based Access Control (RBAC) with principle of least privilege',
            'Automated daily backups with off-site replication (3-2-1 rule)',
            'Database audit logging with tamper-evident log chains',
            'Data Loss Prevention (DLP) rules blocking exam data exfiltration'
        ]
    }
};

document.querySelectorAll('.layer-ring').forEach(ring => {
    ring.addEventListener('click', (e) => {
        e.stopPropagation();
        const layer = ring.dataset.layer;
        if (!layer || !layerData[layer]) return;
        document.querySelectorAll('.layer-ring').forEach(r => r.classList.remove('active'));
        ring.classList.add('active');
        const data = layerData[layer];
        document.getElementById('securityDetailPanel').innerHTML = `
            <div class="detail-content">
                <h3 style="color: ${data.color}">${data.title}</h3>
                <p>${data.desc}</p>
                <ul>${data.items.map(item => `<li>${item}</li>`).join('')}</ul>
            </div>
        `;
    });
});

// ========== ATTACK SIMULATION ==========
const attackCanvas = document.getElementById('attackCanvas');
const attackCtx = attackCanvas.getContext('2d');

const ATK_CW = 800;
const ATK_CH = 450;

function resizeAttackCanvas() {
    const wrap = document.querySelector('.attack-canvas-wrap');
    if (!wrap) return;
    const displayWidth = wrap.clientWidth;
    const displayHeight = Math.round(displayWidth * (ATK_CH / ATK_CW));
    
    // Scale backing store by 3.5x or double devicePixelRatio to keep it extremely crisp
    const scaleFactor = Math.max(3.5, (window.devicePixelRatio || 1) * 2);
    const backingW = Math.round(displayWidth * scaleFactor);
    const backingH = Math.round(displayHeight * scaleFactor);
    
    if (attackCanvas.width !== backingW || attackCanvas.height !== backingH) {
        attackCanvas.width = backingW;
        attackCanvas.height = backingH;
        attackCanvas.style.width = displayWidth + 'px';
        attackCanvas.style.height = displayHeight + 'px';
    }
    const scaleX = backingW / ATK_CW;
    const scaleY = backingH / ATK_CH;
    attackCtx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
}

resizeAttackCanvas();
const atkObserver = new ResizeObserver(() => resizeAttackCanvas());
const atkWrap = document.querySelector('.attack-canvas-wrap');
if (atkWrap) atkObserver.observe(atkWrap);
window.addEventListener('resize', resizeAttackCanvas);

const attackNodes = {
    internet:  { x: 80,  y: 225, label: "Internet / Attacker", color: "#ef4444" },
    pern:      { x: 200, y: 225, label: "HEC PERN", color: "#22d3ee" },
    firewall:  { x: 340, y: 225, label: "NGFW", color: "#f43f5e" },
    core:      { x: 480, y: 225, label: "Core Switch", color: "#3b82f6" },
    seZone:    { x: 620, y: 100, label: "SE Zone", color: "#6366f1" },
    csZone:    { x: 620, y: 175, label: "CS Zone", color: "#6366f1" },
    adminZone: { x: 620, y: 250, label: "Admin Zone", color: "#8b5cf6" },
    examVault: { x: 620, y: 325, label: "Exam Vault", color: "#10b981" },
    hostel:    { x: 480, y: 400, label: "Hostel Zone", color: "#f59e0b" },
};

let attackPackets = [];

const attackScenarios = {
    ddos: {
        name: "DDoS Attack",
        phases: [
            { delay: 0, logs: [
                { type: 'attack', msg: '⚡ ATTACK — Volumetric DDoS flood targeting HEC PERN gateway' },
                { type: 'attack', msg: '📊 Traffic spike: 2.4 Gbps → 14.7 Gbps (613% increase)' },
            ], packets: [{ src: 'internet', dst: 'pern', color: '#ef4444', count: 8 }] },
            { delay: 2000, logs: [
                { type: 'warning', msg: '⚠ PERN uplink saturation 92% — latency 340ms' },
                { type: 'defense', msg: '🛡 NGFW rate-limiting activated — dropping excess' },
            ], packets: [{ src: 'internet', dst: 'pern', color: '#ef4444', count: 5 }] },
            { delay: 4000, logs: [
                { type: 'defense', msg: '🛡 BGP blackhole routing engaged' },
                { type: 'defense', msg: '🛡 ISP upstream scrubbing activated' },
                { type: 'info', msg: '📉 Attack reducing: 14.7 → 3.2 Gbps' },
            ], packets: [] },
            { delay: 6000, logs: [
                { type: 'defense', msg: '✅ DDoS MITIGATED — Normal flow restored' },
                { type: 'info', msg: '📋 847 malicious IPs blocked' },
            ], packets: [] },
        ]
    },
    phishing: {
        name: "Spear Phishing",
        phases: [
            { delay: 0, logs: [
                { type: 'attack', msg: '📧 Spear phishing to faculty@se.uetm.edu.pk' },
                { type: 'attack', msg: '🎣 Credential harvesting page deployed' },
            ], packets: [{ src: 'internet', dst: 'pern', color: '#f59e0b', count: 2 }] },
            { delay: 2000, logs: [
                { type: 'warning', msg: '⚠ Faculty clicked link — redirected to fake login' },
                { type: 'defense', msg: '🛡 Email gateway flagged URL' },
            ], packets: [{ src: 'pern', dst: 'firewall', color: '#f59e0b', count: 1 }] },
            { delay: 4000, logs: [
                { type: 'defense', msg: '🛡 MFA challenge — attacker blocked' },
                { type: 'defense', msg: '🛡 SIEM alert — anomalous login detected' },
            ], packets: [] },
            { delay: 6000, logs: [
                { type: 'defense', msg: '✅ PHISHING BLOCKED — MFA prevented takeover' },
                { type: 'info', msg: '📋 Password reset forced — training scheduled' },
            ], packets: [] },
        ]
    },
    lateral: {
        name: "Lateral Movement",
        phases: [
            { delay: 0, logs: [
                { type: 'attack', msg: '💻 Compromised device: Hostel 192.168.1.47' },
                { type: 'attack', msg: '🔍 ARP scan on VLAN 999' },
            ], packets: [{ src: 'hostel', dst: 'core', color: '#ef4444', count: 3 }] },
            { delay: 2000, logs: [
                { type: 'attack', msg: '🏃 Pivot attempt: Hostel → Core → Exam Vault' },
                { type: 'warning', msg: '⚠ Port scan targeting 10.200.0.0/28' },
            ], packets: [{ src: 'hostel', dst: 'core', color: '#ef4444', count: 2 }, { src: 'core', dst: 'examVault', color: '#ef4444', count: 2 }] },
            { delay: 4000, logs: [
                { type: 'defense', msg: '🛡 VLAN ACL DENIED — No route to Exam Vault' },
                { type: 'defense', msg: '🛡 IPS: "Network Scan" — source quarantined' },
                { type: 'defense', msg: '🛡 802.1X re-auth failed — posture check' },
            ], packets: [] },
            { delay: 6000, logs: [
                { type: 'defense', msg: '✅ LATERAL MOVEMENT BLOCKED' },
                { type: 'info', msg: '📋 MAC blacklisted — port shutdown' },
            ], packets: [] },
        ]
    },
    rogue: {
        name: "Rogue Access Point",
        phases: [
            { delay: 0, logs: [
                { type: 'attack', msg: '📡 Rogue AP in Civil Block — "UETM-Free-WiFi"' },
                { type: 'attack', msg: '🎭 Evil twin capturing credentials' },
            ], packets: [] },
            { delay: 2000, logs: [
                { type: 'warning', msg: '⚠ WIDS alert — unauthorized BSSID on ch6' },
                { type: 'defense', msg: '🛡 De-auth frames sent to rogue clients' },
            ], packets: [] },
            { delay: 4000, logs: [
                { type: 'defense', msg: '🛡 Rogue MAC isolated on switch port' },
                { type: 'defense', msg: '🛡 Security team dispatched to Civil Room 204' },
            ], packets: [] },
            { delay: 6000, logs: [
                { type: 'defense', msg: '✅ ROGUE AP NEUTRALIZED' },
                { type: 'info', msg: '📋 Device confiscated — WLAN review initiated' },
            ], packets: [] },
        ]
    }
};

document.querySelectorAll('.attack-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.attack-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        startAttack(card.dataset.attack);
    });
});

function startAttack(type) {
    attackPackets = [];
    document.getElementById('attackLog').innerHTML = '';
    addAttackLog('system', `▶ Simulation: ${attackScenarios[type].name}`);
    attackScenarios[type].phases.forEach(phase => {
        setTimeout(() => {
            phase.logs.forEach(l => addAttackLog(l.type, l.msg));
            (phase.packets || []).forEach(p => {
                for (let i = 0; i < p.count; i++) {
                    setTimeout(() => {
                        attackPackets.push({
                            sx: attackNodes[p.src].x, sy: attackNodes[p.src].y,
                            tx: attackNodes[p.dst].x, ty: attackNodes[p.dst].y,
                            progress: 0, speed: 0.008 + Math.random() * 0.008,
                            color: p.color, trail: []
                        });
                    }, i * 200);
                }
            });
        }, phase.delay);
    });
}

function addAttackLog(type, msg) {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    const el = document.createElement('div');
    el.className = `log-entry ${type}`;
    el.innerHTML = `<span class="log-time">${time}</span><span class="log-msg">${msg}</span>`;
    const container = document.getElementById('attackLog');
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
}

function drawAttackFrame() {
    // Re-apply transform each frame (needed after any resize)
    resizeAttackCanvas();
    attackCtx.clearRect(0, 0, ATK_CW, ATK_CH);

    // Grid
    attackCtx.strokeStyle = 'rgba(21,34,56,0.12)';
    attackCtx.lineWidth = 0.5;
    for (let x = 0; x < ATK_CW; x += 40) { attackCtx.beginPath(); attackCtx.moveTo(x, 0); attackCtx.lineTo(x, ATK_CH); attackCtx.stroke(); }
    for (let y = 0; y < ATK_CH; y += 40) { attackCtx.beginPath(); attackCtx.moveTo(0, y); attackCtx.lineTo(ATK_CW, y); attackCtx.stroke(); }

    // Links
    const conns = [['internet','pern'],['pern','firewall'],['firewall','core'],['core','seZone'],['core','csZone'],['core','adminZone'],['core','examVault'],['core','hostel']];
    conns.forEach(([a, b]) => {
        attackCtx.beginPath();
        attackCtx.moveTo(attackNodes[a].x, attackNodes[a].y);
        attackCtx.lineTo(attackNodes[b].x, attackNodes[b].y);
        attackCtx.strokeStyle = 'rgba(59,130,246,0.1)';
        attackCtx.lineWidth = 1;
        attackCtx.setLineDash([3, 5]);
        attackCtx.stroke();
        attackCtx.setLineDash([]);
    });

    // Packets
    for (let i = attackPackets.length - 1; i >= 0; i--) {
        const p = attackPackets[i];
        p.progress += p.speed;
        const cx = p.sx + (p.tx - p.sx) * p.progress;
        const cy = p.sy + (p.ty - p.sy) * p.progress;
        p.trail.push({ x: cx, y: cy });
        if (p.trail.length > 5) p.trail.shift();
        p.trail.forEach((pt, idx) => {
            attackCtx.beginPath();
            attackCtx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
            attackCtx.fillStyle = p.color;
            attackCtx.globalAlpha = (idx + 1) / p.trail.length * 0.3;
            attackCtx.fill();
            attackCtx.globalAlpha = 1;
        });
        attackCtx.beginPath();
        attackCtx.arc(cx, cy, 4, 0, Math.PI * 2);
        attackCtx.fillStyle = p.color;
        attackCtx.shadowColor = p.color;
        attackCtx.shadowBlur = 8;
        attackCtx.fill();
        attackCtx.shadowBlur = 0;
        if (p.progress >= 1) attackPackets.splice(i, 1);
    }

    // Nodes
    Object.keys(attackNodes).forEach(key => {
        const n = attackNodes[key];
        attackCtx.beginPath();
        attackCtx.arc(n.x, n.y, 18, 0, Math.PI * 2);
        attackCtx.fillStyle = 'rgba(4,8,15,0.9)';
        attackCtx.strokeStyle = n.color;
        attackCtx.lineWidth = 1.5;
        attackCtx.fill();
        attackCtx.stroke();
        attackCtx.fillStyle = n.color;
        attackCtx.font = 'bold 8px "Inter", sans-serif';
        attackCtx.textAlign = 'center';
        attackCtx.textBaseline = 'top';
        attackCtx.fillText(n.label, n.x, n.y + 24);
    });

    requestAnimationFrame(drawAttackFrame);
}
drawAttackFrame();

// ========== IMPROVEMENTS TOGGLE ==========
document.querySelectorAll('.comparison-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.comparison-toggle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.comparison-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(`panel-${btn.dataset.compare}`).classList.add('active');
    });
});

// Risk bar animation
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.querySelectorAll('.risk-fill').forEach(fill => {
                const w = fill.style.width;
                fill.style.width = '0%';
                setTimeout(() => { fill.style.width = w; }, 100);
            });
        }
    });
}, { threshold: 0.3 });
document.querySelectorAll('.issue-timeline').forEach(el => observer.observe(el));
