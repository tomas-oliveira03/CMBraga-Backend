import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { Child } from "./Child"
import { ActivitySession } from "./ActivitySession"
import { Station } from "./Station";
import { Parent } from "./Parent";

@Entity()
export class ChildActivitySession {
    @PrimaryColumn({ type: 'varchar' })
    childId!: string;

    @PrimaryColumn({ type: 'varchar' })
    activitySessionId!: string;

    @PrimaryColumn({ type: 'varchar' })
    parentId!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    registeredAt!: Date;

    // Station where the child is picked up to school
	@Column({ type: 'varchar' })
	pickUpStationId!: string;

    @ManyToOne(() => Child)
    child!: Child;

    @ManyToOne(() => ActivitySession)
    activitySession!: ActivitySession;

    @ManyToOne(() => Station)
    pickUpStation!: Station;

    @ManyToOne(() => Parent)
    parent!: Parent;
}
