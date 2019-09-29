import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import * as fs from "fs";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    // {key: [InsightDataset, JSON[] ] } This is the overall structure
    // {id : [InsightDataset, {'#This is an array of all dataset's courses (which are JSON)'}]}
    private datasets: {[id: string]: Array<InsightDataset | JSON[]>} = {};

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
        // Creation of all promises
        let promiseZipFile: Promise<any>;
        let promiseTimeDelay = new Promise((resolve, reject) => {
            setTimeout(resolve, 1500, "hmm"); });
        let promiseCourseSections: Array<Promise<any>> = new Array<Promise<any>>();
        // Unzip the zip file, iterate over the content and read it (saving it in the process)
        promiseZipFile = zip.loadAsync(content, {base64: true}).then(() => {
            zip.forEach(function (file) { // iterate over course sections
                if (zip.file(file) != null) {
                    promiseCourseSections.push(zip.file(file).async("text").then((stuff) => {
                        zipContent.push(JSON.parse(stuff));
                        atLeastOneValidSection = true; // as JSON.parse() did not throw an error
                    }).catch((err) => {
                        // Skip over invalid file
                    }));
                }
            });
        }).catch(function () {
            return Promise.reject(new InsightError("Problems with zip file"));
        });
        // Return when all promises are resolved
        return Promise.all([promiseTimeDelay, promiseZipFile, promiseCourseSections.values()]).then(() => {
            if (!atLeastOneValidSection) {
                return Promise.reject(new InsightError("No valid course sections in the zip"));
            }
            let insightDataset: InsightDataset = {id: id, kind: kind, numRows: 64612};
            this.datasets[id] = [insightDataset, zipContent]; // add ZipContent to Dataset
            fs.writeFileSync("./data/datasets.json", JSON.stringify(this.datasets)); // update datasets.json in disk
            return Promise.resolve(Object.keys(this.datasets));
        }).catch(function () {
            return Promise.reject(new InsightError("Problem with zip content"));
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

    public performQuery(query: any): Promise <any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.resolve(this.getInsightDatasets());
    }

    /* PRIVATE HELPER FUNCTIONS */
    private getInsightDatasets(): InsightDataset[] {
        let datasetValues: Array<Array<InsightDataset|JSON[]>>;
        let insightDatasets: Array<InsightDataset|JSON[]>; // Only takes in insightDatasets
        datasetValues = Object.values(this.datasets), insightDatasets = datasetValues.map(function (innerArray) {
            return innerArray[0];
        });
        return insightDatasets as InsightDataset[];
    }

    private isValidID(id: string): boolean {
        // Doesn't have underscore and isn't only whitespace
        return !id.includes("_") && id.trim().length !== 0;
    }
}
