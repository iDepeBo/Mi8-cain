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

// --- ЕДИНЫЙ БЛОК СЕТКИ (РАЗДЕЛЬНЫЙ МАСШТАБ) ---
function createGrid() {
    const gridLayer = L.layerGroup();
    
    // Отдельные шаги: 1000 метров делим на коэффициенты осей
    const stepX = 1000 / 2.994;  // Горизонталь
    const stepY = 1000 / 2.952; // Вертикаль
    
    // Вертикальные линии и цифры (X)
    for (let x = 0; x <= 4200; x += stepX) {
        L.polyline([[0, x], [4200, x]], { color: 'rgba(255,255,255,0.3)', weight: 1 }).addTo(gridLayer);
        let labelX = Math.floor((x * 2.88) / 1000).toString().padStart(2, '0');
        L.marker([20, x + 5], {
            icon: L.divIcon({ className: 'grid-label', html: labelX, iconSize: [30, 20] }),
            interactive: false
        }).addTo(gridLayer);
    }

    // Горизонтальные линии и цифры (Y)
    for (let y = 0; y <= 4200; y += stepY) {
        L.polyline([[y, 0], [y, 4200]], { color: 'rgba(255,255,255,0.3)', weight: 1 }).addTo(gridLayer);
        let labelY = Math.floor((y * 2.945) / 1000).toString().padStart(2, '0');
        L.marker([y + 5, 20], {
            icon: L.divIcon({ className: 'grid-label', html: labelY, iconSize: [30, 20] }),
            interactive: false
        }).addTo(gridLayer);
    }
    return gridLayer;
}
const grid = createGrid().addTo(map);
// --- КОНЕЦ БЛОКА СЕТКИ ---



// Иконка вертолета (вид сверху, 6 лопастей, с поддержкой вращения)
function getHeliIcon(angle) {
    // Цвет иконки (белый, чтобы гармонировал с твоим интерфейсом)
    const color = "white"; 
    
    // SVG-код, повторяющий твой скриншот
    const svgIcon = `
        <svg xmlns="http://w3.org" viewBox="0 0 100 100" width="40" height="40">
            <g transform="rotate(${angle} 50 50)">
                <!-- Концентрические круги винта (тонкие) -->
                <circle cx="50" cy="50" r="35" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.3""")/>>
                <circle cx="50" cy="50" r="45" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.2""")/>>
                
                <!-- Лопасти (4 штуки) -->
                <line x1="50" y1="50" x2="15" y2="15" stroke="${color}" stroke-width="2.5" />
                <line x1="50" y1="50" x2="85" y2="15" stroke="${color}" stroke-width="2.5" />
                <line x1="50" y1="50" x2="15" y2="85" stroke="${color}" stroke-width="2.5" />
                <line x1="50" y1="50" x2="85" y2="85" stroke="${color}" stroke-width="2.5" />
                
                <!-- Хвостовая балка и стабилизатор -->
                <rect x="48" y="50" width="4" height="40" fill="${color}" />
                <rect x="35" y="80" width="30" height="3" fill="${color}" /> <!-- Стабилизатор -->
                <rect x="52" y="85" width="8" height="2" fill="${color}" /> <!-- Хвостовой ротор -->
                
                <!-- Основной корпус (Фюзеляж) -->
                <ellipse cx="50" cy="40" rx="12" ry="25" fill="${color}" />
                
                <!-- "Плечи" (двигатели) -->
                <rect x="35" y="35" width="30" height="12" rx="4" fill="${color}" />
            </g>
        </svg>`;

    return L.divIcon({
        html: svgIcon,
        className: 'heli-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
}



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
window.rulerLayer = null;

window.toggleRuler = function() {
    if (window.rulerLayer) {
        map.removeLayer(window.rulerLayer);
        window.rulerLayer = null;
        return;
    }

    const center = map.getCenter();
    const length = 1000 / 2.994// 1 км в пикселях карты
    window.rulerLayer = L.layerGroup().addTo(map);

    // Создаем невидимый, но перетаскиваемый маркер-основу
    const draggableAnchor = L.marker(center, {
        draggable: true,
        icon: L.divIcon({
            className: 'ruler-anchor',
            html: '<div style="width: 100px; height: 40px; margin-left: -50px; margin-top: -20px; cursor: move;"></div>',
            iconSize: [100, 40]
        })
    }).addTo(window.rulerLayer);

    // Функция отрисовки графики линейки относительно маркера
    const drawRulerParts = (latlng) => {
        // Очищаем старые линии внутри группы, кроме самого маркера
        window.rulerLayer.eachLayer(layer => {
            if (layer !== draggableAnchor) window.rulerLayer.removeLayer(layer);
        });

        const startLng = latlng.lng - (length / 2);
        const endLng = latlng.lng + (length / 2);

        // Черная база
        L.polyline([[latlng.lat, startLng], [latlng.lat, endLng]], {
            color: '#000', weight: 10, opacity: 0.8, interactive: false
        }).addTo(window.rulerLayer);

        // Засечки и текст
        for (let i = 0; i <= 10; i++) {
            const curLng = startLng + (length * (i / 10));
            const isMajor = (i % 5 === 0);
            const h = isMajor ? 12 : 6;

            L.polyline([
                [latlng.lat - h, curLng], 
                [latlng.lat + h, curLng]
            ], { color: '#fff', weight: 2, interactive: false }).addTo(window.rulerLayer);

            if (isMajor) {
                L.marker([latlng.lat - 25, curLng], {
                    icon: L.divIcon({
                        className: 'grid-label',
                        html: `<b style="color:white; text-shadow: 1px 1px 3px black;">${i * 100}m</b>`,
                        iconSize: [40, 20]
                    }),
                    interactive: false
                }).addTo(window.rulerLayer);
            }
        }
    };

    // Отрисовываем первый раз
    drawRulerParts(center);

    // При движении маркера перерисовываем всю линейку за ним
    draggableAnchor.on('drag', (e) => {
        drawRulerParts(e.latlng);
    });
    
    console.log("Линейка готова. Хватай за центр и тащи!");
};
