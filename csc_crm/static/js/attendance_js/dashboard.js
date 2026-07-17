let timeout = null;

const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", function () {

    console.log("Typing:", this.value);

    clearTimeout(timeout);

    const query = this.value;

    timeout = setTimeout(() => {
        liveSearch(query);
    }, 300);
});


async function liveSearch(query) {

    const batchCard = document.getElementById("batchDetailCard");
    const batchList = document.getElementById("batchList");

    if (!query.trim()) {

        document.getElementById("dashboardTitle").innerText =
            "Overall Summary";

        batchCard.style.display = "none";
        batchList.innerHTML = "";

        const res = await fetch('/api/dashboard-api/');
        const data = await res.json();

        document.getElementById("totalCount").innerText = data.total;
        document.getElementById("presentCount").innerText = data.present;
        document.getElementById("absentCount").innerText = data.absent;
        document.getElementById("lateCount").innerText = data.late;

        return;
    }

    const res = await fetch(
        `/api/dashboard-api/?search=${encodeURIComponent(query)}`
    );

    const data = await res.json();

    document.getElementById("dashboardTitle").innerText =
        "Filtered Results";

    document.getElementById("totalCount").innerText = data.total;
    document.getElementById("presentCount").innerText = data.present;
    document.getElementById("absentCount").innerText = data.absent;
    document.getElementById("lateCount").innerText = data.late;

    batchList.innerHTML = "";

    data.batches.forEach(item => {

        batchList.innerHTML += `
            <div class="detail-row">
                <span class="label">Course :</span>
                <span>${item.course}</span>
            </div>

            <div class="detail-row">
                <span class="label">Batch :</span>
                <span>${item.batch}</span>
            </div>

            <div class="detail-row">
                <span class="label">Trainer :</span>
                <span>${item.trainer}</span>
            </div>

            <div class="detail-row">
                <span class="label">Timing :</span>
                 <span>${item.session} (${item.timing})</span>
            </div>

            <hr>
        `;
    });

    batchCard.style.display = "block";
}