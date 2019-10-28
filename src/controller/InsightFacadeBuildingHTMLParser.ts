import * as http from "http";

export default class InsightFacadeBuildingHTMLParser {

    constructor() {
        //
    }

    public getTableFromViewContentDiv(div: any) {
        for (let e of div.childNodes) {
            if (e.nodeName === "table" && this.hasAttrField(e.attrs, "class", "views-table cols-5 table")) {
                return e;
            }
        }
    }

    public extractBuildingsData(tbody: any): any[] {
        let buildingsData: any[] = [];
        for (let e of tbody.childNodes) {
            if (e.nodeName === "tr") {
                let buildingData = this.extractBuildingData(e);
                buildingsData.push(buildingData);
            }
        }
        return buildingsData;
    }

    public extractBuildingData(tr: any): object {
        let buildingData: {shortname: string, fullname: string, address: string} = {shortname: null,
            fullname: null, address: null};
        for (let e of tr.childNodes) {
            if (e.nodeName === "td") {
                if (this.hasAttrField(e.attrs, "class", "views-field views-field-field-building-code")) {
                    buildingData.shortname = this.extractInnerData(e);
                }
                if (this.hasAttrField(e.attrs, "class", "views-field views-field-title")) {
                    buildingData.fullname = this.extractInnerData(e);
                }
                if (this.hasAttrField(e.attrs, "class", "views-field views-field-field-building-address")) {
                    buildingData.address = this.extractInnerData(e);
                }
            }
        }
        return buildingData;
    }

    public extractRoomsData(tbody: any, span: any): any[] {
        let roomsData: any[] = [];
        for (let e of tbody.childNodes) {
            if (e.nodeName === "tr") {
                let roomData = this.extractRoomData(e, span);
                roomsData.push(roomData);
            }
        }
        return roomsData;
    }

    private extractRoomData(tr: any, topData: any): object {
        let roomData: {fullname: string, shortname: string, number: string, name: string, address: string, lat: number,
            lon:  number, seats: number, type: string, furniture: string, href: string, id: number} = {fullname: null,
            shortname: null, number: null, name: null, address: null, lat: null, lon: null, seats: null, type: null,
            furniture: null, href: null, id: null};
        for (let e of tr.childNodes) {
            if (e.nodeName === "td") {
                if (this.hasAttrField(e.attrs, "class", "views-field views-field-field-room-number")) {
                    roomData.number = this.extractInnerData(e);
                } else if (this.hasAttrField(e.attrs, "class", "views-field views-field-field-room-capacity")) {
                    roomData.seats = Number(this.extractInnerData(e));
                } else if (this.hasAttrField(e.attrs, "class", "views-field views-field-field-room-furniture")) {
                    roomData.furniture = this.extractInnerData(e);
                } else if (this.hasAttrField(e.attrs, "class", "views-field views-field-field-room-type")) {
                    roomData.type = this.extractInnerData(e);
                }
                roomData.fullname = this.extractInnerData(topData);
            }
        }
        return roomData;
    }

    private extractInnerData(td: any): string {
        let childNodes = td.childNodes;
        let result: string = null;
        for (let e of childNodes) {
            if (e.nodeName === "#text" && e.value.trim().length !== 0) {
                return e.value.trim();
            }
            if (e.childNodes) {
                return this.extractInnerData(e);
            }
        }
        return result;
    }

    public getTableFromBody(body: any, topData: boolean) {
        for (let e of body.childNodes) {
            if (e.nodeName === "div" && e.attrs[0] &&
                e.attrs[0].value === "full-width-container") {
                for (let e1 of e.childNodes) {
                    if (e1.nodeName === "div" && this.hasAttrField(e1.attrs, "id", "main")) {
                        return this.getTableFromMainDiv(e1, topData);
                    }
                }
            }
        }
    }

    private getTableFromMainDiv(maindiv: any, topData: boolean) {
        for (let e of maindiv.childNodes) {
            if (e.nodeName === "div" && this.hasAttrField(e.attrs, "id", "content")) {
                for (let e1 of e.childNodes) {
                    if (e1.nodeName === "section") {
                        return this.getTableFromSection(e1, topData);
                    }
                }
            }
        }
    }

    private getTableFromSection(section: any, topData: boolean) {
        for (let e of section.childNodes) {
            // For buildings
            if (e.nodeName === "div" && this.hasAttrField(e.attrs, "class",
                "view view-buildings-and-classrooms " + "view-id-buildings_and_classrooms " +
                "view-display-id-page container ")) {
                for (let e1 of e.childNodes) {
                    if (e1.nodeName === "div" && this.hasAttrField(e1.attrs, "class", "view-content")) {
                        return this.getTableFromViewContentDiv(e1);
                    }
                }
            } else if (e.nodeName === "div" && this.hasAttrField(e.attrs, "class", "view view-buildi" +
                "ngs-and-classrooms view-id-buildings_and_classrooms " + "view-display-id-page_1 container")) {
                return this.getTableFromDivs(e, topData); // For rooms
            }
        }
    }

    private getTableFromDivs(e: any, topData: boolean) {
        for (let e1 of e.childNodes) {
            if (e1.nodeName === "div" && this.hasAttrField(e1.attrs, "class", "view-footer")) {
                for (let e2 of e1.childNodes) {
                    if (e2.nodeName === "div" && this.hasAttrField(e2.attrs, "class",
                        "view view-buildings-and-classrooms " + "view-id-buildings_and_classrooms " +
                        "view-display-id-block_1 container ")) {
                        return this.getTableFromInnerDivs(e2);
                    }
                }
            }
            if (topData === true && e1.nodeName === "div" &&
                                            this.hasAttrField(e1.attrs, "class", "view-content")) {
                for (let e2 of e1.childNodes) {
                    if (e2.nodeName === "div" && this.hasAttrField(e2.attrs, "class",
                        "views-row views-row-1 views-row-odd views-row-first views-row-last")) {
                        return this.getTableFromInnerDivs(e2);
                    }
                }
            }
        }
    }

    private getTableFromInnerDivs(e2: any): any {
        for (let e3 of e2.childNodes) {
            if (e3.nodeName === "div" && this.hasAttrField(e3.attrs, "class", "view-content")) {
                return this.getTableFromViewContentDiv(e3);
            } else if (e3.nodeName === "div" && this.hasAttrField(e3.attrs, "id", "buildings-wrapper")) {
                for (let e4 of e3.childNodes) {
                    if (e4.nodeName === "div" && this.hasAttrField(e4.attrs, "id", "building-info")) {
                        return this.getRoomTopData(e4);
                    }
                }
            }
        }
    }

    private getRoomTopData(div: any) {
        let temp: any[] = [];
        for (let e of div.childNodes) {
            if (e.nodeName === "div" && this.hasAttrField(e.attrs, "class", "building-field")) {
                for (let e1 of e.childNodes[0].childNodes) {
                    if (e1.value !== undefined) {
                        return e1.parentNode;
                    }
                }
            } else if (e.nodeName === "h2") { // for building name
                for (let e1 of e.childNodes[0].childNodes) {
                    if (e1.value !== undefined) {
                        return e1.parentNode;
                    }
                }
            }
        }
    }

    private hasAttrField(attrs: Array<{ name: string, value: string }>, attrField: string, attrValue: string) {
        for (let attr of attrs) {
            if (attr.name === attrField && attr.value.includes(attrValue)) {
                return true;
            }
        }
    }
}
