const insert = document.getElementById("insert");
const end = document.getElementById("end");
const lorem = `Lorem ipsum dolor sit amet consectetur adipisicing elit Inventore nemo ipsam architecto similique quo praesentium Magnam aut quibusdam maiores voluptate provident quos perspiciatis fugiat consectetur nobis molestias aliquid optio nemo?`.split(" ")
insert.addEventListener("click", () => {
    $.post("/api/new-sequence", {comment : lorem[Math.floor(Math.random()*lorem.length)], chosen_colour: rndCol()});
})

end.addEventListener("click", () => {
    $.post("/api/end-sequence");
})

setInterval(() => {
    $.ajax({
        type: "post",
        url: "/api/send-measure",
        data: { colour: rndCol() },
        dataType: "json",
        success: function (response) {
            console.log((JSON.parse(response)).message);
        }
    });
},1000)

function rndCol() {
    return Math.floor(Math.random()*5+1);
}