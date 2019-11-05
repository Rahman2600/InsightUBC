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
    let datasets: { [id: string]: string } = {};
    for (const ds of Object.keys(datasetsToLoad)) {
        datasets[ds] = fs.readFileSync(datasetsToLoad[ds]).toString("base64");
    }

    it("PUT test for courses dataset", function () {
        try {
            return chai.request("http://localhost:4231")
                .put("dataset/courses/courses")
                .send(datasets["courses"])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.info("successfully set courses to remote");
                    // some logging here please!
                    expect(res.status).to.be.equal(204);
                })
                .catch(function (err) {
                    Log.info("failed to send courses to remote");
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });


    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
