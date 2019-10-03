import {InsightDataset} from "./IInsightFacade";

export default class InsightFacadeFindQueryResults  {
    private datasets: { [id: string]: Array<InsightDataset | JSON[]> } = {};
    constructor(ourDataset: { [id: string]: Array<InsightDataset | JSON[]> }) {
        this.datasets = ourDataset;
    }
    public findQueryResults(where: any): any[] {
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

    private findCommon(list: any[][]): any[] {
        let elementFrequency: number[] = [];
        let result: any[] = [];
        for (let member of list) {
            for (let subMember of member) {
                if (elementFrequency[subMember]) {
                    elementFrequency[subMember]++; // increment frequency of element in arrays
                } else {
                    elementFrequency[subMember] = 1;
                }
                // if frequency is same as number of sub arrays
                if (elementFrequency[subMember] === list.length) {
                    result.push(subMember);
                }
            }
        }
        return result;
    }

    // Handles the "LT" part of a query, returns all section fitting the criteria
    private findLessThan(where: any): any[] {
        let result: any[] = [];
        let list2 = Object.values(Object.values(this.datasets)[0][1]);
        for (let index1 of list2) {
            let innerList = Object.values(index1);
            for (let index2 of innerList) { // iterate over courses
                let course = Object.values(index2);
                if (course.length !== 0) {
                    for (let section of course) { // iterate over sections
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
        for (let index1 of list2) {
            let innerList = Object.values(index1);
            for (let index2 of innerList) { // iterate over courses
                let course = Object.values(index2);
                if (course.length !== 0) {
                    for (let section of course) { // iterate over sections
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
        for (let index1 of list2) {
            let innerList = Object.values(index1);
            for (let index2 of innerList) { // iterate over courses
                let course = Object.values(index2);
                if (course.length !== 0) {
                    for (let section of course) { // iterate over sections
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
        for (let index1 of list2) {
            let innerList = Object.values(index1);
            for (let index2 of innerList) { // iterate over courses
                let course = Object.values(index2);
                if (course.length !== 0) {
                    for (let section of course) { // iterate over sections
                        let accessKey = this.processString(Object.keys(where)[0]);
                        let sectionsAttribute: string = section[accessKey];
                        if (sectionsAttribute === Object.values(where)[0]) { // equivalent string
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
        for (let index1 of list2) {
            let innerList = Object.values(index1);
            for (let index2 of innerList) { // iterate over courses
                let course = Object.values(index2);
                if (course.length !== 0) {
                    for (let section of course) { // iterate over sections
                        let accessKey = this.processString(Object.keys(where)[0]);
                        let sectionsAttribute = section[accessKey];
                        if (sectionsAttribute > Object.values(where)[0]) { // not
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
}
