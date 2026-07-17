const buttons = document.querySelectorAll(".tab-button");
    const tabs = document.querySelectorAll(".tab-content");

    buttons.forEach(button => {
        button.addEventListener("click", () => {

            buttons.forEach(btn => btn.classList.remove("tab-active"));
            button.classList.add("tab-active");

            tabs.forEach(tab => tab.classList.remove("active"));

            const target = button.getAttribute("data-tab");
            document.getElementById("tab-" + target).classList.add("active");
        });
    });
 function toggleNote(el) {
    el.classList.toggle("expanded");
}