document.querySelectorAll(".navbar-nav a")[0].classList.add("active");

const optSelectColor = document.getElementById("colour-select");
const txtComment = document.getElementById("comment");
const chosenColourBox = document.getElementById("chosen-colour");
const lblDbOK = document.getElementById("db-ok-badge");
let currentColour;
// #region State management
/* Reset select box and comments */
optSelectColor.value = "-";
txtComment.value = "";

/* If a sequence is running, we fetch its ID to display it */
$.ajax({
    type: "post",
    url: "/dashboard",
    dataType: "json",
    success: function (response) {
        if (response.currentSequenceId != null) {
            data.datasets[0].label = `Sequence n°${response.currentSequenceId}`;
            myChart.update();
            currentColour = response.currentColour;
            colourTheBox(chosenColourBox, currentColour);
        }
    },
});
// #endregion

// #region Start & End Buttons
const start = document.getElementById("start");

start.addEventListener("click", () => {
    const clientChosenColour = toColorCode(optSelectColor.value);
    $.ajax({
        type: "post",
        url: "/dashboard/api/new-sequence",
        data: {
            comment: txtComment.value,
            chosen_colour: clientChosenColour,
        },
        dataType: "json",
        success: function (response) {
            data.datasets[0].label = `Sequence n°${response.currentSequenceId}`;
            myChart.update();
            currentColour = response.currentColour;
            colourTheBox(chosenColourBox, currentColour);
        },
    });
});

const end = document.getElementById("end");
end.addEventListener("click", () => {
    $.post("/dashboard/api/end-sequence");
    optSelectColor.value = "-";
    txtComment.value = "";
});
// #endregion

// #region BarGraph
const barGraph = document.getElementById("myChart");
const labels = ["White", "Blue", "Black", "Red", "Green", "Anomalies"];

const data = {
    labels: labels,
    datasets: [
        {
            label: "No recording",
            data: [0, 0, 0, 0, 0, 0],
            backgroundColor: [
                "rgba(255, 255, 255, 0.8)",
                "rgba(54, 162, 235, 0.2)",
                "rgba(55, 55, 55, 0.2)",
                "rgba(255, 99, 132, 0.2)",
                "rgba(0, 128, 0, 0.2)",
                "rgba(153, 102, 255, 0.2)",
            ],
            borderColor: [
                "rgb(200, 200, 200)",
                "rgb(54, 162, 235)",
                "rgb(25, 25, 25)",
                "rgb(255, 99, 132)",
                "rgb(0, 128, 0)",
                "rgb(153, 102, 255)",
            ],
            borderWidth: 2,
        },
    ],
};

const config = {
    type: "bar",
    data: data,
    options: {
        indexAxis: "y",
    },
};

const myChart = new Chart(barGraph, config);
// #endregion

// #region Dynamic Content (AJAX)
const lblStatusBox = document.getElementById("status");
const lblStatusText = document.getElementById("status-text");
const lblChosenColourCounter = document.getElementById("chosen-colour-counter");
setInterval(() => {
    $.ajax({
        type: "post",
        url: "/dashboard/api/fetch-data",
        dataType: "json",
        success: function (response) {
            data.datasets[0].data = [...response.colourCounters];
            lblChosenColourCounter.textContent = response.colourCounters[currentColour] ?? "--";
            if (response.dbPingOK === true) {
                lblDbOK.textContent = "DB reachable";
                lblDbOK.classList.remove("bg-danger");
                lblDbOK.classList.add("bg-success");
            } else {
                lblDbOK.textContent = "DB unreachable";
                lblDbOK.classList.remove("bg-success");
                lblDbOK.classList.add("bg-danger");
            }
            myChart.update();
            if (response.recording) {
                lblStatusBox.classList.remove("bg-danger", "bg-secondary");
                lblStatusBox.classList.add("bg-success");
                lblStatusText.textContent = "On";
            } else {
                lblStatusBox.classList.remove("bg-success", "bg-secondary");
                lblStatusBox.classList.add("bg-danger");
                lblStatusText.textContent = "Off";
            }
        },
    });
}, 1000);
// #endregion

// #region Custom functions
function colourTheBox(box, colour) {
    box.classList.remove(
        "bg-secondary",
        "bg-warning",
        "bg-light",
        "bg-danger",
        "bg-success",
        "bg-primary",
        "bg-dark"
    );
    const [WHITE, BLUE, BLACK, RED, GREEN] = [0, 1, 2, 3, 4];
    let bootstrapBgClass = "bg-";
    // prettier-ignore
    switch (colour) {
        case WHITE: bootstrapBgClass += "light";   break;
        case BLUE:  bootstrapBgClass += "primary"; break;
        case BLACK: bootstrapBgClass += "dark";    break;
        case RED:   bootstrapBgClass += "danger";  break;
        case GREEN: bootstrapBgClass += "success"; break;
    }
    box.classList.add(bootstrapBgClass);
}
/**
 * @returns 0 to 4
 */
/*function rndCol() {
    return Math.floor(Math.random() * 5);
}*/

/**
 * Returns a number base on the input from the html file.
 * @param {string} option
 * @returns The colour code (0 to 4)
 */

function toColorCode(option) {
    switch (option) {
        case "-":
            return null;
        case "White":
            return 0;
        case "Blue":
            return 1;
        case "Black":
            return 2;
        case "Red":
            return 3;
        case "Green":
            return 4;
    }
}

// #endregion
