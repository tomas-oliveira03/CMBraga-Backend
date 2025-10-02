import { Check, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { Child } from "./Child"
import { Station } from "./Station"
import { Instructor } from "./Instructor"
import { ActivitySession } from "./ActivitySession"

export enum Gender {
	IN = 'in',  // Child checked in at the station
	OUT = 'out' // Child checked out at the school
}

@Entity()
@Check(`"type" IN ('in', 'out')`)
export class ChildStation {
    @PrimaryColumn({ type: 'varchar' })
    childId!: string;

    @PrimaryColumn({ type: 'varchar' })
    stationId!: string;

    @Column({ type: 'varchar' })
    instructorId!: string;

    @Column({ type: 'varchar' })
    activitySessionId!: string;

    @Column({ type: 'varchar' })
    type!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    registeredAt!: Date;

    @ManyToOne(() => Child)
    child!: Child;

    @ManyToOne(() => Station)
    station!: Station;

    @ManyToOne(() => Instructor)
    instructor!: Instructor;

    @ManyToOne(() => ActivitySession)
    activitySession!: ActivitySession;
}
