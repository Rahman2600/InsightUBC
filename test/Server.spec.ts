import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import Log from "../src/Util";
import {InsightDatasetKind} from "../src/controller/IInsightFacade";
import * as fs from "fs-extra";

describe("Facade D3", function () {

    let facade: InsightFacade;
    let server: Server;
    let testQuery = {
        WHERE: {
            GT: {
                courses_avg: 99
            }
        },
        OPTIONS: {
            COLUMNS: [
                "courses_dept",
                "courses_avg"
            ],
            ORDER: "courses_avg"
        }
    };
    let insightErrorQuery = {OPTIONS: {}};
    let resultTooLargeQuery = {
        WHERE: {
            GT: {
                courses_avg: 1
            }
        },
        OPTIONS: {
            COLUMNS: [
                "courses_dept",
                "courses_avg"
            ],
            ORDER: "courses_avg"
        }
    };
    let testResult = {
        result: [{courses_dept: "cnps", courses_avg: 99.19}, {
            courses_dept: "math",
            courses_avg: 99.78
        }, {courses_dept: "math", courses_avg: 99.78}]
    };

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        server.start().catch(function (err: Error) {
            Log.error("Error in starting server: " + err.message);
        });
    });

    after(function () {
        server.stop();
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    // TODO: read your courses and rooms datasets here once!
    // load datasets
    const datasetsToLoad: { [id: string]: string } = {
        coursesDataset: "./test/data/courses.zip",
        courses: "./test/data/courses.zip",
        rooms: "./test/data/rooms.zip",
        invalid_ID: "./test/data/courses.zip",
        someinvalid: "test/data/someinvalid.zip",
    };
    let datasets: { [id: string]: Buffer } = {};
    for (const ds of Object.keys(datasetsToLoad)) {
        datasets[ds] = fs.readFileSync(datasetsToLoad[ds]);
    }

    it("PUT test for courses dataset", function () {
        this.timeout(10000);
        return chai.request("http://localhost:4321")
            .put("/dataset/coursesDataset/courses")
            .send(datasets["coursesDataset"])
            .set("Content-Type", "application/x-zip-compressed")
            .then(function (res: Response) {
                expect(res.status).to.be.equal(200);
                expect(res.body).to.deep.equal({result: ["coursesDataset"]});
            })
            .catch(function (err) {
                Log.info("failed to send courses to remote");
                expect.fail();
            });
    });

    it("rejects PUT request with 400 when addDataset rejects", function () {
        return chai.request("http://localhost:4321")
            .put("/dataset/invalid_ID/courses")
            .send(datasets["invalid_ID"])
            .set("Content-Type", "application/x-zip-compressed")
            .then(function (res: Response) {
                expect.fail("Did not reject when addDataset rejected" + res);
            }).catch(function (err: Response) {
                expect(err.status).to.be.equal(400);
            });
    });

    it("GET test for courses dataset", function () {
        // put the courses dataset here
        try {
            return chai.request("http://localhost:4321")
                .get("/datasets")
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err: Error) {
                    Log.info("Failed to get courses dataset");
                    expect.fail();
                });
        } catch (err) {
            Log.info("failed to connect to server");
        }
    });

    it("DELETE test for courses dataset, removeDataset resolves", function () {
        return chai.request("http://localhost:4321")
            .del("/dataset/coursesDataset")
            .then(function (res: Response) {
                expect(res.status).to.be.equal(200);
                expect(res.body).to.deep.equal({result: "coursesDataset"});
            })
            .catch(function (err: Error) {
                expect.fail("Failed to delete courses dataset" + err);
            });
    });

    it("DELETE test, removeDataset rejects with InsightError", function () {
        return chai.request("http://localhost:4321")
            .del("/dataset/underscore_id")
            .then(function (res: Response) {
                expect.fail("Did not reject with an error" + res);
            })
            .catch(function (res: Response) {
                expect(res.status).to.be.equal(400);
            });
    });

    it("DELETE test, removeDataset rejects with NotFoundError", function () {
        return chai.request("http://localhost:4321")
            .del("/dataset/doesNotExist")
            .then(function (res: Response) {
                expect.fail("Did not rejected with a 404 error" + res);
            })
            .catch(function (res: Response) {
                expect(res.status).to.be.equal(404);
            });
    });

    it("POST test, perform query resolves", function () {
        // add dataset first, then request query on it
        return chai.request("http://localhost:4321").put("/dataset/courses/courses")
            .send(datasets["courses"]).set("Content-Type", "application/x-zip-compressed")
            .then(function () {
                return chai.request("http://localhost:4321")
                    .post("/query")
                    .send(testQuery)
                    .set("Content-Type", "application/json")
                    .then(function (res: Response) {
                        expect(res.status).to.be.equal(200);
                        expect(res.body).to.deep.equal(testResult);
                    }).catch(function (err) {
                        expect.fail("query failed" + err);
                    });
            });
    });

    it("POST test for courses dataset, perform query rejects with InsightError", function () {
        return chai.request("http://localhost:4321")
            .post("/query")
            .send(insightErrorQuery)
            .set("Content-Type", "application/json")
            .then((res: Response) => {
                expect.fail("Did not return a 400 error when perform query rejected");
            })
            .catch((err: Response) => {
                expect(err.status).to.be.equal(400);
            });
    });

    it("POST test for courses dataset, perform query rejects with ResultTooLargeError", function () {
        return chai.request("http://localhost:4321")
            .post("/query")
            .send(resultTooLargeQuery)
            .set("Content-Type", "application/json")
            .then((res: Response) => {
                expect.fail("Did not return a 400 error when perform query rejected");
            })
            .catch((err: Response) => {
                expect(err.status).to.be.equal(400);
            });
    });
});
