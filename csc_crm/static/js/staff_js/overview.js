// ====== GRAPH ======
document.addEventListener("DOMContentLoaded", function () {

    const thisMonthEl = document.getElementById("week-data-this");
    const lastMonthEl = document.getElementById("week-data-last");

    if (!thisMonthEl || !lastMonthEl) return;

    let thisMonth = [];
    let lastMonth = [];

    try {
        thisMonth = JSON.parse(thisMonthEl.textContent || "[]");
        lastMonth = JSON.parse(lastMonthEl.textContent || "[]");
    } catch (e) {
        console.log("Invalid JSON data");
        return;
    }

    const x = [50, 180, 310, 440, 620];

    function getY(value) {
        return 320 - ((value / 100) * 200);
    }

    function buildPoints(data) {

        if (!Array.isArray(data)) return "";

        let points = "";

        data.forEach((value, index) => {

            let safeValue = Number(value) || 0;

            if (index >= x.length) return;

            points += `${x[index]},${getY(safeValue)} `;
        });

        return points.trim();
    }

    const blueLine = document.querySelector(".over-performance-blueline");
    const greenLine = document.querySelector(".over-performance-greenline");

    if (blueLine) {
        blueLine.setAttribute("points", buildPoints(thisMonth));
    }

    if (greenLine) {
        greenLine.setAttribute("points", buildPoints(lastMonth));
    }
});


// ====== NAVBAR ======

document.addEventListener("DOMContentLoaded", function () {

    const navToggle = document.getElementById("navToggle");
    const navTabs = document.getElementById("navTabs");

    if (!navToggle || !navTabs) return;

    let isOpen = false;

    navToggle.addEventListener("click", function (e) {
        e.stopPropagation();

        isOpen = !isOpen;

        navTabs.classList.toggle("show", isOpen);
        document.body.classList.toggle("menu-open", isOpen);
    });

    navTabs.addEventListener("click", function (e) {
        e.stopPropagation();
    });

    document.addEventListener("click", function () {
        isOpen = false;
        navTabs.classList.remove("show");
        document.body.classList.remove("menu-open");
    });

});

// ==================== STAFF ADDED SUCCESS MESSAGE HIDE ===========================

document.addEventListener('DOMContentLoaded', () => {

    const alerts = document.querySelectorAll('.alert');

    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.transition = 'opacity 0.5s ease';
            alert.style.opacity = '0';

            setTimeout(() => {
                alert.remove();
            }, 500);

        }, 3000);
    });

});