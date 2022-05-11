// Example code showcasing TS; deleting everything is safe for your project.

const btnShow = document.getElementById("display") as HTMLButtonElement;
const tableBody = document.getElementById("table-body") as HTMLTableSectionElement;

/* Type declaration to match an element from the database */
type Connection = {
    id: string;
    hostname: string;
    protocol: string;
    method: string;
    date: Date;
};

btnShow.addEventListener("click", () => {
    btnShow.setAttribute("disabled", "true");
    const toServer = new XMLHttpRequest();
    toServer.open("POST", "/api/show", true);
    toServer.addEventListener("load", () => {
        displayTable(tableBody, JSON.parse(toServer.response).connections);
    });
    toServer.send();
});

function displayTable(tableBody: HTMLTableSectionElement, response: Connection[]): void {
    response.forEach(connection => {
        const tr: HTMLTableRowElement = document.createElement("tr");
        const arr_data: string[] = [connection.hostname, connection.protocol, connection.method];
        arr_data.forEach(elem => {
            const td: HTMLTableCellElement = document.createElement("td");
            td.textContent = elem;
            tr.append(td);
        });
        const tdDate: HTMLTableCellElement = document.createElement("td");
        tdDate.textContent = new Date(connection.date).toISOString();
        tr.append(tdDate);
        tableBody.append(tr);
    });
}
