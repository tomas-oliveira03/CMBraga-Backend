import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { Instructor } from "./Instructor"
import { ActivitySession } from "./ActivitySession"

@Entity()
export class InstructorActivitySession {
    @PrimaryColumn({ type: 'varchar' })
    instructorId!: string;

    @PrimaryColumn({ type: 'varchar' })
    activitySessionId!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    assignedAt!: Date;

    @ManyToOne(() => Instructor)
    instructor!: Instructor;

    @ManyToOne(() => ActivitySession)
    activitySession!: ActivitySession;
}
