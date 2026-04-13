// --- БЛОК 1: ГЛОБАЛЬНЫЕ НАСТРОЙКИ ---
const V_ROCKET = 381.5;      // Начальная скорость С-8
const G_CONST = 9.81;        // Гравитация
const ARMA_CORRECTION = 0.9535; // Твоя боевая поправка

const KX = 2.994; // Коэффициент горизонтали (X)
const KY = 2.952; // Коэффициент вертикали (Y)

console.log("CAIN: Константы загружены");

// --- БЛОК 2: ОТРИСОВКА ГРАФИКА ---
// --- БЛОК 2: ОТРИСОВКА ГРАФИКА (ШАГ 1: ЛАУТ И ВЕРТОЛЕТ) ---
function drawTrajectory(dist, hH, hT, a, v, g) {
    const canvas = document.getElementById('trajCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Минимальные отступы для использования всего пространства
    const pSide = 25;   // Отступ слева/справа
    const pTop = 25;    // Отступ сверху
    const pBottom = 15; // Отступ снизу для моря
    
    const w = canvas.width - pSide * 2;
    const hArea = canvas.height - pTop - pBottom; // Вся рабочая высота

    // 1. ФИКСИРОВАННЫЕ ТОЧКИ
    const fixedHeliY = pTop;              // Вертолет теперь выше
    const seaY = canvas.height - pBottom; // Море теперь ниже
    
    // 2. ЛИННИИ
    // Море (Синяя)
    ctx.strokeStyle = "rgba(52, 152, 219, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pSide, seaY); ctx.lineTo(canvas.width - pSide, seaY); ctx.stroke();

    // Земля (Зеленая пунктирная)
    let landY = seaY - (hT / hH) * (seaY - fixedHeliY);
    if (landY < fixedHeliY) landY = fixedHeliY;
    ctx.strokeStyle = "#2ecc71";
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(pSide, landY); ctx.lineTo(canvas.width - pSide, landY); ctx.stroke();
    ctx.setLineDash([]);

    // 3. ОБНОВЛЕННЫЙ МИ-8 (Уменьшен в 1.5 раза, изящный)
    const hX = pSide + 10;
    ctx.fillStyle = "white";
    ctx.strokeStyle = "white";
    // Корпус
    ctx.beginPath();
    ctx.ellipse(hX, fixedHeliY, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Тонкая балка и короткий вертикальный хвост
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hX - 5, fixedHeliY); ctx.lineTo(hX - 18, fixedHeliY); 
    ctx.lineTo(hX - 18, fixedHeliY - 8); ctx.stroke();
    // Тонкие винты
    ctx.beginPath();
    ctx.moveTo(hX - 8, fixedHeliY - 3); ctx.lineTo(hX + 12, fixedHeliY - 3); // Основной
    ctx.moveTo(hX - 21, fixedHeliY - 5); ctx.lineTo(hX - 15, fixedHeliY - 5); // Хвостовой
    ctx.stroke();

    // --- ПАРАБОЛА И ТРЕУГОЛЬНИКИ БУДУТ В ШАГЕ 2 ---
    // (Пока оставляем место для логики)
    drawTemporaryParts(ctx, pSide, fixedHeliY, w, landY, dist, hH, v, g);
}

// --- БЛОК 2: ОТРИСОВКА ГРАФИКА (ФИНАЛ) ---
function drawTrajectory(dist, hH, hT, a, v, g) {
    const canvas = document.getElementById('trajCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Используем всё пространство черного квадрата
    const pSide = 25;   
    const pTop = 25;    
    const pBottom = 15; 
    const w = canvas.width - pSide * 2;
    const hArea = canvas.height - pTop - pBottom; 

    const fixedHeliY = pTop;
    const seaY = canvas.height - pBottom;
    
    // Линия моря
    ctx.strokeStyle = "rgba(52, 152, 219, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pSide, seaY); ctx.lineTo(canvas.width - pSide, seaY); ctx.stroke();

    // Линия земли (Зеленая пунктирная)
    let landY = seaY - (hT / hH) * (seaY - fixedHeliY);
    if (landY < fixedHeliY) landY = fixedHeliY;
    ctx.strokeStyle = "#2ecc71";
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(pSide, landY); ctx.lineTo(canvas.width - pSide, landY); ctx.stroke();
    ctx.setLineDash([]);

    // Мини-вертолет
    const hX = pSide + 10;
    ctx.fillStyle = "white";
    ctx.beginPath(); ctx.ellipse(hX, fixedHeliY, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = "white";
    ctx.beginPath(); ctx.moveTo(hX - 5, fixedHeliY); ctx.lineTo(hX - 18, fixedHeliY); ctx.lineTo(hX - 18, fixedHeliY - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hX - 8, fixedHeliY - 3); ctx.lineTo(hX + 12, fixedHeliY - 3); ctx.stroke();

    // Траектория "из носа"
    const sX = hX + 0;
    const sY = fixedHeliY + 0;
    ctx.strokeStyle = "#1abc9c";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    let lastX = sX, lastY = sY;
    for (let i = 0; i <= 100; i++) {
        let xReal = (i / 100) * dist;
        let drop = (g * Math.pow(xReal, 2)) / (2 * v * v) * 0.9535; // ARMA_CORRECTION
        
        let xVis = sX + (i / 100) * (w - 20);
        let yVis = sY + (drop / hH) * (seaY - fixedHeliY);

        if (yVis > landY) yVis = landY;

        if (i === 0) ctx.moveTo(sX, sY);
        else ctx.lineTo(xVis, yVis);
        lastX = xVis; lastY = yVis;
    }
    ctx.stroke();

    // МИНИ-ТРЕУГОЛЬНИКИ (Острые и параллельные)
    const triW = 5; // Половина ширины треугольника
    const triH = 15; // Высота треугольника
    
    // Синий (Ракета) - острие касается параболы
    ctx.fillStyle = "#3498db";
    ctx.beginPath();
    ctx.moveTo(lastX - triW, lastY - triH);
    ctx.lineTo(lastX + triW, lastY - triH);
    ctx.lineTo(lastX, lastY);
    ctx.fill();

    // Красный (Цель) - острие касается зеленой линии (строго под синим)
    const targetX = canvas.width - pSide - 10; // Фиксированная позиция цели справа
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.moveTo(lastX - triW, landY + triH); // Используем lastX синего треугольника для параллельности
    ctx.lineTo(lastX + triW, landY + triH);
    ctx.lineTo(lastX, landY);
    ctx.fill();

    // 6. Время полёта (TOF)
    // Формула: t = dist / v
    const tof = (dist / v).toFixed(1); // Округляем до 1 знака
    ctx.fillStyle = "rgba(26, 188, 156, 0.7)"; // Бирюзовый цвет
    ctx.font = "12px monospace";
    ctx.fillText("TOF: " + tof + " s", canvas.width - pSide - 70, 20);

}

// --- БЛОК 3: ОСНОВНОЙ РАСЧЕТ ---
window.calculateBallistics = function() {
    if (!window.pHeli || !window.pTarget) return;

    const p1 = window.pHeli.getLatLng();
    const p2 = window.pTarget.getLatLng();

    // 1. Обновляем визуальную линию на карте
    if (window.aimLine) {
        window.aimLine.setLatLngs([p1, p2]);
    }

    // 2. Поворот иконки и расчет курса
    const angle = Math.atan2(p2.lng - p1.lng, p2.lat - p1.lat) * (180 / Math.PI);
    if (window.pHeli && typeof getHeliIcon === 'function') {
        window.pHeli.setIcon(getHeliIcon(angle));
    }
    let course = Math.round(angle);
    if (course < 0) course += 360;
    document.getElementById('courseInfo').innerHTML = `Курс на цель: <b>${course}°</b>`;

    // 3. Расчет дистанции (через KX и KY из Блока 1)
    const dx = (p2.lng - p1.lng) * KX;
    const dy = (p2.lat - p1.lat) * KY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Обновляем метку с метрами над линией (если она есть)
    if (window.updateLineLabel) window.updateLineLabel(dist);

    // 4. Сбор высот и баллистика
    const hHeli = parseFloat(document.getElementById('hHeli').value) || 0;
    const hTarget = parseFloat(document.getElementById('hTarget').value) || 0;

    // Считаем падение с поправкой
    const drop = ((G_CONST * Math.pow(dist, 2)) / (2 * V_ROCKET * V_ROCKET)) * ARMA_CORRECTION;
    const y = Math.round(hHeli - drop - hTarget);

    // 5. Вывод текста в синее окошко
    document.getElementById('output').innerHTML = `
        Дистанция: ${Math.round(dist)} м<br>
        Результат: <b>${Math.abs(y)} м ${y > 0 ? 'ВЫШЕ' : 'НИЖЕ'}</b>
    `;

    // 6. Команда "художнику" отрисовать график
    drawTrajectory(dist, hHeli, hTarget, 0, V_ROCKET, G_CONST);
};

// --- БЛОК 4: УПРАВЛЕНИЕ И СОБЫТИЯ ---

// 1. Логика кнопок +/-
window.changeVal = function(id, amount) {
    const input = document.getElementById(id);
    if (input) {
        let currentVal = parseInt(input.value) || 0;
        input.value = Math.max(0, currentVal + amount);
        
        // Сразу запускаем пересчет и обновление графики
        window.calculateBallistics();
    }
};

// 2. Слежка за ручным вводом в текстовые поля
document.addEventListener('DOMContentLoaded', () => {
    ['hHeli', 'hTarget'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Реагируем на каждое нажатие клавиши
            el.addEventListener('input', () => {
                window.calculateBallistics();
            });
        }
    });

    // Делаем первый расчет при запуске программы
    setTimeout(() => {
        if (window.calculateBallistics) window.calculateBallistics();
    }, 500);
});

console.log("CAIN: Система управления готова к бою");
