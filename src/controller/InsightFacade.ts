import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, ResultTooLargeError} from "./IInsightFacade";
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
        // Creation of all promises
        let promiseZipFile: Promise<any>;
        let promiseTimeDelay = new Promise((resolve, reject) => {
            setTimeout(resolve, 1900, "artificial wait"); });
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
            } else if (Object.keys(zip.files)[0] !== "courses/") {
                return Promise.reject(new InsightError("incorrect folder name"));
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
        try { // validate the query
            this.validateQuery(query);
        } catch {
            return Promise.reject(new InsightError("invalid query"));
        }
        let rawResult: any[] = this.findQueryResults(query["WHERE"]); // get all sections fitting the criteria
        if (rawResult.length >= 5000) {
            return Promise.reject(new ResultTooLargeError());
        }
        this.outputResults(rawResult, query["OPTIONS"]); // format and output the sections
        return Promise.resolve([]);
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.resolve(this.getInsightDatasets());
    }

    /* PRIVATE HELPER FUNCTIONS */
    private findQueryResults(where: any): any[] {
        let key = Object.keys(where)[0];
        let result: any[] = [];
        switch (key) {
            case "AND":
                let andList: any[] = [];
                for (let i = 0; i < Object.values(where[key]).length; i++) {
                    andList.push(this.findQueryResults(where[key][i]));
                }
                result = (this.findCommon(andList));
                break;
            case "OR":
                for (let i = 0; i < Object.values(where[key]).length; i++) {
                    result.push(this.findQueryResults(where[key][i]));
                }
                break;
            case "LT":
                this.findLessThan(where[key]);
                result = this.findLessThan(where[key]);
                break;
            case "GT":
                result = this.findGreaterThan(where[key]);
                break;
            case "EQ":
                result = this.findEqualTo(where[key]);
                break;
            case "IS":
                result = this.findIs(where[key]);
                break;
            case "NOT":
                result = this.findNot(where[key]);
                break;
            default:
        }
        return flattenList(result, []);
        // flattens the array for recursive purposes of findQueryResults
        function flattenList(list: any[], accumulator: any[]) {
            for (let i = 0, length = list.length; i < length; i++) {
                const element = list[i];
                if (Array.isArray(element)) {
                    flattenList(element, accumulator);
                } else {
                    accumulator.push(element);
                }
            }
            return accumulator;
        }
    }

    private outputResults(rawResults: any[], options: any): any[] {
        return rawResults;
    }

    private findCommon(list: any[][]): any[] {
        let elementFrequency: number[] = [];
        let result: any[] = [];
        for (let i = 0; i < list.length; i++) {
            for (let j = 0; j < list[i].length; j++) {
                if (elementFrequency[list[i][j]]) {
                    elementFrequency[list[i][j]]++; // increment frequency of element in arrays
                } else {
                    elementFrequency[list[i][j]] = 1;
                }
                // if frequency is same as number of sub arrays
                if (elementFrequency[list[i][j]] === list.length) {
                    result.push(list[i][j]);
                }
            }
        }
        return result;
    }

    // Handles the "LT" part of a query, returns all section fitting the criteria
    private findLessThan(where: any): any[] {
        let result: any[] = [];
        let list2 = Object.values(Object.values(this.datasets)[0][1]);
        for (let i = 0; i < Object.keys(list2).length; i++) {
            let innerList = Object.values(list2[i]);
            for (let j = 0; j < innerList.length; j++) { // iterate over courses
                let course = Object.values(innerList[j]);
                if (innerList[j] !== 0 && innerList[j] !== [] && innerList[j] !== undefined && course.length !== 0) {
                    for (let k = 0; k < course.length; k++) { // iterate over sections
                        let section = course[k];
                        let accessKey = this.processString(Object.keys(where)[0]);
                        let sectionsAttribute = section[accessKey];
                        if (sectionsAttribute < Object.values(where)[0]) { // less than
                            result.push(course);
                        }
                    }
                }
            }
        }
        return result;
    }

    // Handles the "GT" part of a query, returns all sections fitting the criteria
    private findGreaterThan(where: any): any[] {
        let result: any[] = [];
        let list2 = Object.values(Object.values(this.datasets)[0][1]);
        for (let i = 0; i < Object.keys(list2).length; i++) {
            let innerList = Object.values(list2[i]);
            for (let j = 0; j < innerList.length; j++) { // iterate over courses
                let course = Object.values(innerList[j]);
                if (innerList[j] !== 0 && innerList[j] !== [] && innerList[j] !== undefined && course.length !== 0) {
                    for (let k = 0; k < course.length; k++) { // iterate over sections
                        let section = course[k];
                        let accessKey = this.processString(Object.keys(where)[0]);
                        let sectionsAttribute = section[accessKey];
                        if (sectionsAttribute > Object.values(where)[0]) { // greater than
                            result.push(course);
                        }
                    }
                }
            }
        }
        return result;
    }

    // Handles the "EQ" part of a query, returns all sections fitting the criteria
    private findEqualTo(where: any): any[] {
        let result: any[] = [];
        let list2 = Object.values(Object.values(this.datasets)[0][1]);
        for (let i = 0; i < Object.keys(list2).length; i++) {
            let innerList = Object.values(list2[i]);
            for (let j = 0; j < innerList.length; j++) { // iterate over courses
                let course = Object.values(innerList[j]);
                if (innerList[j] !== 0 && innerList[j] !== [] && innerList[j] !== undefined && course.length !== 0) {
                    for (let k = 0; k < course.length; k++) { // iterate over sections
                        let section = course[k];
                        let accessKey = this.processString(Object.keys(where)[0]);
                        let sectionsAttribute = section[accessKey];
                        if (sectionsAttribute === Object.values(where)[0]) { // equal to
                            result.push(course);
                        }
                    }
                }
            }
        }
        return result;
    }

    // Handles the "IS" part of a query, returns all sections fitting the criteria
    private findIs(where: any): any[] {
        let result: any[] = [];
        let list2 = Object.values(Object.values(this.datasets)[0][1]);
        for (let i = 0; i < Object.keys(list2).length; i++) {
            let innerList = Object.values(list2[i]);
            for (let j = 0; j < innerList.length; j++) { // iterate over courses
                let course = Object.values(innerList[j]);
                if (innerList[j] !== 0 && innerList[j] !== [] && innerList[j] !== undefined && course.length !== 0) {
                    for (let k = 0; k < course.length; k++) { // iterate over sections
                        let section = course[k];
                        let accessKey = this.processString(Object.keys(where)[0]);
                        let sectionsAttribute: string = section[accessKey];
                        if (sectionsAttribute === Object.values(where)[0]) { // equivalent strings
                            result.push(course);
                        }
                    }
                }
            }
        }
        return result;
    }

    // Handles the "EQ" part of a query, returns all sections fitting the criteria
    private findNot(where: any): any[] {
        let result: any[] = [];
        let list2 = Object.values(Object.values(this.datasets)[0][1]);
        for (let i = 0; i < Object.keys(list2).length; i++) {
            let innerList = Object.values(list2[i]);
            for (let j = 0; j < innerList.length; j++) { // iterate over courses
                let course = Object.values(innerList[j]);
                if (innerList[j] !== 0 && innerList[j] !== [] && innerList[j] !== undefined && course.length !== 0) {
                    for (let k = 0; k < course.length; k++) { // iterate over sections
                        let section = course[k];
                        let accessKey = this.processString(Object.keys(where)[0]);
                        let sectionsAttribute = section[accessKey];
                        if (sectionsAttribute !== Object.values(where)[0]) { // not
                            result.push(course);
                        }
                    }
                }
            }
        }
        return result;
    }

    // Returns the key used to access the variable asked in the key of <id>_<key>
    private processString(name: string): string {
        let parts: string[] = name.split("_");
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
            default:
                return "error";
        }
    }

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

    // Validates Queries
    private validateQuery(query: any) {
        const keys = Object.keys(query);
        if (keys.length !== 2) {
            throw new InsightError();
        }
        if ((keys[0] === "WHERE" && keys[1] === "OPTIONS") || (keys[0] === "OPTIONS" && keys[1] === "WHERE")) {
            this.validateFilter(query["WHERE"]);
            this.validateOptions(query["OPTIONS"]);
        } else {
            throw new InsightError();
        }
    }

    // Validates Filter (where) part of a query
    private validateFilter(where: any) {
        if (!(typeof where === "object" && where !== null)) {
            throw new InsightError();
        }
        const keys = Object.keys(where);
        if (keys.length !== 1) {
            throw new InsightError();
        }
        const key = keys[0];
        switch (key) {
            case "AND":
            case "OR":
                this.validateLOGIC(where[key]);
                break;
            case "LT":
            case "GT":
            case "EQ":
                this.validateMCOMPARISON(where[key]);
                break;
            case "IS":
                this.validateIS(where[key]);
                break;
            case "NOT":
                this.validateNOT(where[key]);
                break;
            default:
                throw new InsightError();
        }
    }

    // Validates Options part of a query
    private validateOptions(options: any) {
        if (!this.isObject(options)) {
            throw new InsightError();
        }
        const keys = Object.keys(options);
        if (keys.length === 1) {
            const key = keys[0];
            if (key === "COLUMNS") {
                this.validateColumns(options[key]);
            } else {
                throw new InsightError();
            }
        } else if (keys.length === 2
            && (keys[0] === "COLUMNS" && keys[1] === "ORDER" || keys[0] === "ORDER" && keys[1] === "COLUMNS")) {
            this.validateColumns(options["COLUMNS"]);
            this.validateOrder(options); // validate order needs to know what the columns are
        } else {
            throw new InsightError();
        }
    }

    private validateColumns(columns: any) {
        if (!Array.isArray(columns)) {
            throw new InsightError();
        }

        for (let key of columns) {
            this.validateKey(key);
        }
    }

    private validateOrder(columnsObj: any) {
        const orderKey = columnsObj["ORDER"];
        const columnsKeys = columnsObj["COLUMNS"];
        if (typeof orderKey !== "string" || !columnsKeys.includes(orderKey)) {
            throw new InsightError();
        }
    }

    private validateKey(key: string) {
        let arr = key.split("_");
        if (!(arr.length === 2)) {
            throw new InsightError();
        }
        this.validateIDstring(arr[0]);
        this.validateField(arr[1]);
    }

    private validateIDstring(idstring: string) {
        if (!this.isValidID(idstring)) {
            throw new InsightError();
        }
    }

    private validateField(field: string) {
        if (!(InsightFacade.MKEYS.includes(field) || InsightFacade.SKEYS.includes(field))) {
            throw new InsightError();
        }
    }

    private validateLOGIC(logic: any) {
        if (!Array.isArray(logic) || logic.length === 0) {
            throw new InsightError();
        }

        for (let filter of Object.values(logic)) {
            this.validateFilter(filter);
        }
    }

    private validateMCOMPARISON(mcomp: any) {
        if (!this.isObject(mcomp)) {
            throw new InsightError();
        }
        const keys = Object.keys(mcomp);
        if (keys.length === 0 || keys.length > 1) {
            throw new InsightError();
        }
        const key = keys[0];
        this.validateMKEY(key);
        this.validateMCONTENT(mcomp[key]);
        // include tests for invalid mkey
    }

    private validateMKEY(mkey: string) {
        const mkeyarr = mkey.split("_");
        this.validateIDstring(mkeyarr[0]);
        this.validateMFIELD(mkeyarr[1]);
    }

    private validateMCONTENT(mcontent: any) {
        if (!(typeof mcontent === "number")) {
            throw new InsightError();
        }
    }

    private validateMFIELD(mfield: any) {
        if (!InsightFacade.MKEYS.includes(mfield)) {
            throw new InsightError();
        }
    }

    private validateIS(isObj: any) {
        const keys = Object.keys(isObj);
        if (keys.length === 0 || keys.length > 1) {
            throw new InsightError();
        }
        const key = keys[0];
        this.validateSKEY(key);
        this.validateSCONTENT(isObj[key]);
        // include tests for invalid mkey
    }

    private validateSKEY(skey: string) {
        const skeyarr = skey.split("_");
        this.validateIDstring(skeyarr[0]);
        this.validateSFIELD(skeyarr[1]);
    }

    private validateSFIELD(sfield: any) {
        if (!InsightFacade.SKEYS.includes(sfield)) {
            throw new InsightError();
        }
    }

    // check for asterisks
    private validateSCONTENT(scontent: any) {
        const pattern = /^\*?[^*]*\*?$/;
        if (!(typeof scontent === "string") || !(pattern.test(scontent))) {
            throw new InsightError();
        }
    }

    private validateNOT(notObj: any) {
        this.validateFilter(notObj);
    }

    private isObject(exp: any) {
        if (Array.isArray(exp)) {
            return false;
        }
        return typeof exp === "object" && exp !== null;
    }
}
