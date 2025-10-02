import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { Child } from "./Child"
import { ActivitySession } from "./ActivitySession"

@Entity()
export class ChildActivitySession {
    @PrimaryColumn({ type: 'varchar' })
    childId!: string;

    @PrimaryColumn({ type: 'varchar' })
    activitySessionId!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    registeredAt!: Date;

    @ManyToOne(() => Child)
    child!: Child;

    @ManyToOne(() => ActivitySession)
    activitySession!: ActivitySession;
}
