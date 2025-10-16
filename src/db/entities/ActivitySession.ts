import {
    BeforeInsert,
    BeforeUpdate,
    Check,
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from "typeorm";
import { ChildActivitySession } from "./ChildActivitySession";
import { InstructorActivitySession } from "./InstructorActivitySession";
import { StationActivitySession } from "./StationActivitySession";
import { ParentActivitySession } from "./ParentActivitySession";
import { Issue } from "./Issue";
import { ChildStation } from "./ChildStation";
import { ActivityMode, ActivityType, WeatherType } from "@/helpers/types";
import { Instructor } from "./Instructor";
import { ChildActivityRecord } from "./ChildActivityRecord";
import { Feedback } from "./Feedback";
import { Route } from "./Route";

@Entity()
@Check(`"type" IN ('pedibus', 'ciclo_expresso')`)
@Check(`"mode" IN ('walk', 'bike')`)
@Check(`"weather_type" IN ('thunderstorm', 'drizzle', 'rain', 'snow', 'atmosphere', 'clear', 'clouds')`)
export class ActivitySession {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar" })
    type!: ActivityType;

    @Column({ type: "varchar" })
    mode!: ActivityMode;

    @Column({ type: "boolean", default: false })
    inLateRegistration!: boolean;

    @Column({ type: "varchar" })
    routeId!: string;

    @Column({ type: "int", nullable: true })
    weatherTemperature!: number | null;

    @Column({ type: "varchar", nullable: true })
    weatherType!: WeatherType | null;

    @Column({ type: "timestamptz" })
    scheduledAt!: Date;

    @Column({ type: "varchar", nullable: true })
    startedById!: string | null;

    @Column({ type: "timestamptz", nullable: true })
    startedAt!: Date | null;

    @Column({ type: "varchar", nullable: true })
    finishedById!: string | null;

    @Column({ type: "timestamptz", nullable: true })
    finishedAt!: Date | null;

    @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @Column({ type: "timestamptz", nullable: true })
    updatedAt!: Date | null;

    // Relationships
    @OneToMany(() => ChildActivitySession, (cas) => cas.activitySession)
    childActivitySessions!: ChildActivitySession[];

    @OneToMany(() => InstructorActivitySession, (ias) => ias.activitySession)
    instructorActivitySessions!: InstructorActivitySession[];

    @OneToMany(() => ParentActivitySession, (pas) => pas.activitySession)
    parentActivitySessions!: ParentActivitySession[];

    @OneToMany(() => StationActivitySession, (sas) => sas.activitySession)
    stationActivitySessions!: StationActivitySession[];

    @OneToMany(() => Issue, (issue) => issue.activitySession)
    issues!: Issue[];

    @OneToMany(() => ChildStation, (childStation) => childStation.activitySession)
    childStations!: ChildStation[];

    @OneToMany(() => ChildActivityRecord, childActivityRecord => childActivityRecord.child)
    childActivityRecords!: ChildActivitySession[];

    @OneToMany(() => Feedback, (feedback) => feedback.activitySession)
    feedbacks!: Feedback[];

    @ManyToOne(() => Instructor, { nullable: true })
    startedBy!: Instructor | null;

    @ManyToOne(() => Instructor, { nullable: true })
    finishedBy!: Instructor | null;

    @ManyToOne(() => Route)
    route!: Route;
}
