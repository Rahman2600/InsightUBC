/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function () {
    let getConditions = function () {
        const getOperator = function () {
            let operator;
            if (document.getElementById("courses-conditiontype-all").checked) {
                operator = "AND";
            } else if (document.getElementById("courses-conditiontype-any").checked) {
                operator = "OR";
            } else if (document.getElementById("courses-conditiontype-none").checked) {
                operator = "NOT";
            }
            // eslint-disable-next-line no-console
            console.log(operator);
        };
        let operator = getOperator();
    }
    let whereObj = getConditions();
    let query = {};
    // TODO: implement!
    // console.log("CampusExplorer.buildQuery not implemented yet.");

    return query;
};
