"use strict";
const btnSwap = document.querySelector("#swap-display");
const displayArea = document.querySelector("#display-area");
const main = document.querySelector("main");
let displayingAsList = false;

btnSwap.addEventListener("click", () => {
    if (!displayingAsList) {
        displayingAsList = true;
        btnSwap.textContent = "Color blocks";

        const newDiv = document.createElement("div");
        // #region New Table
        const newTable = document.createElement("table");
        newTable.classList.add("table", "table-responsive", "table-striped", "text-center");
        const newThead = document.createElement("thead");
        newThead.classList.add("table-info");
        const firstTr = document.createElement("tr");
        const [thId, thTime, thColour] = [
            document.createElement("th"),
            document.createElement("th"),
            document.createElement("th"),
        ];
        thId.textContent = "Id";
        thTime.textContent = "Timestamp";
        thColour.textContent = "Colour";
        firstTr.append(thId, thTime, thColour);
        newThead.append(firstTr);
        newTable.append(newThead);
        const newTbody = document.createElement("tbody");
        newTable.append(newTbody);
        // #endregion

        const colorCards = document.querySelectorAll("#display-area div.btn");
        colorCards.forEach(cc => {
            const id = cc.dataset.id;
            const timestamp = cc.title;
            const colour = cc.dataset.colour;
            const [tdId, tdTime, tdColour] = [
                document.createElement("td"),
                document.createElement("td"),
                document.createElement("td"),
            ];
            tdId.textContent = id;
            tdTime.textContent = timestamp;
            tdColour.classList.add(`table-${colour}`);
            const tr = document.createElement("tr");
            tr.append(tdId, tdTime, tdColour);
            newTbody.append(tr);
        });
        displayArea.remove();
        main.append(newTable);
    } else {
        location.reload();
    }
});
