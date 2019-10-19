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
        let queryDataset = this.datasets[this.datasetBeingQueried][1];
        switch (key) {
            case "AND":
                let andList: any[] = [];
                for (let i = 0; i < Object.values(where[key]).length; i++) {
                    andList.push(this.findQueryResults(where[key][i]));
                }
                result = (this.findCommon(andList));
                break;
            case "OR":
                let orList: any[] = [];
                for (let i = 0; i < Object.values(where[key]).length; i++) {
                    orList.push(this.findQueryResults(where[key][i]));
                }
                result = this.removeDuplicates(orList);
                break;
            case "LT":
                result = this.finder(where[key], queryDataset, this.findLessThan);
                break;
            case "GT":
                result = this.finder(where[key], queryDataset, this.findGreaterThan);
                break;
            case "EQ":
                result = this.finder(where[key], queryDataset, this.findEqualTo);
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
        return result;
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

    // Returns the original list with all duplicate occurrences removed
    private removeDuplicates(list: any[][]): any[] {
        let elementFrequency: any[] = []; // List of frequencies of each subMember, indexed by the subMember's uuid
        let result: any[] = [];
        for (let member of list) {
            for (let subMember of member) {
                // add only if subMember hasn't been seen before, i.e. its not a part of elementFrequency
                if (!elementFrequency[subMember["id"]]) {
                    result.push(subMember);
                }
                elementFrequency[subMember["id"]] = 1; // indicates we have seen this element now
            }
        }
        return result;
    }

    // Handles "EQ", "GT" and "LT" part of a query depending on the comparisonFunction passed
    private finder(where: any, queryDataset: any, comparisonFunction: any): any[] {
        let result: any[] = [];
        for (let index of Object.values(queryDataset)) { // iterate over courses
            let course = Object.values(index)[0];
            for (let section of course) { // iterate over sections
                let accessKey = this.processString(Object.keys(where)[0]);
                let sectionAttribute = section[accessKey];
                sectionAttribute = this.handleYearOverall(sectionAttribute, accessKey, section);
                if (comparisonFunction(sectionAttribute, Object.values(where)[0])) { // call comparing function
                    result.push(section);
                }
            }
        }
        return result;
    }

    // Handles comparison for "LT" part of a query
    private findLessThan(sectionsAttribute: any, desiredAttribute: any): boolean {
        return sectionsAttribute < desiredAttribute;
    }

    // Handles comparison for "GT" part of a query
    private findGreaterThan(sectionsAttribute: any, desiredAttribute: any): boolean {
        return sectionsAttribute > desiredAttribute;
    }

    // Handles comparison for "EQ" part of a query
    private findEqualTo(sectionsAttribute: any, desiredAttribute: any): boolean {
        return sectionsAttribute === desiredAttribute;
    }

    // Handles the "IS" part of a query, returns all sections fitting the criteria
    private findIs(is: any, queryDataset: any): any[] {
        let result: any[] = [];
        const exactMatch = /^[^*]*$/;
        const endsWith = /^\*[^*]*$/;
        const startsWith = /^[^*]*\*$/;
        for (let index of Object.values(queryDataset)) { // iterate over courses
            let course = Object.values(index)[0];
            for (let section of course) { // iterate over sections
                let accessKey = this.processString(Object.keys(is)[0]); // sField
                let sectionAttribute = section[accessKey]; // sContent
                if (typeof sectionAttribute !== "string") {
                    sectionAttribute = sectionAttribute.toString();
                }
                let matchString: string = Object.values(is)[0] as string; // pattern to match
                let inputString;
                if (exactMatch.test(matchString)) {
                    if (sectionAttribute === matchString) { // equivalent string
                        result.push(section);
                    }
                } else if (endsWith.test(matchString)) {
                    inputString = matchString.slice(1);
                    if (sectionAttribute.endsWith(inputString)) {
                        result.push(section);
                    }
                } else if (startsWith.test(matchString)) {
                    inputString = matchString.substring(0, matchString.length - 1);
                    if (sectionAttribute.startsWith(inputString)) {
                        result.push(section);
                    }
                } else { // all cases failed so must be contains case
                    inputString = matchString.substring(1, matchString.length - 1);
                    if (sectionAttribute.includes(inputString)) {
                        result.push(section);
                    }
                }


            }
        }
        return result;
    }

    // Finds all the sections in our dataset
    private findAllSections(queryDataset: any): any[] {
        let result: any[] = [];
        for (let index of Object.values(queryDataset)) { // iterate over courses
            let course = Object.values(index)[0];
            for (let section of course) { // iterate over sections
                result.push(section);
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

    // Handles the value of Year
    private handleYearOverall(sectionsAttribute: any, accessKey: string, section: any): any {
        // if the "Section" property is "overall", year is 1900
        if (accessKey === "Year" && section["Section"] === "overall") {
            return 1900;
        } else {
            return sectionsAttribute;
        }
    }
}
