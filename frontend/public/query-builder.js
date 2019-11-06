/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function () {
    let type = getType();
    let operator = getOperator(type);
    let columns = getColumns(type);
    let order = getOrder(type);
    let groups = getGroups(type);
    let transformations = getTransformations(type);
    let query = {};
    // TODO: implement!
    // console.log("CampusExplorer.buildQuery not implemented yet.");

    return query;
};

function getType() {
    let type = document.getElementsByClassName("nav-item tab active");
    if (type.item(0).href.includes("courses")) {
        return "courses"
    } else if (type.item(0).href.includes("rooms")) {
        return "rooms"
    }
}


function getOperator() {
    let operator;
    if (document.getElementById("courses-conditiontype-all").checked) {
        operator = "AND";
    }
    if (document.getElementById("courses-conditiontype-any").checked) {
        operator = "OR";
    }
    if (document.getElementById("courses-conditiontype-none").checked) {
        operator = "NOT";
    }
    return operator;
}

function getColumns(type) {
    let columns = [];
    if (type === "courses") {
        if (document.getElementById("courses-columns-field-audit").checked) {
            columns.push("audit");
        }
        if (document.getElementById("courses-columns-field-avg").checked) {
            columns.push("avg");
        }
        if (document.getElementById("courses-columns-field-dept").checked) {
            columns.push("dept");
        }
        if (document.getElementById("courses-columns-field-fail").checked) {
            columns.push("fail");
        }
        if (document.getElementById("courses-columns-field-id").checked) {
            columns.push("id");
        }
        if (document.getElementById("courses-columns-field-instructor").checked) {
            columns.push("instructor");
        }
        if (document.getElementById("courses-columns-field-pass").checked) {
            columns.push("pass");
        }
        if (document.getElementById("courses-columns-field-uuid").checked) {
            columns.push("uuid");
        }
        if (document.getElementById("courses-columns-field-year").checked) {
            columns.push("year");
        }
    } else if (type === "rooms") {
        if (document.getElementById("rooms-columns-field-address").checked) {
            columns.push("address");
        }
        if (document.getElementById("rooms-columns-field-fullname").checked) {
            columns.push("fullname");
        }
        if (document.getElementById("rooms-columns-field-furniture").checked) {
            columns.push("furniture");
        }
        if (document.getElementById("rooms-columns-field-href").checked) {
            columns.push("href");
        }
        if (document.getElementById("rooms-columns-field-lat").checked) {
            columns.push("lat");
        }
        if (document.getElementById("rooms-columns-field-lon").checked) {
            columns.push("lon");
        }
        if (document.getElementById("rooms-columns-field-seats").checked) {
            columns.push("seats");
        }
        if (document.getElementById("rooms-columns-field-shortnam").checked) {
            columns.push("shortname");
        }
        if (document.getElementById("rooms-columns-field-type").checked) {
            columns.push("type");
        }
    }
    return columns;
}

function getOrder(type) {
    let orderOn = [];
    let orderFields = document.getElementsByClassName("control order fields");
    for (let option of orderFields) {
        if (option.selected) {
            orderOn.push(option.value);
        }
    }
    return orderOn;
}

function getGroups(type) {
    let columns = [];
    if (type === "courses") {
        if (document.getElementById("courses-groups-field-audit").checked) {
            columns.push("audit");
        }
        if (document.getElementById("courses-groups-field-avg").checked) {
            columns.push("avg");
        }
        if (document.getElementById("courses-groups-field-dept").checked) {
            columns.push("dept");
        }
        if (document.getElementById("courses-groups-field-fail").checked) {
            columns.push("fail");
        }
        if (document.getElementById("courses-groups-field-id").checked) {
            columns.push("id");
        }
        if (document.getElementById("courses-groups-field-instructor").checked) {
            columns.push("instructor");
        }
        if (document.getElementById("courses-groups-field-pass").checked) {
            columns.push("pass");
        }
        if (document.getElementById("courses-groups-field-uuid").checked) {
            columns.push("uuid");
        }
        if (document.getElementById("courses-groups-field-year").checked) {
            columns.push("year");
        }
    } else if (type === "rooms") {
        if (document.getElementById("rooms-groups-field-address").checked) {
            columns.push("address");
        }
        if (document.getElementById("rooms-groups-field-fullname").checked) {
            columns.push("fullname");
        }
        if (document.getElementById("rooms-groups-field-furniture").checked) {
            columns.push("furniture");
        }
        if (document.getElementById("rooms-groups-field-href").checked) {
            columns.push("href");
        }
        if (document.getElementById("rooms-groups-field-lat").checked) {
            columns.push("lat");
        }
        if (document.getElementById("rooms-groups-field-lon").checked) {
            columns.push("lon");
        }
        if (document.getElementById("rooms-groups-field-seats").checked) {
            columns.push("seats");
        }
        if (document.getElementById("rooms-groups-field-shortnam").checked) {
            columns.push("shortname");
        }
        if (document.getElementById("rooms-groups-field-type").checked) {
            columns.push("type");
        }
    }
    return columns;
}

function getTransformations(type) {
    let x = document.getElementsByClassName("control term").item(0).querySelector('[type="text"]').value;
    return {};
}
