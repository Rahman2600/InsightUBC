export default class InsightFacadeGetBuildingData {
    private indexHtm: any;
    private roomsHtm: any;

    constructor(indexHtm: any, roomsHtm: any) {
        this.indexHtm = indexHtm;
        this.roomsHtm = roomsHtm;
    }

    public getData(): JSON[] {
        let buildingData: any = this.getBuildingData();
        let roomsData: any = this.getRoomsData();
        // eslint-disable-next-line no-console
        console.log(buildingData);
        // eslint-disable-next-line no-console
        console.log(roomsData);
        return roomsData;
    }

    private getBuildingData() {
        let table = null;
        for (let e of this.indexHtm.childNodes) {
            if (e.nodeName === "html") {
                for (let e1 of e.childNodes) {
                    if (e1.nodeName === "body") {
                        table = this.getTableFromBody(e1);
                    }
                }
            }
        }
        let buildings: any[] = [];
        if (table != null) {
            for (let e of table.childNodes) {
                if (e.nodeName === "tbody") {
                    buildings = this.extractBuildingsData(e);
                }
            }
        }
        return buildings;
    }

    private  getRoomsData() {
        let table: any[] = [];
        for (let member of this.roomsHtm) {
            for (let e of member.childNodes) {
                if (e.nodeName === "html") {
                    for (let e1 of e.childNodes) {
                        // eslint-disable-next-line max-depth
                        if (e1.nodeName === "body") {
                            table.push(this.getTableFromBody(e1));
                        }
                    }
                }
            }
        }
        let rooms: any[] = [];
        for (let member of table) {
            if (member != null) {
                for (let e of member.childNodes) {
                    if (e.nodeName === "tbody") {
                        rooms.push(this.extractRoomsData(e));
                    }
                }
            }
        }
        return rooms;
    }

    private extractBuildingsData(tbody: any): any[] {
        let buildingsData: any[] = [];
        for (let e of tbody.childNodes) {
            if (e.nodeName === "tr") {
                let buildingData = this.extractBuildingData(e);
                buildingsData.push(buildingData);
            }
        }
        return buildingsData;
    }

    private extractBuildingData(tr: any): object {
        let buildingData: {code: string, building: string, address: string} = {code: null,
                                                                                        building: null, address: null};
        for (let e of tr.childNodes) {
            if (e.nodeName === "td") {
                if (this.hasAttrField(e.attrs, "class",
                    "views-field views-field-field-building-code")) {
                    buildingData.code = this.extractInnerData(e);
                }
                if (this.hasAttrField(e.attrs, "class",
                    "views-field views-field-title")) {
                    buildingData.building = this.extractInnerData(e);
                }
                if (this.hasAttrField(e.attrs, "class",
                    "views-field views-field-field-building-address")) {
                    buildingData.address = this.extractInnerData(e);
                }
            }
        }
        return buildingData;
    }

    private extractRoomsData(tbody: any): any[] {
        let roomsData: any[] = [];
        for (let e of tbody.childNodes) {
            if (e.nodeName === "tr") {
                let roomData = this.extractRoomData(e);
                roomsData.push(roomData);
            }
        }
        return roomsData;
    }

    private extractRoomData(tr: any): object {
        let roomData: {room: string, capacity: string, furnitureType: string, roomType: string} = {room: null,
            capacity: null, furnitureType: null, roomType: null};
        for (let e of tr.childNodes) {
            if (e.nodeName === "td") {
                if (this.hasAttrField(e.attrs, "class",
                    "views-field views-field-field-room-number")) {
                    roomData.room = this.extractInnerData(e);
                }
                if (this.hasAttrField(e.attrs, "class",
                    "views-field views-field-field-room-capacity")) {
                    roomData.capacity = this.extractInnerData(e);
                }
                if (this.hasAttrField(e.attrs, "class",
                    "views-field views-field-field-room-furniture")) {
                    roomData.furnitureType = this.extractInnerData(e);
                }
                if (this.hasAttrField(e.attrs, "class",
                    "views-field views-field-field-room-type")) {
                    roomData.roomType = this.extractInnerData(e);
                }
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

    private getTableFromBody(body: any) {
        for (let e of body.childNodes) {
            if (e.nodeName === "div" && e.attrs[0] &&
                e.attrs[0].value === "full-width-container") {
                for (let e1 of e.childNodes) {
                    if (e1.nodeName === "div" && this.hasAttrField(e1.attrs, "id", "main")) {
                        return this.getTableFromMainDiv(e1);
                    }
                }
            }
        }
    }

    private getTableFromMainDiv(maindiv: any) {
        for (let e of maindiv.childNodes) {
            if (e.nodeName === "div" && this.hasAttrField(e.attrs, "id", "content")) {
                for (let e1 of e.childNodes) {
                    if (e1.nodeName === "section") {
                        return this.getTableFromSection(e1);
                    }
                }
            }
        }
    }

    private getTableFromSection(section: any) {
        for (let e of section.childNodes) {
            // For buildings
            if (e.nodeName === "div" && this.hasAttrField(e.attrs, "class",
                "view view-buildings-and-classrooms " +
                "view-id-buildings_and_classrooms " +
                "view-display-id-page container ")) {
                for (let e1 of e.childNodes) {
                    if (e1.nodeName === "div" && this.hasAttrField(e1.attrs, "class", "view-content")) {
                        return this.getTableFromViewContentDiv(e1);
                    }
                }
            } else if (e.nodeName === "div") { // For rooms
                return this.getInnerDivs(e);
            }
        }
    }

    private getInnerDivs(e: any) {
        for (let e1 of e.childNodes) {
            if (e1.nodeName === "div") {
                for (let e2 of e1.childNodes) {
                    if (e2.nodeName === "div" && this.hasAttrField(e2.attrs, "class",
                        "view view-buildings-and-classrooms " +
                        "view-id-buildings_and_classrooms " +
                        "view-display-id-block_1 container ")) {
                        return this.getInnerInnerDivs(e2);
                    }
                }
            }
        }
    }

    private getInnerInnerDivs(e2: any) {
        for (let e3 of e2.childNodes) {
            if (e3.nodeName === "div" && this.hasAttrField(e3.attrs, "class", "view-content")) {
                return this.getTableFromViewContentDiv(e3);
            }
        }
    }

    private getTableFromViewContentDiv(div: any) {
        for (let e of div.childNodes) {
            if (e.nodeName === "table" && this.hasAttrField(e.attrs, "class", "views-table cols-5 table")) {
                return e;
            }
        }
    }

    private getAttrField(attrs: Array<{ name: string, value: string }>, attrField: string): string {
        for (let attr of attrs) {
            if (attr.name === attrField) {
                return attr.value;
            }
        }
        return null;
    }

    private hasAttrField(attrs: Array<{ name: string, value: string }>, attrField: string, attrValue: string) {
        for (let attr of attrs) {
            if (attr.name === attrField && attr.value.includes(attrValue)) {
                return true;
            }
        }
    }
}
