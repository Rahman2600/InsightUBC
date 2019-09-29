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
    // {id : [InsightDataset, {'#This is an array of all dataset's courses (which are JSON)'}]}
    private datasets: {[id: string]: Array<InsightDataset | JSON[]>} = {};

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (!this.isValidID(id)) {
            return Promise.reject(new InsightError("Dataset id string is invalid"));
        }
        let insightDataset: InsightDataset = {id: id, kind: kind, numRows: 64612};
        this.datasets[id] = [insightDataset, null];
        // The rest is all asynchronous stuff, which makes sure everything all the content is read and added
        let zip: JSZip = new JSZip();    // Zip
        let zipContent: JSON[] = [];
        // Creation of all promises
        let promise1: Promise<any>;
        let p1 = new Promise((resolve, reject) => {
            setTimeout(resolve, 1500, "hmm");
        });
        let promiseList: Array<Promise<any>> = new Array<Promise<any>>();
        promise1 = zip.loadAsync(content, {base64: true}).then(() => {
            zip.forEach(function (file) {
                if (zip.file(file) != null) {
                    promiseList.push(zip.file(file).async("text").then((stuff) => {
                        zipContent.push(JSON.parse(stuff));
                    }).catch((err) => {
                        Promise.reject(new InsightError("Error in reading content"));
                    }));
                }
            });
        }).catch(function () {
            return Promise.reject(new InsightError("Problems with zip file"));
        });

        Promise.all([p1, promise1, promiseList.values()]).then(() => {
            this.datasets[id] = [insightDataset, zipContent]; // add ZipContent to Dataset
            // update datasets.json in disk
            fs.writeFile("./data/datasets.json", JSON.stringify(this.datasets), function (error) {
                if (error) {
                    Log.error("Error occurred while writing JSON datasets to file");
                }
            });
            return Promise.resolve(Object.keys(this.datasets));
        }).catch(function () {
            return Promise.reject(new InsightError("Problem with zip content"));
        });

        return Promise.resolve(Object.keys(this.datasets));
        // return Promise.reject(new InsightError("Something failed"));
    }

    public removeDataset(id: string): Promise<string> {
        if (!this.isValidID(id)) {
            return Promise.reject(new InsightError("Dataset id string is invalid"));
        }

        if (Object.keys(this.datasets).includes(id)) {
            delete this.datasets[id];    // delete entry
            // update datasets.json
            fs.writeFile("../data/datasets.json", JSON.stringify(this.datasets), function (error) {
                if (error) {
                    Log.error("Error occured while writing JSON datasets to file");
                }
            });
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

    private isValidJSON(zipContent: string): boolean {
        // try {
        //     JSON.parse(zipContent);
        // } catch (error) {
        //     return false;
        // }
        return true;
    }

    private isValidID(id: string): boolean {
        return !id.includes("_") && id.trim().length !== 0;
    }
}
