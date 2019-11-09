import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";

export default class Scheduler implements IScheduler {

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        // TODO: Handle if room has already been assigned
        // TODO: Optimize this
        let timetable: Array<[SchedRoom, SchedSection, TimeSlot]> = new Array<[SchedRoom, SchedSection, TimeSlot]>();
        for (let section of sections) {
            let sectionSeats = section["courses_pass"] + section["courses_fail"] + section["courses_audit"];
            for (let room of rooms) {
                if (sectionSeats <= room["rooms_seats"]) {
                    timetable.push([room, section, "MWF 0800-0900"]);
                    break; // if section has been assigned, we are done with finding a room for it
                }
            }
        }
        return timetable;
    }
}
