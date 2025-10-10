import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { Parent } from "./Parent"
import { ActivitySession } from "./ActivitySession"

@Entity()
export class ParentActivitySession {
    @PrimaryColumn({ type: 'varchar' })
    parentId!: string;

    @PrimaryColumn({ type: 'varchar' })
    activitySessionId!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    assignedAt!: Date;

    @ManyToOne(() => Parent)
    parent!: Parent;

    @ManyToOne(() => ActivitySession)
    activitySession!: ActivitySession;
}
