const insert = document.getElementById("insert");
const show = document.getElementById("show");

insert.addEventListener("click", () => {
    $.post("/api/insert");
})

show.addEventListener("click", () => {
    $.post("/api/show");
})

setInterval(() => {
    $.ajax({
        type: "post",
        url: "/",
        data: {test: "Hello, I'm a spammy client."},
        dataType: "json",
        success: function (response) {
            console.log(JSON.parse(response).hello);
        }
    });
},10000)