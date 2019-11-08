/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */

const MFIELDS = ["average", "pass", "fail", "audit", "year"];
const SFIELDS = ["department", "id", "instructor", "title", "uuid"];
let type = null;
let tabHTML = null;

CampusExplorer.buildQuery = function () {
    type = getType();
    tabHTML = document.getElementById(`tab-${type}`);
    let whereObj = getConditions();
    let columns = getColumns();
    let orderObj = getOrder();
    // eslint-disable-next-line no-console
    console.log(orderObj);
    let groups = getGroups();
    // eslint-disable-next-line no-console
    console.log(groups);
    let  transformations = getTransformations();
    // eslint-disable-next-line no-console
    console.log(transformations);
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

function getConditions() {
    let operator = getOperator();
    let conditions = [];
    let conditionsHTML = tabHTML.getElementsByClassName("control-group condition");
    for (let conditionDiv of conditionsHTML) {
        let conditionsObj = {};
        let cnHTML = conditionDiv.getElementsByClassName("control not");
        //  not input is checked
        let notChecked = cnHTML[0].getElementsByTagName("input")[0].checked;
        let fieldsDiv = conditionDiv.getElementsByClassName("control fields")[0];
        let selectedField = fieldsDiv.getElementsByTagName("select")[0].value;
        let operatorsDiv = conditionDiv.getElementsByClassName("control operators")[0];
        let selectedOperator = operatorsDiv.getElementsByTagName("select")[0].value;
        let testValue = getValue(conditionDiv);
        if (isMfield(selectedField)) {
            testValue = Number(testValue);
        }
        // used to refer to nested objects inside conditionsObj
        let obj = conditionsObj;
        if (notChecked) {
            obj["NOT"] = {};
            obj = obj["NOT"];
        }
        obj[selectedOperator] = {};
        obj[selectedOperator][formatField(selectedField)] = testValue;
        conditions.push(conditionsObj);
    }
    let obj = {};
    if (operator === "NOT") {
        obj["NOT"] = {};
        obj["NOT"]["AND"] = conditions;
    } else {
        obj[operator] = conditions;
    }
    return obj;
}

function formatField(fieldname) {
    return `${type}_${fieldname}`;
}

function getValue(conditionDiv) {
    let termDiv = conditionDiv.getElementsByClassName("control term")[0];
    let value = termDiv.getElementsByTagName("input")[0].value;
    if (value) {
        return value;
    } else {
        return "";
    }
}

function isSfield(field) {
   return SFIELDS.includes(field);
}

function isMfield(field) {
    return MFIELDS.includes(field);
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

function getColumns() {
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
        if (document.getElementById("rooms-columns-field-shortname").checked) {
            columns.push("shortname");
        }
        if (document.getElementById("rooms-columns-field-type").checked) {
            columns.push("type");
        }
    }
    return columns;
}

function getOrder() {
    let orderObj = {dir: "UP", keys: []}
    let orderDiv = tabHTML.getElementsByClassName("control order fields")[0];
    let selectedField = orderDiv.getElementsByTagName("select")[0].value;
    orderObj.keys.push(formatField(selectedField));
    let descending = document.getElementById(`${type}-order`).checked;
    if (descending) {
        orderObj.dir = "DOWN";
    }
    return orderObj;
}

function getGroups() {
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
        if (document.getElementById("rooms-groups-field-shortname").checked) {
            columns.push("shortname");
        }
        if (document.getElementById("rooms-groups-field-type").checked) {
            columns.push("type");
        }
    }
    return columns;
}

function getTransformations() {
    let x = document.getElementsByClassName("control term").item(0).querySelector('[type="text"]').value;
    return {};
}
