function validateFormat() {

    const format = document.getElementById("format");
    const error = document.getElementById("error-msg");

    if (!format.value) {

        error.innerText =
            "Please select a format (Excel or PDF)";
        error.style.color = "red";

        return false;
    }

    error.innerText = "";

    setTimeout(() => {
        format.value = "";
    }, 100);

    return true;
}



document.addEventListener("DOMContentLoaded", function () {

    const modal = document.getElementById("attendanceModal");
    const closeBtn = document.getElementById("closeModal");

    closeBtn.onclick = function () {
        modal.style.display = "none";
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    document.querySelectorAll(".student-detail-btn").forEach(btn => {

        btn.addEventListener("click", function (e) {
            console.log("CLICK WORKING");

            e.preventDefault();

            let studentId = this.dataset.id;
            console.log("Student ID =", studentId);

            fetch(`/api/student-attendance-summary/${studentId}/`)
                .then(res => res.json())
                .then(data => {

                    document.getElementById("studentName").innerText =
                        data.student_name;

                    const photo = document.getElementById("studentPhoto");
                    const avatar = document.getElementById("studentAvatar");

                    if (data.photo_url) {

                        photo.src = data.photo_url;
                        photo.style.display = "block";

                        avatar.style.display = "none";
                    }
                    else {

                        photo.style.display = "none";
                        avatar.style.display = "flex";

                        const names = data.student_name.trim().split(" ");

                        let initials = "";

                        if (names.length >= 2) {
                            initials = names[0][0] + names[names.length - 1][0];
                        }
                        else {
                            initials = names[0][0];
                        }

                        avatar.innerText = initials.toUpperCase();
                    }

                    document.getElementById("studentInfo").innerText =
                        data.course + " • " + data.batch + "(" + data.timing + ")";

                    document.getElementById("presentCount").innerText =
                        data.present;

                    document.getElementById("absentCount").innerText =
                        data.absent;

                    document.getElementById("lateCount").innerText =
                        data.late;

                    document.getElementById("attendancePercent").innerText =
                        data.percentage;

                    let timeline = document.getElementById("timeline");
                    timeline.innerHTML = "";

                    data.timeline.forEach(item => {

                        timeline.innerHTML += `
                        <div class="timeline-item">
                            <strong>${item.date}</strong> -
                            ${item.status}
                        </div>
                    `;
                    });

                    modal.style.display = "flex";

                })
                .catch(err => {
                    console.error(err);
                    alert("Error loading attendance data");
                });

        });

    });

});

function getAvatarColor(index) {

    const colors = [
        '#2563eb',
        '#16a34a',
        '#dc2626',
        '#9333ea',
        '#ea580c',
        '#0891b2',
        '#ca8a04',
        '#be123c'
    ];

    return colors[index % colors.length];
}

function applyAvatarColors() {

    document.querySelectorAll('.student-avatar').forEach((el, index) => {
        el.style.backgroundColor = getAvatarColor(index);
    });

}

document.addEventListener("DOMContentLoaded", function () {

    applyAvatarColors();


});

document.addEventListener("DOMContentLoaded", function () {

    const today = new Date().toISOString().split('T')[0];

    document.querySelectorAll('input[type="date"], input[type="time"]')
        .forEach(input => {

            // Open picker
            input.addEventListener("click", function () {

                if (this.showPicker) {
                    this.showPicker();
                }

            });

        });

    const fromDate = document.querySelector('input[name="from_date"]');
    const toDate = document.querySelector('input[name="to_date"]');
    const error = document.getElementById("date-error");

    // Prevent future date selection
    fromDate.max = today;
    toDate.max = today;

    function validateDate() {

        if (
            (fromDate.value && fromDate.value > today) ||
            (toDate.value && toDate.value > today)
        ) {

            error.innerText = "Future dates are not allowed";

        } else {

            error.innerText = "";

        }

    }

    fromDate.addEventListener("input", validateDate);
    toDate.addEventListener("input", validateDate);

    fromDate.addEventListener("change", validateDate);
    toDate.addEventListener("change", validateDate);

});

// RESET
document.getElementById("resetBtn").addEventListener("click", function () {

    // Clear inputs
    document.querySelectorAll("#filterForm input").forEach(input => {
        input.value = "";
    });

    // Reset selects
    document.querySelectorAll("#filterForm select").forEach(select => {
        select.selectedIndex = 0;
    });

    // Clear error
    document.getElementById("search-error").innerText = "";

    // Clear hidden download inputs
    document.querySelectorAll('.download-form input[type="hidden"]')
        .forEach(input => {
            input.value = "";
        });

    // Show all rows again
    document.querySelectorAll(".attendance-row")
        .forEach(row => {
            row.style.display = "";
        });

});


function applyFilters() {

    const search =
        document.querySelector(
            'input[name="search"]'
        ).value.toLowerCase();

    const fromDate =
        document.querySelector(
            'input[name="from_date"]'
        ).value;

    const toDate =
        document.querySelector(
            'input[name="to_date"]'
        ).value;

    const status =
        document.querySelector(
            'select[name="status"]'
        ).value.toLowerCase();

    const batch =
        document.querySelector(
            'select[name="batch"]'
        ).value;

    const course =
        document.querySelector(
            'select[name="course_name"]'
        ).value.toLowerCase();

    // 👇 INGA PASTE PANNU

    document.querySelector('.download-form input[name="search"]').value =
        document.querySelector('input[name="search"]').value;

    document.querySelector('.download-form input[name="from_date"]').value =
        document.querySelector('input[name="from_date"]').value;

    document.querySelector('.download-form input[name="to_date"]').value =
        document.querySelector('input[name="to_date"]').value;

    document.querySelector('.download-form input[name="status"]').value =
        document.querySelector('select[name="status"]').value;

    document.querySelector('.download-form input[name="batch"]').value =
        document.querySelector('select[name="batch"]').value;

    document.querySelector('.download-form input[name="course_name"]').value =
        document.querySelector('select[name="course_name"]').value;


    document
        .querySelectorAll(".attendance-row")
        .forEach(row => {

            const rowDate = row.dataset.date;

            const show =

                (search === "" ||
                    row.dataset.name.includes(search) ||
                    row.dataset.id.includes(search))

                &&

                (status === "" ||
                    row.dataset.status === status)

                &&

                (batch === "" ||
                    row.dataset.batch === batch)

                &&

                (course === "" ||
                    row.dataset.course === course)

                &&

                (fromDate === "" ||
                    rowDate >= fromDate)

                &&

                (toDate === "" ||
                    rowDate <= toDate);

            row.style.display =
                show ? "" : "none";

        });
}

document.addEventListener(
    "DOMContentLoaded",
    function () {

        document
            .querySelectorAll(
                '#filterForm input, #filterForm select'
            )
            .forEach(el => {

                el.addEventListener(
                    "keyup",
                    applyFilters
                );

                el.addEventListener(
                    "change",
                    applyFilters
                );

            });

    }
);
