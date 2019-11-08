/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function (query) {
    console.log(query);
    return new Promise(function (fulfill, reject) {
        let request = new XMLHttpRequest();
        request.onload = function () {
            console.log(request.response);
            fulfill(request.response);
        }
        request.addEventListener("error", () => {
            reject()
        });
        request.open("POST", "/query",true);
        request.setRequestHeader("Content-type", "application/json");
        request.send(query);
    });
};
