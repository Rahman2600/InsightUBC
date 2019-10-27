import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError
} from "./IInsightFacade";
import * as JSZip from "jszip";
import * as fs from "fs";
import InsightFacadeValidateQuery from "./InsightFacadeValidateQuery";
import InsightFacadeFindQueryResults from "./InsightFacadeFindQueryResults";
import InsightFacadeFormatResults from "./InsightFacadeFormatResults";
import InsightFacadeGetBuildingData from "./InsightFacadeGetBuildingData";

const parse5: any = require("parse5");

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    // {key: [InsightDataset, JSON[] ] } This is the overall structure
    // {id : [InsightDataset, {'#This is an array of all dataset's courses (which are JSON)'}]}
    private datasets: { [id: string]: Array<InsightDataset | JSON[]> } = {};
    private indexHtm: any = {};

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (!this.isValidID(id)) {
            return Promise.reject(new InsightError("Dataset id string is invalid"));
        }
        /* Unzips the zip file, iterates over the content and reads it (saving it in the process). */
        let atLeastOneValidSection: boolean = false;
        let zip: JSZip = new JSZip();
        let zipContent: JSON[] = [];    // Zip and their content
        let promiseCourseSections: Array<Promise<any>> = new Array<Promise<any>>();
        // Wraps all of the promises so that we can wait for them to resolve
        let promiseFinal: Promise<string[]> = new Promise((resolve, reject) => {
            zip.loadAsync(content, {base64: true}).then(() => {
                zip.forEach(function (file) { // iterate over course sections
                    if (zip.file(file) != null) {
                        promiseCourseSections.push(zip.file(file).async("text").then((contentInside) => {
                            if (kind === InsightDatasetKind.Courses) {
                                zipContent.push(JSON.parse(contentInside));
                            } else if (kind === InsightDatasetKind.Rooms) {
                                zipContent.unshift(parse5.parse(contentInside)); // so that index.htm ends up first
                            }
                            atLeastOneValidSection = true; // as JSON.parse() did not throw an error
                        }).catch(() => { // Skip over invalid file
                        }));
                    }
                });
                Promise.all(promiseCourseSections).then((): any => { // Return when all promises are resolved
                    return resolve();
                });
            }).catch(function () {
                return reject(new InsightError("Problems with zip file"));
            });
        });
        return promiseFinal.then((): any => {
            return this.finalizeAddDataset(atLeastOneValidSection, zip, zipContent, id, kind);
        });
    }

    public removeDataset(id: string): Promise<string> {
        if (!this.isValidID(id)) {
            return Promise.reject(new InsightError("Dataset id string is invalid"));
        }
        if (Object.keys(this.datasets).includes(id)) {
            delete this.datasets[id];    // delete entry
            fs.writeFileSync("./data/datasets.json", JSON.stringify(this.datasets)); // update datasets.json in disk
            return Promise.resolve(id);
        } else {
            return Promise.reject(new NotFoundError("File with given id not found"));
        }
    }

    public performQuery(query: any): Promise<any[]> {
        let rawResult: any [];
        let datasetBeingQueried: string;
        try { // validate the query
            let insightFacadeValidateQuery = new InsightFacadeValidateQuery();
            datasetBeingQueried = insightFacadeValidateQuery.validateQuery(query);
            // eslint-disable-next-line no-console
            console.log("valid");
            if (!Object.keys(this.datasets).includes(datasetBeingQueried)) { // TODO: implement this
                // return Promise.reject(new InsightError("Dataset being queried has not been added"));
            } // find results of query
            let insightFacadeFindQueryResults = new InsightFacadeFindQueryResults(this.datasets, datasetBeingQueried);
            // eslint-disable-next-line no-console
            console.log("getting results");
            rawResult = insightFacadeFindQueryResults.findQueryResults(query["WHERE"]);
            // eslint-disable-next-line no-console
            console.log("got results");
        } catch {
            return Promise.reject(new InsightError("Invalid query"));
        }
        if (rawResult.length >= 5000) {
            return Promise.reject(new ResultTooLargeError());
        }
        // output results of query
        let results: any[];
        try { // formats the results
            let insightFacadeFormatResults = new InsightFacadeFormatResults();
            results = insightFacadeFormatResults.outputResults(rawResult, query);
        } catch {
            return Promise.reject(new InsightError("Problems in processing results of query"));
        }
        return Promise.resolve(results); // format and output the sections);
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.resolve(this.getInsightDatasets());
    }

    /* PRIVATE HELPER FUNCTIONS */

    // Handles the part after parsing in addDataset
    private finalizeAddDataset(atLeastOneValidSection: boolean, zip: JSZip, zipContent: JSON[], id: string,
                               kind: InsightDatasetKind): Promise<string[]> {
        // Saving the parsed zipContent in memory and disk. Rejecting if conditions are not met.
        if (!atLeastOneValidSection) {
            return Promise.reject(new InsightError("No valid course sections in the zip"));
        } else if (kind === InsightDatasetKind.Courses && !Object.keys(zip.files)[0].includes("courses/")) {
            return Promise.reject(new InsightError("incorrect folder name"));
        } else if (kind === InsightDatasetKind.Rooms && !Object.keys(zip.files)[0].includes("rooms/")) {
            return Promise.reject(new InsightError("incorrect folder name"));
        }
        let numRows = this.countRows(zipContent);
        let insightDataset: InsightDataset = {id: id, kind: kind, numRows: numRows};
        this.datasets[id] = [insightDataset, zipContent]; // add ZipContent to Dataset
        if (kind === InsightDatasetKind.Rooms) {
            this.handleRoomsData(id);
        }
        // update datasets.json in disk
        let stringifiedDatasets;
        if (kind === InsightDatasetKind.Rooms) { // circular references need to be handled for JSON.stringify to work
            stringifiedDatasets = JSON.stringify(this.datasets, handleCircularReferences());
        } else if (kind === InsightDatasetKind.Courses) {
            stringifiedDatasets = JSON.stringify(this.datasets);
        }
        fs.writeFileSync("./data/datasets.json", stringifiedDatasets);
        return Promise.resolve(Object.keys(this.datasets));

        // removes the circular references
        function handleCircularReferences() {
            const observed = new Set();
            return (key: any, value: any) => {
                if (value !== null && typeof value === "object") {
                    if (observed.has(value)) { // doesn't add or return value if it is already present
                        return;
                    }
                    observed.add(value);
                }
                return value;
            };
        }
    }

    private handleRoomsData(id: string) {
        let indexHtm = Object.values(this.datasets[id][1])[0];
        let roomsHtm = Object.values(this.datasets[id][1]).slice(1, Object.values(this.datasets[id][1]).length - 1);
        let insightFacadeGetBuildingData = new InsightFacadeGetBuildingData(indexHtm, roomsHtm);
        let data: JSON[] = insightFacadeGetBuildingData.getData();
        this.datasets[id][1] = data;
    }

    private getInsightDatasets(): InsightDataset[] {
        let datasetValues: Array<Array<InsightDataset | JSON[]>>;
        let insightDatasets: Array<InsightDataset | JSON[]>; // Only takes in insightDatasets
        datasetValues = Object.values(this.datasets);
        insightDatasets = datasetValues.map(function (innerArray) {
            return innerArray[0];
        });
        return insightDatasets as InsightDataset[];
    }

    private isValidID(id: string): boolean {
        // id isn't null and doesn't have underscore and isn't only whitespace
        return id && !id.includes("_") && id.trim().length !== 0;
    }

    // counts the number of rows in zip file
    private countRows(arr: any[]): number {
        let total = 0;
        for (let course of arr) {
            let result: any[] = course["result"];
            if (result) {
                total += result.length;
            }
        }
        return total;
    }
}
