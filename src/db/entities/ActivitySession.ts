import { Check, Column, Entity, OneToMany, PrimaryColumn } from "typeorm"
import { ChildActivitySession } from "./ChildActivitySession"
import { InstructorActivitySession } from "./InstructorActivitySession"
import { StationActivitySession } from "./StationActivitySession"
import { Issue } from "./Issue";
import { ChildStation } from "./ChildStation"

export enum ActivityType {
	PEDIBUS = 'pedibus',
	CICLO_EXPRESSO = 'ciclo_expresso'
}

@Entity()
@Check(`"type" IN ('pedibus', 'ciclo_expresso')`)
export class ActivitySession {
    @PrimaryColumn({ type: 'varchar' })
    id!: string;

    @Column({ type: 'varchar' })
    type!: ActivityType

    @Column({ type: 'timestamptz' })
    scheduledAt!: Date;

    @Column({ type: 'timestamptz' })
    startedAt!: Date;

    @Column({ type: 'timestamptz', nullable: true })
    finishedAt!: Date;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

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
