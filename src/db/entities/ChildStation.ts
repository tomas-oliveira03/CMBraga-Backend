import { Check, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { Child } from "./Child"
import { Station } from "./Station"
import { Instructor } from "./Instructor"
import { ActivitySession } from "./ActivitySession"
import { ChildStationType } from "@/helpers/types"

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
    type!: ChildStationType;

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
