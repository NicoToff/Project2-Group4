"use strict";
const btnShow = document.getElementById("display");
const tableBody = document.getElementById("table-body");
btnShow.addEventListener("click", () => {
    btnShow.setAttribute("disabled", "true");
    const toServer = new XMLHttpRequest();
    toServer.open("POST", "/api/show", true);
    toServer.addEventListener("load", () => {
        displayTable(tableBody, JSON.parse(toServer.response).connections);
    });
    toServer.send();
});
function displayTable(tableBody, response) {
    response.forEach(connection => {
        const tr = document.createElement("tr");
        const arr_data = [connection.hostname, connection.protocol, connection.method];
        arr_data.forEach(elem => {
            const td = document.createElement("td");
            td.textContent = elem;
            tr.append(td);
        });
        const tdDate = document.createElement("td");
        tdDate.textContent = new Date(connection.date).toISOString();
        tr.append(tdDate);
        tableBody.append(tr);
    });
}
