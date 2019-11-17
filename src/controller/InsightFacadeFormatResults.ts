import {Decimal} from "decimal.js";
export default class InsightFacadeFormatResults  {
    private static MKEYS = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
    private static SKEYS = ["dept", "id", "instructor", "dept", "title", "uuid", "fullname", "shortname", "number",
                            "name", "address", "type", "furniture", "href"];

    constructor() {
        // do nothing for constructor
    }

    // outputs the results according to given OPTIONS and TRANSFORMATIONS
    public outputResults(rawResults: any[], query: any): any[] {
        let results: any[] = this.formatResults(rawResults, query["OPTIONS"]);
        if (query["TRANSFORMATIONS"]) { // applies transformations to result
            let groupedResults = this.groupResults(rawResults, query["TRANSFORMATIONS"]);
            results = this.transformResults(groupedResults, query["TRANSFORMATIONS"], query["OPTIONS"]["COLUMNS"]);
        }
        results = this.sortResults(results, query["OPTIONS"]["ORDER"]);
        return results;
    }

    // formats results according to the given OPTIONS
    private formatResults(rawResults: any[], options: any): any[] {
        let result: any[] = [];
        let columns: string[] = Object.values(options["COLUMNS"]);
        for (let section of rawResults) {
            let sectionObject: any = {};
            for (let column of columns) { // column is the key here
                if (InsightFacadeFormatResults.SKEYS.includes(column.split("_")[1])) {
                    sectionObject[column] = section[this.processString(column)].toString();
                } else if (InsightFacadeFormatResults.MKEYS.includes(column.split("_")[1])) {
                    sectionObject[column] = Number(section[this.processString(column)]);
                }
            }
            result.push(sectionObject);
        }
        return result;
    }

    // groups results according to the given GROUPS
    private groupResults(rawResults: any[], transformations: any): any[] {
        let groups: any[][] = [];
        let index: number = 0;
        for (let section of rawResults) {
            let groupIndex = this.groupAlreadyExists(section, groups, transformations["GROUP"]);
            if (groupIndex !== -1) {
                groups[groupIndex].push(section);
            } else {
                groups[index] = [];
                groups[index].push(section);
                index++;
            }
        }
        return groups;
    }

    // transforms results according to the given APPLY and COLUMNS
    private transformResults(groupedResults: any[], transformations: any, columns: any): any[] {
        let result: any[] = [];
        for (let group of groupedResults) {
            let sectionObject: any = {};
            for (let column of columns) {
                let key = this.processString(column);
                if (key !== null) {
                    sectionObject[column] = group[0][key];
                } else {
                    sectionObject[column] = this.handleApply(column, transformations["APPLY"], group);
                }
            }
            result.push(sectionObject);
        }
        return result;
    }

    // Returns a sorted list according to given order parameter
    private sortResults(unsortedResult: any[], order: any): any[] {
        if (order === undefined) {
            return unsortedResult; // nothing to do if there is no order
        } else if (typeof order === "string") {
            order = order.toString();
            return unsortedResult.sort((member1, member2) => {
                if (member1[order] > member2[order]) {
                    return 1;
                } else if (member1[order] < member2[order]) {
                    return -1;
                } else {
                    return 0;
                }
            });
        } else {
            let result: any[] = unsortedResult.sort((member1, member2) => {
                for (let i = 0; i < Object.values(order["keys"]).length; i++) {
                    // check for each key if the first key is the same
                    if (member1[order["keys"][i]] > member2[order["keys"][i]]) {
                        return 1;
                    } else if (member1[order["keys"][i]] < member2[order["keys"][i]]) {
                        return -1;
                    }
                }
                return 0; // if all keys give identical results
            });
            if (order["dir"] === "DOWN") {
                return result.reverse();
            } else {
                return result;
            }
        }

    }

    // returns -1 if group doesn't exist and returns index of group if it exists
    private groupAlreadyExists(section: any, groups: any[][], groupsToApply: string[]): number {
        // iterate in reverse as sections occur in succession as part of a course and so are most
        // likely to match with a group that has been added recently
        for (let index = groups.length - 1; index >= 0; index--) {
            if (this.hasSameProperties(section, groups[index], groupsToApply)) {
                return index;
            }
        }
        return -1;
    }

    private hasSameProperties(section: any, group: any[], groupsToApply: string[]): boolean {
        for (let property of groupsToApply) {
            let key = this.processString(property);
            if (section[key] !== group[0][key]) {
                return false;
            }
        }
        return true;
    }

    private handleApply(toApply: string, applyArray: any, group: any): number {
        let calculation;
        for (let member of applyArray) {
            if (Object.keys(member)[0] === toApply) {
                calculation = member[toApply];
            }
        }
        let tempKey = (Object.values(calculation)[0]), key = this.processString(tempKey.toString());
        switch (Object.keys(calculation)[0]) {
            case "MAX":
                let resultMax = group[0][key];
                for (let section of group) {
                    if (section[key] > resultMax) {
                        resultMax = section[key];
                    }
                }
                return resultMax;
            case "MIN":
                let resultMin = group[0][key];
                for (let section of group) {
                    if (section[key] < resultMin) {
                        resultMin = section[key];
                    }
                }
                return resultMin;
            case "AVG":
                let total: Decimal = new Decimal(0);
                for (let section of group) {
                    total = total.add(new Decimal(section[key]));
                }
                let resultAvg: number = total.toNumber() / Object.values(group).length;
                return Number(resultAvg.toFixed(2));
            case "SUM":
                let resultSum: Decimal = new Decimal(0);
                for (let section of group) {
                    resultSum = resultSum.add(new Decimal(section[key]));
                }
                return Number(resultSum.toFixed(2));
            case "COUNT":
                let resultCount = 0;
                let list: number[] = [];
                for (let section of group) {
                    if (!list.includes(section[key])) {
                        list.push(section[key]);
                        resultCount++;
                    }
                }
                return resultCount;
        }
    }

    // Returns the key used to access the variable asked in the key of <id>_<key>
    // Returns null if key is invalid
    private processString(name: string): string {
        let parameter: string = name.split("_")[1];
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
            case "fullname":
                return "fullname";
            case "shortname":
                return "shortname";
            case "number":
                return "number";
            case "name":
                return "name";
            case "address":
                return "address";
            case "lat":
                return "lat";
            case "lon":
                return "lon";
            case "seats":
                return "seats";
            case "type":
                return "type";
            case "furniture":
                return "furniture";
            case "href":
                return "href";
            default:
                return null;
        }
    }
}
