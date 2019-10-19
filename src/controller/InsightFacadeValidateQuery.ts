import {InsightError} from "./IInsightFacade";

export default class InsightFacadeValidateQuery {
    private MKEYS = ["avg", "pass", "fail", "audit", "year"];
    private SKEYS = ["dept", "id", "instructor", "dept", "title", "uuid"];
    private datasetBeingQueried: string = "";
    private id: string;
    constructor() {
        // do nothing
    }

    // Validates Queries
    public validateQuery(query: any): string {
        // TODO: remove this. Only there until transfromation validation is made
        if (query["TRANSFORMATIONS"]) {
            return  "courses";
        }
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
        return this.datasetBeingQueried;
    }

// Validates Filter (where) part of a query
    private validateFilter(where: any) {
        if (!(typeof where === "object" && where !== null)) {
            throw new InsightError();
        }
        const keys = Object.keys(where);
        if (keys.length === 0) {
            return;
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
        if (!this.id) {
            this.id = idstring;
        } else if (this.id !== idstring) { // if querying on multiple IDs
            throw new InsightError();
        }
        this.datasetBeingQueried = idstring;
    }

    private validateField(field: string) {
        if (!(this.MKEYS.includes(field) || this.SKEYS.includes(field))) {
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
        if (!this.MKEYS.includes(mfield)) {
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
        if (!this.SKEYS.includes(sfield)) {
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
        if (Object.values(notObj).length === 1) {
            this.validateFilter(notObj);
        } else {
            throw new InsightError("NOT should have exactly 1 key");
        }
    }

    private isObject(exp: any) {
        if (Array.isArray(exp)) {
            return false;
        }
        return typeof exp === "object" && exp !== null;
    }

    private isValidID(id: string): boolean {
        // Doesn't have underscore and isn't only whitespace
        return !id.includes("_") && id.trim().length !== 0;
    }
}
