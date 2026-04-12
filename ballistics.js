window.heliOffset = 0; // Переменная для хранения ручной корректировки
window.calculateBallistics = function() {
        if (!window.pHeli || !window.pTarget) return;
    
    if (window.aimLine) window.aimLine.setLatLngs([window.pHeli.getLatLng(), window.pTarget.getLatLng()]);

    const p1 = window.pHeli.getLatLng();
    const p2 = window.pTarget.getLatLng();
    
    // 1. Поворот и курс
    const angle = Math.atan2(p2.lng - p1.lng, p2.lat - p1.lat) * (180 / Math.PI);
    if (window.pHeli && typeof getHeliIcon === 'function') {
        window.pHeli.setIcon(getHeliIcon(angle));
    }
    let course = Math.round(angle);
    if (course < 0) course += 360; 
    document.getElementById('courseInfo').innerHTML = `Курс на цель: <b>${course}°</b>`;

    // 2. Расстояние (коэффициент 2.88)
    const dx = p2.lng - p1.lng;
    const dy = p2.lat - p1.lat;
    const dist = Math.sqrt(dx * dx + dy * dy) * 2.945; 

    // 3. Расчет отклонения (Старая система)
    const v = 381.5; 
    const g = 9.81;
    const hHeli = parseFloat(document.getElementById('hHeli').value) || 0;
    const hTarget = parseFloat(document.getElementById('hTarget').value) || 0;
    
    // Считаем падение на дистанции при 0 градусах
    const drop = (g * Math.pow(dist, 2)) / (2 * v * v); 
    
    // Отклонение: (Высота вертолета - падение) - Высота цели
    const y = Math.round((hHeli - drop) - hTarget);

    // Вывод данных
    document.getElementById('output').innerHTML = `
        Дистанция: ${Math.round(dist)} м<br>
        Результат: <b>${Math.abs(y)} м ${y > 0 ? 'ВЫШЕ' : 'НИЖЕ'}</b>
    `;

    if (window.updateLineLabel) window.updateLineLabel(dist);
    // Вызываем графику (передаем текущую высоту вертолета)
    drawTrajectory(dist, hHeli, hTarget, 0, v, g);

};

function drawTrajectory(dist, hH, hT, a, v, g) {
    const canvas = document.getElementById('trajCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const p = 30; // Отступы
    const w = canvas.width - p*2;
    const h = canvas.height - p*2;

    // СТАТИЧНЫЙ МАСШТАБ: 
    // За основу берем высоту 800м (твой лимит), чтобы земля всегда была в одной поре.
    const viewHeight = 800; 

    // --- 1. Линия МОРЯ (Синяя, 0м) ---
    const seaY = canvas.height - p;
    ctx.strokeStyle = "#3498db";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p, seaY);
    ctx.lineTo(canvas.width - p, seaY);
    ctx.stroke();

    // --- 2. Линия ЗЕМЛИ (Зеленая, уровень цели) ---
    // Теперь она будет стоять жестко относительно viewHeight
    const landY = canvas.height - p - ((hT / viewHeight) * h);
    ctx.strokeStyle = "#2ecc71";
    ctx.setLineDash([5, 5]); // Сделаем её пунктирной для красоты
    ctx.beginPath();
    ctx.moveTo(p, landY);
    ctx.lineTo(canvas.width - p, landY);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- 3. Траектория ракеты (с обрезкой об землю) ---
    ctx.strokeStyle = "#1abc9c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;

    for (let x = 0; x <= dist; x += dist/100) {
        let currY = (x * Math.tan(a)) - (g * x**2) / (2 * v*v) + hH;
        let dx = p + (x/dist)*w;
        let dy = canvas.height - p - ((currY / viewHeight) * h);
        
        // ОБРЕЗКА: Если ракета опустилась ниже уровня земли цели - стоп
        if (dy > landY) {
            // Дорисовываем точку касания и выходим
            ctx.lineTo(dx, landY);
            break;
        }

        // Не рисуем, если вертолет ВЫШЕ потолка окна (просто ведем линию)
        if (dy < 5) {
            if (!started) { ctx.moveTo(dx, 5); started = true; }
            else { ctx.lineTo(dx, 5); }
        } else {
            if (!started) { ctx.moveTo(dx, dy); started = true; }
            else { ctx.lineTo(dx, dy); }
        }
    }
    ctx.stroke();

    // --- 4. Силуэт Ми-8 (Вид сбоку) ---
    let heliY = canvas.height - p - ((hH / viewHeight) * h);
    // Если вертолет улетел выше экрана, рисуем его у верхней кромки
    let drawHeliY = Math.max(heliY, 15); 
    
    ctx.fillStyle = "#ecf0f1";
    ctx.fillRect(p - 12, drawHeliY - 3, 20, 6); // Корпус
    ctx.fillRect(p - 20, drawHeliY - 1, 10, 2); // Хвост
    ctx.fillStyle = "#bdc3c7";
    ctx.fillRect(p - 18, drawHeliY - 6, 32, 1); // Винт

    // --- 5. Силуэт ЦЕЛИ (Красный треугольник) ---
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.moveTo(canvas.width - p, landY);
    ctx.lineTo(canvas.width - p - 6, landY + 10);
    ctx.lineTo(canvas.width - p + 6, landY + 10);
    ctx.fill();
}

['hTarget'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => window.calculateBallistics());
});
// Функция для работы кнопок + / -
window.changeVal = function(id, amount) {
    const input = document.getElementById(id);
    input.value = Math.max(0, parseInt(input.value) + amount);
    window.calculateBallistics();
};


// Слушатели для полей ввода (чтобы расчет шел при ручном изменении цифр)
['hHeli', 'hTarget'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => window.calculateBallistics());
});