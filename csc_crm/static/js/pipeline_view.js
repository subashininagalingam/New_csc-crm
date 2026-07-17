document.addEventListener("DOMContentLoaded", function () {

    // ELEMENTS

    const form = document.getElementById("filterForm");
    const pipelineData = document.getElementById("pipelineData");

    const searchBtn = document.getElementById("searchBtn");
    const clearBtn = document.getElementById("clearBtn");

    const staffSelect = document.getElementById("staffSelect");
    const searchInput = document.getElementById("searchInput");

    if (!form || !pipelineData) return;


    // EXPORT URL UPDATE

    function updateExportUrl() {

        const exportBtn = document.getElementById("exportBtn");

        if (!exportBtn) return;

        const baseUrl = exportBtn.dataset.url;

        const params = new URLSearchParams({
            search: searchInput.value,
            assigned_to: staffSelect.value
        });

        exportBtn.href = `${baseUrl}?${params.toString()}`;
    }

    // NO DATA MESSAGE
    function showNoDataMessage() {
        pipelineData.innerHTML = `
            <div class="no-search-results">
                No leads available for this filter.
            </div>
        `;
    }


    // AJAX LOAD DATA

    async function loadData() {

        const formData = new FormData(form);

        const params = new URLSearchParams(formData);

        try {

            const response = await fetch(`?${params.toString()}`, {
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            });

            const html = await response.text();

            const parser = new DOMParser();

            const doc = parser.parseFromString(html, "text/html");

            const newData = doc.getElementById("pipelineData");

            if (newData) {

                pipelineData.innerHTML = newData.innerHTML;

                updateExportUrl();

                bindKanban();
            }

            history.replaceState(
                null,
                "",
                "?" + params.toString()
            );

        } catch (error) {

            console.log("AJAX ERROR:", error);
        }
    }


    // SEARCH BUTTON

    searchBtn.addEventListener("click", function (e) {

        e.preventDefault();

        updateExportUrl();

        loadData();
    });


    // STAFF FILTER

    staffSelect.addEventListener("change", function () {

        updateExportUrl();

        loadData();
    });


    // CLEAR BUTTON

    clearBtn.addEventListener("click", function (e) {

        e.preventDefault();

        searchInput.value = "";
        staffSelect.value = "";

        updateExportUrl();

        loadData();

        history.replaceState(
            null,
            "",
            window.location.pathname
        );
    });


    // KANBAN SCROLL
    

    function bindKanban() {

        function getKanban() {

            return document.getElementById("kanbanContainer");
        }

        window.moveLeft = function () {

            const kanban = getKanban();

            if (!kanban) return;

            kanban.scrollBy({
                left: -320,
                behavior: "smooth"
            });
        };

        window.moveRight = function () {

            const kanban = getKanban();

            if (!kanban) return;

            kanban.scrollBy({
                left: 320,
                behavior: "smooth"
            });
        };
    }



    bindKanban();

    updateExportUrl();

});


// Pagination

document.addEventListener("click", function(e){

    const link = e.target.closest(".ajax-page");

    if(!link) return;

    e.preventDefault();

    fetch(link.href,{
        headers:{
            "X-Requested-With":"XMLHttpRequest"
        }
    })
    .then(res => res.text())
    .then(html => {

        const parser = new DOMParser();
        const doc = parser.parseFromString(html,"text/html");

        document.getElementById("pipelineData").innerHTML =
            doc.getElementById("pipelineData").innerHTML;

        history.replaceState(null,"",link.href);
    });
});