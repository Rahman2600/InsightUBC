/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */

const MFIELDS_COURSE = ["avg", "pass", "fail", "audit", "year"];
const SFIELDS_COURSE = ["dept", "id", "instructor", "title", "uuid"];
const MFIELDS_ROOM = ["lat", "lon", "seats"];
const SFIELDS_ROOM = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
const COURSE_FIELDS = MFIELDS_COURSE.concat(SFIELDS_COURSE);
const ROOM_FIELDS = MFIELDS_ROOM.concat(SFIELDS_ROOM);
let type = null;
let tabHTML = null;

CampusExplorer.buildQuery = function () {
    type = getType();
    tabHTML = document.getElementById(`tab-${type}`);
    let whereObj = getConditions();
    console.log(whereObj);
    let columns = getSelectedFields("columns");
    console.log(columns);
    let orderObj = getOrder();
    // eslint-disable-next-line no-console
    console.log(orderObj);
    let groups = getSelectedFields("groups");
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
   return SFIELDS_COURSE.includes(field) || SFIELDS_ROOM.includes(field);
}

function isMfield(field) {
    return MFIELDS_COURSE.includes(field) || MFIELDS_ROOM.includes(field);
}

function getOperator() {
    let operator;
    if (document.getElementById(`${type}-conditiontype-all`).checked) {
        operator = "AND";
    }
    if (document.getElementById(`${type}-conditiontype-any`).checked) {
        operator = "OR";
    }
    if (document.getElementById(`${type}-conditiontype-none`).checked) {
        operator = "NOT";
    }
    return operator;
}

function getOrder() {
    let orderObj = {dir: "UP", keys: []}
    let orderDiv = tabHTML.getElementsByClassName("control order fields")[0];
    let selectedField = orderDiv.getElementsByTagName("select")[0].value;
    if (!selectedField) {
        return null;
    }
    orderObj.keys.push(formatField(selectedField));
    let descending = document.getElementById(`${type}-order`).checked;
    if (descending) {
        orderObj.dir = "DOWN";
    }
    return orderObj;
}

// section is section of the ui we are trying to get fields from
function getSelectedFields(section) {
    let fields = [];
    if (type === "courses") {
        for (let field of COURSE_FIELDS) {
            if (document.getElementById(`courses-${section}-field-${field}`).checked) {
                fields.push(field);
            }
        }
    } else if (type === "rooms") {
        for (let field of ROOM_FIELDS) {
            if (document.getElementById(`rooms-${section}-field-${field}`).checked) {
                fields.push(field);
            }
        }
    }
    return fields;
}

function getTransformations() {
    let transformations = [];
    let transformationsHTML = tabHTML.getElementsByClassName("control-group transformation");
    for (let tHTML of transformationsHTML) {
        let transformationsObj = {};
        let applykey = tHTML.getElementsByTagName("input")[0].value;
        let operatorsDiv = tHTML.getElementsByClassName("control operators")[0];
        let selectedOperator = operatorsDiv.getElementsByTagName("select")[0].value;
        let fieldsDiv = tHTML.getElementsByClassName("control fields")[0];
        let selectedField = fieldsDiv.getElementsByTagName("select")[0].value;
        transformationsObj[applykey] = {}
        transformationsObj[applykey][selectedOperator] = formatField(selectedField);
        transformations.push(transformationsObj);
    }
    return transformations;
}
