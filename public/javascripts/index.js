const insert = document.getElementById("insert");
const show = document.getElementById("show");

insert.addEventListener("click", () => {
    $.post("/api/new-record", {comment : "Comment from client", chosen_colour: rndCol()});
})

show.addEventListener("click", () => {
    $.post("/api/show");
})

setInterval(() => {
    $.ajax({
        type: "post",
        url: "/api/send-measure",
        data: { colour: rndCol() },
        dataType: "json",
        success: function (response) {
            console.log(response);
        }
    });
},1000)

function rndCol() {
    return Math.floor(Math.random()*5+1);
}