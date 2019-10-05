import {InsightDataset, InsightError} from "./IInsightFacade";

export default class InsightFacadeFindQueryResults  {
    private datasets: { [id: string]: Array<InsightDataset | JSON[]> } = {};
    private datasetBeingQueried: string;
    constructor(ourDataset: { [id: string]: Array<InsightDataset | JSON[]> }, datasetBeingQueried: string) {
        this.datasets = ourDataset;
        this.datasetBeingQueried = datasetBeingQueried;
    }
    // Finds all of the sections that fit the criteria and returns them (in the same format as our dataset)
    public findQueryResults(where: any): any[] {
        let key = Object.keys(where)[0];
        let result: any[] = [];
        let queryDataset = Object.values(Object.values(this.datasets[this.datasetBeingQueried])[1]);
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
                result = this.findLessThan(where[key], queryDataset);
                break;
            case "GT":
                result = this.findGreaterThan(where[key], queryDataset);
                break;
            case "EQ":
                result = this.findEqualTo(where[key], queryDataset);
                break;
            case "IS":
                result = this.findIs(where[key], queryDataset);
                break;
            case "NOT":
                result = this.findAllSections(queryDataset);
                // removes all the sections (from result) returned by the inner query inside the NOT
                let toRemove: any[] = this.findQueryResults(where[key]);
                result = result.filter(function (index) {
                    return !toRemove.includes(index);
                });
                break;
            default:
                result = this.findAllSections(queryDataset);
        }
        return this.flattenList(result, []);
    }

    // flattens the array for recursive purposes of findQueryResults
    private flattenList(list: any[], accumulator: any[]) {
        for (let i = 0, length = list.length; i < length; i++) {
            const element = list[i];
            if (Array.isArray(element)) {
                this.flattenList(element, accumulator);
            } else {
                accumulator.push(element);
            }
        }
        return accumulator;
    }
    // Returns only the elements that exist in all sub-lists of given list
    private findCommon(list: any[][]): any[] {
        let elementFrequency: any[] = []; // List of frequencies of each subMember, indexed by the subMember's uuid
        let result: any[] = [];
        for (let member of list) {
            for (let subMember of member) {
                if (elementFrequency[subMember["id"]]) {
                    elementFrequency[subMember["id"]]++; // increment frequency of element in arrays
                } else {
                    elementFrequency[subMember["id"]] = 1;
                }
                // if frequency is same as number of sub arrays
                if (elementFrequency[subMember["id"]] === list.length) {
                    result.push(subMember);
                }
            }
        }
        return result;
    }

    // Handles the "LT" part of a query, returns all section fitting the criteria
    private findLessThan(where: any, queryDataset: any): any[] {
        let result: any[] = [];
        for (let index1 of queryDataset) {
            let innerList = Object.values(index1);
            for (let index2 of innerList) { // iterate over courses
                let course = Object.values(index2);
                if (course.length !== 0) {
                    for (let section of course) { // iterate over sections
                        let accessKey = this.processString(Object.keys(where)[0]);
                        let sectionsAttribute = section[accessKey];
                        if (sectionsAttribute < Object.values(where)[0]) { // less than
                            result.push(section);
                        }
                    }
                }
            }
        }
        return result;
    }

    // Handles the "GT" part of a query, returns all sections fitting the criteria
    private findGreaterThan(where: any, queryDataset: any): any[] {
        let result: any[] = [];
        for (let index1 of queryDataset) {
            let innerList = Object.values(index1);
            for (let index2 of innerList) { // iterate over courses
                let course = Object.values(index2);
                if (course.length !== 0) {
                    for (let section of course) { // iterate over sections
                        let accessKey = this.processString(Object.keys(where)[0]);
                        let sectionsAttribute = section[accessKey];
                        if (sectionsAttribute > Object.values(where)[0]) { // greater than
                            result.push(section);
                        }
                    }
                }
            }
        }
        return result;
    }

    // Handles the "EQ" part of a query, returns all sections fitting the criteria
    private findEqualTo(where: any, queryDataset: any): any[] {
        let result: any[] = [];
        for (let index1 of queryDataset) {
            let innerList = Object.values(index1);
            for (let index2 of innerList) { // iterate over courses
                let course = Object.values(index2);
                if (course.length !== 0) {
                    for (let section of course) { // iterate over sections
                        let accessKey = this.processString(Object.keys(where)[0]);
                        let sectionsAttribute = section[accessKey];
                        if (sectionsAttribute === Object.values(where)[0]) { // equal to
                            result.push(section);
                        }
                    }
                }
            }
        }
        return result;
    }

    // Handles the "IS" part of a query, returns all sections fitting the criteria
    private findIs(is: any, queryDataset: any): any[] {
        let result: any[] = [];
        const exactMatch = /^[^*]*$/;
        const endsWith = /^\*[^*]*$/;
        const startsWith = /^[^*]*\*$/;
        for (let index1 of queryDataset) {
            let innerList = Object.values(index1);
            for (let index2 of innerList) { // iterate over courses
                let course = Object.values(index2);
                if (course.length !== 0) {
                    for (let section of course) { // iterate over sections
                        let accessKey = this.processString(Object.keys(is)[0]); // sfield
                        let sectionsAttribute = section[accessKey]; // scontent
                        if (typeof sectionsAttribute !== "string") {
                            sectionsAttribute = sectionsAttribute.toString();
                        }
                        let matchString: string = Object.values(is)[0] as string; // pattern to match
                        let inputString;
                        if (exactMatch.test(matchString)) {
                            if (sectionsAttribute === matchString) { // equivalent string
                                result.push(section);
                            }
                        } else if (endsWith.test(matchString)) {
                            inputString = matchString.slice(1);
                            if (sectionsAttribute.endsWith(inputString)) {
                                result.push(section);
                            }
                        } else if (startsWith.test(matchString)) {
                            inputString = matchString.substring(0, matchString.length - 1);
                            if (sectionsAttribute.startsWith(inputString)) {
                                result.push(section);
                            }
                        } else { // all cases failed so must be contains case
                            inputString = matchString.substring(1, matchString.length - 1);
                            if (sectionsAttribute.includes(inputString)) {
                                result.push(section);
                            }
                        }
                    }
                }
            }
        }
        return result;
    }

    // Finds all the sections in our dataset
    private findAllSections(queryDataset: any): any[] {
        let result: any[] = [];
        for (let index1 of queryDataset) {
            let innerList = Object.values(index1);
            for (let index2 of innerList) { // iterate over courses
                let course = Object.values(index2);
                if (course.length !== 0) {
                    for (let section of course) { // iterate over sections
                        result.push(section);
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
        if (Object.keys(this.datasets)[0] !== parts[0]) {
            throw new InsightError();
        }
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
