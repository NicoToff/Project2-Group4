"use strict";
const btnSwap = document.querySelector("#swap-display");
const displayArea = document.querySelector("#display-area");
const main = document.querySelector("main");
let displayingAsList = false;

btnSwap.addEventListener("click", () => {
    if (!displayingAsList) {
        displayingAsList = true;
        btnSwap.textContent = "Color blocks";

        // #region New Table
        const newTable = document.createElement("table");
        newTable.classList.add("table", "table-responsive", "table-striped", "text-center");
        const newThead = document.createElement("thead");
        newThead.classList.add("table-info");

        const headerRow = document.createElement("tr");
        const headerText = ["Id", "Timestamp", "Colour"];
        headerText.forEach(text => {
            const th = document.createElement("th");
            th.innerText = text;
            headerRow.append(th);
        });

        newThead.append(headerRow);
        newTable.append(newThead);

        const newTbody = document.createElement("tbody");
        newTable.append(newTbody);

        /* The color blocks contain precious information from the DB in their attributes.
           This means we can get this info without querying the DB again. */
        const colorBlocks = document.querySelectorAll("#display-area div.btn");
        colorBlocks.forEach(cc => {
            const tr = document.createElement("tr");
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
            tdColour.classList.add(`table-${colour}`); // Colours the whole cell

            tr.append(tdId, tdTime, tdColour);
            newTbody.append(tr);
        });
        // #endregion

        displayArea.remove();
        main.append(newTable);
    } else {
        // Reloading the page basically resets it to the "Display Blocks" view
        location.reload();
    }
});
