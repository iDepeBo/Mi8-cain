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

    // --- КАЛИБРОВКА ОСЕЙ ---
    const kX = 2.994;   
    const kY = 2.952;  

    const dx = (p2.lng - p1.lng) * kX;
    const dy = (p2.lat - p1.lat) * kY;
    
    const dist = Math.sqrt(dx * dx + dy * dy); 



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
    
    const pSide = 40, pBottom = 25; 
    const w = canvas.width - pSide * 2;
    const h = canvas.height - pBottom - 60; 
    const viewH = 1000; 

    // 1. Море (Синее, 0м)
    const seaY = canvas.height - pBottom;
    ctx.strokeStyle = "rgba(52, 152, 219, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pSide, seaY); ctx.lineTo(canvas.width - pSide, seaY);
    ctx.stroke();

    // 2. Земля (Зеленая пунктирная)
    const landY = seaY - ((hT / viewH) * h);
    ctx.strokeStyle = "rgba(46, 204, 113, 0.7)";
    ctx.setLineDash([8, 5]); 
    ctx.beginPath();
    ctx.moveTo(pSide, landY); ctx.lineTo(canvas.width - pSide, landY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Фиксированный мини-вертолет
    const fixedHeliY = 50; 
    const hX = pSide + 15;
    ctx.fillStyle = "white";
    ctx.beginPath(); ctx.ellipse(hX, fixedHeliY, 10, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = "white";
    ctx.beginPath(); ctx.moveTo(hX - 7, fixedHeliY); ctx.lineTo(hX - 20, fixedHeliY); ctx.lineTo(hX - 20, fixedHeliY - 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hX - 10, fixedHeliY - 3); ctx.lineTo(hX + 15, fixedHeliY - 3); ctx.stroke();

    // 4. Траектория "Горбом вверх" и "Ложится на землю"
    const startY = fixedHeliY + 4;
    ctx.strokeStyle = "#1abc9c";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    // Определяем точку падения ракеты относительно вертолета
    const dropAtTarget = (g * Math.pow(dist, 2)) / (2 * v * v);
    
    let lastX = pSide, lastY = startY;

    for (let i = 0; i <= 100; i++) {
        let x = (i / 100) * w;
        let t = i / 100;
        
        // Масштабируем падение: (g * (x_real)^2) / (2 * v^2)
        // Чтобы парабола была "горбом вверх", мы вычитаем падение из линии броска
        // В нашем случае бросок горизонтальный (угол 0), поэтому идет дуга вниз
        let currentDrop = (g * Math.pow((i/100)*dist, 2)) / (2 * v * v);
        let y = startY + (currentDrop / viewH) * h;
        
        // ОБРЕЗКА: Если парабола ушла ниже земли — она "ложится" на землю
        if (y > landY) y = landY;

        if (i === 0) ctx.moveTo(pSide, startY);
        else ctx.lineTo(pSide + x, y);
        
        lastX = pSide + x;
        lastY = y;
    }
    ctx.stroke();

    // 5. Треугольники (Острые, крупные)
    // Синий (Ракета - на конце параболы, даже если она лежит на земле)
    ctx.fillStyle = "#3498db";
    ctx.beginPath();
    ctx.moveTo(lastX - 6, lastY - 18);
    ctx.lineTo(lastX + 6, lastY - 18);
    ctx.lineTo(lastX, lastY);
    ctx.fill();

    // Красный (Цель - вершиной упирается в пунктир)
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.moveTo(canvas.width - pSide - 6, landY + 18);
    ctx.lineTo(canvas.width - pSide + 6, landY + 18);
    ctx.lineTo(canvas.width - pSide, landY);
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
