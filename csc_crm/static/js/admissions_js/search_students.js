const form = document.getElementById("filterForm");
const error = document.getElementById("filter-error");


// FILTER VALIDATION
form.addEventListener("submit", function (e) {

    let hasValue = false;

    form.querySelectorAll("input, select").forEach(field => {

        if (field.value.trim() !== "") {
            hasValue = true;
        }

    });

    if (!hasValue) {

        e.preventDefault();

        error.innerText = "Choose at least one filter";
        error.style.color = "red";

    } else {

        error.innerText = "";

    }

});


// RESET WITHOUT RELOAD
document.getElementById("resetBtn").addEventListener("click", function () {

    // CLEAR INPUTS
    form.querySelectorAll("input").forEach(input => {
        input.value = "";
    });

    // RESET SELECTS
    form.querySelectorAll("select").forEach(select => {
        select.selectedIndex = 0;
    });

    // CLEAR ERROR
    error.innerText = "";

    // REMOVE URL PARAMS
    window.history.replaceState({}, document.title, window.location.pathname);

    // FETCH ORIGINAL PAGE
    fetch(window.location.pathname)
        .then(response => response.text())
        .then(data => {

            let parser = new DOMParser();

            let doc = parser.parseFromString(data, "text/html");

            // TABLE RESET
            document.querySelector(".table-wrapper").innerHTML =
                doc.querySelector(".table-wrapper").innerHTML;

            // RESULT INFO RESET
            document.querySelector(".result-info").innerHTML =
                doc.querySelector(".result-info").innerHTML;

        });

});