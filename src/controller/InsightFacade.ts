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

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    // {key: [InsightDataset, JSON[] ] } This is the overall structure
    // {id : [InsightDataset, {'#This is an array of all dataset's courses (which are JSON)'}]}
    private datasets: { [id: string]: Array<InsightDataset | JSON[]> } = {};
    private static MKEYS = ["avg", "pass", "fail", "audit", "year"];
    private static SKEYS = ["dept", "id", "instructor", "dept", "title", "uuid"];
    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (!this.isValidID(id)) {
            return Promise.reject(new InsightError("Dataset id string is invalid"));
        }
        let atLeastOneValidSection: boolean = false;
        let zip: JSZip = new JSZip();    // Zip and their content
        let zipContent: JSON[] = [];
        let promiseCourseSections: Array<Promise<any>> = new Array<Promise<any>>();
        /* Unzip the zip file, iterate over the content and read it (saving it in the process) */
        // Wraps all of the promises so that we can wait for them to resolve
        let promiseFinal: Promise<string[]> = new Promise((resolve, reject) => {
            zip.loadAsync(content, {base64: true}).then(() => {
                zip.forEach(function (file) { // iterate over course sections
                    if (zip.file(file) != null) {
                        promiseCourseSections.push(zip.file(file).async("text").then((stuff) => {
                            zipContent.push(JSON.parse(stuff));
                            atLeastOneValidSection = true; // as JSON.parse() did not throw an error
                        }).catch(() => {
                            // Skip over invalid file
                        }));
                    }
                });
                // Return when all promises are resolved
                Promise.all(promiseCourseSections).then((): any => {
                    if (!atLeastOneValidSection) {
                        return Promise.reject(new InsightError("No valid course sections in the zip"));
                    } else if (!Object.keys(zip.files)[0].includes("courses/")) {
                        return Promise.reject(new InsightError("incorrect folder name"));
                    }
                    let insightDataset: InsightDataset = {id: id, kind: kind, numRows: 64612};
                    this.datasets[id] = [insightDataset, zipContent]; // add ZipContent to Dataset
                    // update datasets.json in disk
                    fs.writeFileSync("./data/datasets.json", JSON.stringify(this.datasets));
                    return resolve(Object.keys(this.datasets));
                }).catch(function () {
                    return reject(new InsightError("Problem with zip content"));
                });
            }).catch(function () {
                return reject(new InsightError("Problems with zip file"));
            });
        });
        return promiseFinal.catch(function () { // does not need a .then as that is handled in the inner functions
            return Promise.reject(new InsightError("Problems with zip file"));
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
            if (!Object.keys(this.datasets).includes(datasetBeingQueried)) {
                return Promise.reject(new InsightError("Dataset being queried has not been added"));
            }
            let insightFacadeFindQueryResults = new InsightFacadeFindQueryResults(this.datasets, datasetBeingQueried);
            rawResult = insightFacadeFindQueryResults.findQueryResults(query["WHERE"]);
        } catch {
            return Promise.reject(new InsightError("invalid query"));
        }
        if (rawResult.length >= 5000) {
            return Promise.reject(new ResultTooLargeError());
        }
        let results: any[];
        try {
            results = this.outputResults(rawResult, query["OPTIONS"]);
        } catch {
            return Promise.reject(new InsightError("invalid query"));
        }
        return Promise.resolve(results); // format and output the sections);
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.resolve(this.getInsightDatasets());
    }

    /* PRIVATE HELPER FUNCTIONS */
    private outputResults(rawResults: any[], options: any): any[] {
        let result: any[] = [];
        let columns: string[] = Object.values(options["COLUMNS"]);
        for (let section of rawResults) {
            let sectionObject: any = {};
            for (let column of columns) { // column is the key here
                if (InsightFacade.SKEYS.includes(column.split("_")[1])) {
                    sectionObject[column] = section[this.processString(column)].toString();
                } else if (InsightFacade.MKEYS.includes(column.split("_")[1])) {
                    sectionObject[column] = Number(section[this.processString(column)]);
                }
            }
            result.push(sectionObject);
        }
        result = this.sortResults(result, options["ORDER"]);
        return result;
    }

    // Returns a sorted list according to given order parameter
    private sortResults(unsortedResult: any[], order: string): any[] {
        return unsortedResult.sort((member1, member2) => {
            if (member1[order] > member2[order]) {
                return 1;
            } else if (member1[order] < member2[order]) {
                return -1;
            } else {
                return 0;
            }
        });
    }

    private getInsightDatasets(): InsightDataset[] {
        let datasetValues: Array<Array<InsightDataset | JSON[]>>;
        let insightDatasets: Array<InsightDataset | JSON[]>; // Only takes in insightDatasets
        datasetValues = Object.values(this.datasets), insightDatasets = datasetValues.map(function (innerArray) {
            return innerArray[0];
        });
        return insightDatasets as InsightDataset[];
    }

    private isValidID(id: string): boolean {
        // id isn't null and doesn't have underscore and isn't only whitespace
        return id && !id.includes("_") && id.trim().length !== 0;
    }

    // Returns the key used to access the variable asked in the key of <id>_<key>
    private processString(name: string): string {
        let parts: string[] = name.split("_");
        if (Object.keys(this.datasets)[0] !== parts[0]) {
            throw new InsightError();
        }
        let parameter: string = parts[1];
        switch (parameter) {
            case "dept":
                return "Subject";
            case "id":
                return "Course";
            case "avg":
                return "Avg";
            case "instructor":
                return "Professor";
            case "title":
                return "Title";
            case "pass":
                return "Pass";
            case "fail":
                return "Fail";
            case "audit":
                return "Audit";
            case "uuid":
                return "id";
            case "year":
                return "Year";
        }
    }
}
