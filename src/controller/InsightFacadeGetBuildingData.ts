import * as http from "http";
import {InsightError} from "./IInsightFacade";
import InsightFacadeGetBuildingDataHelper from "./InsightFacadeGetBuildingDataHelper";

export default class InsightFacadeGetBuildingData {
    private indexHtm: any;
    private roomsHtm: any;
    private roomTopData: any[][];
    private insightFacadeGetBuildingDataHelper: InsightFacadeGetBuildingDataHelper;

    constructor(indexHtm: any, roomsHtm: any) {
        this.indexHtm = indexHtm;
        this.roomsHtm = roomsHtm;
        this.roomTopData = [];
        this.insightFacadeGetBuildingDataHelper = new InsightFacadeGetBuildingDataHelper();
    }

    public getData(): JSON[] {
        let buildingData: any = this.getBuildingData();
        let roomsData: any = this.getRoomsData();
        let finalData: any[] = this.mergeData(roomsData, buildingData);
        return finalData;
    }

    private getBuildingData() {
        let table = null;
        for (let e of this.indexHtm.childNodes) {
            if (e.nodeName === "html") {
                for (let e1 of e.childNodes) {
                    if (e1.nodeName === "body") {
                        table = this.insightFacadeGetBuildingDataHelper.getTableFromBody(e1);
                    }
                }
            }
        }
        let buildings: any[] = [];
        if (table != null) {
            for (let e of table.childNodes) {
                if (e.nodeName === "tbody") {
                    buildings = this.insightFacadeGetBuildingDataHelper.extractBuildingsData(e);
                }
            }
        }
        return buildings;
    }

    private getRoomsData() {
        let table: any[] = [];
        for (let member of this.roomsHtm) {
            table.push(this.getRoomsDataHelper(member));
        }
        let rooms: any[] = [];
        for (let member of table) {
            if (member != null) {
                for (let e of member.childNodes) {
                    if (e.nodeName === "tbody") {
                        rooms.push(this.insightFacadeGetBuildingDataHelper.extractRoomsData(e));
                    }
                }
            }
        }
        this.roomTopData = this.insightFacadeGetBuildingDataHelper.getRoomTopData();
        this.assignRoomAddress(rooms);
        return rooms;
    }

    private getRoomsDataHelper(member: any) {
        for (let e of member.childNodes) {
            if (e.nodeName === "html") {
                for (let e1 of e.childNodes) {
                    if (e1.nodeName === "body") {
                        return (this.insightFacadeGetBuildingDataHelper.getTableFromBody(e1));
                    }
                }
            }
        }
    }

    private mergeData(roomsData: any, buildingData: any): any[] {
        let finalData: { result: {}, rank: 0 };
        let finalDataObject: any[] = [];
        let idCounter = 0;
        for (let rooms of roomsData) {
            let tempRooms: any[] = [];
            for (let room of rooms) {
                for (let building of buildingData) {
                    if (building["address"] === room.address && !tempRooms.includes(room)) {
                        room.id = idCounter;
                        idCounter++;
                        room.fullname = building["fullname"];
                        room.shortname = building["shortname"];
                        room.name = room.shortname + "_" + room.number;
                        room.href = "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/" +
                                room.shortname + "-" + room.number;
                        this.getGeolocation(room.address.toString().replace(" ", "%20")).then((geolocation: any) => {
                            room.lat = geolocation["lat"];
                            room.lon = geolocation["lon"];
                        });
                        tempRooms.push(room);
                    }
                }
            }
            finalData = {result: tempRooms, rank: 0};
            finalDataObject.push(finalData); // to keep data structure equal with courses
        }
        return finalDataObject;
    }

    private getGeolocation(address: string): Promise<any> {
        let geolocation: { lat: number, lon: number } = {lat: null, lon: null};
        let link = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team113/" + address;
        let promise: Promise<any> = new Promise((resolve: any, reject: any) => {
            http.get(link, (res) => {
                let rawData = "";
                res.setEncoding("utf8");
                res.on("data", (chunk) => {
                    rawData += chunk;
                });
                res.on("end", () => {
                    geolocation = JSON.parse(rawData);
                    return resolve(geolocation);
                });
            }).on("error", (e) => {
                return reject(geolocation);
            });
        });
        return promise.then((result): any => {
            return result;
        }).catch((): any => {
            return new InsightError("Problems in getting geolocation");
        });
    }

    private assignRoomAddress(building: any[]) {
        let index: number = 0;
        for (let rooms of building) {
            for (let room of rooms) {
                room.address = this.roomTopData[index][0]; // for addresses
            }
            index++;
        }
    }
}
