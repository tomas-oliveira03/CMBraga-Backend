import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { Instructor } from "./Instructor";
import { ActivitySession } from "./ActivitySession";

@Entity()
export class Issue {
    @PrimaryColumn({ type: 'varchar' })
    id!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column({ type: 'varchar', array: true, default: [] })
    images!: string[];

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	createdAt!: Date;

	@Column({ type: 'timestamptz', nullable: true })
	updatedAt!: Date | null;

    @ManyToOne(() => Instructor)
    instructor!: Instructor;

    @ManyToOne(() => ActivitySession)
    activitySession!: ActivitySession;
}
