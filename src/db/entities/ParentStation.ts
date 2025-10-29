import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { ActivitySession } from "./ActivitySession";
import { Instructor } from "./Instructor";
import { Station } from "./Station";
import { Parent } from "./Parent";

@Entity()
export class ParentStation {
    @PrimaryColumn({ type: 'varchar' })
    parentId!: string;

    @PrimaryColumn({ type: 'varchar' })
    activitySessionId!: string;
    
    @Column({ type: 'varchar' })
    instructorId!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    registeredAt!: Date;

    @ManyToOne(() => Parent)
    parent!: Parent;

    @ManyToOne(() => Instructor)
    instructor!: Instructor;

    @ManyToOne(() => ActivitySession)
    activitySession!: ActivitySession;
}
