import { Check, Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"
import { ChildActivitySession } from "./ChildActivitySession"
import { InstructorActivitySession } from "./InstructorActivitySession"
import { StationActivitySession } from "./StationActivitySession"
import { Issue } from "./Issue";
import { ChildStation } from "./ChildStation"
import { ActivityType } from "@/helpers/types";

@Entity()
@Check(`"type" IN ('pedibus', 'ciclo_expresso')`)
export class ActivitySession {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'varchar' })
    type!: ActivityType

    @Column({ type: 'timestamptz' })
    scheduledAt!: Date;

    @Column({ type: 'timestamptz', nullable: true })
    startedAt!: Date | null;

    @Column({ type: 'timestamptz', nullable: true })
    finishedAt!: Date | null;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamptz', nullable: true })
	updatedAt!: Date | null;

    @OneToMany(() => ChildActivitySession, childActivitySession => childActivitySession.activitySession)
    childActivitySessions!: ChildActivitySession[];

    @OneToMany(() => InstructorActivitySession, instructorActivitySession => instructorActivitySession.activitySession)
    instructorActivitySessions!: InstructorActivitySession[];

    @OneToMany(() => StationActivitySession, stationActivitySession => stationActivitySession.activitySession)
    stationActivitySessions!: StationActivitySession[];

    @OneToMany(() => Issue, (issue) => issue.instructor)
    issues!: Issue[];

    @OneToMany(() => ChildStation, childStation => childStation.activitySession)
    childStations!: ChildStation[];
}
