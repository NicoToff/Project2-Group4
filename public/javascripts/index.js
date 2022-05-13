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
},1000)