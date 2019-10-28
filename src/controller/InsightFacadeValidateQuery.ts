import {InsightError} from "./IInsightFacade";
export default class InsightFacadeValidateQuery {
    private static APPLY = ["MAX", "MIN", "AVG", "SUM", "COUNT"];
    private static QUERY_KEYS = ["OPTIONS", "WHERE", "TRANSFORMATIONS"];
    private static MKEYS = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
    private static SKEYS = ["dept", "id", "instructor", "dept", "title", "uuid", "fullname", "shortname", "number",
                            "name", "address", "type", "furniture", "href"];

    private datasetBeingQueried: string = "";
    private id: string;
    private applyKeys: Map<string, boolean> = new Map<string, boolean>(); // apply keys to be checked later
    constructor() { // do nothing
    }

    public validateQuery(query: any): string { // Validates Queries
        const keys = Object.keys(query);
        this.validateQueryMembers(keys);
        if ((keys.includes("WHERE") && keys.includes("OPTIONS"))) {
            this.validateFilter(query["WHERE"]);
            this.validateOptions(query["OPTIONS"]);
        } else {
            throw new InsightError();
        }
        if (keys.includes("TRANSFORMATIONS")) {
            this.validateTransformations(query["TRANSFORMATIONS"]);
        }
        this.checkApplyKeys();
        return this.datasetBeingQueried;
    }

    private validateFilter(where: any) { // Validates Filter (where) part of a query
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

    private validateQueryMembers(keys: any) { // Validates top level members of a query
        if (keys.length < 2 || keys.length > 3) {
            throw new InsightError();
        }
        for (let key of keys) {
            if (!InsightFacadeValidateQuery.QUERY_KEYS.includes(key)) {
                throw new InsightError("Querying on something other than OPTIONS, WHERE or TRANSFORMATIONS");
            }
        }
    }

    private validateOptions(options: any) { // Validates Options part of a query
        if (!this.isObject(options)) {
            throw new InsightError("options is not an object");
        }
        const keys = Object.keys(options);
        if (keys.length === 1) {
            if (keys[0] === "COLUMNS") {
                this.validateColumns(options[keys[0]]);
            } else {
                throw new InsightError();
            }
        } else if (keys.length === 2 && keys.includes("COLUMNS") && keys.includes("ORDER")) {
            this.validateColumns(options["COLUMNS"]);
            this.validateOrder(options); // validate order needs to know what the columns are
        } else {
            throw new InsightError();
        }
    }

    private validateTransformations(tranformations: any) { // Validates Transformations part of a query
        if (!this.isObject(tranformations)) {
            throw new InsightError("transformations is not an object");
        }
        const keys = Object.keys(tranformations);
        if (!keys.includes("APPLY") || !keys.includes("GROUP") || keys.length > 2) {
            throw new InsightError("Transformations is missing APPLY and/or GROUP, or has extra members");
        }
        this.validateApply(tranformations["APPLY"]);
        this.validateGroup(tranformations["GROUP"]);
    }

    private validateColumns(columns: any) {
        if (!Array.isArray(columns)) {
            throw new InsightError();
        }

        for (let key of columns) {
            if (key.includes("_")) {
                this.validateKey(key);
            } else {
                this.applyKeys.set(key, false);
            }
        }
    }

    private validateOrder(columnsObj: any) {
        const orderKey = columnsObj["ORDER"];
        const columnsKeys = columnsObj["COLUMNS"];
        if (typeof orderKey === "string") {
            if (!columnsKeys.includes(orderKey)) {
                throw new InsightError("Order key must be in columns");
            }
        } else if (this.isObject(orderKey)) {
            this.validateOrderArray(orderKey, columnsKeys);
        } else {
            throw new InsightError("Invalid Order type");
        }
    }

    private validateOrderArray(orderKey: any[], columnsKeys: string[]) {
        if (!Object.keys(orderKey).includes("dir") || !Object.keys(orderKey).includes("keys") ||
                                                                                    Object.keys(orderKey).length > 2) {
            throw new InsightError("Order does not have dir and/or keys, or has extra keys");
        } // Validate Direction
        let dirKey = (orderKey as { [key: string]: any })["dir"] as string; // for ts lint weirdness
        if (dirKey !== "UP" && dirKey !== "DOWN") {
            throw new InsightError("Invalid order dir");
        }
        if (!Array.isArray(orderKey["keys"]) || (orderKey["keys"]).length === 0) {
            throw new InsightError("keys in ORDER is not an array or is an empty array");
        }
        for (let member of orderKey["keys"]) {
            if (!columnsKeys.includes(member)) { // Validate key is in column (column will validate it, so we don't)
                throw new InsightError("Order key must be in columns");
            }
        }
    }

    private validateApply(apply: any[]) {
        if (!Array.isArray(apply)) {
            throw new InsightError("APPLY is not an array");
        }
        for (let member of apply) {
            if (!this.isObject(member) || Object.keys(Object.values(member)[0]).length > 1) {
                throw new InsightError("APPLY includes a non-object or object with more than 1 key");
            }
            if (!InsightFacadeValidateQuery.APPLY.includes(Object.keys(Object.values(member)[0])[0])) {
                throw new InsightError("Invalid APPLY calculation");
            }
            this.validateKey((Object.values(Object.values(member)[0])[0]).toString());
            this.applyKeys.set(Object.keys(member)[0], true); // set that this column and apply member is valid
        }
    }

    private validateGroup(group: any) {
        if (!Array.isArray(group)) {
            throw new InsightError("GROUP is not an array");
        }
        for (let member of group) {
            this.validateKey(member);
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
        if (!(InsightFacadeValidateQuery.MKEYS.includes(field) || InsightFacadeValidateQuery.SKEYS.includes(field))) {
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
        if (!InsightFacadeValidateQuery.MKEYS.includes(mfield)) {
            throw new InsightError();
        }
    }

    private validateIS(isObj: any) {
        const keys = Object.keys(isObj);
        if (keys.length !== 1) {
            throw new InsightError();
        }
        const key = keys[0];
        this.validateSKEY(key);
        this.validateSCONTENT(isObj[key]);
    }

    private validateSKEY(skey: string) {
        const skeyarr = skey.split("_");
        this.validateIDstring(skeyarr[0]);
        this.validateSFIELD(skeyarr[1]);
    }

    private validateSFIELD(sfield: any) {
        if (!InsightFacadeValidateQuery.SKEYS.includes(sfield)) {
            throw new InsightError();
        }
    }

    private validateSCONTENT(scontent: any) { // checks for asterisks
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

    private checkApplyKeys() {
        for (let key in this.applyKeys.keys()) {
            if (this.applyKeys.get(key) === false) {
                throw new InsightError("Invalid key in column");
            }
        }
    }

    private isObject(exp: any) {
        if (Array.isArray(exp)) {
            return false;
        }
        return typeof exp === "object" && exp !== null;
    }

    private isValidID(id: string): boolean {
        return !id.includes("_") && id.trim().length !== 0;  // Doesn't have underscore and isn't only whitespace
    }
}
