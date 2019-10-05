
import {expect, assert} from "chai";
import * as fs from "fs-extra";
import {
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    InsightDataset,
    ResultTooLargeError
} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove Dataset/List Datasets", function () {

    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        nonzip: "./test/data/nonzip.txt",
        nonjson: "./test/data/nonjson.zip",
        wrongfoldername: "test/data/wrongfoldername.zip",
        someinvalid: "test/data/someinvalid.zip",
        emptyfolder: "test/data/emptyfolder.zip",
        corrupt: "test/data/corrupt.zip",
        emptyjson: "test/data/emptyjson.zip",
        oneinvalidformat: "test/data/oneinvalidformat.zip",
        onlyresult: "test/data/onlyresult.zip",
        weirdattribute: "test/data/weirdattribute.zip",
        onlyrank: "test/data/onlyrank.zip",
        resultnotarray: "test/data/resultnotarray.zip",
        invalidformatsections: "test/data/invalidformatsections.zip",
        sectionempty: "test/data/sectionempty.zip",
        missingrequiredfields: "test/data/missingrequiredfields.zip",
        onevalidsection: "test/data/onevalidsection.zip",
        weirdfield: "test/data/weirdfield.zip",
        allinvalidvalidjson: "test/data/allinvalidjson.zip",
        afewvalidsections: "test/data/afewvalidsections.zip"

    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // This is a unit test. You should create more like this!
    it("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });

    });

    it("Should fail because of the underscore", function () {
        const id: string = "_";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
            expect.fail("Should have been rejected");
        }).catch((e) => {
            if (e instanceof InsightError) {
                // expected
            } else {
                Log.info("!!!entered error!!!");
                expect.fail("Should have thrown insight error");
            }
        });
    });

    it("Should fail because it's only whitespace characters", function () {
        const id: string = " ";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail("Should have been rejected");
        }).catch((e) => {
            if (e instanceof InsightError) {
                // expected
            } else {
                expect.fail("Should have thrown insight error");
            }
        });
    });

    it("Should fail because dataset with duplicate id is being added", function () {
        const id: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result1: string[]) => {
                expect.fail("Should have been rejected");
            }).catch((e) => {
                if (e instanceof InsightError) {
                    // expected
                } else {
                    expect.fail("Should have thrown insight error");
                }
            });
        });
    });

    it("Should fail because file is not a zip file", function () {
        const id: string = "nonzip";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail("Should have been rejected");
        }).catch((e) => {
            if (e instanceof InsightError) { // expected
            } else {
                expect.fail("Should have thrown insight error");
            }
        });
    });

    it("Should fail because format is not json", function () {
        const id: string = "nonjson";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail("Should have been rejected");
        }).catch((e) => {
            if (e instanceof InsightError) { // expected
            } else {
                expect.fail("Should have thrown insight error");
            }
        });
    });

    it("Should fail because the name of the folder is wrong", function () {
        const id: string = "wrongfoldername";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail("Should have been rejected");
        }).catch((e) => {
            if (e instanceof InsightError) { // expected
            } else {
                expect.fail("Should have thrown insight error");
            }
        });
    });

    it("Should fail because there is no valid course section", function () {
        const id: string = "allinvalid";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail("Should have been rejected");
        }).catch((e) => {
            if (e instanceof InsightError) { // expected
            } else {
                expect.fail("Should have thrown insight error");
            }
        });
    });

    it("Should fail because courses folder is empty", function () {
        const id: string = "emptyfolder";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail("Should have been rejected");
        }).catch((e) => {
            if (e instanceof InsightError) { // expected
            } else {
                expect.fail("Should have thrown insight error");
            }
        });
    });

    it("Should fail because zip file is corrupt", function () {
        const id: string = "corrupt";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail("Should have been rejected");
        }).catch((e) => {
            if (e instanceof InsightError) { // expected
            } else {
                expect.fail("Should have thrown insight error");
            }
        });
    });

    it("Should pass because there is at least one valid course section but not all are valid", function () {
        const id: string = "someinvalid";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should pass but course is an empty json file", function () {
        const id: string = "emptyjson";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should pass but course has only result field", function () {
        const id: string = "onlyresult";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should skip over json file with an invalid format", function () {
        const id: string = "oneinvalidformat";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should parse course section with different attributes than normal", function () {
        const id: string = "weirdattribute";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should parse course section with only rank", function () {
        const id: string = "onlyrank";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Skips over course with result not an array", function () {
        const id: string = "resultnotarray";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Parses course with sections of an invalid format (non-objects)", function () {
        const id: string = "invalidformatsections";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Parses course with section but some of the required fields are missing", function () {
        const id: string = "missingrequiredfields";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Parses course with empty section (invalid)", function () {
        const id: string = "sectionempty";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Parses course with one valid section", function () {
        const id: string = "onevalidsection";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Parses course with a few valid sections", function () {
        const id: string = "afewvalidsections";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Field contains something weird like an empty string", function () {
        const id: string = "weirdfield";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should fail because there is no valid course section but in json format", function () {
        const id: string = "allinvalidvalidjson";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail("Should have been rejected");
        }).catch((e) => {
            if (e instanceof InsightError) { // expected
            } else {
                expect.fail("Should have thrown insight error");
            }
        });
    });

    it("Should successfully remove added dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
            insightFacade.removeDataset(id).then((result1: string) => {
                expect(result1).to.deep.equal(id);
            });
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should reject back to back removal of dataset (without adding twice)", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
            return insightFacade.removeDataset(id).then(() => {
                insightFacade.removeDataset(id).then(() => {
                    expect.fail("Should not have been rejected");
                });
            }).catch((err: any) => {
                if (err instanceof NotFoundError) {
                    // expected
                } else {
                    expect.fail("Should have thrown NotFound error");
                }
            });
        });
    });

    it("Should throw NotFoundError, trying to remove dataset has not yet been added", function () {
        const id: string = "courses";
        return insightFacade.removeDataset(id).then(() => {
            expect.fail("Should have been rejected");
        }).catch((e) => {
            if (e instanceof NotFoundError) { // expected
            } else {
                expect.fail("Should have thrown NotFound error");
            }
        });
    });

    it("Should throw InsightError, id contains underscore", function () {
        const id: string = "_";
        return insightFacade.removeDataset(id).then(() => {
            expect.fail("Should have been rejected");
        }).catch((e) => {
            if (e instanceof InsightError) {
                // expected
            } else {
                expect.fail("Should have thrown NotFound error");
            }
        });
    });

    it("Should throw InsightError, id has only whitespace characters", function () {
        const id: string = " ";
        return insightFacade.removeDataset(id).then(() => {
            expect.fail("Should have been rejected");
        }).catch((e) => {
            if (e instanceof InsightError) {
                // expected
            } else {
                expect.fail("Should have thrown NotFound error");
            }
        });
    });

    it("Should return an empty list because nothing has been added", function () {
        return insightFacade.listDatasets().then((dataset: InsightDataset[]) => {
            if (dataset.length === 0) {
                // expected
            } else {
                expect.fail("List should be empty");
            }
        }).catch((err: any) => {
            expect.fail("Should have returned an empty list");
        });
    });

    it("Should return a list of things that were added", function () {

        const id: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            insightFacade.listDatasets().then((dataset: InsightDataset[]) => {
                assert(dataset.length === 1);
                assert(dataset[0].id === "courses");
            }).catch(() => {
                expect.fail("List dataset returned with a rejection");
            });
        }).catch(() => {
            expect.fail("Add dataset returned with a rejection");
        });
    });
});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: any } = {
        courses: {id: "courses", path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
    };

    let insightFacade: InsightFacade = new InsightFacade();

    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];

        insightFacade = new InsightFacade();

        for (const key of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[key];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(ds.id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * For D1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    insightFacade.performQuery(test.query).then((result) => {
                        TestUtil.checkQueryResult(test, result, done);
                    }).catch((err) => {
                        TestUtil.checkQueryResult(test, err, done);
                    });
                });
            }
        });
    });
});
