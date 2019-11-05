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

    let facade: InsightFacade = null;
    let server: Server = null;
    let testQuery = {
        WHERE: {
            GT: {

                courses_avg: 97

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
    let badTestQuery = { OPTIONS: {} };
    let testResult = [
        {
            courses_dept: "epse",
            courses_avg: 97.09
        },
        {
            courses_dept: "math",
            courses_avg: 97.09
        },
        {
            courses_dept: "math",
            courses_avg: 97.09
        },
        {
            courses_dept: "epse",
            courses_avg: 97.09
        },
        {
            courses_dept: "math",
            courses_avg: 97.25
        },
        {
            courses_dept: "math",
            courses_avg: 97.25
        },
        {
            courses_dept: "epse",
            courses_avg: 97.29
        },
        {
            courses_dept: "epse",
            courses_avg: 97.29
        },
        {
            courses_dept: "nurs",
            courses_avg: 97.33
        },
        {
            courses_dept: "nurs",
            courses_avg: 97.33
        },
        {
            courses_dept: "epse",
            courses_avg: 97.41
        },
        {
            courses_dept: "epse",
            courses_avg: 97.41
        },
        {
            courses_dept: "cnps",
            courses_avg: 97.47
        },
        {
            courses_dept: "cnps",
            courses_avg: 97.47
        },
        {
            courses_dept: "math",
            courses_avg: 97.48
        },
        {
            courses_dept: "math",
            courses_avg: 97.48
        },
        {
            courses_dept: "educ",
            courses_avg: 97.5
        },
        {
            courses_dept: "nurs",
            courses_avg: 97.53
        },
        {
            courses_dept: "nurs",
            courses_avg: 97.53
        },
        {
            courses_dept: "epse",
            courses_avg: 97.67
        },
        {
            courses_dept: "epse",
            courses_avg: 97.69
        },
        {
            courses_dept: "epse",
            courses_avg: 97.78
        },
        {
            courses_dept: "crwr",
            courses_avg: 98
        },
        {
            courses_dept: "crwr",
            courses_avg: 98
        },
        {
            courses_dept: "epse",
            courses_avg: 98.08
        },
        {
            courses_dept: "nurs",
            courses_avg: 98.21
        },
        {
            courses_dept: "nurs",
            courses_avg: 98.21
        },
        {
            courses_dept: "epse",
            courses_avg: 98.36
        },
        {
            courses_dept: "epse",
            courses_avg: 98.45
        },
        {
            courses_dept: "epse",
            courses_avg: 98.45
        },
        {
            courses_dept: "nurs",
            courses_avg: 98.5
        },
        {
            courses_dept: "nurs",
            courses_avg: 98.5
        },
        {
            courses_dept: "nurs",
            courses_avg: 98.58
        },
        {
            courses_dept: "nurs",
            courses_avg: 98.58
        },
        {
            courses_dept: "epse",
            courses_avg: 98.58
        },
        {
            courses_dept: "epse",
            courses_avg: 98.58
        },
        {
            courses_dept: "epse",
            courses_avg: 98.7
        },
        {
            courses_dept: "nurs",
            courses_avg: 98.71
        },
        {
            courses_dept: "nurs",
            courses_avg: 98.71
        },
        {
            courses_dept: "eece",
            courses_avg: 98.75
        },
        {
            courses_dept: "eece",
            courses_avg: 98.75
        },
        {
            courses_dept: "epse",
            courses_avg: 98.76
        },
        {
            courses_dept: "epse",
            courses_avg: 98.76
        },
        {
            courses_dept: "epse",
            courses_avg: 98.8
        },
        {
            courses_dept: "spph",
            courses_avg: 98.98
        },
        {
            courses_dept: "spph",
            courses_avg: 98.98
        },
        {
            courses_dept: "cnps",
            courses_avg: 99.19
        },
        {
            courses_dept: "math",
            courses_avg: 99.78
        },
        {
            courses_dept: "math",
            courses_avg: 99.78
        }
    ];

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        server.start().catch(() => {
            Log.info("Server failed with an error");
        });
        // TODO: start server here once and handle errors properly
    });

    after(function () {
        server.stop();
        // TODO: stop server here once!
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
        courses: "./test/data/courses.zip",
        rooms: "./test/data/rooms.zip",
    };
    let datasets: { [id: string]: Buffer } = {};
    for (const ds of Object.keys(datasetsToLoad)) {
        datasets[ds] = fs.readFileSync(datasetsToLoad[ds]);
    }

    it("PUT test for courses dataset", function () {
        try {
            return chai.request("http://localhost:4231")
                .put("dataset/courses/courses")
                .send(datasets["courses"])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.info("successfully set courses to remote");
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal({result: ["courses"]});
                })
                .catch(function () {
                    Log.info("failed to send courses to remote");
                    expect.fail();
                });
        } catch (err) {
            Log.info("failed to connect to server");
        }
    });

    it("rejects PUT request with 400 when addDataset rejects", function () {
        try {
            return chai.request("http://localhost:4231")
                .put("dataset/_/courses")
                .end(function (err: Error, res: Response) {
                    expect(res.status).to.be.equal(400);
                });
        } catch (err) {
            Log.info("failed to connect to server");
        }
    });

    it("GET test for courses dataset", function () {
        // put the courses dataset here
        try {
            return chai.request("http://localhost:4231")
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
        // put the courses dataset here
        try {
            return chai.request("http://localhost:4231")
                .get("/dataset/courses")
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal({result: "courses"});
                })
                .catch(function (err: Error) {
                    Log.info("Failed to delete courses dataset");
                    expect.fail();
                });
        } catch (err) {
            Log.info("failed to connect to server");
        }
    });

    it("DELETE test for courses dataset, removeDataset rejects with InsightError", function () {
        // put the courses dataset here
        try {
            return chai.request("http://localhost:4231")
                .get("/dataset/_")
                .end(function (err: Error, res: Response) {
                    expect(res.status).to.be.equal(400);
                });
        } catch (err) {
            Log.info("failed to connect to server");
        }
    });

    it("DELETE test for courses dataset, removeDataset rejects with NotFoundError", function () {
        try {
            return chai.request("http://localhost:4231")
                .get("/dataset/rand")
                .end(function (err: Error, res: Response) {
                    expect(res.status).to.be.equal(404);
                });
        } catch (err) {
            Log.info("failed to connect to server");
        }
    });

    it("POST test for courses dataset, perform query resolves", function () {
        try {
            return chai.request("http://localhost:4231")
                .post("/query")
                .send(testQuery)
                .set("Content-Type", "application/json")
                .then(function (res: Response) {
                    Log.info("query successful");
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal({result: testResult});
                })
                .catch(function () {
                    Log.info("query failed");
                    expect.fail();
                });
        } catch (err) {
            Log.info("failed to connect to server");
        }
    });

    it("POST test for courses dataset, perform query rejects", function () {
        try {
            return chai.request("http://localhost:4231")
                .post("/query")
                .send(badTestQuery)
                .set("Content-Type", "application/json")
                .end(function (err: Error, res: Response) {
                    expect(res.status).to.be.equal(400);
                });
        } catch (err) {
            Log.info("failed to connect to server");
        }
    });

    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
