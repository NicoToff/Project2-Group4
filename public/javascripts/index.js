document.querySelectorAll(".navbar-nav a")[0].classList.add("active");

// #region State management
/* If a sequence is running, we fetch it's ID to display it */
$.ajax({
    type: "post",
    url: "/",
    dataType: "json",
    success: function (response) {
        if (response.currentSequenceId != null) {
            data.datasets[0].label = `Sequence n°${response.currentSequenceId}`;
            myChart.update();
        }
    },
});
// #endregion

// #region Start & End Buttons
const start = document.getElementById("start");
const chosenColourBox = document.getElementById("chosen-colour");
let currentColour;
// prettier-ignore
const lorem = `Lorem ipsum dolor sit amet consectetur adipisicing elit Inventore nemo ipsam architecto similique quo praesentium Magnam aut quibusdam maiores voluptate provident quos perspiciatis fugiat consectetur nobis molestias aliquid optio nemo?`.split(" ");
start.addEventListener("click", () => {
    $.ajax({
        type: "post",
        url: "/api/new-sequence",
        data: {
            comment: lorem[Math.floor(Math.random() * lorem.length)],
            chosen_colour: rndCol(),
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
    $.post("/api/end-sequence");
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

const statusBox = document.getElementById("status");
const statusText = document.getElementById("status-text");
const chosenColourCounter = document.getElementById("chosen-colour-counter");
setInterval(() => {
    $.ajax({
        type: "post",
        url: "/api/fetch-data",
        dataType: "json",
        success: function (response) {
            data.datasets[0].data = [...response.colourCounters];
            chosenColourCounter.textContent = response.colourCounters[currentColour];
            myChart.update();
            if (response.recording) {
                statusBox.classList.remove("bg-danger", "bg-secondary");
                statusBox.classList.add("bg-success");
                statusText.textContent = "Recording";
            } else {
                statusBox.classList.remove("bg-success", "bg-secondary");
                statusBox.classList.add("bg-danger");
                statusText.textContent = "Stopped";
            }
        },
    });
}, 1000);

function rndCol() {
    return Math.floor(Math.random() * 5);
}

function colourTheBox(box, colour) {
    box.classList.remove(
        "btn-secondary",
        "btn-warning",
        "btn-light",
        "btn-danger",
        "btn-success",
        "btn-primary",
        "btn-dark"
    );
    //  TODO OOO
}
