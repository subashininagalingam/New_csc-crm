
const csrftoken = "{{ csrf_token }}";

// ---------- helpers ----------

function showPopup(message, isError = false) {
    Swal.fire({
        icon: isError ? "error" : "success",
        title: isError ? "Failed" : "Success",
        text: message,
        timer: 2000,
        showConfirmButton: false
    });
}

function showLoading(title) {
    Swal.fire({
        icon: "info",
        title: title,
        text: "Please wait...",
        allowOutsideClick: false,
        showConfirmButton: false
    });
}

function sendEmailAll() {

    // let msg = document.getElementById("successMessage");

    //msg.classList.remove("d-none");
    //msg.classList.remove("alert-danger");
    //msg.classList.add("alert-success");

    Swal.fire({
        icon: "info",
        title: "Sending Emails",
        text: "Please wait...",
        allowOutsideClick: false,
        showConfirmButton: false
    });

    fetch("/api/send-email-all/")

        .then(response => response.json())

        .then(data => {

            //msg.classList.remove("d-none");
            //msg.classList.remove("alert-danger");
            //msg.classList.add("alert-success");

            Swal.close();

            showPopup(data.message);

            //setTimeout(() => {
            //  msg.classList.add("d-none");
            // }, 1000);

        })

        .catch(error => {

            // msg.classList.remove("d-none");
            // msg.classList.remove("alert-success");
            // msg.classList.add("alert-danger");

            showPopup(
                "❌ Email Sending Failed",
                true
            );

            //setTimeout(() => {
            //  msg.classList.add("d-none");
            //}, 1000);

        });

}

function sendSMSAll() {

    // let msg = document.getElementById("successMessage");

    //msg.classList.remove("d-none");
    //msg.classList.remove("alert-danger");
    //msg.classList.add("alert-success");

    Swal.fire({
        icon: "info",
        title: "Sending SMS",
        text: "Please wait...",
        allowOutsideClick: false,
        showConfirmButton: false
    });

    fetch("/api/send-sms-all/")

        .then(response => response.json())

        .then(data => {

            //msg.classList.remove("d-none");
            //msg.classList.remove("alert-danger");
            //msg.classList.add("alert-success");

            Swal.close();

            showPopup(data.message);

            //setTimeout(() => {
            //    msg.classList.add("d-none");
            // }, 1000);

        })

        .catch(error => {

            //msg.classList.remove("d-none");
            //msg.classList.remove("alert-success");
            //msg.classList.add("alert-danger");

            showPopup(
                "❌ SMS Sending Failed",
                true
            );
            // setTimeout(() => {
            //   msg.classList.add("d-none");
            //}, 1000);

        });

}

function sendMonthlyReport() {

    //let msg = document.getElementById("successMessage");

    // msg.classList.remove("d-none");
    //msg.classList.remove("alert-danger");
    //msg.classList.add("alert-success");

    Swal.fire({
        icon: "info",
        title: "Generating Monthly Report",
        text: "Please wait...",
        allowOutsideClick: false,
        showConfirmButton: false
    });

    fetch("/api/send-monthly-report/")

        .then(response => response.json())

        .then(data => {

            // msg.classList.remove("d-none");
            // msg.classList.remove("alert-danger");
            // msg.classList.add("alert-success");

            Swal.close();

            showPopup(data.message);
            // setTimeout(() => {
            //   msg.classList.add("d-none");
            // }, 1000);

        })

        .catch(error => {

            //msg.classList.remove("d-none");
            //msg.classList.remove("alert-success");
            //msg.classList.add("alert-danger");

            showPopup(
                "❌ Monthly Report Sending Failed",
                true
            );

            // setTimeout(() => {
            //   msg.classList.add("d-none");
            //}, 1000);

        });

}

document.querySelectorAll(".mail-btn").forEach(button => {

    button.addEventListener("click", function (e) {

        e.preventDefault();

        //let msg = document.getElementById("successMessage");

        // msg.classList.remove("d-none");
        // msg.classList.remove("alert-danger");
        // msg.classList.add("alert-success");

        if (this.href.includes("send_sms")) {

            Swal.fire({
                icon: "info",
                title: "Sending SMS",
                text: "Please wait...",
                allowOutsideClick: false,
                showConfirmButton: false
            });

        } else {

            Swal.fire({
                icon: "info",
                title: "Sending Email",
                text: "Please wait...",
                allowOutsideClick: false,
                showConfirmButton: false
            });
        }

        fetch(this.href)

            .then(response => response.json())

            .then(data => {

                // msg.classList.remove("d-none");
                // msg.classList.remove("alert-danger");
                //msg.classList.add("alert-success");
                Swal.close();

                showPopup(data.message);

                //setTimeout(() => {
                //    msg.classList.add("d-none");
                //}, 1000);

            })

            .catch(error => {

                // msg.classList.remove("d-none");
                // msg.classList.remove("alert-success");
                // msg.classList.add("alert-danger");

                showPopup(
                    "❌ Notification Sending Failed",
                    true
                );

                setTimeout(() => {
                    msg.classList.add("d-none");
                }, 1000);

            });

    });

});

// ---------- last updated time ----------

document.getElementById("lastUpdatedTime").textContent =
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ---------- per-row SMS / Email buttons ----------

document.querySelectorAll(".ajax-action-btn").forEach(function (button) {

    button.addEventListener("click", function (e) {

        e.preventDefault();

        showLoading(this.dataset.type === "sms" ? "Sending SMS" : "Sending Email");

        fetch(this.href)
            .then(response => response.json())
            .then(data => {
                Swal.close();
                showPopup(data.message);
            })
            .catch(() => {
                Swal.close();
                showPopup("❌ Notification Sending Failed", true);
            });

    });

});

// ---------- select all (per section) ----------

document.querySelectorAll(".select-all-checkbox").forEach(function (checkbox) {

    checkbox.addEventListener("change", function () {

        const section = document.getElementById(this.dataset.target);

        section.querySelectorAll(".row-checkbox").forEach(function (rowCheckbox) {
            rowCheckbox.checked = checkbox.checked;
        });

    });

});

// ---------- bulk send to selected rows in a section ----------

function sendSectionNotification(sectionId, type) {

    const section = document.getElementById(sectionId);

    const ids = Array.from(
        section.querySelectorAll(".row-checkbox:checked")
    ).map(cb => parseInt(cb.dataset.id, 10));

    if (ids.length === 0) {
        showPopup("Please select at least one student", true);
        return;
    }

    showLoading(type === "sms" ? "Sending SMS" : "Sending Emails");

    fetch("/api/send-bulk-notification/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken
        },
        body: JSON.stringify({ type: type, enrollment_ids: ids })
    })
        .then(response => response.json())
        .then(data => {

            Swal.close();

            // Clear selected checkboxes
            section.querySelectorAll(".row-checkbox:checked").forEach(cb => {
                cb.checked = false;
            });

            // Clear Select All checkbox
            const selectAll = section.querySelector(".select-all-checkbox");
            if (selectAll) {
                selectAll.checked = false;
            }

            showPopup(data.message);

        })

        .catch(() => {
            Swal.close();
            showPopup("❌ Notification Sending Failed", true);
        });

}

// ---------- export dropdown ----------

function toggleExportMenu(button) {

    const menu = button.nextElementSibling;

    document.querySelectorAll(".export-menu").forEach(function (otherMenu) {
        if (otherMenu !== menu) otherMenu.classList.remove("open");
    });

    menu.classList.toggle("open");

}

document.addEventListener("click", function (e) {
    if (!e.target.closest(".alert-section-actions")) {
        document.querySelectorAll(".export-menu").forEach(m => m.classList.remove("open"));
    }
});

// ---------- pagination (per section) ----------

const PAGE_SIZE = 3;

function setupPagination(sectionId, colorClass) {

    const section = document.getElementById(sectionId);
    const rows = Array.from(section.querySelectorAll("tbody tr.data-row"));
    const footerCount = section.querySelector(".footer-count");
    const pagerEl = section.querySelector(".pager");

    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    let currentPage = 1;

    function renderPage() {

        const start = (currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;

        rows.forEach(function (row, index) {
            row.style.display = (index >= start && index < end) ? "" : "none";
        });

        if (total === 0) {
            footerCount.textContent = "Showing 0 of 0 students";
        } else {
            footerCount.textContent =
                `Showing ${start + 1} to ${Math.min(end, total)} of ${total} students`;
        }

        renderPager();

    }

    function renderPager() {

        pagerEl.innerHTML = "";

        const prevBtn = document.createElement("button");
        prevBtn.innerHTML = '<i class="bi bi-chevron-left"></i>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener("click", function () {
            if (currentPage > 1) { currentPage--; renderPage(); }
        });
        pagerEl.appendChild(prevBtn);

        for (let page = 1; page <= totalPages; page++) {
            const pageBtn = document.createElement("button");
            pageBtn.textContent = page;
            if (page === currentPage) pageBtn.classList.add("active", colorClass);
            pageBtn.addEventListener("click", function () {
                currentPage = page;
                renderPage();
            });
            pagerEl.appendChild(pageBtn);
        }

        const nextBtn = document.createElement("button");
        nextBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener("click", function () {
            if (currentPage < totalPages) { currentPage++; renderPage(); }
        });
        pagerEl.appendChild(nextBtn);

    }

    renderPage();

}

setupPagination("criticalSection", "critical");
setupPagination("warningSection", "warning");

// ---------- filters ----------

document.getElementById("clearFilters").addEventListener("click", function () {
    window.location.href = window.location.pathname;
});