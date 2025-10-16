import { Column, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"
import { Instructor } from "./Instructor";
import { ActivitySession } from "./ActivitySession";

@Entity()
export class Issue {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column({ type: 'varchar', array: true, default: [] })
    imageURLs!: string[];

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	createdAt!: Date;

	@Column({ type: 'timestamptz', nullable: true })
	updatedAt!: Date | null;

    @Column({ type: 'timestamptz', nullable: true })
    resolvedAt!: Date | null;

    @Column({ type: 'varchar' })
    instructorId!: string;

    @Column({ type: 'varchar' })
    activitySessionId!: string;

    @ManyToOne(() => Instructor)
    instructor!: Instructor;

    @ManyToOne(() => ActivitySession)
    activitySession!: ActivitySession;
}
