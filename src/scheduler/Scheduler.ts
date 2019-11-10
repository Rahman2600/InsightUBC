import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";

export default class Scheduler implements IScheduler {
    private timetable: Array<[SchedRoom, SchedSection, TimeSlot]> = new Array<[SchedRoom, SchedSection, TimeSlot]>();
    private timeslots: TimeSlot[] =  ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100", "MWF 1100-1200",
        "MWF 1200-1300", "MWF 1300-1400", "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700", "TR  0800-0930",
        "TR  0930-1100", "TR  1100-1230", "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        // TODO: Handle if room has already been assigned
        // TODO: Optimize this
        for (let section of sections) {
            let sectionSeats = section["courses_pass"] + section["courses_fail"] + section["courses_audit"];
            for (let room of rooms) {
                let assigned = false;
                for (let timeslot of this.timeslots) {
                    if (sectionSeats <= room["rooms_seats"] &&
                                                    !this.timetableContainsRoomAndTime(room, timeslot)) {
                        this.timetable.push([room, section, timeslot]);
                        assigned = true;
                        break; // if section has been assigned, we are done with finding a room for it
                    }
                }
                if (assigned === true) {
                    break;
                }
            }
        }
        return this.timetable;
    }

    private timetableContainsRoomAndTime(room: SchedRoom, timeslot: TimeSlot): boolean {
        for (let member of this.timetable) {
            if (member[0] === room && member[2] === timeslot) {
                return true;
            }
        }
        return false;
    }
}
