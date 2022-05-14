const insert = document.getElementById("insert");
const end = document.getElementById("end");
// prettier-ignore
const lorem = `Lorem ipsum dolor sit amet consectetur adipisicing elit Inventore nemo ipsam architecto similique quo praesentium Magnam aut quibusdam maiores voluptate provident quos perspiciatis fugiat consectetur nobis molestias aliquid optio nemo?`.split(" ")
insert.addEventListener("click", () => {
    $.post("/api/new-sequence", {
        comment: lorem[Math.floor(Math.random() * lorem.length)],
        chosen_colour: rndCol(),
    });
});
const [WHITE, BLUE, BLACK, RED, GREEN, ANOMALY]  = [0, 1, 2, 3, 4, 5];

let recording = false;

end.addEventListener("click", () => {
    $.post("/api/end-sequence");
});

setInterval(() => {
    $.ajax({
        type: "post",
        url: "/api/fetch-data",
        dataType: "json",
        success: function (response) {
            recording = response.recording;
            if(recording) {
                data.datasets[0].data = [...response.colourCounters];
                myChart.update();
            }
        },
    });
}, 1000);

const labels = [
    'White',
    'Blue',
    'Black',
    'Red',
    'Green',
    'Anomalies',
  ];
  const data = {
    labels: labels,
    datasets: [{
      label: 'My First Dataset',
      data: [0, 0, 0, 0, 0, 0],
      backgroundColor: [
        'rgba(255, 255, 255, 0.8)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(55, 55, 55, 0.2)',
        'rgba(255, 99, 132, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
      ],
      borderColor: [
        'rgb(200, 200, 200)',
        'rgb(54, 162, 235)',
        'rgb(25, 25, 25)',
        'rgb(255, 99, 132)',
        'rgb(75, 192, 192)',      
        'rgb(153, 102, 255)',
      ],
      borderWidth: 2,
    }]
  };
  
  
  
  const config = {
    type: 'bar',
    data: data,
    options: {
      indexAxis: 'y',
    },
  };
  
    const myChart = new Chart(
      document.getElementById('myChart'),
      config
    );

function rndCol() {
    return Math.floor(Math.random() * 5);
}
