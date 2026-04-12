// Реальный размер картинки
const bounds = [[0, 0], [4200, 4200]];

const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -1.5,   // Как далеко можно отдалить (подбери под свой экран)
    maxZoom: 1,      // Как близко можно приблизить
    maxBounds: bounds, // ЗАПРЕЩАЕМ выходить за границы картинки
    maxBoundsViscosity: 1.0, // Делает границы "твердыми" (карта не пружинит)
    edgeBufferTiles: 0
});

L.imageOverlay('map.png', bounds).addTo(map);

// Принудительно вписываем карту в экран при старте
map.fitBounds(bounds);

// --- БЛОК СЕТКИ ---
function createGrid() {
    const gridLayer = L.layerGroup();
    // Рассчитываем шаг: 1000 метров делим на твой коэффициент 2.88
    const step = 1000 / 2.9; 
    
    // Вертикальные линии и цифры (X)
    for (let x = 0; x <= 4200; x += step) {
        L.polyline([[0, x], [4200, x]], { color: 'rgba(255,255,255,0.3)', weight: 1 }).addTo(gridLayer);
        let labelX = Math.floor((x * 2.88) / 1000).toString().padStart(2, '0');
        L.marker([20, x + 5], {
            icon: L.divIcon({ className: 'grid-label', html: labelX, iconSize:[30, 20] }),
            interactive: false
        }).addTo(gridLayer);
    }

    // Горизонтальные линии и цифры (Y)
    for (let y = 0; y <= 4200; y += step) {
        L.polyline([[y, 0], [y, 4200]], { color: 'rgba(255,255,255,0.3)', weight: 1 }).addTo(gridLayer);
        let labelY = Math.floor((y * 2.88) / 1000).toString().padStart(2, '0');
        L.marker([y + 5, 20], {
            icon: L.divIcon({ className: 'grid-label', html: labelY, iconSize:[30, 20] }),
            interactive: false
        }).addTo(gridLayer);
    }
    return gridLayer;
}

const grid = createGrid().addTo(map);
// --- КОНЕЦ БЛОКА СЕТКИ ---


// Иконка вертолета (вид сверху, 6 лопастей, с поддержкой вращения)
const getHeliIcon = (angle = 0) => L.divIcon({
    className: 'heli-marker-container',
    html:`<div style="transform: rotate(${angle}deg); transition: transform 0.1s;">
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
        <!-- Фюзеляж -->
        <path d="M12 2L14.5 7V17L12 22L9.5 17V7L12 2Z" fill="#000" stroke="#fff" stroke-width="0.8""")/>>
        <!-- 6 лопастей -->
        <g stroke="#fff" stroke-width="0.6" opacity="0.9">
            <line x1="12" y1="12" x2="12" y2="1""")/>>
            <line x1="12" y1="12" x2="21.5" y2="6.5""")/>>
            <line x1="12" y1="12" x2="21.5" y2="17.5""")/>>
            <line x1="12" y1="12" x2="12" y2="23""")/>>
            <line x1="12" y1="12" x2="2.5" y2="17.5""")/>>
            <line x1="12" y1="12" x2="2.5" y2="6.5""")/>>
        </g>
        <circle cx="12" cy="12" r="1.2" fill="#fff""")/>>
    </svg>
</div>`,
    iconSize: [80, 80],
    iconAnchor: [40, 40]
});


// Иконка цели (перекрестие)
const targetIcon = L.divIcon({
    className: 'custom-marker',
    html: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://w3.org">
        <circle cx="12" cy="12" r="9" stroke="#e74c3c" stroke-width="2""")/>>
        <path d="M12 2V22M2 12H22" stroke="#e74c3c" stroke-width="2""")/>>
    </svg>`,
    iconSize: [26, 26], iconAnchor: [13, 13]
});


window.pHeli = null;
window.pTarget = null;
window.aimLine = null;

map.on('click', function(e) {
      if (!window.pHeli) {
        window.pHeli = L.marker(e.latlng, {draggable: true, icon: getHeliIcon(0)}).addTo(map)
            .bindTooltip("Ми-8", {permanent: true, direction: 'top', offset: [0, -30]});
        
        // Плавное перетаскивание без "залипаний"
               window.pHeli.on('drag', function(e) {
            this.setLatLng(e.latlng);
            if (window.calculateBallistics) window.calculateBallistics();
        });



    } else if (!window.pTarget) {
        window.pTarget = L.marker(e.latlng, {draggable: true, icon: targetIcon}).addTo(map).bindTooltip("ЦЕЛЬ", {permanent: true});
        window.pTarget.on('drag', () => window.calculateBallistics());
        window.aimLine = L.polyline([window.pHeli.getLatLng(), window.pTarget.getLatLng()], {
            color: '#1abc9c', weight: 3, dashArray: '5, 10'
        }).addTo(map);
    } else {
        window.pTarget.setLatLng(e.latlng);
    }
    if (window.calculateBallistics) window.calculateBallistics();
});

// Функция для подписи на линии (добавляем в конец)
window.updateLineLabel = function(dist) {
    if (window.aimLine) {
        window.aimLine.unbindTooltip();
        window.aimLine.bindTooltip(Math.round(dist) + " м", {
            permanent: true, direction: 'center', className: 'dist-label'
        }).openTooltip();
    }
};

document.getElementById('resetBtn').onclick = () => { location.reload(); };
// --- МОДУЛЬ ЧТЕНИЯ ВЫСОТ ---
const heightImg = new Image();
heightImg.src = 'Kolgujev_heights.png';
const hCanvas = document.getElementById('heightCanvas');
const hCtx = hCanvas.getContext('2d');

heightImg.onload = () => {
    hCanvas.width = heightImg.width;
    hCanvas.height = heightImg.height;
    hCtx.drawImage(heightImg, 0, 0);
    console.log("Карта высот готова");
};

window.getElevation = function(latlng) {
    if (!hCtx || !hCanvas.width || hCanvas.width === 0) return 0;
    try {
        const x = Math.round((latlng.lng / 4200) * hCanvas.width);
        const y = Math.round(((4200 - latlng.lat) / 4200) * hCanvas.height);
        if (x < 0 || x >= hCanvas.width || y < 0 || y >= hCanvas.height) return 0;
        const pixel = hCtx.getImageData(x, y, 1, 1).data;
        return Math.round((pixel[0] / 255) * 250); 
    } catch (e) { return 0; }
};
