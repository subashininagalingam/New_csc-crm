const amountInput = document.getElementById("amount");
const errorText = document.getElementById("amount-error");

amountInput.addEventListener("input", function () {

    if (parseFloat(amountInput.value) <= 0) {

        errorText.innerText =
            "Amount must be greater than 0";

    } else {

        errorText.innerText = "";

    }

});
/* PAYMENT MODE */

const paymentMode =
    document.getElementById("paymentMode");

/* REFERENCE INPUT */

const referenceInput =
    document.getElementById("reference");

/* INITIAL CHECK */

toggleReference();

/* MODE CHANGE */

paymentMode.addEventListener("change", toggleReference);

function toggleReference() {

    if (paymentMode.value === "UPI" ||
        paymentMode.value === "CARD") {

        referenceInput.required = true;

        referenceInput.placeholder =
            "Enter Transaction ID";

    }

    else {

        referenceInput.required = false;

        referenceInput.value = "";

        referenceInput.placeholder =
            "Not Required for Cash";

    }

}

/* ONLY LETTERS + NUMBERS */

referenceInput.addEventListener("input", function () {

    this.value =
        this.value.replace(/[^A-Za-z0-9]/g, '');

});

/* REMARKS VALIDATION */

const remarksInput =
    document.getElementById("remarks");

remarksInput.addEventListener("input", function () {

    this.value =
        this.value.replace(/[^A-Za-z ]/g, '');

});