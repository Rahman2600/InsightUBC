import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import {InsightDataset} from "../controller/IInsightFacade";

export default class Scheduler implements IScheduler {
    private timetable: Array<[SchedRoom, SchedSection, TimeSlot]> = new Array<[SchedRoom, SchedSection, TimeSlot]>();
    private timeslots: TimeSlot[] =  ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100", "MWF 1100-1200",
        "MWF 1200-1300", "MWF 1300-1400", "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700", "TR  0800-0930",
        "TR  0930-1100", "TR  1100-1230", "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        for (let section of sections) {
            this.selectRoomAndTime(section, rooms);
        }
        return this.timetable;
    }

    private selectRoomAndTime(section: SchedSection, rooms: SchedRoom[]) {
        // TODO: Optimize this
        let sectionSeats = section["courses_pass"] + section["courses_fail"] + section["courses_audit"];
        let distanceRoom: { [distance: number]: SchedRoom } = {};
        // find eligible rooms and their distances
        for (let room of rooms) {
            if (sectionSeats <= room["rooms_seats"]) {
                distanceRoom[this.calculateDistance(room)] = room;
            }
        }
        // sort distanceRoom by key so that we try to assign closest rooms first
        let orderedDistanceRoom: { [distance: number]: SchedRoom } = sortDistanceRoom();
        // add a room (in order of distance) if a valid timeslot is available
        for (let room of Object.values(orderedDistanceRoom)) {
            let assigned = false;
            for (let timeslot of this.timeslots) {
                if (!this.timetableContainsRoomAndTime(room, timeslot)) {
                    this.timetable.push([room, section, timeslot]);
                    assigned = true;
                    break; // if section has been assigned, we are done with finding a room for it
                }
            }
            if (assigned) {
                break;
            }
        }

        function sortDistanceRoom() {
            let result: any = {};
            Object.keys(distanceRoom).sort((member1, member2) => {
                if (Number(member1) > Number(member2)) {
                    return 1;
                } else if (Number(member1) < Number(member2)) {
                    return -1;
                } else {
                    return 0;
                }
            }).forEach(function (key: any) {
                result[key] = distanceRoom[key];
            });
            return result;
        }
    }

    private timetableContainsRoomAndTime(room: SchedRoom, timeslot: TimeSlot): boolean {
        for (let member of this.timetable) {
            if (member[0] === room && member[2] === timeslot) {
                return true;
            }
        }
        return false;
    }

    private calculateDistance(room: SchedRoom) {
        /* Credit to https://www.movable-type.co.uk/scripts/latlong.html for a way to use the haversine formula
        /* for calculating distance using latitudes and longitudes */
        let distance = 0;
        let roomLat = room["rooms_lat"];
        let roomLon = room["rooms_lon"];
        for (let member of this.timetable) {
            let selectedBuilding = member[0];
            let selectedBuildingLat = selectedBuilding["rooms_lat"];
            let selectedBuildingLon = selectedBuilding["rooms_lon"];
            let r = 6371e3; // metres
            let x1 = toRadians(roomLat);
            let x2 = toRadians(selectedBuildingLat);
            let deltaX = toRadians(selectedBuildingLat - roomLat);
            let deltaY = toRadians(selectedBuildingLon - roomLon);
            let a = Math.sin(deltaX / 2) * Math.sin(deltaX / 2) +
                    Math.cos(x1) * Math.cos(x2) * Math.sin(deltaY / 2) * Math.sin(deltaY / 2);
            let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            distance += r * c;
        }
        return distance;

        function toRadians(num: number): number {
            return num * Math.PI / 180;
        }
    }
}
