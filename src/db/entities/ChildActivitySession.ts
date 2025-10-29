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

    @Column({ type: 'varchar' })
    parentId!: string;

    @Column({ type: 'boolean' })
    isLateRegistration!: boolean;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    registeredAt!: Date;

    // Station where the child is picked up to school
	@Column({ type: 'varchar' })
	pickUpStationId!: string;

    @Column({ type: 'varchar' })
	dropOffStationId!: string;

    @ManyToOne(() => Child)
    child!: Child;

    @ManyToOne(() => ActivitySession)
    activitySession!: ActivitySession;

    @ManyToOne(() => Station)
    pickUpStation!: Station;

    @ManyToOne(() => Station)
    dropOffStation!: Station;

    @ManyToOne(() => Parent)
    parent!: Parent;
}